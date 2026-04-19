import { useEffect, useState } from 'react';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import { getSiteSetting, parseJsonSetting } from '@/lib/supabase';

export type StructureUnit = {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  image?: string;
};

export type StructureData = {
  title: string;
  description: string;
  backgroundImage?: string;
  units: StructureUnit[];
};

export const DEFAULT_STRUCTURE_DATA: StructureData = {
  title: 'Cấu trúc tổ chức Hải quân',
  description: 'Sơ đồ các đơn vị thuộc Hải quân Nhân dân Việt Nam',
  backgroundImage: '',
  units: [
    { id: 'navy-command', name: 'Bộ Tư lệnh Hải quân', description: 'Cơ quan chỉ huy trung tâm' },
    { id: 'unit-1', name: 'Đơn vị trực thuộc 1', parentId: 'navy-command', description: 'Có thể sửa tên, mô tả và ảnh nền trong quản trị' },
    { id: 'unit-2', name: 'Đơn vị trực thuộc 2', parentId: 'navy-command', description: 'Có thể thêm hoặc xoá đơn vị' },
    { id: 'unit-3', name: 'Đơn vị trực thuộc 3', parentId: 'navy-command', description: 'Dùng làm mẫu ban đầu' },
  ],
};

export default function StructurePage() {
  const [data, setData] = useState<StructureData>(DEFAULT_STRUCTURE_DATA);

  useEffect(() => {
    getSiteSetting('structure_page_data').then(value => setData(parseJsonSetting(value, DEFAULT_STRUCTURE_DATA)));
  }, []);

  const rootUnits = data.units.filter(unit => !unit.parentId);
  const childUnits = data.units.filter(unit => unit.parentId);

  return (
    <>
      <SEOHead title="Cấu trúc" description={data.description} />
      <div className="bg-[#00305f] text-white py-14 relative overflow-hidden">
        {data.backgroundImage && <img src={data.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
        <div className="absolute inset-0 bg-gradient-to-r from-[#002060] to-[#0059b2]/80" />
        <div className="container mx-auto max-w-[1200px] px-4 relative z-10">
          <p className="text-[#FFD700] uppercase text-[13px] font-bold tracking-[0.2em] mb-3">Tổ chức lực lượng</p>
          <h1 className="font-['Playfair_Display',serif] text-4xl md:text-5xl font-black uppercase mb-4">{data.title}</h1>
          <p className="max-w-2xl text-white/85 leading-relaxed">{data.description}</p>
        </div>
      </div>

      <main className="container mx-auto max-w-[1200px] px-4 py-10">
        <SectionTitle title="Sơ đồ đơn vị" className="text-[28px]" />
        <div className="bg-[#f8fbff] border border-blue-100 rounded-3xl p-6 md:p-10 shadow-sm overflow-hidden">
          <div className="flex flex-col items-center gap-8">
            {rootUnits.map(unit => (
              <div key={unit.id} className="text-center">
                <div className="inline-flex flex-col items-center rounded-2xl bg-[#0059b2] text-white px-8 py-5 shadow-xl border-4 border-white">
                  {unit.image && <img src={unit.image} alt={unit.name} className="w-20 h-20 rounded-full object-cover mb-3 border-2 border-[#FFD700]" />}
                  <strong className="text-xl uppercase">{unit.name}</strong>
                  {unit.description && <span className="text-sm text-white/75 mt-1">{unit.description}</span>}
                </div>
              </div>
            ))}
            <div className="w-px h-8 bg-blue-200" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
              {childUnits.map(unit => (
                <div key={unit.id} className="bg-white rounded-2xl border border-blue-100 p-5 shadow-sm hover:shadow-md transition text-center">
                  {unit.image && <img src={unit.image} alt={unit.name} className="w-full aspect-video object-cover rounded-xl mb-4" />}
                  <h3 className="font-bold text-[#00305f] text-lg uppercase">{unit.name}</h3>
                  {unit.description && <p className="text-sm text-[#555] mt-2 leading-relaxed">{unit.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
