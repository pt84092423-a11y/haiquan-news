import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { getSession, logout, can } from '@/lib/auth';
import logoImg from '@assets/logo_haiquan.png';
import UserProfileModal from '@/components/UserProfileModal';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const session = getSession();

  const handleLogout = async () => {
    await logout(session);
    setLocation('/admin/login');
  };

  const menuGroups = [
    {
      section: null,
      items: [
        {
          href: '/admin',
          label: 'Tổng quan',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
        },
      ]
    },
    {
      section: 'Bài viết',
      items: [
        { href: '/admin/bai-viet/moi', label: 'Viết bài mới', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> },
        { href: '/admin/bai-viet', label: 'Danh sách bài', indent: true },
        { href: '/admin/chuyen-muc', label: 'Chuyên mục', indent: true },
        { href: '/admin/binh-luan', label: 'Bình luận', indent: true },
        {
          href: '/admin/bao-in',
          label: 'Báo In',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        },
        { href: '/admin/bao-in-cuoi-tuan', label: 'Báo in Cuối tuần', indent: true },
        ...(can(session?.role, 'approve_requests') ? [{
          href: '/admin/duyet-yeu-cau', label: 'Hàng chờ duyệt',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
        }] : []),
      ]
    },
    {
      section: 'Truyền thông',
      items: [
        {
          href: '/admin/import-video',
          label: 'Import Video',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16l4-4 4 4" /></svg>
        },
        {
          href: '/admin/youtube',
          label: 'Kênh YouTube',
          icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
        },
        {
          href: '/admin/discord-bot',
          label: 'Discord Bot',
          icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.030z"/></svg>
        },
      ]
    },
    {
      section: 'Website',
      items: [
        {
          href: '/admin/cau-truc',
          label: 'Cấu trúc đơn vị',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 20H4a2 2 0 01-2-2v-7a2 2 0 012-2h7m0 11V9m0 11h9a2 2 0 002-2v-7a2 2 0 00-2-2h-9m0 0V4a2 2 0 012-2h4a2 2 0 012 2v5" /></svg>
        },
        {
          href: '/admin/chi-huy',
          label: 'Ban chỉ huy',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m0-4a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z" /></svg>
        },
        {
          href: '/admin/thanh-dieu-huong',
          label: 'Điều hướng',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
        },
        {
          href: '/admin/quang-cao',
          label: 'Quảng cáo',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-7 7h14M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        },
      ]
    },
    {
      section: 'Hệ thống',
      items: [
        ...(can(session?.role, 'manage_users') ? [{
          href: '/admin/nguoi-dung', label: 'Tài khoản',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        }] : []),
        ...(can(session?.role, 'view_audit_log') ? [{
          href: '/admin/audit-log', label: 'Nhật ký',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        }] : []),
        {
          href: '/admin/binh-luan', label: 'Bình luận',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        },
        { href: '/admin/cai-dat', label: 'Cài đặt & SEO', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { href: '/admin/setup', label: 'Database Setup', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4" /></svg> },
      ]
    },
    ...(can(session?.role, 'view_hadmin_panel') ? [{
      section: 'HADMIN',
      items: [
        {
          href: '/admin/seo',
          label: '🔍 Siêu Quản Lý SEO',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
        },
        {
          href: '/admin/hadmin',
          label: 'Bảng HADMIN',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        },
        {
          href: '/admin/ip-monitor',
          label: 'Theo dõi IP',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
        },
        {
          href: '/admin/ho-so-nguoi-dung',
          label: 'Hồ sơ người dùng',
          icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        },
      ]
    }] : []),
    ...(session?.username === 'TP67' ? [{
      section: 'TP67',
      items: [
        {
          href: '/admin/discord-reader',
          label: 'Đọc tin Discord',
          icon: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.030z"/></svg>,
        },
      ]
    }] : []),
  ];

  const roleBadge = session?.role === 'HADMIN' ? 'bg-red-500' : session?.role === 'ADMIN' ? 'bg-blue-500' : 'bg-green-500';

  return (
    <div className="bg-gradient-to-br from-[#f8fafc] via-[#eef5ff] to-[#f4f6f8] font-['Roboto',sans-serif] text-[#222222] h-screen flex overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'} bg-[#02183b] text-white flex flex-col h-full shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-20 flex-shrink-0 transition-all duration-300`}>
        <div className="h-20 flex items-center justify-center border-b border-white/5 bg-[#01122e]">
          <img src={logoImg} alt="Logo Báo Hải Quân" className="h-10 w-auto object-contain" />
        </div>

        <div className="flex-grow overflow-y-auto py-6 text-[14.5px]" style={{ scrollbarWidth: 'none' }}>
          <ul className="space-y-1.5">
            {menuGroups.map((group, gi) => (
              <li key={gi}>
                {group.section && (
                  <div className="px-8 mt-6 mb-3 text-white/40 text-[11px] font-bold uppercase tracking-widest">{group.section}</div>
                )}
                {group.items.map((item: any) => {
                  const isActive = location === item.href || (item.href !== '/admin' && location.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-4 py-3.5 transition border-l-[4px] ${
                        isActive
                          ? 'bg-[#0059b2] text-white border-[#FFD700] shadow-md font-bold'
                          : 'text-white/70 hover:text-white hover:bg-[#0a295c] border-transparent'
                      } ${item.indent ? 'pl-[56px]' : 'px-8'}`}
                    >
                      {item.icon && item.icon}
                      {item.label}
                    </Link>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>

        {session && (
          <div className="border-t border-white/10 p-4 bg-[#01122e]">
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-3 mb-3 w-full hover:bg-white/5 rounded-xl p-1.5 -m-1.5 transition cursor-pointer"
              title="Xem thông tin tài khoản của bạn"
            >
              {session.avatar_url ? (
                <img src={session.avatar_url} alt="Avatar" className="w-9 h-9 rounded-full object-cover border-2 border-[#FFD700] flex-shrink-0" />
              ) : (
                <div className={`w-9 h-9 rounded-full ${roleBadge} flex items-center justify-center text-white font-bold text-[13px] border-2 border-[#FFD700] flex-shrink-0`}>
                  {(session.display_name || session.username).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left flex-1 min-w-0">
                <p className="text-white text-[13px] font-bold leading-tight truncate">{session.display_name || session.username}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${roleBadge} text-white`}>{session.role}</span>
              </div>
              <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <a href="/admin/nguoi-dung" className="w-full text-left text-white/50 hover:text-white text-[12px] transition flex items-center gap-2 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Đổi avatar / mật khẩu
            </a>
            <button onClick={handleLogout} className="w-full text-left text-white/50 hover:text-white text-[12px] transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Đăng xuất
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-16 bg-white/90 backdrop-blur shadow-sm flex items-center justify-between px-6 md:px-10 z-10 flex-shrink-0 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-4 w-2/3">
            <button className="text-[#555555] hover:text-[#0059b2] transition" onClick={() => setSidebarOpen(o => !o)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="hidden md:flex text-[13.5px] text-gray-500 gap-2 items-center">
              <span>Bảng điều khiển</span>
              {title && <><span>/</span><span className="font-bold text-[#0059b2]">{title}</span></>}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" className="text-[13px] font-bold text-[#0059b2] hover:underline flex items-center gap-1.5 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 transition">
              Trang chủ
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </div>
      </main>

      {showProfileModal && session && (
        <UserProfileModal
          userId={session.id}
          viewerRole={session.role}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
