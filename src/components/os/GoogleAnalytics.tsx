import React from 'react';
import Script from 'next/script';

/**
 * GoogleAnalytics - Production GA4 integration with IP anonymization.
 */
export const GoogleAnalytics = ({ gaId }: { gaId: string }) => {
  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
};
