import { Club } from '../types';

export function mapClubToFacilityCardProps(
  club: Club,
  onPress: () => void,
  layout: 'grid' | 'list' = 'grid',
  isDailyAccessSelected?: boolean,
  showDailyAccessIndicator?: boolean,
  onAddToDailyAccess?: () => void
) {
  const avatarImage = club.club_images?.find((img) => img.type === 'avatar');
  const imageUri =
    avatarImage?.url || club.avatar_url || club.image_url || 'https://via.placeholder.com/150';
  return {
    name: club.name,
    type: club.type,
    image: imageUri,
    open_hours: club.open_hours,
    rating: club.avg_rating || 0,
    distance:
      club.distance !== undefined && club.distance !== null && club.distance <= 1000
        ? `${club.distance.toFixed(1)} km`
        : undefined,
    credits: club.credits,
    onPress,
    layout,
    isDailyAccessSelected,
    showDailyAccessIndicator,
    onAddToDailyAccess,
  };
}
