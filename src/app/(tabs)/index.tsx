import { NearbyFacilities } from "@/components/NearbyFacilities";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { TrendingClasses } from "@/components/TrendingClasses";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Credits } from "../home/credits";
import { HeaderWelcome } from "../home/headerWelcome";
import { PromoBanner } from "../home/promo";
import { UpcomingBooking } from "../home/upcomingBookings";

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { first_name, last_name, avatar_url } = userProfile || {};

  return (
    <SafeAreaWrapper>
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text
            className="text-textPrimary"
            onPress={() => router.push("/login/")}
          >
            Welcome to FitTrack!
          </Text>
        </View>
        <HeaderWelcome
          firstName={first_name || ""}
          lastName={last_name || ""}
          avatarUrl={avatar_url}
        />
        <Credits />
        <UpcomingBooking />
        <NearbyFacilities />
        <TrendingClasses />
        <PromoBanner />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
