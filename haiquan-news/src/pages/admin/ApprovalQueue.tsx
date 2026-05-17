import {  useState, useEffect  } from 'react';
import AdminLayout from './AdminLayout';
import {  getApprovalRequests, reviewApprovalRequest, getSession  } from '@/lib/auth';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  publish_post: { label: 'Duyệt bài viết', color: 'bg-yellow-100 text-yellow-700' },
  delete_post: { label: 'Xóa bài viết', color: 'bg-red-100 text-red-700' },
  delete_account: { label: 'Xóa tài khoản', color: 'bg-orange-100 text-orange-700' },
};

export default function ApprovalQueue() {
  const session = getSession();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');

  const load = async () => {
    setLoading(true);
    const data = await getApprovalRequests(tab === 'pending' ? 'pending' : undefined);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const handleReview = async (id: number, approved: boolean) => {
    await reviewApprovalRequest(id, approved, session!);
    load();
  };

  return (
    <AdminLayout title="Hàng chờ duyệt">
      <div className="mb-6">
        <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase">Hàng chờ duyệt</h2>
        <p className="text-[#555555] text-[13px] mt-1">Các yêu cầu cần được HADMIN hoặc ADMIN phê duyệt</p>
      </div>

      <div className="flex gap-2 mb-5">
        {(['pending', 'all'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-[13px] font-bold transition ${tab === t ? 'bg-[#0059b2] text-white' : 'bg-gray-100 text-[#555] hover:bg-gray-200'}`}>
            {t === 'pending' ? 'Đang chờ' : 'Tất cả'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-gray-100">
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Loại yêu cầu</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Nội dung</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Người yêu cầu</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Trạng thái</th>
              <th className="text-left px-5 py-3 font-bold text-[#555] uppercase text-[11px] tracking-wide">Thời gian</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="border-b border-gray-50">
                  {[...Array(6)].map((_, j) => <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>)}
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">
                {tab === 'pending' ? 'Không có yêu cầu nào đang chờ duyệt' : 'Chưa có yêu cầu nào'}
              </td></tr>
            ) : requests.map(req => {
              const typeInfo = TYPE_LABELS[req.type] || { label: req.type, color: 'bg-gray-100 text-gray-700' };
              return (
                <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="font-bold text-[#222] truncate">{req.target_info}</p>
                  </td>
                  <td className="px-5 py-4 font-bold text-[#0059b2]">@{req.requested_by_username}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {req.status === 'pending' ? 'Đang chờ' : req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#888]">{new Date(req.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-5 py-4">
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleReview(req.id, true)}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-[12px] font-bold hover:bg-green-600 transition">
                          Duyệt
                        </button>
                        <button onClick={() => handleReview(req.id, false)}
                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[12px] font-bold hover:bg-red-600 transition">
                          Từ chối
                        </button>
                      </div>
                    )}
                    {req.status !== 'pending' && req.reviewed_by_username && (
                      <span className="text-[11px] text-[#888]">bởi @{req.reviewed_by_username}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
