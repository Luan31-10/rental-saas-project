'use client';
import { useState } from 'react';
import axios from 'axios';

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setMessage(`✅ ${res.data.message}`);
    } catch (error) {
      if (axios.isAxiosError(error)) alert(error.response?.data?.message || '⚠️ Đăng nhập Google thất bại!');
      else alert('⚠️ Có lỗi kết nối khi đăng nhập Google!');
    } finally {
      setIsLoading(false); // 🔑 QUAN TRỌNG: Mở khóa nút bấm!
    }
  };

  return (
    <div className="auth-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#f0f0f0', letterSpacing: '-0.5px' }}>Khôi Phục Mật Khẩu</h1>
        <p style={{ color: '#4a5568', marginTop: 6, fontSize: 14 }}>
          Nhập email của bạn để nhận link đặt lại mật khẩu.
        </p>
      </div>

      {message && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, fontSize: 13, textAlign: 'center', background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('✅') ? '#34d399' : '#f87171', border: `1px solid ${message.includes('✅') ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}` }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Nhập địa chỉ Email..." 
          className="input-field" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
        
        <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: 8 }}>
          {isLoading ? 'Đang gửi...' : 'Gửi link khôi phục'}
        </button>
        
        <button type="button" onClick={onBack} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 10, fontFamily: 'inherit' }}>
          Quay lại Đăng nhập
        </button>
      </form>
    </div>
  );
}