import { createFileRoute } from '@tanstack/react-router';
import { RotaManager } from '../features/staff/RotaManager';

export const Route = createFileRoute('/staff/rota')({
  component: () => <RotaManager />
});