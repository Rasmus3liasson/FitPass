import colors from '@shared/constants/custom-colors';
import { StyleSheet, Text, View } from 'react-native';

interface BarChartProps {
  data: { label: string; value: number }[];
  width: number;
  height: number;
}

export function BarChart({ data, width, height }: BarChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));
  const barWidth = (width - 40) / data.length - 12; // Subtract padding and spacing

  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.chart}>
        {data.map((item, index) => {
          const barHeight =
            item.value === 0 ? 0 : Math.max((item.value / maxValue) * (height - 60), 20); // Minimum bar height

          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barLabelContainer}>
                <Text style={styles.barValueLabel}>{item.value}</Text>
              </View>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    width: barWidth,
                    backgroundColor:
                      item.value > 0
                        ? require('@/src/constants/custom-colors').primary
                        : require('@/src/constants/custom-colors').accentGray,
                  },
                ]}
              />
              <Text style={styles.barLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barContainer: {
    alignItems: 'center',
  },
  barLabelContainer: {
    marginBottom: 4,
  },
  barValueLabel: {
    fontSize: 12,
    color: 'colors.textSecondary',
  },
  bar: {
    borderRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: 'colors.textSecondary',
  },
});
