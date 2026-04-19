import { useEffect, useState } from 'react';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { getSiteSetting, parseJsonSetting } from '@/lib/supabase';

export type Commander = {
  id: string;
  group: 'navy' | 'units';
  name: string;
  rank: string;
  position: string;
  photo?: string;
  detail?: string;
  chartLabel?: string;
  chartValue?: number;
};

export type CommandData = {
  title: string;
  description: string;
  people: Commander[];
};

export const RANKS = ['Binh nhì','Binh nhất','Hạ sĩ','Trung sĩ','Thượng sĩ','Thiếu úy','Trung úy','Thượng úy','Đại úy','Thiếu tá','Trung tá','Thượng tá','Đại tá','Chuẩn đô đốc','Phó đô đốc','Đô đốc'];

export const DEFAULT_COMMAND_DATA: CommandData = {
  title: 'Chỉ huy Hải quân',
  description: 'Thông tin HICOM Bộ Tư lệnh Hải quân và HICOM các đơn vị trực thuộc',
  people: [
    { id: 'hicom-navy-default', group: 'navy', name: 'HICOM NAVY', rank: 'Đô đốc', position: 'Bộ Tư lệnh Hải quân', detail: 'Thẻ mặc định, có thể sửa hoặc thêm người trong quản trị.', chartLabel: 'Mức độ hoàn thành', chartValue: 85 },
  ],
};

function PersonCard({ person, onSelect }: { person: Commander; onSelect: (person: Commander) => void }) {
  return (
    <button onClick={() => onSelect(person)} className="text-left bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition group">
      <div className="aspect-[4/3] bg-[#e8f0fa] overflow-hidden">
        {person.photo ? <img src={person.photo} alt={person.name} className="w-full h-full object-cover group-hover:scale-105 transition" /> : <div className="w-full h-full flex items-center justify-center text-[#0059b2]/40 font-bold">ẢNH THẺ</div>}
      </div>
      <div className="p-4">
        <p className="text-[11px] font-bold text-[#0059b2] uppercase">{person.rank}</p>
        <h3 className="font-bold text-[#222] text-lg leading-tight mt-1">{person.name}</h3>
        <p className="text-sm text-[#555] mt-1">{person.position}</p>
      </div>
    </button>
  );
}

export default function CommandPage() {
  const [data, setData] = useState<CommandData>(DEFAULT_COMMAND_DATA);
  const [selected, setSelected] = useState<Commander | null>(null);

  useEffect(() => {
    getSiteSetting('command_page_data').then(value => setData(parseJsonSetting(value, DEFAULT_COMMAND_DATA)));
  }, []);

  const navy = data.people.filter(person => person.group === 'navy');
  const units = data.people.filter(person => person.group === 'units');

  return (
    <>
      <SEOHead title="Chỉ huy" description={data.description} />
      <div className="bg-gradient-to-r from-[#002060] to-[#0059b2] text-white py-14">
        <div className="container mx-auto max-w-[1200px] px-4">
          <p className="text-[#FFD700] uppercase text-[13px] font-bold tracking-[0.2em] mb-3">HICOM</p>
          <h1 className="font-['Playfair_Display',serif] text-4xl md:text-5xl font-black uppercase mb-4">{data.title}</h1>
          <p className="max-w-2xl text-white/85 leading-relaxed">{data.description}</p>
        </div>
      </div>

      <main className="container mx-auto max-w-[1200px] px-4 py-10 space-y-12">
        <section>
          <SectionTitle title="HICOM Bộ Tư lệnh Hải quân" className="text-[28px]" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {navy.map(person => <PersonCard key={person.id} person={person} onSelect={setSelected} />)}
          </div>
        </section>

        <section>
          <SectionTitle title="HICOM các đơn vị trực thuộc Bộ Tư lệnh Hải quân" className="text-[28px]" />
          {units.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {units.map(person => <PersonCard key={person.id} person={person} onSelect={setSelected} />)}
            </div>
          ) : (
            <div className="bg-[#f8fbff] border border-blue-100 rounded-2xl p-10 text-center text-[#555]">Chưa có người trong nhóm này. Có thể thêm trong trang quản trị.</div>
          )}
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="grid md:grid-cols-5">
              <div className="md:col-span-2 bg-[#e8f0fa]">
                {selected.photo ? <img src={selected.photo} alt={selected.name} className="w-full h-full min-h-[320px] object-cover" /> : <div className="min-h-[320px] flex items-center justify-center text-[#0059b2]/40 font-bold">ẢNH THẺ</div>}
              </div>
              <div className="md:col-span-3 p-6">
                <button onClick={() => setSelected(null)} className="float-right text-gray-400 hover:text-red-500 text-2xl">×</button>
                <p className="text-[#0059b2] font-bold uppercase text-sm">{selected.rank}</p>
                <h2 className="font-['Playfair_Display',serif] text-3xl font-black text-[#002060] mt-1">{selected.name}</h2>
                <p className="font-bold text-[#555] mt-2">{selected.position}</p>
                <div className="mt-5 text-[#333] leading-relaxed whitespace-pre-line">{selected.detail || 'Chưa có nội dung chi tiết.'}</div>
                <div className="mt-6">
                  <div className="flex justify-between text-sm font-bold text-[#0059b2] mb-2"><span>{selected.chartLabel || 'Biểu đồ'}</span><span>{selected.chartValue ?? 70}%</span></div>
                  <div className="h-3 bg-blue-50 rounded-full overflow-hidden"><div className="h-full bg-[#0059b2]" style={{ width: `${Math.min(100, Math.max(0, selected.chartValue ?? 70))}%` }} /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
