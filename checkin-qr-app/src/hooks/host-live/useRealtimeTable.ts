'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

/**
 * Lắng nghe Supabase Realtime Postgres Changes cho một bảng cụ thể.
 *
 * @param table  - Tên bảng (e.g. 'attendance_records')
 * @param filter - Bộ lọc (e.g. `event_id=eq.${eventId}`)
 * @param event  - Loại sự kiện ('INSERT' | 'UPDATE' | 'DELETE' | '*')
 * @param onData - Callback nhận payload khi có thay đổi
 */
export function useRealtimeTable<T extends Record<string, unknown>>(
  table: string,
  filter: string,
  event: ChangeEvent,
  onData: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  // Store latest callback in a ref — updated in an effect (not during render)
  const onDataRef = useRef(onData);
  useEffect(() => {
    onDataRef.current = onData;
  });

  const subscribe = useCallback(() => {
    if (!filter || filter.endsWith('=eq.undefined')) {
      return () => undefined;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime:${table}:${filter}`)
      .on(
        'postgres_changes',
        { event, schema: 'public', table, filter },
        (payload) => onDataRef.current(payload as RealtimePostgresChangesPayload<T>)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [table, filter, event]);

  useEffect(() => {
    const cleanup = subscribe();
    return cleanup;
  }, [subscribe]);
}
