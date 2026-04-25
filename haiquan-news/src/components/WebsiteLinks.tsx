export default function WebsiteLinks() {
  return (
    <div className="bg-[#f2f7fb] p-3 rounded-md border border-blue-100 space-y-2">
      <a href="https://srovgvm.site/" target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition shadow-sm rounded-sm overflow-hidden">
        <img src="/logo-srov.png" className="w-full h-auto object-contain bg-white" alt="Cổng thông tin SROV" />
      </a>
      <a href="https://mod.gov.vn" target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition shadow-sm rounded-sm overflow-hidden">
        <img src="/logo-boqp.png" className="w-full h-auto object-contain bg-[#f5e6c8]" alt="Bộ Quốc Phòng" />
      </a>
      <div className="grid grid-cols-2 gap-2">
        <a href="https://vung4hq.gt.tc/?i=2" target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition shadow-sm rounded-sm overflow-hidden bg-white p-1">
          <img src="/logo-vung4.png" className="w-full h-[44px] object-contain" alt="Vùng 4 Hải Quân" />
        </a>
        <a href="https://qdnd.vn" target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition shadow-sm rounded-sm overflow-hidden bg-white p-1">
          <img src="/logo-qdnd.png" className="w-full h-[44px] object-contain" alt="Quân Đội Nhân Dân" />
        </a>
        <a href="https://ludoan162srov.xo.je/?i=1" target="_blank" rel="noopener noreferrer" className="col-span-2 block hover:opacity-90 transition shadow-sm rounded-sm overflow-hidden bg-white p-1">
          <img src="/logo-sudoan162.png" className="w-full h-[40px] object-contain" alt="Sư Đoàn 162" />
        </a>
      </div>
    </div>
  );
}
