import React, { useState, useEffect } from 'react';
import React, { supabase } from '@/lib/supabase';
import React, { getSession } from '@/lib/auth';
import React, { formatDateLong } from '@/lib/utils';

interface UserProfileModalProps {
  userId?: number;
  authorName?: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, authorName, onClose }: UserProfileModalProps) {
  const session = getSession();
  const isAdmin = session?.role === 'ADMIN' || session?.role === 'HADMIN';
  const isHadmin = session?.role === 'HADMIN';

  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<{ postCount: number; totalViews: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) { setLoading(false); return; }
      const { data } = await supabase.from('admin_users').select('*').eq('id', userId).maybeSingle();
      if (data) {
        setUser(data);
        const { data: posts } = await supabase.from('posts').select('id, view_count').eq('author_id', userId);
        if (posts) {
          setStats({
            postCount: posts.length,
            totalViews: posts.reduce((s: number, p: any) => s + (p.view_count || 0), 0),
          });
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [userId]);

  const roleColor: Record<string, string> = {
    HADMIN: 'bg-red-600',
    ADMIN: 'bg-[#0059b2]',
    EDITOR: 'bg-green-600',
  };

  const roleBg = roleColor[user?.role] || 'bg-gray-500';
  const displayName = user?.display_name || user?.username || authorName || '?';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-[fadeInUp_0.2s_ease]"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-[#01122e] to-[#0059b2] pt-8 pb-6 px-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition text-white text-sm"
          >✕</button>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : !user ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                {initial}
              </div>
              <p className="text-white font-bold text-lg">{authorName || 'Tác giả'}</p>
              <p className="text-white/60 text-xs mt-1">Ban biên tập Hải Quân</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={displayName} className="w-16 h-16 rounded-full object-cover border-3 border-[#FFD700] shadow-lg" />
              ) : (
                <div className={`w-16 h-16 rounded-full ${roleBg} flex items-center justify-center text-2xl font-black border-2 border-[#FFD700] shadow-lg`}>
                  {initial}
                </div>
              )}
              <div>
                <p className="text-xl font-black leading-tight">{displayName}</p>
                <p className="text-white/70 text-sm">@{user.username}</p>
                <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1 ${roleBg}`}>{user.role}</span>
              </div>
            </div>
          )}
        </div>

        {!loading && user && (
          <div className="p-5 space-y-3">
            <InfoRow label="Tên hiển thị" value={user.display_name || '—'} />
            <InfoRow label="Ngày tham gia" value={user.created_at ? formatDateLong(user.created_at) : '—'} />
            <InfoRow label="Tạo bởi" value={user.created_by || 'system'} />

            {(isAdmin || isHadmin) && (
              <InfoRow
                label="Đăng nhập lần cuối"
                value={user.last_login_at ? formatDateLong(user.last_login_at) : 'Chưa ghi nhận'}
              />
            )}

            {stats && (
              <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-[#0059b2]">{stats.postCount}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase">Bài đăng</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black text-green-600">{stats.totalViews.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase">Lượt xem</p>
                </div>
              </div>
            )}

            {isHadmin && (
              <div className="border-t border-red-100 pt-3">
                <p className="text-[10px] font-black text-red-500 uppercase mb-2">Thông tin riêng HADMIN</p>
                <InfoRow label="IP lần cuối" value={user.last_login_ip || 'Chưa ghi nhận'} />
                <InfoRow label="Trạng thái" value={user.status === 'active' ? 'Đang hoạt động' : 'Đã vô hiệu'} />
              </div>
            )}
          </div>
        )}

        {!loading && !user && authorName && (
          <div className="p-5 text-center text-gray-400 text-[13px] pb-6">
            Tác giả chưa có tài khoản hệ thống
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
      <span className="text-[11px] text-gray-400 font-bold uppercase">{label}</span>
      <span className="text-[13px] text-gray-700 font-medium max-w-[60%] text-right">{value}</span>
    </div>
  );
}
