export const NewsTypeOptions = [
  {
    key: "announcement",
    label: "Meddelande",
    icon: "📢",
  },
  {
    key: "new_class",
    label: "Nytt Pass",
    icon: "🆕",
  },
  {
    key: "event",
    label: "Event",
    icon: "🎉",
  },
  {
    key: "promotion",
    label: "Erbjudande",
    icon: "🎁",
  },
  {
    key: "update",
    label: "Uppdatering",
    icon: "📝",
  },
  {
    key: "other",
    label: "Annat",
    icon: "🔧",
  },
] as const;

export type NewsType = (typeof NewsTypeOptions)[number]["key"] | string;

export const TargetAudienceOptions = [
  { key: "all", label: "Alla", description: `Alla användare` },
  {
    key: "members",
    label: "Endast Medlemmar",
    description: `${process.env.EXPO_PUBLIC_APP_NAME} medlemmar`,
  },
  {
    key: "club_members",
    label: "Klubbmedlemmar",
    description: "Endast dina klubbmedlemmar",
  },
] as const;

export type TargetAudience = (typeof TargetAudienceOptions)[number]["key"];

export const ActionTypeOptions = [
  {
    key: "none",
    label: "Ingen åtgärd",
    description: "Endast visa information",
  },
  {
    key: "book_class",
    label: "Boka Pass",
    description: "Länka till passbokning",
  },
  { key: "visit_club", label: "Besök Klubb", description: "Visa klubbsida" },
  {
    key: "external_link",
    label: "Extern Länk",
    description: "Öppna extern webbsida",
  },
  { key: "promo_code", label: "Rabattkod", description: "Visa rabattkod" },
  {
    key: "contact_club",
    label: "Kontakta Klubb",
    description: "Visa kontaktinformation",
  },
] as const;

export type ActionType = (typeof ActionTypeOptions)[number]["key"];

export default {};
