'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState({ name: 'Admin', initial: 'A' });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // 🔥 Thêm state hứng Avatar

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Hàm parse JWT an toàn hơn
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = parseJwt(token);
      if (decoded?.email) {
        const namePart = decoded.email.split('@')[0];
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUserInfo({
          name: namePart,
          initial: namePart.charAt(0).toUpperCase(),
        });
      }

      // 🔥 1. Gọi API lấy Avatar khi mới load trang
      fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.avatar) setAvatarUrl(data.avatar);
      })
      .catch(err => console.error("Lỗi tải avatar sidebar:", err));
    }

    // 🔥 2. Đeo tai nghe: Chờ nghe loa từ trang Settings báo cập nhật ảnh
    const handleAvatarUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      setAvatarUrl(customEvent.detail); // Nhận link ảnh mới và đổi ngay!
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);

    return () => {
      // Dọn dẹp tai nghe khi tắt component
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [API_URL]);

  const navGroups = [
    {
      label: 'Tổng quan',
      items: [
        { key: 'overview', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" fill="currentColor"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" opacity=".5"/></svg>), label: 'Dashboard', path: '/admin' },
        { key: 'reports', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 11L5.5 7L8.5 9.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>), label: 'Báo cáo', path: '/reports' },
      ]
    },
    {
      label: 'Quản lý',
      items: [
        { key: 'properties', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 5.5V14H5.5V10H9.5V14H14V5.5L7.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>), label: 'Khu trọ', path: '/properties' },
        { key: 'rooms', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 6.5H13.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 6.5V12.5" stroke="currentColor" strokeWidth="1.3"/></svg>), label: 'Phòng trọ', path: '/rooms' },
        { key: 'issues', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1L1 13h13L7.5 1zM7.5 5v4M7.5 11h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>), label: 'Sự cố', path: '/issues' },
        { key: 'ai-agent', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7.5C5 6.12 6.12 5 7.5 5s2.5 1.12 2.5 2.5S8.88 10 7.5 10 5 8.88 5 7.5Z" fill="currentColor" opacity=".6"/></svg>), label: 'Trợ lý AI', path: '/ai-agent' },
        { key: 'tenants', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-3.04 2.46-5.5 5.5-5.5S13 9.96 13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Khách thuê', path: '/tenants' },
      ]
    },
    {
      label: 'Tài chính',
      items: [
        { key: 'invoices', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="1.5" width="11" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 5.5H10M5 8H10M5 10.5H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Hóa đơn', path: '/invoices' },
        { key: 'revenue', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 4.5V7.5L9.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Doanh thu', path: '/revenue' },
        { key: 'pricing', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M13.5 7.5l-6 6a1.41 1.41 0 01-2 0l-4-4a1.41 1.41 0 010-2l6-6H13.5v6z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="5" r="1" fill="currentColor"/></svg>), label: 'Bảng giá', path: '/pricing' },
      ]
    },
    {
      label: 'Hệ thống',
      items: [
        { key: 'settings', icon: (<svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M12.2 2.8l-1.06 1.06M3.86 11.14L2.8 12.2M12.2 12.2l-1.06-1.06M3.86 3.86L2.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>), label: 'Cài đặt', path: '/settings' },
      ]
    }
  ];

  return (
    <aside style={{ width: 220, flexShrink: 0, background: '#161a21', borderRight: '1px solid #1e2330', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100vh' }}>
      <style>{`
        .sidebar-nav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: 7px; cursor: pointer;
          color: #6b7280; font-size: 13px; font-weight: 500;
          transition: all 0.15s; margin-bottom: 2px; user-select: none;
        }
        .sidebar-nav-item:hover { color: #d0d8e8; background: rgba(255,255,255,0.04); }
        .sidebar-nav-item.active { color: #f0f0f0; background: rgba(255,255,255,0.07); font-weight: 600; }
        .sidebar-nav-item svg { opacity: 0.5; flex-shrink: 0; }
        .sidebar-nav-item.active svg { opacity: 1; }
        
        .sidebar-logout-btn {
          display: flex; align-items: center; gap: 9px; width: 100%;
          padding: 8px 10px; border-radius: 7px; background: transparent; border: none;
          color: #8896a8; font-size: 13px; font-weight: 500; cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .sidebar-logout-btn:hover { color: #ef4444; background: rgba(239,68,68,0.08); }
      `}</style>

      {/* Logo */}
      <div style={{ padding: '16px 14px 14px', borderBottom: '1px solid #1e2330' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Image 
            src="/logo.png" 
            alt="LuanEZ Logo" 
            width={34}
            height={34}
            style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #252d3d' }} 
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.2px' }}>LuanEZ</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>Quản lý nhà trọ</div>
          </div>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2330', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#2a3040', border: '1px solid #303848', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#bbb', flexShrink: 0, overflow: 'hidden' }}>
          {/* 🔥 3. Hiển thị Avatar nếu có, không có thì hiện chữ */}
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl.startsWith('http') ? avatarUrl : `${API_URL}${avatarUrl}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            userInfo.initial
          )}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', textTransform: 'capitalize', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userInfo.name}
          </div>
          <div style={{ fontSize: 11, color: '#4a5568' }}>Chủ nhà trọ</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {navGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: '#4a5568', letterSpacing: '0.07em', textTransform: 'uppercase', padding: '0 10px', marginBottom: 5 }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`); 
              return (
                <div key={item.key}
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => item.path !== '#' ? router.push(item.path) : alert('Đang phát triển')}>
                  {item.icon}
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px', borderTop: '1px solid #1e2330' }}>
        <button 
          className="sidebar-logout-btn" 
          onClick={() => { 
            if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) { 
              localStorage.removeItem('token'); 
              router.push('/login'); 
            } 
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M6 2H2.5a.5.5 0 00-.5.5v10a.5.5 0 00.5.5H6M10 10.5L13 7.5M13 7.5L10 4.5M13 7.5H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}