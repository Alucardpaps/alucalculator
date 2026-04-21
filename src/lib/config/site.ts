/**
 * Site Configuration
 * Handles environment-based URL management for secure API communication.
 */

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const siteConfig = {
    name: 'AluCalc OS',
    description: 'Engineering Intelligence Platform',
    url: SITE_URL,
    ogImage: `${SITE_URL}/og-image.png`,
    links: {
        twitter: 'https://twitter.com/alucalculator',
        github: 'https://github.com/alucalculator',
    },
};
