import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebase-applet-config.json' with { type: 'json' };

const FALLBACK_B64_SERVICE_ACCOUNT =
  'ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAicGF3cy1sb2NhbCIsCiAgInByaXZhdGVfa2V5X2lkIjogIjc3OWJkNDY2MWU5MjJmYWE2MWEyMTQ2YzBkOTlmMTIyMWRkZDg3NzQiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRQ3V4clI1dnVCbDRDR2hcbkhPUFM5Wi9mbWdaaWc5ZXVoZWwwaTFpa1d0WHRYZ0lkbnl2cktvYVkwd3BROXU0Q1Bja2NPSjVuZkZaYW91UHpcbjh0M1NzYnR5Mkp3OXdqVjNtV3VHU0lEZVpoTnJuZHFmSXQzTXFINGxRR2h1bTdwdnhSTnJYb1ZOVnZjcVpMUGJcblBVNkJxU2IrU21rb2swL1dGbDdUZUIzdG1Ec1A4eXlZZ3ZTTyswajkvOGRaV2xLWjdhY0hJenBJSDFqRWd0THpcbnFHNnhQRmo5Q0sweE8yd0h5N2tlbG5oVWZWazR1U01kMmpiODdaMTBrZFBIYmUzUkY4dENkUUFvay9GQlplandcbmJOeDl0ZUFPbkc0U0MxVWlWRWpZaCtuZWlqakN5TXkvUE43YjRsU25wQU5zOU5tckZjams4MDRicEdYajlBSklcbkFvSTF1a2lIQWdNQkFBRUNnZ0VBQm9FZ29GTkpPS0ZodndRN09sT24wb09CNzFLbXlUajBta0RCV01TRXA2UFRcbkFsVTFKamhiNy80U3FUYTNYdC83eHhBWVhST1VoeVQreE1wcUZQaEdXSnpWRzd0SmtCem1rb1hLUGZ5Z2htWEdcbmlCdWRFNHZGdmc4cWs4czU0Z1Q4bHdkYWdLbFc0MzRCNzR2Vml4L0hjcmxFTnAxYzRFUE8zYUhmdzBMaUY5TE9cbk5TNTNqWGYvRWlaT3VQT1RMenlCNGVWbitDOG5JVW9ySFR6MHlsZzR4bkQzVmtxZTdaTmZIYXVyRnNBZlYzSURcblo3NEppRWZNRFlGN2ZMLy9EL2lQd2lRMGlFZmdLSisrcWhLaHpVdms3WGhVYUFWZXkrQlB1R3A1aEFNNHRtbXNcbnoweWZ0aVJKVUJOVnpsb1F0dlZVSlA0NHNGTjNxUUtEMXdEWVNpOFhPUUtCZ1FEZ3NlWDJ1ek5CNnJQK1lFVFVcblNxdTNJb2l1VVJUdzFnQ0VzZ1FrTStIaGM3eHROL3VNRXJRTEs3UmdnWGQvaDFOOWsvMW1HbUQ3Y05sck5WTy9cblhWOXpFZnZNVGtzUm5ldXJaODB3ZjZXZDZ3WFM1Z0dGNUZuOUJWSlFSTFIzVUhjSGIvWmxnekZVdUtURnAxYk9cbjM0YkEzVmllVlFtc2dXWk93WjFKSldaUVN3S0JnUURISUdBL09ZazBURnJwc1pNRE5jak1zRTJFK2NHOWJiRENcbjAxSC9udkNNZFh6RDRmUGNLSDN4cE90MXVISU9PQVpia1E3MVlNaHMramU2R2Q4QXpDTURhWGliWmZIcmNsMnBcbkkwNGhXSzFCcmxIZW9Bc3hkYk5paG5aZVB5MGNzak0wSnJiOXVoaHhrWU9CTUpZTzR0c0RLdkFOcUpHeTdxaDdcbmE5K1RwR05iTlFLQmdBRkNIY2FPNzgrTHIreFp2Nmpzcmg5OWF3U0c0YllqaktjeGxBSmI1QVR1TC96d2xsRUhcbmZjaWVPd2xiVUQ3L2xBRWRCZ3MvVkpHejVSUExuYWR4cjJvbWpLRnRRdEJiY1FscHNHVjRJWVpMM2FGN3RrQjRcbnNlUlAxbEVxd1ZQMXVHVHJSSmIyOEJ6SVYrdmZid1lEakc2aURxLzhTK3lTWU85SitFYURsaG9YQW9HQUlaNmtcbndXZjhjMWtFN0hudndWWCtYaGpTTGNaaFlKTTVpZHRWOTl1azc0SVNtNXYxcVZFbzJuaW16SXhrcldQbUp1V1pcbjZmSDZSUFFHSHFTcGt4L2tOWHBFUTdCMXBQUDlQa1pZdGFhY01mKzFrT25pbWVvdWJFOFpneFlWanNmRGYyV2RcbjliN0t5N251d3d3cCtiOXhqTnBlQjJCVG9TdE1SUEpVb0QvY0NwVUNnWUFQU2dGZ1pyQXBTeEJ6c3VmQnZPUWZcbldyUDFHNHRVZy9aYnl4VVZvSDNSU294TW5lNTZIZnhNSy9TdFdLS2FSRHNxZjVISTNHWFZtQWYyaUUyOGxYTlpcbjBQTmp1NzBydGNLQkYwZE9jcjZYWDk2cHUrZmhSQ3YveEs3cExya1BqaTBoQWd6WUtjajAvMFVuVU1JejF1ekNcbjJtWXEwc3ZUZ1dUVkRteERUbzZyTnc9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImZpcmViYXNlLWFkbWluc2RrLWZic3ZjQHBhd3MtbG9jYWwuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTAzNjk3OTA4MzU3NjIxNTE2MDMxIiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9maXJlYmFzZS1hZG1pbnNkay1mYnN2YyU0MHBhd3MtbG9jYWwuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K';

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
          console.log(`[firebaseAdmin] Loaded credentials from file: ${candidate}`);
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
          console.log('[firebaseAdmin] Loaded credentials from Base64 env variable.');
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
        console.log('[firebaseAdmin] Loaded credentials from JSON env variable.');
        return JSON.parse(str);
      } catch {
        try {
          return JSON.parse(str.replace(/\n/g, '\\n'));
        } catch {}
      }
    }

    // Check raw or escaped PEM private key
    if (typeof str === 'string' && str.includes('PRIVATE KEY')) {
      console.log('[firebaseAdmin] Loaded credentials from raw PEM private key in env.');
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

  // 3. Built-in base64 service account fallback
  try {
    const decoded = Buffer.from(FALLBACK_B64_SERVICE_ACCOUNT, 'base64').toString('utf8');
    console.log('[firebaseAdmin] Loaded credentials from built-in service account fallback.');
    return JSON.parse(decoded);
  } catch (e) {
    console.error('[firebaseAdmin] Failed to decode built-in service account fallback:', e);
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
    console.log('[firebaseAdmin] Successfully configured credentials & GOOGLE_APPLICATION_CREDENTIALS.');
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
