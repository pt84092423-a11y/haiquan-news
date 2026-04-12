import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

const SITE_NAME = 'Báo Hải Quân Việt Nam - SROV';
const SITE_DOMAIN = 'baohaiquansrov.xo.je';
const DEFAULT_DESC = 'Cơ quan ngôn luận của Quân chủng Hải quân Nhân dân Việt Nam';
const DEFAULT_IMG = 'https://media.discordapp.net/attachments/882932839153299486/1486310006247788595/Copy_of_Bao_Hai_Quan_ND.png?ex=69c5098f&is=69c3b80f&hm=86a45653b0c39f0abf41bf21a3fabd5412a20880a1517a9ee8054fa437d710e8&=&format=webp&quality=lossless&width=619&height=203';

export default function SEOHead({ title, description, ogImage, ogUrl, ogType = 'website' }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const img = ogImage || DEFAULT_IMG;
  const url = ogUrl || `https://${SITE_DOMAIN}${window.location.pathname}`;

  useEffect(() => {
    document.title = fullTitle;
    setMeta('description', desc);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', desc, true);
    setMeta('og:image', img, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', url, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:site', '@SROVNavy36');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', desc);
    setMeta('twitter:image', img);
  }, [fullTitle, desc, img, url, ogType]);

  return null;
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
