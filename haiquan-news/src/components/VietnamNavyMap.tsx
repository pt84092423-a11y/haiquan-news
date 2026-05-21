import { useState } from 'react';

// Map image: vietnam-sea-map-new.png — actual size 703 x 682 px
// SVG viewBox matches image dimensions exactly: 0 0 703 682
// Coordinates below are calibrated directly against the image pixels.
const ZONES = [
  {
    id: 1, name: 'Vùng 1 Hải quân', hq: 'Hải Phòng', cx: 275, cy: 95,
    color: '#e53935',
    cover: 'Vịnh Bắc Bộ, vùng biển Đông Bắc',
    ships: 'Tàu tên lửa, tàu pháo, tàu ngầm',
    desc: 'Quản lý vùng biển miền Bắc, Vịnh Bắc Bộ và các đảo phía Bắc.',
  },
  {
    id: 2, name: 'Vùng 2 Hải quân', hq: 'Đà Nẵng', cx: 268, cy: 252,
    color: '#1e88e5',
    cover: 'Biển miền Trung, bờ biển miền Trung Việt Nam',
    ships: 'Tàu hộ vệ, tàu tuần tra, tàu đổ bộ',
    desc: 'Bảo vệ vùng biển miền Trung từ Quảng Bình đến Bình Định.',
  },
  {
    id: 3, name: 'Vùng 4 Hải quân', hq: 'Cam Ranh', cx: 332, cy: 362,
    color: '#43a047',
    cover: 'Vùng biển Nam Trung Bộ và Trường Sa',
    ships: 'Tàu tên lửa, tàu ngầm, tàu đặc công nước',
    desc: 'Phụ trách vùng biển Nam Trung Bộ và quần đảo Trường Sa.',
  },
  {
    id: 4, name: 'Vùng 4 Hải quân', hq: 'Quân Cảng Cam Ranh', cx: 248, cy: 478,
    color: '#fb8c00',
    cover: 'Trường Sa, Cam Ranh và khu vực lân cận.',
    ships: 'Tàu tuần tra, tàu pháo, tàu đặc nhiệm',
    desc: 'Trường Sa, Cam Ranh...',
  },
  {
    id: 5, name: 'Vùng 5 Hải quân', hq: 'Phú Quốc', cx: 157, cy: 500,
    color: '#8e24aa',
    cover: 'Vịnh Thái Lan, vùng biển Tây Nam',
    ships: 'Tàu tên lửa, tàu tuần tra duyên hải, tàu ngầm',
    desc: 'Bảo vệ vùng biển Tây Nam, Vịnh Thái Lan.',
  },
];

interface Zone { id: number; name: string; hq: string; cx: number; cy: number; color: string; cover: string; ships: string; desc: string; }

type IslandKey = 'hoangsa' | 'truongsa' | 'namtruongsa' | 'vinhbacbo' | null;

const ISLAND_INFO: Record<string, { title: string; sub: string; body: string; color: string }> = {
  vinhbacbo: {
    title: 'Vịnh Bắc Bộ', sub: 'Vùng biển chiến lược miền Bắc',
    body: 'Vịnh Bắc Bộ là vùng biển bán kín giữa Việt Nam và Trung Quốc, diện tích khoảng 126.250 km². Đường phân định Vịnh Bắc Bộ được ký kết năm 2000.',
    color: '#5c6bc0',
  },
  hoangsa: {
    title: 'Quần đảo Hoàng Sa', sub: 'Biển Đông · Thuộc chủ quyền Việt Nam',
    body: 'Quần đảo Hoàng Sa (Paracel Islands) là quần đảo thuộc chủ quyền của Việt Nam, gồm khoảng 30 đảo nhỏ, bãi đá và bãi cát ngầm ở Biển Đông. Tọa độ: 16°30\'N, 112°00\'E.',
    color: '#e53935',
  },
  truongsa: {
    title: 'Quần đảo Trường Sa', sub: 'Biển Đông · Thuộc chủ quyền Việt Nam',
    body: 'Quần đảo Trường Sa (Spratly Islands) gồm hơn 100 đảo, bãi đá và bãi cạn. Hiện có đơn vị Hải quân Việt Nam đang đóng giữ nhiều đảo. Tọa độ: 8°38\'N–12°00\'N, 111°30\'E–117°20\'E.',
    color: '#fb8c00',
  },
  namtruongsa: {
    title: 'Nam Trường Sa', sub: 'Vùng biển phía Nam Biển Đông',
    body: 'Nam Trường Sa là vùng biển thuộc phần phía nam của quần đảo Trường Sa, tiếp giáp với vùng đặc quyền kinh tế của Việt Nam và Malaysia.',
    color: '#00897b',
  },
};

export default function VietnamNavyMap() {
  const [activeZone, setActiveZone] = useState<Zone | null>(null);
  const [activeIsland, setActiveIsland] = useState<IslandKey>(null);

  const handleZoneClick = (zone: Zone) => setActiveZone(activeZone?.id === zone.id ? null : zone);
  const handleIslandClick = (key: IslandKey) => {
    setActiveIsland(activeIsland === key ? null : key);
    setActiveZone(null);
  };

  const info = activeIsland ? ISLAND_INFO[activeIsland] : null;

  return (
    <div className="w-full bg-[#0d1e3d] rounded-2xl overflow-hidden shadow-2xl border border-[#1a3a6a]">
      {/* Header — solid bright blue, no gradient */}
      <div className="px-5 py-3 bg-[#0055cc] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-white font-black text-[14px] uppercase tracking-widest flex items-center gap-2">
            <img src="/logo-haiquan.png" alt="Logo Hải quân" className="h-8 w-8 object-contain drop-shadow" />
            BẢN ĐỒ HẢI QUÂN NHÂN DÂN VIỆT NAM
          </h3>
          <p className="text-blue-100 text-[11px] mt-0.5">5 Vùng Hải quân · Hoàng Sa · Trường Sa · Biển Đông</p>
        </div>
        {/* Quốc huy + khẩu hiệu */}
        <div className="hidden sm:flex flex-col items-center gap-1">
          <img src="/quoc-huy.png" alt="Quốc huy Việt Nam" className="h-12 w-12 object-contain drop-shadow-lg" />
          <p className="text-yellow-300 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
            Hoàng Sa - Trường Sa Là của Việt Nam
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Map — viewBox = 703 × 682 matches image pixel dimensions exactly */}
        <div className="flex-1 relative bg-[#0a1628]">
          <svg
            viewBox="0 0 703 682"
            className="w-full h-auto block"
            style={{ display: 'block' }}
          >
            <image
              href="/vietnam-sea-map-new.png"
              x="0" y="0"
              width="703" height="682"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Subtle overlay for marker contrast */}
            <rect x="0" y="0" width="703" height="682" fill="rgba(0,0,0,0.06)" />

            {/* Vịnh Bắc Bộ — vùng nước bên phải bắc VN */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('vinhbacbo')} opacity={activeIsland === 'vinhbacbo' ? 1 : 0.7}>
              <ellipse cx="378" cy="155" rx="62" ry="50"
                fill={activeIsland === 'vinhbacbo' ? 'rgba(92,107,192,0.38)' : 'rgba(92,107,192,0.18)'}
                stroke={activeIsland === 'vinhbacbo' ? '#7986cb' : 'rgba(121,134,203,0.5)'}
                strokeWidth={activeIsland === 'vinhbacbo' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'vinhbacbo' ? '' : '6 3'}
              />
              {activeIsland === 'vinhbacbo' && (
                <text x="378" y="159" fill="#c5cae9" fontSize="8" textAnchor="middle" fontWeight="bold">VỊNH BẮC BỘ</text>
              )}
            </g>

            {/* Hoàng Sa — phía phải giữa bản đồ (G.Đ HOÀNG SA) */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('hoangsa')} opacity={activeIsland === 'hoangsa' ? 1 : 0.75}>
              <ellipse cx="468" cy="234" rx="48" ry="34"
                fill={activeIsland === 'hoangsa' ? 'rgba(229,57,53,0.38)' : 'rgba(229,57,53,0.18)'}
                stroke={activeIsland === 'hoangsa' ? '#ef5350' : 'rgba(239,83,80,0.55)'}
                strokeWidth={activeIsland === 'hoangsa' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'hoangsa' ? '' : '6 3'}
              />
              {activeIsland === 'hoangsa' && (
                <text x="468" y="238" fill="#ffcdd2" fontSize="8" textAnchor="middle" fontWeight="bold">HOÀNG SA</text>
              )}
            </g>

            {/* Trường Sa — phía phải, dưới giữa (G.Đ TRƯỜNG SA) */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('truongsa')} opacity={activeIsland === 'truongsa' ? 1 : 0.75}>
              <ellipse cx="463" cy="483" rx="50" ry="36"
                fill={activeIsland === 'truongsa' ? 'rgba(251,140,0,0.38)' : 'rgba(251,140,0,0.18)'}
                stroke={activeIsland === 'truongsa' ? '#ffa726' : 'rgba(255,167,38,0.55)'}
                strokeWidth={activeIsland === 'truongsa' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'truongsa' ? '' : '6 3'}
              />
              {activeIsland === 'truongsa' && (
                <text x="463" y="487" fill="#ffe0b2" fontSize="8" textAnchor="middle" fontWeight="bold">TRƯỜNG SA</text>
              )}
            </g>

            {/* Nam Trường Sa — dưới cùng bên phải (NAM BIỂN ĐÔNG) */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('namtruongsa')} opacity={activeIsland === 'namtruongsa' ? 1 : 0.7}>
              <ellipse cx="455" cy="576" rx="52" ry="30"
                fill={activeIsland === 'namtruongsa' ? 'rgba(0,137,123,0.38)' : 'rgba(0,137,123,0.18)'}
                stroke={activeIsland === 'namtruongsa' ? '#26a69a' : 'rgba(38,166,154,0.5)'}
                strokeWidth={activeIsland === 'namtruongsa' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'namtruongsa' ? '' : '6 3'}
              />
              {activeIsland === 'namtruongsa' && (
                <text x="455" y="580" fill="#b2dfdb" fontSize="8" textAnchor="middle" fontWeight="bold">NAM TRƯỜNG SA</text>
              )}
            </g>

            {/* 5 markers vùng hải quân — trên bờ biển VN */}
            {ZONES.map(zone => (
              <g key={zone.id} className="cursor-pointer" onClick={() => handleZoneClick(zone)}>
                {activeZone?.id === zone.id && (
                  <circle cx={zone.cx} cy={zone.cy} r="16"
                    fill="none" stroke={zone.color} strokeWidth="2" opacity="0.6"
                    strokeDasharray="4 2"
                  />
                )}
                <circle
                  cx={zone.cx} cy={zone.cy}
                  r={activeZone?.id === zone.id ? 12 : 10}
                  fill={zone.color}
                  stroke="#fff"
                  strokeWidth="1.5"
                  style={{ filter: `drop-shadow(0 0 4px ${zone.color}99)` }}
                />
                <text x={zone.cx} y={zone.cy + 4} fill="white" fontSize="7.5" textAnchor="middle" fontWeight="bold">
                  V{zone.id}
                </text>
                {activeZone?.id === zone.id && (
                  <text
                    x={zone.cx + (zone.cx < 350 ? 15 : -15)}
                    y={zone.cy}
                    fill={zone.color}
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor={zone.cx < 350 ? 'start' : 'end'}
                    style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }}
                  >
                    {zone.hq}
                  </text>
                )}
              </g>
            ))}

            {/* Dots nhỏ trên các quần đảo */}
            <circle cx="468" cy="234" r="3" fill="#ef5350" opacity="0.9" className="pointer-events-none" />
            <circle cx="463" cy="483" r="3" fill="#ffa726" opacity="0.9" className="pointer-events-none" />
            <circle cx="378" cy="155" r="3" fill="#7986cb" opacity="0.9" className="pointer-events-none" />
            <circle cx="455" cy="576" r="3" fill="#26a69a" opacity="0.9" className="pointer-events-none" />

            {/* Watermark chủ quyền nghiêng trên vùng biển */}
            <text
              x="490" y="360"
              fill="rgba(255,220,50,0.50)"
              fontSize="9.5"
              fontWeight="bold"
              textAnchor="middle"
              transform="rotate(-60, 490, 360)"
              style={{ pointerEvents: 'none', letterSpacing: '1px' }}
            >
              HOÀNG SA - TRƯỜNG SA LÀ CỦA VIỆT NAM
            </text>
          </svg>

          <div className="absolute bottom-2 left-2 text-[10px] text-white/60 pointer-events-none">
            Nhấn vào các vùng để xem thông tin
          </div>
        </div>

        {/* Info Panel */}
        <div className="lg:w-[280px] flex flex-col bg-[#0a1628] border-t lg:border-t-0 lg:border-l border-[#1a3a6a]">
          <div className="flex-1 p-4 space-y-3">
            {activeZone ? (
              <div className="rounded-xl border p-4" style={{ borderColor: activeZone.color, backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-[13px] flex-shrink-0" style={{ backgroundColor: activeZone.color }}>
                    V{activeZone.id}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-black text-[13px] leading-tight">{activeZone.name}</p>
                    <p className="text-blue-300 text-[10px]">Sở chỉ huy: {activeZone.hq}</p>
                  </div>
                  <button onClick={() => setActiveZone(null)} className="ml-auto text-gray-400 hover:text-white text-xl leading-none flex-shrink-0">×</button>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <p className="text-blue-400 font-bold uppercase tracking-wider mb-0.5">Khu vực phụ trách</p>
                    <p className="text-blue-100 leading-relaxed">{activeZone.cover}</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-bold uppercase tracking-wider mb-0.5">Lực lượng</p>
                    <p className="text-blue-100 leading-relaxed">{activeZone.ships}</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-bold uppercase tracking-wider mb-0.5">Nhiệm vụ</p>
                    <p className="text-blue-100 leading-relaxed">{activeZone.desc}</p>
                  </div>
                </div>
              </div>
            ) : info ? (
              <div className="rounded-xl border p-4" style={{ borderColor: info.color, backgroundColor: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: info.color }} />
                  <div className="min-w-0">
                    <p className="text-white font-black text-[13px] leading-tight">{info.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: info.color }}>{info.sub}</p>
                  </div>
                  <button onClick={() => setActiveIsland(null)} className="ml-auto text-gray-400 hover:text-white text-xl leading-none flex-shrink-0">×</button>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed">{info.body}</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2">5 Vùng Hải quân</p>
                {ZONES.map(z => (
                  <button
                    key={z.id}
                    onClick={() => handleZoneClick(z)}
                    className="w-full flex items-center gap-2.5 hover:bg-white/5 rounded-lg px-2 py-1.5 transition text-left"
                  >
                    <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-black" style={{ backgroundColor: z.color }}>
                      {z.id}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-bold truncate">Vùng {z.id}</p>
                      <p className="text-blue-400 text-[9px] truncate">{z.hq}</p>
                    </div>
                  </button>
                ))}

                <div className="mt-3 pt-3 border-t border-[#1a3a6a] space-y-1">
                  <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-2">Lãnh thổ biển đảo</p>
                  {[
                    { key: 'vinhbacbo' as IslandKey, label: 'Vịnh Bắc Bộ', color: '#7986cb' },
                    { key: 'hoangsa' as IslandKey, label: 'Quần đảo Hoàng Sa', color: '#ef5350' },
                    { key: 'truongsa' as IslandKey, label: 'Quần đảo Trường Sa', color: '#ffa726' },
                    { key: 'namtruongsa' as IslandKey, label: 'Nam Trường Sa', color: '#26a69a' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => handleIslandClick(item.key)}
                      className="w-full flex items-center gap-2.5 hover:bg-white/5 rounded-lg px-2 py-1.5 transition text-left"
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <p className="text-[11px] font-bold truncate" style={{ color: item.color }}>{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sovereignty footer */}
          <div className="px-4 py-3 border-t border-[#1a3a6a] bg-[#0d1e3d]">
            <p className="text-yellow-400 text-[9px] font-black uppercase tracking-widest mb-1">CHỦ QUYỀN VIỆT NAM</p>
            <p className="text-blue-300 text-[10px] leading-relaxed">
              Hoàng Sa và Trường Sa là lãnh thổ không thể tách rời của CHXHCN Việt Nam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
