import { createFileRoute } from '@tanstack/react-router';
import Incidents from '../features/safety/Incidents';

export const Route = createFileRoute('/safety/incidents')({
  component: Incidents,
});