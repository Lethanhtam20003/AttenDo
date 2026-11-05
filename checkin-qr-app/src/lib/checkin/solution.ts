import type { CheckInEvent } from '@/types/database';

export interface CheckInRequirements {
  requireLocation: boolean;
  requirePin: boolean;
  dynamicQr: boolean;
}

export function getCheckInRequirements(event: CheckInEvent): CheckInRequirements {
  return {
    requireLocation: event.module_settings?.require_location !== false,
    requirePin: event.module_settings?.require_pin !== false,
    dynamicQr: event.module_settings?.dynamic_qr === true,
  };
}
