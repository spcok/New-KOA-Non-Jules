import { createFileRoute } from '@tanstack/react-router';
import FeedingSchedule from '../features/husbandry/FeedingSchedule';

export const Route = createFileRoute('/husbandry/feeding-schedule')({
  component: FeedingSchedule,
});
