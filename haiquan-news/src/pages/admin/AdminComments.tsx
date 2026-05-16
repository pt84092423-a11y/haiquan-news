import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import { getAllCommentsAdmin, deleteComment, updateCommentApproval, addComment, type Comment } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export default function AdminComments() {
  const session = getSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const LIMIT = 20;

  const [replyOpen, setReplyOpen] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { comments: data, count } = await getAllCommentsAdmin({
        limit: LIMIT,
        offset: page * LIMIT,
        search: search.trim() || undefined,
      });
      setComments(data);
      setTotal(count);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    try {
      await deleteComment(id);
      setConfirmDelete(null);
      load();
    } catch { /* ignore */ }
  };

  const handleToggleApproval = async (c: Comment) => {
    await updateCommentApproval(c.id, !c.is_approved);
    load();
  };

  const handleReply = async (c: Comment) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      await addComment({
        post_id: c.post_id,
        author_name: session?.display_name || session?.username || 'Ban Biên Tập',
        content: replyText.trim(),
        parent_id: c.id,
      });
      setReplyText('');
      setReplyOpen(null);
      load();
    } finally {
      setReplying(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout title="Quản lý Bình luận">
      <div className="space-y-6">

        {/* Header + search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-black text-[#01122e]">Bình luận bạn đọc</h1>
            <p className="text-[13px] text-gray-500">Tổng cộng {total} bình luận</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Tìm nội dung bình luận..."
                className="pl-9 pr-4 py-2 text-[13px] border border-gray-200 rounded-xl focus:outline-none focus:border-[#0059b2] bg-white w-64"
              />
            </div>
            <button
              onClick={load}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:border-[#0059b2] transition"
              title="Làm mới"
            >
              <svg className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 border-b border-gray-50 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-400 text-[14px]">Không có bình luận nào</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <div>Bình luận / Bài viết</div>
              <div>Tác giả / IP</div>
              <div>Thời gian</div>
              <div>Trạng thái</div>
              <div>Thao tác</div>
            </div>

            {comments.map(c => (
              <div key={c.id} className="border-b border-gray-50 last:border-0">
                <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 md:gap-4 px-5 py-4 items-start hover:bg-gray-50/50 transition">

                  {/* Content + post */}
                  <div>
                    <p className={`text-[13px] leading-relaxed mb-1.5 ${c.parent_id ? 'text-gray-500 italic' : 'text-[#222]'}`}>
                      {c.parent_id && <span className="text-[10px] bg-blue-100 text-[#0059b2] font-bold px-1.5 py-0.5 rounded mr-1.5">Trả lời</span>}
                      {c.content.length > 120 ? c.content.substring(0, 120) + '…' : c.content}
                    </p>
                    {c.post && (
                      <a
                        href={`/bai-viet/${c.post.slug}`}
                        target="_blank"
                        className="text-[11px] text-[#0059b2] hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        {c.post.title.length > 50 ? c.post.title.substring(0, 50) + '…' : c.post.title}
                      </a>
                    )}
                    {c.edit_count > 0 && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        Đã sửa {c.edit_count} lần
                      </span>
                    )}
                  </div>

                  {/* Author + IP */}
                  <div>
                    <p className="text-[13px] font-bold text-[#222] flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-[#0059b2]/10 flex items-center justify-center text-[#0059b2] text-[11px] font-bold flex-shrink-0">
                        {c.author_name.charAt(0).toUpperCase()}
                      </span>
                      {c.author_name}
                    </p>
                    {c.ip_address && (
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5 ml-7">{c.ip_address}</p>
                    )}
                  </div>

                  {/* Time */}
                  <div>
                    <p className="text-[12px] text-gray-600">
                      {new Date(c.created_at).toLocaleDateString('vi-VN', { dateStyle: 'short' })}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(c.created_at).toLocaleTimeString('vi-VN', { timeStyle: 'short' })}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${c.is_approved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {c.is_approved ? '✓ Hiển thị' : '✗ Ẩn'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Toggle approve */}
                    <button
                      onClick={() => handleToggleApproval(c)}
                      title={c.is_approved ? 'Ẩn bình luận' : 'Hiện bình luận'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <svg className={`w-4 h-4 ${c.is_approved ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>

                    {/* Reply */}
                    <button
                      onClick={() => { setReplyOpen(replyOpen === c.id ? null : c.id); setReplyText(''); }}
                      title="Trả lời"
                      className="p-1.5 rounded-lg hover:bg-blue-50 transition"
                    >
                      <svg className="w-4 h-4 text-[#0059b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => setConfirmDelete(c.id)}
                      title="Xóa bình luận"
                      className="p-1.5 rounded-lg hover:bg-red-50 transition"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Inline reply form */}
                {replyOpen === c.id && (
                  <div className="px-5 pb-4 bg-blue-50 border-t border-blue-100">
                    <div className="pt-3 flex gap-3">
                      <div className="flex-1">
                        <p className="text-[12px] font-bold text-[#0059b2] mb-2">
                          Trả lời dưới tên: <span className="text-gray-700">{session?.display_name || session?.username}</span>
                        </p>
                        <textarea
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Nhập nội dung trả lời..."
                          rows={2}
                          className="w-full px-3 py-2 text-[13px] border border-blue-200 rounded-lg focus:outline-none focus:border-[#0059b2] bg-white resize-none"
                        />
                      </div>
                      <div className="flex flex-col gap-2 pt-6">
                        <button
                          onClick={() => handleReply(c)}
                          disabled={replying || !replyText.trim()}
                          className="px-4 py-2 bg-[#0059b2] text-white rounded-lg text-[12px] font-bold hover:bg-[#004a9a] disabled:opacity-50 transition whitespace-nowrap"
                        >
                          {replying ? '...' : 'Gửi'}
                        </button>
                        <button
                          onClick={() => { setReplyOpen(null); setReplyText(''); }}
                          className="px-4 py-2 bg-white text-gray-600 rounded-lg text-[12px] font-bold border border-gray-200 hover:bg-gray-50 transition"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-gray-500">
              Trang {page + 1} / {totalPages} (Tổng {total})
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-[13px] font-bold border border-gray-200 rounded-xl hover:border-[#0059b2] hover:text-[#0059b2] disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
              >
                ← Trước
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-[13px] font-bold border border-gray-200 rounded-xl hover:border-[#0059b2] hover:text-[#0059b2] disabled:opacity-40 disabled:cursor-not-allowed transition bg-white"
              >
                Tiếp →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm dialog */}
      {confirmDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-[16px] font-bold text-[#222] mb-2">Xóa bình luận?</h3>
            <p className="text-[13px] text-gray-500 mb-5">Hành động này không thể hoàn tác. Các trả lời con cũng sẽ bị xóa.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-[13px] hover:bg-red-600 transition"
              >
                Xóa
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-[13px] hover:bg-gray-200 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
