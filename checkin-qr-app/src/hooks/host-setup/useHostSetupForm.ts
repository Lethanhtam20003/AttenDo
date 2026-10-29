'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/actions/events';
import type { CustomFieldConfig } from '@/types/database';
import type { HostSetupCustomField } from './useCustomFields';

interface Coordinates {
  lat: number;
  lng: number;
}

export function useHostSetupForm(
  coordinates: Coordinates,
  radius: number,
  fields: HostSetupCustomField[]
) {
  const router = useRouter();
  const [eventTitle, setEventTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLaunch = useCallback(() => {
    setErrorMsg(null);
    if (!eventTitle.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện trước khi khởi chạy.');
      return;
    }

    startTransition(async () => {
      const customFields: CustomFieldConfig[] = fields.map((field) => ({
        key: field.key,
        label: field.label,
        type: field.type,
        required: field.required,
        ...(field.options ? { options: field.options } : {}),
      }));

      const result = await createEvent({
        title: eventTitle.trim(),
        location_lat: coordinates.lat,
        location_lng: coordinates.lng,
        radius_meters: radius,
        custom_fields: customFields,
      });

      if (!result.success) {
        setErrorMsg(result.error);
        return;
      }

      router.push(`/host/live/${result.data.eventId}`);
    });
  }, [coordinates.lat, coordinates.lng, eventTitle, fields, radius, router]);

  return { eventTitle, setEventTitle, errorMsg, isPending, handleLaunch };
}
