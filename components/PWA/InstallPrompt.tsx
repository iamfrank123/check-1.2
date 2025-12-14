
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import styles from './InstallPrompt.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * InstallPrompt Component
 * 
 * Mostra un banner non invasivo che invita l'utente a installare la PWA.
 * Gestisce:
 * - beforeinstallprompt event (Chrome, Edge, Firefox)
 * - Fallback per Safari (istruzioni manuali)
 * - Persistenza della scelta dell'utente
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [installAttempts, setInstallAttempts] = useState<number>(0);

  useEffect(() => {
    // Rileva se è mobile
    const userAgent = typeof window !== 'undefined' ? navigator.userAgent : '';
    const isios = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    setIsMobile(isios || isAndroid);

    // Rileva Safari
    const isSafariBrowser = /Safari/.test(userAgent) && !/Chrome|Chromium|OPR/.test(userAgent);
    setIsSafari(isSafariBrowser);

    // Verifica se già promosso nelle ultime 24 ore
    const lastPromptTime = localStorage.getItem('pwa-prompt-time');
    if (lastPromptTime) {
      const hoursSincePrompt = (Date.now() - parseInt(lastPromptTime)) / (1000 * 60 * 60);
      if (hoursSincePrompt < 24) {
        return;
      }
    }

    // Ascolta beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
      localStorage.setItem('pwa-prompt-time', Date.now().toString());
      console.log('[PWA] beforeinstallprompt fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Ascolta appinstalled per tracciare installazioni
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setDeferredPrompt(null);
      setShowPrompt(false);
      localStorage.setItem('pwa-installed', 'true');
      localStorage.removeItem('pwa-prompt-time');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    setInstallAttempts((prev) => prev + 1);

    try {
      // Mostra il prompt nativo
      await deferredPrompt.prompt();

      // Ascolta la scelta dell'utente
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted installation');
        setDeferredPrompt(null);
        setShowPrompt(false);
        localStorage.setItem('pwa-installed', 'true');
      } else {
        console.log('[PWA] User dismissed installation');
        // Mostra di nuovo dopo 7 giorni
        localStorage.setItem('pwa-prompt-time', Date.now().toString());
      }
    } catch (error) {
      console.error('[PWA] Installation error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-time', Date.now().toString());
  };

  const handleSafariInstall = () => {
    alert(
      'Per installare Pentagramma su iOS:\n\n1. Tocca il pulsante Condividi\n2. Scorri e seleziona "Aggiungi alla schermata Home"\n3. Tocca "Aggiungi"\n\nPer macOS Safari:\n1. Menu → File → "Aggiungi a Dock"'
    );
  };

  // Mostra prompt solo su mobile con supporto PWA
  if (!showPrompt || !isMobile) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.banner}>
        <div className={styles.content}>
          <div className={styles.icon}>📱</div>
          <div className={styles.text}>
            <h3 className={styles.title}>Installa Pentagramma</h3>
            <p className={styles.description}>
              {isSafari
                ? 'Accedi offline e ricevi notifiche'
                : 'Accedi offline, avvio veloce e migliore esperienza'}
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          {isSafari ? (
            <>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={handleSafariInstall}
              >
                Come installare
              </button>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleDismiss}
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={handleInstall}
                disabled={!deferredPrompt}
              >
                Installa
              </button>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={handleDismiss}
              >
                Dopo
              </button>
            </>
          )}
        </div>
      </div>

      {installAttempts > 2 && (
        <div className={styles.hint}>
          💡 Usa il menu del browser per installare più tardi
        </div>
      )}
    </div>
  );
}
