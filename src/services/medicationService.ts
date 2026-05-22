import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { ClinicalScheduleSchema, MedicationLogSchema, Animal, User } from '../types/schema';
import { z } from 'zod';
import { queryClient } from '../lib/db';

type ClinicalSchedule = z.infer<typeof ClinicalScheduleSchema>;
type MedicationLog = z.infer<typeof MedicationLogSchema>;

const generateUUID = () => crypto.randomUUID();

export const medicationService = {
  getAnimals: async (): Promise<Animal[]> => {
    const { data, error } = await supabase.from('animals').select('id, name, species').eq('is_deleted', false);
    if (error) throw error;
    return data as Animal[];
  },

  getStaffMembers: async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('id, name, email, role').eq('is_deleted', false);
    if (error) throw error;
    return data as User[];
  },

  getActiveSchedules: async (): Promise<ClinicalSchedule[]> => {
    const { data, error } = await supabase
      .from('clinical_schedules')
      .select('*')
      .eq('is_deleted', false)
      .eq('status', 'ACTIVE')
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data as ClinicalSchedule[];
  },

  getAllSchedules: async (): Promise<ClinicalSchedule[]> => {
    const { data, error } = await supabase
      .from('clinical_schedules')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as ClinicalSchedule[];
  },

  getLogs: async (): Promise<MedicationLog[]> => {
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('is_deleted', false)
      .order('administered_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data as MedicationLog[];
  },

  saveSchedule: async (data: Partial<ClinicalSchedule>, userId: string): Promise<void> => {
    const isNew = !data.id;
    
    // NULL LAW Enforcement
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
    );

    const payload = ClinicalScheduleSchema.parse({
      ...sanitizedData,
      id: sanitizedData.id || generateUUID(),
      status: sanitizedData.status || 'ACTIVE',
      created_by: isNew ? userId : (sanitizedData.created_by || userId),
      modified_by: userId,
      created_at: isNew ? new Date().toISOString() : sanitizedData.created_at,
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('clinical_schedules').upsert(payload);
      if (error) throw error;
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'clinical_schedules',
        action: 'upsert',
        payload
      });
    }
    queryClient.invalidateQueries({ queryKey: ['clinical_schedules'] });
  },

  logDose: async (data: Partial<MedicationLog>, userId: string): Promise<void> => {
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === '' ? null : value])
    );

    const payload = MedicationLogSchema.parse({
      ...sanitizedData,
      id: generateUUID(),
      administered_by: userId,
      created_by: userId,
      modified_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('medication_logs').insert(payload);
      if (error) throw error;
    } catch (error) {
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'medication_logs',
        action: 'insert',
        payload
      });
    }
    queryClient.invalidateQueries({ queryKey: ['medication_logs'] });
  },

  quickAdminister: async (scheduleData: Partial<ClinicalSchedule>, logStatus: string, notes: string | null, userId: string): Promise<void> => {
    const scheduleId = generateUUID();
    const now = new Date().toISOString();

    // 1. Create the ONE-OFF Rule
    const schedulePayload = ClinicalScheduleSchema.parse({
      ...scheduleData,
      id: scheduleId,
      schedule_type: 'ONE_OFF',
      frequency: 'STAT',
      start_date: now.split('T')[0],
      end_date: now.split('T')[0],
      status: 'COMPLETED', // Immediately completed
      created_by: userId,
      modified_by: userId,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    });

    // 2. Create the Administration Event
    const logPayload = MedicationLogSchema.parse({
      id: generateUUID(),
      schedule_id: scheduleId,
      animal_id: scheduleData.animal_id,
      administered_at: now,
      status: logStatus,
      notes: notes === '' ? null : notes,
      administered_by: userId,
      created_by: userId,
      modified_by: userId,
      created_at: now,
      updated_at: now,
      is_deleted: false,
    });

    try {
      const { error: sErr } = await supabase.from('clinical_schedules').insert(schedulePayload);
      if (sErr) throw sErr;
      const { error: lErr } = await supabase.from('medication_logs').insert(logPayload);
      if (lErr) throw lErr;
    } catch (error) {
      useOutboxStore.getState().addMutation({ id: generateUUID(), table: 'clinical_schedules', action: 'insert', payload: schedulePayload });
      useOutboxStore.getState().addMutation({ id: generateUUID(), table: 'medication_logs', action: 'insert', payload: logPayload });
    }
    queryClient.invalidateQueries({ queryKey: ['clinical_schedules'] });
    queryClient.invalidateQueries({ queryKey: ['medication_logs'] });
  }
};