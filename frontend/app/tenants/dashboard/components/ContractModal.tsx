'use client';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ContractProps {
  isOpen: boolean;
  onClose: () => void;
  contractData: {
    roomNumber: string;
    tenantName: string;
    tenantPhone: string;
    price: number;
    deposit: number;
    startDate: string;
    landlordName: string;
  };
}

export default function ContractModal({ isOpen, onClose, contractData }: ContractProps) {
  const contractRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportPDF = async () => {
    if (!contractRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await html2canvas(contractRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`HopDong_Phong_${contractData.roomNumber}.pdf`);
      
      alert(' Xuất Hợp đồng PDF thành công!');
    } catch (error) {
      console.error('Lỗi xuất PDF:', error);
      alert(' Có lỗi xảy ra khi xuất PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
      
      <div style={{ background: '#1e2330', width: '90%', maxWidth: 900, height: '90vh', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #252d3d', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <div style={{ padding: '16px 24px', background: '#161a21', borderBottom: '1px solid #252d3d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: '#f0f0f0', margin: 0, fontSize: 16, fontWeight: 600 }}>Xem trước Hợp đồng (Phòng {contractData.roomNumber})</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3d4a6b', color: '#8896a8', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Đóng</button>
            <button onClick={handleExportPDF} disabled={isExporting} style={{ padding: '8px 20px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 8, cursor: isExporting ? 'wait' : 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {isExporting ? 'Đang tạo PDF...' : '📥 Tải xuống PDF'}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', background: '#0f1219', display: 'flex', justifyContent: 'center' }}>
          <div 
            ref={contractRef} 
            style={{ 
              background: '#fff', 
              width: '794px', 
              minHeight: '1123px', 
              padding: '80px', 
              color: '#000', 
              fontFamily: '"Times New Roman", Times, serif', 
              fontSize: '18px',
              lineHeight: 1.5, 
              position: 'relative', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              margin: '20px auto',
              boxSizing: 'border-box'
            }}
          >
            
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: '80pt', color: 'rgba(59, 130, 246, 0.05)', fontWeight: 900, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
              LuanEZ SAAS
            </div>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{ fontWeight: 700, fontSize: '20px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style={{ fontWeight: 700, fontSize: '18px', textDecoration: 'underline' }}>Độc lập - Tự do - Hạnh phúc</div>
            </div>

            <h1 style={{ textAlign: 'center', fontSize: '26px', fontWeight: 700, marginBottom: '30px' }}>HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>

            <div style={{ marginBottom: '15px' }}>
              <strong style={{ fontSize: '18px' }}>BÊN CHO THUÊ (BÊN A):</strong>
              <div style={{ display: 'flex', marginTop: '5px' }}>
                <div style={{ width: '150px' }}>Họ và tên:</div>
                <div style={{ fontWeight: 700 }}>{contractData.landlordName}</div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '150px' }}>Đại diện cho:</div>
                <div>Hệ thống quản lý nhà trọ LuanEZ</div>
              </div>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <strong style={{ fontSize: '18px' }}>BÊN THUÊ (BÊN B):</strong>
              <div style={{ display: 'flex', marginTop: '5px' }}>
                <div style={{ width: '150px' }}>Họ và tên:</div>
                <div style={{ fontWeight: 700 }}>{contractData.tenantName}</div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '150px' }}>Số điện thoại:</div>
                <div>{contractData.tenantPhone}</div>
              </div>
            </div>

            <div style={{ fontStyle: 'italic', marginBottom: '15px' }}>Hai bên cùng thỏa thuận và thống nhất nội dung hợp đồng thuê phòng như sau:</div>

            <div style={{ fontWeight: 700, marginTop: '15px' }}>Điều 1: Nội dung thuê phòng</div>
            <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: '5px' }}>
              <li>- Bên A đồng ý cho bên B thuê phòng số: <strong>{contractData.roomNumber}</strong></li>
              <li>- Ngày bắt đầu tính tiền thuê: <strong>{contractData.startDate}</strong></li>
            </ul>

            <div style={{ fontWeight: 700, marginTop: '15px' }}>Điều 2: Giá thuê và Tiền cọc</div>
            <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: '5px' }}>
              <li>- Giá thuê phòng hàng tháng: <strong>{contractData.price.toLocaleString('vi-VN')} VNĐ</strong></li>
              <li>- Tiền đặt cọc: <strong>{contractData.deposit.toLocaleString('vi-VN')} VNĐ</strong></li>
              <li>- Tiền điện: 3.500đ/kWh | Tiền nước: 15.000đ/m³</li>
            </ul>

            <div style={{ fontWeight: 700, marginTop: '15px' }}>Điều 3: Trách nhiệm các bên</div>
            <ul style={{ paddingLeft: '30px', marginTop: '5px', textAlign: 'justify' }}>
              <li>Bên B có trách nhiệm thanh toán tiền phòng đúng hạn (trước ngày 05 hàng tháng).</li>
              <li>Giữ gìn vệ sinh chung, an ninh trật tự, không tàng trữ chất cấm theo quy định của Pháp luật.</li>
              <li>Khi chuyển đi phải báo trước cho Bên A ít nhất 30 ngày để được hoàn cọc.</li>
            </ul>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px', textAlign: 'center' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block' }}>ĐẠI DIỆN BÊN A</strong>
                <i style={{ fontSize: '16px' }}>(Ký, ghi rõ họ tên)</i>
                <div style={{ marginTop: '90px', fontWeight: 700 }}>{contractData.landlordName}</div>
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block' }}>ĐẠI DIỆN BÊN B</strong>
                <i style={{ fontSize: '16px' }}>(Ký, ghi rõ họ tên)</i>
                <div style={{ marginTop: '90px', fontWeight: 700 }}>{contractData.tenantName}</div>
              </div>
            </div>

            {/*  MÃ QR ĐÃ ĐƯỢC ĐƯA VÀO BÊN TRONG TỜ GIẤY  */}
            <div style={{ marginTop: '60px', display: 'flex', alignItems: 'center', gap: '15px', borderTop: '1px dashed #ccc', paddingTop: '20px' }}>
               <div style={{ width: '60px', height: '60px', border: '2px solid #000', padding: '4px', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                 {Array.from({ length: 16 }).map((_, i) => <div key={i} style={{ width: '22%', height: '22%', background: Math.random() > 0.4 ? '#000' : '#fff' }}/>)}
               </div>
               <div style={{ fontSize: '14px', color: '#666', lineHeight: 1.2 }}>
                 Văn bản điện tử được tạo bởi<br/>
                 <strong style={{ color: '#000' }}>Hệ thống LuanEZ SaaS</strong><br/>
                 Mã tra cứu: {Math.random().toString(36).substring(2, 10).toUpperCase()}
               </div>
            </div>

          </div>  
        </div>
      </div>
    </div>
  );
}