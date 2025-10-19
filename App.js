import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import BottomTabs from './components/BottomTabs';
import EditProfileScreen from './components/EditProfileScreen';
import RecentlyDeleteScreen from './components/RecentlyDeleteScreen';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./utils/firebaseConfig";
import { ThemeProvider } from "./utils/ThemeContext";
import { useEffect } from 'react';
import AuthLoadingScreen from "./components/AuthLoadingScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(user ? "User is logged in" : "No user logged in");
    });
    return unsubscribe;
  }, []);

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="AuthLoading"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
            <Stack.Screen name="MainTabs" component={BottomTabs} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="RecentlyDelete" component={RecentlyDeleteScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
