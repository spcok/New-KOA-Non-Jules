import { createFileRoute } from '@tanstack/react-router';
import { InternalMovements } from '../features/logistics/InternalMovements';

export const Route = createFileRoute('/logistics/internal-movements')({
  component: () => <InternalMovements />
});