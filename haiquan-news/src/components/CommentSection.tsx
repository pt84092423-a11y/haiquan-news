import React, { useState, useEffect } from 'react';
import React, { supabase } from '@/lib/supabase';
import React, { timeAgo } from '@/lib/utils';

interface Comment {
  id: number;
  post_id: number;
  display_name: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  edit_count: number;
  status: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  postId: number;
}

const AVATARS = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-teal-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-600', 'bg-lime-600'];

function avatarBg(name: string) {
  return AVATARS[name.charCodeAt(0) % AVATARS.length];
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [name, setName] = useState(() => localStorage.getItem('hq-comment-name') || '');
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadComments = async () => {
    const { data, error: err } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'visible')
      .order('created_at', { ascending: true });

    if (err) {
      if (err.code === '42P01') setTableError(true);
      setLoading(false);
      return;
    }

    const all = (data || []) as Comment[];
    const roots = all.filter(c => !c.parent_id).map(r => ({
      ...r,
      replies: all.filter(c => c.parent_id === r.id),
    }));
    setComments(roots);
    setLoading(false);
  };

  useEffect(() => { loadComments(); }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Vui lòng nhập tên hiển thị.'); return; }
    if (!content.trim() || content.trim().length < 3) { setError('Nội dung bình luận quá ngắn.'); return; }

    setSubmitting(true);
    setError('');
    try {
      localStorage.setItem('hq-comment-name', name.trim());
      const { error: insertErr } = await supabase.from('post_comments').insert({
        post_id: postId,
        display_name: name.trim(),
        content: content.trim(),
        parent_id: replyTo?.id ?? null,
        status: 'visible',
      });
      if (insertErr) throw insertErr;
      setContent('');
      setReplyTo(null);
      setSuccess('Bình luận đã được gửi!');
      setTimeout(() => setSuccess(''), 3000);
      loadComments();
    } catch {
      setError('Không thể gửi bình luận. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCount = comments.reduce((s, c) => s + 1 + (c.replies?.length || 0), 0);

  if (tableError) return null;

  return (
    <div className="mt-10 border-t-2 border-[#e1e1e1] pt-8">
      <h3 className="font-['Playfair_Display',serif] text-[20px] font-black uppercase text-[#0059b2] mb-6 flex items-center gap-2.5">
        <div className="flex gap-[3px]">
          <div className="w-[5px] h-[20px] bg-[#0059b2] -skew-x-[18deg]" />
          <div className="w-[5px] h-[20px] bg-sky-400 -skew-x-[18deg]" />
        </div>
        BÌNH LUẬN
        {totalCount > 0 && (
          <span className="text-[14px] font-bold bg-[#0059b2] text-white px-2 py-0.5 rounded-full ml-1">{totalCount}</span>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="mb-8 bg-[#f8fbff] border border-blue-100 rounded-xl p-5">
        {replyTo && (
          <div className="mb-3 flex items-center gap-2 text-[13px] text-[#0059b2] bg-blue-50 rounded-lg px-3 py-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Trả lời <strong className="mx-1">{replyTo.display_name}</strong>
            <button type="button" onClick={() => setReplyTo(null)} className="ml-auto text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tên của bạn *"
            className="sm:col-span-1 w-full p-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] bg-white"
            maxLength={100}
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Nhập bình luận..."
            className="sm:col-span-2 w-full p-3 text-[14px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] resize-none bg-white"
            rows={2}
            maxLength={2000}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            {error && <p className="text-red-500 text-[13px]">{error}</p>}
            {success && <p className="text-green-600 text-[13px] font-bold">{success}</p>}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#0059b2] text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Đang gửi...</>
            ) : 'Gửi bình luận'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="text-center py-6 text-gray-400 text-[13px]">Đang tải bình luận...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-[14px]">
          <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chưa có bình luận nào. Hãy là người đầu tiên!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <CommentItem key={c.id} comment={c} onReply={() => setReplyTo(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, onReply, isReply = false }: { comment: Comment & { replies?: Comment[] }; onReply: () => void; isReply?: boolean }) {
  const bg = avatarBg(comment.display_name);
  const initial = comment.display_name.charAt(0).toUpperCase();

  return (
    <div className={isReply ? 'ml-10 border-l-2 border-blue-100 pl-4' : ''}>
      <div className="flex gap-3 items-start">
        <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0 mt-0.5 shadow-sm`}>
          {initial}
        </div>
        <div className="flex-1 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-black text-[14px] text-[#222]">{comment.display_name}</span>
            <span className="text-[11px] text-gray-400">{timeAgo(comment.created_at)}</span>
            {comment.edit_count > 0 && (
              <span className="text-[10px] text-gray-400 italic">(đã chỉnh sửa)</span>
            )}
          </div>
          <p className="text-[14px] text-gray-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          {!isReply && (
            <button
              onClick={onReply}
              className="mt-2 text-[12px] text-[#0059b2] hover:underline font-bold flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Trả lời
            </button>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map(r => (
            <CommentItem key={r.id} comment={r} onReply={() => {}} isReply />
          ))}
        </div>
      )}
    </div>
  );
}
