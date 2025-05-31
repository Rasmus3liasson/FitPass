import { supabase } from "../browser";

export async function addSampleData(userId: string) {
  try {
    // Get some random clubs to use for sample data
    const { data: clubs, error: clubsError } = await supabase
      .from("clubs")
      .select("id, name")
      .limit(5);

    if (clubsError) throw clubsError;
    if (!clubs || clubs.length === 0) {
      return { success: false, message: "Inga anläggningar hittades" };
    }

    // Create sample visits (one per day for the past 10 days)
    const visitPromises = [];
    for (let i = 0; i < 10; i++) {
      const visitDate = new Date();
      visitDate.setDate(visitDate.getDate() - i);

      const randomClub = clubs[Math.floor(Math.random() * clubs.length)];

      visitPromises.push(
        supabase.from("visits").insert({
          user_id: userId,
          club_id: randomClub.id,
          visit_date: visitDate.toISOString(),
          credits_used: 1,
        }),
      );
    }

    // Create sample favorites (3 random clubs)
    const favoritesPromises = [];
    for (let i = 0; i < 3; i++) {
      if (clubs[i]) {
        favoritesPromises.push(
          supabase.from("favorites").insert({
            user_id: userId,
            club_id: clubs[i].id,
          }),
        );
      }
    }

    // Execute all promises
    await Promise.all([...visitPromises, ...favoritesPromises]);

    return { success: true, message: "Exempeldata har lagts till" };
  } catch (error) {
    console.error("Error adding sample data:", error);
    return { success: false, message: String(error) };
  }
}
