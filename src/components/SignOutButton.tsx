import { useAuth } from "@/src/hooks/useAuth";
import React, { useState } from "react";
import { Button, View } from "react-native";
import { BaseModal } from "./BaseModal";

const SignOutButton = () => {
  const { user, signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSignOut = () => {
    setModalVisible(false);
    signOut();
  };

  return (
    <View>
      <Button
        title="Sign Out"
        color="#d9534f"
        onPress={() => setModalVisible(true)}
      />
      <BaseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Sign Out"
      >
        <View style={{ alignItems: "center" }}>
          <View style={{ marginBottom: 24 }}>
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
          <Button
            title="Sign Out"
            color="#d9534f"
            onPress={handleSignOut}
          />
        </View>
      </BaseModal>
    </View>
  );
};

export default SignOutButton;
