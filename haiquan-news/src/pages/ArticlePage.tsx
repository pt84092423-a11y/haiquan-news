import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import SEOHead from '@/components/SEOHead';
import SectionTitle from '@/components/SectionTitle';
import WebsiteLinks from '@/components/WebsiteLinks';
import { getPostBySlug, getPublishedPosts, incrementViewCount, type Post } from '@/lib/supabase';
import { formatDateLong, timeAgo } from '@/lib/utils';

const PLACEHOLDER = 'https://via.placeholder.com/800x500/00305f/ffffff?text=Hải+Quân';

export default function ArticlePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';
  const [post, setPost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [mostRead, setMostRead] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fontSize, setFontSize] = useState(15);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    getPostBySlug(slug).then(async data => {
      if (!data) { setNotFound(true); setLoading(false); return; }
      setPost(data);
      setLoading(false);
      incrementViewCount(data.id);

      const [related, popular] = await Promise.all([
        getPublishedPosts({ categorySlug: data.category?.slug, limit: 8 }),
        getPublishedPosts({ limit: 8 }),
      ]);
      setRelatedPosts((related || []).filter(p => p.id !== data.id).slice(0, 8));
      const sorted = [...(popular || [])].sort((a, b) => b.view_count - a.view_count);
      setMostRead(sorted.filter(p => p.id !== data.id).slice(0, 8));
    });
  }, [slug]);

  if (notFound) {
    return (
      <div className="container mx-auto max-w-[1200px] px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-[#0059b2] mb-4">Không tìm thấy bài viết</h1>
        <p className="text-[#555555]">Bài viết không tồn tại hoặc đã bị xóa.</p>
        <Link href="/" className="mt-6 inline-block text-[#0059b2] font-bold hover:underline">← Về trang chủ</Link>
      </div>
    );
  }

  return (
    <>
      {post && (
        <SEOHead
          title={post.meta_title || post.title}
          description={post.meta_description || post.excerpt}
          ogImage={post.og_image || post.thumbnail}
        />
      )}

      <main className="flex-grow pt-8 pb-12">
        <div className="container mx-auto max-w-[1200px] px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            <article className="lg:col-span-8 pr-0 lg:pr-4">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                  <div className="h-8 bg-gray-100 rounded w-full" />
                  <div className="h-8 bg-gray-100 rounded w-3/4" />
                  <div className="aspect-video bg-gray-100 rounded" />
                  <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}</div>
                </div>
              ) : post ? (
                <>
                  <div className="flex flex-wrap items-center text-[12px] text-[#888888] font-['Roboto',sans-serif] mb-4 gap-2">
                    {post.category && (
                      <>
                        <Link href={`/${post.category.slug}`} className="text-[#0059b2] font-bold uppercase hover:underline">
                          {post.category.name}
                        </Link>
                        <span>|</span>
                      </>
                    )}
                    <span>{formatDateLong(post.published_at || post.created_at).toUpperCase()}</span>
                    <span>|</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.view_count.toLocaleString()}
                    </span>
                  </div>

                  <h1 className="font-['Playfair_Display',serif] text-[28px] md:text-[34px] font-bold text-[#222222] leading-tight mb-5">
                    {post.title}
                  </h1>

                  {post.excerpt && (
                    <p className="font-['Roboto',sans-serif] font-bold text-[15px] text-[#222222] leading-relaxed mb-6">
                      {post.excerpt}
                    </p>
                  )}

                  {post.thumbnail && (
                    <figure className="mb-6">
                      <img src={post.thumbnail} alt={post.title} className="w-full h-auto rounded-[2px]" />
                    </figure>
                  )}

                  <div className="flex items-center gap-2 mb-4 text-[12px] text-[#555555]">
                    <span>Cỡ chữ:</span>
                    <button onClick={() => setFontSize(f => Math.max(12, f - 1))} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold">A-</button>
                    <button onClick={() => setFontSize(f => Math.min(22, f + 1))} className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded flex items-center justify-center font-bold">A+</button>
                  </div>

                  <div
                    className="article-content font-['Roboto',sans-serif] text-[#333333] leading-relaxed mb-6"
                    style={{ fontSize: `${fontSize}px` }}
                    dangerouslySetInnerHTML={{ __html: post.content || '' }}
                  />

                  {post.author && (
                    <div className="text-right font-bold font-['Roboto',sans-serif] text-[14px] text-[#222222] mt-6 mb-8">
                      {post.author}
                    </div>
                  )}

                  <div className="bg-gray-50 border-t border-b border-[#e1e1e1] py-3 px-4 text-center text-[13px] text-[#555555] italic mb-6">
                    <svg className="w-4 h-4 inline-block mr-1 text-[#0059b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Bài viết, video, hình ảnh đóng góp vui lòng gửi về:{' '}
                    <a href="mailto:pt84092423@gmail.com" className="font-bold text-[#0059b2] hover:underline">pt84092423@gmail.com</a>
                  </div>

                  <div className="flex items-center justify-between border-b border-[#e1e1e1] pb-6 mb-8">
                    <span className="text-[13px] text-[#555555] font-bold">Chia sẻ:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                        className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-80 transition"
                        title="Chia sẻ Facebook"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </button>
                      <button className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center hover:opacity-80 transition text-[12px] font-bold">Z</button>
                      <button onClick={() => window.print()} className="w-8 h-8 rounded-full bg-gray-200 text-[#555555] flex items-center justify-center hover:bg-gray-300 transition" title="In bài viết">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      </button>
                    </div>
                  </div>

                  {relatedPosts.length > 0 && (
                    <div>
                      <h3 className="font-['Playfair_Display',serif] text-[20px] font-black uppercase text-[#0059b2] mb-5 flex items-center">
                        <div className="flex mr-2">
                          <div className="w-[4px] h-[16px] bg-[#0059b2] -skew-x-[20deg] mr-[2px]" />
                          <div className="w-[4px] h-[16px] bg-sky-300 -skew-x-[20deg]" />
                        </div>
                        TIN LIÊN QUAN
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {relatedPosts.map(p => (
                          <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group cursor-pointer block">
                            <div className="aspect-[3/2] overflow-hidden rounded-[2px] mb-2">
                              <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                            </div>
                            <h4 className="font-['Roboto',sans-serif] font-bold text-[13px] text-[#222222] group-hover:text-[#0059b2] leading-snug line-clamp-3">{p.title}</h4>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </article>

            <aside className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="mb-8">
                <SectionTitle title="TIN ĐỌC NHIỀU" className="text-[20px]" />
                <ul className="flex flex-col">
                  {mostRead.map((p, i) => (
                    <li key={p.id}>
                      <Link href={`/bai-viet/${p.slug}`} className="flex gap-4 py-3 border-b border-dashed border-[#e1e1e1] group cursor-pointer items-start">
                        <div className="font-['Playfair_Display',serif] text-[32px] text-[#aed1ef] font-black leading-none mt-1 w-6 text-center">{i + 1}</div>
                        <h4 className="font-['Roboto',sans-serif] text-[14px] font-bold text-[#222222] leading-snug group-hover:text-[#0059b2] flex-1">{p.title}</h4>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-8">
                <SectionTitle title="LIÊN KẾT WEBSITE" className="text-[20px]" />
                <WebsiteLinks />
              </div>

              <div className="mb-8">
                <SectionTitle title="TIN MỚI NHẤT" className="text-[20px]" />
                <div className="flex flex-col gap-4">
                  {relatedPosts.slice(0, 5).map(p => (
                    <Link key={p.id} href={`/bai-viet/${p.slug}`} className="flex gap-3 group cursor-pointer">
                      <img src={p.thumbnail || PLACEHOLDER} alt={p.title} className="w-[80px] h-[55px] object-cover rounded-[2px] flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-['Roboto',sans-serif] text-[13px] font-bold text-[#222222] group-hover:text-[#0059b2] leading-snug">{p.title}</h4>
                        <span className="text-[11px] text-[#888888]">{timeAgo(p.published_at || p.created_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <a href="#" className="block hover:opacity-95 transition">
                  <img src="/quangcao-101.png" className="w-full rounded-sm shadow-md" alt="Gia nhập Hải quân đánh bộ 101" />
                </a>
                <a href="#" className="block hover:opacity-95 transition">
                  <img src="/quangcao-954.png" className="w-full rounded-sm shadow-md" alt="Gia nhập Phi đội Không quân Hải quân 954th" />
                </a>
              </div>
            </aside>
          </div>
        </div>

        {/* Full-width TIN LIÊN QUAN section - styled like reference */}
        {relatedPosts.length > 0 && !loading && (
          <div className="bg-[#f5f5f5] border-t border-gray-200 mt-8 py-8">
            <div className="container mx-auto max-w-[1200px] px-4">
              <h2 className="font-['Playfair_Display',serif] text-[22px] font-black uppercase text-[#222] mb-6 flex items-center gap-3">
                <div className="flex gap-[3px]">
                  <div className="w-[5px] h-[22px] bg-[#0059b2] -skew-x-[20deg]" />
                  <div className="w-[5px] h-[22px] bg-sky-400 -skew-x-[20deg]" />
                </div>
                TIN LIÊN QUAN
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {relatedPosts.slice(0, 6).map(p => (
                  <Link key={p.id} href={`/bai-viet/${p.slug}`} className="group block bg-white rounded-sm shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer">
                    <div className="aspect-[3/2] overflow-hidden">
                      <img
                        src={p.thumbnail || PLACEHOLDER}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                    <div className="p-3">
                      {p.category && (
                        <span className="inline-block text-[10px] font-bold uppercase text-[#0059b2] bg-[#0059b2]/10 px-2 py-0.5 rounded mb-1.5">{p.category.name}</span>
                      )}
                      <h3 className="font-['Roboto',sans-serif] font-bold text-[14px] text-[#222] group-hover:text-[#0059b2] leading-snug line-clamp-3">{p.title}</h3>
                      <p className="text-[11px] text-gray-400 mt-1.5">{formatDateLong(p.published_at || p.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex justify-center mt-7">
                <Link
                  href={post?.category?.slug ? `/${post.category.slug}` : '/'}
                  className="inline-flex items-center gap-2 px-8 py-2.5 border border-gray-400 text-[#444] text-[13px] font-bold hover:border-[#0059b2] hover:text-[#0059b2] hover:bg-[#0059b2]/5 transition rounded-sm"
                >
                  Xem thêm
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
