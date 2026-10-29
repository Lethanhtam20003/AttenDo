import { createBrowserClient } from '@supabase/ssr';

/**
 * Dùng trong Client Components ('use client')
 * Mỗi lần gọi trả về cùng instance nhờ module cache.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

