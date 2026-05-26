import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { Timesheet, TimesheetSchema, User } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const timesheetService = {
  getActiveShift: async (userId: string): Promise<Timesheet | null> => {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACTIVE')
      .eq('is_deleted', false)
      .limit(1);

    if (error) {
      console.error("Error fetching active shift:", error);
      throw error;
    }
    return (data && data.length > 0) ? (data[0] as Timesheet) : null;
  },

  getStaffMembers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, initials, role')
      .eq('is_deleted', false);

    if (error) {
      console.error("Error fetching staff members:", error);
      throw error;
    }
    return data as User[];
  },

  getTimesheets: async (): Promise<Timesheet[]> => {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('is_deleted', false)
      .order('shift_date', { ascending: false })
      .order('clock_in_time', { ascending: false })
      .limit(200);

    if (error) {
      console.error("Error fetching timesheets:", error);
      throw error;
    }
    
    return data as Timesheet[];
  },

  clockIn: async (userId: string): Promise<void> => {
    const now = new Date();
    const shiftDate = now.toISOString().split('T')[0];

    const payload = TimesheetSchema.parse({
      id: generateUUID(),
      user_id: userId,
      shift_date: shiftDate,
      clock_in_time: now.toISOString(),
      clock_out_time: null,
      status: 'ACTIVE',
      notes: null,
      is_deleted: false,
      created_by: userId,
      modified_by: userId,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });

    try {
      const { error } = await supabase.from('timesheets').insert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Clock-In to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'timesheets',
        action: 'insert',
        payload
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['timesheets'] });
  },

  clockOut: async (timesheet: Timesheet, userId: string, notes?: string): Promise<void> => {
    const now = new Date();

    const payload = TimesheetSchema.parse({
      ...timesheet,
      clock_out_time: now.toISOString(),
      status: 'COMPLETED',
      notes: notes || null, // NULL LAW enforcement
      modified_by: userId,
      updated_at: now.toISOString(),
    });

    try {
      const { error } = await supabase.from('timesheets').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Clock-Out to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'timesheets',
        action: 'upsert',
        payload
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['timesheets'] });
  }
};