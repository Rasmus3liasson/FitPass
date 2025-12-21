// Helper function to calculate percentage change
export const calculatePercentageChange = (
  current: number,
  previous: number
): { value: number; trend: "up" | "down" | "neutral" } => {
  if (previous === 0)
    return {
      value: current > 0 ? 100 : 0,
      trend: current > 0 ? "up" : "neutral",
    };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    trend: change > 0 ? "up" : change < 0 ? "down" : "neutral",
  };
};

// Calculate time periods for comparison
export const getPeriodStart = (
  period: "week" | "month" | "quarter" | "year"
) => {
  const now = new Date();
  switch (period) {
    case "week":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month":
      // Fix: Use setMonth instead of constructor to avoid date overflow issues
      const monthStart = new Date(now);
      monthStart.setMonth(now.getMonth() - 1);
      return monthStart;
    case "quarter":
      const quarterStart = new Date(now);
      quarterStart.setMonth(now.getMonth() - 3);
      return quarterStart;
    case "year":
      const yearStart = new Date(now);
      yearStart.setFullYear(now.getFullYear() - 1);
      return yearStart;
  }
};

// Calculate analytics metrics
export const calculateAnalyticsMetrics = (
  visits: any[] = [],
  bookings: any[] = [],
  reviews: any[] = [],
  revenueData: any,
  selectedPeriod: "week" | "month" | "quarter" | "year",
  clubAvgRating?: number
) => {
  const totalVisits = visits.length;
  const totalBookings = bookings.length;
  const uniqueVisitors = new Set(visits.map((v) => v.user_id)).size;

  const averageRating = clubAvgRating ? clubAvgRating?.toFixed(1) : "0.0";

  const pricePerVisit = revenueData?.pricePerVisit || 20; // Dynamic pricing

  const estimatedRevenue = revenueData
    ? revenueData.visits.length * pricePerVisit
    : 0;

  // Period filtering with proper previous period calculation
  const now = new Date();
  const periodStart = getPeriodStart(selectedPeriod);

  // Calculate previous period start
  const periodDuration = now.getTime() - periodStart.getTime();
  const previousPeriodStart = new Date(periodStart.getTime() - periodDuration);

  const currentVisits = visits.filter((v) => {
    const visitDate = new Date(v.created_at);
    const isInCurrentPeriod = visitDate >= periodStart;
    return isInCurrentPeriod;
  });

  const previousVisits = visits.filter((v) => {
    const visitDate = new Date(v.created_at);
    return visitDate > previousPeriodStart && visitDate <= periodStart;
  });

  const currentBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.created_at);
    return bookingDate > periodStart;
  });

  const previousBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.created_at);
    return bookingDate > previousPeriodStart && bookingDate <= periodStart;
  });

  const currentPeriodRevenue =
    currentVisits.length * pricePerVisit;
  const previousPeriodRevenue =
    previousVisits.length * pricePerVisit;

  // Calculate proper trends with percentage changes
  const visitsTrend = calculatePercentageChange(
    currentVisits.length,
    previousVisits.length
  );
  const bookingsTrend = calculatePercentageChange(
    currentBookings.length,
    previousBookings.length
  );
  const revenueTrend = calculatePercentageChange(
    currentPeriodRevenue,
    previousPeriodRevenue
  );

  // Top performing days
  const visitsByDay: { [day: string]: number } = {};
  currentVisits.forEach((v) => {
    const day = new Date(v.created_at).toLocaleDateString("en-US", {
      weekday: "long",
    });
    visitsByDay[day] = (visitsByDay[day] || 0) + 1;
  });
  const topDay = Object.entries(visitsByDay).sort((a, b) => b[1] - a[1])[0];

  // Generate trend data for charts
  const trendData = generateTrendData(visits, selectedPeriod, revenueData);
  const dailyVisitData = generateDailyVisitData(visits, selectedPeriod);
  
  // Extract simple arrays for mini charts
  const visitsTrendArray = trendData.map(d => d.visits);
  const revenueTrendArray = trendData.map(d => d.revenue);

  const result = {
    currentVisits,
    previousVisits,
    currentBookings,
    previousBookings,
    currentReviews: reviews,
    totalVisits,
    uniqueVisitors,
    totalBookings,
    averageRating,
    estimatedRevenue,
    currentPeriodRevenue,
    previousPeriodRevenue,
    visitsTrend,
    bookingsTrend,
    revenueTrend,
    topDay,
    visitsByDay,
    trendData,
    dailyVisitData,
    visitsTrendArray,
    revenueTrendArray,
  };

  return result;
};

// Generate trend data for charts (last 7 periods)
export const generateTrendData = (
  visits: any[],
  period: "week" | "month" | "quarter" | "year",
  revenueData?: any
) => {
  const periods = 7; // Show last 7 periods
  const trendData: { date: string; visits: number; bookings: number; revenue: number }[] = [];
  
  const now = new Date();
  
  for (let i = periods - 1; i >= 0; i--) {
    let periodStart: Date;
    let periodEnd: Date;
    let label: string;
    
    switch (period) {
      case "week":
        periodEnd = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
        periodStart = new Date(periodEnd.getTime() - (7 * 24 * 60 * 60 * 1000));
        label = periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        break;
      case "month":
        periodEnd = new Date(now);
        periodEnd.setMonth(now.getMonth() - i);
        periodStart = new Date(periodEnd);
        periodStart.setMonth(periodEnd.getMonth() - 1);
        label = periodEnd.toLocaleDateString('en-US', { month: 'short' });
        break;
      case "quarter":
        periodEnd = new Date(now);
        periodEnd.setMonth(now.getMonth() - (i * 3));
        periodStart = new Date(periodEnd);
        periodStart.setMonth(periodEnd.getMonth() - 3);
        label = `Q${Math.ceil((periodEnd.getMonth() + 1) / 3)}`;
        break;
      case "year":
        periodEnd = new Date(now);
        periodEnd.setFullYear(now.getFullYear() - i);
        periodStart = new Date(periodEnd);
        periodStart.setFullYear(periodEnd.getFullYear() - 1);
        label = periodEnd.getFullYear().toString();
        break;
    }
    
    const periodVisits = visits.filter(v => {
      const visitDate = new Date(v.created_at);
      return visitDate >= periodStart && visitDate < periodEnd;
    });
    
    trendData.push({
      date: label,
      visits: periodVisits.length,
      bookings: 0, // Can be extended later
      revenue: periodVisits.length * (revenueData?.pricePerVisit || 20), // Use dynamic pricing
    });
  }
  
  return trendData;
};

// Generate daily visit data for current period
export const generateDailyVisitData = (
  visits: any[],
  period: "week" | "month" | "quarter" | "year"
) => {
  const now = new Date();
  const periodStart = getPeriodStart(period);
  
  const currentVisits = visits.filter(v => {
    const visitDate = new Date(v.created_at);
    return visitDate >= periodStart && visitDate <= now;
  });
  
  const dailyData: { [date: string]: number } = {};
  
  // Initialize all days in period with 0
  const daysDiff = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
  for (let i = 0; i <= daysDiff; i++) {
    const date = new Date(periodStart.getTime() + (i * 24 * 60 * 60 * 1000));
    const dateKey = date.toISOString().split('T')[0];
    dailyData[dateKey] = 0;
  }
  
  // Add actual visit data
  currentVisits.forEach(visit => {
    const visitDate = new Date(visit.created_at);
    const dateKey = visitDate.toISOString().split('T')[0];
    if (dailyData.hasOwnProperty(dateKey)) {
      dailyData[dateKey]++;
    }
  });
  
  return Object.entries(dailyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, visits]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: visits,
    }));
};

// Generate monthly breakdown data
export const generateMonthlyBreakdown = (visits: any[]) => {
  const monthlyData: { [month: string]: number } = {};
  visits.forEach((v) => {
    const date = new Date(v.created_at);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);
};
