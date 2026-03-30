'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

interface Room {
  id: string;
  roomNumber: string;
  price: number;
  status: string;
  area: number;
}

interface Property {
  id: string;
  name: string;
  address: string;
  createdAt?: string;
  rooms?: Room[];
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [search] = useState('');
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    
    try {
      const res = await axios.get(API_URL + '/property', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(res.data);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(API_URL + '/property',
        { name: newName, address: newAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowModal(false); setNewName(''); setNewAddress(''); fetchData();
    } catch { alert('Không thể tạo khu trọ mới!'); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;
    const token = localStorage.getItem('token');
    try {
      await axios.patch(`${API_URL}/property/${editingProperty.id}`,
        { name: editName, address: editAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowEditModal(false); setEditingProperty(null); fetchData();
    } catch { alert('Không thể cập nhật khu trọ!'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khu trọ này không?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/property/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch { alert('Không thể xóa khu trọ này!'); }
  };

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase())
  );

  const totalRooms = properties.reduce((s, p) => s + (p.rooms?.length || 0), 0);
  const rentedRooms = properties.reduce((s, p) => s + (p.rooms?.filter(r => r.status !== 'AVAILABLE').length || 0), 0);
  const totalRevenue = properties.reduce((s, p) => s + (p.rooms?.filter(r => r.status !== 'AVAILABLE').reduce((rs, r) => rs + r.price, 0) || 0), 0);
  const avgOccupancy = totalRooms === 0 ? 0 : Math.round((rentedRooms / totalRooms) * 100);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #2a3040', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 13, color: '#6b7280', fontFamily: 'system-ui' }}>Đang tải...</span>
      </div>
    </div>
  );

  const statCards = [
    {
      label: 'Tổng khu trọ',
      value: properties.length,
      suffix: '',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round"/></svg>),
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)',
    },
    {
      label: 'Tổng phòng',
      value: totalRooms,
      suffix: ' phòng',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="#fff" strokeWidth="1.3"/><path d="M1.5 6.5H13.5M7.5 6.5V12.5" stroke="#fff" strokeWidth="1.3"/></svg>),
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.08)',
    },
    {
      label: 'Tỉ lệ lấp đầy',
      value: avgOccupancy,
      suffix: '%',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M2 11L5.5 7L8.5 9.5L13 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
      color: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
    },
    {
      label: 'Doanh thu DK',
      value: totalRevenue >= 1000000 ? `${(totalRevenue / 1000000).toFixed(1)}M` : `${totalRevenue.toLocaleString()}`,
      suffix: ' ₫',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="#fff" strokeWidth="1.3"/><path d="M7.5 4v7M5.5 5.5h2.5a1.5 1.5 0 010 3H5.5M5.5 9.5H9" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/></svg>),
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', fontFamily: '"Geist", "DM Sans", system-ui, sans-serif', color: '#e8e8e8', fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #354055; }

        .stat-card {
          background: #111;
          border: 1px solid #252d3d;
          border-radius: 12px;
          padding: 20px 22px;
          flex: 1;
          transition: border-color 0.2s;
          position: relative;
          overflow: hidden;
        }
        .stat-card:hover { border-color: #303848; }

        .tbl-row { border-bottom: 1px solid #1e2330; transition: background 0.12s; }
        .tbl-row:last-child { border-bottom: none; }
        .tbl-row:hover { background: rgba(255,255,255,0.02); }
        .tbl-row:hover .row-actions { opacity: 1; }
        .row-actions { opacity: 0; transition: opacity 0.15s; display: flex; gap: 6px; justify-content: flex-end; }
        
        .btn-ghost {
          padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
          border: 1px solid #2a3040; background: transparent; color: #666;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .btn-ghost:hover { border-color: #333; color: #ccc; background: #1e2330; }
        .btn-danger:hover { border-color: rgba(239,68,68,0.4) !important; color: #ef4444 !important; background: rgba(239,68,68,0.08) !important; }
        .btn-primary-sm {
          padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
          border: none; background: #2a3040836; color: #a0a0a0;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .btn-primary-sm:hover { background: #fff; color: #000; }

        .badge-active {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 20px; font-size: 11.5px; font-weight: 500;
          background: rgba(16,185,129,0.08); color: #34d399; border: 1px solid rgba(52,211,153,0.15);
        }
        .badge-dot { width: 5px; height: 5px; border-radius: 50%; background: #34d399; }

        .progress-track { width: 100%; height: 4px; background: #252d3d; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease-out forwards; }

        @keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .overlay-anim { animation: overlayIn 0.2s ease-out; }
        .modal-anim { animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }

        .add-property-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 8px;
          background: #fff; color: #000; border: none;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: all 0.15s; font-family: inherit;
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        }
        .add-property-btn:hover { background: #f0f0f0; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }

        .modal-input {
          width: 100%; padding: 10px 14px; border-radius: 8px;
          border: 1px solid #2a3040; background: #161a21;
          color: #e8e8e8; font-size: 13.5px; outline: none;
          transition: all 0.15s; font-family: inherit;
        }
        .modal-input:focus { border-color: #444; box-shadow: 0 0 0 3px rgba(255,255,255,0.04); }
        .modal-input::placeholder { color: #444; }

        .modal-submit {
          flex: 1; padding: 11px; border-radius: 8px; font-size: 13.5px; font-weight: 600;
          border: none; background: #fff; color: #000; cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .modal-submit:hover { background: #f0f0f0; }
        .modal-cancel {
          flex: 1; padding: 11px; border-radius: 8px; font-size: 13.5px; font-weight: 500;
          border: 1px solid #2a3040; background: transparent; color: #666;
          cursor: pointer; transition: all 0.15s; font-family: inherit;
        }
        .modal-cancel:hover { background: #1e2330; color: #aaa; border-color: #303848; }
      `}</style>

      {/* ── SIDEBAR (COMPONENT DÙNG CHUNG) ── */}
      <Sidebar />

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#4a5568' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#333" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#888', fontWeight: 500 }}>Khu trọ</span>
          </div>
          <button className="add-property-btn" onClick={() => setShowModal(true)}>
            <svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Thêm khu mới
          </button>
        </div>

        {/* Scrollable body */}
        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 40px', background: '#1a1f28' }}>

          {/* Page title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Khu trọ</h1>
            <p style={{ fontSize: 13.5, color: '#6b7280' }}>Quản lý toàn bộ tài sản cho thuê của bạn</p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {statCards.map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, letterSpacing: '0.01em' }}>{s.label}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" style={{ color: s.color }}>
                      {/* icon handled inline */}
                    </svg>
                    <span style={{ color: s.color, display: 'flex' }}>{s.icon}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <span style={{ fontSize: 26, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>{s.suffix}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#161a21', border: '1px solid #2a3040836', borderRadius: 12, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2330', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#bbb' }}>Danh sách khu trọ</span>
              <span style={{ fontSize: 12, color: '#4a5568' }}>{filtered.length} khu</span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e2330' }}>
                  {['Tên / Địa chỉ', 'Trạng thái', 'Lấp đầy', 'Doanh thu', 'Ngày tạo', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 20px',
                      textAlign: i === 5 ? 'right' : 'left',
                      fontSize: 11.5,
                      fontWeight: 600,
                      color: '#4a5568',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      background: '#111318',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1e2330', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="18" height="18" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="#444" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, color: '#8896a8', fontWeight: 500, marginBottom: 4 }}>Chưa có khu trọ nào</div>
                          <div style={{ fontSize: 12.5, color: '#4a5568' }}>Bấm nút &quot;Thêm khu mới&quot; để bắt đầu</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(item => {
                  const rooms = item.rooms || [];
                  const totalR = rooms.length;
                  const rentedR = rooms.filter(r => r.status !== 'AVAILABLE').length;
                  const revenue = rooms.filter(r => r.status !== 'AVAILABLE').reduce((s, r) => s + r.price, 0);
                  const pct = totalR === 0 ? 0 : Math.round((rentedR / totalR) * 100);
                  const progressColor = pct >= 80 ? '#34d399' : pct >= 40 ? '#f59e0b' : '#f87171';

                  return (
                    <tr key={item.id} className="tbl-row">
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#1e2330', border: '1px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="#555" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#ddd', marginBottom: 3 }}>{item.name}</div>
                            <div style={{ fontSize: 12, color: '#4a5568', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.address}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span className="badge-active">
                          <span className="badge-dot" />
                          Hoạt động
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', minWidth: 140 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: '#888' }}>{rentedR}/{totalR} phòng</span>
                            <span style={{ color: progressColor, fontWeight: 600 }}>{pct}%</span>
                          </div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: progressColor }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.3px' }}>
                          {revenue > 0 ? `${(revenue / 1000000).toFixed(1)}M ₫` : <span style={{ color: '#303848', fontWeight: 400, fontSize: 13 }}>—</span>}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: 12.5, color: '#4a5568', whiteSpace: 'nowrap' }}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                        <div className="row-actions">
                          <button className="btn-ghost" onClick={() => { setEditingProperty(item); setEditName(item.name); setEditAddress(item.address); setShowEditModal(true); }}>Sửa</button>
                          <button className="btn-ghost btn-danger" onClick={() => handleDelete(item.id)}>Xóa</button>
                          <button className="btn-primary-sm" onClick={() => router.push(`/property/${item.id}`)}>Quản lý →</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL TẠO MỚI ── */}
      {showModal && (
        <div className="overlay-anim" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="modal-anim" style={{ width: 420, background: '#161a21', border: '1px solid #2a3040', borderRadius: 14, padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 3 }}>Thêm khu trọ mới</div>
                <div style={{ fontSize: 12.5, color: '#6b7280' }}>Nhập thông tin cơ bản để tạo khu mới</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e2330', border: '1px solid #2a3040', color: '#8896a8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}
                onMouseOver={e => e.currentTarget.style.background = '#2a3040'} onMouseOut={e => e.currentTarget.style.background = '#1e2330'}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, color: '#6b7280', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tên khu trọ</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="VD: Nhà Trọ HUTECH" className="modal-input" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11.5, color: '#6b7280', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Địa chỉ</label>
                <input required value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Số nhà, đường, quận..." className="modal-input" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} className="modal-cancel">Hủy</button>
                <button type="submit" className="modal-submit">Tạo khu trọ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL CẬP NHẬT ── */}
      {showEditModal && (
        <div className="overlay-anim" onClick={e => { if (e.target === e.currentTarget) setShowEditModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="modal-anim" style={{ width: 420, background: '#161a21', border: '1px solid #2a3040', borderRadius: 14, padding: '24px', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 3 }}>Cập nhật khu trọ</div>
                <div style={{ fontSize: 12.5, color: '#6b7280' }}>Chỉnh sửa thông tin khu trọ</div>
              </div>
              <button onClick={() => setShowEditModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#1e2330', border: '1px solid #2a3040', color: '#8896a8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}
                onMouseOver={e => e.currentTarget.style.background = '#2a3040'} onMouseOut={e => e.currentTarget.style.background = '#1e2330'}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11.5, color: '#6b7280', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Tên khu trọ</label>
                <input required value={editName} onChange={e => setEditName(e.target.value)} className="modal-input" />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 11.5, color: '#6b7280', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Địa chỉ</label>
                <input required value={editAddress} onChange={e => setEditAddress(e.target.value)} className="modal-input" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="modal-cancel">Hủy</button>
                <button type="submit" className="modal-submit">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}