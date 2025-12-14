/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    
    // Ottimizzazione per PWA
    poweredByHeader: false,
    
    // Headers per PWA
    headers: async () => {
        return [
            {
                source: '/service-worker.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate'
                    },
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/'
                    }
                ]
            },
            {
                source: '/manifest.json',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/manifest+json'
                    },
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=3600'
                    }
                ]
            },
            {
                source: '/icons/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ]
            },
            {
                source: '/_next/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ]
            },
            {
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable'
                    }
                ]
            }
        ];
    },

    // Webpack per Web Workers
    webpack: (config, { isServer }) => {
        config.module.rules.push({
            test: /\.worker\.ts$/,
            use: { loader: 'worker-loader' }
        });

        return config;
    },

    // Abilita SWR (Static Website Rendering) per PWA
    onDemandEntries: {
        maxInactiveAge: 60 * 60 * 1000,
        pagesBufferLength: 5,
    },

    // Optimizzazione immagini
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 31536000,
    },

    // Revalidazione per ISR (Incremental Static Regeneration)
    revalidate: 3600,
}

module.exports = nextConfig

