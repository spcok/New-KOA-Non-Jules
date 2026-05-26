import { createFileRoute } from '@tanstack/react-router';
import { ExternalTransfers } from '../features/logistics/ExternalTransfers';

export const Route = createFileRoute('/logistics/external-transfers')({
  component: () => <ExternalTransfers />
});