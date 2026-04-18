import { Helmet } from 'react-helmet';

interface SEOProps {
  title?: string;
  description?: string;
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
const DEFAULT_IMG = 'https://media.discordapp.net/attachments/882932839153299486/1486310006247788595/Copy_of_Bao_Hai_Quan_ND.png?ex=69c5098f&is=69c3b80f&hm=86a45653b0c39f0abf41bf21a3fabd5412a20880';

export default function SEOHead({ 
  title, 
  description, 
  ogImage, 
  ogUrl, 
  ogType = 'website',
  author,
  publishedDate,
  modifiedDate,
  tags,
  canonicalUrl
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || DEFAULT_DESC;
  const img = ogImage || DEFAULT_IMG;
  const url = canonicalUrl || ogUrl || `https://${SITE_DOMAIN}${typeof window !== 'undefined' ? window.location.pathname : ''}`;

  return (
    <Helmet>
      {/* Page Title */}
      <title>{fullTitle}</title>
      
      {/* Standard Meta Tags */}
      <meta name="description" content={desc} />
      <meta name="theme-color" content="#0059b2" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content="vi_VN" />
      
      {/* Article-specific Meta Tags */}
      {ogType === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedDate && <meta property="article:published_time" content={publishedDate} />}
          {modifiedDate && <meta property="article:modified_time" content={modifiedDate} />}
          {tags && <meta property="article:tag" content={tags} />}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@SROVNavy36" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {author && <meta name="twitter:creator" content={author} />}
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
    </Helmet>
  );
}
