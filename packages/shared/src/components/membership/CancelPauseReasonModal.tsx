import { AirplaneTilt, Bandaids, Clock, CurrencyDollar, DotsThree, Swap, ThumbsDown, TrendDown } from "phosphor-react-native";
import { Option, OptionsModal } from "../ui/OptionsModal";

type ActionType = "pause" | "cancel";

interface Reason extends Option {
  analytics_key: string;
  icon: React.ComponentType<any>;
}

const PAUSE_REASONS: Reason[] = [
  { id: "vacation", label: "På semester/resa", value: "vacation", analytics_key: "pause_vacation", icon: AirplaneTilt },
  { id: "injury", label: "Skadad/sjuk", value: "injury", analytics_key: "pause_injury", icon: Bandaids },
  { id: "busy", label: "För upptagen", value: "busy", analytics_key: "pause_busy", icon: Clock },
  { id: "other", label: "Annat skäl", value: "other", analytics_key: "pause_other", icon: DotsThree },
];

const CANCEL_REASONS: Reason[] = [
  { id: "expensive", label: "För dyrt", value: "expensive", analytics_key: "cancel_expensive", icon: CurrencyDollar },
  { id: "not_using", label: "Använder inte tillräckligt", value: "not_using", analytics_key: "cancel_not_using", icon: TrendDown },
  { id: "switching", label: "Byter till annat gym", value: "switching", analytics_key: "cancel_switching", icon: Swap },
  { id: "dissatisfied", label: "Missnöjd med tjänsten", value: "dissatisfied", analytics_key: "cancel_dissatisfied", icon: ThumbsDown },
  { id: "other", label: "Annat skäl", value: "other", analytics_key: "cancel_other", icon: DotsThree },
];

interface CancelPauseReasonModalProps {
  visible: boolean;
  actionType: ActionType;
  onClose: () => void;
  onConfirm: (reason: string, analyticsKey: string) => void;
  isLoading?: boolean;
}

export function CancelPauseReasonModal({
  visible,
  actionType,
  onClose,
  onConfirm,
  isLoading = false,
}: CancelPauseReasonModalProps) {
  const reasons = actionType === "pause" ? PAUSE_REASONS : CANCEL_REASONS;
  const title = actionType === "pause" ? "Varför pausar du?" : "Varför avslutar du?";
  const description =
    actionType === "pause"
      ? "Ditt medlemskap pausas och du debiteras inte under pausperioden."
      : "Ditt medlemskap avslutas vid slutet av nuvarande period. Du behåller åtkomst till dess.";

  const handleConfirm = (selectedOption: Option) => {
    const selectedReason = reasons.find(r => r.id === selectedOption.id);
    if (selectedReason) {
      onConfirm(selectedReason.label, selectedReason.analytics_key);
    }
  };

  return (
    <OptionsModal
      visible={visible}
      title={title}
      description={description}
      options={reasons}
      onClose={onClose}
      onConfirm={handleConfirm}
      confirmButtonText={actionType === "pause" ? "Pausa medlemskap" : "Avsluta medlemskap"}
      confirmButtonColor={actionType === "pause" ? "bg-primary" : "bg-accentRed"}
      isLoading={isLoading}
    />
  );
}
