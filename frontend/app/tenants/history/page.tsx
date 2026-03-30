'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Cấu trúc dữ liệu Hóa đơn khớp với Prisma của sếp
interface Invoice {
  id: string;
  amount: number;
  description: string;
  status: string; // PENDING, PAID, CANCELLED
  createdAt: string;
}

export default function TenantHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vui lòng đăng nhập lại!');
        router.push('/login');
        return;
      }

      const res = await axios.get(`${API_URL}/invoice/my-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(res.data);
    } catch (error) {
      console.error('Lỗi lấy lịch sử thanh toán:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-[#1a1f28] p-8 font-sans text-[#e8e8e8]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-white border-b border-[#252d3d] pb-4">
          📜 Lịch Sử Thanh Toán
        </h2>

        {loading ? (
          <div className="text-center text-[#8896a8] py-10 animate-pulse">Đang tải dữ liệu hóa đơn...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-[#1e2330] border border-[#252d3d] rounded-xl p-10 text-center text-[#8896a8]">
            Bạn chưa có giao dịch thanh toán nào.
          </div>
        ) : (
          <div className="bg-[#1e2330] border border-[#252d3d] rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#161a21] text-[#8896a8] text-sm uppercase tracking-wider">
                  <th className="p-4 border-b border-[#252d3d]">Mã HĐ</th>
                  <th className="p-4 border-b border-[#252d3d]">Ngày lập</th>
                  <th className="p-4 border-b border-[#252d3d]">Nội dung (Phòng)</th>
                  <th className="p-4 border-b border-[#252d3d]">Số tiền</th>
                  <th className="p-4 border-b border-[#252d3d]">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#252d3d]/50 transition duration-150">
                    <td className="p-4 border-b border-[#252d3d] text-sm text-[#8896a8]">
                      #{inv.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 border-b border-[#252d3d] text-sm">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="p-4 border-b border-[#252d3d] text-sm">
                      Thanh toán hóa đơn phòng
                    </td>
                    <td className="p-4 border-b border-[#252d3d] font-bold text-white">
                      {formatCurrency(inv.amount)}
                    </td>
                    <td className="p-4 border-b border-[#252d3d]">
                      {inv.status === 'PAID' && (
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                          ĐÃ THANH TOÁN
                        </span>
                      )}
                      {inv.status === 'PENDING' && (
                        <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                          CHƯA ĐÓNG
                        </span>
                      )}
                      {inv.status === 'CANCELLED' && (
                        <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold border border-red-500/20">
                          ĐÃ HỦY
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}