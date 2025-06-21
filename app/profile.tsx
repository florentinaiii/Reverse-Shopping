import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  ImageBackground,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_RECIPES_KEY = '@saved_recipes';

const ProfileScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [lastRecipe, setLastRecipe] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
        const recipes = stored ? JSON.parse(stored) : [];
        setSavedRecipes(recipes);
        if (recipes.length) setLastRecipe(recipes[recipes.length - 1]);
      } catch (e) {
        console.error(e);
      }
    })();

    return unsubscribe;
  }, []);

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setErrorMessage('Ju lutem shkruani email-in tuaj për të rivendosur fjalëkalimin');
      return;
    }
    
    // Here you would implement password reset functionality
    // For now, just show a confirmation message
    Alert.alert(
      'Resetimi i fjalëkalimit',
      `Një link për resetimin e fjalëkalimit do të dërgohet tek ${email}.`,
      [{ text: 'OK' }]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      Alert.alert('Gabim', 'Ju lutem provoni përsëri.');
    }
  };

  const handleAuth = async () => {
    // Clear previous error messages
    setErrorMessage('');
    
    // Validate input fields
    if (!isLogin && !username.trim()) {
      setErrorMessage('Ju lutem shkruani emrin tuaj.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Ju lutem shkruani email-in tuaj apo emrin tuaj.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Ju lutem shkruani fjalëkalimin tuaj.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Passwordi duhet të ketë të paktën 8 karaktere.');
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (cred.user) {
          await updateProfile(cred.user, { displayName: username });
        }
      }
      setModalVisible(false);
      setEmail('');
      setPassword('');
      setUsername('');
      setErrorMessage('');
    } catch (e: any) {
      // Handle specific authentication errors
      if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        setErrorMessage('Incorrect email or password.');
      } else if (e.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed login attempts. Please try again later.');
      } else {
        setErrorMessage(e.message || 'An error occurred during authentication.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) return null;

  return (
    <ImageBackground
      source={require('../assets/images/background.jpg')}
      style={s.background}
      resizeMode="cover"
    >
      <View style={s.backgroundOverlay} />
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={s.container}>
        {user ? (
          <>
            <View style={s.profileCard}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${user.displayName?.charAt(0)}&background=007AFF&color=fff`,
                }}
                style={s.avatar}
              />
              <Text style={s.greeting}>Mirësevini, {user.displayName}!</Text>
            </View>

            <View style={s.statsCard}>
              <Text style={s.section}>Recetat e mia</Text>
              <View style={s.statRow}>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>Ruajtura</Text>
                  <Text style={s.statValue}>{savedRecipes.length}</Text>
                </View>
                <View style={s.statBox}>
                  <Text style={s.statLabel}>E fundit</Text>
                  <Text style={s.statValue}>
                    {lastRecipe ? lastRecipe.name : 'Asnjë'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={s.btnLogout} onPress={handleLogout}>
              <Text style={s.btnText}>Dil nga llogaria</Text>
              <Ionicons name="log-out-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={s.centeredContainer}>
            <Text style={s.greeting}>Mirësevini në profilin tuaj</Text>
            <TouchableOpacity
              style={s.btnPrimary}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={s.btnTextt}>Regjistrohu / Kyçu</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>
              {isLogin ? 'Kyçu në llogari' : 'Krijo llogari'}
            </Text>

            {!isLogin && (
              <TextInput
                placeholder="Username"
                style={s.input}
                value={username}
                onChangeText={setUsername}
              />
            )}
            <TextInput
              placeholder="Email"
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <View style={s.passwordContainer}>
              <TextInput
                placeholder="Fjalëkalimi"
                style={s.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={s.eyeIcon} 
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
              <Text style={s.errorText}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity 
              style={[s.btnPrimary, isLoading && s.btnDisabled]} 
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={s.btnTextt}>Loading...</Text>
              ) : (
                <Text style={s.btnTextt}>{isLogin ? 'Kyçu' : 'Regjistrohu'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={s.switchText}>
                {isLogin
                  ? 'Nuk ke llogari? Regjistrohu'
                  : 'Ke llogari? Kyçu këtu'}
              </Text>
            </TouchableOpacity>

            {isLogin && (
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={s.forgotPasswordText}>Forgot your password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close-circle" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const s = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  container: {
    flexGrow: 1,
    padding: 24,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    borderRadius: 20,
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
    elevation: 6,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '600',
    color: '#004d40',
    textAlign: 'center',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 40,
    width: '40%',
    height: '30%',
    alignSelf: 'center',
    elevation: 6,
    marginBottom: '2%',
  },
  section: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(11, 11, 11)',
    textAlign: 'center',
    marginBottom: 12,
    paddingBottom: 40,

  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: '20%',
    paddingRight: '20%',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#004d40',
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
    width: 350,
  },
  btnLogout: {
    flexDirection: 'row',
    backgroundColor: '#e53935',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    elevation: 4,
    width: 640,
    alignSelf: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 17,
    paddingLeft: '38%',
  },
  btnTextt: {
    color: '#fff',
    fontWeight: '400',
    fontSize: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '28%',
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 24,
    elevation: 10,
    alignItems: 'center',
    paddingTop: 80,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: '#007AFF',
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f7f7f7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    width: 370,
  },
  switchText: {
    color: '#007AFF',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  forgotPasswordText: {
    color: '#007AFF',
    marginTop: 15,
    fontWeight: '500',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  errorText: {
    color: '#e53935',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  btnDisabled: {
    backgroundColor: '#cccccc',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    width: 370,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 10,
  },
});

export default ProfileScreen;