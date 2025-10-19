import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { ThemeContext } from "../utils/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { Animated } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";
import { auth, db } from "../utils/firebaseConfig";
import { doc, setDoc, getDocs, collection, query, where, deleteDoc, addDoc } from "firebase/firestore";

export default function GoalsScreen() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const [goals, setGoals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const route = useRoute();
  const [screenAnim] = useState(new Animated.Value(0));

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);

    if (title.toLowerCase().includes("added")) {
      setTimeout(() => setAlertVisible(false), 2000);
    }
  };

  // Load dark mode
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("darkMode");
      if (saved !== null) setDarkMode(saved === "true");
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  useFocusEffect(
    useCallback(() => {
      Animated.timing(screenAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (route.params?.openAddModal) {
        setTimeout(() => {
          setModalVisible(true);
        }, 400);

        setTimeout(() => {
          route.params.openAddModal = false;
        }, 800);
      }

      return () => {
        Animated.timing(screenAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start();
      };
    }, [route.params])
  );

  // Load goals from AsyncStorage
  const loadGoals = async () => {
    try {
      const user = auth.currentUser;
        if (!user) return;
        const savedGoals = await AsyncStorage.getItem(`goals_${user.uid}`);
      if (savedGoals) {
        const parsed = JSON.parse(savedGoals);
        // ensure each goal has an id
        const withIds = parsed.map((g) => ({
          id: g.id || uuid.v4(),
          ...g,
        }));
        setGoals(withIds);
        await AsyncStorage.setItem(`goals_${user.uid}`, JSON.stringify(withIds));
      } else setGoals([]);
    } catch (error) {
      console.error("Error loading goals:", error);
    }
  };

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
      const saved = await AsyncStorage.getItem(`goals_${user.uid}`)
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
      await AsyncStorage.setItem(`goals_${user.uid}`, JSON.stringify(deduped));

      console.log(`Loaded ${userGoals.length} goals from Firestore, merged ${localGoals.length} local`);
    } catch (error) {
      console.error("Failed to load goals:", error);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  // Save goals back to AsyncStorage
  const saveGoals = async (updatedGoals) => {
    setGoals(updatedGoals);
    const user = auth.currentUser;
      if (user)
      await AsyncStorage.setItem(`goals_${user.uid}`, JSON.stringify(updatedGoals));
  };

  // Toggle completion
  const toggleGoal = async (id) => {
    const updated = goals.map((g) =>
      g.id === id ? { ...g, completed: !g.completed } : g
    );
    await saveGoals(updated);

    // If this is a Firestore-backed doc, update it remotely
    const user = auth.currentUser;
    if (user) {
      try {
        const goal = updated.find((g) => g.id === id);
        if (goal) {
          const docRef = doc(db, "goals", id);
          try {
            const snap = await getDocs(query(collection(db, "goals"), where("__name__", "==", id)));
            if (!snap.empty) {
              await setDoc(docRef, { ...goal, uid: user.uid });
            }
          } catch (err) {
            console.warn("Could not update Firestore on toggle:", err);
          }
        }
      } catch (err) {
        console.error("Toggle error:", err);
      }
    }
  };

  const addGoal = async () => {
    const trimmed = goalText.trim();
    if (!trimmed) {
      showAlert("Empty Field", "Please enter a goal before saving.");
      return;
    }

    const isDuplicate = goals.some(
      (g) => g.text.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      showAlert("Duplicate Goal", "That goal already exists. Try another one.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showAlert("Not Signed In", "Please sign in before adding a goal.");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, "goals"), {
        uid: user.uid,
        text: trimmed,
        completed: false,
        createdAt: new Date().toISOString(),
      });

      console.log("Goal added:", docRef.id);
      setGoalText("");
      setModalVisible(false);

      await loadGoalsFromFirestore();

      showAlert("Goal Added", "Your goal has been successfully added!");
    } catch (error) {
      console.error("Firestore add failed:", error);
      showAlert("Error", "Something went wrong while adding your goal.");
    }
  };

  // Edit goal
  const openEditModal = (goal) => {
    setSelectedGoal(goal);
    setEditedText(goal.text);
    setEditModalVisible(true);
  };

  const confirmEdit = async () => {
    const updated = goals.map((g) =>
      g.id === selectedGoal.id ? { ...g, text: editedText } : g
    );
    await saveGoals(updated);
    // Update Firestore if doc exists
    const user = auth.currentUser;
    if (user) {
      try {
        const goal = updated.find((g) => g.id === selectedGoal.id);
        if (goal) {
          const docRef = doc(db, "goals", goal.id);
          const snap = await getDocs(query(collection(db, "goals"), where("__name__", "==", goal.id)));
          if (!snap.empty) {
            await setDoc(docRef, { ...goal, uid: user.uid });
          }
        }
      } catch (err) {
        console.warn("Could not update Firestore on edit:", err);
      }
    }
    setEditModalVisible(false);
  };

  // Delete goal
  const openDeleteModal = (goal) => {
    setSelectedGoal(goal);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    const user = auth.currentUser;
    if (!selectedGoal) return;

    try {
      // Move goal to backup collection
      if (user) {
        const backupRef = doc(db, "backup_goals", selectedGoal.id);
        await setDoc(backupRef, {
          ...selectedGoal,
          uid: user.uid,
          deletedAt: new Date().toISOString(),
        });
        console.log("Moved goal to backup collection");
      }

      // Delete locally (from AsyncStorage)
      const updated = goals.filter((g) => g.id !== selectedGoal.id);
      await saveGoals(updated);

      // Delete from Firestore (main goals collection)
      if (user) {
        const goalRef = doc(db, "goals", selectedGoal.id);
        await deleteDoc(goalRef);
        console.log("Goal deleted from Firestore goals collection");
      }

      // Close modal
      setDeleteModalVisible(false);
    } catch (err) {
      console.error("Could not delete goal properly:", err);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: darkMode ? "#121212" : "#fff" },
        ]}
      >
        <Text style={[styles.textTitle, { color: darkMode ? "#fff" : "#555" }]}> List of Goals </Text>
        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.text, { color: darkMode ? "#fff" : "#555" }]}>
              No goals yet
            </Text>
          </View>
        ) : (
          <FlatList
            data={goals}
            keyExtractor={(item, index) => item.id || `${item.text}-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0078ff"
                colors={["#0078ff"]}
              />
            }
            contentContainerStyle={{ padding: 20 }}
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
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                  onPress={() => toggleGoal(item.id)}
                >
                  <Ionicons
                    name={
                      item.completed ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={22}
                    color={item.completed ? "#0078ff" : "#999"}
                  />
                  <Text
                    style={{
                      color: darkMode ? "#fff" : "#000",
                      textDecorationLine: item.completed
                        ? "line-through"
                        : "none",
                      marginLeft: 10,
                      flex: 1,
                    }}
                  >
                    {item.text}
                  </Text>
                </TouchableOpacity>

                {/* Edit Icon */}
                <TouchableOpacity onPress={() => openEditModal(item)}>
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color={darkMode ? "#4dabf7" : "#0078ff"}
                    style={{ marginRight: 10 }}
                  />
                </TouchableOpacity>

                {/* 🗑️ Delete Icon */}
                <TouchableOpacity onPress={() => openDeleteModal(item)}>
                  <Ionicons name="trash-outline" size={22} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: "#0078ff" }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>

        <Modal transparent visible={modalVisible} animationType="slide">
          <View style={styles.modalBackground}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: darkMode ? "#222" : "#fff" },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: darkMode ? "#fff" : "#000" },
                ]}
              >
                Add New Goal
              </Text>
              <TextInput
                placeholder="Enter your goal"
                placeholderTextColor={darkMode ? "#888" : "#999"}
                style={[
                  styles.input,
                  {
                    backgroundColor: darkMode ? "#1E1E1E" : "#f9f9f9",
                    color: darkMode ? "#fff" : "#000",
                    height: Math.max(100, goalText.split("\n").length * 22), // auto height
                    textAlignVertical: "top", // aligns text at top
                  },
                ]}
                multiline
                value={goalText}
                onChangeText={setGoalText}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#0078ff" }]}
                  onPress={addGoal}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#888" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal transparent visible={editModalVisible} animationType="fade">
          <View style={styles.modalBackground}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: darkMode ? "#222" : "#fff" },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  { color: darkMode ? "#fff" : "#000" },
                ]}
              >
                Edit Goal
              </Text>
              <TextInput
                value={editedText}
                onChangeText={setEditedText}
                style={[
                  styles.input,
                  {
                    backgroundColor: darkMode ? "#1E1E1E" : "#f9f9f9",
                    color: darkMode ? "#fff" : "#000",
                  },
                ]}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#0078ff" }]}
                  onPress={confirmEdit}
                >
                  <Text style={styles.btnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#888" }]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Modal */}
        <Modal transparent visible={deleteModalVisible} animationType="fade">
          <View style={styles.modalBackground}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: darkMode ? "#222" : "#fff" },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={50} color="#ff3b30" />
              <Text
                style={[
                  styles.modalTitle,
                  { color: darkMode ? "#fff" : "#000" },
                ]}
              >
                Delete Goal
              </Text>
              <Text
                style={[
                  styles.modalText,
                  { color: darkMode ? "#aaa" : "#555" },
                ]}
              >
                Are you sure you want to delete this goal?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#ff3b30" }]}
                  onPress={confirmDelete}
                >
                  <Text style={styles.btnText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: "#888" }]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={styles.btnText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={alertVisible} animationType="fade">
          <View style={styles.modalBackground}>
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: darkMode ? "#222" : "#fff" },
              ]}
            >
              <Ionicons
                name={
                  (alertTitle.toLowerCase().includes("error") ||
                  alertMessage.toLowerCase().includes("error") ||
                  alertTitle.toLowerCase().includes("fail") ||
                  alertMessage.toLowerCase().includes("fail"))
                    ? "alert-circle-outline"
                    : (alertTitle.toLowerCase().includes("duplicate") ||
                      alertTitle.toLowerCase().includes("empty") ||
                      alertTitle.toLowerCase().includes("not signed"))
                    ? "warning-outline"
                    : "checkmark-circle-outline"
                }
                size={50}
                color={
                  (alertTitle.toLowerCase().includes("error") ||
                  alertMessage.toLowerCase().includes("error") ||
                  alertTitle.toLowerCase().includes("fail") ||
                  alertMessage.toLowerCase().includes("fail"))
                    ? "#ff3b30"
                    : (alertTitle.toLowerCase().includes("duplicate") ||
                      alertTitle.toLowerCase().includes("empty") ||
                      alertTitle.toLowerCase().includes("not signed"))
                    ? "#ffcc00"
                    : "#4CD964"
                }
              />
              <Text
                style={[
                  styles.modalTitle,
                  { color: darkMode ? "#fff" : "#000", marginTop: 8 },
                ]}
              >
                {alertTitle}
              </Text>
              <Text
                style={[
                  styles.modalText,
                  { color: darkMode ? "#aaa" : "#555", textAlign: "center" },
                ]}
              >
                {alertMessage}
              </Text>
                <TouchableOpacity
                  style={styles.alertBtn}
                  activeOpacity={0.8}
                  onPress={() => setAlertVisible(false)}
                >
                  <Text
                    style={styles.alertBtnText}
                  >
                    OK
                  </Text>
                </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  textTitle: { fontWeight: "bold", fontSize: 28, textAlign: "center", marginVertical: 16 },
  text: { fontSize: 18, textAlign: "center" },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 10 },
  input: {
    width: "100%",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
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
  modalText: { fontSize: 15, marginBottom: 20, textAlign: "center" },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  alertBtn: {
    backgroundColor: "#0078ff",
    width: "60%",
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  alertBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});
