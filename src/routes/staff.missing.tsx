import { createFileRoute } from '@tanstack/react-router';
import { MissingRecords } from '../features/staff/MissingRecords';

export const Route = createFileRoute('/staff/missing')({
  component: () => <MissingRecords />
});