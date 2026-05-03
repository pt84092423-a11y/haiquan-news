import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getSession } from '@/lib/auth';

interface DiscordMessage {
  id: string;
  content: string;
  author: { id: string; username: string; global_name?: string; avatar: string | null };
  timestamp: string;
  attachments: Array<{ id: string; filename: string; url: string; content_type?: string }>;
  embeds: any[];
  referenced_message?: { id: string; content: string; author: { username: string } } | null;
}

interface DiscordGuild { id: string; name: string; channels: DiscordChannel[]; }
interface DiscordChannel { id: string; name: string; type: number; }

function avatarUrl(author: DiscordMessage['author']) {
  if (author.avatar) return `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png?size=32`;
  return `https://cdn.discordapp.com/embed/avatars/0.png`;
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function DiscordReader() {
  const session = getSession();
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loadingGuilds, setLoadingGuilds] = useState(true);
  const [selectedGuildId, setSelectedGuildId] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const selectedGuild = guilds.find(g => g.id === selectedGuildId);
  const selectedChannel = selectedGuild?.channels.find(c => c.id === selectedChannelId);

  useEffect(() => {
    fetch('/api/discord/guilds')
      .then(r => r.json())
      .then(d => { if (d.guilds) setGuilds(d.guilds); })
      .catch(() => {})
      .finally(() => setLoadingGuilds(false));
  }, []);

  const loadMessages = async (before?: string) => {
    if (!selectedChannelId) return;
    setLoadingMsg(true);
    setError('');
    try {
      let url = `/api/discord/messages?channelId=${selectedChannelId}&limit=50`;
      if (before) url += `&before=${before}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.error) { setError(d.error); setLoadingMsg(false); return; }
      const msgs: DiscordMessage[] = d.messages || [];
      if (before) setMessages(prev => [...prev, ...msgs]);
      else setMessages(msgs);
      setHasMore(msgs.length === 50);
    } catch (e: any) {
      setError(e.message);
    }
    setLoadingMsg(false);
  };

  useEffect(() => {
    if (selectedChannelId) { setMessages([]); loadMessages(); }
  }, [selectedChannelId]);

  const filtered = search
    ? messages.filter(m =>
        m.content.toLowerCase().includes(search.toLowerCase()) ||
        (m.author.global_name || m.author.username).toLowerCase().includes(search.toLowerCase()))
    : messages;

  const oldestId = messages[messages.length - 1]?.id;

  if (session?.username !== 'TP67') {
    return (
      <AdminLayout title="Đọc tin Discord">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <p className="text-5xl mb-4">🔒</p>
            <p className="font-black text-red-600 text-xl uppercase">Không có quyền truy cập</p>
            <p className="text-gray-500 text-sm mt-2">Chức năng này chỉ dành cho tài khoản TP67.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Đọc tin Discord">
      <div className="mb-5">
        <h2 className="text-[24px] font-['Playfair_Display',serif] font-black text-[#222] uppercase tracking-wide flex items-center gap-3">
          <svg className="w-6 h-6 text-[#5865F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Đọc tin Discord
        </h2>
        <p className="text-[#555] text-[13px] mt-1">
          Xem lịch sử tin nhắn từ các máy chủ Discord.&nbsp;
          <span className="text-red-500 font-bold">Chỉ đọc — không thể gửi tin nhắn.</span>
        </p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '260px 1fr', height: 'calc(100vh - 260px)' }}>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Máy chủ &amp; Kênh</p>
          </div>
          {loadingGuilds ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin w-5 h-5 border-2 border-[#5865F2] border-t-transparent rounded-full" />
            </div>
          ) : guilds.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[13px] text-gray-400 p-4 text-center">Bot chưa tham gia server nào</div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {guilds.map(guild => (
                <div key={guild.id}>
                  <button
                    onClick={() => { setSelectedGuildId(guild.id === selectedGuildId ? '' : guild.id); setSelectedChannelId(''); setMessages([]); }}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition text-[13px] font-bold ${selectedGuildId === guild.id ? 'bg-[#5865F2]/10 text-[#5865F2]' : 'hover:bg-gray-50 text-[#222]'}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center text-[12px] font-black shrink-0">
                      {guild.name.charAt(0)}
                    </div>
                    <span className="truncate">{guild.name}</span>
                  </button>
                  {selectedGuildId === guild.id && (
                    <div className="bg-gray-50 border-b border-gray-100">
                      {guild.channels.length === 0 ? (
                        <p className="px-6 py-3 text-[12px] text-gray-400">Không có kênh nào</p>
                      ) : guild.channels.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedChannelId(ch.id)}
                          className={`w-full text-left px-5 py-2.5 text-[13px] flex items-center gap-2 transition ${selectedChannelId === ch.id ? 'bg-[#5865F2] text-white font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                          <span className="text-[11px] opacity-60">{ch.type === 5 ? '📢' : '#'}</span>
                          {ch.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#36393f] rounded-xl overflow-hidden flex flex-col shadow-sm">
          <div className="h-12 bg-[#2f3136] flex items-center px-4 gap-3 border-b border-black/20 shrink-0">
            {selectedChannel ? (
              <>
                <span className="text-[#72767d] text-sm">{selectedChannel.type === 5 ? '📢' : '#'}</span>
                <span className="text-white font-bold text-sm">{selectedChannel.name}</span>
                <div className="ml-auto flex items-center gap-3">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="bg-[#202225] text-white placeholder-[#72767d] text-[13px] px-3 py-1.5 rounded w-44 border border-black/30 focus:outline-none focus:border-[#5865F2]"
                  />
                  <span className="text-[#72767d] text-[12px] whitespace-nowrap">{filtered.length} tin</span>
                </div>
              </>
            ) : (
              <span className="text-[#72767d] text-[13px]">Chọn kênh để xem tin nhắn</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
            {!selectedChannelId ? (
              <div className="flex items-center justify-center h-full text-[#72767d] text-sm">← Chọn kênh từ danh sách bên trái</div>
            ) : loadingMsg && messages.length === 0 ? (
              <div className="flex items-center justify-center h-full gap-3 text-[#72767d]">
                <div className="animate-spin w-5 h-5 border-2 border-[#5865F2] border-t-transparent rounded-full" />
                Đang tải tin nhắn...
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-[13px] p-4 rounded-lg max-w-sm text-center">{error}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#72767d] text-sm">
                {search ? 'Không tìm thấy tin nhắn phù hợp' : 'Kênh chưa có tin nhắn nào'}
              </div>
            ) : (
              <>
                {filtered.map((msg, i) => {
                  const prev = filtered[i - 1];
                  const sameAuthor = prev && prev.author.id === msg.author.id
                    && (new Date(prev.timestamp).getTime() - new Date(msg.timestamp).getTime()) < 5 * 60 * 1000;
                  const displayName = msg.author.global_name || msg.author.username;
                  return (
                    <div key={msg.id} className={`flex gap-3 group ${sameAuthor ? 'mt-0.5' : 'mt-4'}`}>
                      {sameAuthor ? (
                        <div className="w-10 shrink-0" />
                      ) : (
                        <img
                          src={avatarUrl(msg.author)}
                          alt={displayName}
                          className="w-10 h-10 rounded-full shrink-0 mt-0.5"
                          onError={e => { (e.target as HTMLImageElement).src = 'https://cdn.discordapp.com/embed/avatars/0.png'; }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        {!sameAuthor && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-white font-bold text-sm">{displayName}</span>
                            <span className="text-[#72767d] text-[11px]">{formatTs(msg.timestamp)}</span>
                          </div>
                        )}
                        {msg.referenced_message && (
                          <div className="mb-1 pl-2 border-l-2 border-[#72767d]/40">
                            <span className="text-[#72767d] text-[11px]">↩ {msg.referenced_message.author?.username}: {msg.referenced_message.content?.slice(0, 80)}</span>
                          </div>
                        )}
                        {msg.content && (
                          <p className="text-[#dcddde] text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                        {msg.attachments.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {msg.attachments.map(att => (
                              att.content_type?.startsWith('image/') ? (
                                <img key={att.id} src={att.url} alt={att.filename} className="max-w-sm max-h-60 rounded object-contain cursor-pointer" onClick={() => window.open(att.url, '_blank')} />
                              ) : (
                                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-[#2f3136] text-[#00aff4] text-[13px] px-3 py-2 rounded hover:underline w-fit">
                                  📎 {att.filename}
                                </a>
                              )
                            ))}
                          </div>
                        )}
                        {msg.embeds[0]?.image && (
                          <img src={msg.embeds[0].image.url} alt="" className="mt-1 max-w-sm max-h-48 rounded object-contain" />
                        )}
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <div className="flex justify-center pt-4 pb-2">
                    <button
                      onClick={() => loadMessages(oldestId)}
                      disabled={loadingMsg}
                      className="bg-[#2f3136] text-[#dcddde] text-[13px] px-5 py-2 rounded-lg hover:bg-[#40444b] transition disabled:opacity-50 border border-black/20"
                    >
                      {loadingMsg ? 'Đang tải...' : '↑ Tải tin nhắn cũ hơn'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="h-10 bg-[#40444b] flex items-center px-4 border-t border-black/20 shrink-0">
            <span className="text-[#72767d] text-[12px]">🔒 Chế độ chỉ đọc — Không thể gửi tin nhắn</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
