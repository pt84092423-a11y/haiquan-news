import { useState, useEffect } from 'react';
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
  daily: { date: string; count: number }[];
  error?: string;
}

const DEVICE_COLORS: Record<string, string> = {
  mobile: '#0059b2',
  desktop: '#2E7D32',
  tablet: '#E65100',
};

const OS_COLORS: Record<string, string> = {
  Android: '#3ddc84',
  iOS: '#555',
  Windows: '#0078d4',
  macOS: '#888',
  Linux: '#f90',
  ChromeOS: '#ea4335',
  Khác: '#aaa',
};

function BarChart({ data, color = '#0059b2', max }: { data: { name: string; count: number }[]; color?: string; max?: number }) {
  const top = max || (data[0]?.count || 1);
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-28 text-[11px] text-gray-600 truncate text-right flex-shrink-0">{d.name}</div>
          <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{ width: `${Math.max(2, (d.count / top) * 100)}%`, backgroundColor: color }}
            />
          </div>
          <div className="w-9 text-[11px] font-bold text-gray-700 text-right flex-shrink-0">{d.count.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

function PieChart({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {data.map((d, i) => {
        const colors = ['#0059b2', '#2E7D32', '#E65100', '#6A1B9A', '#c0392b', '#f39c12'];
        const color = DEVICE_COLORS[d.name] || OS_COLORS[d.name] || colors[i % colors.length];
        const pct = Math.round((d.count / total) * 100);
        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[11px] text-gray-700">{d.name}</span>
            <span className="text-[11px] font-bold text-gray-500">{pct}%</span>
          </div>
        );
      })}
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
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="#0059b2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${h} ${pts.join(' ')} ${w},${h}`}
        fill="#0059b2"
        opacity="0.08"
      />
    </svg>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'geo' | 'device' | 'pages'>('geo');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics-stats?days=${days}`)
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [days]);

  const totalMobile = stats?.devices.find(d => d.name === 'mobile')?.count || 0;
  const totalDesktop = stats?.devices.find(d => d.name === 'desktop')?.count || 0;
  const totalTablet = stats?.devices.find(d => d.name === 'tablet')?.count || 0;
  const total = stats?.total || 0;
  const mobilePct = total ? Math.round((totalMobile / total) * 100) : 0;

  return (
    <AdminLayout title="Phân tích truy cập">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#0059b2] font-bold text-[12px] uppercase tracking-[0.18em]">Thống kê</p>
          <h2 className="text-[28px] font-black text-[#111827] tracking-tight">Phân tích truy cập</h2>
          <p className="text-[#6b7280] text-[14px] mt-1">Theo dõi độc giả theo quốc gia, tỉnh thành, thiết bị, hệ điều hành</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90, 365].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition ${days === d ? 'bg-[#0059b2] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {d === 365 ? '1 năm' : `${d} ngày`}
            </button>
          ))}
        </div>
      </div>

      {stats?.error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-[13px] text-yellow-800">
          <strong>Lưu ý:</strong> Bảng <code>visitor_logs</code> chưa được tạo. Vào <strong>Database Setup</strong> để tạo bảng trước khi sử dụng tính năng này.
        </div>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Tổng lượt xem', value: loading ? '—' : total.toLocaleString(), icon: '👁', color: '#0059b2' },
          { label: 'Quốc gia', value: loading ? '—' : (stats?.countries.length || 0).toString(), icon: '🌏', color: '#2E7D32' },
          { label: 'Di động', value: loading ? '—' : `${mobilePct}%`, icon: '📱', color: '#E65100' },
          { label: 'Tỉnh/Thành', value: loading ? '—' : (stats?.regions.length || 0).toString(), icon: '🗺', color: '#6A1B9A' },
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

      {/* Tab navigation */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'geo', label: '🌍 Địa lý' },
          { key: 'device', label: '📱 Thiết bị & OS' },
          { key: 'pages', label: '📄 Trang xem nhiều' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition ${tab === t.key ? 'bg-white shadow text-[#0059b2]' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-64 animate-pulse" />
          ))}
        </div>
      ) : tab === 'geo' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Quốc gia truy cập</p>
            {stats?.countries.length ? <BarChart data={stats.countries.slice(0, 12)} color="#0059b2" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Tỉnh / Thành phố</p>
            {stats?.regions.length ? <BarChart data={stats.regions.slice(0, 12)} color="#2E7D32" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Thành phố / Quận</p>
            {stats?.cities.length ? <BarChart data={stats.cities.slice(0, 12)} color="#6A1B9A" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Quận / Huyện / Xã Phường</p>
            {stats?.districts.length ? <BarChart data={stats.districts.slice(0, 12)} color="#E65100" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu (cần IP chi tiết)</p>}
          </div>
        </div>
      ) : tab === 'device' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-3">Loại thiết bị</p>
            <div className="space-y-3">
              {[
                { key: 'mobile', label: 'Điện thoại', count: totalMobile, color: '#0059b2' },
                { key: 'desktop', label: 'Máy tính', count: totalDesktop, color: '#2E7D32' },
                { key: 'tablet', label: 'Máy tính bảng', count: totalTablet, color: '#E65100' },
              ].map(d => (
                <div key={d.key} className="flex items-center gap-3">
                  <div className="w-20 text-[12px] text-gray-600 text-right flex-shrink-0">{d.label}</div>
                  <div className="flex-1 h-7 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center pl-2 transition-all duration-500"
                      style={{ width: `${total ? Math.max(3, (d.count / total) * 100) : 0}%`, backgroundColor: d.color }}
                    >
                      {d.count > 0 && (
                        <span className="text-white text-[10px] font-bold whitespace-nowrap">
                          {Math.round((d.count / total) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-14 text-[12px] font-bold text-gray-700 text-right">{d.count.toLocaleString()}</div>
                </div>
              ))}
            </div>
            <PieChart data={stats?.devices || []} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Hệ điều hành</p>
            {stats?.os.length ? <BarChart data={stats.os} color="#555" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
            <PieChart data={stats?.os || []} />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Trình duyệt</p>
            {stats?.browsers.length ? <BarChart data={stats.browsers} color="#c0392b" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Ngôn ngữ trình duyệt</p>
            {stats?.languages?.length ? <BarChart data={(stats as any).languages} color="#1565C0" /> : <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">Trang được xem nhiều nhất</p>
          {stats?.topPages.length ? (
            <div className="space-y-2">
              {stats.topPages.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-[#0059b2] text-white text-[9px] font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-gray-700 font-medium truncate">{p.name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-20 h-2 bg-gray-100 rounded overflow-hidden">
                      <div className="h-full bg-[#0059b2] rounded" style={{ width: `${(p.count / (stats.topPages[0]?.count || 1)) * 100}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-gray-700 w-10 text-right">{p.count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-[13px]">Chưa có dữ liệu</p>
          )}
        </div>
      )}

      {/* SQL setup reminder */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-[12px] text-blue-800">
        <strong>Cần thiết lập:</strong> Tạo bảng <code className="bg-blue-100 px-1 rounded">visitor_logs</code> trong Supabase (vào Database Setup → chạy SQL tạo bảng visitor_logs). Sau đó dữ liệu sẽ tự động được thu thập từ mỗi lượt truy cập.
      </div>
    </AdminLayout>
  );
}
