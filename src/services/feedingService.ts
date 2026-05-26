import { baseService } from './baseService';
import { feedingSchedulesCollection } from '../lib/db';
import type { FeedingSchedule } from '../types/schema';

export const feedingService = {
  saveSchedule: async (data: Partial<FeedingSchedule>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    
    await feedingSchedulesCollection.upsert(payload as any);
    
    await baseService.upsert({
      table: 'feeding_schedules',
      payload,
      queryKey: ['feeding_schedules']
    });
  }
};