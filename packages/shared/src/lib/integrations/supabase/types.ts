export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      bookings: {
        Row: {
          class_id: string;
          created_at: string;
          credits_used: number;
          id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          credits_used?: number;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          credits_used?: number;
          id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bookings_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'classes';
            referencedColumns: ['id'];
          },
        ];
      };
      classes: {
        Row: {
          booked_spots: number;
          capacity: number;
          club_id: string;
          created_at: string;
          description: string | null;
          end_time: string;
          id: string;
          instructor_id: number | null;
          name: string;
          start_time: string;
          updated_at: string;
        };
        Insert: {
          booked_spots?: number;
          capacity: number;
          club_id: string;
          created_at?: string;
          description?: string | null;
          end_time: string;
          id?: string;
          instructor_id?: number | null;
          name: string;
          start_time: string;
          updated_at?: string;
        };
        Update: {
          booked_spots?: number;
          capacity?: number;
          club_id?: string;
          created_at?: string;
          description?: string | null;
          end_time?: string;
          id?: string;
          instructor_id?: number | null;
          name?: string;
          start_time?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'classes_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'classes_instructor_id_fkey';
            columns: ['instructor_id'];
            isOneToOne: false;
            referencedRelation: 'instructors';
            referencedColumns: ['id'];
          },
        ];
      };
      clubs: {
        Row: {
          address: string | null;
          amenities: string[] | null;
          area: string | null;
          avg_rating: number | null;
          city: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          latitude: number | null;
          longitude: number | null;
          name: string;
          open_hours: Json | null;
          org_number: string | null;
          photos: string[] | null;
          rating: number | null;
          type: string;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          address?: string | null;
          amenities?: string[] | null;
          area?: string | null;
          avg_rating?: number | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          open_hours?: Json | null;
          org_number?: string | null;
          photos?: string[] | null;
          rating?: number | null;
          type: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          address?: string | null;
          amenities?: string[] | null;
          area?: string | null;
          avg_rating?: number | null;
          city?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          open_hours?: Json | null;
          org_number?: string | null;
          photos?: string[] | null;
          rating?: number | null;
          type?: string;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          club_id: string;
          created_at: string | null;
          id: string;
          user_id: string;
        };
        Insert: {
          club_id: string;
          created_at?: string | null;
          id?: string;
          user_id: string;
        };
        Update: {
          club_id?: string;
          created_at?: string | null;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorites_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
        ];
      };
      instructors: {
        Row: {
          classes: string[] | null;
          club_name: string | null;
          created_at: string | null;
          id: number;
          user_id: string | null;
        };
        Insert: {
          classes?: string[] | null;
          club_name?: string | null;
          created_at?: string | null;
          id?: never;
          user_id?: string | null;
        };
        Update: {
          classes?: string[] | null;
          club_name?: string | null;
          created_at?: string | null;
          id?: never;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'instructors_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      membership_plans: {
        Row: {
          button_text: string;
          created_at: string;
          credits: number;
          description: string | null;
          features: string[];
          id: string;
          popular: boolean;
          price: number;
          title: string;
          updated_at: string;
        };
        Insert: {
          button_text: string;
          created_at?: string;
          credits?: number;
          description?: string | null;
          features?: string[];
          id?: string;
          popular?: boolean;
          price: number;
          title: string;
          updated_at?: string;
        };
        Update: {
          button_text?: string;
          created_at?: string;
          credits?: number;
          description?: string | null;
          features?: string[];
          id?: string;
          popular?: boolean;
          price?: number;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          created_at: string;
          credits: number;
          credits_used: number;
          end_date: string | null;
          has_used_trial: boolean | null;
          id: string;
          is_active: boolean | null;
          plan_id: string | null;
          plan_type: string;
          start_date: string;
          trial_days_remaining: number | null;
          trial_end_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          credits: number;
          credits_used?: number;
          end_date?: string | null;
          has_used_trial?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          plan_id?: string | null;
          plan_type: string;
          start_date?: string;
          trial_days_remaining?: number | null;
          trial_end_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          credits?: number;
          credits_used?: number;
          end_date?: string | null;
          has_used_trial?: boolean | null;
          id?: string;
          is_active?: boolean | null;
          plan_id?: string | null;
          plan_type?: string;
          start_date?: string;
          trial_days_remaining?: number | null;
          trial_end_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'memberships_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'membership_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_intents: {
        Row: {
          amount: number;
          client_secret: string | null;
          created_at: string;
          id: string;
          membership_plan_id: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          client_secret?: string | null;
          created_at?: string;
          id?: string;
          membership_plan_id?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          client_secret?: string | null;
          created_at?: string;
          id?: string;
          membership_plan_id?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_intents_membership_plan_id_fkey';
            columns: ['membership_plan_id'];
            isOneToOne: false;
            referencedRelation: 'membership_plans';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          analytics: boolean | null;
          appupdates: boolean | null;
          auto_backup: boolean | null;
          avatar_url: string | null;
          bio: string | null;
          classreminders: boolean | null;
          crash_reporting: boolean | null;
          created_at: string | null;
          credits: number | null;
          dark_mode: boolean | null;
          default_location: string | null;
          display_name: string | null;
          emailupdates: boolean | null;
          enable_location_services: boolean | null;
          first_name: string | null;
          id: string;
          language: string | null;
          last_name: string | null;
          latitude: number | null;
          longitude: number | null;
          marketingnotifications: boolean | null;
          offline_mode: boolean | null;
          phone_number: string | null;
          pushnotifications: boolean | null;
          role: Database['public']['Enums']['user_role'] | null;
          stripe_customer_id: string | null;
        };
        Insert: {
          analytics?: boolean | null;
          appupdates?: boolean | null;
          auto_backup?: boolean | null;
          avatar_url?: string | null;
          bio?: string | null;
          classreminders?: boolean | null;
          crash_reporting?: boolean | null;
          created_at?: string | null;
          credits?: number | null;
          dark_mode?: boolean | null;
          default_location?: string | null;
          display_name?: string | null;
          emailupdates?: boolean | null;
          enable_location_services?: boolean | null;
          first_name?: string | null;
          id: string;
          language?: string | null;
          last_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          marketingnotifications?: boolean | null;
          offline_mode?: boolean | null;
          phone_number?: string | null;
          pushnotifications?: boolean | null;
          role?: Database['public']['Enums']['user_role'] | null;
          stripe_customer_id?: string | null;
        };
        Update: {
          analytics?: boolean | null;
          appupdates?: boolean | null;
          auto_backup?: boolean | null;
          avatar_url?: string | null;
          bio?: string | null;
          classreminders?: boolean | null;
          crash_reporting?: boolean | null;
          created_at?: string | null;
          credits?: number | null;
          dark_mode?: boolean | null;
          default_location?: string | null;
          display_name?: string | null;
          emailupdates?: boolean | null;
          enable_location_services?: boolean | null;
          first_name?: string | null;
          id?: string;
          language?: string | null;
          last_name?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          marketingnotifications?: boolean | null;
          offline_mode?: boolean | null;
          phone_number?: string | null;
          pushnotifications?: boolean | null;
          role?: Database['public']['Enums']['user_role'] | null;
          stripe_customer_id?: string | null;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          club_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          rating: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          club_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          club_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          rating?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      visits: {
        Row: {
          club_id: string;
          created_at: string;
          credits_used: number;
          id: string;
          user_id: string;
          visit_date: string;
        };
        Insert: {
          club_id: string;
          created_at?: string;
          credits_used?: number;
          id?: string;
          user_id: string;
          visit_date?: string;
        };
        Update: {
          club_id?: string;
          created_at?: string;
          credits_used?: number;
          id?: string;
          user_id?: string;
          visit_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'visits_club_id_fkey';
            columns: ['club_id'];
            isOneToOne: false;
            referencedRelation: 'clubs';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      app_role: 'admin' | 'moderator' | 'user' | 'club';
      user_role: 'admin' | 'moderator' | 'member' | 'club';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['admin', 'moderator', 'user', 'club'],
      user_role: ['admin', 'moderator', 'member', 'club'],
    },
  },
} as const;
