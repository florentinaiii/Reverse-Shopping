// app/config.ts

// API Configuration
const API_CONFIG = {
  // Development
  development: {
    baseURL: 'http://localhost:5000',
  },
  // Production - Update this with your Render backend URL
  production: {
    baseURL: 'https://your-render-backend-url.onrender.com',
  },
};

// Get current environment
const getEnvironment = (): 'development' | 'production' => {
  if (typeof window !== 'undefined') {
    // Client-side
    return window.location.hostname === 'localhost' ? 'development' : 'production';
  }
  // Server-side or React Native
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

// Export current API configuration
export const API_BASE_URL = API_CONFIG[getEnvironment() as 'development' | 'production'].baseURL;

// Firebase configuration (already configured in firebase.ts)
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC6yRWf1Oo_PY-y0nX6l8qrIBAXWfdEfV0",
  authDomain: "reverseshooping.firebaseapp.com",
  projectId: "reverseshooping",
  storageBucket: "reverseshooping.appspot.com",
  messagingSenderId: "807045364369",
  appId: "1:807045364369:web:e44cd5cbd9e44bc2505d30",
  measurementId: "G-ZLS9XGZ28E"
}; 