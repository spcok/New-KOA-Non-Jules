import { createFileRoute } from '@tanstack/react-router';
import IsolationManager from '../features/clinical/IsolationManager';

export const Route = createFileRoute('/clinical/isolation')({
  component: IsolationManager,
});