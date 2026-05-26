import { DailyLog, DailyLogSchema } from '../types/schema';
import { baseService } from './baseService';

export const dailyLogService = {
  // ... keep existing 'get' methods as they are (Downlink/Reads) ...

  saveLog: async (data: Partial<DailyLog>, userId: string): Promise<void> => {
    const payload = DailyLogSchema.parse({
      ...data,
      id: data.id || crypto.randomUUID(),
      created_by: userId,
      modified_by: userId,
      updated_at: new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString()
    });

    await baseService.upsert({
      table: 'daily_logs',
      payload,
      queryKey: ['daily_logs']
    });
  }
};