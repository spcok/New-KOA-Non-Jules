import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { DailyRound, DailyRoundSchema } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const dailyRoundService = {
  getDailyRounds: async (date: string, shift: string): Promise<DailyRound[]> => {
    const { data, error } = await supabase
      .from('daily_rounds')
      .select('*')
      .eq('date', date)
      .eq('shift', shift)
      .eq('is_deleted', false);
      
    if (error) throw error;
    return data as DailyRound[];
  },

  bulkSaveRound: async (rounds: Partial<DailyRound>[], userId: string): Promise<void> => {
    for (const round of rounds) {
      const isNew = !round.id;
      
      // NULL LAW Enforcement
      const sanitizedRound = Object.fromEntries(
        Object.entries(round).map(([key, value]) => [key, value === '' ? null : value])
      );

      // ZOD LAW Enforcement: Required booleans must default to false if not explicitly checked
      const payload = DailyRoundSchema.parse({
        ...sanitizedRound,
        id: sanitizedRound.id || generateUUID(),
        is_alive: sanitizedRound.is_alive ?? false,
        water_checked: sanitizedRound.water_checked ?? false,
        locks_secured: sanitizedRound.locks_secured ?? false,
        created_by: isNew ? userId : (sanitizedRound.created_by || userId),
        modified_by: userId,
        created_at: isNew ? new Date().toISOString() : sanitizedRound.created_at,
        updated_at: new Date().toISOString(),
        is_deleted: false,
      });

      try {
        const { error } = await supabase.from('daily_rounds').upsert(payload);
        if (error) throw error;
      } catch (error) {
        console.warn("Network offline. Queueing Daily Round to outbox.", error);
        useOutboxStore.getState().addMutation({
          id: generateUUID(),
          table: 'daily_rounds',
          action: 'upsert',
          payload
        });
      }
    }
  }
};