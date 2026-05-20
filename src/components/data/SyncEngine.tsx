import { useEffect } from 'react';
import { useShape } from '@electric-sql/react';
import { useQueryClient } from '@tanstack/react-query';
import { useOutboxStore } from '../../store/outboxStore';
import { supabase } from '../../lib/supabase';

const ELECTRIC_URL = import.meta.env.VITE_ELECTRIC_URL || 'http://localhost:3000';

export function SyncEngine() {
  const queryClient = useQueryClient();

  // DOWNLINK SHAPES
  const { data: animals } = useShape({ url: `${ELECTRIC_URL}/v1/shape`, params: { table: 'animals' } });
  const { data: tasks } = useShape({ url: `${ELECTRIC_URL}/v1/shape`, params: { table: 'tasks' } });

  useEffect(() => { if (animals) queryClient.setQueryData(['animals'], animals); }, [animals, queryClient]);
  useEffect(() => { if (tasks) queryClient.setQueryData(['tasks'], tasks); }, [tasks, queryClient]);

  // OUTBOX DRAINER (Uplink Recovery)
  useEffect(() => {
    const drainOutbox = async () => {
      if (!navigator.onLine) return;
      
      const mutations = useOutboxStore.getState().mutations;
      if (mutations.length === 0) return;

      console.log(`Attempting to drain ${mutations.length} items from Outbox...`);
      for (const mutation of mutations) {
        if (mutation.action === 'upsert') {
          const { error } = await supabase.from(mutation.table).upsert(mutation.payload);
          if (!error) {
            useOutboxStore.getState().removeMutation(mutation.id);
            console.log(`Successfully synced offline mutation: ${mutation.id}`);
          }
        }
      }
    };

    window.addEventListener('online', drainOutbox);
    const interval = setInterval(drainOutbox, 10000); // Check every 10 seconds
    
    return () => {
      window.removeEventListener('online', drainOutbox);
      clearInterval(interval);
    };
  }, []);

  return null;
}
