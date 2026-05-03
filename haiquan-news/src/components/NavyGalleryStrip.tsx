import gameImg1 from '@assets/image_1774966333834.png';
import gameImg2 from '@assets/image_1774966348252.png';
import gameImg3 from '@assets/image_1774966365837.png';
import gameImg4 from '@assets/image_1774966375907.png';

const IMGS = [
  { src: gameImg1, alt: 'SROV - Hải quân tuần tra' },
  { src: gameImg2, alt: 'SROV - Đài quan sát' },
  { src: gameImg3, alt: 'SROV - Đội hình lính biển' },
  { src: gameImg4, alt: 'SROV - Lực lượng thiết giáp' },
];

export default function NavyGalleryStrip() {
  return (
    <div className="w-full bg-white py-5 border-t border-b border-gray-100">
      <div className="container mx-auto max-w-[1200px] px-4">
        <div className="grid grid-cols-4 gap-3">
          {IMGS.map((img, i) => (
            <div key={i} className="overflow-hidden rounded-sm shadow-sm aspect-[4/3] relative group">
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
