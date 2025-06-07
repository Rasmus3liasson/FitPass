import { FacilityCard } from "@/components/FacilityCard";
import { SafeAreaWrapper } from "@/components/SafeAreaWrapper";
import { Section } from "@/components/Section";

import { ClassCard } from "@/src/components/ClassCard";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { Credits } from "../home/credits";
import { HeaderWelcome } from "../home/headerWelcome";
import { PromoBanner } from "../home/promo";
import { UpcomingBooking } from "../home/upcomingBookings";

export default function HomeScreen() {
  const router = useRouter();

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
        <HeaderWelcome />
        <Credits />
        <Section title="Upcoming Bookings" actionText="View All">
          <UpcomingBooking />
        </Section>
        <Section
          title="Nearby Facilities"
          description="Check out these locations close to you"
          actionText="View Map"
          onAction={() => router.push("/map/")}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <FacilityCard
              name="PowerFit Gym"
              type="Gym"
              image="https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg"
              rating={4.8}
              distance="0.8 mi"
              openNow={true}
              onPress={() => router.push("/login/")}
            />
            <FacilityCard
              name="AquaLife Center"
              type="Swimming"
              image="https://images.pexels.com/photos/261185/pexels-photo-261185.jpeg"
              rating={4.6}
              distance="1.2 mi"
              openNow={true}
              onPress={() => router.push("/facility/aqualife")}
            />
            <FacilityCard
              name="Boulder Zone"
              type="Climbing"
              image="https://images.pexels.com/photos/449609/pexels-photo-449609.jpeg"
              rating={4.9}
              distance="2.3 mi"
              openNow={false}
              onPress={() => router.push("/facility/boulder")}
            />
          </ScrollView>
        </Section>
        <Section
          title="Trending Classes"
          description="Popular classes at partner facilities"
          actionText="Explore All"
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <ClassCard
              name="Power Yoga"
              facility="Zen Studio"
              image="https://images.pexels.com/photos/1812964/pexels-photo-1812964.jpeg"
              time="7:00 PM"
              duration="60 min"
              intensity="Medium"
              spots={0}
              onPress={() => {}}
            />
          </ScrollView>
        </Section>
        <PromoBanner />
      </ScrollView>
    </SafeAreaWrapper>
  );
}
