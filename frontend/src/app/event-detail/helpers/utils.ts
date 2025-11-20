export enum ActivityTimeStatus {
  NOT_STARTED = 'not_started',
  ONGOING = 'ongoing',
  ENDED = 'ended'
}

export function getActivityTimeStatus(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined
): ActivityTimeStatus {
  if (!startAt || !endAt) {
    return ActivityTimeStatus.NOT_STARTED;
  }

  const now = new Date();
  const start = new Date(startAt);
  const end = new Date(endAt);

  if (now < start) {
    return ActivityTimeStatus.NOT_STARTED;
  }
  
  if (now > end) {
    return ActivityTimeStatus.ENDED;
  }
  
  return ActivityTimeStatus.ONGOING;
}

export function isActivityOngoing(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined
): boolean {
  return getActivityTimeStatus(startAt, endAt) === ActivityTimeStatus.ONGOING;
}

export function isActivityEnded(
  endAt: string | Date | null | undefined
): boolean {
  if (!endAt) return false;
  return new Date() > new Date(endAt);
}

export function isActivityNotStarted(
  startAt: string | Date | null | undefined
): boolean {
  if (!startAt) return true;
  return new Date() < new Date(startAt);
}

export function isWithinActivityDateRange(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined
): boolean {
  if (!startAt || !endAt) return false;

  const nowUTC = new Date();
  const todayUTC = new Date(Date.UTC(
    nowUTC.getUTCFullYear(),
    nowUTC.getUTCMonth(),
    nowUTC.getUTCDate()
  ));

  const activityStart = new Date(startAt);
  const eventStartUTC = new Date(Date.UTC(
    activityStart.getUTCFullYear(),
    activityStart.getUTCMonth(),
    activityStart.getUTCDate()
  ));

  const activityEnd = new Date(endAt);
  const eventEndUTC = new Date(Date.UTC(
    activityEnd.getUTCFullYear(),
    activityEnd.getUTCMonth(),
    activityEnd.getUTCDate()
  ));

  return todayUTC >= eventStartUTC && todayUTC <= eventEndUTC;
}

export function isMultiDayActivity(
  startAt: string | Date | null | undefined,
  endAt: string | Date | null | undefined
): boolean {
  if (!startAt || !endAt) return false;

  const start = new Date(startAt);
  const end = new Date(endAt);

  const startDay = new Date(start);
  startDay.setHours(0, 0, 0, 0);

  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  return startDay.getTime() !== endDay.getTime();
}


export function parseActivityDate(dateString: string | undefined) {
  if (!dateString) return null;
    return new Date(dateString);
}

export function formatEventDate(startDate: string, endDate: string, timeStart: string, timeEnd: string): string {
  if (startDate === endDate) {
    return `${startDate} at ${timeStart} - ${timeEnd}`;
  }
  return `${startDate} ${timeStart} - ${endDate} ${timeEnd}`;
}

export function isValidCheckInChar(char: string): boolean {
  return /^[A-Za-z0-9]$/.test(char);
}

export function sanitizeCheckInCode(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

export function cleanErrorMessage(error: string): string {
  if (error.includes('already ended')) {
    return 'This activity has already ended.';
  }
  if (error.includes('not started yet') || error.includes('not started')) {
    return 'This activity has not started yet.';
  }
  if (error.startsWith('[') && error.endsWith(']')) {
    try {
      const parsed = JSON.parse(error);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : error;
    } catch {
      const match = error.match(/\['([^']+)'\]/);
      return match?.[1] || error;
    }
  }
  return error;
}

export function isActivityStatusError(error: string): boolean {
  return error.includes('already ended') || 
         error.includes('not started yet') ||
         error.includes('activity has already ended') ||
         error.includes('activity has not started');
}
