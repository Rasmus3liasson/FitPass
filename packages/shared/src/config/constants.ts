export const ROUTES = {
  LOGIN: "/(auth)/login",
  CLUB_HOME: "/(club)",
  USER_HOME: "/(user)",
  EDIT_CLUB: "/(club)/edit-club",
  EDIT_CLUB_OPEN_HOURS: "/(club)/edit-club/open-hours",
  FACILITY: (id: string) => `/facility/${id}`,
  PROFILE_MEMBERSHIP_DETAILS: "/profile/membership-details",
  REGISTER: "/register",
  SIGN_IN: "/sign-in",
  CLUB_SIGN_IN: "/club",
  VERIFY_CODE: "/(auth)/verify-code",
  TABS: "/(tabs)",
  MAP: "/map",
  DISCOVER: "/discover",
  PROFILE_MEMBERSHIP_MANAGEMENT: "/profile/membership-management",
  PROFILE_EDIT: "/profile/edit-profile",
  USER_DISCOVER_DAILY_ACCESS: "/(user)/discover?dailyAccess=true",
  PROFILE_BILLING: "/profile/billing",
  PROFILE_PAYMENTS: "/profile/billing",
  PROFILE: "/profile/",
  PROFILE_LOCATION_SETTINGS: "/profile/location-settings",
  PROFILE_PRIVACY_SETTINGS: "/(user)/privacy-settings",

  APP_SETTINGS: "/app-settings",
  HELP_CENTER: "/help-center",
  PRIVACY_POLICY: "/privacy-policy",
  MESSAGES: "/messages",
  MESSAGES_ID: (conversationId: string) => `/messages/${conversationId}`,
};

export const DEFAULTS = {
  OPEN_HOURS: "08:00-20:00",
};
