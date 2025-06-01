import { PaymentIntent } from "@/types";
import { supabase } from "../supabaseClient";

// Function to create a payment intent for Stripe
export async function createPaymentIntent(
  amount: number,
  userId: string,
  membershipPlanId?: string
): Promise<PaymentIntent> {
  const { data, error } = await supabase
    .from("payment_intents")
    .insert({
      amount,
      user_id: userId,
      status: "created",
      membership_plan_id: membershipPlanId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Function to update payment intent status
export async function updatePaymentIntentStatus(
  paymentIntentId: string,
  status: string
): Promise<PaymentIntent> {
  const { data, error } = await supabase
    .from("payment_intents")
    .update({ status })
    .eq("id", paymentIntentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Function to verify if payment was completed
export async function verifyPayment(paymentIntentId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("payment_intents")
    .select("status")
    .eq("id", paymentIntentId)
    .single();

  if (error) throw error;
  return data?.status === "succeeded";
}
