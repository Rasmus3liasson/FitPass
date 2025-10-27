import { FavoriteClubs } from "@/components/FavoriteClubs";
import { NearbyFacilities } from "@/components/NearbyFacilities";
import { PageHeader } from "@/components/PageHeader";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { AnimatedScreen } from "@/src/components/AnimationProvider";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "expo-router";
import { ScrollView } from "react-native";
import { Credits } from "../home/credits";
import { PromoBanner } from "../home/promo";

export default function HomeScreen() {
  const { userProfile, user } = useAuth();
  const { first_name, last_name, avatar_url } = userProfile || {};
  const router = useRouter();

  return (
    <SafeAreaWrapper edges={["top"]} className="bg-background">
      <AnimatedScreen>
        <PageHeader
          title={`Välkommen`}
          subtitle="Redo för ditt nästa träningspass?"
          avatar={{
            uri:
              avatar_url ||
              `https://ui-avatars.com/api/?name=${first_name}+${last_name}&background=6366F1&color=fff`,
            onPress: () => router.push("./profile"),
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
