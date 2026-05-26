import { baseService } from './baseService';
import { safetyDrillsCollection } from '../lib/db';
import type { SafetyDrill } from '../types/schema';

export const safetyDrillService = {
  saveDrill: async (data: Partial<SafetyDrill>, userId: string): Promise<void> => {
    const payload = { ...data, logged_by: userId, updated_at: new Date().toISOString() };
    await safetyDrillsCollection.upsert(payload as any);
    await baseService.upsert({
      table: 'safety_drills',
      payload,
      queryKey: ['safety_drills']
    });
  }
};