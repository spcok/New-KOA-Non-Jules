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
   * The complete structural fix for the Modal call site.
   * Routes to UPDATE if id exists, or INSERT if it is new.
   */
  async saveAnimal(animal: Partial<Animal>, userId: string): Promise<Animal> {
    const payload = {
      ...animal,
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