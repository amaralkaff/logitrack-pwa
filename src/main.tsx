import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import { router } from './app/routes';
import { ThemeProvider } from './design/theme';
import { QueryProvider } from './app/providers/QueryProvider';
import { registerServiceWorker } from './sync/register-sw';
import { hydrateFromServer } from './sync/hydrate';

import './design/globals.css';

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
