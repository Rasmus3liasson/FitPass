import colors from '@shared/constants/custom-colors';
import { Calendar, Clock, MapPin, User } from "phosphor-react-native";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { formatSwedishDate, formatSwedishTime } from "../utils/time";
import { ViewAllModal } from "./ViewAllModal";

interface RecentClass {
  id: string;
  name: string;
  facility: string;
  image: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  status: "completed" | "upcoming" | "cancelled";
}

interface RecentClassesModalProps {
  visible: boolean;
  onClose: () => void;
  classes: RecentClass[];
  title?: string;
}

export function RecentClassesModal({
  visible,
  onClose,
  classes,
  title = "Recent Classes",
}: RecentClassesModalProps) {
  const [sortBy, setSortBy] = useState<"Nyast" | "Äldsta" | "Kommande">(
    "Nyast"
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const getSortedAndFilteredClasses = () => {
    let filtered = classes;

    if (statusFilter) {
      filtered = classes.filter((cls) => cls.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "Nyast":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "Äldsta":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "Kommande":
          const aUpcoming = new Date(a.date).getTime() > new Date().getTime();
          const bUpcoming = new Date(b.date).getTime() > new Date().getTime();
          if (aUpcoming && !bUpcoming) return -1;
          if (!aUpcoming && bUpcoming) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        default:
          return 0;
      }
    });
  };



  const sortedClasses = getSortedAndFilteredClasses();

  // Debug log with proper Swedish formatting
  if (sortedClasses.length > 0) {
    console.log("sorted classes", formatSwedishDate(sortedClasses[0].date));
  }
  

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return colors.accentGreen;
      case "upcoming":
        return colors.accentBlue;
      case "cancelled":
        return colors.accentRed;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Genomförd";
      case "upcoming":
        return "Kommande";
      case "cancelled":
        return "Avbruten";
      default:
        return status;
    }
  };

  const renderClass = (classItem: RecentClass) => (
    <TouchableOpacity className="bg-surface rounded-2xl p-4">
      <View className="flex-row">
        {/* Class Image */}
        <Image
          source={{ uri: classItem.image }}
          className="w-16 h-16 rounded-xl"
        />

        {/* Class Info */}
        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-textPrimary font-semibold text-base"
              numberOfLines={1}
            >
              {classItem.name}
            </Text>
            <View
              className="px-2 py-1 rounded-full"
              style={{
                backgroundColor: `${getStatusColor(classItem.status)}20`,
              }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: getStatusColor(classItem.status) }}
              >
                {getStatusLabel(classItem.status)}
              </Text>
            </View>
          </View>

          {/* Facility */}
          <View className="flex-row items-center mb-2">
            <MapPin size={14} color={colors.textSecondary} />
            <Text className="text-textSecondary text-sm ml-2" numberOfLines={1}>
              {classItem.facility}
            </Text>
          </View>

          {/* Date & Time */}
          <View className="flex-row items-center mb-2">
            <Calendar size={14} color={colors.textSecondary} />
            <Text className="text-textSecondary text-sm ml-2">
              {formatSwedishDate(classItem.date)} • {formatSwedishTime(classItem.date)}
            </Text>
          </View>

          {/* Duration & Instructor */}
          <View className="flex-row itemrs-center justify-between">
            <View className="flex-row items-center">
              <Clock size={14} color={colors.textSecondary} />
              <Text className="text-textSecondary text-sm ml-2">
                {classItem.duration}
              </Text>
            </View>

            <View className="flex-row items-center">
              <User size={14} color={colors.textSecondary} />
              <Text className="text-textSecondary text-sm ml-2">
                {classItem.instructor}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const completedCount = classes.filter((c) => c.status === "completed").length;
  const upcomingCount = classes.filter((c) => c.status === "upcoming").length;

  return (
    <ViewAllModal
      visible={visible}
      onClose={onClose}
      title={title}
      stats={{
        mainValue: classes.length.toString(),
        mainLabel: "Genomförda klasser",
        subValue: `${completedCount} genomförda, ${upcomingCount} kommande`,
        subLabel: "",
      }}
      filterOptions={[
        { key: "nyaste", label: "Nyast först", icon: Calendar },
        { key: "äldsta", label: "Äldsta först", icon: Calendar },
        { key: "kommande", label: "Kommande först", icon: Clock },
      ]}
      selectedFilter={sortBy}
      onFilterChange={(filter) => setSortBy(filter as any)}
      secondaryFilters={{
        options: [
          { key: null, label: "All Status" },
          { key: "upcoming", label: "Kommande" },
          { key: "completed", label: "Genomförd" },
          { key: "cancelled", label: "Avbruten" },
        ],
        selected: statusFilter,
        onSelectionChange: setStatusFilter,
      }}
      data={sortedClasses}
      renderItem={renderClass}
      emptyState={{
        icon: <Calendar size={24} color={colors.primary} />,
        title: "Inga Klasser Hittades",
        subtitle: "Du har inte bokat några klasser än",
      }}
    />
  );
}
