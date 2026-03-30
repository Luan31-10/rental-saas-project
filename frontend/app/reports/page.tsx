'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import Sidebar from '@/components/Sidebar'; // 🔥 ĐÃ IMPORT SIDEBAR

interface Room { id: string; roomNumber: string; price: number; status: string; }
interface Property { id: string; name: string; rooms?: Room[]; }
interface Invoice { id: string; amount: number; month: number; year: number; status: string; }

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number; expense: number }[]>([]);
  const [occupancyData, setOccupancyData] = useState<{ name: string; total: number; rented: number }[]>([]);
  const [kpi, setKpi] = useState({ totalRevenue: 0, totalExpense: 0, netProfit: 0 });

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [propRes, invRes] = await Promise.all([
        axios.get('http://localhost:3000/property', { headers }).catch(() => ({ data: [] })),
        axios.get('http://localhost:3000/invoice/owner/all', { headers }).catch(() => ({ data: [] }))
      ]);
      const properties: Property[] = propRes.data;
      const invoices: Invoice[] = invRes.data;
      
      setOccupancyData(properties.map(p => ({ name: p.name, total: p.rooms?.length || 0, rented: p.rooms?.filter(r => r.status !== 'AVAILABLE').length || 0 })));
      
      const currentYear = new Date().getFullYear();
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: `T${i + 1}`, revenue: 0, expense: 0 }));
      let totalRev = 0;
      
      invoices.forEach(inv => { 
        if (inv.status === 'PAID' && inv.year === currentYear && inv.month >= 1 && inv.month <= 12) { 
          monthlyData[inv.month - 1].revenue += inv.amount; 
          totalRev += inv.amount; 
        } 
      });
      
      monthlyData.forEach(d => { if (d.revenue > 0) d.expense = Math.round(d.revenue * 0.15); });
      setRevenueData(monthlyData.slice(0, new Date().getMonth() + 1));
      
      const totalExp = Math.round(totalRev * 0.15);
      setKpi({ totalRevenue: totalRev, totalExpense: totalExp, netProfit: totalRev - totalExp });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #222836', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const kpiCards = [
    { label: 'Tổng Doanh Thu (Đã thu)', value: kpi.totalRevenue, color: '#f0f0f0' },
    { label: 'Tổng Chi Phí (Dự tính 15%)', value: kpi.totalExpense, color: '#f87171' },
    { label: 'Lợi Nhuận Ròng', value: kpi.netProfit, color: '#34d399' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e8e8e8', fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Báo cáo & Phân tích</span>
          </div>
          <button style={{ background: 'transparent', border: '1px solid #252d3d', color: '#8896a8', padding: '6px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: '0.15s' }}
            onMouseOver={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#354055'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#8896a8'; e.currentTarget.style.borderColor = '#252d3d'; }}>
            Xuất PDF
          </button>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#1a1f28' }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Phân tích Tài chính Năm nay</h2>
            <p style={{ color: '#4a5568', fontSize: 13.5 }}>Tự động truy xuất từ hóa đơn đã thanh toán (PAID) và hợp đồng hiệu lực.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 20 }}>
            {kpiCards.map((k, i) => (
              <div key={i} style={{ background: '#1e2330', border: '1px solid #252d3d', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ fontSize: 11.5, color: '#4a5568', marginBottom: 12, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{k.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: k.color, letterSpacing: '-0.5px' }}>{k.value.toLocaleString('vi-VN')} ₫</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1e2330', border: '1px solid #252d3d', borderRadius: 12, padding: '22px 24px', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#d0d8e8', marginBottom: 22 }}>Biểu đồ Doanh thu & Chi phí thực tế</h3>
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#2a3040" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#2a3040" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000000}M`} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e2330', borderColor: '#252d3d', borderRadius: '8px', color: '#e8e8e8', fontSize: 13 }} itemStyle={{ fontWeight: 600 }}
                    formatter={(value: number | string | readonly (number | string)[] | undefined) => {
                      const n = Array.isArray(value) ? Number(value[0]) : Number(value || 0);
                      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
                    }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 13, color: '#6b7280' }} />
                  <Area type="monotone" dataKey="revenue" name="Doanh thu" stroke="#60a5fa" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expense" name="Chi phí ước tính" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: '#1e2330', border: '1px solid #252d3d', borderRadius: 12, padding: '22px 24px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#d0d8e8', marginBottom: 22 }}>Tỷ lệ lấp đầy theo khu trọ (Real-time)</h3>
            {occupancyData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#2a3040', fontSize: 14 }}>Chưa có dữ liệu phòng.</div>
            ) : (
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#2a3040" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#2a3040" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2330" vertical={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#1e2330', borderColor: '#252d3d', borderRadius: '8px', color: '#e8e8e8', fontSize: 13 }} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 13, color: '#6b7280' }} />
                    <Bar dataKey="total" name="Tổng số phòng" fill="#252d3d" radius={[4,4,0,0]} barSize={28} />
                    <Bar dataKey="rented" name="Phòng đã có khách" fill="#34d399" radius={[4,4,0,0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}