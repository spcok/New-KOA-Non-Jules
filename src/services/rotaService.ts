import { baseService } from './baseService';
import { shiftsCollection } from '../lib/db';
import type { Shift } from '../types/schema';

export const rotaService = {
  saveShift: async (data: Partial<Shift>, userId: string): Promise<void> => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    await shiftsCollection.upsert(payload as any);
    await baseService.upsert({
      table: 'shifts',
      payload,
      queryKey: ['shifts']
    });
  }
};