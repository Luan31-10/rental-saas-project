'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Tenant { id: string; name: string; phone: string; status: string; }
interface Room { id: string; roomNumber: string; price: number; status: string; area: number; tenants?: Tenant[]; }
interface Property { id: string; name: string; address: string; defaultRoomPrice?: number; rooms?: Room[]; }

export default function RoomsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ propertyId: '', roomNumber: '', price: '', area: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await axios.get(`${API_URL}/property`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties(res.data);
    } catch { console.error('Lỗi lấy dữ liệu'); }
    finally { setLoading(false); }
  }, [router, API_URL]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Lấy giá sàn của khu trọ đang được chọn trong Form
  const selectedProp = properties.find(p => p.id === newRoom.propertyId);
  const floorPrice = selectedProp?.defaultRoomPrice || 0;

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) return;

    // CHỐT CHẶN 1: Trùng tên phòng
    const isDuplicate = (selectedProp.rooms || []).some(
      r => r.roomNumber.toLowerCase().trim() === newRoom.roomNumber.toLowerCase().trim()
    );
    if (isDuplicate) {
      alert('⚠️ Tên/Số phòng này đã tồn tại trong khu trọ được chọn. Vui lòng nhập tên khác!');
      return;
    }

    // CHỐT CHẶN 2: Giá sàn
    if (floorPrice && Number(newRoom.price) < floorPrice) {
      alert(`⚠️ Giá thuê không được thấp hơn giá sàn của khu trọ này (${floorPrice.toLocaleString('vi-VN')} ₫)!`);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/room`, {
        propertyId: newRoom.propertyId,
        roomNumber: newRoom.roomNumber,
        price: Number(newRoom.price),
        area: Number(newRoom.area)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setIsAddModalOpen(false);
      setNewRoom({ propertyId: '', roomNumber: '', price: '', area: '' });
      fetchData(); 
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.code === 'UPGRADE_REQUIRED') {
          const confirmUpgrade = window.confirm(
            `🚀 ${err.response.data.message}\n\nBạn có muốn chuyển đến trang Cài đặt để Nâng cấp gói không?`
          );
          if (confirmUpgrade) router.push('/settings');
        } else {
          alert(err.response?.data?.message || 'Có lỗi xảy ra khi tạo phòng!');
        }
      } else {
        alert('Lỗi hệ thống không xác định, vui lòng thử lại sau!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRoom = async (roomId: string, status: string) => {
    if (status === 'OCCUPIED') {
      alert('⚠️ Không thể xóa phòng đang có người thuê! Vui lòng làm thủ tục trả phòng trước.');
      return;
    }
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này không?')) return;
    
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/room/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch { alert('Không thể xóa phòng này!'); }
  };

  // ==========================================
  // 🔥 XỬ LÝ TRẢ PHÒNG THỦ CÔNG
  // ==========================================
  const handleManualCheckout = async (roomId: string, roomNumber: string) => {
    const confirmText = window.confirm(`Sếp có chắc chắn muốn làm thủ tục trả phòng cho Phòng ${roomNumber} không? Hệ thống sẽ tự động tính tiền phòng lẻ (nếu có).`);
    if (!confirmText) return; 

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/room/${roomId}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ ${res.data.message}`);
      fetchData(); // Load lại dữ liệu để phòng chuyển thành màu xanh (Trống)
    } catch (error) {
      console.error('Lỗi trả phòng:', error);
      if (axios.isAxiosError(error)) {
        alert(`⚠️ ${error.response?.data?.message || 'Có lỗi xảy ra khi trả phòng!'}`);
      } else {
        alert('⚠️ Lỗi hệ thống không xác định!');
      }
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #222836', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const statusConfig: Record<string, {label:string;color:string;bg:string;border:string}> = {
    AVAILABLE:   { label: 'Trống',   color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)' },
    OCCUPIED:    { label: 'Đang ở',  color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
    MAINTENANCE: { label: 'Bảo trì', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)' },
  };

  const filters = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'AVAILABLE', label: 'Phòng trống' },
    { key: 'OCCUPIED', label: 'Đang ở' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e8e8e8', fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }
        .room-card { background: #1e2330; border: 1px solid #252d3d; border-radius: 12px; padding: 18px; transition: all 0.2s; display: flex; flex-direction: column; }
        .room-card:hover { border-color: #354055; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease-out forwards; }
        .input-field { width: 100%; padding: 12px 14px; background: #161a21; border: 1px solid #252d3d; color: #f0f0f0; border-radius: 8px; margin-top: 6px; font-family: inherit; font-size: 13px; outline: none; transition: 0.2s; }
        .input-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Phòng trọ</span>
          </div>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#1a1f28' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Quản lý Phòng trọ</h2>
              <p style={{ color: '#4a5568', fontSize: 13.5 }}>Xem trạng thái toàn bộ phòng trong hệ thống.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, background: '#161a21', padding: 4, borderRadius: 9, border: '1px solid #1e2330' }}>
                {filters.map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer', transition: '0.15s', border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: filter === f.key ? 600 : 400,
                      background: filter === f.key ? '#1e2330' : 'transparent',
                      color: filter === f.key ? '#d0d8e8' : '#6b7280' }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => {
                  const firstProp = properties[0];
                  setNewRoom({ 
                    propertyId: firstProp?.id || '', 
                    roomNumber: '', 
                    price: firstProp?.defaultRoomPrice ? String(firstProp.defaultRoomPrice) : '', 
                    area: '' 
                  });
                  setIsAddModalOpen(true);
                }} 
                style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Thêm phòng
              </button>
            </div>
          </div>

          {properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#2a3040', fontSize: 14 }}>Chưa có dữ liệu khu trọ và phòng nào.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
              {properties.map(property => {
                const filteredRooms = (property.rooms || []).filter(r => filter === 'ALL' || r.status === filter);
                if (filteredRooms.length === 0) return null;
                return (
                  <div key={property.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1e2330', border: '1px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="#6b7280" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#d0d8e8' }}>{property.name}</h3>
                      <span style={{ fontSize: 12, color: '#4a5568', background: '#1e2330', padding: '3px 10px', borderRadius: 20, border: '1px solid #252d3d' }}>{property.address}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                      {filteredRooms.map(room => {
                        const s = statusConfig[room.status] || statusConfig.AVAILABLE;
                        const activeTenant = room.tenants?.find(t => t.status === 'ACTIVE');
                        return (
                          <div key={room.id} className="room-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0' }}>P. {room.roomNumber}</div>
                              <span style={{ fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#6b7280' }}>Giá thuê</span>
                                <span style={{ color: '#d0d8e8', fontWeight: 600 }}>{room.price.toLocaleString('vi-VN')} ₫</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <span style={{ color: '#6b7280' }}>Diện tích</span>
                                <span style={{ color: '#d0d8e8', fontWeight: 600 }}>{room.area} m²</span>
                              </div>
                              {activeTenant && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid #252d3d', paddingTop: 7, marginTop: 2 }}>
                                  <span style={{ color: '#6b7280' }}>Khách thuê</span>
                                  <span style={{ color: '#a78bfa', fontWeight: 600 }}>{activeTenant.name}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* 🔥 KHU VỰC CÁC NÚT BẤM (ĐÃ CHÈN NÚT TRẢ PHÒNG) */}
                            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
                              <button onClick={() => router.push(`/property/${property.id}`)}
                                style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid #252d3d', color: '#8896a8', borderRadius: 7, fontSize: 13, cursor: 'pointer', transition: '0.15s', fontFamily: 'inherit' }}
                                onMouseOver={e => { e.currentTarget.style.background = '#222836'; e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#354055'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8896a8'; e.currentTarget.style.borderColor = '#252d3d'; }}>
                                Chi tiết
                              </button>
                              
                              {/* 🔥 NÚT TRẢ PHÒNG: Chỉ hiện khi phòng có khách (OCCUPIED) */}
                              {room.status === 'OCCUPIED' && (
                                <button onClick={() => handleManualCheckout(room.id, room.roomNumber)}
                                  style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.06)', color: '#fbbf24', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s', fontFamily: 'inherit' }}
                                  onMouseOver={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}
                                  onMouseOut={e => e.currentTarget.style.background = 'rgba(245,158,11,0.06)'}>
                                  Trả phòng
                                </button>
                              )}

                              <button onClick={() => handleDeleteRoom(room.id, room.status)}
                                style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s', fontFamily: 'inherit' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                                onMouseOut={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}>
                                Xóa
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div className="fade-in" style={{ width: 400, background: '#1e2330', borderRadius: 20, padding: 28, border: '1px solid #252d3d' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0' }}>Thêm phòng mới</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#8896a8', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ color: '#8896a8', fontSize: 12, fontWeight: 600 }}>Khu trọ</label>
                <select required className="input-field" value={newRoom.propertyId} 
                  onChange={e => {
                    const pId = e.target.value;
                    const prop = properties.find(p => p.id === pId);
                    setNewRoom({
                      ...newRoom, 
                      propertyId: pId, 
                      price: prop?.defaultRoomPrice ? String(prop.defaultRoomPrice) : ''
                    });
                  }}>
                  <option value="" disabled>Chọn khu trọ...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#8896a8', fontSize: 12, fontWeight: 600 }}>Số phòng</label>
                  <input required placeholder="VD: 101" className="input-field" value={newRoom.roomNumber} onChange={e => setNewRoom({...newRoom, roomNumber: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: '#8896a8', fontSize: 12, fontWeight: 600 }}>Diện tích (m²)</label>
                  <input required type="number" min="1" placeholder="VD: 20" className="input-field" value={newRoom.area} onChange={e => setNewRoom({...newRoom, area: e.target.value})} />
                </div>
              </div>
              <div>
                <label style={{ color: '#8896a8', fontSize: 12, fontWeight: 600 }}>Giá thuê (VNĐ/tháng)</label>
                <input required type="number" min={floorPrice} placeholder="VD: 3000000" className="input-field" value={newRoom.price} onChange={e => setNewRoom({...newRoom, price: e.target.value})} />
                {floorPrice > 0 && (
                  <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 6, fontStyle: 'italic' }}>* Tối thiểu: {floorPrice.toLocaleString('vi-VN')} ₫</div>
                )}
              </div>
              <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: 14, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, marginTop: 8, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo phòng'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}