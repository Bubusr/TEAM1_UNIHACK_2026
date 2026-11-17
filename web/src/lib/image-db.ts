/**
 * Real browser IndexedDB storage for Măng Non character images & face drawings.
 * Keeps `localStorage` lightweight (only storing imageId references) while persisting
 * high-resolution PNG/dataURIs cleanly offline inside IndexedDB.
 */

const DB_NAME = 'mangnon_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'images';

const isLocalhostEnv =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local'));

// In-memory cache for fast synchronous access after hydration
const memoryCache = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const ImageDB = {
  /** Xóa sạch bộ nhớ đệm RAM (dùng cho dọn dẹp localhost) */
  clearMemoryCache(): void {
    memoryCache.clear();
  },

  /** Lưu ảnh dataUri / blob vào IndexedDB theo id */
  async save(id: string, dataUri: string): Promise<void> {
    if (!id || !dataUri) return;
    // Trên localhost: giới hạn tối đa 12 ảnh trong memory cache để tránh ngốn RAM
    if (isLocalhostEnv && memoryCache.size >= 12) {
      const oldestKey = memoryCache.keys().next().value;
      if (oldestKey) memoryCache.delete(oldestKey);
    }
    memoryCache.set(id, dataUri);
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ id, dataUri, updatedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // Fallback cache stays in memory
    }
  },

  /** Đọc ảnh từ IndexedDB (hoặc memory cache) */
  async get(id: string): Promise<string | null> {
    if (!id) return null;
    const cached = memoryCache.get(id);
    if (cached) return cached;
    try {
      const db = await openDB();
      const record = await new Promise<{ id: string; dataUri: string } | undefined>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      if (record?.dataUri) {
        memoryCache.set(id, record.dataUri);
        return record.dataUri;
      }
      return null;
    } catch {
      return null;
    }
  },

  /** Đọc đồng bộ từ cache nếu đã nạp */
  getCached(id: string): string | null {
    return memoryCache.get(id) || null;
  },

  /** Nạp hàng loạt các id ảnh vào cache khi khởi động app */
  async hydrateIds(ids: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    await Promise.all(
      ids.map(async (id) => {
        const val = await this.get(id);
        if (val) result[id] = val;
      })
    );
    return result;
  },

  /** Xóa toàn bộ kho ảnh IndexedDB khi người dùng xóa dữ liệu */
  async clearAll(): Promise<void> {
    memoryCache.clear();
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
  },
};

/**
 * Tạo hash SHA-256 thật bằng Web Crypto API để ghi nhận content hash bất biến.
 */
export async function computeSha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return '0x' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '0x0';
}

