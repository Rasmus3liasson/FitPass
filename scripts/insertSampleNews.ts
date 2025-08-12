import { supabase } from '../src/lib/integrations/supabase/supabaseClient';

const CLUB_ID = "b2c3d4e5-f6e7-8901-2345-67890abcdef1";

const sampleNewsData = [
  {
    title: "New HIIT Classes This Week!",
    description: "Join our high-intensity interval training sessions every Monday and Wednesday at 7 PM. Perfect for burning calories and building strength.",
    content: "We're excited to announce brand new HIIT classes starting this week! These sessions are designed to maximize your workout efficiency with short bursts of high-intensity exercises followed by brief recovery periods. Whether you're a beginner or advanced athlete, our certified instructors will guide you through modifications to suit your fitness level. Come ready to sweat and have fun!",
    type: "new_class",
    club_id: CLUB_ID,
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    action_text: "Book Your Spot",
    action_data: { type: "class_booking", class_type: "HIIT" },
    target_audience: "all",
    status: "published",
    priority: 5,
    views_count: 0,
    published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    title: "Fitness Challenge: 30 Days of Strength",
    description: "Join our community-wide fitness challenge! Track your progress, compete with friends, and win amazing prizes.",
    content: "Are you ready to transform your fitness journey? Our 30 Days of Strength challenge is designed to help you build muscle, increase endurance, and develop healthy habits that last. Participants will receive a personalized workout plan, daily motivation, and access to our exclusive challenge group. Prizes include free personal training sessions, gym merchandise, and a grand prize of a 3-month membership extension!",
    type: "event",
    club_id: CLUB_ID,
    image_url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80",
    action_text: "Join Challenge",
    action_data: { type: "event_signup", event_id: "strength_challenge_2025" },
    target_audience: "members",
    status: "published",
    priority: 8,
    views_count: 0,
    published_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  {
    title: "New Equipment Arrival: State-of-the-Art Cardio Machines",
    description: "We've upgraded our cardio section with the latest treadmills, ellipticals, and rowing machines featuring interactive displays.",
    content: "Get ready for the ultimate cardio experience! We've invested in cutting-edge equipment that will revolutionize your workouts. Our new machines feature: Touch-screen displays with streaming capabilities, Heart rate monitoring technology, Virtual coaching programs, and Scenic route simulations. The new equipment is now available on the second floor. Our staff is available to provide orientations and help you get the most out of these amazing machines.",
    type: "update",
    club_id: CLUB_ID,
    image_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    action_text: "See New Equipment",
    action_data: { type: "facility_tour", section: "cardio" },
    target_audience: "all",
    status: "published",
    priority: 6,
    views_count: 0,
    published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
  },
  {
    title: "Limited Time: 20% Off Personal Training",
    description: "Book personal training sessions this month and save 20%! Work one-on-one with our certified trainers to reach your fitness goals faster.",
    content: "This month only, we're offering an exclusive 20% discount on all personal training packages. Whether you're just starting your fitness journey or looking to break through a plateau, our certified personal trainers are here to help. Each session includes: Personalized workout plans, Nutrition guidance, Form correction and injury prevention, Progress tracking and goal setting. Don't miss this opportunity to invest in yourself and accelerate your results!",
    type: "promotion",
    club_id: CLUB_ID,
    image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
    action_text: "Book Training",
    action_data: { type: "service_booking", service: "personal_training", discount: "SAVE20" },
    target_audience: "all",
    status: "published",
    priority: 7,
    views_count: 0,
    published_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  },
  {
    title: "Yoga Studio Renovation Complete",
    description: "Our newly renovated yoga studio is now open with improved lighting, mirrors, and a sound system for the perfect zen experience.",
    content: "We're thrilled to announce that our yoga studio renovation is complete! The space has been completely transformed to create the perfect environment for your practice. New features include: Natural lighting with blackout capabilities, Premium sound system for guided meditations, Temperature control for hot yoga sessions, Eco-friendly flooring and props, and Expanded space for larger classes. Come experience the difference in our first class back - 'Sunset Flow' tomorrow at 6 PM.",
    type: "announcement",
    club_id: CLUB_ID,
    image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    action_text: "Book Yoga Class",
    action_data: { type: "class_booking", class_type: "yoga" },
    target_audience: "all",
    status: "published",
    priority: 4,
    views_count: 0,
    published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    title: "Weekend Warriors: Saturday Boot Camp",
    description: "Start your weekend strong with our intensive boot camp class. High-energy workouts that will challenge and energize you.",
    content: "Saturdays just got more exciting! Our Weekend Warriors Boot Camp is designed for those who want to maximize their weekend workout. This isn't your average fitness class - it's a full-body challenge that combines strength training, cardio, and functional movements. Perfect for: Building team spirit and motivation, Burning maximum calories in minimum time, Learning new exercise techniques, and Meeting like-minded fitness enthusiasts. Classes run every Saturday at 9 AM. Bring water, a towel, and your determination!",
    type: "new_class",
    club_id: CLUB_ID,
    image_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80",
    action_text: "Join Boot Camp",
    action_data: { type: "class_booking", class_type: "bootcamp", day: "saturday" },
    target_audience: "all",
    status: "published",
    priority: 5,
    views_count: 0,
    published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 1.5 days ago
  }
];

async function insertSampleNews() {
  console.log('🚀 Starting to insert sample news data...');
  
  try {
    // Insert all news items
    const { data, error } = await supabase
      .from('news')
      .insert(sampleNewsData)
      .select();

    if (error) {
      console.error('❌ Error inserting news data:', error);
      return;
    }

    console.log('✅ Successfully inserted sample news data!');
    console.log(`📰 Created ${data.length} news items for club: ${CLUB_ID}`);
    
    // Display created items
    data.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} (${item.type})`);
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Execute the script
insertSampleNews();
