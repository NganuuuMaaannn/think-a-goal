// utils/firebaseConfig.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Your config
const firebaseConfig = {
  apiKey: "AIzaSyDJ7jy3ALjsN_NTWBOmWGRUdK1IMTGk2Kg",
  authDomain: "think-a-goal.firebaseapp.com",
  projectId: "think-a-goal",
  storageBucket: "think-a-goal.firebasestorage.app",
  messagingSenderId: "691613910407",
  appId: "1:691613910407:web:f006e8c74b5b0499d93f22",
  measurementId: "G-BYH6VDNC7Q",
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Initialize Auth properly
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
