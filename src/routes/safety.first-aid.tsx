import { createFileRoute } from '@tanstack/react-router';
import FirstAid from '../features/safety/FirstAid';

export const Route = createFileRoute('/safety/first-aid')({
  component: FirstAid,
});