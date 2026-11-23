import type { Backend } from "./backend";
import { LocalBackend } from "./local-backend";
import { SupabaseBackend } from "./supabase-backend";

let instance: Backend | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Returns the live Supabase backend when configured, otherwise the local demo backend. */
export function getBackend(): Backend {
  if (instance) return instance;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  instance = url && key ? new SupabaseBackend(url, key) : new LocalBackend();
  return instance;
}

export * from "./backend";
