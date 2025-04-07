import React, { useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ScrollView, 
  StyleSheet,
  Switch  // Added Switch import here
} from "react-native";
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
      {/* Profile Photo Section */}
      <View style={styles.profileHeader}>
        <View style={styles.profilePhotoContainer}>
          <Image
            source={require("../assets/images/profile-photo.png")} // Replace with your actual image path
            style={styles.profilePhoto}
          />
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={20} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.username, { color: darkMode ? "#fff" : "#000" }]}>
          {username}
        </Text>
        <Text style={{ color: darkMode ? "#bbb" : "#666" }}>{email}</Text>
      </View>

      {/* Dietary Preferences */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: darkMode ? "#fff" : "#000" }]}>
          🥗 Preferencat Ushqimore
        </Text>
        <TextInput
          style={[
            styles.inputField,
            {
              backgroundColor: darkMode ? "#444" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderColor: darkMode ? "#666" : "#ddd",
            }
          ]}
          value={dietPreference}
          onChangeText={setDietPreference}
          placeholder="Vendosni preferencat tuaja..."
          placeholderTextColor={darkMode ? "#bbb" : "#888"}
        />
      </View>

      {/* Dark Mode Toggle - Now properly imported */}
      <View style={styles.sectionContainer}>
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleText, { color: darkMode ? "#fff" : "#000" }]}>
            <Ionicons name="moon" size={18} color={darkMode ? "#fff" : "#666"} /> Mënyra e Errët
          </Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={darkMode ? "#f5dd4b" : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutButton}
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.logoutText}>Dil nga Llogaria</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={{ color: darkMode ? "#bbb" : "#666", fontSize: 12 }}>
          © 2025 Reverse Shopping | Të gjitha të drejtat janë të rezervuara
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
    marginVertical: 25,
  },
  profilePhotoContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#007AFF",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  inputField: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: "#FF4D4D",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    flexDirection: "row",
    elevation: 2,
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 10,
  },
});