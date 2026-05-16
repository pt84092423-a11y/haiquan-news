import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import React, { getSiteSetting, parseJsonSetting, upsertSetting } from '@/lib/supabase';
import React, { DEFAULT_NAV_ITEMS, type NavItem } from '@/components/SiteHeader';

export default function NavManager() {
  const [items, setItems] = useState<NavItem[]>(DEFAULT_NAV_ITEMS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSiteSetting('site_nav_items').then(value => {
      const parsed = parseJsonSetting<NavItem[]>(value, DEFAULT_NAV_ITEMS);
      if (Array.isArray(parsed) && parsed.length > 0) setItems(parsed);
    });
  }, []);

  const move = (index: number, direction: -1 | 1) => {
    const next = [...items];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const updateItem = (index: number, updates: Partial<NavItem>) => {
    setItems(items.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const addItem = () => {
    setItems([...items, { href: '/chuyen-muc-moi', label: 'Chuyên mục mới' }]);
  };

  const resetDefaults = () => {
    if (!confirm('Khôi phục thanh điều hướng về mặc định?')) return;
    setItems(DEFAULT_NAV_ITEMS);
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    await upsertSetting('site_nav_items', JSON.stringify(items));
    setSaving(false);
    setMessage('Đã lưu thanh điều hướng. Hãy tải lại trang công khai để thấy thay đổi.');
    setTimeout(() => setMessage(''), 4000);
  };

  return (
    <AdminLayout title="Thanh điều hướng">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#0059b2] font-bold text-[12px] uppercase tracking-[0.18em]">Quản trị giao diện</p>
          <h2 className="text-[28px] font-black text-[#111827] tracking-tight">Thanh điều hướng (Taskbar)</h2>
          <p className="text-[#6b7280] text-[14px] mt-1">Thêm hoặc xoá các chuyên mục hiển thị trên thanh menu chính của website.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetDefaults} className="px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">Mặc định</button>
          <button onClick={save} disabled={saving} className="px-7 py-3 bg-[#0059b2] text-white rounded-xl font-bold shadow hover:bg-blue-700 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thanh điều hướng'}</button>
        </div>
      </div>

      {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-bold">{message}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-[60px_1fr_1fr_120px_60px] gap-3 px-3 pb-2 text-[11px] font-bold uppercase text-gray-500 border-b border-gray-100">
          <div>Thứ tự</div>
          <div>Tên hiển thị</div>
          <div>Đường dẫn</div>
          <div className="text-center">Biểu tượng nhà</div>
          <div className="text-right">Xoá</div>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[60px_1fr_1fr_120px_60px] gap-3 px-3 py-3 items-center">
              <div className="flex items-center gap-1">
                <button onClick={() => move(index, -1)} disabled={index === 0} className="text-[#0059b2] disabled:opacity-30 px-1">▲</button>
                <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="text-[#0059b2] disabled:opacity-30 px-1">▼</button>
              </div>
              <input value={item.label} onChange={e => updateItem(index, { label: e.target.value })} placeholder={item.icon ? '(biểu tượng nhà)' : 'Tên hiển thị'} className="w-full p-2 border border-gray-200 rounded text-sm" />
              <input value={item.href} onChange={e => updateItem(index, { href: e.target.value })} placeholder="/chuyen-muc" className="w-full p-2 border border-gray-200 rounded text-sm font-mono" />
              <label className="flex items-center justify-center gap-2 text-[12px] font-bold text-[#0059b2]">
                <input type="checkbox" checked={!!item.icon} onChange={e => updateItem(index, { icon: e.target.checked })} /> Trang chủ
              </label>
              <div className="text-right">
                <button onClick={() => removeItem(index)} className="text-red-500 font-bold hover:underline text-sm">Xoá</button>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addItem} className="mt-4 px-4 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-sm font-bold hover:bg-blue-100">+ Thêm chuyên mục</button>
      </div>

      <div className="mt-5 bg-[#f8fbff] border border-blue-100 rounded-2xl p-5 text-[13px] text-[#0059b2] space-y-1">
        <p className="font-bold uppercase text-xs tracking-widest">Mẹo</p>
        <p>• Đường dẫn dạng <code className="font-mono">/slug-chuyen-muc</code> sẽ tự dẫn tới trang danh mục tương ứng.</p>
        <p>• Bật ô “Trang chủ” cho mục bạn muốn hiển thị bằng biểu tượng ngôi nhà thay cho chữ.</p>
      </div>
    </AdminLayout>
  );
}
