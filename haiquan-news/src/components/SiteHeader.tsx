import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { realtimeClock } from '@/lib/utils';
import logoImg from '@assets/logo_haiquan.png';

export default function SiteHeader() {
  const [clock, setClock] = useState(realtimeClock());
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setClock(realtimeClock()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navItems = [
    { href: '/', label: '', icon: true },
    { href: '/tin-tuc', label: 'Tin tức' },
    { href: '/cau-truc', label: 'Cấu trúc' },
    { href: '/vi-chu-quyen', label: 'Vì chủ quyền biển đảo' },
    { href: '/tam-tinh', label: 'Tâm tình lính biển' },
    { href: '/lich-su', label: 'Lịch sử' },
    { href: '/chi-huy', label: 'Chỉ huy' },
    { href: '/da-phuong-tien', label: 'Đa phương tiện' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/tin-tuc?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="bg-[#0059b2] text-white sticky top-0 z-50 shadow-md">
      <div className="bg-[#002060] text-white">
        <div className="container mx-auto max-w-[1200px] px-4 py-1.5 flex justify-between items-center text-[12px] tracking-wide border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-normal">{clock}</span>
            <span className="text-white/30 font-light text-[10px]">|</span>
            <a href="#" className="hover:text-[#FFD700] transition uppercase font-medium">Liên hệ</a>
          </div>
          <div className="flex gap-3 text-white/90 items-center">
            <a href="https://x.com/SROVNavy36/status/2010442603951706552" target="_blank" rel="noreferrer" className="hover:text-[#FFD700] transition" title="X (Twitter)">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://www.youtube.com/@TGM_Kuroma" target="_blank" rel="noreferrer" className="hover:text-[#FFD700] transition" title="YouTube">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.626-.246-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" /></svg>
            </a>
            <a href="https://www.tiktok.com/@srovnavy36" target="_blank" rel="noreferrer" className="hover:text-[#FFD700] transition" title="TikTok">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" /></svg>
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-[1200px] px-4">
        {/* Row 1: Logo (left) + Action buttons (right) */}
        <div className="flex justify-between items-center py-3">
          <Link href="/" className="block flex-shrink-0">
            <img
              src={logoImg}
              alt="Logo Báo Hải Quân Việt Nam"
              className="h-[55px] md:h-[68px] w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Mobile: icon-only; Desktop: icon + text */}
            <Link href="/bao-in" className="bg-white/10 hover:bg-[#176dc3] text-white font-bold uppercase py-1.5 md:py-2 rounded flex items-center gap-1.5 transition shadow-sm border border-white/10 px-2 md:px-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
              <span className="hidden sm:inline text-[11px] md:text-[12px]">BÁO IN</span>
            </Link>
            <Link href="/truyen-hinh-hq" className="bg-white/10 hover:bg-[#176dc3] text-white font-bold uppercase py-1.5 md:py-2 rounded flex items-center gap-1.5 transition shadow-sm border border-white/10 px-2 md:px-4">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-7 4V7z" /></svg>
              <span className="hidden md:inline text-[11px] md:text-[12px]">TRUYỀN HÌNH HẢI QUÂN</span>
            </Link>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="bg-white/10 hover:bg-[#176dc3] text-white px-2.5 py-1.5 md:py-2 rounded transition shadow-sm border border-white/10 flex items-center justify-center"
              title="Tìm kiếm"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>

        {/* Row 2: Navigation */}
        <nav className="border-t border-white/10 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <ul className="flex items-center gap-x-5 lg:gap-x-7 font-['Roboto',sans-serif] text-[14px] md:text-[15px] font-bold tracking-tight text-white whitespace-nowrap py-2">
            {navItems.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className={`hover:text-[#FFD700] transition ${location === item.href ? 'text-[#FFD700]' : ''} flex items-center`}
                >
                  {item.icon ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                  ) : item.label}
                </Link>
              </li>
            ))}
            <li className="ml-auto">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="hover:text-[#FFD700] transition"
                title="Menu"
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                )}
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {searchOpen && (
        <div className="bg-[#001540] border-t border-white/10">
          <div className="container mx-auto max-w-[1200px] px-4 py-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tin tức..."
                className="flex-1 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded px-4 py-2 text-[14px] focus:outline-none focus:border-white/50"
              />
              <button
                type="submit"
                className="bg-[#FFD700] text-[#002060] font-bold px-5 py-2 rounded hover:bg-yellow-300 transition text-[13px]"
              >
                Tìm
              </button>
              <button
                type="button"
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="bg-white/10 text-white px-3 py-2 rounded hover:bg-white/20 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="bg-[#002060] border-t border-white/10">
          <div className="container mx-auto max-w-[1200px] px-4 py-4">
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {navItems.filter(item => !item.icon).map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className={`block px-3 py-2 rounded text-[14px] font-bold hover:bg-white/10 hover:text-[#FFD700] transition ${location === item.href ? 'text-[#FFD700] bg-white/10' : 'text-white'}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
