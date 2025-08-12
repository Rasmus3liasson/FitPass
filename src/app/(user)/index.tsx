import { FavoriteClubs } from "@/components/FavoriteClubs";
import { NearbyFacilities } from "@/components/NearbyFacilities";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { Credits } from "../home/credits";
import { HeaderWelcome } from "../home/headerWelcome";
import { PromoBanner } from "../home/promo";

export default function HomeScreen() {
  const router = useRouter();
  const { userProfile, user } = useAuth();
  const { first_name, last_name, avatar_url } = userProfile || {};

  return (
    <SafeAreaWrapper edges={["top"]} className="bg-background">
      <AnimatedScreen>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <HeaderWelcome
            firstName={first_name || ""}
            lastName={last_name || ""}
            avatarUrl={avatar_url}
          />

          <Credits />
          {/* <StatsMonth user={userProfile!} /> */}

          <FavoriteClubs />
          <NearbyFacilities />
          <PromoBanner />
        </ScrollView>
      </AnimatedScreen>
    </SafeAreaWrapper>
  );
}
