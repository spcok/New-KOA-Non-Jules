import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Mutation {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'upsert' | 'delete';
  payload: any;
}

interface OutboxState {
  mutations: Mutation[];
  addMutation: (mutation: Mutation) => void;
  removeMutation: (id: string) => void;
}

export const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      mutations: [],
      addMutation: (mutation) => set((state) => ({ mutations: [...state.mutations, mutation] })),
      removeMutation: (id) => set((state) => ({ mutations: state.mutations.filter((m) => m.id !== id) })),
    }),
    { name: 'vetaura-outbox' }
  )
);
