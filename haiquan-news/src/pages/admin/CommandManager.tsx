import { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import { getSiteSetting, parseJsonSetting, upsertSetting, uploadImage } from '@/lib/supabase';
import { DEFAULT_COMMAND_DATA, RANKS, type ActivityMilestone, type CommandData, type Commander } from '../CommandPage';

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const parseWorkChart = (value?: { label: string; value: number }[]) => (value || []).map(item => `${item.label}|${item.value}`).join('\n');
const saveWorkChart = (raw: string) => raw.split('\n').map(line => {
  const [label, value] = line.split('|');
  return { label: (label || '').trim(), value: Number(value || 0) };
}).filter(item => item.label);

type ImageSlotListProps = {
  title: string;
  images?: string[];
  max?: number;
  variant?: 'logo' | 'photo';
  onChange: (images: string[]) => void;
  uploadTo: (file: File, onDone: (url: string) => void) => void;
};

function ImageSlotList({ title, images = [], max = 10, variant = 'photo', onChange, uploadTo }: ImageSlotListProps) {
  const [extraSlots, setExtraSlots] = useState(0);
  const displayImages = images.length ? [...images, ...Array(extraSlots).fill('')] : [''];
  const canAdd = images.length > 0 && images.length + extraSlots < max;
  const aspectClass = variant === 'logo' ? 'aspect-square' : 'aspect-video';

  const updateAt = (index: number, url: string) => {
    if (index >= images.length) {
      if (url) {
        onChange([...images, url].slice(0, max));
        setExtraSlots(current => Math.max(0, current - 1));
      }
      return;
    }
    const next = [...images];
    next[index] = url;
    onChange(next.filter(Boolean).slice(0, max));
  };

  const removeAt = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-gray-500 uppercase">{title}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {displayImages.map((image, index) => (
          <div key={`${title}-${index}`} className="rounded-xl border border-dashed border-blue-200 bg-white p-2 space-y-2">
            <div className={`${aspectClass} rounded-lg bg-[#f1f6fc] border border-blue-50 overflow-hidden flex items-center justify-center text-[11px] font-bold text-[#0059b2]/50`}>
              {image ? <img src={image} alt={`${title} ${index + 1}`} className="w-full h-full object-cover" /> : 'CHƯA CÓ ẢNH'}
            </div>
            <input value={image} onChange={e => updateAt(index, e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-[11px]" placeholder="URL ảnh" />
            <div className="flex items-center justify-between gap-2">
              <label className="inline-flex items-center px-2 py-1.5 bg-blue-50 text-[#0059b2] rounded-lg text-[11px] font-bold cursor-pointer hover:bg-blue-100">
                Tải ảnh
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && uploadTo(e.target.files[0], url => updateAt(index, url))} className="hidden" />
              </label>
              {image && <button onClick={() => removeAt(index)} className="text-red-500 text-[11px] font-bold">Xóa</button>}
            </div>
          </div>
        ))}
        {canAdd && (
          <button onClick={() => setExtraSlots(current => current + 1)} className={`${aspectClass} rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/60 text-[#0059b2] font-bold text-sm hover:bg-blue-100 transition`}>
            + Thêm ảnh
          </button>
        )}
      </div>
    </div>
  );
}

function TimelineEditor({ value = [], onChange }: { value?: ActivityMilestone[]; onChange: (value: ActivityMilestone[]) => void }) {
  const rows = value.length ? value : [{ time: '', rank: '', position: '', note: '' } as ActivityMilestone];

  const updateRow = (index: number, updates: Partial<ActivityMilestone>) => {
    const next = rows.map((row, i) => i === index ? { ...row, ...updates } : row);
    onChange(next.filter(row => row.time || row.rank || row.position || row.note));
  };

  const addRow = () => onChange([...rows, { time: '', rank: '', position: '', note: '' } as ActivityMilestone]);
  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="block text-xs font-bold text-gray-500 uppercase">Biểu đồ quá trình công tác</label>
        <button onClick={addRow} className="text-[#0059b2] text-[12px] font-bold hover:underline">+ Thêm mốc</button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white max-h-44 overflow-y-auto p-2 space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="grid grid-cols-[80px_70px_1fr_1fr_24px] gap-2 items-center min-w-[620px]">
            <input value={row.time || ''} onChange={e => updateRow(index, { time: e.target.value })} className="p-2 border border-gray-200 rounded text-sm" placeholder="2026" />
            <input value={row.rank || ''} onChange={e => updateRow(index, { rank: e.target.value })} className="p-2 border border-gray-200 rounded text-sm" placeholder="1" />
            <input value={row.position || ''} onChange={e => updateRow(index, { position: e.target.value })} className="p-2 border border-gray-200 rounded text-sm" placeholder="Chức vụ" />
            <input value={row.note || ''} onChange={e => updateRow(index, { note: e.target.value })} className="p-2 border border-gray-200 rounded text-sm" placeholder="Ghi chú" />
            <button onClick={() => removeRow(index)} className="text-red-400 font-bold text-lg">×</button>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400">Cột 1: thời gian/năm, cột 2: quân hàm hoặc cấp bậc, cột 3: chức vụ, cột 4: ghi chú.</p>
    </div>
  );
}

export default function CommandManager() {
  const [command, setCommand] = useState<CommandData>(DEFAULT_COMMAND_DATA);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSiteSetting('command_page_data').then(value => setCommand(parseJsonSetting(value, DEFAULT_COMMAND_DATA)));
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setMessage('');
    await upsertSetting('command_page_data', JSON.stringify(command));
    setSaving(false);
    setMessage('Đã lưu trang Chỉ huy.');
    setTimeout(() => setMessage(''), 3000);
  };

  const uploadTo = async (file: File, onDone: (url: string) => void) => {
    const url = await uploadImage(file);
    if (url) onDone(url);
  };

  const updatePerson = (id: string, updates: Partial<Commander>) => setCommand(c => ({ ...c, people: c.people.map(person => person.id === id ? { ...person, ...updates } : person) }));

  return (
    <AdminLayout title="Chỉ huy">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-[#0059b2] font-bold text-[12px] uppercase tracking-[0.18em]">Quản trị nội dung</p>
          <h2 className="text-[28px] font-black text-[#111827] tracking-tight">Chỉ huy</h2>
          <p className="text-[#6b7280] text-[14px] mt-1">Quản lý HICOM, tiểu sử, ảnh, logo đơn vị và biểu đồ mốc hoạt động theo thời gian.</p>
        </div>
        <button onClick={saveAll} disabled={saving} className="px-7 py-3 bg-[#0059b2] text-white rounded-xl font-bold shadow hover:bg-blue-700 disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu chỉ huy'}</button>
      </div>
      {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-bold">{message}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <input value={command.title} onChange={e => setCommand(c => ({ ...c, title: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" placeholder="Tiêu đề" />
          <textarea value={command.description} onChange={e => setCommand(c => ({ ...c, description: e.target.value }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm" rows={2} placeholder="Mô tả" />
        </div>
        <button onClick={() => setCommand(c => ({ ...c, people: [...c.people, { id: newId(), group: 'units', name: 'Nguyễn Văn A', rank: 'Đại tá', position: 'Tư lệnh Hải quân', unit: 'HICOM NAVY', displayOrder: c.people.length, activityTimeline: [] }] }))} className="px-4 py-2 bg-blue-50 text-[#0059b2] rounded-lg text-sm font-bold">+ Thêm chỉ huy</button>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {command.people.map(person => (
            <div key={person.id} className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-[#fbfdff]">
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 mb-1">Họ và tên *</label>
                  <input value={person.name} onChange={e => updatePerson(person.id, { name: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Quân hàm hiện tại</label>
                  <select value={person.rank} onChange={e => updatePerson(person.id, { rank: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm">{RANKS.map(rank => <option key={rank}>{rank}</option>)}</select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Thứ tự</label>
                  <input type="number" value={person.displayOrder ?? 0} onChange={e => updatePerson(person.id, { displayOrder: Number(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
              <label className="block text-xs font-bold text-gray-500">Chức vụ hiện tại</label>
              <input value={person.position} onChange={e => updatePerson(person.id, { position: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="Tư lệnh Hải quân" />
              <label className="block text-xs font-bold text-gray-500">Đơn vị</label>
              <input value={person.unit || ''} onChange={e => updatePerson(person.id, { unit: e.target.value })} className="w-full p-2 border border-gray-200 rounded-lg text-sm" placeholder="HICOM NAVY" />
              <label className="flex items-center gap-2 text-sm font-bold text-[#0059b2]">
                <input type="checkbox" checked={person.group === 'navy'} onChange={e => updatePerson(person.id, { group: e.target.checked ? 'navy' : 'units' })} />
                Thuộc HICOM Bộ Tư lệnh Hải quân
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
              <TimelineEditor value={person.activityTimeline} onChange={activityTimeline => updatePerson(person.id, { activityTimeline })} />
              <ImageSlotList title="Ảnh hoạt động / ảnh chi tiết" images={person.detailImages} max={10} variant="photo" onChange={detailImages => updatePerson(person.id, { detailImages })} uploadTo={uploadTo} />
              <ImageSlotList title="Logo các đơn vị từng tham gia" images={person.serviceLogos} max={8} variant="logo" onChange={serviceLogos => updatePerson(person.id, { serviceLogos })} uploadTo={uploadTo} />
              <label className="block text-xs font-bold text-gray-500">Biểu đồ phần trăm quá trình công tác</label>
              <p className="text-[11px] text-gray-400">Mỗi dòng theo mẫu: Tên giai đoạn|85</p>
              <textarea value={parseWorkChart(person.workChart)} onChange={e => updatePerson(person.id, { workChart: saveWorkChart(e.target.value) })} className="w-full p-2 border border-gray-200 rounded-lg text-xs" rows={3} placeholder="Đơn vị A|80" />
              <button onClick={() => setCommand(c => ({ ...c, people: c.people.filter(item => item.id !== person.id) }))} className="text-red-500 font-bold text-sm">Xóa người</button>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
