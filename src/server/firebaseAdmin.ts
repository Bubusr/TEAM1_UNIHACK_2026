import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../config/firebase-applet-config.json' with { type: 'json' };

// Support injecting Google Cloud credentials via an environment variable string on platforms like Render
const rawCreds =
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim() ||
  process.env.GCP_SERVICE_ACCOUNT?.trim() ||
  process.env.FIREBASE_SERVICE_ACCOUNT?.trim();

if (rawCreds && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    const credsPath = path.join(os.tmpdir(), 'gcp-app-credentials.json');
    fs.writeFileSync(credsPath, rawCreds, 'utf8');
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  } catch (err) {
    console.warn('Failed to write credentials to tmpdir:', err);
  }
}

if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export const adminAuth = getAuth();

let hasGcpCredentials = Boolean(
  process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)
);

if (hasGcpCredentials) {
  try {
    const creds = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS!, 'utf8')
    );
    // If it's a dummy or local development mock credential, use InMemoryFirestore
    if (
      creds.project_id === 'paws-local' ||
      creds.client_email?.includes('paws-local') ||
      creds.private_key?.includes('jwt-placeholder')
    ) {
      hasGcpCredentials = false;
    }
  } catch {
    hasGcpCredentials = false;
  }
}

// Lightweight In-Memory Firestore implementation for local development without Google Cloud ADC
class InMemoryDocRef {
  private coll: InMemoryCollection;
  public id: string;
  constructor(coll: InMemoryCollection, id: string) {
    this.coll = coll;
    this.id = id;
  }
  async get() {
    const data = this.coll.store.get(this.id);
    return {
      exists: data !== undefined,
      id: this.id,
      data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
    };
  }
  async set(data: any, opts?: { merge?: boolean }) {
    if (opts?.merge) {
      const ex = this.coll.store.get(this.id) || {};
      this.coll.store.set(this.id, { ...ex, ...JSON.parse(JSON.stringify(data)) });
    } else {
      this.coll.store.set(this.id, JSON.parse(JSON.stringify(data)));
    }
  }
  async update(data: any) {
    const ex = this.coll.store.get(this.id) || {};
    this.coll.store.set(this.id, { ...ex, ...JSON.parse(JSON.stringify(data)) });
  }
  async delete() {
    this.coll.store.delete(this.id);
  }
}

class InMemoryQuery {
  private coll: InMemoryCollection;
  private filters: Array<{ field: string; op: string; val: any }>;
  private lim?: number;
  constructor(
    coll: InMemoryCollection,
    filters: Array<{ field: string; op: string; val: any }> = [],
    lim?: number
  ) {
    this.coll = coll;
    this.filters = filters;
    this.lim = lim;
  }
  where(field: string, op: string, val: any) {
    return new InMemoryQuery(this.coll, [...this.filters, { field, op, val }], this.lim);
  }
  limit(n: number) {
    return new InMemoryQuery(this.coll, this.filters, n);
  }
  async get() {
    let docs = Array.from(this.coll.store.entries()).map(([id, data]) => ({
      id,
      data: () => JSON.parse(JSON.stringify(data)),
      exists: true,
    }));
    for (const f of this.filters) {
      docs = docs.filter((d) => {
        const val = f.field.includes('.')
          ? f.field.split('.').reduce((acc: any, part: string) => acc && acc[part], d.data())
          : d.data()[f.field];
        if (f.op === '==') return val === f.val;
        return true;
      });
    }
    if (this.lim !== undefined) docs = docs.slice(0, this.lim);
    return { empty: docs.length === 0, size: docs.length, docs };
  }
}

class InMemoryCollection {
  public store = new Map<string, any>();
  doc(id?: string) {
    return new InMemoryDocRef(this, id || crypto.randomUUID());
  }
  where(field: string, op: string, val: any) {
    return new InMemoryQuery(this).where(field, op, val);
  }
  limit(n: number) {
    return new InMemoryQuery(this).limit(n);
  }
  async get() {
    return new InMemoryQuery(this).get();
  }
}

class InMemoryFirestore {
  private colls = new Map<string, InMemoryCollection>();
  collection(name: string) {
    if (!this.colls.has(name)) {
      this.colls.set(name, new InMemoryCollection());
    }
    return this.colls.get(name)!;
  }
  batch() {
    const ops: Array<() => Promise<void>> = [];
    const b = {
      set: (ref: any, d: any, o?: any) => {
        ops.push(async () => { await ref.set(d, o); });
        return b;
      },
      update: (ref: any, d: any) => {
        ops.push(async () => { await ref.set(d, { merge: true }); });
        return b;
      },
      delete: (ref: any) => {
        ops.push(async () => { await ref.delete(); });
        return b;
      },
      commit: async () => {
        for (const op of ops) await op();
      },
    };
    return b;
  }
  async runTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return await fn({
      get: async (r: any) => await r.get(),
      set: async (r: any, d: any, o?: any) => await r.set(d, o),
      update: async (r: any, d: any) => await r.set(d, { merge: true }),
      delete: async (r: any) => await r.delete(),
    });
  }
}

export const adminDb: Firestore = hasGcpCredentials
  ? getFirestore()
  : (new InMemoryFirestore() as unknown as Firestore);
