import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import type { Animal, FeedingSchedule, DailyLog, DailyRound, OperationalList } from '../types/schema';

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

export const useAnimals = () => useQuery({
  queryKey: ['animals'],
  queryFn: async () => {
    const { data, error } = await supabase.from('animals').select('*').eq('is_deleted', false);
    if (error) throw error;
    return data as Animal[];
  },
});

export const useSaveAnimal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ animal, userId, imageFile, mapFile }: { animal: Partial<Animal>; userId: string; imageFile?: File; mapFile?: File }) => {
      let imageUrl = animal.image_url;
      let mapUrl = animal.distribution_map_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('public').upload(`animals/${fileName}`, imageFile);
        if (!uploadError) imageUrl = supabase.storage.from('public').getPublicUrl(`animals/${fileName}`).data.publicUrl;
      }

      if (mapFile) {
        const fileExt = mapFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('public').upload(`maps/${fileName}`, mapFile);
        if (!uploadError) mapUrl = supabase.storage.from('public').getPublicUrl(`maps/${fileName}`).data.publicUrl;
      }

      const payload = { ...animal, created_by: userId, updated_at: new Date().toISOString(), image_url: imageUrl, distribution_map_url: mapUrl };
      await withFailover('animals', payload, queryClient, ['animals']);
    },
  });
};

export const useFeedingSchedules = () => useQuery({
  queryKey: ['feeding_schedules'],
  queryFn: async () => {
    const { data, error } = await supabase.from('feeding_schedules').select('*');
    if (error) throw error;
    return data as FeedingSchedule[];
  },
});

export const useSaveFeedingSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: Partial<FeedingSchedule>) => {
      const payload = { ...schedule, updated_at: new Date().toISOString() };
      await withFailover('feeding_schedules', payload, queryClient, ['feeding_schedules']);
    },
  });
};

export const useDeleteFeedingSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const { error } = await supabase.from('feeding_schedules').delete().eq('id', id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['feeding_schedules'] });
      } catch (error) {
        useOutboxStore.getState().addMutation({ id: crypto.randomUUID(), table: 'feeding_schedules', action: 'delete', payload: { id } });
      }
    },
  });
};

export const useDailyLogs = () => useQuery({
  queryKey: ['daily_logs'],
  queryFn: async () => {
    const { data, error } = await supabase.from('daily_logs').select('*').order('log_date', { ascending: false });
    if (error) throw error;
    return data as DailyLog[];
  },
});

export const useAnimalLogs = (animalId: string) => useQuery({
  queryKey: ['daily_logs', animalId],
  queryFn: async () => {
    const { data, error } = await supabase.from('daily_logs').select('*').eq('animal_id', animalId).order('log_date', { ascending: false });
    if (error) throw error;
    return data as DailyLog[];
  },
  enabled: !!animalId
});

export const useSaveDailyLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<DailyLog>) => {
      const payload = { ...log, updated_at: new Date().toISOString() };
      await withFailover('daily_logs', payload, queryClient, ['daily_logs']);
    },
  });
};

export const useDailyRounds = () => useQuery({
  queryKey: ['daily_rounds'],
  queryFn: async () => {
    const { data, error } = await supabase.from('daily_rounds').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as DailyRound[];
  },
});

export const useSaveDailyRound = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (round: Partial<DailyRound>) => {
      const payload = { ...round, updated_at: new Date().toISOString() };
      await withFailover('daily_rounds', payload, queryClient, ['daily_rounds']);
    },
  });
};
