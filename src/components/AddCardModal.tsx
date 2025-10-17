import { BaseModal } from "@/components/BaseModal";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../constants/custom-colors";

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (card: {
    name: string;
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
  }) => Promise<void> | void;
}

function luhnCheck(cardNumber: string) {
  let sum = 0;
  let shouldDouble = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export function AddCardModal({ visible, onClose, onAdd }: AddCardModalProps) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!name.trim()) return "Namn på kort krävs.";
    const cleanNumber = number.replace(/\s+/g, "");
    if (!/^[0-9]{15,16}$/.test(cleanNumber)) return "Kortnummer måste vara 15 eller 16 siffror.";
    if (!luhnCheck(cleanNumber)) return "Ogiltigt kortnummer.";
    if (!/^[0-9]{2}$/.test(expMonth) || +expMonth < 1 || +expMonth > 12) return "Ogiltig utgångsmånad.";
    if (!/^[0-9]{2}$/.test(expYear)) return "Ogiltigt utgångsår.";
    // Expiry not in the past
    const now = new Date();
    const expDate = new Date(2000 + +expYear, +expMonth - 1, 1);
    if (expDate < new Date(now.getFullYear(), now.getMonth(), 1)) return "Kortet har gått ut.";
    if (!/^[0-9]{3,4}$/.test(cvc)) return "Ogiltig CVC.";
    return null;
  };

  const handleAdd = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd({ name, number: number.replace(/\s+/g, ""), expMonth, expYear, cvc });
      setName("");
      setNumber("");
      setExpMonth("");
      setExpYear("");
      setCvc("");
      onClose();
    } catch (e: any) {
      setError(e.message || "Misslyckades med att lägga till kort.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title="Lägg till nytt kort"
      maxHeight={460}
    >
      <View className="space-y-4">
        <View>
          <Text className="text-textPrimary font-semibold mb-2">Namn på kort</Text>
          <TextInput
            className="bg-accentGray border border-accentGray rounded-xl px-4 py-3 text-textPrimary"
            placeholder="Fullständigt namn"
            placeholderTextColor={colors.borderGray}
            value={name}
            onChangeText={setName}
            editable={!isSubmitting}
          />
        </View>
        <View>
          <Text className="text-textPrimary font-semibold mb-2">Kortnummer</Text>
          <TextInput
            className="bg-accentGray border border-accentGray rounded-xl px-4 py-3 text-textPrimary"
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={colors.borderGray}
            value={number}
            onChangeText={setNumber}
            keyboardType="number-pad"
            maxLength={19}
            editable={!isSubmitting}
          />
        </View>
        <View className="flex-row space-x-3">
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold mb-2">Utgångsmånad</Text>
            <TextInput
              className="bg-accentGray border border-accentGray rounded-xl px-4 py-3 text-textPrimary"
              placeholder="MM"
              placeholderTextColor={colors.borderGray}
              value={expMonth}
              onChangeText={setExpMonth}
              keyboardType="number-pad"
              maxLength={2}
              editable={!isSubmitting}
            />
          </View>
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold mb-2">Utgångsår</Text>
            <TextInput
              className="bg-accentGray border border-accentGray rounded-xl px-4 py-3 text-textPrimary"
              placeholder="ÅÅ"
              placeholderTextColor={colors.borderGray}
              value={expYear}
              onChangeText={setExpYear}
              keyboardType="number-pad"
              maxLength={2}
              editable={!isSubmitting}
            />
          </View>
          <View className="flex-1">
            <Text className="text-textPrimary font-semibold mb-2">CVC</Text>
            <TextInput
              className="bg-accentGray border border-accentGray rounded-xl px-4 py-3 text-textPrimary"
              placeholder="CVC"
              placeholderTextColor={colors.borderGray}
              value={cvc}
              onChangeText={setCvc}
              keyboardType="number-pad"
              maxLength={4}
              editable={!isSubmitting}
            />
          </View>
        </View>
        {error && (
          <Text className="text-red-500 text-center font-medium">{error}</Text>
        )}
        <TouchableOpacity
          className={`rounded-xl py-4 items-center shadow-lg ${isSubmitting ? "bg-indigo-400" : "bg-indigo-500"}`}
          onPress={handleAdd}
          disabled={isSubmitting}
        >
          <Text className="text-textPrimary font-bold text-lg">
            {isSubmitting ? "Lägger till..." : "Lägg till kort"}
          </Text>
        </TouchableOpacity>
      </View>
    </BaseModal>
  );
} 