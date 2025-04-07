import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Switch, TextInput, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState("Përdoruesi");
  const [email, setEmail] = useState("user@example.com");
  const [dietPreference, setDietPreference] = useState("Pa preferenca");

  const handleLogout = () => {
    Alert.alert("Dil nga llogaria", "A jeni i sigurt që doni të dilni?", [
      { text: "Anulo", style: "cancel" },
      { text: "Po, Dil", onPress: () => console.log("User logged out") },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: darkMode ? "#333" : "#f8f8f8" }}>
      {/* Foto Profili */}
      <View style={{ alignItems: "center", marginVertical: 30 }}>
        <Image
          source={{ uri: "https://via.placeholder.com/100" }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            marginBottom: 15,
            borderWidth: 2,
            borderColor: darkMode ? "#fff" : "#007AFF",
          }}
        />
        <Text style={{ fontSize: 24, fontWeight: "bold", color: darkMode ? "#fff" : "#000" }}>
          {username}
        </Text>
        <Text style={{ color: darkMode ? "#bbb" : "#666" }}>{email}</Text>
      </View>

      {/* Preferencat Ushqimore */}
      <View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: darkMode ? "#fff" : "#000" }}>
          🥗 Preferencat Ushqimore
        </Text>
        <TextInput
          style={{
            backgroundColor: darkMode ? "#444" : "#fff",
            padding: 12,
            borderRadius: 10,
            marginTop: 10,
            color: darkMode ? "#fff" : "#000",
            borderWidth: 1,
            borderColor: darkMode ? "#666" : "#ddd",
          }}
          value={dietPreference}
          onChangeText={setDietPreference}
          placeholder="Vendosni preferencat tuaja..."
          placeholderTextColor={darkMode ? "#bbb" : "#888"}
        />
      </View>

      {/* Dark Mode Switch */}
     
      {/* Butoni për Dalje nga Llogaria */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: "#FF4D4D",
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          marginVertical: 25,
          marginTop: 110,
          flexDirection: "row",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Ionicons name="log-out-outline" size={24} color="white" />
        <Text style={{ color: "white", fontWeight: "bold", marginLeft: 10 }}>Dil nga Llogaria</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={{ alignItems: "center", paddingBottom: 30 }}>
        <Text style={{ color: darkMode ? "#bbb" : "#666", fontSize: 14 }}>
          © 2025 Reverse Shopping | Të gjitha të drejtat janë të rezervuara
        </Text>
      </View>
    </ScrollView>
  );
}
