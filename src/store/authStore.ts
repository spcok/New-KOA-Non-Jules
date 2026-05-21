import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Global reference to track the active subscription
let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitialized: false,
  initialize: async () => {
    if (!isSupabaseConfigured) {
      console.warn('Supabase is not configured. Skipping auth initialization.');
      set({ isInitialized: true, session: null, user: null });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, isInitialized: true });

      // Clean up existing listener before creating a new one
      if (authSubscription) {
        authSubscription.data.subscription.unsubscribe();
      }

      authSubscription = supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
    } catch (err) {
      console.error('Failed to initialize Supabase auth session', err);
      set({ isInitialized: true });
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
  },
}));