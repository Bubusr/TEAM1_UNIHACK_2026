import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebase-applet-config.json' with { type: 'json' };

// Support injecting Google Cloud credentials via an environment variable string on platforms like Render
const rawCreds =
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() ||
  process.env.GCP_SERVICE_ACCOUNT?.trim() ||
  process.env.FIREBASE_SERVICE_ACCOUNT?.trim();

let appCredential: ReturnType<typeof cert> | undefined;

if (rawCreds) {
  try {
    const parsed = JSON.parse(rawCreds);
    appCredential = cert(parsed);
  } catch {
    // rawCreds is not valid JSON string, will rely on file fallback
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const credsPath = path.join(os.tmpdir(), 'gcp-app-credentials.json');
      fs.writeFileSync(credsPath, rawCreds, 'utf8');
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    } catch (err) {
      console.warn('Failed to write credentials to tmpdir:', err);
    }
  }
}

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
    ...(appCredential ? { credential: appCredential } : {}),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
adminDb.settings({
  preferRest: true,
  ignoreUndefinedProperties: true,
});
