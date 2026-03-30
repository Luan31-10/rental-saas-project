'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import Sidebar from '@/components/Sidebar'; // 🔥 ĐÃ IMPORT SIDEBAR

interface Tenant { id: string; name: string; phone: string; email?: string; status: string; }
interface Room { id: string; roomNumber: string; status: string; price: number; tenants: Tenant[]; }
interface Property { id: string; name: string; }
interface Invoice { id: string; amount: number; electricity: number; water: number; status: string; month: number; year: number; room?: Room; }

export default function InvoicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ roomId: '', electricity: '', water: '' });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const [pdfInvoice, setPdfInvoice] = useState<Invoice | null>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');
    try {
      const res = await axios.get(API_URL + '/property', { headers: { Authorization: `Bearer ${token}` } });
      setProperties(res.data);
      if (res.data.length > 0 && !selectedPropertyId) setSelectedPropertyId(res.data[0].id);
    } catch { router.push('/login'); }
    finally { setLoading(false); }
  }, [router, selectedPropertyId]);

  const fetchInvoicesAndRooms = useCallback(async () => {
    if (!selectedPropertyId) return;
    const token = localStorage.getItem('token');
    try {
      const [invRes, roomRes] = await Promise.all([
        axios.get(`${API_URL}/invoice?propertyId=${selectedPropertyId}&month=${filter.month}&year=${filter.year}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/room?propertyId=${selectedPropertyId}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const currentInvoices = invRes.data;
      setInvoices(currentInvoices);
      const billedRoomIds = currentInvoices.map((inv: Invoice) => inv.room?.id);
      const validRooms = roomRes.data.filter((r: Room) => r.status === 'OCCUPIED' && r.tenants && r.tenants.length > 0 && !billedRoomIds.includes(r.id));
      setRooms(validRooms);
    } catch (err) { console.error(err); }
  }, [selectedPropertyId, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchInvoicesAndRooms(); }, [fetchInvoicesAndRooms]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(API_URL + '/invoice', { ...formData, electricity: Number(formData.electricity), water: Number(formData.water), month: filter.month, year: filter.year }, { headers: { Authorization: `Bearer ${token}` } });
      setShowModal(false);
      setFormData({ roomId: '', electricity: '', water: '' });
      fetchInvoicesAndRooms();
    } catch (error) {
      if (axios.isAxiosError(error)) alert(error.response?.data?.message || 'Lỗi khi tạo hóa đơn');
      else alert('Lỗi khi tạo hóa đơn');
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const token = localStorage.getItem('token');
    const newStatus = currentStatus === 'PENDING' ? 'PAID' : 'PENDING';
    try {
      await axios.patch(`${API_URL}/invoice/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchInvoicesAndRooms();
    } catch { alert('Lỗi cập nhật'); }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/invoice/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchInvoicesAndRooms();
    } catch { alert('Lỗi xóa hóa đơn'); }
  };

  const handleSendEmail = async (inv: Invoice) => {
    if (!window.confirm(`Gửi email nhắc nợ đến Phòng ${inv.room?.roomNumber}?`)) return;
    
    setSendingEmailId(inv.id);
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/invoice/${inv.id}/send-email`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert(`✅ Đã gửi email thành công đến phòng ${inv.room?.roomNumber}!`);
    } catch (error) {
      if (axios.isAxiosError(error)) alert(error.response?.data?.message || 'Lỗi khi gửi email');
      else alert('Lỗi không xác định khi gửi email!');
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleExportPDF = (inv: Invoice) => {
    setPdfInvoice(inv); 
    setTimeout(async () => {
      if (pdfRef.current) {
        try {
          const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`Hoa_Don_P${inv.room?.roomNumber}_T${inv.month}_${inv.year}.pdf`);
          setPdfInvoice(null);
        } catch (err) {
          console.error("Lỗi tạo PDF:", err);
          alert("Có lỗi xảy ra khi tạo PDF!");
          setPdfInvoice(null);
        }
      }
    }, 300);
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #222836', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', color: '#e8e8e8', fontSize: 13, fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }
        .tbl-row { border-bottom: 1px solid #1e2330; transition: background 0.12s; }
        .tbl-row:last-child { border-bottom: none; }
        .tbl-row:hover { background: rgba(255,255,255,0.02); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease-out forwards; }
        input:focus, select:focus { border-color: #3d4a6b !important; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Hóa đơn</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}
              style={{ background: '#222836', color: '#e8e8e8', border: '1px solid #252d3d', padding: '6px 12px', borderRadius: 7, outline: 'none', fontSize: 13, fontFamily: 'inherit' }}>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={() => setShowModal(true)}
              style={{ background: '#fff', color: '#000', padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, fontFamily: 'inherit', transition: '0.15s' }}
              onMouseOver={e => e.currentTarget.style.background = '#f0f0f0'} onMouseOut={e => e.currentTarget.style.background = '#fff'}>
              + Xuất hóa đơn
            </button>
          </div>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#1a1f28' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Hóa Đơn Tháng {filter.month}/{filter.year}</h2>
              <p style={{ fontSize: 13.5, color: '#4a5568' }}>{invoices.length} hóa đơn được tìm thấy</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="number" min="1" max="12" value={filter.month} onChange={e => setFilter({...filter, month: Number(e.target.value)})}
                style={{ width: 60, background: '#222836', border: '1px solid #252d3d', borderRadius: 7, padding: '7px 10px', color: '#e8e8e8', outline: 'none', fontSize: 13, fontFamily: 'inherit', textAlign: 'center' }} />
              <input type="number" min="2020" value={filter.year} onChange={e => setFilter({...filter, year: Number(e.target.value)})}
                style={{ width: 80, background: '#222836', border: '1px solid #252d3d', borderRadius: 7, padding: '7px 10px', color: '#e8e8e8', outline: 'none', fontSize: 13, fontFamily: 'inherit', textAlign: 'center' }} />
            </div>
          </div>

          <div style={{ background: '#161a21', border: '1px solid #1e2330', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#131820', borderBottom: '1px solid #1e2330' }}>
                  {['Phòng / Khách thuê', 'Số Điện / Nước', 'Tổng tiền', 'Trạng thái', ''].map((h, i) => (
                    <th key={i} style={{ padding: '11px 20px', textAlign: i === 4 ? 'right' : 'left', fontSize: 11.5, fontWeight: 600, color: '#2a3040', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center', color: '#2a3040', fontSize: 14 }}>Chưa có hóa đơn nào trong tháng này.</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className="tbl-row">
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#d0d8e8', marginBottom: 3 }}>P. {inv.room?.roomNumber}</div>
                      <div style={{ fontSize: 12, color: '#4a5568' }}>👤 {inv.room?.tenants[0]?.name || 'N/A'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: 12.5, color: '#8896a8', marginBottom: 4 }}>⚡ {inv.electricity} kWh</div>
                      <div style={{ fontSize: 12.5, color: '#8896a8' }}>💧 {inv.water} m³</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 700, fontSize: 14.5, color: '#f0f0f0', letterSpacing: '-0.3px' }}>
                      {inv.amount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span onClick={() => toggleStatus(inv.id, inv.status)} style={{ cursor: 'pointer', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, border: `1px solid ${inv.status === 'PAID' ? 'rgba(52,211,153,0.2)' : 'rgba(234,179,8,0.2)'}`, background: inv.status === 'PAID' ? 'rgba(52,211,153,0.08)' : 'rgba(234,179,8,0.08)', color: inv.status === 'PAID' ? '#34d399' : '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }}></span>
                        {inv.status === 'PAID' ? 'Đã thu' : 'Chờ thu'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleSendEmail(inv)} disabled={sendingEmailId === inv.id} style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', padding: '5px 12px', borderRadius: 7, cursor: sendingEmailId === inv.id ? 'wait' : 'pointer', transition: 'all 0.15s', fontSize: 12.5, fontFamily: 'inherit' }}
                          onMouseOver={e => { if (sendingEmailId !== inv.id) { e.currentTarget.style.background = 'rgba(96,165,250,0.15)'; } }}
                          onMouseOut={e => { if (sendingEmailId !== inv.id) { e.currentTarget.style.background = 'rgba(96,165,250,0.08)'; } }}>
                          {sendingEmailId === inv.id ? 'Đang gửi...' : 'Gửi Mail'}
                        </button>
                        <button onClick={() => handleExportPDF(inv)} style={{ background: 'transparent', border: '1px solid #252d3d', color: '#6b7280', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', fontSize: 12.5, fontFamily: 'inherit' }}
                          onMouseOver={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#354055'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#252d3d'; }}>
                          {pdfInvoice?.id === inv.id ? 'Đang xuất...' : 'In PDF'}
                        </button>
                        <button onClick={() => handleDeleteInvoice(inv.id)} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: 420, background: '#1e2330', border: '1px solid #252d3d', padding: 28, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 3 }}>Tạo hóa đơn mới</div>
                <div style={{ fontSize: 12.5, color: '#4a5568' }}>Tháng {filter.month}/{filter.year}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#222836', border: '1px solid #252d3d', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.15s' }}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreateInvoice}>
              <label style={{ display: 'block', fontSize: 11.5, color: '#4a5568', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Chọn phòng</label>
              <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}
                style={{ width: '100%', background: '#161a21', border: '1px solid #252d3d', color: '#e8e8e8', padding: '10px 14px', borderRadius: 8, marginBottom: 16, outline: 'none', fontSize: 13.5, fontFamily: 'inherit' }}>
                <option value="">-- Chọn phòng --</option>
                {rooms.length === 0 && <option value="" disabled>Tất cả phòng đã xuất HĐ</option>}
                {rooms.map(r => <option key={r.id} value={r.id}>Phòng {r.roomNumber} — {r.tenants[0]?.name}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11.5, color: '#4a5568', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Số điện (kWh)</label>
                  <input type="number" required value={formData.electricity} onChange={e => setFormData({...formData, electricity: e.target.value})}
                    style={{ width: '100%', background: '#161a21', border: '1px solid #252d3d', color: '#e8e8e8', padding: '10px 14px', borderRadius: 8, outline: 'none', fontSize: 13.5, fontFamily: 'inherit' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11.5, color: '#4a5568', marginBottom: 7, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Số nước (m³)</label>
                  <input type="number" required value={formData.water} onChange={e => setFormData({...formData, water: e.target.value})}
                    style={{ width: '100%', background: '#161a21', border: '1px solid #252d3d', color: '#e8e8e8', padding: '10px 14px', borderRadius: 8, outline: 'none', fontSize: 13.5, fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: 8, border: '1px solid #252d3d', background: 'transparent', color: '#8896a8', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Hủy</button>
                <button type="submit"
                  style={{ flex: 2, padding: '11px', borderRadius: 8, background: '#fff', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5 }}>Xác nhận xuất</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfInvoice && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div ref={pdfRef} style={{ width: 800, padding: 60, background: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 30 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 'bold', color: '#111827' }}>HÓA ĐƠN TIỀN NHÀ</h1>
                <p style={{ margin: '8px 0 0 0', fontSize: 16, color: '#4b5563' }}>Kỳ thu: Tháng {pdfInvoice.month} Năm {pdfInvoice.year}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 900, background: '#f3f4f6', padding: '8px 16px', borderRadius: 8, display: 'inline-block' }}>LuanEZ</div>
                <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#6b7280' }}>Hệ thống Quản lý Nhà trọ</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, background: '#f9fafb', padding: 20, borderRadius: 12 }}>
              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Thông phần phòng</p>
                <p style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 'bold' }}>Phòng {pdfInvoice.room?.roomNumber}</p>
                <p style={{ margin: 0, fontSize: 16 }}>Đại diện: {pdfInvoice.room?.tenants[0]?.name || 'N/A'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: 14, color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Mã Hóa Đơn</p>
                <p style={{ margin: '0 0 4px 0', fontSize: 16 }}>#{pdfInvoice.id.substring(0, 8).toUpperCase()}</p>
                <p style={{ margin: 0, fontSize: 16, color: pdfInvoice.status === 'PAID' ? '#059669' : '#d97706', fontWeight: 'bold' }}>
                  Trạng thái: {pdfInvoice.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                </p>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 40 }}>
              <thead>
                <tr style={{ background: '#111827', color: '#ffffff' }}>
                  <th style={{ padding: 16, textAlign: 'left', fontSize: 16 }}>Khoản mục</th>
                  <th style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>Đơn giá</th>
                  <th style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>Số lượng</th>
                  <th style={{ padding: 16, textAlign: 'right', fontSize: 16 }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 16, fontSize: 16 }}>Tiền thuê phòng</td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>-</td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>1 tháng</td>
                  <td style={{ padding: 16, textAlign: 'right', fontSize: 16 }}>{(pdfInvoice.room?.price || 0).toLocaleString('vi-VN')} ₫</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 16, fontSize: 16 }}>Tiền điện</td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>3.500 ₫/kWh</td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>{pdfInvoice.electricity} kWh</td>
                  <td style={{ padding: 16, textAlign: 'right', fontSize: 16 }}>{(pdfInvoice.electricity * 3500).toLocaleString('vi-VN')} ₫</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 16, fontSize: 16 }}>Tiền nước</td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>15.000 ₫/m³</td>
                  <td style={{ padding: 16, textAlign: 'center', fontSize: 16 }}>{pdfInvoice.water} m³</td>
                  <td style={{ padding: 16, textAlign: 'right', fontSize: 16 }}>{(pdfInvoice.water * 15000).toLocaleString('vi-VN')} ₫</td>
                </tr>
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: 400, background: '#f9fafb', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 16, color: '#4b5563' }}>Tổng cộng:</span>
                  <span style={{ fontSize: 16, fontWeight: 'bold' }}>{pdfInvoice.amount.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #d1d5db', paddingTop: 10, marginTop: 10 }}>
                  <span style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>SỐ TIỀN PHẢI THU:</span>
                  <span style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>{pdfInvoice.amount.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 60, color: '#6b7280', fontSize: 14 }}>
              <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của LuanEZ.</p>
              <p>Vui lòng thanh toán đúng hạn quy định.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}