export const ROUTES = {
  LOGIN: "/(auth)/login/",
  CLUB_HOME: "/(club)/",
  USER_HOME: "/(user)/",
  EDIT_CLUB: "/(club)/edit-club",
  EDIT_CLUB_OPEN_HOURS: "/(club)/edit-club/open-hours",
  FACILITY: (id: string) => `/facility/${id}`,
  PROFILE_MEMBERSHIP_DETAILS: "/profile/membership-details",
  REGISTER: "/register",
  SIGN_IN: "/sign-in",
  CLUB_SIGN_IN: "/club",
  VERIFY_CODE: "/(auth)/verify-code",
  TABS: "/(tabs)",
  MAP: "/map/",
  DISCOVER: "/discover",
};

export const DEFAULTS = {
  OPEN_HOURS: "08:00-20:00",
}; 