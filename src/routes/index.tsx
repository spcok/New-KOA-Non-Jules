import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Dashboard } from '../features/dashboard/Dashboard';

export const Route = createFileRoute('/')({
  component: DashboardRoute,
});

function DashboardRoute() {
  return <Dashboard />;
}
