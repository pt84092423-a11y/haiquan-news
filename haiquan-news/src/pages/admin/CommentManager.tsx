import {  useState, useEffect  } from 'react';
import AdminLayout from './AdminLayout';
import {  supabase  } from '@/lib/supabase';
import {  timeAgo  } from '@/lib/utils';

interface Comment {
  id: number;
  post_id: number;
  display_name: string;
  content: string;
  ip_address?: string;
  edit_count: number;
  edited_at?: string;
  parent_id?: number | null;
  status: string;
  created_at: string;
  post_title?: string;
  post_slug?: string;
}

type FilterStatus = 'all' | 'visible' | 'hidden';

export default function CommentManager() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [tableError, setTableError] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      if (error.code === '42P01') setTableError(true);
      setLoading(false);
      return;
    }

    if (!data) { setLoading(false); return; }

    const postIds = [...new Set(data.map((c: any) => c.post_id))];
    const { data: posts } = await supabase
      .from('posts')
      .select('id, title, slug')
      .in('id', postIds);

    const postMap: Record<number, { title: string; slug: string }> = {};
    (posts || []).forEach((p: any) => { postMap[p.id] = { title: p.title, slug: p.slug }; });

    const enriched = data.map((c: any) => ({
      ...c,
      post_title: postMap[c.post_id]?.title || `Bài #${c.post_id}`,
      post_slug: postMap[c.post_id]?.slug || '',
    }));

    setComments(enriched);
    setLoading(false);
  };

  useEffect(() => { loadComments(); }, []);

  const toggleStatus = async (id: number, current: string) => {
    setActionLoading(id);
    const newStatus = current === 'visible' ? 'hidden' : 'visible';
    await supabase.from('post_comments').update({ status: newStatus }).eq('id', id);
    setComments(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setActionLoading(null);
  };

  const deleteComment = async (id: number) => {
    if (!confirm('Xóa bình luận này?')) return;
    setActionLoading(id);
    await supabase.from('post_comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    setActionLoading(null);
  };

  const filtered = comments
    .filter(c => filter === 'all' || c.status === filter)
    .filter(c =>
      !search ||
      c.display_name.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase()) ||
      (c.post_title || '').toLowerCase().includes(search.toLowerCase())
    );

  const counts = {
    all: comments.length,
    visible: comments.filter(c => c.status === 'visible').length,
    hidden: comments.filter(c => c.status === 'hidden').length,
  };

  if (tableError) {
    return (
      <AdminLayout title="Quản lý Bình luận">
        <div className="max-w-xl mx-auto mt-16 text-center">
          <svg className="w-14 h-14 text-orange-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Chưa thiết lập bảng bình luận</h2>
          <p className="text-gray-500 text-sm mb-4">
            Cần chạy SQL để tạo bảng <code className="bg-gray-100 px-1 rounded">post_comments</code>.
            Vào <strong>Database Setup</strong> → mục <strong>Bình luận & Tác giả</strong> để khởi tạo.
          </p>
          <a href="/admin/setup" className="inline-block px-6 py-2.5 bg-[#0059b2] text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition">
            Tới Database Setup
          </a>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý Bình luận">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Quản lý Bình luận</h2>
          <p className="text-[#555555] text-[13px] mt-1">Duyệt và kiểm soát bình luận của độc giả</p>
        </div>
        <button
          onClick={loadComments}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Làm mới
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-5">
        <div className="flex gap-2">
          {(['all', 'visible', 'hidden'] as FilterStatus[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition border ${filter === f ? 'bg-[#0059b2] text-white border-[#0059b2]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
            >
              {f === 'all' ? 'Tất cả' : f === 'visible' ? 'Hiển thị' : 'Ẩn'}
              <span className="ml-1.5 text-[11px] opacity-80">({counts[f]})</span>
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm bình luận..."
          className="flex-1 p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-[#0059b2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-[13px]">Đang tải...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-[14px]">
          Không tìm thấy bình luận nào
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(comment => (
            <div
              key={comment.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden transition ${comment.status === 'hidden' ? 'border-red-100 opacity-70' : 'border-gray-100'}`}
            >
              <div className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-black text-[14px] text-[#222]">{comment.display_name}</span>
                      {comment.parent_id && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-1.5 py-0.5 rounded">Trả lời</span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${comment.status === 'visible' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {comment.status === 'visible' ? 'Hiển thị' : 'Đã ẩn'}
                      </span>
                      <span className="text-[11px] text-gray-400">{timeAgo(comment.created_at)}</span>
                      {comment.ip_address && (
                        <span className="text-[10px] text-gray-300 font-mono">{comment.ip_address}</span>
                      )}
                    </div>

                    <p className="text-[14px] text-gray-700 leading-relaxed mb-2 whitespace-pre-wrap">{comment.content}</p>

                    <a
                      href={comment.post_slug ? `/bai-viet/${comment.post_slug}` : '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#0059b2] hover:underline font-bold flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {comment.post_title}
                    </a>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleStatus(comment.id, comment.status)}
                      disabled={actionLoading === comment.id}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition ${comment.status === 'visible' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'} disabled:opacity-50`}
                    >
                      {comment.status === 'visible' ? 'Ẩn' : 'Hiện'}
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      disabled={actionLoading === comment.id}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-50 text-red-500 hover:bg-red-100 transition disabled:opacity-50"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
