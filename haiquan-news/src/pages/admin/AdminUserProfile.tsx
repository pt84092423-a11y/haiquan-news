import { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { supabase, uploadImage, upsertSetting } from '@/lib/supabase';
import { getSession, setSession } from '@/lib/auth';
import { formatDateLong } from '@/lib/utils';

interface UserStat {
  id: number;
  username: string;
  display_name: string | null;
  role: string;
  status: string;
  avatar_url: string | null;
  created_at: string | null;
  created_by: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  postCount: number;
  totalViews: number;
  weeklyPosts: number;
}

const ROLE_COLOR: Record<string, string> = {
  HADMIN: 'bg-red-600 text-white',
  ADMIN: 'bg-[#0059b2] text-white',
  EDITOR: 'bg-green-600 text-white',
};

const PALETTE = ['bg-blue-600', 'bg-indigo-600', 'bg-violet-600', 'bg-teal-600', 'bg-orange-600', 'bg-rose-600'];

function UserAvatar({ user, size = 'md' }: { user: { username?: string; display_name?: string | null; avatar_url?: string | null }; size?: 'sm' | 'md' | 'lg' }) {
  const name = user.display_name || user.username || '?';
  const bg = PALETTE[name.charCodeAt(0) % PALETTE.length];
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-3xl' : size === 'sm' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-xl';
  if (user.avatar_url) return <img src={user.avatar_url} alt={name} className={`${sizeClass} rounded-full object-cover border-2 border-white shadow`} />;
  return (
    <div className={`${sizeClass} rounded-full ${bg} flex items-center justify-center text-white font-black border-2 border-white shadow`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminUserProfile() {
  const session = getSession();
  const isHadmin = session?.role === 'HADMIN';

  const [users, setUsers] = useState<UserStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UserStat | null>(null);
  const [search, setSearch] = useState('');

  const [myAvatar, setMyAvatar] = useState<string | null>(session?.avatar_url || null);
  const [myDisplayName, setMyDisplayName] = useState(session?.display_name || '');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data: adminUsers } = await supabase.from('admin_users').select('*').order('id');
      if (!adminUsers) { setLoading(false); return; }

      const { data: posts } = await supabase.from('posts').select('author_id, view_count, created_at, status');
      const { data: avatarSettings } = await supabase.from('settings').select('key,value').like('key', 'avatar_user_%');

      const avatarMap: Record<number, string> = {};
      (avatarSettings || []).forEach((s: any) => {
        const id = parseInt(s.key.replace('avatar_user_', ''));
        if (!isNaN(id)) avatarMap[id] = s.value;
      });

      const now = Date.now();
      const weekMs = 7 * 24 * 60 * 60 * 1000;

      const stats: UserStat[] = adminUsers.map((u: any) => {
        const userPosts = (posts || []).filter((p: any) => p.author_id === u.id);
        const weeklyPosts = userPosts.filter((p: any) => new Date(p.created_at).getTime() > now - weekMs).length;
        return {
          ...u,
          avatar_url: u.avatar_url || avatarMap[u.id] || null,
          postCount: userPosts.length,
          totalViews: userPosts.reduce((s: number, p: any) => s + (p.view_count || 0), 0),
          weeklyPosts,
        };
      });

      setUsers(stats);
      if (session) {
        const myUser = stats.find(u => u.id === session.id);
        if (myUser) {
          setMyAvatar(myUser.avatar_url);
          setMyDisplayName(myUser.display_name || session.display_name || '');
        }
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.username?.toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  });

  const totalPosts = users.reduce((s, u) => s + u.postCount, 0);
  const totalViews = users.reduce((s, u) => s + u.totalViews, 0);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;
    setAvatarUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        await upsertSetting(`avatar_user_${session.id}`, url);
        await supabase.from('admin_users').update({ avatar_url: url }).eq('id', session.id);
        setMyAvatar(url);
        setSession({ ...session, avatar_url: url });
        setUsers(prev => prev.map(u => u.id === session.id ? { ...u, avatar_url: url } : u));
        setProfileMsg('Ảnh đại diện đã cập nhật!');
        setTimeout(() => setProfileMsg(''), 3000);
      }
    } catch {
      setProfileMsg('Lỗi tải ảnh lên.');
    }
    setAvatarUploading(false);
    e.target.value = '';
  };

  const handleSaveProfile = async () => {
    if (!session) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await supabase.from('admin_users').update({ display_name: myDisplayName.trim() || null }).eq('id', session.id);
      const updated = { ...session, display_name: myDisplayName.trim() || undefined };
      setSession(updated);
      setUsers(prev => prev.map(u => u.id === session.id ? { ...u, display_name: myDisplayName.trim() || null } : u));
      setProfileMsg('Đã lưu tên hiển thị!');
      setEditingProfile(false);
      setTimeout(() => setProfileMsg(''), 3000);
    } catch {
      setProfileMsg('Lỗi khi lưu.');
    }
    setProfileSaving(false);
  };

  return (
    <AdminLayout title="Hồ sơ Tài khoản">
      <div className="mb-6">
        <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222] uppercase tracking-wide">Hồ Sơ Người Dùng</h2>
        <p className="text-[#555] text-[13px] mt-1">Thống kê chi tiết về tất cả tài khoản trong hệ thống</p>
      </div>

      {/* My Profile Edit Card */}
      {session && (
        <div className="bg-gradient-to-r from-[#01122e] to-[#0059b2] rounded-2xl shadow-md mb-6 overflow-hidden">
          <div className="px-6 py-5 flex items-center gap-5">
            <div className="relative group flex-shrink-0">
              <UserAvatar user={{ username: session.username, display_name: myDisplayName || session.display_name, avatar_url: myAvatar }} size="lg" />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                title="Đổi ảnh đại diện"
              >
                {avatarUploading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                )}
              </button>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="flex-1 min-w-0">
              {editingProfile ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    value={myDisplayName}
                    onChange={e => setMyDisplayName(e.target.value)}
                    placeholder={session.username}
                    className="bg-white/10 border border-white/30 text-white placeholder-white/50 rounded-lg px-3 py-1.5 text-[15px] font-bold focus:outline-none focus:border-white/60 min-w-0 flex-1"
                    maxLength={50}
                  />
                  <button onClick={handleSaveProfile} disabled={profileSaving} className="bg-white text-[#0059b2] font-bold text-[12px] px-3 py-1.5 rounded-lg hover:bg-white/90 transition disabled:opacity-50">
                    {profileSaving ? '...' : 'Lưu'}
                  </button>
                  <button onClick={() => { setEditingProfile(false); setMyDisplayName(session.display_name || ''); }} className="text-white/60 font-bold text-[12px] px-3 py-1.5 rounded-lg hover:text-white transition">
                    Hủy
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-white text-xl font-black">{myDisplayName || session.username}</p>
                  <button onClick={() => setEditingProfile(true)} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg transition flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Sửa tên
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${ROLE_COLOR[session.role] || 'bg-gray-500 text-white'}`}>{session.role}</span>
                <p className="text-white/60 text-[13px]">@{session.username}</p>
                {profileMsg && <span className="text-green-300 text-[12px] font-bold">{profileMsg}</span>}
              </div>
              <p className="text-white/40 text-[11px] mt-1">Di chuột vào ảnh để đổi avatar</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng tài khoản', value: users.length, color: 'text-[#0059b2]', bg: 'bg-blue-50' },
          { label: 'Tổng bài đăng', value: totalPosts, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Tổng lượt xem', value: totalViews.toLocaleString(), color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Đang hoạt động', value: users.filter(u => u.status === 'active').length, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map(c => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
            <p className="text-[11px] text-gray-500 font-bold uppercase mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 flex-col xl:flex-row">
        {/* User list */}
        <div className="xl:w-[380px] flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm tài khoản..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-[#0059b2]"
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <div className="w-5 h-5 border-2 border-[#0059b2] border-t-transparent rounded-full animate-spin" />
                <span className="text-[13px]">Đang tải...</span>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition text-left ${selected?.id === u.id ? 'bg-blue-50 border-l-4 border-[#0059b2]' : 'hover:bg-gray-50 border-l-4 border-transparent'}`}
                  >
                    <UserAvatar user={u} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[14px] text-[#222] truncate">{u.display_name || u.username}</p>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${ROLE_COLOR[u.role] || 'bg-gray-500 text-white'}`}>{u.role}</span>
                        {u.id === session?.id && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Bạn</span>}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">@{u.username} · {u.postCount} bài · {u.totalViews.toLocaleString()} views</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-gray-400 text-[13px]">Không tìm thấy tài khoản nào</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile detail */}
        <div className="flex-1">
          {!selected ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center py-24 text-center">
              <div>
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-[#0059b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <p className="text-[14px] font-bold text-gray-400">Chọn một tài khoản để xem hồ sơ chi tiết</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile header */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#01122e] to-[#0059b2] px-6 py-6 flex items-center gap-5">
                  <UserAvatar user={selected} />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-white text-xl font-black">{selected.display_name || selected.username}</p>
                      <span className={`text-[11px] font-black px-2 py-1 rounded-full ${ROLE_COLOR[selected.role] || 'bg-gray-500 text-white'}`}>{selected.role}</span>
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${selected.status === 'active' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                        {selected.status === 'active' ? '● Hoạt động' : '○ Đã vô hiệu'}
                      </span>
                    </div>
                    <p className="text-white/60 text-[13px] mt-1">@{selected.username}</p>
                  </div>
                  <a
                    href="/admin/nguoi-dung"
                    className="flex-shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold rounded-xl transition border border-white/20"
                  >
                    Quản lý →
                  </a>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Bài đăng', value: selected.postCount, icon: '📝', color: 'text-[#0059b2]', bg: 'bg-blue-50' },
                  { label: 'Lượt xem', value: selected.totalViews.toLocaleString(), icon: '👁️', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Bài/tuần', value: selected.weeklyPosts, icon: '📅', color: 'text-teal-600', bg: 'bg-teal-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-4 text-center`}>
                    <p className="text-2xl mb-1">{s.icon}</p>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[11px] text-gray-500 font-bold uppercase mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Info grid */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-[12px] font-black text-[#0059b2] uppercase">Thông tin tài khoản</p>
                </div>
                <div className="divide-y divide-gray-50">
                  <ProfileRow label="Tên đăng nhập" value={selected.username} />
                  <ProfileRow label="Tên hiển thị" value={selected.display_name || '—'} />
                  <ProfileRow label="Vai trò" value={selected.role} />
                  <ProfileRow label="Tạo bởi" value={selected.created_by || 'system'} />
                  <ProfileRow label="Ngày tạo" value={selected.created_at ? formatDateLong(selected.created_at) : '—'} />
                  <ProfileRow
                    label="Đăng nhập cuối"
                    value={selected.last_login_at ? formatDateLong(selected.last_login_at) : 'Chưa ghi nhận'}
                  />
                </div>
              </div>

              {/* HADMIN-only section */}
              {isHadmin && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-red-100 bg-red-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <p className="text-[12px] font-black text-red-600 uppercase">Thông tin HADMIN — Chỉ bạn thấy</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    <ProfileRow label="IP đăng nhập cuối" value={selected.last_login_ip || 'Chưa ghi nhận'} mono />
                    <ProfileRow label="Trạng thái" value={selected.status === 'active' ? 'Đang hoạt động' : 'Đã vô hiệu hóa'} />
                    <ProfileRow label="Tần suất (tuần)" value={`${selected.weeklyPosts} bài / 7 ngày`} />
                    <ProfileRow label="Hiệu suất đóng góp" value={`${selected.postCount} bài · ${selected.totalViews.toLocaleString()} views`} />
                  </div>

                  {selected.postCount > 0 && (
                    <div className="px-5 py-4 bg-gray-50 border-t border-red-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Đóng góp so với toàn hệ thống</p>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0059b2] to-[#FFD700] rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(100, Math.round((selected.postCount / Math.max(1, totalPosts)) * 100))}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {Math.round((selected.postCount / Math.max(1, totalPosts)) * 100)}% tổng bài viết
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function ProfileRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center px-5 py-3">
      <span className="text-[11px] text-gray-400 font-black uppercase flex-shrink-0">{label}</span>
      <span className={`text-[13px] text-gray-700 font-medium max-w-[60%] text-right break-all ${mono ? 'font-mono text-[12px] bg-gray-50 px-2 py-0.5 rounded' : ''}`}>{value}</span>
    </div>
  );
}
