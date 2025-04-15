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
  ActivityIndicator, // Importo ActivityIndicator për një loading më të mirë
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// ======== INTERFACE DHE TË DHËNA ========

// Tipi për një objekt Recipe
export interface Recipe { // Exporto interface për ta përdorur gjetkë
  id: string;
  name: string;
  ingredients: string[];
  image: any; // Tipi specifik varet nga si i menaxhon imazhet (p.sh., ImageSourcePropType)
  instructions: string;
}

// Lista e recetave (e eksportuar)
// Shto më shumë receta nëse dëshiron
export const exampleRecipes: Recipe[] = [
    {
        id: "1",
        name: "Pica Vegjetariane",
        ingredients: ["brumë pice (i gatshëm ose i bërë në shtëpi)", "150g salcë domatesh", "200g djathë mozzarella (ose djathë vegjetarian)",
            "1 spec i kuq (i prerë rrathë)", "1 spec i gjelbër (i prerë rrathë)", "100g kërpudha të freskëta (të prera)", "50g ullinj të zeza (pa bërthamë)",
            "1 lugë vaj ulliri", "Oregano dhe biber sipas shijes"
        ], image: require("../assets/images/vegpizza.jpg"),
        instructions: "Për të bërë një picë vegjetariane, fillimisht përgatitni brumin e picës...🍕 Shijojeni picën tuaj vegjetariane! 😊"
    },
    {
        id: "2",
        name: "Sallate Pule",
        ingredients: ["Gjoks pule", "Sallatë jeshile", "Domate cherry", "Kastravec", "Qepë e kuqe", "Misër", "Vaj ulliri", "Lëng limoni", "Kripë, piper"],
        image: require("../assets/images/chickensalad.jpg"),
        instructions: "1. Marino gjoksin e pulës dhe piqeni në skarë ose tigan derisa të jetë gatuar plotësisht. Lëreni të ftohet pak dhe priteni në shirita ose kube...\n3. Shtoni vajin e ullirit, lëngun e limonit, kripën dhe piperin. Përziejeni mirë dhe shërbejeni menjëherë."
    },
    {
        id: "3",
        name: "Pasta Carbonara",
        ingredients: ["Spageti", "2 vezë", "100g guanciale ose pancetta", "50g djathë Pecorino Romano", "Piper i zi i sapobluar", "Kripë"],
        image: require("../assets/images/pastacarbonara.jpg"),
        instructions: "1. Zieni spagetit në ujë me kripë sipas udhëzimeve të paketimit.\n2. Ndërkohë, skuqni guanciale/pancetta në një tigan derisa të bëhet krokante...\n4. Shtoni spagetit e kulluar në tigan dhe përzieni mirë. Shërbejeni menjëherë me ekstra djathë Pecorino dhe piper të zi."
    },
];

const SAVED_RECIPES_KEY = '@saved_recipes';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Satisfy: Satisfy_400Regular });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<string[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadSavedRecipes = async () => {
      setIsLoadingStorage(true);
      try {
        const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
        setSavedRecipes(storedValue ? JSON.parse(storedValue) : []);
      } catch (e) {
        console.error("Failed to load saved recipes", e);
        setSavedRecipes([]);
      } finally {
        setIsLoadingStorage(false);
      }
    };
    loadSavedRecipes();
  }, []);

  const toggleSavedRecipe = async (recipeId: string) => {
    const isCurrentlySaved = savedRecipes.includes(recipeId);
    let newSavedRecipes: string[];
    
    if (isCurrentlySaved) {
      newSavedRecipes = savedRecipes.filter(id => id !== recipeId);
      if (router.pathname === '/my-recipes') {
        setFilteredRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
      }
    } else {
      newSavedRecipes = [...savedRecipes, recipeId];
    }

    setSavedRecipes(newSavedRecipes);
    
    try {
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(newSavedRecipes));
    } catch (e) {
      console.error("Failed to save recipes", e);
      setSavedRecipes(savedRecipes);
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
    if (searchQuery.trim() === "") {
      setFilteredRecipes([]);
    } else {
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term);
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

  if (!fontsLoaded || isLoadingStorage) {
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
        toggleSavedRecipe={toggleSavedRecipe}
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
  toggleSavedRecipe: (recipeId: string) => void;
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
              placeholder="Kërko receta me përbërës..."
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
                      source={item.image}
                      style={styles.recipeImage}
                      imageStyle={styles.imageStyle}
                    >
                      <TouchableOpacity
                        style={styles.heartButton}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleSavedRecipe(item.id);
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
  toggleSavedRecipe: (recipeId: string) => void;
  isSaved: boolean;
}

function RecipeDetail({ recipe, onBack, toggleSavedRecipe, isSaved }: RecipeDetailProps) {
  return (
    <ImageBackground source={require("../assets/images/background.jpg")} style={styles.bbackground} resizeMode="cover">
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
            onPress={() => toggleSavedRecipe(recipe.id)}
            style={styles.detailHeartButton}
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={28}
              color={isSaved ? "red" : "#333"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailTopRowContainer}>
          <View style={styles.detailImageContainer}>
            <Image source={recipe.image} style={styles.detailImage} resizeMode="cover"/>
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
            <Text style={styles.instructionsText}>{recipe.instructions}</Text>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

// ======== STILET ========
const styles = StyleSheet.create({
  bbackground: { 
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


  background: { flex: 1, width: "100%"},
  container: {
    flex: 1, // Lejon KeyboardAvoidingView të funksionojë mirë
    padding: isMobile ? 15 : 30, // Reduktuar pak padding
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    // alignItems: 'center', // Heqim këtë pasi FlatList tani ka width 100%
  },
  headerContainer: { // Vetëm kur !hasSearched
    width: '100%',
    alignItems: 'center',
    paddingTop: isMobile ? 150 : 80, // Zvogëluar pak paddingTop
    marginBottom: 20,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  // headerContainerSmall HIQET PLOTËSISHT
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
  searchContainer: { // Fillestar
    marginBottom: 20,
    paddingTop: 10, // Zvogëluar padding top
    paddingBottom: 10, // Zvogëluar padding bottom
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 15 : 100, // Reduktuar pak padding horizontal
  },
  searchContainerSmall: { // Kur ka rezultate
    marginBottom: 15, // Pak më shumë hapësirë poshtë search bar
    paddingTop: 15, // Pak padding sipër search bar
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
  clearButton: { // Stili për butonin X
    padding: 5,
    marginRight: 5,
  },

  flatListContent: { // Stil për vetë FlatList
    flex: 1, // Lejon FlatList të zgjerohet
    width: '100%', // Zë gjithë gjerësinë e container
  },
  columnWrapper: { // Rreshton kartat brenda një rreshti
    gap: isMobile ? 10 : 15,
    marginBottom: isMobile ? 10 : 15,
  },
  recipeCard: { // Stili për secilën kartë
    width: isMobile ? '48%' : '23.5%', // Rregulluar pak gjerësia desktop
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
    height: 90, // Lartësi minimale për overlay
    paddingBottom: 8
  },
  recipeName: {
    fontSize: isMobile ? 15 : 17,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8, // Hapësirë e vogël para footer
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
    marginTop: 40, // Më shumë hapësirë sipër
    fontSize: 17,
    color: "#666", // Pak më e errët
  },
  heartButton: {
    position: 'absolute',
    top: 8, // Pak më poshtë
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.4)', // Pak më transparent
    borderRadius: 20,
    padding: 6, // Pak më shumë padding
  },
  listContentPadding: { // Padding vetëm poshtë listës
    paddingBottom: 30, // Më shumë hapësirë poshtë
  },

  loadingContainer: { // Stili për containerin loading
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: '#f0f0f0',
  },
  loadingText: { // Teksti Loading...
     marginTop: 10,
     fontSize: 16,
     color: '#555',
  },
  errorText: { // Teksti Error
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