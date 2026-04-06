'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

// 1. Interfaces
interface Property { id: string; name: string; }
interface Room { id: string; roomNumber: string; status: string; price: number; }
interface Tenant { id: string; name: string; phone: string; email?: string; idCard?: string; deposit: number; startDate: string; status: string; room?: Room; }

interface FormDataState {
  name: string; 
  phone: string; 
  email: string; 
  idCard: string; 
  deposit: string; 
  startDate: string; 
  roomId: string; 
  status: string;
}

interface ModalFormProps {
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  title: string;
  isEdit?: boolean;
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  availableRooms?: Room[];
}

// 2. Styles
const modalInputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #252d3d', background: '#161a21', color: '#e8e8e8', outline: 'none', fontSize: 14, fontFamily: 'inherit' };
const modalLabelStyle = { display: 'block' as const, fontSize: 11.5, color: '#4a5568', textTransform: 'uppercase' as const, marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em' };

// 3. ModalForm Component
const ModalForm = ({ onSubmit, onClose, title, isEdit, formData, setFormData, availableRooms }: ModalFormProps) => (
  <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
    <div style={{ width: 520, background: '#1e2330', border: '1px solid #252d3d', borderRadius: 14, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0' }}>{title}</div>
        <button type="button" onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: '#222836', border: '1px solid #252d3d', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={modalLabelStyle}>Họ và tên</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={modalInputStyle} /></div>
          {isEdit ? (
            <div>
              <label style={modalLabelStyle}>Trạng thái</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ ...modalInputStyle, cursor: 'pointer' }}>
                <option value="ACTIVE">Đang ở</option>
                <option value="INACTIVE">Đã chuyển đi</option>
              </select>
            </div>
          ) : (
            <div>
              <label style={modalLabelStyle}>Chọn phòng</label>
              <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} style={{ ...modalInputStyle, cursor: 'pointer' }}>
                <option value="">-- Chọn phòng trống --</option>
                {availableRooms?.map((r: Room) => <option key={r.id} value={r.id}>Phòng {r.roomNumber} — {r.price.toLocaleString()}₫</option>)}
              </select>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={modalLabelStyle}>Số điện thoại</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={modalInputStyle} /></div>
          <div><label style={modalLabelStyle}>Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={modalInputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={modalLabelStyle}>CCCD/CMND</label><input value={formData.idCard} onChange={e => setFormData({...formData, idCard: e.target.value})} style={modalInputStyle} /></div>
          <div><label style={modalLabelStyle}>Tiền cọc (₫)</label><input type="number" required value={formData.deposit} onChange={e => setFormData({...formData, deposit: e.target.value})} style={modalInputStyle} /></div>
        </div>
        {!isEdit && (
          <div style={{ marginBottom: 22 }}><label style={modalLabelStyle}>Ngày vào ở</label><input type="date" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={modalInputStyle} /></div>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: isEdit ? 22 : 0 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #252d3d', background: 'transparent', color: '#8896a8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Hủy</button>
          <button type="submit" style={{ flex: 2, padding: '11px', borderRadius: 8, background: '#fff', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>
            {isEdit ? 'Lưu thay đổi' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// 4. Main Component
export default function TenantsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<FormDataState>({ name: '', phone: '', email: '', idCard: '', deposit: '', startDate: '', roomId: '', status: 'ACTIVE' });
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://luanez-backend.onrender.com';

  const fetchProperties = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const res = await axios.get(`${API_URL}/property`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties(res.data);
      if (res.data.length > 0) setSelectedPropertyId(res.data[0].id);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }, [router, API_URL]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const fetchTenantsAndRooms = useCallback(async () => {
    if (!selectedPropertyId) return;
    const token = localStorage.getItem('token');
    try {
      const [tenantsRes, roomsRes] = await Promise.all([
        axios.get(`${API_URL}/tenant?propertyId=${selectedPropertyId}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/room?propertyId=${selectedPropertyId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTenants(tenantsRes.data);
      setRooms(roomsRes.data);
    } catch (e) { console.error(e); }
  }, [selectedPropertyId, API_URL]);

  useEffect(() => { fetchTenantsAndRooms(); }, [fetchTenantsAndRooms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔥 CHỐT CHẶN: Kiểm tra trùng lặp
    const isDuplicatePhone = tenants.some(t => t.phone === formData.phone);
    const isDuplicateID = tenants.some(t => formData.idCard && t.idCard === formData.idCard);
    const isDuplicateName = tenants.some(t => t.name.toLowerCase().trim() === formData.name.toLowerCase().trim());

    if (isDuplicatePhone) {
      alert('⚠️ Số điện thoại này đã tồn tại trong danh sách khách thuê của khu trọ này!');
      return;
    }
    if (isDuplicateID) {
      alert('⚠️ Số CCCD/CMND này đã tồn tại trong hệ thống khu trọ này!');
      return;
    }
    if (isDuplicateName) {
      const confirmAdd = window.confirm(`⚠️ Tên "${formData.name}" đã có trong danh sách. Bạn có chắc chắn muốn thêm một khách mới trùng tên không?`);
      if (!confirmAdd) return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/tenant`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false);
      setFormData({ name: '', phone: '', email: '', idCard: '', deposit: '', startDate: new Date().toISOString().split('T')[0], roomId: '', status: 'ACTIVE' });
      fetchTenantsAndRooms();
    } catch { alert('Lỗi khi thêm khách thuê!'); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    // 🔥 Chặn trùng khi sửa (trừ chính nó)
    const isDuplicatePhone = tenants.some(t => t.phone === formData.phone && t.id !== editingTenant.id);
    if (isDuplicatePhone) {
      alert('⚠️ Không thể cập nhật: Số điện thoại này đã được dùng bởi khách thuê khác!');
      return;
    }

    const token = localStorage.getItem('token');
    try {
      await axios.patch(`${API_URL}/tenant/${editingTenant.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setShowEditModal(false); setEditingTenant(null); fetchTenantsAndRooms();
    } catch { alert('Lỗi cập nhật!'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa khách này? Dữ liệu này không thể khôi phục.')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/tenant/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchTenantsAndRooms();
    } catch { alert('Không thể xóa!'); }
  };

  // ==========================================
  // 🔥 XỬ LÝ TRẢ PHÒNG NHANH (CÓ CHUYỂN TRANG)
  // ==========================================
  const handleCheckoutTenant = async (roomId: string, tenantName: string) => {
    if (!roomId) return alert('Khách này không gắn với phòng nào!');
    const confirm = window.confirm(`Làm thủ tục trả phòng cho khách ${tenantName}? Hệ thống sẽ chốt hóa đơn và cắt tiền phòng lẻ nếu có.`);
    if (!confirm) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/room/${roomId}/checkout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${res.data.message}`);
      
      // Hỏi sếp xem có muốn đi thẳng qua trang Hóa đơn không
      const viewInvoice = window.confirm('Sếp có muốn đi tới trang Hóa đơn để xem chi tiết và in không?');
      if (viewInvoice) {
         router.push('/invoices');
      } else {
         fetchTenantsAndRooms(); // Không xem thì load lại bảng khách thuê
      }
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        alert(`⚠️ ${error.response?.data?.message || 'Lỗi trả phòng!'}`);
      } else {
        alert('⚠️ Lỗi hệ thống khi trả phòng!');
      }
    }
  };

  const openEditModal = (t: Tenant) => {
    setEditingTenant(t);
    setFormData({ 
      name: t.name, 
      phone: t.phone, 
      email: t.email || '', 
      idCard: t.idCard || '', 
      deposit: String(t.deposit), 
      startDate: t.startDate.split('T')[0], 
      roomId: t.room?.id || '', 
      status: t.status 
    });
    setShowEditModal(true);
  };

  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE');

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
        .tbl-row { border-bottom: 1px solid #1e2330; transition: background 0.12s; }
        .tbl-row:last-child { border-bottom: none; }
        .tbl-row:hover { background: rgba(255,255,255,0.02); }
        .row-actions { opacity: 0.5; transition: opacity 0.15s; display: flex; gap: 6px; justify-content: flex-end; }
        .tbl-row:hover .row-actions { opacity: 1; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease-out forwards; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Khách thuê</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}
              style={{ background: '#222836', color: '#e8e8e8', border: '1px solid #252d3d', padding: '6px 12px', borderRadius: 7, fontSize: 13, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              {properties.length === 0 && <option value="">Chưa có khu trọ</option>}
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button disabled={!selectedPropertyId}
              onClick={() => { setFormData({ name: '', phone: '', email: '', idCard: '', deposit: '', startDate: new Date().toISOString().split('T')[0], roomId: '', status: 'ACTIVE' }); setShowModal(true); }}
              style={{ padding: '7px 16px', borderRadius: 8, background: selectedPropertyId ? '#fff' : '#222836', color: selectedPropertyId ? '#000' : '#6b7280', border: 'none', fontSize: 13, fontWeight: 700, cursor: selectedPropertyId ? 'pointer' : 'not-allowed', transition: 'all 0.15s', fontFamily: 'inherit' }}>
              + Thêm khách
            </button>
          </div>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#1a1f28' }}>
          <div style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Quản lý Khách thuê</h2>
            <p style={{ color: '#4a5568', fontSize: 13.5 }}>Hồ sơ khách hàng và quản lý hợp đồng.</p>
          </div>

          <div style={{ background: '#161a21', border: '1px solid #1e2330', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #1e2330', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#c8d0e0' }}>Danh sách khách thuê</span>
              <span style={{ fontSize: 12, color: '#2a3040' }}>{tenants.length} khách</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#131820', borderBottom: '1px solid #1e2330' }}>
                  {['Khách thuê', 'Liên hệ / CCCD', 'Phòng', 'Tiền cọc', 'Trạng thái', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 20px', textAlign: i === 5 ? 'right' : 'left', fontSize: 11.5, fontWeight: 600, color: '#2a3040', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '56px 20px', textAlign: 'center', color: '#4a5568', fontSize: 14 }}>Khu trọ này hiện chưa có khách thuê nào.</td></tr>
                ) : tenants.map(item => (
                  <tr key={item.id} className="tbl-row">
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 18, background: '#222836', border: '1px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#8896a8', flexShrink: 0 }}>{item.name.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#d0d8e8', marginBottom: 3 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: '#4a5568' }}>Vào ở: {new Date(item.startDate).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div style={{ fontSize: 13, color: '#d0d8e8', marginBottom: 3 }}>📞 {item.phone}</div>
                      <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 2 }}>✉️ {item.email || 'Chưa cập nhật'}</div>
                      <div style={{ fontSize: 11.5, color: '#2a3040' }}>💳 {item.idCard || 'Chưa cập nhật'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>P. {item.room?.roomNumber || '—'}</span>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle', fontSize: 13.5, fontWeight: 600, color: '#fbbf24' }}>
                      {item.deposit.toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5,
                        ...(item.status === 'ACTIVE' ? { background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' } : { background: 'rgba(255,255,255,0.04)', color: '#6b7280', border: '1px solid #252d3d' }) }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
                        {item.status === 'ACTIVE' ? 'Đang ở' : 'Đã rời đi'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', verticalAlign: 'middle' }}>
                      <div className="row-actions">
                        <button onClick={() => openEditModal(item)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12.5, border: '1px solid #252d3d', background: 'transparent', color: '#8896a8', cursor: 'pointer', fontFamily: 'inherit', transition: '0.15s' }}
                          onMouseOver={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#354055'; e.currentTarget.style.background = '#222836'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#8896a8'; e.currentTarget.style.borderColor = '#252d3d'; e.currentTarget.style.background = 'transparent'; }}>Sửa</button>
                        
                        {/* 🔥 THÊM NÚT TRẢ PHÒNG NHANH TẠI ĐÂY */}
                        {item.status === 'ACTIVE' && (
                          <button onClick={() => handleCheckoutTenant(item.room?.id || '', item.name)}
                            style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12.5, border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.05)', color: '#34d399', cursor: 'pointer', fontFamily: 'inherit', transition: '0.15s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(52,211,153,0.1)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(52,211,153,0.05)'}>Trả phòng</button>
                        )}

                        <button onClick={() => handleDelete(item.id)} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12.5, border: '1px solid rgba(248,113,113,0.2)', background: 'rgba(248,113,113,0.06)', color: '#f87171', cursor: 'pointer', fontFamily: 'inherit', transition: '0.15s' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && <ModalForm onSubmit={handleCreate} onClose={() => setShowModal(false)} title="Thêm Khách Thuê Mới" formData={formData} setFormData={setFormData} availableRooms={availableRooms} />}
      {showEditModal && <ModalForm onSubmit={handleUpdate} onClose={() => setShowEditModal(false)} title="Cập nhật Khách Thuê" isEdit formData={formData} setFormData={setFormData} />}
    </div>
  );
}