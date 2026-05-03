import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAllPosts, getSiteSetting, upsertSetting, parseJsonSetting, type Post } from '@/lib/supabase';

interface Webhook {
  id: string;
  name: string;
  url: string;
  server: string;
  channel: string;
}

interface BotConfig {
  sender_name: string;
  emoji: string;
  role_mention: string;
  signature_name: string;
  contact_line1: string;
  contact_line2: string;
  site_url: string;
}

const DEFAULT_CONFIG: BotConfig = {
  sender_name: 'Tòa Soạn Báo Hải Quân Nhân Dân',
  emoji: '<:36Media:1483393549751025715>',
  role_mention: '<@&872815851894616095>',
  signature_name: 'KirkTGM',
  contact_line1: 'Địa chỉ liên hệ: Phòng Công tác Truyền thông - Hải quân Nhân dân Việt Nam',
  contact_line2: 'Số 36 phường Cam Ranh, Khánh Hòa',
  site_url: 'https://baohaiquansrov.xo.je',
};

function formatDiscordMessage(post: Post, config: BotConfig): string {
  const today = new Date();
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  const articleUrl = `${config.site_url}/bai-viet/${post.slug}`;
  const excerpt = post.excerpt ? post.excerpt.replace(/<[^>]+>/g, '').trim() : post.title;

  return [
    config.role_mention,
    `# ${config.emoji}| ${config.sender_name}`,
    `-# **Ngày ${dateStr}**`,
    '',
    excerpt,
    '',
    articleUrl,
    '',
    'Kính mong các đồng chí chú ý!',
    'Trân trọng,',
    `Đồng chí ${config.signature_name}`,
    `-# ${config.contact_line1}`,
    `-# ${config.contact_line2}`,
  ].join('\n');
}

const DISCORD_SVG = (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-black text-[14px]">{n}</div>
      <div className="flex-1 pb-6 border-b border-gray-100 last:border-0">
        <p className="font-bold text-[14px] text-[#222] mb-2">{title}</p>
        <div className="text-[13px] text-gray-600 space-y-1.5">{children}</div>
      </div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return <code className="bg-gray-100 text-[#0059b2] px-1.5 py-0.5 rounded font-mono text-[12px]">{children}</code>;
}

export default function DiscordBot() {
  const [tab, setTab] = useState<'post' | 'webhooks' | 'config' | 'guide'>('guide');

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

  const [newWebhook, setNewWebhook] = useState<Partial<Webhook>>({ name: '', url: '', server: '', channel: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    getAllPosts({ limit: 100, status: 'published' }).then(r => {
      setPosts(r.posts);
      setLoadingPosts(false);
    });
    getSiteSetting('discord_bot_webhooks').then(v => setWebhooks(parseJsonSetting<Webhook[]>(v, [])));
    getSiteSetting('discord_bot_config').then(v => setConfig(parseJsonSetting<BotConfig>(v, DEFAULT_CONFIG)));
  }, []);

  useEffect(() => {
    if (selectedPost) setMessagePreview(formatDiscordMessage(selectedPost, config));
  }, [selectedPost, config]);

  const handleSendPost = async () => {
    if (!selectedPost || !selectedWebhook) return;
    setSending(true);
    setSendResult(null);
    try {
      const content = formatDiscordMessage(selectedPost, config);
      const payload: any = { content };
      if (selectedPost.thumbnail) {
        payload.embeds = [{ image: { url: selectedPost.thumbnail }, color: 0x0059b2 }];
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
    setNewWebhook({ name: '', url: '', server: '', channel: '' });
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

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(postSearch.toLowerCase()));

  return (
    <AdminLayout title="Discord Bot">
      <div className="mb-6">
        <h2 className="text-[24px] font-['Playfair_Display',serif] font-black text-[#222] uppercase tracking-wide flex items-center gap-3">
          <span className="text-[#5865F2]">{DISCORD_SVG}</span>
          Bot Đăng Bài Discord
        </h2>
        <p className="text-[#555] text-[13px] mt-1">Tự động đăng bài viết lên các kênh Discord theo định dạng chuẩn.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {[
          { id: 'guide', label: 'Hướng dẫn', icon: '📖' },
          { id: 'post', label: 'Đăng bài', icon: '📤' },
          { id: 'webhooks', label: 'Kênh Discord', icon: '🔗' },
          { id: 'config', label: 'Cấu hình', icon: '⚙️' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition ${tab === t.id ? 'bg-white shadow text-[#0059b2]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: HƯỚNG DẪN ── */}
      {tab === 'guide' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guide steps */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-[#5865F2]/5">
              <p className="text-[14px] font-black text-[#5865F2] uppercase tracking-wider">Cách tạo Webhook trên Discord</p>
              <p className="text-[12px] text-gray-500 mt-0.5">Không cần cài bot riêng — chỉ cần tạo Webhook là xong.</p>
            </div>
            <div className="p-5 space-y-0">
              <Step n={1} title="Mở cài đặt kênh Discord">
                <p>Vào <strong>máy chủ Discord</strong> của bạn, nhấp chuột phải vào <strong>kênh</strong> muốn đăng bài → chọn <strong>Edit Channel</strong> (Chỉnh sửa kênh).</p>
              </Step>
              <Step n={2} title="Tìm mục Integrations">
                <p>Trong thanh bên trái của cài đặt kênh, chọn <strong>Integrations</strong> (Tích hợp).</p>
              </Step>
              <Step n={3} title="Tạo Webhook mới">
                <p>Nhấn <strong>Webhooks</strong> → nhấn nút <strong>New Webhook</strong> (Webhook mới).</p>
                <p className="mt-1">Đặt tên cho webhook (ví dụ: <Code>Báo Hải Quân Bot</Code>) và tùy chỉnh avatar nếu muốn.</p>
              </Step>
              <Step n={4} title="Copy Webhook URL">
                <p>Nhấn nút <strong>Copy Webhook URL</strong> — một đường link dạng:</p>
                <p className="mt-1 font-mono text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 break-all text-gray-500">
                  https://discord.com/api/webhooks/1234567890/xxxxxxxxxxxx
                </p>
              </Step>
              <Step n={5} title="Dán URL vào hệ thống">
                <p>Chuyển sang tab <strong>Kênh Discord</strong>, điền thông tin và dán URL vừa copy vào ô <strong>Webhook URL</strong>, rồi nhấn <strong>Thêm kênh</strong>.</p>
              </Step>
              <Step n={6} title="Lấy Role ID & Emoji ID (tuỳ chọn)">
                <p>Để mention role (<Code>@Announcement</Code>): Bật <strong>Developer Mode</strong> trong Discord Settings → chuột phải vào role → <strong>Copy Role ID</strong> → dán vào Cấu hình dạng <Code>{'<@&ROLE_ID>'}</Code>.</p>
                <p className="mt-1">Để dùng emoji server: gõ <Code>\:tên_emoji:</Code> trong Discord → copy chuỗi dạng <Code>{'<:name:ID>'}</Code> → dán vào ô Emoji.</p>
              </Step>
            </div>
          </div>

          {/* Format preview */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Định dạng tin nhắn mẫu</p>
              </div>
              <div className="p-4">
                <div className="bg-[#313338] rounded-xl p-4 font-['Roboto',sans-serif] text-[13px] space-y-1">
                  <p className="text-[#c9d1d9] font-mono text-[11px]">{'<@&872815851894616095>'}</p>
                  <p className="text-white text-[18px] font-black leading-tight border-l-4 border-[#5865F2] pl-3 mt-2">
                    <span className="text-yellow-400">⚓</span>| Tòa Soạn Báo Hải Quân Nhân Dân
                  </p>
                  <p className="text-[#72767d] text-[11px] font-bold pl-3">Ngày 3/5/2026</p>
                  <div className="pt-2 space-y-1">
                    <p className="text-[#dcddde]">Nội dung sapo bài viết...</p>
                    <p className="text-[#00b0f4] hover:underline cursor-pointer">https://baohaiquansrov.xo.je/bai-viet/slug-bai-viet</p>
                    <p className="text-[#dcddde] pt-1">Kính mong các đồng chí chú ý!</p>
                    <p className="text-[#dcddde]">Trân trọng,</p>
                    <p className="text-[#dcddde]">Đồng chí KirkTGM</p>
                    <p className="text-[#72767d] text-[11px]">Địa chỉ liên hệ: Phòng Công tác Truyền thông - Hải quân Nhân dân Việt Nam</p>
                    <p className="text-[#72767d] text-[11px]">Số 36 phường Cam Ranh, Khánh Hòa</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Cú pháp Discord Markdown dùng trong format</p>
              </div>
              <div className="p-4 space-y-2">
                {[
                  { syntax: '<@&ID>', desc: 'Mention role (thông báo nhóm)' },
                  { syntax: '# Tiêu đề', desc: 'Tiêu đề lớn (Heading 1)' },
                  { syntax: '-# Văn bản', desc: 'Chữ nhỏ phụ (Subtext)' },
                  { syntax: '**Văn bản**', desc: 'In đậm' },
                  { syntax: '<:emoji:ID>', desc: 'Emoji tùy chỉnh của server' },
                ].map(r => (
                  <div key={r.syntax} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                    <Code>{r.syntax}</Code>
                    <span className="text-[12px] text-gray-500">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-xl p-4">
              <p className="text-[13px] font-bold text-[#5865F2] mb-1">Sau khi tạo xong webhook</p>
              <p className="text-[12px] text-gray-600">Vào tab <strong>Cấu hình</strong> để điền tên tòa soạn, emoji, role mention, người ký tên, địa chỉ… rồi vào tab <strong>Đăng bài</strong> để chọn bài và gửi lên Discord.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ĐĂNG BÀI ── */}
      {tab === 'post' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            {/* Select post */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">1. Chọn bài viết</span>
              </div>
              <div className="p-4">
                <input value={postSearch} onChange={e => setPostSearch(e.target.value)}
                  placeholder="Tìm kiếm bài viết..." className="w-full mb-3 p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]" />
                <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                  {loadingPosts ? <p className="text-[13px] text-gray-400 text-center py-4">Đang tải...</p>
                    : filteredPosts.length === 0 ? <p className="text-[13px] text-gray-400 text-center py-4">Không có bài viết</p>
                    : filteredPosts.map(p => (
                      <button key={p.id} onClick={() => setSelectedPost(p)}
                        className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg border transition ${selectedPost?.id === p.id ? 'border-[#0059b2] bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                        {p.thumbnail && <img src={p.thumbnail} alt="" className="w-12 h-9 object-cover rounded flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold line-clamp-2 leading-snug ${selectedPost?.id === p.id ? 'text-[#0059b2]' : 'text-[#222]'}`}>{p.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{p.category?.name || '—'} · {p.published_at ? new Date(p.published_at).toLocaleDateString('vi-VN') : ''}</p>
                        </div>
                        {selectedPost?.id === p.id && (
                          <svg className="w-4 h-4 text-[#0059b2] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Select webhook */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">2. Chọn kênh đăng</span>
                <button onClick={() => setTab('webhooks')} className="text-[11px] text-[#0059b2] font-bold hover:underline">+ Thêm kênh</button>
              </div>
              <div className="p-4">
                {webhooks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-gray-400 mb-2">Chưa có kênh Discord nào.</p>
                    <button onClick={() => setTab('guide')} className="text-[13px] text-[#5865F2] font-bold hover:underline">Xem hướng dẫn →</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {webhooks.map(w => (
                      <button key={w.id} onClick={() => setSelectedWebhook(w)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${selectedWebhook?.id === w.id ? 'border-[#5865F2] bg-indigo-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                        <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-white">{DISCORD_SVG}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold ${selectedWebhook?.id === w.id ? 'text-[#5865F2]' : 'text-[#222]'}`}>{w.name}</p>
                          <p className="text-[11px] text-gray-400">{w.server} › #{w.channel}</p>
                        </div>
                        {selectedWebhook?.id === w.id && (
                          <svg className="w-4 h-4 text-[#5865F2]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleSendPost} disabled={!selectedPost || !selectedWebhook || sending}
              className="w-full py-3.5 rounded-xl font-bold text-[14px] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-md">
              {sending ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang gửi...</>
              ) : (
                <>{DISCORD_SVG} Đăng lên Discord</>
              )}
            </button>

            {sendResult && (
              <div className={`p-4 rounded-xl text-[13px] font-bold ${sendResult.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {sendResult.ok ? '✅ ' : '❌ '}{sendResult.msg}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Xem trước tin nhắn Discord</span>
            </div>
            <div className="p-4">
              {!selectedPost ? (
                <div className="flex flex-col items-center justify-center h-56 text-gray-300">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-[13px] font-medium">Chọn bài viết để xem trước</p>
                </div>
              ) : (
                <div className="bg-[#313338] rounded-xl p-4 font-['Roboto',sans-serif] space-y-0.5">
                  <div className="flex items-start gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-white">{DISCORD_SVG}</div>
                    <div>
                      <span className="text-white font-bold text-[14px]">{config.sender_name}</span>
                      <span className="text-[#72767d] text-[11px] ml-2">Hôm nay lúc {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="pl-[52px] space-y-0.5 text-[13px]">
                    {messagePreview.split('\n').map((line, i) => {
                      if (line === '') return <div key={i} className="h-2" />;
                      if (line.startsWith('<@')) return <p key={i} className="text-[#c9d1d9] text-[11px] font-mono">{line}</p>;
                      if (line.startsWith('# ')) return <p key={i} className="text-white font-black text-[16px] border-l-4 border-[#5865F2] pl-2">{line.replace('# ', '')}</p>;
                      if (line.startsWith('-# ')) return <p key={i} className="text-[#72767d] text-[11px]">{line.replace('-# ', '')}</p>;
                      if (line.startsWith('http')) return <a key={i} href={line} className="text-[#00b0f4] hover:underline block">{line}</a>;
                      return <p key={i} className="text-[#dcddde]">{line}</p>;
                    })}
                    {selectedPost.thumbnail && (
                      <div className="pt-2">
                        <img src={selectedPost.thumbnail} alt="" className="max-w-full rounded-lg max-h-40 object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WEBHOOKS ── */}
      {tab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Thêm kênh Discord mới</span>
              <p className="text-[11px] text-gray-400 mt-0.5">Mỗi webhook = một kênh trong một máy chủ. <button onClick={() => setTab('guide')} className="text-[#5865F2] underline">Xem hướng dẫn tạo webhook</button></p>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Tên hiển thị *', placeholder: 'VD: Kênh thông báo chính' },
                { key: 'server', label: 'Tên máy chủ *', placeholder: 'VD: Tòa soạn Báo Hải Quân' },
                { key: 'channel', label: 'Tên kênh *', placeholder: 'VD: announcements' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">{f.label}</label>
                  <input value={(newWebhook as any)[f.key] || ''} onChange={e => setNewWebhook(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" placeholder={f.placeholder} />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Webhook URL *</label>
                <input value={newWebhook.url || ''} onChange={e => setNewWebhook(p => ({ ...p, url: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2] font-mono" placeholder="https://discord.com/api/webhooks/..." />
                <p className="text-[11px] text-gray-400 mt-1">Channel Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL</p>
              </div>
              <div className="md:col-span-2">
                <button onClick={handleAddWebhook} disabled={!newWebhook.name || !newWebhook.url || !newWebhook.server || !newWebhook.channel}
                  className="px-6 py-2.5 bg-[#5865F2] text-white rounded-lg font-bold text-[13px] hover:bg-[#4752c4] transition disabled:opacity-40 disabled:cursor-not-allowed">
                  + Thêm kênh
                </button>
              </div>
            </div>
          </div>

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
                      <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-white">{DISCORD_SVG}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#222]">{w.name}</p>
                        <p className="text-[11px] text-gray-400">{w.server} › #{w.channel}</p>
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

      {/* ── TAB: CẤU HÌNH ── */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Chữ ký & Nội dung tin nhắn</span>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: 'sender_name', label: 'Tên tòa soạn (dòng tiêu đề)', placeholder: 'Tòa Soạn Báo Hải Quân Nhân Dân' },
                { key: 'emoji', label: 'Emoji server (trước tiêu đề)', placeholder: '<:36Media:1483393549751025715>' },
                { key: 'role_mention', label: 'Role Mention (đầu tin nhắn)', placeholder: '<@&872815851894616095>' },
                { key: 'signature_name', label: 'Tên người ký (Đồng chí...)', placeholder: 'KirkTGM' },
                { key: 'contact_line1', label: 'Địa chỉ dòng 1', placeholder: 'Địa chỉ liên hệ: Phòng Công tác...' },
                { key: 'contact_line2', label: 'Địa chỉ dòng 2', placeholder: 'Số 36 phường Cam Ranh, Khánh Hòa' },
                { key: 'site_url', label: 'URL website', placeholder: 'https://baohaiquansrov.xo.je' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">{f.label}</label>
                  <input value={(config as any)[f.key] || ''} onChange={e => setConfig(c => ({ ...c, [f.key]: e.target.value }))}
                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]" placeholder={f.placeholder} />
                </div>
              ))}
              <button onClick={handleSaveConfig} disabled={savingConfig}
                className="w-full py-2.5 bg-[#0059b2] text-white rounded-lg font-bold text-[13px] hover:bg-[#00408a] transition disabled:opacity-40">
                {savingConfig ? 'Đang lưu...' : configSaved ? '✓ Đã lưu!' : 'Lưu cấu hình'}
              </button>
            </div>
          </div>

          {/* Live raw preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Xem trước định dạng tin nhắn</span>
            </div>
            <div className="p-4">
              <div className="bg-[#1e1f22] rounded-xl p-4 font-mono text-[12px] text-[#dcddde] whitespace-pre-wrap leading-relaxed">
                {[
                  config.role_mention,
                  `# ${config.emoji}| ${config.sender_name}`,
                  `-# **Ngày ${new Date().getDate()}/${new Date().getMonth() + 1}/${new Date().getFullYear()}**`,
                  '',
                  'Nội dung sapo bài viết',
                  '',
                  `${config.site_url}/bai-viet/slug-bai-viet`,
                  '',
                  'Kính mong các đồng chí chú ý!',
                  'Trân trọng,',
                  `Đồng chí ${config.signature_name}`,
                  `-# ${config.contact_line1}`,
                  `-# ${config.contact_line2}`,
                ].join('\n')}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
