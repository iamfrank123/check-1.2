# PWA Implementation Guide - Pentagramma

## Panoramica

Questo documento descrive l'implementazione completa della Progressive Web App (PWA) per Pentagramma, con supporto per:
- Installazione su mobile e desktop
- Sincronizzazione offline
- Aggiornamenti automatici
- Deploy su Vercel e GitHub Pages

## Struttura dei file

```
project/
├── public/
│   ├── manifest.json              # Metadati dell'app
│   ├── service-worker.js          # Service Worker con caching
│   ├── icons/                     # Icone app (192x192, 384x384, 512x512)
│   ├── screenshots/               # Screenshot app
│   └── favicon.ico
├── components/
│   └── PWA/
│       ├── InstallPrompt.tsx      # Banner di installazione
│       ├── InstallPrompt.module.css
│       ├── PWAUpdater.tsx         # Notifica aggiornamenti
│       ├── PWAUpdater.module.css
│       └── PWABootstrap.tsx       # Bootstrap PWA nel layout
├── hooks/
│   └── useSWUpdater.ts            # Hook per aggiornamenti SW
├── app/
│   └── layout.tsx                 # Root layout con PWA integration
├── next.config.js                 # Configurazione Next.js per PWA
└── vercel.json                    # Configurazione Vercel
```

## Funzionalità implementate

### 1. Manifest.json
**File:** `public/manifest.json`

Definisce i metadati dell'app:
- Nome e descrizione
- Icone per diversi dispositivi
- Shortcut per accesso rapido
- Share target per condivisione
- Tema e colori

**Cosa fa:**
- Permette l'installazione dell'app su home screen
- Definisce il nome dell'app in modalità standalone
- Specifica le icone per app launcher

### 2. Service Worker
**File:** `public/service-worker.js`

Implementa strategie di caching intelligenti:

#### Strategie:
- **Cache-first**: Risorse statiche (JS, CSS, immagini, font)
- **Network-first**: Documenti HTML (sempre aggiornati)
- **Stale-while-revalidate**: API e dati dinamici

#### Funzionalità:
- Preload di risorse statiche durante install
- Pulizia automatica di cache vecchie durante activate
- Sincronizzazione in background
- Comunicazione con il client tramite postMessage
- Support per offline mode

**Cache busting:**
Ogni deploy di Vercel crea una nuova versione del SW, forzando il refresh della cache.

### 3. InstallPrompt Component
**File:** `components/PWA/InstallPrompt.tsx`

Banner non invasivo che mostra:
- Icona dell'app
- Messaggio di invito all'installazione
- Pulsante "Installa"

**Funzionalità:**
- Gestisce l'evento `beforeinstallprompt`
- Fallback per Safari (istruzioni manuali)
- Salva la scelta dell'utente per 24 ore
- Non mostra se l'app è già installata
- Responsive design mobile-first

**Comportamento:**
1. Mostra quando disponibile (non su desktop desktop)
2. Se l'utente rifiuta, non mostra per 24 ore
3. Su Safari iOS, mostra istruzioni manuali
4. Scompare dopo l'installazione

### 4. PWAUpdater Component
**File:** `components/PWA/PWAUpdater.tsx`

Notifica gli aggiornamenti disponibili:

**Funzionalità:**
- Riceve messaggi dal Service Worker quando è disponibile una nuova versione
- Mostra notifica "Aggiornamento disponibile"
- Permette l'aggiornamento immediato o posticipato
- Auto-refresh dopo l'aggiornamento
- Timeout di sicurezza (5 secondi)

**Flusso:**
1. Un nuovo SW registra un aggiornamento
2. Invia messaggio `SW_UPDATED` al client
3. PWAUpdater mostra la notifica
4. Utente clicca "Aggiorna ora"
5. `skipWaiting()` attiva il nuovo SW
6. Pagina si ricarica automaticamente

### 5. Hook useSWUpdater
**File:** `hooks/useSWUpdater.ts`

Gestisce la registrazione e gli aggiornamenti del SW:

**Responsabilità:**
- Registrazione del SW con `updateViaCache: 'none'`
- Verifica aggiornamenti ogni 30 minuti
- Verifica quando il tab diventa attivo
- Listening per messaggi del SW

### 6. Configurazione Next.js
**File:** `next.config.js`

Headers di cache per Vercel:
- `/service-worker.js`: `max-age=0, must-revalidate` (sempre aggiornato)
- `/manifest.json`: `max-age=3600` (1 ora)
- `/_next/static/*`: `max-age=31536000, immutable` (1 anno)
- `/icons/*`: `max-age=31536000, immutable` (1 anno)

### 7. Configurazione Vercel
**File:** `vercel.json`

Configurazione per il deployment:
- Headers di cache identici a next.config.js
- Redirect per `/service-worker` → `/service-worker.js`
- Build command configurato

## Flusso di aggiornamento (auto-update)

```
1. Dev fa un push su GitHub
   ↓
2. Vercel deploya automaticamente la nuova versione
   ↓
3. next.config.js serve il nuovo service-worker.js (no cache)
   ↓
4. SW registrato nel browser controlla gli aggiornamenti (ogni 30 min o quando attivo)
   ↓
5. SW finds updateViaCache: 'none' → fetch nuova versione
   ↓
6. Se diverso dal vecchio SW, invia messaggio SW_UPDATED al client
   ↓
7. PWAUpdater mostra notifica "Aggiornamento disponibile"
   ↓
8. Utente clicca "Aggiorna ora" o auto-update dopo timeout
   ↓
9. skipWaiting() attiva il nuovo SW immediatamente
   ↓
10. Pagina si ricarica e usa la nuova versione
   ↓
11. Cache vecchie vengono eliminate durante activate
```

## Strategie di Caching Dettagliate

### Cache-first (Risorse statiche)
```javascript
1. Controlla cache
2. Se presente, ritorna dalla cache
3. Se assente, fetch dalla rete
4. Salva in cache e ritorna
5. Se offline e non in cache, ritorna errore
```

### Network-first (Documenti HTML)
```javascript
1. Prova fetch dalla rete
2. Se successo, salva in cache e ritorna
3. Se fallisce, controlla cache
4. Se in cache, ritorna dalla cache
5. Se offline e non in cache, ritorna errore
```

### Stale-while-revalidate (API/Dati)
```javascript
1. Controlla cache
2. Se presente, ritorna subito dalla cache
3. In background, fetch dalla rete
4. Se nuova versione, salva in cache e notifica client
5. Se offline, ritorna cache se disponibile
```

## Comportamento su diversi browser

### Chrome/Edge
✅ Completo supporto PWA
- Evento `beforeinstallprompt`
- Install on home screen
- Modalità standalone
- Notifiche push

### Firefox
✅ Supporto PWA
- Evento `beforeinstallprompt`
- Install su home screen (Android)
- Modalità standalone

### Safari (iOS/macOS)
⚠️ Supporto limitato
- No `beforeinstallprompt` event
- Richiede "Add to Home Screen" manuale
- Componente mostra istruzioni manuali
- Service Worker supportato (iOS 11.3+)

### Samsung Internet
✅ Completo supporto PWA
- Comportamento simile a Chrome

## Test e Validazione

### Verificare il SW è registrato
```javascript
// Nel browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log(regs);
});
```

### Verificare la cache
```javascript
// Nel browser console
caches.keys().then(names => {
  console.log(names);
  // Ritorna: ['pentagramma-static-v1', 'pentagramma-dynamic-v1', 'pentagramma-api-v1']
});
```

### Verificare manifest
```
Apri: https://tuosite.com/manifest.json
Deve ritornare JSON valido
```

### Test di installazione
1. **Android Chrome/Edge:**
   - Visita il sito
   - Attendi il banner di installazione
   - Clicca "Installa"
   - Verifica app sulla home screen

2. **iOS Safari:**
   - Visita il sito
   - Clicca il banner (mostra istruzioni)
   - Segui i passaggi manuali
   - App appare sulla home screen

3. **Desktop (Chrome/Edge):**
   - Visita il sito
   - Clicca l'icona di installazione nella URL bar
   - Segui il prompt
   - App si installa come applicazione desktop

### Test di aggiornamenti
1. Fai un cambio minore (es: colore di un button)
2. Fai commit e push su GitHub
3. Aspetta il deploy di Vercel (1-5 minuti)
4. Apri l'app nel browser (non la versione installata)
5. Dovresti vedere la notifica "Aggiornamento disponibile"
6. Clicca "Aggiorna ora"
7. Pagina si ricarica e mostra la nuova versione

## Troubleshooting

### Il banner di installazione non appare
- ✅ Verificare su mobile (non su desktop)
- ✅ Verificare HTTPS (required per PWA)
- ✅ Verificare manifest.json è valido
- ✅ Verificare browser supporta PWA

### Gli aggiornamenti non vengono notificati
- ✅ Verificare Network tab che il SW venga fetched senza cache
- ✅ Verificare service-worker.js ha versionamento (CACHE_VERSION)
- ✅ Verificare vercel.json ha i corretti headers
- ✅ Aspettare 30 minuti o ricaricale attivamente

### La cache non si aggiorna
- ✅ Verificare Service Worker status: DevTools → Application
- ✅ Forzare unregister: `await navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))`
- ✅ Svuotare cache: DevTools → Application → Clear Site Data

### Safari non funziona
- ✅ Verificare iOS 11.3+
- ✅ Verificare manifest.json
- ✅ Verificare apple-mobile-web-app-capable meta tag
- ⚠️ Safari iOS non supporta `beforeinstallprompt`

## Deployment Checklist

- [ ] Commit e push su GitHub
- [ ] Vercel deploy attivato automaticamente
- [ ] Verificare service-worker.js accessible
- [ ] Verificare manifest.json valido
- [ ] Test su mobile Chrome/Edge
- [ ] Test su iOS Safari
- [ ] Test offline (DevTools → Network → Offline)
- [ ] Test aggiornamenti
- [ ] Verificare cache busting

## Performance Tips

1. **Ridurre STATIC_ASSETS** nel SW
   - Includere solo risorse critiche
   - Altre risorse saranno cachate on-demand

2. **Versioning della cache**
   - Incrementare CACHE_VERSION per invalidare tutte le cache
   - Usato quando si fa un major update

3. **Monitor cache size**
   - Browser limita cache a ~50MB per sito
   - Pulire cache periodicamente nei SW

4. **CDN per icone**
   - Icone devono essere piccole (< 1MB totale)
   - Considererare WebP format per mobile

## Future Improvements

1. **Background Sync**
   - Sincronizzare i dati quando si torna online
   - Implementare nel tag `sync` event del SW

2. **Push Notifications**
   - Notificare gli utenti di nuove sfide
   - Richiedere permessi dell'utente

3. **Periodic Background Sync**
   - Aggiornamento automatico dati
   - Disponibile su Chromium-based browsers

4. **Share API**
   - Implementare Web Share API
   - Condividere partite e punteggi

## Resources

- [MDN Web Docs - PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web Dev - PWA Checklist](https://web.dev/pwa-checklist/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox by Google](https://developers.google.com/web/tools/workbox)
