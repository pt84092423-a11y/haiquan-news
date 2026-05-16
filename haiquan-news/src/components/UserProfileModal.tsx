import { useState, useEffect } from 'react';
import { getAdminUserPublicProfile } from '@/lib/supabase';
import type { UserRole } from '@/lib/auth';

interface Props {
  userId: number;
  viewerRole?: UserRole;
  onClose: () => void;
}

function ProfileRow({ label, value, sensitive }: { label: string; value?: string | number | null; sensitive?: boolean }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-[12px] text-gray-400 font-medium w-40 flex-shrink-0">{label}:</span>
      <span className={`text-[13px] font-semibold break-all ${sensitive ? 'font-mono text-red-600 text-[11px] bg-red-50 px-1 py-0.5 rounded' : 'text-gray-800'}`}>{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
      <p className="text-[22px] font-black text-[#0059b2]">{value}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function UserProfileModal({ userId, viewerRole, onClose }: Props) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = viewerRole === 'HADMIN' || viewerRole === 'ADMIN' || viewerRole === 'EDITOR';
  const isHAdmin = viewerRole === 'HADMIN';

  useEffect(() => {
    setLoading(true);
    getAdminUserPublicProfile(userId)
      .then(p => { setProfile(p); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const roleColor =
    profile?.role === 'HADMIN' ? 'bg-red-600' :
    profile?.role === 'ADMIN' ? 'bg-[#0059b2]' : 'bg-green-600';
  const roleLabel =
    profile?.role === 'HADMIN' ? 'HADMIN' :
    profile?.role === 'ADMIN' ? 'ADMIN' : 'EDITOR';
  const initials = ((profile?.display_name || profile?.username || '?').charAt(0)).toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-br from-[#01122e] to-[#0059b2] px-6 pt-6 pb-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white/70 hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {loading ? (
                <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse border-[3px] border-[#FFD700]" />
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-[3px] border-[#FFD700] shadow-lg"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full ${roleColor} flex items-center justify-center text-white font-black text-2xl border-[3px] border-[#FFD700] shadow-lg`}>
                  {initials}
                </div>
              )}
            </div>
            <div>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-white/20 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-white/20 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <h2 className="text-white text-[17px] font-bold leading-tight">
                    {profile?.display_name || profile?.username || 'Không rõ'}
                  </h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1.5 inline-block ${roleColor} text-white`}>
                    {roleLabel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !profile ? (
            <div className="p-6 text-center text-gray-400 text-sm py-8">
              Không tìm thấy thông tin người dùng
            </div>
          ) : (
            <>
              {/* Basic info */}
              <div className="px-6 pt-4 pb-2">
                <ProfileRow label="Tên đăng nhập" value={profile.username} />
                <ProfileRow label="Tên hiển thị" value={profile.display_name} />
                <ProfileRow label="Người tạo tài khoản" value={profile.created_by} />
                <ProfileRow
                  label="Ngày tạo"
                  value={profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString('vi-VN', { dateStyle: 'long' })
                    : null}
                />
                <ProfileRow
                  label="Đăng nhập cuối"
                  value={profile.last_login_at
                    ? new Date(profile.last_login_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                    : 'Chưa ghi nhận'}
                />
              </div>

              {/* Stats (admin only) */}
              {isAdmin && (
                <div className="px-6 py-4 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Thống kê hoạt động
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="Bài đã đăng" value={profile.post_count ?? 0} />
                    <StatCard
                      label="Tổng lượt xem"
                      value={(profile.total_views ?? 0).toLocaleString('vi-VN')}
                    />
                  </div>
                </div>
              )}

              {/* HADMIN secret info */}
              {isHAdmin && (
                <div className="mx-4 mb-4 rounded-xl bg-red-50 border border-red-100 px-4 pt-3 pb-3">
                  <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Thông tin HADMIN (bảo mật)
                  </p>
                  <ProfileRow
                    label="IP đăng nhập cuối"
                    value={profile.last_login_ip || 'Chưa ghi nhận'}
                    sensitive
                  />
                  <ProfileRow
                    label="Hash mật khẩu"
                    value={profile.password_hash ? `${profile.password_hash.substring(0, 24)}…` : 'N/A'}
                    sensitive
                  />
                  <ProfileRow
                    label="Trạng thái TK"
                    value={profile.status === 'active' ? '✓ Đang hoạt động' : '✗ Đã vô hiệu hóa'}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[13px] rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
