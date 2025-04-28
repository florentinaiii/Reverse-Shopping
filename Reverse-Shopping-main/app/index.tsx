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
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// ======== INTERFACE DHE TË DHËNA ========

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  image: any;
  instructions: string;
}

export const exampleRecipes: Recipe[] = [
  {
    id: "1",
    name: "Pica Vegjetariane",
    ingredients: ["brumë pice (i gatshëm ose i bërë në shtëpi)", "150g salcë domatesh", "200g djathë mozzarella (ose djathë vegjetarian)",
      "1 spec i kuq (i prerë rrathë)", "1 spec i gjelbër (i prerë rrathë)", "100g kërpudha të freskëta (të prera)", "50g ullinj të zeza (pa bërthamë)",
      "1 lugë vaj ulliri", "Oregano dhe biber sipas shijes"
    ],
    image: require("../assets/images/vegpizza.jpg"),
    instructions: "Për të bërë një picë vegjetariane, fillimisht përgatitni brumin e picës...🍕 Shijojeni picën tuaj vegjetariane! 😊"
  },
];

const SAVED_RECIPES_KEY = '@saved_recipes';

// Fjalor për përkthimin e përbërësve nga shqip në anglisht
const ingredientTranslations: Record<string, string> = {
  'domate': 'tomato',
  'djathe': 'cheese',
  'qepe': 'onion',
  'hudher': 'garlic',
  'spec i kuq': 'red pepper',
  'spec i gjelbër': 'green pepper',
  'vaj ulliri': 'olive oil',
  'kerpudha': 'mushroom',
  'patate': 'potato',
  'pule': 'chicken',
  'peshk': 'fish',
  'miser': 'corn',
  'spinaq': 'spinach',
  'veze': 'egg',
  'qumesht': 'milk',
  'kos': 'yogurt',
  'oriz': 'rice',
  'fasule': 'beans',
  'patellxhan': 'eggplant',
  'kungull': 'pumpkin',
  'lulelakër': 'cauliflower',
  'karrote': 'carrot',
  'trangull': 'cucumber',
  'limon': 'lemon',
  'borzilok': 'parsley',
  'majdanoz': 'parsley',
  'rigon': 'dill',
  'selino': 'celery',
  'kripe': 'salt',
  'piper': 'pepper',
  'biber': 'pepper',
  'oregano': 'oregano',
  'bazilik': 'basil',
  'rrushi': 'grape',
  'ullinj': 'olives',
};

// Funksioni për përkthimin e tekstit në shqip
const translateText = async (text: string): Promise<string> => {
  try {
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: 'en|sq'
      }
    });
    return response.data.responseData.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

// Funksioni i përditësuar për kërkimin e recetave nga API
const searchRecipesByIngredients = async (ingredients: string[]): Promise<Recipe[]> => {
  try {
    // Përkthe përbërësit në anglisht për kërkim
    const translatedIngredients = ingredients.map(ingredient =>
      ingredientTranslations[ingredient.toLowerCase()] || ingredient
    );

    // Kërko receta për çdo përbërës individualisht
    const recipesByIngredient: { [key: string]: any[] } = {};

    for (const ingredient of translatedIngredients) {
      const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?i=${encodeURIComponent(ingredient)}`);
      const data = await response.json();
      if (data.meals) {
        recipesByIngredient[ingredient] = data.meals;
      } else {
        recipesByIngredient[ingredient] = [];
      }
    }

    // Gjej ID-të e recetave që përmbajnë të gjithë përbërësit
    const allRecipeIds = Object.values(recipesByIngredient).flat().map(meal => meal.idMeal);
    const recipeCounts: { [key: string]: number } = {};

    allRecipeIds.forEach(id => {
      recipeCounts[id] = (recipeCounts[id] || 0) + 1;
    });

    const matchingRecipeIds = Object.keys(recipeCounts)
      .filter(id => recipeCounts[id] === ingredients.length)
      .filter((value, index, self) => self.indexOf(value) === index);

    // Merr detajet e recetave që përputhen
    const detailedRecipes: Recipe[] = [];

    for (const recipeId of matchingRecipeIds) {
      const detailResponse = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
      const detailData = await detailResponse.json();

      if (detailData.meals && detailData.meals.length > 0) {
        const mealDetails = detailData.meals[0];

        const ingredientsList: string[] = [];
        for (let i = 1; i <= 20; i++) {
          const ingredient = mealDetails[`strIngredient${i}`];
          const measure = mealDetails[`strMeasure${i}`];

          if (ingredient && ingredient.trim() !== '') {
            ingredientsList.push(`${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`);
          }
        }

        detailedRecipes.push({
          id: mealDetails.idMeal,
          name: mealDetails.strMeal,
          ingredients: ingredientsList,
          image: { uri: mealDetails.strMealThumb },
          instructions: mealDetails.strInstructions || 'No instructions provided'
        });
      }
    }

    return detailedRecipes;
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Satisfy: Satisfy_400Regular });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadSavedRecipes = async () => {
      setIsLoadingStorage(true);
      try {
        const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
        if (storedValue) {
          const savedRecipes: Recipe[] = JSON.parse(storedValue);
          setSavedRecipeIds(savedRecipes.map(recipe => recipe.id));
        } else {
          setSavedRecipeIds([]);
        }
      } catch (e) {
        console.error("Failed to load saved recipes", e);
        setSavedRecipeIds([]);
      } finally {
        setIsLoadingStorage(false);
      }
    };
    loadSavedRecipes();
  }, []);

  const toggleSavedRecipe = async (recipe: Recipe) => {
    try {
      const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
      let savedRecipes: Recipe[] = storedValue ? JSON.parse(storedValue) : [];

      const isCurrentlySaved = savedRecipes.some(r => r.id === recipe.id);
      let newSavedRecipes: Recipe[];

      if (isCurrentlySaved) {
        newSavedRecipes = savedRecipes.filter(r => r.id !== recipe.id);
      } else {
        newSavedRecipes = [...savedRecipes, recipe];
      }

      setSavedRecipeIds(newSavedRecipes.map(r => r.id));

      try {
        await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(newSavedRecipes));
      } catch (e) {
        console.error("Failed to save recipes", e);
        setSavedRecipeIds(savedRecipes.map(r => r.id));
      }
    } catch (e) {
      console.error("Failed to load/save recipes", e);
    }
  };

  const handleSearch = async () => {
    setHasSearched(true);
    setIsSearching(true);

    if (searchQuery.trim() === "") {
      setFilteredRecipes([]);
      setIsSearching(false);
      return;
    }

    const searchTerms = searchQuery.toLowerCase().split(',').map(term => term.trim()).filter(term => term);

    try {
      const apiRecipes = await searchRecipesByIngredients(searchTerms);

      // Filtrim i recetave lokale që përmbajnë të gjithë përbërësit
      const localRecipes = exampleRecipes.filter(recipe =>
        searchTerms.every(term =>
          recipe.ingredients.some(ingredient =>
            ingredient.toLowerCase().includes(term)
          )
        ));

      setFilteredRecipes([...apiRecipes, ...localRecipes]);
    } catch (error) {
      console.error('Search error:', error);
      setFilteredRecipes([]);
    } finally {
      setIsSearching(false);
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
        toggleSavedRecipe={() => toggleSavedRecipe(selectedRecipe)}
        isSaved={savedRecipeIds.includes(selectedRecipe.id)}
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
      savedRecipeIds={savedRecipeIds}
      toggleSavedRecipe={toggleSavedRecipe}
      isSearching={isSearching}
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
  savedRecipeIds: string[];
  toggleSavedRecipe: (recipe: Recipe) => void;
  isSearching: boolean;
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
  savedRecipeIds,
  toggleSavedRecipe,
  isSearching
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

        {!hasSearched && searchQuery.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {Object.keys(ingredientTranslations)
              .filter(ing => ing.includes(searchQuery.toLowerCase()))
              .slice(0, 5)
              .map((ingredient, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchQuery(
                      searchQuery ? `${searchQuery}, ${ingredient}` : ingredient
                    );
                  }}
                >
                  <Text style={styles.suggestionText}>{ingredient}</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {hasSearched && (
          <>
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Duke kërkuar receta...</Text>
              </View>
            ) : filteredRecipes.length > 0 ? (
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
                      source={typeof item.image === 'number' ? item.image : { uri: item.image.uri }}
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
                          name={savedRecipeIds.includes(item.id) ? "heart" : "heart-outline"}
                          size={24}
                          color={savedRecipeIds.includes(item.id) ? "red" : "white"}
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
  const [translatedRecipe, setTranslatedRecipe] = useState<{
    name?: string;
    ingredients?: string[];
    instructions?: string;
  }>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const translateRecipe = async () => {
    setIsTranslating(true);
    try {
      // Përkthe emrin
      const nameTranslated = await translateText(recipe.name);

      // Përkthe përbërësit
      const ingredientsTranslated = await Promise.all(
        recipe.ingredients.map(ing => translateText(ing))
      );

      // Përkthe udhëzimet
      const instructionsTranslated = await translateText(recipe.instructions);

      setTranslatedRecipe({
        name: nameTranslated,
        ingredients: ingredientsTranslated,
        instructions: instructionsTranslated
      });
    } catch (error) {
      console.error('Translation error:', error);
      Alert.alert('Gabim', 'Përkthimi dështoi');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <ImageBackground source={require("../assets/images/recipedd.jpg")} style={styles.bbackground} resizeMode="cover">
      <View style={styles.backgroundOverlay} />
      <ScrollView style={styles.detailScrollContainer} contentContainerStyle={styles.detailScrollContentContainer}>
        <View style={styles.detailHeaderContainer}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1} ellipsizeMode='tail'>
            {translatedRecipe.name || recipe.name}
          </Text>
          <TouchableOpacity
            onPress={toggleSavedRecipe}
            style={styles.detailHeartButton}
          >
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={28}
              color={isSaved ? "red" : "#333"}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={translateRecipe}
          style={styles.translateButton}
          disabled={isTranslating}
        >
          <Ionicons name="language" size={20} color="#007AFF" />
          <Text style={styles.translateText}>
            {isTranslating ? 'Po përkthehet...' : 'Përkthe në shqip'}
          </Text>
        </TouchableOpacity>

        <View style={styles.detailTopRowContainer}>
          <View style={styles.detailImageContainer}>
            <Image source={recipe.image} style={styles.detailImage} resizeMode="cover" />
          </View>
          <View style={styles.detailIngredientsContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Përbërësit</Text>
              {(translatedRecipe.ingredients || recipe.ingredients).map((ingredient, index) => (
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
              {translatedRecipe.instructions || recipe.instructions}
            </Text>
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
  background: { flex: 1, width: "100%" },
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