import { ROUTES } from '@shared/config/constants';
import { useAuth } from '@shared/hooks/useAuth';
import { Redirect } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function IndexRedirect() {
  const { user, userProfile, loading } = useAuth();
  const hasRedirected = useRef(false);

  // Reset redirect flag when user state changes
  useEffect(() => {
    hasRedirected.current = false;
  }, [user?.id]);

  // Wait for both user and userProfile to be loaded
  if (loading || (user && !userProfile)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Prevent multiple redirects
  if (hasRedirected.current) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  hasRedirected.current = true;

  if (!user) {
    return <Redirect href={ROUTES.LOGIN as any} />;
  }
  if (userProfile?.role === 'club') {
    return <Redirect href={ROUTES.CLUB_HOME as any} />;
  }
  return <Redirect href={ROUTES.USER_HOME as any} />;
}
