import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function isIgnorableAuthError(error: { name?: string; status?: number; message?: string } | null) {
  if (!error) return false;

  const message = error.message ?? '';
  const isSessionMissing = error.name === 'AuthSessionMissingError';
  const isUnauthorized = error.status === 401;
  const isInvalidRefreshToken =
    error.status === 400 && /refresh token|invalid refresh token/i.test(message);

  return isSessionMissing || isUnauthorized || isInvalidRefreshToken;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'));

  if (!hasAuthCookie) {
    if (request.nextUrl.pathname === '/auth') {
      return supabaseResponse;
    }

    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && !isIgnorableAuthError(error)) {
    throw new Error(`Unable to verify authenticated user: ${error.message}`);
  }

  if (error && /refresh token|invalid refresh token/i.test(error.message ?? '')) {
    request.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-')) {
        supabaseResponse.cookies.set(cookie.name, '', {
          maxAge: 0,
          expires: new Date(0),
          path: '/',
        });
      }
    });
  }

  if (request.nextUrl.pathname === '/auth') {
    if (user) {
      const next = request.nextUrl.searchParams.get('next');
      const destination = next?.startsWith('/host/') ? next : '/host/gps/setup';
      const redirectResponse = NextResponse.redirect(new URL(destination, request.url));
      supabaseResponse.cookies
        .getAll()
        .forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }

    return supabaseResponse;
  }

  if (!user) {
    const loginUrl = new URL('/auth', request.url);
    loginUrl.searchParams.set(
      'next',
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/auth', '/host/:path*'],
};
