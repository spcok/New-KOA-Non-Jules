import { baseService } from './baseService';
import { incidentsCollection } from '../lib/db';
import type { Incident } from '../types/schema';

export const incidentService = {
  saveIncident: async (data: Partial<Incident>, userId: string): Promise<void> => {
    const payload = { ...data, reported_by: userId, updated_at: new Date().toISOString() };
    
    await incidentsCollection.upsert(payload as any);
    
    await baseService.upsert({
      table: 'incidents',
      payload,
      queryKey: ['incidents']
    });
  }
};