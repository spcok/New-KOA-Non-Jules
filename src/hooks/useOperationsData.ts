import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import type { Incident, SafetyDrill, MaintenanceTicket } from '../types/schema';

const withFailover = async (table: string, payload: any, queryClient: any, queryKey: string[]) => {
  try {
    const { error } = await supabase.from(table).upsert(payload);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey });
  } catch (error) {
    console.warn(`[SyncEngine] Network failure. Queueing ${table} to Outbox.`, error);
    useOutboxStore.getState().addMutation({ id: crypto.randomUUID(), table, action: 'upsert', payload });
    queryClient.invalidateQueries({ queryKey });
  }
};

export const useIncidents = () => useQuery({
  queryKey: ['incidents'],
  queryFn: async () => {
    const { data, error } = await supabase.from('incidents').select('*');
    if (error) throw error;
    return data as Incident[];
  },
});

export const useSaveIncident = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (incident: Partial<Incident>) => {
      const payload = { ...incident, updated_at: new Date().toISOString() };
      await withFailover('incidents', payload, queryClient, ['incidents']);
    },
  });
};

export const useSafetyDrills = () => useQuery({
  queryKey: ['safety_drills'],
  queryFn: async () => {
    const { data, error } = await supabase.from('safety_drills').select('*');
    if (error) throw error;
    return data as SafetyDrill[];
  },
});

export const useSaveSafetyDrill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (drill: Partial<SafetyDrill>) => {
      const payload = { ...drill, updated_at: new Date().toISOString() };
      await withFailover('safety_drills', payload, queryClient, ['safety_drills']);
    },
  });
};

export const useMaintenanceTickets = () => useQuery({
  queryKey: ['maintenance_tickets'],
  queryFn: async () => {
    const { data, error } = await supabase.from('maintenance_tickets').select('*');
    if (error) throw error;
    return data as MaintenanceTicket[];
  },
});

export const useSaveMaintenanceTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: Partial<MaintenanceTicket>) => {
      const payload = { ...ticket, updated_at: new Date().toISOString() };
      await withFailover('maintenance_tickets', payload, queryClient, ['maintenance_tickets']);
    },
  });
};

export const useInternalMovements = () => useQuery({
  queryKey: ['internal_movements'],
  queryFn: async () => {
    const { data, error } = await supabase.from('internal_movements').select('*');
    if (error) throw error;
    return data as any[];
  },
});

export const useSaveInternalMovement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movement: any) => {
      const payload = { ...movement, updated_at: new Date().toISOString() };
      await withFailover('internal_movements', payload, queryClient, ['internal_movements']);
    },
  });
};

export const useExternalTransfers = () => useQuery({
  queryKey: ['external_transfers'],
  queryFn: async () => {
    const { data, error } = await supabase.from('external_transfers').select('*');
    if (error) throw error;
    return data as any[];
  },
});

export const useSaveExternalTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transfer: any) => {
      const payload = { ...transfer, updated_at: new Date().toISOString() };
      await withFailover('external_transfers', payload, queryClient, ['external_transfers']);
    },
  });
};
