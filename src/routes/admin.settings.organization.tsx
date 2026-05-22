import { createFileRoute } from '@tanstack/react-router';
import OrgProfile from '../features/settings/OrgProfile';

export const Route = createFileRoute('/admin/settings/organization')({
  component: OrgProfile,
});