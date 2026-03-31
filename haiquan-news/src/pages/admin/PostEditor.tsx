import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import AdminLayout from './AdminLayout';
import {
  createPost, updatePost, getAllCategories, uploadImage, uploadMediaFile, generateSlug,
  type Post, type Category
} from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { getSession, createApprovalRequest } from '@/lib/auth';

const CONTENT_TYPES = [
  {
    value: 'article',
    label: 'Bài Chuẩn',
    icon: (
      <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    value: 'longform',
    label: 'Longform/E-Mag',
    icon: (
      <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    value: 'photo_story',
    label: 'Phóng sự Ảnh',
    icon: (
      <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'podcast',
    label: 'Podcast Audio',
    icon: (
      <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    value: 'video',
    label: 'Video / Short',
    icon: (
      <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: 'baoin',
    label: 'Báo in (PDF)',
    icon: (
      <svg className="w-7 h-7 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const HAS_QUILL = ['article', 'longform', 'photo_story', 'podcast'];

export default function PostEditor() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = !params.id;

  const session = getSession();
  const isEditor = session?.role === 'EDITOR';

  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [success, setSuccess] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [editionNumber, setEditionNumber] = useState('');
  const [videoSource, setVideoSource] = useState<'embed' | 'upload'>('embed');

  const quillRef = useRef<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInited = useRef(false);

  const [form, setForm] = useState<Partial<Post>>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    thumbnail: '',
    category_id: undefined,
    status: 'draft',
    post_type: 'article',
    video_url: '',
    audio_url: '',
    author: 'Admin Hải Quân',
    meta_title: '',
    meta_description: '',
    og_image: '',
  });

  useEffect(() => { getAllCategories().then(setCategories); }, []);

  useEffect(() => {
    if (!isNew && params.id) {
      supabase.from('posts').select('*, category:categories(*)').eq('id', params.id).single().then(({ data }) => {
        if (data) {
          setForm(data);
          if (data.meta_title) {
            const tagMatch = data.meta_title.match(/\[TAGS:(.*?)\]/);
            if (tagMatch) setTags(tagMatch[1].split(',').filter(Boolean));
          }
          if (data.og_image?.startsWith('[GALLERY:')) {
            try {
              const raw = data.og_image.replace('[GALLERY:', '').replace(']', '');
              setGalleryImages(JSON.parse(raw));
            } catch {}
          }
          if (data.post_type === 'baoin' && data.excerpt) {
            setEditionNumber(data.excerpt);
          }
        }
      });
    }
  }, [params.id]);

  useEffect(() => {
    if (!HAS_QUILL.includes(form.post_type || '')) return;
    if (quillInited.current) return;
    if (!editorRef.current) return;

    const initQuill = () => {
      if (quillInited.current || !editorRef.current) return;
      const Quill = (window as any).Quill;
      if (!Quill) return;
      quillInited.current = true;
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ color: [] }, { background: [] }],
            [{ align: [] }],
            ['link', 'image', 'video'],
            ['clean'],
          ],
        },
        placeholder: 'Bắt đầu soạn thảo nội dung bài báo, chèn hình ảnh, video...',
      });
      quillRef.current.root.style.minHeight = '300px';
      quillRef.current.root.style.fontSize = '15px';
      quillRef.current.root.style.lineHeight = '1.7';
      if (form.content) quillRef.current.root.innerHTML = form.content;
      quillRef.current.on('text-change', () => {
        setForm(f => ({ ...f, content: quillRef.current.root.innerHTML }));
      });
    };

    if ((window as any).Quill) {
      initQuill();
    } else {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.quilljs.com/1.3.6/quill.snow.css';
      document.head.appendChild(link);
      const script = document.createElement('script');
      script.src = 'https://cdn.quilljs.com/1.3.6/quill.js';
      script.onload = initQuill;
      document.head.appendChild(script);
    }
  }, [form.post_type]);

  useEffect(() => {
    if (quillRef.current && form.content && !quillRef.current._loaded) {
      quillRef.current.root.innerHTML = form.content;
      quillRef.current._loaded = true;
    }
  }, [form.content]);

  const handleTitleChange = (title: string) => {
    setForm(f => ({ ...f, title, slug: isNew ? generateSlug(title) : f.slug }));
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailUploading(true);
    const url = await uploadImage(file);
    if (url) setForm(f => ({ ...f, thumbnail: url }));
    setThumbnailUploading(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(file);
      if (url) urls.push(url);
    }
    setGalleryImages(prev => [...prev, ...urls]);
    setGalleryUploading(false);
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUploading(true);
    const url = await uploadMediaFile(file, 'audio');
    if (url) setForm(f => ({ ...f, audio_url: url }));
    else setError('Lỗi tải âm thanh. Hãy đảm bảo bucket "haiquan-media" đã được tạo trong Supabase Storage.');
    setAudioUploading(false);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfUploading(true);
    const url = await uploadMediaFile(file, 'pdf');
    if (url) setForm(f => ({ ...f, audio_url: url }));
    else setError('Lỗi tải PDF. Hãy đảm bảo bucket "haiquan-media" đã được tạo trong Supabase Storage.');
    setPdfUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadMediaFile(file, 'video');
    if (url) setForm(f => ({ ...f, video_url: url }));
    else setError('Lỗi tải video. Hãy đảm bảo bucket "haiquan-media" đã được tạo trong Supabase Storage.');
  };

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, '');
      if (!tags.includes(newTag)) setTags(prev => [...prev, newTag]);
      setTagInput('');
    }
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!form.title?.trim()) { setError('Vui lòng nhập tiêu đề bài viết.'); return; }
    setSaving(true);
    setError('');
    try {
      const tagStr = tags.length ? `[TAGS:${tags.join(',')}]` : '';
      const galleryStr = galleryImages.length ? `[GALLERY:${JSON.stringify(galleryImages)}]` : form.og_image || '';

      // EDITOR: khi nhấn "Xuất bản" thì chỉ lưu nháp + tạo approval request
      const actualStatus = (isEditor && status === 'published') ? 'draft' : status;

      const payload: Partial<Post> = {
        ...form,
        content: quillRef.current?.root.innerHTML || form.content || '',
        status: actualStatus,
        published_at: actualStatus === 'published' ? new Date().toISOString() : form.published_at,
        updated_at: new Date().toISOString(),
        meta_title: tagStr ? `${tagStr} ${form.meta_title || ''}`.trim() : form.meta_title,
        og_image: form.post_type === 'photo_story' ? galleryStr : form.og_image,
        excerpt: form.post_type === 'baoin' ? editionNumber : form.excerpt,
      };

      let savedId: number | null = null;
      if (isNew) {
        const created = await createPost(payload);
        savedId = created.id;
        setTimeout(() => setLocation(`/admin/bai-viet/${created.id}`), 1200);
      } else {
        await updatePost(Number(params.id), payload);
        savedId = Number(params.id);
      }

      // EDITOR gửi yêu cầu duyệt đăng nếu nhấn "Xuất bản"
      if (isEditor && status === 'published' && session) {
        await createApprovalRequest(
          'PUBLISH_POST',
          savedId,
          form.title || 'Không có tiêu đề',
          session
        );
        setSuccess('Đã lưu và gửi yêu cầu duyệt đăng! Chờ ADMIN/HADMIN phê duyệt.');
      } else {
        setSuccess(status === 'published' ? 'Đã xuất bản thành công!' : 'Đã lưu bản nháp!');
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi khi lưu bài viết.');
    } finally {
      setSaving(false);
      setTimeout(() => setSuccess(''), 4000);
    }
  };

  const currentType = form.post_type || 'article';
  const showQuill = HAS_QUILL.includes(currentType);

  return (
    <AdminLayout title={isNew ? 'Viết bài mới' : 'Sửa bài viết'}>
      {/* Article Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: '#f8f9fa' }}>
          <div className="sticky top-0 bg-[#0059b2] text-white flex items-center justify-between px-4 md:px-8 py-3 shadow-md z-10">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              <span className="font-bold text-[14px]">Xem trước bài viết <span className="text-white/50 font-normal text-[12px]">(Chỉ là bản mẫu, không phải bài thật)</span></span>
            </div>
            <button onClick={() => setShowPreview(false)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition px-4 py-1.5 rounded-lg font-bold text-[13px]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              Đóng xem trước
            </button>
          </div>
          <div className="container mx-auto max-w-[860px] px-4 py-8">
            {/* Breadcrumb */}
            <p className="text-[12px] text-gray-400 mb-4">
              <span className="text-[#0059b2]">Trang chủ</span> › <span className="text-[#0059b2]">{categories.find(c => c.id === form.category_id)?.name || 'Chuyên mục'}</span> › <span className="text-gray-500">{form.title || 'Bài viết'}</span>
            </p>
            {/* Title */}
            <h1 className="font-['Playfair_Display',serif] text-[28px] md:text-[34px] font-black text-[#002060] leading-tight mb-4">
              {form.title || 'Tiêu đề bài viết mẫu — chưa nhập tiêu đề'}
            </h1>
            {/* Sapo / excerpt */}
            {form.excerpt && (
              <p className="text-[16px] text-gray-600 font-medium border-l-4 border-[#0059b2] pl-4 mb-5 leading-relaxed italic">{form.excerpt}</p>
            )}
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-gray-400 mb-6 pb-4 border-b border-gray-200">
              <span className="bg-[#0059b2] text-white px-2.5 py-0.5 rounded font-bold">{categories.find(c => c.id === form.category_id)?.name || 'Chuyên mục'}</span>
              <span>{form.author || 'Ban biên tập'}</span>
              <span>•</span>
              <span>{form.published_at ? new Date(form.published_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</span>
              <span>•</span>
              <span>haiquansrov.site</span>
            </div>
            {/* Thumbnail */}
            {form.thumbnail && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-md">
                <img src={form.thumbnail} alt={form.title} className="w-full object-cover" style={{ maxHeight: 450 }} />
              </div>
            )}
            {/* Content */}
            <div
              className="prose prose-lg max-w-none text-[#222] leading-relaxed"
              style={{ fontSize: '16px', lineHeight: '1.9' }}
              dangerouslySetInnerHTML={{ __html: form.content || '<p style="color:#aaa">Nội dung bài viết chưa được nhập...</p>' }}
            />
            {/* Audio */}
            {form.audio_url && (
              <div className="mt-8 p-4 bg-[#f0f5ff] rounded-xl border border-blue-100">
                <p className="text-[13px] font-bold text-[#0059b2] mb-2">🎙 Nghe Podcast</p>
                <audio controls className="w-full" src={form.audio_url} />
              </div>
            )}
            {/* Video */}
            {form.video_url && (
              <div className="mt-8 aspect-video rounded-xl overflow-hidden shadow-lg">
                <iframe src={form.video_url} className="w-full h-full" allowFullScreen title="Video" />
              </div>
            )}
            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-[12px] text-gray-400 mb-2 font-bold uppercase">URL bài viết</p>
              <p className="text-[#0059b2] text-[13px] font-mono">https://haiquansrov.site/bai-viet/{form.slug || 'slug-bai-viet'}</p>
            </div>
            {/* SEO card */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-[11px] text-gray-400 mb-2 font-bold uppercase">Kết quả hiển thị trên Google</p>
              <p className="text-[#1a0dab] text-[16px] font-medium hover:underline cursor-pointer">{form.meta_title || form.title || 'Tiêu đề SEO'} | Báo Hải Quân Việt Nam - SROV</p>
              <p className="text-[#006621] text-[12px]">haiquansrov.site › bai-viet › {form.slug || 'slug-bai-viet'}</p>
              <p className="text-[#545454] text-[13px] mt-1 line-clamp-2">{form.meta_description || form.excerpt || 'Mô tả SEO của bài viết...'}</p>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#f4f6f8]/95 backdrop-blur-md pb-4 pt-2 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/50">
        <div>
          <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Soạn Thảo Bài Viết</h2>
          <p className="text-[#555555] text-[13px] mt-1">Quản lý nội dung đa phương tiện, tối ưu hóa hiển thị và SEO.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => handleSave('draft')} disabled={saving} className="px-5 py-2.5 rounded-lg bg-white border border-gray-300 text-[#222222] hover:bg-gray-50 transition font-bold text-[13.5px] shadow-sm disabled:opacity-50">
            {saving ? '...' : 'Lưu nháp'}
          </button>
          <button onClick={() => setShowPreview(true)} className="px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-[#555] hover:bg-gray-50 transition font-bold text-[13.5px] shadow-sm flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            Xem trước
          </button>
          <button onClick={() => handleSave('published')} disabled={saving} className={`px-8 py-2.5 rounded-lg text-white transition font-bold text-[13.5px] shadow-md flex items-center gap-2 disabled:opacity-50 ${isEditor ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#0059b2] hover:bg-blue-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {saving ? 'Đang lưu...' : isEditor ? 'Gửi Duyệt' : 'Xuất Bản'}
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[13px]">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-[13px]">{success}</div>}

      {/* Content Type Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
        <p className="text-[12px] font-bold text-[#0059b2] uppercase tracking-wider mb-3 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          Chọn định dạng nội dung
        </p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {CONTENT_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setForm(f => ({ ...f, post_type: type.value as any }))}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                currentType === type.value
                  ? 'border-[#0059b2] bg-[#0059b2] text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {type.icon}
              <div className="text-[11px] font-bold leading-tight">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Title + Sapo */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <textarea
              value={form.title}
              onChange={e => handleTitleChange(e.target.value)}
              placeholder="Nhập tiêu đề bài viết..."
              className="w-full px-6 pt-5 pb-3 text-[22px] font-bold border-0 border-b border-gray-100 resize-none focus:outline-none font-['Roboto',sans-serif] placeholder-gray-300"
              rows={2}
            />
            <div className="px-6 pb-2 pt-1">
              <div className="flex justify-between text-[12px] text-gray-400 mb-1">
                <span>Đoạn mở đầu (Sapo) *</span>
                <span>{form.excerpt?.length || 0}/300</span>
              </div>
              <textarea
                value={form.post_type === 'baoin' ? '' : form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="Nhập Sapo dẫn truyện hấp dẫn cho độc giả dùng Longform/E-Magazine..."
                className="w-full text-[14px] border-0 resize-none focus:outline-none text-[#555] placeholder-gray-300"
                rows={3}
                readOnly={form.post_type === 'baoin'}
              />
            </div>
            <div className="px-6 pb-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[12px] text-gray-400 pt-2">
                <span>Slug:</span>
                <span className="text-gray-400">/bai-viet/</span>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="flex-1 p-1 text-[12px] border border-gray-200 rounded focus:outline-none focus:border-[#0059b2] font-mono"
                  placeholder="slug-bai-viet"
                />
              </div>
            </div>
          </div>

          {/* Quill Editor (conditional) */}
          {showQuill && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Nội dung chi tiết</span>
                <button className="text-[12px] text-[#0059b2] font-bold hover:underline flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Thêm Media (Ảnh/Video)
                </button>
              </div>
              <div ref={editorRef} className="border-0" style={{ minHeight: '320px' }} />
            </div>
          )}

          {/* === Type-specific panels === */}

          {/* Phóng sự Ảnh: Album Manager */}
          {currentType === 'photo_story' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#0059b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Quản lý Album Ảnh</span>
                <span className="text-[11px] text-gray-400">({galleryImages.length} ảnh)</span>
              </div>
              <div className="p-6">
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {galleryImages.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-200">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-[120px] border-2 border-dashed border-[#0059b2]/40 rounded-xl cursor-pointer hover:bg-blue-50 transition">
                  <input type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                  {galleryUploading ? (
                    <span className="text-[13px] text-[#0059b2]">Đang tải lên...</span>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-[#0059b2]/50 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-[13px] font-bold text-[#0059b2]/70">Tải ảnh lên (chọn nhiều ảnh)</span>
                      <span className="text-[11px] text-gray-400 mt-1">Tối đa 10MB/ảnh</span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Podcast: Audio Upload */}
          {currentType === 'podcast' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">File Âm Thanh Podcast</span>
              </div>
              <div className="p-6">
                {form.audio_url && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center gap-3">
                    <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    <span className="text-[12px] text-purple-700 truncate flex-1">{form.audio_url}</span>
                    <button onClick={() => setForm(f => ({ ...f, audio_url: '' }))} className="text-red-400 hover:text-red-600 text-xs font-bold">Xóa</button>
                  </div>
                )}
                {!form.audio_url && (
                  <label className="flex flex-col items-center justify-center w-full h-[130px] border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:bg-purple-50 transition">
                    <input type="file" accept=".mp3,.wav,.ogg,.m4a" onChange={handleAudioUpload} className="hidden" />
                    {audioUploading ? (
                      <span className="text-[13px] text-purple-500">Đang tải lên...</span>
                    ) : (
                      <>
                        <svg className="w-9 h-9 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-[13px] font-bold text-purple-500">Tải file âm thanh (.mp3, .wav)</span>
                        <span className="text-[11px] text-gray-400 mt-1">Tối đa 50MB</span>
                      </>
                    )}
                  </label>
                )}
                <div className="mt-3">
                  <label className="block text-[12px] text-gray-500 mb-1">Hoặc dán URL âm thanh</label>
                  <input
                    value={form.audio_url}
                    onChange={e => setForm(f => ({ ...f, audio_url: e.target.value }))}
                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-purple-400"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Video / Short: Nguồn Video */}
          {currentType === 'video' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Nguồn Video</span>
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setVideoSource('embed')}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-bold border transition ${videoSource === 'embed' ? 'bg-[#0059b2] text-white border-[#0059b2]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  >Nhúng từ nền tảng</button>
                  <button
                    onClick={() => setVideoSource('upload')}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-bold border transition ${videoSource === 'upload' ? 'bg-[#0059b2] text-white border-[#0059b2]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                  >Tải file trực tiếp</button>
                </div>

                {videoSource === 'embed' ? (
                  <div>
                    <label className="block text-[12px] text-gray-500 mb-2">Nhúng từ nền tảng (Youtube/Facebook)</label>
                    <input
                      value={form.video_url}
                      onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                      className="w-full p-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                      placeholder="Dán link video vào đây..."
                    />
                    {form.video_url && (
                      <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <iframe
                          src={form.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center w-full h-[140px] border-2 border-dashed border-red-200 rounded-xl cursor-pointer hover:bg-red-50 transition">
                      <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} className="hidden" />
                      <svg className="w-9 h-9 text-red-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-[13px] font-bold text-red-400">Tải file Video trực tiếp (.mp4)</span>
                      <span className="text-[11px] text-gray-400 mt-1">Khuyến dụng 1 → 10 GB (lưu Supabase)</span>
                    </label>
                    {form.video_url && <p className="mt-2 text-[12px] text-green-600 truncate">✓ {form.video_url}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Báo In: PDF + Số báo */}
          {currentType === 'baoin' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Xuất bản Báo in (PDF E-Paper)</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {form.audio_url ? (
                      <div className="flex flex-col items-center justify-center h-[140px] bg-orange-50 border border-orange-200 rounded-xl gap-2">
                        <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        <span className="text-[12px] text-orange-600 font-bold">File PDF đã tải lên</span>
                        <button onClick={() => setForm(f => ({ ...f, audio_url: '' }))} className="text-red-400 text-[11px] hover:underline">Xóa & tải lại</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-[140px] border-2 border-dashed border-orange-300 rounded-xl cursor-pointer hover:bg-orange-50 transition">
                        <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                        {pdfUploading ? (
                          <span className="text-[13px] text-orange-500">Đang tải lên...</span>
                        ) : (
                          <>
                            <svg className="w-9 h-9 text-orange-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="text-[13px] font-bold text-orange-500">Tải File PDF</span>
                            <span className="text-[11px] text-gray-400 mt-1">Tối đa bao</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-gray-500 mb-2 uppercase">Số báo (VD: Số 1771)</label>
                      <input
                        value={editionNumber}
                        onChange={e => setEditionNumber(e.target.value)}
                        className="w-full p-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                        placeholder="Số 1771"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-gray-500 mb-2 uppercase">Ngày phát hành</label>
                      <input
                        type="date"
                        value={form.published_at ? form.published_at.split('T')[0] : ''}
                        onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))}
                        className="w-full p-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEO Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                Công cụ tối ưu SEO
              </span>
              <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${(form.meta_description?.length || 0) <= 160 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                Điểm SEO: {Math.min(100, Math.round(((form.meta_title?.length || 0) + (form.meta_description?.length || 0)) / 2.2))}/100
              </span>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <label className="font-bold text-gray-500 uppercase">Từ khóa chính (Focus Keyword)</label>
                </div>
                <input
                  value={form.meta_title}
                  onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                  placeholder="Từ khóa chính của bài viết..."
                />
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <label className="font-bold text-gray-500 uppercase">Tiêu đề SEO (Meta Title)</label>
                  <span className={`${(form.meta_title?.length || 0) > 60 ? 'text-red-500' : 'text-gray-400'}`}>{form.meta_title?.length || 0}/60</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg text-[13px] text-gray-600 border border-gray-100">
                  {form.meta_title || form.title || 'Tiêu đề SEO của bài viết sẽ hiển thị ở đây...'}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[12px] mb-1">
                  <label className="font-bold text-gray-500 uppercase">Mô tả SEO (Meta Description)</label>
                  <span className={`${(form.meta_description?.length || 0) > 160 ? 'text-red-500' : 'text-gray-400'}`}>{form.meta_description?.length || 0}/160</span>
                </div>
                <textarea
                  value={form.meta_description}
                  onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#0059b2]"
                  rows={3}
                  placeholder="Mô tả ngắn gọn nội dung bài viết..."
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-[11px] text-gray-400 mb-1 font-bold">XEM TRƯỚC GOOGLE</p>
                <p className="text-[#1a0dab] text-[15px] font-medium">Báo Hải Quân Việt Nam - {form.meta_title || form.title || 'Tiêu đề bài viết'}</p>
                <p className="text-[#006621] text-[12px]">haiquansrov.site › bai-viet › {form.slug || 'slug-bai-viet'}</p>
                <p className="text-[#545454] text-[13px] mt-0.5 line-clamp-2">{form.meta_description || form.excerpt || 'Mô tả bài viết sẽ xuất hiện tại đây...'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">

          {/* Chuyên mục */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Chuyên mục đăng bài</span>
              <button className="text-[11px] text-[#0059b2] font-bold hover:underline">+ Thêm chuyên mục mới</button>
            </div>
            <div className="p-4 max-h-[260px] overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-4">Chưa có chuyên mục</p>
              ) : (
                <ul className="space-y-1">
                  {categories.map(c => (
                    <li key={c.id}>
                      <label className="flex items-center gap-2.5 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg">
                        <input
                          type="radio"
                          name="category"
                          checked={form.category_id === c.id}
                          onChange={() => setForm(f => ({ ...f, category_id: c.id }))}
                          className="w-3.5 h-3.5 accent-[#0059b2]"
                        />
                        <span className={`text-[13px] ${form.category_id === c.id ? 'text-[#0059b2] font-bold' : 'text-gray-700'}`}>{c.name}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Ảnh đại diện (Thumbnail)</span>
            </div>
            <div className="p-4">
              {form.thumbnail ? (
                <div className="relative mb-3">
                  <img src={form.thumbnail} alt="" className="w-full aspect-video object-cover rounded-xl" />
                  <button onClick={() => setForm(f => ({ ...f, thumbnail: '' }))} className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow">×</button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition mb-3">
                  <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="hidden" />
                  {thumbnailUploading ? (
                    <span className="text-[12px] text-gray-500">Đang tải...</span>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      <span className="text-[12px] text-gray-400">Kéo thả ảnh vào đây</span>
                      <span className="text-[11px] text-gray-300 mt-1">Tối đa JPG, PNG, WebP</span>
                    </>
                  )}
                </label>
              )}
              <input
                value={form.thumbnail || ''}
                onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))}
                className="w-full p-2 text-[11px] border border-gray-200 rounded-lg focus:outline-none"
                placeholder="Hoặc dán URL ảnh..."
              />
            </div>
          </div>

          {/* Thông tin xuất bản */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Thông tin xuất bản</span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tác giả / Bút danh</label>
                <input
                  value={form.author || ''}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                  placeholder="Admin Hải Quân"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Lịch đăng tải</label>
                <input
                  type="date"
                  value={form.published_at ? form.published_at.split('T')[0] : ''}
                  onChange={e => setForm(f => ({ ...f, published_at: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Từ khóa (Tags)</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-[#0059b2]/10 text-[#0059b2] text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="w-full p-2.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                  placeholder="Nhập tag rồi nhấn Enter..."
                />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold ${form.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${form.status === 'published' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  {form.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}
