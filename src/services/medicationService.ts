import { baseService } from './baseService';
import { medicationLogsCollection } from '../lib/db';
import type { MedicationLog } from '../types/schema';

export const medicationService = {
  saveLog: async (data: Partial<MedicationLog>, userId: string): Promise<void> => {
    const payload = { ...data, administered_by: userId, updated_at: new Date().toISOString() };
    await medicationLogsCollection.upsert(payload as any);
    await baseService.upsert({
      table: 'medication_logs',
      payload,
      queryKey: ['medication_logs']
    });
  }
};