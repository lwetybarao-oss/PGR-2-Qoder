import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback values - usados quando env vars nao estao configuradas (ex: Vercel)
const FALLBACK_URL = 'https://tuzwhphlmaqdljdhztuy.supabase.co';
const FALLBACK_SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1endocGhsbWFxZGxqZGh6dHV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU2ODAxMCwiZXhwIjoyMDkwMTQ0MDEwfQ.KxKWsbywICA3-QdKeahFBhFwBvuAWGaszblTriq8sYs';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1endocGhsbWFxZGxqZGh6dHV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjgwMTAsImV4cCI6MjA5MDE0NDAxMH0.S9eykBwv4iJcy8wuwR34ICdvEhKlUe1wPV0gl1SKzBM';

// Obter valor de env ou fallback
function getEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}

// Inicializacao preguicosa (lazy) para evitar crash
let _supabase: SupabaseClient | null = null;
let _supabaseClient: SupabaseClient | null = null;

// Client para uso no servidor (service_role) - bypass RLS
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      getEnv('NEXT_PUBLIC_SUPABASE_URL', FALLBACK_URL),
      getEnv('SUPABASE_SERVICE_ROLE_KEY', FALLBACK_SERVICE_ROLE),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return _supabase;
}

// Alias para compatibilidade com codigo existente
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  }
});

// Client para uso no cliente (anon key) - sujeito a RLS
export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseClient) {
    _supabaseClient = createClient(
      getEnv('NEXT_PUBLIC_SUPABASE_URL', FALLBACK_URL),
      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', FALLBACK_ANON_KEY)
    );
  }
  return _supabaseClient;
}

export const supabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') return value.bind(client);
    return value;
  }
});

// Helper: Converter nome de coluna camelCase para snake_case para Supabase
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

// Helper: Converter nome de coluna snake_case para camelCase do Supabase
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Converter array de snake_case para camelCase
export function toCamelCaseArray(arr: Record<string, any>[]): Record<string, any>[] {
  return arr.map(toCamelCase);
}
