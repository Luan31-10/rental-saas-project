'use client';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Định nghĩa kiểu dữ liệu chuẩn
interface Comment {
  id: string;
  content: string;
  sender: 'TENANT' | 'ADMIN';
  createdAt: string;
}

interface Issue {
  id: string;
  title: string;
}

export default function ChatModal({ issue, onClose }: { issue: Issue, onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:3000/issue/${issue.id}/comments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setComments(res.data));

    const socket = io('http://localhost:3000');
    socket.on(`new_comment_${issue.id}`, (msg: Comment) => {
      setComments(prev => {
        if (prev.find(c => c.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return () => { socket.disconnect(); };
  }, [issue.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`http://localhost:3000/issue/${issue.id}/comment`, { content: text, sender: 'TENANT' }, { headers: { Authorization: `Bearer ${token}` } });
      setText('');
    } catch { alert('Lỗi gửi tin nhắn'); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 450, height: 550, background: '#161a21', borderRadius: 14, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #252d3d', display: 'flex', justifyContent: 'space-between', background: '#1e2330', borderRadius: '14px 14px 0 0' }}>
          <div><div style={{ fontWeight: 700, color: '#fff' }}>Chủ nhà hỗ trợ</div><div style={{ fontSize: 11, color: '#a78bfa' }}>{issue.title}</div></div>
          <button onClick={onClose} style={{ color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
           {comments.map((c) => (
             <div key={c.id} style={{ alignSelf: c.sender === 'TENANT' ? 'flex-end' : 'flex-start', padding: '10px 14px', borderRadius: 12, background: c.sender === 'TENANT' ? '#3d4a6b' : '#222836', fontSize: 13.5, maxWidth: '80%', color: '#fff' }}>{c.content}</div>
           ))}
           <div ref={endRef} />
        </div>
        <form onSubmit={send} style={{ padding: 20, borderTop: '1px solid #252d3d', display: 'flex', gap: 10 }}>
          <input value={text} onChange={e => setText(e.target.value)} placeholder="Nhập tin nhắn..." style={{ flex: 1, padding: 10, borderRadius: 8, background: '#111', border: '1px solid #252d3d', color: '#fff', outline: 'none' }} />
          <button type="submit" style={{ padding: '0 15px', borderRadius: 8, background: '#fff', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Gửi</button>
        </form>
      </div>
    </div>
  );
}