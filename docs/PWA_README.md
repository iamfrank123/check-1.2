# Guida PWA - Pentagramma

## 🚀 Quick Start

### Per gli utenti
1. **Visita il sito:** https://pentagramma.vercel.app
2. **Installa l'app:**
   - **Android/Chrome:** Clicca il banner che appare in basso
   - **iOS/Safari:** Tocca Condividi → Aggiungi a schermata Home
   - **Desktop:** Clicca l'icona di installazione nella URL bar

3. **Accedi offline:** Una volta installata, l'app funziona anche senza internet

### Per gli sviluppatori

#### Verificare la PWA
```bash
# 1. Build il progetto
npm run build

# 2. Avvia il server
npm run start

# 3. Apri DevTools (F12) → Application
# Dovresti vedere:
# - Manifest.json valido
# - Service Worker registrato
# - Cache popolate
```

#### Test della PWA
```javascript
// Nella console del browser:

// Esegui tutti i test
PWATests.runAll()

// Svuota cache
PWATests.clearAllCaches()

// Unregister dei Service Workers
PWATests.unregisterAllSW()

// Reset completo della PWA
PWATests.reset()
```

#### Test offline
```
DevTools → Network → Throttling → Offline
Ricarica la pagina → L'app continua a funzionare
```

#### Test di aggiornamenti
```
1. Fai una modifica (es: cambio colore)
2. Esegui: npm run build && npm run start
3. Apri l'app in due tab
4. In uno dei tab, dovresti vedere la notifica di aggiornamento
5. Clicca "Aggiorna ora" per ricaricare
```

## 📱 Funzionalità

### ✅ Implementate
- [x] Manifest.json completo
- [x] Service Worker con caching intelligente
- [x] Banner di installazione (non invasivo)
- [x] Notifica aggiornamenti automatici
- [x] Supporto offline-first
- [x] Cache busting su deploy
- [x] Compatibilità Vercel
- [x] Supporto Safari iOS
- [x] Responsive design mobile-first

### 🔄 Aggiornamenti automatici

Il sistema di aggiornamento è **totalmente automatico**:

1. **Fai commit e push:**
   ```bash
   git add .
   git commit -m "Nuovo feature"
   git push origin main
   ```

2. **Vercel deploya automaticamente** (1-5 minuti)

3. **Utenti ricevono notifica:**
   - Apparisce un banner verde "Aggiornamento disponibile"
   - Possono cliccare "Aggiorna ora" per subito
   - O aspettare 30 minuti per auto-update

4. **Service Worker aggiorna:**
   - Nuova versione viene installata
   - Vecchie cache vengono eliminate
   - Pagina si ricarica automaticamente

### 📵 Modalità offline

L'app funziona completamente offline grazie al Service Worker:

```
┌─────────────────────────────────────┐
│ Utente apre l'app offline           │
│                                     │
│ Service Worker intercetta richiesta │
│                                     │
│ ├─ Se in cache → ritorna da cache   │
│ └─ Se non cache → mostra errore     │
│                                     │
│ Utente può:                         │
│ ✓ Navigare tra pagine               │
│ ✓ Usare le challenge offline        │
│ ✗ Non può salvare online (queue)    │
└─────────────────────────────────────┘
```

## 🔒 Sicurezza e Performance

### Cache Control
```
/service-worker.js      → max-age=0 (sempre aggiornato)
/manifest.json          → max-age=3600 (1 ora)
/_next/static/*         → max-age=31536000 (1 anno)
/icons/*                → max-age=31536000 (1 anno)
```

### Size della cache
- **Static cache:** ~5-10 MB
- **Dynamic cache:** ~20-50 MB
- **Total:** Limitato a ~50MB per sito (browser limit)

## 🌐 Browser Support

| Browser | Desktop | Mobile | Offline | Install |
|---------|---------|--------|---------|---------|
| Chrome  | ✅      | ✅     | ✅      | ✅      |
| Edge    | ✅      | ✅     | ✅      | ✅      |
| Firefox | ✅      | ✅     | ✅      | ✅      |
| Safari  | ⚠️      | ⚠️     | ✅      | ⚠️*     |

*Safari iOS: Installazione manuale (Share → Add to Home Screen)

## 📋 File struttura PWA

```
project/
├── public/
│   ├── manifest.json              ← Metadati app
│   ├── service-worker.js          ← Cache e offline
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── favicon.ico
├── components/PWA/
│   ├── InstallPrompt.tsx          ← Banner installazione
│   ├── InstallPrompt.module.css
│   ├── PWAUpdater.tsx             ← Notifica aggiornamenti
│   ├── PWAUpdater.module.css
│   └── PWABootstrap.tsx           ← Setup PWA
├── hooks/
│   └── useSWUpdater.ts            ← Hook aggiornamenti
├── lib/
│   ├── offline-manager.ts         ← Gestione offline
│   └── pwa-tests.ts               ← Test utilities
├── app/
│   └── layout.tsx                 ← PWA integration
├── next.config.js                 ← Config Next.js
├── vercel.json                    ← Config Vercel
└── docs/
    └── PWA_IMPLEMENTATION.md       ← Documentazione completa
```

## 🧪 Testing Checklist

### Mobile Android (Chrome/Edge)
- [ ] App si installa da banner
- [ ] App funziona offline
- [ ] Aggiornamenti vengono notificati
- [ ] Touch sono reattivi
- [ ] Rotazione schermo funziona
- [ ] Audio/MIDI funzionano

### iOS (Safari)
- [ ] App si installa manualmente
- [ ] App appare su home screen
- [ ] App funziona offline
- [ ] Status bar è nero
- [ ] Non ci sono barre extra

### Desktop (Chrome/Edge)
- [ ] App si installa da URL bar
- [ ] App si apre in finestra standalone
- [ ] Funziona offline
- [ ] Scorciatoie menu funzionano

## 🐛 Troubleshooting

### Problem: Il banner non appare
**Soluzioni:**
1. Verificare HTTPS (richiesto per PWA)
2. Verificare manifest.json è valido
3. Verificare si è su mobile
4. Attendere 24 ore se già dismissato

### Problem: Service Worker non aggiorna
**Soluzioni:**
1. Vai a DevTools → Application → Service Workers
2. Seleziona "Update on reload"
3. Ricarica pagina
4. Aspetta 30 minuti oppure:
   ```javascript
   // Console
   navigator.serviceWorker.getRegistrations().then(regs => {
     regs.forEach(reg => reg.update())
   })
   ```

### Problem: Cache non si pulisce
**Soluzione completa:**
```javascript
// Console
PWATests.reset()
// Ricarica pagina
location.reload()
```

### Problem: App non funziona offline
**Debug:**
```javascript
// Console
PWATests.runAll()
// Verifica tutti i test passino
caches.keys().then(k => console.log(k))
// Verifica cache siano popolate
```

## 📈 Monitoring

### Verificare il health della PWA
```javascript
// Esegui nella console mensile
PWATests.runAll().then(results => {
  console.table(results)
})
```

### Controllare log del Service Worker
```
DevTools → Application → Service Workers → "Show all" → log
```

### Verificare cache usage
```javascript
await caches.keys().then(names => {
  names.forEach(async name => {
    const c = await caches.open(name);
    console.log(`${name}: ${(await c.keys()).length} entries`)
  })
})
```

## 🚀 Deployment

### Prerequisites
- [ ] Repo GitHub configurato
- [ ] Account Vercel connesso
- [ ] HTTPS configurato (Vercel lo fa automaticamente)

### Deploy steps
```bash
# 1. Push su GitHub
git add .
git commit -m "feat: PWA implementation"
git push origin main

# 2. Vercel deploya automaticamente
# (Puoi monitorare in vercel.com)

# 3. Verifica il deployment
# - Visita https://pentagramma.vercel.app
# - Apri DevTools → Application
# - Verifica Service Worker e Cache
```

## 📚 Documentazione

Per dettagli tecnici completi, vedi [PWA_IMPLEMENTATION.md](../docs/PWA_IMPLEMENTATION.md)

Topics:
- Strategie di caching dettagliate
- Flusso di aggiornamento automatico
- Configurazione Vercel e GitHub
- Best practices e performance
- Future improvements

## 💡 Tips and Tricks

### Forzare aggiornamento su tutti i dispositivi
```bash
# Nel public/service-worker.js, incrementa:
const CACHE_VERSION = 'v2'; // Era 'v1'

git add .
git commit -m "Force cache bust"
git push
# Tutti gli utenti riceveranno nuovo SW
```

### Visualizzare dati offline sincronizzati
```javascript
// Console
import { OfflineSync } from '@/lib/offline-manager'
OfflineSync.getQueue()
```

### Simulare aggiornamento
```javascript
// Console
navigator.serviceWorker.controller?.postMessage({
  type: 'SW_UPDATED'
})
```

## 🎯 Next Steps

1. **Icone:** Crea icone professionali 192x192, 384x384, 512x512
2. **Screenshots:** Aggiungi screenshot app per app stores
3. **Analytics:** Traccia installazioni PWA
4. **Push Notifications:** Aggiungi notifiche push
5. **Sync:** Implementa background sync per dati offline

## 📞 Support

Per problemi o domande:
1. Controlla la documentazione: [PWA_IMPLEMENTATION.md](../docs/PWA_IMPLEMENTATION.md)
2. Esegui i test: `PWATests.runAll()`
3. Leggi i log di console: Ctrl+Shift+K (Chrome)
4. Controlla DevTools Application tab

---

**PWA Version:** 1.0  
**Last Updated:** 2025-12-14  
**Status:** ✅ Production Ready
