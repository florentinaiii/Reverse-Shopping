import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ImageBackground,
    Dimensions,
    Platform,
    ActivityIndicator,
    ScrollView,
    Image,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Recipe } from './index';
import axios from 'axios';
import { auth } from './firebase';

// Import the recipe image mapping from index.tsx
import { recipeImageMap } from './index';

// Helper function to get the correct image source for a recipe
const getRecipeImageSource = (recipe: Recipe) => {
  // First check if we have a mapping for the recipe name
  if (recipe.name && recipeImageMap[recipe.name]) {
    return recipeImageMap[recipe.name];
  }
  // Then check if we have a mapping for the image filename
  else if (recipe.image && typeof recipe.image === 'string' && recipeImageMap[recipe.image]) {
    return recipeImageMap[recipe.image];
  }
  // Then check if the image is already a number (require) or object with uri
  else if (typeof recipe.image === 'number') {
    return recipe.image;
  }
  else if (recipe.image && typeof recipe.image === 'object' && 'uri' in recipe.image) {
    return recipe.image;
  }
  // Fallback to default image
  else {
    return require("../assets/images/recipedd.jpg");
  }
};

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

const SAVED_RECIPES_KEY = '@saved_recipes';

// Translation functionality has been removed

export default function MyRecipesScreen() {
    const router = useRouter();
    const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);


    // Helper function to get API base URL based on platform
    const getApiBaseUrl = () => {
        if (Platform.OS === 'web') {
            return 'http://localhost:5000';
        } else {
            // For iOS simulators
            return 'http://localhost:5000';
            // For Android emulators, you might need:
            // return 'http://10.0.2.2:5000';
            // For physical devices on the same network:
            // return 'http://<your-computer-ip>:5000';
        }
    };

    const loadSavedRecipes = useCallback(async () => {
        setIsLoading(true);
        setViewingRecipe(null);
        
        // Check if user is authenticated
        const currentUser = auth.currentUser;
        if (!currentUser) {
            // If not authenticated, clear saved recipes and don't load anything
            setSavedRecipes([]);
            setIsLoading(false);
            return;
        }
        
        try {
            // First load from local storage for immediate display
            const storedValue = await AsyncStorage.getItem(`${SAVED_RECIPES_KEY}_${currentUser.uid}`);
            let localRecipes: Recipe[] = [];
            
            if (storedValue) {
                const savedRecipesData = JSON.parse(storedValue);
                
                // Check if the data is an array of recipe objects (new format)
                if (savedRecipesData.length > 0 && typeof savedRecipesData[0] === 'object') {
                    localRecipes = savedRecipesData;
                    setSavedRecipes(localRecipes);
                }
            }
            
            // Then try to fetch from backend API
            try {
                const response = await axios.get(`${getApiBaseUrl()}/saved-recipes`);
                console.log('Fetched saved recipes from backend:', response.data);
                
                if (response.data && Array.isArray(response.data)) {
                    // Filter out any recipes with empty or invalid data
                    const validRecipes = response.data.filter((item: any) => {
                        return item && item.name && item.recipeId;
                    });
                    
                    // Map backend format to our Recipe format
                    const backendRecipes = validRecipes.map((item: any) => ({
                        id: item.recipeId,
                        _id: item._id,
                        name: item.name,
                        ingredients: item.perberesit || [],
                        instructions: item.instructions,
                        image: getRecipeImageSource({ name: item.name, image: item.image } as Recipe)
                    }));
                    
                    // Merge backend recipes with local recipes, prioritizing backend
                    // and removing duplicates based on recipe ID
                    const mergedRecipes = [...backendRecipes];
                    
                    // Add any local recipes that aren't in the backend list
                    // Only add valid local recipes with proper IDs and names
                    localRecipes.forEach(localRecipe => {
                        if (localRecipe && localRecipe.id && localRecipe.name && 
                            !mergedRecipes.some(r => r.id === localRecipe.id)) {
                            // Ensure local recipe has all required fields for the merged array type
                            mergedRecipes.push({
                                ...localRecipe,
                                _id: localRecipe._id || localRecipe.id // Use existing _id or fallback to id
                            });
                        }
                    });
                    
                    // Update state and local storage with merged list
                    setSavedRecipes(mergedRecipes);
                    // Store recipes with user ID in the key to keep them separate per user
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        await AsyncStorage.setItem(`${SAVED_RECIPES_KEY}_${currentUser.uid}`, JSON.stringify(mergedRecipes));
                    }
                }
            } catch (apiError) {
                console.error('Failed to fetch saved recipes from API:', apiError);
                // If API fails, we still have the local recipes displayed
            }
        } catch (e) {
            console.error("Failed to load saved recipes", e);
            setSavedRecipes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Check authentication status when component mounts
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setIsAuthenticated(!!user);
            
            // If not authenticated, clear saved recipes and redirect to auth page
            if (!user) {
                // Clear saved recipes from state
                setSavedRecipes([]);
                
                // Show message with button to redirect to login
                Alert.alert(
                    'Sign Up or Log In', 
                    'Please sign up or log in to view saved recipes.',
                    [
                        { 
                            text: 'Cancel', 
                            style: 'cancel',
                            onPress: () => router.replace('/')
                        },
                        { 
                            text: '→ Go to Login', 
                            onPress: () => router.push('/auth')
                        }
                    ]
                )
            }
        });
        
        return () => unsubscribe();
    }, [router]);
    
    // Set up an interval to check for updates
    useEffect(() => {
        // Check for updates immediately when the component mounts
        const checkForUpdates = async () => {
            try {
                const timestampStr = await AsyncStorage.getItem(SAVED_RECIPES_KEY + '_timestamp');
                if (timestampStr) {
                    const timestamp = parseInt(timestampStr);
                    const currentTimestamp = new Date().getTime();
                    // If the timestamp is newer than 2 seconds ago, refresh the data
                    if (currentTimestamp - timestamp < 5000) {
                        console.log('Detected recent saved recipe updates, refreshing...');
                        loadSavedRecipes();
                    }
                }
            } catch (e) {
                console.error('Error checking for updates:', e);
            }
        };
        
        // Set up an interval to check for updates every 2 seconds
        const intervalId = setInterval(checkForUpdates, 2000);
        
        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [loadSavedRecipes]);
    
    // Also load recipes when the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadSavedRecipes();
            return () => { };
        }, [loadSavedRecipes])
    );

    const handleUnsave = async (recipe: Recipe) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
            // First update local storage and state for immediate feedback
            const storageKey = `${SAVED_RECIPES_KEY}_${currentUser.uid}`;
            const storedValue = await AsyncStorage.getItem(storageKey);
            let savedRecipesData = storedValue ? JSON.parse(storedValue) : [];

            // Filter out the recipe to be removed
            const updatedRecipes = savedRecipesData.filter((r: Recipe) => r.id !== recipe.id);
            setSavedRecipes(updatedRecipes);

            // Save the updated recipes back to AsyncStorage
            await AsyncStorage.setItem(storageKey, JSON.stringify(updatedRecipes));
            
            // Store timestamp of this change to trigger sync in Home screen
            await AsyncStorage.setItem(`${SAVED_RECIPES_KEY}_${currentUser.uid}_timestamp`, new Date().getTime().toString());
                
            // Then try to remove from backend API if we have a MongoDB ID
            if (recipe._id) {
                try {
                    await axios.delete(`${getApiBaseUrl()}/saved-recipes/${recipe._id}`);
                    console.log('Recipe removed from backend:', recipe.name);
                } catch (backendError) {
                    console.error('Failed to remove recipe from backend:', backendError);
                    // Continue with local removal even if backend fails
                }
            }
            
            // Show a brief confirmation message
            Alert.alert('Sukses', 'Receta u hoq nga të preferuarat');
        } catch (e) {
            console.error("Failed to update storage after unsaving", e);
            Alert.alert('Gabim', 'Ndodhi një gabim gjatë heqjes së recetës');
            loadSavedRecipes(); // Reload to ensure UI is in sync with storage
        }
    };

    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    const handleShowDetails = (recipe: Recipe) => {
        setViewingRecipe(recipe);
    };

    const handleBackToList = () => {
        setViewingRecipe(null);
    };



    if (isLoading) {
        return (
            <ImageBackground source={require("../assets/images/back.jpg")} style={styles.background} resizeMode="cover">
                <View style={styles.backgroundOverlay} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Duke ngarkuar Recetat e Ruajtura...</Text>
                </View>
            </ImageBackground>
        );
    }

    return (
        <ImageBackground
            source={require("../assets/images/recipedd.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.backgroundOverlay} />

            {viewingRecipe ? (
                <ScrollView style={styles.detailScrollContainer} contentContainerStyle={styles.scrollContentContainer}>
                    <View style={styles.detailHeaderContainer}>
                        <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.detailTitle} numberOfLines={1} ellipsizeMode='tail'>
                            {viewingRecipe.name}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handleUnsave(viewingRecipe)}
                            style={styles.detailHeartButton}
                        >
                            <Ionicons name="trash-outline" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailContentWrapper}>
                        <View style={styles.detailTopRowContainer}>
                            <View style={styles.detailImageContainer}>
                                <Image
                                    source={getRecipeImageSource(viewingRecipe)}
                                    style={styles.detailImage}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.detailIngredientsContainer}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Përbërësit</Text>
                                    {viewingRecipe.ingredients.map((ingredient, index) => (
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
                                    {viewingRecipe.instructions}
                                </Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            ) : (
                <ScrollView style={styles.listScrollContainer} contentContainerStyle={styles.scrollContentContainer}>
                    <View style={styles.container}>
                        <View style={styles.detailHeaderContainer}>
                            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.detailTitle} numberOfLines={1} ellipsizeMode='tail'>
                                Recetat e ruajtura
                            </Text>
                            <View style={styles.headerPlaceholderRight} />
                        </View>

                        {savedRecipes.length === 0 ? (
                            <View style={styles.centeredEmpty}>
                                <Ionicons name="archive-outline" size={60} color="#ccc" />
                                <Text style={styles.noRecipesText}>Nuk keni asnjë recetë të ruajtur</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={savedRecipes}
                                keyExtractor={(item) => item.id}
                                numColumns={isMobile ? 2 : 4}
                                columnWrapperStyle={styles.columnWrapper}
                                style={styles.flatListStyle}
                                contentContainerStyle={styles.listContainerPadding}
                                scrollEnabled={false}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.recipeCard}
                                        onPress={() => handleShowDetails(item)}
                                        activeOpacity={0.8}
                                    >
                                        <ImageBackground
                                            source={getRecipeImageSource(item)}
                                            style={styles.recipeImage}
                                            imageStyle={styles.imageStyle}
                                        >
                                            <TouchableOpacity
                                                style={styles.heartButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleUnsave(item);
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={24} color="white" />
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
                                key={isMobile ? 'mobile-columns' : 'desktop-columns'}
                            />
                        )}
                    </View>
                </ScrollView>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: { flex: 1, width: "100%" },
    backgroundOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: {
        marginTop: 15, fontSize: 16, color: '#333', backgroundColor: 'rgba(255,255,255,0.7)',
        paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5,
    },
    centeredEmpty: {
        flex: 1, width: '100%', paddingVertical: 80, alignItems: 'center', justifyContent: 'center',
        minHeight: height * 0.5,
    },
    noRecipesText: {
        fontSize: 18, color: '#444', textAlign: 'center', marginTop: 15,
        backgroundColor: 'rgba(255,255,255,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5,
    },
    listScrollContainer: { flex: 1 },
    detailScrollContainer: { flex: 1 },
    scrollContentContainer: { paddingBottom: 40, flexGrow: 1 },
    container: {
        flex: 1,
        paddingHorizontal: isMobile ? 15 : 30,
        paddingTop: 0,
        maxWidth: 1300,
        alignSelf: 'center',
        width: '100%',
        alignItems: 'center',
    },
    detailContentWrapper: {
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
    detailHeartButton: {
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
    flatListStyle: {
        alignSelf: 'center',
        paddingHorizontal: 5,
        width: '100%',
    },
    listContainerPadding: {
        paddingBottom: 0
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
    heartButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 6,
        zIndex: 10,
    },
});