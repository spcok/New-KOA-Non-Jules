import { baseService } from './baseService';
import { tasksCollection } from '../lib/db';
import type { Task } from '../types/schema';

export const taskService = {
  saveTask: async (data: Partial<Task>, userId: string): Promise<void> => {
    const payload = { ...data, created_by: userId, updated_at: new Date().toISOString() };
    await tasksCollection.upsert(payload as any);
    await baseService.upsert({
      table: 'tasks',
      payload,
      queryKey: ['tasks']
    });
  }
};