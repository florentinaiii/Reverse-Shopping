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
import { storage } from './firebase';
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
    try {
      // Debug message to verify function is being called
      console.log('handlePublishRecipe called');

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
          validationErrors.join('\n')
        );
        setPublishingRecipe(false);
        return;
      }

      // Create recipe object with sanitized data
      const ingredientsArray = recipeIngredients
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

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
      try {
        await AsyncStorage.setItem('userRecipes', JSON.stringify(existingRecipes));
      } catch (error) {
        console.error('Error writing to AsyncStorage:', error);
        Alert.alert('Gabim', 'Nuk mund të ruajmë recetat në ruajtjen lokale.');
        return;
      }

      // Show a temporary toast or notification
      Alert.alert('Duke ruajtur', 'Receta juaj po ruhet...');

      // Handle image upload if present (in parallel with API submission)
      let imageUploadPromise: Promise<string | null> = Promise.resolve(null);
      if (recipeImage) {
        imageUploadPromise = (async () => {
          try {
            console.log('Starting image processing and upload');
            // Optimize image before upload
            const manipResult = await ImageManipulator.manipulateAsync(
              recipeImage,
              [{ resize: { width: 800, height: 800 } }], // Smaller size to reduce upload issues
              { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
            );

            // For development testing, we'll skip the actual Firebase upload
            // which is causing CORS issues, and instead just return a placeholder URL
            // In production, you would uncomment the Firebase upload code

            console.log('Image processed successfully, but skipping Firebase upload due to CORS issues');
            // Return a placeholder image URL for testing
            // This allows the recipe to be saved without Firebase Storage CORS issues
            return 'https://via.placeholder.com/300x200?text=Recipe+Image+Placeholder';

            /* Commented out Firebase upload code due to CORS issues
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
                setTimeout(() => reject(new Error('Image upload timeout')), 15000)
              )
            ]);
            */
          } catch (error) {
            console.error('Error processing or uploading image:', error);
            console.log('Continuing recipe save without image');
            // Don't show alert, just continue without image
            return null; // Continue without image if upload fails
          }
        })();
      }

      // Submit to backend API (in parallel with image upload)
      // Use the same API base URL function that's used in index.tsx for consistency
      const getApiBaseUrl = () => {
        if (Platform.OS === 'android') {
          return 'http://10.0.2.2:5000'; // Android emulator to local server
        } else if (Platform.OS === 'ios') {
          return 'http://localhost:5000';
        } else {
          return 'http://localhost:5000'; // Web or other platform
        }
      };


      const apiUrl = `${getApiBaseUrl()}/recipes`;

      // Log the data being sent to the API
      console.log('Sending recipe data to API:', JSON.stringify(recipeData));
      console.log('API URL:', apiUrl);

      // Skip API connection test as it may fail in development
      // We'll handle connection errors during the actual API call instead
      console.log('Proceeding to save recipe (skipping API connection test)');

      // Set a flag to track if we're in offline mode
      let isOfflineMode = false;

      // Start both processes in parallel
      console.log('Starting API post and image upload in parallel');
      const results = await Promise.allSettled([
        imageUploadPromise,
        axios.post(apiUrl, {
          ...recipeData,
          // If image is still uploading, we'll update it later
          // This ensures the recipe is saved even if image upload is slow
        }, {
          // Add timeout and headers for better debugging
          timeout: 5000, // Shorter timeout for faster feedback
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(error => {
          console.log('API post failed, marking as offline mode:', error.message);
          isOfflineMode = true;
          // Return a rejected promise to be caught by Promise.allSettled
          return Promise.reject({
            isOfflineError: true,
            originalError: error
          });
        })
      ]);

      // Extract results from Promise.allSettled
      const imageUrl = results[0];
      const apiResponse = results[1];

      // Debug info for API response
      if (apiResponse.status === 'fulfilled') {
        console.log('API Response Status:', apiResponse.value.status);
        console.log('API Response Data:', JSON.stringify(apiResponse.value.data));
      } else {
        console.error('API Request rejected:', apiResponse.reason);
        if (apiResponse.reason?.isOfflineError) {
          console.log('Continuing in offline mode');
        }
      }

      console.log('Image upload result:', JSON.stringify(imageUrl));
      console.log('API response:', JSON.stringify(apiResponse));

      // Handle API response - either successful API call or offline mode
      if ((apiResponse.status === 'fulfilled' &&
        (apiResponse.value?.status === 201 || apiResponse.value?.status === 200)) || isOfflineMode) {

        // Marrim URL-në e imazhit nëse ka përfunduar me sukses
        const uploadedImageUrl = imageUrl.status === 'fulfilled' ? imageUrl.value : null;

        let serverRecipe: any;

        if (apiResponse.status === 'fulfilled' && apiResponse.value?.data) {
          serverRecipe = {
            ...apiResponse.value.data,
            image: uploadedImageUrl  // përfshi URL-në e fotos që u ngarkua
          };
          console.log('Server recipe received:', JSON.stringify(serverRecipe));
        } else {
          // Krijo recetën në mënyrë manuale në offline mode
          serverRecipe = {
            ...recipeData,
            image: uploadedImageUrl, // përfshi URL-në e fotos
            id: `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            offlineCreated: true,
            pendingSync: true
          };
          console.log('Created offline recipe:', JSON.stringify(serverRecipe));
        }


        // Ensure the recipe has an id field (MongoDB returns _id)
        if (serverRecipe && serverRecipe._id && !serverRecipe.id) {
          serverRecipe.id = serverRecipe._id;
          console.log('Using MongoDB _id as id:', serverRecipe.id);
        } else if (serverRecipe && !serverRecipe.id && !serverRecipe._id) {
          // If neither id nor _id exists, generate one to prevent errors
          serverRecipe.id = `server_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
          console.warn('Server did not return an ID, generated:', serverRecipe.id);
        } else if (!serverRecipe) {
          throw new Error('Server returned empty recipe data');
        }

        // If image upload succeeded, update the recipe with the image URL
        if (imageUrl.status === 'fulfilled' && imageUrl.value) {
          console.log('Image upload succeeded, updating recipe with URL:', imageUrl.value);
          try {
            // Use the correct ID field for the PATCH request
            const recipeId = serverRecipe.id || serverRecipe._id;
            console.log(`Updating recipe ${recipeId} with image URL:`, imageUrl.value);
            const patchResponse = await axios.patch(`${apiUrl}/${recipeId}`, {
              image: imageUrl.value
            });
            console.log('Image PATCH response:', JSON.stringify(patchResponse.data));
            serverRecipe.image = imageUrl.value;
          } catch (error) {
            console.error('Error updating recipe with image URL:', error);
            // Continue anyway, the recipe is saved
          }
        }

        // Update local storage with the server-generated ID
        try {
          const storedRecipes = await AsyncStorage.getItem('userRecipes');
          let recipes = [];

          if (storedRecipes) {
            recipes = JSON.parse(storedRecipes);
            console.log(`Found ${recipes.length} existing recipes in AsyncStorage`);
            console.log(`Looking to replace temp recipe with ID: ${tempId}`);

            // Replace temp recipe with server recipe
            let found = false;
            recipes = recipes.map((recipe: any) => {
              if (recipe.id === tempId) {
                found = true;
                console.log('Found and replacing temp recipe with server recipe');
                return serverRecipe;
              }
              return recipe;
            });

            if (!found) {
              console.log('Temp recipe not found, adding server recipe to beginning');
              recipes.unshift(serverRecipe); // Add to beginning if temp recipe wasn't found
            }
          } else {
            // If no recipes exist yet, create new array with this recipe
            console.log('No existing recipes, creating new array with server recipe');
            recipes = [serverRecipe];
          }

          // Save updated recipes to AsyncStorage
          await AsyncStorage.setItem('userRecipes', JSON.stringify(recipes));
          console.log(`Saved ${recipes.length} recipes to AsyncStorage`);

          // Update timestamp to trigger refresh on main page
          const timestamp = new Date().toISOString();
          await AsyncStorage.setItem('recipes_last_updated', timestamp);
          await AsyncStorage.setItem('recipes_last_checked_timestamp', timestamp);
          console.log('Updated timestamps:', timestamp);

          // If user is logged in, update their specific timestamp too
          if (user?.uid) {
            await AsyncStorage.setItem(`recipes_last_updated_${user.uid}`, timestamp);
          }

          // Force refresh of recipes on home page - CRITICAL for immediate display
          await AsyncStorage.removeItem('force_refresh_recipes'); // Clear first to ensure clean state
          await AsyncStorage.setItem('force_refresh_recipes', 'true');
          console.log('Force refresh flag set to true');

          // Double check that the flag was set
          const checkFlag = await AsyncStorage.getItem('force_refresh_recipes');
          console.log('Verified force_refresh_recipes flag is:', checkFlag);

          // Success! Show message
          Alert.alert(
            'Sukses!',
            'Receta juaj u ruajt me sukses dhe tani është e disponueshme në profilin tuaj.',
            [{ text: 'Në rregull', style: 'default' }]
          );

          // Reset form fields
          setRecipeName('');
          setRecipeIngredients('');
          setRecipeInstructions('');
          setRecipeImage(null);

        } catch (error) {
          console.error('Error updating local storage:', error);
          Alert.alert('Gabim', 'Nuk mund të ruajmë recetat në ruajtjen lokale.');
        }
      }
    } catch (error: any) {
      console.error('Error saving recipe:', error);

      // Default error message - use let instead of const so we can modify it
      let errorMessage = 'Ndodhi një gabim gjatë ruajtjes së recetës. Ju lutemi provoni përsëri.';

      // More specific error messages based on error type
      if (error.response?.status === 413) {
        errorMessage = 'Imazhi është shumë i madh. Ju lutemi përdorni një imazh më të vogël.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Ju duhet të jeni të kyçur për të ruajtur receta.';
      }

      // Show more detailed error alert
      Alert.alert(
        'Gabim në ruajtjen e recetës',
        `${errorMessage}\n\nDetaje teknike: ${error.message || 'Gabim i panjohur'}`
      );

      const errorStr = typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error);
      console.log('Error string representation:', errorStr);

      // Check if it's a network error (common in mobile apps)
      const isNetworkError =
        errorStr.includes('Network Error') ||
        errorStr.includes('ECONNREFUSED') ||
        errorStr.includes('timeout');

      if (isNetworkError) {
        errorMessage = 'Nuk mund të lidhemi me serverin. Ju lutemi kontrolloni lidhjen tuaj të internetit.';

        // Try to save the recipe locally anyway
        try {
          console.log('Attempting to save recipe locally despite network error');

          // Recreate recipe data from form values since we're in the catch block
          const ingredientsArray = recipeIngredients
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);

          const localRecipeData = {
            name: recipeName.trim(),
            perberesit: ingredientsArray,
            instructions: recipeInstructions.trim(),
            image: null, // Can't upload image in offline mode
            userId: user?.uid || 'anonymous',
            createdAt: new Date().toISOString(),
          };

          // Create offline recipe with offline flags
          const offlineRecipe = {
            ...localRecipeData,
            id: `offline_${Date.now()}`,
            offlineCreated: true,
            pendingSync: true,
            image: null // Can't upload image offline
          };

          const storedRecipes = await AsyncStorage.getItem('userRecipes');
          let recipes = [];

          if (storedRecipes) {
            recipes = JSON.parse(storedRecipes);
          }

          // Add the offline recipe
          recipes.unshift(offlineRecipe);
          await AsyncStorage.setItem('userRecipes', JSON.stringify(recipes));

          // Set force refresh flag anyway
          await AsyncStorage.setItem('force_refresh_recipes', 'true');
          console.log('Saved recipe locally despite network error');

          errorMessage += ' Receta është ruajtur lokalisht dhe do të sinkronizohet kur lidhja të jetë e disponueshme.';
        } catch (storageError) {
          console.error('Failed to save recipe locally:', storageError);
        }
      }

      // Show error message but don't reopen modal unless user wants to
      Alert.alert(
        'Gabim gjatë ruajtjes',
        errorMessage + ' Dëshironi të provoni përsëri?',
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

  // DEVELOPMENT VERSION: Returns placeholder image instead of uploading to Firebase
  // This avoids CORS issues during development
  const uploadImageToFirebase = async (uri: string): Promise<string> => {
    try {
      console.log('Firebase upload bypassed for development - using placeholder image');
      // Just return a placeholder image URL without attempting Firebase upload
      return 'https://via.placeholder.com/300x200?text=Profile+Image+Placeholder';

      /* ORIGINAL FIREBASE UPLOAD CODE - DISABLED DUE TO CORS ISSUES
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
      */
    } catch (error) {
      console.error('Error with image handling:', error);
      // Return placeholder even on error to avoid breaking the app
      return 'https://via.placeholder.com/300x200?text=Profile+Image+Error';
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
      // Show detailed error information
      console.error('Error in handlePublishRecipe:', error);

      // Display a detailed error alert
      Alert.alert(
        'Gabim në ruajtjen e recetës',
        `Detaje të gabimit: ${error.message || 'Gabim i panjohur'}`
      );
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
            style={{ width: '100%', alignItems: 'center', flex: 1 }}
          >
            <View style={[s.modalContainer, s.recipeModalContainer]}>
              {/* Fixed Title */}
              <Text style={[s.modalTitle, { color: '#333', marginBottom: 15, fontSize: 24 }]}>Ruaj Recetë të Re</Text>

              {/* Scrollable Form Content */}
              <ScrollView
                contentContainerStyle={s.modalScrollContentStyle}
                showsVerticalScrollIndicator={true}
                style={s.recipeScrollView}
                nestedScrollEnabled={true}
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

              </ScrollView>

              {/* Action buttons - Fixed at bottom */}
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
                      <Text style={[s.saveButtonText, s.savingTextStyle]}>Duke ruajtur...</Text>
                    </View>
                  ) : (
                    <View style={s.saveButtonContent}>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={s.saveButtonText}>Ruaj Recetën</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

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
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    width: '100%',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formSection: {
    marginBottom: 20,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#e8e8e8',
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
    opacity: 0.6,
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
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 15,
    padding: 20,
    shadowRadius: 8,
    elevation: 8,
  },
  recipeScrollView: {
    width: '100%',
    flex: 1,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modalScrollContentStyle: {
    flexGrow: 1,
    paddingBottom: 20,
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
  formSectionDivider: {
    width: '100%',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 15,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginLeft: 8,
    letterSpacing: 0.3,
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
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    color: '#777',
    textAlign: 'right',
    marginTop: 4,
    marginRight: 5,
    fontWeight: '500',
  },
  ingredientCount: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 5,
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inputWarning: {
    borderColor: '#FFCC00',
    borderWidth: 1.5,
    backgroundColor: '#FFFDE7',
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
    borderRadius: 12,
    resizeMode: 'cover',
    marginTop: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    padding: 3,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    width: '100%',
    paddingHorizontal: 5,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#43A047',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  savingTextStyle: {
    marginLeft: 8,
  },
});

export default ProfileScreen;