import { supabase } from '../lib/supabase';
import { Animal } from '../types/schema';

export const animalService = {
  getAnimals: async (): Promise<Animal[]> => {
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('is_deleted', false)
      .order('display_order', { ascending: true });
      
    if (error) {
      console.error("Error fetching animals:", error);
      throw error;
    }
    return data as Animal[];
  }
};