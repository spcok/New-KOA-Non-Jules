import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/db';
import { useOutboxStore } from '../store/outboxStore';
import { DailyRoundSchema, DailyRound } from '../types/schema';

const generateUUID = () => crypto.randomUUID();

export const dailyRoundService = {
  saveRound: async (data: Partial<DailyRound>, userId: string) => {
    const payload = DailyRoundSchema.parse({
      ...data,
      id: data.id || generateUUID(),
      completed_by: userId, // Mandatory injection
      is_deleted: false,
      updated_at: new Date().toISOString(),
      created_at: data.created_at || new Date().toISOString()
    });

    queryClient.setQueryData(['daily_rounds'], (old: DailyRound[] | undefined) => {
      if (!old) return [payload];
      return old.map(r => r.id === payload.id ? payload : r);
    });

    try {
      const { error } = await supabase.from('daily_rounds').upsert(payload);
      if (error) throw error;
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'daily_rounds',
        action: 'upsert',
        payload
      });
    }
  },

  bulkSaveRound: async (rounds: DailyRound[], userId: string) => {
    const payload = rounds.map(r => DailyRoundSchema.parse({
        ...r,
        completed_by: userId // Mandatory injection
    }));

    queryClient.setQueryData(['daily_rounds'], (old: DailyRound[] = []) => [...old, ...payload]);

    try {
      const { error } = await supabase.from('daily_rounds').upsert(payload);
      if (error) throw error;
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'daily_rounds',
        action: 'upsert',
        payload
      });
    }
  }
};