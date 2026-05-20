import { createFileRoute } from '@tanstack/react-router';
import DailyRounds from '../features/husbandry/DailyRounds';

export const Route = createFileRoute('/husbandry/daily-rounds')({
  component: DailyRounds,
});
