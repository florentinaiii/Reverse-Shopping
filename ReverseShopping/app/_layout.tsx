import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: { backgroundColor: "#fff", paddingBottom: 5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shtepia",
          headerTitle: "Reverse Shopping", // Titulli i header-it
          headerLeft: () => (
            <Ionicons
              name="fast-food-outline"
              size={24}
              color="#007AFF"
              style={{ marginLeft: 10 }}
            />
          ), // Ikona e ushqimit në pjesën e majtë të header-it
          headerRight: () => (
            <Ionicons name="home-outline" size={24} color="#007AFF" style={{ marginRight: 10 }} />
          ), // Ikona për shtëpi në pjesën e djathtë të header-it
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-recipes"
        options={{
          title: "Recetat e mia",
          headerTitle: "Reverse Shopping", // Titulli i header-it
          headerLeft: () => (
            <Ionicons
              name="fast-food-outline"
              size={24}
              color="#007AFF"
              style={{ marginLeft: 10 }}
            />
          ), // Ikona e ushqimit në pjesën e majtë të header-it
          headerRight: () => (
            <Ionicons name="book-outline" size={24} color="#007AFF" style={{ marginRight: 10 }} />
          ), // Ikona për librin në pjesën e djathtë të header-it
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profili",
          headerTitle: "Reverse Shopping", // Titulli i header-it
          headerLeft: () => (
            <Ionicons
              name="fast-food-outline"
              size={24}
              color="#007AFF"
              style={{ marginLeft: 10 }}
            />
          ), // Ikona e ushqimit në pjesën e majtë të header-it
          headerRight: () => (
            <Ionicons name="person-outline" size={24} color="#007AFF" style={{ marginRight: 10 }} />
          ), // Ikona për profilin në pjesën e djathtë të header-it
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
