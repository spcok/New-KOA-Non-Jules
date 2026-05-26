import { baseService } from './baseService';
import { isolationLogsCollection } from '../lib/db';
import type { IsolationLog } from '../types/schema';

export const isolationService = {
  saveLog: async (data: Partial<IsolationLog>, userId: string): Promise<void> => {
    const payload = { ...data, authorized_by: userId, updated_at: new Date().toISOString() };
    await isolationLogsCollection.upsert(payload as any);
    await baseService.upsert({
      table: 'isolation_logs',
      payload,
      queryKey: ['isolation_logs']
    });
  }
};