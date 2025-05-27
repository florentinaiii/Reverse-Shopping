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
  Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFonts, Satisfy_400Regular } from '@expo-google-fonts/satisfy';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// ======== INTERFACE DHE TË DHËNA ========

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  image: any;
  instructions: string;
  isMealPlan?: boolean;
}

export interface MealPlan {
  weekday: string;
  breakfast: Recipe;
  lunch: Recipe;
  dinner: Recipe;
}

export interface SavedMealPlan extends Recipe {
  isMealPlan: true;
  mealPlanData?: {
    date: string;
    days: {
      weekday: string;
      breakfast: {
        id: string;
        name: string;
      };
      lunch: {
        id: string;
        name: string;
      };
      dinner: {
        id: string;
        name: string;
      };
    }[];
  };
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

// Translation functionality has been removed as requested

// Funksioni për të marrë një imazh default bazuar në emrin e recetës
const getDefaultImage = (recipeName: string) => {
  const name = recipeName.toLowerCase();
  
  if (name.includes('byrek') || name.includes('lakëror')) {
    return require('../assets/images/byrekmeqepe.jpg');
  } else if (name.includes('sup') || name.includes('gjell')) {
    return require('../assets/images/supe.jpg');
  } else if (name.includes('embels') || name.includes('tiramiasu') || name.includes('kek')) {
    return require('../assets/images/tiramisu.jpg');
  } else if (name.includes('tavë') || name.includes('tave')) {
    return require('../assets/images/tavekosi.jpg');
  } else if (name.includes('patate') || name.includes('patellxhan')) {
    return require('../assets/images/patellxhanetembushur.jpg');
  } else if (name.includes('pul') || name.includes('mish')) {
    return require('../assets/images/pilafpule.jpg');
  } else if (name.includes('salat') || name.includes('sallat')) {
    return require('../assets/images/sallate.jpg');
  } else if (name.includes('petull')) {
    return require('../assets/images/petulla.jpg');
  } else if (name.includes('bakllava')) {
    return require('../assets/images/bakllava.jpg');
  } else {
    return require('../assets/images/tiramisu.jpg');
  }
};

// Funksioni për kërkimin e recetave shqiptare nga API lokale
const searchRecipesByIngredients = async (ingredients: string[]): Promise<Recipe[]> => {
  try {
    // Kërko receta nga API lokale
    const response = await fetch('http://localhost:3008/api/recipes');
    const allRecipes = await response.json();
    
    if (!Array.isArray(allRecipes)) {
      console.error('API nuk ktheu një array recetash');
      return [];
    }
    
    // Filtro recetat që përmbajnë përbërësit e kërkuar
    const matchingRecipes = allRecipes.filter(recipe => {
      // Kontrollo nëse receta përmban të paktën një nga përbërësit e kërkuar
      return ingredients.some(ingredient => {
        const lowerIngredient = ingredient.toLowerCase();
        return recipe.ingredients.some((recipeIngredient: string) => 
          recipeIngredient.toLowerCase().includes(lowerIngredient)
        );
      });
    });
    
    // Transformo recetat në formatin e duhur dhe sigurohu që të gjitha kanë imazhe
    const formattedRecipes: Recipe[] = matchingRecipes.map(recipe => {
      return {
        id: recipe.id || String(Math.random()),
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        image: recipe.image && recipe.image !== '' ? { uri: recipe.image } : getDefaultImage(recipe.name)
      };
    });
    
    return formattedRecipes;
  } catch (error) {
    console.error('Gabim gjatë marrjes së recetave:', error);
    // Kthe recetat shembull nëse API dështon
    return exampleRecipes;
  }
};

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Satisfy: Satisfy_400Regular });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [weeklyMealPlan, setWeeklyMealPlan] = useState<MealPlan[]>([]);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [isGeneratingMealPlan, setIsGeneratingMealPlan] = useState(false);
  const [showSavedMealPlansModal, setShowSavedMealPlansModal] = useState(false);
  const [savedMealPlans, setSavedMealPlans] = useState<SavedMealPlan[]>([]);
  const router = useRouter();

  useEffect(() => {
    const loadSavedData = async () => {
      setIsLoadingStorage(true);
      try {
        // Load saved recipes
        const storedRecipes = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
        if (storedRecipes) {
          const recipes: Recipe[] = JSON.parse(storedRecipes);
          setSavedRecipes(recipes);
          setSavedRecipeIds(recipes.map(recipe => recipe.id));
        } else {
          setSavedRecipes([]);
          setSavedRecipeIds([]);
        }
        
        // Load saved meal plans
        const storedMealPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
        if (storedMealPlans) {
          const mealPlans: SavedMealPlan[] = JSON.parse(storedMealPlans);
          setSavedMealPlans(mealPlans);
        } else {
          setSavedMealPlans([]);
        }
      } catch (e) {
        console.error("Failed to load saved data", e);
        setSavedRecipes([]);
        setSavedRecipeIds([]);
        setSavedMealPlans([]);
      } finally {
        setIsLoadingStorage(false);
      }
    };
    loadSavedData();
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

  // Constants for AsyncStorage keys
  const MEAL_PLANS_KEY = '@meal_plans';

  // Function to save meal plan to AsyncStorage
  const saveMealPlanToFavorites = async () => {
    try {
      // Create a special recipe that represents the meal plan
      const today = new Date();
      const dateStr = today.toLocaleDateString('sq-AL');
      const mealPlanId = "mealplan_" + Date.now();
      
      // Create a consolidated list of all ingredients from all meals
      const allIngredients: string[] = [];
      weeklyMealPlan.forEach(dayPlan => {
        [dayPlan.breakfast, dayPlan.lunch, dayPlan.dinner].forEach(meal => {
          meal.ingredients.forEach(ingredient => {
            if (!allIngredients.includes(ingredient)) {
              allIngredients.push(ingredient);
            }
          });
        });
      });
      
      // Create structured data for the meal plan with full recipe references
      const mealPlanData = {
        date: dateStr,
        days: weeklyMealPlan.map(dayPlan => ({
          weekday: dayPlan.weekday,
          breakfast: {
            id: dayPlan.breakfast.id,
            name: dayPlan.breakfast.name
          },
          lunch: {
            id: dayPlan.lunch.id,
            name: dayPlan.lunch.name
          },
          dinner: {
            id: dayPlan.dinner.id,
            name: dayPlan.dinner.name
          }
        }))
      };
      
      // Create a description of the meal plan
      let instructions = "Plani javor i vakteve të krijuar më " + dateStr + "\n\n";
      weeklyMealPlan.forEach(dayPlan => {
        instructions += `${dayPlan.weekday}:\n`;
        instructions += `- Mëngjesi: ${dayPlan.breakfast.name}\n`;
        instructions += `- Dreka: ${dayPlan.lunch.name}\n`;
        instructions += `- Darka: ${dayPlan.dinner.name}\n\n`;
      });
      
      // Create a meal plan recipe
      const mealPlanRecipe: SavedMealPlan = {
        id: mealPlanId,
        name: "Plani Javor i Vakteve - " + dateStr,
        ingredients: allIngredients,
        image: require("../assets/images/background.jpg"), // Using an existing image
        instructions: instructions,
        isMealPlan: true,
        mealPlanData: mealPlanData
      };
      
      // Save to favorites
      await toggleSavedRecipe(mealPlanRecipe);
      
      // Also save to dedicated meal plans storage for easier access
      try {
        const storedMealPlans = await AsyncStorage.getItem(MEAL_PLANS_KEY);
        const mealPlans: SavedMealPlan[] = storedMealPlans ? JSON.parse(storedMealPlans) : [];
        mealPlans.push(mealPlanRecipe);
        await AsyncStorage.setItem(MEAL_PLANS_KEY, JSON.stringify(mealPlans));
      } catch (e) {
        console.error("Failed to save meal plan to dedicated storage", e);
      }
      
      // Show confirmation
      Alert.alert(
        "Sukses", 
        "Plani javor i vakteve u ruajt me sukses në profilin tuaj. Mund ta shikoni në çdo kohë te recetat e ruajtura.",
        [{ text: "OK" }]
      );
      
      // Close the meal plan modal after saving
      setShowMealPlanModal(false);
    } catch (error) {
      console.error('Error saving meal plan:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë ruajtjes së planit javor të vakteve.');
    }
  };

  const API_URL = 'http://localhost:3008/api';

  // Function to fetch all recipes from the local API
  const fetchAllRecipes = async (): Promise<Recipe[]> => {
    try {
      const response = await fetch(`${API_URL}/recipes`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  };

  const generateWeeklyMealPlan = async () => {
    setIsGeneratingMealPlan(true);
    try {
      // Get all available recipes from your local API
      let allRecipes: Recipe[] = await fetchAllRecipes();
      
      // If the API call fails or returns no recipes, use example recipes as fallback
      if (allRecipes.length === 0) {
        console.log('Using example recipes as fallback');
        allRecipes = exampleRecipes;
      }
      
      // Create a meal plan for each day of the week
      const weekdays = ['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë', 'E Diel'];
      const mealPlan: MealPlan[] = weekdays.map(weekday => {
        // Get random recipes for each meal of the day
        const getRandomRecipe = () => {
          const randomIndex = Math.floor(Math.random() * allRecipes.length);
          return allRecipes[randomIndex];
        };
        
        return {
          weekday,
          breakfast: getRandomRecipe(),
          lunch: getRandomRecipe(),
          dinner: getRandomRecipe()
        };
      });
      
      setWeeklyMealPlan(mealPlan);
      setShowMealPlanModal(true);
    } catch (error) {
      console.error('Error generating meal plan:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë gjenerimit të planit javor të vakteve.');
    } finally {
      setIsGeneratingMealPlan(false);
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

  // Function to view a saved meal plan
  const viewSavedMealPlan = (mealPlan: SavedMealPlan) => {
    if (mealPlan.mealPlanData) {
      // Create a weekly meal plan structure from the saved data
      const weekdays = ['E Hënë', 'E Martë', 'E Mërkurë', 'E Enjte', 'E Premte', 'E Shtunë', 'E Diel'];
      const reconstructedMealPlan: MealPlan[] = [];
      
      // For each day in the saved meal plan
      mealPlan.mealPlanData.days.forEach((day, index) => {
        // Find the actual recipes from example recipes or create fallback
        const breakfastRecipe = exampleRecipes.find(r => r.id === day.breakfast.id) || {
          id: day.breakfast.id,
          name: day.breakfast.name,
          ingredients: ['Përbërësi 1', 'Përbërësi 2'],
          instructions: 'Udhëzimet për përgatitjen e recetës.',
          image: require('../assets/images/tiramisu.jpg')
        };
        
        const lunchRecipe = exampleRecipes.find(r => r.id === day.lunch.id) || {
          id: day.lunch.id,
          name: day.lunch.name,
          ingredients: ['Përbërësi 1', 'Përbërësi 2'],
          instructions: 'Udhëzimet për përgatitjen e recetës.',
          image: require('../assets/images/supe.jpg')
        };
        
        const dinnerRecipe = exampleRecipes.find(r => r.id === day.dinner.id) || {
          id: day.dinner.id,
          name: day.dinner.name,
          ingredients: ['Përbërësi 1', 'Përbërësi 2'],
          instructions: 'Udhëzimet për përgatitjen e recetës.',
          image: require('../assets/images/vegpizza.jpg')
        };
        
        reconstructedMealPlan.push({
          weekday: day.weekday,
          breakfast: breakfastRecipe as Recipe,
          lunch: lunchRecipe as Recipe,
          dinner: dinnerRecipe as Recipe
        });
      });
      
      // Set the reconstructed meal plan and show the modal
      setWeeklyMealPlan(reconstructedMealPlan);
      setShowMealPlanModal(true);
      setShowSavedMealPlansModal(false);
    }
  };
  
  return (
    <>
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
        onGenerateMealPlan={generateWeeklyMealPlan}
        isGeneratingMealPlan={isGeneratingMealPlan}
        savedMealPlans={savedMealPlans}
        onViewSavedMealPlans={() => setShowSavedMealPlansModal(true)}
      />
      
      {/* Weekly Meal Plan Modal */}
      <WeeklyMealPlanModal
        showMealPlanModal={showMealPlanModal}
        setShowMealPlanModal={setShowMealPlanModal}
        weeklyMealPlan={weeklyMealPlan}
        setSelectedRecipe={setSelectedRecipe}
        generateWeeklyMealPlan={generateWeeklyMealPlan}
        saveMealPlanToFavorites={saveMealPlanToFavorites}
      />
      
      {/* Saved Meal Plans Modal */}
      <Modal
        visible={showSavedMealPlansModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSavedMealPlansModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Planet e Ruajtura të Vakteve</Text>
              <TouchableOpacity 
                onPress={() => setShowSavedMealPlansModal(false)} 
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.mealPlanScrollView}>
              {savedMealPlans.length > 0 ? (
                savedMealPlans.map((mealPlan, index) => (
                  <TouchableOpacity 
                    key={index} 
                    style={styles.savedMealPlanItem}
                    onPress={() => viewSavedMealPlan(mealPlan)}
                  >
                    <Image 
                      source={typeof mealPlan.image === 'number' ? 
                        mealPlan.image : 
                        { uri: mealPlan.image.uri }}
                      style={styles.savedMealPlanImage}
                    />
                    <View style={styles.savedMealPlanInfo}>
                      <Text style={styles.savedMealPlanName}>{mealPlan.name}</Text>
                      <Text style={styles.savedMealPlanDate}>
                        {mealPlan.mealPlanData?.date || 'Pa datë'}
                      </Text>
                      <View style={styles.savedMealPlanActions}>
                        <Text style={styles.viewMealPlanText}>Shiko planin</Text>
                        <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noMealPlansContainer}>
                  <Ionicons name="calendar-outline" size={60} color="#ccc" />
                  <Text style={styles.noMealPlansText}>
                    Nuk keni plane të ruajtura të vakteve
                  </Text>
                  <TouchableOpacity 
                    style={styles.generateMealPlanButton}
                    onPress={() => {
                      setShowSavedMealPlansModal(false);
                      generateWeeklyMealPlan();
                    }}
                  >
                    <Text style={styles.generateMealPlanButtonText}>
                      Gjenero një Plan Vakti
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

interface HomePageProps {
  onSelectRecipe: (recipe: Recipe) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  filteredRecipes: Recipe[];
  setFilteredRecipes: (recipes: Recipe[]) => void;
  hasSearched: boolean;
  setHasSearched: (value: boolean) => void;
  savedRecipeIds: string[];
  toggleSavedRecipe: (recipe: Recipe) => void;
  isSearching: boolean;
  onGenerateMealPlan: () => void;
  isGeneratingMealPlan: boolean;
  savedMealPlans?: SavedMealPlan[];
  onViewSavedMealPlans?: () => void;
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
  isSearching,
  onGenerateMealPlan,
  isGeneratingMealPlan,
  savedMealPlans,
  onViewSavedMealPlans
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
            <View style={styles.mealPlanButtonsContainer}>
              <TouchableOpacity 
                style={styles.mealPlanButton} 
                onPress={onGenerateMealPlan}
                disabled={isGeneratingMealPlan}
              >
                {isGeneratingMealPlan ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="calendar" size={20} color="white" style={styles.mealPlanButtonIcon} />
                    <Text style={styles.mealPlanButtonText}>Gjenero Plan Javor Vaktesh</Text>
                  </>
                )}
              </TouchableOpacity>
              
              {savedMealPlans && savedMealPlans.length > 0 && onViewSavedMealPlans && (
                <TouchableOpacity 
                  style={styles.mealPlanButton} 
                  onPress={onViewSavedMealPlans}
                >
                  <Ionicons name="list" size={20} color="white" style={styles.mealPlanButtonIcon} />
                  <Text style={styles.mealPlanButtonText}>Shiko Planet e Ruajtura</Text>
                </TouchableOpacity>
              )}  
            </View>
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
                      source={typeof item.image === 'number' ? item.image : (item.image && item.image.uri ? { uri: item.image.uri } : getDefaultImage(item.name))}
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

  // Check if this is a meal plan
  const isMealPlan = recipe.isMealPlan === true;
  const mealPlanData = isMealPlan && (recipe as SavedMealPlan).mealPlanData;

  // Render a meal plan view if this is a meal plan
  if (isMealPlan) {
    // State to track if we're showing meal details
    const [showingMealDetails, setShowingMealDetails] = useState(false);
    const [selectedMeal, setSelectedMeal] = useState<{name: string, ingredients: string[], instructions: string}>({
      name: '',
      ingredients: [],
      instructions: ''
    });

    // Function to handle meal click
    const handleMealClick = (meal: {id: string, name: string}) => {
      // Find the actual recipe from the example recipes
      const foundRecipe = exampleRecipes.find(r => r.id === meal.id);
      
      if (foundRecipe) {
        setSelectedMeal({
          name: foundRecipe.name,
          ingredients: foundRecipe.ingredients,
          instructions: foundRecipe.instructions
        });
        setShowingMealDetails(true);
      } else {
        // Fallback if recipe not found
        const mealIngredients = [
          'Përbërësi 1',
          'Përbërësi 2',
          'Përbërësi 3',
          'Përbërësi 4',
        ];
        const mealInstructions = 'Udhëzimet për përgatitjen e recetës. Këtu do të shfaqen hapat e detajuar për të përgatitur këtë recetë.';
        
        setSelectedMeal({
          name: meal.name,
          ingredients: mealIngredients,
          instructions: mealInstructions
        });
        setShowingMealDetails(true);
      }
    };

    // If showing meal details
    if (showingMealDetails) {
      return (
        <View style={styles.recipeDetailContainer}>
          <View style={styles.recipeDetailHeader}>
            <TouchableOpacity onPress={() => setShowingMealDetails(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.recipeDetailTitle}>{selectedMeal.name}</Text>
          </View>
          
          <ScrollView style={styles.recipeDetailScrollView}>
            <View style={styles.recipeDetailSection}>
              <Text style={styles.recipeDetailSectionTitle}>Përbërësit</Text>
              {selectedMeal.ingredients.map((ingredient, idx) => (
                <Text key={idx} style={styles.recipeDetailIngredient}>
                  • {ingredient}
                </Text>
              ))}
            </View>
            
            <View style={styles.recipeDetailSection}>
              <Text style={styles.recipeDetailSectionTitle}>Udhëzimet</Text>
              <Text style={styles.recipeDetailInstructions}>
                {selectedMeal.instructions}
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Modern meal plan view with a beautiful design
    return (
      <View style={styles.modernMealPlanContainer}>
        {/* Modern header with gradient */}
        <LinearGradient
          colors={['#FF5252', '#FF7B7B']}
          style={styles.modernMealPlanHeader}
        >
          <View style={styles.modernHeaderContent}>
            <Text style={styles.modernMealPlanTitle}>Plani Javor i Vakteve</Text>
            <TouchableOpacity onPress={onBack} style={styles.modernCloseButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Modern Meal Plan Content */}
        <ScrollView style={styles.modernMealPlanScrollView}>
          {mealPlanData && mealPlanData.days.map((day, index) => (
            <View key={index} style={styles.modernDaySection}>
              <LinearGradient
                colors={['#3F51B5', '#5C6BC0']}
                style={styles.modernDayHeader}
              >
                <Text style={styles.modernDayTitle}>{day.weekday}</Text>
              </LinearGradient>
              
              <View style={styles.modernMealsRow}>
                {/* Breakfast */}
                <TouchableOpacity 
                  style={styles.modernMealCard}
                  onPress={() => handleMealClick(day.breakfast)}
                >
                  <View style={styles.modernMealImageContainer}>
                    <Image 
                      source={require("../assets/images/tiramisu.jpg")}
                      style={styles.modernMealImage}
                    />
                    <View style={[styles.modernMealTypeTag, {backgroundColor: '#FFC107'}]}>
                      <Text style={styles.modernMealTypeText}>Mëngjesi</Text>
                    </View>
                  </View>
                  <View style={styles.modernMealCardContent}>
                    <Text style={styles.modernMealName} numberOfLines={2}>{day.breakfast.name}</Text>
                    <View style={styles.modernMealCardFooter}>
                      <Text style={styles.modernViewDetailsText}>Shiko detajet</Text>
                      <Ionicons name="chevron-forward" size={16} color="#FF5252" />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Lunch */}
                <TouchableOpacity 
                  style={styles.modernMealCard}
                  onPress={() => handleMealClick(day.lunch)}
                >
                  <View style={styles.modernMealImageContainer}>
                    <Image 
                      source={require("../assets/images/supe.jpg")}
                      style={styles.modernMealImage}
                    />
                    <View style={[styles.modernMealTypeTag, {backgroundColor: '#4CAF50'}]}>
                      <Text style={styles.modernMealTypeText}>Dreka</Text>
                    </View>
                  </View>
                  <View style={styles.modernMealCardContent}>
                    <Text style={styles.modernMealName} numberOfLines={2}>{day.lunch.name}</Text>
                    <View style={styles.modernMealCardFooter}>
                      <Text style={styles.modernViewDetailsText}>Shiko detajet</Text>
                      <Ionicons name="chevron-forward" size={16} color="#FF5252" />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Dinner */}
                <TouchableOpacity 
                  style={styles.modernMealCard}
                  onPress={() => handleMealClick(day.dinner)}
                >
                  <View style={styles.modernMealImageContainer}>
                    <Image 
                      source={require("../assets/images/vegpizza.jpg")}
                      style={styles.modernMealImage}
                    />
                    <View style={[styles.modernMealTypeTag, {backgroundColor: '#2196F3'}]}>
                      <Text style={styles.modernMealTypeText}>Darka</Text>
                    </View>
                  </View>
                  <View style={styles.modernMealCardContent}>
                    <Text style={styles.modernMealName} numberOfLines={2}>{day.dinner.name}</Text>
                    <View style={styles.modernMealCardFooter}>
                      <Text style={styles.modernViewDetailsText}>Shiko detajet</Text>
                      <Ionicons name="chevron-forward" size={16} color="#FF5252" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Regular recipe view
  return (
    <ImageBackground source={require("../assets/images/recipedd.jpg")} style={styles.background} resizeMode="cover">
      <View style={styles.backgroundOverlay} />
      <ScrollView style={styles.detailScrollContainer} contentContainerStyle={styles.detailScrollContentContainer}>
        <View style={styles.detailHeaderContainer}>
          <TouchableOpacity onPress={onBack} style={styles.backButton || styles.recipeBackButton}>
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
              size={28}
              color={isSaved ? "red" : "#333"}
            />
          </TouchableOpacity>
        </View>

        {/* Translation button removed as requested */}

        <View style={styles.detailTopRowContainer}>
          <View style={styles.detailImageContainer}>
            <Image source={recipe.image} style={styles.detailImage} resizeMode="cover" />
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

// Weekly Meal Plan Modal
interface WeeklyMealPlanModalProps {
  showMealPlanModal: boolean;
  setShowMealPlanModal: (show: boolean) => void;
  weeklyMealPlan: MealPlan[];
  setSelectedRecipe: (recipe: Recipe) => void;
  generateWeeklyMealPlan?: () => void;
  saveMealPlanToFavorites?: () => void;
}

const WeeklyMealPlanModal = ({ 
  showMealPlanModal, 
  setShowMealPlanModal, 
  weeklyMealPlan, 
  setSelectedRecipe,
  generateWeeklyMealPlan,
  saveMealPlanToFavorites 
}: WeeklyMealPlanModalProps) => {
  return (
    <Modal
      visible={showMealPlanModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowMealPlanModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Plani Javor i Vakteve</Text>
            <View style={styles.modalHeaderButtons}>
              <TouchableOpacity 
                onPress={() => generateWeeklyMealPlan?.()} 
                style={styles.regeneratePlanButton}
              >
                <Ionicons name="refresh" size={20} color="white" style={{marginRight: 5}} />
                <Text style={styles.regeneratePlanButtonText}>Rigjeneroj Planin</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => saveMealPlanToFavorites?.()} 
                style={styles.savePlanButton}
              >
                <Ionicons name="heart" size={20} color="white" style={{marginRight: 5}} />
                <Text style={styles.savePlanButtonText}>Ruaj Planin</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMealPlanModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.mealPlanScrollView}>
            {weeklyMealPlan.map((dayPlan, index) => (
              <View key={index} style={styles.dayPlanContainer}>
                <Text style={styles.dayTitle}>{dayPlan.weekday}</Text>
                
                <View style={styles.mealContainer}>
                  <Text style={styles.mealTypeTitle}>Mëngjesi</Text>
                  <TouchableOpacity 
                    style={styles.mealItem}
                    onPress={() => {
                      setShowMealPlanModal(false);
                      setSelectedRecipe(dayPlan.breakfast);
                    }}
                  >
                    <Image 
                      source={typeof dayPlan.breakfast.image === 'number' ? 
                        dayPlan.breakfast.image : 
                        (dayPlan.breakfast.image && dayPlan.breakfast.image.uri ? 
                          { uri: dayPlan.breakfast.image.uri } : 
                          getDefaultImage(dayPlan.breakfast.name))}
                      style={styles.mealImage}
                    />
                    <Text style={styles.mealName}>{dayPlan.breakfast.name}</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.mealContainer}>
                  <Text style={styles.mealTypeTitle}>Dreka</Text>
                  <TouchableOpacity 
                    style={styles.mealItem}
                    onPress={() => {
                      setShowMealPlanModal(false);
                      setSelectedRecipe(dayPlan.lunch);
                    }}
                  >
                    <Image 
                      source={typeof dayPlan.lunch.image === 'number' ? 
                        dayPlan.lunch.image : 
                        (dayPlan.lunch.image && dayPlan.lunch.image.uri ? 
                          { uri: dayPlan.lunch.image.uri } : 
                          getDefaultImage(dayPlan.lunch.name))}
                      style={styles.mealImage}
                    />
                    <Text style={styles.mealName}>{dayPlan.lunch.name}</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.mealContainer}>
                  <Text style={styles.mealTypeTitle}>Darka</Text>
                  <TouchableOpacity 
                    style={styles.mealItem}
                    onPress={() => {
                      setShowMealPlanModal(false);
                      setSelectedRecipe(dayPlan.dinner);
                    }}
                  >
                    <Image 
                      source={typeof dayPlan.dinner.image === 'number' ? 
                        dayPlan.dinner.image : 
                        (dayPlan.dinner.image && dayPlan.dinner.image.uri ? 
                          { uri: dayPlan.dinner.image.uri } : 
                          getDefaultImage(dayPlan.dinner.name))}
                      style={styles.mealImage}
                    />
                    <Text style={styles.mealName}>{dayPlan.dinner.name}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ======== STILET ========
const styles = StyleSheet.create({
  // Removed duplicate property (bbackground was a typo of background)
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
  // Meal Plan Button Styles
  mealPlanButtonsContainer: {
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    width: '100%',
  },
  mealPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: isMobile ? 10 : 0,
    marginHorizontal: isMobile ? 0 : 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  mealPlanButtonText: {
    color: 'white',
    fontSize: isMobile ? 15 : 16,
    fontWeight: '600',
  },
  mealPlanButtonIcon: {
    marginRight: 8,
  },
  // Saved Meal Plan Styles
  savedMealPlanItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  savedMealPlanImage: {
    width: 100,
    height: 100,
  },
  savedMealPlanInfo: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  savedMealPlanName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  savedMealPlanDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  savedMealPlanActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  viewMealPlanText: {
    color: '#007AFF',
    fontSize: 14,
    marginRight: 5,
  },
  noMealPlansContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  noMealPlansText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  generateMealPlanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  generateMealPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Meal Plan Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: isMobile ? '90%' : '80%',
    maxWidth: 800,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeButton: {
    padding: 5,
    marginLeft: 10,
  },
  regeneratePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  regeneratePlanButtonText: {
    color: 'white',
    fontSize: isMobile ? 13 : 14,
    fontWeight: '600',
  },
  savePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  savePlanButtonText: {
    color: 'white',
    fontSize: isMobile ? 13 : 14,
    fontWeight: '600',
  },
  mealPlanScrollView: {
    padding: 15,
  },
  dayPlanContainer: {
    marginBottom: 25,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dayTitle: {
    fontSize: isMobile ? 18 : 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
    backgroundColor: '#e8f4ff',
    padding: 8,
    borderRadius: 8,
  },
  mealContainer: {
    marginBottom: 15,
  },
  mealTypeTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  mealName: {
    fontSize: isMobile ? 14 : 16,
    color: '#333',
    flex: 1,
  },
  mealPlanDetailContainer: {
    width: '100%',
    paddingHorizontal: isMobile ? 10 : 20,
  },
  // Modern meal plan styles
  modernMealPlanContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  modernMealPlanHeader: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  modernHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modernMealPlanTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  modernCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modernMealPlanScrollView: {
    flex: 1,
    padding: 15,
  },
  modernDaySection: {
    marginBottom: 25,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernDayHeader: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  modernDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  modernMealsRow: {
    flexDirection: 'column',
    padding: 10,
  },
  modernMealCard: {
    marginVertical: 8,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modernMealImageContainer: {
    position: 'relative',
  },
  modernMealImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  modernMealTypeTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderTopRightRadius: 8,
  },
  modernMealTypeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modernMealCardContent: {
    padding: 12,
  },
  modernMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modernMealCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  modernViewDetailsText: {
    fontSize: 14,
    color: '#FF5252',
    marginRight: 4,
  },
  // Keep these for compatibility
  savedMealPlanContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  savedMealPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedMealPlanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  savePlanButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  savePlanButtonTextSmall: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  closeButtonSmall: {
    padding: 5,
  },
  savedMealPlanScrollView: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  savedDayContainer: {
    marginVertical: 10,
    marginHorizontal: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  savedDayHeader: {
    backgroundColor: '#e8f4ff',
    padding: 12,
  },
  savedDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  // Enhanced meal plan styles
  enhancedMealPlanContainer: {
    padding: 15,
  },
  enhancedDayContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enhancedDayHeader: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  enhancedDayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  enhancedMealsContainer: {
    padding: 10,
  },
  enhancedMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginVertical: 5,
    backgroundColor: 'white',
    borderRadius: 8,
    borderLeftWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  enhancedMealIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  enhancedMealContent: {
    flex: 1,
  },
  enhancedMealType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 4,
  },
  enhancedMealName: {
    fontSize: 16,
    color: '#333',
  },
  enhancedMealArrow: {
    marginLeft: 8,
  },
  // Keep these for compatibility
  simpleMealPlanContainer: {
    padding: 10,
  },
  simpleMealTypeSection: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  simpleMealTypeHeader: {
    backgroundColor: '#f44336',
    padding: 12,
  },
  simpleMealTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  simpleMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  simpleMealDay: {
    width: 100,
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  simpleMealName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  // Recipe detail styles
  recipeDetailContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  recipeDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  recipeBackButton: {
    padding: 5,
    marginRight: 10,
  },
  recipeDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  recipeDetailScrollView: {
    flex: 1,
  },
  recipeDetailSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recipeDetailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  recipeDetailIngredient: {
    fontSize: 16,
    color: '#555',
    marginBottom: 5,
    lineHeight: 22,
  },
  recipeDetailInstructions: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  // Keep these for compatibility
  savedMealsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  savedMealCard: {
    width: '31%',
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  savedMealCardImage: {
    width: '100%',
    height: 80,
    resizeMode: 'cover',
  },
  savedMealCardContent: {
    padding: 8,
  },
  savedMealCardType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 4,
  },
  savedMealCardName: {
    fontSize: 14,
    color: '#333',
  },
  // Keep these for backward compatibility
  savedMealSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  savedMealTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 10,
  },
  savedMealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 0,
    padding: 0,
  },
  savedMealImage: {
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 15,
  },
  savedMealName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  // Modern meal plan styles
  // Note: All modern meal plan styles are defined elsewhere in the file
  // Removed duplicate properties to avoid errors
  // Note: modernDayHeader, modernDayTitle, and modernMealsRow are defined elsewhere
  // Removed duplicate properties to avoid errors
  // Note: modernMealCard is defined elsewhere in the file
  // Removed duplicate property to avoid errors
  modernMealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5252',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  modernMealIconText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modernMealInfo: {
    flex: 1,
  },
  modernMealType: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
});