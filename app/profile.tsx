import React, { useState } from "react";
<<<<<<< HEAD
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
=======
import { View, Text, Image, TouchableOpacity, Switch, TextInput, Alert, ScrollView } from "react-native";
>>>>>>> f5c2ffc213cc12b574acef94eca952613ac40833
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
<<<<<<< HEAD
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
=======
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
>>>>>>> f5c2ffc213cc12b574acef94eca952613ac40833
          {username}
        </Text>
        <Text style={{ color: darkMode ? "#bbb" : "#666" }}>{email}</Text>
      </View>

<<<<<<< HEAD
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
=======
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
>>>>>>> f5c2ffc213cc12b574acef94eca952613ac40833
          value={dietPreference}
          onChangeText={setDietPreference}
          placeholder="Vendosni preferencat tuaja..."
          placeholderTextColor={darkMode ? "#bbb" : "#888"}
        />
      </View>

<<<<<<< HEAD
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
=======
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
>>>>>>> f5c2ffc213cc12b574acef94eca952613ac40833
          © 2025 Reverse Shopping | Të gjitha të drejtat janë të rezervuara
        </Text>
      </View>
    </ScrollView>
  );
}
<<<<<<< HEAD

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
=======
>>>>>>> f5c2ffc213cc12b574acef94eca952613ac40833
