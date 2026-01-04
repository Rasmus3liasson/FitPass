import colors from "@shared/constants/custom-colors";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { ActionType, ActionTypeOptions } from "./constants";

interface ActionTypeSelectorProps {
  actionType: ActionType;
  onActionTypeChange: (type: ActionType) => void;
  actionText: string;
  onActionTextChange: (text: string) => void;
  actionValue: string;
  onActionValueChange: (value: string) => void;
  contactPhone?: string;
  onContactPhoneChange?: (phone: string) => void;
  contactEmail?: string;
  onContactEmailChange?: (email: string) => void;
}

export function ActionTypeSelector({
  actionType,
  onActionTypeChange,
  actionText,
  onActionTextChange,
  actionValue,
  onActionValueChange,
  contactPhone,
  onContactPhoneChange,
  contactEmail,
  onContactEmailChange,
}: ActionTypeSelectorProps) {
  return (
    <View>
      <View className="space-y-2 mb-4">
        {ActionTypeOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            onPress={() => onActionTypeChange(option.key)}
            className={`p-4 rounded-xl ${
              actionType === option.key ? "bg-primary/20" : "bg-background"
            }`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center mb-1">
              <View
                className={`w-5 h-5 rounded-full mr-3 items-center justify-center ${
                  actionType === option.key
                    ? "bg-primary"
                    : "bg-surface border border-borderGray"
                }`}
              >
                {actionType === option.key && (
                  <View className="w-2.5 h-2.5 rounded-full bg-textPrimary" />
                )}
              </View>
              <Text className="text-textPrimary font-medium">
                {option.label}
              </Text>
            </View>
            <Text className="text-textSecondary text-sm ml-8">
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {actionType !== "none" && (
        <View className="space-y-3">
          <View>
            <Text className="text-textSecondary text-sm mb-2">
              Knapptext
            </Text>
            <View className="bg-background rounded-xl p-3">
              <TextInput
                className="text-textPrimary text-base"
                placeholder="T.ex. 'Boka nu', 'Läs mer'..."
                placeholderTextColor={colors.textSecondary}
                value={actionText}
                onChangeText={onActionTextChange}
              />
            </View>
          </View>

          {actionType === "external_link" && (
            <View>
              <Text className="text-textSecondary text-sm mb-2">
                Webbadress (URL)
              </Text>
              <View className="bg-background rounded-xl p-3">
                <TextInput
                  className="text-textPrimary text-base"
                  placeholder="https://..."
                  placeholderTextColor={colors.textSecondary}
                  value={actionValue}
                  onChangeText={onActionValueChange}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {actionType === "promo_code" && (
            <View>
              <Text className="text-textSecondary text-sm mb-2">
                Rabattkod
              </Text>
              <View className="bg-background rounded-xl p-3">
                <TextInput
                  className="text-textPrimary text-base"
                  placeholder="RABATT2024"
                  placeholderTextColor={colors.textSecondary}
                  value={actionValue}
                  onChangeText={onActionValueChange}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          )}

          {actionType === "contact_club" && onContactPhoneChange && onContactEmailChange && (
            <>
              <View>
                <Text className="text-textSecondary text-sm mb-2">
                  Telefonnummer
                </Text>
                <View className="bg-background rounded-xl p-3">
                  <TextInput
                    className="text-textPrimary text-base"
                    placeholder="+46 70 123 45 67"
                    placeholderTextColor={colors.textSecondary}
                    value={contactPhone}
                    onChangeText={onContactPhoneChange}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
              <View>
                <Text className="text-textSecondary text-sm mb-2">
                  E-post
                </Text>
                <View className="bg-background rounded-xl p-3">
                  <TextInput
                    className="text-textPrimary text-base"
                    placeholder="kontakt@klubb.se"
                    placeholderTextColor={colors.textSecondary}
                    value={contactEmail}
                    onChangeText={onContactEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}
