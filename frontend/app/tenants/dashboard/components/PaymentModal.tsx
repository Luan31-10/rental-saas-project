'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface RoomInfo {
  id: string; // ID phòng (hoặc hóa đơn tùy cách sếp truyền)
  invoiceId?: string; // 🔥 Cực kỳ quan trọng: Sếp nhớ truyền ID hóa đơn thật vào đây từ Dashboard nhé
  balance: number;
  roomNumber: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomInfo: RoomInfo;
}

export default function PaymentModal({ isOpen, onClose, roomInfo }: Props) {
  const [method, setMethod] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const [bankData] = useState({
    bankId: 'TCB',
    bankAccount: '19038975516014',
    bankAccountName: 'VO THANH LUAN',
  });

  useEffect(() => {
    if (!isOpen) {
      setIsSuccess(false);
      setMethod('AUTO');
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !roomInfo) return null;

  const amount = roomInfo.balance || 0;
  const transferContent = `Phong ${roomInfo.roomNumber} thanh toan`;
  const qrCodeUrl = `https://img.vietqr.io/image/${bankData.bankId}-${bankData.bankAccount}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankData.bankAccountName)}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayOS = async () => {
    // 🔥 Lấy ID hóa đơn (Ưu tiên invoiceId, nếu không có mới dùng id)
    const targetInvoiceId = roomInfo.invoiceId || roomInfo.id;
    
    if (!targetInvoiceId) {
      alert('Không tìm thấy mã hóa đơn hợp lệ để thanh toán!');
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      const res = await axios.post(
        'http://localhost:3000/payos/create-link',
        { invoiceId: targetInvoiceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.error("Lỗi tạo link thanh toán:", err.response?.data);
        alert(err.response?.data?.message || 'Lỗi cổng tự động, vui lòng thử chuyển khoản thủ công!');
      } else {
        alert('Lỗi hệ thống, vui lòng thử lại sau!');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .pm-overlay {
          position: fixed; inset: 0;
          background: rgba(2, 4, 15, 0.85);
          backdrop-filter: blur(20px);
          display: flex; align-items: center; justify-content: center;
          z-index: 999;
          animation: pm-overlayIn 0.3s ease;
        }

        .pm-modal {
          width: 440px;
          background: #080e1c;
          border-radius: 28px;
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.04);
          animation: pm-modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'Sora', sans-serif;
        }

        /* Ambient glow top */
        .pm-modal::before {
          content: '';
          position: absolute;
          top: -80px; left: 50%; transform: translateX(-50%);
          width: 300px; height: 200px;
          background: radial-gradient(ellipse, rgba(56, 189, 248, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        .pm-header {
          padding: 28px 28px 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
        }

        .pm-title-area {}
        .pm-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #38bdf8;
          margin-bottom: 6px;
        }
        .pm-title {
          font-size: 20px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0;
          letter-spacing: -0.4px;
        }

        .pm-close {
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          color: #64748b;
          cursor: pointer;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .pm-close:hover {
          background: rgba(255,255,255,0.1);
          color: #cbd5e1;
          border-color: rgba(255,255,255,0.12);
        }

        .pm-amount-card {
          margin: 20px 28px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 18px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pm-amount-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          margin-bottom: 4px;
          letter-spacing: 0.3px;
        }
        .pm-amount-value {
          font-size: 28px;
          font-weight: 800;
          color: #10b981;
          letter-spacing: -1px;
          font-family: 'Sora', sans-serif;
        }
        .pm-amount-currency {
          font-size: 14px;
          font-weight: 600;
          color: #10b981;
          opacity: 0.7;
          margin-left: 4px;
        }
        .pm-amount-icon {
          width: 44px; height: 44px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }

        .pm-tabs {
          display: flex;
          margin: 0 28px 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 5px;
          gap: 4px;
        }
        .pm-tab {
          flex: 1;
          padding: 10px 12px;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.25s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          font-family: 'Sora', sans-serif;
          letter-spacing: -0.2px;
        }
        .pm-tab-auto {
          background: transparent;
          color: #64748b;
        }
        .pm-tab-auto.active {
          background: #38bdf8;
          color: #0c1220;
          box-shadow: 0 4px 16px rgba(56, 189, 248, 0.25);
        }
        .pm-tab-manual {
          background: transparent;
          color: #64748b;
        }
        .pm-tab-manual.active {
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .pm-body {
          padding: 0 28px 28px;
          min-height: 230px;
          display: flex;
          flex-direction: column;
        }

        /* AUTO panel */
        .pm-auto-desc {
          color: #475569;
          font-size: 13.5px;
          line-height: 1.7;
          margin-bottom: 24px;
          text-align: center;
        }
        .pm-auto-desc strong { color: #94a3b8; font-weight: 600; }

        .pm-badge-row {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 24px;
        }
        .pm-badge {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11.5px;
          color: #64748b;
          font-weight: 500;
        }
        .pm-badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #10b981;
        }

        .pm-btn-pay {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%);
          color: #0c1220;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 8px 24px -8px rgba(56, 189, 248, 0.4);
          display: flex; align-items: center; justify-content: center;
          gap: 9px;
          font-family: 'Sora', sans-serif;
          letter-spacing: -0.2px;
          position: relative;
          overflow: hidden;
        }
        .pm-btn-pay::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
          pointer-events: none;
        }
        .pm-btn-pay:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px -8px rgba(56, 189, 248, 0.5);
        }
        .pm-btn-pay:active:not(:disabled) { transform: translateY(0); }
        .pm-btn-pay:disabled {
          background: #1e293b;
          color: #475569;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* MANUAL / QR panel */
        .pm-qr-wrap {
          display: flex; flex-direction: column; align-items: center;
          flex: 1;
        }
        .pm-qr-frame {
          background: #fff;
          padding: 10px;
          border-radius: 16px;
          margin-bottom: 18px;
          border: 3px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .pm-qr-frame img {
          width: 168px; height: 168px;
          border-radius: 8px;
          display: block;
        }

        .pm-bank-info {
          width: 100%;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 18px;
        }
        .pm-bank-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 11px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .pm-bank-row:last-child { border-bottom: none; }
        .pm-bank-key {
          font-size: 12px;
          color: #475569;
          font-weight: 500;
        }
        .pm-bank-val {
          font-size: 13px;
          color: #cbd5e1;
          font-weight: 600;
          font-family: 'Sora', sans-serif;
        }
        .pm-bank-val.accent {
          color: #38bdf8;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12.5px;
          cursor: pointer;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.2s;
        }
        .pm-bank-val.accent:hover { color: #7dd3fc; }

        .pm-btn-done {
          width: 100%;
          padding: 14px;
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 14px;
          font-weight: 600;
          font-size: 14.5px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Sora', sans-serif;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .pm-btn-done:hover {
          background: rgba(16, 185, 129, 0.14);
          border-color: rgba(16, 185, 129, 0.3);
        }

        /* Success state */
        .pm-success {
          padding: 16px 0 8px;
          display: flex; flex-direction: column; align-items: center;
          animation: pm-fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pm-success-ring {
          width: 76px; height: 76px;
          border-radius: 50%;
          border: 2px solid rgba(16, 185, 129, 0.25);
          background: rgba(16, 185, 129, 0.08);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          position: relative;
        }
        .pm-success-ring::before {
          content: '';
          position: absolute; inset: -6px;
          border-radius: 50%;
          border: 1px solid rgba(16, 185, 129, 0.08);
        }
        .pm-success-title {
          font-size: 20px;
          font-weight: 700;
          color: #f1f5f9;
          margin: 0 0 10px;
          letter-spacing: -0.4px;
        }
        .pm-success-sub {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          text-align: center;
          max-width: 260px;
        }

        /* Divider */
        .pm-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 0 28px 20px;
        }

        /* Spinner */
        .pm-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(12,18,32,0.3);
          border-top-color: #0c1220;
          border-radius: 50%;
          animation: pm-spin 0.7s linear infinite;
        }

        /* Copy toast */
        .pm-copied {
          position: absolute;
          bottom: -26px; left: 50%; transform: translateX(-50%);
          background: #1e293b;
          border: 1px solid rgba(255,255,255,0.1);
          color: #94a3b8;
          font-size: 11px;
          padding: 3px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
        }

        @keyframes pm-overlayIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pm-modalIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes pm-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pm-spin { to { transform: rotate(360deg); } }
        @keyframes pm-tabIn { from { opacity: 0; transform: translateX(6px); } to { opacity: 1; transform: translateX(0); } }
        .pm-panel { animation: pm-tabIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); flex: 1; display: flex; flex-direction: column; }
      `}</style>

      <div className="pm-overlay" onClick={onClose}>
        <div className="pm-modal" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="pm-header">
            <div className="pm-title-area">
              <div className="pm-label">Phòng {roomInfo.roomNumber}</div>
              <h3 className="pm-title">Thanh toán hóa đơn</h3>
            </div>
            <button className="pm-close" onClick={onClose}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Amount Card */}
          <div className="pm-amount-card">
            <div>
              <div className="pm-amount-label">Số tiền thanh toán</div>
              <div className="pm-amount-value">
                {amount.toLocaleString('vi-VN')}
                <span className="pm-amount-currency">₫</span>
              </div>
            </div>
            <div className="pm-amount-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
          </div>

          <div className="pm-divider" />

          {/* Tabs */}
          <div className="pm-tabs">
            <button className={`pm-tab pm-tab-auto ${method === 'AUTO' ? 'active' : ''}`} onClick={() => setMethod('AUTO')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
              Tự động
            </button>
            <button className={`pm-tab pm-tab-manual ${method === 'MANUAL' ? 'active' : ''}`} onClick={() => setMethod('MANUAL')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 9h6M9 12h6M9 15h4"/>
              </svg>
              Mã QR
            </button>
          </div>

          {/* Body */}
          <div className="pm-body">
            {!isSuccess ? (
              <>
                {method === 'AUTO' ? (
                  <div className="pm-panel">
                    <p className="pm-auto-desc">
                      Chuyển hướng đến cổng thanh toán an toàn. Trạng thái hóa đơn được cập nhật
                      <strong> tức thì</strong> sau giao dịch thành công.
                    </p>
                    <div className="pm-badge-row">
                      <span className="pm-badge"><span className="pm-badge-dot" />Bảo mật SSL</span>
                      <span className="pm-badge"><span className="pm-badge-dot" />Xác nhận ngay</span>
                      <span className="pm-badge"><span className="pm-badge-dot" />PayOS</span>
                    </div>
                    <button className="pm-btn-pay" onClick={handlePayOS} disabled={isProcessing}>
                      {isProcessing ? (
                        <><div className="pm-spinner" />Đang kết nối...</>
                      ) : (
                        <>
                          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                          </svg>
                          Thanh toán qua PayOS
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="pm-panel">
                    <div className="pm-qr-wrap">
                      <div className="pm-qr-frame">
                        {/* 🔥 Thêm bùa chú chặn Next.js càm ràm vụ thẻ img */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeUrl} alt="VietQR Code" />
                      </div>

                      <div className="pm-bank-info">
                        <div className="pm-bank-row">
                          <span className="pm-bank-key">Chủ tài khoản</span>
                          <span className="pm-bank-val">{bankData.bankAccountName}</span>
                        </div>
                        <div className="pm-bank-row">
                          <span className="pm-bank-key">Ngân hàng</span>
                          <span className="pm-bank-val">{bankData.bankId}</span>
                        </div>
                        <div className="pm-bank-row" style={{ position: 'relative' }}>
                          <span className="pm-bank-key">Nội dung CK</span>
                          <span
                            className="pm-bank-val accent"
                            onClick={() => handleCopy(transferContent)}
                            title="Nhấn để sao chép"
                          >
                            {transferContent}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            </svg>
                            {copied && <span className="pm-copied">Đã sao chép!</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      className="pm-btn-done"
                      onClick={() => { setIsSuccess(true); setTimeout(onClose, 2500); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                      Tôi đã chuyển khoản xong
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="pm-success">
                <div className="pm-success-ring">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="pm-success-title">Giao dịch thành công!</h3>
                <p className="pm-success-sub">Hệ thống đang xử lý và cập nhật trạng thái hóa đơn của bạn.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}