import colors from "../../constants/custom-colors";
import { Platform, Text, TextInput, View } from "react-native";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  editable?: boolean;
}

export const PhoneInput = ({
  value,
  onChangeText,
  placeholder = "Phone number",
  error,
  editable = true,
}: PhoneInputProps) => {
  const MAX_LENGTH = 9;

  const formatSwedishPhone = (text: string) => {
    let cleaned = text.replace(/\D/g, "");
    if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
    cleaned = cleaned.substring(0, MAX_LENGTH);

    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5)
      return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
    if (cleaned.length <= 7)
      return `${cleaned.substring(0, 2)} ${cleaned.substring(
        2,
        5
      )} ${cleaned.substring(5)}`;
    return `${cleaned.substring(0, 2)} ${cleaned.substring(
      2,
      5
    )} ${cleaned.substring(5, 7)} ${cleaned.substring(7)}`;
  };

  const handleTextChange = (text: string) => {
    const formatted = formatSwedishPhone(text);
    onChangeText(formatted);
  };

  return (
    <View>
      <View
        className={`flex-row bg-surface rounded-xl border ${
          error ? "border-accentRed" : "border-accentGray"
        }`}
      >
        {/* Sweden flag and +46 prefix */}
        <View className="flex-row items-center px-4 py-4 border-r border-s-accentGray">
          <Text className="text-textPrimary text-lg mr-2">🇸🇪</Text>
          <Text className="text-textPrimary text-lg">+46</Text>
        </View>

        <TextInput
          className="flex-1 px-4 text-textPrimary text-lg"
          style={{
            paddingVertical: 16,
            textAlignVertical: "center",
            ...Platform.select({
              ios: { height: 56 },
            }),
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.borderGray}
          value={value}
          onChangeText={handleTextChange}
          keyboardType="phone-pad"
          editable={editable}
        />
      </View>

      {error ? <Text className="text-accentRed mt-1">{error}</Text> : null}
    </View>
  );
};
