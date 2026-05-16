import React, { useEffect, useMemo, useState } from 'react';
import React, { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import React, { supabase, type Post } from '@/lib/supabase';
import React, { getAuditLogs, getAdminUsers, getSession, addAuditLog } from '@/lib/auth';

type AuditEntry = {
  id: number;
  actor_username?: string | null;
  actor_role?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: number | null;
  detail?: string | null;
  created_at: string;
};

type AdminUser = {
  id: number;
  username: string;
  display_name?: string | null;
  role: string;
  status: string;
  created_at: string;
};

const WORDS_PER_MINUTE = 200;

function stripHtml(html: string) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readingMinutes(content: string) {
  const words = stripHtml(content).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function StatCard({ label, value, hint, accent }: { label: string; value: string | number; hint?: string; accent?: string }) {
  return (
    <div className={`rounded-2xl border border-blue-100 bg-white shadow-sm p-5 ${accent || ''}`}>
      <p className="text-[12px] font-bold uppercase tracking-widest text-[#0059b2]/70">{label}</p>
      <p className="text-3xl font-black text-[#002060] mt-2 leading-none">{value}</p>
      {hint && <p className="text-[12px] text-gray-500 mt-2">{hint}</p>}
    </div>
  );
}

function SeoBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
        ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {ok ? 'Đã cấu hình' : 'Thiếu'}
    </span>
  );
}

async function simpleHash(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function ChangePasswordSection() {
  const session = getSession();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setMsg(null);
    if (!session) return;
    if (newPw.length < 8) { setMsg({ type: 'err', text: 'Mật khẩu mới phải có ít nhất 8 ký tự.' }); return; }
    if (newPw !== confirmPw) { setMsg({ type: 'err', text: 'Xác nhận mật khẩu không khớp.' }); return; }
    setSaving(true);
    try {
      const currentHash = await simpleHash(currentPw);
      const { data: user, error: verifyErr } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', session.id)
        .eq('password_hash', currentHash)
        .eq('status', 'active')
        .single();
      if (verifyErr || !user) { setMsg({ type: 'err', text: 'Mật khẩu hiện tại không đúng.' }); setSaving(false); return; }
      const newHash = await simpleHash(newPw);
      const { error: updateErr } = await supabase
        .from('admin_users')
        .update({ password_hash: newHash })
        .eq('id', session.id);
      if (updateErr) throw updateErr;
      await addAuditLog('CHANGE_PASSWORD', 'admin_user', session.id, 'Đổi mật khẩu thành công', session);
      setMsg({ type: 'ok', text: 'Đổi mật khẩu thành công!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message || 'Có lỗi xảy ra.' });
    }
    setSaving(false);
  };

  return (
    <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6">
      <h2 className="text-xl font-black text-[#002060] mb-1">Đổi mật khẩu</h2>
      <p className="text-sm text-gray-500 mb-5">Chỉ áp dụng cho tài khoản đang đăng nhập ({session?.username}).</p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mật khẩu hiện tại</label>
          <input
            type="password"
            value={currentPw}
            onChange={e => setCurrentPw(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2] focus:ring-2 focus:ring-[#0059b2]/10"
            placeholder="Nhập mật khẩu hiện tại"
          />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-1">Mật khẩu mới</label>
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            required
            minLength={8}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2] focus:ring-2 focus:ring-[#0059b2]/10"
            placeholder="Tối thiểu 8 ký tự"
          />
        </div>
        <div>
          <label className="block text-[12px] font-bold text-gray-500 uppercase tracking-wide mb-1">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0059b2] focus:ring-2 focus:ring-[#0059b2]/10"
            placeholder="Nhập lại mật khẩu mới"
          />
        </div>
        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.type === 'ok' ? '✅ ' : '❌ '}{msg.text}
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-[#0059b2] text-white text-sm font-bold rounded-xl hover:bg-[#004a9a] transition disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </section>
  );
}

export default function HadminPanel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [seoQuery, setSeoQuery] = useState('');
  const [seoFilter, setSeoFilter] = useState<'all' | 'missing'>('all');

  useEffect(() => {
    async function load() {
      const [postsResp, auditList, userList] = await Promise.all([
        supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(500),
        getAuditLogs(500),
        getAdminUsers(),
      ]);
      setPosts((postsResp.data as Post[]) || []);
      setAudits((auditList as AuditEntry[]) || []);
      setUsers((userList as AdminUser[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const summary = useMemo(() => {
    const totalPosts = posts.length;
    const published = posts.filter(p => p.status === 'published');
    const drafts = posts.filter(p => p.status === 'draft');
    const totalViews = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
    const avgViews = totalPosts ? Math.round(totalViews / totalPosts) : 0;
    const now = Date.now();
    const days30 = 30 * 24 * 3600 * 1000;
    const days7 = 7 * 24 * 3600 * 1000;
    const last30 = posts.filter(p => now - new Date(p.created_at).getTime() <= days30).length;
    const last7 = posts.filter(p => now - new Date(p.created_at).getTime() <= days7).length;
    const totalReadingMinutes = posts.reduce((sum, p) => sum + readingMinutes(p.content || ''), 0);
    const avgReading = totalPosts ? Math.round(totalReadingMinutes / totalPosts) : 0;
    const seoComplete = posts.filter(p => p.meta_title && p.meta_description && (p.og_image || p.thumbnail)).length;
    const seoPercent = totalPosts ? Math.round((seoComplete / totalPosts) * 100) : 0;
    return { totalPosts, published: published.length, drafts: drafts.length, totalViews, avgViews, last30, last7, avgReading, seoComplete, seoPercent };
  }, [posts]);

  const topViewed = useMemo(() => {
    return [...posts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10);
  }, [posts]);

  const postingFrequency = useMemo(() => {
    const buckets = new Map<string, number>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    posts.forEach(p => {
      const key = dayKey(p.created_at);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + 1);
    });
    return Array.from(buckets.entries()).map(([day, count]) => ({ day, count }));
  }, [posts]);

  const maxFrequency = useMemo(
    () => postingFrequency.reduce((m, b) => Math.max(m, b.count), 0) || 1,
    [postingFrequency]
  );

  const activeStaff = useMemo(() => {
    const since = Date.now() - 30 * 24 * 3600 * 1000;
    const counts = new Map<string, { username: string; role: string; total: number; writes: number; logins: number; lastAt: string }>();
    audits.forEach(a => {
      if (!a.actor_username) return;
      const ts = new Date(a.created_at).getTime();
      if (ts < since) return;
      const key = a.actor_username;
      const entry =
        counts.get(key) || { username: key, role: a.actor_role || '-', total: 0, writes: 0, logins: 0, lastAt: a.created_at };
      entry.total += 1;
      if (a.action.includes('POST') || a.action.includes('UPDATE') || a.action.includes('CREATE')) entry.writes += 1;
      if (a.action === 'LOGIN') entry.logins += 1;
      if (new Date(a.created_at).getTime() > new Date(entry.lastAt).getTime()) entry.lastAt = a.created_at;
      counts.set(key, entry);
    });
    return Array.from(counts.values()).sort((a, b) => b.total - a.total).slice(0, 12);
  }, [audits]);

  const filteredSeo = useMemo(() => {
    const q = seoQuery.trim().toLowerCase();
    return posts
      .filter(p => {
        const missing = !(p.meta_title && p.meta_description && (p.og_image || p.thumbnail));
        if (seoFilter === 'missing' && !missing) return false;
        if (q && !p.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .slice(0, 60);
  }, [posts, seoQuery, seoFilter]);

  return (
    <AdminLayout title="HADMIN Panel">
      <div className="space-y-8">
        <header className="rounded-3xl bg-gradient-to-r from-[#02183b] via-[#012a6b] to-[#0059b2] text-white p-6 md:p-8 shadow-lg">
          <p className="text-[#FFD700] uppercase text-[11px] font-bold tracking-[0.25em]">HADMIN ONLY</p>
          <h1 className="text-3xl md:text-4xl font-black mt-1">Bảng điều khiển HADMIN</h1>
          <p className="text-white/80 mt-2 max-w-3xl text-sm md:text-base">
            Khu vực dành riêng cho HADMIN. Theo dõi SEO từng bài, lượt xem, thời gian đọc, tần suất hiển thị, tần suất đăng bài và mức độ tích cực của đội ngũ.
          </p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-blue-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Tổng bài viết" value={summary.totalPosts} hint={`${summary.published} đã xuất bản • ${summary.drafts} bản nháp`} />
              <StatCard label="Tổng lượt xem" value={summary.totalViews.toLocaleString('vi-VN')} hint={`Trung bình ${summary.avgViews.toLocaleString('vi-VN')} / bài`} />
              <StatCard label="Bài đăng 30 ngày" value={summary.last30} hint={`${summary.last7} bài trong 7 ngày qua`} />
              <StatCard label="Thời gian đọc TB" value={`${summary.avgReading} phút`} hint={`Ước lượng ${WORDS_PER_MINUTE} từ/phút`} />
              <StatCard label="SEO hoàn chỉnh" value={`${summary.seoPercent}%`} hint={`${summary.seoComplete}/${summary.totalPosts} bài đầy đủ meta + OG`} />
              <StatCard label="Người dùng hệ thống" value={users.filter(u => u.status === 'active').length} hint={`Tổng ${users.length} tài khoản`} />
              <StatCard label="Sự kiện 30 ngày" value={audits.length} hint="Số dòng nhật ký gần nhất" />
              <StatCard label="Hoạt động hôm nay" value={audits.filter(a => dayKey(a.created_at) === new Date().toISOString().slice(0, 10)).length} hint="Số thao tác hôm nay" />
            </section>

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-black text-[#002060]">Tần suất đăng bài (14 ngày qua)</h2>
                  <p className="text-sm text-gray-500">Số bài viết được tạo mỗi ngày, dùng để cân nhịp xuất bản.</p>
                </div>
                <div className="text-sm text-gray-500">Tổng: <strong className="text-[#0059b2]">{postingFrequency.reduce((s, b) => s + b.count, 0)}</strong></div>
              </div>
              <div className="flex items-end gap-2 h-40">
                {postingFrequency.map(b => (
                  <div key={b.day} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[11px] font-bold text-[#0059b2]">{b.count || ''}</div>
                    <div
                      className="w-full bg-gradient-to-t from-[#0059b2] to-[#3aa0ff] rounded-t-md transition-all"
                      style={{ height: `${(b.count / maxFrequency) * 100}%`, minHeight: b.count ? 8 : 2 }}
                    />
                    <div className="text-[10px] text-gray-500">{shortDate(b.day)}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6">
                <h2 className="text-xl font-black text-[#002060] mb-4">Top 10 bài xem nhiều nhất</h2>
                <ol className="space-y-2">
                  {topViewed.length === 0 && <li className="text-sm text-gray-500">Chưa có dữ liệu lượt xem.</li>}
                  {topViewed.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[12px] flex-shrink-0 ${i < 3 ? 'bg-[#FFD700] text-[#002060]' : 'bg-[#0059b2]'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <Link href={`/admin/bai-viet/${p.id}`} className="block text-sm font-bold text-[#002060] hover:text-[#0059b2] truncate">{p.title}</Link>
                        <p className="text-[11px] text-gray-500">{readingMinutes(p.content || '')} phút đọc • {p.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-black text-[#0059b2]">{(p.view_count || 0).toLocaleString('vi-VN')}</p>
                        <p className="text-[10px] uppercase text-gray-400 font-bold">lượt xem</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6">
                <h2 className="text-xl font-black text-[#002060] mb-4">Người làm việc tích cực (30 ngày)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase text-gray-500 border-b border-gray-100">
                        <th className="text-left py-2">Tài khoản</th>
                        <th className="text-right py-2">Tổng thao tác</th>
                        <th className="text-right py-2">Bài viết</th>
                        <th className="text-right py-2">Đăng nhập</th>
                        <th className="text-right py-2">Mới nhất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStaff.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-gray-500">Chưa có hoạt động trong 30 ngày qua.</td></tr>
                      )}
                      {activeStaff.map(s => (
                        <tr key={s.username} className="border-b border-gray-50 last:border-0">
                          <td className="py-2">
                            <p className="font-bold text-[#002060]">{s.username}</p>
                            <span className="text-[10px] uppercase font-bold text-[#0059b2]">{s.role}</span>
                          </td>
                          <td className="text-right font-black text-[#0059b2]">{s.total}</td>
                          <td className="text-right">{s.writes}</td>
                          <td className="text-right">{s.logins}</td>
                          <td className="text-right text-[11px] text-gray-500">{shortDate(s.lastAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <ChangePasswordSection />

            <section className="bg-white rounded-3xl border border-blue-100 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-black text-[#002060]">Quản lý SEO từng bài viết</h2>
                  <p className="text-sm text-gray-500">Kiểm tra meta title, meta description, ảnh OG và tần suất hiển thị (lượt xem) cho từng bài.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={seoQuery}
                    onChange={e => setSeoQuery(e.target.value)}
                    placeholder="Tìm theo tiêu đề..."
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0059b2]"
                  />
                  <select
                    value={seoFilter}
                    onChange={e => setSeoFilter(e.target.value as 'all' | 'missing')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0059b2]"
                  >
                    <option value="all">Tất cả</option>
                    <option value="missing">Chỉ bài thiếu SEO</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase text-gray-500 border-b border-gray-100">
                      <th className="text-left py-2 w-2/5">Bài viết</th>
                      <th className="text-center py-2">Meta title</th>
                      <th className="text-center py-2">Meta description</th>
                      <th className="text-center py-2">Ảnh OG</th>
                      <th className="text-right py-2">Lượt xem</th>
                      <th className="text-right py-2">Phút đọc</th>
                      <th className="text-right py-2">Tạo lúc</th>
                      <th className="text-right py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSeo.length === 0 && (
                      <tr><td colSpan={8} className="py-6 text-center text-gray-500">Không có bài viết phù hợp.</td></tr>
                    )}
                    {filteredSeo.map(p => (
                      <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-blue-50/40">
                        <td className="py-2 pr-3">
                          <p className="font-bold text-[#002060] line-clamp-1">{p.title}</p>
                          <p className="text-[11px] text-gray-500">/{p.slug}</p>
                        </td>
                        <td className="text-center py-2"><SeoBadge ok={!!p.meta_title} /></td>
                        <td className="text-center py-2"><SeoBadge ok={!!p.meta_description} /></td>
                        <td className="text-center py-2"><SeoBadge ok={!!(p.og_image || p.thumbnail)} /></td>
                        <td className="text-right py-2 font-bold text-[#0059b2]">{(p.view_count || 0).toLocaleString('vi-VN')}</td>
                        <td className="text-right py-2">{readingMinutes(p.content || '')}</td>
                        <td className="text-right py-2 text-[11px] text-gray-500">{shortDate(p.created_at)}</td>
                        <td className="text-right py-2">
                          <Link href={`/admin/bai-viet/${p.id}`} className="text-[12px] font-bold text-[#0059b2] hover:underline">Sửa →</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
