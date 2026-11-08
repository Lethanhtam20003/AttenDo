import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();

  // Nếu đã cấu hình CRON_SECRET trên Vercel, chỉ cho phép request có Authorization: Bearer <CRON_SECRET>
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized cron invocation.' },
        { status: 401 }
      );
    }
  }

  const startedAt = Date.now();

  try {
    const supabase = await createClient();

    // Thực thi truy vấn đọc nhẹ lên bảng public.events để ghi nhận hoạt động API + Postgres trên Supabase
    const { count, error } = await supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .limit(1);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          service: 'supabase-keep-alive',
          error: error.message,
          checkedAt: new Date().toISOString(),
        },
        {
          status: 500,
          headers: { 'Cache-Control': 'no-store, max-age=0' },
        }
      );
    }

    const latencyMs = Date.now() - startedAt;

    return NextResponse.json(
      {
        ok: true,
        service: 'supabase-keep-alive',
        eventsCount: count ?? 0,
        latencyMs,
        checkedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: 'supabase-keep-alive',
        error: error instanceof Error ? error.message : 'Unexpected keep-alive error.',
        checkedAt: new Date().toISOString(),
      },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  }
}
