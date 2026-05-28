import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import type { ZLADocument, OperationalList, Organisation } from '../types/schema';

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

const withDeleteFailover = async (table: string, id: string, queryClient: any, queryKey: string[]) => {
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey });
  } catch (error) {
    console.warn(`[SyncEngine] Network failure. Queueing DELETE ${table} to Outbox.`, error);
    useOutboxStore.getState().addMutation({ id: crypto.randomUUID(), table, action: 'delete', payload: { id } });
    queryClient.invalidateQueries({ queryKey });
  }
};

export const useZLADocuments = () => useQuery({
  queryKey: ['zla_documents'],
  queryFn: async () => {
    const { data, error } = await supabase.from('zla_documents').select('*');
    if (error) throw error;
    return data as ZLADocument[];
  },
});

export const useSaveZLADocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (document: Partial<ZLADocument>) => {
      const payload = { ...document, uploaded_at: new Date().toISOString() };
      await withFailover('zla_documents', payload, queryClient, ['zla_documents']);
    },
  });
};

export const useDeleteZLADocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await withDeleteFailover('zla_documents', id, queryClient, ['zla_documents']);
    },
  });
};

export const useOperationalLists = () => useQuery({
  queryKey: ['operational_lists'],
  queryFn: async () => {
    const { data, error } = await supabase.from('operational_lists').select('*').eq('is_deleted', false);
    if (error) throw error;
    return data as OperationalList[];
  },
});

export const useSaveOperationalList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (list: Partial<OperationalList>) => {
      const payload = { ...list, updated_at: new Date().toISOString() };
      await withFailover('operational_lists', payload, queryClient, ['operational_lists']);
    },
  });
};

export const useDeleteOperationalList = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const payload = { id, is_deleted: true, updated_at: new Date().toISOString() };
      await withFailover('operational_lists', payload, queryClient, ['operational_lists']);
    },
  });
};

export const useOrganisation = () => useQuery({
  queryKey: ['organisation'],
  queryFn: async () => {
    const { data, error } = await supabase.from('organisations').select('*').limit(1).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Organisation | null;
  },
});

export const useSaveOrganisation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (org: Partial<Organisation>) => {
      const payload = { ...org, updated_at: new Date().toISOString() };
      await withFailover('organisations', payload, queryClient, ['organisation']);
    },
  });
};
