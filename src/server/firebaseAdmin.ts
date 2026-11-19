import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebase-applet-config.json' with { type: 'json' };

function resolveServiceAccount(): Record<string, any> | null {
  // 1. Check file paths (e.g. Render Secret Files, custom paths)
  const candidatePaths = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    '/etc/secrets/firebase-service-account.json',
    '/etc/secrets/gcp-service-account.json',
    '/etc/secrets/service-account.json',
    '/etc/secrets/credentials.json',
    path.resolve(process.cwd(), 'firebase-service-account.json'),
  ].filter(Boolean) as string[];

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const content = fs.readFileSync(candidate, 'utf8').trim();
        if (content.startsWith('{')) {
          return JSON.parse(content);
        }
      } catch (err) {
        console.warn(`[firebaseAdmin] Failed reading credentials from ${candidate}:`, err);
      }
    }
  }

  // 2. Check environment variable strings
  const candidateEnv = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
    process.env.FIREBASE_SERVICE_ACCOUNT,
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    process.env.GCP_SERVICE_ACCOUNT,
    process.env.SERVICE_ACCOUNT,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
  ];

  for (const raw of candidateEnv) {
    if (!raw || typeof raw !== 'string') continue;
    let str = raw.trim();
    if (!str) continue;

    // Check if it's a base64 string
    if (!str.startsWith('{') && !str.includes('-----BEGIN') && str.length > 50) {
      try {
        const decoded = Buffer.from(str, 'base64').toString('utf8');
        if (decoded.includes('{')) {
          return JSON.parse(decoded);
        }
      } catch {}
    }

    // Check if double-stringified JSON
    if (str.startsWith('"') || str.startsWith("'")) {
      try {
        str = JSON.parse(str);
      } catch {}
    }

    // Check standard JSON
    if (typeof str === 'string' && str.startsWith('{')) {
      try {
        return JSON.parse(str);
      } catch {
        try {
          return JSON.parse(str.replace(/\n/g, '\\n'));
        } catch {}
      }
    }

    // Check raw or escaped PEM private key
    if (typeof str === 'string' && str.includes('PRIVATE KEY')) {
      const formattedKey = str.replace(/\\n/g, '\n').replace(/\\n/g, '\n');
      return {
        type: 'service_account',
        project_id: firebaseConfig.projectId || 'paws-local',
        private_key_id: '779bd4661e922faa61a2146c0d99f1221ddd8774',
        private_key: formattedKey,
        client_email: 'firebase-adminsdk-fbsvc@paws-local.iam.gserviceaccount.com',
        client_id: '103697908357621516031',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40paws-local.iam.gserviceaccount.com',
      };
    }
  }

  return null;
}

const resolvedCreds = resolveServiceAccount();
let appCredential: ReturnType<typeof cert> | undefined;

if (resolvedCreds) {
  try {
    if (resolvedCreds.private_key && typeof resolvedCreds.private_key === 'string') {
      resolvedCreds.private_key = resolvedCreds.private_key.replace(/\\n/g, '\n');
    }
    appCredential = cert(resolvedCreds);

    // Save to temp file and set GOOGLE_APPLICATION_CREDENTIALS so Google Cloud client libraries automatically use it
    const credsPath = path.join(os.tmpdir(), 'gcp-service-account-autogen.json');
    fs.writeFileSync(credsPath, JSON.stringify(resolvedCreds, null, 2), 'utf8');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
    console.log('[firebaseAdmin] Successfully loaded and configured service account credentials.');
  } catch (err) {
    console.error('[firebaseAdmin] Failed to initialize service account credential:', err);
  }
} else {
  console.warn('[firebaseAdmin] No service account credentials detected; falling back to ADC/default.');
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
