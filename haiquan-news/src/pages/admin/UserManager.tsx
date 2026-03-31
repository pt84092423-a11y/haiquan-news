import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAdminUsers, createAdminUser, deleteAdminUser, getSession, can, type UserRole } from '@/lib/auth';

export default function UserManager() {
  const session = getSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', role: 'EDITOR' as UserRole, display_name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    const data = await getAdminUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { setError('Điền đầy đủ thông tin'); return; }
    setSaving(true);
    setError('');
    try {
      await createAdminUser(form.username, form.password, form.role, form.display_name, session!);
      setSuccess('Tạo tài khoản thành công!');
      setForm({ username: '', password: '', role: 'EDITOR', display_name: '' });
      setShowForm(false);
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Lỗi tạo tài khoản');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Vô hiệu hóa tài khoản "${username}"?`)) return;
    try {
      await deleteAdminUser(userId, username, session!);
      setSuccess('Đã vô hiệu hóa tài khoản');
      load();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Lỗi xóa tài khoản');
    }
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      HADMIN: 'bg-red-100 text-red-700 border border-red-200',
      ADMIN: 'bg-blue-100 text-blue-700 border border-blue-200',
      EDITOR: 'bg-green-100 text-green-700 border border-green-200',
    };
    return <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${styles[role] || ''}`}>{role}</span>;
  };

  return (
    <AdminLayout title="Quản lý tài khoản">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase">Quản lý tài khoản</h2>
          <p className="text-[#555555] text-[13px] mt-1">Quản lý người dùng hệ thống và phân quyền</p>
        </div>
        {can(session?.role, 'create_account') && (
          <button onClick={() => setShowForm(s => !s)} className="px-5 py-2.5 bg-[#0059b2] text-white font-bold text-[13px] rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Tạo tài khoản
          </button>
        )}
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[13px] font-semibold">✓ {success}</div>}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px] font-semibold">✗ {error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-bold text-[16px] mb-4 text-[#0059b2]">Tạo tài khoản mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#555] uppercase mb-1">Tên đăng nhập *</label>
              <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0059b2]" placeholder="username" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#555] uppercase mb-1">Mật khẩu *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0059b2]" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#555] uppercase mb-1">Tên hiển thị</label>
              <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0059b2]" placeholder="Nguyễn Văn A" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#555] uppercase mb-1">Vai trò *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-[14px] focus:outline-none focus:border-[#0059b2]">
                {session?.role === 'HADMIN' && <option value="HADMIN">HADMIN</option>}
                <option value="ADMIN">ADMIN</option>
                <option value="EDITOR">EDITOR</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#0059b2] text-white font-bold text-[13px] rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 bg-gray-100 text-[#555] font-bold text-[13px] rounded-lg hover:bg-gray-200 transition">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-gray-100">
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Tài khoản</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Vai trò</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Trạng thái</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Ngày tạo</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Tạo bởi</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">Chưa có tài khoản nào. Chạy SQL trong Cài đặt Database để tạo.</td></tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0059b2] flex items-center justify-center text-white font-bold text-[12px]">
                      {(user.display_name || user.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-[#222]">{user.display_name || user.username}</p>
                      <p className="text-[11px] text-[#888]">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">{roleBadge(user.role)}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {user.status === 'active' ? 'Hoạt động' : 'Vô hiệu'}
                  </span>
                </td>
                <td className="px-5 py-4 text-[#888]">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="px-5 py-4 text-[#888]">{user.created_by || '—'}</td>
                <td className="px-5 py-4">
                  {can(session?.role, 'delete_account') && user.username !== session?.username && user.status === 'active' && (
                    <button onClick={() => handleDelete(user.id, user.username)}
                      className="px-3 py-1.5 text-red-600 border border-red-200 rounded-lg text-[12px] font-bold hover:bg-red-50 transition">
                      Vô hiệu hóa
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
