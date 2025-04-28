import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Alert, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_RECIPES_KEY = '@saved_recipes';

const ProfileScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [lastRecipe, setLastRecipe] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    const loadRecipes = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
        const recipes = storedValue ? JSON.parse(storedValue) : [];
        setSavedRecipes(recipes);
        if (recipes.length > 0) {
          setLastRecipe(recipes[recipes.length - 1]);
        }
      } catch (e) {
        console.error("Failed to load saved recipes", e);
      }
    };

    loadRecipes();

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë daljes. Ju lutem provoni përsëri.');
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require("../assets/images/background.jpg")}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.container}>
          <Text style={styles.welcomeText}>Duke u ngarkuar...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/images/background.jpg")}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          {user ? (
            <>
              <View style={styles.profileHeader}>
                <Image
                  source={{ uri: `https://ui-avatars.com/api/?name=${user.email?.charAt(0)}&background=007AFF&color=fff` }}
                  style={styles.profileImage}
                />
                <Text style={styles.welcomeText}>
                  Mirësevini, {user.email?.split('@')[0]}!
                </Text>
              </View>

              <View style={styles.profileCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={24} color="#007AFF" />
                  <Text style={styles.infoText}>{user.email}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={24} color="#007AFF" />
                  <Text style={styles.infoText}>Përdorues i regjistruar</Text>
                </View>
              </View>

              {/* Seksioni i recetave */}
              <View style={styles.recipesSection}>
                <Text style={styles.sectionTitle}>Recetat e Mia</Text>

                <View style={styles.recipeStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{savedRecipes.length}</Text>
                    <Text style={styles.statLabel}>Receta të ruajtura</Text>
                  </View>

                  {lastRecipe && (
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>E fundit:</Text>
                      <Text style={styles.recipeName} numberOfLines={1}>
                        {lastRecipe.name}
                      </Text>
                    </View>
                  )}
                </View>

                <Link href="/my-recipes" asChild>
                  <TouchableOpacity style={styles.recipesButton}>
                    <Text style={styles.buttonText}>Shiko të gjitha recetat</Text>
                    <Ionicons name="arrow-forward" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </Link>
              </View>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Dilni nga Llogaria</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.welcomeText}>Mirësevini në Profilin Tuaj</Text>
              <Link href="/auth" asChild>
                <TouchableOpacity style={styles.authButton}>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Regjistrohu/Kyçu</Text>
                </TouchableOpacity>
              </Link>
            </>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  profileCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#555',
  },
  recipesSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  recipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recipeName: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 5,
  },
  recipesButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  authButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '80%',
    elevation: 3,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    width: '80%',
    elevation: 3,
  },
  buttonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;