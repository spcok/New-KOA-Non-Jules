import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Critical configuration flag required by SyncEngine and Auth initialization
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Enforce graceful failover initialization instead of throwing hard compiler errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// DYNAMIC URL HEALER: Instantly rewrites stale zrok/ngrok origins to the current live environment URL
export const getDynamicImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const urlObj = new URL(url);
    // If it's a Supabase storage URL, swap the dead origin to the active env URL
    if (supabaseUrl && urlObj.pathname.includes('/storage/v1/object/public/')) {
      return `${supabaseUrl}${urlObj.pathname}`;
    }
  } catch (e) {
    return url;
  }
  return url;
};