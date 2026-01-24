import colors from '@shared/constants/custom-colors';
import { useFriendsInClass } from '@shared/hooks/useFriends';
import { Booking } from '@shared/types';
import { formatSwedishTime } from '@shared/utils/time';
import * as Haptics from 'expo-haptics';
import { Calendar, Users } from 'phosphor-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { FadeInView, SmoothPressable } from '../SmoothPressable';

interface BookingCardProps {
  booking: Booking;
  isUpcoming: boolean;
  index: number;
  isHorizontal?: boolean;
  disabled?: boolean;
  onPress: () => void;
  onCancel?: () => void;
  isCancelling?: boolean;
  userId?: string;
}

export function BookingCard({
  booking,
  isUpcoming,
  index,
  isHorizontal = false,
  disabled = false,
  onPress,
  onCancel,
  isCancelling = false,
  userId,
}: BookingCardProps) {
  const { data: friendsInClass = [] } = useFriendsInClass(userId || '', booking.class_id || '');
  return (
    <FadeInView key={booking.id} delay={index * 100}>
      <SmoothPressable
        disabled={disabled}
        className={`${isHorizontal ? 'mr-4 w-80' : 'mb-4'} rounded-3xl overflow-hidden`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        style={{
          shadowColor: isUpcoming ? colors.primary : colors.accentGreen,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View className="bg-surface rounded-3xl p-5 border border-surface/20">
          <View className="flex-row items-start justify-between mb-4">
            <View className="flex-1 mr-4">
              <Text className="text-textPrimary font-bold text-lg mb-1 leading-tight">
                {booking.classes?.name || 'Direktbesök'}
              </Text>
              <Text className="text-textSecondary text-sm">
                {booking.classes?.clubs?.name || booking.clubs?.name || 'Okänd anläggning'}
              </Text>
            </View>

            <View
              className={`px-3 py-1.5 rounded-full ${
                isUpcoming
                  ? 'bg-primary/10 border border-primary/20'
                  : 'bg-green-500/10 border border-green-500/20'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isUpcoming ? 'text-textPrimary' : 'text-green-500'
                }`}
              >
                {isUpcoming ? 'Kommande' : 'Genomförd'}
              </Text>
            </View>
          </View>

          <View className="space-y-3">
            {booking.classes?.start_time && booking.classes?.end_time && (
              <View className="flex-row">
                <View className="flex-1">
                  <View className="">
                    <Text className="text-textSecondary text-xs mb-0.5">Tid</Text>
                    <Text className="text-textPrimary font-semibold text-sm">
                      {formatSwedishTime(new Date(booking.classes.start_time))} -{' '}
                      {formatSwedishTime(new Date(booking.classes.end_time))}
                    </Text>
                  </View>
                </View>
                <View className="w-9 h-9 rounded-xl bg-primary/5 items-center justify-center ml-3">
                  <Calendar size={18} color={colors.primary} weight="duotone" />
                </View>
              </View>
            )}

            {friendsInClass.length > 0 && (
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-primary/5 items-center justify-center mr-3">
                  <Users size={18} color={colors.primary} weight="duotone" />
                </View>
                <View className="flex-1">
                  <Text className="text-textSecondary text-xs mb-1">
                    {friendsInClass.length} vän
                    {friendsInClass.length > 1 ? 'ner' : ''} går också
                  </Text>
                  <View className="flex-row items-center flex-wrap">
                    {friendsInClass.slice(0, 4).map((friend) => (
                      <View key={friend.id} className="mr-3 mb-2">
                        {friend.avatar_url ? (
                          <Image
                            source={{ uri: friend.avatar_url }}
                            className="w-10 h-10 rounded-full border-3 border-primary shadow-lg"
                            style={{
                              shadowColor: colors.primary,
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 8,
                            }}
                          />
                        ) : (
                          <View
                            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 items-center justify-center border-3 border-white shadow-lg"
                            style={{
                              shadowColor: colors.primary,
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 8,
                            }}
                          >
                            <Text className="text-white text-xs font-black">
                              {`${friend.first_name?.[0] || ''}${friend.last_name?.[0] || ''}`}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                    {friendsInClass.length > 4 && (
                      <View
                        className="w-10 h-10 rounded-full bg-accentGray/20 items-center justify-center border-2 border-accentGray/30"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                        }}
                      >
                        <Text className="text-textSecondary text-xs font-bold">
                          +{friendsInClass.length - 4}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>

          {isUpcoming && onCancel && (
            <TouchableOpacity
              className="bg-primary rounded-xl py-3 px-4 mt-2"
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onCancel();
              }}
              disabled={isCancelling}
            >
              <View className="flex-row items-center justify-center">
                <Text className="font-medium text-sm text-textPrimary">
                  {isCancelling ? 'Avbryter...' : 'Avboka'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </SmoothPressable>
    </FadeInView>
  );
}
