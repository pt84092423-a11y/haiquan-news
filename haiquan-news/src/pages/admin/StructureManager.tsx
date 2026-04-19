import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { getSiteSetting, parseJsonSetting, upsertSetting, uploadImage } from '@/lib/supabase';
import { DEFAULT_STRUCTURE_DATA, type StructureData, type StructureUnit } from '../StructurePage';
import { DEFAULT_COMMAND_DATA, RANKS, type CommandData, type Commander } from '../CommandPage';

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function StructureManager() {
  const [structure, setStructure] = useState<StructureData>(DEFAULT_STRUCTURE_DATA);
  const [command, setCommand] = useState<CommandData>(DEFAULT_COMMAND_DATA);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      getSiteSetting('structure_page_data'),
      getSiteSetting('command_page_data'),
    ]).then(([structureValue, commandValue]) => {
      setStructure(parseJsonSetting(structureValue, DEFAULT_STRUCTURE_DATA));
      setCommand(parseJsonSetting(commandValue, DEFAULT_COMMAND_DATA));
    });
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setMessage('');
    await Promise.all([
      upsertSetting('structure_page_data', JSON.stringify(structure)),
      upsertSetting('command_page_data', JSON.stringify(command)),
    ]);
    setSaving(false);
    setMessage('Đã lưu Cấu trúc và Chỉ huy.');
    setTimeout(() => setMessage(''), 3000);
  };

  const uploadTo = async (file: File, onDone: (url: string) => void) => {
    const url = await uploadImage(file);
    if (url) onDone(url);
  };

  const updateUnit = (id: string, updates: Partial<StructureUnit>) => setStructure(s => ({ ...s, units: s.units.map(unit => unit.id === id ? { ...unit, ...updates } : unit) }));
  const updatePerson = (id: string, updates: Partial<Commander>) => setCommand(c => ({ ...c, people: c.people.map(person => person.id === id ? { ...person, ...updates } : person) }));
  const splitLines = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean);
  const joinLines = (value?: string[]) => (value || []).join('\n');
  const parseWorkChart = (value?: { label: string; value: number }[]) => (value || []).map(item => `${item.label}|${item.value}`).join('\n');
  const saveWorkChart = (raw: string) => raw.split('\n').map(line => {
    const [label, value] = line.split('|');
    return { label: (label || '').trim(), value: Number(value || 0) };
  }).filter(item => item.label);

  return (
    <AdminLayout title="Cấu trúc & Chỉ huy">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[26px] font-['Playfair_Display',serif] font-black text-[#222222] uppercase tracking-wide">Cấu trúc & Chỉ huy</h2>
          <p className="text-[#555555] text-[13px] mt-1">Quản lý sơ đồ đơn vị, HICOM Bộ Tư lệnh và HICOM các đơn vị.</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="px-7 py-3 bg-[#0059b2] text-white rounded-xl font-bold shadow hover:bg-blue-700 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu tất cả'}</button>
      </div>
      {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-bold">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-[#0059b2] uppercase">Trang Cấu trúc</h3>
          <input value={structure.title} onChange={e => setStructure(s => ({ ...s, title: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" placeholder="Tiêu đề" />
          <textarea value={structure.description} onChange={e => setStructure(s => ({ ...s, description: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Mô tả" />
          <div className="grid grid-cols-2 gap-3">
            <label className={`p-3 border rounded-xl cursor-pointer text-sm font-bold ${structure.displayMode !== 'image' ? 'border-[#0059b2] bg-blue-50 text-[#0059b2]' : 'border-gray-200 text-gray-500'}`}>
              <input type="radio" checked={structure.displayMode !== 'image'} onChange={() => setStructure(s => ({ ...s, displayMode: 'chart' }))} className="mr-2" />
              Lựa chọn 1: Sơ đồ
            </label>
            <label className={`p-3 border rounded-xl cursor-pointer text-sm font-bold ${structure.displayMode === 'image' ? 'border-[#0059b2] bg-blue-50 text-[#0059b2]' : 'border-gray-200 text-gray-500'}`}>
              <input type="radio" checked={structure.displayMode === 'image'} onChange={() => setStructure(s => ({ ...s, displayMode: 'image' }))} className="mr-2" />
              Lựa chọn 2: Hình
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ảnh nền trang cấu trúc</label>
            <input value={structure.backgroundImage || ''} onChange={e => setStructure(s => ({ ...s, backgroundImage: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-xs mb-2" placeholder="URL ảnh nền" />
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => setStructure(s => ({ ...s, backgroundImage: url })))} className="text-xs" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Hình/poster cấu trúc (khi chọn chế độ Hình)</label>
            {structure.posterImage && <img src={structure.posterImage} alt="" className="max-h-48 rounded-lg border border-gray-100 object-contain bg-gray-50 mb-2" />}
            <input value={structure.posterImage || ''} onChange={e => setStructure(s => ({ ...s, posterImage: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-xs mb-2" placeholder="URL hình cấu trúc" />
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => setStructure(s => ({ ...s, posterImage: url })))} className="text-xs" />
          </div>
          <button onClick={() => setStructure(s => ({ ...s, units: [...s.units, { id: newId(), name: 'Đơn vị mới', parentId: s.units[0]?.id }] }))} className="px-4 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-sm font-bold">+ Thêm đơn vị</button>
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
            {structure.units.map(unit => (
              <div key={unit.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <input value={unit.name} onChange={e => updateUnit(unit.id, { name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                <textarea value={unit.description || ''} onChange={e => updateUnit(unit.id, { description: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Mô tả" />
                <input value={unit.image || ''} onChange={e => updateUnit(unit.id, { image: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="URL ảnh đơn vị" />
                <div className="flex items-center justify-between gap-2 text-xs">
                  <label>Parent ID: <input value={unit.parentId || ''} onChange={e => updateUnit(unit.id, { parentId: e.target.value || undefined })} className="p-1 border rounded" /></label>
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updateUnit(unit.id, { image: url }))} />
                  <button onClick={() => setStructure(s => ({ ...s, units: s.units.filter(item => item.id !== unit.id) }))} className="text-red-500 font-bold">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h3 className="font-bold text-[#0059b2] uppercase">Trang Chỉ huy</h3>
          <input value={command.title} onChange={e => setCommand(c => ({ ...c, title: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" placeholder="Tiêu đề" />
          <textarea value={command.description} onChange={e => setCommand(c => ({ ...c, description: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Mô tả" />
          <button onClick={() => setCommand(c => ({ ...c, people: [...c.people, { id: newId(), group: 'units', name: 'Nguyễn Văn A', rank: 'Đại tá', position: 'Tư lệnh Hải quân', unit: 'HICOM NAVY', displayOrder: c.people.length }] }))} className="px-4 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-sm font-bold">+ Thêm người</button>
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {command.people.map(person => (
              <div key={person.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <label className="block text-xs font-bold text-gray-500">Họ và tên *</label>
                <input value={person.name} onChange={e => updatePerson(person.id, { name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Nguyễn Văn A" />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Quân hàm</label>
                    <select value={person.rank} onChange={e => updatePerson(person.id, { rank: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm">{RANKS.map(rank => <option key={rank}>{rank}</option>)}</select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Thứ tự hiển thị</label>
                    <input type="number" value={person.displayOrder ?? 0} onChange={e => updatePerson(person.id, { displayOrder: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
                <label className="block text-xs font-bold text-gray-500">Chức vụ</label>
                <input value={person.position} onChange={e => updatePerson(person.id, { position: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Tư lệnh Hải quân" />
                <label className="block text-xs font-bold text-gray-500">Đơn vị</label>
                <input value={person.unit || ''} onChange={e => updatePerson(person.id, { unit: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="HICOM NAVY" />
                <label className="flex items-center gap-2 text-sm font-bold text-[#0059b2]">
                  <input type="checkbox" checked={person.group === 'navy'} onChange={e => updatePerson(person.id, { group: e.target.checked ? 'navy' : 'units' })} />
                  Là thành viên HICOM NAVY
                </label>
                <label className="block text-xs font-bold text-gray-500">Ảnh thẻ</label>
                <input value={person.photo || ''} onChange={e => updatePerson(person.id, { photo: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="URL ảnh thẻ" />
                <label className="inline-flex items-center px-3 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-[12px] font-bold cursor-pointer hover:bg-blue-100">
                  + Tải ảnh lên
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updatePerson(person.id, { photo: url }))} className="hidden" />
                </label>
                <label className="block text-xs font-bold text-gray-500">Tiểu sử ngắn</label>
                <textarea value={person.bio || ''} onChange={e => updatePerson(person.id, { bio: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Sơ lược tiểu sử..." />
                <label className="block text-xs font-bold text-gray-500">Nội dung chi tiết (HTML)</label>
                <textarea value={person.detailHtml || person.detail || ''} onChange={e => updatePerson(person.id, { detailHtml: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-mono" rows={4} placeholder="<p>Nội dung chi tiết...</p>" />
                <label className="block text-xs font-bold text-gray-500">Ảnh chi tiết (mỗi dòng 1 URL)</label>
                <textarea value={joinLines(person.detailImages)} onChange={e => updatePerson(person.id, { detailImages: splitLines(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" rows={3} placeholder="https://..." />
                <label className="inline-flex items-center px-3 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-[12px] font-bold cursor-pointer hover:bg-blue-100">
                  + Thêm ảnh chi tiết
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updatePerson(person.id, { detailImages: [...(person.detailImages || []), url] }))} className="hidden" />
                </label>
                <label className="block text-xs font-bold text-gray-500">Logo các đơn vị từng tham gia (3, 4 hoặc 5 logo - mỗi dòng 1 URL)</label>
                <textarea value={joinLines(person.serviceLogos)} onChange={e => updatePerson(person.id, { serviceLogos: splitLines(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" rows={3} placeholder="https://logo-1..." />
                <label className="inline-flex items-center px-3 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-[12px] font-bold cursor-pointer hover:bg-blue-100">
                  + Thêm logo đơn vị
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updatePerson(person.id, { serviceLogos: [...(person.serviceLogos || []), url] }))} className="hidden" />
                </label>
                <label className="block text-xs font-bold text-gray-500">Biểu đồ quá trình công tác</label>
                <p className="text-[11px] text-gray-400">Nhập mỗi dòng theo mẫu: Tên giai đoạn|85</p>
                <textarea value={parseWorkChart(person.workChart)} onChange={e => updatePerson(person.id, { workChart: saveWorkChart(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" rows={3} placeholder="Đơn vị A|80&#10;Đơn vị B|95" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={person.chartLabel || ''} onChange={e => updatePerson(person.id, { chartLabel: e.target.value })} className="p-2 border border-gray-200 rounded-lg text-sm" placeholder="Line mặc định" />
                  <input type="number" min={0} max={100} value={person.chartValue ?? 70} onChange={e => updatePerson(person.id, { chartValue: Number(e.target.value) })} className="p-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <button onClick={() => setCommand(c => ({ ...c, people: c.people.filter(item => item.id !== person.id) }))} className="text-red-500 font-bold text-sm">Xóa người</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
