import React, { useState, useEffect } from 'react';
import React, { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import React, { getAllPosts, getAllCategories, getPostsForStats } from '@/lib/supabase';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const COLORS = ['#0059b2', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];

function StatCard({ label, value, color, icon, loading }: { label: string; value: number; color: string; icon: string; loading: boolean }) {
  return (
    <div className={`${color} text-white rounded-xl p-5 shadow-md`}>
      <div className="text-3xl mb-1">{icon}</div>
      <div className="text-[32px] font-black leading-none">{loading ? '...' : value.toLocaleString()}</div>
      <div className="text-[13px] mt-1 opacity-90">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, categories: 0 });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hourly' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    async function load() {
      const [allResult, pubResult, draftResult, cats, postsForStats] = await Promise.all([
        getAllPosts({ limit: 5 }),
        getAllPosts({ status: 'published', limit: 1 }),
        getAllPosts({ status: 'draft', limit: 1 }),
        getAllCategories(),
        getPostsForStats(),
      ]);
      setStats({
        total: allResult.count,
        published: pubResult.count,
        draft: draftResult.count,
        categories: cats.length,
      });
      setRecentPosts(allResult.posts);
      setAllPosts(postsForStats);
      setLoading(false);
    }
    load();
  }, []);

  const buildHourlyData = () => {
    const counts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) counts[h] = 0;
    allPosts.forEach(p => {
      const h = new Date(p.created_at).getHours();
      counts[h] = (counts[h] || 0) + 1;
    });
    return Array.from({ length: 24 }, (_, h) => ({ hour: `${h}h`, views: counts[h] || 0 }));
  };

  const buildWeeklyData = () => {
    const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    allPosts.forEach(p => { counts[new Date(p.created_at).getDay()]++; });
    return days.map((name, i) => ({ name, value: counts[i] }));
  };

  const buildMonthlyData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const counts: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) counts[d] = 0;
    allPosts.forEach(p => {
      const dt = new Date(p.created_at);
      if (dt.getFullYear() === year && dt.getMonth() === month) {
        const d = dt.getDate();
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return Array.from({ length: daysInMonth }, (_, i) => ({ day: `${i + 1}`, views: counts[i + 1] || 0 }));
  };

  const buildYearlyData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const counts = new Array(12).fill(0);
    allPosts.forEach(p => {
      const dt = new Date(p.created_at);
      if (dt.getFullYear() === year) counts[dt.getMonth()]++;
    });
    return months.map((name, i) => ({ name, views: counts[i] }));
  };

  const buildCategoryData = () => {
    const map: Record<string, number> = {};
    allPosts.forEach(p => {
      const name = (p.category as any)?.name || 'Chưa phân loại';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const buildTypeData = () => {
    const typeLabels: Record<string, string> = {
      article: 'Tin tức', video: 'Video', podcast: 'Podcast',
      longform: 'Longform', photo_story: 'Phóng sự ảnh', baoin: 'Báo in',
    };
    const map: Record<string, number> = {};
    allPosts.forEach(p => {
      const label = typeLabels[p.post_type] || p.post_type;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  };

  const topViewPosts = [...allPosts].sort((a, b) => b.view_count - a.view_count).slice(0, 10);

  const chartData = {
    hourly: buildHourlyData(),
    weekly: buildWeeklyData(),
    monthly: buildMonthlyData(),
    yearly: buildYearlyData(),
  };

  const catData = buildCategoryData();
  const typeData = buildTypeData();

  const tabs = [
    { key: 'hourly', label: 'Theo giờ' },
    { key: 'monthly', label: 'Theo ngày' },
    { key: 'yearly', label: 'Theo tháng' },
    { key: 'weekly', label: 'Theo tuần' },
  ];

  return (
    <AdminLayout title="Tổng quan">
      <div className="mb-8">
        <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Tổng Quan</h2>
        <p className="text-[#555555] text-[13px] mt-1">Quản lý nội dung Báo Hải Quân Việt Nam</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tổng bài viết" value={stats.total} color="bg-[#0059b2]" icon="📄" loading={loading} />
        <StatCard label="Đã xuất bản" value={stats.published} color="bg-green-600" icon="✅" loading={loading} />
        <StatCard label="Bản nháp" value={stats.draft} color="bg-yellow-500" icon="📝" loading={loading} />
        <StatCard label="Chuyên mục" value={stats.categories} color="bg-purple-600" icon="📂" loading={loading} />
      </div>

      {/* Quick Links */}
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

      {/* Charts Section */}
      {!loading && allPosts.length > 0 && (
        <>
          {/* Line/Bar Charts with tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-[16px] text-[#222222]">Thống kê bài đăng</h3>
              <div className="flex gap-2 flex-wrap">
                {tabs.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key as any)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition ${activeTab === t.key ? 'bg-[#0059b2] text-white' : 'bg-gray-100 text-[#555] hover:bg-gray-200'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              {activeTab === 'weekly' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[12px] font-bold text-gray-500 uppercase mb-3">Phân bố theo ngày trong tuần</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={chartData.weekly} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}>
                          {chartData.weekly.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => [`${v} bài`, 'Số bài']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-500 uppercase mb-3">Biểu đồ cột theo ngày</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={chartData.weekly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip formatter={(v: any) => [`${v} bài`, 'Số bài']} />
                        <Bar dataKey="value" fill="#0059b2" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={activeTab === 'hourly' ? chartData.hourly : activeTab === 'monthly' ? chartData.monthly : chartData.yearly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey={activeTab === 'hourly' ? 'hour' : activeTab === 'monthly' ? 'day' : 'name'}
                      tick={{ fontSize: 11 }}
                      interval={activeTab === 'monthly' ? 3 : 0}
                    />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip formatter={(v: any) => [`${v} bài`, 'Số bài đăng']} />
                    <Line type="monotone" dataKey="views" stroke="#0059b2" strokeWidth={2.5} dot={{ r: 3, fill: '#0059b2' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Three tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Top posts by views */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[14px] text-[#222222]">Bài viết nổi bật nhất</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Xếp theo lượt xem</p>
              </div>
              <div className="divide-y divide-gray-50">
                {topViewPosts.map((p, i) => (
                  <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white flex-shrink-0 ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-500'}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-[#222] line-clamp-1">{p.title}</p>
                      <p className="text-[10px] text-gray-400">{(p.category as any)?.name || '—'}</p>
                    </div>
                    <span className="text-[12px] font-bold text-[#0059b2] flex-shrink-0">{(p.view_count || 0).toLocaleString()}</span>
                  </div>
                ))}
                {topViewPosts.length === 0 && <p className="px-5 py-6 text-[12px] text-gray-400 text-center">Chưa có dữ liệu</p>}
              </div>
            </div>

            {/* By category */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[14px] text-[#222222]">Phân bố theo chuyên mục</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Số bài trong mỗi chuyên mục</p>
              </div>
              <div className="divide-y divide-gray-50">
                {catData.map((c, i) => (
                  <div key={c.name} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-[12px] text-[#333] line-clamp-1">{c.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((c.count / (catData[0]?.count || 1)) * 100)}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-[12px] font-bold text-[#555] w-6 text-right">{c.count}</span>
                    </div>
                  </div>
                ))}
                {catData.length === 0 && <p className="px-5 py-6 text-[12px] text-gray-400 text-center">Chưa có dữ liệu</p>}
              </div>
            </div>

            {/* By post type */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-[14px] text-[#222222]">Phân bố theo loại nội dung</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Tin tức, Video, Podcast...</p>
              </div>
              <div className="divide-y divide-gray-50">
                {typeData.map((t, i) => (
                  <div key={t.name} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-[12px] text-[#333]">{t.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.round((t.count / (typeData[0]?.count || 1)) * 100)}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-[12px] font-bold text-[#555] w-6 text-right">{t.count}</span>
                    </div>
                  </div>
                ))}
                {typeData.length === 0 && <p className="px-5 py-6 text-[12px] text-gray-400 text-center">Chưa có dữ liệu</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Recent posts */}
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
