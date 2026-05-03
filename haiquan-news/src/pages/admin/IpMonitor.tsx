import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAuditLogs } from '@/lib/auth';

interface IpEntry {
  id: number;
  actor_username: string;
  actor_role: string;
  created_at: string;
  detail: string;
}

interface IpInfo {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  org: string;
}

function parseIpInfo(detail: string): IpInfo | null {
  try {
    const d = JSON.parse(detail);
    if (d && d.ip) return d as IpInfo;
    return null;
  } catch { return null; }
}

const ROLE_BADGE: Record<string, string> = {
  HADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  EDITOR: 'bg-green-100 text-green-700',
};

export default function IpMonitor() {
  const [entries, setEntries] = useState<IpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAuditLogs(500).then((logs: any[]) => {
      setEntries(logs.filter(l => l.action === 'LOGIN_IP'));
      setLoading(false);
    });
  }, []);

  const filtered = entries.filter(e => {
    if (!search) return true;
    const ip = parseIpInfo(e.detail);
    return e.actor_username.toLowerCase().includes(search.toLowerCase()) ||
      (ip && (
        ip.ip.includes(search) ||
        ip.city?.toLowerCase().includes(search.toLowerCase()) ||
        ip.org?.toLowerCase().includes(search.toLowerCase())
      ));
  });

  return (
    <AdminLayout title="Theo dõi IP">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222] uppercase">Theo dõi địa chỉ IP</h2>
          <p className="text-[#555] text-[13px] mt-1">Kiểm tra IP, vị trí địa lý, nhà mạng của từng tài khoản khi đăng nhập</p>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên, IP, thành phố..."
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0059b2] w-64"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-gray-100">
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Thời gian</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Tài khoản</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Địa chỉ IP</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Thành phố / Vùng</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Nhà mạng (ISP)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-[13px]">
                  Chưa có dữ liệu IP. Sẽ tự động ghi lại sau mỗi lần đăng nhập.
                </td>
              </tr>
            ) : filtered.map(entry => {
              const ip = parseIpInfo(entry.detail);
              return (
                <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-[#888] whitespace-nowrap">
                    {new Date(entry.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#222]">{entry.actor_username}</div>
                    {entry.actor_role && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold inline-block mt-0.5 ${ROLE_BADGE[entry.actor_role] || 'bg-gray-100 text-gray-600'}`}>
                        {entry.actor_role}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <code className="bg-gray-100 text-[#0059b2] px-2 py-0.5 rounded text-[12px] font-mono">{ip?.ip || '—'}</code>
                  </td>
                  <td className="px-4 py-3 text-[#555]">
                    {ip ? [ip.city, ip.region, ip.country_name].filter(Boolean).join(', ') || '—' : '—'}
                  </td>
                  <td className="px-4 py-3 text-[#555] max-w-xs truncate">{ip?.org || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
