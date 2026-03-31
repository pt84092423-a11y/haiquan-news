import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { getAllPosts, getAllCategories } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, categories: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [allResult, pubResult, draftResult, cats] = await Promise.all([
        getAllPosts({ limit: 5 }),
        getAllPosts({ status: 'published', limit: 1 }),
        getAllPosts({ status: 'draft', limit: 1 }),
        getAllCategories(),
      ]);
      setStats({
        total: allResult.count,
        published: pubResult.count,
        draft: draftResult.count,
        categories: cats.length,
      });
      setRecentPosts(allResult.posts);
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Tổng bài viết', value: stats.total, color: 'bg-[#0059b2]', icon: '📄' },
    { label: 'Đã xuất bản', value: stats.published, color: 'bg-green-600', icon: '✅' },
    { label: 'Bản nháp', value: stats.draft, color: 'bg-yellow-500', icon: '📝' },
    { label: 'Chuyên mục', value: stats.categories, color: 'bg-purple-600', icon: '📂' },
  ];

  return (
    <AdminLayout title="Tổng quan">
      <div className="mb-8">
        <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Tổng Quan</h2>
        <p className="text-[#555555] text-[13px] mt-1">Quản lý nội dung Báo Hải Quân Việt Nam</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <div key={card.label} className={`${card.color} text-white rounded-xl p-5 shadow-md`}>
            <div className="text-3xl mb-1">{card.icon}</div>
            <div className="text-[32px] font-black leading-none">{loading ? '...' : card.value.toLocaleString()}</div>
            <div className="text-[13px] mt-1 opacity-90">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/bai-viet/moi" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-[#0059b2] rounded-full flex items-center justify-center text-white group-hover:scale-110 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#222222]">Viết bài mới</h3>
            <p className="text-[12px] text-[#555555]">Tạo bài viết, video, podcast...</p>
          </div>
        </Link>

        <Link href="/admin/bai-viet" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#222222]">Quản lý bài viết</h3>
            <p className="text-[12px] text-[#555555]">Xem, sửa, xóa bài viết</p>
          </div>
        </Link>

        <Link href="/admin/cai-dat" className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4 group">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-[#222222]">Cài đặt website</h3>
            <p className="text-[12px] text-[#555555]">Logo, thông tin, SEO...</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-[16px] text-[#222222]">Bài viết gần đây</h3>
          <Link href="/admin/bai-viet" className="text-[13px] text-[#0059b2] hover:underline">Xem tất cả →</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            [...Array(5)].map((_, i) => <div key={i} className="p-4 h-14 animate-pulse bg-gray-50" />)
          ) : recentPosts.length === 0 ? (
            <div className="p-8 text-center text-[#555555]">
              <p>Chưa có bài viết nào.</p>
              <Link href="/admin/bai-viet/moi" className="text-[#0059b2] font-bold hover:underline">Tạo bài viết đầu tiên →</Link>
            </div>
          ) : recentPosts.map(post => (
            <div key={post.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                {post.thumbnail && <img src={post.thumbnail} alt="" className="w-[48px] h-[32px] object-cover rounded flex-shrink-0" />}
                <div>
                  <p className="font-bold text-[14px] text-[#222222] line-clamp-1">{post.title}</p>
                  <p className="text-[12px] text-[#555555]">{post.category?.name || 'Chưa phân loại'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {post.status === 'published' ? 'Đã đăng' : 'Nháp'}
                </span>
                <Link href={`/admin/bai-viet/${post.id}`} className="text-[12px] text-[#0059b2] hover:underline">Sửa</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
