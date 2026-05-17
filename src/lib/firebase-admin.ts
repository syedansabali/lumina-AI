import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

// Load configuration
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let config: any = {};

if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error("Error parsing firebase-applet-config.json:", e);
  }
}

let app: admin.app.App;
const envProjectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT;

if (!admin.apps.length) {
  // Prefer environment project if available to ensure service account matches
  const options: admin.AppOptions = {
    credential: admin.credential.applicationDefault(),
    projectId: envProjectId || config?.projectId
  };
  
  app = admin.initializeApp(options, 'admin-app');
  console.log(`Firebase Admin initialized. Target Project: ${app.options.projectId}, Env Project: ${envProjectId}`);
} else {
  app = admin.app('admin-app') || admin.app();
}

let adminDb: admin.firestore.Firestore;
const databaseId = config?.firestoreDatabaseId;

try {
  if (databaseId && databaseId !== '(default)') {
    console.log(`Initialising Firestore with Database: ${databaseId}`);
    adminDb = getFirestore(app, databaseId);
  } else {
    console.log("Initialising Firestore for project", app.options.projectId, "with Default Database");
    adminDb = getFirestore(app);
  }
} catch (error) {
  console.error("Firestore Initialization Error:", error);
  adminDb = getFirestore(app);
}

const adminAuth = admin.auth(app);

export { adminDb, adminAuth, app };
export const firestore = admin.firestore;
