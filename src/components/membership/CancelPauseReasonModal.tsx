import { Option, OptionsModal } from "../ui/OptionsModal";

type ActionType = "pause" | "cancel";

interface Reason extends Option {
  analytics_key: string;
}

const PAUSE_REASONS: Reason[] = [
  { id: "vacation", label: "På semester/resa", value: "vacation", analytics_key: "pause_vacation" },
  { id: "injury", label: "Skadad/sjuk", value: "injury", analytics_key: "pause_injury" },
  { id: "busy", label: "För upptagen just nu", value: "busy", analytics_key: "pause_busy" },
  { id: "financial", label: "Ekonomiska skäl", value: "financial", analytics_key: "pause_financial" },
  { id: "temporary_break", label: "Behöver ett träningsuppehåll", value: "temporary_break", analytics_key: "pause_break" },
  { id: "other", label: "Annat", value: "other", analytics_key: "pause_other" },
];

const CANCEL_REASONS: Reason[] = [
  { id: "expensive", label: "För dyrt", value: "expensive", analytics_key: "cancel_expensive" },
  { id: "not_using", label: "Använder inte tillräckligt", value: "not_using", analytics_key: "cancel_not_using" },
  { id: "location", label: "Gym på fel ställe", value: "location", analytics_key: "cancel_location" },
  { id: "moving", label: "Flyttar från området", value: "moving", analytics_key: "cancel_moving" },
  { id: "switching", label: "Byter till annat gym", value: "switching", analytics_key: "cancel_switching" },
  { id: "dissatisfied", label: "Missnöjd med tjänsten", value: "dissatisfied", analytics_key: "cancel_dissatisfied" },
  { id: "goals_achieved", label: "Nått mina träningsmål", value: "goals_achieved", analytics_key: "cancel_goals_achieved" },
  { id: "other", label: "Annat", value: "other", analytics_key: "cancel_other" },
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
