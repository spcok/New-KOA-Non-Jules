import { createFileRoute } from '@tanstack/react-router';
import { ReportsManager } from '../features/staff/ReportsManager';

export const Route = createFileRoute('/staff/reports')({
  component: () => <ReportsManager />
});