import colors from '@fitpass/shared/constants/custom-colors';
import { Lightning, StarIcon, X } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Membership, MembershipPlan } from '../../types';
import StatusBadge from '../ui/StatusBadge';

interface MembershipPlanGridProps {
  plans: MembershipPlan[];
  currentMembership?: Membership | null;
  onPlanSelect: (plan: MembershipPlan) => void;
  onPlanView?: (plan: MembershipPlan) => void;
  hasPaymentMethods?: boolean;
  isLoading?: boolean;
  scheduledChangeData?: {
    hasScheduledChange: boolean;
    scheduledChange?: {
      planId: string;
      planTitle: string;
      planCredits: number;
      nextBillingDate: string;
      nextBillingDateFormatted: string;
      status: string;
      confirmed: boolean;
    } | null;
  } | null;
}

export function MembershipPlanGrid({
  plans,
  currentMembership,
  onPlanSelect,
  onPlanView,
  hasPaymentMethods = true,
  isLoading,
  scheduledChangeData,
}: MembershipPlanGridProps) {
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{
    type: 'current' | 'scheduled';
    status: string;
    planTitle: string;
  } | null>(null);

  const isCurrentPlan = (planId: string) => {
    return currentMembership?.plan_id === planId;
  };

  const isScheduledPlan = (plan: MembershipPlan) => {
    // Check if this plan matches the scheduled change using the new scheduled change data
    if (!scheduledChangeData?.hasScheduledChange || !scheduledChangeData?.scheduledChange)
      return false;

    // Match by planId from the scheduledChange object
    return scheduledChangeData.scheduledChange.planId === plan.id;
  };

  // Determine if a plan has Daily Access based on price (top-tier pricing)
  const hasDailyAccess = (plan: MembershipPlan) => {
    if (!plans || plans.length === 0) return false;

    const maxPrice = Math.max(...plans.map((p) => p.price));
    const threshold = maxPrice * 0.8; // Top 80% price range gets Daily Access

    return plan.price >= threshold && plan.price > 0; // Exclude free plans
  };

  const getPlanIcon = (planTitle: string) => {
    if (planTitle.toLowerCase().includes('premium') || planTitle.toLowerCase().includes('pro')) {
      return <StarIcon size={24} color="#FFD700" weight="fill" />;
    }
    return <Lightning size={24} color={colors.primary} />;
  };

  if (isLoading) {
    return (
      <View className="mt-6">
        <Text className="text-textPrimary text-xl font-bold mb-4">Tillgängliga planer</Text>
        <View className="flex-row flex-wrap justify-between">
          {[1, 2, 3, 4].map((index) => (
            <View key={index} className="bg-surface rounded-3xl p-6 mb-4" style={{ width: '48%' }}>
              <View className="bg-accentGray/20 h-6 rounded mb-4" />
              <View className="bg-accentGray/20 h-4 rounded mb-2" />
              <View className="bg-accentGray/20 h-8 rounded" />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const getStatusInfo = (type: 'current' | 'scheduled', status: string) => {
    if (type === 'scheduled') {
      return {
        title: 'Schemalagd planändring',
        description: `Din plan kommer att ändras till ${
          scheduledChangeData?.scheduledChange?.planTitle || 'den nya planen'
        } vid nästa faktureringsperiod (${
          scheduledChangeData?.scheduledChange?.nextBillingDateFormatted || 'kommande datum'
        }).`,
        details: [
          'Du behåller din nuvarande plan tills perioden löper ut',
          'Ingen extra kostnad för att byta',
          'Du kan avbryta ändringen när som helst före aktiveringsdatumet',
        ],
      };
    }

    const statusInfoMap: Record<string, { title: string; description: string; details: string[] }> =
      {
        active: {
          title: 'Aktiv plan',
          description: 'Din plan är aktiv och fungerar som den ska.',
          details: [
            'Du har full tillgång till alla funktioner',
            'Dina krediter förnyas automatiskt varje månad',
            'Betalningar dras automatiskt',
          ],
        },
        trialing: {
          title: 'Testperiod',
          description: 'Du är i testperiod för din plan.',
          details: [
            'Full tillgång till alla funktioner under testperioden',
            'Ingen betalning krävs under testperioden',
            'Efter testperioden börjar normal fakturering',
          ],
        },
        canceled: {
          title: 'Avslutad plan',
          description: 'Din plan har avslutats.',
          details: [
            'Du har tillgång till planen tills perioden löper ut',
            'Inga fler betalningar kommer att dras',
            'Du kan återaktivera planen när som helst',
          ],
        },
        past_due: {
          title: 'Förfallen betalning',
          description: 'Din senaste betalning misslyckades.',
          details: [
            'Uppdatera dina betalningsuppgifter för att fortsätta',
            'Din tillgång kan begränsas tills betalning genomförs',
            'Kontakta support om du behöver hjälp',
          ],
        },
        incomplete: {
          title: 'Ofullständig betalning',
          description: 'Din betalning behöver slutföras.',
          details: [
            'Betalningen väntar på bekräftelse',
            'Kontrollera din e-post för instruktioner',
            'Du kan uppdatera betalningsmetod i inställningar',
          ],
        },
        paused: {
          title: 'Pausad plan',
          description: 'Din plan är tillfälligt pausad.',
          details: [
            'Inga betalningar dras under pausen',
            'Begränsad tillgång till funktioner',
            'Återaktivera när du vill fortsätta',
          ],
        },
        inactive: {
          title: 'Inaktiv plan',
          description: 'Din plan är inte längre aktiv.',
          details: [
            'Ingen tillgång till premiumfunktioner',
            'Välj en ny plan för att aktivera medlemskap',
            'All din tidigare data är sparad',
          ],
        },
      };

    return (
      statusInfoMap[status] || {
        title: 'Status',
        description: `Din plan har status: ${status}`,
        details: [],
      }
    );
  };

  return (
    <View className="mt-6">
      {/* Status Info Modal */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center px-6"
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <TouchableOpacity
            className="bg-background rounded-3xl p-6 w-full max-w-md"
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-textPrimary text-xl font-bold flex-1">
                {selectedStatus && getStatusInfo(selectedStatus.type, selectedStatus.status).title}
              </Text>
              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                className="w-8 h-8 bg-accentGray/20 rounded-full items-center justify-center"
              >
                <X size={20} color={colors.borderGray} />
              </TouchableOpacity>
            </View>

            <Text className="text-textSecondary text-base mb-4">
              {selectedStatus &&
                getStatusInfo(selectedStatus.type, selectedStatus.status).description}
            </Text>

            {selectedStatus &&
              getStatusInfo(selectedStatus.type, selectedStatus.status).details.length > 0 && (
                <View className="space-y-2">
                  {getStatusInfo(selectedStatus.type, selectedStatus.status).details.map(
                    (detail, index) => (
                      <View key={index} className="flex-row items-start mb-2">
                        <View className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3" />
                        <Text className="text-textSecondary text-sm flex-1">{detail}</Text>
                      </View>
                    )
                  )}
                </View>
              )}

            <TouchableOpacity
              onPress={() => setStatusModalVisible(false)}
              className="bg-primary rounded-2xl py-3 px-6 mt-6"
            >
              <Text className="text-white text-center font-bold">Stäng</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Text className="text-textPrimary text-xl font-bold mb-4">Tillgängliga planer</Text>

      <View className="flex-row flex-wrap justify-between">
        {plans?.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          const isScheduled = isScheduledPlan(plan);

          return (
            <View key={plan.id} className="relative mb-4" style={{ width: '47%' }}>
              <TouchableOpacity
                className="rounded-3xl p-4 overflow-hidden border-2 border-accentGray"
                onPress={() => (onPlanView ? onPlanView(plan) : onPlanSelect(plan))}
                activeOpacity={0.8}
                style={{
                  shadowColor: isCurrent ? colors.primary : '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isCurrent ? 0.3 : 0.1,
                  shadowRadius: 8,
                  elevation: isCurrent ? 8 : 4,
                }}
              >
                {/* Card Content */}
                <View className="flex-1 justify-between">
                  {/* Plan Info */}
                  <View>
                    <View className="mb-3">
                      <Text className="text-textPrimary text-base font-bold mb-1" numberOfLines={1}>
                        {plan.title}
                      </Text>
                      <Text className="text-textSecondary text-xs leading-tight" numberOfLines={2}>
                        {plan.description || 'Perfekt för dina träningsmål'}
                      </Text>
                    </View>
                  </View>

                  <View className="mb-3">
                    <View className="bg-black/5 rounded-xl py-2 flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-xs text-textSecondary mb-1">Pris</Text>
                        <View className="flex-row items-end">
                          <Text className="text-xl font-black text-textPrimary">
                            {plan.price > 0 ? `${plan.price}` : 'Gratis'}
                          </Text>
                          {plan.price > 0 && (
                            <Text className="text-xs text-textSecondary ml-1">kr/mån</Text>
                          )}
                        </View>
                      </View>

                      {/* Credits */}
                      <View className="flex-1 items-end">
                        <Text className="text-xs text-textSecondary mb-1">Krediter</Text>
                        <View className="flex-row items-center">
                          <Text className="text-xl font-black text-textPrimary ml-1">
                            {plan.credits}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <View className="flex-row items-center mb-4">
                      <View className="w-1 h-1 bg-primary rounded-full mr-2" />
                      <Text className="text-textSecondary text-xs flex-1" numberOfLines={1}>
                        {plan.features[0]}
                      </Text>
                    </View>
                  )}

                  {/* Action Button */}
                  <TouchableOpacity
                    disabled={isCurrent || !hasPaymentMethods}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (hasPaymentMethods && !isCurrent) onPlanSelect(plan);
                    }}
                    activeOpacity={0.7}
                    className={`rounded-2xl py-3 px-4 mt-4 ${
                      isCurrent
                        ? 'bg-primary/20 border border-primary/30'
                        : isScheduled
                          ? 'bg-primary/20 border border-primary/30'
                          : !hasPaymentMethods
                            ? 'bg-gray-300'
                            : 'bg-primary'
                    }`}
                  >
                    <Text
                      className={`text-center font-bold text-sm ${
                        isCurrent
                          ? 'text-textPrimary'
                          : isScheduled
                            ? 'text-textPrimary'
                            : !hasPaymentMethods
                              ? 'text-gray-500'
                              : 'text-white'
                      }`}
                    >
                      {isCurrent
                        ? 'Nuvarande plan'
                        : isScheduled
                          ? 'Schemalagd'
                          : !hasPaymentMethods
                            ? 'Lägg till kort först'
                            : 'Välj denna plan'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* StatusBadge */}
              {isCurrent && currentMembership && (
                <View className="absolute top-2 right-2" style={{ pointerEvents: 'box-none' }}>
                  <StatusBadge
                    status={
                      currentMembership.stripe_status === 'scheduled_change'
                        ? 'active'
                        : currentMembership.stripe_status ||
                          currentMembership.subscription_status ||
                          (currentMembership.is_active ? 'active' : 'inactive')
                    }
                    onPress={() => {
                      setSelectedStatus({
                        type: 'current',
                        status:
                          currentMembership.stripe_status === 'scheduled_change'
                            ? 'active'
                            : currentMembership.stripe_status ||
                              currentMembership.subscription_status ||
                              (currentMembership.is_active ? 'active' : 'inactive'),
                        planTitle: plan.title,
                      });
                      setStatusModalVisible(true);
                    }}
                  />
                </View>
              )}
              {isScheduled && (
                <View className="absolute top-2 right-2" style={{ pointerEvents: 'box-none' }}>
                  <StatusBadge
                    status="scheduled_change"
                    onPress={() => {
                      setSelectedStatus({
                        type: 'scheduled',
                        status: 'scheduled_change',
                        planTitle: plan.title,
                      });
                      setStatusModalVisible(true);
                    }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
