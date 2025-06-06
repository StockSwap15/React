import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

export function SEO({
  title = 'StockSwap - OEM Powersports Dealer Network',
  description = 'Connect OEM Powersports dealers to manage and transfer inventory.',
  image = '/assets/share-image.png',
  url = import.meta.env.VITE_APP_URL,
  type = 'website'
}: SEOProps) {
  const siteTitle = 'StockSwap';
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* OpenGraph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* PWA */}
      <meta name="theme-color" content="#2563eb" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="mask-icon" href="/vite.svg" color="#2563eb" />
      <meta name="msapplication-TileColor" content="#2563eb" />

      {/* Preconnect */}
      <link rel="preconnect" href="https://yxwdictklewqytcsqyjt.supabase.co" crossOrigin="" />
      <link rel="dns-prefetch" href="https://yxwdictklewqytcsqyjt.supabase.co" />
    </Helmet>
  );
}