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