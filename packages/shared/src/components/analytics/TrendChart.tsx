import colors from '@shared/constants/custom-colors';
import React from 'react';
import { Dimensions, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

interface TrendChartProps {
  data: { date: string; value: number }[];
  title: string;
  color: string;
  height?: number;
  showDots?: boolean;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  title,
  color,
  height = 120,
  showDots = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <View className="bg-surface rounded-xl p-4" style={{ height }}>
        <Text className="text-textSecondary text-sm mb-2">{title}</Text>
        <View className="flex-1 items-center justify-center">
          <Text className="text-textSecondary text-xs">No data available</Text>
        </View>
      </View>
    );
  }

  const chartWidth = screenWidth - 80; // Account for padding
  const chartHeight = height - 60; // Account for title and padding

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const valueRange = maxValue - minValue || 1;

  // Create path points
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
    return { x, y, value: item.value, date: item.date };
  });

  // Create SVG path
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return path + ` L ${point.x} ${point.y}`;
  }, '');

  // Create area fill path
  const areaPath =
    pathData +
    ` L ${points[points.length - 1].x} ${chartHeight}` +
    ` L ${points[0].x} ${chartHeight} Z`;

  return (
    <View className="bg-surface rounded-xl p-4 mb-4" style={{ height }}>
      <Text className="text-textPrimary text-sm font-medium mb-2">{title}</Text>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, index) => (
          <Line
            key={index}
            x1="0"
            y1={chartHeight * ratio}
            x2={chartWidth}
            y2={chartHeight * ratio}
            stroke={colors.accentGray}
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}

        {/* Area fill */}
        <Path d={areaPath} fill={`url(#gradient-${title})`} />

        {/* Main line */}
        <Path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="transparent"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {showDots &&
          points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              stroke="#1A1A1A"
              strokeWidth="2"
            />
          ))}
      </Svg>

      {/* Value labels */}
      <View className="flex-row justify-between mt-2">
        <Text className="text-textSecondary text-xs">{data[0]?.date}</Text>
        <Text className="text-textSecondary text-xs">{data[data.length - 1]?.date}</Text>
      </View>
    </View>
  );
};

// Mini trend indicator for cards
export const MiniTrendChart: React.FC<{
  data: number[];
  color: string;
  width?: number;
  height?: number;
}> = ({ data, color, width = 60, height = 30 }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / valueRange) * height;
    return { x, y };
  });

  const pathData = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    return path + ` L ${point.x} ${point.y}`;
  }, '');

  return (
    <Svg width={width} height={height}>
      <Path
        d={pathData}
        stroke={color}
        strokeWidth="1.5"
        fill="transparent"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <Circle key={index} cx={point.x} cy={point.y} r="1.5" fill={color} />
      ))}
    </Svg>
  );
};
