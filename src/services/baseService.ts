import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { queryClient } from '../lib/db';

type UpsertAction = {
  table: string;
  payload: any;
  queryKey?: string[];
};

export const baseService = {
  /**
   * Standardised wrapper for all writes.
   * Logic: Attempt cloud strike -> On fail, queue to Outbox -> Optimistically update UI
   */
  async upsert(action: UpsertAction): Promise<void> {
    try {
      const { error } = await supabase.from(action.table).upsert(action.payload);
      if (error) throw error;
    } catch (error) {
      console.warn(`[SyncEngine] Network failure. Queueing ${action.table} to Outbox.`, error);
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: action.table,
        action: 'upsert',
        payload: action.payload
      });
    }

    // Always invalidate the query key to refresh the TanStack DB/Query cache
    if (action.queryKey) {
      queryClient.invalidateQueries({ queryKey: action.queryKey });
    }
  }
};