import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Animated,
  Alert,
  GestureResponderEvent
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// ======== INTERFACE DHE TË DHËNA ========

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string;
  image: string;
}

const API_URL = 'http://localhost:3008/api';

const fetchRecipes = async (): Promise<Recipe[]> => {
  try {
    const response = await fetch(`${API_URL}/recipes`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

const searchRecipes = async (ingredients: string[]): Promise<Recipe[]> => {
  try {
    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ingredients }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching recipes:', error);
    return [];
  }
};

const SAVED_RECIPES_KEY = '@saved_recipes';

// Translation dictionary has been removed as it's no longer needed

// Translation functionality has been removed as requested

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Satisfy: Satisfy_400Regular });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadSavedRecipes();
      const recipes = await fetchRecipes();
      setFilteredRecipes(recipes);
      setIsLoading(false);
    };
    init();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const savedRecipesString = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
      if (savedRecipesString) {
        setSavedRecipes(JSON.parse(savedRecipesString));
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    }
  };

  const toggleSavedRecipe = async (recipe: Recipe) => {
    try {
      const recipeId = recipe.id;
      const newSavedRecipes = savedRecipes.includes(recipeId)
        ? savedRecipes.filter(id => id !== recipeId)
        : [...savedRecipes, recipeId];

      setSavedRecipes(newSavedRecipes);
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(newSavedRecipes));
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      const allRecipes = await fetchRecipes();
      setFilteredRecipes(allRecipes);
      setHasSearched(false);
      return;
    }

    const searchTerms = searchQuery.toLowerCase().split(',').map(term => term.trim());
    const results = await searchRecipes(searchTerms);
    setFilteredRecipes(results);
    setHasSearched(true);
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        toggleSavedRecipe={() => toggleSavedRecipe(selectedRecipe)}
        isSaved={savedRecipes.includes(selectedRecipe.id)}
      />
    );
  }

  return (
    <HomePage
      onSelectRecipe={setSelectedRecipe}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSearch={handleSearch}
      filteredRecipes={filteredRecipes}
      setFilteredRecipes={setFilteredRecipes}
      hasSearched={hasSearched}
      setHasSearched={setHasSearched}
      savedRecipes={savedRecipes}
      toggleSavedRecipe={toggleSavedRecipe}
    />
  );
}

interface HomePageProps {
  onSelectRecipe: (recipe: Recipe) => void;
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  onSearch: () => void;
  filteredRecipes: Recipe[];
  setFilteredRecipes: (recipes: Recipe[]) => void;
  hasSearched: boolean;
  setHasSearched: (value: boolean) => void;
  savedRecipes: string[];
  toggleSavedRecipe: (recipe: Recipe) => void;
}

function HomePage({
  onSelectRecipe,
  searchQuery,
  setSearchQuery,
  onSearch,
  filteredRecipes,
  setFilteredRecipes,
  hasSearched,
  setHasSearched,
  savedRecipes,
  toggleSavedRecipe
}: HomePageProps) {
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const clearSearch = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSearchQuery("");
      setFilteredRecipes([]);
      setHasSearched(false);
      fadeAnim.setValue(1);
      searchInputRef.current?.focus();
    });
  };

  return (
    <ImageBackground source={require("../assets/images/background.jpg")} style={styles.background} resizeMode="cover">
      <View style={styles.backgroundOverlay} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        {!hasSearched && (
          <View style={styles.headerContainer}>
            <Text style={styles.appTitle}>REVERSE SHOPPING</Text>
            <Text style={styles.appSubtitle}>Zbulo receta te reja dhe krijo magji ne kuzhine</Text>
          </View>
        )}

        <View style={[styles.searchContainer, hasSearched && styles.searchContainerSmall]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              placeholder="Shkruani përbërësit (ndarë me presje)..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={onSearch}
              returnKeyType="search"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Animated.View style={{ opacity: fadeAnim }}>
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#aaa" />
                </TouchableOpacity>
              </Animated.View>
            )}
            <TouchableOpacity
              onPress={onSearch}
              style={styles.searchButton}
              disabled={searchQuery.trim() === ""}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {hasSearched && (
          <>
            {filteredRecipes.length > 0 ? (
              <FlatList
                data={filteredRecipes}
                keyExtractor={(item) => item.id}
                numColumns={isMobile ? 2 : 4}
                columnWrapperStyle={styles.columnWrapper}
                style={styles.flatListContent}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => onSelectRecipe(item)}
                    style={styles.recipeCard}
                    activeOpacity={0.8}
                  >
                    <ImageBackground
                      source={{ uri: `${API_URL}${item.image}` }}
                      style={styles.recipeImage}
                      imageStyle={styles.imageStyle}
                    >
                      <TouchableOpacity
                        style={styles.heartButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleSavedRecipe(item);
                        }}
                      >
                        <Ionicons
                          name={savedRecipes.includes(item.id) ? "heart" : "heart-outline"}
                          size={24}
                          color={savedRecipes.includes(item.id) ? "red" : "white"}
                        />
                      </TouchableOpacity>
                      <View style={styles.imageOverlay}>
                        <Text style={styles.recipeName} numberOfLines={2}>{item.name}</Text>
                        <View style={styles.recipeFooter}>
                          <Text style={styles.viewRecipeText}>Shiko recetën</Text>
                          <Ionicons name="arrow-forward" size={16} color="white" />
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContentPadding}
              />
            ) : (
              <Text style={styles.noResults}>Nuk u gjet asnjë recetë që përputhet.</Text>
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  toggleSavedRecipe: () => void;
  isSaved: boolean;
}

function RecipeDetail({ recipe, onBack, toggleSavedRecipe, isSaved }: RecipeDetailProps) {
  return (
    <ImageBackground source={require("../assets/images/back.jpg")} style={styles.background} resizeMode="cover">
      <View style={styles.backgroundOverlay} />
      <ScrollView style={styles.detailScrollContainer} contentContainerStyle={styles.detailScrollContentContainer}>
        <View style={styles.detailHeaderContainer}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1} ellipsizeMode='tail'>
            {recipe.name}
          </Text>
          <TouchableOpacity
            onPress={toggleSavedRecipe}
            style={styles.detailHeartButton}
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={24}
              color={isSaved ? "#FF6B6B" : "#000"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailTopRowContainer}>
          <View style={styles.detailImageContainer}>
            <Image
              source={{ uri: recipe.image }}
              style={styles.detailImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.detailIngredientsContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Përbërësit</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Ionicons name="ellipse" size={8} color="#007AFF" style={styles.ingredientIcon} />
                  <Text style={styles.ingredientText}>{ingredient}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.detailInstructionsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Udhëzimet</Text>
            <Text style={styles.instructionsText}>
              {recipe.instructions}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

// ======== STILET ========
const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%"
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)'
  },
  detailScrollContainer: {
    flex: 1,
  },
  detailScrollContentContainer: {
    paddingBottom: 40,
    paddingHorizontal: isMobile ? 15 : 25,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  detailHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
    marginBottom: 20,
    width: '100%',
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  detailTitle: {
    flex: 1,
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerPlaceholderRight: {
    width: 36,
    height: 36,
  },
  detailTopRowContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    width: '100%',
    marginBottom: 20,
    gap: isMobile ? 15 : 20,
    alignItems: 'center',
  },
  detailImageContainer: {
    width: isMobile ? '80%' : '40%',
    aspectRatio: 1,
    borderRadius: 240,
    overflow: 'hidden',
    backgroundColor: '#eee',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    alignSelf: isMobile ? 'center' : undefined,
  },
  detailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 240,
  },
  detailIngredientsContainer: {
    width: isMobile ? '100%' : '55%',
    padding: isMobile ? 15 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  ingredientIcon: {
    marginRight: 8,
    marginTop: 2
  },
  ingredientText: {
    fontSize: isMobile ? 15 : 16,
    color: '#555',
    flex: 1
  },
  detailInstructionsContainer: {
    width: '100%',
    padding: isMobile ? 15 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 60,
  },
  instructionsText: {
    fontSize: isMobile ? 15 : 16,
    color: '#444',
    lineHeight: isMobile ? 22 : 24
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 20,
    marginHorizontal: 15,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  translateText: {
    marginLeft: 5,
    color: '#007AFF',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    padding: isMobile ? 15 : 30,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  headerContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: isMobile ? 150 : 80,
    marginBottom: 20,
    maxWidth: 1200,
    alignSelf: 'center',
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
    paddingTop: 10,
    paddingBottom: 10,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 15 : 100,
  },
  searchContainerSmall: {
    marginBottom: 15,
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: isMobile ? 15 : 100,
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
  clearButton: {
    padding: 5,
    marginRight: 5,
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 5,
    padding: 10,
    width: '90%',
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  suggestionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  flatListContent: {
    flex: 1,
    width: '100%',
  },
  columnWrapper: {
    gap: isMobile ? 10 : 15,
    marginBottom: isMobile ? 10 : 15,
  },
  recipeCard: {
    width: isMobile ? '48%' : '23.5%',
    aspectRatio: 1,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    paddingHorizontal: isMobile ? 10 : 12,
    paddingVertical: isMobile ? 8 : 10,
    height: 90,
    paddingBottom: 8
  },
  recipeName: {
    fontSize: isMobile ? 15 : 17,
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
    color: 'rgba(255,255,255, 0.9)',
    fontSize: isMobile ? 13 : 14,
    fontWeight: '500',
  },
  noResults: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 17,
    color: "#666",
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 6,
  },
  listContentPadding: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  detailHeartButton: {
    position: 'absolute',
    right: 15,
    top: Platform.OS === 'ios' ? 50 : 40,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
});