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
    ScrollView,
    Image,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Recipe } from './index';
import axios from 'axios';

const { width, height } = Dimensions.get('window');
const isMobile = width < 768;

const SAVED_RECIPES_KEY = '@saved_recipes';

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

export default function MyRecipesScreen() {
    const router = useRouter();
    const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
    const [translatedRecipe, setTranslatedRecipe] = useState<{
        name?: string;
        ingredients?: string[];
        instructions?: string;
    }>({});
    const [isTranslating, setIsTranslating] = useState(false);

    const loadSavedRecipes = useCallback(async () => {
        setIsLoading(true);
        setViewingRecipe(null);
        try {
            const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
            const savedRecipes: Recipe[] = storedValue ? JSON.parse(storedValue) : [];
            setSavedRecipes(savedRecipes);
        } catch (e) {
            console.error("Failed to load saved recipes", e);
            setSavedRecipes([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadSavedRecipes();
            return () => { };
        }, [loadSavedRecipes])
    );

    const handleUnsave = async (recipe: Recipe) => {
        try {
            const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
            let savedRecipes: Recipe[] = storedValue ? JSON.parse(storedValue) : [];

            const updatedRecipes = savedRecipes.filter(r => r.id !== recipe.id);
            setSavedRecipes(updatedRecipes);

            await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updatedRecipes));
        } catch (e) {
            console.error("Failed to update storage after unsaving", e);
            loadSavedRecipes();
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
        setTranslatedRecipe({}); // Reset translation when showing new recipe
    };

    const handleBackToList = () => {
        setViewingRecipe(null);
    };

    const translateRecipe = async () => {
        if (!viewingRecipe) return;

        setIsTranslating(true);
        try {
            // Përkthe emrin
            const nameTranslated = await translateText(viewingRecipe.name);

            // Përkthe përbërësit
            const ingredientsTranslated = await Promise.all(
                viewingRecipe.ingredients.map(ing => translateText(ing))
            );

            // Përkthe udhëzimet
            const instructionsTranslated = await translateText(viewingRecipe.instructions);

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
                            {translatedRecipe.name || viewingRecipe.name}
                        </Text>
                        <TouchableOpacity
                            onPress={() => handleUnsave(viewingRecipe)}
                            style={styles.detailHeartButton}
                        >
                            <Ionicons name="trash-outline" size={24} color="#333" />
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

                    <View style={styles.detailContentWrapper}>
                        <View style={styles.detailTopRowContainer}>
                            <View style={styles.detailImageContainer}>
                                <Image
                                    source={typeof viewingRecipe.image === 'number'
                                        ? viewingRecipe.image
                                        : { uri: viewingRecipe.image.uri }}
                                    style={styles.detailImage}
                                    resizeMode="cover"
                                />
                            </View>
                            <View style={styles.detailIngredientsContainer}>
                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Përbërësit</Text>
                                    {(translatedRecipe.ingredients || viewingRecipe.ingredients).map((ingredient, index) => (
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
                                    {translatedRecipe.instructions || viewingRecipe.instructions}
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
                                            source={
                                                typeof item.image === 'number'
                                                    ? item.image
                                                    : item.image && item.image.uri
                                                        ? { uri: item.image.uri }
                                                        : require('../assets/images/recipedd.jpg')
                                            }
                                            style={styles.recipeImage}
                                            imageStyle={styles.imageStyle}
                                        >
                                            <TouchableOpacity
                                                style={styles.actionButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleUnsave(item);
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={22} color="white" />
                                            </TouchableOpacity>
                                            <View style={styles.imageOverlay}>
                                                <Text style={styles.recipeName} numberOfLines={2}>{item.name}</Text>
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
        justifyContent: 'flex-start',
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
        shadowRadius: 5,
        elevation: 3,
    },
    recipeImage: {
        flex: 1,
        justifyContent: 'flex-end',
        width: '100%',
        height: '100%',
    },
    imageStyle: {
        borderRadius: 12
    },
    imageOverlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: isMobile ? 10 : 15,
        paddingVertical: isMobile ? 8 : 12,
        minHeight: 90,
        paddingBottom: 8,
    },
    recipeName: {
        fontSize: isMobile ? 15 : 17,
        fontWeight: "bold",
        color: "white",
        marginBottom: 5,
    },
    recipeFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    viewRecipeText: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: isMobile ? 13 : 14,
        fontWeight: '500',
    },
    actionButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        padding: 6,
        zIndex: 2,
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
});