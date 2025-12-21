export interface Club {
  avatar_url: any;
  club_images?: ClubImage[];
  credits: number;
  id: string;
  name: string;
  type: string;
  description?: string;
  address?: string;
  area?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  amenities?: string[];
  open_hours?: Record<string, string>;
  avg_rating?: number;
  created_at: string;
  updated_at: string;
  photos?: string[];
  rating?: number;
  distance?: number;
  is_open?: boolean;
  user_id?: string;
  visit_count: number;
  // Stripe Connect fields
  stripe_account_id?: string | null;
  payouts_enabled?: boolean;
  kyc_status?: 'verified' | 'pending' | 'needs_input' | null;
  stripe_onboarding_complete?: boolean;
}
export interface ClubImage {
  url: string;
  type: string;
}

export interface FavoriteClub extends Omit<Favorite, "clubs"> {
  clubs: Club;
}
export interface ClubDetailsI {
  club: {
    name: string;
    image_url?: string;
    location?: string;
    address?: string;
    city?: string;
    area?: string;
    avg_rating?: number;
  };
  reviews: {
    id: number;
    rating: number;
  }[];
}

export interface UserProfile {
  full_name: string;
  email: string;
  address_line1: string | undefined;
  city: string;
  postal_code: string;
  country: string;
  id: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  bio?: string;
  credits?: number;
  role?: string;
  created_at?: string;
  avatar_url?: string;
  pushnotifications?: boolean;
  emailupdates?: boolean;
  classreminders?: boolean;
  marketingnotifications?: boolean;
  appupdates?: boolean;
  dark_mode?: boolean;
  // New app settings (stored in database)
  auto_backup?: boolean;
  crash_reporting?: boolean;
  analytics?: boolean;
  offline_mode?: boolean;
  language?: string;
  // Location preferences (using snake_case to match database)
  enable_location_services?: boolean;
  default_location?: string;
  latitude?: number;
  longitude?: number;
  // Privacy settings
  profile_visibility?: boolean;
}

export interface FriendWhoFavoritedClub {
  user_id: string;
  profiles: {
    id: string;
    display_name?: string;
    avatar_url?: string;
    first_name?: string;
    last_name?: string;
  };
}

export type UserRole = "member" | "instructor" | "admin";

export interface UserPreferences {
  language: string;
  darkMode?: boolean;
  pushNotifications?: boolean;
  emailUpdates?: boolean;
  classReminders?: boolean;
  marketingNotifications?: boolean;
  appUpdates?: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  credits_used: number;
  status: string;
  created_at: string;
  updated_at: string;
  end_time?: string;
  booking_code?: string;
  classes?: {
    name: string;
    start_time: string;
    end_time: string;
    instructor?: {
      id: number;
      profiles?: {
        display_name?: string;
        avatar_url?: string;
      };
    };
    clubs?: {
      name: string;
      image_url?: string;
    };
  };
  clubs?: {
    name: string;
    image_url?: string;
  };
}

export interface Membership {
  subscriptionId: any;
  webhookPending: any;
  id: string;
  user_id: string;
  plan_id?: string;
  plan_type: string;
  credits: number;
  credits_used: number;
  has_used_trial?: boolean;
  trial_end_date?: string | null;
  trial_days_remaining?: number | null;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  membership_plans?: {
    price?: number;
  };
  active_bookings?: number;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  stripe_status?: string | null;
  daily_access_gym_slots?: number | null;
  next_cycle_date?: string | null;
  // For backward compatibility with existing components
  subscription_status?: string | null;
  // Database fields for scheduled plan changes
  scheduled_plan_id?: string | null;
  scheduled_plan_title?: string | null;
  scheduled_plan_credits?: number | null;
  scheduled_stripe_price_id?: string | null;
  scheduled_change_date?: string | null;
  stripe_schedule_id?: string | null;
  scheduled_change_confirmed?: boolean | null;
  // Optional field for scheduled plan changes (computed from database fields)
  scheduledChange?: {
    planId: string;
    planTitle: string;
    planCredits: number;
    nextBillingDate?: string | null;
    confirmed?: boolean;
    scheduleId?: string;
    error?: string;
  };
}

export interface MembershipPlan {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: number;
  popular: boolean;
  created_at: string;
  updated_at: string;
  button_text: string;
  credits: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  club_id: string;
  created_at?: string;
  clubs?: Club;
}

export interface Review {
  id: string;
  user_id: string;
  club_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface Visit {
  id: string;
  user_id: string;
  club_id: string;
  visit_date: string;
  credits_used: number;
  created_at: string;
  clubs?: {
    name: string;
    type: string;
    image_url?: string;
  };
}

export interface Class {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  club_id: string;
  instructor_id?: number | null;
  created_at: string;
  updated_at: string;
  booked_spots?: number;
  clubs?: {
    name: string;
    image_url?: string;
  };
  instructor?: {
    id?: number;
    user_id?: string;
    club_name?: string;
    profiles?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
  image_url?: string;
  duration: number;
  intensity: string;
  max_participants: number;
  current_participants?: number;
}

export interface ClassDetailData {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  capacity: number;
  club_id: string;
  instructor_id?: number | null;
  created_at: string;
  updated_at: string;
  clubs?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    type: string;
    image_url?: string;
  };
  instructor?: {
    id?: number;
    user_id?: string;
    club_name?: string;
    profiles?: {
      display_name?: string;
      avatar_url?: string;
    };
  };
}

export interface Instructor {
  id: string;
  user_id?: string;
  club_name?: string;
  classes?: string[];
  created_at?: string;
  profiles?: UserProfile;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  status: string;
  client_secret?: string;
  user_id: string;
  created_at: string;
  membership_plan_id?: string;
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  membership_plan_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid";
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

// ================================================
// SOCIAL FEATURES TYPES
// ================================================

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  // Populated from joins
  friend_profile?: UserProfile;
  user_profile?: UserProfile;
}

export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  type: 'new_class' | 'event' | 'update' | 'promotion' | 'announcement';
  
  // Relations
  club_id?: string;
  class_id?: string;
  author_id?: string;
  
  // Media
  image_url?: string;
  
  // Action configuration
  action_text?: string;
  action_data?: Record<string, any>;
  
  // Targeting and status
  target_audience: 'all' | 'members' | 'instructors' | 'club_members';
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  expires_at?: string;
  
  // Metadata
  priority: number;
  views_count: number;
  
  created_at: string;
  updated_at: string;
  
  // Populated from joins
  club_name?: string;
  club_logo?: string;
  class_name?: string;
  author_name?: string;
}

export interface NewsView {
  id: string;
  news_id: string;
  user_id: string;
  viewed_at: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'workout_completed' | 'class_booked' | 'class_completed' | 'gym_visit' | 'achievement_unlocked' | 'friend_added';
  
  // Relations
  club_id?: string;
  class_id?: string;
  booking_id?: string;
  visit_id?: string;
  
  // Activity data
  activity_data?: Record<string, any>;
  
  // Privacy
  visibility: 'public' | 'friends' | 'private';
  
  created_at: string;
  
  // Populated from joins
  user_profile?: UserProfile;
  club?: Club;
  class?: Class;
}

export interface FriendSuggestion {
  id: string;
  name: string;
  avatar_url?: string;
  mutual_friends: number;
  common_gym?: string;
  is_online: boolean;
  bio?: string;
  friend_count?: number;
  recent_activity?: string;
}

export interface SocialStats {
  friend_count: number;
  pending_requests: number;
  activities_this_week: number;
  streak_days: number;
}

// Stripe Connect types
export interface StripeConnectOnboardingResponse {
  accountId: string;
  url: string;
}

export interface StripeConnectUpdateLinkResponse {
  url: string;
}

export interface StripeConnectStatus {
  connected: boolean;
  accountId?: string;
  payoutsEnabled: boolean;
  kycStatus?: 'verified' | 'pending' | 'needs_input';
  onboardingComplete: boolean;
}
