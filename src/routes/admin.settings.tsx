import { createFileRoute, redirect } from '@tanstack/react-router';
import SettingsLayout from '../features/settings/SettingsLayout';

export const Route = createFileRoute('/admin/settings')({
  beforeLoad: ({ location }) => {
    if (location.pathname === '/admin/settings' || location.pathname === '/admin/settings/') {
      throw redirect({ to: '/admin/settings/organization' });
    }
  },
  component: SettingsLayout,
});