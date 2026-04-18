import React from 'react';
import { Helmet } from 'react-helmet';

const SEOHead = ({ title, description, image, url, publishedTime, modifiedTime, author, tags }) => (
  <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={image} />
    <meta property="og:url" content={url} />
    <meta property="og:type" content="article" />
    <meta property="article:published_time" content={publishedTime} />
    <meta property="article:modified_time" content={modifiedTime} />
    <meta property="article:author" content={author} />
    <meta property="article:tag" content={tags} />
  </Helmet>
);

export default SEOHead;
