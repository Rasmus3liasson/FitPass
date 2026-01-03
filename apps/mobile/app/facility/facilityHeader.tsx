import colors from '@shared/constants/custom-colors';
import { BackButton } from "@shared/components/Button";
import { Bookmark, Share } from "lucide-react-native";
import { TouchableOpacity, View } from "react-native";

interface Props {
  isBookmarked: boolean;
  onToggle: () => void;
}

export function FacilityHeader({ isBookmarked, onToggle }: Props) {
  return (
    <View className="absolute top-9 left-0 right-0 flex-row justify-between px-4 py-4 z-10">
      <BackButton />
      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
          onPress={onToggle}
        >
          <Bookmark
            size={24}
            color="white"
            fill={isBookmarked ? "white" : "none"}
          />
        </TouchableOpacity>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-black/50 items-center justify-center">
          <Share size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
