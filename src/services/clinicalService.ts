import { baseService } from './baseService';
import { clinicalRecordsCollection } from '../lib/db';
import type { ClinicalRecord } from '../types/schema';

export const clinicalService = {
  saveRecord: async (data: Partial<ClinicalRecord>, userId: string): Promise<void> => {
    const payload = { 
      ...data, 
      created_by: userId, 
      updated_at: new Date().toISOString() 
    };
    
    // Optimistic write to Local Vault
    await clinicalRecordsCollection.upsert(payload as any);
    
    // Cloud Strike + Outbox Failover
    await baseService.upsert({
      table: 'clinical_records',
      payload,
      queryKey: ['clinical_records']
    });
  }
};