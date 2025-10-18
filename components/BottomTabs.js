import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "./DashboardScreen";
import ProfileScreen from "./ProfileScreen";
import GoalsScreen from "./GoalsScreen";
import { Ionicons } from "@expo/vector-icons";
import { useContext } from "react";
import { ThemeContext } from "../utils/ThemeContext";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  const { darkMode } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12 },
        tabBarActiveTintColor: darkMode ? "#4dabf7" : "#0078ff",
        tabBarInactiveTintColor: darkMode ? "#aaa" : "#999",
        tabBarStyle: {
          backgroundColor: darkMode ? "#1e1e1e" : "#fff",
          height: 75,
          borderTopWidth: 0.3,
          borderColor: darkMode ? "#333" : "#ddd",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === "Dashboard") iconName = "home";
          else if (route.name === "Goals") iconName = "list";
          else if (route.name === "Profile") iconName = "person";
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
