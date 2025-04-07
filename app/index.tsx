import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ImageBackground, Image, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
const { width } = Dimensions.get('window');
const isMobile = width < 768; // Define this before using it in styles

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

  {
    id: "4",
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

        {/* Search Bar */}
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
                  setFilteredRecipes([]);
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

        {/* Recipe List */}
        {hasSearched && (
          <View style={styles.recipeGrid}>
            {filteredRecipes.length > 0 ? (
              <FlatList
                data={filteredRecipes}
                keyExtractor={(item) => item.id}
                numColumns={isMobile ? 2 : 4} // Responsive columns
                columnWrapperStyle={styles.columnWrapper}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => onSelectRecipe(item)} 
                    style={styles.recipeCard}
                    activeOpacity={0.8}
                  >
                    <ImageBackground 
                      source={item.image} 
                      style={styles.recipeImage}
                      imageStyle={styles.imageStyle}
                    >
                      <View style={styles.imageOverlay}>
                        <Text style={styles.recipeName}>{item.name}</Text>
                        <View style={styles.recipeFooter}>
                          <Text style={styles.viewRecipeText}>Shiko receten</Text>
                          <Ionicons name="arrow-forward" size={16} color="white" />
                        </View>
                      </View>
                    </ImageBackground>
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
  container: { 
    flex: 1, 
    padding: isMobile ? 20 : 40,
    maxWidth: 1200, // Max width for web
    alignSelf: 'center', // Center on web
    width: '100%',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: isMobile ? 180 : 100,
    marginBottom: 20,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  headerContainerSmall: {
    paddingTop: isMobile ? 20 : 40,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: isMobile ? 35 : 42,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
    letterSpacing: 1,
    fontFamily: 'Satisfy',
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: isMobile ? 18 : 22,
    color: '#000',
    marginBottom: 20,
    textAlign: 'center',
    paddingTop: 10,
  },
  searchContainer: {
    marginBottom: 20,
    paddingTop: 20,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 20 : 100,
  },
  searchContainerSmall: {
    marginBottom: 10,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: isMobile ? 20 : 100,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    width: "100%",
    maxWidth: 600,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    fontSize: isMobile ? 16 : 18,
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
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  columnWrapper: {
    justifyContent: isMobile ? 'space-between' : 'center',
    marginBottom: 15,
    gap: isMobile ? 10 : 20,
  },
  recipeCard: {
    width: isMobile ? '48%' : '23%',
    aspectRatio: 1,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: isMobile ? 15 : 20,
  },
  recipeImage: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageStyle: {
    borderRadius: 12,
  },
  imageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: isMobile ? 10 : 15,
    height: '38%',
  },
  recipeName: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  recipeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewRecipeText: {
    color: 'white',
    fontSize: isMobile ? 14 : 16,
    fontWeight: '500',
  },
  noResults: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#888",
  },
});