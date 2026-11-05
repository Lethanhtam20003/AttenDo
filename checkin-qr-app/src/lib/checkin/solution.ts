import type { CheckinEvent } from '@/types/database';

export interface CheckinRequirements {
  requireLocation: boolean;
  requirePin: boolean;
  dynamicQr: boolean;
}

export function getCheckinRequirements(event: CheckinEvent): CheckinRequirements {
  return {
    requireLocation: event.module_settings?.require_location !== false,
    requirePin: event.module_settings?.require_pin !== false,
    dynamicQr: event.module_settings?.dynamic_qr === true,
  };
}
