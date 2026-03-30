'use client';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Tesseract from 'tesseract.js';

interface ModalPayload {
  propertyName?: string;
  roomNumber?: string;
  area?: number | string;
  price?: number | string;
  name?: string;
  address?: string;
  electricity?: number | string;
  water?: number | string;
  totalAmount?: number | string;
  month?: number;
  year?: number;
  content?: string;
  roomId?: string;
  propertyId?: string;
  phone?: string;
  email?: string;
  deposit?: number | string;
  startDate?: string;
  [key: string]: unknown;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  action?: string;
  payload?: ModalPayload;
}

export default function AiAgentPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ name: 'Sếp', initial: 'S' });
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'Chào sếp! Trợ lý LuanEZ AI đã sẵn sàng. Dữ liệu giờ đây sẽ được lưu thẳng vào Database khi sếp duyệt!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<ModalPayload | null>(null);
  const [editData, setEditData] = useState<ModalPayload>({});
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // 🔥 THÊM STATE CHO AI QUÉT ẢNH
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded && decoded.email) {
        const namePart = decoded.email.split('@')[0];
        setUserInfo({ name: namePart, initial: namePart.charAt(0).toUpperCase() });
      }
    } catch { }
  }, [router]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const chatHistory = [...messages, userMsg].map(msg => ({ role: msg.role, content: msg.content }));
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(API_URL + '/ai/chat',
        { 
          params: { messages: chatHistory },
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      const { aiReply, action, payload } = res.data;
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', content: aiReply, action, payload };
      setMessages(prev => [...prev, aiMsg]);
      if (action && action.startsWith('OPEN_MODAL_')) {
        setModalData(payload);
        setEditData(payload || {});
        setActiveModal(action);
      }
    } catch (error) {
      console.error('Lỗi khi gọi API AI:', error);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Xin lỗi sếp, hệ thống đang lỗi hoặc API Key có vấn đề.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('✅ Đã copy hợp đồng vào khay nhớ tạm!');
  };

  const handleSaveData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      if (activeModal === 'OPEN_MODAL_ADD_PROPERTY') {
        await axios.get(API_URL + '/property', { params: { name: editData.name, address: editData.address }, headers });
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `✅ Đã lưu chính thức khu trọ **${editData.name}** vào Database!` }]);
      } else if (activeModal === 'OPEN_MODAL_ADD_ROOM') {
        await axios.post(API_URL + '/room', { roomNumber: String(editData.roomNumber), price: Number(editData.price), area: Number(editData.area), propertyId: editData.propertyId, status: 'AVAILABLE' }, { headers });
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `✅ Đã lưu phòng **${editData.roomNumber}** vào Database thành công!` }]);
      } else if (activeModal === 'OPEN_MODAL_ADD_TENANT') {
        await axios.post(API_URL + '/tenant', { name: editData.name, phone: editData.phone, email: editData.email, deposit: Number(editData.deposit), startDate: editData.startDate, roomId: editData.roomId, status: 'ACTIVE' }, { headers });
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `✅ Đã thêm khách hàng **${editData.name}** vào phòng ${editData.roomNumber}!` }]);
      } else if (activeModal === 'OPEN_MODAL_CREATE_INVOICE') {
        await axios.post(API_URL + '/invoice', { roomId: editData.roomId, electricity: Number(editData.electricity), water: Number(editData.water), amount: editData.totalAmount, month: editData.month, year: editData.year, status: 'PENDING' }, { headers });
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `✅ Đã chốt hóa đơn cho phòng **${editData.roomNumber}** thành công!` }]);
      } else if (activeModal === 'OPEN_MODAL_CHECK_OUT') {
        await axios.post(`${API_URL}/room/${editData.roomId}/checkout`, {}, { headers });
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: `✅ Đã hoàn tất thủ tục trả phòng cho phòng **${editData.roomNumber}**!` }]);
      }
      setActiveModal(null);
    } catch (error) {
      console.error('Lỗi khi lưu dữ liệu:', error);
      alert('⚠️ Có lỗi xảy ra khi gọi API NestJS. Sếp kiểm tra lại log Backend nhé!');
    }
  };

  // 🔥 HÀM XỬ LÝ QUÉT ẢNH AI TESSERACT
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);

    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.round(m.progress * 100));
            }
          }
        }
      );

      const text = result.data.text;
      const matches = text.match(/\d+([.,]\d+)?/g);
      
      if (matches && matches.length > 0) {
        const numberStr = matches[0].replace(',', '.');
        const numberValue = parseFloat(numberStr);

        if (!isNaN(numberValue)) {
          // Cập nhật con số vào form hóa đơn (ô nhập số điện)
          setEditData(prev => ({ ...prev, electricity: numberValue }));
          alert(`✅ AI quét được số điện là: ${numberValue}`);
        } else {
          alert('⚠️ Không phân tích được con số.');
        }
      } else {
        alert('⚠️ AI không tìm thấy con số nào trong ảnh!');
      }
    } catch (error) {
      console.error(error);
      alert('⚠️ Lỗi hệ thống AI quét ảnh.');
    } finally {
      setIsScanning(false);
    }
  };

  const quickActions = [
    { icon: '📝', label: 'Soạn hợp đồng', text: 'Soạn hợp đồng thuê nhà cho phòng 103' },
    { icon: '🧾', label: 'Làm hóa đơn', text: 'Tạo hóa đơn phòng 103, điện 50, nước 4' },
    { icon: '💰', label: 'Doanh thu', text: 'Báo cáo doanh thu tháng này' },
    { icon: '⚠️', label: 'Nhắc nợ', text: 'Ai chưa đóng tiền phòng?' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#1a1f28', color: '#e8e8e8', fontFamily: '"DM Sans", system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3040; border-radius: 4px; }

        .action-btn {
          background: rgba(255,255,255,0.03); border: 1px solid #252d3d;
          transition: all 0.2s; cursor: pointer; border-radius: 12px; padding: 16px;
        }
        .action-btn:hover { background: rgba(255,255,255,0.06); border-color: #354055; transform: translateY(-2px); }

        .chat-input {
          flex: 1; background: #222836; border: 1px solid #252d3d; color: #e8e8e8;
          padding: 16px 20px; border-radius: 12px; font-size: 15px; transition: all 0.2s;
          font-family: inherit;
        }
        .chat-input:focus { outline: none; border-color: #3d4a6b; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        .chat-input::placeholder { color: #4a5568; }

        .contract-box {
          background: #fff; color: #000; padding: 24px; border-radius: 8px; margin-top: 12px;
          font-family: 'Times New Roman', serif; white-space: pre-wrap; font-size: 15px;
          line-height: 1.5; border: 1px solid #ddd; max-height: 400px; overflow-y: auto;
        }

        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.65); display: flex; align-items: center;
          justify-content: center; z-index: 1000; backdrop-filter: blur(6px);
        }
        .modal-content {
          background: #1e2330; border: 1px solid #252d3d; width: 480px;
          border-radius: 14px; padding: 28px; box-shadow: 0 24px 64px rgba(0,0,0,0.5);
          max-height: 90vh; overflow-y: auto;
        }
        .modal-header { font-size: 17px; font-weight: 700; margin-bottom: 20px; color: #f0f0f0; border-bottom: 1px solid #252d3d; padding-bottom: 14px; }
        .input-group { margin-bottom: 16px; }
        .input-group label { display: block; font-size: 11.5px; color: #6b7280; margin-bottom: 7px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
        .input-group input {
          width: 100%; padding: 10px 14px; background: #161a21; border: 1px solid #252d3d;
          color: #e8e8e8; border-radius: 8px; font-size: 14px; transition: 0.2s; font-family: inherit;
        }
        .input-group input:focus { border-color: #3d4a6b; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.08); }
        .btn-group { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }
        .btn-cancel {
          padding: 10px 18px; background: transparent; border: 1px solid #252d3d;
          color: #8896a8; border-radius: 8px; cursor: pointer; transition: 0.2s; font-family: inherit; font-size: 13.5px;
        }
        .btn-cancel:hover { background: #222836; color: #e8e8e8; border-color: #2a3040; }
        .btn-save {
          padding: 10px 18px; background: #fff; border: none; color: #000;
          border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s; font-family: inherit; font-size: 13.5px;
        }
        .btn-save:hover { background: #f0f0f0; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: '1px solid #1e2330', background: '#161a21', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✨</div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f0f0f0' }}>Trợ lý AI LuanEZ</h1>
              <p style={{ fontSize: 12, color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, background: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Copilot Mode
              </p>
            </div>
          </div>
          <button onClick={() => router.push('/admin')} style={{ padding: '7px 14px', background: '#222836', border: '1px solid #252d3d', color: '#8896a8', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', transition: '0.15s' }}
            onMouseOver={e => { e.currentTarget.style.color = '#e8e8e8'; e.currentTarget.style.borderColor = '#2a3040'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#8896a8'; e.currentTarget.style.borderColor = '#252d3d'; }}>
            ← Dashboard
          </button>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24, background: '#1a1f28' }}>
          {messages.length === 1 && (
            <div style={{ maxWidth: 680, margin: '0 auto 20px', width: '100%' }}>
              <h3 style={{ fontSize: 12, color: '#4a5568', marginBottom: 16, fontWeight: 600, textAlign: 'center', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Gợi ý lệnh nhanh</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {quickActions.map((action, i) => (
                  <div key={i} className="action-btn" onClick={() => handleSendMessage(action.text)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{action.icon}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#d0d8e8' }}>{action.label}</span>
                    <span style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{action.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 14, alignItems: 'flex-start', maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: msg.role === 'ai' ? 'rgba(139,92,246,0.15)' : '#222836', border: msg.role === 'ai' ? '1px solid rgba(139,92,246,0.25)' : '1px solid #252d3d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>
                {msg.role === 'ai' ? '✨' : userInfo.initial}
              </div>
              <div style={{ maxWidth: '85%' }}>
                <div style={{ background: msg.role === 'user' ? '#222836' : 'transparent', padding: msg.role === 'user' ? '12px 16px' : '6px 0', borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : 0, border: msg.role === 'user' ? '1px solid #252d3d' : 'none', fontSize: 14.5, color: '#d0d8e8', lineHeight: 1.65 }}>
                  {msg.content}
                </div>
                {msg.action === 'DISPLAY_CONTRACT' && msg.payload?.content && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e2330', padding: '10px 16px', borderRadius: '8px 8px 0 0', border: '1px solid #252d3d', borderBottom: 'none' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6' }}>📄 BẢN THẢO HỢP ĐỒNG</span>
                      <button onClick={() => copyToClipboard(msg.payload?.content || '')} style={{ background: '#fff', color: '#000', border: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}>
                        Sao chép
                      </button>
                    </div>
                    <div className="contract-box">{msg.payload.content}</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', maxWidth: 800, margin: '0 auto', width: '100%' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✨</div>
              <div style={{ fontSize: 13.5, color: '#4a5568', fontStyle: 'italic' }}>AI đang xử lý lệnh của sếp...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px 32px 24px', background: '#161a21', borderTop: '1px solid #1e2330' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} style={{ display: 'flex', gap: 10 }}>
              <input value={input} onChange={e => setInput(e.target.value)} disabled={isLoading}
                placeholder="Ra lệnh cho AI (VD: Thêm phòng 104 giá 5 triệu vào khu Bình Thạnh)..."
                className="chat-input" />
              <button type="submit" disabled={!input.trim() || isLoading}
                style={{ width: 52, height: 52, borderRadius: 12, background: input.trim() ? '#fff' : '#222836', color: input.trim() ? '#000' : '#4a5568', border: '1px solid ' + (input.trim() ? '#fff' : '#252d3d'), cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
            <div style={{ fontSize: 12, color: '#2a3040', textAlign: 'center', marginTop: 12 }}>
              AI Copilot trích xuất và điền sẵn dữ liệu — Sếp xác nhận trước khi lưu.
            </div>
          </div>
        </div>
      </div>

      {activeModal && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {activeModal === 'OPEN_MODAL_ADD_PROPERTY' && (
              <>
                <div className="modal-header">🏢 Xác nhận Tạo Khu Trọ</div>
                <div className="input-group"><label>Tên khu trọ</label><input type="text" value={editData?.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                <div className="input-group"><label>Địa chỉ</label><input type="text" value={editData?.address || ''} onChange={e => setEditData({...editData, address: e.target.value})} /></div>
              </>
            )}
            {activeModal === 'OPEN_MODAL_ADD_ROOM' && (
              <>
                <div className="modal-header">🏠 Xác nhận Thêm Phòng Mới</div>
                <div className="input-group"><label>Khu trọ</label><input type="text" value={modalData?.propertyName || ''} disabled style={{opacity: 0.5}} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group"><label>Số phòng</label><input type="text" value={editData?.roomNumber || ''} onChange={e => setEditData({...editData, roomNumber: e.target.value})} /></div>
                  <div className="input-group"><label>Diện tích (m²)</label><input type="number" value={editData?.area || ''} onChange={e => setEditData({...editData, area: e.target.value})} /></div>
                </div>
                <div className="input-group"><label>Giá thuê (VNĐ)</label><input type="number" value={editData?.price || ''} onChange={e => setEditData({...editData, price: e.target.value})} /></div>
              </>
            )}
            {activeModal === 'OPEN_MODAL_ADD_TENANT' && (
              <>
                <div className="modal-header">👤 Xác nhận Khách Thuê Mới</div>
                <div className="input-group"><label>Phòng</label><input type="text" value={`Phòng ${modalData?.roomNumber || ''}`} disabled style={{opacity: 0.5}} /></div>
                <div className="input-group"><label>Tên Khách Hàng</label><input type="text" value={editData?.name || ''} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group"><label>Số Điện Thoại</label><input type="text" value={editData?.phone || ''} onChange={e => setEditData({...editData, phone: e.target.value})} /></div>
                  <div className="input-group"><label>CCCD / Email</label><input type="text" value={editData?.email || ''} onChange={e => setEditData({...editData, email: e.target.value})} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group"><label>Tiền cọc (VNĐ)</label><input type="number" value={editData?.deposit || 0} onChange={e => setEditData({...editData, deposit: e.target.value})} /></div>
                  <div className="input-group"><label>Ngày bắt đầu ở</label><input type="date" value={editData?.startDate || ''} onChange={e => setEditData({...editData, startDate: e.target.value})} /></div>
                </div>
              </>
            )}
            {activeModal === 'OPEN_MODAL_CREATE_INVOICE' && (
              <>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🧾 Chốt Hóa Đơn Tháng {modalData?.month}</span>
                  {/* 🔥 NÚT BẤM QUÉT AI */}
                  <label style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: isScanning ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isScanning ? (
                      `Đang đọc... ${scanProgress}%`
                    ) : (
                      <>📷 <span style={{ fontWeight: 600 }}>Quét AI</span></>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} disabled={isScanning} />
                  </label>
                </div>
                
                <div className="input-group"><label>Phòng</label><input type="text" value={`Phòng ${modalData?.roomNumber}`} disabled style={{opacity: 0.5}} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label>Số Điện (Ký)</label>
                    <input type="number" value={editData?.electricity || ''} onChange={e => setEditData({...editData, electricity: e.target.value})} style={{ borderColor: editData?.electricity ? '#3b82f6' : '#252d3d' }} />
                  </div>
                  <div className="input-group"><label>Số Nước (Khối)</label><input type="number" value={editData?.water || ''} onChange={e => setEditData({...editData, water: e.target.value})} /></div>
                </div>
                <div className="input-group"><label>Tổng tiền dự kiến (VNĐ)</label><input type="number" value={editData?.totalAmount || ''} onChange={e => setEditData({...editData, totalAmount: e.target.value})} style={{color: '#10b981', fontWeight: 'bold'}} /></div>
              </>
            )}
            {activeModal === 'OPEN_MODAL_CHECK_OUT' && (
              <>
                <div className="modal-header">🚪 Xác nhận Trả Phòng</div>
                <div style={{color: '#f87171', fontSize: 13.5, marginBottom: 16, lineHeight: 1.6, background: 'rgba(248,113,113,0.08)', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(248,113,113,0.2)'}}>
                  Sếp đang chuẩn bị làm thủ tục trả phòng cho <b>Phòng {modalData?.roomNumber}</b>. Hành động này sẽ chuyển trạng thái khách sang &quot;INACTIVE&quot; và đưa phòng về &quot;AVAILABLE&quot;.
                </div>
              </>
            )}
            <div className="btn-group">
              <button className="btn-cancel" onClick={() => setActiveModal(null)}>Hủy bỏ</button>
              <button className="btn-save" onClick={handleSaveData}>
                {activeModal === 'OPEN_MODAL_CHECK_OUT' ? 'Xác nhận Trả Phòng' : 'Xác nhận & Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}