import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import AdminLayout from './AdminLayout';
import { getAllPosts, deletePost, type Post } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { getSession, needsApproval, createApprovalRequest } from '@/lib/auth';

export default function PostList() {
  const session = getSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [deleteMsg, setDeleteMsg] = useState('');

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    const result = await getAllPosts({ limit: LIMIT, offset: page * LIMIT, status: filter || undefined, search: search || undefined });
    setPosts(result.posts);
    setTotal(result.count);
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, filter, search]);

  const handleDelete = async (id: number, title: string) => {
    if (needsApproval(session?.role, 'delete_post') && session) {
      if (!confirm(`Gửi yêu cầu xóa bài "${title}" tới ADMIN/HADMIN phê duyệt?`)) return;
      setDeleting(id);
      try {
        await createApprovalRequest('DELETE_POST', id, title, session);
        setDeleteMsg('Đã gửi yêu cầu xóa bài — chờ ADMIN/HADMIN phê duyệt.');
        setTimeout(() => setDeleteMsg(''), 4000);
      } catch {}
      setDeleting(null);
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa bài viết "${title}"?`)) return;
    setDeleting(id);
    await deletePost(id);
    load();
    setDeleting(null);
  };

  return (
    <AdminLayout title="Danh sách bài viết">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Quản Lý Bài Viết</h2>
          <p className="text-[#555555] text-[13px] mt-1">Tổng: <b>{total.toLocaleString()}</b> bài viết</p>
        </div>
        <Link href="/admin/bai-viet/moi" className="px-6 py-2.5 bg-[#0059b2] text-white font-bold text-[14px] rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          + Viết bài mới
        </Link>
      </div>

      {deleteMsg && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-[13px] font-semibold">{deleteMsg}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            {['', 'published', 'draft'].map(s => (
              <button
                key={s}
                onClick={() => { setFilter(s); setPage(0); }}
                className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition ${filter === s ? 'bg-[#0059b2] text-white' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'}`}
              >
                {s === '' ? 'Tất cả' : s === 'published' ? 'Đã đăng' : 'Nháp'}
              </button>
            ))}
          </div>
          <form
            onSubmit={e => { e.preventDefault(); setSearch(searchInput.trim()); setPage(0); }}
            className="flex gap-2 sm:ml-auto"
          >
            <input
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); if (!e.target.value.trim()) { setSearch(''); setPage(0); } }}
              placeholder="Tìm kiếm tiêu đề..."
              className="px-3 py-1.5 border border-gray-200 rounded-full text-[13px] focus:outline-none focus:border-[#0059b2] w-[200px]"
            />
            <button type="submit" className="px-4 py-1.5 bg-[#0059b2] text-white rounded-full text-[13px] font-bold hover:bg-blue-700 transition">
              Tìm
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(0); }} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-[13px] font-bold hover:bg-gray-200 transition">×</button>
            )}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-[12px] font-bold text-[#555555] uppercase">
                <th className="p-4 text-left">Bài viết</th>
                <th className="p-4 text-left hidden md:table-cell">Loại</th>
                <th className="p-4 text-left hidden md:table-cell">Chuyên mục</th>
                <th className="p-4 text-left hidden md:table-cell">Trạng thái</th>
                <th className="p-4 text-left hidden md:table-cell">Lượt xem</th>
                <th className="p-4 text-left hidden md:table-cell">Ngày tạo</th>
                <th className="p-4 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <div className="h-10 bg-gray-100 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-[#555555]">
                    <p className="text-lg mb-2">Chưa có bài viết nào</p>
                    <Link href="/admin/bai-viet/moi" className="text-[#0059b2] font-bold hover:underline">Tạo bài viết đầu tiên →</Link>
                  </td>
                </tr>
              ) : posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {post.thumbnail && (
                        <img src={post.thumbnail} alt="" className="w-[60px] h-[40px] object-cover rounded flex-shrink-0 hidden sm:block" />
                      )}
                      <div>
                        <p className="font-bold text-[13px] text-[#222222] line-clamp-2 max-w-[280px]">{post.title}</p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-[12px] text-[#555555]">{post.post_type}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-[12px] text-[#555555]">{(post as any).category?.name || '—'}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {post.status === 'published' ? 'Đã đăng' : 'Nháp'}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-[12px] text-[#555555]">{post.view_count.toLocaleString()}</span>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-[12px] text-[#555555]">{formatDate(post.created_at)}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/bai-viet/${post.id}`} className="text-[12px] text-[#0059b2] hover:underline font-bold">Sửa</Link>
                      <span className="text-gray-200">|</span>
                      <a href={`/bai-viet/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-[12px] text-gray-500 hover:underline">Xem</a>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => handleDelete(post.id, post.title || 'bài không có tiêu đề')}
                        disabled={deleting === post.id}
                        className="text-[12px] text-red-500 hover:underline disabled:opacity-50"
                      >
                        {deleting === post.id ? '...' : 'Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > LIMIT && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[13px] text-[#555555]">
              Hiển thị {page * LIMIT + 1}–{Math.min((page + 1) * LIMIT, total)} / {total}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-4 py-2 border border-gray-200 rounded text-[13px] hover:bg-gray-50 disabled:opacity-40">←</button>
              <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total} className="px-4 py-2 border border-gray-200 rounded text-[13px] hover:bg-gray-50 disabled:opacity-40">→</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
