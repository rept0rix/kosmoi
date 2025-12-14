import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function SEO({
    title = "Kosmoi - Samui's Intelligent City Guide",
    description = "Discover Koh Samui with Kosmoi. The all-in-one platform for hotels, dining, professionals, and AI-powered trip planning.",
    image = "/kosmoi_cover_bg.png",
    url = "https://kosmoi.com",
    type = "website"
}) {
    const siteTitle = title.includes("Kosmoi") ? title : `${title} | Kosmoi`;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{siteTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={siteTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />
        </Helmet>
    );
}
