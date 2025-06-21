import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import React from 'react';
import { BaseToast, ErrorToast } from 'react-native-toast-message';
import colors from '../constants/custom-colors';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: colors.primary, backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      renderLeadingIcon={() => <CheckCircle color={colors.primary} style={{ marginLeft: 15 }} />}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#F44336', backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      renderLeadingIcon={() => <AlertCircle color={'#F44336'} style={{ marginLeft: 15 }} />}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
      }}
    />
  ),
  info: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#2196F3', backgroundColor: colors.surface }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      renderLeadingIcon={() => <Info color={'#2196F3'} style={{ marginLeft: 15 }} />}
      text1Style={{
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
      }}
      text2Style={{
        fontSize: 14,
        color: colors.textSecondary,
      }}
    />
  ),
};

export default toastConfig; 