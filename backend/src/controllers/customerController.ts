import { Request, Response } from 'express';
import { supabase } from '../services/database';
import { stripeService } from '../services/stripe';
import {
    CreateCustomerRequest
} from '../types/api';
import {
    handleControllerError,
    sendErrorResponse,
    sendSuccessResponse
} from '../utils/response';

export class CustomerController {
  
  async createCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { email, name, userId }: CreateCustomerRequest = req.body;

      const customerId = await stripeService.createOrGetCustomer(email, name, userId);

      sendSuccessResponse(res, { customerId }, 'Customer created successfully');
    } catch (error: any) {
      handleControllerError(res, error, 'Create customer');
    }
  }

  async getCustomerId(req: Request, res: Response): Promise<void> {
    try {
      const { userId, email, name } = req.body;

      // First check if user already has a stripe_customer_id in membership
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("stripe_customer_id, user_id")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("🔍 Memberships table check:", { data: membership, error: membershipError });

      if (membershipError && membershipError.code !== "PGRST116") {
        console.error("❌ Error fetching membership:", membershipError);
        sendErrorResponse(res, "Database error", undefined, 500);
        return;
      }

      if (membership?.stripe_customer_id) {
        console.log("✅ Found existing customer ID:", membership.stripe_customer_id);
        sendSuccessResponse(res, { customerId: membership.stripe_customer_id });
        return;
      }

      // If no customer ID exists and no email/name provided, we can't create customer
      if (!email) {
        sendErrorResponse(res, "Email is required to create customer", undefined, 400);
        return;
      }

      // Get user profile for additional data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, display_name")
        .eq("id", userId)
        .single();

      // Create Stripe customer
      const fullName =
        name ||
        profile?.display_name ||
        `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
        email;

      const customerId = await stripeService.createOrGetCustomer(email, fullName, userId);

      console.log("✅ Created new customer ID:", customerId);
      sendSuccessResponse(res, { customerId });
    } catch (error: any) {
      handleControllerError(res, error, 'Get customer ID');
    }
  }

  async getUserCustomerId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      console.log("🔍 Getting Stripe customer ID for user:", userId);

      // Check if user already has a Stripe customer ID in profiles table first
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .maybeSingle();

      console.log("🔍 Profiles table check:", { data: existingProfile, error: profileError });

      if (existingProfile?.stripe_customer_id) {
        console.log("✅ Found existing customer ID in profiles table:", existingProfile.stripe_customer_id);
        sendSuccessResponse(res, { customerId: existingProfile.stripe_customer_id });
        return;
      }

      // Also check memberships table for customer ID
      const { data: existingMembership, error: membershipError } = await supabase
        .from("memberships")
        .select("stripe_customer_id")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("🔍 Memberships table check:", { data: existingMembership, error: membershipError });

      if (existingMembership?.stripe_customer_id) {
        console.log("✅ Found existing customer ID in memberships table:", existingMembership.stripe_customer_id);
        sendSuccessResponse(res, { customerId: existingMembership.stripe_customer_id });
      } else {
        console.log("❌ No customer ID found for user:", userId);
        sendSuccessResponse(res, { customerId: null });
      }
    } catch (error: any) {
      handleControllerError(res, error, 'Get user customer ID');
    }
  }
}

export const customerController = new CustomerController();
