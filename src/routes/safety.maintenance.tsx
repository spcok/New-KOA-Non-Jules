import { createFileRoute } from '@tanstack/react-router';
import MaintenanceTickets from '../features/maintenance/MaintenanceTickets';

export const Route = createFileRoute('/safety/maintenance')({
  component: MaintenanceTickets,
});