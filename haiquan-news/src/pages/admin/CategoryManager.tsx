import {  useState, useEffect  } from 'react';
import AdminLayout from './AdminLayout';
import {  generateSlug  } from '@/lib/supabase';

type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
};

async function fetchCategories(): Promise<Category[]> {
  const r = await fetch('/api/admin/categories');
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiCreateCategory(payload: object): Promise<Category> {
  const r = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error || JSON.stringify(d));
  return d;
}

async function apiUpdateCategory(id: number, payload: object): Promise<void> {
  const r = await fetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error || JSON.stringify(d));
}

async function apiDeleteCategory(id: number): Promise<void> {
  const r = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
  if (!r.ok) {
    const d = await r.json().catch(() => ({}));
    throw new Error(d?.error || 'Xóa thất bại');
  }
}

function CategoryRow({ cat, allCats, onSaved, onDeleted }: {
  cat: Category;
  allCats: Category[];
  onSaved: () => void;
  onDeleted: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: cat.name, slug: cat.slug, description: cat.description || '' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const parent = allCats.find(c => c.id === cat.parent_id);

  const save = async () => {
    if (!editForm.name.trim()) { setErr('Tên không được để trống'); return; }
    setSaving(true);
    setErr('');
    try {
      await apiUpdateCategory(cat.id, {
        name: editForm.name.trim(),
        slug: editForm.slug.trim() || generateSlug(editForm.name),
        description: editForm.description.trim() || null,
      });
      setEditing(false);
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm(`Xóa chuyên mục "${cat.name}"?`)) return;
    try { await apiDeleteCategory(cat.id); onDeleted(cat.id); }
    catch (e: any) { setErr(e.message); }
  };

  if (editing) {
    return (
      <div className="p-4 bg-blue-50 border-l-4 border-[#0059b2]">
        {err && <p className="text-[12px] text-red-600 mb-2">{err}</p>}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Tên *</label>
            <input
              value={editForm.name}
              onChange={e => setEditForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))}
              className="w-full p-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-500 mb-1">Slug</label>
            <input
              value={editForm.slug}
              onChange={e => setEditForm(f => ({ ...f, slug: e.target.value }))}
              className="w-full p-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] bg-white font-mono"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-[11px] font-bold text-gray-500 mb-1">Mô tả</label>
          <input
            value={editForm.description}
            onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
            className="w-full p-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0059b2] bg-white"
            placeholder="Mô tả ngắn..."
          />
        </div>
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="px-4 py-1.5 bg-[#0059b2] text-white rounded-lg text-[12px] font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : null}
            Lưu
          </button>
          <button onClick={() => { setEditing(false); setErr(''); }}
            className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[12px] font-bold hover:bg-gray-200 transition">
            Hủy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition group">
      <div className="min-w-0">
        <p className="font-bold text-[14px] text-[#222222]">{cat.name}</p>
        <p className="text-[11px] text-gray-400 font-mono">/{cat.slug}{parent ? ` (con của: ${parent.name})` : ''}</p>
        {cat.description && <p className="text-[12px] text-[#555555] mt-0.5 truncate max-w-xs">{cat.description}</p>}
        {err && <p className="text-[11px] text-red-500 mt-1">{err}</p>}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-3 opacity-0 group-hover:opacity-100 transition">
        <button onClick={() => { setEditing(true); setEditForm({ name: cat.name, slug: cat.slug, description: cat.description || '' }); }}
          className="px-2.5 py-1 text-[12px] font-bold text-[#0059b2] hover:bg-blue-50 rounded-lg transition">
          Sửa
        </button>
        <button onClick={del}
          className="px-2.5 py-1 text-[12px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
          Xóa
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', slug: '', description: '', parent_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    fetchCategories()
      .then(cats => setCategories(cats))
      .catch(e => setError('Không tải được danh sách: ' + e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim()) { setError('Vui lòng nhập tên chuyên mục'); return; }
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        slug: (form.slug || generateSlug(form.name)).trim(),
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.parent_id) payload.parent_id = Number(form.parent_id);
      await apiCreateCategory(payload);
      setForm({ name: '', slug: '', description: '', parent_id: '' });
      setSuccess('Đã tạo chuyên mục thành công!');
      load();
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError('Lỗi: ' + (e?.message || String(e)));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Chuyên mục">
      <div className="mb-6">
        <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Quản Lý Chuyên Mục</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Add form */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-[15px] text-[#222222] mb-4">Thêm chuyên mục mới</h3>
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 text-[13px] rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                {success}
              </div>
            )}
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
              <button type="submit" disabled={saving} className="w-full py-3 bg-[#0059b2] text-white font-bold text-[14px] rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Đang lưu...</>
                ) : '+ Thêm chuyên mục'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[15px] text-[#222222]">Danh sách chuyên mục ({categories.length})</h3>
              <p className="text-[11px] text-gray-400">Rê chuột vào hàng để hiện nút Sửa / Xóa</p>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                [...Array(6)].map((_, i) => <div key={i} className="p-4 h-14 animate-pulse bg-gray-50" />)
              ) : categories.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-[13px]">Chưa có chuyên mục nào.</div>
              ) : categories.map(cat => (
                <CategoryRow
                  key={cat.id}
                  cat={cat}
                  allCats={categories}
                  onSaved={load}
                  onDeleted={id => setCategories(c => c.filter(x => x.id !== id))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
