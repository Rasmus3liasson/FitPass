import React from 'react';
import { View } from 'react-native';

interface DataGuardProps {
  children: React.ReactNode;
  /**
   * Array of loading states to check. If any is true, children won't render
   */
  isLoading?: boolean | boolean[];
  /**
   * Array of data dependencies. If any is null/undefined, children won't render
   */
  data?: any | any[];
  /**
   * Optional custom fallback. If not provided, renders transparent view
   */
  fallback?: React.ReactNode;
  /**
   * Minimum time in ms to wait before rendering (prevents flashing)
   */
  minWaitTime?: number;
}

/**
 * DataGuard ensures data is loaded before rendering children.
 * Prevents loading spinners and creates a native, smooth experience.
 *
 * Usage:
 * <DataGuard isLoading={[isLoading1, isLoading2]} data={[data1, data2]}>
 *   <YourScreen />
 * </DataGuard>
 */
export const DataGuard: React.FC<DataGuardProps> = ({
  children,
  isLoading,
  data,
  fallback,
  minWaitTime = 0,
}) => {
  const [minWaitComplete, setMinWaitComplete] = React.useState(minWaitTime === 0);
  const startTimeRef = React.useRef(Date.now());

  React.useEffect(() => {
    if (minWaitTime > 0 && !minWaitComplete) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minWaitTime - elapsed);

      const timer = setTimeout(() => {
        setMinWaitComplete(true);
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [minWaitTime, minWaitComplete]);

  // Check loading states
  const isLoadingArray = Array.isArray(isLoading) ? isLoading : [isLoading];
  const isAnyLoading = isLoadingArray.some((loading) => loading === true);

  // Check data dependencies
  const dataArray = Array.isArray(data) ? data : [data];
  const isDataReady =
    data === undefined || dataArray.every((item) => item !== null && item !== undefined);

  // Don't render until all conditions are met
  const shouldRender = !isAnyLoading && isDataReady && minWaitComplete;

  if (!shouldRender) {
    // Return fallback or transparent view (prevents layout shift)
    return fallback ? <>{fallback}</> : <View style={{ flex: 1 }} />;
  }

  return <>{children}</>;
};
