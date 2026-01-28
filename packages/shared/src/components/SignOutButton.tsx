import colors from '@fitpass/shared/constants/custom-colors';
import { SignOut } from 'phosphor-react-native';
import { useAuth } from '../hooks/useAuth';
import { useGlobalFeedback } from '../hooks/useGlobalFeedback';
import { Button } from './Button';

const SignOutButton = () => {
  const { user, signOut } = useAuth();
  const { showInfo } = useGlobalFeedback();

  const handleSignOut = () => {
    if (user) {
      // Note: Consider implementing CustomAlert for confirmation dialogs
      // For now, directly sign out
      signOut();
    }
  };

  return (
    <Button
      title="Logga ut"
      onPress={handleSignOut}
      icon={<SignOut size={18} color={colors.accentRed} />}
      style="border-red-500/30 bg-red-500/10 mt-4"
    />
  );
};

export default SignOutButton;
