import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import type { User, Shift, Timesheet, Task, LeaveRequest } from '../types/schema';

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

export const useUsers = () => useQuery({
  queryKey: ['users'],
  queryFn: async () => {
    const { data, error } = await supabase.from('users').select('*').eq('is_active', true);
    if (error) throw error;
    return data as User[];
  },
});

export const useSaveUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: Partial<User>) => {
      const payload = { ...user, updated_at: new Date().toISOString() };
      await withFailover('users', payload, queryClient, ['users']);
    },
  });
};

export const useShifts = () => useQuery({
  queryKey: ['shifts'],
  queryFn: async () => {
    const { data, error } = await supabase.from('shifts').select('*');
    if (error) throw error;
    return data as Shift[];
  },
});

export const useSaveShift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shift: Partial<Shift>) => {
      const payload = { ...shift, updated_at: new Date().toISOString() };
      await withFailover('shifts', payload, queryClient, ['shifts']);
    },
  });
};

export const useTimesheets = () => useQuery({
  queryKey: ['timesheets'],
  queryFn: async () => {
    const { data, error } = await supabase.from('timesheets').select('*').order('clock_in_time', { ascending: false });
    if (error) throw error;
    return data as Timesheet[];
  },
});

export const useActiveShift = (userId: string | undefined) => useQuery({
  queryKey: ['active_shift', userId],
  queryFn: async () => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('user_id', userId)
      .is('clock_out_time', null)
      .eq('is_deleted', false)
      .order('clock_in_time', { ascending: false })
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as Timesheet | null;
  },
  enabled: !!userId,
});

export const useSaveTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (timesheet: Partial<Timesheet>) => {
      const payload = { ...timesheet, updated_at: new Date().toISOString() };
      await withFailover('timesheets', payload, queryClient, ['timesheets']);
    },
  });
};

export const useTasks = () => useQuery({
  queryKey: ['tasks'],
  queryFn: async () => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) throw error;
    return data as Task[];
  },
});

export const useSaveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const payload = { ...task, updated_at: new Date().toISOString() };
      await withFailover('tasks', payload, queryClient, ['tasks']);
    },
  });
};

export const useLeaveRequests = () => useQuery({
  queryKey: ['leave_requests'],
  queryFn: async () => {
    const { data, error } = await supabase.from('leave_requests').select('*');
    if (error) throw error;
    return data as LeaveRequest[];
  },
});

export const useSaveLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: Partial<LeaveRequest>) => {
      const payload = { ...request, updated_at: new Date().toISOString() };
      await withFailover('leave_requests', payload, queryClient, ['leave_requests']);
    },
  });
};
