import { baseService } from './baseService';
import { firstAidLogsCollection } from '../lib/db';
import type { FirstAidLog } from '../types/schema';

export const firstAidService = {
  saveLog: async (data: Partial<FirstAidLog>, userId: string): Promise<void> => {
    const payload = { ...data, treated_by: userId, updated_at: new Date().toISOString() };
    await firstAidLogsCollection.upsert(payload as any);
    await baseService.upsert({
      table: 'first_aid_logs',
      payload,
      queryKey: ['first_aid_logs']
    });
  }
};