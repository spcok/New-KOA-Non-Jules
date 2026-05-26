import { baseService } from './baseService';
import { maintenanceTicketsCollection } from '../lib/db';
import type { MaintenanceTicket } from '../types/schema';

export const maintenanceService = {
  saveTicket: async (data: Partial<MaintenanceTicket>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    
    await maintenanceTicketsCollection.upsert(payload as any);
    
    await baseService.upsert({
      table: 'maintenance_tickets',
      payload,
      queryKey: ['maintenance_tickets']
    });
  }
};