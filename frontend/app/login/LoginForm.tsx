'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

export default function LoginForm({ onForgotPassword }: { onForgotPassword: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('OWNER');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const [is2FAStep, setIs2FAStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // 1. ĐĂNG NHẬP / ĐĂNG KÝ TRUYỀN THỐNG
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); // 🔒 Khóa nút
    try {
      if (isLogin) {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        if (response.data.requires2FA) {
          setTempToken(response.data.tempToken);
          setIs2FAStep(true);
        } else {
          const token = response.data.access_token;
          localStorage.setItem('token', token);
          try {
            const decodedPayload = JSON.parse(atob(token.split('.')[1]));
            const userRole = decodedPayload.role;
            alert(`🔓 Đăng nhập thành công với quyền ${userRole === 'OWNER' ? 'Chủ trọ' : 'Khách thuê'}!`);
            if (userRole === 'OWNER') router.push('/admin');
            else router.push('/tenants/dashboard');
          } catch { router.push('/admin'); }
        }
      } else {
        await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
        alert(`🎉 Đã tạo thành công tài khoản ${role === 'OWNER' ? 'Chủ trọ' : 'Khách thuê'}!`);
        setIsLogin(true);
        setPassword('');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) alert(error.response?.data?.message || '⚠️ Thao tác thất bại!');
      else alert('⚠️ Đã có lỗi kết nối xảy ra!');
    } finally { 
      setIsLoading(false); // 🔑 QUAN TRỌNG: Mở khóa nút bấm!
    }
  };

  // 2. XÁC THỰC 2FA
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return alert('Vui lòng nhập đủ 6 số!');
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login/verify-2fa`, {
        tempToken: tempToken,
        code: otpCode,
      });

      const token = response.data.access_token;
      localStorage.setItem('token', token);
      
      const decodedPayload = JSON.parse(atob(token.split('.')[1]));
      const userRole = decodedPayload.role;
      alert(`🔓 Đăng nhập thành công với quyền ${userRole === 'OWNER' ? 'Chủ trọ' : 'Khách thuê'}!`);
      
      if (userRole === 'OWNER') router.push('/admin');
      else router.push('/tenants/dashboard');

    } catch (error) {
      if (axios.isAxiosError(error)) alert(error.response?.data?.message || '⚠️ Mã xác thực không đúng hoặc đã hết hạn!');
      else alert('⚠️ Có lỗi kết nối khi xác thực 2FA!');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. ĐĂNG NHẬP GOOGLE
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: credentialResponse.credential
      });
      
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      
      const decodedPayload = JSON.parse(atob(token.split('.')[1]));
      const userRole = decodedPayload.role;
      
      alert(`🔓 Đăng nhập Google thành công với quyền ${userRole === 'OWNER' ? 'Chủ trọ' : 'Khách thuê'}!`);
      
      if (userRole === 'OWNER') router.push('/admin');
      else router.push('/tenants/dashboard');
      
    } catch (error) {
      if (axios.isAxiosError(error)) alert(error.response?.data?.message || '⚠️ Đăng nhập Google thất bại!');
      else alert('⚠️ Có lỗi kết nối khi đăng nhập Google!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          <svg width="22" height="22" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" fill="#000"/></svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#f0f0f0', letterSpacing: '-0.5px' }}>LuanEZ</h1>
        <p style={{ color: '#4a5568', marginTop: 6, fontSize: 14 }}>
          {is2FAStep ? 'Bảo vệ tài khoản bằng 2FA' : isLogin ? 'Chào mừng trở lại!' : 'Tạo tài khoản mới'}
        </p>
      </div>

      {!is2FAStep ? (
        <>
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <button type="button" className={`role-btn${role === 'OWNER' ? ' active' : ''}`} onClick={() => setRole('OWNER')}>🏢 Chủ nhà trọ</button>
                  <button type="button" className={`role-btn${role === 'TENANT' ? ' active' : ''}`} onClick={() => setRole('TENANT')}>👤 Khách thuê</button>
                </div>
                <input type="text" placeholder={role === 'OWNER' ? 'Tên chủ trọ' : 'Tên khách hàng'} className="input-field" value={name} onChange={e => setName(e.target.value)} required />
              </>
            )}
            <input type="email" placeholder="Địa chỉ Email" className="input-field" value={email} onChange={e => setEmail(e.target.value)} required />
            <div style={{ position: 'relative' }}>
  <input 
    type={showPassword ? "text" : "password"} 
    placeholder="Mật khẩu" 
    className="input-field" 
    value={password} 
    onChange={e => setPassword(e.target.value)} 
    required 
    style={{ paddingRight: 40 }} // Chừa chỗ trống bên phải để chữ không đè lên con mắt
  />
  <div 
    onClick={() => setShowPassword(!showPassword)}
    style={{ position: 'absolute', right: 14, top: 12, cursor: 'pointer', color: '#64748b', transition: '0.2s' }}
  >
    {showPassword ? (
      // Icon Mắt nhắm (Ẩn)
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    ) : (
      // Icon Mắt mở (Hiện)
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    )}
  </div>
</div>

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18, marginTop: -6 }}>
                <span 
                  style={{ fontSize: 13, color: '#4a5568', cursor: 'pointer', transition: '0.15s' }}
                  onClick={onForgotPassword} // 🔥 KÍCH HOẠT ĐỔI FORM Ở ĐÂY
                >Quên mật khẩu?</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: isLogin ? 0 : 6 }}>
              {isLoading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '22px 0', color: '#2a3040' }}>
            <div style={{ flex: 1, height: 1, background: '#1e2330' }} />
            <span style={{ padding: '0 12px', fontSize: 12, color: '#2a3040', letterSpacing: '0.06em', fontWeight: 600 }}>HOẶC</span>
            <div style={{ flex: 1, height: 1, background: '#1e2330' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={handleGoogleSuccess} theme="filled_black" shape="rectangular" text="continue_with" size="large" width="348" />
          </div>

          <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: '#4a5568' }}>
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <span style={{ color: '#8896a8', fontWeight: 600, cursor: 'pointer', transition: '0.15s' }} onClick={() => { setIsLogin(!isLogin); setPassword(''); }}>
              {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
            </span>
          </div>
        </>
      ) : (
        <form onSubmit={handleVerify2FA} style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <p style={{ color: '#8896a8', fontSize: 13, marginBottom: 16 }}>Mở Google Authenticator và nhập mã 6 số của bạn.</p>
            <input type="text" maxLength={6} placeholder="Nhập 6 số..." className="input-field" value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} required style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4, fontWeight: 700 }} />
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading || otpCode.length !== 6}>
            {isLoading ? 'Đang kiểm tra...' : 'Xác nhận mã'}
          </button>
          <button type="button" onClick={() => { setIs2FAStep(false); setOtpCode(''); }} style={{ width: '100%', padding: '12px', background: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, marginTop: 10, fontFamily: 'inherit' }}>
            Quay lại đăng nhập
          </button>
        </form>
      )}
    </div>
  );
}