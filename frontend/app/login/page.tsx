'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LoginForm from './LoginForm';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

function LoginManager() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); 
  const [view, setView] = useState<'login' | 'forgot'>('login');

  // Nếu có token trên URL -> Bật form Đổi pass
  if (token) return <ResetPassword token={token} onBack={() => setView('login')} />;
  
  // Nếu bấm quên mật khẩu -> Bật form Nhập email
  if (view === 'forgot') return <ForgotPassword onBack={() => setView('login')} />;

  // Mặc định -> Hiện đăng nhập
  return <LoginForm onForgotPassword={() => setView('forgot')} />;
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* KHUNG NỀN DARK MODE CỦA SẾP GIỮ NGUYÊN */}
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e8e8e8', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          .auth-card {
            background: #1e2330; border: 1px solid #252d3d;
            border-radius: 16px; padding: 36px; width: 100%; max-width: 420px;
            box-shadow: 0 24px 64px rgba(0,0,0,0.4); z-index: 1;
          }
          .input-field {
            width: 100%; padding: 12px 16px; background: #161a21; border: 1px solid #252d3d;
            color: #e8e8e8; border-radius: 10px; font-size: 14px; transition: 0.2s;
            margin-bottom: 14px; font-family: inherit;
          }
          .input-field:focus { border-color: #3d4a6b; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
          .input-field::placeholder { color: #2a3040; }
          .btn-primary {
            width: 100%; padding: 13px; background: #fff; border: none; color: #000;
            border-radius: 10px; font-weight: 700; font-size: 14.5px; cursor: pointer;
            transition: 0.2s; font-family: inherit; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          }
          .btn-primary:hover { background: #f0f0f0; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
          .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
          .role-btn {
            flex: 1; padding: 9px; border-radius: 8px; cursor: pointer; font-weight: 600;
            font-size: 13px; transition: 0.2s; border: 1px solid #252d3d;
            background: #161a21; color: #6b7280; font-family: inherit;
          }
          .role-btn.active { background: rgba(255,255,255,0.07); border-color: #354055; color: #d0d8e8; }
        `}</style>

        {/* Ambient glow */}
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 500, background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '15%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* BỌC SUSPENSE VÌ CÓ DÙNG URL PARAMS */}
        <Suspense fallback={<div style={{ zIndex: 1 }}>Đang tải...</div>}>
          <LoginManager />
        </Suspense>
      </div>
    </GoogleOAuthProvider>
  );
}