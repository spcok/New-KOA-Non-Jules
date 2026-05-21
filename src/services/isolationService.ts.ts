import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { IsolationLogSchema, Animal, User } from '../types/schema';
import { z } from 'zod';
import { queryClient } from '../lib/db';

type IsolationLog = z.infer<typeof IsolationLogSchema>;

const generateUUID = () => crypto.randomUUID();

export const isolationService = {
  getAnimals: async (): Promise<Animal[]> => {
    const { data, error } = await supabase.from('animals').select('id, name, species').eq('is_deleted', false);
    if (error) throw error;
    return data as Animal[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('id, name, email, role').eq('is_deleted', false);
    if (error) throw error;
    return data as User[];
  },

  getActiveIsolations: async (): Promise<IsolationLog[]> => {
    const { data, error } = await supabase
      .from('isolation_logs')
      .select('*')
      .eq('is_deleted', false)
      .eq('status', 'ACTIVE')
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data as IsolationLog[];
  },

  getAllIsolations: async (): Promise<IsolationLog[]> => {
    const { data, error } = await supabase
      .from('isolation_logs')
      .select('*')
      .eq('is_deleted', false)
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data as IsolationLog[];
  },

  saveIsolation: async (data: Partial<IsolationLog>, userId: string): Promise<void> => {
    const isNew = !data.id;
    
    // NULL LAW Enforcement
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
    );

    const payload = IsolationLogSchema.parse({
      ...sanitizedData,
      id: sanitizedData.id || generateUUID(),
      status: sanitizedData.status || 'ACTIVE',
      created_by: isNew ? userId : (sanitizedData.created_by || userId),
      modified_by: userId,
      created_at: isNew ? new Date().toISOString() : sanitizedData.created_at,
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('isolation_logs').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Isolation record to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'isolation_logs',
        action: 'upsert',
        payload
      });
    }
    queryClient.invalidateQueries({ queryKey: ['isolation_logs'] });
  }
};