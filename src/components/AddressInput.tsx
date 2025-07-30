import { AddressInfo } from '@/src/services/googlePlacesService';
import React from 'react';
import { CustomAddressInput } from './CustomAddressInput';

interface AddressInputProps {
  label?: string;
  placeholder?: string;
  onAddressSelect: (addressInfo: AddressInfo) => void;
  currentAddress?: string;
  error?: string;
}

export const AddressInput: React.FC<AddressInputProps> = (props) => {
  return <CustomAddressInput {...props} />;
};
