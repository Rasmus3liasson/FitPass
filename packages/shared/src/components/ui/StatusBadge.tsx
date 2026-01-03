import { LinearGradient } from "expo-linear-gradient";
import {
    WarningCircle,
    CheckIcon,
    Clock,
    Info,
    XCircle,
} from "phosphor-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import colors from "../../constants/custom-colors";

type IconType = React.ComponentType<any>;

interface StatusConfig {
  colors: [string, string];
  textColor: string;
  icon: IconType;
  text?: string;
}

interface StatusBadgeProps {
  status: string;
  config?: Record<string, StatusConfig>;
  onPress?: () => void;
  showText?: boolean;
}

const defaultStatusConfig: Record<string, StatusConfig> = {
  active: {
    colors: [colors.accentGreen, colors.accentGreen],
    textColor: "white",
    icon: CheckIcon,
    text: "Aktiv",
  },
  trialing: {
    colors: [colors.surface, colors.surface],
    textColor: "white",
    icon: Clock,
    text: "Testperiod",
  },
  canceled: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "white",
    icon: XCircle,
    text: "Avslutad",
  },
  past_due: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "white",
    icon: WarningCircle,
    text: "Förfallen",
  },
  incomplete: {
    colors: [colors.accentYellow, colors.accentYellow],
    textColor: "white",
    icon: WarningCircle,
    text: "Ofullständig",
  },
  incomplete_expired: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "white",
    icon: XCircle,
    text: "Utgången",
  },
  unpaid: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "white",
    icon: WarningCircle,
    text: "Obetald",
  },
  paused: {
    colors: [colors.accentBrown, colors.accentBrown],
    textColor: "white",
    icon: Clock,
    text: "Pausad",
  },
  inactive: {
    colors: [colors.accentGray, colors.accentGray],
    textColor: "white",
    icon: Info,
    text: "Inaktiv",
  },
  scheduled_change: {
    colors: [colors.accentBlue, colors.accentBlue],
    textColor: "white",
    icon: Clock,
    text: "Schemalagd",
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  config,
  onPress,
  showText = false,
}) => {
  const statusConfig = config?.[status] ||
    defaultStatusConfig[status] || {
      colors: [colors.borderGray, colors.borderGray],
      textColor: "white",
      icon: Info,
      text: status || "Okänd",
    };

  const { colors: gradientColors, textColor, icon: Icon, text } = statusConfig;

  const BadgeContent = (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.badge, onPress && styles.badgeClickable]}
    >
      <Icon
        name="checkcircle"
        size={16}
        color={textColor}
        style={showText ? styles.icon : undefined}
      />
      {showText && text && (
        <Text style={[styles.text, { color: textColor }]}>{text}</Text>
      )}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {BadgeContent}
      </TouchableOpacity>
    );
  }

  return BadgeContent;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
  },
  badgeClickable: {
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  icon: {
    marginRight: 4,
  },
});

export default StatusBadge;
