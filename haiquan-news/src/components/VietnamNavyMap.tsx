import { useState } from 'react';

// Image actual size: 795 x 988 px
const ZONES = [
  {
    id: 1, name: 'Vùng 1 Hải quân', hq: 'Hải Phòng', cx: 112, cy: 134,
    color: '#e53935',
    cover: 'Vịnh Bắc Bộ, vùng biển Đông Bắc',
    ships: 'Tàu tên lửa, tàu pháo, tàu ngầm',
    desc: 'Quản lý vùng biển miền Bắc, Vịnh Bắc Bộ và các đảo phía Bắc.',
  },
  {
    id: 2, name: 'Vùng 2 Hải quân', hq: 'Đà Nẵng', cx: 143, cy: 314,
    color: '#1e88e5',
    cover: 'Biển miền Trung, bờ biển miền Trung Việt Nam',
    ships: 'Tàu hộ vệ, tàu tuần tra, tàu đổ bộ',
    desc: 'Bảo vệ vùng biển miền Trung từ Quảng Bình đến Bình Định.',
  },
  {
    id: 3, name: 'Vùng 3 Hải quân', hq: 'Cam Ranh', cx: 163, cy: 439,
    color: '#43a047',
    cover: 'Vùng biển Nam Trung Bộ và Trường Sa',
    ships: 'Tàu tên lửa, tàu ngầm, tàu đặc công nước',
    desc: 'Phụ trách vùng biển Nam Trung Bộ và quần đảo Trường Sa.',
  },
  {
    id: 4, name: 'Vùng 4 Hải quân', hq: 'TP. Hồ Chí Minh', cx: 163, cy: 535,
    color: '#fb8c00',
    cover: 'Vùng biển Đông Nam, cửa sông Mekong',
    ships: 'Tàu tuần tra, tàu pháo, tàu đặc nhiệm',
    desc: 'Quản lý vùng biển phía Đông Nam và các cửa sông vùng Đồng bằng sông Cửu Long.',
  },
  {
    id: 5, name: 'Vùng 5 Hải quân', hq: 'Phú Quốc', cx: 88, cy: 602,
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
      {/* Header */}
      <div className="px-5 py-3 bg-gradient-to-r from-[#0d2247] via-[#003580] to-[#0059b2] flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-white font-black text-[14px] uppercase tracking-widest flex items-center gap-2">
            <span className="text-yellow-400 text-lg">⚓</span>
            BẢN ĐỒ HẢI QUÂN NHÂN DÂN VIỆT NAM
          </h3>
          <p className="text-blue-200 text-[11px] mt-0.5">5 Vùng Hải quân · Hoàng Sa · Trường Sa · Biển Đông</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">SROV</p>
          <p className="text-blue-300 text-[9px]">Biển Đông là của Việt Nam</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Geographic Map with SVG overlay */}
        <div className="flex-1 relative bg-[#0a1628]">
          <svg
            viewBox="0 0 795 988"
            className="w-full h-auto block"
            style={{ display: 'block' }}
          >
            {/* Geographic map image as base */}
            <image
              href="/vietnam-sea-map.jpg"
              x="0" y="0"
              width="795" height="988"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Semi-transparent dark overlay to improve contrast of markers */}
            <rect x="0" y="0" width="795" height="988" fill="rgba(0,0,0,0.08)" />

            {/* Clickable: Vịnh Bắc Việt ellipse (cy scaled to 988px image) */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('vinhbacbo')} opacity={activeIsland === 'vinhbacbo' ? 1 : 0.7}>
              <ellipse cx="195" cy="228" rx="72" ry="82"
                fill={activeIsland === 'vinhbacbo' ? 'rgba(92,107,192,0.35)' : 'rgba(92,107,192,0.18)'}
                stroke={activeIsland === 'vinhbacbo' ? '#7986cb' : 'rgba(121,134,203,0.5)'}
                strokeWidth={activeIsland === 'vinhbacbo' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'vinhbacbo' ? '' : '6 3'}
              />
              {activeIsland === 'vinhbacbo' && (
                <text x="195" y="232" fill="#c5cae9" fontSize="9" textAnchor="middle" fontWeight="bold">VỊNH BẮC BỘ</text>
              )}
            </g>

            {/* Clickable: Hoàng Sa ellipse */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('hoangsa')} opacity={activeIsland === 'hoangsa' ? 1 : 0.75}>
              <ellipse cx="218" cy="355" rx="82" ry="58"
                fill={activeIsland === 'hoangsa' ? 'rgba(229,57,53,0.35)' : 'rgba(229,57,53,0.15)'}
                stroke={activeIsland === 'hoangsa' ? '#ef5350' : 'rgba(239,83,80,0.55)'}
                strokeWidth={activeIsland === 'hoangsa' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'hoangsa' ? '' : '6 3'}
              />
              {activeIsland === 'hoangsa' && (
                <text x="218" y="359" fill="#ffcdd2" fontSize="9" textAnchor="middle" fontWeight="bold">HOÀNG SA</text>
              )}
            </g>

            {/* Clickable: Trường Sa ellipse */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('truongsa')} opacity={activeIsland === 'truongsa' ? 1 : 0.75}>
              <ellipse cx="348" cy="633" rx="96" ry="70"
                fill={activeIsland === 'truongsa' ? 'rgba(251,140,0,0.35)' : 'rgba(251,140,0,0.15)'}
                stroke={activeIsland === 'truongsa' ? '#ffa726' : 'rgba(255,167,38,0.55)'}
                strokeWidth={activeIsland === 'truongsa' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'truongsa' ? '' : '6 3'}
              />
              {activeIsland === 'truongsa' && (
                <text x="348" y="637" fill="#ffe0b2" fontSize="9" textAnchor="middle" fontWeight="bold">TRƯỜNG SA</text>
              )}
            </g>

            {/* Clickable: Nam Trường Sa ellipse */}
            <g className="cursor-pointer" onClick={() => handleIslandClick('namtruongsa')} opacity={activeIsland === 'namtruongsa' ? 1 : 0.7}>
              <ellipse cx="128" cy="796" rx="116" ry="62"
                fill={activeIsland === 'namtruongsa' ? 'rgba(0,137,123,0.35)' : 'rgba(0,137,123,0.15)'}
                stroke={activeIsland === 'namtruongsa' ? '#26a69a' : 'rgba(38,166,154,0.5)'}
                strokeWidth={activeIsland === 'namtruongsa' ? 2 : 1.5}
                strokeDasharray={activeIsland === 'namtruongsa' ? '' : '6 3'}
              />
              {activeIsland === 'namtruongsa' && (
                <text x="128" y="800" fill="#b2dfdb" fontSize="9" textAnchor="middle" fontWeight="bold">NAM TRƯỜNG SA</text>
              )}
            </g>

            {/* 5 Naval Zone markers on Vietnam coast */}
            {ZONES.map(zone => (
              <g
                key={zone.id}
                className="cursor-pointer"
                onClick={() => handleZoneClick(zone)}
              >
                {/* Pulse ring when active */}
                {activeZone?.id === zone.id && (
                  <circle cx={zone.cx} cy={zone.cy} r="17"
                    fill="none" stroke={zone.color} strokeWidth="2" opacity="0.6"
                    strokeDasharray="4 2"
                  />
                )}
                <circle
                  cx={zone.cx} cy={zone.cy}
                  r={activeZone?.id === zone.id ? 13 : 11}
                  fill={zone.color}
                  stroke="#fff"
                  strokeWidth="1.5"
                  style={{ filter: `drop-shadow(0 0 5px ${zone.color}99)` }}
                />
                <text x={zone.cx} y={zone.cy + 4} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">
                  V{zone.id}
                </text>
                {/* Zone label on hover/active */}
                {activeZone?.id === zone.id && (
                  <text
                    x={zone.cx + (zone.cx < 200 ? 16 : -16)}
                    y={zone.cy}
                    fill={zone.color}
                    fontSize="7"
                    fontWeight="bold"
                    textAnchor={zone.cx < 200 ? 'start' : 'end'}
                    style={{ filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }}
                  >
                    {zone.hq}
                  </text>
                )}
              </g>
            ))}

            {/* Touch-hint dots on island ellipses (visible indicator) */}
            <circle cx="218" cy="370" r="3" fill="#ef5350" opacity="0.9" className="pointer-events-none" />
            <circle cx="350" cy="660" r="3" fill="#ffa726" opacity="0.9" className="pointer-events-none" />
            <circle cx="195" cy="240" r="3" fill="#7986cb" opacity="0.9" className="pointer-events-none" />
            <circle cx="130" cy="830" r="3" fill="#26a69a" opacity="0.9" className="pointer-events-none" />
          </svg>

          {/* Interaction hint */}
          <div className="absolute bottom-2 left-2 text-[10px] text-white/60 pointer-events-none">
            Nhấn vào các vùng để xem thông tin
          </div>
        </div>

        {/* Info Panel */}
        <div className="lg:w-[280px] flex flex-col bg-[#0a1628] border-t lg:border-t-0 lg:border-l border-[#1a3a6a]">
          <div className="flex-1 p-4 space-y-3">
            {/* Active zone or island info */}
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
              /* Legend / default view */
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
