import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = "Pradeep Classes | Top Coaching in Mathura for Class 1st to 12th",
  description = "Pradeep Classes offers dedicated coaching for Class 1st to 12th in Mathura. Specialized batches for Navodaya, Sainik School, and IIT/NEET Foundation. Empowering future leaders with expert faculty.",
  keywords = "Pradeep Classes, Mathura Coaching, Class 1 to 12, Navodaya Coaching Mathura, Sainik School Entrance, IIT Foundation Mathura, NEET Foundation, Pradeep Sir Mathura",
  canonical = "https://pradeepclasses.in/",
  ogTitle,
  ogDescription,
  ogImage = "https://lh3.googleusercontent.com/d/1-hFy2Dri6g1hYLcNGr0I6dmdg7m1lpG-",
  ogType = "website"
}) => {
  const siteTitle = "Pradeep Classes";
  const fullTitle = title.includes(siteTitle) ? title : `${title} | ${siteTitle}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (JSON-LD) - LocalBusiness */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Pradeep Classes",
          "description": description,
          "url": "https://pradeepclasses.in/",
          "logo": "https://lh3.googleusercontent.com/d/1-hFy2Dri6g1hYLcNGr0I6dmdg7m1lpG-",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Near Goverdhan Chauraha",
            "addressLocality": "Mathura",
            "addressRegion": "Uttar Pradesh",
            "postalCode": "281001",
            "addressCountry": "IN"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+91-8126180408",
            "contactType": "customer service"
          },
          "sameAs": [
            "https://facebook.com/pradeepclassesmathura",
            "https://www.instagram.com/pradeepclasses07"
          ]
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
