'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '@/components/Sidebar';

interface Invoice {
  id: string;
  code?: string;
  roomName?: string;
  tenantName?: string;
  amount: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  month?: number;
  year?: number;
  room?: {
    name?: string;
    roomNumber?: string;
    tenants?: {
      name: string;
    }[];
  };
}

export default function RevenuePage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState('ALL'); // Bộ lọc trạng thái hóa đơn
  
  const [stats, setStats] = useState({
    totalExpected: 0,
    totalCollected: 0,
    totalDebt: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get('http://localhost:3000/invoice', {
          headers: { Authorization: `Bearer ${token}` }
        }); 
        
        const data: Invoice[] = res.data;
        setInvoices(data);

        const expected = data.reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);
        const collected = data
          .filter((i: Invoice) => i.status === 'PAID')
          .reduce((sum: number, inv: Invoice) => sum + inv.amount, 0);
        
        setStats({
          totalExpected: expected,
          totalCollected: collected,
          totalDebt: expected - collected,
        });
      } catch (error) {
        console.error('Lỗi lấy dữ liệu doanh thu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Lọc hóa đơn theo trạng thái
  const filteredInvoices = invoices.filter(inv => filter === 'ALL' || inv.status === filter);

  // Helper render Badge trạng thái
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)' }}>Đã thu</span>;
      case 'UNPAID':
        return <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(245, 158, 11, 0.2)' }}>Chưa thu</span>;
      case 'OVERDUE':
        return <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>Quá hạn</span>;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e8e8e8' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* HEADER */}
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid #1e2330', background: '#161a21', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#f0f0f0' }}>Quản lý Dòng tiền</h1>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0 0' }}>Theo dõi công nợ và tình trạng thu tiền</p>
          </div>
          <button style={{ background: '#fff', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            Gửi thông báo nợ hàng loạt
          </button>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          
          {loading ? (
            <div style={{ color: '#6b7280', textAlign: 'center', marginTop: 50 }}>Đang tải dữ liệu dòng tiền...</div>
          ) : (
            <>
              {/* THỐNG KÊ TỔNG QUAN */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
                
                {/* Thẻ 1 */}
                <div style={{ background: '#1e2330', padding: 24, borderRadius: 16, border: '1px solid #252d3d' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={{ color: '#8896a8', fontSize: 13, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dự kiến thu</p>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#d0d8e8' }}>Tháng hiện tại</span>
                  </div>
                  <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#f0f0f0', letterSpacing: '-0.5px' }}>{formatCurrency(stats.totalExpected)}</h2>
                </div>

                {/* Thẻ 2 */}
                <div style={{ background: '#1e2330', padding: 24, borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.2)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '3px', background: '#10b981' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={{ color: '#8896a8', fontSize: 13, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Đã thu (Thực tế)</p>
                  </div>
                  <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#10b981', letterSpacing: '-0.5px' }}>{formatCurrency(stats.totalCollected)}</h2>
                </div>

                {/* Thẻ 3 */}
                <div style={{ background: '#1e2330', padding: 24, borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.2)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '3px', background: '#ef4444' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={{ color: '#8896a8', fontSize: 13, fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Còn nợ / Quá hạn</p>
                  </div>
                  <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, color: '#ef4444', letterSpacing: '-0.5px' }}>{formatCurrency(stats.totalDebt)}</h2>
                </div>
              </div>

              {/* BẢNG THEO DÕI NỢ */}
              <div style={{ background: '#1e2330', borderRadius: 16, border: '1px solid #252d3d', overflow: 'hidden' }}>
                {/* Thanh công cụ lọc */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #252d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 700, margin: 0 }}>Danh sách Hóa đơn</h3>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['ALL', 'PAID', 'UNPAID', 'OVERDUE'].map(f => (
                      <button 
                        key={f} 
                        onClick={() => setFilter(f)}
                        style={{ 
                          padding: '8px 16px', borderRadius: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: '0.2s',
                          background: filter === f ? 'rgba(255,255,255,0.05)' : 'transparent', 
                          color: filter === f ? '#f0f0f0' : '#8896a8',
                          border: filter === f ? '1px solid #303848' : '1px solid transparent'
                        }}>
                        {f === 'ALL' ? 'Tất cả' : f === 'PAID' ? 'Đã thu' : f === 'UNPAID' ? 'Chưa thu' : 'Quá hạn'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bảng dữ liệu */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#161a21', color: '#6b7280', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Mã HĐ</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Phòng / Khách thuê</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Tổng tiền</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Hạn chót (Dự kiến)</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600 }}>Trạng thái</th>
                      <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => {
                      // 🔥 BỌC LÓT DỮ LIỆU ĐỘNG: Tìm mọi ngóc ngách để lấy Tên và Phòng
                      const displayCode = inv.code || (inv.id ? inv.id.substring(0, 8).toUpperCase() : 'N/A');
                      const displayRoom = inv.roomName || inv.room?.name || inv.room?.roomNumber || 'Chưa rõ phòng';
                      const displayTenant = inv.tenantName || inv.room?.tenants?.[0]?.name || 'Không có khách';
                      
                      // 🔥 BỌC LÓT NGÀY THÁNG: Tránh Invalid Date
                      let displayDate = 'Chưa có hạn';
                      if (inv.dueDate) {
                        displayDate = new Date(inv.dueDate).toLocaleDateString('vi-VN');
                      } else if (inv.month && inv.year) {
                        displayDate = `15/${inv.month}/${inv.year}`; // Mặc định mùng 15
                      }

                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid #252d3d', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 700, color: '#3b82f6' }}>INV-{displayCode}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 600, color: '#e8e8e8', marginBottom: 4 }}>{displayRoom}</div>
                            <div style={{ fontSize: 13, color: '#8896a8' }}>{displayTenant}</div>
                          </td>
                          <td style={{ padding: '16px 24px', fontWeight: 700, color: '#e8e8e8' }}>{formatCurrency(inv.amount)}</td>
                          <td style={{ padding: '16px 24px', fontSize: 14, color: '#8896a8' }}>{displayDate}</td>
                          <td style={{ padding: '16px 24px' }}>{renderStatusBadge(inv.status)}</td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            {inv.status === 'UNPAID' || inv.status === 'OVERDUE' ? (
                              <button style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                Nhắc nợ
                              </button>
                            ) : (
                              <button style={{ background: 'transparent', border: '1px solid #303848', color: '#8896a8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
                                Xem
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                          Không tìm thấy hóa đơn nào.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}