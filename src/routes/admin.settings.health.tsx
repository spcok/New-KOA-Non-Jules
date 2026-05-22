import { createFileRoute } from '@tanstack/react-router';
import SystemHealth from '../features/settings/SystemHealth';

export const Route = createFileRoute('/admin/settings/health')({
  component: SystemHealth,
});