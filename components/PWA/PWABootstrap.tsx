'use client';

import { useSWUpdater } from '@/hooks/useSWUpdater';

/**
 * PWABootstrap Component
 * 
 * Componente che inizializza la PWA nel layout.
 * Gestisce la registrazione del Service Worker e gli aggiornamenti.
 */
export default function PWABootstrap() {
  useSWUpdater();

  return null;
}
