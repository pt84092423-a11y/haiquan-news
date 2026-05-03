import { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { getAllCategories, createCategory, generateSlug, type Category } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parent_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    getAllCategories().then(cats => { setCategories(cats); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) { setError('Vui lòng nhập tên chuyên mục'); return; }
    setSaving(true);
    try {
      const payload: any = {
        name: form.name.trim(),
        slug: (form.slug || generateSlug(form.name)).trim(),
        description: form.description.trim() || null,
      };
      if (form.parent_id) payload.parent_id = Number(form.parent_id);
      console.log('[CategoryManager] creating:', payload);
      await createCategory(payload);
      setForm({ name: '', slug: '', description: '', parent_id: '' });
      setSuccess('Đã tạo chuyên mục thành công!');
      load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      console.error('[CategoryManager] create error:', e);
      const msg = e?.message || e?.error_description || JSON.stringify(e);
      setError('Lỗi: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa chuyên mục này?')) return;
    await supabase.from('categories').delete().eq('id', id);
    load();
  };

  return (
    <AdminLayout title="Chuyên mục">
      <div className="mb-6">
        <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Quản Lý Chuyên Mục</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[15px] text-[#222222] mb-4">Thêm chuyên mục mới</h3>
            {error && <div className="mb-3 p-2 bg-red-50 text-red-600 text-[13px] rounded">{error}</div>}
            {success && <div className="mb-3 p-2 bg-green-50 text-green-600 text-[13px] rounded">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-[#555555] mb-1">Tên chuyên mục *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                  placeholder="VD: Tin tức"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#555555] mb-1">Slug</label>
                <input
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] font-mono"
                  placeholder="tin-tuc"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#555555] mb-1">Mô tả</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#0059b2]"
                  rows={2}
                  placeholder="Mô tả ngắn về chuyên mục..."
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#555555] mb-1">Chuyên mục cha</label>
                <select
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                  className="w-full p-2.5 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2]"
                >
                  <option value="">-- Không có --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 bg-[#0059b2] text-white font-bold text-[14px] rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? 'Đang lưu...' : '+ Thêm chuyên mục'}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-bold text-[15px] text-[#222222]">Danh sách chuyên mục</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                [...Array(6)].map((_, i) => <div key={i} className="p-4 h-12 animate-pulse bg-gray-50" />)
              ) : categories.map(cat => (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-bold text-[14px] text-[#222222]">{cat.name}</p>
                    <p className="text-[11px] text-gray-400 font-mono">/{cat.slug}</p>
                    {cat.description && <p className="text-[12px] text-[#555555] mt-0.5">{cat.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-600 transition text-[12px]">Xóa</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
