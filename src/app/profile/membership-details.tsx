import { BackButton } from "@/src/components/Button";
import { MembershipCard } from "@/src/components/MembershipCard";
import { SafeAreaWrapper } from "@/src/components/SafeAreaWrapper";
import { Text, View } from "react-native";

export default function MembershipDetails() {
  return (
    <SafeAreaWrapper>
      <View className="flex-1 bg-background px-4 py-6">
        <View className="mb-4 flex-row items-center gap-7">
          <BackButton />
          <Text className="text-textSecondary text-wrap">
            Choose a new membership plan to continue enjoying our services.
          </Text>
        </View>

        <MembershipCard
          type="Basic"
          startDate="Jan 1, 2023"
          credits={100}
          creditsUsed={50}
          onPress={() => console.log("Basic Membership Selected")}
        />
        <MembershipCard
          type="Premium"
          startDate="Jan 1, 2023"
          credits={200}
          creditsUsed={150}
          onPress={() => console.log("Premium Membership Selected")}
        />
      </View>
    </SafeAreaWrapper>
  );
}
