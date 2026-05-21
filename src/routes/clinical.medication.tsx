import { createFileRoute } from '@tanstack/react-router';
import MedicationManager from '../features/clinical/MedicationManager';

export const Route = createFileRoute('/clinical/medication')({
  component: MedicationManager,
});