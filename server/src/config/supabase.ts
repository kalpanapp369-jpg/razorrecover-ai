import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

const isValidUrl = (url?: string): boolean => {
  if (!url || url === 'https://mock.supabase.co' || url.includes('your-project-id')) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

const serverKey = env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY !== 'mock-service-role-key'
  ? env.SUPABASE_SERVICE_ROLE_KEY
  : (env.SUPABASE_ANON_KEY && env.SUPABASE_ANON_KEY !== 'mock-anon-key' ? env.SUPABASE_ANON_KEY : '');

export const isSupabaseConfigured = Boolean(isValidUrl(env.SUPABASE_URL) && serverKey);

// Reusable single Supabase client instance
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(env.SUPABASE_URL, serverKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Tests the live Supabase connection with a lightweight probe query.
 * Returns true only when Supabase is reachable and responds successfully.
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return {
      connected: false,
      error: 'Supabase credentials are not configured in .env (or contain mock placeholders)',
    };
  }

  try {
    // Perform a lightweight probe query on the users or health check
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      // If table doesn't exist yet in a freshly created database, the server reached Supabase successfully
      if (error.code === '42P01' || error.message?.includes('relation "public.users" does not exist')) {
        return { connected: true };
      }
      return { connected: false, error: error.message };
    }

    return { connected: true };
  } catch (err: any) {
    return { connected: false, error: err.message || 'Failed to connect to Supabase' };
  }
}

export const isLiveDbConnected = () => isSupabaseConfigured;
