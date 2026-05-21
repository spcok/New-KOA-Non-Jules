import { createFileRoute } from '@tanstack/react-router';
import Timesheets from '../features/staff/Timesheets';

export const Route = createFileRoute('/staff/timesheets')({
  component: Timesheets,
});