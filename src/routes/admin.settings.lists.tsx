import { createFileRoute } from '@tanstack/react-router';
import OperationalLists from '../features/settings/OperationalLists';

export const Route = createFileRoute('/admin/settings/lists')({
  component: OperationalLists,
});