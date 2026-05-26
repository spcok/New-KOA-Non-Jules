import { baseService } from './baseService';
import { dailyRoundsCollection } from '../lib/db';
import type { DailyRound } from '../types/schema';

export const dailyRoundService = {
  saveRound: async (data: Partial<DailyRound>, userId: string): Promise<void> => {
    const payload = { ...data, completed_by: userId, updated_at: new Date().toISOString() };
    
    await dailyRoundsCollection.upsert(payload as any);
    
    await baseService.upsert({
      table: 'daily_rounds',
      payload,
      queryKey: ['daily_rounds']
    });
  }
};