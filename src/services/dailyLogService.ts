import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { DailyLog, DailyLogSchema } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const dailyLogService = {
  getLogsByDate: async (dateStr: string): Promise<DailyLog[]> => {
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .gte('log_date', startOfDay)
      .lte('log_date', endOfDay)
      .eq('is_deleted', false);

    if (error) {
      console.error("Error fetching logs by date:", error);
      throw error;
    }
    
    return data as DailyLog[];
  },

  getDashboardLogs: async (dateStr: string): Promise<{ todaysLogs: DailyLog[], lastFeeds: DailyLog[] }> => {
    const todaysLogs = await dailyLogService.getLogsByDate(dateStr);

    const { data: rawFeeds, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('log_type', 'FEED')
      .eq('is_deleted', false)
      .order('log_date', { ascending: false })
      .limit(30);

    const lastFeeds = error ? [] : (rawFeeds as DailyLog[]);

    return { todaysLogs, lastFeeds };
  },

  // NEW: Added boundary for Animal Profile queries
  getLogsByAnimal: async (animalId: string): Promise<DailyLog[]> => {
    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('animal_id', animalId)
      .eq('is_deleted', false)
      .order('log_date', { ascending: false })
      .limit(50); // Cap history to prevent memory bloat

    if (error) {
      console.error("Error fetching logs by animal:", error);
      throw error;
    }
    
    return data as DailyLog[];
  },

  saveLog: async (data: Partial<DailyLog>, userId: string): Promise<void> => {
    const payload = DailyLogSchema.parse({
      ...data,
      id: data.id || generateUUID(),
      created_by: userId,
      modified_by: userId,
      updated_at: new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString()
    });

    try {
      const { error } = await supabase.from('daily_logs').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Daily Log to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'daily_logs',
        action: 'upsert',
        payload
      });
    }
    
    if (payload.log_date) {
      const logDateOnly = payload.log_date.split('T')[0];
      queryClient.invalidateQueries({ queryKey: ['daily_logs', logDateOnly] });
    }
    if (payload.animal_id) {
      queryClient.invalidateQueries({ queryKey: ['animal_logs', payload.animal_id] });
    }
  }
};