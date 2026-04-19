import { useEffect, useState } from 'react';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { getAllSettings } from '@/lib/supabase';

export default function ContactPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    getAllSettings().then(setSettings);
  }, []);

  const email = settings.contact_email || 'pt84092423@gmail.com';
  const phone = settings.contact_phone || '024.XXXX.XXXX';
  const address = settings.contact_address || 'Số XX đường XX, Hà Nội';

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
                <input className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2]" placeholder="Email hoặc số điện thoại" />
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
                  <a href={`mailto:${email}`} className="hover:underline">{email}</a>
                </div>
                <div>
                  <p className="font-bold text-[#0059b2] uppercase text-xs mb-1">Điện thoại</p>
                  <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
                </div>
                <div>
                  <p className="font-bold text-[#0059b2] uppercase text-xs mb-1">Địa chỉ</p>
                  <p>{address}</p>
                </div>
              </div>
            </div>
            <div className="bg-[#002060] text-white rounded-3xl p-6 overflow-hidden relative">
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-[#FFD700]/20" />
              <h3 className="font-black text-xl mb-2 relative">Đóng góp tin bài</h3>
              <p className="text-white/80 text-sm leading-relaxed relative">Bài viết, video, hình ảnh đóng góp vui lòng gửi về email liên hệ để ban biên tập tiếp nhận và xử lý.</p>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
