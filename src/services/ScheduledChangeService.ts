import { ScheduledChangeResponse } from '../types/membership-scheduling';

class ScheduledChangeService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL;

  /**
   * Get scheduled changes for a user
   */
  async getScheduledChanges(userId: string): Promise<ScheduledChangeResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/stripe/scheduled-changes/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching scheduled changes:', error);
      throw error;
    }
  }

  /**
   * Format the next billing date for display
   */
  formatNextBillingDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 30) {
      return `In ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  /**
   * Get status message for scheduled change
   */
  getStatusMessage(status: string): string {
    switch (status) {
      case 'pending':
        return 'Change is being processed';
      case 'confirmed':
        return 'Change confirmed and scheduled';
      case 'canceled':
        return 'Change has been canceled';
      case 'completed':
        return 'Change has been applied';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Get status color for UI display
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // amber
      case 'confirmed':
        return '#10b981'; // green
      case 'canceled':
        return '#ef4444'; // red
      case 'completed':
        return '#6b7280'; // gray
      default:
        return '#6b7280'; // gray
    }
  }
}

export const scheduledChangeService = new ScheduledChangeService();
export default ScheduledChangeService;