'use client';

import { useState, useEffect } from 'react';

/**
 * Kết hợp tùy chọn Giảm chuyển động trong Cài đặt (S13) với `prefers-reduced-motion` của hệ điều hành.
 */
export function useReducedMotion(settingReducedMotion = false): boolean {
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReduced(mq.matches);

    const onChange = (e: MediaQueryListEvent) => setOsReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return Boolean(settingReducedMotion || osReduced);
}

