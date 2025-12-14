'use client';

import { useEffect } from 'react';

/**
 * useSWUpdater Hook
 * 
 * Hook per la gestione degli aggiornamenti del Service Worker.
 * Viene usato nel layout per verificare e installare aggiornamenti.
 */
export function useSWUpdater() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Registra il service worker con scope completo
    navigator.serviceWorker
      .register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none', // Non usare cache per il manifest del SW
      })
      .then((registration) => {
        console.log('[PWA] Service Worker registered successfully');

        // Verifica aggiornamenti immediatamente e poi periodicamente
        const checkForUpdates = async () => {
          try {
            await registration.update();
            console.log('[PWA] Checked for updates');
          } catch (error) {
            console.error('[PWA] Error checking for updates:', error);
          }
        };

        // Controlla subito
        checkForUpdates();

        // Controlla ogni 30 minuti
        const interval = setInterval(checkForUpdates, 30 * 60 * 1000);

        // Controlla quando il tab diventa attivo
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            checkForUpdates();
          }
        });

        // Cleanup
        return () => clearInterval(interval);
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });

    // Listener per i messaggi dal Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { data } = event;

      if (data?.type === 'SW_UPDATED') {
        console.log('[PWA] Update notification received');
        // Questo è gestito da PWAUpdater component
      }

      if (data?.type === 'CACHE_UPDATED') {
        console.log('[PWA] Cache updated:', data.url);
      }
    });
  }, []);
}
