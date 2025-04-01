import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MyRecipes() {
  const [recipes, setRecipes] = useState([
    { id: "1", name: "Pasta Carbonara", image: require("../assets/images/pastacarbonara.jpg") },
    { id: "2", name: "Sallate Pule", image: require("../assets/images/chickensalad.jpg") },
  ]);
  const [searchQuery, setSearchQuery] = useState("");

  const deleteRecipe = (id: string) => {
    Alert.alert("Fshirje Recete", "A jeni i sigurt që doni ta fshini këtë recetë?", [
      { text: "Anulo", style: "cancel" },
      {
        text: "Po, Fshije",
        onPress: () => setRecipes(recipes.filter((recipe) => recipe.id !== id)),
      },
    ]);
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Kërko receta..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* Centered Header and Subheader */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>📜 Recetat e Ruajtura</Text>
        <Text style={styles.subHeader}>Shiko dhe menaxho recetat e tua të preferuara</Text>
      </View>

      {/* Recipe List */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.recipeCard}>
            <Image source={item.image} style={styles.recipeImage} />
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>{item.name}</Text>
            </View>
            <TouchableOpacity 
              onPress={() => deleteRecipe(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nuk u gjet asnjë recetë</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subHeader: {
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    paddingBottom: 20,
  },
  recipeCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  recipeImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  recipeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  recipeName: {
    fontWeight: "bold",
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});