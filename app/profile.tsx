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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  EmailAuthProvider,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_RECIPES_KEY = '@saved_recipes';

const ProfileScreen = () => {
  const router = useRouter();
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
  
  // Profile editing states
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNewDisplayName(currentUser.displayName || '');
        setProfileImage(currentUser.photoURL || null);
      }
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

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Leje e nevojshme', 'Na duhet leja për të aksesuar galeritë tuaj.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë zgjedhjes së fotos.');
    }
  };
  
  const uploadProfileImage = async () => {
    if (!profileImage || !user) return null;
    
    try {
      setUploadingImage(true);
      
      // Create a reference to Firebase Storage
      const storage = getStorage();
      const filename = `profile_${user.uid}_${new Date().getTime()}`;
      const storageRef = ref(storage, `profile_images/${filename}`);
      
      // Fetch the image and convert to blob
      const response = await fetch(profileImage);
      const blob = await response.blob();
      
      // Upload to Firebase Storage
      await uploadBytes(storageRef, blob);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë ngarkimit të fotos.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  const saveProfileChanges = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let photoURL = user.photoURL;
      
      // Upload new profile image if changed
      if (profileImage && profileImage !== user.photoURL) {
        photoURL = await uploadProfileImage();
      }
      
      // Update profile
      await updateProfile(user, {
        displayName: newDisplayName.trim() || user.displayName,
        photoURL: photoURL || user.photoURL
      });
      
      Alert.alert('Sukses', 'Profili u përditësua me sukses!');
      setEditProfileModalVisible(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë përditësimit të profilit.');
    } finally {
      setIsLoading(false);
    }
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
              <TouchableOpacity onPress={() => setEditProfileModalVisible(true)}>
                <Image
                  source={{
                    uri: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName?.charAt(0) || 'U'}&background=007AFF&color=fff`,
                  }}
                  style={s.avatar}
                />
                <View style={s.editIconContainer}>
                  <Ionicons name="pencil" size={16} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={s.greeting}>Mirësevini, {user.displayName}!</Text>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(true)}>
                <Text style={s.editProfileText}>Ndrysho profilin</Text>
              </TouchableOpacity>
            </View>

            <View style={s.statsCard}>
              <Text style={s.section}>Recetat e mia</Text>
              <View style={s.statRow}>
                <View style={s.statBox}>
                  <Text style={s.statValue}>{savedRecipes.length}</Text>
                  <Text style={s.statLabel}>Receta të ruajtura</Text>
                </View>
              </View>
              
              <TouchableOpacity 
                style={s.myRecipesButton}
                onPress={() => router.push('/my-recipes')}
              >
                <Ionicons name="restaurant-outline" size={22} color="#fff" />
                <Text style={s.myRecipesButtonText}>Recetat e Mia</Text>
              </TouchableOpacity>
              <View style={s.statBox}>
                <Text style={s.statLabel}>E fundit</Text>
                <Text style={s.statValue}>
                  {lastRecipe ? lastRecipe.name : 'Asnjë'}
                </Text>
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

      {/* Edit Profile Modal */}
      <Modal visible={editProfileModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContainer}>
            <Text style={s.modalTitle}>Ndrysho Profilin</Text>
            
            <TouchableOpacity style={s.photoContainer} onPress={pickImage}>
              {uploadingImage ? (
                <ActivityIndicator size="large" color="#007AFF" />
              ) : (
                <Image
                  source={{
                    uri: profileImage || `https://ui-avatars.com/api/?name=${user?.displayName?.charAt(0) || 'U'}&background=007AFF&color=fff`,
                  }}
                  style={s.profilePhoto}
                />
              )}
              <View style={s.cameraIconContainer}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={s.photoHint}>Prek foton për ta ndryshuar</Text>
            
            <Text style={s.inputLabel}>Emri</Text>
            <TextInput
              placeholder="Emri juaj"
              style={s.input}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
            />
            
            <View style={s.buttonRow}>
              <TouchableOpacity 
                style={s.cancelButton} 
                onPress={() => {
                  setEditProfileModalVisible(false);
                  // Reset to original values
                  setNewDisplayName(user?.displayName || '');
                  setProfileImage(user?.photoURL || null);
                }}
              >
                <Text style={s.cancelButtonText}>Anullo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[s.saveButton, isLoading && s.btnDisabled]}
                onPress={saveProfileChanges}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.saveButtonText}>Ruaj</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setEditProfileModalVisible(false)}
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
  editIconContainer: {
    position: 'absolute',
    bottom: 10,
    right: 0,
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editProfileText: {
    color: '#007AFF',
    fontSize: 14,
    marginTop: 5,
    textDecorationLine: 'underline',
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
  photoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoHint: {
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputLabel: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 5,
    color: '#555',
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  myRecipesButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    alignSelf: 'center',
    elevation: 3,
  },
  myRecipesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;