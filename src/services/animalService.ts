import { baseService } from './baseService';
import { animalsCollection } from '../lib/db';
import type { Animal } from '../types/schema';

export const animalService = {
  saveAnimal: async (data: Partial<Animal>): Promise<void> => {
    const payload = { ...data, updated_at: new Date().toISOString() };
    
    // Optimistic: Update local IndexedDB
    await animalsCollection.upsert(payload as any);
    
    // Deterministic: Cloud strike + Outbox failover
    await baseService.upsert({
      table: 'animals',
      payload,
      queryKey: ['animals']
    });
  }
};