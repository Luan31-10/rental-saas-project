'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function ResetPassword({ token, onBack }: { token: string; onBack: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setMessage('❌ Mật khẩu nhập lại không khớp!');
    }

    setIsLoading(true);
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/auth/reset-password`, { token, newPassword });
      setMessage(`✅ ${res.data.message}`);
      
      // Đợi 2 giây rồi tự động chuyển form về Login và xóa token trên URL
      setTimeout(() => {
        router.replace('/login');
        onBack();
      }, 2000);
      
    } catch (error) {
  if (axios.isAxiosError(error)) {
    setMessage(error.response?.data?.message || '⚠️ Thao tác thất bại!');
  } else {
    setMessage('⚠️ Đã có lỗi hệ thống xảy ra!'); 
  }
}
  };

  return (
    <div className="auth-card" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#f0f0f0', letterSpacing: '-0.5px' }}>Tạo Mật Khẩu Mới</h1>
        <p style={{ color: '#4a5568', marginTop: 6, fontSize: 14 }}>
          Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {message && (
        <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, fontSize: 13, textAlign: 'center', background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('✅') ? '#34d399' : '#f87171', border: `1px solid ${message.includes('✅') ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)'}` }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input 
          type="password" 
          placeholder="Mật khẩu mới" 
          className="input-field" 
          value={newPassword} 
          onChange={e => setNewPassword(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="Nhập lại mật khẩu mới" 
          className="input-field" 
          value={confirmPassword} 
          onChange={e => setConfirmPassword(e.target.value)} 
          required 
        />
        
        <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: 8 }}>
          {isLoading ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
        </button>
        
        <button type="button" onClick={() => router.replace('/login')} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 10, fontFamily: 'inherit' }}>
          Hủy thao tác
        </button>
      </form>
    </div>
  );
}