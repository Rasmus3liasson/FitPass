import React, { useState } from "react";
import {
    TextInput as RNTextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons"; // Make sure to install this package

type CustomInputProps = TextInputProps & {
  secure?: boolean;
  phone?: boolean;
};

export default function TextInputCustom({
  secure = false,
  phone = false,
  ...props
}: CustomInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secure;

  return (
    <View className="relative mb-4">
      <RNTextInput
        {...props}
        secureTextEntry={isPassword && !showPassword}
        keyboardType={phone ? "phone-pad" : props.keyboardType}
        placeholderTextColor="#777"
        className="bg-surface text-textPrimary rounded-lg p-3 pr-10"
      />

      {isPassword && (
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <Icon
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="#A0A0A0"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}
