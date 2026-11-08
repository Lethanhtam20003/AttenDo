import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function isIgnorableAuthError(error: { name?: string; status?: number; message?: string } | null) {
  if (!error) return false;

  const message = error.message ?? '';
  const isSessionMissing = error.name === 'AuthSessionMissingError';
  const isUnauthorized = error.status === 401;
  const isInvalidRefreshToken =
    error.status === 400 && /refresh token|invalid refresh token/i.test(message);

  return isSessionMissing || isUnauthorized || isInvalidRefreshToken;
}

/**
 * Dùng trong Server Components, Server Actions, Route Handlers.
 * Đọc cookie từ request để hỗ trợ xác thực phía server.
 */
export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Khi gọi ngoài request context (scripts, background tasks, unit tests)
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore ? cookieStore.getAll() : [];
        },
        setAll(cookiesToSet) {
          if (!cookieStore) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component không thể set cookie – bỏ qua
          }
        },
      },
    }
  );
}

export async function getUserSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && !isIgnorableAuthError(error)) {
    throw new Error(`Unable to verify authenticated user: ${error.message}`);
  }

  return user;
}

export async function verifyAuth() {
  const user = await getUserSession();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
