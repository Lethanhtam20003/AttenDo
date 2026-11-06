import type { CheckInEvent, CustomFieldConfig } from '@/types/database';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCustomFieldConfig(value: unknown): value is CustomFieldConfig {
  if (!isRecord(value)) return false;
  if (
    typeof value.key !== 'string' ||
    typeof value.label !== 'string' ||
    typeof value.required !== 'boolean' ||
    !['text', 'tel', 'number', 'select'].includes(String(value.type))
  ) {
    return false;
  }

  return value.options === undefined ||
    (Array.isArray(value.options) && value.options.every((option) => typeof option === 'string'));
}

export function serializeCheckInEventConfig(event: CheckInEvent): string {
  return JSON.stringify({
    id: event.id,
    title: event.title,
    status: event.status,
    location_lat: event.location_lat,
    location_lng: event.location_lng,
    radius_meters: event.radius_meters,
    module_settings: {
      require_location: event.module_settings?.require_location !== false,
      require_pin: event.module_settings?.require_pin !== false,
      dynamic_qr: event.module_settings?.dynamic_qr === true,
    },
    custom_fields: event.custom_fields.map(({ key, label, type, required, options }) => ({
      key,
      label,
      type,
      required,
      ...(options ? { options } : {}),
    })),
  });
}

export function parseCheckInEventConfig(
  serializedConfig: string | undefined,
  expectedEventId: string
): CheckInEvent | null {
  if (!serializedConfig) return null;

  try {
    const value: unknown = JSON.parse(serializedConfig);
    if (!isRecord(value) || value.id !== expectedEventId || typeof value.title !== 'string') {
      return null;
    }

    if (!['active', 'closed', 'draft'].includes(String(value.status))) return null;
    if (
      !(value.location_lat === null || (typeof value.location_lat === 'number' && Number.isFinite(value.location_lat))) ||
      !(value.location_lng === null || (typeof value.location_lng === 'number' && Number.isFinite(value.location_lng))) ||
      typeof value.radius_meters !== 'number' ||
      !Number.isFinite(value.radius_meters) ||
      !Array.isArray(value.custom_fields) ||
      !value.custom_fields.every(isCustomFieldConfig) ||
      !isRecord(value.module_settings)
    ) {
      return null;
    }

    const settings = value.module_settings;
    if (
      typeof settings.require_location !== 'boolean' ||
      typeof settings.require_pin !== 'boolean' ||
      typeof settings.dynamic_qr !== 'boolean'
    ) {
      return null;
    }

    return {
      id: value.id,
      title: value.title,
      status: value.status as CheckInEvent['status'],
      location_lat: value.location_lat,
      location_lng: value.location_lng,
      radius_meters: value.radius_meters,
      module_settings: {
        require_location: settings.require_location,
        require_pin: settings.require_pin,
        dynamic_qr: settings.dynamic_qr,
      },
      custom_fields: value.custom_fields,
    };
  } catch {
    return null;
  }
}
