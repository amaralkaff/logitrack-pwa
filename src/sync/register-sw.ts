import { registerSW } from 'virtual:pwa-register';

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  // eslint-disable-next-line prefer-const
  let updateSW: (reloadPage?: boolean) => Promise<void>;
  updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Skip waiting + reload exactly once. Plugin handles the SKIP_WAITING
      // message + 'controllerchange' listener internally when reloadPage=true.
      void updateSW(true);
    },
    onOfflineReady() {
      // no-op; could toast later
    },
    onRegisterError(err) {
      // eslint-disable-next-line no-console
      console.error('[sw] register error', err);
    },
  });
}
