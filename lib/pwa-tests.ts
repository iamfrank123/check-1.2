/**
 * PWA Test Utilities
 * 
 * Strumenti per testare la PWA in development e production
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

export class PWATests {
  static async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    console.log('[PWA Tests] Starting all tests...');

    results.push(await this.testManifest());
    results.push(await this.testServiceWorker());
    results.push(await this.testMetaTags());
    results.push(await this.testIcons());
    results.push(await this.testCache());
    results.push(await this.testHTTPS());

    console.log('[PWA Tests] Completed. Results:', results);
    return results;
  }

  static async testManifest(): Promise<TestResult> {
    try {
      const response = await fetch('/manifest.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const manifest = await response.json();

      if (!manifest.name || !manifest.short_name || !manifest.icons) {
        throw new Error('Missing required manifest fields');
      }

      return {
        name: 'Manifest.json',
        passed: true,
        details: `Valid manifest with ${manifest.icons.length} icons`,
      };
    } catch (error) {
      return {
        name: 'Manifest.json',
        passed: false,
        error: String(error),
      };
    }
  }

  static async testServiceWorker(): Promise<TestResult> {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker API not available');
      }

      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) {
        throw new Error('No Service Worker registered');
      }

      const registration = registrations[0];
      const worker = registration.active || registration.waiting || registration.installing;

      return {
        name: 'Service Worker',
        passed: !!worker,
        details: `${registrations.length} registration(s) found${worker ? ', active' : ''}`,
      };
    } catch (error) {
      return {
        name: 'Service Worker',
        passed: false,
        error: String(error),
      };
    }
  }

  static testMetaTags(): TestResult {
    try {
      const requiredMeta = [
        'apple-mobile-web-app-capable',
        'theme-color',
        'viewport',
      ];

      const missing = requiredMeta.filter(
        (meta) => !document.querySelector(`meta[name="${meta}"]`)
      );

      if (missing.length > 0) {
        throw new Error(`Missing meta tags: ${missing.join(', ')}`);
      }

      return {
        name: 'Meta Tags',
        passed: true,
        details: 'All required meta tags present',
      };
    } catch (error) {
      return {
        name: 'Meta Tags',
        passed: false,
        error: String(error),
      };
    }
  }

  static async testIcons(): Promise<TestResult> {
    try {
      const sizes = ['192x192', '384x384', '512x512'];
      const missing = [];

      for (const size of sizes) {
        const response = await fetch(`/icons/icon-${size}.png`, { method: 'HEAD' });
        if (!response.ok) {
          missing.push(size);
        }
      }

      if (missing.length > 0) {
        throw new Error(`Missing icons: ${missing.join(', ')}`);
      }

      return {
        name: 'Icons',
        passed: true,
        details: `All ${sizes.length} icons available`,
      };
    } catch (error) {
      return {
        name: 'Icons',
        passed: false,
        error: String(error),
      };
    }
  }

  static async testCache(): Promise<TestResult> {
    try {
      if (!('caches' in window)) {
        throw new Error('Cache API not available');
      }

      const cacheNames = await caches.keys();

      if (cacheNames.length === 0) {
        throw new Error('No caches found');
      }

      return {
        name: 'Cache API',
        passed: true,
        details: `${cacheNames.length} cache(s) available: ${cacheNames.join(', ')}`,
      };
    } catch (error) {
      return {
        name: 'Cache API',
        passed: false,
        error: String(error),
      };
    }
  }

  static testHTTPS(): TestResult {
    try {
      const isHttps = location.protocol === 'https:';
      const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

      if (!isHttps && !isLocalhost) {
        throw new Error('HTTPS required for PWA (except localhost)');
      }

      return {
        name: 'HTTPS',
        passed: true,
        details: isLocalhost ? 'Localhost (development)' : 'HTTPS enabled',
      };
    } catch (error) {
      return {
        name: 'HTTPS',
        passed: false,
        error: String(error),
      };
    }
  }

  // Utility per testare offline
  static async testOfflineMode(): Promise<TestResult> {
    try {
      // Disabilita la rete
      (navigator as any).onLine = false;
      window.dispatchEvent(new Event('offline'));

      // Aspetta un po'
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Torna online
      (navigator as any).onLine = true;
      window.dispatchEvent(new Event('online'));

      return {
        name: 'Offline Mode',
        passed: true,
        details: 'Offline/online events fired successfully',
      };
    } catch (error) {
      return {
        name: 'Offline Mode',
        passed: false,
        error: String(error),
      };
    }
  }

  // Utility per pulire le cache
  static async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('[PWA Tests] All caches cleared');
  }

  // Utility per unregistrare tutti i SW
  static async unregisterAllSW(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((reg) => reg.unregister()));
    console.log('[PWA Tests] All Service Workers unregistered');
  }

  // Utility per resettare PWA completamente
  static async reset(): Promise<void> {
    console.log('[PWA Tests] Resetting PWA...');
    await this.clearAllCaches();
    await this.unregisterAllSW();
    localStorage.clear();
    console.log('[PWA Tests] PWA reset complete');
  }
}

// Esponi i test alla console per facile accesso
if (typeof window !== 'undefined') {
  (window as any).PWATests = PWATests;

  console.log('[PWA] Tests available: window.PWATests');
  console.log('Commands:');
  console.log('  - PWATests.runAll()');
  console.log('  - PWATests.clearAllCaches()');
  console.log('  - PWATests.unregisterAllSW()');
  console.log('  - PWATests.reset()');
}

export default PWATests;
