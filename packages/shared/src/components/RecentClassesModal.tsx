import colors from '@fitpass/shared/constants/custom-colors';
import { Calendar, Clock } from 'phosphor-react-native';
import { useState } from 'react';
import { HistoryClassCard, HistoryClassData } from './HistoryClassCard';
import { JourneyStatsCard } from './JourneyStatsCard';
import { ViewAllModal } from './ViewAllModal';

// Re-export for backwards compatibility
export type RecentClass = HistoryClassData;

interface RecentClassesModalProps {
  visible: boolean;
  onClose: () => void;
  classes: HistoryClassData[];
  title?: string;
  showJourneyStats?: boolean;
}

export function RecentClassesModal({
  visible,
  onClose,
  classes,
  title = 'Recent Classes',
  showJourneyStats = true,
}: RecentClassesModalProps) {
  const [sortBy, setSortBy] = useState<'Nyast' | 'Äldsta' | 'Kommande'>('Nyast');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const getSortedAndFilteredClasses = () => {
    let filtered = classes;

    if (statusFilter) {
      filtered = classes.filter((cls) => cls.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'Nyast':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'Äldsta':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'Kommande':
          const aUpcoming = new Date(a.date).getTime() > new Date().getTime();
          const bUpcoming = new Date(b.date).getTime() > new Date().getTime();
          if (aUpcoming && !bUpcoming) return -1;
          if (!aUpcoming && bUpcoming) return 1;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        default:
          return 0;
      }
    });
  };

  const sortedClasses = getSortedAndFilteredClasses();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.accentGreen;
      case 'upcoming':
        return colors.accentBlue;
      case 'cancelled':
        return colors.accentRed;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Genomförd';
      case 'upcoming':
        return 'Kommande';
      case 'cancelled':
        return 'Avbruten';
      default:
        return status;
    }
  };

  const renderClass = (classItem: HistoryClassData) => <HistoryClassCard classData={classItem} />;

  const completedCount = classes.filter((c) => c.status === 'completed').length;
  const upcomingCount = classes.filter((c) => c.status === 'upcoming').length;

  // Calculate journey stats
  const totalClasses = classes.length;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentWeekClasses = classes.filter((c) => {
    const classDate = new Date(c.date);
    return classDate >= sevenDaysAgo && classDate <= now && c.status === 'completed';
  }).length;

  // Calculate activity insights
  const completedClasses = classes.filter((c) => c.status === 'completed');

  // Most visited gym
  const gymCounts = completedClasses.reduce(
    (acc, cls) => {
      acc[cls.facility] = (acc[cls.facility] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topGym = Object.entries(gymCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const totalGyms = Object.keys(gymCounts).length;

  // Favorite class type
  const classCounts = completedClasses.reduce(
    (acc, cls) => {
      acc[cls.name] = (acc[cls.name] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const totalClassTypes = Object.keys(classCounts).length;

  return (
    <ViewAllModal
      visible={visible}
      onClose={onClose}
      title={title}
      stats={{
        mainValue: `${completedCount} genomförda`,
        mainLabel: `${upcomingCount} kommande`,
        subValue: '',
        subLabel: '',
      }}
      filterOptions={[
        { key: 'nyaste', label: 'Nyast först', icon: Calendar },
        { key: 'äldsta', label: 'Äldsta först', icon: Calendar },
        { key: 'kommande', label: 'Kommande först', icon: Clock },
      ]}
      selectedFilter={sortBy}
      onFilterChange={(filter) => setSortBy(filter as any)}
      secondaryFilters={{
        options: [
          { key: null, label: 'Alla' },
          { key: 'upcoming', label: 'Kommande' },
          { key: 'completed', label: 'Genomförd' },
          { key: 'cancelled', label: 'Avbruten' },
        ],
        selected: statusFilter,
        onSelectionChange: setStatusFilter,
      }}
      data={sortedClasses}
      renderItem={renderClass}
      emptyState={{
        title: 'Inga pass hittades',
        subtitle: 'Du har inte bokat några pass än',
      }}
      footerContent={
        showJourneyStats ? (
          <JourneyStatsCard
            variant="full"
            data={{
              completedCount,
              totalCount: totalClasses,
              recentWeekCount: recentWeekClasses,
              activityInsights: {
                topGym,
                topClass,
                totalGyms,
                totalClassTypes,
              },
            }}
          />
        ) : undefined
      }
    />
  );
}
