// Helper to format time to Swedish 24-hour format (no AM/PM)
export function formatSwedishTime(dateInput: string | Date, withDate: boolean = false): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  if (withDate) {
    // Example: 2024-06-10 14:30
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
  // Example: 14:30
  return date.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Helper to format dates with Swedish month names for display


// Helper to format the next billing date in Swedish
export function formatNextBillingDate(currentPeriodEnd: string | null): string {
  if (!currentPeriodEnd) return '';
  
  const date = new Date(currentPeriodEnd);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatSwedishDate(dateInput: string | Date, format: 'short' | 'long' = 'short'): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  
  if (format === 'long') {
    // Example: "5 november 2024"
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } else {
    // Example: "5 nov"
    return date.toLocaleDateString('sv-SE', {
      day: 'numeric',
      month: 'short',
    });
  }
} 