'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar'; // 🔥 ĐÃ IMPORT SIDEBAR

interface Room { id: string; roomNumber: string; price: number; status: string; area: number; }
interface Property { id: string; name: string; address: string; createdAt?: string; rooms?: Room[]; }

export default function AdminDashboardPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ name: 'Admin', initial: 'A' });
  const [currentDate, setCurrentDate] = useState('');

  const parseJwt = (token: string) => { try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; } };

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    const decoded = parseJwt(token);
    if (decoded?.email) {
      const n = decoded.email.split('@')[0];
      setUserInfo({ name: n, initial: n.charAt(0).toUpperCase() });
    }
    try {
      const res = await axios.get('http://localhost:3000/property', { headers: { Authorization: `Bearer ${token}` } });
      setProperties(res.data);
    } catch { console.error('Không lấy được dữ liệu'); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    fetchData();
    setCurrentDate(new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, [fetchData]);

  let totalRooms = 0, totalRented = 0, totalRevenue = 0;
  const availableList: (Room & { propertyName: string; propertyId: string })[] = [];

  properties.forEach(p => {
    (p.rooms || []).forEach(r => {
      totalRooms++;
      if (r.status !== 'AVAILABLE') { totalRented++; totalRevenue += r.price; }
      else availableList.push({ ...r, propertyName: p.name, propertyId: p.id });
    });
  });

  const avgOccupancy = totalRooms === 0 ? 0 : Math.round((totalRented / totalRooms) * 100);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#1a1f28' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #222836', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const statCards = [
    {
      label: 'Tổng khu trọ',
      value: String(properties.length),
      sub: 'Đang quản lý',
      color: '#34d399',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>),
    },
    {
      label: 'Phòng cho thuê',
      value: `${totalRented}/${totalRooms}`,
      sub: 'Tổng số phòng',
      color: '#60a5fa',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5H13.5M7.5 6.5V12.5" stroke="currentColor" strokeWidth="1.3"/></svg>),
    },
    {
      label: 'Doanh thu / tháng',
      value: totalRevenue > 0 ? `${(totalRevenue / 1000000).toFixed(1)}M ₫` : '—',
      sub: 'Dự kiến tháng này',
      color: '#fbbf24',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 4v7M5.5 5.5h2.5a1.5 1.5 0 010 3H5.5M5.5 9.5H9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>),
    },
    {
      label: 'Tỷ lệ lấp đầy',
      value: `${avgOccupancy}%`,
      sub: 'Toàn hệ thống',
      color: avgOccupancy >= 70 ? '#34d399' : avgOccupancy >= 40 ? '#fbbf24' : '#f87171',
      icon: (<svg width="16" height="16" viewBox="0 0 15 15" fill="none"><path d="M2 11L5.5 7L8.5 9.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>),
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', fontFamily: '"DM Sans", system-ui, sans-serif', color: '#e8e8e8', fontSize: 13 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }
        .stat-card { background: #1e2330; border: 1px solid #252d3d; border-radius: 12px; padding: 20px 22px; flex: 1; transition: border-color 0.2s, transform 0.2s; }
        .stat-card:hover { border-color: #354055; transform: translateY(-2px); }
        .property-row { padding: 16px 0; border-bottom: 1px solid #1e2330; }
        .property-row:last-child { border-bottom: none; padding-bottom: 0; }
        .avail-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #161a21; border: 1px solid #1e2330; border-radius: 9px; transition: all 0.15s; }
        .avail-item:hover { background: #222836; border-color: #252d3d; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease-out forwards; }
        .ai-btn { display: flex; align-items: center; gap: 7px; padding: 8px 18px; border-radius: 8px; background: #fff; color: #000; border: none; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; font-family: inherit; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
        .ai-btn:hover { background: #f0f0f0; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M5.5 3.5L9.5 7.5L5.5 11.5" stroke="#2a3040" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Dashboard</span>
          </div>
          <button className="ai-btn" onClick={() => router.push('/ai-agent')}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7.5C5 6.12 6.12 5 7.5 5s2.5 1.12 2.5 2.5S8.88 10 7.5 10 5 8.88 5 7.5Z" fill="currentColor" opacity=".7"/></svg>
            Ra lệnh cho AI
          </button>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#1a1f28' }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 5 }}>
              Chào ngày mới, {userInfo.name} 👋
            </h2>
            <p style={{ color: '#4a5568', fontSize: 13.5, textTransform: 'capitalize' }}>{currentDate}</p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
            {statCards.map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ fontSize: 11.5, color: '#4a5568', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{s.label}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                    {s.icon}
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.8px', marginBottom: 5, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#4a5568' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
            <div style={{ background: '#1e2330', border: '1px solid #252d3d', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e2330', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#d0d8e8', marginBottom: 2 }}>Hiệu suất từng khu vực</div>
                  <div style={{ fontSize: 12, color: '#4a5568' }}>Tỷ lệ lấp đầy theo thời gian thực</div>
                </div>
                <button onClick={() => router.push('/reports')}
                  style={{ fontSize: 12, color: '#6b7280', background: 'transparent', border: '1px solid #252d3d', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', transition: '0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.color = '#d0d8e8'; e.currentTarget.style.borderColor = '#354055'; }}
                  onMouseOut={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#252d3d'; }}>
                  Xem báo cáo →
                </button>
              </div>
              <div style={{ padding: '20px 22px' }}>
                {properties.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#161a21', border: '1px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <svg width="20" height="20" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="#4a5568" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                    </div>
                    <p style={{ color: '#4a5568', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Chưa có khu trọ nào</p>
                    <p style={{ color: '#2a3040', fontSize: 13, marginBottom: 18 }}>Bắt đầu thêm khu trọ đầu tiên của bạn</p>
                    <button onClick={() => router.push('/ai-agent')}
                      style={{ background: '#fff', color: '#000', border: 'none', padding: '9px 18px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', transition: '0.15s' }}>
                      Nhờ AI tạo khu trọ
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {properties.map((p, idx) => {
                      const total = p.rooms?.length || 0;
                      const rented = p.rooms?.filter(r => r.status !== 'AVAILABLE').length || 0;
                      const pct = total === 0 ? 0 : Math.round((rented / total) * 100);
                      const barColor = pct >= 80 ? '#34d399' : pct >= 50 ? '#60a5fa' : '#fbbf24';
                      return (
                        <div key={p.id} className="property-row" style={{ paddingTop: idx === 0 ? 0 : 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: barColor, flexShrink: 0 }} />
                              <span style={{ fontSize: 13.5, fontWeight: 600, color: '#d0d8e8' }}>{p.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 12.5, color: '#4a5568' }}>{rented}/{total} phòng</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: barColor, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                            </div>
                          </div>
                          <div style={{ width: '100%', height: 6, background: '#161a21', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 6, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#2a3040' }}>{p.address}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: '#1e2330', border: '1px solid #252d3d', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e2330', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#d0d8e8', marginBottom: 2 }}>Cần tìm khách</div>
                  <div style={{ fontSize: 12, color: '#4a5568' }}>{availableList.length} phòng đang trống</div>
                </div>
                {availableList.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.08)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
                    {availableList.length}
                  </span>
                )}
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: 340 }}>
                {availableList.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#34d399', marginBottom: 4 }}>Lấp đầy 100%!</div>
                    <div style={{ fontSize: 12.5, color: '#4a5568' }}>Toàn bộ phòng đã có người thuê.</div>
                  </div>
                ) : (
                  <>
                    {availableList.slice(0, 6).map(room => (
                      <div key={room.id} className="avail-item" style={{ cursor: 'pointer' }} onClick={() => router.push(`/property/${room.propertyId}`)}>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#d0d8e8', marginBottom: 3 }}>Phòng {room.roomNumber}</div>
                          <div style={{ fontSize: 12, color: '#4a5568' }}>{room.propertyName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.3px' }}>{room.price > 0 ? `${(room.price/1000000).toFixed(1)}M` : '—'}</div>
                          <div style={{ fontSize: 11.5, color: '#4a5568' }}>₫/tháng</div>
                        </div>
                      </div>
                    ))}
                    {availableList.length > 6 && (
                      <button onClick={() => router.push('/')}
                        style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed #252d3d', color: '#6b7280', borderRadius: 8, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', marginTop: 4 }}
                        onMouseOver={e => { e.currentTarget.style.color = '#d0d8e8'; e.currentTarget.style.borderColor = '#354055'; }}
                        onMouseOut={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#252d3d'; }}>
                        Xem tất cả {availableList.length} phòng trống →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}