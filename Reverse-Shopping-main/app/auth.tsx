import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const AuthScreen = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Gabim', 'Ju lutem plotësoni email dhe fjalëkalimin');
            return;
        }

        if (!isLogin && (!firstName || !lastName)) {
            Alert.alert('Gabim', 'Ju lutem plotësoni emrin dhe mbiemrin');
            return;
        }

        setIsLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                Alert.alert('Sukses', 'Ju jeni kyçur me sukses!');
                router.replace('/profile');
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                Alert.alert('Sukses', 'Llogaria u krijua me sukses!');
                router.replace('/profile');
            }
        } catch (error: any) {
            let errorMessage = 'Ndodhi një gabim. Ju lutem provoni përsëri.';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Ky email është tashmë në përdorim.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email i pavlefshëm.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'Përdoruesi nuk ekziston.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Fjalëkalimi i gabuar.';
                    break;
            }

            Alert.alert('Gabim', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../assets/images/background.jpg')}
            style={styles.background}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.formWrapper}>
                    <Ionicons name="person-circle-outline" size={80} color="#007AFF" style={styles.icon} />
                    <Text style={styles.title}>
                        {isLogin ? 'Kyçu në Llogarinë Tënde' : 'Krijo një Llogari të Re'}
                    </Text>

                    {!isLogin && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Emri"
                                value={firstName}
                                onChangeText={setFirstName}
                                autoCapitalize="words"
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Mbiemri"
                                value={lastName}
                                onChangeText={setLastName}
                                autoCapitalize="words"
                            />
                        </>
                    )}

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Fjalëkalimi"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.authButton, isLoading && styles.disabledButton]}
                        onPress={handleAuth}
                        disabled={isLoading}
                    >
                        <Text style={styles.authButtonText}>
                            {isLoading ? 'Duke u procesuar...' : isLogin ? 'Kyçu' : 'Regjistrohu'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                        <Text style={styles.toggleText}>
                            {isLogin ? 'Nuk ke llogari? Regjistrohu' : 'Ke llogari? Kyçu'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',

    },
    container: {
        flex: 1,
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    formWrapper: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 24,
        borderRadius: 16,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
    },
    icon: {
        alignSelf: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#333',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    authButton: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        elevation: 2,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    authButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    toggleText: {
        color: '#007AFF',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 14,
    },
});

export default AuthScreen;
