import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { MaintenanceTicket, MaintenanceTicketSchema, User } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const maintenanceService = {
  getStaffMembers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, initials, role')
      .eq('is_deleted', false)
      .order('name');

    if (error) {
      console.error("Error fetching staff members:", error);
      throw error;
    }
    return data as User[];
  },

  getTickets: async (): Promise<MaintenanceTicket[]> => {
    const { data, error } = await supabase
      .from('maintenance_tickets')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching maintenance tickets:", error);
      throw error;
    }
    
    return data as MaintenanceTicket[];
  },

  saveTicket: async (data: Partial<MaintenanceTicket>, userId: string): Promise<void> => {
    // 1. NULL LAW: Explicitly coalesce empty strings to null for Postgres compliance
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const isNew = !sanitizedData.id;

    const payload = MaintenanceTicketSchema.parse({
      ...sanitizedData,
      id: sanitizedData.id || generateUUID(),
      status: sanitizedData.status || 'OPEN',
      priority: sanitizedData.priority || 'MEDIUM',
      reported_by: isNew ? userId : (sanitizedData.reported_by || userId),
      created_by: isNew ? userId : (sanitizedData.created_by || userId),
      modified_by: userId,
      created_at: isNew ? new Date().toISOString() : sanitizedData.created_at,
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('maintenance_tickets').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Maintenance Ticket to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'maintenance_tickets',
        action: 'upsert',
        payload
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['maintenance_tickets'] });
  }
};