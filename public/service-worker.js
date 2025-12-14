/**
 * Pentagramma Service Worker
 * 
 * Strategie di caching:
 * - Network-first per risorse dinamiche (API, dati)
 * - Cache-first per risorse statiche (JS, CSS, immagini)
 * - Stale-while-revalidate per dati
 * 
 * Auto-update: Verifica aggiornamenti ogni volta che il SW viene registrato
 */

const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  STATIC: `pentagramma-static-${CACHE_VERSION}`,
  DYNAMIC: `pentagramma-dynamic-${CACHE_VERSION}`,
  API: `pentagramma-api-${CACHE_VERSION}`,
};

// Risorse statiche da preloaded
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/globals.css',
];

/**
 * Install: Preload risorse statiche
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_NAMES.STATIC);
  
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.warn('[Service Worker] Error caching static assets:', error);
      });
    })
  );
  
  // Forza l'attivazione immediata del nuovo SW
  self.skipWaiting();
});

/**
 * Activate: Pulizia cache vecchie
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Elimina cache vecchie
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Forza il client a usare il nuovo SW immediatamente
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'SW_UPDATED',
        message: 'New version available',
      });
    });
  });
});

/**
 * Fetch: Strategie di caching intelligenti
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignora richieste esterne non autorizzate
  if (url.origin !== self.location.origin) {
    return;
  }

  // API: Stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Risorse statiche (JS, CSS, immagini): Cache-first
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Documenti HTML: Network-first
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: Network-first
  event.respondWith(networkFirst(request));
});

/**
 * Cache-first: Prova cache, fallback a network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[Cache] HIT (Cache-first):', request.url);
    return cached;
  }

  try {
    console.log('[Network] FETCH (Cache-first):', request.url);
    const response = await fetch(request);

    // Salva in cache se la risposta è valida
    if (response && response.status === 200) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    console.error('[Offline] Error (Cache-first):', request.url, error);
    // Ritorna una pagina offline se disponibile
    return cache.match('/offline') || new Response('Offline');
  }
}

/**
 * Network-first: Prova network, fallback a cache
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAMES.DYNAMIC);

  try {
    console.log('[Network] FETCH (Network-first):', request.url);
    const response = await fetch(request);

    // Salva in cache se valida
    if (response && response.status === 200) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
    }

    return response;
  } catch (error) {
    console.warn('[Cache] FALLBACK (Network-first):', request.url);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Fallback offline
    console.error('[Offline] Error (Network-first):', request.url, error);
    return new Response('Network request failed and no cache available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

/**
 * Stale-while-revalidate: Ritorna cache subito, aggiorna in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAMES.API);
  const cached = await cache.match(request);

  // Ritorna cache subito
  if (cached) {
    console.log('[Cache] HIT (Stale-while-revalidate):', request.url);

    // Aggiorna in background
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
        // Notifica i client di un aggiornamento
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'CACHE_UPDATED',
              url: request.url,
            });
          });
        });
      }
    });
  } else {
    // Prova network se non in cache
    try {
      console.log('[Network] FETCH (Stale-while-revalidate):', request.url);
      const response = await fetch(request);

      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      console.error('[Offline] Error (Stale-while-revalidate):', request.url);
      return new Response('API request failed', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
  }

  return cached || new Response('Not found', { status: 404 });
}

/**
 * Sync in background (futura implementazione)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-scores') {
    event.waitUntil(syncScores());
  }
});

async function syncScores() {
  console.log('[Background Sync] Syncing scores...');
  // Implementare sincronizzazione dei dati quando si torna online
}

/**
 * Message handler per comunicazione client-SW
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting activated');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[Service Worker] Clearing all caches...');
    caches.keys().then((names) => {
      names.forEach((name) => caches.delete(name));
    });
  }
});

console.log('[Service Worker] Loaded');
