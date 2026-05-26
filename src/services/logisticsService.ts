import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { queryClient } from '../lib/db';
import type { InternalMovement, ExternalTransfer } from '../types/schema';

const generateUUID = () => crypto.randomUUID();

export const logisticsService = {
  
  saveInternalMovement: async (data: Partial<InternalMovement>, userId: string): Promise<void> => {
    const now = new Date().toISOString();
    const payload = {
      ...data,
      id: data.id || generateUUID(),
      moved_by: userId,
      updated_at: now,
      created_at: data.created_at || now,
    } as InternalMovement;

    try {
      const { error } = await supabase.from('internal_movements').upsert(payload);
      if (error) throw error;

      // Update the animal's master location
      if (payload.animal_id && payload.to_location) {
        const { error: animalError } = await supabase
          .from('animals')
          .update({ location: payload.to_location, updated_at: now })
          .eq('id', payload.animal_id);
        if (animalError) throw animalError;
      }
    } catch (error) {
      console.warn("Network offline. Queueing Internal Movement to outbox.", error);
      
      // Queue the movement log
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'internal_movements',
        action: 'upsert',
        payload
      });

      // Queue the animal location update
      if (payload.animal_id && payload.to_location) {
        useOutboxStore.getState().addMutation({
          id: generateUUID(),
          table: 'animals',
          action: 'update',
          payload: { id: payload.animal_id, location: payload.to_location, updated_at: now }
        });
      }
    }

    // Invalidate the cache to trigger a UI refresh
    queryClient.invalidateQueries({ queryKey: ['internal_movements'] });
    queryClient.invalidateQueries({ queryKey: ['animals'] });
  },

  saveExternalTransfer: async (data: Partial<ExternalTransfer>, userId: string): Promise<void> => {
    const now = new Date().toISOString();
    const payload = {
      ...data,
      id: data.id || generateUUID(),
      authorized_by: userId,
      updated_at: now,
      created_at: data.created_at || now,
    } as ExternalTransfer;

    try {
      const { error } = await supabase.from('external_transfers').upsert(payload);
      if (error) throw error;

      // ZLA Automation: Auto-archive if leaving the collection
      if (payload.animal_id && (payload.transfer_type === 'DEPARTURE' || payload.transfer_type === 'DEATH')) {
        const { error: animalError } = await supabase
          .from('animals')
          .update({ 
            archived: true, 
            archive_type: payload.transfer_type, 
            archive_reason: payload.notes || 'Automated archive via external transfer ledger', 
            archived_at: payload.transfer_date, 
            updated_at: now 
          })
          .eq('id', payload.animal_id);
        if (animalError) throw animalError;
      }
    } catch (error) {
      console.warn("Network offline. Queueing External Transfer to outbox.", error);
      
      // Queue the transfer log
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'external_transfers',
        action: 'upsert',
        payload
      });

      // Queue the animal archive update
      if (payload.animal_id && (payload.transfer_type === 'DEPARTURE' || payload.transfer_type === 'DEATH')) {
        useOutboxStore.getState().addMutation({
          id: generateUUID(),
          table: 'animals',
          action: 'update',
          payload: { 
            id: payload.animal_id, 
            archived: true, 
            archive_type: payload.transfer_type, 
            archive_reason: payload.notes || 'Automated archive via external transfer ledger', 
            archived_at: payload.transfer_date, 
            updated_at: now 
          }
        });
      }
    }

    // Invalidate the cache to trigger a UI refresh
    queryClient.invalidateQueries({ queryKey: ['external_transfers'] });
    queryClient.invalidateQueries({ queryKey: ['animals'] });
  }
};