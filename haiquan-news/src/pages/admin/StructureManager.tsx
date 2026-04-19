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
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Ảnh nền trang cấu trúc</label>
            <input value={structure.backgroundImage || ''} onChange={e => setStructure(s => ({ ...s, backgroundImage: e.target.value }))} className="w-full p-2 border border-gray-200 rounded-lg text-xs mb-2" placeholder="URL ảnh nền" />
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => setStructure(s => ({ ...s, backgroundImage: url })))} className="text-xs" />
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
          <button onClick={() => setCommand(c => ({ ...c, people: [...c.people, { id: newId(), group: 'units', name: 'Người chỉ huy mới', rank: 'Đại tá', position: 'Chức vụ' }] }))} className="px-4 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-sm font-bold">+ Thêm người</button>
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {command.people.map(person => (
              <div key={person.id} className="border border-gray-100 rounded-xl p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select value={person.group} onChange={e => updatePerson(person.id, { group: e.target.value as Commander['group'] })} className="p-2 border border-gray-200 rounded-lg text-sm"><option value="navy">HICOM NAVY</option><option value="units">HICOM đơn vị</option></select>
                  <select value={person.rank} onChange={e => updatePerson(person.id, { rank: e.target.value })} className="p-2 border border-gray-200 rounded-lg text-sm">{RANKS.map(rank => <option key={rank}>{rank}</option>)}</select>
                </div>
                <input value={person.name} onChange={e => updatePerson(person.id, { name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Tên" />
                <input value={person.position} onChange={e => updatePerson(person.id, { position: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Chức vụ" />
                <input value={person.photo || ''} onChange={e => updatePerson(person.id, { photo: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" placeholder="URL ảnh thẻ" />
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updatePerson(person.id, { photo: url }))} className="text-xs" />
                <textarea value={person.detail || ''} onChange={e => updatePerson(person.id, { detail: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" rows={3} placeholder="Nội dung chi tiết khi ấn vào thẻ" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={person.chartLabel || ''} onChange={e => updatePerson(person.id, { chartLabel: e.target.value })} className="p-2 border border-gray-200 rounded-lg text-sm" placeholder="Tên line biểu đồ" />
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
