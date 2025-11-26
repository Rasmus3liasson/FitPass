import colors from "../constants/custom-colors";
import { ScheduledChangeResponse } from "../types/membership-scheduling";

class ScheduledChangeService {
  private baseUrl = process.env.EXPO_PUBLIC_API_URL;

  async getScheduledChanges(userId: string): Promise<ScheduledChangeResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/stripe/scheduled-changes/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 404) {
        return {
          success: true,
          hasScheduledChange: false,
          membership: undefined as any,
          scheduledChange: undefined,
        };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Silently handle errors - user likely doesn't have a membership
      return {
        success: false,
        hasScheduledChange: false,
        membership: undefined as any,
        scheduledChange: undefined,
      };
    }
  }

  formatNextBillingDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays <= 30) {
      return `In ${diffDays} days`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  getStatusMessage(status: string): string {
    switch (status) {
      case "pending":
        return "Ändringen behandlas";
      case "confirmed":
        return "Ändringen är bekräftad och schemalagd";
      case "canceled":
        return "Ändringen har avbrutits";
      case "completed":
        return "Ändringen har genomförts";
      default:
        return "Okänd status";
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return colors.accentOrange;
      case "confirmed":
        return colors.accentGreen;
      case "canceled":
        return colors.accentRed;
      case "completed":
        return colors.accentGreen;
      default:
        return colors.accentGray;
    }
  }
}

export const scheduledChangeService = new ScheduledChangeService();
export default ScheduledChangeService;
