import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  CheckIcon,
  Clock,
  Info,
  XCircle,
} from "lucide-react-native";
import React from "react";
import { StyleSheet, Text } from "react-native";

type IconType = React.ComponentType<any>;

interface StatusConfig {
  colors: [string, string];
  textColor: string;
  icon: IconType;
  text: string;
}

interface StatusBadgeProps {
  status: string;
  config?: Record<string, StatusConfig>;
}

const defaultStatusConfig: Record<string, StatusConfig> = {
  active: {
    colors: ["#10b981", "#059669"],
    textColor: "#fff",
    icon: CheckIcon,
    text: "Aktiv",
  },
  trialing: {
    colors: ["#3b82f6", "#2563eb"],
    textColor: "#fff",
    icon: Clock,
    text: "Testperiod",
  },
  canceled: {
    colors: ["#ef4444", "#dc2626"],
    textColor: "#fff",
    icon: XCircle,
    text: "Avslutad",
  },
  past_due: {
    colors: ["#f59e0b", "#d97706"],
    textColor: "#fff",
    icon: AlertTriangle,
    text: "Förfallen",
  },
  incomplete: {
    colors: ["#f59e0b", "#d97706"],
    textColor: "#fff",
    icon: AlertTriangle,
    text: "Ofullständig",
  },
  incomplete_expired: {
    colors: ["#ef4444", "#dc2626"],
    textColor: "#fff",
    icon: XCircle,
    text: "Utgången",
  },
  unpaid: {
    colors: ["#ef4444", "#dc2626"],
    textColor: "#fff",
    icon: AlertTriangle,
    text: "Obetald",
  },
  paused: {
    colors: ["#f59e0b", "#d97706"],
    textColor: "#fff",
    icon: Clock,
    text: "Pausad",
  },
  inactive: {
    colors: ["#6b7280", "#4b5563"],
    textColor: "#fff",
    icon: Info,
    text: "Inaktiv",
  },
  scheduled_change: {
    colors: ["#3b82f6", "#2563eb"],
    textColor: "#fff",
    icon: Clock,
    text: "Schemalagd",
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, config }) => {
  const statusConfig = config?.[status] ||
    defaultStatusConfig[status] || {
      colors: ["#6b7280", "#4b5563"],
      textColor: "#fff",
      icon: Info,
      text: status || "Okänd",
    };

  const { colors, textColor, icon: Icon, text } = statusConfig;

  return (
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
        style={styles.icon}
      />
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
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
