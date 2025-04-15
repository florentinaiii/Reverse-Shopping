import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD4BzmjCoFY2JQDhFWPInytbhsVIQHm5kI",
    authDomain: "reverse-shopping.firebaseapp.com",
    projectId: "reverse-shopping",
    storageBucket: "reverse-shopping.firebasestorage.app",
    messagingSenderId: "51217165978",
    appId: "1:51217165978:web:3a8c070289833c8c37f923",
    measurementId: "G-RGZKE5KC97"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);