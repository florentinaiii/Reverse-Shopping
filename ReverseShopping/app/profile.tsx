import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const ProfileScreen = () => {
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);

  return (
    <ImageBackground 
      source={require("../assets/images/background.jpg")} 
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        {/* Your existing profile content */}
        
        {/* Login/Signup Button */}
        <TouchableOpacity 
          style={styles.authButton}
          onPress={() => setIsAuthModalVisible(true)}
        >
          <Text style={styles.authButtonText}>Regjistrohu/Kyçu</Text>
          <Ionicons name="log-in-outline" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Auth Modal */}
        <Modal
          visible={isAuthModalVisible}
          animationType="slide"
          transparent={false}
        >
         
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  authButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
  },
});

export default ProfileScreen;