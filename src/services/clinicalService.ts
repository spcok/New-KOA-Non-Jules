import { supabase } from '../lib/supabase';
import { useOutboxStore } from '../store/outboxStore';
import { ClinicalRecord, ClinicalRecordSchema, User, Animal } from '../types/schema';
import { queryClient } from '../lib/db';

const generateUUID = () => crypto.randomUUID();

export const clinicalService = {
  getStaffMembers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, initials, role')
      .eq('is_deleted', false);
    if (error) throw error;
    return data as User[];
  },

  getAnimals: async (): Promise<Animal[]> => {
    const { data, error } = await supabase
      .from('animals')
      .select('id, name, species, ring_number, microchip_id')
      .eq('is_deleted', false)
      .order('name');
    if (error) throw error;
    return data as Animal[];
  },

  // --- SOAP CLINICAL RECORDS ---
  getClinicalRecords: async (): Promise<ClinicalRecord[]> => {
    const { data, error } = await supabase
      .from('clinical_records')
      .select('*')
      .eq('is_deleted', false)
      .order('record_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching clinical records:", error);
      throw error;
    }
    return data as ClinicalRecord[];
  },

  saveClinicalRecord: async (data: Partial<ClinicalRecord>, userId: string): Promise<void> => {
    const isNew = !data.id;
    
    // ZOD LAW: Ensure strict string requirements are met for external vet fields if internal
    const payload = ClinicalRecordSchema.parse({
      ...data,
      id: data.id || generateUUID(),
      external_vet_name: data.external_vet_name || 'N/A',
      external_vet_clinic: data.external_vet_clinic || 'N/A',
      created_by: isNew ? userId : (data.created_by || userId),
      modified_by: userId,
      created_at: isNew ? new Date().toISOString() : data.created_at,
      updated_at: new Date().toISOString(),
      is_deleted: false,
    });

    try {
      const { error } = await supabase.from('clinical_records').upsert(payload);
      if (error) throw error;
    } catch (error) {
      console.warn("Network offline. Queueing Clinical Record to outbox.", error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'clinical_records',
        action: 'upsert',
        payload
      });
    }
    
    queryClient.invalidateQueries({ queryKey: ['clinical_records'] });
  }
};