import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
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
        console.error('Failed to load saved recipes', e);
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
      Alert.alert(
        'Gabim',
        'Ndodhi një gabim gjatë daljes. Ju lutem provoni përsëri.'
      );
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../assets/images/background.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.welcomeText}>Duke u ngarkuar...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          {user ? (
            <>
              <View style={styles.profileHeader}>
                <Image
                  source={{
                    uri: `https://ui-avatars.com/api/?name=${user.email?.charAt(
                      0
                    )}&background=007AFF&color=fff`,
                  }}
                  style={styles.profileImage}
                />
                <Text style={styles.welcomeText}>
                  Mirësevini, {user.email?.split('@')[0]}!
                </Text>
              </View>

              <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>Recetat e mia</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.subheading}>Recetat e ruajtura</Text>
                    <Text style={styles.statNumber}>
                      {savedRecipes.length}
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.subheading}>Receta e fundit</Text>
                    <Text style={styles.lastRecipeName}>
                      {lastRecipe ? lastRecipe.name : 'Asnjë'}
                    </Text>
                  </View>
                </View>

                <Link href="/my-recipes" asChild>
                  <TouchableOpacity style={styles.recipesButton}>
                    <Text style={styles.recipesButtonText}>Shiko të gjitha</Text>
                    <Ionicons name="arrow-forward" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </Link>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#fff" />
                <Text style={styles.logoutButtonText}>Dilni nga Llogaria</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.welcomeText}>Mirësevini në Profilin Tuaj</Text>
              <Link href="/auth" asChild>
                <TouchableOpacity style={styles.authButton}>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.authButtonText}>Regjistrohu/Kyçu</Text>
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
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  contentContainer: {
    flex: 1,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 20,
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
  },
  statsCard: {
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginTop: 30,
    marginBottom: 20,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 5,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    fontStyle: 'italic',  
  },
  lastRecipeName: {
    fontSize: 16,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
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
  recipesButtonText: {
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
  authButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    width: '100%',
    elevation: 3,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
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
    alignSelf: 'center',
    elevation: 3,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default ProfileScreen;
