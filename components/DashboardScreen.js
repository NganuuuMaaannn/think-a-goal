import { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../utils/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth, db } from "../utils/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";


export default function DashboardScreen() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [goals, setGoals] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("darkMode");
      if (saved !== null) setDarkMode(saved === "true");
    })();
  }, []);
  useEffect(() => {
    AsyncStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  const fetchQuote = async () => {
    setLoading(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      let attempts = 0;
      let selectedQuote = null;

      while (attempts < 5 && !selectedQuote) {
        const response = await fetch("https://zenquotes.io/api/random", {
          signal: controller.signal,
        });
        const result = await response.json();
        const quote = result[0];

        if (
          /(goal|dream|success|achieve|vision|focus|plan|ambition|future)/i.test(
            quote.q
          )
        ) {
          selectedQuote = quote;
        } else attempts++;
      }

      setQuote(
        selectedQuote || {
          q: "Believe in your dreams even when they seem impossible.", 
        }
      );
    } catch (error) {
      console.warn("⚠️ Quote fetch failed, using fallback:", error.name);
      setQuote({
        q: "Set your goals high and don’t stop till you get there.",
      });
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const loadGoalsFromFirestore = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(db, "goals"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);

      const userGoals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Merge with local goals
      const saved = await AsyncStorage.getItem("goals");
      const localGoals = saved ? JSON.parse(saved) : [];

      // Build a map of firestore goals by id and by text for quick lookup
      const firestoreById = new Map(userGoals.map((g) => [g.id, g]));
      const firestoreByText = new Map(userGoals.map((g) => [g.text, g]));

      // Start with Firestore goals (they have stable ids)
      const merged = [...userGoals];

      // Add local goals only if they don't exist in Firestore (by text)
      for (const lg of localGoals) {
        if (!firestoreByText.has(lg.text)) {
          // Ensure local goal has an id (keep existing id if present)
          merged.push({ id: lg.id || lg.id === 0 ? lg.id : undefined, ...lg });
        }
      }

      // Final dedupe by text to be safe (preserve first occurrence — Firestore wins)
      const seen = new Set();
      const deduped = merged.filter((g) => {
        if (!g || !g.text) return false;
        if (seen.has(g.text)) return false;
        seen.add(g.text);
        return true;
      });

      setGoals(deduped);
      await AsyncStorage.setItem("goals", JSON.stringify(deduped));

      console.log(`Loaded ${userGoals.length} goals from Firestore, merged ${localGoals.length} local`);
    } catch (error) {
      console.error("❌ Failed to load goals:", error);
    }
  };

  // On login, load goals
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.displayName) {
        const first = user.displayName.split(" ")[0] || "User";
        setFirstName(first);
        loadGoalsFromFirestore();
      }
    });
    return unsubscribe;
  }, []);

  // Progress
  const progress =
    goals.length === 0
      ? 0
      : Math.round((goals.filter((g) => g.completed).length / goals.length) * 100);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGoalsFromFirestore().finally(() => {
      setRefreshing(false);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: darkMode ? "#121212" : "#fff" },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0078ff"
              colors={["#0078ff"]}
            />
          }
        >
          <Text
            style={[styles.header, { color: darkMode ? "#fff" : "#000" }]}
          >{`Welcome back, ${firstName}! 👋`}</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#0078ff" />
          ) : (
            <Text
              style={[styles.quote, { color: darkMode ? "#bbb" : "#555" }]}
            >{`“${quote?.q}”`}</Text>
          )}

          <View style={styles.goal}>
            <View style={[styles.progressCircle, { borderColor: "#0078ff" }]}>
              <Text style={[styles.percent, { color: "#0078ff" }]}>
                {progress}%
              </Text>
            </View>

            <Text
              style={[
                styles.label,
                {
                  color:
                    progress === 100
                      ? "#0078ff"
                      : darkMode
                      ? "#fff"
                      : "#000",
                },
              ]}
            >
              {progress === 100 ? "All Goals Completed" : "Working Progress"}
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: darkMode ? "#1E1E1E" : "#f9f9f9" },
            ]}
          >
            {/* Header Row: My Goals + View All */}
            <View style={styles.cardHeader}>
              <Text
                style={[styles.cardTitle, { color: darkMode ? "#fff" : "#000" }]}
              >
                My Goals
              </Text>

              <TouchableOpacity onPress={() => navigation.navigate("Goals")}>
                <Text
                  style={{
                    color: "#0078ff",
                    fontWeight: "600",
                    fontSize: 14,
                  }}
                >
                  View All Goals
                </Text>
              </TouchableOpacity>
            </View>

            {goals.length === 0 ? (
              <Text
                style={{
                  color: darkMode ? "#888" : "#666",
                  textAlign: "center",
                  marginTop: 10,
                }}
              >
                No goals yet. Tap + to add one!
              </Text>
            ) : (
              <FlatList
                data={goals.slice(0, 5)}
                keyExtractor={(item, index) => item.id || `${item.text}-${index}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.goalItem,
                      {
                        backgroundColor: item.completed
                          ? darkMode
                            ? "#1d3b1d"
                            : "#d4f7d4"
                          : darkMode
                          ? "#2a2a2a"
                          : "#fff",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: darkMode ? "#fff" : "#000",
                        textDecorationLine: item.completed ? "line-through" : "none",
                        fontWeight: item.completed ? "600" : "400",
                        marginLeft: 10,
                        flex: 1,
                      }}
                    >
                      {item.text}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: "#0078ff" }]}
          onPress={() => navigation.navigate("Goals", { openAddModal: true })}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { fontSize: 45, fontWeight: "600" },
  quote: { fontSize: 20, marginVertical: 10, fontStyle: "italic" },
  progressCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    borderWidth: 10,
    borderRadius: 100,
    width: 200,
    height: 200,
  },
  percent: { fontSize: 40, fontWeight: "bold" },
  goal: { alignItems: "center" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  card: { borderRadius: 15, padding: 20, marginTop: 40 },
  cardTitle: { fontWeight: "600", fontSize: 18, marginBottom: 10 },
  label: { marginTop: 20, fontSize: 24, fontWeight: "500" },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
  },
  addBtn: {
    position: "absolute",
    bottom: 20,
    right: 30,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
