import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import rawFirebaseConfig from '../config/firebase-applet-config.json';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || rawFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || rawFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || rawFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || rawFirebaseConfig.authDomain,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
    rawFirebaseConfig.firestoreDatabaseId ||
    '(default)',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || rawFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    rawFirebaseConfig.messagingSenderId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const DEV_KEEPER_STORAGE_KEY = 'paws_dev_keeper_session';

interface DevKeeperProfile {
  uid: string;
  email: string;
  displayName: string;
}

let devAuthListeners: Array<(user: User | null) => void> = [];
let devCurrentUser: User | null = null;

function makeDevUser(profile: DevKeeperProfile): User {
  const tokenPayload = {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    iat: Math.floor(Date.now() / 1000),
  };
  const tokenStr =
    'dev-keeper:' +
    (typeof btoa !== 'undefined'
      ? btoa(JSON.stringify(tokenPayload))
      : Buffer.from(JSON.stringify(tokenPayload)).toString('base64'));

  return {
    uid: profile.uid,
    email: profile.email,
    displayName: profile.displayName,
    getIdToken: async () => tokenStr,
  } as unknown as User;
}

function getStoredDevUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(DEV_KEEPER_STORAGE_KEY);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw) as DevKeeperProfile;
    return makeDevUser(profile);
  } catch {
    return null;
  }
}

let signInInFlight: Promise<User> | null = null;

export async function checkRedirectResult(): Promise<User | null> {
  try {
    const cred = await getRedirectResult(auth);
    if (cred?.user) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DEV_KEEPER_STORAGE_KEY);
        sessionStorage.removeItem('paws_auth_redirect_pending');
      }
      devCurrentUser = null;
      return cred.user;
    }
  } catch (err) {
    console.warn('getRedirectResult check:', err);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('paws_auth_redirect_pending');
    }
    throw err;
  }
  return null;
}

export async function signInWithGoogleRedirect(): Promise<void> {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('paws_auth_redirect_pending', '1');
  }
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (err: any) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('paws_auth_redirect_pending');
    }
    console.error('Firebase signInWithRedirect error:', err?.code, err?.message, err);

    // If unauthorized domain happens in dev fallback mode:
    if (import.meta.env.DEV && err?.code === 'auth/unauthorized-domain') {
      console.warn(
        '⚠️ Firebase auth/unauthorized-domain: Falling back to Local Dev Keeper.'
      );
      const profile: DevKeeperProfile = {
        uid: 'dev-keeper-001',
        email: 'keeper@pawsandpicket.local',
        displayName: 'Dev Keeper (Local)',
      };
      const devUser = makeDevUser(profile);
      devCurrentUser = devUser;
      if (typeof window !== 'undefined') {
        localStorage.setItem(DEV_KEEPER_STORAGE_KEY, JSON.stringify(profile));
      }
      devAuthListeners.forEach((fn) => fn(devUser));
      return;
    }

    const code = err?.code ? `[${err.code}] ` : '';
    const errObj = new Error(`${code}${err?.message || 'Google Sign-In failed.'}`);
    (errObj as any).code = err?.code;
    throw errObj;
  }
}

export async function signInWithGooglePopup(): Promise<User> {
  if (signInInFlight) return signInInFlight;

  signInInFlight = (async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      // If real Google sign in succeeded, clear any leftover dev session
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DEV_KEEPER_STORAGE_KEY);
      }
      devCurrentUser = null;
      return credential.user;
    } catch (err: any) {
      console.error('Firebase signInWithPopup error:', err?.code, err?.message, err);

      if (err?.code === 'auth/popup-closed-by-user') {
        const error = new Error('Sign-in popup was closed. Please try again.');
        (error as any).code = 'auth/popup-closed-by-user';
        throw error;
      }
      if (err?.code === 'auth/cancelled-popup-request') {
        const error = new Error('Sign-in was cancelled. Please try again.');
        (error as any).code = 'auth/cancelled-popup-request';
        throw error;
      }
      if (err?.code === 'auth/popup-blocked') {
        const error = new Error('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
        (error as any).code = 'auth/popup-blocked';
        throw error;
      }

      // If unauthorized domain happens in dev fallback mode:
      if (import.meta.env.DEV && err?.code === 'auth/unauthorized-domain') {
        console.warn(
          '⚠️ Firebase auth/unauthorized-domain: Falling back to Local Dev Keeper.'
        );
        const profile: DevKeeperProfile = {
          uid: 'dev-keeper-001',
          email: 'keeper@pawsandpicket.local',
          displayName: 'Dev Keeper (Local)',
        };
        const devUser = makeDevUser(profile);
        devCurrentUser = devUser;
        if (typeof window !== 'undefined') {
          localStorage.setItem(DEV_KEEPER_STORAGE_KEY, JSON.stringify(profile));
        }
        devAuthListeners.forEach((fn) => fn(devUser));
        return devUser;
      }

      const code = err?.code ? `[${err.code}] ` : '';
      const errObj = new Error(`${code}${err?.message || 'Google Sign-In failed.'}`);
      (errObj as any).code = err?.code;
      throw errObj;
    } finally {
      signInInFlight = null;
    }
  })();

  return signInInFlight;
}

export async function signOutKeeper(): Promise<void> {
  if (devCurrentUser) {
    devCurrentUser = null;
    devAuthListeners.forEach((fn) => fn(null));
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DEV_KEEPER_STORAGE_KEY);
  }
  await signOut(auth);
}

export async function getCurrentIdToken(): Promise<string | null> {
  if (import.meta.env.DEV && devCurrentUser) {
    return devCurrentUser.getIdToken();
  }
  const current = auth.currentUser;
  if (!current) return null;
  return current.getIdToken();
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (import.meta.env.DEV) {
    const stored = getStoredDevUser();
    if (stored) {
      devCurrentUser = stored;
      setTimeout(() => callback(stored), 0);
    }
    devAuthListeners.push(callback);
  }

  const unsub = onAuthStateChanged(auth, (user) => {
    if (devCurrentUser) return;
    callback(user);
  });

  return () => {
    unsub();
    devAuthListeners = devAuthListeners.filter((fn) => fn !== callback);
  };
}
