'use client';

import React, { useState, useEffect } from 'react';

interface LoginButtonProps {
  className?: string;
  showUserInfo?: boolean;
}

export default function LoginButton({ className = '', showUserInfo = false }: LoginButtonProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [userAlias, setUserAlias] = useState('Nhà Thám Hiểm Sài Gòn');
  const [shortAddress, setShortAddress] = useState('0x1111...1111');

  useEffect(() => {
    const saved = localStorage.getItem('busquest_user_logged_in');
    if (saved === 'true') {
      setAuthenticated(true);
      const alias = localStorage.getItem('busquest_user_alias') || 'Nhà Thám Hiểm Sài Gòn';
      setUserAlias(alias);
      setShortAddress('0x4311...Fuji');
    }
  }, []);

  const handleLogin = () => {
    localStorage.setItem('busquest_user_logged_in', 'true');
    setAuthenticated(true);
    const alias = localStorage.getItem('busquest_user_alias') || 'Nhà Thám Hiểm Sài Gòn';
    setUserAlias(alias);
    setShortAddress('0x4311...Fuji');
  };

  const handleLogout = () => {
    localStorage.removeItem('busquest_user_logged_in');
    setAuthenticated(false);
  };

  if (authenticated) {
    if (showUserInfo) {
      return (
        <div className={`flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 ${className}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm shadow-sm">
              {userAlias.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 leading-tight">{userAlias}</p>
              <p className="text-xs text-slate-400 font-mono">{shortAddress} (Avalanche)</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition"
          >
            Đăng xuất
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleLogout}
        className={`px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition ${className}`}
      >
        Đăng xuất
      </button>
    );
  }

  return (
    <button
      onClick={handleLogin}
      className={`flex items-center justify-center gap-3 w-full py-3.5 px-4 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 shadow-sm hover:shadow transition-all active:scale-[0.99] ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        />
      </svg>
      <span>Đăng nhập bằng Google</span>
    </button>
  );
}
