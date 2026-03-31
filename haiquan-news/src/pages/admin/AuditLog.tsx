import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAuditLogs } from '@/lib/auth';

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  LOGOUT: 'bg-gray-100 text-gray-600',
  CREATE_USER: 'bg-green-100 text-green-700',
  DELETE_USER: 'bg-red-100 text-red-700',
  REQUEST_delete_post: 'bg-orange-100 text-orange-700',
  REQUEST_publish_post: 'bg-yellow-100 text-yellow-700',
  APPROVE_REQUEST: 'bg-green-100 text-green-700',
  REJECT_REQUEST: 'bg-red-100 text-red-700',
};

const ROLE_BADGE: Record<string, string> = {
  HADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-blue-100 text-blue-700',
  EDITOR: 'bg-green-100 text-green-700',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getAuditLogs(200).then(data => { setLogs(data); setLoading(false); });
  }, []);

  const filtered = logs.filter(l =>
    !filter || l.action.includes(filter.toUpperCase()) || l.actor_username?.includes(filter) || l.detail?.includes(filter)
  );

  return (
    <AdminLayout title="Audit Log">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase">Nhật ký hệ thống</h2>
          <p className="text-[#555555] text-[13px] mt-1">Ghi lại mọi hoạt động của người dùng trong hệ thống</p>
        </div>
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Tìm kiếm..."
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#0059b2] w-64" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-gray-100">
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Thời gian</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Người dùng</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Vai trò</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Hành động</th>
              <th className="text-left px-4 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Chưa có nhật ký nào</td></tr>
            ) : filtered.map(log => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-[#888] whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </td>
                <td className="px-4 py-3 font-bold text-[#222]">{log.actor_username || '—'}</td>
                <td className="px-4 py-3">
                  {log.actor_role && (
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ROLE_BADGE[log.actor_role] || ''}`}>
                      {log.actor_role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#555] max-w-xs truncate">{log.detail || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
