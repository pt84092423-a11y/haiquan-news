import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAllPosts, getSiteSetting, upsertSetting, parseJsonSetting, type Post } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

interface Webhook {
  id: string;
  name: string;
  url: string;
  server: string;
  channel: string;
  role_mention?: string;
}

interface BotConfig {
  signature_name: string;
  signature_title: string;
  contact_address: string;
  sender_name: string;
}

const DEFAULT_CONFIG: BotConfig = {
  signature_name: 'KirkTGM',
  signature_title: 'Ban biên tập Báo Hải Quân Nhân Dân',
  contact_address: 'Phòng Công tác Truyền thông – Hải quân Nhân dân Việt Nam\nSố 36 phường Cam Ranh, Khánh Hòa',
  sender_name: 'Tòa Soạn Báo Hải Quân Nhân Dân',
};

const SITE_URL = 'https://baohaiquansrov.xo.je';

function formatDiscordMessage(post: Post, config: BotConfig, mentionRole?: string): string {
  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const articleUrl = `${SITE_URL}/bai-viet/${post.slug}`;
  const excerpt = post.excerpt ? post.excerpt.replace(/<[^>]+>/g, '').trim() : '';

  const mention = mentionRole ? `${mentionRole}\n\n` : '';

  return `${mention}**🗡 | ${config.sender_name}**\n**Ngày ${dateStr}**\n\n**${post.title}**\n\n${excerpt ? excerpt + '\n\n' : ''}${articleUrl}\n\nKính mong các đồng chí chú ý!\nTrân trọng,\nĐồng chí ${config.signature_name}\nĐịa chỉ liên hệ: ${config.contact_address}`;
}

export default function DiscordBot() {
  const session = getSession();
  const [tab, setTab] = useState<'post' | 'webhooks' | 'config'>('post');

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [messagePreview, setMessagePreview] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [postSearch, setPostSearch] = useState('');

  const [newWebhook, setNewWebhook] = useState<Partial<Webhook>>({ name: '', url: '', server: '', channel: '', role_mention: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    getAllPosts({ limit: 100, status: 'published' }).then(r => {
      setPosts(r.posts);
      setLoadingPosts(false);
    });
    getSiteSetting('discord_bot_webhooks').then(v => {
      setWebhooks(parseJsonSetting<Webhook[]>(v, []));
    });
    getSiteSetting('discord_bot_config').then(v => {
      setConfig(parseJsonSetting<BotConfig>(v, DEFAULT_CONFIG));
    });
  }, []);

  useEffect(() => {
    if (selectedPost) {
      setMessagePreview(formatDiscordMessage(selectedPost, config, selectedWebhook?.role_mention));
    }
  }, [selectedPost, config, selectedWebhook]);

  const handleSendPost = async () => {
    if (!selectedPost || !selectedWebhook) return;
    setSending(true);
    setSendResult(null);
    try {
      const message = formatDiscordMessage(selectedPost, config, selectedWebhook.role_mention);
      const payload: any = { content: message };

      if (selectedPost.thumbnail) {
        payload.embeds = [{
          image: { url: selectedPost.thumbnail },
          color: 0x0059b2,
        }];
      }

      const res = await fetch(selectedWebhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 204) {
        setSendResult({ ok: true, msg: `Đã đăng thành công lên kênh #${selectedWebhook.channel}!` });
      } else {
        const err = await res.text();
        setSendResult({ ok: false, msg: `Lỗi Discord: ${res.status} — ${err}` });
      }
    } catch (e: any) {
      setSendResult({ ok: false, msg: `Lỗi: ${e.message}` });
    } finally {
      setSending(false);
    }
  };

  const handleAddWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || !newWebhook.server || !newWebhook.channel) return;
    const updated = [...webhooks, { ...newWebhook, id: Date.now().toString() } as Webhook];
    setWebhooks(updated);
    await upsertSetting('discord_bot_webhooks', JSON.stringify(updated));
    setNewWebhook({ name: '', url: '', server: '', channel: '', role_mention: '' });
  };

  const handleDeleteWebhook = async (id: string) => {
    const updated = webhooks.filter(w => w.id !== id);
    setWebhooks(updated);
    await upsertSetting('discord_bot_webhooks', JSON.stringify(updated));
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    await upsertSetting('discord_bot_config', JSON.stringify(config));
    setSavingConfig(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(postSearch.toLowerCase())
  );

  return (
    <AdminLayout title="Discord Bot">
      <div className="mb-6">
        <h2 className="text-[24px] font-['Playfair_Display',serif] font-black text-[#222] uppercase tracking-wide flex items-center gap-3">
          <svg className="w-7 h-7 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Bot Đăng Bài Discord
        </h2>
        <p className="text-[#555] text-[13px] mt-1">Tự động đăng bài viết lên các kênh Discord theo định dạng chuẩn.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { id: 'post', label: 'Đăng bài', icon: '📤' },
          { id: 'webhooks', label: 'Kênh Discord', icon: '🔗' },
          { id: 'config', label: 'Cấu hình', icon: '⚙️' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition ${tab === t.id ? 'bg-white shadow text-[#0059b2]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Đăng bài */}
      {tab === 'post' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Select post + channel */}
          <div className="space-y-5">
            {/* Select post */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">1. Chọn bài viết</span>
              </div>
              <div className="p-4">
                <input
                  value={postSearch}
                  onChange={e => setPostSearch(e.target.value)}
                  placeholder="Tìm kiếm bài viết..."
                  className="w-full mb-3 p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                />
                <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                  {loadingPosts ? (
                    <p className="text-[13px] text-gray-400 text-center py-4">Đang tải...</p>
                  ) : filteredPosts.length === 0 ? (
                    <p className="text-[13px] text-gray-400 text-center py-4">Không có bài viết</p>
                  ) : (
                    filteredPosts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPost(p)}
                        className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg border transition ${selectedPost?.id === p.id ? 'border-[#0059b2] bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        {p.thumbnail && (
                          <img src={p.thumbnail} alt="" className="w-12 h-9 object-cover rounded flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold line-clamp-2 leading-snug ${selectedPost?.id === p.id ? 'text-[#0059b2]' : 'text-[#222]'}`}>{p.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{p.category?.name || '—'} · {p.published_at ? new Date(p.published_at).toLocaleDateString('vi-VN') : ''}</p>
                        </div>
                        {selectedPost?.id === p.id && (
                          <svg className="w-4 h-4 text-[#0059b2] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Select webhook/channel */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">2. Chọn kênh đăng</span>
                <button onClick={() => setTab('webhooks')} className="text-[11px] text-[#0059b2] font-bold hover:underline">+ Thêm kênh</button>
              </div>
              <div className="p-4">
                {webhooks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-gray-400 mb-2">Chưa có kênh Discord nào được cấu hình.</p>
                    <button onClick={() => setTab('webhooks')} className="text-[13px] text-[#0059b2] font-bold hover:underline">Cấu hình ngay →</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {webhooks.map(w => (
                      <button
                        key={w.id}
                        onClick={() => setSelectedWebhook(w)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${selectedWebhook?.id === w.id ? 'border-[#5865F2] bg-indigo-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold ${selectedWebhook?.id === w.id ? 'text-[#5865F2]' : 'text-[#222]'}`}>{w.name}</p>
                          <p className="text-[11px] text-gray-400">{w.server} › #{w.channel}</p>
                        </div>
                        {selectedWebhook?.id === w.id && (
                          <svg className="w-4 h-4 text-[#5865F2] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSendPost}
              disabled={!selectedPost || !selectedWebhook || sending}
              className="w-full py-3.5 rounded-xl font-bold text-[14px] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-md"
            >
              {sending ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Đang gửi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  Đăng lên Discord
                </>
              )}
            </button>

            {sendResult && (
              <div className={`p-4 rounded-xl text-[13px] font-bold ${sendResult.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {sendResult.ok ? '✅ ' : '❌ '}{sendResult.msg}
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Xem trước tin nhắn Discord</span>
            </div>
            <div className="p-4">
              {!selectedPost ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-300">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-[13px] font-medium">Chọn bài viết để xem trước</p>
                </div>
              ) : (
                <div className="bg-[#36393f] rounded-xl p-4 font-['Roboto',sans-serif]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                    </div>
                    <div>
                      <span className="text-white font-bold text-[14px]">{config.sender_name}</span>
                      <span className="text-[#72767d] text-[11px] ml-2">Hôm nay lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="text-[#dcddde] text-[13px] leading-relaxed whitespace-pre-wrap pl-[52px] -mt-2">
                    {messagePreview.split('\n').map((line, i) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={i} className="font-bold text-white">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('http')) {
                        return <a key={i} href={line} className="text-[#00b0f4] hover:underline block">{line}</a>;
                      }
                      return <p key={i} className={line === '' ? 'h-3' : ''}>{line}</p>;
                    })}
                  </div>
                  {selectedPost.thumbnail && (
                    <div className="mt-3 pl-[52px]">
                      <img src={selectedPost.thumbnail} alt="" className="max-w-full rounded-lg max-h-48 object-cover" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Webhooks */}
      {tab === 'webhooks' && (
        <div className="space-y-6">
          {/* Add new webhook */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Thêm kênh Discord mới</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Mỗi webhook tương ứng với một kênh trong một máy chủ Discord.</p>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên hiển thị *</label>
                <input value={newWebhook.name || ''} onChange={e => setNewWebhook(p => ({ ...p, name: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" placeholder="VD: Kênh thông báo chính" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên máy chủ (Server) *</label>
                <input value={newWebhook.server || ''} onChange={e => setNewWebhook(p => ({ ...p, server: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" placeholder="VD: Tòa soạn Báo Hải Quân" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên kênh (Channel) *</label>
                <input value={newWebhook.channel || ''} onChange={e => setNewWebhook(p => ({ ...p, channel: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" placeholder="VD: announcements" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Mention Role (tuỳ chọn)</label>
                <input value={newWebhook.role_mention || ''} onChange={e => setNewWebhook(p => ({ ...p, role_mention: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" placeholder="VD: @Announcement hoặc <@&123456>" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Webhook URL *</label>
                <input value={newWebhook.url || ''} onChange={e => setNewWebhook(p => ({ ...p, url: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2] font-mono" placeholder="https://discord.com/api/webhooks/..." />
                <p className="text-[11px] text-gray-400 mt-1">Lấy từ: Server Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL</p>
              </div>
              <div className="md:col-span-2">
                <button
                  onClick={handleAddWebhook}
                  disabled={!newWebhook.name || !newWebhook.url || !newWebhook.server || !newWebhook.channel}
                  className="px-6 py-2.5 bg-[#5865F2] text-white rounded-lg font-bold text-[13px] hover:bg-[#4752c4] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + Thêm kênh
                </button>
              </div>
            </div>
          </div>

          {/* List webhooks */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Kênh đã cấu hình ({webhooks.length})</span>
            </div>
            <div className="p-4">
              {webhooks.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-6">Chưa có kênh Discord nào. Hãy thêm ở trên.</p>
              ) : (
                <div className="space-y-3">
                  {webhooks.map(w => (
                    <div key={w.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#222]">{w.name}</p>
                        <p className="text-[11px] text-gray-400">{w.server} › #{w.channel}{w.role_mention ? ` · ${w.role_mention}` : ''}</p>
                        <p className="text-[10px] text-gray-300 font-mono truncate mt-0.5">{w.url.substring(0, 60)}...</p>
                      </div>
                      <button onClick={() => handleDeleteWebhook(w.id)} className="text-red-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Config */}
      {tab === 'config' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl">
          <div className="px-5 py-3 border-b border-gray-100">
            <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Chữ ký & Thông tin bot</span>
            <p className="text-[11px] text-gray-400 mt-0.5">Hiển thị cuối mỗi tin nhắn đăng lên Discord.</p>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên tòa soạn / Sender Name</label>
              <input value={config.sender_name} onChange={e => setConfig(c => ({ ...c, sender_name: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]" placeholder="Tòa Soạn Báo Hải Quân Nhân Dân" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Người ký tên</label>
              <input value={config.signature_name} onChange={e => setConfig(c => ({ ...c, signature_name: e.target.value }))} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]" placeholder="KirkTGM" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Địa chỉ liên hệ</label>
              <textarea value={config.contact_address} onChange={e => setConfig(c => ({ ...c, contact_address: e.target.value }))} rows={3} className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] resize-none" />
            </div>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="px-6 py-2.5 bg-[#0059b2] text-white rounded-lg font-bold text-[13px] hover:bg-[#00408a] transition disabled:opacity-40"
            >
              {savingConfig ? 'Đang lưu...' : configSaved ? '✓ Đã lưu!' : 'Lưu cấu hình'}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
