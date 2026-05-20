import { supabase } from '../lib/supabase';
import { Task } from '../types/schema';

export const taskService = {
  getPendingTasks: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', 'PENDING')
      .eq('is_deleted', false);

    if (error) {
      console.error('Error fetching pending tasks:', error);
      throw error;
    }
    return data as Task[];
  }
};
