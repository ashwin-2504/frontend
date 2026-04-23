// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase client-side configuration.
// NOTE: These API keys are PUBLIC by design per Firebase documentation:
// https://firebase.google.com/docs/projects/api-keys
// Security is enforced via Firebase Security Rules and App Check, not key secrecy.
const firebaseConfig = {
  apiKey: "AIzaSyCidWEWLOL08iTjQOG7Dfl5mh65N5nIBKY",
  authDomain: "onlinemarket-e32e6.firebaseapp.com",
  projectId: "onlinemarket-e32e6",
  storageBucket: "onlinemarket-e32e6.firebasestorage.app",
  messagingSenderId: "266479840156",
  appId: "1:266479840156:web:b6a04a2d2fc2edbf6d3659",
  measurementId: "G-2J26R30WNK",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Fix for unsupported environments (Expo/React Native)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
