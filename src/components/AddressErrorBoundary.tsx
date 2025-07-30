import { AddressInfo } from '@/src/services/googlePlacesService';
import React from 'react';
import { Text, TextInput, View } from 'react-native';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AddressErrorBoundaryProps {
  children: React.ReactNode;
  onAddressSelect: (addressInfo: AddressInfo) => void;
  placeholder?: string;
  currentAddress?: string;
  error?: string;
  label?: string;
}

export class AddressErrorBoundary extends React.Component<
  AddressErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: AddressErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AddressInput Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <View className="mb-6">
          <Text className="text-white mb-2">{this.props.label || 'Address'}</Text>
          <View className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-3">
            <Text className="text-red-400 text-sm">
              🚫 Address autocomplete failed. Using basic input.
            </Text>
          </View>
          <TextInput
            className={`bg-gray-800 rounded-lg px-4 py-3 text-white border ${
              this.props.error ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder={this.props.placeholder || 'Enter your address'}
            placeholderTextColor="#9CA3AF"
            defaultValue={this.props.currentAddress || ''}
            onBlur={(e) => {
              const address = e.nativeEvent.text.trim();
              if (address) {
                const addressInfo: AddressInfo = {
                  formatted_address: address,
                  latitude: 0,
                  longitude: 0,
                };
                this.props.onAddressSelect(addressInfo);
              }
            }}
            autoCorrect={false}
            autoComplete="street-address"
          />
          {this.props.error && (
            <Text className="text-red-400 text-sm mt-1">{this.props.error}</Text>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}
