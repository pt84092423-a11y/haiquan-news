import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { getSiteSetting, parseJsonSetting, upsertSetting, uploadImage } from '@/lib/supabase';
import { DEFAULT_STRUCTURE_DATA, type StructureData, type StructureUnit } from '../StructurePage';

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const splitLines = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean);
const joinLines = (value?: string[]) => (value || []).join('\n');

export default function StructureManager() {
  const [structure, setStructure] = useState<StructureData>(DEFAULT_STRUCTURE_DATA);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSiteSetting('structure_page_data').then(value => setStructure(parseJsonSetting(value, DEFAULT_STRUCTURE_DATA)));
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setMessage('');
    await upsertSetting('structure_page_data', JSON.stringify(structure));
    setSaving(false);
    setMessage('Đã lưu trang Cấu trúc.');
    setTimeout(() => setMessage(''), 3000);
  };

  const uploadTo = async (file: File, onDone: (url: string) => void) => {
    const url = await uploadImage(file);
    if (url) onDone(url);
  };

  const updateUnit = (id: string, updates: Partial<StructureUnit>) => setStructure(s => ({ ...s, units: s.units.map(unit => unit.id === id ? { ...unit, ...updates } : unit) }));

  return (
    <AdminLayout title="Cấu trúc">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#0059b2] font-bold text-[12px] uppercase tracking-[0.18em]">Quản trị nội dung</p>
          <h2 className="text-[28px] font-black text-[#111827] tracking-tight">Cấu trúc tổ chức</h2>
          <p className="text-[#6b7280] text-[14px] mt-1">Chọn hiển thị bằng ảnh tổng thể hoặc sơ đồ các đơn vị có logo và thông tin chi tiết.</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="px-7 py-3 bg-[#0059b2] text-white rounded-xl font-bold shadow hover:bg-blue-700 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu cấu trúc'}</button>
      </div>
      {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-bold">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-[#0059b2] uppercase">Thiết lập trang</h3>
          <input value={structure.title} onChange={e => setStructure(s => ({ ...s, title: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" placeholder="Tiêu đề" />
          <textarea value={structure.description} onChange={e => setStructure(s => ({ ...s, description: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" rows={3} placeholder="Mô tả" />
          <div className="grid grid-cols-2 gap-3">
            <label className={`p-3 border rounded-xl cursor-pointer text-sm font-bold ${structure.displayMode !== 'image' ? 'border-[#0059b2] bg-blue-50 text-[#0059b2]' : 'border-gray-200 text-gray-500'}`}>
              <input type="radio" checked={structure.displayMode !== 'image'} onChange={() => setStructure(s => ({ ...s, displayMode: 'chart' }))} className="mr-2" />
              Sơ đồ đơn vị
            </label>
            <label className={`p-3 border rounded-xl cursor-pointer text-sm font-bold ${structure.displayMode === 'image' ? 'border-[#0059b2] bg-blue-50 text-[#0059b2]' : 'border-gray-200 text-gray-500'}`}>
              <input type="radio" checked={structure.displayMode === 'image'} onChange={() => setStructure(s => ({ ...s, displayMode: 'image' }))} className="mr-2" />
              Ảnh tổng thể
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ảnh nền trang</label>
            <input value={structure.backgroundImage || ''} onChange={e => setStructure(s => ({ ...s, backgroundImage: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-xs mb-2" placeholder="URL ảnh nền" />
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => setStructure(s => ({ ...s, backgroundImage: url })))} className="text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ảnh cấu trúc tổng thể</label>
            {structure.posterImage && <img src={structure.posterImage} alt="" className="max-h-48 rounded-lg border border-gray-100 object-contain bg-gray-50 mb-2" />}
            <input value={structure.posterImage || ''} onChange={e => setStructure(s => ({ ...s, posterImage: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-xs mb-2" placeholder="URL ảnh cấu trúc" />
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => setStructure(s => ({ ...s, posterImage: url })))} className="text-xs" />
          </div>
        </section>

        <section className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-[#0059b2] uppercase">Danh sách đơn vị</h3>
            <button onClick={() => setStructure(s => ({ ...s, units: [...s.units, { id: newId(), name: 'Đơn vị mới', parentId: s.units[0]?.id, slogan: '', history: '', galleryImages: [] }] }))} className="px-4 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-sm font-bold">+ Thêm đơn vị</button>
          </div>
          <div className="space-y-4 max-h-[760px] overflow-y-auto pr-1">
            {structure.units.map(unit => (
              <div key={unit.id} className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-[#fbfdff]">
                <div className="grid md:grid-cols-2 gap-3">
                  <input value={unit.name} onChange={e => updateUnit(unit.id, { name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Tên đơn vị" />
                  <input value={unit.parentId || ''} onChange={e => updateUnit(unit.id, { parentId: e.target.value || undefined })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="ID đơn vị cấp trên (để trống nếu là cấp gốc)" />
                </div>
                <textarea value={unit.description || ''} onChange={e => updateUnit(unit.id, { description: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Mô tả ngắn" />
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Logo đơn vị</label>
                    <input value={unit.logo || unit.image || ''} onChange={e => updateUnit(unit.id, { logo: e.target.value, image: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-xs mb-2" placeholder="URL logo" />
                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updateUnit(unit.id, { logo: url, image: url }))} className="text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Khẩu hiệu</label>
                    <input value={unit.slogan || ''} onChange={e => updateUnit(unit.id, { slogan: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Khẩu hiệu đơn vị" />
                  </div>
                </div>
                <label className="block text-xs font-bold text-gray-500">Lịch sử</label>
                <textarea value={unit.history || ''} onChange={e => updateUnit(unit.id, { history: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" rows={4} placeholder="Lịch sử hình thành, thành tích, nhiệm vụ..." />
                <label className="block text-xs font-bold text-gray-500">Hình ảnh hoạt động (5-10 ảnh, mỗi dòng 1 URL)</label>
                <textarea value={joinLines(unit.galleryImages)} onChange={e => updateUnit(unit.id, { galleryImages: splitLines(e.target.value).slice(0, 10) })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" rows={4} placeholder="https://..." />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center px-3 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-[12px] font-bold cursor-pointer hover:bg-blue-100">
                    + Thêm ảnh hoạt động
                    <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updateUnit(unit.id, { galleryImages: [...(unit.galleryImages || []), url].slice(0, 10) }))} className="hidden" />
                  </label>
                  <button onClick={() => setStructure(s => ({ ...s, units: s.units.filter(item => item.id !== unit.id) }))} className="text-red-500 font-bold text-sm">Xóa đơn vị</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
