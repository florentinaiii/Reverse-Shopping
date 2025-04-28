<<<<<<< HEAD
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
=======
import React, { useState, useCallback } from 'react';
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
    ScrollView, // Do ta përdorim më shumë tani
    Image // Importo Image për pamjen e detajeve
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
// Sigurohu që importi është korrekt
import { exampleRecipes, Recipe } from './index';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

const SAVED_RECIPES_KEY = '@saved_recipes';

export default function MyRecipesScreen() {
    const router = useRouter();
    const [savedRecipeDetails, setSavedRecipeDetails] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null); // <-- STATE I RI

    // Funksioni për ngarkimin dhe filtrimin (mbetet i njëjtë)
    const loadAndFilterRecipes = useCallback(async () => {
        setIsLoading(true);
        // Reset pamjen e detajeve kur lista rifreskohet (opsionale, por e logjikshme)
        setViewingRecipe(null);
        console.log("MyRecipesScreen: Loading saved recipes...");
        try {
            const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
            const savedIds: string[] = storedValue ? JSON.parse(storedValue) : [];
            console.log("MyRecipesScreen: Found saved IDs:", savedIds);
            const details = exampleRecipes.filter(recipe => savedIds.includes(recipe.id));
            setSavedRecipeDetails(details);
            console.log("MyRecipesScreen: Filtered recipe details count:", details.length);
        } catch (e) {
            console.error("MyRecipesScreen: Failed to load or filter saved recipes", e);
            setSavedRecipeDetails([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(loadAndFilterRecipes);

    // Funksioni për heqjen e recetës (mbetet i njëjtë, vepron mbi listë)
    const handleUnsave = async (recipeId: string) => {
        console.log("MyRecipesScreen: Attempting to unsave recipe:", recipeId);
        const updatedDetails = savedRecipeDetails.filter(recipe => recipe.id !== recipeId);
        setSavedRecipeDetails(updatedDetails);

        let currentSavedIds: string[] = [];
        try {
            const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
            currentSavedIds = storedValue ? JSON.parse(storedValue) : [];
        } catch (e) {
            console.error("MyRecipesScreen: Failed to read saved recipes before unsaving", e);
            loadAndFilterRecipes();
            return;
        }
        const newSavedIds = currentSavedIds.filter(id => id !== recipeId);
        try {
            await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(newSavedIds));
            console.log("MyRecipesScreen: Successfully updated storage after unsaving.");
        } catch (e) {
            console.error("MyRecipesScreen: Failed to update storage after unsaving", e);
            setSavedRecipeDetails(exampleRecipes.filter(r => currentSavedIds.includes(r.id)));
            alert("Problem gjatë heqjes së recetës nga memoria.");
        }
    };

    // Funksioni për t'u kthyer mbrapa NGA EKRANI (jo nga detajet te lista)
    const handleGoBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/');
        }
    };

    // FUNKSIONI I RI: Për të shfaqur detajet e një recete
    const handleShowDetails = (recipeId: string) => {
        const recipeToShow = savedRecipeDetails.find(r => r.id === recipeId);
        if (recipeToShow) {
            console.log("Showing details for:", recipeToShow.name);
            setViewingRecipe(recipeToShow); // Vendos recetën në state për t'u parë
        } else {
            console.error("Recipe not found in saved details for ID:", recipeId);
            alert("Receta nuk u gjet.");
        }
    };

    // FUNKSIONI I RI: Për t'u kthyer nga pamja e detajeve te lista
    const handleBackToList = () => {
        console.log("Returning to list view.");
        setViewingRecipe(null); // Pastron state-in, duke shfaqur listën
    };


    // --- RENDERIMI ---

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

    // --- PAMJA KRYESORE ---
    return (
        <ImageBackground
            // Mund të përdorësh sfond të ndryshëm nëse do
            source={require("../assets/images/recipedd.jpg")}
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.backgroundOverlay} />

            {/* --- RENDERIMI I KUSHTËZUAR --- */}
            {viewingRecipe ? (
                /* --- PAMJA E DETAJEVE TË RECETES (Brenda MyRecipesScreen) --- */
                <ScrollView style={styles.detailScrollContainer} contentContainerStyle={styles.scrollContentContainer}>
                     {/* Header për Detajet (Buton Kthehu + Titull) */}
                    <View style={styles.detailHeaderContainer}>
                        <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.detailTitle} numberOfLines={1} ellipsizeMode='tail'>
                            {viewingRecipe.name}
                        </Text>
                        <View style={styles.headerPlaceholderRight} />
                    </View>

                    {/* Përmbajtja e Detajeve (Strukturë e ngjashme me RecipeDetail nga index.tsx) */}
                    <View style={styles.detailContentWrapper}>
                         {/* Rreshti Sipërm (Foto + Përbërësit) */}
                        <View style={styles.detailTopRowContainer}>
                            <View style={styles.detailImageContainer}>
                                <Image source={viewingRecipe.image} style={styles.detailImage} resizeMode="cover"/>
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

                        {/* Seksioni Poshtëm (Udhëzimet) */}
                        <View style={styles.detailInstructionsContainer}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Udhëzimet</Text>
                                <Text style={styles.instructionsText}>{viewingRecipe.instructions}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

            ) : (

                /* --- PAMJA E LISTËS SË RECETAVE TË RUAJTURA --- */
                 <ScrollView style={styles.listScrollContainer} contentContainerStyle={styles.scrollContentContainer}>
                    <View style={styles.container}>
                        {/* Header për Listën (Buton Kthehu nga Ekrani + Titull) */}
                        <View style={styles.detailHeaderContainer}>
                            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.detailTitle} numberOfLines={1} ellipsizeMode='tail'>
                                Recetat e ruajtura
                            </Text>
                            <View style={styles.headerPlaceholderRight} />
                        </View>

                        {/* Lista ose Mesazhi "Bosh" */}
                        {savedRecipeDetails.length === 0 ? (
                            <View style={styles.centeredEmpty}>
                                <Ionicons name="archive-outline" size={60} color="#ccc" />
                                <Text style={styles.noRecipesText}>Nuk keni asnjë recetë të ruajtur</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={savedRecipeDetails}
                                keyExtractor={(item) => item.id}
                                numColumns={isMobile ? 2 : 4}
                                columnWrapperStyle={styles.columnWrapper}
                                style={styles.flatListStyle}
                                contentContainerStyle={styles.listContainerPadding}
                                scrollEnabled={false} // E rëndësishme kur FlatList është brenda ScrollView
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.recipeCard}
                                        // TANI THËRRET handleShowDetails KUR KLIKOHET KARTA
                                        onPress={() => handleShowDetails(item.id)}
                                        activeOpacity={0.8}
                                    >
                                        <ImageBackground
                                            source={item.image}
                                            style={styles.recipeImage}
                                            imageStyle={styles.imageStyle}
                                        >
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleUnsave(item.id);
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={22} color="white" />
                                            </TouchableOpacity>
                                            <View style={styles.imageOverlay}>
                                                <Text style={styles.recipeName} numberOfLines={2}>{item.name}</Text>
                                                {/* Mund ta heqësh këtë pjesë nëse do */}
                                                <View style={styles.recipeFooter}>
                                                    <Text style={styles.viewRecipeText}>Shiko detajet</Text>
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

// --- STILET ---
// Shumica mbeten siç ishin, por shtojmë disa për strukturën e detajeve
// --- STILET E PËRDITËSUARA ---
const styles = StyleSheet.create({
    background: { flex: 1, width: "100%" },

    // Dy lloje overlay për sfondet
    backgroundOverlayList: { // Overlay më i lehtë për pamjen e listës
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Shumë i lehtë
    },
    backgroundOverlayDetail: { // Overlay pak më i dukshëm për pamjen e detajeve
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.5)', // Më opak se ai i listës
    },

    backgroundOverlay: { // Overlay për HomePage
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.3)', // Shumë i lehtë, pothuajse transparent
    },
    // Kontejnerët kryesorë për secilën pamje
    listScrollContainer: { // ScrollView që mban listën
         flex: 1,
    },
    detailScrollContainer: { // ScrollView që mban detajet
        flex: 1,
    },
    scrollContentContainer: { // Padding i përbashkët poshtë për ScrollView
        paddingBottom: 40,
        flexGrow: 1,
    },
     container: { // Kontejneri i përmbajtjes për pamjen e listës
        flex: 1,
        paddingHorizontal: isMobile ? 15 : 30,
        paddingTop: 0,
        maxWidth: 1300,
        alignSelf: 'center',
        width: '100%',
        alignItems: 'center',
    },
    detailContentWrapper: { // Mbështjellës për përmbajtjen e detajeve (pa header)
        paddingHorizontal: isMobile ? 15 : 25, // Rregulluar pak padding
         maxWidth: 1100,
         width: '100%',
         alignSelf: 'center',
    },
    // Header (përdoret nga të dy pamjet, por me funksion back të ndryshëm)
    detailHeaderContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 15,
        paddingHorizontal: 15,
        marginBottom: 20, width: '100%',
        position: 'relative', // Mbajtur relativ për çdo rast, edhe pse butoni nuk është absolut
    },
    backButton: { // Mbajtur stili flexbox nga seti 2
        backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 20, padding: 8, zIndex: 10,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3,
        // Nuk ka nevojë për position: absolute, top, left
    },
    detailTitle: { // Mbajtur stili flexbox nga seti 2
        flex: 1, fontSize: isMobile ? 20 : 24, fontWeight: 'bold', color: '#333',
        textAlign: 'center',
        marginHorizontal: 10, // Mbajtur margin më i vogël se 50 i setit 1
        // paddingTop: 8, // Hequr pasi alignItems: center bën punën
    },
    headerPlaceholderRight: { // Mbajtur madhësia nga seti 2
        width: 36, // Mjafton për simetri me butonin back
        height: 36,
    },

    // Stilet për loading dhe listën bosh (mbeten siç ishin nga seti 2)
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

    // Stilet për FlatList dhe kartat (mbeten siç ishin nga seti 2)
    flatListStyle: {
        alignSelf: 'center', paddingHorizontal: 5, width: '100%',
    },
    listContainerPadding: { paddingBottom: 0 },
    columnWrapper: {
        justifyContent: 'flex-start', gap: isMobile ? 10 : 15, marginBottom: isMobile ? 10 : 15,
    },
    recipeCard: {
        width: isMobile ? '48%' : '23.5%', aspectRatio: 1, backgroundColor: "white", borderRadius: 12,
        overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 5, elevation: 3,
    },
    recipeImage: {
        flex: 1, justifyContent: 'flex-end', width: '100%', height: '100%',
    },
    imageStyle: { borderRadius: 12 },
    imageOverlay: {
        backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: isMobile ? 10 : 15,
        paddingVertical: isMobile ? 8 : 12,
        minHeight: 90, paddingBottom: 8,
    },
    recipeName: {
        fontSize: isMobile ? 15 : 17, fontWeight: "bold", color: "white", marginBottom: 5,
    },
    recipeFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    viewRecipeText: {
        color: 'rgba(255, 255, 255, 0.9)', fontSize: isMobile ? 13 : 14, fontWeight: '500',
    },
    actionButton: {
        position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20, padding: 6, zIndex: 2,
    },

    // --- Stilet e PËRDITËSUARA për Pamjen e Detajeve (Kombinim i të dy seteve) ---
    detailTopRowContainer: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingBottom: 15,
      paddingHorizontal: 15,
      marginBottom: 20, width: '100%',
      position: 'relative', // Mbajtur relativ për çdo rast, edhe pse butoni nuk është absolut
    },
    detailImageContainer: { // Stili rrethor nga seti 1, përmasat responsive nga seti 2
        width: isMobile ? '80%' : '40%', // Madhësi e arsyeshme, pak më e vogël se 45%
        aspectRatio: 1, // Forcohet të jetë katror para se të bëhet rrethor
        borderRadius: 240, // Vlerë e madhe për rreth të plotë
        overflow: 'hidden',
        backgroundColor: '#eee', // Ngjyrë placeholder
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        alignSelf: isMobile ? 'center' : undefined, // Qendërzo foton në mobile
    },
    detailImage: { // Stili rrethor nga seti 1, përmasat 100%
        width: '100%',
        height: '100%',
        borderRadius: 240, // Gjithashtu këtu për siguri
        // resizeMode: 'cover' aplikohet në komponent
    },
    detailIngredientsContainer: { // Stili nga seti 2, me sfond nga seti 1
        width: isMobile ? '100%' : '55%', // Rritur pak gjerësia për përbërësit
        padding: isMobile ? 15 : 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Sfondi nga seti 1
        borderRadius: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    },
    section: {
        marginBottom: 20, // Hapësira nga seti 1
    },
    sectionTitle: { // Stili nga seti 1/2 (të ngjashëm)
        fontSize: isMobile ? 18 : 20, fontWeight: 'bold', color: '#333',
        marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 5,
    },
    ingredientItem: { // Stili nga seti 1/2
        flexDirection: 'row', alignItems: 'center', marginBottom: 8
    },
    ingredientIcon: { // Stili nga seti 1/2
        marginRight: 8, marginTop: 2
    },
    ingredientText: { // Stili nga seti 1/2
        fontSize: isMobile ? 15 : 16, color: '#555', flex: 1
    },
    detailInstructionsContainer: { // Stili nga seti 2, me sfond dhe marginBottom nga seti 1
        width: '100%',
        padding: isMobile ? 15 : 20,
        backgroundColor: 'rgba(255, 255, 255, 0.8)', // Sfondi nga seti 1
        borderRadius: 12,
        shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
        marginBottom: 60, // Hapësira nga seti 1
    },
    instructionsText: { // Stili nga seti 1/2
        fontSize: isMobile ? 15 : 16, color: '#444', lineHeight: isMobile ? 22 : 24
    },
>>>>>>> f5c2ffc213cc12b574acef94eca952613ac40833
});