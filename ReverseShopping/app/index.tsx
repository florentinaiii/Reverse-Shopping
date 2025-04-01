import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";

const exampleRecipes = [
  {
    id: "1",
    name: "Pasta Carbonara",
    ingredients: ["Pasta", "Veze", "Djath", "Porshute", "Piper i zi"],
    image: require("../assets/images/pastacarbonara.jpg"),
    instructions: "1. Zieni pastën. 2. Përzieni vezën dhe djathin. 3. Shtoni pastën dhe përziejeni. 4. Shtoni bacon dhe piper të zi."
  },
  {
    id: "2",
    name: "Sallate Pule",
    ingredients: ["Pule", "Sallate", "Domate", "Kastravec", "Vaj Ulliri"],
    image: require("../assets/images/chickensalad.jpg"),
    instructions: "1. Pjekni mishin e pulës. 2. Përzieni sallatën, domatet dhe kastravecin. 3. Shtoni vaj ulliri dhe përziejeni mirë."
  },
  {
    id: "3",
    name: "Pica Vegjetariane",
    ingredients: ["Domate", "Djath", "Piper", "Kerpudha", "Ullinj"],
    image: require("../assets/images/vegpizza.jpg"),
    instructions: "1. Përgatisni brumin. 2. Vendosni domaten dhe djathin sipër. 3. Shtoni perimet. 4. Piqni në furrë."
  },
];

export default function App() {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  
  const handleSearch = () => {
    if (searchQuery.trim() === "") {
      setFilteredRecipes([]);
    } else {
      const filtered = exampleRecipes.filter((recipe) =>
        recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredRecipes(filtered);
    }
  };

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }
  return <HomePage onSelectRecipe={setSelectedRecipe} searchQuery={searchQuery} setSearchQuery={setSearchQuery} onSearch={handleSearch} filteredRecipes={filteredRecipes} />;
}

function HomePage({ onSelectRecipe, searchQuery, setSearchQuery, onSearch, filteredRecipes }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Reverse Shopping</Text>
        <Text style={styles.subHeader}>Zbulo receta të reja dhe krijo magji në kuzhinë</Text>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput 
          placeholder="Shkruaj përbërësit ose fotografo..." 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
          style={styles.input} 
        />
        <TouchableOpacity style={styles.cameraButton}>
          <Ionicons name="camera" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSearch} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Kërko</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onSelectRecipe(item)} style={styles.recipeCard}>
            <Image source={item.image} style={styles.recipeImage} />
            <View style={styles.textContainer}>
              <Text style={styles.recipeText}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function RecipeDetail({ recipe, onBack }) {
  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>
      <Image source={recipe.image} style={styles.recipeImage} />
      <Text style={styles.title}>{recipe.name}</Text>
      <Text style={styles.subHeader}>Përbërësit:</Text>
      <FlatList data={recipe.ingredients} keyExtractor={(item, index) => index.toString()} renderItem={({ item }) => <Text style={styles.ingredient}>• {item}</Text>} />
      <Text style={styles.subHeader}>Përgatitja:</Text>
      <Text style={styles.instructions}>{recipe.instructions}</Text>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },
  headerContainer: { 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 30 
  },
  header: { 
    fontSize: 28, 
    fontWeight: "bold", 
    textAlign: "center", 
    marginBottom: 10 
  },
  subHeader: { 
    fontSize: 16, 
    fontWeight: "bold", 
    textAlign: "center",
    marginBottom: 30 
  },
  searchContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    borderRadius: 25, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },
  searchIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#333" },
  cameraButton: { backgroundColor: "#007AFF", padding: 8, borderRadius: 20, marginRight: 10 },
  searchButton: { backgroundColor: "#007AFF", paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  searchButtonText: { color: "white", fontWeight: "bold" },
  recipeCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 10, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 2 
  },
  recipeImage: { width: 80, height: 80, borderRadius: 10, marginRight: 10 },
  textContainer: { flex: 1 },
  recipeText: { fontSize: 18, fontWeight: "bold" },
  backButton: { backgroundColor: "#007AFF", padding: 10, borderRadius: 10, alignItems: "center", width: 50, marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 10 },
  ingredient: { fontSize: 18, marginBottom: 5 },
  instructions: { fontSize: 18, textAlign: "left", marginTop: 10 },
});
