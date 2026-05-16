import { useState } from 'react';
import AdminLayout from './AdminLayout';
import { SQL_SCHEMA, SQL_SCHEMA_V2 } from '@/lib/supabase';
import { ADMIN_SQL } from '@/lib/auth';

const SUPABASE_URL = 'https://gqxrptccptfbzfdmaoyl.supabase.co';

export default function DBSetup() {
  const [copied, setCopied] = useState<string | null>(null);
  const [serviceKey, setServiceKey] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAutoSetup = async () => {
    if (!serviceKey.trim()) {
      setResult({ ok: false, msg: 'Vui lòng nhập Service Role Key.' });
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey.trim(),
          'Authorization': `Bearer ${serviceKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: SQL_SCHEMA }),
      });
      if (res.ok) {
        setResult({ ok: true, msg: 'Khởi tạo database thành công! Quay lại admin và bắt đầu viết bài.' });
      } else {
        // Try with query endpoint
        const res2 = await fetch(`${SUPABASE_URL}/query`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey.trim(),
            'Authorization': `Bearer ${serviceKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: SQL_SCHEMA }),
        });
        if (res2.ok) {
          setResult({ ok: true, msg: 'Khởi tạo database thành công!' });
        } else {
          const errText = await res2.text();
          setResult({ ok: false, msg: `Không tự động được. Hãy copy SQL và chạy thủ công. (${errText.slice(0, 100)})` });
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setResult({ ok: false, msg: `Lỗi: ${msg}. Hãy copy SQL và chạy thủ công trên Supabase Dashboard.` });
    }
    setRunning(false);
  };

  return (
    <AdminLayout title="Cài đặt Database">
      <div className="mb-6">
        <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Cài Đặt Database</h2>
        <p className="text-[#555555] text-[13px] mt-1">Khởi tạo cấu trúc database Supabase để website hoạt động</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Option 1: Auto setup */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h3 className="font-bold text-[15px] text-green-800 mb-3">⚡ Khởi tạo tự động</h3>
          <p className="text-[13px] text-green-700 mb-3">
            Nhập <b>Service Role Key</b> từ Supabase Dashboard → Settings → API để chạy tự động.
          </p>
          <input
            type="password"
            value={serviceKey}
            onChange={e => setServiceKey(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            className="w-full border border-green-300 rounded-lg px-3 py-2 text-[12px] font-mono mb-3 focus:outline-none focus:border-green-500"
          />
          <button
            onClick={handleAutoSetup}
            disabled={running}
            className="w-full py-2 bg-green-600 text-white text-[13px] font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {running ? '⏳ Đang khởi tạo...' : '🚀 Khởi tạo Database'}
          </button>
          {result && (
            <div className={`mt-3 p-3 rounded-lg text-[12px] ${result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.msg}
            </div>
          )}
        </div>

        {/* Option 2: Manual */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-bold text-[15px] text-[#0059b2] mb-3">📋 Chạy thủ công</h3>
          <ol className="space-y-2 text-[13px] text-[#555555]">
            <li>1. Truy cập <a href="https://supabase.com/dashboard/project/gqxrptccptfbzfdmaoyl" target="_blank" rel="noopener noreferrer" className="text-[#0059b2] font-bold hover:underline">Supabase Dashboard</a></li>
            <li>2. Vào <b>SQL Editor</b> → <b>New Query</b></li>
            <li>3. Copy SQL bên dưới và dán vào editor</li>
            <li>4. Nhấn <b>Run</b></li>
            <li>5. Vào <b>Storage</b> → Tạo bucket <b>post-images</b> (Public)</li>
            <li>6. Quay lại và bắt đầu viết bài!</li>
          </ol>
        </div>
      </div>

      {/* Bước 1: Schema bài viết */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[14px] text-[#222222]">Bước 1 — Schema bài viết (posts, categories...)</h3>
            <p className="text-[12px] text-[#888] mt-0.5">Chạy SQL này trước để tạo cấu trúc cơ bản</p>
          </div>
          <button
            onClick={() => handleCopy('main', SQL_SCHEMA)}
            className="px-4 py-2 bg-[#0059b2] text-white text-[13px] font-bold rounded-lg hover:bg-blue-700 transition"
          >
            {copied === 'main' ? '✅ Đã copy!' : '📋 Copy SQL'}
          </button>
        </div>
        <pre className="p-5 text-[12px] text-[#222222] overflow-x-auto bg-gray-50 font-mono leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
          {SQL_SCHEMA}
        </pre>
      </div>

      {/* Bước 2: Schema admin */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[14px] text-[#222222]">Bước 2 — Schema hệ thống quản trị viên</h3>
            <p className="text-[12px] text-[#888] mt-0.5">Tạo bảng admin_users, audit_logs, approval_requests + tài khoản HADMIN mặc định</p>
          </div>
          <button
            onClick={() => handleCopy('admin', ADMIN_SQL)}
            className="px-4 py-2 bg-[#7c3aed] text-white text-[13px] font-bold rounded-lg hover:bg-purple-700 transition"
          >
            {copied === 'admin' ? '✅ Đã copy!' : '📋 Copy SQL'}
          </button>
        </div>
        <pre className="p-5 text-[12px] text-[#222222] overflow-x-auto bg-gray-50 font-mono leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
          {ADMIN_SQL}
        </pre>
      </div>

      {/* Bước 3: Migration V2 — author, comments, avatar */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden mb-6">
        <div className="p-4 border-b border-orange-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-[14px] text-orange-700">Bước 3 — Migration V2 (Bình luận, Avatar, Tác giả)</h3>
            <p className="text-[12px] text-[#888] mt-0.5">Chạy SQL này để kích hoạt: bình luận bạn đọc, avatar admin, liên kết tác giả bài viết</p>
          </div>
          <button
            onClick={() => handleCopy('v2', SQL_SCHEMA_V2)}
            className="px-4 py-2 bg-orange-500 text-white text-[13px] font-bold rounded-lg hover:bg-orange-600 transition"
          >
            {copied === 'v2' ? '✅ Đã copy!' : '📋 Copy SQL V2'}
          </button>
        </div>
        <pre className="p-5 text-[12px] text-[#222222] overflow-x-auto bg-orange-50 font-mono leading-relaxed max-h-[400px] overflow-y-auto whitespace-pre-wrap">
          {SQL_SCHEMA_V2}
        </pre>
      </div>

      <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
        <h3 className="font-bold text-[14px] text-yellow-800 mb-2">⚠️ Sau khi chạy SQL, tạo Storage bucket</h3>
        <p className="text-[13px] text-yellow-700 mb-2">
          Vào Supabase → <b>Storage</b> → <b>New bucket</b> → Tên: <b>post-images</b> → Bật <b>Public bucket</b>
        </p>
        <pre className="mt-2 p-3 bg-yellow-100 text-[12px] font-mono rounded text-yellow-900 overflow-x-auto">{`-- Thêm policy upload ảnh cho storage:
CREATE POLICY "Allow public upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-images');

CREATE POLICY "Allow public read" ON storage.objects  
FOR SELECT USING (bucket_id = 'post-images');`}</pre>
      </div>

    </AdminLayout>
  );
}
