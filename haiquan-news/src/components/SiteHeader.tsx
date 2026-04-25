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
    <header className="bg-[#0059b2] text-white sticky top-0 z-50 shadow-md">
      {/* --- Top Bar --- */}
      <div className="bg-[#002060] text-white">
        <div className="container mx-auto max-w-[1200px] px-4 py-1.5 flex justify-between items-center text-[12px] tracking-wide border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-normal">{clock}</span>
            <span className="text-white/30 font-light text-[10px]">|</span>
            <Link href="/lien-he" className="hover:text-[#FFD700] transition uppercase font-medium">Liên hệ</Link>
          </div>
          
          <div className="flex gap-3 text-white/90 items-center">
            <a href="#" className="hover:opacity-80 transition" title="Zalo">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Icon_of_Zalo.svg/1200px-Icon_of_Zalo.svg.png" alt="Zalo" className="w-4 h-4 bg-white rounded-full" />
            </a>
            <a href="#" className="hover:text-[#FFD700] transition" title="YouTube">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.626-.246-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/></svg>
            </a>
            <a href="#" className="hover:text-[#FFD700] transition" title="Facebook">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947C23.721 2.601 21.306.181 16.948.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>
        </div>
      </div>

      {/* --- Main Header --- */}
      <div className="container mx-auto max-w-[1200px] px-4 py-3 flex flex-col md:flex-row justify-between items-center md:items-end">
        {/* Logo */}
        <Link href="/" className="block w-full md:w-auto mb-4 md:mb-0">
          <img 
            src={logoImg} 
            alt="Logo Hải Quân Việt Nam" 
            className="h-[55px] md:h-[65px] w-auto object-contain object-left" 
          />
        </Link>

        {/* Right Section (Buttons + Nav) */}
        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
          
          {/* Action Buttons */}
          <div className="flex gap-2 mb-3">
            <Link href="/bao-in" className="bg-white/10 hover:bg-[#176dc3] text-white text-[11px] font-bold uppercase px-3 py-1.5 rounded flex items-center gap-1.5 transition">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg> 
              BÁO IN
            </Link>
            <Link href="/truyen-hinh-hq" className="bg-white/10 hover:bg-[#176dc3] text-white text-[11px] font-bold uppercase px-3 py-1.5 rounded flex items-center gap-1.5 transition">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-5-6l-7 4V7z"/></svg> 
              TRUYỀN HÌNH HẢI QUÂN
            </Link>
            <button 
              onClick={() => setSearchOpen(!searchOpen)} 
              className="bg-white/10 hover:bg-[#176dc3] text-white text-[13px] font-bold px-3 py-1.5 rounded transition"
              title="Tìm kiếm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="w-full">
            <ul className="flex flex-wrap justify-center md:justify-end items-center gap-x-5 gap-y-2 font-['Roboto',sans-serif] text-[14px] md:text-[15px] font-bold tracking-tight text-white whitespace-nowrap">
              {navItems.map((item, i) => (
                <li key={i}>
                  <Link
                    href={item.href}
                    className={`hover:text-[#FFD700] transition flex items-center ${location === item.href ? 'text-[#FFD700]' : ''}`}
                  >
                    {item.icon ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    ) : (
                      item.label
                    )}
                  </Link>
                </li>
              ))}
              <li>
                <button 
                  onClick={() => setMenuOpen(!menuOpen)} 
                  className="hover:text-[#FFD700] transition ml-2 flex items-center justify-center"
                  title="Menu"
                >
                  {menuOpen ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                  )}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* --- Search Panel (Logic retained from original TSX) --- */}
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- Mobile Menu Drawer (Logic retained from original TSX) --- */}
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
