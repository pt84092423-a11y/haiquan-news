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
  logo?: string;
  slogan?: string;
  history?: string;
  galleryImages?: string[];
};

export type StructureData = {
  title: string;
  description: string;
  backgroundImage?: string;
  displayMode?: 'chart' | 'image';
  posterImage?: string;
  units: StructureUnit[];
};

export const DEFAULT_STRUCTURE_DATA: StructureData = {
  title: 'Cấu trúc tổ chức Hải quân',
  description: 'Sơ đồ các đơn vị thuộc Hải quân Nhân dân Việt Nam',
  backgroundImage: '',
  displayMode: 'chart',
  posterImage: '',
  units: [
    { id: 'navy-command', name: 'Bộ Tư lệnh Hải quân', description: 'Cơ quan chỉ huy trung tâm', slogan: 'Kỷ luật, chính quy, tinh nhuệ, hiện đại', history: 'Thông tin lịch sử đơn vị có thể cập nhật trong quản trị.' },
    { id: 'unit-1', name: 'Đơn vị trực thuộc 1', parentId: 'navy-command', description: 'Có thể sửa tên, mô tả, logo và thông tin chi tiết trong quản trị', slogan: 'Sẵn sàng chiến đấu', history: 'Lịch sử hình thành và phát triển của đơn vị.' },
    { id: 'unit-2', name: 'Đơn vị trực thuộc 2', parentId: 'navy-command', description: 'Có thể thêm hoặc xoá đơn vị', slogan: 'Đoàn kết, hiệp đồng, quyết thắng', history: 'Thông tin lịch sử đơn vị.' },
    { id: 'unit-3', name: 'Đơn vị trực thuộc 3', parentId: 'navy-command', description: 'Dùng làm mẫu ban đầu', slogan: 'Vững vàng nơi đầu sóng', history: 'Thông tin lịch sử đơn vị.' },
  ],
};

function UnitBox({ unit, root, onSelect }: { unit: StructureUnit; root?: boolean; onSelect: (unit: StructureUnit) => void }) {
  const logo = unit.logo || unit.image;
  return (
    <button
      onClick={() => onSelect(unit)}
      className={`group text-center transition hover:-translate-y-1 ${root ? 'inline-flex' : 'block w-full'}`}
    >
      <div className={`${root ? 'bg-[#0059b2] text-white px-8 py-5 border-4 border-white shadow-xl' : 'bg-white border border-blue-100 p-5 shadow-sm hover:shadow-md'} rounded-2xl`}>
        {logo && <img src={logo} alt={unit.name} className={`${root ? 'w-20 h-20' : 'w-16 h-16'} rounded-full object-contain mx-auto mb-3 border-2 border-[#FFD700] bg-white p-1`} />}
        <strong className={`${root ? 'text-xl text-white' : 'text-lg text-[#00305f]'} uppercase block`}>{unit.name}</strong>
        {unit.description && <span className={`${root ? 'text-white/75' : 'text-[#555]'} text-sm mt-2 leading-relaxed block`}>{unit.description}</span>}
        <span className={`${root ? 'text-[#FFD700]' : 'text-[#0059b2]'} text-[12px] font-bold mt-3 inline-block`}>Xem thông tin đơn vị</span>
      </div>
    </button>
  );
}

export default function StructurePage() {
  const [data, setData] = useState<StructureData>(DEFAULT_STRUCTURE_DATA);
  const [selected, setSelected] = useState<StructureUnit | null>(null);

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
        <SectionTitle title={data.displayMode === 'image' ? 'Hình ảnh cấu trúc' : 'Sơ đồ các đơn vị'} className="text-[28px]" />
        {data.displayMode === 'image' ? (
          <div className="bg-[#f8fbff] border border-blue-100 rounded-3xl p-3 md:p-5 shadow-sm overflow-hidden">
            {data.posterImage ? (
              <img src={data.posterImage} alt={data.title} className="w-full rounded-2xl object-contain bg-white" />
            ) : (
              <div className="aspect-[16/9] rounded-2xl bg-[#e8f0fa] flex items-center justify-center text-[#0059b2]/50 font-bold uppercase">
                Chưa có hình cấu trúc
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#f8fbff] border border-blue-100 rounded-3xl p-6 md:p-10 shadow-sm overflow-hidden">
            <div className="flex flex-col items-center gap-8">
              {rootUnits.map(unit => <UnitBox key={unit.id} unit={unit} root onSelect={setSelected} />)}
              {childUnits.length > 0 && <div className="w-px h-8 bg-blue-200" />}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                {childUnits.map(unit => <UnitBox key={unit.id} unit={unit} onSelect={setSelected} />)}
              </div>
            </div>
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white max-w-5xl w-full max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 md:p-8">
              <button onClick={() => setSelected(null)} className="float-right text-gray-400 hover:text-red-500 text-3xl leading-none">×</button>
              <div className="flex flex-col md:flex-row gap-5 items-start border-b border-blue-100 pb-6 mb-6">
                {(selected.logo || selected.image) && <img src={selected.logo || selected.image} alt={selected.name} className="w-24 h-24 rounded-2xl object-contain border border-blue-100 bg-[#f8fbff] p-2" />}
                <div>
                  <p className="text-[#0059b2] font-bold uppercase text-sm">Thông tin đơn vị</p>
                  <h2 className="font-['Playfair_Display',serif] text-3xl font-black text-[#002060] mt-1">{selected.name}</h2>
                  {selected.description && <p className="mt-2 text-[#555] leading-relaxed">{selected.description}</p>}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <section className="bg-[#f8fbff] rounded-2xl border border-blue-100 p-5">
                  <h3 className="font-bold text-[#0059b2] uppercase mb-3">Khẩu hiệu</h3>
                  <p className="text-[#222] font-bold italic">{selected.slogan || 'Chưa cập nhật khẩu hiệu.'}</p>
                </section>
                <section className="bg-[#f8fbff] rounded-2xl border border-blue-100 p-5">
                  <h3 className="font-bold text-[#0059b2] uppercase mb-3">Lịch sử</h3>
                  <p className="text-[#333] whitespace-pre-line leading-relaxed">{selected.history || 'Chưa cập nhật lịch sử đơn vị.'}</p>
                </section>
              </div>
              <section className="mt-6">
                <h3 className="font-bold text-[#0059b2] uppercase mb-3">Hình ảnh hoạt động</h3>
                {selected.galleryImages && selected.galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selected.galleryImages.slice(0, 10).map((image, index) => <img key={`${image}-${index}`} src={image} alt={`${selected.name} ${index + 1}`} className="w-full aspect-video object-cover rounded-xl border border-blue-100" />)}
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#f8fbff] border border-blue-100 p-8 text-center text-[#555]">Chưa có hình ảnh hoạt động.</div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
