import colors from '@shared/constants/custom-colors';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

interface ProgressCircleProps {
  percentage: number;
  radius: number;
  strokeWidth: number;
  color: string;
  textColor: string;
}

export function ProgressCircle({
  percentage,
  radius,
  strokeWidth,
  color,
  textColor,
}: ProgressCircleProps) {
  // Calculate values needed for the circle
  const diameter = radius * 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.container}>
      <Svg width={diameter} height={diameter} viewBox={`0 0 ${diameter} ${diameter}`}>
        {/* Background Circle */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          stroke={colors.accentGray}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress Circle */}
        <Circle
          cx={radius}
          cy={radius}
          r={radius - strokeWidth / 2}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${radius}, ${radius})`}
        />
      </Svg>
      
      <View style={[styles.textContainer, { width: diameter, height: diameter }]}>
        <Text style={[styles.percentageText, { color: textColor }]}>{percentage}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});