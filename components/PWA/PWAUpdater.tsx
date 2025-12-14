'use client';

import { useEffect, useState } from 'react';
import styles from './PWAUpdater.module.css';

/**
 * PWAUpdater Component
 * 
 * Gestisce gli aggiornamenti automatici del Service Worker:
 * - Verifica aggiornamenti al caricamento
 * - Notifica l'utente quando disponibile una nuova versione
 * - Permette di aggiornare immediatamente (skip waiting)
 * - Auto-refresh dopo l'aggiornamento
 */
export default function PWAUpdater() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newWorker, setNewWorker] = useState<ServiceWorker | null>(null);
  const [isUpdateInProgress, setIsUpdateInProgress] = useState(false);

  useEffect(() => {
    // Registra il service worker solo in produzione
    if (typeof window === 'undefined') {
      return;
    }

    if ('serviceWorker' in navigator) {
      // Registra il SW
      navigator.serviceWorker
        .register('/service-worker.js', { scope: '/' })
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);

          // Ascolta gli aggiornamenti
          registration.addEventListener('updatefound', handleUpdateFound);

          // Verifica aggiornamenti ogni ora
          const updateInterval = setInterval(
            () => {
              registration.update().catch((error) => {
                console.error('[PWA] Error checking for updates:', error);
              });
            },
            60 * 60 * 1000 // 1 ora
          );

          return () => clearInterval(updateInterval);
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Ascolta i messaggi dal SW
      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }
  }, []);

  const handleUpdateFound = () => {
    const registration = navigator.serviceWorker?.controller?.container;
    if (!registration) {
      console.log('[PWA] Update found event triggered');
      // Forza la verifica degli aggiornamenti
      navigator.serviceWorker?.controller?.postMessage({
        type: 'SKIP_WAITING',
      });
    }
  };

  const handleSWMessage = (event: ExtendableMessageEvent) => {
    const { data } = event;

    // Notifica di update disponibile
    if (data?.type === 'SW_UPDATED') {
      console.log('[PWA] New version available');
      setUpdateAvailable(true);

      // Cattura il nuovo SW
      const registration = navigator.serviceWorker?.controller?.container;
      if (registration) {
        const newWorker = registration.installing || registration.waiting;
        if (newWorker) {
          setNewWorker(newWorker);
        }
      }
    }

    // Notifica cache aggiornata
    if (data?.type === 'CACHE_UPDATED') {
      console.log('[PWA] Cache updated for:', data.url);
    }
  };

  const handleUpdate = async () => {
    if (!newWorker) {
      return;
    }

    setIsUpdateInProgress(true);

    try {
      // Comunica al nuovo SW di saltare l'attesa
      newWorker.postMessage({ type: 'SKIP_WAITING' });

      // Ascolta il cambio del controller
      let updateInstalled = false;
      const handleControllerChange = () => {
        if (!updateInstalled) {
          updateInstalled = true;
          console.log('[PWA] Update installed, reloading...');
          // Ricarica la pagina per usare la nuova versione
          window.location.reload();
        }
      };

      navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

      // Timeout di sicurezza
      setTimeout(() => {
        if (!updateInstalled) {
          console.log('[PWA] Update timeout, forcing reload');
          window.location.reload();
        }
      }, 5000);
    } catch (error) {
      console.error('[PWA] Update error:', error);
      setIsUpdateInProgress(false);
    }
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    setNewWorker(null);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.content}>
          <div className={styles.icon}>🔄</div>
          <div className={styles.text}>
            <h3 className={styles.title}>Aggiornamento disponibile</h3>
            <p className={styles.description}>
              Una nuova versione di Pentagramma è disponibile
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.primary}`}
            onClick={handleUpdate}
            disabled={isUpdateInProgress}
          >
            {isUpdateInProgress ? 'Aggiornamento...' : 'Aggiorna ora'}
          </button>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={handleDismiss}
            disabled={isUpdateInProgress}
          >
            Dopo
          </button>
        </div>
      </div>
    </div>
  );
}
