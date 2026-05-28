import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { routeTree } from './routeTree.gen';
import { queryClient, persister } from './lib/db';
import './index.css';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <RouterProvider router={router} />
      </PersistQueryClientProvider>
    </StrictMode>
  );
}