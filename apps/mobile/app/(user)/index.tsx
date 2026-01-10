import { AnimatedScreen } from "@shared/components/AnimationProvider";
import { FavoriteClubs } from "@shared/components/FavoriteClubs";
import { NearbyFacilities } from "@shared/components/NearbyFacilities";
import { PageHeader } from "@shared/components/PageHeader";
import { SafeAreaWrapper } from "@shared/components/SafeAreaWrapper";
import { ROUTES } from "@shared/config/constants";
import { useAuth } from "@shared/hooks/useAuth";
import { useUserProfile } from "@shared/hooks/useUserProfile";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { Credits } from "../home/credits";
import { PromoBanner } from "../home/promo";

export default function HomeScreen() {
  const auth = useAuth();
  const { data: userProfile } = useUserProfile(auth.user?.id || "");
  const { first_name, last_name, avatar_url } = userProfile || {};
  const router = useRouter();

  return (
    <SafeAreaWrapper edges={["top"]} className="bg-background">
      <AnimatedScreen>
        <PageHeader
          title={`Välkommen`}
          subtitle="Redo för ditt nästa träningspass?"
          avatar={{
            uri: userProfile?.avatar_url ?? "",
            onPress: () => router.push(ROUTES.PROFILE as any),
          }}
        />
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
        >
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
