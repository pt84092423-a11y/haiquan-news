import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getSiteSetting, upsertSetting, parseJsonSetting } from '@/lib/supabase';

interface YTChannel {
  id: string;
  channelId: string;
  handle: string;
  label: string;
}

interface YoutubeConfig {
  media: YTChannel[];
  tv: YTChannel[];
}

const DEFAULT_CONFIG: YoutubeConfig = {
  media: [
    { id: '1', channelId: 'UCyV_AKZjCqd1bkUbEHGcTyA', handle: 'TGM_Kuroma', label: 'TGM Kuroma' },
    { id: '2', channelId: 'UC4MXnZXKnKu9Cg6mNts1aPQ', handle: 'srov24h', label: 'SROV 24h' },
  ],
  tv: [
    { id: '3', channelId: 'UC7W8ubM1PB8DzLMP7JSrHyg', handle: 'srov4', label: 'SROV TV' },
  ],
};

const YT_ICON = (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

function AddChannelRow({ onAdd }: { onAdd: (ch: Omit<YTChannel, 'id'>) => void }) {
  const [form, setForm] = useState({ channelId: '', handle: '', label: '' });
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  const resolveHandle = async () => {
    if (!form.handle) return;
    setResolving(true);
    setError('');
    try {
      const r = await fetch(`/api/youtube/resolve?handle=${encodeURIComponent(form.handle)}`);
      const d = await r.json();
      if (d.channelId) {
        setForm(f => ({ ...f, channelId: d.channelId }));
      } else {
        setError('Không tìm thấy Channel ID. Hãy nhập thủ công.');
      }
    } catch {
      setError('Lỗi kết nối. Hãy nhập Channel ID thủ công.');
    }
    setResolving(false);
  };

  const handleAdd = () => {
    if (!form.channelId || !form.handle || !form.label) return;
    onAdd({ channelId: form.channelId.trim(), handle: form.handle.trim().replace('@', ''), label: form.label.trim() });
    setForm({ channelId: '', handle: '', label: '' });
    setError('');
  };

  return (
    <div className="border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Thêm kênh mới</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tên hiển thị *</label>
          <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 bg-white"
            placeholder="VD: SROV 24h" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Handle YouTube *</label>
          <div className="flex gap-2">
            <input value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))}
              className="flex-1 p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 bg-white"
              placeholder="@srov24h" />
            <button onClick={resolveHandle} disabled={resolving || !form.handle}
              className="px-3 py-2 bg-red-500 text-white rounded-lg text-[11px] font-bold hover:bg-red-600 transition disabled:opacity-40 whitespace-nowrap">
              {resolving ? '...' : 'Lấy ID'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Channel ID *</label>
          <input value={form.channelId} onChange={e => setForm(f => ({ ...f, channelId: e.target.value }))}
            className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 bg-white font-mono"
            placeholder="UCxxxxxxxxxxxxxxxxxxxxxx" />
        </div>
      </div>
      {error && <p className="text-[12px] text-red-500">{error}</p>}
      <button onClick={handleAdd} disabled={!form.channelId || !form.handle || !form.label}
        className="px-5 py-2 bg-red-600 text-white rounded-lg text-[13px] font-bold hover:bg-red-700 transition disabled:opacity-40">
        + Thêm kênh
      </button>
    </div>
  );
}

function ChannelList({
  channels, onDelete, onMoveUp, onMoveDown,
}: {
  channels: YTChannel[];
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}) {
  if (channels.length === 0) {
    return <p className="text-[13px] text-gray-400 text-center py-6">Chưa có kênh nào.</p>;
  }
  return (
    <div className="space-y-2">
      {channels.map((ch, i) => (
        <div key={ch.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white">
          <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 text-white">
            {YT_ICON}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#222]">{ch.label}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-gray-400">@{ch.handle}</span>
              <span className="text-[10px] text-gray-300 font-mono truncate">{ch.channelId}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onMoveUp(ch.id)} disabled={i === 0}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
            <button onClick={() => onMoveDown(ch.id)} disabled={i === channels.length - 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button onClick={() => onDelete(ch.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition ml-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <a href={`https://www.youtube.com/@${ch.handle}`} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-[11px] font-bold hover:bg-red-50 transition flex items-center gap-1">
            {YT_ICON} Xem
          </a>
        </div>
      ))}
    </div>
  );
}

export default function YoutubeManager() {
  const [config, setConfig] = useState<YoutubeConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteSetting('youtube_home_config').then(v => {
      const parsed = parseJsonSetting<YoutubeConfig>(v, DEFAULT_CONFIG);
      setConfig({
        media: parsed.media?.length ? parsed.media : DEFAULT_CONFIG.media,
        tv: parsed.tv?.length ? parsed.tv : DEFAULT_CONFIG.tv,
      });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await upsertSetting('youtube_home_config', JSON.stringify(config));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addChannel = (section: 'media' | 'tv') => (ch: Omit<YTChannel, 'id'>) => {
    setConfig(c => ({ ...c, [section]: [...c[section], { ...ch, id: Date.now().toString() }] }));
  };

  const deleteChannel = (section: 'media' | 'tv') => (id: string) => {
    setConfig(c => ({ ...c, [section]: c[section].filter(ch => ch.id !== id) }));
  };

  const moveChannel = (section: 'media' | 'tv', dir: -1 | 1) => (id: string) => {
    setConfig(c => {
      const arr = [...c[section]];
      const idx = arr.findIndex(ch => ch.id === id);
      if (idx < 0) return c;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return c;
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...c, [section]: arr };
    });
  };

  const sections = [
    {
      key: 'media' as const,
      title: 'Kênh Short Video / Media',
      desc: 'Các kênh xuất hiện trong mục "SHORT VIDEO" trên trang chủ.',
      color: '#0059b2',
    },
    {
      key: 'tv' as const,
      title: 'Kênh Truyền Hình Hải Quân',
      desc: 'Kênh xuất hiện trong mục "TRUYỀN HÌNH HẢI QUÂN" — hiển thị video đầu tiên làm video nổi bật.',
      color: '#dc2626',
    },
  ];

  return (
    <AdminLayout title="Quản lý kênh YouTube">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-['Playfair_Display',serif] font-black text-[#222] uppercase tracking-wide flex items-center gap-3">
            <span className="text-red-600">{YT_ICON}</span>Quản lý kênh YouTube
          </h2>
          <p className="text-[#555] text-[13px] mt-1">
            Cấu hình danh sách kênh YouTube hiển thị trên trang chủ. Thay đổi lưu vào database — không cần sửa code.
          </p>
        </div>
        <button onClick={save} disabled={saving || loading}
          className="px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold text-[13px] hover:bg-red-700 transition disabled:opacity-40 flex items-center gap-2">
          {saving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang lưu...</>
          ) : saved ? '✓ Đã lưu!' : 'Lưu cấu hình'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          Đang tải...
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map(sec => (
            <div key={sec.key} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100" style={{ borderLeftColor: sec.color, borderLeftWidth: 4 }}>
                <p className="text-[14px] font-bold text-[#222] flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sec.color }} />
                  {sec.title}
                  <span className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: sec.color }}>
                    {config[sec.key].length} kênh
                  </span>
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">{sec.desc}</p>
              </div>
              <div className="p-5 space-y-4">
                <ChannelList
                  channels={config[sec.key]}
                  onDelete={deleteChannel(sec.key)}
                  onMoveUp={moveChannel(sec.key, -1)}
                  onMoveDown={moveChannel(sec.key, 1)}
                />
                <AddChannelRow onAdd={addChannel(sec.key)} />
              </div>
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-[13px] font-bold text-blue-800 mb-2">Hướng dẫn lấy Channel ID</p>
            <ol className="text-[12px] text-blue-700 space-y-1 list-decimal list-inside">
              <li>Nhập handle kênh (VD: <code className="bg-blue-100 px-1 rounded">@srov24h</code>) rồi nhấn <strong>"Lấy ID"</strong> — hệ thống tự tra Channel ID.</li>
              <li>Nếu không tự lấy được: vào trang YouTube của kênh → xem source (Ctrl+U) → tìm <code className="bg-blue-100 px-1 rounded">"externalId"</code>.</li>
              <li>Channel ID luôn bắt đầu bằng <code className="bg-blue-100 px-1 rounded">UC</code> và có 24 ký tự.</li>
              <li>Sau khi thêm kênh, nhấn <strong>"Lưu cấu hình"</strong> để áp dụng cho trang chủ.</li>
            </ol>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
