interface SectionTitleProps {
  title: string;
  className?: string;
  light?: boolean;
}

export default function SectionTitle({ title, className = '', light = false }: SectionTitleProps) {
  const textColor = light ? 'text-white' : 'text-[#0059b2]';
  const barColor1 = light ? 'bg-white' : 'bg-[#0059b2]';
  return (
    <h2 className={`font-['Cinzel',serif] ${textColor} text-[18px] font-bold uppercase mb-4 flex items-center tracking-wide ${className}`}>
      <div className="flex mr-2 flex-shrink-0">
        <div className={`w-[6px] h-[20px] ${barColor1} -skew-x-[20deg] mr-[3px]`}></div>
        <div className="w-[6px] h-[20px] bg-sky-300 -skew-x-[20deg]"></div>
      </div>
      {title}
    </h2>
  );
}
