const VIETNAM_UTC_OFFSET_HOURS = 7;

/** Chuyển ngày giờ nhập theo giờ Việt Nam thành thời điểm UTC. */
export function parseVietnamDateTimeLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearValue, monthValue, dayValue, hourValue, minuteValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const localDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

  if (
    localDate.getUTCFullYear() !== year ||
    localDate.getUTCMonth() !== month - 1 ||
    localDate.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  return new Date(localDate.getTime() - VIETNAM_UTC_OFFSET_HOURS * 60 * 60 * 1000);
}
