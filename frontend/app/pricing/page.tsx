'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Property {
  id: string;
  name: string;
  baseElectricityPrice: number;
  baseWaterPrice: number;
  defaultRoomPrice: number;
}

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropId, setSelectedPropId] = useState('');
  
  const [pricing, setPricing] = useState({
    baseElectricityPrice: 3500,
    baseWaterPrice: 15000,
    defaultRoomPrice: 0,
  });

  const [isSaving, setIsSaving] = useState(false);
  // State hiển thị thông báo thay cho alert()
  const [notification, setNotification] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchProperties = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await axios.get(`${API_URL}/property`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties(res.data);
      if (res.data.length > 0) {
        setSelectedPropId(res.data[0].id);
        setPricing({
          baseElectricityPrice: res.data[0].baseElectricityPrice || 3500,
          baseWaterPrice: res.data[0].baseWaterPrice || 15000,
          defaultRoomPrice: res.data[0].defaultRoomPrice || 0,
        });
      }
    } catch { 
      router.push('/login'); 
    } finally { 
      setLoading(false); 
    }
  }, [router, API_URL]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const handleSelectProperty = (id: string) => {
    setSelectedPropId(id);
    const prop = properties.find(p => p.id === id);
    if (prop) {
      setPricing({
        baseElectricityPrice: prop.baseElectricityPrice || 3500,
        baseWaterPrice: prop.baseWaterPrice || 15000,
        defaultRoomPrice: prop.defaultRoomPrice || 0,
      });
    }
    setNotification(null); // Reset thông báo khi đổi khu
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    const token = localStorage.getItem('token');
    
    try {
      await axios.patch(`${API_URL}/property/${selectedPropId}/pricing`, pricing, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotification({ type: 'success', text: 'Cập nhật bảng giá thành công!' });
      setProperties(prev => prev.map(p => p.id === selectedPropId ? { ...p, ...pricing } : p));
      
      // Tự động ẩn thông báo sau 3s
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ type: 'error', text: 'Đã xảy ra lỗi khi lưu bảng giá!' });
    } finally {
      setIsSaving(false);
    }
  };

  // Các style dùng chung
  const inputWrapperStyle = { position: 'relative' as const, display: 'flex', alignItems: 'center' };
  const inputStyle = { width: '100%', padding: '14px 18px 14px 44px', borderRadius: 12, border: '1px solid #2a3441', background: '#11151c', color: '#f3f4f6', outline: 'none', fontSize: 15, fontFamily: 'inherit', fontWeight: 600, transition: 'all 0.2s ease' };
  const labelStyle = { display: 'block' as const, fontSize: 13, color: '#9ca3af', marginBottom: 8, fontWeight: 600 };
  const iconStyle = { position: 'absolute' as const, left: 16, color: '#6b7280', display: 'flex' };
  const unitStyle = { position: 'absolute' as const, right: 16, color: '#6b7280', fontSize: 14, fontWeight: 500, userSelect: 'none' as const };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0b0f19' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #1e293b', borderTopColor: '#3b82f6', animation: 'spin 0.8s ease-in-out infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0b0f19', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e5e7eb' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }

        /* Input & Select Hover/Focus Effects */
        .pro-input:hover, .pro-select:hover { border-color: #3b82f6; }
        .pro-input:focus, .pro-select:focus { 
          border-color: #3b82f6 !important; 
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); 
          background: #151a23 !important;
        }
        
        /* Ẩn mũi tên mặc định của input number */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide { animation: slideDown 0.3s ease-out forwards; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: '1px solid #1e293b', background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.3px' }}>Cấu hình Bảng giá</div>
        </div>

        {/* Nội dung */}
        <div className="animate-slide" style={{ flex: 1, overflowY: 'auto', padding: '48px 32px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 10, letterSpacing: '-0.5px' }}>Bảng Giá Dịch Vụ</h2>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6 }}>
                Thiết lập giá điện, nước và giá phòng mặc định. Hệ thống và Trợ lý AI sẽ tự động sử dụng cấu hình này để tính toán hóa đơn hàng tháng.
              </p>
            </div>

            <div style={{ background: '#111827', borderRadius: 20, padding: 36, border: '1px solid #1e293b', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
              
              {/* Chọn khu trọ */}
              <div style={{ marginBottom: 32 }}>
                <label style={labelStyle}>Khu trọ đang chọn</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    className="pro-select"
                    value={selectedPropId} 
                    onChange={e => handleSelectProperty(e.target.value)}
                    style={{ width: '100%', padding: '16px 20px', borderRadius: 12, border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)', color: '#60a5fa', outline: 'none', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', transition: 'all 0.2s' }}>
                    {properties.length === 0 && <option value="">Sếp chưa có khu trọ nào</option>}
                    {properties.map(p => <option key={p.id} value={p.id} style={{ background: '#111827', color: '#fff' }}>🏠 {p.name}</option>)}
                  </select>
                  {/* Custom Arrow cho Select */}
                  <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3b82f6' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #1e293b, transparent)', margin: '0 0 32px 0' }} />

              {/* Thông báo Notification */}
              {notification && (
                <div className="animate-slide" style={{ padding: '14px 20px', borderRadius: 10, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: notification.type === 'success' ? '#34d399' : '#f87171', border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                  {notification.type === 'success' 
                    ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                  }
                  {notification.text}
                </div>
              )}

              {/* Form nhập giá */}
              <form onSubmit={handleSavePricing}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  
                  {/* Điện */}
                  <div>
                    <label style={labelStyle}>Giá Điện</label>
                    <div style={inputWrapperStyle}>
                      <div style={iconStyle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                      </div>
                      <input type="number" className="pro-input" style={inputStyle} value={pricing.baseElectricityPrice} onChange={e => setPricing({...pricing, baseElectricityPrice: Number(e.target.value)})} required />
                      <span style={unitStyle}>đ / Ký</span>
                    </div>
                  </div>

                  {/* Nước */}
                  <div>
                    <label style={labelStyle}>Giá Nước</label>
                    <div style={inputWrapperStyle}>
                      <div style={iconStyle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                      </div>
                      <input type="number" className="pro-input" style={inputStyle} value={pricing.baseWaterPrice} onChange={e => setPricing({...pricing, baseWaterPrice: Number(e.target.value)})} required />
                      <span style={unitStyle}>đ / Khối</span>
                    </div>
                  </div>
                </div>

                {/* Phòng */}
                <div style={{ marginBottom: 36 }}>
                  <label style={labelStyle}>Giá Phòng Mặc Định <span style={{ color: '#64748b', fontWeight: 400 }}>(Tùy chọn)</span></label>
                  <div style={inputWrapperStyle}>
                    <div style={iconStyle}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <input type="number" className="pro-input" style={inputStyle} value={pricing.defaultRoomPrice} onChange={e => setPricing({...pricing, defaultRoomPrice: Number(e.target.value)})} />
                    <span style={unitStyle}>đ / Tháng</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    Sẽ tự động điền khi tạo phòng mới trong khu trọ này.
                  </p>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={!selectedPropId || isSaving}
                  style={{ 
                    width: '100%', padding: '16px', borderRadius: 12, 
                    background: (!selectedPropId || isSaving) ? '#1e293b' : '#3b82f6', 
                    color: (!selectedPropId || isSaving) ? '#64748b' : '#fff', 
                    border: 'none', fontSize: 16, fontWeight: 700, 
                    cursor: (!selectedPropId || isSaving) ? 'not-allowed' : 'pointer', 
                    transition: 'all 0.2s', fontFamily: 'inherit',
                    boxShadow: (!selectedPropId || isSaving) ? 'none' : '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10
                  }}
                  onMouseOver={e => { if(!isSaving && selectedPropId) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { if(!isSaving && selectedPropId) e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  {isSaving ? (
                    <>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                      Đang xử lý...
                    </>
                  ) : (
                    'Lưu Cấu Hình'
                  )}
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}