// app/auth.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
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
                // Kyçja e përdoruesit ekzistues
                await signInWithEmailAndPassword(auth, email, password);
                Alert.alert('Sukses', 'Ju jeni kyçur me sukses!');
                router.replace('/profile');
            } else {
                // Regjistrimi i përdoruesit të ri
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Ruaj të dhënat shtesë të përdoruesit në Firestore (mund të implementohet më vonë)
                // await setDoc(doc(db, "users", user.uid), {
                //     firstName,
                //     lastName,
                //     email,
                //     createdAt: new Date()
                // });

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
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.innerContainer}>
                <Ionicons name="person-circle-outline" size={80} color="#007AFF" style={styles.icon} />
                <Text style={styles.title}>{isLogin ? 'Kyçu në Llogarinë Tënde' : 'Krijo një Llogari të Re'}</Text>

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
                    {isLoading ? (
                        <Text style={styles.authButtonText}>Duke u procesuar...</Text>
                    ) : (
                        <Text style={styles.authButtonText}>
                            {isLogin ? 'Kyçu' : 'Regjistrohu'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                    <Text style={styles.toggleText}>
                        {isLogin ? 'Nuk ke llogari? Regjistrohu' : 'Ke llogari? Kyçu'}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
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