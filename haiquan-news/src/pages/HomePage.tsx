import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import PostCard from '@/components/PostCard';
import WebsiteLinks from '@/components/WebsiteLinks';
import { getPublishedPosts, type Post } from '@/lib/supabase';

const PLACEHOLDER = 'https://via.placeholder.com/800x500/00305f/ffffff?text=Báo+Hải+Quân';

export default function HomePage() {
  const [spotlight, setSpotlight] = useState<Post[]>([]);
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [newPosts, setNewPosts] = useState<Post[]>([]);
  const [mostRead, setMostRead] = useState<Post[]>([]);
  const [generalPosts, setGeneralPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [podcastPosts, setPodcastPosts] = useState<Post[]>([]);
  const [videoPosts, setVideoPosts] = useState<Post[]>([]);
  const [shortVideos, setShortVideos] = useState<Post[]>([]);
  const [latestBaoIn, setLatestBaoIn] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    async function load() {
      const [all, media, shorts, podcasts, baoIn] = await Promise.all([
        getPublishedPosts({ limit: 30 }),
        getPublishedPosts({ postType: 'video', limit: 6 }),
        getPublishedPosts({ postType: 'video', limit: 5 }),
        getPublishedPosts({ postType: 'podcast', limit: 4 }),
        getPublishedPosts({ postType: 'baoin', limit: 1 }),
      ]);
      const posts = all || [];
      const articles = posts.filter(p => p.post_type !== 'baoin');
      setSpotlight(articles.slice(0, 3));
      setNewPosts(articles.slice(0, 4));
      const sorted = [...articles].sort((a, b) => b.view_count - a.view_count);
      setMostRead(sorted.slice(0, 6));
      setGeneralPosts(articles.slice(3, 7));
      setMediaPosts((media || []).slice(0, 4));
      setPodcastPosts((podcasts || []).slice(0, 4));
      setVideoPosts((media || []).slice(0, 3));
      setShortVideos((shorts || []).slice(0, 5));
      setLatestBaoIn((baoIn || [])[0] || null);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (spotlight.length > 1) {
      intervalRef.current = setInterval(() => {
        setFeaturedIdx(i => (i + 1) % spotlight.length);
      }, 5000);
    }
    return () => clearInterval(intervalRef.current);
  }, [spotlight]);

  const featured = spotlight[featuredIdx];

  // Helper class để đồng bộ style tiêu đề in đậm, có chân, in hoa
  const headingStyle = "font-serif font-bold uppercase text-[#0059b2] tracking-tight";

  return (
    <>
      <SEOHead />
      <div className="container mx-auto max-w-[1200px] px-4 py-6">

        {/* Row 1: TIÊU ĐIỂM + Featured + TIN MỚI */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-[#e1e1e1]">
          
          {/* Tiêu điểm */}
          <aside className="md:col-span-3">
            <SectionTitle title="TIÊU ĐIỂM" className={headingStyle} />
            {loading ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : spotlight.length > 0 ? (
              <>
                <PostCard post={spotlight[0]} variant="featured" className="mb-5 border-b border-[#e1e1e1] pb-4" />
                {spotlight.slice(1).map(p => <PostCard key={p.id} post={p} variant="small" />)}
              </>
            ) : <p className="text-sm text-gray-400">Chưa có bài viết</p>}
          </aside>

          {/* Featured Carousel */}
          <div className="md:col-span-6 px-0 md:px-2">
            {loading ? (
              <div className="aspect-video bg-gray-100 rounded animate-pulse mb-4" />
            ) : featured ? (
              <Link href={`/bai-viet/${featured.slug}`} className="group cursor-pointer block">
                <div className="overflow-hidden rounded-[2px] mb-4 relative">
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center z-10 shadow text-[#0059b2] font-bold"
                    onClick={e => { e.preventDefault(); setFeaturedIdx(i => (i - 1 + spotlight.length) % spotlight.length); }}
                  >&lt;</button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center z-10 shadow text-[#0059b2] font-bold"
                    onClick={e => { e.preventDefault(); setFeaturedIdx(i => (i + 1) % spotlight.length); }}
                  >&gt;</button>
                  <img src={featured.thumbnail || PLACEHOLDER} alt={featured.title} className="w-full h-auto object-cover transform transition duration-500 group-hover:scale-105" />
                </div>
                <h2 className="font-['Roboto',sans-serif] text-[28px] font-bold leading-tight text-[#222222] mb-3 group-hover:text-[#0059b2] transition-colors">
                  {featured.title}
                </h2>
                <p className="font-['Roboto',sans-serif] text-[15px] text-[#555555] leading-relaxed">
                  {featured.excerpt}
                </p>
              </Link>
            ) : (
              <div className="flex items-center justify-center h-[300px] bg-gray-50 text-gray-400 rounded">Chưa có bài viết nổi bật</div>
            )}
          </div>

          {/* Tin mới */}
          <aside className="md:col-span-3">
            <SectionTitle title="TIN MỚI" className={headingStyle} />
            <ul className="flex flex-col">
              {loading
                ? [...Array(4)].map((_, i) => <li key={i} className="h-16 bg-gray-100 rounded animate-pulse mb-2" />)
                : newPosts.map((p, i) => (
                  <li key={p.id}>
                    <Link href={`/bai-viet/${p.slug}`} className="flex gap-4 py-3.5 border-b border-dashed border-[#e1e1e1] group cursor-pointer items-start">
                      <div className="font-['Playfair_Display',serif] text-[40px] text-[#aed1ef] font-black leading-none mt-1">{i + 1}</div>
                      <h4 className="font-['Roboto',sans-serif] text-[15px] font-bold text-[#222222] leading-snug group-hover:text-[#0059b2]">{p.title}</h4>
                    </Link>
                  </li>
                ))
              }
            </ul>
          </aside>
        </div>

        {/* Banner */}
        <div className="my-8">
          <a href="#" className="block w-full rounded-sm overflow-hidden shadow-md cursor-pointer hover:opacity-95 transition">
            <img src="https://baohaiquanvietnam.vn/storage/users/user_12/2025/TH%C3%81NG%2011/14/z7226029114068_f556938a4a781dddde927265a1a30a65.jpg" alt="Banner Cổ Động" className="w-full h-auto object-cover" />
          </a>
        </div>

        {/* Row 2: TIN ĐỌC NHIỀU + General + Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 pb-6 border-b border-[#e1e1e1]">
          <aside className="md:col-span-3">
            <SectionTitle title="TIN ĐỌC NHIỀU" className={headingStyle} />
            <ul className="flex flex-col">
              {loading
                ? [...Array(6)].map((_, i) => <li key={i} className="h-12 bg-gray-100 rounded animate-pulse mb-2" />)
                : mostRead.map((p, i) => <PostCard key={p.id} post={p} variant="numbered" index={i + 1} />)
              }
            </ul>
          </aside>

          <div className="md:col-span-6 px-0 md:px-2 flex flex-col gap-6">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded animate-pulse" />)
              : generalPosts.map(p => <PostCard key={p.id} post={p} variant="horizontal" />)
            }
          </div>

          <aside className="md:col-span-3">
            <div className="mb-8">
              <SectionTitle title="ĐỌC BÁO IN" className={headingStyle} />
              <Link href="/bao-in" className="bg-[#f2f7fb] p-4 rounded-md border border-blue-100 flex flex-col cursor-pointer group block">
                <h4 className="font-['Roboto',sans-serif] font-bold text-[#0059b2] text-[15px] mb-1">Báo in Hải quân</h4>
                <p className="text-[11px] text-[#555555] mb-3">Số mới nhất</p>
                <div className="shadow-md group-hover:scale-105 transition duration-300 border border-[#e1e1e1]">
                  {loading ? (
                    <div className="w-full aspect-[3/4] bg-gray-200 animate-pulse" />
                  ) : latestBaoIn?.thumbnail ? (
                    <img src={latestBaoIn.thumbnail} alt={latestBaoIn.title || 'Báo In'} className="w-full h-auto" />
                  ) : (
                    <div className="w-full aspect-[3/4] flex flex-col items-center justify-center bg-[#e8f0fa] text-[#0059b2]">
                      <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-[12px] opacity-50">Chưa có báo in</span>
                    </div>
                  )}
                </div>
                {latestBaoIn && (
                  <p className="text-[12px] text-[#55] mt-2 line-clamp-2">{latestBaoIn.title}</p>
                )}
              </Link>
            </div>
            <div className="mb-8">
              <SectionTitle title="LIÊN KẾT WEBSITE" className={headingStyle} />
              <WebsiteLinks />
            </div>
            <div>
              <a href="#" className="block hover:opacity-95 transition">
                <img src="/quangcao-101.png" className="w-full h-auto shadow-md rounded-sm" alt="Gia nhập Hải quân đánh bộ 101" />
              </a>
            </div>
          </aside>
        </div>

        {/* ĐA PHƯƠNG TIỆN */}
        <section className="bg-[#f2f7fb] rounded-xl p-4 md:p-6 mb-8 shadow-sm border border-blue-100">
          <div className="flex flex-col md:flex-row md:items-center mb-6 pb-3 border-b-2 border-white">
            <SectionTitle title="ĐA PHƯƠNG TIỆN" className={`text-[24px] mr-8 mb-0 ${headingStyle}`} />
            <div className="flex gap-4 md:gap-6 mt-3 md:mt-0 font-['Roboto',sans-serif] font-bold text-[14px] text-[#0059b2]">
              <Link href="/longform" className="hover:text-[#00305f] transition uppercase">Longform</Link>
              <span className="text-blue-200">|</span>
              <Link href="/podcast" className="hover:text-[#00305f] transition uppercase">Podcast</Link>
              <span className="text-blue-200">|</span>
              <Link href="/phong-su-anh" className="hover:text-[#00305f] transition uppercase">Phóng sự ảnh</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mediaPosts[0] && (
              <Link href={`/bai-viet/${mediaPosts[0].slug}`} className="group cursor-pointer block">
                <div className="overflow-hidden rounded-md aspect-[16/10] relative shadow-md">
                  <span className="absolute bottom-4 left-4 bg-[#00305f] text-white text-xs font-bold px-2 py-1 rounded-sm z-10 uppercase">
                    {mediaPosts[0].post_type === 'podcast' ? 'Podcast' : 'Video'}
                  </span>
                  <img src={mediaPosts[0].thumbnail || PLACEHOLDER} alt={mediaPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <h3 className="font-['Roboto',sans-serif] text-[18px] font-bold text-[#222222] mt-3 group-hover:text-[#0059b2]">{mediaPosts[0].title}</h3>
              </Link>
            )}
            {!mediaPosts[0] && !loading && (
              <div className="flex items-center justify-center aspect-[16/10] bg-gray-100 rounded-md text-gray-400 uppercase">Chưa có nội dung</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {mediaPosts.slice(1, 5).map(p => <PostCard key={p.id} post={p} variant="video" />)}
            </div>
          </div>
        </section>

        {/* PODCAST */}
        <section className="mb-8 border-b border-[#e1e1e1] pb-8">
          <div className="flex items-center justify-between mb-4">
            <SectionTitle title="PODCAST" className={`text-[24px] ${headingStyle}`} />
            <Link href="/podcast" className="text-[13px] font-bold text-[#0059b2] hover:underline flex items-center gap-1 uppercase">
              Xem thêm
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loading
              ? [...Array(4)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />)
              : podcastPosts.length > 0
                ? podcastPosts.map(p => (
                    <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group cursor-pointer block rounded-xl overflow-hidden bg-[#0059b2] shadow-md hover:shadow-xl transition">
                      <div className="relative aspect-square overflow-hidden">
                        <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#003580]/80 to-transparent" />
                        <div className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm rounded-full p-1.5">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a11 11 0 1 0 0 22A11 11 0 0 0 12 1zm-2 15V8l7 4-7 4z" /></svg>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-[11px] text-white/60 mb-1 uppercase font-bold tracking-wide">{p.category?.name || 'Podcast'}</p>
                        <h4 className="font-['Roboto',sans-serif] text-[13px] font-bold text-white leading-snug line-clamp-2 group-hover:text-[#FFD700] transition">{p.title}</h4>
                        <p className="text-[11px] text-white/50 mt-1.5">{p.view_count ? `${p.view_count.toLocaleString()} lượt phát` : '—'}</p>
                      </div>
                    </Link>
                  ))
                : [...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl overflow-hidden bg-[#0059b2] shadow-md opacity-60">
                      <div className="relative aspect-square bg-[#003a7a] flex items-center justify-center">
                        <svg className="w-12 h-12 text-white/30" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1a11 11 0 1 0 0 22A11 11 0 0 0 12 1zm-2 15V8l7 4-7 4z" /></svg>
                      </div>
                      <div className="p-3">
                        <p className="text-[11px] text-white/40 mb-1 uppercase font-bold tracking-wide">Podcast</p>
                        <div className="h-3 bg-white/10 rounded w-3/4 mb-1" />
                        <div className="h-3 bg-white/10 rounded w-1/2" />
                      </div>
                    </div>
                  ))
            }
          </div>
        </section>

        {/* HẢI QUÂN MEDIA */}
        <section className="mb-8 border-b border-[#e1e1e1] pb-8">
          <SectionTitle title="HẢI QUÂN MEDIA" className={`text-[24px] ${headingStyle}`} />
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-9">
              {videoPosts[0] && (
                <Link href={`/bai-viet/${videoPosts[0].slug}`} className="relative aspect-video rounded-md overflow-hidden shadow-lg group cursor-pointer mb-4 block">
                  <img src={videoPosts[0].thumbnail || PLACEHOLDER} alt={videoPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </div>
                </Link>
              )}
              <div className="grid grid-cols-3 gap-4">
                {videoPosts.slice(1, 4).map(p => (
                  <Link key={p.id} href={`/bai-viet/${p.slug}`} className="flex gap-2 group cursor-pointer">
                    <div className="w-1/2 relative aspect-video rounded-sm overflow-hidden flex-shrink-0">
                      <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="w-1/2 font-['Roboto',sans-serif] text-[13px] font-bold text-[#222222] group-hover:text-[#0059b2]">{p.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
            <div className="md:col-span-3">
              <a href="#" className="block hover:opacity-95 transition">
                <img src="/quangcao-101.png" className="w-full h-auto rounded-md shadow-md" alt="Gia nhập Hải quân đánh bộ 101" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* SHORT VIDEO section */}
      <div className="w-full bg-[#0059b2] pt-10 pb-12 shadow-inner">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="mb-12">
            <SectionTitle title="SHORT VIDEO" light className="text-[24px] font-serif font-bold uppercase mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {loading
                ? [...Array(5)].map((_, i) => <div key={i} className="aspect-[9/16] bg-[#004b87] rounded-lg animate-pulse" />)
                : shortVideos.map(p => (
                  <Link key={p.id} href={`/bai-viet/${p.slug}`} className="relative aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer shadow-lg border border-white/10">
                    <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    <h4 className="absolute bottom-3 left-3 right-3 text-white font-['Roboto',sans-serif] font-bold text-[14px] leading-tight">{p.title}</h4>
                  </Link>
                ))
              }
            </div>
          </div>

          {/* TRUYỀN HÌNH HẢI QUÂN */}
          <div>
            <SectionTitle title="TRUYỀN HÌNH HẢI QUÂN" light className="text-[24px] font-serif font-bold uppercase mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8">
                {videoPosts[0] ? (
                  <Link href={`/bai-viet/${videoPosts[0].slug}`} className="relative aspect-video rounded-md overflow-hidden group cursor-pointer border border-white/20 shadow-lg block">
                    <img src={videoPosts[0].thumbnail || PLACEHOLDER} alt={videoPosts[0].title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4">
                      <h3 className="text-white font-bold text-[18px]">{videoPosts[0].title}</h3>
                    </div>
                  </Link>
                ) : (
                  <div className="aspect-video bg-[#001540] rounded-md flex items-center justify-center text-white/40 uppercase">Chưa có video</div>
                )}
              </div>
              <div className="md:col-span-4 flex flex-col gap-4">
                {videoPosts.slice(1, 4).map(p => (
                  <Link key={p.id} href={`/bai-viet/${p.slug}`} className="flex gap-3 group cursor-pointer">
                    <div className="w-[120px] flex-shrink-0 relative aspect-video rounded-sm overflow-hidden">
                      <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="font-['Roboto',sans-serif] text-[13px] font-bold text-white/80 group-hover:text-[#FFD700] leading-snug">{p.title}</h4>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
