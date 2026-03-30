'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import Sidebar from '@/components/Sidebar';

interface Property { id: string; name: string; }
interface Issue {
  id: string; title: string; description: string; status: string; createdAt: string;
  room: { roomNumber: string }; tenant: { name: string; phone: string };
}
interface IssueComment { id: string; content: string; sender: string; createdAt: string; }

export default function IssuesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // State cho phần Chat
  const [chatIssue, setChatIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

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

  const fetchIssues = useCallback(async () => {
    if (!selectedPropertyId) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/issue/property/${selectedPropertyId}`, { headers: { Authorization: `Bearer ${token}` } });
      setIssues(res.data);
    } catch (err) { console.error(err); }
  }, [selectedPropertyId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  // 🔥 LẮNG NGHE TIN NHẮN REALTIME TỪ WEBSOCKET
  useEffect(() => {
    if (!chatIssue) return;
    
    const socket = io(API_URL);
    socket.on(`new_comment_${chatIssue.id}`, (newComment: IssueComment) => {
      setComments((prev) => {
        if (prev.find(c => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
    });

    return () => { socket.disconnect(); };
  }, [chatIssue]);

  // Cuộn xuống cuối khung chat
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const token = localStorage.getItem('token');
    let newStatus = 'IN_PROGRESS';
    if (currentStatus === 'IN_PROGRESS') newStatus = 'RESOLVED';
    else if (currentStatus === 'RESOLVED') newStatus = 'PENDING';

    try {
      await axios.patch(`${API_URL}/issue/${id}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      fetchIssues(); 
    } catch { alert('Lỗi cập nhật trạng thái'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API_URL}/issue/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchIssues();
    } catch { alert('Lỗi xóa sự cố'); }
  };

  const openChat = async (issue: Issue) => {
    setChatIssue(issue);
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${API_URL}/issue/${issue.id}/comments`, { headers: { Authorization: `Bearer ${token}` } });
      setComments(res.data);
    } catch { alert('Lỗi tải tin nhắn'); }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !chatIssue) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/issue/${chatIssue.id}/comment`, 
        { content: commentText, sender: 'ADMIN' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText('');
      // Không cần fetch lại vì WebSocket đã tự hứng tin nhắn mới rồi
    } catch { alert('Không gửi được tin nhắn!'); }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: 'rgba(234,179,8,0.1)', color: '#fbbf24', border: '1px solid rgba(234,179,8,0.2)' }}>⏳ Chờ xử lý</span>;
      case 'IN_PROGRESS': return <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>🛠 Đang sửa</span>;
      case 'RESOLVED': return <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>✅ Đã xong</span>;
      default: return null;
    }
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
        .chat-bubble { padding: 10px 14px; border-radius: 12px; max-width: 80%; font-size: 13.5px; line-height: 1.5; margin-bottom: 10px; }
        .chat-admin { background: #3d4a6b; color: #fff; border-bottom-right-radius: 4px; align-self: flex-end; }
        .chat-tenant { background: #222836; border: 1px solid #252d3d; color: #d0d8e8; border-bottom-left-radius: 4px; align-self: flex-start; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', borderBottom: '1px solid #1e2330', background: '#161a21' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#2a3040' }}>LuanEZ</span>
            <span style={{ color: '#2a3040' }}>/</span>
            <span style={{ color: '#8896a8', fontWeight: 500 }}>Quản lý sự cố</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <select value={selectedPropertyId} onChange={e => setSelectedPropertyId(e.target.value)}
              style={{ background: '#222836', color: '#e8e8e8', border: '1px solid #252d3d', padding: '6px 12px', borderRadius: 7, outline: 'none', fontSize: 13, fontFamily: 'inherit' }}>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#1a1f28' }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 4 }}>Yêu cầu & Báo cáo sự cố</h2>
            <p style={{ fontSize: 13.5, color: '#4a5568' }}>{issues.length} sự cố được tìm thấy từ khách thuê</p>
          </div>

          <div style={{ background: '#161a21', border: '1px solid #1e2330', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#131820', borderBottom: '1px solid #1e2330' }}>
                  {['Phòng / Người báo', 'Nội dung sự cố', 'Trạng thái', 'Thời gian báo', 'Thao tác'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 20px', textAlign: i === 4 ? 'right' : 'left', fontSize: 11.5, fontWeight: 600, color: '#2a3040', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center', color: '#2a3040', fontSize: 14 }}>Hiện tại khu trọ này đang yên bình, không có sự cố nào! 🎉</td></tr>
                ) : issues.map(issue => (
                  <tr key={issue.id} className="tbl-row">
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#d0d8e8', marginBottom: 3 }}>Phòng {issue.room.roomNumber}</div>
                      <div style={{ fontSize: 12, color: '#4a5568' }}>👤 {issue.tenant.name} - {issue.tenant.phone}</div>
                    </td>
                    <td style={{ padding: '16px 20px', maxWidth: 300 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0f0', marginBottom: 4 }}>{issue.title}</div>
                      <div style={{ fontSize: 12.5, color: '#8896a8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.description || 'Không có mô tả chi tiết'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getStatusBadge(issue.status)}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 12.5, color: '#6b7280' }}>
                      {formatDate(issue.createdAt)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => openChat(issue)} style={{ background: '#3d4a6b', border: '1px solid #4a5b82', color: '#fff', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', fontSize: 12.5, fontFamily: 'inherit' }}
                          onMouseOver={e => { e.currentTarget.style.background = '#4a5b82'; }} onMouseOut={e => { e.currentTarget.style.background = '#3d4a6b'; }}>
                          Trao đổi 💬
                        </button>
                        
                        <button onClick={() => handleUpdateStatus(issue.id, issue.status)} style={{ background: 'transparent', border: '1px solid #252d3d', color: '#6b7280', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s', fontSize: 12.5, fontFamily: 'inherit' }}
                          onMouseOver={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#354055'; }}
                          onMouseOut={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#252d3d'; }}>
                          Đổi trạng thái
                        </button>
                        <button onClick={() => handleDelete(issue.id)} style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CHAT 1-1 */}
      {chatIssue && (
        <div onClick={e => { if (e.target === e.currentTarget) setChatIssue(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ width: 480, background: '#161a21', border: '1px solid #252d3d', borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', height: 600 }}>
            {/* Header Modal */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #252d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e2330', borderRadius: '14px 14px 0 0' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>Trao đổi với Phòng {chatIssue.room.roomNumber}</div>
                <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>Sự cố: {chatIssue.title}</div>
              </div>
              <button onClick={() => setChatIssue(null)} style={{ width: 30, height: 30, borderRadius: '50%', background: '#222836', border: '1px solid #252d3d', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Khung chứa tin nhắn */}
            <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#1a1f28' }}>
              <div className="chat-bubble chat-tenant">
                <span style={{ fontSize: 11, color: '#8896a8', display: 'block', marginBottom: 4 }}>Khách thuê đã báo cáo:</span>
                {chatIssue.description || chatIssue.title}
              </div>
              
              {comments.map(cmt => (
                <div key={cmt.id} className={`chat-bubble ${cmt.sender === 'ADMIN' ? 'chat-admin' : 'chat-tenant'}`}>
                  {cmt.content}
                  <div style={{ fontSize: 10, color: cmt.sender === 'ADMIN' ? '#a5b4fc' : '#6b7280', marginTop: 4, textAlign: 'right' }}>
                    {new Date(cmt.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
              <div ref={commentsEndRef} />
            </div>

            {/* Khung nhập tin nhắn */}
            <div style={{ padding: 20, borderTop: '1px solid #252d3d', background: '#1e2330', borderRadius: '0 0 14px 14px' }}>
              <form onSubmit={handleSendComment} style={{ display: 'flex', gap: 10 }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Nhập tin nhắn cập nhật cho khách..."
                  style={{ flex: 1, padding: '12px 16px', borderRadius: 8, border: '1px solid #252d3d', background: '#161a21', color: '#e8e8e8', outline: 'none', fontSize: 13.5, fontFamily: 'inherit' }} />
                <button type="submit" disabled={!commentText.trim()}
                  style={{ padding: '0 20px', borderRadius: 8, background: commentText.trim() ? '#fff' : '#222836', color: commentText.trim() ? '#000' : '#4a5568', border: 'none', cursor: commentText.trim() ? 'pointer' : 'not-allowed', fontWeight: 600, transition: '0.15s' }}>
                  Gửi
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}