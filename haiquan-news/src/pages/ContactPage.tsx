import { useEffect, useState } from 'react';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { getAllSettings } from '@/lib/supabase';

const DEFAULT_DISCORD = 'donkey3959';
const DEFAULT_ADDRESS = 'Phòng Công tác Truyền thông - Hải quân Nhân dân Việt Nam, Số 36 phường Cam Ranh, Khánh Hòa';

export default function ContactPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllSettings().then(setSettings);
  }, []);

  const email = settings.contact_email || 'pt84092423@gmail.com';
  const discord = settings.contact_discord || DEFAULT_DISCORD;
  const address = settings.contact_address || DEFAULT_ADDRESS;

  return (
    <>
      <SEOHead title="Liên hệ" description="Thông tin liên hệ Báo Hải Quân Việt Nam - SROV" />
      <div className="bg-gradient-to-r from-[#002060] to-[#0059b2] text-white py-14">
        <div className="container mx-auto max-w-[1200px] px-4">
          <p className="text-[#FFD700] uppercase text-[13px] font-bold tracking-[0.2em] mb-3">Kết nối với chúng tôi</p>
          <h1 className="font-['Playfair_Display',serif] text-4xl md:text-5xl font-black uppercase mb-4">Liên hệ</h1>
          <p className="max-w-2xl text-white/85 leading-relaxed">Gửi thông tin, tin bài, hình ảnh hoặc liên hệ công tác với Cổng Thông Tin SROV.</p>
        </div>
      </div>

      <main className="container mx-auto max-w-[1200px] px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 bg-white border border-blue-100 rounded-3xl shadow-sm p-6 md:p-8">
            <SectionTitle title="Gửi liên hệ" className="text-[26px]" />
            <form className="space-y-4" onSubmit={e => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-4">
                <input className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2]" placeholder="Họ và tên" />
                <input className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2]" placeholder="Email hoặc Discord" />
              </div>
              <input className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2]" placeholder="Tiêu đề" />
              <textarea className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2]" rows={7} placeholder="Nội dung liên hệ" />
              <button className="px-7 py-3 bg-[#0059b2] text-white rounded-xl font-bold hover:bg-blue-700 transition shadow">Gửi liên hệ</button>
              <p className="text-xs text-gray-500">Đây là biểu mẫu liên hệ mẫu. Có thể kết nối gửi email/lưu dữ liệu ở bước tiếp theo.</p>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="bg-[#f8fbff] border border-blue-100 rounded-3xl p-6">
              <h2 className="font-black text-[#002060] text-xl mb-4">Thông tin liên hệ</h2>
              <div className="space-y-4 text-sm text-[#333]">
                <div>
                  <p className="font-bold text-[#0059b2] uppercase text-xs mb-1">Email</p>
                  <a href={`mailto:${email}`} className="hover:underline break-all">{email}</a>
                </div>
                <div>
                  <p className="font-bold text-[#0059b2] uppercase text-xs mb-1 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.974 0c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    Discord
                  </p>
                  <a href={`https://discord.com/users/${discord}`} target="_blank" rel="noreferrer" className="hover:underline">{discord}</a>
                </div>
                <div>
                  <p className="font-bold text-[#0059b2] uppercase text-xs mb-1">Địa chỉ liên hệ</p>
                  <p className="leading-relaxed">{address}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#002060] text-white rounded-3xl p-6 overflow-hidden relative">
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-[#FFD700]/20" />
              <h3 className="font-black text-xl mb-2 relative">Đóng góp tin bài</h3>
              <p className="text-white/80 text-sm leading-relaxed relative">Bài viết, video, hình ảnh đóng góp vui lòng gửi về email liên hệ hoặc Discord để ban biên tập tiếp nhận và xử lý.</p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
