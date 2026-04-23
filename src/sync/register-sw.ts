import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  registerSW({
    immediate: true,
    onNeedRefresh() {
      // Simple auto-update; in future show a toast.
      // eslint-disable-next-line no-console
      console.info('[sw] update available, reloading…');
      location.reload();
    },
    onOfflineReady() {
      // eslint-disable-next-line no-console
      console.info('[sw] offline ready');
    },
  });
}
