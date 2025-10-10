import { ProgressCircle } from "@/src/components/ProgressCircle";
import { useMembership } from "@/src/hooks/useMembership";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export const Credits = () => {
  const { membership, loading } = useMembership();
  const router = useRouter();

  if (loading) {
    return (
      <View className="bg-surface rounded-2xl px-5 py-6 mx-4 mb-6">
        <Text className="text-textSecondary">Laddar medlemsdata...</Text>
      </View>
    );
  }

  if (!membership) {
    return (
      <TouchableOpacity
        className="bg-surface rounded-2xl px-5 py-6 mx-4 mb-6"
        onPress={() => router.push("/profile/membership-details")}
      >
        <Text className="text-textSecondary text-center">
          Inget aktivt medlemskap hittades
        </Text>
        <Text className="text-primary text-center mt-1">Välj ett abonnemang</Text>
      </TouchableOpacity>
    );
  }

  const creditsLeft = membership.credits - membership.credits_used;
  const percentage = (membership.credits_used / membership.credits) * 100;
  const currentMonth = format(new Date(), "MMMM yyyy");

  return (
    <View className="bg-surface rounded-2xl px-5 py-6 mx-4 mb-6">
      <View className="flex-row justify-between items-center mb-5">
        <Text className="text-lg font-bold text-textPrimary">
          Månatliga krediter
        </Text>
        <Text className="text-sm text-textSecondary">{currentMonth}</Text>
      </View>
      <View className="flex-row items-center">
        <ProgressCircle
          percentage={percentage}
          radius={40}
          strokeWidth={8}
          color="#6366F1"
          textColor="#FFFFFF"
        />
        <View className="flex-1 ml-5">
          <View className="mb-3">
            <Text className="text-lg font-bold text-textPrimary mb-1">
              {creditsLeft}/{membership.credits}
            </Text>
            <Text className="text-sm text-textSecondary">Krediter kvar</Text>
          </View>
          <View>
            <Text className="text-lg font-bold text-textPrimary mb-1">
              {membership.credits_used}
            </Text>
            <Text className="text-sm text-textSecondary">Besök gjorda</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
