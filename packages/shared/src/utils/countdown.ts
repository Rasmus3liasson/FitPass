/**
 * Utility functions for booking countdown functionality
 */

export interface CountdownResult {
  isExpired: boolean;
  timeLeft: string;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculate remaining time until booking expires
 * @param endTime - The end time of the booking (ISO string or Date)
 * @returns CountdownResult with formatted time and individual components
 */
export function calculateCountdown(endTime: string | Date): CountdownResult {
  const end = new Date(endTime);
  const now = new Date();
  const diffSeconds = Math.floor((end.getTime() - now.getTime()) / 1000);

  if (diffSeconds <= 0) {
    return {
      isExpired: true,
      timeLeft: 'Kod utgången',
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  // Format time string based on remaining time
  let timeLeft: string;

  if (hours > 0) {
    timeLeft = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (minutes > 0) {
    timeLeft = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    timeLeft = `${String(seconds).padStart(2, '0')}s`;
  }

  return {
    isExpired: false,
    timeLeft,
    hours,
    minutes,
    seconds,
  };
}

/**
 * Get a human-readable countdown message
 * @param endTime - The end time of the booking
 * @returns Formatted countdown message in Swedish
 */
export function getCountdownMessage(endTime: string | Date): string {
  const countdown = calculateCountdown(endTime);

  if (countdown.isExpired) {
    return 'Koden har gått ut';
  }

  if (countdown.hours > 0) {
    return `Kod utgår om ${countdown.hours}h ${countdown.minutes}m`;
  } else if (countdown.minutes > 0) {
    return `Kod utgår om ${countdown.minutes} minuter`;
  } else {
    return `Kod utgår om ${countdown.seconds} sekunder`;
  }
}

/**
 * Get countdown status with color coding
 * @param endTime - The end time of the booking
 * @returns Status object with color and urgency level
 */
export function getCountdownStatus(endTime: string | Date) {
  const countdown = calculateCountdown(endTime);

  if (countdown.isExpired) {
    return {
      status: 'expired',
      color: 'red',
      urgency: 'high',
      message: 'Utgången',
    };
  }

  const totalMinutes = countdown.hours * 60 + countdown.minutes;

  if (totalMinutes < 10) {
    return {
      status: 'urgent',
      color: 'red',
      urgency: 'high',
      message: 'Snart utgången',
    };
  } else if (totalMinutes < 60) {
    return {
      status: 'warning',
      color: 'yellow',
      urgency: 'medium',
      message: 'Aktiv',
    };
  } else {
    return {
      status: 'active',
      color: 'green',
      urgency: 'low',
      message: 'Aktiv',
    };
  }
}
