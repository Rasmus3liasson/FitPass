import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import { BaseToast } from 'react-native-toast-message';
import colors from '@shared/constants/custom-colors';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: colors.primary,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${colors.primary}20`,
        marginHorizontal: 16,
        paddingVertical: 16,
        shadowColor: colors.primary,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        minHeight: 80,
        height: 'auto',
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        flex: 1,
        alignItems: 'flex-start',
      }}
      renderLeadingIcon={() => (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${colors.primary}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 16,
          marginRight: 12,
        }}>
          <CheckCircle color={colors.primary} size={18} />
        </View>
      )}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
        flexWrap: 'wrap',
        flex: 1,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '400',
        lineHeight: 20,
        flexWrap: 'wrap',
        flex: 1,
      }}
    />
  ),
  error: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: colors.accentRed,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${colors.accentRed}20`,
        marginHorizontal: 16,
        paddingVertical: 16,
        shadowColor: colors.accentRed,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        minHeight: 80,
        height: 'auto',
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        flex: 1,
        alignItems: 'flex-start',
      }}
      renderLeadingIcon={() => (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${colors.accentRed}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 16,
          marginRight: 12,
        }}>
          <AlertCircle color={colors.accentRed} size={18} />
        </View>
      )}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
        flexWrap: 'wrap',
        flex: 1,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '400',
        lineHeight: 20,
        flexWrap: 'wrap',
        flex: 1,
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: colors.accentBlue,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${colors.accentBlue}20`,
        marginHorizontal: 16,
        paddingVertical: 16,
        shadowColor: colors.accentBlue,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        minHeight: 80,
        height: 'auto',
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        flex: 1,
        alignItems: 'flex-start',
      }}
      renderLeadingIcon={() => (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${colors.accentBlue}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 16,
          marginRight: 12,
        }}>
          <Info color={colors.accentBlue} size={18} />
        </View>
      )}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
        flexWrap: 'wrap',
        flex: 1,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '400',
        lineHeight: 20,
        flexWrap: 'wrap',
        flex: 1,
      }}
    />
  ),
  // Custom warning toast
  warning: (props: any) => (
    <BaseToast
      {...props}
      style={{ 
        borderLeftColor: colors.accentYellow,
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: `${colors.accentYellow}20`,
        marginHorizontal: 16,
        paddingVertical: 16,
        shadowColor: colors.accentYellow,
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
        minHeight: 80,
        height: 'auto',
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12,
        flex: 1,
        alignItems: 'flex-start',
      }}
      renderLeadingIcon={() => (
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: `${colors.accentYellow}20`,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 16,
          marginRight: 12,
        }}>
          <AlertCircle color={colors.accentYellow} size={18} />
        </View>
      )}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4,
        flexWrap: 'wrap',
        flex: 1,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '400',
        lineHeight: 20,
        flexWrap: 'wrap',
        flex: 1,
      }}
    />
  ),
};

export default toastConfig; 