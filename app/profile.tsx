import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { auth } from './firebase';
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, app } from './firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ProfileScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Profile editing states
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [avatarOptions, setAvatarOptions] = useState([
    'https://ui-avatars.com/api/?name=A&background=007AFF&color=fff',
    'https://ui-avatars.com/api/?name=B&background=FF5722&color=fff',
    'https://ui-avatars.com/api/?name=C&background=4CAF50&color=fff',
    'https://ui-avatars.com/api/?name=D&background=9C27B0&color=fff',
    'https://ui-avatars.com/api/?name=E&background=FF9800&color=fff'
  ]);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(-1);
  const [showPassword, setShowPassword] = useState(false);

  // Recipe creation state
  const [recipeModalVisible, setRecipeModalVisible] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState('');
  const [recipeInstructions, setRecipeInstructions] = useState('');
  const [recipeImage, setRecipeImage] = useState<string | null>(null);
  const [publishingRecipe, setPublishingRecipe] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setNewDisplayName(currentUser.displayName || '');
        setNewEmail(currentUser.email || '');
        
        // Load user bio from AsyncStorage if available
        loadUserProfile(currentUser.uid);
      }
      setLoading(false);
    });

    // Request permission for accessing the photo library
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Leje e nevojshme', 'Na duhet leje për të aksesuar galerinë tuaj për të ndryshuar foton e profilit.');
        }
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
  
  // Load user profile data from AsyncStorage
  const loadUserProfile = async (userId: string) => {
    try {
      const userProfileData = await AsyncStorage.getItem(`@user_profile_${userId}`);
      if (userProfileData) {
        const profileData = JSON.parse(userProfileData);
        setBio(profileData.bio || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };
  
  // Save user profile data to AsyncStorage
  const saveUserProfile = async (userId: string, profileData: any) => {
    try {
      await AsyncStorage.setItem(`@user_profile_${userId}`, JSON.stringify(profileData));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };
  
  // Open recipe creation modal
  const openRecipeModal = () => {
    if (!user) {
      Alert.alert('Ju lutem kyçuni', 'Ju duhet të kyçeni për të publikuar receta.');
      return;
    }
    setRecipeName('');
    setRecipeIngredients('');
    setRecipeInstructions('');
    setRecipeImage(null);
    setRecipeModalVisible(true);
  };
  
  // Handle recipe image selection
  const pickRecipeImage = async () => {
    try {
      // Request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Leje e mohuar', 'Na duhet leje për të aksesuar galerinë e fotos.');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      
      // Check if an image was selected
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Set the selected image URI
        setRecipeImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking recipe image:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë zgjedhjes së fotos.');
    }
  };
  
  // Optimized recipe image upload to Firebase Storage
  const uploadRecipeImage = async (uri: string): Promise<string> => {
    try {
      if (!user?.uid) {
        throw new Error('User ID not available');
      }
      
      // Create a unique filename for the image
      const fileExtension = uri.split('.').pop() || 'jpg';
      const fileName = `recipe_${user.uid}_${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `recipe_images/${fileName}`);
      
      // Optimize image before upload if possible
      let optimizedUri = uri;
      try {
        // Use ImageManipulator to resize and compress the image for faster upload
        const manipResult = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 1200 } }], // Resize to reasonable dimensions
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Compress to reduce size
        );
        optimizedUri = manipResult.uri;
      } catch (manipError) {
        console.log('Image optimization skipped:', manipError);
        // Continue with original image if optimization fails
      }
      
      // Create a blob from the image URI
      const response = await fetch(optimizedUri);
      const blob = await response.blob();
      
      // Upload the blob to Firebase Storage with higher quality setting
      const uploadResult = await uploadBytes(storageRef, blob, {
        contentType: `image/${fileExtension}`
      });
      
      if (!uploadResult) {
        throw new Error('Upload failed');
      }
      
      // Get the download URL for the uploaded image
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL || '';
    } catch (error) {
      console.error('Error uploading recipe image:', error);
      throw error;
    }
  };
  
  // Handle recipe submission with optimized performance
  const handlePublishRecipe = async () => {
    // Set publishing state to show loading indicator
    setPublishingRecipe(true);
    // Enhanced validation with better user feedback
    let validationErrors = [];
    
    if (!recipeName.trim()) {
      validationErrors.push('Emri i recetës është i detyrueshëm');
    } else if (recipeName.trim().length < 3) {
      validationErrors.push('Emri i recetës duhet të ketë të paktën 3 karaktere');
    }
    
    if (!recipeIngredients.trim()) {
      validationErrors.push('Përbërësit janë të detyrueshëm');
    } else {
      const ingredientLines = recipeIngredients
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      if (ingredientLines.length < 2) {
        validationErrors.push('Ju lutemi shtoni të paktën 2 përbërës');
      }
    }
    
    if (!recipeInstructions.trim()) {
      validationErrors.push('Udhëzimet e përgatitjes janë të detyrueshme');
    } else if (recipeInstructions.trim().length < 20) {
      validationErrors.push('Ju lutemi jepni udhëzime më të detajuara (të paktën 20 karaktere)');
    }
    
    if (validationErrors.length > 0) {
      Alert.alert(
        'Ju lutemi plotësoni të gjitha fushat', 
        validationErrors.join('\n'),
        [{ text: 'Në rregull', style: 'default' }]
      );
      return;
    }
    
    // Start publishing process
    setPublishingRecipe(true);
    
    try {
      // Process ingredients into an array with better cleaning
      const ingredientsArray = recipeIngredients
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);
      
      // Create recipe object with sanitized data
      const recipeData = {
        name: recipeName.trim(),
        perberesit: ingredientsArray,
        instructions: recipeInstructions.trim(),
        image: null, // Will be updated if image upload succeeds
        userId: user?.uid || 'anonymous',
        createdAt: new Date().toISOString(),
      };
      
      // Generate a temporary ID for local storage
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const tempRecipe = {
        ...recipeData,
        id: tempId,
      };
      
      // Close modal immediately for better UX
      setRecipeModalVisible(false);
      
      // Save to local storage first for immediate feedback
      let existingRecipes = [];
      try {
        const storedRecipes = await AsyncStorage.getItem('userRecipes');
        if (storedRecipes) {
          existingRecipes = JSON.parse(storedRecipes);
        }
      } catch (error) {
        console.error('Error reading from AsyncStorage:', error);
      }
      
      existingRecipes.unshift(tempRecipe); // Add to beginning for better visibility
      await AsyncStorage.setItem('userRecipes', JSON.stringify(existingRecipes));
      
      // Show a temporary toast or notification
      Alert.alert('Duke ruajtur', 'Receta juaj po ruhet...');
      
      // Handle image upload if present (in parallel with API submission)
      let imageUploadPromise: Promise<string | null> = Promise.resolve(null);
      if (recipeImage) {
        imageUploadPromise = (async () => {
          try {
            // Optimize image before upload
            const manipResult = await ImageManipulator.manipulateAsync(
              recipeImage,
              [{ resize: { width: 1200, height: 1200 } }], // Better resize with height constraint
              { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            
            const response = await fetch(manipResult.uri);
            const blob = await response.blob();
            
            // Upload to Firebase Storage with better path organization
            const fileName = `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
            const storageRef = ref(storage, `recipes/${user?.uid || 'anonymous'}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, blob);
            
            // Wait for upload to complete with timeout
            return await Promise.race<string>([
              new Promise<string>((resolve, reject) => {
                uploadTask.on(
                  'state_changed',
                  (snapshot: any) => {
                    // Progress tracking could be added here if needed
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload is ${progress}% done`);
                  },
                  (error: any) => {
                    console.error('Error uploading image:', error);
                    reject(error);
                  },
                  async () => {
                    const imageUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(imageUrl);
                  }
                );
              }),
              // Add a timeout to prevent hanging if Firebase is slow
              new Promise<string>((_, reject) => 
                setTimeout(() => reject(new Error('Image upload timeout')), 30000)
              )
            ]);
          } catch (error) {
            console.error('Error processing or uploading image:', error);
            return null; // Continue without image if upload fails
          }
        })();
      }
      
      // Submit to backend API (in parallel with image upload)
      const apiUrl = Platform.OS === 'android' 
        ? 'http://10.0.2.2:3000/recipes' 
        : 'http://localhost:3000/recipes';
      
      // Start both processes in parallel
      const results = await Promise.allSettled([
        imageUploadPromise,
        axios.post(apiUrl, {
          ...recipeData,
          // If image is still uploading, we'll update it later
          // This ensures the recipe is saved even if image upload is slow
        })
      ]);
      
      const imageUrl = results[0];
      const apiResponse = results[1];
      
      // Handle API response
      if (apiResponse.status === 'fulfilled' && 
          (apiResponse.value.status === 201 || apiResponse.value.status === 200)) {
        
        const serverRecipe = apiResponse.value.data;
        
        // If image upload succeeded, update the recipe with the image URL
        if (imageUrl.status === 'fulfilled' && imageUrl.value) {
          try {
            await axios.patch(`${apiUrl}/${serverRecipe.id}`, {
              image: imageUrl.value
            });
            serverRecipe.image = imageUrl.value;
          } catch (error) {
            console.error('Error updating recipe with image URL:', error);
            // Continue anyway, the recipe is saved
          }
        }
        
        // Update local storage with the server-generated ID
        try {
          const storedRecipes = await AsyncStorage.getItem('userRecipes');
          if (storedRecipes) {
            let recipes = JSON.parse(storedRecipes);
            // Replace temp recipe with server recipe
            recipes = recipes.map((recipe: any) => 
              recipe.id === tempId ? serverRecipe : recipe
            );
            await AsyncStorage.setItem('userRecipes', JSON.stringify(recipes));
          }
        } catch (error) {
          console.error('Error updating AsyncStorage:', error);
        }
        
        // Show success message
        Alert.alert(
          'Sukses!', 
          'Receta juaj u ruajt me sukses dhe tani është e disponueshme në profilin tuaj dhe në rezultatet e kërkimit.',
          [{ text: 'Në rregull', style: 'default' }]
        );
      } else {
        throw new Error('API request failed: ' + 
          (apiResponse.status === 'rejected' ? apiResponse.reason : 'Unknown error'));
      }
    } catch (error) {
      console.error('Error publishing recipe:', error);
      
      // Show error message but don't reopen modal unless user wants to
      Alert.alert(
        'Gabim gjatë ruajtjes', 
        'Ndodhi një problem gjatë ruajtjes së recetës. Dëshironi të provoni përsëri?',
        [
          { 
            text: 'Jo', 
            style: 'cancel',
            onPress: () => {
              // Reset form
              setRecipeName('');
              setRecipeIngredients('');
              setRecipeInstructions('');
              setRecipeImage(null);
            }
          },
          { 
            text: 'Po', 
            onPress: () => setRecipeModalVisible(true)
          }
        ]
      );
    } finally {
      setPublishingRecipe(false);
    }
  };

  const openEditProfileModal = () => {
    if (user) {
      setNewDisplayName(user.displayName || '');
      setNewEmail(user.email || '');
      setSelectedAvatarIndex(-1);
      setCurrentPassword('');
      setEditProfileError('');
      setUploadedImage(null);
      setEditProfileModalVisible(true);
    }
  };
  
  const pickImage = async () => {
    try {
      // Request permission to access the media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Leje e mohuar', 'Na duhet leje për të aksesuar galerinë e fotos.');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      // Check if an image was selected
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Set the selected image URI
        setUploadedImage(result.assets[0].uri);
        
        // Deselect any avatar if an image is picked
        setSelectedAvatarIndex(-1);
        
        // Show a confirmation message
        Alert.alert(
          'Foto e zgjedhur', 
          'Klikoni Ruaj për të përditësuar foton e profilit.'
        );
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë zgjedhjes së fotos.');
    }
  };
  
  const uploadImageToFirebase = async (uri: string): Promise<string> => {
    try {
      // Create a blob from the image URI
      const response = await fetch(uri);
      const blob = await response.blob();
      
      if (!user?.uid) {
        throw new Error('User ID not available');
      }
      
      // Create a unique filename for the image
      const fileExtension = uri.split('.').pop() || 'jpg';
      const fileName = `profile_${user.uid}_${Date.now()}.${fileExtension}`;
      
      // Create a reference to the storage location
      const storageRef = ref(storage, `profile_images/${fileName}`);
      
      // Upload the blob to Firebase Storage
      const uploadResult = await uploadBytes(storageRef, blob);
      
      if (!uploadResult) {
        throw new Error('Upload failed');
      }
      
      // Get the download URL for the uploaded image
      const downloadURL = await getDownloadURL(storageRef);
      
      if (!downloadURL) {
        throw new Error('Failed to get download URL');
      }
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Gabim', 'Ndodhi një gabim gjatë ngarkimit të fotos. Ju lutem provoni përsëri.');
      throw error;
    }
  };
  
  const handleUpdateProfile = async () => {
    if (!user) {
      Alert.alert('Gabim', 'Ju nuk jeni të identifikuar.');
      return;
    }
    
    setUpdatingProfile(true);
    setEditProfileError('');
    
    try {
      // Step 1: Handle profile photo update first if there's an uploaded image
      if (uploadedImage) {
        try {
          // Show loading indicator
          Alert.alert('Duke ngarkuar', 'Ju lutem prisni ndërsa fotoja juaj ngarkohet...');
          
          // Upload the image to Firebase Storage
          const photoURL = await uploadImageToFirebase(uploadedImage);
          
          // Update the user's profile with the new photo URL
          await updateProfile(user, { photoURL });
          
          // Force refresh the user object to get the updated photo URL
          await user.reload();
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          setEditProfileError('Ndodhi një gabim gjatë ngarkimit të fotos. Ju lutem provoni përsëri.');
          setUpdatingProfile(false);
          return;
        }
      }
      
      // Step 2: Handle avatar selection
      if (selectedAvatarIndex >= 0) {
        const avatarURL = avatarOptions[selectedAvatarIndex];
        await updateProfile(user, { photoURL: avatarURL });
      }
      
      // Step 3: Update display name if changed
      if (newDisplayName !== user.displayName) {
        await updateProfile(user, { displayName: newDisplayName });
      }
      
      // Step 4: Update email if changed (requires reauthentication)
      if (newEmail !== user.email && currentPassword) {
        try {
          const credential = EmailAuthProvider.credential(
            user.email || '', 
            currentPassword
          );
          
          await reauthenticateWithCredential(user, credential);
          await updateEmail(user, newEmail);
        } catch (emailError: any) {
          if (emailError.code === 'auth/wrong-password' || emailError.code === 'auth/user-mismatch') {
            setEditProfileError('Fjalëkalimi aktual është i gabuar.');
          } else if (emailError.code === 'auth/requires-recent-login') {
            setEditProfileError('Ju duhet të dilni dhe të hyni përsëri për të ndryshuar email-in.');
          } else if (emailError.code === 'auth/email-already-in-use') {
            setEditProfileError('Ky email është tashmë në përdorim.');
          } else {
            setEditProfileError('Ndodhi një gabim gjatë ndryshimit të email-it.');
          }
          setUpdatingProfile(false);
          return;
        }
      }
      
      // Step 5: Save additional profile data to AsyncStorage
      await saveUserProfile(user.uid, {
        bio,
        lastUpdated: new Date().toISOString()
      });
      
      // Step 6: Force refresh the user data to ensure UI updates
      if (auth.currentUser) {
        await auth.currentUser.reload();
        setUser(Object.assign({}, auth.currentUser));
      }
      
      // Step 7: Close modal and show success message
      setEditProfileModalVisible(false);
      Alert.alert('Sukses', 'Profili u përditësua me sukses!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setEditProfileError('Ndodhi një gabim. Ju lutem provoni përsëri.');
    } finally {
      setUpdatingProfile(false);
      setCurrentPassword('');
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
                  uri: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName?.charAt(0)}&background=007AFF&color=fff`,
                }}
                style={s.avatar}
              />
              <Text style={s.greeting}>Mirësevini, {user.displayName}!</Text>
              {bio ? <Text style={s.bioText}>{bio}</Text> : null}
              <TouchableOpacity 
                style={s.editProfileButton} 
                onPress={openEditProfileModal}
              >
                <Ionicons name="pencil-outline" size={16} color="#fff" />
                <Text style={s.editProfileText}>Ndrysho profilin</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={s.publishRecipeButton} onPress={openRecipeModal}>
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={s.publishRecipeText}>Publiko Recetë</Text>
            </TouchableOpacity>
            
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
            <ScrollView 
              contentContainerStyle={s.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={s.modalTitle}>Ndrysho Profilin</Text>
            
            <Text style={s.inputLabel}>Emri i Përdoruesit</Text>
            <TextInput
              placeholder="Emri i përdoruesit"
              style={s.input}
              value={newDisplayName}
              onChangeText={setNewDisplayName}
            />
            
            <Text style={s.inputLabel}>Email</Text>
            <TextInput
              placeholder="Email"
              style={s.input}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
            />
            
            <Text style={s.inputLabel}>Bio</Text>
            <TextInput
              placeholder="Shkruani diçka rreth vetes..."
              style={[s.input, s.bioInput]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
            />
            
            {newEmail !== user?.email && (
              <>
                <Text style={s.inputLabel}>Fjalëkalimi aktual (për ndryshimin e email-it)</Text>
                <View style={s.passwordContainer}>
                  <TextInput
                    placeholder="Fjalëkalimi aktual"
                    style={s.passwordInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry={true}
                  />
                </View>
              </>
            )}
            
            <Text style={s.inputLabel}>Foto e profilit</Text>
            
            {/* Upload image from device button */}
            <TouchableOpacity 
              style={s.uploadPhotoButton} 
              onPress={pickImage}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={s.uploadPhotoText}>Ngarko foto nga pajisja</Text>
            </TouchableOpacity>
            
            {/* Show uploaded image preview */}
            {uploadedImage ? (
              <View style={s.uploadedImageContainer}>
                <Image source={{ uri: uploadedImage }} style={s.previewImage} />
                <Text style={s.imageSelectedText}>Foto e zgjedhur - klikoni Ruaj për ta ruajtur</Text>
                <TouchableOpacity 
                  style={s.removeImageButton}
                  onPress={() => setUploadedImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ) : null}
            
            <Text style={s.inputLabel}>Ose zgjidhni një avatar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.avatarList}>
              {avatarOptions.map((avatar, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[s.avatarOption, selectedAvatarIndex === index && s.selectedAvatarOption]}
                  onPress={() => {
                    setSelectedAvatarIndex(index);
                    setUploadedImage(null);
                  }}
                >
                  <Image source={{ uri: avatar }} style={s.avatarOptionImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {editProfileError ? (
              <Text style={s.errorText}>{editProfileError}</Text>
            ) : null}
            
            <View style={s.modalButtonRow}>
              <TouchableOpacity 
                style={[s.modalButton, s.cancelButton]} 
                onPress={() => setEditProfileModalVisible(false)}
              >
                <Text style={s.cancelButtonText}>Anullo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[s.modalButton, s.saveButton, updatingProfile && s.btnDisabled]} 
                onPress={handleUpdateProfile}
                disabled={updatingProfile}
              >
                {updatingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.saveButtonText}>Ruaj</Text>
                )}
              </TouchableOpacity>
            </View>
            
            </ScrollView>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setEditProfileModalVisible(false)}
            >
              <Ionicons name="close-circle" size={28} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Recipe Creation Modal */}
      <Modal visible={recipeModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <RNKeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={[s.modalContainer, s.recipeModalContainer]}>
              <Text style={s.modalTitle}>Ruaj Recetë të Re</Text>
              
              <ScrollView 
                contentContainerStyle={s.modalScrollContent}
                showsVerticalScrollIndicator={true}
                style={s.recipeScrollView}
              >
                {/* Recipe form with improved UI */}
                <View style={s.formSection}>
                  <View style={s.formHeader}>
                    <Ionicons name="restaurant-outline" size={20} color="#4CAF50" />
                    <Text style={s.sectionTitle}>Detajet e Recetës</Text>
                  </View>
                  
                  <Text style={s.inputLabel}>Emri i Recetës<Text style={s.requiredStar}>*</Text></Text>
                  <TextInput
                    placeholder="Shkruani emrin e recetës"
                    style={[s.input, !recipeName.trim() && s.inputWarning]}
                    value={recipeName}
                    onChangeText={setRecipeName}
                    maxLength={50}
                  />
                  <Text style={s.characterCount}>{recipeName.length}/50</Text>
                </View>
                
                <View style={s.formSection}>
                  <View style={s.formHeader}>
                    <Ionicons name="list-outline" size={20} color="#4CAF50" />
                    <Text style={s.sectionTitle}>Përbërësit<Text style={s.requiredStar}>*</Text></Text>
                  </View>
                  <Text style={s.inputHelper}>Shkruani çdo përbërës në një rresht të ri</Text>
                  <TextInput
                    placeholder="P.sh.\n2 vezë\n100g miell\n50ml qumësht\n..."
                    style={[s.input, s.recipeTextArea, !recipeIngredients.trim() && s.inputWarning]}
                    value={recipeIngredients}
                    onChangeText={setRecipeIngredients}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                  />
                  
                  {/* Ingredient count indicator */}
                  {recipeIngredients.trim() ? (
                    <Text style={s.ingredientCount}>
                      {recipeIngredients.split('\n').filter(line => line.trim().length > 0).length} përbërës
                    </Text>
                  ) : null}
                </View>
                
                <View style={s.formSection}>
                  <View style={s.formHeader}>
                    <Ionicons name="document-text-outline" size={20} color="#4CAF50" />
                    <Text style={s.sectionTitle}>Udhëzimet<Text style={s.requiredStar}>*</Text></Text>
                  </View>
                  <Text style={s.inputHelper}>Përshkruani hapat e përgatitjes së recetës</Text>
                  <TextInput
                    placeholder="Përshkruani procesin e përgatitjes hap pas hapi..."
                    style={[s.input, s.recipeTextArea, s.instructionsArea, !recipeInstructions.trim() && s.inputWarning]}
                    value={recipeInstructions}
                    onChangeText={setRecipeInstructions}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                  />
                </View>
                
                <View style={s.formSection}>
                  <View style={s.formHeader}>
                    <Ionicons name="image-outline" size={20} color="#4CAF50" />
                    <Text style={s.sectionTitle}>Foto e Recetës</Text>
                  </View>
                  <Text style={s.inputHelper}>Shtoni një foto të gatimit përfundimtar (opsionale)</Text>
                  
                  {/* Upload image button */}
                  <TouchableOpacity 
                    style={s.uploadPhotoButton} 
                    onPress={pickRecipeImage}
                  >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={s.uploadPhotoText}>Ngarko foto të recetës</Text>
                  </TouchableOpacity>
                  
                  {/* Show uploaded image preview */}
                  {recipeImage ? (
                    <View style={s.uploadedImageContainer}>
                      <Image source={{ uri: recipeImage }} style={s.recipePreviewImage} />
                      <TouchableOpacity 
                        style={s.removeImageButton}
                        onPress={() => setRecipeImage(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
                
                {/* Action buttons */}
                <View style={s.modalButtonRow}>
                  <TouchableOpacity 
                    style={[s.modalButton, s.cancelButton]} 
                    onPress={() => setRecipeModalVisible(false)}
                    disabled={publishingRecipe}
                  >
                    <Text style={s.cancelButtonText}>Anulo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[s.modalButton, s.saveButton, publishingRecipe && s.btnDisabled]} 
                    onPress={handlePublishRecipe}
                    disabled={publishingRecipe}
                  >
                    {publishingRecipe ? (
                      <View style={s.saveButtonContent}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={[s.saveButtonText, s.savingText]}>Duke ruajtur...</Text>
                      </View>
                    ) : (
                      <View style={s.saveButtonContent}>
                        <Ionicons name="save-outline" size={18} color="#fff" />
                        <Text style={s.saveButtonText}>Ruaj Recetën</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setRecipeModalVisible(false)}
                disabled={publishingRecipe}
              >
                <Ionicons name="close-circle" size={28} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </RNKeyboardAvoidingView>
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
  uploadedImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 5,
  },
  imageSelectedText: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 10,
    fontStyle: 'italic',
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
    maxHeight: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    alignItems: 'center',
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 60,
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
  editProfileButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  editProfileText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
  },
  bioText: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 10,
    fontStyle: 'italic',
    maxWidth: '80%',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 5,
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  avatarList: {
    flexDirection: 'row',
    marginVertical: 10,
    maxHeight: 80,
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginHorizontal: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatarOption: {
    borderColor: '#007AFF',
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  uploadPhotoButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  uploadPhotoText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  uploadedImageContainer: {
    position: 'relative',
    marginVertical: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  publishRecipeButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    marginBottom: 12,
    elevation: 4,
    width: 640,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  publishRecipeText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 17,
    paddingLeft: 10,
  },
  recipeModalContainer: {
    width: '90%',
    maxHeight: '90%',
    paddingBottom: 10,
  },
  recipeScrollView: {
    width: '100%',
    maxHeight: '100%',
    flex: 1,
  },
  recipeTextArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
    fontSize: 15,
  },
  instructionsArea: {
    height: 150,
  },
  formSection: {
    width: '100%',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
  },
  requiredStar: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  inputHelper: {
    fontSize: 13,
    color: '#777',
    marginBottom: 8,
    marginLeft: 10,
    fontStyle: 'italic',
  },
  characterCount: {
    fontSize: 12,
    color: '#777',
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 10,
  },
  ingredientCount: {
    fontSize: 13,
    color: '#4CAF50',
    alignSelf: 'flex-end',
    marginTop: 4,
    marginRight: 10,
    fontWeight: '500',
  },
  inputWarning: {
    borderColor: '#FFCC00',
    backgroundColor: '#FFFBF0',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savingText: {
    marginLeft: 8,
  },
  recipePreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ProfileScreen;