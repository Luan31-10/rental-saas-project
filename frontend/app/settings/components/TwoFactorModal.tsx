'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TwoFactorModal({ isOpen, onClose, onSuccess }: Props) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchQrCode = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get('http://localhost:3000/auth/2fa/generate', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setQrCodeUrl(res.data.qrCodeImage);
        } catch { // 🔥 XÓA BIẾN ERROR Ở ĐÂY CHO HẾT LỖI UNUSED
          alert('Lỗi khi tạo mã QR 2FA!');
          onClose();
        } finally {
          setLoading(false);
        }
      };
      fetchQrCode();
    } else {
      setQrCodeUrl('');
      setOtpCode('');
      setLoading(true);
    }
  }, [isOpen, onClose]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return alert('Vui lòng nhập đúng 6 số!');
    
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/auth/2fa/turn-on', 
        { code: otpCode }, 
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      alert('🎉 Đã BẬT bảo mật 2 lớp thành công!');
      onSuccess();
      onClose();
    } catch (error) { // 🔥 XÓA CHỮ ": ANY" ĐI
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || 'Mã xác thực không đúng!');
      } else {
        alert('Lỗi kết nối hệ thống!');
      }
    } finally {
      setVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      <div style={{ width: 400, background: '#1e2330', borderRadius: 16, padding: 32, border: '1px solid #252d3d', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>Bật xác thực 2 bước</h2>
        <p style={{ color: '#8896a8', fontSize: 13, marginBottom: 24 }}>Sử dụng ứng dụng Google Authenticator để quét mã QR bên dưới.</p>
        
        {loading ? (
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#8896a8' }}>Đang tạo mã QR...</span>
          </div>
        ) : (
          <div style={{ background: '#fff', padding: 16, borderRadius: 12, display: 'inline-block', marginBottom: 24 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCodeUrl} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
          </div>
        )}

        <form onSubmit={handleVerify}>
          <input 
            type="text" 
            maxLength={6}
            placeholder="Nhập 6 số..." 
            value={otpCode}
            onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
            style={{ width: '100%', padding: '14px', background: '#161a21', border: '1px solid #252d3d', color: '#fff', borderRadius: 8, fontSize: 18, textAlign: 'center', letterSpacing: '4px', marginBottom: 16, outline: 'none' }}
            required
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #252d3d', color: '#8896a8', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Hủy</button>
            <button type="submit" disabled={verifying || otpCode.length !== 6} style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 8, cursor: verifying ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
              {verifying ? 'Đang kiểm tra...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}