import {  useState  } from 'react';
import AdminLayout from './AdminLayout';
import {  getSiteSetting, upsertSetting, parseJsonSetting, createPost, type Post  } from '@/lib/supabase';
import {  supabase  } from '@/lib/supabase';
import {  toEmbedUrl, detectPlatform, PLATFORM_META  } from '@/lib/mediaEmbed';

interface YoutubeChannel {
  id: string;
  label: string;
  handle: string;
  channelId: string;
  categorySlug: string;
  type: 'media' | 'short';
}

interface YoutubeVideo {
  videoId: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
  embedUrl: string;
  channel: string;
  channelLabel?: string;
  channelCategorySlug?: string;
  channelType?: string;
  selected?: boolean;
}

const DEFAULT_CHANNELS: YoutubeChannel[] = [
  { id: '1', label: 'TGM Kuroma', handle: 'TGM_Kuroma', channelId: '', categorySlug: 'truyen-hinh-hq', type: 'media' },
  { id: '2', label: 'SROV 24h', handle: 'srov24h', channelId: '', categorySlug: 'truyen-hinh-hq', type: 'media' },
  { id: '3', label: 'Truyền hình Hải quân', handle: 'srov4', channelId: '', categorySlug: 'truyen-hinh-hq', type: 'media' },
];

export default function ImportVideo() {
  const [tab, setTab] = useState<'youtube' | 'tiktok' | 'sync'>('youtube');
  const [channels, setChannels] = useState<YoutubeChannel[]>(DEFAULT_CHANNELS);
  const [videos, setVideos] = useState<YoutubeVideo[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [feedMsg, setFeedMsg] = useState('');

  const [tiktokUrl, setTiktokUrl] = useState('');
  const [tiktokTitle, setTiktokTitle] = useState('');
  const [tiktokImporting, setTiktokImporting] = useState(false);
  const [tiktokMsg, setTiktokMsg] = useState('');

  const [syncChannels, setSyncChannels] = useState<YoutubeChannel[]>(DEFAULT_CHANNELS);
  const [savingSync, setSavingSync] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const resolveHandle = async (chId: string, handle: string) => {
    setResolving(chId);
    try {
      const res = await fetch(`/api/youtube/resolve?handle=${encodeURIComponent(handle)}`);
      const data = await res.json();
      if (data.channelId) {
        setChannels(prev => prev.map(c => c.id === chId ? { ...c, channelId: data.channelId } : c));
      } else {
        alert('Không tìm thấy channel ID: ' + (data.error || ''));
      }
    } catch { alert('Lỗi kết nối'); }
    setResolving(null);
  };

  const fetchAllFeeds = async () => {
    setLoadingFeed(true);
    setFeedMsg('');
    setVideos([]);
    const configured = channels.filter(c => c.channelId);
    if (!configured.length) { setFeedMsg('⚠️ Chưa có kênh nào có Channel ID. Nhấn "Lấy ID" trước.'); setLoadingFeed(false); return; }
    const allVideos: YoutubeVideo[] = [];
    for (const ch of configured) {
      try {
        const res = await fetch(`/api/youtube/feed?channelId=${ch.channelId}`);
        const data = await res.json();
        if (data.videos) {
          allVideos.push(...data.videos.map((v: YoutubeVideo) => ({
            ...v,
            channelLabel: ch.label,
            channelCategorySlug: ch.categorySlug,
            channelType: ch.type,
            selected: false,
          })));
        }
      } catch {}
    }
    allVideos.sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());
    setVideos(allVideos);
    setFeedMsg(allVideos.length ? `✅ Tải được ${allVideos.length} video từ ${configured.length} kênh.` : '⚠️ Không tìm thấy video nào.');
    setLoadingFeed(false);
  };

  const toggleSelect = (videoId: string) =>
    setVideos(prev => prev.map(v => v.videoId === videoId ? { ...v, selected: !v.selected } : v));

  const importSelected = async () => {
    const selected = videos.filter(v => v.selected && !importedIds.has(v.videoId));
    if (!selected.length) return;
    for (const v of selected) {
      setImportingIds(prev => new Set([...prev, v.videoId]));
      try {
        const catRes = await supabase.from('categories').select('id').eq('slug', v.channelCategorySlug || 'truyen-hinh-hq').single();
        const catId = catRes.data?.id || null;
        await supabase.from('posts').upsert({
          title: v.title,
          slug: `yt-${v.videoId}`,
          content: `<p>Video nhập từ kênh <strong>${v.channelLabel}</strong>.</p>`,
          excerpt: v.title,
          thumbnail: v.thumbnail,
          category_id: catId,
          status: 'draft',
          post_type: 'video',
          video_url: v.embedUrl,
          author: v.channelLabel || 'YouTube Import',
          published_at: v.published || new Date().toISOString(),
        }, { onConflict: 'slug', ignoreDuplicates: true });
        setImportedIds(prev => new Set([...prev, v.videoId]));
      } catch {}
      setImportingIds(prev => { const s = new Set(prev); s.delete(v.videoId); return s; });
    }
    setVideos(prev => prev.map(v => ({ ...v, selected: false })));
  };

  const importTiktok = async () => {
    if (!tiktokUrl) return;
    setTiktokImporting(true);
    setTiktokMsg('');
    const platform = detectPlatform(tiktokUrl);
    const embedUrl = toEmbedUrl(tiktokUrl);
    try {
      const catRes = await supabase.from('categories').select('id').eq('slug', 'video-ngan').single();
      const catId = catRes.data?.id || null;
      const slug = `tt-${Date.now()}`;
      await supabase.from('posts').insert({
        title: tiktokTitle || `Short Video TikTok — ${new Date().toLocaleDateString('vi-VN')}`,
        slug,
        content: '',
        excerpt: tiktokTitle || 'Short video TikTok',
        thumbnail: '',
        category_id: catId,
        status: 'draft',
        post_type: 'video',
        video_url: embedUrl,
        author: 'TikTok Import',
        published_at: new Date().toISOString(),
      });
      setTiktokMsg('✅ Đã tạo draft bài viết! Vào Danh sách bài viết để xem và chỉnh sửa.');
      setTiktokUrl('');
      setTiktokTitle('');
    } catch (e: any) {
      setTiktokMsg('❌ Lỗi: ' + e.message);
    }
    setTiktokImporting(false);
  };

  const saveSyncConfig = async () => {
    setSavingSync(true);
    await upsertSetting('youtube_sync_channels', JSON.stringify(syncChannels.map(c => ({
      channelId: c.channelId,
      categorySlug: c.categorySlug,
      label: c.label,
    }))));
    setSyncMsg('✅ Đã lưu cấu hình đồng bộ. Bot sẽ tự tải video mới mỗi 6 giờ.');
    setSavingSync(false);
  };

  const selectedCount = videos.filter(v => v.selected).length;

  return (
    <AdminLayout title="Import Video">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <div>
              <h1 className="text-[15px] font-bold text-[#222]">Import Video từ YouTube & TikTok</h1>
              <p className="text-[12px] text-gray-400">Kéo video mới nhất về làm draft, hoặc cấu hình đồng bộ tự động.</p>
            </div>
          </div>
          <div className="flex border-b border-gray-100">
            {([
              { key: 'youtube', label: '▶ YouTube Import', },
              { key: 'tiktok', label: '♪ TikTok Import', },
              { key: 'sync', label: '🔄 Tự động đồng bộ', },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-[13px] font-bold border-b-2 transition ${tab === t.key ? 'border-[#0059b2] text-[#0059b2]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── YOUTUBE TAB ── */}
        {tab === 'youtube' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Kênh YouTube đã cấu hình</span>
                <button onClick={fetchAllFeeds} disabled={loadingFeed}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-[12px] font-bold hover:bg-red-600 transition disabled:opacity-50">
                  {loadingFeed
                    ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang tải...</>
                    : <>▶ Tải video mới nhất</>}
                </button>
              </div>
              <div className="p-5 space-y-3">
                {channels.map(ch => (
                  <div key={ch.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">YT</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#222]">{ch.label}</p>
                      <p className="text-[11px] text-gray-400">@{ch.handle} · {ch.categorySlug}</p>
                    </div>
                    {ch.channelId ? (
                      <span className="text-[10px] font-mono text-green-600 bg-green-50 px-2 py-1 rounded truncate max-w-[140px]">{ch.channelId}</span>
                    ) : (
                      <button onClick={() => resolveHandle(ch.id, ch.handle)} disabled={resolving === ch.id}
                        className="px-3 py-1.5 bg-[#0059b2] text-white rounded-lg text-[11px] font-bold hover:bg-[#004a9a] transition disabled:opacity-50 whitespace-nowrap">
                        {resolving === ch.id ? 'Đang lấy...' : 'Lấy Channel ID'}
                      </button>
                    )}
                    <select value={ch.categorySlug} onChange={e => setChannels(p => p.map(c => c.id === ch.id ? { ...c, categorySlug: e.target.value } : c))}
                      className="text-[11px] border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
                      <option value="truyen-hinh-hq">Hải quân Media</option>
                      <option value="video-ngan">Short Video</option>
                      <option value="longform">Longform</option>
                    </select>
                  </div>
                ))}
              </div>
              {feedMsg && <p className={`px-5 pb-4 text-[12px] ${feedMsg.startsWith('✅') ? 'text-green-600' : 'text-orange-500'}`}>{feedMsg}</p>}
            </div>

            {videos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">
                    {videos.length} video — đã chọn {selectedCount}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setVideos(v => v.map(x => ({ ...x, selected: !importedIds.has(x.videoId) })))}
                      className="px-3 py-1.5 text-[11px] font-bold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      Chọn tất cả
                    </button>
                    <button onClick={importSelected} disabled={selectedCount === 0}
                      className="px-4 py-1.5 bg-[#0059b2] text-white rounded-lg text-[12px] font-bold hover:bg-[#004a9a] transition disabled:opacity-40">
                      ↓ Import {selectedCount > 0 ? selectedCount : ''} video đã chọn
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                  {videos.map(v => {
                    const done = importedIds.has(v.videoId);
                    const importing = importingIds.has(v.videoId);
                    return (
                      <div key={v.videoId} onClick={() => !done && toggleSelect(v.videoId)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${done ? 'bg-green-50 opacity-60' : v.selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${done ? 'bg-green-500 border-green-500' : v.selected ? 'bg-[#0059b2] border-[#0059b2]' : 'border-gray-300'}`}>
                          {(done || v.selected) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                        </div>
                        <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                          {v.thumbnail && <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#222] line-clamp-1">{v.title}</p>
                          <p className="text-[11px] text-gray-400">{v.channelLabel} · {v.published ? new Date(v.published).toLocaleDateString('vi-VN') : ''}</p>
                        </div>
                        {importing && <svg className="w-4 h-4 text-[#0059b2] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                        {done && <span className="text-[10px] text-green-600 font-bold whitespace-nowrap">✓ Đã import</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TIKTOK TAB ── */}
        {tab === 'tiktok' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">♪ Import TikTok Short Video</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-[12px] text-amber-700">
                <p className="font-bold mb-1">⚠️ Lưu ý về TikTok</p>
                <p>TikTok không cấp API công khai để tự động tải video theo kênh hoặc hashtag. Bạn cần paste từng link video TikTok thủ công. Hệ thống sẽ tự nhúng video vào bài viết.</p>
                <p className="mt-1 font-medium">Các hashtag theo dõi: #navysrov #NAVYSROV #36navy #SROVNAVY — cần tìm video thủ công trên TikTok.</p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-blue-700">
                <p className="font-bold mb-1">📱 Các tài khoản TikTok cần theo dõi:</p>
                {['@sendanhtrong54', '@srovnavy_3', '@srovnavy36', '@t_zenyy'].map(acc => (
                  <a key={acc} href={`https://www.tiktok.com/${acc}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mr-3 mt-1 font-mono font-bold hover:underline">{acc}</a>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Link video TikTok *</label>
                <input value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@user/video/1234567890..."
                  className="w-full p-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] font-mono" />
                {tiktokUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded`}
                      style={{ background: PLATFORM_META[detectPlatform(tiktokUrl)].bg, color: PLATFORM_META[detectPlatform(tiktokUrl)].color }}>
                      {PLATFORM_META[detectPlatform(tiktokUrl)].name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono truncate">{toEmbedUrl(tiktokUrl)}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tiêu đề bài viết (tuỳ chọn)</label>
                <input value={tiktokTitle} onChange={e => setTiktokTitle(e.target.value)}
                  placeholder="Tự động lấy từ link nếu để trống..."
                  className="w-full p-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]" />
              </div>

              {tiktokUrl && detectPlatform(tiktokUrl) === 'tiktok' && (
                <div className="rounded-xl overflow-hidden border border-gray-200 bg-black" style={{ maxWidth: 340, aspectRatio: '9/16' }}>
                  <iframe src={toEmbedUrl(tiktokUrl)} className="w-full h-full" allowFullScreen allow="autoplay" />
                </div>
              )}

              <button onClick={importTiktok} disabled={!tiktokUrl || tiktokImporting}
                className="px-6 py-2.5 bg-[#010101] text-white rounded-lg font-bold text-[13px] hover:bg-[#333] transition disabled:opacity-40">
                {tiktokImporting ? 'Đang import...' : '♪ Import TikTok này'}
              </button>
              {tiktokMsg && <p className={`text-[12px] ${tiktokMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{tiktokMsg}</p>}
            </div>
          </div>
        )}

        {/* ── AUTO-SYNC TAB ── */}
        {tab === 'sync' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">🔄 Cấu hình đồng bộ tự động</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Hệ thống sẽ tự kéo video mới từ YouTube về dạng draft mỗi 6 giờ.</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-[12px] text-[#0059b2]">
                  <p className="font-bold mb-1">ℹ️ Cách hoạt động</p>
                  <ul className="space-y-1 list-disc list-inside text-gray-600">
                    <li>Bot YouTube Sync chạy nền cùng với Discord Bot (mỗi 6 giờ/lần)</li>
                    <li>Video mới sẽ được tạo dưới dạng <strong>draft</strong>, chưa xuất bản</li>
                    <li>Admin cần vào Danh sách bài viết để kiểm tra, sửa tiêu đề và xuất bản</li>
                    <li>Video đã import sẽ không bị import lại lần sau</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  {syncChannels.map(ch => (
                    <div key={ch.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-black">YT</div>
                        <input value={ch.label} onChange={e => setSyncChannels(p => p.map(c => c.id === ch.id ? { ...c, label: e.target.value } : c))}
                          className="flex-1 text-[13px] font-bold border-0 bg-transparent focus:outline-none" placeholder="Tên kênh" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Channel ID *</label>
                          <input value={ch.channelId} onChange={e => setSyncChannels(p => p.map(c => c.id === ch.id ? { ...c, channelId: e.target.value } : c))}
                            placeholder="UCxxxxxxxxxxxxxxxx"
                            className="w-full p-2 text-[12px] font-mono border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Chuyên mục</label>
                          <select value={ch.categorySlug} onChange={e => setSyncChannels(p => p.map(c => c.id === ch.id ? { ...c, categorySlug: e.target.value } : c))}
                            className="w-full p-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] bg-white">
                            <option value="truyen-hinh-hq">Hải quân Media</option>
                            <option value="video-ngan">Short Video</option>
                            <option value="longform">Longform</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button onClick={() => setSyncChannels(p => p.filter(c => c.id !== ch.id))}
                            className="px-3 py-2 text-red-400 hover:text-red-600 text-[12px] border border-red-100 rounded-lg hover:bg-red-50 transition w-full">
                            Xóa kênh này
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setSyncChannels(p => [...p, { id: Date.now().toString(), label: 'Kênh mới', handle: '', channelId: '', categorySlug: 'truyen-hinh-hq', type: 'media' }])}
                    className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-[12px] text-gray-400 hover:border-[#0059b2] hover:text-[#0059b2] transition font-bold">
                    + Thêm kênh YouTube
                  </button>
                </div>

                <button onClick={saveSyncConfig} disabled={savingSync}
                  className="px-6 py-2.5 bg-[#0059b2] text-white rounded-lg font-bold text-[13px] hover:bg-[#004a9a] transition disabled:opacity-50">
                  {savingSync ? 'Đang lưu...' : '💾 Lưu cấu hình đồng bộ'}
                </button>
                {syncMsg && <p className={`text-[12px] ${syncMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{syncMsg}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
