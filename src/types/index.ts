export interface Club {
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
  pushNotifications?: boolean;
  emailUpdates?: boolean;
  classReminders?: boolean;
  marketingNotifications?: boolean;
  appUpdates?: boolean;
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
