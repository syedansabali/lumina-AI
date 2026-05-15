# Lumina AI Backend Documentation

## Architecture Overview
Lumina AI uses a **Full-Stack Express + React** architecture designed for processing large document datasets.

### 1. Document Pipeline
- **Upload**: Handled by `multer` in `server.ts`. 
- **Extraction**: `pdf-parse` extracts raw text and metadata.
- **Progress Tracking**: Uses Server-Sent Events (SSE) to notify the frontend of transformation stages (Parsing -> Extracting -> Indexing).
- **Storage**: For this prototype, documents are stored in an in-memory map to ensure speed, but the structure is ready for Redis/PostgreSQL integration.

### 2. AI & RAG Strategy
- **Context Handling**: Instead of traditional small-chunk RAG, we leverage **Gemini 1.5's large context window (1M+ tokens)**. This allows the AI to "read" the entire 1000+ page PDF in one go, providing much higher accuracy than traditional retrieval methods.
- **Frontend AI Execution**: Following security best practices for this environment, the Gemini API is called from the frontend. The backend provides the sanitized text corpus.

### 3. Key Endpoints
- `POST /api/upload`: Upload PDF.
- `GET /api/status/:jobId`: Real-time processing progress (SSE).
- `GET /api/documents/:jobId`: Retrieve extracted document text.

## Deployment on Cloud Run
The `package.json` is configured with `build` and `start` scripts that:
1. Bundle the React frontend (`dist/index.html`).
2. Bundle the Express server into `dist/server.cjs` using `esbuild`.
3. Start the production server on port 3000.

To deploy manually:
```bash
npm run build
npm start
```
