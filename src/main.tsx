import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from './app/routes';
import { ThemeProvider } from './design/theme';
import { QueryProvider } from './app/providers/QueryProvider';
import { registerServiceWorker } from './sync/register-sw';
import { hydrateFromServer } from './sync/hydrate';
import { useApp } from './app/store';

import './design/globals.css';

// Legacy session sweep: purge any pre-auth persisted login that
// lacks a JWT. Forces the user back through /api/auth/signin.
const __s = useApp.getState();
if (__s.operatorId && !__s.token) __s.signOut();

void hydrateFromServer();
registerServiceWorker();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ThemeProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ThemeProvider>
  </StrictMode>,
);
