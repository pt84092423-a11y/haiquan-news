import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { realtimeClock } from '@/lib/utils';
import { getSiteSetting, parseJsonSetting } from '@/lib/supabase';
import logoImg from '@assets/logo_haiquan.png';

export type NavItem = { href: string; label: string; icon?: boolean };

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: '/', label: '', icon: true },
  { href: '/tin-tuc', label: 'Tin tức' },
  { href: '/cau-truc', label: 'Cấu trúc' },
  { href: '/vi-chu-quyen', label: 'Vì chủ quyền biển đảo' },
  { href: '/tam-tinh', label: 'Tâm tình lính biển' },
  { href: '/lich-su', label: 'Lịch sử' },
  { href: '/chi-huy', label: 'Chỉ huy' },
  { href: '/da-phuong-tien', label: 'Đa phương tiện' },
];

export default function SiteHeader() {
  const [clock, setClock] = useState(realtimeClock());
  const [location] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [navItems, setNavItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
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

  useEffect(() => {
    getSiteSetting('site_nav_items').then(value => {
      const parsed = parseJsonSetting<NavItem[]>(value, DEFAULT_NAV_ITEMS);
      if (Array.isArray(parsed) && parsed.length > 0) setNavItems(parsed);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/tin-tuc?q=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="w-full z-50 sticky top-0 shadow-lg select-none">
      {/* Top Bar (Dark Navy) */}
      <div className="bg-[#002060] text-white">
        <div className="container mx-auto max-w-[1200px] px-4 py-2 flex justify-between items-center text-[11px] md:text-[12px] font-['Roboto',sans-serif] tracking-wide uppercase border-b border-white/5">
          <div className="flex items-center gap-4">
            <span className="font-medium opacity-90">{clock}</span>
            <span className="opacity-20 hidden sm:inline">|</span>
            <Link href="/lien-he" className="hover:text-sky-300 transition-colors hidden sm:inline">Liên hệ</Link>
          </div>
          <div className="flex gap-4 items-center opacity-80">
            <a href="https://x.com/SROVNavy36/status/2010442603951706552" target="_blank" rel="noreferrer" className="hover:text-sky-300 transition-transform hover:scale-110">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://www.youtube.com/@TGM_Kuroma" target="_blank" rel="noreferrer" className="hover:text-red-500 transition-transform hover:scale-110">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.626-.246-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" /></svg>
            </a>
            <a href="https://www.tiktok.com/@srovnavy36" target="_blank" rel="noreferrer" className="hover:text-sky-300 transition-transform hover:scale-110">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" /></svg>
            </a>
          </div>
        </div>
      </div>

      {/* Main Bar (Royal Blue) */}
      <div className="bg-[#0059b2] text-white">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="flex justify-between items-center py-3 md:py-4">
            <Link href="/" className="block transition-transform active:scale-95">
              <img
                src={logoImg}
                alt="Logo Báo Hải Quân Việt Nam"
                className="h-[55px] md:h-[75px] w-auto object-contain"
              />
            </Link>

            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/bao-in" className="group flex items-center gap-2 bg-[#00305f]/40 hover:bg-[#00305f] border border-white/20 px-3 md:px-5 py-2 md:py-2.5 rounded-sm transition-all duration-300">
                <svg className="w-4 h-4 text-sky-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" /></svg>
                <span className="hidden sm:inline text-[11px] md:text-[13px] font-bold uppercase tracking-widest group-hover:translate-x-0.5 transition-transform">Báo in</span>
              </Link>
              
              <Link href="/truyen-hinh-hq" className="group flex items-center gap-2 bg-[#00305f]/40 hover:bg-[#00305f] border border-white/20 px-3 md:px-5 py-2 md:py-2.5 rounded-sm transition-all duration-300">
                <svg className="w-4 h-4 text-sky-300" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-7 4V7z" /></svg>
                <span className="hidden md:inline text-[11px] md:text-[13px] font-bold uppercase tracking-widest group-hover:translate-x-0.5 transition-transform">Truyền hình Hải Quân</span>
              </Link>

              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`flex items-center justify-center p-2.5 md:p-3 rounded-sm transition-all duration-300 border border-white/20 ${searchOpen ? 'bg-white text-[#0059b2]' : 'bg-[#00305f]/40 hover:bg-[#00305f] text-white'}`}
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="border-t border-white/10 relative">
            <div className="overflow-x-auto scrollbar-hide">
              <ul className="flex items-center font-['Roboto',sans-serif] text-[13px] md:text-[14px] font-black uppercase tracking-wide text-white whitespace-nowrap">
                {navItems.map((item, i) => (
                  <li key={i} className="flex-shrink-0">
                    <Link
                      href={item.href}
                      className={`block py-3.5 px-4 md:px-5 border-b-2 border-transparent transition-all duration-300 ${location === item.href ? 'bg-[#00305f] border-sky-400 text-sky-300' : 'hover:bg-[#00478f] hover:text-sky-200'}`}
                    >
                      {item.icon ? (
                        <svg className="w-5 h-5 mb-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                      ) : item.label}
                    </Link>
                  </li>
                ))}
                
                {/* Burger Menu Button (Far Right) */}
                <li className="ml-auto sticky right-0 bg-[#0059b2] shadow-[-10px_0_15px_rgba(0,0,0,0.1)]">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={`py-3.5 px-5 transition-colors ${menuOpen ? 'bg-[#002060] text-sky-300' : 'hover:bg-[#00478f]'}`}
                  >
                    {menuOpen ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                  </button>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>

      {/* Search Overlay (Hidden by default) */}
      {searchOpen && (
        <div className="bg-white border-b-4 border-[#0059b2] shadow-2xl animate-in slide-in-from-top duration-300">
          <div className="container mx-auto max-w-[800px] px-4 py-8">
            <form onSubmit={handleSearch} className="relative group">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Nhập nội dung cần tìm..."
                className="w-full bg-gray-100 text-[#002060] border-2 border-gray-200 rounded-full px-8 py-4 text-[16px] font-medium focus:outline-none focus:border-[#0059b2] focus:bg-white transition-all shadow-inner"
              />
              <button
                type="submit"
                className="absolute right-3 top-2 bg-[#0059b2] text-white p-2.5 rounded-full hover:bg-[#002060] transition-colors shadow-md"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mega Menu Overlay */}
      {menuOpen && (
        <div className="bg-[#002060] text-white border-t border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top">
          <div className="container mx-auto max-w-[1200px] px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-4">
              {navItems.filter(item => !item.icon).map((item, i) => (
                <li key={i} className="list-none group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 py-3 px-4 rounded-sm border-l-4 border-transparent hover:border-sky-400 hover:bg-white/5 transition-all ${location === item.href ? 'border-sky-400 bg-white/10 text-sky-300' : 'text-gray-300'}`}
                  >
                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[15px] font-bold uppercase tracking-tight font-['Roboto',sans-serif]">{item.label}</span>
                  </Link>
                </li>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
