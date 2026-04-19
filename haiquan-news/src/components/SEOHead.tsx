import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  tags?: string;
  canonicalUrl?: string;
}

const SITE_NAME = 'Báo Hải Quân Việt Nam - SROV';
const SITE_DOMAIN = 'baohaiquansrov.xo.je';
const DEFAULT_DESC = 'Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam';
const DEFAULT_IMG = `https://${SITE_DOMAIN}/opengraph.jpg`;

export default function SEOHead({
  title,
  description,
  ogTitle,
  ogImage,
  ogUrl,
  ogType = 'website',
  author,
  publishedDate,
  modifiedDate,
  tags,
  canonicalUrl,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const openGraphTitle = ogTitle ? `${ogTitle} | ${SITE_NAME}` : fullTitle;
  const desc = description || DEFAULT_DESC;
  const img = ogImage || DEFAULT_IMG;
  const url = canonicalUrl || ogUrl || `https://${SITE_DOMAIN}${window.location.pathname}`;

  useEffect(() => {
    document.title = fullTitle;

    setMeta('description', desc);
    setMeta('author', author || SITE_NAME);
    setMeta('theme-color', '#0059b2');

    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:title', openGraphTitle, true);
    setMeta('og:description', desc, true);
    setMeta('og:image', img, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:image:alt', openGraphTitle, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', url, true);
    setMeta('og:locale', 'vi_VN', true);

    if (ogType === 'article') {
      if (author) setMeta('article:author', author, true);
      if (publishedDate) setMeta('article:published_time', publishedDate, true);
      if (modifiedDate) setMeta('article:modified_time', modifiedDate, true);
      if (tags) setMeta('article:tag', tags, true);
    }

    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:site', '@SROVNavy36');
    setMeta('twitter:title', openGraphTitle);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', img);
    if (author) setMeta('twitter:creator', author);

    setCanonical(url);
  }, [fullTitle, openGraphTitle, desc, img, url, ogType, author, publishedDate, modifiedDate, tags]);

  return null;
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}
