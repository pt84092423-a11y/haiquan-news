import React from 'react';
import { Link } from 'wouter';
import logoImg from '@assets/logo_haiquan.png';

export default function SiteFooter() {
  return (
    <footer className="w-full mt-auto">
      {/* Main footer body */}
      <div className="w-full bg-white pt-10 pb-8 shadow-inner border-t border-gray-200">
        <div className="container mx-auto max-w-[1200px] px-4">

          {/* Nav grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-8 pb-8 border-b border-gray-200">
            <div>
              <h3 className="font-bold text-[13px] uppercase text-[#002060] mb-3">Tin tức</h3>
              <ul className="text-[12px] text-gray-500 space-y-1.5">
                <li><Link href="/tin-tuc" className="hover:text-[#0059b2] transition">Tin tức - Sự kiện</Link></li>
                <li><Link href="/chinh-tri" className="hover:text-[#0059b2] transition">Chính trị</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[13px] uppercase text-[#002060] mb-3">Cấu trúc</h3>
              <ul className="text-[12px] text-gray-500 space-y-1.5">
                <li><Link href="/cau-truc" className="hover:text-[#0059b2] transition">Cơ cấu tổ chức</Link></li>
                <li><Link href="/cau-truc" className="hover:text-[#0059b2] transition">Các đơn vị</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[13px] uppercase text-[#002060] mb-3">Vì chủ quyền</h3>
              <ul className="text-[12px] text-gray-500 space-y-1.5">
                <li><Link href="/vi-chu-quyen" className="hover:text-[#0059b2] transition">Biển đảo tổ quốc</Link></li>
                <li><Link href="/truong-sa" className="hover:text-[#0059b2] transition">Trường Sa - Hoàng Sa</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[13px] uppercase text-[#002060] mb-3">Lịch sử</h3>
              <ul className="text-[12px] text-gray-500 space-y-1.5">
                <li><Link href="/lich-su" className="hover:text-[#0059b2] transition">Lịch sử Hải quân</Link></li>
                <li><Link href="/truyen-thong" className="hover:text-[#0059b2] transition">Truyền thống</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[13px] uppercase text-[#002060] mb-3">Đa phương tiện</h3>
              <ul className="text-[12px] text-gray-500 space-y-1.5">
                <li><Link href="/longform" className="hover:text-[#0059b2] transition">Longform</Link></li>
                <li><Link href="/phong-su-anh" className="hover:text-[#0059b2] transition">Phóng sự ảnh</Link></li>
                <li><Link href="/podcast" className="hover:text-[#0059b2] transition">Podcast</Link></li>
                <li><Link href="/bao-in" className="hover:text-[#0059b2] transition">Báo In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-[13px] uppercase text-[#002060] mb-3">Chỉ huy</h3>
              <ul className="text-[12px] text-gray-500 space-y-1.5">
                <li><Link href="/chi-huy" className="hover:text-[#0059b2] transition">Ban chỉ huy</Link></li>
                <li><Link href="/lanh-dao" className="hover:text-[#0059b2] transition">Lãnh đạo</Link></li>
              </ul>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[13px] text-gray-600">
            <div className="md:col-span-1">
              <Link href="/" className="block mb-3">
                <img src={logoImg} alt="Logo Hải Quân Việt Nam" className="h-[40px] md:h-[50px] w-auto object-contain" />
              </Link>
              <p className="text-[12px] text-gray-400 leading-relaxed">Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam (SROV)</p>
            </div>
            <div>
              <p><strong className="text-[#002060]">Tổng biên tập:</strong><br />Thượng sĩ Uhqwekh</p>
              <br />
              <p><strong className="text-[#002060]">Phó tổng biên tập:</strong><br />N/A</p>
            </div>
            <div>
              <p><strong className="text-[#002060]">Giấy phép số:</strong><br />27/QCHQ-BTLHQ/2025 ngày 27 tháng 11 năm 2025</p>
              <br />
              <p><strong className="text-[#002060]">Trụ sở chính:</strong><br />Quân cảng Cam Ranh - Khánh Hoà</p>
            </div>
            <div>
              <p>
                <Link href="/lien-he" className="text-[#002060] font-bold hover:text-[#0059b2] transition">Liên hệ:</Link><br />
                <a href="mailto:hoaidung2806le@gmail.com" className="hover:text-[#0059b2] transition">hoaidung2806le@gmail.com</a><br />
                <a href="mailto:pt84092423@gmail.com" className="hover:text-[#0059b2] transition">pt84092423@gmail.com</a>
              </p>
              <div className="flex items-center gap-3 mt-3 text-[#002060]">
                <a href="https://x.com/SROVNavy36/status/2010442603951706552" target="_blank" rel="noreferrer" className="hover:text-[#0059b2] transition" title="X (Twitter)">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.261 5.632 5.903-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://www.youtube.com/@TGM_Kuroma" target="_blank" rel="noreferrer" className="hover:text-[#0059b2] transition" title="YouTube">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.626-.246-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" /></svg>
                </a>
                <a href="https://www.tiktok.com/@srovnavy36" target="_blank" rel="noreferrer" className="hover:text-[#0059b2] transition" title="TikTok">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" /></svg>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#001540] py-4">
        <div className="container mx-auto max-w-[1200px] px-4 text-center text-[12px] text-white/50 space-y-1.5">
          <p className="text-white/50 text-[13px] italic leading-relaxed">
            Đây là website roleplay milisim (giả lập quân đội) phục vụ cộng đồng SROV, không liên quan đến Quân đội Nhân dân Việt Nam, Nước CHXHCN Việt Nam, ĐCSVN và các đoàn thể chính trị khác.
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>© 2025 Báo Hải Quân Việt Nam - SROV. Bảo lưu mọi quyền.</span>
            <span className="opacity-40">|</span>
            <Link href="/dieu-khoan" className="hover:text-white/80 transition">Điều khoản sử dụng</Link>
            <span className="opacity-40">|</span>
            <Link href="/chinh-sach-bao-mat" className="hover:text-white/80 transition">Chính sách bảo mật</Link>
            <span className="opacity-40">|</span>
            <Link href="/admin" className="hover:text-white/80 transition">Quản trị</Link>
          </p>
          <p className="text-white/20 text-[10px]">Design &amp; Code by <span className="text-white/40 font-semibold">HaVanChi aka uhqwekh</span></p>
        </div>
      </div>
    </footer>
  );
}
