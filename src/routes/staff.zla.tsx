import { createFileRoute } from '@tanstack/react-router';
import { ZLACompliance } from '../features/staff/ZLACompliance';

export const Route = createFileRoute('/staff/zla')({
  component: () => <ZLACompliance />
});