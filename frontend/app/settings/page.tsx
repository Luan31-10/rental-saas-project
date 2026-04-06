'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';
import TwoFactorModal from './components/TwoFactorModal'; 

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  priceValue: number;
  period: string;
  desc: string;
  isPopular?: boolean;
  features: string[];
  missing: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'FREE',
    name: 'LuanEZ Starter',
    price: '0₫',
    priceValue: 0,
    period: '/mãi mãi',
    desc: 'Trải nghiệm quản lý cơ bản',
    features: ['Tối đa 10 phòng trọ', 'Quản lý khách thuê cơ bản', 'Ghi điện nước thủ công'],
    missing: ['Thanh toán tự động PayOS', 'Tự động soạn Hợp đồng PDF', 'Trợ lý AI Copilot']
  },
  {
    id: 'PRO',
    name: 'LuanEZ Pro',
    price: '2.000₫',
    priceValue: 2000,
    period: '/tháng',
    desc: 'Dành cho chủ trọ chuyên nghiệp',
    isPopular: true,
    features: ['Tối đa 50 phòng trọ', 'Thanh toán tự động PayOS', 'Tự động soạn Hợp đồng PDF', 'Trợ lý AI Copilot (Tiêu chuẩn)'],
    missing: ['Phân quyền nhiều User (Quản lý)', 'Tùy chỉnh thương hiệu riêng']
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: '999.000₫',
    priceValue: 999000,
    period: '/tháng',
    desc: 'Mô hình chuỗi CHDV cao cấp',
    features: ['Không giới hạn số phòng', 'Trợ lý AI Copilot (Nâng cao)', 'Phân quyền nhiều User', 'Tùy chỉnh Logo & Thương hiệu', 'Hỗ trợ kỹ thuật ưu tiên 24/7'],
    missing: []
  }
];

const SYSTEM_BANK = {
  bankId: 'TCB',
  bankAccount: '19038975516014',
  bankAccountName: 'VO THANH LUAN'
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const [currentPlan, setCurrentPlan] = useState('FREE'); 
  const [planExpiry, setPlanExpiry] = useState<string | null>(null);
  
  const [userInfo, setUserInfo] = useState({ name: 'Admin', email: '', initial: 'A' });
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('0901234567');
  const [editAddress, setEditAddress] = useState('Hồ Chí Minh, Việt Nam');
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bankId, setBankId] = useState('TCB');
  const [bankAccount, setBankAccount] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');

  const [notifyInvoice, setNotifyInvoice] = useState(true);
  const [notifyTenant, setNotifyTenant] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);
  
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [show2FaModal, setShow2FaModal] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [payMethod, setPayMethod] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const getButtonConfig = (planId: string, planPrice: number, planName: string) => {
    if (planId === currentPlan) return { text: 'Đang sử dụng', bg: '#252d3d', color: '#8896a8', cursor: 'not-allowed', border: 'none', shadow: 'none', disabled: true };
    const currentPrice = SUBSCRIPTION_PLANS.find(p => p.id === currentPlan)?.priceValue || 0;
    if (planPrice > currentPrice) {
      if (planId === 'ENTERPRISE') return { text: 'Liên hệ Sales', bg: '#e8e8e8', color: '#000', cursor: 'pointer', border: 'none', shadow: 'none', disabled: false };
      return { text: `Nâng cấp ${planName.replace('LuanEZ ', '')}`, bg: '#3b82f6', color: '#fff', cursor: 'pointer', border: 'none', shadow: '0 4px 14px rgba(59,130,246,0.3)', disabled: false };
    } else {
      return { text: `Tự động về gói này khi hết hạn`, bg: 'transparent', color: '#4a5568', cursor: 'not-allowed', border: '1px dashed #252d3d', shadow: 'none', disabled: true };
    }
  };

  const BANKS = [
    { id: 'TCB', name: 'Techcombank' }, { id: 'MB', name: 'MBBank' },
    { id: 'VCB', name: 'Vietcombank' }, { id: 'CTG', name: 'VietinBank' },
    { id: 'BIDV', name: 'BIDV' }, { id: 'ACB', name: 'ACB' },
    { id: 'TPB', name: 'TPBank' }, { id: 'VPB', name: 'VPBank' },
    { id: 'VIB', name: 'VIB' },
  ];

  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade');
    if (upgradeStatus === 'success') {
      alert('🎉 Chúc mừng! Bạn đã thanh toán thành công. Gói dịch vụ đã được cập nhật!');
      setActiveTab('billing'); 
      router.replace('/settings'); 
      setTimeout(() => window.location.reload(), 500);
    } else if (upgradeStatus === 'cancel') {
      alert('⚠️ Bạn đã hủy thanh toán.');
      setActiveTab('billing');
      router.replace('/settings');
      setTimeout(() => window.location.reload(), 500);
    }
  }, [searchParams, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }
      
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded?.email) {
          const n = decoded.name || decoded.email.split('@')[0];
          setUserInfo({ name: n, email: decoded.email, initial: n.charAt(0).toUpperCase() });
          setEditName(n);
        }

        const res = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data) {
          setEditPhone(res.data.phone || '');
          setEditAddress(res.data.address || '');
          if(res.data.avatar) setAvatarUrl(res.data.avatar);
          if(res.data.bankId) setBankId(res.data.bankId);
          if(res.data.bankAccount) setBankAccount(res.data.bankAccount);
          if(res.data.bankAccountName) setBankAccountName(res.data.bankAccountName);
          if(res.data.isTwoFactorEnabled !== undefined) setTwoFactorAuth(res.data.isTwoFactorEnabled);
          
          if (res.data.plan) setCurrentPlan(res.data.plan);
          if (res.data.planExpiryDate) {
            setPlanExpiry(new Date(res.data.planExpiryDate).toLocaleDateString('vi-VN'));
          }
        }
      } catch (error) {
        console.error("Lỗi tải thông tin user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router, API_URL]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/user/profile`, { name: editName, phone: editPhone, address: editAddress }, { headers: { Authorization: `Bearer ${token}` } });
      alert('✅ Đã cập nhật hồ sơ thành công!');
      setUserInfo(prev => ({ ...prev, name: editName, initial: editName.charAt(0).toUpperCase() }));
    } catch { alert('⚠️ Không thể cập nhật hồ sơ. Vui lòng thử lại!'); } finally { setIsSaving(false); }
  };

  // ========================================================
  // 🔥 XỬ LÝ UPLOAD AVATAR (DÙNG FETCH ĐỂ TRỊ BỆNH BOUNDARY)
  // ========================================================
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploadingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/user/avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Tuyệt đối không khai báo Content-Type ở đây
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi từ máy chủ!');
      }

      setAvatarUrl(data.avatarUrl); 
      alert('✅ Đã cập nhật ảnh đại diện thành công!');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Lỗi Upload:', error);
      alert(`⚠️ Không thể tải ảnh lên: ${error.message}`);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const handleDeleteAvatar = async () => {
    const confirm = window.confirm('Sếp có chắc chắn muốn xóa ảnh đại diện không?');
    if (!confirm) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/user/avatar`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvatarUrl(null);
      alert('✅ Đã xóa ảnh đại diện!');
    } catch (error) {
      console.error(error);
      alert('⚠️ Lỗi khi xóa ảnh!');
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/user/profile`, { bankId, bankAccount, bankAccountName }, { headers: { Authorization: `Bearer ${token}` } });
      alert('✅ Cập nhật cấu hình Thanh toán (VietQR) thành công!');
    } catch { alert('⚠️ Lỗi cập nhật cấu hình thanh toán!'); } finally { setIsSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert('⚠️ Xác nhận mật khẩu mới không khớp!');
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/auth/change-password`, { oldPassword: currentPassword, newPassword: newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      alert('🔒 Cập nhật mật khẩu thành công! Vui lòng đăng nhập lại.');
      localStorage.removeItem('token'); router.push('/login');
    } catch (error) { 
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || '⚠️ Có lỗi kết nối hệ thống!'); 
      } else {
        alert('⚠️ Có lỗi kết nối hệ thống!'); 
      }
    } finally { setIsSaving(false); }
  };

  const handleToggle2FA = async () => {
    if (twoFactorAuth) {
      const confirm = window.confirm('Bạn có chắc chắn muốn TẮT bảo mật 2 lớp không?');
      if (!confirm) return;
      try {
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/auth/2fa/turn-off`, {}, { headers: { Authorization: `Bearer ${token}` }});
        setTwoFactorAuth(false);
        alert('Đã tắt bảo mật 2 lớp!');
      } catch { alert('Lỗi khi tắt 2FA!'); }
    } else { setShow2FaModal(true); }
  };

  const handlePayOSUpgrade = async () => {
    if (selectedPlan?.id === 'FREE') return;
    setIsProcessingPay(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/payos/upgrade-plan`, 
        { planId: selectedPlan?.id, email: userInfo.email }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(`❌ Backend từ chối: ${error.response?.data?.message || 'Lỗi không xác định từ máy chủ'}`);
      } else {
        alert('⚠️ Không thể kết nối với PayOS. Vui lòng thử lại sau!');
      }
    } finally {
      setIsProcessingPay(false);
    }
  };

  const tabs = [
    { key: 'profile', label: 'Hồ sơ cá nhân', icon: '👤' },
    { key: 'payment', label: 'Thanh toán (VietQR)', icon: '🏦' },
    { key: 'notifications', label: 'Thông báo', icon: '🔔' },
    { key: 'security', label: 'Bảo mật', icon: '🔒' },
    { key: 'billing', label: 'Gói dịch vụ', icon: '💎' },
  ];

  const inputStyle = { width: '100%', padding: '11px 14px', background: '#161a21', border: '1px solid #252d3d', color: '#e8e8e8', borderRadius: 8, fontSize: 14, outline: 'none', transition: '0.2s', marginTop: 8, fontFamily: 'inherit' };
  const labelStyle = { color: '#6b7280', fontWeight: 600, fontSize: 12.5, letterSpacing: '0.04em' };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #222836', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e8e8e8', fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }
        .settings-card { background: #1e2330; border: 1px solid #252d3d; border-radius: 12px; padding: 26px; margin-bottom: 20px; }
        input:focus, select:focus { border-color: #3d4a6b !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.08) !important; }
        .toggle-switch { position: relative; width: 42px; height: 23px; appearance: none; background: #252d3d; border-radius: 23px; outline: none; cursor: pointer; transition: background 0.3s; flex-shrink: 0; }
        .toggle-switch:checked { background: #3d4a6b; }
        .toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 19px; height: 19px; background: #fff; border-radius: 50%; transition: transform 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
        .toggle-switch:checked::after { transform: translateX(19px); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease-out forwards; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Cài đặt hệ thống</span>
          </div>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#1a1f28' }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Cài đặt hệ thống</h2>
            <p style={{ color: '#4a5568', fontSize: 13.5 }}>Cá nhân hóa tài khoản, bảo mật và cấu hình nhận tiền.</p>
          </div>

          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', width: '100%', borderRadius: 9, cursor: 'pointer', transition: '0.15s', fontSize: 13.5, fontWeight: activeTab === t.key ? 600 : 450, fontFamily: 'inherit', border: 'none',
                    background: activeTab === t.key ? '#1e2330' : 'transparent',
                    color: activeTab === t.key ? '#d0d8e8' : '#6b7280',
                    borderLeft: activeTab === t.key ? '2px solid #3d4a6b' : '2px solid transparent' }}>
                  <span style={{ fontSize: 16, width: 22 }}>{t.icon}</span>{t.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, maxWidth: activeTab === 'billing' ? 950 : 680 }}>
              
              {/* TAB 1: PROFILE */}
              {activeTab === 'profile' && (
                <form className="settings-card" onSubmit={handleSaveProfile}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: '#f0f0f0' }}>Thông báo & Hồ sơ</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                    
                    {/* 🔥 Khu vực hiển thị Avatar */}
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#222836', border: '2px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, color: '#8896a8', flexShrink: 0, overflow: 'hidden' }}>
                      {avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img 
                          // 🔥 FIX Ở ĐÂY: Ép nó phải sang đúng cổng 3000 của Backend để lấy ảnh
                          src={avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:3000${avatarUrl}`} 
                          alt="Avatar" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        userInfo.initial
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg" 
                          ref={fileInputRef} 
                          style={{ display: 'none' }} 
                          onChange={handleAvatarUpload} 
                        />
                        <button 
                          type="button" 
                          disabled={isUploadingAvatar}
                          onClick={() => fileInputRef.current?.click()} 
                          style={{ background: '#fff', color: '#000', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: isUploadingAvatar ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}
                        >
                          {isUploadingAvatar ? 'Đang tải...' : 'Đổi Avatar'}
                        </button>
                        
                        {avatarUrl && (
                          <button 
                            type="button" 
                            onClick={handleDeleteAvatar} 
                            style={{ background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 500, fontSize: 13, fontFamily: 'inherit', transition: '0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                          >
                            Xóa ảnh
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>Định dạng: JPG, PNG. Dung lượng tối đa: 5MB.</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                    <div><label style={labelStyle}>Tên hiển thị</label><input type="text" style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} required /></div>
                    <div><label style={labelStyle}>Số điện thoại</label><input type="text" style={inputStyle} value={editPhone} onChange={e => setEditPhone(e.target.value)} /></div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Email (Tài khoản đăng nhập)</label>
                    <input type="email" style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={userInfo.email} disabled />
                  </div>
                  <div style={{ marginBottom: 28 }}>
                    <label style={labelStyle}>Địa chỉ kinh doanh</label>
                    <input type="text" style={inputStyle} value={editAddress} onChange={e => setEditAddress(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #252d3d', paddingTop: 22 }}>
                    <button type="submit" disabled={isSaving} style={{ background: isSaving ? '#6b7280' : '#fff', color: isSaving ? '#fff' : '#000', border: 'none', padding: '11px 22px', borderRadius: 8, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'inherit', transition: '0.15s' }}>
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 1.5: PAYMENT (VIETQR) */}
              {activeTab === 'payment' && (
                <form className="settings-card" onSubmit={handleSavePayment}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>Cấu hình Thanh toán (VietQR)</h3>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>TỰ ĐỘNG TẠO MÃ</div>
                  </div>
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>Hệ thống sẽ dùng thông tin này để tự động đính kèm mã QR vào Hóa đơn cho Khách thuê.</p>
                  
                  <div style={{ marginBottom: 18 }}>
                    <label style={labelStyle}>Ngân hàng thụ hưởng</label>
                    <select value={bankId} onChange={e => setBankId(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                      {BANKS.map(b => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
                    </select>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>
                    <div><label style={labelStyle}>Số tài khoản</label><input type="text" required style={inputStyle} value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="VD: 19038975516014" /></div>
                    <div><label style={labelStyle}>Tên chủ tài khoản</label><input type="text" required style={{ ...inputStyle, textTransform: 'uppercase' }} value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} placeholder="VD: VO THANH LUAN" /></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #252d3d', paddingTop: 22 }}>
                    <button type="submit" disabled={isSaving} style={{ background: isSaving ? '#6b7280' : '#3b82f6', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 8, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                      {isSaving ? 'Đang lưu...' : 'Lưu cấu hình Ngân hàng'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: NOTIFICATIONS */}
              {activeTab === 'notifications' && (
                <div className="settings-card fade-in">
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#f0f0f0' }}>Tùy chỉnh Thông báo</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#d0d8e8', marginBottom: 4 }}>Thông báo Hóa đơn & Tài chính</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Nhận email khi có hóa đơn mới hoặc thanh toán qua PayOS.</div>
                      </div>
                      <input type="checkbox" className="toggle-switch" checked={notifyInvoice} onChange={e => setNotifyInvoice(e.target.checked)} />
                    </div>
                    <div style={{ height: 1, background: '#252d3d' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#d0d8e8', marginBottom: 4 }}>Cập nhật Khách thuê & Sự cố</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Thông báo dọn vào/ra hoặc sự cố.</div>
                      </div>
                      <input type="checkbox" className="toggle-switch" checked={notifyTenant} onChange={e => setNotifyTenant(e.target.checked)} />
                    </div>
                    <div style={{ height: 1, background: '#252d3d' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#d0d8e8', marginBottom: 4 }}>Tin tức LuanEZ</div>
                        <div style={{ fontSize: 13, color: '#6b7280' }}>Nhận tính năng mới và khuyến mãi.</div>
                      </div>
                      <input type="checkbox" className="toggle-switch" checked={notifyMarketing} onChange={e => setNotifyMarketing(e.target.checked)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
                    <button onClick={() => alert('✅ Đã lưu cài đặt thông báo!')} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                      Lưu tùy chọn
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: SECURITY */}
              {activeTab === 'security' && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <form className="settings-card" onSubmit={handleChangePassword}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: '#f0f0f0' }}>Đổi mật khẩu</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                      <div>
                        <label style={labelStyle}>Mật khẩu hiện tại</label>
                        <input type="password" required style={inputStyle} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                        <div>
                          <label style={labelStyle}>Mật khẩu mới</label>
                          <input type="password" required style={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <div>
                          <label style={labelStyle}>Xác nhận mật khẩu mới</label>
                          <input type="password" required style={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" disabled={isSaving} style={{ background: isSaving ? '#6b7280' : '#fff', color: isSaving ? '#fff' : '#000', border: 'none', padding: '11px 22px', borderRadius: 8, fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: 14, transition: '0.2s', fontFamily: 'inherit' }}>
                        {isSaving ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                      </button>
                    </div>
                  </form>
                  <div className="settings-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 }}>Bảo mật 2 lớp (2FA)</h3>
                        <p style={{ color: '#8896a8', fontSize: 13, maxWidth: 450, lineHeight: 1.5 }}>
                          Yêu cầu mã xác thực từ <strong style={{color: '#d0d8e8'}}>Google Authenticator</strong> mỗi khi đăng nhập.
                        </p>
                      </div>
                      <button type="button" onClick={handleToggle2FA} style={{ padding: '11px 22px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', border: twoFactorAuth ? '1px solid #ef4444' : 'none', background: twoFactorAuth ? 'rgba(239, 68, 68, 0.1)' : '#10b981', color: twoFactorAuth ? '#ef4444' : '#fff', transition: '0.2s' }}>
                        {twoFactorAuth ? 'Tắt 2FA' : 'Bật 2FA ngay'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BILLING */}
              {activeTab === 'billing' && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 }}>Nâng cấp Gói dịch vụ</h3>
                      <p style={{ color: '#8896a8', fontSize: 13.5 }}>Mở khóa các tính năng quản lý nhà trọ chuyên nghiệp, tối ưu hóa doanh thu.</p>
                      
                      {currentPlan !== 'FREE' && planExpiry && (
                        <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, display: 'inline-block', color: '#93c5fd', fontSize: 13, fontWeight: 600 }}>
                          ⏳ Gói {currentPlan} của bạn có hạn đến ngày: {planExpiry}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    {SUBSCRIPTION_PLANS.map((plan) => {
                      const btnConfig = getButtonConfig(plan.id, plan.priceValue, plan.name);

                      return (
                        <div key={plan.id} style={{ 
                          background: '#161a21', border: plan.isPopular ? '2px solid #3b82f6' : '1px solid #252d3d', 
                          borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden'
                        }}>
                          {plan.isPopular && (<div style={{ position: 'absolute', top: 12, right: -28, background: '#3b82f6', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 30px', transform: 'rotate(45deg)', letterSpacing: '0.5px' }}>PHỔ BIẾN</div>)}
                          <h4 style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{plan.name}</h4>
                          <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 20 }}>{plan.desc}</p>
                          
                          <div style={{ marginBottom: 24 }}>
                            <span style={{ color: '#f0f0f0', fontSize: 26, fontWeight: 800 }}>{plan.price}</span>
                            <span style={{ color: '#6b7280', fontSize: 13 }}>{plan.period}</span>
                          </div>
                          
                          <button 
                            disabled={btnConfig.disabled}
                            onClick={() => {
                              if (!btnConfig.disabled) {
                                setSelectedPlan(plan);
                                setUpgradeSuccess(false);
                              }
                            }} 
                            style={{ 
                              background: btnConfig.bg,
                              color: btnConfig.color,
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              cursor: btnConfig.cursor as any,
                              border: btnConfig.border,
                              boxShadow: btnConfig.shadow,
                              width: '100%', padding: 12, borderRadius: 8, fontWeight: 600, fontSize: 13, marginBottom: 24, transition: '0.2s' 
                            }}
                          >
                            {btnConfig.text}
                          </button>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                            {plan.features.map((f, i) => (
                              <div key={`y-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#d0d8e8', lineHeight: 1.4 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M5 13l4 4L19 7"/></svg>{f}</div>
                            ))}
                            {plan.missing.map((m, i) => (
                              <div key={`n-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#4a5568', lineHeight: 1.4 }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg><span style={{ textDecoration: 'line-through' }}>{m}</span></div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* MODAL THANH TOÁN */}
      {selectedPlan && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ width: 400, background: '#1e2330', borderRadius: 24, padding: '32px', textAlign: 'center', border: '1px solid #252d3d', position: 'relative', overflow: 'hidden' }}>
            <button onClick={() => setSelectedPlan(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#8896a8', cursor: 'pointer' }}>✕</button>

            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f0f0f0', marginBottom: 20 }}>Thanh toán Gói dịch vụ</h3>

            <div style={{ display: 'flex', background: '#161a21', padding: 4, borderRadius: 12, marginBottom: 24, border: '1px solid #252d3d' }}>
              <button onClick={() => setPayMethod('AUTO')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: payMethod === 'AUTO' ? '#3b82f6' : 'transparent', color: '#fff', fontWeight: 600, fontSize: 13, transition: '0.2s' }}>⚡ PayOS (Tự động)</button>
              <button onClick={() => setPayMethod('MANUAL')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: payMethod === 'MANUAL' ? '#3b82f6' : 'transparent', color: '#fff', fontWeight: 600, fontSize: 13, transition: '0.2s' }}>📑 VietQR (Mã tĩnh)</button>
            </div>

            {!upgradeSuccess ? (
              <>
                {payMethod === 'AUTO' ? (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
                    <p style={{ color: '#8896a8', fontSize: 13, marginBottom: 24 }}>Tài khoản của bạn sẽ được kích hoạt gói <strong>{selectedPlan.name}</strong> ngay lập tức sau khi giao dịch thành công.</p>
                    <div style={{ background: '#161a21', padding: 16, borderRadius: 12, textAlign: 'left', marginBottom: 24, border: '1px solid #252d3d' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span style={{ color: '#8896a8' }}>Tổng thanh toán:</span><span style={{ color: '#10b981', fontWeight: 700, fontSize: 16 }}>{selectedPlan.price}</span></div>
                    </div>
                    <button onClick={handlePayOSUpgrade} disabled={isProcessingPay} style={{ width: '100%', padding: 14, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: isProcessingPay ? 'not-allowed' : 'pointer' }}>
                      {isProcessingPay ? 'Đang kết nối PayOS...' : 'Thanh toán qua PayOS'}
                    </button>
                  </div>
                ) : (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ background: '#fff', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={`https://img.vietqr.io/image/${SYSTEM_BANK.bankId}-${SYSTEM_BANK.bankAccount}-compact2.png?amount=${selectedPlan.priceValue}&addInfo=UPGRADE%20${selectedPlan.id}&accountName=${encodeURIComponent(SYSTEM_BANK.bankAccountName)}`} 
                        alt="VietQR Upgrade" style={{ width: '100%', borderRadius: 8 }} 
                      />
                    </div>
                    <div style={{ textAlign: 'left', fontSize: 12, color: '#94a3b8', background: '#161a21', padding: 12, borderRadius: 12, border: '1px solid #252d3d', marginBottom: 16 }}>
                      <p>● Nội dung CK: <span style={{ color: '#3b82f6', fontWeight: 700 }}>UPGRADE {selectedPlan.id}</span></p>
                      <p>● Gói sẽ được kích hoạt thủ công trong 5-10 phút.</p>
                    </div>
                    <button onClick={() => { setUpgradeSuccess(true); setTimeout(() => setSelectedPlan(null), 2500); }} style={{ width: '100%', padding: 14, background: '#10b981', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>Tôi đã chuyển khoản</button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '20px 0', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ color: '#10b981', fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>Đã gửi yêu cầu xử lý!</p>
                <p style={{ color: '#8896a8', fontSize: 13, marginTop: 8 }}>Hệ thống đang xử lý yêu cầu của bạn.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <TwoFactorModal 
        isOpen={show2FaModal} 
        onClose={() => setShow2FaModal(false)}
        onSuccess={() => setTwoFactorAuth(true)}
      />
    </div>
  );
}