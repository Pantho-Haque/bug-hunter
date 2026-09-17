/**
 * Registers the generated service worker and reports when a newer build is
 * waiting. The worker never activates on its own: a child mid-mission should
 * not have the page swapped underneath them, so the app asks first.
 */
export const registerServiceWorker = (onUpdateReady: (apply: () => void) => void): void => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const start = () => {
    void navigator.serviceWorker.register('/sw.js').then((registration) => {
      const announce = (waiting: ServiceWorker) =>
        onUpdateReady(() => {
          waiting.postMessage('skipWaiting');
        });

      if (registration.waiting) announce(registration.waiting);

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          // "installed" with an existing controller means this is an update,
          // not the very first install.
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            announce(installing);
          }
        });
      });
    });

    // On a first visit the worker claims the page and controllerchange fires;
    // reloading there would restart the game under a child mid-sentence. Only
    // an actual update, applied on request, should reload.
    const hadController = Boolean(navigator.serviceWorker.controller);
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloading) return;
      reloading = true;
      window.location.reload();
    });
  };

  // React effects usually run after 'load' has already fired, so waiting for
  // that event alone meant the worker was never registered at all.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
};
