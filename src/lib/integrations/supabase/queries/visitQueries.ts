import { Visit } from "@/types";
import { supabase } from "../supabaseClient";

// Get all visits for a user
export async function getUserVisits(userId: string) {
  const { data, error } = await supabase
    .from("visits")
    .select(
      `
      *,
      clubs:club_id (name, type, image_url)
    `
    )
    .eq("user_id", userId)
    .order("visit_date", { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get visit chart data
export async function getVisitsChartData(userId: string) {
  // Get visits from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from("visits")
    .select("visit_date, club_id, clubs:club_id(name, type)")
    .eq("user_id", userId)
    .gte("visit_date", thirtyDaysAgo.toISOString())
    .order("visit_date", { ascending: true });

  if (error) throw error;

  // Process the data to count visits by day and type
  const visitsByDate = data.reduce(
    (acc: Record<string, Record<string, number>>, visit) => {
      const dateKey = new Date(visit.visit_date).toISOString().split("T")[0];
      // Fix: Handle clubs properly with type assertion
      const clubType =
        visit.clubs && typeof visit.clubs === "object" && "type" in visit.clubs
          ? String(visit.clubs.type)
          : "Unknown";

      if (!acc[dateKey]) {
        acc[dateKey] = {};
      }

      if (!acc[dateKey][clubType]) {
        acc[dateKey][clubType] = 0;
      }

      acc[dateKey][clubType]++;
      return acc;
    },
    {}
  );

  // Convert to chart data format
  /* const chartData = Object.entries(visitsByDate).map(([date, types]) => {
    const result: Record<string, string | number> = { date };

    Object.entries(types).forEach(([type, count]) => {
      result[type] = count;
    });

    return result;
  });

  return chartData; */
}

// Get recent visits for dashboard
export async function getRecentVisits(
  userId: string,
  limit = 5
): Promise<Visit[]> {
  const { data, error } = await supabase
    .from("visits")
    .select(
      `
      *,
      clubs:club_id (name, type, image_url)
    `
    )
    .eq("user_id", userId)
    .order("visit_date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Visit[];
}

// Generate QR code for visit
export async function getVisitQRCode(visitId: string): Promise<string> {
  const { data, error } = await supabase
    .from("visits")
    .select("*, clubs:club_id(name)")
    .eq("id", visitId)
    .single();

  if (error) throw error;

  // Generate QR code with visit information
  const visitInfo = {
    id: visitId,
    club_name:
      data.clubs && typeof data.clubs === "object" && "name" in data.clubs
        ? String(data.clubs.name)
        : "Unknown Club",
    visit_date: data.visit_date,
    timestamp: new Date().getTime(),
    valid_until: new Date().getTime() + 24 * 60 * 60 * 1000, // 24 hours
  };

  // Use QR Server API to generate the QR code
  const qrData = encodeURIComponent(JSON.stringify(visitInfo));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
}
