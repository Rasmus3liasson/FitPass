import { Button } from "@/components/Button";
import { useRouter } from "expo-router";
import { Calendar } from "lucide-react-native";
import { View } from "react-native";

interface Props {
  id: string;
}

export function FacilityActions({ id }: Props) {
  const router = useRouter();

  return (
    <View className="flex-row items-center justify-center gap-3 mt-6">
      <Button
        title="Check In Now"
        icon={<Calendar size={18} color="#FFFFFF" />}
        onPress={() => router.push(`/facility/${id}/checkin`)}
        style={{ flex: 1 }}
      />
      <Button
        title="Book Class"
        onPress={() => router.push(`/facility/${id}/classes`)}
        variant="secondary"
        style={{ flex: 1 }}
      />
    </View>
  );
}
