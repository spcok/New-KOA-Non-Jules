import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import type { ClinicalRecord, MedicationLog, IsolationLog, FirstAidLog } from '../types/schema';

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

export const useClinicalRecords = () => useQuery({
  queryKey: ['clinical_records'],
  queryFn: async () => {
    const { data, error } = await supabase.from('clinical_records').select('*').order('record_date', { ascending: false });
    if (error) throw error;
    return data as ClinicalRecord[];
  },
});

export const useSaveClinicalRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ record, attachmentFile }: { record: Partial<ClinicalRecord>; attachmentFile?: File }) => {
      let attachmentUrl: string | null = null;
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('secure-clinical').upload(`attachments/${fileName}`, attachmentFile);
        if (!uploadError) attachmentUrl = supabase.storage.from('secure-clinical').getPublicUrl(`attachments/${fileName}`).data.publicUrl;
      }
      const payload = { ...record, updated_at: new Date().toISOString() };
      await withFailover('clinical_records', payload, queryClient, ['clinical_records']);
      // We are ignoring clinical_attachments table logic for brevity unless requested
    },
  });
};

export const useMedicationLogs = () => useQuery({
  queryKey: ['medication_logs'],
  queryFn: async () => {
    const { data, error } = await supabase.from('medication_logs').select('*');
    if (error) throw error;
    return data as MedicationLog[];
  },
});

export const useSaveMedicationLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<MedicationLog>) => {
      const payload = { ...log, updated_at: new Date().toISOString() };
      await withFailover('medication_logs', payload, queryClient, ['medication_logs']);
    },
  });
};

export const useIsolationLogs = () => useQuery({
  queryKey: ['isolation_logs'],
  queryFn: async () => {
    const { data, error } = await supabase.from('isolation_logs').select('*');
    if (error) throw error;
    return data as IsolationLog[];
  },
});

export const useSaveIsolationLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<IsolationLog>) => {
      const payload = { ...log, updated_at: new Date().toISOString() };
      await withFailover('isolation_logs', payload, queryClient, ['isolation_logs']);
    },
  });
};

export const useFirstAidLogs = () => useQuery({
  queryKey: ['first_aid_logs'],
  queryFn: async () => {
    const { data, error } = await supabase.from('first_aid_logs').select('*');
    if (error) throw error;
    return data as FirstAidLog[];
  },
});

export const useSaveFirstAidLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<FirstAidLog>) => {
      const payload = { ...log, updated_at: new Date().toISOString() };
      await withFailover('first_aid_logs', payload, queryClient, ['first_aid_logs']);
    },
  });
};
