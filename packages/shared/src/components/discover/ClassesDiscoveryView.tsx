import colors from "@shared/constants/custom-colors";
import { UIClass } from "@shared/types";
import { formatSwedishTime } from "@shared/utils/time";
import { format, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock, Users } from "phosphor-react-native";
import { ScrollView, Text, View } from "react-native";
import { SmoothPressable } from "../SmoothPressable";

interface ClassesDiscoveryViewProps {
  classes: UIClass[];
  onClassPress: (classItem: UIClass) => void;
}

export function ClassesDiscoveryView({
  classes,
  onClassPress,
}: ClassesDiscoveryViewProps) {
  const now = new Date();

  // Filter upcoming classes
  const upcomingClasses = classes
    .filter((c) => new Date(c.startTimeISO) > now)
    .sort(
      (a, b) =>
        new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime(),
    );

  // Group by today, tomorrow, later
  const todayClasses = upcomingClasses.filter((c) =>
    isToday(new Date(c.startTimeISO)),
  );
  const tomorrowClasses = upcomingClasses.filter((c) =>
    isTomorrow(new Date(c.startTimeISO)),
  );
  const laterClasses = upcomingClasses.filter(
    (c) =>
      !isToday(new Date(c.startTimeISO)) &&
      !isTomorrow(new Date(c.startTimeISO)),
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d MMM");
  };

  const renderClassCard = (classItem: UIClass) => {
    const startDate = new Date(classItem.startTimeISO);
    const spotsLeft = classItem.spots;
    const isAlmostFull = spotsLeft <= 5 && spotsLeft > 0;
    const isFull = spotsLeft === 0;

    return (
      <SmoothPressable
        key={classItem.id}
        onPress={() => onClassPress(classItem)}
        className="bg-surface rounded-xl p-4 mb-3 border border-borderGray/10"
      >
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="text-textPrimary font-bold text-base mb-1">
              {classItem.name}
            </Text>
            {classItem.description && (
              <Text className="text-textSecondary text-xs" numberOfLines={1}>
                {classItem.description}
              </Text>
            )}
          </View>
          {classItem.intensity && (
            <View
              className={`px-2.5 py-1 rounded-lg ${
                classItem.intensity === "High"
                  ? "bg-accentRed/20"
                  : classItem.intensity === "Medium"
                    ? "bg-accentOrange/20"
                    : "bg-accentGreen/20"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  classItem.intensity === "High"
                    ? "text-accentRed"
                    : classItem.intensity === "Medium"
                      ? "text-accentOrange"
                      : "text-accentGreen"
                }`}
              >
                {classItem.intensity === "High"
                  ? "Hög"
                  : classItem.intensity === "Medium"
                    ? "Medel"
                    : "Låg"}
              </Text>
            </View>
          )}
        </View>

        {/* Details Grid */}
        <View className="flex-row items-center justify-between">
          {/* Time */}
          <View className="flex-row items-center flex-1">
            <Clock size={14} color={colors.textSecondary} weight="duotone" />
            <Text className="text-textSecondary text-xs ml-1.5">
              {formatSwedishTime(startDate)} • {classItem.duration} min
            </Text>
          </View>

          {/* Spots */}
          <View className="flex-row items-center">
            <Users size={14} color={colors.textSecondary} weight="duotone" />
            <Text
              className={`text-xs ml-1.5 font-semibold ${
                isFull
                  ? "text-accentRed"
                  : isAlmostFull
                    ? "text-accentYellow"
                    : "text-textSecondary"
              }`}
            >
              {isFull
                ? "Fullbokad"
                : isAlmostFull
                  ? `${spotsLeft} kvar`
                  : `${spotsLeft} platser`}
            </Text>
          </View>
        </View>

        {/* Instructor if available */}
        {classItem.instructor && (
          <View className="flex-row items-center mt-2 pt-2 border-t border-borderGray/10">
            <Text className="text-textSecondary text-xs">
              Instruktör:{" "}
              <Text className="text-textPrimary font-medium">
                {classItem.instructor}
              </Text>
            </Text>
          </View>
        )}
      </SmoothPressable>
    );
  };

  const renderSection = (
    title: string,
    classes: UIClass[],
    emptyMessage: string,
  ) => {
    if (classes.length === 0) return null;

    return (
      <View className="mb-6">
        <Text className="text-textPrimary font-bold text-lg mb-3 px-6">
          {title}
        </Text>
        <View className="px-6">
          {classes.map((classItem) => renderClassCard(classItem))}
        </View>
      </View>
    );
  };

  if (upcomingClasses.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Calendar size={48} color={colors.textSecondary} weight="duotone" />
        <Text className="text-textPrimary text-lg font-semibold mt-4 mb-2">
          Inga kommande klasser
        </Text>
        <Text className="text-textSecondary text-center">
          Det finns inga schemalagda klasser just nu. Kom tillbaka senare!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      {renderSection("Idag", todayClasses, "Inga klasser idag")}
      {renderSection("Imorgon", tomorrowClasses, "Inga klasser imorgon")}
      {renderSection("Kommande", laterClasses, "Inga fler klasser")}
    </ScrollView>
  );
}
