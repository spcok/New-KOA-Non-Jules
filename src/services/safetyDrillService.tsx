import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { SafetyDrill, SafetyDrillSchema, Timesheet, User } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const safetyDrillService = {
  getStaffMembers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, initials, role')
      .eq('is_deleted', false);

    if (error) throw error;
    return data as User[];
  },

  getActiveTimesheets: async (): Promise<Timesheet[]> => {
    const { data, error } = await supabase
      .from('timesheets')
      .select('*')
      .eq('status', 'ACTIVE')
      .is('clock_out_time', null)
      .eq('is_deleted', false);

    if (error) throw error;
    return data as Timesheet[];
  },

  getDrills: async (): Promise<SafetyDrill[]> => {
    const { data, error } = await supabase
      .from('safety_drills')
      .select('*')
      .eq('is_deleted', false)
      .order('drill_date', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data as SafetyDrill[];
  },

  saveDrill: async (data: Partial<SafetyDrill>, userId: string): Promise<void> => {
    // NULL LAW enforcement
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const payload = SafetyDrillSchema.parse({
      ...sanitizedData,
      id: sanitizedData.id || generateUUID(),
      roll_call_completed: sanitizedData.roll_call_completed ?? false,
      is_simulation: sanitizedData.is_simulation ?? true,
      status: sanitizedData.status || 'COMPLETED',
      conducted_by: sanitizedData.id ? sanitizedData.conducted_by : userId,
      modified_at: new Date().toISOString(),
      created_at: sanitizedData.id ? sanitizedData.created_at : new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('safety_drills').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Safety Drill to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'safety_drills',
        action: 'upsert',
        payload
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['safety_drills'] });
  }
};