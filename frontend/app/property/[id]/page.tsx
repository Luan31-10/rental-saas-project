'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter, useParams } from 'next/navigation';

interface Tenant { id: string; name: string; phone: string; status: string; }
interface Room { id: string; roomNumber: string; price: number; area: number; status: string; tenants?: Tenant[]; }

export default function PropertyDetail() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const [userInfo, setUserInfo] = useState({ name: 'Admin', initial: 'L' });
  const [showModal, setShowModal] = useState(false);
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newArea, setNewArea] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editStatus, setEditStatus] = useState('AVAILABLE');

  const parseJwt = (token: string) => { try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; } };

  const loadData = useCallback(async () => {
    if (!propertyId || propertyId === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const decoded = parseJwt(token);
    if (decoded?.email) { const n = decoded.email.split('@')[0]; setUserInfo({ name: n, initial: n.charAt(0).toUpperCase() }); }
    try {
      const res = await axios.get(`http://localhost:3000/room?propertyId=${propertyId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [propertyId, router]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.post('http://localhost:3000/room', { roomNumber: newRoomNumber, price: Number(newPrice), area: Number(newArea), propertyId }, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false); setNewRoomNumber(''); setNewPrice(''); setNewArea('');
      setRooms(prev => [...prev, res.data]);
    } catch { alert('Không thể tạo phòng mới!'); }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.patch(`http://localhost:3000/room/${editingRoom.id}`, { roomNumber: editRoomNumber, price: Number(editPrice), area: Number(editArea), status: editStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditModal(false); setEditingRoom(null);
      setRooms(prev => prev.map(r => r.id === editingRoom.id ? res.data : r));
    } catch { alert('Không thể cập nhật phòng!'); }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phòng này không?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:3000/room/${roomId}`, { headers: { Authorization: `Bearer ${token}` } });
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch { alert('Không thể xóa phòng này!'); }
  };

  const navGroups = [
    { label: 'Tổng quan', items: [
      { key: 'overview', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/></svg>), label: 'Dashboard', path: '/admin' },
      { key: 'reports', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 11L5.5 7L8.5 9.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>), label: 'Báo cáo', path: '/reports' },
    ]},
    { label: 'Quản lý', items: [
      { key: 'properties', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>), label: 'Khu trọ', path: '/' },
      { key: 'rooms', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5H13.5M7.5 6.5V12.5" stroke="currentColor" strokeWidth="1.3"/></svg>), label: 'Phòng trọ', path: '/rooms' },
      { key: 'ai-agent', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7.5C5 6.12 6.12 5 7.5 5s2.5 1.12 2.5 2.5S8.88 10 7.5 10 5 8.88 5 7.5Z" fill="currentColor" opacity=".6"/></svg>), label: 'Trợ lý AI', path: '/ai-agent' },
      { key: 'tenants', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-3.04 2.46-5.5 5.5-5.5S13 9.96 13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Khách thuê', path: '/tenants' },
    ]},
    { label: 'Tài chính', items: [
      { key: 'invoices', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1.5" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5.5H10M5 8H10M5 10.5H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Hóa đơn', path: '/invoices' },
      { key: 'revenue', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 4.5V7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Doanh thu', path: '#' },
    ]},
    { label: 'Hệ thống', items: [
      { key: 'settings', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Cài đặt', path: '/settings' },
    ]},
  ];

  const totalRooms = rooms.length;
  const rentedRooms = rooms.filter(r => r.status !== 'AVAILABLE').length;
  const availableRooms = totalRooms - rentedRooms;
  const revenue = rooms.filter(r => r.status !== 'AVAILABLE').reduce((s, r) => s + r.price, 0);
  const occupancy = totalRooms === 0 ? 0 : Math.round((rentedRooms / totalRooms) * 100);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #222836', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    AVAILABLE:   { label: 'Trống',    color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)' },
    OCCUPIED:    { label: 'Đã thuê',  color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
    MAINTENANCE: { label: 'Bảo trì',  color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)' },
  };

  const modalInputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #252d3d', background: '#161a21', color: '#e8e8e8', outline: 'none', fontSize: 14, fontFamily: 'inherit' };
  const modalLabelStyle = { display: 'block' as const, fontSize: 11.5, color: '#4a5568', textTransform: 'uppercase' as const, marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em' };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e8e8e8', fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }
        .nav-item { display: flex; align-items: center; gap: 9px; padding: 6px 10px; border-radius: 7px; cursor: pointer; color: #6b7280; font-size: 13px; font-weight: 450; transition: all 0.15s; margin-bottom: 1px; }
        .nav-item:hover { color: #d0d8e8; background: rgba(255,255,255,0.04); }
        .nav-item.active { color: #f0f0f0; background: rgba(255,255,255,0.07); font-weight: 500; }
        .nav-item svg { opacity: 0.5; flex-shrink: 0; }
        .nav-item.active svg { opacity: 1; }
        .room-card { background: #1e2330; border: 1px solid #252d3d; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; transition: all 0.2s; }
        .room-card:hover { border-color: #354055; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease-out forwards; }
        input:focus, select:focus { border-color: #3d4a6b !important; outline: none !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.08) !important; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 220, flexShrink: 0, background: '#161a21', borderRight: '1px solid #1e2330', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 14px 14px', borderBottom: '1px solid #1e2330' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" fill="#000"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>LuanEZ</div>
              <div style={{ fontSize: 11, color: '#4a5568' }}>Quản lý nhà trọ</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2330', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: '#222836', border: '1px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#8896a8', flexShrink: 0 }}>{userInfo.initial}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c8d0e0', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userInfo.name}</div>
            <div style={{ fontSize: 11, color: '#2a3040' }}>Chủ nhà trọ</div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '10px', overflowY: 'auto' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: '#2a3040', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 5 }}>{group.label}</div>
              {group.items.map(item => (
                <div key={item.key} className={`nav-item${item.key === 'properties' ? ' active' : ''}`}
                  onClick={() => item.path !== '#' ? router.push(item.path) : alert('Đang phát triển')}>
                  {item.icon}{item.label}
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* HEADER */}
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span onClick={() => router.push('/')} style={{ color: '#6b7280', cursor: 'pointer', transition: '0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = '#d0d8e8'} onMouseOut={e => e.currentTarget.style.color = '#6b7280'}>Khu trọ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Quản lý phòng</span>
          </div>
          <button onClick={() => router.push('/')}
            style={{ padding: '6px 14px', background: '#222836', border: '1px solid #252d3d', color: '#8896a8', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: '0.15s' }}
            onMouseOver={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#354055'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#8896a8'; e.currentTarget.style.borderColor = '#252d3d'; }}>
            ← Trở về
          </button>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Chi tiết khu trọ</h2>
              <p style={{ color: '#4a5568', fontSize: 13.5 }}>Quản lý phòng và theo dõi tình trạng cho thuê.</p>
            </div>
            <button onClick={() => setShowModal(true)}
              style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: '0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
              onMouseOver={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              + Thêm Phòng Mới
            </button>
          </div>

          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Tổng số phòng', value: String(totalRooms), color: '#34d399' },
              { label: 'Đang cho thuê', value: String(rentedRooms) + (totalRooms > 0 ? ` (${occupancy}%)` : ''), color: '#60a5fa' },
              { label: 'Phòng trống', value: String(availableRooms), color: '#fbbf24' },
              { label: 'Doanh thu/tháng', value: revenue > 0 ? `${(revenue/1000000).toFixed(1)}M ₫` : '— ₫', color: '#f0f0f0' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#1e2330', border: '1px solid #252d3d', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 11.5, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #1e2330', marginBottom: 28 }} />

          {/* ROOMS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {rooms.length === 0 ? (
              <div style={{ gridColumn: '1/-1', padding: 48, textAlign: 'center', background: '#1e2330', borderRadius: 12, border: '1px dashed #252d3d' }}>
                <p style={{ color: '#4a5568', margin: 0, fontSize: 14 }}>Khu trọ này chưa có phòng nào.</p>
              </div>
            ) : rooms.map(room => {
              const s = statusConfig[room.status] || statusConfig.AVAILABLE;
              const activeTenant = room.tenants?.find(t => t.status === 'ACTIVE');
              return (
                <div key={room.id} className="room-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, background: '#161a21', border: '1px solid #252d3d', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="#6b7280" strokeWidth="1.3"/><path d="M1.5 6.5H13.5M7.5 6.5V12.5" stroke="#6b7280" strokeWidth="1.3"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phòng</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0f0' }}>{room.roomNumber}</div>
                      </div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600 }}>{s.label}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#161a21', padding: '12px 14px', borderRadius: 9, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Diện tích</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#d0d8e8' }}>{room.area} m²</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10.5, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Giá thuê</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0' }}>{room.price.toLocaleString('vi-VN')} ₫</div>
                    </div>
                  </div>

                  <div style={{ padding: '8px 12px', background: '#161a21', borderRadius: 8, marginBottom: 14, borderLeft: `2px solid ${activeTenant ? '#3d4a6b' : '#252d3d'}` }}>
                    {activeTenant ? (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="2.5" stroke="#6b7280" strokeWidth="1.3"/><path d="M2 13c0-3.04 2.46-5.5 5.5-5.5S13 9.96 13 13" stroke="#6b7280" strokeWidth="1.3" strokeLinecap="round"/></svg>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#d0d8e8' }}>{activeTenant.name}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: '#4a5568', paddingLeft: 18 }}>📞 {activeTenant.phone}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 12.5, color: '#2a3040', fontStyle: 'italic' }}>Chưa có người thuê</div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button onClick={() => { setEditingRoom(room); setEditRoomNumber(room.roomNumber); setEditPrice(String(room.price)); setEditArea(String(room.area)); setEditStatus(room.status); setShowEditModal(true); }}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: '1px solid #252d3d', background: 'transparent', color: '#8896a8', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onMouseOver={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#354055'; e.currentTarget.style.background = '#222836'; }}
                      onMouseOut={e => { e.currentTarget.style.color = '#8896a8'; e.currentTarget.style.borderColor = '#252d3d'; e.currentTarget.style.background = 'transparent'; }}>Sửa</button>
                    <button onClick={() => handleDeleteRoom(room.id)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)', color: '#f87171', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(248,113,113,0.12)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}>Xóa</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL ADD */}
      {showModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: 420, background: '#1e2330', border: '1px solid #252d3d', borderRadius: 14, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>Thêm phòng mới</div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#222836', border: '1px solid #252d3d', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateRoom}>
              <div style={{ marginBottom: 14 }}><label style={modalLabelStyle}>Số / Tên phòng</label><input required value={newRoomNumber} onChange={e => setNewRoomNumber(e.target.value)} placeholder="VD: 101" style={modalInputStyle} /></div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1 }}><label style={modalLabelStyle}>Giá thuê (₫)</label><input type="number" required value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="0" style={modalInputStyle} /></div>
                <div style={{ flex: 1 }}><label style={modalLabelStyle}>Diện tích (m²)</label><input type="number" required value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="0" style={modalInputStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #252d3d', background: 'transparent', color: '#8896a8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Hủy</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 8, background: '#fff', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Lưu phòng</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {showEditModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: 420, background: '#1e2330', border: '1px solid #252d3d', borderRadius: 14, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>Cập nhật phòng</div>
              <button onClick={() => setShowEditModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#222836', border: '1px solid #252d3d', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpdateRoom}>
              <div style={{ marginBottom: 14 }}><label style={modalLabelStyle}>Số / Tên phòng</label><input required value={editRoomNumber} onChange={e => setEditRoomNumber(e.target.value)} style={modalInputStyle} /></div>
              <div style={{ marginBottom: 14 }}>
                <label style={modalLabelStyle}>Trạng thái</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ ...modalInputStyle, cursor: 'pointer' }}>
                  <option value="AVAILABLE">Trống</option>
                  <option value="OCCUPIED">Đã Thuê</option>
                  <option value="MAINTENANCE">Bảo Trì</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1 }}><label style={modalLabelStyle}>Giá thuê (₫)</label><input type="number" required value={editPrice} onChange={e => setEditPrice(e.target.value)} style={modalInputStyle} /></div>
                <div style={{ flex: 1 }}><label style={modalLabelStyle}>Diện tích (m²)</label><input type="number" required value={editArea} onChange={e => setEditArea(e.target.value)} style={modalInputStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #252d3d', background: 'transparent', color: '#8896a8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Hủy</button>
                <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 8, background: '#fff', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}