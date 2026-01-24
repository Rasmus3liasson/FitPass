import { supabase } from '../supabaseClient';

export async function getUserCards(userId: string) {
  const { data, error } = await supabase
    .from('user_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addUserCard({
  userId,
  cardType,
  last4,
  expMonth,
  expYear,
  nameOnCard,
  stripeToken,
  isDefault = false,
}: {
  userId: string;
  cardType: string;
  last4: string;
  expMonth: string;
  expYear: string;
  nameOnCard: string;
  stripeToken?: string;
  isDefault?: boolean;
}) {
  const { data, error } = await supabase
    .from('user_cards')
    .insert({
      user_id: userId,
      card_type: cardType,
      last4,
      exp_month: expMonth,
      exp_year: expYear,
      name_on_card: nameOnCard,
      stripe_token: stripeToken,
      is_default: isDefault,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteUserCard(cardId: string, userId: string) {
  const { error } = await supabase
    .from('user_cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}
