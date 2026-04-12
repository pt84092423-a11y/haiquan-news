  import { Link } from 'wouter';
  import type { Post } from '@/lib/supabase';
  import { timeAgo, truncate } from '@/lib/utils';
  
  const PLACEHOLDER = 'https://via.placeholder.com/400x260/00305f/ffffff?text=Hải+Quân';
  
  interface PostCardProps {
    post: Post;
    variant?: 'featured' | 'horizontal' | 'small' | 'numbered' | 'video';
    index?: number;
    className?: string;
  }
  
  export default function PostCard({ post, variant = 'horizontal', index, className = '' }: PostCardProps) {
    const href = `/bai-viet/${post.slug}`;
    const img = post.thumbnail || PLACEHOLDER;
  
    if (variant === 'featured') {
      return (
        <Link href={href} className={`group cursor-pointer block ${className}`}>
          <div className="overflow-hidden rounded-[2px] mb-3 relative aspect-[3/2]">
            <img src={img} alt={post.title} className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105" />
          </div>
          <h3 className="font-['Roboto',sans-serif] text-[16px] font-bold leading-snug text-[#222222] group-hover:text-[#0059b2] transition-colors">
            {post.title}
          </h3>
        </Link>
      );
    }
  
    if (variant === 'numbered') {
      return (
        <Link href={href} className={`flex gap-4 py-3 border-b border-dashed border-[#e1e1e1] group cursor-pointer items-start last:border-b-0 ${className}`}>
          <div className="font-['Playfair_Display',serif] text-[32px] text-[#aed1ef] font-black leading-none mt-1">{index}</div>
          <h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] leading-tight group-hover:text-[#0059b2]">{post.title}</h4>
        </Link>
      );
    }
  
    if (variant === 'small') {
      return (
        <Link href={href} className={`flex gap-3 group cursor-pointer mb-3 border-b border-[#e1e1e1] pb-3 last:border-b-0 ${className}`}>
          <img src={img} alt={post.title} className="w-[100px] h-[65px] object-cover rounded-[2px] flex-shrink-0" />
          <h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] leading-tight group-hover:text-[#0059b2]">{post.title}</h4>
        </Link>
      );
    }
  
    if (variant === 'video') {
      return (
        <Link href={href} className={`group cursor-pointer block ${className}`}>
          <div className="overflow-hidden rounded-md aspect-video relative shadow-sm">
            <span className="absolute bottom-2 left-2 bg-[#00305f] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm z-10">
              {post.post_type === 'podcast' ? 'Podcast' : 'Video'}
            </span>
            <img src={img} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
          </div>
          <h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] mt-2 leading-snug group-hover:text-[#0059b2]">
            {truncate(post.title, 70)}
          </h4>
        </Link>
      );
    }
  
    return (
      <Link href={href} className={`flex flex-col md:flex-row gap-4 group cursor-pointer border-b border-[#e1e1e1] pb-5 last:border-b-0 last:pb-0 ${className}`}>
        <div className="w-full md:w-[220px] flex-shrink-0 overflow-hidden rounded-[2px] relative aspect-[3/2]">
          <img src={img} alt={post.title} className="w-full h-full object-cover transform transition duration-500 group-hover:scale-105" />
        </div>
        <div className="flex-1">
          <span className="text-[11px] text-[#555555] font-['Roboto',sans-serif] uppercase mb-1 block">
            {post.category?.name || 'Tin tức'}
          </span>
          <h3 className="font-['Roboto',sans-serif] text-[17px] font-bold leading-snug text-[#222222] group-hover:text-[#0059b2] transition-colors mb-2">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-[13px] text-[#555555] font-['Roboto',sans-serif] line-clamp-3">{post.excerpt}</p>
          )}
          <span className="text-[11px] text-[#888888] mt-1 block">{timeAgo(post.published_at || post.created_at)}</span>
        </div>
      </Link>
    );
  }
  
