import { CreditCard, Settings } from "lucide-react-native";
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface BusinessInformationSectionProps {
  orgNumber: string;
  credits: string;
  onOrgNumberChange: (value: string) => void;
  onCreditsChange: (value: string) => void;
}

const CreditsEnum = [1, 2, 3];

export const BusinessInformationSection: React.FC<BusinessInformationSectionProps> = ({
  orgNumber,
  credits,
  onOrgNumberChange,
  onCreditsChange,
}) => {
  return (
    <View className="bg-surface rounded-2xl p-4 mb-4">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Settings size={16} color="#6366F1" />
        </View>
        <Text className="text-white text-lg font-semibold">Business Details</Text>
      </View>

      {/* Organization Number */}
      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Organization Number</Text>
        <TextInput
          className="bg-background rounded-xl px-4 py-3 text-white border border-gray-600"
          placeholder="123456-7890"
          placeholderTextColor="#9CA3AF"
          value={orgNumber}
          onChangeText={(text) => {
            // Remove all non-digits
            const digits = text.replace(/[^0-9]/g, '');
            
            // Format as XXXXXX-XXXX (Swedish org number format)
            let formatted = digits;
            if (digits.length > 6) {
              formatted = digits.slice(0, 6) + '-' + digits.slice(6, 10);
            }
            
            onOrgNumberChange(formatted);
          }}
          keyboardType="number-pad"
          maxLength={11}
        />
      </View>

      {/* Credits */}
      <View>
        <Text className="text-white mb-3 font-medium">Credits Required per Visit</Text>
        <View className="flex-row space-x-3">
          {CreditsEnum.map((val) => (
            <TouchableOpacity
              key={val}
              className={`flex-1 py-4 rounded-xl border-2 ${
                credits == String(val) 
                  ? "bg-primary border-primary" 
                  : "bg-background border-gray-600"
              }`}
              onPress={() => onCreditsChange(String(val))}
            >
              <View className="items-center">
                <CreditCard 
                  size={20} 
                  color={credits == String(val) ? "white" : "#6366F1"} 
                />
                <Text className={`text-lg font-semibold mt-1 ${
                  credits == String(val) ? "text-white" : "text-textSecondary"
                }`}>
                  {val}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};
