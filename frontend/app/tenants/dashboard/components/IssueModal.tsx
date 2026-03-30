'use client';
import { useState } from 'react';
import axios from 'axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  onSuccess: () => void;
}

export default function IssueModal({ isOpen, onClose, roomId, onSuccess }: Props) {
  const [data, setData] = useState({ title: '', description: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:3000/issue', { ...data, roomId }, { headers: { Authorization: `Bearer ${token}` } });
      setData({ title: '', description: '' });
      onSuccess();
      onClose();
    } catch { alert('Lỗi gửi báo cáo!'); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 420, background: '#1e2330', borderRadius: 14, padding: 24, border: '1px solid #2a3040' }}>
        <h3 style={{ marginBottom: 20 }}>Báo cáo sự cố mới</h3>
        <form onSubmit={handleSubmit}>
          <input required placeholder="Tiêu đề (VD: Hỏng vòi nước)" value={data.title} onChange={e => setData({...data, title: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#161a21', border: '1px solid #252d3d', color: '#fff', marginBottom: 14 }} />
          <textarea placeholder="Mô tả chi tiết..." rows={4} value={data.description} onChange={e => setData({...data, description: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, background: '#161a21', border: '1px solid #252d3d', color: '#fff', marginBottom: 20, resize: 'none' }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: 10, borderRadius: 8, background: 'transparent', border: '1px solid #2a3040', color: '#8896a8' }}>Hủy</button>
            <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 8, background: '#fff', color: '#000', fontWeight: 600 }}>Gửi yêu cầu</button>
          </div>
        </form>
      </div>
    </div>
  );
}