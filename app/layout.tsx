import './globals.css'
import type { Metadata, Viewport } from 'next'
import InstallPrompt from '@/components/PWA/InstallPrompt'
import PWAUpdater from '@/components/PWA/PWAUpdater'
import PWABootstrap from '@/components/PWA/PWABootstrap'

export const metadata: Metadata = {
    title: 'Pentagramma - Interactive MIDI Piano Trainer',
    description: 'Learn piano with real-time MIDI feedback and digital sheet music. Practice solfege, rhythms, and melodic patterns.',
    manifest: '/manifest.json',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Pentagramma',
    },
    formatDetection: {
        telephone: false,
    },
    openGraph: {
        title: 'Pentagramma - Interactive MIDI Piano Trainer',
        description: 'Learn piano with real-time MIDI feedback and digital sheet music',
        type: 'website',
        locale: 'it_IT',
    },
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    colorScheme: 'light dark',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="it" suppressHydrationWarning>
            <head>
                {/* Colore barra di stato */}
                <meta name="theme-color" content="#1a1a1a" />
                <meta name="msapplication-TileColor" content="#1a1a1a" />
                <meta name="msapplication-navbutton-color" content="#1a1a1a" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="Pentagramma" />
                
                {/* Icone per Apple */}
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
                
                {/* Favicon */}
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <link rel="shortcut icon" href="/favicon.ico" />
                
                {/* Preconnect per performance */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
            </head>
            <body>
                {children}
                <InstallPrompt />
                <PWAUpdater />
                <PWABootstrap />
            </body>
        </html>
    )
}
