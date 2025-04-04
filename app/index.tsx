import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ImageBackground, Image, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';

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
  const [hasSearched, setHasSearched] = useState(false);
  
  const handleSearch = () => {
    setHasSearched(true);
    if (searchQuery.trim() === "") {
      setFilteredRecipes([]);
    } else {
      const searchTerms = searchQuery.toLowerCase().split(' ');
      const filtered = exampleRecipes.filter((recipe) =>
        searchTerms.some(term => 
          recipe.name.toLowerCase().includes(term) ||
          recipe.ingredients.some(ingredient => 
            ingredient.toLowerCase().includes(term)
          )
        )
      );
      setFilteredRecipes(filtered);
    }
  };

  if (selectedRecipe) {
    return <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />;
  }

  let [fontsLoaded] = useFonts({
    'Satisfy': Satisfy_400Regular,
  });

  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <HomePage 
      onSelectRecipe={setSelectedRecipe} 
      searchQuery={searchQuery} 
      setSearchQuery={setSearchQuery} 
      onSearch={handleSearch} 
      filteredRecipes={filteredRecipes}
      hasSearched={hasSearched}
      setHasSearched={setHasSearched}
    />
  );
}

function HomePage({ onSelectRecipe, searchQuery, setSearchQuery, onSearch, filteredRecipes, hasSearched, setHasSearched }) {
  return (
    <ImageBackground source={require("../assets/images/background.jpg")} style={styles.background}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Header Section */}
        <View style={[styles.headerContainer, hasSearched && styles.headerContainerSmall]}>
          {!hasSearched && (
           <>
              <Text style={styles.appTitle}>REVERSE SHOPPING</Text>
              <Text style={styles.appSubtitle}>Zbulo receta te reja dhe krijo magji ne kuzhine</Text>
            </>
          )}
        </View>

        {/* Search Bar - Always visible but moves up when searching */}
        <View style={[styles.searchContainer, hasSearched && styles.searchContainerSmall]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput 
              placeholder="Kërko receta me përbërës..." 
              placeholderTextColor="#888"
              value={searchQuery} 
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text === "") {
                  setHasSearched(false);
                  filteredRecipes([]);
                }
              }}
              onSubmitEditing={onSearch}
              style={styles.searchInput} 
            />
            <TouchableOpacity onPress={onSearch} style={styles.searchButton}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Recipe List - Shows only after search */}
        {hasSearched && (
          <View style={styles.recipeGrid}>
            {filteredRecipes.length > 0 ? (
              <FlatList
                data={filteredRecipes}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => onSelectRecipe(item)} 
                    style={styles.recipeCard}
                  >
                    <Image source={item.image} style={styles.recipeImage} />
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{item.name}</Text>
                      <Text style={styles.recipeIngredients}>
                        {item.ingredients.slice(0, 3).join(", ")}
                        {item.ingredients.length > 3 ? "..." : ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <Text style={styles.noResults}>Nuk u gjet asnjë recetë</Text>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, width: "100%", opacity: 0.7 },
  container: { flex: 1, padding: 20 },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop:180,
    marginBottom: 20,
  },
  headerContainerSmall: {
    paddingTop: 20,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    letterSpacing: 1,
    fontFamily: 'Satisfy',
  },
  appSubtitle: {
    fontSize: 20,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
    paddingTop:10,


  },
  searchContainer: {
    marginBottom: 20,
    paddingTop:20,
    paddingBottom:20,
    paddingLeft:450,
    paddingRight: 450,
    
  },
  searchContainerSmall: {
    marginBottom: 10,
    paddingTop:20,
    paddingBottom:20,
    paddingLeft:50,
    paddingRight: 50,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  searchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 20,
    padding: 8,
    marginLeft: 5,
  },
  recipeGrid: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  recipeCard: {
    width: '48%',
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 15,
  },
  recipeImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  recipeInfo: {
    padding: 12,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  recipeIngredients: {
    fontSize: 12,
    color: "#666",
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
  initialMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  initialMessageText: {
    fontSize: 18,
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
});