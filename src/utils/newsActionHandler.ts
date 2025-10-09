import { ROUTES } from '@/src/config/constants';
import { Alert, Linking } from 'react-native';

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

export class NewsActionHandler {
  
  static async handleBookClass(actionData: ActionData, router: any, allClubs: any[]) {
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
      Alert.alert('Passinformation', 'Detta pass är inte längre tillgängligt för bokning.');
    }
    return null;
  }

  static async handleVisitClub(actionData: ActionData, router: any) {
    if (actionData.club_id) {
      router.push(ROUTES.FACILITY(actionData.club_id));
    } else {
      Alert.alert('Fel', 'Klubbinformation saknas.');
    }
  }

  static async handleExternalLink(actionData: ActionData) {
    if (actionData.url) {
      const canOpen = await Linking.canOpenURL(actionData.url);
      if (canOpen) {
        Alert.alert(
          'Extern länk',
          'Vill du öppna denna länk i din webbläsare?',
          [
            { text: 'Avbryt', style: 'cancel' },
            { 
              text: 'Öppna', 
              onPress: async () => {
                try {
                  await Linking.openURL(actionData.url!);
                } catch (error) {
                  Alert.alert('Fel', 'Kunde inte öppna länken.');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Fel', 'Ogiltig länk.');
      }
    } else {
      Alert.alert('Fel', 'Ingen länk tillgänglig.');
    }
  }

  static async handlePromoCode(actionData: ActionData, router: any) {
    if (actionData.promo_code) {
      Alert.alert(
        'Specialerbjudande',
        `Använd rabattkod: ${actionData.promo_code}`,
        [
          { 
            text: 'Kopiera kod', 
            onPress: async () => {
              // TODO: Implement clipboard functionality
              Alert.alert('Rabattkod', `Kod: ${actionData.promo_code}\n\n(Kopiera denna kod manuellt)`);
            }
          },
          { 
            text: 'Besök klubb', 
            onPress: () => {
              if (actionData.club_id) {
                router.push(ROUTES.FACILITY(actionData.club_id));
              }
            }
          }
        ]
      );
    } else {
      Alert.alert('Fel', 'Ingen rabattkod tillgänglig.');
    }
  }

  static async handleContactClub(actionData: ActionData, router: any) {
    const contactOptions = [];
    
    if (actionData.phone) {
      contactOptions.push({
        text: 'Ring',
        onPress: () => Linking.openURL(`tel:${actionData.phone}`)
      });
    }
    
    if (actionData.email) {
      contactOptions.push({
        text: 'E-post',
        onPress: () => Linking.openURL(`mailto:${actionData.email}`)
      });
    }
    
    if (actionData.club_id) {
      contactOptions.push({
        text: 'Besök klubbsida',
        onPress: () => router.push(ROUTES.FACILITY(actionData.club_id!))
      });
    }
    
    contactOptions.push({ text: 'Avbryt', style: 'cancel' as const });

    if (contactOptions.length > 1) {
      Alert.alert(
        'Kontakta klubb',
        'Välj hur du vill kontakta klubben:',
        contactOptions
      );
    } else {
      // Fallback to club page if no contact info
      if (actionData.club_id) {
        router.push(ROUTES.FACILITY(actionData.club_id));
      } else {
        Alert.alert('Kontaktinformation', 'Ingen kontaktinformation tillgänglig.');
      }
    }
  }

  static async handleEvent(actionData: ActionData, router: any) {
    if (actionData.event_url || actionData.url) {
      await this.handleExternalLink(actionData);
    } else if (actionData.club_id) {
      router.push(`/facility/${actionData.club_id}`);
    } else {
      Alert.alert('Event', 'Eventinformation inte tillgänglig.');
    }
  }

  static async handlePromotion(actionData: ActionData, router: any) {
    if (actionData.promo_code) {
      await this.handlePromoCode(actionData, router);
    } else if (actionData.club_id) {
      router.push(`/facility/${actionData.club_id}`);
    } else {
      Alert.alert('Erbjudande', 'Erbjudandeinformation inte tillgänglig.');
    }
  }

  static async handleAnnouncement(actionData: ActionData, router: any, item: any) {
    if (actionData.club_id) {
      Alert.alert(
        item.title,
        item.description + '\n\nVill du besöka klubbsidan?',
        [
          { text: 'Stäng', style: 'cancel' },
          { text: 'Besök klubb', onPress: () => router.push(`/facility/${actionData.club_id}`) }
        ]
      );
    } else {
      Alert.alert(item.title, item.description);
    }
  }

  static async handleNewsAction(
    item: any, 
    router: any, 
    allClubs: any[] = [],
    onShowClassesModal?: (club: { id: string; name: string }) => void
  ) {
    if (!item.action_text || !item.action_data) {
      // Fallback for items without action data
      if (item.gym_name && item.gym_name !== 'FitPass') {
        Alert.alert(
          item.title,
          'Vill du besöka denna klubb?',
          [
            { text: 'Avbryt', style: 'cancel' },
            { text: 'Besök klubb', onPress: () => {
              Alert.alert('Navigation', `Skulle navigera till ${item.gym_name}`);
            }}
          ]
        );
      } else {
        Alert.alert(item.title, item.description);
      }
      return;
    }

    const actionData = item.action_data;
    
    try {
      switch (actionData.type || item.type) {
        case 'new_class':
        case 'book_class':
          const result = await this.handleBookClass(actionData, router, allClubs);
          if (result?.showClassesModal && onShowClassesModal) {
            onShowClassesModal(result.club);
          }
          break;

        case 'visit_club':
          await this.handleVisitClub(actionData, router);
          break;

        case 'external_link':
          await this.handleExternalLink(actionData);
          break;

        case 'promo_code':
          await this.handlePromoCode(actionData, router);
          break;

        case 'contact_club':
          await this.handleContactClub(actionData, router);
          break;

        case 'event':
          await this.handleEvent(actionData, router);
          break;

        case 'promotion':
          await this.handlePromotion(actionData, router);
          break;

        case 'announcement':
        case 'update':
        default:
          await this.handleAnnouncement(actionData, router, item);
          break;
      }
    } catch (error) {
      console.error('Error handling news action:', error);
      Alert.alert('Fel', 'Ett fel uppstod vid hantering av åtgärden.');
    }
  }
}
