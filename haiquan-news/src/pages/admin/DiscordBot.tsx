import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAllPosts, getSiteSetting, upsertSetting, parseJsonSetting, type Post } from '@/lib/supabase';

type ChannelMode = 'bot' | 'webhook';

interface Channel {
  id: string;
  name: string;
  server: string;
  channel: string;
  mode: ChannelMode;
  channelId?: string;
  webhookUrl?: string;
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
    'Chi tiết trong đường link',
    'Kính mong các đồng chí chú ý!',
    'Trân trọng,',
    `Đồng chí ${config.signature_name}`,
    `-# ${config.contact_line1}`,
    `-# ${config.contact_line2}`,
  ].join('\n');
}

const DISCORD_ICON = (
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
  return <code className="bg-gray-100 text-[#5865F2] px-1.5 py-0.5 rounded font-mono text-[12px]">{children}</code>;
}

function Img({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="mt-2 rounded-lg border border-gray-200 max-w-full" onError={e => (e.currentTarget.style.display = 'none')} />;
}

export default function DiscordBot() {
  const [tab, setTab] = useState<'guide' | 'post' | 'channels' | 'config'>('post');
  const [guideTab, setGuideTab] = useState<'bot' | 'webhook'>('bot');

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [config, setConfig] = useState<BotConfig>(DEFAULT_CONFIG);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [postSearch, setPostSearch] = useState('');

  const [newChannel, setNewChannel] = useState<Partial<Channel>>({ name: '', server: '', channel: '', mode: 'bot', channelId: '', webhookUrl: '' });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [botTokenConfigured, setBotTokenConfigured] = useState<boolean | null>(null);

  interface DiscordGuild { id: string; name: string; icon: string | null; channels: { id: string; name: string; type: number }[]; }
  const [discoveredGuilds, setDiscoveredGuilds] = useState<DiscordGuild[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(false);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [channelSearch, setChannelSearch] = useState('');

  const [manualBotName, setManualBotName] = useState('');
  const [manualBotServer, setManualBotServer] = useState('');
  const [manualBotChannel, setManualBotChannel] = useState('');
  const [manualBotChannelId, setManualBotChannelId] = useState('');

  const fetchGuilds = async () => {
    setLoadingGuilds(true);
    try {
      const res = await fetch('/api/discord/guilds');
      const data = await res.json();
      if (data.guilds) setDiscoveredGuilds(data.guilds);
    } catch {}
    setLoadingGuilds(false);
  };

  const selectedGuild = discoveredGuilds.find(g => g.id === selectedGuildId);
  const selectedDiscordChannel = selectedGuild?.channels.find(c => c.id === selectedChannelId);

  const handleAddFromDiscovery = async () => {
    if (!selectedGuild || !selectedDiscordChannel) return;
    const ch: Channel = {
      id: Date.now().toString(),
      name: displayName || `#${selectedDiscordChannel.name} — ${selectedGuild.name}`,
      server: selectedGuild.name,
      channel: selectedDiscordChannel.name,
      mode: 'bot',
      channelId: selectedDiscordChannel.id,
    };
    const updated = [...channels, ch];
    setChannels(updated);
    await upsertSetting('discord_bot_channels', JSON.stringify(updated));
    setSelectedGuildId(''); setSelectedChannelId(''); setDisplayName(''); setChannelSearch('');
  };

  const handleAddManualBot = async () => {
    if (!manualBotName || !manualBotServer || !manualBotChannel || !manualBotChannelId) return;
    const ch: Channel = {
      id: Date.now().toString(),
      name: manualBotName,
      server: manualBotServer,
      channel: manualBotChannel,
      mode: 'bot',
      channelId: manualBotChannelId,
    };
    const updated = [...channels, ch];
    setChannels(updated);
    await upsertSetting('discord_bot_channels', JSON.stringify(updated));
    setManualBotName(''); setManualBotServer(''); setManualBotChannel(''); setManualBotChannelId('');
  };

  useEffect(() => {
    getAllPosts({ limit: 100, status: 'published' }).then(r => { setPosts(r.posts); setLoadingPosts(false); });
    getSiteSetting('discord_bot_channels').then(v => setChannels(parseJsonSetting<Channel[]>(v, [])));
    getSiteSetting('discord_bot_config').then(v => setConfig({ ...DEFAULT_CONFIG, ...parseJsonSetting<BotConfig>(v, DEFAULT_CONFIG) }));
    fetch('/api/discord/ping')
      .then(r => r.json()).then(d => setBotTokenConfigured(d.configured === true)).catch(() => setBotTokenConfigured(false));
  }, []);

  const handleSend = async () => {
    if (!selectedPost || !selectedChannel) return;
    setSending(true);
    setSendResult(null);
    const content = formatDiscordMessage(selectedPost, config);
    try {
      if (selectedChannel.mode === 'bot') {
        const res = await fetch('/api/discord/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelId: selectedChannel.channelId, content, embedImage: selectedPost.thumbnail }),
        });
        const data = await res.json();
        if (data.ok) setSendResult({ ok: true, msg: `Đã đăng thành công qua Bot lên #${selectedChannel.channel}!` });
        else setSendResult({ ok: false, msg: `Lỗi Bot: ${data.error}` });
      } else {
        const payload: any = { content };
        if (selectedPost.thumbnail) payload.embeds = [{ image: { url: selectedPost.thumbnail }, color: 0x0059b2 }];
        const res = await fetch(selectedChannel.webhookUrl!, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok || res.status === 204) setSendResult({ ok: true, msg: `Đã đăng thành công qua Webhook lên #${selectedChannel.channel}!` });
        else setSendResult({ ok: false, msg: `Lỗi Webhook: ${res.status} — ${await res.text()}` });
      }
    } catch (e: any) {
      setSendResult({ ok: false, msg: `Lỗi: ${e.message}` });
    } finally {
      setSending(false);
    }
  };

  const handleAddChannel = async () => {
    if (!newChannel.name || !newChannel.server || !newChannel.channel) return;
    if (newChannel.mode === 'bot' && !newChannel.channelId) return;
    if (newChannel.mode === 'webhook' && !newChannel.webhookUrl) return;
    const updated = [...channels, { ...newChannel, id: Date.now().toString() } as Channel];
    setChannels(updated);
    await upsertSetting('discord_bot_channels', JSON.stringify(updated));
    setNewChannel({ name: '', server: '', channel: '', mode: 'bot', channelId: '', webhookUrl: '' });
  };

  const handleDeleteChannel = async (id: string) => {
    const updated = channels.filter(c => c.id !== id);
    setChannels(updated);
    await upsertSetting('discord_bot_channels', JSON.stringify(updated));
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    await upsertSetting('discord_bot_config', JSON.stringify(config));
    setSavingConfig(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(postSearch.toLowerCase()));
  const messagePreview = selectedPost ? formatDiscordMessage(selectedPost, config) : '';

  return (
    <AdminLayout title="Discord Bot">
      <div className="mb-6">
        <h2 className="text-[24px] font-['Playfair_Display',serif] font-black text-[#222] uppercase tracking-wide flex items-center gap-3">
          <span className="text-[#5865F2]">{DISCORD_ICON}</span>Bot Đăng Bài Discord
        </h2>
        <p className="text-[#555] text-[13px] mt-1">Đăng bài viết lên Discord bằng Bot Token hoặc Webhook.</p>
      </div>

      {botTokenConfigured === false && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <span className="text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-[13px] font-bold text-amber-800">Bot Token chưa được cấu hình</p>
            <p className="text-[12px] text-amber-700 mt-0.5">Vào <strong>Secrets</strong> trong Replit, thêm biến <Code>DISCORD_BOT_TOKEN</Code> với giá trị token của bot. Xem hướng dẫn ở tab bên dưới.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {[
          { id: 'post', label: 'Đăng bài', icon: '📤' },
          { id: 'channels', label: 'Kênh Discord', icon: '🔗' },
          { id: 'config', label: 'Cấu hình', icon: '⚙️' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition ${tab === t.id ? 'bg-white shadow text-[#5865F2]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── HƯỚNG DẪN ── */}
      {tab === 'guide' && (
        <div>
          {/* Guide mode switcher */}
          <div className="flex gap-2 mb-5">
            <button onClick={() => setGuideTab('bot')} className={`px-5 py-2 rounded-xl text-[13px] font-bold border transition ${guideTab === 'bot' ? 'bg-[#5865F2] text-white border-[#5865F2]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#5865F2]'}`}>
              🤖 Dùng Bot Token (khuyên dùng)
            </button>
            <button onClick={() => setGuideTab('webhook')} className={`px-5 py-2 rounded-xl text-[13px] font-bold border transition ${guideTab === 'webhook' ? 'bg-[#5865F2] text-white border-[#5865F2]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#5865F2]'}`}>
              🔗 Dùng Webhook
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {guideTab === 'bot' ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-[#5865F2]/5">
                  <p className="text-[14px] font-black text-[#5865F2] uppercase tracking-wider">Tạo Discord Bot (dùng Token)</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Bot sẽ hiện tên và avatar trong Discord, trông chuyên nghiệp hơn Webhook.</p>
                </div>
                <div className="p-5 space-y-0">
                  <Step n={1} title="Mở Discord Developer Portal">
                    <p>Truy cập <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-[#5865F2] underline font-bold">discord.com/developers/applications</a> → đăng nhập tài khoản Discord.</p>
                  </Step>
                  <Step n={2} title="Tạo ứng dụng mới">
                    <p>Nhấn nút <strong>New Application</strong> (góc trên phải) → đặt tên (VD: <em>Báo Hải Quân Bot</em>) → nhấn <strong>Create</strong>.</p>
                  </Step>
                  <Step n={3} title="Vào mục Bot và lấy Token">
                    <p>Trong menu bên trái chọn <strong>Bot</strong> → nhấn <strong>Reset Token</strong> → xác nhận → nhấn <strong>Copy</strong> để copy token.</p>
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700 font-bold">
                      ⚠️ Không chia sẻ token này với ai! Nó cho phép kiểm soát toàn bộ bot.
                    </div>
                  </Step>
                  <Step n={4} title="Lưu Token vào Replit Secrets">
                    <p>Trong Replit, mở tab <strong>Secrets</strong> (biểu tượng 🔒 bên trái) → nhấn <strong>New Secret</strong>:</p>
                    <p className="mt-1">• Key: <Code>DISCORD_BOT_TOKEN</Code></p>
                    <p>• Value: Dán token vừa copy → nhấn <strong>Add Secret</strong>.</p>
                  </Step>
                  <Step n={5} title="Mời Bot vào máy chủ Discord">
                    <p>Quay lại Developer Portal → menu trái chọn <strong>OAuth2</strong> → <strong>URL Generator</strong>.</p>
                    <p className="mt-1">Tích chọn <strong>Scopes</strong>: <Code>bot</Code></p>
                    <p>Tích chọn <strong>Bot Permissions</strong>: <Code>Send Messages</Code>, <Code>View Channels</Code></p>
                    <p className="mt-1">Copy URL được tạo → mở trong tab mới → chọn máy chủ Discord → nhấn <strong>Authorize</strong>.</p>
                  </Step>
                  <Step n={6} title="Lấy Channel ID để dán vào hệ thống">
                    <p>Trong Discord, bật <strong>Developer Mode</strong>: Settings → Advanced → Developer Mode ✓</p>
                    <p className="mt-1">Chuột phải vào kênh muốn đăng → <strong>Copy Channel ID</strong> → dán vào tab <strong>Kênh Discord</strong>.</p>
                  </Step>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                  <p className="text-[14px] font-black text-gray-700 uppercase tracking-wider">Tạo Webhook (không cần cài bot)</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">Đơn giản hơn, không cần token. Tuy nhiên không có tên bot riêng.</p>
                </div>
                <div className="p-5 space-y-0">
                  <Step n={1} title="Mở cài đặt kênh Discord">
                    <p>Chuột phải vào kênh muốn đăng bài → chọn <strong>Edit Channel</strong>.</p>
                  </Step>
                  <Step n={2} title="Tìm mục Integrations">
                    <p>Trong thanh bên trái → chọn <strong>Integrations</strong>.</p>
                  </Step>
                  <Step n={3} title="Tạo Webhook mới">
                    <p>Nhấn <strong>Webhooks</strong> → <strong>New Webhook</strong> → đặt tên và upload avatar.</p>
                  </Step>
                  <Step n={4} title="Copy Webhook URL">
                    <p>Nhấn <strong>Copy Webhook URL</strong> → dán vào tab <strong>Kênh Discord</strong> (chọn chế độ Webhook).</p>
                  </Step>
                </div>
              </div>
            )}

            {/* Right panel */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Xem trước tin nhắn mẫu</p>
                </div>
                <div className="p-4">
                  <div className="bg-[#313338] rounded-xl p-4 text-[13px] space-y-0.5">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-white">{DISCORD_ICON}</div>
                      <div>
                        <span className="text-white font-bold">{config.sender_name}</span>
                        <span className="ml-1.5 text-[10px] bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-bold">BOT</span>
                        <span className="text-[#72767d] text-[11px] ml-2">Hôm nay</span>
                      </div>
                    </div>
                    <div className="pl-[52px] space-y-0.5">
                      <p className="text-[#c9d1d9] font-mono text-[10px]">{config.role_mention}</p>
                      <p className="text-white font-black text-[15px] border-l-4 border-[#5865F2] pl-2">{config.emoji}| {config.sender_name}</p>
                      <p className="text-[#72767d] text-[11px] font-bold">Ngày {new Date().getDate()}/{new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                      <div className="pt-1.5 space-y-1">
                        <p className="text-[#dcddde]">Nội dung sapo bài viết...</p>
                        <p className="text-[#00b0f4]">{config.site_url}/bai-viet/...</p>
                        <p className="text-[#dcddde] pt-1">Chi tiết trong đường link</p>
                        <p className="text-[#dcddde]">Kính mong các đồng chí chú ý!</p>
                        <p className="text-[#dcddde]">Trân trọng,</p>
                        <p className="text-[#dcddde]">Đồng chí {config.signature_name}</p>
                        <p className="text-[#72767d] text-[11px]">{config.contact_line1}</p>
                        <p className="text-[#72767d] text-[11px]">{config.contact_line2}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#5865F2]/5 border border-[#5865F2]/20 rounded-xl p-4">
                <p className="text-[13px] font-bold text-[#5865F2] mb-1">So sánh Bot vs Webhook</p>
                <table className="w-full text-[12px] text-gray-600">
                  <thead><tr className="text-gray-400"><th className="text-left pb-1">Tính năng</th><th className="text-center pb-1">Bot</th><th className="text-center pb-1">Webhook</th></tr></thead>
                  <tbody className="space-y-1">
                    {[
                      ['Tên & Avatar tùy chỉnh', '✅', '✅'],
                      ['Huy hiệu BOT', '✅', '❌'],
                      ['Cần cài đặt', 'Có (5 phút)', 'Không'],
                      ['Gửi qua server', '✅ (an toàn)', '❌ (trực tiếp)'],
                      ['Quản lý tập trung', '✅', '❌'],
                    ].map(r => (
                      <tr key={r[0]} className="border-t border-gray-100">
                        <td className="py-1">{r[0]}</td>
                        <td className="text-center">{r[1]}</td>
                        <td className="text-center">{r[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ĐĂNG BÀI ── */}
      {tab === 'post' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">1. Chọn bài viết</span>
              </div>
              <div className="p-4">
                <input value={postSearch} onChange={e => setPostSearch(e.target.value)} placeholder="Tìm kiếm bài viết..."
                  className="w-full mb-3 p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" />
                <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                  {loadingPosts ? <p className="text-[13px] text-gray-400 text-center py-4">Đang tải...</p>
                    : filteredPosts.length === 0 ? <p className="text-[13px] text-gray-400 text-center py-4">Không có bài viết</p>
                    : filteredPosts.map(p => (
                      <button key={p.id} onClick={() => setSelectedPost(p)}
                        className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg border transition ${selectedPost?.id === p.id ? 'border-[#5865F2] bg-indigo-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                        {p.thumbnail && <img src={p.thumbnail} alt="" className="w-12 h-9 object-cover rounded flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold line-clamp-2 leading-snug ${selectedPost?.id === p.id ? 'text-[#5865F2]' : 'text-[#222]'}`}>{p.title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{p.category?.name || '—'} · {p.published_at ? new Date(p.published_at).toLocaleDateString('vi-VN') : ''}</p>
                        </div>
                        {selectedPost?.id === p.id && <svg className="w-4 h-4 text-[#5865F2] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">2. Chọn kênh đăng</span>
                <button onClick={() => setTab('channels')} className="text-[11px] text-[#5865F2] font-bold hover:underline">+ Thêm kênh</button>
              </div>
              <div className="p-4">
                {channels.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[13px] text-gray-400 mb-2">Chưa có kênh nào.</p>
                    <button onClick={() => setTab('guide')} className="text-[13px] text-[#5865F2] font-bold hover:underline">Xem hướng dẫn →</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {channels.map(c => (
                      <button key={c.id} onClick={() => setSelectedChannel(c)}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${selectedChannel?.id === c.id ? 'border-[#5865F2] bg-indigo-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                        <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-white">{DISCORD_ICON}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-[13px] font-bold ${selectedChannel?.id === c.id ? 'text-[#5865F2]' : 'text-[#222]'}`}>{c.name}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${c.mode === 'bot' ? 'bg-[#5865F2] text-white' : 'bg-gray-200 text-gray-600'}`}>
                              {c.mode === 'bot' ? 'BOT' : 'WEBHOOK'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400">{c.server} › #{c.channel}</p>
                        </div>
                        {selectedChannel?.id === c.id && <svg className="w-4 h-4 text-[#5865F2]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleSend} disabled={!selectedPost || !selectedChannel || sending}
              className="w-full py-3.5 rounded-xl font-bold text-[14px] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-[#5865F2] hover:bg-[#4752c4] text-white shadow-md">
              {sending
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Đang gửi...</>
                : <>{DISCORD_ICON} Đăng lên Discord</>}
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
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Xem trước tin nhắn</span>
            </div>
            <div className="p-4">
              {!selectedPost ? (
                <div className="flex flex-col items-center justify-center h-56 text-gray-300">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  <p className="text-[13px] font-medium">Chọn bài viết để xem trước</p>
                </div>
              ) : (
                <div className="bg-[#313338] rounded-xl p-4 text-[13px] space-y-0.5">
                  <div className="flex items-start gap-3 mb-1">
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-white">{DISCORD_ICON}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{config.sender_name}</span>
                      <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-bold">BOT</span>
                      <span className="text-[#72767d] text-[11px]">{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="pl-[52px] space-y-0.5">
                    {messagePreview.split('\n').map((line, i) => {
                      if (line === '') return <div key={i} className="h-1.5" />;
                      if (line.startsWith('<@')) return <p key={i} className="text-[#c9d1d9] text-[10px] font-mono">{line}</p>;
                      if (line.startsWith('# ')) return <p key={i} className="text-white font-black text-[15px] border-l-4 border-[#5865F2] pl-2">{line.slice(2)}</p>;
                      if (line.startsWith('-# ')) return <p key={i} className="text-[#72767d] text-[11px]">{line.slice(3)}</p>;
                      if (line.startsWith('http')) return <a key={i} href={line} className="text-[#00b0f4] hover:underline block">{line}</a>;
                      return <p key={i} className="text-[#dcddde]">{line}</p>;
                    })}
                    {selectedPost.thumbnail && <img src={selectedPost.thumbnail} alt="" className="mt-2 rounded-lg max-h-40 object-cover" />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── KÊNH DISCORD ── */}
      {tab === 'channels' && (
        <div className="space-y-6">
          {/* ── Auto-discovery (Bot) ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">🤖 Thêm kênh từ Bot (tự động)</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Bot tự lấy danh sách tất cả server và kênh — không cần copy ID thủ công.</p>
              </div>
              <button onClick={fetchGuilds} disabled={loadingGuilds}
                className="flex items-center gap-2 px-4 py-2 bg-[#5865F2] text-white rounded-lg text-[12px] font-bold hover:bg-[#4752c4] transition disabled:opacity-50">
                {loadingGuilds
                  ? <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Đang tải...</>
                  : <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Tải danh sách từ bot</>}
              </button>
            </div>
            <div className="p-5">
              {discoveredGuilds.length === 0 && !loadingGuilds ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-[13px]">Nhấn <strong className="text-[#5865F2]">"Tải danh sách từ bot"</strong> để bot tự lấy danh sách server và kênh.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Server picker */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Chọn máy chủ *</label>
                      <select value={selectedGuildId} onChange={e => { setSelectedGuildId(e.target.value); setSelectedChannelId(''); }}
                        className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2] bg-white">
                        <option value="">— Chọn server —</option>
                        {discoveredGuilds.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                    {/* Channel picker with search */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tìm & chọn kênh *</label>
                      <div className={`border rounded-lg overflow-hidden ${!selectedGuildId ? 'opacity-40 pointer-events-none' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2 px-2.5 py-2 border-b border-gray-100 bg-gray-50">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input
                            value={channelSearch}
                            onChange={e => setChannelSearch(e.target.value)}
                            placeholder="Tìm kênh theo tên..."
                            className="flex-1 text-[13px] bg-transparent outline-none placeholder-gray-400"
                          />
                          {channelSearch && (
                            <button onClick={() => setChannelSearch('')} className="text-gray-300 hover:text-gray-500">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                          )}
                        </div>
                        <div className="max-h-[160px] overflow-y-auto">
                          {(selectedGuild?.channels || [])
                            .filter(c => c.name.toLowerCase().includes(channelSearch.toLowerCase()))
                            .length === 0 ? (
                            <p className="text-[12px] text-gray-400 text-center py-3">Không tìm thấy kênh nào</p>
                          ) : (
                            (selectedGuild?.channels || [])
                              .filter(c => c.name.toLowerCase().includes(channelSearch.toLowerCase()))
                              .map(c => (
                                <button key={c.id} onClick={() => setSelectedChannelId(c.id)}
                                  className={`w-full text-left px-3 py-2 text-[13px] transition border-b border-gray-50 last:border-0 flex items-center gap-2 ${selectedChannelId === c.id ? 'bg-indigo-50 text-[#5865F2] font-bold' : 'hover:bg-gray-50 text-[#222]'}`}>
                                  {c.type === 5 ? (
                                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM8 8.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-7zm3.5 0a.5.5 0 0 1 .5-.5h1l3 3.5-3 3.5h-1a.5.5 0 0 1-.5-.5v-6z"/></svg>
                                  ) : (
                                    <span className="text-gray-400 font-mono text-[11px]">#</span>
                                  )}
                                  <span>{c.name}</span>
                                  {c.type === 5 && <span className="ml-auto text-[10px] text-amber-500 font-bold bg-amber-50 px-1.5 py-0.5 rounded">thông báo</span>}
                                  {selectedChannelId === c.id && (
                                    <svg className="w-3.5 h-3.5 ml-auto text-[#5865F2]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                  )}
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedDiscordChannel && (
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-[#5865F2]/20 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#5865F2]">#{selectedDiscordChannel.name} — {selectedGuild?.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">Channel ID: {selectedDiscordChannel.id}</p>
                      </div>
                      <input value={displayName} onChange={e => setDisplayName(e.target.value)}
                        placeholder="Tên hiển thị (tuỳ chọn)"
                        className="w-44 p-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" />
                      <button onClick={handleAddFromDiscovery}
                        className="px-4 py-2 bg-[#5865F2] text-white rounded-lg text-[12px] font-bold hover:bg-[#4752c4] transition whitespace-nowrap">
                        + Thêm kênh này
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Manual Bot Channel ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">🤖 Thêm kênh Bot thủ công (nhập Channel ID)</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Dùng khi kênh không xuất hiện trong danh sách tự động — copy Channel ID từ Discord (bật Developer Mode → chuột phải kênh → Copy Channel ID).</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên hiển thị *</label>
                  <input value={manualBotName} onChange={e => setManualBotName(e.target.value)}
                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]"
                    placeholder="VD: Kênh tin tức" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên máy chủ *</label>
                  <input value={manualBotServer} onChange={e => setManualBotServer(e.target.value)}
                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]"
                    placeholder="VD: SROV Official" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên kênh *</label>
                  <input value={manualBotChannel} onChange={e => setManualBotChannel(e.target.value)}
                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]"
                    placeholder="VD: announcements" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Channel ID *</label>
                  <input value={manualBotChannelId} onChange={e => setManualBotChannelId(e.target.value)}
                    className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2] font-mono"
                    placeholder="VD: 1234567890123456789" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={handleAddManualBot}
                  disabled={!manualBotName || !manualBotServer || !manualBotChannel || !manualBotChannelId}
                  className="px-6 py-2.5 bg-[#5865F2] text-white rounded-lg font-bold text-[13px] hover:bg-[#4752c4] transition disabled:opacity-40 disabled:cursor-not-allowed">
                  + Thêm kênh Bot
                </button>
                {manualBotChannelId && (
                  <p className="text-[11px] text-gray-400 font-mono">ID: {manualBotChannelId}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── Manual (Webhook) ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <p className="text-[13px] font-bold text-[#555] uppercase tracking-wider">🔗 Thêm kênh qua Webhook (thủ công)</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Dùng khi không có bot token hoặc muốn dùng webhook riêng.</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'name', label: 'Tên hiển thị *', placeholder: 'VD: Kênh thông báo' },
                  { key: 'server', label: 'Tên máy chủ *', placeholder: 'VD: SROV Official' },
                  { key: 'channel', label: 'Tên kênh *', placeholder: 'VD: announcements' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">{f.label}</label>
                    <input value={(newChannel as any)[f.key] || ''} onChange={e => setNewChannel(p => ({ ...p, [f.key]: e.target.value, mode: 'webhook' }))}
                      className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2]" placeholder={f.placeholder} />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Webhook URL *</label>
                <input value={newChannel.webhookUrl || ''} onChange={e => setNewChannel(p => ({ ...p, webhookUrl: e.target.value, mode: 'webhook' }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#5865F2] font-mono" placeholder="https://discord.com/api/webhooks/..." />
              </div>
              <button onClick={handleAddChannel}
                disabled={!newChannel.name || !newChannel.server || !newChannel.channel || !newChannel.webhookUrl}
                className="px-6 py-2.5 bg-gray-700 text-white rounded-lg font-bold text-[13px] hover:bg-gray-900 transition disabled:opacity-40 disabled:cursor-not-allowed">
                + Thêm Webhook
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Kênh đã cấu hình ({channels.length})</span>
            </div>
            <div className="p-4">
              {channels.length === 0 ? (
                <p className="text-[13px] text-gray-400 text-center py-6">Chưa có kênh nào. Hãy thêm ở trên.</p>
              ) : (
                <div className="space-y-3">
                  {channels.map(c => (
                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="w-9 h-9 rounded-full bg-[#5865F2] flex items-center justify-center flex-shrink-0 text-white">{DISCORD_ICON}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-bold text-[#222]">{c.name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${c.mode === 'bot' ? 'bg-[#5865F2] text-white' : 'bg-gray-300 text-gray-700'}`}>
                            {c.mode === 'bot' ? 'BOT' : 'WEBHOOK'}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">{c.server} › #{c.channel}</p>
                        <p className="text-[10px] text-gray-300 font-mono truncate mt-0.5">
                          {c.mode === 'bot' ? `Channel ID: ${c.channelId}` : c.webhookUrl?.substring(0, 55) + '...'}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteChannel(c.id)} className="text-red-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-red-50">
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

      {/* ── CẤU HÌNH ── */}
      {tab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Nội dung chữ ký tin nhắn</span>
            </div>
            <div className="p-5 space-y-4">
              {[
                { key: 'sender_name', label: 'Tên tòa soạn (tiêu đề)', placeholder: 'Tòa Soạn Báo Hải Quân Nhân Dân' },
                { key: 'emoji', label: 'Emoji server (trước tiêu đề)', placeholder: '<:36Media:1483393549751025715>' },
                { key: 'role_mention', label: 'Role Mention (đầu tin nhắn)', placeholder: '<@&872815851894616095>' },
                { key: 'signature_name', label: 'Tên người ký (Đồng chí...)', placeholder: 'KirkTGM' },
                { key: 'contact_line1', label: 'Địa chỉ dòng 1', placeholder: 'Địa chỉ liên hệ: Phòng...' },
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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <span className="text-[13px] font-bold text-[#555] uppercase tracking-wider">Xem trước định dạng raw</span>
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
                  'Chi tiết trong đường link',
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
