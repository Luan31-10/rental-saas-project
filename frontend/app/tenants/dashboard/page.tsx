'use client';
import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import axios from 'axios';
import { io } from 'socket.io-client';

import PaymentModal from './components/PaymentModal';
import ContractModal from './components/ContractModal';
import IssueModal from './components/IssueModal';
import ChatModal from './components/ChatModal';

interface RoomInfo { 
  id: string; 
  invoiceId?: string; 
  roomNumber: string; 
  propertyName: string; 
  ownerName: string; 
  price: number; 
  balance: number; 
  status: string; 
  dueDate: string; 
  area: number; 
  deposit: number; 
  startDate: string;
}
interface Issue { id: string; title: string; description?: string; status: string; createdAt: string; }

export default function TenantDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams(); 
  
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userName, setUserName] = useState('Khách thuê');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [myIssues, setMyIssues] = useState<Issue[]>([]);

  const [modalStates, setModalStates] = useState({
    payment: false, contract: false, issue: false, chat: null as Issue | null,
  });

  // 🔥 Đã bọc bằng biến môi trường để chống sập khi Deploy
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchData = async (token: string, isRealtime = false) => {
    if (isRealtime) setIsRefreshing(true);
    try {
      const [roomRes, issuesRes] = await Promise.all([
        axios.get(`${API_URL}/tenant/my-room`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/issue/my-issues`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRoomInfo(roomRes.data);
      setMyIssues(issuesRes.data);
    } catch { setRoomInfo(null); }
    finally {
      setLoading(false);
      if (isRealtime) setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  useEffect(() => {
    const payosStatus = searchParams.get('status');
    
    if (payosStatus === 'PAID' && roomInfo && roomInfo.balance > 0) {
      setRoomInfo(prev => prev ? { ...prev, balance: 0, status: 'PAID' } : null);
      setTimeout(() => alert("🎉 Ting ting! Đã thanh toán hóa đơn thành công!"), 500);
      router.replace('/tenants/dashboard'); 
    }
  }, [searchParams, roomInfo?.balance, router]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserName(payload.name || 'Khách thuê');
      fetchData(token);
      
      // 🔥 Sửa lại kết nối Socket bằng biến môi trường
      const socket = io(API_URL);
      socket.on(`room_updated_${payload.email}`, () => fetchData(token, true));
      return () => { socket.disconnect(); };
    } catch { router.push('/login'); }
  }, [router]);

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #1e293b', borderTop: '3px solid #3b82f6', animation: 'spin 1s linear infinite' }} /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: '"Inter", sans-serif', padding: '40px 20px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; }
        .action-btn { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 16px; cursor: pointer; transition: 0.2s; display: flex; flex-direction: column; align-items: center; gap: 8px; color: #94a3b8; }
        .action-btn:hover { border-color: #3b82f6; color: #fff; background: #1e293b; }
        .issue-card { background: #1e293b; border-radius: 12px; padding: 16px 20px; margin-bottom: 12px; cursor: pointer; border: 1px solid #334155; transition: 0.2s; }
        .issue-card:hover { border-color: #3b82f6; }
      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>Chào ngày mới, {userName} 👋</h1>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>{roomInfo ? `Phòng ${roomInfo.roomNumber} • ${roomInfo.propertyName}` : '...'}</p>
          </div>
          <button onClick={() => { localStorage.removeItem('token'); router.push('/login'); }} style={{ background: '#1e293b', color: '#f8fafc', border: '1px solid #334155', padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>Đăng xuất</button>
        </div>

        {roomInfo ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '12px', color: roomInfo.balance > 0 ? '#ef4444' : '#10b981', fontSize: 11, fontWeight: 700 }}>
                  ● {roomInfo.balance > 0 ? 'CHƯA THANH TOÁN' : 'ĐÃ THANH TOÁN'}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>DƯ NỢ HIỆN TẠI</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: roomInfo.balance > 0 ? '#f8fafc' : '#10b981' }}>
                  {roomInfo.balance.toLocaleString()} <span style={{ fontSize: 18, color: '#64748b' }}>VNĐ</span>
                </div>
                <div style={{ marginTop: 16, fontSize: 13, color: '#64748b' }}>Hạn chót: <span style={{ color: '#cbd5e1' }}>{roomInfo.dueDate || 'Chưa có'}</span></div>
              </div>

              {/* 🔥 ĐÃ ĐỔI THÀNH GRID 4 CỘT VÀ THÊM NÚT LỊCH SỬ TẠI ĐÂY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                <button className="action-btn" onClick={() => setModalStates({...modalStates, payment: true})}><span style={{ fontSize: 20 }}>💳</span><span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Thanh toán</span></button>
                <button className="action-btn" onClick={() => setModalStates({...modalStates, issue: true})}><span style={{ fontSize: 20 }}>🛠️</span><span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Báo sự cố</span></button>
                <button className="action-btn" onClick={() => setModalStates({...modalStates, contract: true})}><span style={{ fontSize: 20 }}>📄</span><span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Hợp đồng</span></button>
                <button className="action-btn" onClick={() => router.push('/tenants/history')}><span style={{ fontSize: 20 }}>📜</span><span style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>Lịch sử</span></button>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Sự cố & Trao đổi 💬</h3>
                {myIssues.map(issue => (
                  <div key={issue.id} className="issue-card" onClick={() => setModalStates({...modalStates, chat: issue})} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{issue.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{new Date(issue.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: issue.status === 'RESOLVED' ? '#22c55e' : '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '4px 8px', borderRadius: 6 }}>{issue.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div className="stat-card">
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 16, fontWeight: 600 }}>THÔNG TIN CHI TIẾT</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                   <div><div style={{ color: '#64748b', fontSize: 12 }}>DIỆN TÍCH</div><div style={{ fontSize: 18, fontWeight: 700 }}>{roomInfo.area || 0} m²</div></div>
                   <div><div style={{ color: '#64748b', fontSize: 12 }}>GIÁ PHÒNG</div><div style={{ fontSize: 18, fontWeight: 700 }}>{roomInfo.price.toLocaleString()} đ</div></div>
                   <div><div style={{ color: '#64748b', fontSize: 12 }}>CHỦ NHÀ QUẢN LÝ</div><div style={{ fontSize: 16, fontWeight: 700, color: '#8b5cf6' }}>{roomInfo.ownerName}</div></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="stat-card" style={{ textAlign: 'center', padding: '60px 0' }}>Chưa có dữ liệu phòng thuê.</div>
        )}
      </div>

      {roomInfo && (
        <>
          <PaymentModal isOpen={modalStates.payment} onClose={() => setModalStates({...modalStates, payment: false})} roomInfo={roomInfo} />
          <ContractModal 
            isOpen={modalStates.contract} 
            onClose={() => setModalStates({...modalStates, contract: false})} 
            contractData={{
              roomNumber: roomInfo.roomNumber,
              tenantName: userName,
              tenantPhone: "(Theo hồ sơ đăng ký)",
              price: roomInfo.price,
              deposit: roomInfo.deposit,
              startDate: new Date(roomInfo.startDate).toLocaleDateString('vi-VN'),
              landlordName: roomInfo.ownerName
            }} 
          />
          <IssueModal isOpen={modalStates.issue} onClose={() => setModalStates({...modalStates, issue: false})} roomId={roomInfo.id} onSuccess={() => fetchData(localStorage.getItem('token')!)} />
        </>
      )}
      
      {modalStates.chat && <ChatModal issue={modalStates.chat} onClose={() => setModalStates({...modalStates, chat: null})} />}
    </div>
  );
}