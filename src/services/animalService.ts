import { supabase } from '../lib/supabase';
import { queryClient } from '../lib/db';
import { useOutboxStore } from '../store/outboxStore';
import { AnimalSchema, Animal } from '../types/schema';

const generateUUID = () => crypto.randomUUID();

export const animalService = {
  getAnimals: async (): Promise<Animal[]> => {
    const { data, error } = await supabase.from('animals').select('*').eq('is_deleted', false);
    if (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }
    return data as Animal[];
  },
  
  // FIXED: Now requires userId to satisfy Zod schema rules
  saveAnimal: async (data: Partial<Animal>, userId: string, imageFile?: File, mapFile?: File) => {
    // 1. Sanitize Payload: Convert empty strings to null
    const sanitizedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value
      ])
    );

    const isNew = !sanitizedData.id;
    const recordId = sanitizedData.id || generateUUID();

    // 2. Storage Interceptor (Direct Bucket Upload)
    if (imageFile) {
      const ext = imageFile.name.split('.').pop();
      const fileName = `${recordId}-profile-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('animals').upload(fileName, imageFile, { upsert: true });
      
      if (uploadError) {
        console.warn('Profile image upload failed:', uploadError);
      } else {
        const { data: urlData } = supabase.storage.from('animals').getPublicUrl(fileName);
        sanitizedData.image_url = urlData.publicUrl;
      }
    }

    if (mapFile) {
      const ext = mapFile.name.split('.').pop();
      const fileName = `${recordId}-map-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('animals').upload(fileName, mapFile, { upsert: true });
      
      if (uploadError) {
        console.warn('Map image upload failed:', uploadError);
      } else {
        const { data: urlData } = supabase.storage.from('animals').getPublicUrl(fileName);
        sanitizedData.distribution_map_url = urlData.publicUrl;
      }
    }
    
    // 3. Iron-Clad Schema Mapping & Auth Binding
    const rawPayload = {
      ...sanitizedData,
      id: recordId,
      display_order: sanitizedData.display_order ?? 999,
      census_count: sanitizedData.census_count ?? 1,
      entity_type: sanitizedData.entity_type || 'individual',
      weight_unit: sanitizedData.weight_unit || 'g',
      red_list_status: sanitizedData.red_list_status || 'NE',
      is_venomous: !!sanitizedData.is_venomous,
      is_dob_unknown: !!sanitizedData.is_dob_unknown,
      has_no_id: !!sanitizedData.has_no_id,
      ambient_temp_only: !!sanitizedData.ambient_temp_only,
      lineage_unknown: !!sanitizedData.lineage_unknown,
      is_boarding: !!sanitizedData.is_boarding,
      is_quarantine: !!sanitizedData.is_quarantine,
      archived: !!sanitizedData.archived,
      is_deleted: false,
      created_by: isNew ? userId : (sanitizedData.created_by || userId),
      modified_by: userId,
      created_at: isNew ? new Date().toISOString() : sanitizedData.created_at,
      updated_at: new Date().toISOString()
    };

    // 4. The ZOD Shield
    const payload = AnimalSchema.parse(rawPayload);

    // 5. Optimistic UI Update (Inject into RAM)
    queryClient.setQueryData(['animals'], (old: Animal[] | undefined) => {
      if (!old) return [payload];
      return isNew ? [...old, payload] : old.map(a => a.id === payload.id ? payload : a);
    });

    // 6. The Cloud Strike
    try {
      const { error } = await supabase.from('animals').upsert(payload);
      if (error) {
        console.error('Supabase Upsert Error:', error.message);
        throw error;
      }
    } catch (error) {
      console.warn('Network offline or Postgres rejection. Failing over to local Outbox.', error);
      useOutboxStore.getState().addMutation({
        id: generateUUID(),
        table: 'animals',
        action: 'upsert',
        payload
      });
    }
  }
};