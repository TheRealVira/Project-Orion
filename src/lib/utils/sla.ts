import { TeamSLASettings, Incident, SLAStatus, IncidentSeverity } from '@/types';

/**
 * Calculate the SLA deadline based on start time, target minutes, and business hours settings
 */
export function calculateSLADeadline(
  startTime: Date,
  targetMinutes: number,
  settings: TeamSLASettings
): Date {
  if (!settings.businessHoursOnly) {
    // Simple calculation: just add minutes to start time
    return new Date(startTime.getTime() + targetMinutes * 60 * 1000);
  }

  // Complex calculation: account for business hours
  let remainingMinutes = targetMinutes;
  let currentTime = new Date(startTime);

  while (remainingMinutes > 0) {
    const dayOfWeek = currentTime.getDay(); // 0 = Sunday, 6 = Saturday
    const isBusinessDay = settings.businessDays.includes(dayOfWeek);

    if (!isBusinessDay) {
      // Skip to next business day
      currentTime = getNextBusinessDay(currentTime, settings);
      continue;
    }

    const businessStart = parseTime(settings.businessHoursStart);
    const businessEnd = parseTime(settings.businessHoursEnd);
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // If before business hours, jump to start of business hours
    if (currentTotalMinutes < businessStart.totalMinutes) {
      currentTime.setHours(businessStart.hours, businessStart.minutes, 0, 0);
      continue;
    }

    // If after business hours, jump to next business day
    if (currentTotalMinutes >= businessEnd.totalMinutes) {
      currentTime = getNextBusinessDay(currentTime, settings);
      continue;
    }

    // We're within business hours, calculate how much time we have left today
    const minutesUntilEndOfDay = businessEnd.totalMinutes - currentTotalMinutes;
    
    if (remainingMinutes <= minutesUntilEndOfDay) {
      // We can finish within today's business hours
      currentTime = new Date(currentTime.getTime() + remainingMinutes * 60 * 1000);
      remainingMinutes = 0;
    } else {
      // Use up the rest of today and move to next business day
      remainingMinutes -= minutesUntilEndOfDay;
      currentTime = getNextBusinessDay(currentTime, settings);
    }
  }

  return currentTime;
}

/**
 * Calculate business minutes between two dates
 */
export function calculateBusinessMinutes(
  startTime: Date,
  endTime: Date,
  settings: TeamSLASettings
): number {
  if (!settings.businessHoursOnly) {
    return Math.floor((endTime.getTime() - startTime.getTime()) / (60 * 1000));
  }

  let totalMinutes = 0;
  let currentTime = new Date(startTime);
  const end = new Date(endTime);

  while (currentTime < end) {
    const dayOfWeek = currentTime.getDay();
    const isBusinessDay = settings.businessDays.includes(dayOfWeek);

    if (!isBusinessDay) {
      currentTime = getNextBusinessDay(currentTime, settings);
      continue;
    }

    const businessStart = parseTime(settings.businessHoursStart);
    const businessEnd = parseTime(settings.businessHoursEnd);
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // If before business hours, jump to start
    if (currentTotalMinutes < businessStart.totalMinutes) {
      currentTime.setHours(businessStart.hours, businessStart.minutes, 0, 0);
      continue;
    }

    // If after business hours, jump to next day
    if (currentTotalMinutes >= businessEnd.totalMinutes) {
      currentTime = getNextBusinessDay(currentTime, settings);
      continue;
    }

    // Calculate how much time in this business period
    const endOfPeriod = new Date(currentTime);
    endOfPeriod.setHours(businessEnd.hours, businessEnd.minutes, 0, 0);
    
    const periodEnd = end < endOfPeriod ? end : endOfPeriod;
    const periodMinutes = Math.floor((periodEnd.getTime() - currentTime.getTime()) / (60 * 1000));
    
    totalMinutes += periodMinutes;
    currentTime = periodEnd;

    // If we've reached the end time, we're done
    if (currentTime >= end) {
      break;
    }

    // If we've reached end of business hours, move to next day
    if (currentTime.getHours() * 60 + currentTime.getMinutes() >= businessEnd.totalMinutes) {
      currentTime = getNextBusinessDay(currentTime, settings);
    }
  }

  return totalMinutes;
}

/**
 * Get the target response time for an incident based on severity
 */
export function getResponseTarget(severity: IncidentSeverity, settings: TeamSLASettings): number {
  switch (severity) {
    case 'critical':
      return settings.responseTimeCritical;
    case 'high':
      return settings.responseTimeHigh;
    case 'medium':
      return settings.responseTimeMedium;
    case 'low':
      return settings.responseTimeLow;
  }
}

/**
 * Get the target resolution time for an incident based on severity
 */
export function getResolutionTarget(severity: IncidentSeverity, settings: TeamSLASettings): number {
  switch (severity) {
    case 'critical':
      return settings.resolutionTimeCritical;
    case 'high':
      return settings.resolutionTimeHigh;
    case 'medium':
      return settings.resolutionTimeMedium;
    case 'low':
      return settings.resolutionTimeLow;
  }
}

/**
 * Calculate SLA status for an incident
 */
export function calculateSLAStatus(
  incident: Incident,
  settings: TeamSLASettings,
  currentTime: Date = new Date()
): SLAStatus {
  const responseTarget = getResponseTarget(incident.severity, settings);
  const resolutionTarget = getResolutionTarget(incident.severity, settings);

  const createdAt = new Date(incident.createdAt);
  const responseDeadline = incident.slaResponseDeadline ? new Date(incident.slaResponseDeadline) : null;
  const resolutionDeadline = incident.slaResolutionDeadline ? new Date(incident.slaResolutionDeadline) : null;

  // Calculate response time status
  let responseTimeRemaining = 0;
  let responseTimePercentage = 0;
  let isResponseBreached = false;

  if (incident.firstResponseAt) {
    // Already responded
    const actualResponseTime = calculateBusinessMinutes(createdAt, new Date(incident.firstResponseAt), settings);
    responseTimeRemaining = responseTarget - actualResponseTime;
    responseTimePercentage = 100;
    isResponseBreached = incident.slaResponseBreached || false;
  } else if (responseDeadline) {
    // Not yet responded, calculate remaining time
    const elapsedMinutes = calculateBusinessMinutes(createdAt, currentTime, settings);
    responseTimeRemaining = responseTarget - elapsedMinutes;
    responseTimePercentage = Math.min(100, (elapsedMinutes / responseTarget) * 100);
    isResponseBreached = currentTime > responseDeadline;
  }

  // Calculate resolution time status
  let resolutionTimeRemaining = 0;
  let resolutionTimePercentage = 0;
  let isResolutionBreached = false;

  if (incident.closedAt) {
    // Already resolved
    const actualResolutionTime = calculateBusinessMinutes(createdAt, new Date(incident.closedAt), settings);
    resolutionTimeRemaining = resolutionTarget - actualResolutionTime;
    resolutionTimePercentage = 100;
    isResolutionBreached = incident.slaResolutionBreached || false;
  } else if (resolutionDeadline) {
    // Not yet resolved, calculate remaining time
    const elapsedMinutes = calculateBusinessMinutes(createdAt, currentTime, settings);
    resolutionTimeRemaining = resolutionTarget - elapsedMinutes;
    resolutionTimePercentage = Math.min(100, (elapsedMinutes / resolutionTarget) * 100);
    isResolutionBreached = currentTime > resolutionDeadline;
  }

  return {
    responseTimeRemaining,
    resolutionTimeRemaining,
    responseTimePercentage,
    resolutionTimePercentage,
    isResponseBreached,
    isResolutionBreached,
    isResponseAtRisk: responseTimePercentage > 80 && !incident.firstResponseAt && !isResponseBreached,
    isResolutionAtRisk: resolutionTimePercentage > 80 && !incident.closedAt && !isResolutionBreached,
  };
}

/**
 * Helper: Get next business day
 */
function getNextBusinessDay(date: Date, settings: TeamSLASettings): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  const businessStart = parseTime(settings.businessHoursStart);
  nextDay.setHours(businessStart.hours, businessStart.minutes, 0, 0);

  // Keep advancing until we find a business day
  while (!settings.businessDays.includes(nextDay.getDay())) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * Helper: Parse time string (HH:mm) to hours and minutes
 */
function parseTime(timeStr: string): { hours: number; minutes: number; totalMinutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}

/**
 * Format minutes to a human-readable string
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 0) {
    return `Overdue by ${formatMinutes(Math.abs(minutes))}`;
  }

  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (remainingHours > 0) {
    return `${days}d ${remainingHours}h`;
  }

  return `${days}d`;
}
