import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { FirstAidLog, FirstAidLogSchema, User } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const firstAidService = {
  // NEW: Secure boundary to fetch staff for the First Aider dropdown
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

  getFirstAidLogs: async (): Promise<FirstAidLog[]> => {
    const { data, error } = await supabase
      .from('first_aid_logs')
      .select('*')
      .eq('is_deleted', false)
      .order('incident_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching first aid logs:", error);
      throw error;
    }
    
    return data as FirstAidLog[];
  },

  saveFirstAidLog: async (data: Partial<FirstAidLog>): Promise<void> => {
    // NULL LAW: Sanitize payload to replace empty strings with nulls
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const payload = FirstAidLogSchema.parse({
      ...sanitizedData,
      id: sanitizedData.id || generateUUID(),
      animal_involved: sanitizedData.animal_involved ?? false,
      is_riddor_reportable: sanitizedData.is_riddor_reportable ?? false,
      modified_at: new Date().toISOString(),
      created_at: sanitizedData.id ? sanitizedData.created_at : new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('first_aid_logs').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing First Aid Log to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'first_aid_logs',
        action: 'upsert',
        payload
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['first_aid_logs'] });
  }
};