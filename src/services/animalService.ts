// src/services/animalService.ts
import { supabase } from '../lib/supabase';
import { Animal } from '../types/schema';
import { useOutboxStore } from '../store/outboxStore';

export const animalService = {
  /**
   * Fetches the complete list of non-deleted animals.
   * Adheres to the DATABASE LAW: Reads from Supabase for initial hydration.
   */
  async getAnimals(): Promise<Animal[]> {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('is_deleted', false);

    if (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }
    return data as Animal[];
  },

  /**
   * Helper function to upload files to Supabase Storage and resolve public URLs.
   */
  async uploadFile(file: File, folder: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('animals')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw uploadError;
    }

    // Resolve and return the fully qualified public URL
    const { data } = supabase.storage
      .from('animals')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * Routes to UPDATE if id exists, or INSERT if it is new.
   * Safely handles multipart file uploads before saving the record.
   */
  async saveAnimal(
    animal: Partial<Animal>, 
    userId: string, 
    imageFile?: File, 
    mapFile?: File
  ): Promise<Animal> {
    
    // 1. Handle File Uploads First
    let imageUrl = animal.image_url;
    let mapUrl = animal.distribution_map_url;

    try {
      if (imageFile) {
        imageUrl = await this.uploadFile(imageFile, 'profiles');
      }
      if (mapFile) {
        mapUrl = await this.uploadFile(mapFile, 'maps');
      }
    } catch (uploadError) {
       console.error("Failed to upload images before saving record", uploadError);
       throw uploadError;
    }

    // 2. Construct final payload
    const payload = {
      ...animal,
      image_url: imageUrl,
      distribution_map_url: mapUrl,
      modified_by: userId,
      // Ensure created_by is only set on initial insertion
      ...(animal.id ? {} : { created_by: userId })
    };

    try {
      if (animal.id) {
        // UPDATE PATH
        const { data, error } = await supabase
          .from('animals')
          .update(payload)
          .eq('id', animal.id)
          .select()
          .single();

        if (error) throw error;
        return data as Animal;
      } else {
        // INSERT PATH
        const { data, error } = await supabase
          .from('animals')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        return data as Animal;
      }
    } catch (error) {
      console.error("Mutation failed, queueing to outbox:", error);
      // Fallback for offline usage
      useOutboxStore.getState().addMutation({
        id: crypto.randomUUID(),
        table: 'animals',
        action: animal.id ? 'update' : 'insert',
        payload: payload
      });
      throw error;
    }
  },

  async deleteAnimal(id: string, userId: string) {
    const { error } = await supabase
      .from('animals')
      .update({ is_deleted: true, modified_by: userId })
      .eq('id', id);
    
    if (error) throw error;
  }
};