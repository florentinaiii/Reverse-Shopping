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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from './firebase';

const { width } = Dimensions.get('window');
const isMobile = width < 768;

// Custom Authentication Modal Component
interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onLogin: () => void;
}

const AuthModal = ({ visible, onClose, onLogin }: AuthModalProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  if (!visible) return null;
  
  const handleAuth = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(auth, email, password);
        onClose(); // Close modal on successful login
      } else {
        // Register
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Update profile with username if provided
        if (username && userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: username
          });
        }
        onClose(); // Close modal on successful registration
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setErrorMessage(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>
          {isLogin ? 'Kyçu në llogari' : 'Krijo llogari'}
        </Text>
        
        {!isLogin && (
          <TextInput
            placeholder="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />
        )}
        
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Fjalëkalimi"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={24} 
              color="#007AFF" 
            />
          </TouchableOpacity>
        </View>
        
        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
        
        <TouchableOpacity 
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]} 
          onPress={handleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <Text style={styles.btnText}>Loading...</Text>
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.btnText}>{isLogin ? 'Kyçu' : 'Regjistrohu'}</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchTextContent}>
            {isLogin
              ? 'Nuk ke llogari? Regjistrohu'
              : 'Ke llogari? Kyçu këtu'}
          </Text>
        </TouchableOpacity>
        
        {isLogin && (
          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
        >
          <Ionicons name="close-circle" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ======== INTERFACE DHE TË DHËNA ========

export interface Recipe {
  id: string;
  _id?: string;  // MongoDB ID field
  name: string;
  ingredients: string[];
  perberesit?: string[];  // Albanian ingredients field from MongoDB
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

// We've removed the translation dictionary and API functionality

// We're using MongoDB exclusively - no local data

// API base URL - adjust based on platform
const getApiBaseUrl = () => {
  // For development environments
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access the host machine's localhost
      return 'http://10.0.2.2:5000';
    } else if (Platform.OS === 'ios') {
      // iOS simulator
      return 'http://localhost:5000';
    } else {
      // Web in development
      return 'http://localhost:5000';
    }
  } else {
    // Production environment - use your actual server address
    // If you're hosting your server on a service like Heroku, Render, etc.
    return 'https://reverse-shopping-api.onrender.com';
    // Fallback to local network IP if needed
    // return 'http://192.168.1.X:5000'; // Replace X with your actual IP
  }
};

// Funksioni për kërkimin e recetave nga API
const kerkoReceta = async (ingredients: string): Promise<Recipe[]> => {
  try {
    const baseUrl = getApiBaseUrl();
    console.log('Using API base URL:', baseUrl);
    
    if (!ingredients || ingredients.trim() === '') {
      // Get all recipes from the API instead of using local recipes
      console.log('Fetching all recipes from:', `${baseUrl}/recipes`);
      const response = await axios.get(`${baseUrl}/recipes`);
      console.log('API Response status:', response.status);
      console.log('API Response data type:', typeof response.data);
      console.log(`Fetched ${response.data ? response.data.length : 0} recipes from MongoDB`);
      
      if (response.data && response.data.length > 0) {
        console.log('Sample recipe from API:', response.data[0]);
      } else {
        console.log('No recipes returned from API');
      }
      
      return mapApiRecipesToLocal(response.data || []);
    }

    // Clean and prepare the search terms
    const cleanedIngredients = ingredients
      .split(',')
      .map(term => term.trim())
      .filter(term => term.length > 0)
      .join(',');
      
    // Make API call to the backend search endpoint with properly encoded parameters
    console.log('Searching recipes with ingredients:', cleanedIngredients);
    const encodedQuery = encodeURIComponent(cleanedIngredients);
    const response = await axios.get(`${baseUrl}/recipes/search?q=${encodedQuery}`);
    
    console.log('API search results status:', response.status);
    console.log('API search results count:', response.data ? response.data.length : 0);
    console.log('Search terms used:', cleanedIngredients);
    
    // Map the API response to our Recipe interface
    return mapApiRecipesToLocal(response.data);
  } catch (error) {
    console.error('Error searching recipes from API:', error);
    Alert.alert('Error', 'Could not connect to recipe database. Please try again later.');
    return [];
  }
};

// Image mapping for recipes
export const recipeImageMap: Record<string, any> = {
  // Core recipes by filename
  'tavekosi.jpg': require("../assets/images/tavekosi.jpg"),
  'byrekmespinaq.jpg': require("../assets/images/byrekmespinaq.jpg"),
  'fergesetirane.jpg': require("../assets/images/fergesetirane.jpg"),
  'lakrorpresh.jpg': require("../assets/images/lakrorpresh.jpg"),
  'qofteferguara.jpg': require("../assets/images/qofteferguara.jpg"),
  'vegpizza.jpg': require("../assets/images/vegpizza.jpg"),
  'pastacarbonara.jpg': require("../assets/images/pastacarbonara.jpg"),
  'gjelle.jpg': require("../assets/images/gjelle.jpg"),
  'petulla.jpg': require("../assets/images/petulla.jpg"),
  'spacar.jpg': require("../assets/images/spacar.jpg"),
  'pitemespinaq.jpg': require("../assets/images/byrekmespinaq.jpg"),
  'pitekungull.jpg': require("../assets/images/byrekmespinaq.jpg"),
  'musaka.jpg': require("../assets/images/gjellemepatate.jpg"),
  'trahana.jpg': require("../assets/images/supe.jpg"),
  'revani.jpg': require("../assets/images/trilece.jpg"),
  'qebapa.jpg': require("../assets/images/qebapa.jpg"),
  'sarma.jpg': require("../assets/images/janimefasule.jpg"),
  'japrak.jpg': require("../assets/images/janimefasule.jpg"),
  'flija.jpg': require("../assets/images/byrekmeqepe.jpg"),
  'tavepeshku.jpg': require("../assets/images/tavedheu.jpg"),
  'specatembushur.jpg': require("../assets/images/patellxhanetembushur.jpg"),
  
  // Map by recipe name for all recipes
  'Tavë Kosi': require("../assets/images/tavekosi.jpg"),
  'Byrek me Spinaq': require("../assets/images/byrekmespinaq.jpg"),
  'Fërgesë Tirane': require("../assets/images/fergesetirane.jpg"),
  'Lakror me Presh': require("../assets/images/lakrorpresh.jpg"),
  'Qofte të Fërguara': require("../assets/images/qofteferguara.jpg"),
  'Pica Vegjetariane': require("../assets/images/vegpizza.jpg"),
  'Pasta Carbonara': require("../assets/images/pastacarbonara.jpg"),
  'Musaka Shqiptare': require("../assets/images/gjellemepatate.jpg"),
  'Trahana me Pulë': require("../assets/images/supe.jpg"),
  'Petulla me Mjaltë': require("../assets/images/petulla.jpg"),
  'Speca të Mbushur': require("../assets/images/patellxhanetembushur.jpg"),
  'Revani': require("../assets/images/trilece.jpg"),
  'Japrak me Gjethe Rrushi': require("../assets/images/janimefasule.jpg"),
  'Flija': require("../assets/images/byrekmeqepe.jpg"),
  'Tavë Peshku me Perime': require("../assets/images/tavedheu.jpg"),
  'Speca të Mbushur me Oriz': require("../assets/images/patellxhanetembushur.jpg"),
  'Qebapa': require("../assets/images/qebapa.jpg"),
  'Sarma': require("../assets/images/janimefasule.jpg"),
  'Gjellë me Mish dhe Patate': require("../assets/images/gjellemepatate.jpg"),
  'Pite me Kungull': require("../assets/images/byrekmespinaq.jpg"),
  'Pite me Spinaq': require("../assets/images/byrekmespinaq.jpg"),
};

// Helper function to map MongoDB recipe format to our local Recipe interface
const mapApiRecipesToLocal = (apiRecipes: any[]): Recipe[] => {
  return apiRecipes.map((recipe: any) => {
    // Get the appropriate image based on the image filename or recipe name
    let imageSource;
    
    // First check if we have a mapping for the recipe name
    if (recipe.name && recipeImageMap[recipe.name]) {
      imageSource = recipeImageMap[recipe.name];
      console.log('Image mapped by name for:', recipe.name);
    }
    // Then check if we have a mapping for the image filename
    else if (recipe.image && typeof recipe.image === 'string' && recipeImageMap[recipe.image]) {
      imageSource = recipeImageMap[recipe.image];
      console.log('Image mapped by filename for:', recipe.name, recipe.image);
    }
    // Fallback to default image
    else {
      imageSource = require("../assets/images/recipedd.jpg");
      console.log('Using default image for:', recipe.name);
    }
    
    return {
      id: recipe._id || recipe.id || String(Math.random()),
      name: recipe.name,
      ingredients: recipe.perberesit || [], 
      instructions: recipe.instructions,
      image: imageSource
    };
  });
};

// We've removed the local search fallback function as we're now fully using MongoDB

// Function to fetch all recipes from MongoDB
const fetchAllRecipes = async (): Promise<Recipe[]> => {
  try {
    console.log('Fetching all recipes from MongoDB...');
    console.log('API URL:', `${getApiBaseUrl()}/recipes`);
    const response = await axios.get(`${getApiBaseUrl()}/recipes`);
    console.log('API Response:', response);
    console.log(`Fetched ${response.data ? response.data.length : 0} recipes from MongoDB`);
    return mapApiRecipesToLocal(response.data || []);
  } catch (error) {
    console.error('Error fetching recipes from MongoDB:', error);
    Alert.alert('Error', 'Could not connect to recipe database. Please try again later.');
    return [];
  }
};

export default function App() {
  const [searchText, setSearchText] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  
  const [fontsLoaded] = useFonts({
    Satisfy_400Regular,
  });

  const router = useRouter();

  // Load saved recipes from AsyncStorage based on authentication state
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // User is logged in, load their saved recipes
          const savedRecipesJson = await AsyncStorage.getItem(`${SAVED_RECIPES_KEY}_${user.uid}`);
          if (savedRecipesJson) {
            const savedRecipesArray = JSON.parse(savedRecipesJson);
            setSavedRecipes(savedRecipesArray);
            // Extract IDs for backward compatibility
            const savedIds = savedRecipesArray.map((recipe: Recipe) => recipe.id);
            setSavedRecipeIds(savedIds);
          }
          
          // Also get the current timestamp for future sync checks
          const timestamp = await AsyncStorage.getItem(`${SAVED_RECIPES_KEY}_${user.uid}_timestamp`);
          setLastSyncTimestamp(timestamp);
        } else {
          // User is not logged in, clear saved recipes
          setSavedRecipes([]);
          setSavedRecipeIds([]);
          setLastSyncTimestamp(null);
        }
      } catch (error) {
        console.error('Error loading saved recipes:', error);
      } finally {
        setIsLoadingStorage(false);
      }
    });
    
    // Clean up the listener when component unmounts
    return () => unsubscribe();
  }, []);

  // No useEffect to load recipes on startup - we only want to show recipes when searching

  // Function to check for updates to saved recipes from other screens
  const checkForSavedRecipesUpdates = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      // Get the last sync timestamp from state
      const currentTimestamp = lastSyncTimestamp;
      
      // Get the latest timestamp from AsyncStorage
      const latestTimestampStr = await AsyncStorage.getItem(`${SAVED_RECIPES_KEY}_${currentUser.uid}_timestamp`);
      
      // If no timestamp exists or it's the same as our last sync, no need to update
      if (!latestTimestampStr || latestTimestampStr === currentTimestamp) return;
      
      console.log('Saved recipes timestamp changed, reloading saved recipes');
      
      // Update our last sync timestamp
      setLastSyncTimestamp(latestTimestampStr);
      
      // Load the updated saved recipes
      const savedRecipesJson = await AsyncStorage.getItem(`${SAVED_RECIPES_KEY}_${currentUser.uid}`);
      if (savedRecipesJson) {
        const savedRecipesArray = JSON.parse(savedRecipesJson);
        setSavedRecipes(savedRecipesArray);
        // Extract IDs for compatibility
        const savedIds = savedRecipesArray.map((recipe: Recipe) => recipe.id);
        setSavedRecipeIds(savedIds);
      } else {
        // No saved recipes found, clear the arrays
        setSavedRecipes([]);
        setSavedRecipeIds([]);
      }
    } catch (error) {
      console.error('Error checking for saved recipes updates:', error);
    }
  };
  
  // Check for updates when the app regains focus
  useEffect(() => {
    // Set up a focus listener to check for updates when the screen is focused
    const intervalId = setInterval(() => {
      // Only check when we're on the home screen (not viewing a recipe)
      if (!selectedRecipe) {
        checkForSavedRecipesUpdates();
      }
    }, 2000); // Check every 2 seconds
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, [selectedRecipe, lastSyncTimestamp]);

  const toggleSavedRecipe = async (recipe: Recipe) => {
  try {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    console.log('Authentication check - Current user:', currentUser ? 'Logged in' : 'Not logged in');
    console.log('Recipe already saved:', savedRecipeIds.includes(recipe.id));
    
    // If trying to add a recipe and not logged in, show message with login button
    if (!currentUser && !savedRecipeIds.includes(recipe.id)) {
      console.log('Showing authentication alert');
      // Show message with button to redirect to login
      Alert.alert(
        'Authentication Required', 
        'Please sign up or log in to save this recipe.', 
        [
          { 
            text: 'Log In', 
            onPress: () => {
              console.log('Log In button pressed, redirecting to /auth');
              router.push('/auth');
            },
            style: 'default'
          },
          { 
            text: 'Cancel',
            style: 'cancel'
          }
        ],
        { cancelable: true }
      );
      return;
    }
    
    let newSavedRecipes: Recipe[];
    let newSavedIds: string[];
    
    if (savedRecipeIds.includes(recipe.id)) {
      // Remove from saved
      newSavedRecipes = savedRecipes.filter(r => r.id !== recipe.id);
      newSavedIds = savedRecipeIds.filter(id => id !== recipe.id);
      
      // Remove from backend if we have a MongoDB ID
      if (recipe._id) {
        try {
          await axios.delete(`${getApiBaseUrl()}/saved-recipes/${recipe._id}`);
          console.log('Recipe removed from backend:', recipe.name);
        } catch (backendError) {
          console.error('Failed to remove recipe from backend:', backendError);
          // Continue with local removal even if backend fails
        }
      }
    } else {
      // Add to saved
      newSavedRecipes = [...savedRecipes, recipe];
      newSavedIds = [...savedRecipeIds, recipe.id];
      
      // Save to backend
      try {
        const recipeToSave = {
          recipeId: recipe._id || recipe.id,
          name: recipe.name,
          perberesit: recipe.ingredients,
          instructions: recipe.instructions,
          image: typeof recipe.image === 'number' ? '' : recipe.image
        };
        
        const response = await axios.post(`${getApiBaseUrl()}/saved-recipes`, recipeToSave);
        console.log('Recipe saved to backend:', response.data);
        
        // Update the recipe with the backend ID
        if (response.data._id) {
          const updatedRecipe = {...recipe, _id: response.data._id};
          newSavedRecipes = newSavedRecipes.map(r => 
            r.id === recipe.id ? updatedRecipe : r
          );
        }
      } catch (backendError) {
        console.error('Failed to save recipe to backend:', backendError);
        // Continue with local save even if backend fails
      }
    }
    
    setSavedRecipes(newSavedRecipes);
    setSavedRecipeIds(newSavedIds);
    
    // Store in AsyncStorage with a timestamp to ensure real-time updates
    const savedData = {
      recipes: newSavedRecipes,
      timestamp: new Date().getTime()
    };
    
    // Store recipes with user ID in the key to keep them separate per user
    if (currentUser) {
      await AsyncStorage.setItem(`${SAVED_RECIPES_KEY}_${currentUser.uid}`, JSON.stringify(newSavedRecipes));
      
      // Also store the last update timestamp separately for real-time sync
      await AsyncStorage.setItem(`${SAVED_RECIPES_KEY}_${currentUser.uid}_timestamp`, new Date().getTime().toString());
    }
    
    // Show feedback to user
    if (savedRecipeIds.includes(recipe.id)) {
      Alert.alert('Sukses', 'Receta u hoq nga të preferuarat');
    } else {
      Alert.alert('Sukses', 'Receta u shtua te të preferuarat');
    }
  } catch (error) {
    console.error('Error saving recipe:', error);
    Alert.alert('Gabim', 'Ndodhi një gabim gjatë ruajtjes së recetës');
  }
};

  const handleSearch = async () => {
    setHasSearched(true);
    setIsSearching(true);
    
    if (!searchText.trim()) {
      Alert.alert('Kujdes', 'Ju lutemi shkruani të paktën një përbërës për të kërkuar.');
      setIsSearching(false);
      return;
    }
    
    try {
      const results = await kerkoReceta(searchText);
      setRecipes(results);
    } catch (error) {
      console.error('Error searching recipes:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë kërkimit të recetave.');
      setRecipes([]);
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
        router={router}
      />
    );
  }

  return (
    <HomePage
      onSelectRecipe={setSelectedRecipe}
      searchQuery={searchText}
      setSearchQuery={setSearchText}
      onSearch={handleSearch}
      filteredRecipes={recipes}
      setFilteredRecipes={setRecipes}
      hasSearched={hasSearched}
      setHasSearched={setHasSearched}
      savedRecipeIds={savedRecipeIds}
      toggleSavedRecipe={toggleSavedRecipe}
      isSearching={isSearching}
      setIsSearching={setIsSearching}
      isLoading={isLoading}
      router={router} // Pass router as a prop
    />
  );
}

export interface HomePageProps {
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
  setIsSearching: (value: boolean) => void;
  isLoading: boolean;
  router: any; // Add router prop
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
  setIsSearching,
  isLoading,
  router
}: HomePageProps) {
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [recipeToSave, setRecipeToSave] = useState<Recipe | null>(null);

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

  // Render recipe list
  const renderRecipeList = () => {
    if (isSearching) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 30 }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 15, fontSize: 16, color: '#555' }}>
            Duke kërkuar recetat...
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.searchHelpText}>
            Shkruani përbërësit që keni në dispozicion, të ndara me presje. Do të shfaqen recetat që përmbajnë TË GJITHË përbërësit e specifikuar.
          </Text>
        </View>
      );
    }

    // Show no results message only when a search has been performed and no recipes were found
    if (filteredRecipes.length === 0 && hasSearched) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 }}>
          <Ionicons name="sad-outline" size={60} color="#888" />
          <Text style={{ marginTop: 15, fontSize: 18, color: '#555', textAlign: 'center', paddingHorizontal: 30 }}>
            Nuk u gjetën receta me këta përbërës.
            Provoni të kërkoni me përbërës të tjerë ose kontrolloni drejtshkrimin.
          </Text>
        </View>
      );
    }

    // Show recipes when we have search results
    return (
      <>
        {/* Only show the "Recetat me:" section after a search has been performed */}
        {hasSearched && (
          <View style={styles.searchResultsHeader}>
            <Text style={styles.searchResultsTitle}>
              Recetat me: <Text style={styles.searchedIngredients}>{searchQuery}</Text>
            </Text>
            <Text style={styles.resultsCount}>{filteredRecipes.length} receta</Text>
          </View>
        )}
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          numColumns={isMobile ? 2 : 4}
          columnWrapperStyle={styles.columnWrapper}
          style={styles.flatListContent}
          contentContainerStyle={styles.listContentPadding}
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
                    console.log('HomePage - Heart button pressed for recipe:', item.name);
                    // Check if user is logged in
                    const currentUser = auth.currentUser;
                    console.log('HomePage - Authentication check - Current user:', currentUser ? 'Logged in' : 'Not logged in');
                    console.log('HomePage - Recipe already saved:', savedRecipeIds.includes(item.id));
                    
                    // If trying to save (not already saved) and not logged in
                    if (!currentUser && !savedRecipeIds.includes(item.id)) {
                      console.log('HomePage - Showing authentication modal');
                      // Show custom modal instead of Alert
                      setRecipeToSave(item);
                      setAuthModalVisible(true);
                      return; // Stop execution here
                    }
                    
                    console.log('HomePage - Calling toggleSavedRecipe');
                    // User is logged in or removing from saved
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
        />
      </>
    );
  };

  return (
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      showsVerticalScrollIndicator={false}
    >
      <ImageBackground source={require("../assets/images/background.jpg")} style={styles.background} resizeMode="cover">
        <View style={styles.backgroundOverlay} />
        
        {/* Authentication Modal */}
        <AuthModal 
          visible={authModalVisible} 
          onClose={() => setAuthModalVisible(false)} 
          onLogin={() => {
            // Login is now handled directly in the AuthModal component
            // No need to redirect to /auth
            console.log('AuthModal - Login handled directly in the modal');
          }}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
        {!hasSearched && (
          <View style={styles.headerContainer}>
            <Text style={styles.appTitle}>REVERSE SHOPPING</Text>
            <Text style={styles.appSubtitle}>Zbulo receta të reja dhe krijo magji në kuzhinë.</Text>
          </View>
        )}

        <View style={[styles.searchContainer, hasSearched && styles.searchContainerSmall]}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Kërko sipas përbërësve (p.sh. domate, mish)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={onSearch}
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
          <Text style={styles.searchHelpText}></Text>
          
          {/* Show All Recipes button */}
          <TouchableOpacity 
            style={styles.showAllButton} 
            onPress={async () => {
              setIsSearching(true);
              try {
                const allRecipes = await fetchAllRecipes();
                setFilteredRecipes(allRecipes);
                // Show recipes but hide the "Recipes with:" section
                setHasSearched(false);
              } catch (error) {
                console.error('Error fetching all recipes:', error);
                Alert.alert('Gabim', 'Ndodhi një gabim gjatë marrjes së recetave.');
              } finally {
                setIsSearching(false);
              }
            }}
          >
            <Ionicons name="grid-outline" size={18} color="white" style={{marginRight: 8}} />
            <Text style={styles.showAllButtonText}>Shfaq të gjitha recetat</Text>
          </TouchableOpacity>
        </View>

        {/* Suggestions container removed to eliminate white line when typing */}

        {renderRecipeList()}
      </KeyboardAvoidingView>
    </ImageBackground>
    </ScrollView>
  );
}

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  toggleSavedRecipe: () => void;
  isSaved: boolean;
  router: any;
}

function RecipeDetail({ recipe, onBack, toggleSavedRecipe, isSaved, router }: RecipeDetailProps) {
  const [authModalVisible, setAuthModalVisible] = useState(false);
  
  // Function to handle heart button press with authentication check
  const handleSaveRecipe = () => {
    // Check if user is logged in
    const currentUser = auth.currentUser;
    console.log('RecipeDetail - Authentication check - Current user:', currentUser ? 'Logged in' : 'Not logged in');
    console.log('RecipeDetail - Recipe already saved:', isSaved);
    
    // If trying to save (not already saved) and not logged in
    if (!currentUser && !isSaved) {
      console.log('RecipeDetail - Showing authentication modal');
      // Show custom modal instead of Alert
      setAuthModalVisible(true);
      return; // Stop execution here to prevent toggleSavedRecipe from being called
    }
    
    console.log('RecipeDetail - Calling toggleSavedRecipe');
    // User is logged in or removing from saved
    toggleSavedRecipe();
  };

  // ... (rest of the code remains the same)
  return (
    <ImageBackground source={require("../assets/images/recipedd.jpg")} style={styles.bbackground} resizeMode="cover">
      <View style={styles.backgroundOverlay} />
      
      {/* Authentication Modal */}
      <AuthModal 
        visible={authModalVisible} 
        onClose={() => setAuthModalVisible(false)} 
        onLogin={() => {
          // Login is now handled directly in the AuthModal component
          // No need to redirect to /auth
          console.log('RecipeDetail - Login handled directly in the modal');
        }}
      />
      <ScrollView style={styles.detailScrollContainer} contentContainerStyle={styles.detailScrollContentContainer}>
        <View style={styles.detailHeaderContainer}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.detailTitle} numberOfLines={1} ellipsizeMode='tail'>
            {recipe.name}
          </Text>
          <TouchableOpacity
            onPress={handleSaveRecipe}
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

// ======== STILET ========
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: isMobile ? '80%' : '28%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    alignItems: 'center',
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: '#007AFF',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#444',
  },
  btnPrimary: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
    width: '100%',
  },
  btnText: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 17,
    marginLeft: 8,
  },
  switchText: {
    marginTop: 16,
    padding: 8,
  },
  switchTextContent: {
    color: '#007AFF',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: '100%',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
  btnDisabled: {
    opacity: 0.7,
    backgroundColor: '#999',
  },
  forgotPasswordText: {
    color: '#007AFF',
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
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
    paddingTop: isMobile ? 100 : 50,
    marginBottom: 15,
    maxWidth: 1200,
    alignSelf: 'center',
  },
  appTitle: {
    fontSize: isMobile ? 38 : 48,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    letterSpacing: 1.5,
    fontFamily: 'Satisfy',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  appSubtitle: {
    fontSize: isMobile ? 18 : 22,
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
    paddingTop: 5,
    maxWidth: '80%',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  searchContainer: {
    marginBottom: 15,
    paddingTop: 0,
    paddingBottom: 5,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: isMobile ? 15 : 80,
  },
  searchContainerSmall: {
    marginBottom: 15,
    paddingTop: 15,
    paddingBottom: 10,
    paddingHorizontal: isMobile ? 15 : 80,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: isMobile ? 6 : 8,
    width: "100%",
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  searchHelpText: {
    fontSize: isMobile ? 12 : 13,
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 5,
    maxWidth: 450,
    alignSelf: 'center',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  searchResultsHeader: {
    marginBottom: 15,
    paddingHorizontal: 12,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  searchResultsTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  searchedIngredients: {
    fontWeight: '600',
    color: '#3b82f6',
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(59, 130, 246, 0.3)',
  },
  resultsCount: {
    fontSize: isMobile ? 13 : 14,
    color: '#555',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  searchIcon: { 
    marginRight: 8,
    color: '#3b82f6',
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: isMobile ? 14 : 16,
    color: "#333",
    paddingVertical: 6,
    fontWeight: '400',
  },
  searchButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 20,
    padding: 8,
    marginLeft: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
  },
  clearButton: {
    padding: 4,
    marginRight: 4,
  },
  // Removed suggestionsContainer to eliminate white line when typing
  suggestionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  showAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    transform: [{ scale: 1 }],
  },
  recipeImage: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  imageStyle: {
    borderRadius: 16,
  },
  imageOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: isMobile ? 12 : 15,
    paddingVertical: isMobile ? 10 : 12,
    height: 95,
    paddingBottom: 10
  },
  recipeName: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  recipeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  viewRecipeText: {
    color: 'rgba(255,255,255, 1)',
    fontSize: isMobile ? 13 : 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  noResults: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 18,
    color: "#555",
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 20,
    borderRadius: 12,
    maxWidth: 500,
    alignSelf: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    fontStyle: 'italic',
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
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