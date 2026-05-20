import React, { useEffect } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useAuthStore } from '../store/authStore';
import { Login } from '../features/auth/Login';
import { Loader2 } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { SyncEngine } from '../components/data/SyncEngine';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  // STRICT SELECTORS LAW: Maintained
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const session = useAuthStore((s) => s.session);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0A0B0E] text-emerald-500">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Component-swap layout instead of a router redirect
  if (!session) {
    return <Login />;
  }

  return (
    <>
      <SyncEngine />
      <AppLayout />
    </>
  );
}