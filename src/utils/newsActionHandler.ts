import { ROUTES } from '@/src/config/constants';
import { Clipboard, Linking } from 'react-native';

export interface ActionData {
  type: string;
  club_id?: string;
  class_id?: string;
  url?: string;
  promo_code?: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

export interface FeedbackMethods {
  showError: (title: string, message: string) => void;
  showSuccess: (title: string, message: string) => void;
  showInfo: (title: string, message: string) => void;
  showWarning: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export class NewsActionHandler {
  
  static async handleBookClass(actionData: ActionData, router: any, allClubs: any[], feedback: FeedbackMethods) {
    if (actionData.class_id) {
      // Navigate to specific class booking
      router.push(`/class/${actionData.class_id}`);
    } else if (actionData.club_id) {
      // Show club classes modal
      const club = allClubs.find(c => c.id === actionData.club_id);
      if (club) {
        return { showClassesModal: true, club: { id: club.id, name: club.name } };
      } else {
        router.push(ROUTES.FACILITY(actionData.club_id));
      }
    } else {
      feedback.showError('Passinformation', 'Detta pass är inte längre tillgängligt för bokning.');
    }
    return null;
  }

  static async handleVisitClub(actionData: ActionData, router: any, feedback: FeedbackMethods) {
    if (actionData.club_id) {
      router.push(ROUTES.FACILITY(actionData.club_id));
    } else {
      feedback.showError('Fel', 'Klubbinformation saknas.');
    }
  }

  static async handleExternalLink(actionData: ActionData, feedback: FeedbackMethods) {
    if (actionData.url) {
      const canOpen = await Linking.canOpenURL(actionData.url);
      if (canOpen) {
        feedback.showConfirm(
          'Extern länk',
          'Vill du öppna denna länk i din webbläsare?',
          async () => {
            try {
              await Linking.openURL(actionData.url!);
            } catch (error) {
              feedback.showError('Fel', 'Kunde inte öppna länken.');
            }
          }
        );
      } else {
        feedback.showError('Fel', 'Ogiltig länk.');
      }
    } else {
      feedback.showError('Fel', 'Ingen länk tillgänglig.');
    }
  }

  static async handlePromoCode(actionData: ActionData, router: any, feedback: FeedbackMethods) {
    if (actionData.promo_code) {
      try {
        await Clipboard.setString(actionData.promo_code);
        feedback.showSuccess('Kopierad!', `Rabattkoden "${actionData.promo_code}" har kopierats till urklipp.`);
        if (actionData.club_id) {
          router.push(ROUTES.FACILITY(actionData.club_id));
        }
      } catch (error) {
        feedback.showInfo('Rabattkod', `Kod: ${actionData.promo_code}\n\n(Kopiera denna kod manuellt)`);
        if (actionData.club_id) {
          router.push(ROUTES.FACILITY(actionData.club_id));
        }
      }
    } else {
      feedback.showError('Fel', 'Ingen rabattkod tillgänglig.');
    }
  }

  static async handleContactClub(actionData: ActionData, router: any, feedback: FeedbackMethods) {
    // For simplicity, directly handle the most common action
    if (actionData.phone) {
      try {
        await Linking.openURL(`tel:${actionData.phone}`);
      } catch (error) {
        feedback.showError('Fel', 'Kunde inte öppna telefonen.');
      }
    } else if (actionData.email) {
      try {
        await Linking.openURL(`mailto:${actionData.email}`);
      } catch (error) {
        feedback.showError('Fel', 'Kunde inte öppna e-posten.');
      }
    } else if (actionData.club_id) {
      router.push(ROUTES.FACILITY(actionData.club_id));
    } else {
      feedback.showError('Kontaktinformation', 'Ingen kontaktinformation tillgänglig.');
    }
  }

  static async handleEvent(actionData: ActionData, router: any, feedback: FeedbackMethods) {
    if (actionData.event_url || actionData.url) {
      await this.handleExternalLink(actionData, feedback);
    } else if (actionData.club_id) {
      router.push(`/facility/${actionData.club_id}`);
    } else {
      feedback.showError('Event', 'Eventinformation inte tillgänglig.');
    }
  }

  static async handlePromotion(actionData: ActionData, router: any, feedback: FeedbackMethods) {
    if (actionData.promo_code) {
      await this.handlePromoCode(actionData, router, feedback);
    } else if (actionData.club_id) {
      router.push(`/facility/${actionData.club_id}`);
    } else {
      feedback.showError('Erbjudande', 'Erbjudandeinformation inte tillgänglig.');
    }
  }

  static async handleAnnouncement(actionData: ActionData, router: any, item: any, feedback: FeedbackMethods) {
    if (actionData.club_id) {
      feedback.showConfirm(
        item.title,
        item.description + '\n\nVill du besöka klubbsidan?',
        () => router.push(`/facility/${actionData.club_id}`)
      );
    } else {
      feedback.showInfo(item.title, item.description);
    }
  }

  static async handleNewsAction(
    item: any, 
    router: any, 
    feedback: FeedbackMethods,
    allClubs: any[] = [],
    onShowClassesModal?: (club: { id: string; name: string }) => void
  ) {
    if (!item.action_text || !item.action_data) {
      // Fallback for items without action data
      if (item.gym_name && item.gym_name !== 'FitPass') {
        feedback.showConfirm(
          item.title,
          'Vill du besöka denna klubb?',
          () => {
            feedback.showInfo('Navigation', `Skulle navigera till ${item.gym_name}`);
          }
        );
      } else {
        feedback.showInfo(item.title, item.description);
      }
      return;
    }

    const actionData = item.action_data;
    
    try {
      switch (actionData.type || item.type) {
        case 'new_class':
        case 'book_class':
          const result = await this.handleBookClass(actionData, router, allClubs, feedback);
          if (result?.showClassesModal && onShowClassesModal) {
            onShowClassesModal(result.club);
          }
          break;

        case 'visit_club':
          await this.handleVisitClub(actionData, router, feedback);
          break;

        case 'external_link':
          await this.handleExternalLink(actionData, feedback);
          break;

        case 'promo_code':
          await this.handlePromoCode(actionData, router, feedback);
          break;

        case 'contact_club':
          await this.handleContactClub(actionData, router, feedback);
          break;

        case 'event':
          await this.handleEvent(actionData, router, feedback);
          break;

        case 'promotion':
          await this.handlePromotion(actionData, router, feedback);
          break;

        case 'announcement':
        case 'update':
        default:
          await this.handleAnnouncement(actionData, router, item, feedback);
          break;
      }
    } catch (error) {
      console.error('Error handling news action:', error);
      feedback.showError('Fel', 'Ett fel uppstod vid hantering av åtgärden.');
    }
  }
}
