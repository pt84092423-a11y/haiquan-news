import { useState } from 'react';

const ZONES = [
  {
    id: 1, name: 'Vùng 1 Hải quân', hq: 'Hải Phòng', cx: 147, cy: 187,
    color: '#c0392b', bg: '#fdecea',
    cover: 'Vịnh Bắc Bộ, vùng biển Đông Bắc',
    ships: 'Tàu tên lửa, tàu pháo, tàu ngầm',
    desc: 'Quản lý vùng biển miền Bắc, Vịnh Bắc Bộ và các đảo phía Bắc.',
  },
  {
    id: 2, name: 'Vùng 2 Hải quân', hq: 'Đà Nẵng', cx: 181, cy: 401,
    color: '#1565C0', bg: '#e3f2fd',
    cover: 'Biển miền Trung, bờ biển miền Trung Việt Nam',
    ships: 'Tàu hộ vệ, tàu tuần tra, tàu đổ bộ',
    desc: 'Bảo vệ vùng biển miền Trung từ Quảng Bình đến Bình Định.',
  },
  {
    id: 3, name: 'Vùng 3 Hải quân', hq: 'Cam Ranh', cx: 205, cy: 591,
    color: '#2E7D32', bg: '#e8f5e9',
    cover: 'Vùng biển Nam Trung Bộ và Trường Sa',
    ships: 'Tàu tên lửa, tàu ngầm, tàu đặc công nước',
    desc: 'Phụ trách vùng biển Nam Trung Bộ và quần đảo Trường Sa.',
  },
  {
    id: 4, name: 'Vùng 4 Hải quân', hq: 'TP. Hồ Chí Minh', cx: 147, cy: 641,
    color: '#E65100', bg: '#fff3e0',
    cover: 'Vùng biển Đông Nam, cửa sông Mekong',
    ships: 'Tàu tuần tra, tàu pháo, tàu đặc nhiệm',
    desc: 'Quản lý vùng biển phía Đông Nam và các cửa sông vùng Đồng bằng sông Cửu Long.',
  },
  {
    id: 5, name: 'Vùng 5 Hải quân', hq: 'Phú Quốc', cx: 87, cy: 666,
    color: '#6A1B9A', bg: '#f3e5f5',
    cover: 'Vịnh Thái Lan, vùng biển Tây Nam và Hoàng Sa',
    ships: 'Tàu tên lửa, tàu tuần tra duyên hải, tàu ngầm',
    desc: 'Bảo vệ vùng biển Tây Nam, Vịnh Thái Lan và quần đảo Hoàng Sa.',
  },
];

const HOANG_SA_DOTS = [
  { cx: 256, cy: 375 }, { cx: 268, cy: 368 }, { cx: 275, cy: 382 },
  { cx: 261, cy: 390 }, { cx: 271, cy: 396 }, { cx: 249, cy: 385 },
];

const TRUONG_SA_DOTS = [
  { cx: 302, cy: 665 }, { cx: 315, cy: 658 }, { cx: 325, cy: 672 },
  { cx: 308, cy: 680 }, { cx: 318, cy: 688 }, { cx: 295, cy: 675 },
  { cx: 328, cy: 660 }, { cx: 310, cy: 650 },
];

const VIETNAM_PATH = `
M 62,117
C 75,114 87,112 87,113
C 96,111 108,90 119,79
C 130,68 140,76 148,142
C 158,148 167,152 175,157
L 165,175 L 147,187 L 140,210
L 127,234 L 125,262 L 125,285
L 130,305 L 143,318 L 145,340
L 152,360 L 157,372 L 165,385
L 172,393 L 181,401 L 185,415
L 192,435 L 198,460 L 203,490
L 203,505 L 204,525 L 203,548
L 202,573 L 205,591 L 198,603
L 190,618 L 178,632 L 174,643
L 162,653 L 153,659 L 145,668
L 133,681 L 119,697 L 106,718
L 104,738 L 95,728 L 87,710
L 87,695 L 91,680 L 99,657
L 108,638 L 112,617 L 113,595
L 111,572 L 108,548 L 105,523
L 101,498 L 97,472 L 92,447
L 87,422 L 83,397 L 79,372
L 75,347 L 71,322 L 67,297
L 64,272 L 61,247 L 59,222
L 57,197 L 55,172 L 54,150
L 54,138 L 57,127 L 62,117 Z
`;

const PHU_QUOC_PATH = `M 84,653 C 82,657 81,662 82,668 C 83,672 86,674 88,671 C 90,668 91,663 90,659 C 89,655 86,651 84,653 Z`;

export default function VietnamNavyMap() {
  const [activeZone, setActiveZone] = useState<typeof ZONES[0] | null>(null);
  const [activeIsland, setActiveIsland] = useState<string | null>(null);

  return (
    <div className="w-full bg-[#0a1628] rounded-2xl overflow-hidden shadow-2xl border border-[#1a3a6a]">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#0d2247] to-[#0059b2] flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-[15px] uppercase tracking-widest flex items-center gap-2">
            <span className="text-yellow-400">⚓</span> BẢN ĐỒ HẢI QUÂN NHÂN DÂN VIỆT NAM
          </h3>
          <p className="text-blue-200 text-[11px] mt-0.5">5 Vùng Hải quân · Quần đảo Hoàng Sa · Quần đảo Trường Sa</p>
        </div>
        <div className="text-right">
          <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-widest">SROV</p>
          <p className="text-blue-300 text-[9px]">Biển Đông là của Việt Nam</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* SVG Map */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-[500px]">
          <svg
            viewBox="40 60 340 710"
            className="w-full max-w-[360px] h-auto"
            style={{ filter: 'drop-shadow(0 0 20px rgba(0,120,255,0.3))' }}
          >
            {/* Ocean background */}
            <rect x="40" y="60" width="340" height="710" fill="#0d3a6b" rx="8" />

            {/* Grid lines (longitude/latitude feel) */}
            {[80, 120, 160, 200, 240, 280, 320, 360].map(x => (
              <line key={x} x1={x} y1="60" x2={x} y2="770" stroke="#0a4d8a" strokeWidth="0.5" opacity="0.4" />
            ))}
            {[100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750].map(y => (
              <line key={y} x1="40" y1={y} x2="380" y2={y} stroke="#0a4d8a" strokeWidth="0.5" opacity="0.4" />
            ))}

            {/* Gulf of Tonkin label area */}
            <text x="195" y="230" fill="#1a6ec5" fontSize="8" textAnchor="middle" fontWeight="bold" opacity="0.6">VỊNH BẮC BỘ</text>

            {/* South China Sea label */}
            <text x="290" y="480" fill="#1a6ec5" fontSize="9" textAnchor="middle" fontWeight="bold" opacity="0.6">BIỂN ĐÔNG</text>

            {/* Gulf of Thailand label */}
            <text x="68" y="720" fill="#1a6ec5" fontSize="7" textAnchor="middle" fontWeight="bold" opacity="0.5" transform="rotate(-15, 68, 720)">VỊNH THÁI LAN</text>

            {/* Vietnam mainland */}
            <path
              d={VIETNAM_PATH}
              fill="#1d5e2a"
              stroke="#2a8a38"
              strokeWidth="1"
            />

            {/* Phú Quốc island */}
            <path d={PHU_QUOC_PATH} fill="#1d5e2a" stroke="#2a8a38" strokeWidth="0.8" />

            {/* Naval zone sea coverage circles (subtle) */}
            {ZONES.map(zone => (
              <circle
                key={zone.id}
                cx={zone.id === 1 ? 220 : zone.id === 2 ? 260 : zone.id === 3 ? 280 : zone.id === 4 ? 200 : 65}
                cy={zone.id === 1 ? 220 : zone.id === 2 ? 430 : zone.id === 3 ? 590 : zone.id === 4 ? 660 : 720}
                r={zone.id === 5 ? 35 : 45}
                fill={zone.color}
                opacity="0.08"
              />
            ))}

            {/* Hoàng Sa (Paracel Islands) */}
            <g
              className="cursor-pointer"
              onClick={() => setActiveIsland(activeIsland === 'hoangsa' ? null : 'hoangsa')}
              style={{ transition: 'opacity 0.2s' }}
              opacity={activeIsland === 'hoangsa' ? 1 : 0.85}
            >
              <circle cx={262} cy={383} r="18" fill="#c0392b" opacity="0.15" />
              <circle cx={262} cy={383} r="13" fill="#c0392b" opacity="0.1" />
              {HOANG_SA_DOTS.map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r="3" fill="#ef5350" stroke="#fff" strokeWidth="0.5" />
              ))}
              <text x="262" y="413" fill="#ef9a9a" fontSize="6.5" textAnchor="middle" fontWeight="bold">HOÀNG SA</text>
              {activeIsland === 'hoangsa' && (
                <circle cx={262} cy={383} r="20" fill="none" stroke="#ef5350" strokeWidth="1.5" strokeDasharray="3 2" />
              )}
            </g>

            {/* Trường Sa (Spratly Islands) */}
            <g
              className="cursor-pointer"
              onClick={() => setActiveIsland(activeIsland === 'truongsa' ? null : 'truongsa')}
              opacity={activeIsland === 'truongsa' ? 1 : 0.85}
            >
              <circle cx={312} cy={670} r="22" fill="#f39c12" opacity="0.12" />
              {TRUONG_SA_DOTS.map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r="2.5" fill="#ffb74d" stroke="#fff" strokeWidth="0.4" />
              ))}
              <text x="312" y="700" fill="#ffcc80" fontSize="6" textAnchor="middle" fontWeight="bold">TRƯỜNG SA</text>
              {activeIsland === 'truongsa' && (
                <circle cx={312} cy={670} r="24" fill="none" stroke="#ffb74d" strokeWidth="1.5" strokeDasharray="3 2" />
              )}
            </g>

            {/* Zone markers on mainland/coast */}
            {ZONES.map(zone => (
              <g
                key={zone.id}
                className="cursor-pointer"
                onClick={() => setActiveZone(activeZone?.id === zone.id ? null : zone)}
                style={{ transition: 'all 0.2s' }}
              >
                <circle
                  cx={zone.cx}
                  cy={zone.cy}
                  r={activeZone?.id === zone.id ? 13 : 10}
                  fill={zone.color}
                  stroke="#fff"
                  strokeWidth="1.5"
                  style={{ filter: `drop-shadow(0 0 4px ${zone.color})` }}
                />
                <text x={zone.cx} y={zone.cy + 4} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">
                  V{zone.id}
                </text>
                {activeZone?.id === zone.id && (
                  <circle cx={zone.cx} cy={zone.cy} r="16" fill="none" stroke={zone.color} strokeWidth="1.5" strokeDasharray="3 2" />
                )}
              </g>
            ))}

            {/* Hà Nội capital marker */}
            <g>
              <polygon points="117,175 120,168 123,175" fill="#ffd700" />
              <text x="117" y="185" fill="#ffd700" fontSize="6" textAnchor="middle" fontWeight="bold">HÀ NỘI</text>
            </g>
          </svg>
        </div>

        {/* Info Panel */}
        <div className="lg:w-72 p-4 space-y-3 flex flex-col">
          {/* Zone info or default legend */}
          {activeZone ? (
            <div className="bg-[#0d2247] rounded-xl border p-4" style={{ borderColor: activeZone.color }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-[14px]" style={{ backgroundColor: activeZone.color }}>
                  V{activeZone.id}
                </div>
                <div>
                  <p className="text-white font-black text-[13px]">{activeZone.name}</p>
                  <p className="text-blue-300 text-[10px]">Sở chỉ huy: {activeZone.hq}</p>
                </div>
                <button onClick={() => setActiveZone(null)} className="ml-auto text-gray-400 hover:text-white text-lg leading-none">×</button>
              </div>
              <div className="space-y-2 text-[11px]">
                <div>
                  <p className="text-blue-400 font-bold uppercase tracking-wider mb-0.5">Khu vực phụ trách</p>
                  <p className="text-blue-100">{activeZone.cover}</p>
                </div>
                <div>
                  <p className="text-blue-400 font-bold uppercase tracking-wider mb-0.5">Lực lượng</p>
                  <p className="text-blue-100">{activeZone.ships}</p>
                </div>
                <div>
                  <p className="text-blue-400 font-bold uppercase tracking-wider mb-0.5">Nhiệm vụ</p>
                  <p className="text-blue-100">{activeZone.desc}</p>
                </div>
              </div>
            </div>
          ) : activeIsland === 'hoangsa' ? (
            <div className="bg-[#0d2247] rounded-xl border border-red-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">HS</span>
                </div>
                <div>
                  <p className="text-white font-black text-[13px]">Quần đảo Hoàng Sa</p>
                  <p className="text-red-300 text-[10px]">Biển Đông · Thuộc Việt Nam</p>
                </div>
                <button onClick={() => setActiveIsland(null)} className="ml-auto text-gray-400 hover:text-white text-lg">×</button>
              </div>
              <p className="text-blue-100 text-[11px] leading-relaxed">Quần đảo Hoàng Sa (Paracel Islands) là quần đảo thuộc chủ quyền của Việt Nam, gồm khoảng 30 đảo nhỏ, bãi đá và bãi cát ngầm ở Biển Đông. Tọa độ: 16°30'N, 112°00'E.</p>
            </div>
          ) : activeIsland === 'truongsa' ? (
            <div className="bg-[#0d2247] rounded-xl border border-yellow-700 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-yellow-600 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">TS</span>
                </div>
                <div>
                  <p className="text-white font-black text-[13px]">Quần đảo Trường Sa</p>
                  <p className="text-yellow-300 text-[10px]">Biển Đông · Thuộc Việt Nam</p>
                </div>
                <button onClick={() => setActiveIsland(null)} className="ml-auto text-gray-400 hover:text-white text-lg">×</button>
              </div>
              <p className="text-blue-100 text-[11px] leading-relaxed">Quần đảo Trường Sa (Spratly Islands) là quần đảo thuộc chủ quyền của Việt Nam, gồm hơn 100 đảo, bãi đá, bãi cạn. Hiện có đơn vị Hải quân Việt Nam đang đóng giữ nhiều đảo. Tọa độ: 8°38'N – 12°00'N, 111°30'E – 117°20'E.</p>
            </div>
          ) : (
            <div className="bg-[#0d2247] rounded-xl border border-[#1a4a8a] p-4">
              <p className="text-blue-300 text-[11px] font-bold uppercase tracking-wider mb-3">Chú giải</p>
              <p className="text-blue-200 text-[10px] mb-4 italic">Nhấn vào các điểm trên bản đồ để xem thông tin chi tiết</p>
              <div className="space-y-1.5">
                {ZONES.map(z => (
                  <button
                    key={z.id}
                    onClick={() => setActiveZone(z)}
                    className="w-full flex items-center gap-2.5 hover:bg-[#142d5e] rounded-lg px-2 py-1.5 transition text-left"
                  >
                    <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-black" style={{ backgroundColor: z.color }}>
                      {z.id}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-bold truncate">Vùng {z.id}</p>
                      <p className="text-blue-400 text-[9px] truncate">{z.hq}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#1a4a8a] space-y-1.5">
                <button onClick={() => setActiveIsland('hoangsa')} className="w-full flex items-center gap-2.5 hover:bg-[#142d5e] rounded-lg px-2 py-1.5 transition text-left">
                  <div className="w-5 h-5 rounded-full bg-red-700 flex-shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                  </div>
                  <p className="text-red-300 text-[11px] font-bold">Quần đảo Hoàng Sa</p>
                </button>
                <button onClick={() => setActiveIsland('truongsa')} className="w-full flex items-center gap-2.5 hover:bg-[#142d5e] rounded-lg px-2 py-1.5 transition text-left">
                  <div className="w-5 h-5 rounded-full bg-yellow-700 flex-shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                  </div>
                  <p className="text-yellow-300 text-[11px] font-bold">Quần đảo Trường Sa</p>
                </button>
              </div>
            </div>
          )}

          {/* Sovereignty statement */}
          <div className="bg-[#0d1e3d] rounded-xl border border-[#1a3a6a] px-4 py-3 mt-auto">
            <p className="text-yellow-400 text-[10px] font-black uppercase tracking-widest mb-1">CHỦ QUYỀN VIỆT NAM</p>
            <p className="text-blue-200 text-[10px] leading-relaxed">
              Quần đảo Hoàng Sa và Trường Sa là lãnh thổ không thể tách rời của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
