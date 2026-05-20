import { useState, useEffect, useMemo } from 'react';
import AdminLayout from './AdminLayout';

interface Stats {
  total: number;
  countries: { name: string; count: number }[];
  regions: { name: string; count: number }[];
  cities: { name: string; count: number }[];
  districts: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  os: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  topPages: { name: string; count: number }[];
  languages?: { name: string; count: number }[];
  daily: { date: string; count: number }[];
  error?: string;
}

type MainTab = 'overview' | 'manage';
type ManageTab = 'countries' | 'provinces' | 'districts' | 'devices' | 'os' | 'browsers' | 'pages';

const DEVICE_COLORS: Record<string, string> = {
  mobile: '#0059b2', desktop: '#2E7D32', tablet: '#E65100',
};
const OS_COLORS: Record<string, string> = {
  Android: '#3ddc84', iOS: '#555', Windows: '#0078d4',
  macOS: '#888', Linux: '#f90', ChromeOS: '#ea4335', Khác: '#aaa',
};

function BarChart({ data, color = '#0059b2', max }: { data: { name: string; count: number }[]; color?: string; max?: number }) {
  const top = max || (data[0]?.count || 1);
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-28 text-[11px] text-gray-600 truncate text-right flex-shrink-0">{d.name}</div>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.max(2, (d.count / top) * 100)}%`, backgroundColor: color }} />
          </div>
          <div className="w-9 text-[11px] font-bold text-gray-700 text-right flex-shrink-0">{d.count.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function Sparkline({ daily }: { daily: { date: string; count: number }[] }) {
  if (!daily.length) return null;
  const max = Math.max(...daily.map(d => d.count), 1);
  const w = 300, h = 50;
  const pts = daily.map((d, i) => {
    const x = (i / Math.max(daily.length - 1, 1)) * w;
    const y = h - (d.count / max) * (h - 4);
    return `${x},${y}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke="#0059b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill="#0059b2" opacity="0.08" />
    </svg>
  );
}

function DataTable({ data, loading, emptyMsg = 'Chưa có dữ liệu', colorFn }: {
  data: { name: string; count: number }[];
  loading: boolean;
  emptyMsg?: string;
  colorFn?: (name: string, i: number) => string;
}) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const PAGE_SIZE = 15;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const rows = q ? data.filter(d => d.name.toLowerCase().includes(q)) : data;
    return [...rows].sort((a, b) => sortDir === 'desc' ? b.count - a.count : a.count - b.count);
  }, [data, search, sortDir]);

  const total = filtered.reduce((s, d) => s + d.count, 0) || 1;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const exportCSV = () => {
    const csv = 'Tên,Lượt truy cập\n' + filtered.map(d => `"${d.name}",${d.count}`).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent('\uFEFF' + csv);
    a.download = 'analytics.csv'; a.click();
  };

  if (loading) return <div className="h-48 bg-gray-50 rounded-xl animate-pulse" />;
  if (!data.length) return <p className="text-gray-400 text-[13px] py-6 text-center">{emptyMsg}</p>;

  const defaultColors = ['#0059b2', '#2E7D32', '#E65100', '#6A1B9A', '#c0392b', '#f39c12', '#1565C0', '#00838f'];

  return (
    <div>
      {/* Search + Sort + Export */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
          />
        </div>
        <button
          onClick={() => setSortDir(s => s === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-1.5 text-[11px] font-bold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition flex items-center gap-1"
        >
          {sortDir === 'desc' ? '↓ Cao nhất' : '↑ Thấp nhất'}
        </button>
        <button onClick={exportCSV} className="px-3 py-1.5 text-[11px] font-bold bg-[#0059b2] text-white rounded-lg hover:bg-[#003f8a] transition">
          ⬇ CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-3 py-2 text-left font-bold text-gray-500 w-8">#</th>
              <th className="px-3 py-2 text-left font-bold text-gray-500">Tên</th>
              <th className="px-3 py-2 text-right font-bold text-gray-500 w-20">Lượt</th>
              <th className="px-3 py-2 text-right font-bold text-gray-500 w-16">%</th>
              <th className="px-3 py-2 w-28">Tỉ lệ</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((d, i) => {
              const idx = (page - 1) * PAGE_SIZE + i;
              const color = colorFn ? colorFn(d.name, idx) : defaultColors[idx % defaultColors.length];
              const pct = Math.round((d.count / total) * 100);
              return (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                  <td className="px-3 py-2 text-gray-400 text-center">{idx + 1}</td>
                  <td className="px-3 py-2 font-medium text-gray-800 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="truncate max-w-[200px]">{d.name || '(không xác định)'}</span>
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-gray-700">{d.count.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{pct}%</td>
                  <td className="px-3 py-2">
                    <div className="h-2 bg-gray-100 rounded overflow-hidden">
                      <div className="h-full rounded transition-all" style={{ width: `${Math.max(2, pct)}%`, backgroundColor: color }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-gray-400">{filtered.length} kết quả</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-2 py-1 text-[11px] border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50 transition">‹</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const p = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-2 py-1 text-[11px] border rounded transition ${p === page ? 'bg-[#0059b2] text-white border-[#0059b2]' : 'border-gray-200 hover:bg-gray-50'}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="px-2 py-1 text-[11px] border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50 transition">›</button>
          </div>
        </div>
      )}
    </div>
  );
}

const MANAGE_TABS: { key: ManageTab; label: string; icon: string }[] = [
  { key: 'countries', label: 'Quốc gia', icon: '🌏' },
  { key: 'provinces', label: 'Tỉnh / Thành', icon: '🗺' },
  { key: 'districts', label: 'Quận / Xã', icon: '📍' },
  { key: 'devices', label: 'Thiết bị', icon: '📱' },
  { key: 'os', label: 'Hệ điều hành', icon: '💻' },
  { key: 'browsers', label: 'Trình duyệt', icon: '🌐' },
  { key: 'pages', label: 'Trang xem', icon: '📄' },
];

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [manageTab, setManageTab] = useState<ManageTab>('countries');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics-stats?days=${days}`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  const total = stats?.total || 0;
  const totalMobile = stats?.devices.find(d => d.name === 'mobile')?.count || 0;
  const totalDesktop = stats?.devices.find(d => d.name === 'desktop')?.count || 0;
  const totalTablet = stats?.devices.find(d => d.name === 'tablet')?.count || 0;
  const mobilePct = total ? Math.round((totalMobile / total) * 100) : 0;

  const getManageData = (): { name: string; count: number }[] => {
    if (!stats) return [];
    switch (manageTab) {
      case 'countries': return stats.countries;
      case 'provinces': return stats.regions;
      case 'districts': return [...(stats.cities || []), ...(stats.districts || [])].sort((a, b) => b.count - a.count);
      case 'devices': return stats.devices;
      case 'os': return stats.os;
      case 'browsers': return stats.browsers;
      case 'pages': return stats.topPages;
      default: return [];
    }
  };

  const colorFn = (name: string, i: number): string => {
    const PALETTE = ['#0059b2', '#2E7D32', '#E65100', '#6A1B9A', '#c0392b', '#f39c12', '#1565C0', '#00838f', '#d81b60', '#558b2f'];
    if (manageTab === 'devices') return DEVICE_COLORS[name] || PALETTE[i % PALETTE.length];
    if (manageTab === 'os') return OS_COLORS[name] || PALETTE[i % PALETTE.length];
    return PALETTE[i % PALETTE.length];
  };

  return (
    <AdminLayout title="Phân tích truy cập">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#0059b2] font-bold text-[12px] uppercase tracking-[0.18em]">Thống kê</p>
          <h2 className="text-[28px] font-black text-[#111827] tracking-tight">Phân tích truy cập</h2>
          <p className="text-[#6b7280] text-[14px] mt-1">Theo dõi độc giả theo quốc gia, tỉnh thành, thiết bị, hệ điều hành</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[7, 30, 90, 365].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition ${days === d ? 'bg-[#0059b2] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {d === 365 ? '1 năm' : `${d} ngày`}
            </button>
          ))}
        </div>
      </div>

      {stats?.error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-[13px] text-yellow-800">
          <strong>Lưu ý:</strong> Bảng <code>visitor_logs</code> chưa được tạo. Vào <strong>Database Setup</strong> để tạo bảng trước khi sử dụng.
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng lượt xem', value: total.toLocaleString(), icon: '👁', color: '#0059b2' },
          { label: 'Quốc gia', value: (stats?.countries.length || 0).toString(), icon: '🌏', color: '#2E7D32' },
          { label: 'Di động', value: `${mobilePct}%`, icon: '📱', color: '#E65100' },
          { label: 'Tỉnh/Thành', value: (stats?.regions.length || 0).toString(), icon: '🗺', color: '#6A1B9A' },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{card.label}</p>
                <p className="text-[28px] font-black mt-1" style={{ color: card.color }}>
                  {loading ? <span className="block h-7 w-16 bg-gray-100 rounded animate-pulse" /> : card.value}
                </p>
              </div>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Device breakdown mini cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Điện thoại', count: totalMobile, icon: '📱', color: '#0059b2' },
          { label: 'Máy tính', count: totalDesktop, icon: '🖥', color: '#2E7D32' },
          { label: 'Máy tính bảng', count: totalTablet, icon: '📲', color: '#E65100' },
        ].map((d, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex items-center gap-3">
            <span className="text-xl">{d.icon}</span>
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{d.label}</p>
              <p className="text-[20px] font-black" style={{ color: d.color }}>
                {loading ? '—' : d.count.toLocaleString()}
              </p>
              {!loading && total > 0 && (
                <p className="text-[10px] text-gray-400">{Math.round((d.count / total) * 100)}%</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {!loading && stats?.daily && stats.daily.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">Lượt xem theo ngày</p>
            <p className="text-[12px] text-gray-400">{days} ngày gần nhất</p>
          </div>
          <Sparkline daily={stats.daily} />
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>{stats.daily[0]?.date}</span>
            <span>{stats.daily[stats.daily.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Main tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'overview' as MainTab, label: '📊 Tổng quan' },
          { key: 'manage' as MainTab, label: '📋 Quản lý chi tiết' },
        ].map(t => (
          <button key={t.key} onClick={() => setMainTab(t.key)}
            className={`px-5 py-2 rounded-lg text-[13px] font-bold transition ${mainTab === t.key ? 'bg-white shadow text-[#0059b2]' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {mainTab === 'overview' && (
        <div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-48 animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">🌏 Quốc gia truy cập</p>
                {stats?.countries.length ? <BarChart data={stats.countries.slice(0, 10)} color="#0059b2" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">🗺 Tỉnh / Thành phố</p>
                {stats?.regions.length ? <BarChart data={stats.regions.slice(0, 10)} color="#2E7D32" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">💻 Hệ điều hành</p>
                {stats?.os.length ? <BarChart data={stats.os.slice(0, 8)} color="#555" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">🌐 Trình duyệt</p>
                {stats?.browsers.length ? <BarChart data={stats.browsers.slice(0, 8)} color="#c0392b" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MANAGE TAB */}
      {mainTab === 'manage' && (
        <div>
          {/* Sub-tabs */}
          <div className="flex gap-1 mb-5 flex-wrap">
            {MANAGE_TABS.map(t => (
              <button key={t.key} onClick={() => setManageTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition flex items-center gap-1 ${manageTab === t.key ? 'bg-[#0059b2] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[16px] font-black text-gray-800">
                  {MANAGE_TABS.find(t => t.key === manageTab)?.icon}{' '}
                  {manageTab === 'countries' && 'Quản lý quốc gia truy cập'}
                  {manageTab === 'provinces' && 'Quản lý tỉnh / thành phố truy cập'}
                  {manageTab === 'districts' && 'Quản lý quận / huyện / xã phường truy cập'}
                  {manageTab === 'devices' && 'Quản lý loại thiết bị truy cập'}
                  {manageTab === 'os' && 'Quản lý hệ điều hành truy cập'}
                  {manageTab === 'browsers' && 'Quản lý trình duyệt truy cập'}
                  {manageTab === 'pages' && 'Quản lý trang được xem nhiều nhất'}
                </p>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  {!loading && stats && `${getManageData().length} mục · Tổng ${total.toLocaleString()} lượt truy cập trong ${days} ngày`}
                </p>
              </div>
            </div>

            {/* Special device type breakdown */}
            {manageTab === 'devices' && !loading && stats && (
              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { label: 'Điện thoại', count: totalMobile, color: '#0059b2', pct: Math.round((totalMobile / total) * 100) },
                  { label: 'Máy tính', count: totalDesktop, color: '#2E7D32', pct: Math.round((totalDesktop / total) * 100) },
                  { label: 'Máy tính bảng', count: totalTablet, color: '#E65100', pct: Math.round((totalTablet / total) * 100) },
                ].map((d, i) => (
                  <div key={i} className="rounded-xl border p-3 text-center" style={{ borderColor: d.color + '33', backgroundColor: d.color + '08' }}>
                    <p className="text-[22px] font-black" style={{ color: d.color }}>{d.pct}%</p>
                    <p className="text-[11px] font-bold text-gray-600">{d.label}</p>
                    <p className="text-[10px] text-gray-400">{d.count.toLocaleString()} lượt</p>
                  </div>
                ))}
              </div>
            )}

            <DataTable
              data={getManageData()}
              loading={loading}
              emptyMsg="Chưa có dữ liệu. Cần thiết lập bảng visitor_logs."
              colorFn={colorFn}
            />
          </div>
        </div>
      )}

      {/* SQL setup info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-[12px] text-blue-800">
        <strong>Cần thiết lập:</strong> Tạo bảng <code className="bg-blue-100 px-1 rounded">visitor_logs</code> trong Supabase (vào Database Setup → chạy SQL tạo bảng). Sau đó dữ liệu sẽ được thu thập tự động từ mỗi lượt truy cập.
      </div>
    </AdminLayout>
  );
}
