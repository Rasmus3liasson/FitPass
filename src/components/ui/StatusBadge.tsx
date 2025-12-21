import colors from "@/src/constants/custom-colors";
import { LinearGradient } from "expo-linear-gradient";
import {
    AlertTriangle,
    CheckIcon,
    Clock,
    Info,
    XCircle,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

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
    textColor: "#fff",
    icon: CheckIcon,
    text: "Aktiv",
  },
  trialing: {
    colors: [colors.surface, colors.surface],
    textColor: "#fff",
    icon: Clock,
    text: "Testperiod",
  },
  canceled: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "#fff",
    icon: XCircle,
    text: "Avslutad",
  },
  past_due: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "#fff",
    icon: AlertTriangle,
    text: "Förfallen",
  },
  incomplete: {
    colors: [colors.accentYellow, colors.accentYellow],
    textColor: "#fff",
    icon: AlertTriangle,
    text: "Ofullständig",
  },
  incomplete_expired: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "#fff",
    icon: XCircle,
    text: "Utgången",
  },
  unpaid: {
    colors: [colors.accentRed, colors.accentRed],
    textColor: "#fff",
    icon: AlertTriangle,
    text: "Obetald",
  },
  paused: {
    colors: [colors.accentBrown, colors.accentBrown],
    textColor: "#fff",
    icon: Clock,
    text: "Pausad",
  },
  inactive: {
    colors: [colors.accentGray, colors.accentGray],
    textColor: "#fff",
    icon: Info,
    text: "Inaktiv",
  },
  scheduled_change: {
    colors: [colors.accentBlue, colors.accentBlue],
    textColor: "#fff",
    icon: Clock,
    text: "Schemalagd",
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, config, onPress, showText = false }) => {
  const statusConfig = config?.[status] ||
    defaultStatusConfig[status] || {
      colors: ["#6b7280", "#4b5563"],
      textColor: "#fff",
      icon: Info,
      text: status || "Okänd",
    };

  const { colors, textColor, icon: Icon, text } = statusConfig;

  const BadgeContent = (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.badge}
    >
      <Icon
        name="checkcircle"
        size={16}
        color={textColor}
        style={showText ? styles.icon : undefined}
      />
      {showText && text && <Text style={[styles.text, { color: textColor }]}>{text}</Text>}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
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
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
  icon: {
    marginRight: 4,
  },
});

export default StatusBadge;
