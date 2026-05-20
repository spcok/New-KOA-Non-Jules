import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import DailyLog from '../features/husbandry/DailyLog';

export const Route = createFileRoute('/husbandry/daily-logs')({
  component: DailyLogRoute,
});

function DailyLogRoute() {
  return <DailyLog />;
}
