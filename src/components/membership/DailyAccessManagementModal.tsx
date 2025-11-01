import { useClubs } from '@/src/hooks/useClubs';
import {
    useAddDailyAccessGym,
    useDailyAccessGyms,
    useRemoveDailyAccessGym,
    type SelectedGym
} from '@/src/hooks/useDailyAccess';
import {
    Calendar,
    Check,
    Clock,
    Edit3,
    MapPin,
    Plus,
    Search,
    X
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DailyAccessManagementModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  currentPeriodEnd?: string;
}

interface PendingChanges {
  selectedGyms: string[];
  removedGyms: string[];
}

export function DailyAccessManagementModal({
  visible,
  onClose,
  userId,
  currentPeriodEnd,
}: DailyAccessManagementModalProps) {
  const [step, setStep] = useState<'overview' | 'select' | 'confirm'>('overview');
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    selectedGyms: [],
    removedGyms: [],
  });
  const [searchQuery, setSearchQuery] = useState('');

  const { data: clubs = [] } = useClubs();
  const { 
    data: dailyAccessData, 
    isLoading: loading,
    refetch: refetchDailyAccess 
  } = useDailyAccessGyms(userId);
  const addGymMutation = useAddDailyAccessGym();
  const removeGymMutation = useRemoveDailyAccessGym();

  const submitting = addGymMutation.isPending || removeGymMutation.isPending;

  // Reset modal state when opened
  useEffect(() => {
    if (visible && userId) {
      console.log('Daily Access Modal opened, refetching data...');
      setStep('overview');
      setSearchQuery('');
      refetchDailyAccess();
    }
  }, [visible, userId]); // Remove refetchDailyAccess from deps as it's stable from React Query

  // Memoize currentGyms to prevent unnecessary re-renders
  const currentGyms = useMemo(() => {
    return dailyAccessData?.current || [];
  }, [dailyAccessData?.current]);

  // Memoize gym IDs to create stable dependency
  const currentGymIds = useMemo(() => {
    return currentGyms.map((gym: SelectedGym) => gym.gym_id);
  }, [currentGyms]);

  // Initialize pending changes when data is loaded - only run once per data load
  useEffect(() => {
    if (dailyAccessData && !loading) {
      setPendingChanges({
        selectedGyms: [...currentGymIds],
        removedGyms: [],
      });
    }
  }, [dailyAccessData, loading]); // Only depend on data loading state

  // Filter available gyms based on search
  const filteredGyms = clubs.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if gym is currently selected (including pending changes)
  const isGymSelected = (gymId: string) => {
    return pendingChanges.selectedGyms.includes(gymId) && 
           !pendingChanges.removedGyms.includes(gymId);
  };

  // Toggle gym selection
  const toggleGymSelection = (gymId: string, gymName: string) => {
    const isCurrentlySelected = isGymSelected(gymId);
    const newSelected = [...pendingChanges.selectedGyms];
    const newRemoved = [...pendingChanges.removedGyms];

    if (isCurrentlySelected) {
      // Remove from selection
      const index = newSelected.indexOf(gymId);
      if (index > -1) {
        newSelected.splice(index, 1);
      }
      
      // Add to removed if it was originally selected
      const wasOriginallySelected = currentGyms.some(gym => gym.gym_id === gymId);
      if (wasOriginallySelected && !newRemoved.includes(gymId)) {
        newRemoved.push(gymId);
      }
    } else {
      // Add to selection
      if (newSelected.length >= 3) {
        Alert.alert('Max antal gym', 'Du kan välja max 3 gym för Daily Access.');
        return;
      }
      
      if (!newSelected.includes(gymId)) {
        newSelected.push(gymId);
      }
      
      // Remove from removed list if it was there
      const removedIndex = newRemoved.indexOf(gymId);
      if (removedIndex > -1) {
        newRemoved.splice(removedIndex, 1);
      }
    }

    setPendingChanges({
      selectedGyms: newSelected,
      removedGyms: newRemoved,
    });
  };

  // Get changes summary
  const getChangesSummary = () => {
    const currentGymIds = currentGyms.map(gym => gym.gym_id);
    const newSelections = pendingChanges.selectedGyms.filter(id => !currentGymIds.includes(id));
    const removals = currentGymIds.filter(id => !pendingChanges.selectedGyms.includes(id));
    
    return { newSelections, removals };
  };

  // Confirm changes
  const confirmChanges = async () => {
    try {
      const { newSelections, removals } = getChangesSummary();
      
      // Process removals
      for (const gymId of removals) {
        await removeGymMutation.mutateAsync({ userId, gymId });
      }
      
      // Process new selections
      for (const gymId of newSelections) {
        await addGymMutation.mutateAsync({ userId, gymId });
      }
      
      Alert.alert(
        'Ändringar sparade!',
        `Dina Daily Access-ändringar träder i kraft ${formatDate(currentPeriodEnd || '')}.`,
        [{ text: 'OK', onPress: onClose }]
      );
      
    } catch (error: any) {
      Alert.alert('Fel', error.message || 'Kunde inte spara ändringar.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'nästa faktureringsperiod';
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const renderOverview = () => (
    <View className="flex-1">
      {/* Header */}
      <View className="px-6 py-6 bg-primary/5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-textPrimary text-2xl font-bold">
            Daily Access
          </Text>
          <TouchableOpacity 
            onPress={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={18} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <Text className="text-textSecondary text-base leading-relaxed">
          Hantera dina valda gym för obegränsad access
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Current Period Info */}
        <View className="bg-primary/10 rounded-2xl p-4 mb-6 mt-4">
          <View className="flex-row items-center mb-2">
            <Calendar size={16} color="#6366f1" />
            <Text className="text-primary text-sm font-semibold ml-2">
              Aktuell period
            </Text>
          </View>
          <Text className="text-textSecondary text-sm">
            Ändringar träder i kraft {formatDate(currentPeriodEnd || '')}
          </Text>
        </View>

        {/* Current Gyms */}
        <View className="mb-6">
          <Text className="text-textPrimary text-lg font-bold mb-4">
            Dina valda gym ({currentGyms.length + (dailyAccessData?.pending?.length || 0)}/3)
          </Text>
          
          {loading ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (currentGyms.length > 0 || (dailyAccessData?.pending?.length || 0) > 0) ? (
            <>
              {/* Active (Current) Gyms */}
              {currentGyms.map((gym) => (
                <View
                  key={gym.gym_id}
                  className="bg-surface rounded-2xl p-4 mb-3 border border-border/50"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-textPrimary font-semibold text-base mb-1">
                        {gym.gym_name}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {gym.gym_address || 'Ingen adress'}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        <Text className="text-green-600 text-xs font-medium">
                          Aktiv
                        </Text>
                      </View>
                    </View>
                    <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                      <Check size={16} color="#10b981" />
                    </View>
                  </View>
                </View>
              ))}

              {/* Pending Gyms */}
              {(dailyAccessData?.pending || []).map((gym) => (
                <View
                  key={gym.gym_id}
                  className="bg-amber-50 rounded-2xl p-4 mb-3 border border-amber-200"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-textPrimary font-semibold text-base mb-1">
                        {gym.gym_name}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {gym.gym_address || 'Ingen adress'}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Clock size={12} color="#d97706" />
                        <Text className="text-amber-600 text-xs font-medium ml-1">
                          Väntar på nästa faktureringsperiod
                        </Text>
                      </View>
                    </View>
                    <View className="w-10 h-10 bg-amber-100 rounded-full items-center justify-center">
                      <Clock size={16} color="#d97706" />
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View className="bg-primary/5 rounded-3xl p-8 items-center border border-primary/10">
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                <MapPin size={28} color="#6366f1" />
              </View>
              <Text className="text-textPrimary font-semibold text-lg mb-2 text-center">
                Inga gym valda ännu
              </Text>
              <Text className="text-textSecondary text-center text-sm leading-relaxed">
                Välj upp till 3 gym som du vill ha tillgång till med din Daily Access-medlemskap
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View className="px-6 pb-8 pt-6 bg-background border-t border-border/10">
        <TouchableOpacity
          onPress={() => setStep('select')}
          className="bg-primary rounded-2xl py-4 flex-row items-center justify-center shadow-sm"
          activeOpacity={0.8}
          style={{
            backgroundColor: currentGyms.length === 0 ? '#6366f1' : '#4f46e5',
            elevation: currentGyms.length === 0 ? 8 : 4,
            shadowColor: '#6366f1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: currentGyms.length === 0 ? 0.3 : 0.1,
            shadowRadius: 8,
          }}
        >
          {currentGyms.length === 0 ? (
            <>
              <Plus size={22} color="#ffffff" />
              <Text className="text-white font-bold text-lg ml-2">
                Välj dina gym
              </Text>
            </>
          ) : (
            <>
              <Edit3 size={20} color="#ffffff" />
              <Text className="text-white font-bold text-base ml-2">
                Redigera gym-val
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSelection = () => (
    <View className="flex-1">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border/50">
        <Text className="text-textPrimary text-xl font-bold mb-2">
          Välj gym ({pendingChanges.selectedGyms.length}/3)
        </Text>
        <Text className="text-textSecondary text-sm">
          Välj 2-3 gym för din Daily Access
        </Text>
      </View>

      {/* Search */}
      <View className="px-6 py-4">
        <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3 border border-border/30">
          <Search size={20} color="#9ca3af" />
          <TextInput
            placeholder="Sök gym..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-textPrimary text-base"
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Gym List */}
      <ScrollView className="flex-1 px-6">
        {filteredGyms.map((club) => {
          const isSelected = isGymSelected(club.id);
          const wasOriginallySelected = currentGyms.some(gym => gym.gym_id === club.id);
          
          return (
            <TouchableOpacity
              key={club.id}
              onPress={() => toggleGymSelection(club.id, club.name)}
              className={`rounded-2xl p-4 mb-3 border-2 ${
                isSelected
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface border-border/30'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-textPrimary font-semibold text-base mb-1">
                    {club.name}
                  </Text>
                  <Text className="text-textSecondary text-sm mb-2">
                    {club.address}
                  </Text>
                  
                  {/* Status indicators */}
                  <View className="flex-row items-center">
                    {wasOriginallySelected && (
                      <View className="bg-blue-100 px-2 py-1 rounded-full mr-2">
                        <Text className="text-blue-600 text-xs font-medium">
                          Nuvarande
                        </Text>
                      </View>
                    )}
                    {isSelected && !wasOriginallySelected && (
                      <View className="bg-green-100 px-2 py-1 rounded-full mr-2">
                        <Text className="text-green-600 text-xs font-medium">
                          Ny
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View className={`w-10 h-10 rounded-full items-center justify-center ${
                  isSelected ? 'bg-primary' : 'bg-gray-200'
                }`}>
                  {isSelected && <Check size={16} color="#ffffff" />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Action Buttons */}
      <View className="px-6 pb-6 pt-4 bg-background border-t border-border/50">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setStep('overview')}
            className="flex-1 bg-gray-100 rounded-2xl py-4 items-center justify-center"
            activeOpacity={0.8}
          >
            <Text className="text-gray-700 font-semibold text-base">
              Avbryt
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setStep('confirm')}
            disabled={pendingChanges.selectedGyms.length < 2}
            className={`flex-1 rounded-2xl py-4 items-center justify-center ${
              pendingChanges.selectedGyms.length >= 2
                ? 'bg-primary'
                : 'bg-gray-300'
            }`}
            activeOpacity={0.8}
          >
            <Text className={`font-semibold text-base ${
              pendingChanges.selectedGyms.length >= 2
                ? 'text-white'
                : 'text-gray-500'
            }`}>
              Nästa
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderConfirmation = () => {
    const { newSelections, removals } = getChangesSummary();
    const selectedGymData = clubs.filter(club => pendingChanges.selectedGyms.includes(club.id));

    return (
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 border-b border-border/50">
          <Text className="text-textPrimary text-xl font-bold mb-2">
            Bekräfta ändringar
          </Text>
          <Text className="text-textSecondary text-sm">
            Granska dina ändringar innan du sparar
          </Text>
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Timeline */}
          <View className="bg-amber-50 rounded-2xl p-4 mb-6 mt-4 border border-amber-200">
            <View className="flex-row items-center mb-2">
              <Clock size={16} color="#f59e0b" />
              <Text className="text-amber-700 text-sm font-semibold ml-2">
                När träder ändringarna i kraft?
              </Text>
            </View>
            <Text className="text-amber-600 text-sm">
              Dina ändringar blir aktiva {formatDate(currentPeriodEnd || '')} när din nästa faktureringsperiod börjar.
            </Text>
          </View>

          {/* Your New Selection */}
          <View className="mb-6">
            <Text className="text-textPrimary text-lg font-bold mb-4">
              Din nya selection ({selectedGymData.length}/3)
            </Text>
            
            {selectedGymData.map((club) => {
              const isNew = newSelections.includes(club.id);
              return (
                <View
                  key={club.id}
                  className="bg-surface rounded-2xl p-4 mb-3 border border-border/50"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 mr-3">
                      <Text className="text-textPrimary font-semibold text-base mb-1">
                        {club.name}
                      </Text>
                      <Text className="text-textSecondary text-sm">
                        {club.address}
                      </Text>
                    </View>
                    
                    <View className={`px-3 py-1 rounded-full ${
                      isNew ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      <Text className={`text-xs font-medium ${
                        isNew ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {isNew ? 'Ny' : 'Behålls'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Changes Summary */}
          {(newSelections.length > 0 || removals.length > 0) && (
            <View className="mb-6">
              <Text className="text-textPrimary text-lg font-bold mb-4">
                Sammanfattning av ändringar
              </Text>
              
              {newSelections.length > 0 && (
                <View className="bg-green-50 rounded-xl p-4 mb-3 border border-green-200">
                  <Text className="text-green-700 font-semibold mb-2">
                    ✅ Nya gym ({newSelections.length})
                  </Text>
                  {newSelections.map(gymId => {
                    const gym = clubs.find(c => c.id === gymId);
                    return (
                      <Text key={gymId} className="text-green-600 text-sm">
                        • {gym?.name}
                      </Text>
                    );
                  })}
                </View>
              )}
              
              {removals.length > 0 && (
                <View className="bg-red-50 rounded-xl p-4 mb-3 border border-red-200">
                  <Text className="text-red-700 font-semibold mb-2">
                    ❌ Borttagna gym ({removals.length})
                  </Text>
                  {removals.map(gymId => {
                    const gym = currentGyms.find(g => g.gym_id === gymId);
                    return (
                      <Text key={gymId} className="text-red-600 text-sm">
                        • {gym?.gym_name}
                      </Text>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View className="px-6 pb-6 pt-4 bg-background border-t border-border/50">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => setStep('select')}
              className="flex-1 bg-gray-100 rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.8}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Tillbaka
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={confirmChanges}
              disabled={submitting}
              className="flex-1 bg-primary rounded-2xl py-4 items-center justify-center"
              activeOpacity={0.8}
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Bekräfta ändringar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView className="flex-1 bg-background">
        {/* Close Button */}
        <View className="absolute top-4 right-4 z-10">
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {step === 'overview' && renderOverview()}
        {step === 'select' && renderSelection()}
        {step === 'confirm' && renderConfirmation()}
      </SafeAreaView>
    </Modal>
  );
}