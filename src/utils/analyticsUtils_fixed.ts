// Helper function to calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): { value: number, trend: 'up' | 'down' | 'neutral' } => {
  if (previous === 0) return { value: current > 0 ? 100 : 0, trend: current > 0 ? 'up' : 'neutral' };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(change),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  };
};

// Calculate time periods for comparison
export const getPeriodStart = (period: 'week' | 'month' | 'quarter' | 'year') => {
  const now = new Date();
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case 'quarter':
      return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case 'year':
      return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
};

// Calculate analytics metrics
export const calculateAnalyticsMetrics = (
  visits: any[] = [],
  bookings: any[] = [],
  reviews: any[] = [],
  revenueData: any,
  selectedPeriod: 'week' | 'month' | 'quarter' | 'year'
) => {
  console.log('Analytics Debug - Total visits received:', visits.length);
  console.log('Analytics Debug - Total bookings received:', bookings.length);
  console.log('Analytics Debug - Selected period:', selectedPeriod);

  const now = new Date();
  const periodStart = getPeriodStart(selectedPeriod);
  
  console.log('Analytics Debug - Period start:', periodStart);
  console.log('Analytics Debug - Current date:', now);

  // Fix the previous period calculation
  const previousPeriodStart = new Date(periodStart);
  const periodDuration = now.getTime() - periodStart.getTime();
  previousPeriodStart.setTime(periodStart.getTime() - periodDuration);

  console.log('Analytics Debug - Previous period start:', previousPeriodStart);

  // Calculate current period stats
  const currentVisits = visits.filter(v => new Date(v.created_at) > periodStart);
  const previousVisits = visits.filter(v => {
    const date = new Date(v.created_at);
    return date > previousPeriodStart && date <= periodStart;
  });

  console.log('Analytics Debug - Current visits filtered:', currentVisits.length);
  console.log('Analytics Debug - Previous visits filtered:', previousVisits.length);

  const currentBookings = bookings.filter(b => new Date(b.created_at) > periodStart);
  const previousBookings = bookings.filter(b => {
    const date = new Date(b.created_at);
    return date > previousPeriodStart && date <= periodStart;
  });

  const currentReviews = reviews.filter(r => new Date(r.created_at) > periodStart);

  // Calculate metrics
  const totalVisits = visits.length;
  const uniqueVisitors = new Set(visits.map(v => v.user_id)).size;
  const totalBookings = bookings.length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  
  const estimatedRevenue = revenueData 
    ? (revenueData.visits.length * revenueData.creditsPerVisit * 10) 
    : 0;

  const currentPeriodRevenue = currentVisits.length * (revenueData?.creditsPerVisit || 1) * 10;
  const previousPeriodRevenue = previousVisits.length * (revenueData?.creditsPerVisit || 1) * 10;

  // Calculate trends
  const visitsTrend = calculatePercentageChange(currentVisits.length, previousVisits.length);
  const bookingsTrend = calculatePercentageChange(currentBookings.length, previousBookings.length);
  const revenueTrend = calculatePercentageChange(currentPeriodRevenue, previousPeriodRevenue);

  // Top performing days
  const visitsByDay: { [day: string]: number } = {};
  currentVisits.forEach(v => {
    const day = new Date(v.created_at).toLocaleDateString('en-US', { weekday: 'long' });
    visitsByDay[day] = (visitsByDay[day] || 0) + 1;
  });

  const topDay = Object.entries(visitsByDay).sort((a, b) => b[1] - a[1])[0];

  console.log('Analytics Debug - Final metrics:', {
    totalVisits,
    currentVisits: currentVisits.length,
    uniqueVisitors,
    totalBookings,
    currentBookings: currentBookings.length
  });

  return {
    currentVisits,
    previousVisits,
    currentBookings,
    previousBookings,
    currentReviews,
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
    visitsByDay
  };
};

// Generate monthly breakdown data
export const generateMonthlyBreakdown = (visits: any[]) => {
  const monthlyData: { [month: string]: number } = {};
  visits.forEach(v => {
    const date = new Date(v.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
  });

  return Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6);
};
