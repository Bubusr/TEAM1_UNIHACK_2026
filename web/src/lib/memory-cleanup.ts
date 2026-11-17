/**
 * Tự động giải phóng RAM khi người dùng đóng tab, reload hoặc chuyển hướng.
 * CHỈ kích hoạt ở môi trường LOCALHOST (không ảnh hưởng tới web production/host riêng).
 */

import { clearAutoRigCaches } from './auto-rig';
import { ImageDB } from './image-db';

let isSetup = false;

export function setupLocalhostMemoryCleanup(): void {
  if (typeof window === 'undefined' || isSetup) return;

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.local');

  if (!isLocalhost) return;

  isSetup = true;

  const releaseRAM = () => {
    // 1. Xóa toàn bộ cache ảnh / bản crop / face data trong RAM của auto-rig
    clearAutoRigCaches();

    // 2. Xóa memoryCache của ImageDB
    ImageDB.clearMemoryCache();
  };

  // Lắng nghe các sự kiện đóng tab, điều hướng hoặc ẩn trang trên localhost
  window.addEventListener('pagehide', releaseRAM);
  window.addEventListener('beforeunload', releaseRAM);
}

