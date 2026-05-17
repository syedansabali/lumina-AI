import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import cors from 'cors';
import { createRequire } from 'module';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import Tesseract from 'tesseract.js';
import admin from 'firebase-admin';
import { adminDb, firestore, app } from './src/lib/firebase-admin';
import { geminiServerService } from './src/services/gemini-server';

console.log('--- SERVER INITIALIZING ---');

// Configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
// Use /tmp for writable storage in Cloud Run
const UPLOAD_DIR = path.join('/tmp', 'uploads');

console.log(`Port Configured: ${PORT}`);
console.log(`Upload Directory: ${UPLOAD_DIR}`);
console.log(`Env Project: ${process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || 'unknown'}`);

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Collections
const DOCUMENTS_COLLECTION = 'documents';
const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';

// Helper for chunking text for RAG
function chunkText(text: string, size = 1000, overlap = 200): { text: string; index: number }[] {
  const chunks: { text: string; index: number }[] = [];
  let startIndex = 0;
  let index = 0;

  while (startIndex < text.length) {
    const chunk = text.substring(startIndex, startIndex + size);
    chunks.push({ text: chunk, index });
    startIndex += (size - overlap);
    index++;
  }
  return chunks;
}

async function startServer() {
  console.log('--- startServer() BEGIN ---');
  const appExpress = express();
  
  // 1. First-priority Logging
  appExpress.use((req, res, next) => {
    console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // Basic Middleware
  appExpress.use(cors()); // Enable CORS to prevent origin-based 403s
  appExpress.use(express.json());
  appExpress.use(express.urlencoded({ extended: true }));

  // 2. Multer Configuration (Memory Storage for robustness in container)
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // Increased to 100MB
  });

  console.log('--- Registering API Routes ---');

  appExpress.get('/api/health', (req, res) => {
    console.log('[DEBUG] Health check hit');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      projectId: app.options.projectId,
      writable: true,
      env: process.env.NODE_ENV || 'development'
    });
  });

  // Simple Ping
  appExpress.get('/api/ping', (req, res) => {
    res.json({ message: 'pong', time: Date.now() });
  });

  // RESTORED upload endpoint as requested by user
  appExpress.post('/api/upload', (req, res, next) => {
    console.log(`[DEBUG] Upload route hit. Method: ${req.method}, Content-Type: ${req.get('Content-Type')}`);
    next();
  }, upload.single('file'), async (req, res) => {
    const jobId = uuidv4();
    const userId = req.body.userId || 'anonymous';
    
    console.log(`[API] Upload request received. JobID: ${jobId}, User: ${userId}`);
    
    try {
      if (!req.file) {
        console.warn(`[Job ${jobId}] No file in request. Body:`, JSON.stringify(req.body));
        return res.status(400).json({ error: 'No file uploaded or invalid payload' });
      }

      console.log(`[Job ${jobId}] File Received: ${req.file.originalname}, Size: ${req.file.size}`);
      
      const job = {
        id: jobId,
        userId,
        status: 'uploading',
        progress: 10,
        message: 'File received, starting extraction...',
        filename: req.file.originalname,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };
      
      // Attempt to save to database
      try {
        await adminDb.collection(DOCUMENTS_COLLECTION).doc(jobId).set(job);
      } catch (dbError: any) {
        console.error(`[Job ${jobId}] DB Write Failed:`, dbError.message);
        console.error(`[Diagnostic] Project: ${app.options.projectId}, Database: ${adminDb.databaseId}, JobID: ${jobId}`);
        // We can still process the PDF even if the initial record failed to save (it might save later during progress updates)
      }

      // Async background processing
      processPdfFromBuffer(jobId, req.file.buffer).catch(e => console.error(`[Job ${jobId}] Background Failure:`, e));

      return res.status(200).json({ jobId });
    } catch (error: any) {
      console.error(`[Job ${jobId}] Server Error:`, error);
      return res.status(500).json({ 
        error: 'Upload processing failed',
        details: error.message
      });
    }
  });

  // Alias for backward compatibility if any cached client uses it
  appExpress.post('/api/action/document-analyze', (req, res) => {
    res.redirect(307, '/api/upload');
  });

  // Progress SSE
  appExpress.get('/api/status/:jobId', (req, res) => {
    const { jobId } = req.params;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const docRef = adminDb.collection(DOCUMENTS_COLLECTION).doc(jobId);
    const unsubscribe = docRef.onSnapshot((doc) => {
      if (!doc.exists) {
        res.write(`data: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
        return;
      }
      res.write(`data: ${JSON.stringify(doc.data())}\n\n`);
    }, (err) => {
      console.error('SSE Snapshot Error:', err);
      res.write(`data: ${JSON.stringify({ error: 'Sync failed' })}\n\n`);
    });

    req.on('close', () => unsubscribe());
  });

  // Get result
  appExpress.get('/api/documents/:jobId', async (req, res) => {
    try {
      const doc = await adminDb.collection(DOCUMENTS_COLLECTION).doc(req.params.jobId).get();
      if (!doc.exists) return res.status(404).json({ error: 'Not found' });
      res.json(doc.data());
    } catch (error) {
      res.status(500).json({ error: 'Fetch failed' });
    }
  });

  // AI Chat Proxy
  appExpress.post('/api/ai/chat', async (req, res) => {
    try {
      const { docText, messages, userMessage } = req.body;
      const response = await geminiServerService.chatWithDocument(docText, messages, userMessage);
      res.json({ response });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  appExpress.post('/api/ai/summarize', async (req, res) => {
    try {
      const { text } = req.body;
      const summary = await geminiServerService.summarizeDocument(text);
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Catch-all
  appExpress.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Not found: ${req.url}` });
  });

  // --- Frontend / Static Handling ---
  if (process.env.NODE_ENV !== 'production') {
    console.log('--- Mounting Vite Middleware (DEV) ---');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    appExpress.use(vite.middlewares);
  } else {
    console.log('--- Mounting Static Middleware (PROD) ---');
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      appExpress.use(express.static(distPath));
      appExpress.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      console.warn('CRITICAL: dist directory missing in production!');
    }
  }

  // Global Error Handler
  appExpress.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('UNHANDLED SERVER ERROR:', err);
    
    // Check for Multer errors
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `File upload error: ${err.message}`, code: err.code });
    }

    res.status(err.status || 500).json({ 
      error: err.message || 'Internal Server Error',
      details: err.details || undefined
    });
  });

  appExpress.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> SERVER READY ON PORT ${PORT} <<<`);
  });
}

// Background Processing from Buffer
async function processPdfFromBuffer(jobId: string, buffer: Buffer) {
  console.log(`[Job ${jobId}] Starting background processing`);
  const docRef = adminDb.collection(DOCUMENTS_COLLECTION).doc(jobId);
  
  const updateStatus = async (status: string, progress: number, message: string, extra = {}) => {
    try {
      // Use set with merge: true to avoid NOT_FOUND if the initial record failed to create
      await docRef.set({ 
        status, 
        progress, 
        message, 
        ...extra, 
        updatedAt: firestore.FieldValue.serverTimestamp() 
      }, { merge: true });
      console.log(`[Job ${jobId}] Status updated to: ${status} (${progress}%)`);
    } catch (e: any) {
      console.error(`[Job ${jobId}] Failed to update status in Firestore:`, e.message);
    }
  };

  try {
    await updateStatus('parsing', 20, 'Reading PDF contents with Gemini AI...');
    
    const text = await geminiServerService.extractTextFromPdf(buffer);
    
    if (!text || text.trim().length === 0) {
      throw new Error('Gemini failed to extract text from the PDF');
    }

    await updateStatus('extracting', 50, 'Extracting concepts and metadata...');

    const chunks = chunkText(text);
    await updateStatus('indexing', 80, `Indexing ${chunks.length} segments for search...`, { chunkCount: chunks.length });

    await updateStatus('completed', 100, 'Processing complete!', { text, chunks });
    console.log(`[Job ${jobId}] Finished successfully`);

  } catch (error: any) {
    console.error(`[Job ${jobId}] Execution failed:`, error);
    await updateStatus('failed', 0, `Processing failed: ${error.message}`, { error: error.message });
  }
}

startServer().catch(err => {
  console.error('CRITICAL: Server failed to start:', err);
});

