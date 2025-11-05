import { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { ThemeContext } from "../utils/ThemeContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../utils/firebaseConfig";
import {
  getDocs,
  query,
  collection,
  where,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const { darkMode } = useContext(ThemeContext);
  const [backupGoals, setBackupGoals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // individual delete modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // bulk modals
  const [restoreAllVisible, setRestoreAllVisible] = useState(false);
  const [deleteAllVisible, setDeleteAllVisible] = useState(false);

  const loadBackupGoals = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(collection(db, "backup_goals"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const goals = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBackupGoals(goals);
      console.log(`🧾 Loaded ${goals.length} backup goals`);
    } catch (err) {
      console.error("Error loading backup goals:", err);
    }
  };

  useEffect(() => {
    loadBackupGoals();
  }, []);

  const restoreGoal = async (goal) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const restoreRef = doc(db, "goals", goal.id);
      await setDoc(restoreRef, {
        uid: user.uid,
        text: goal.text,
        completed: goal.completed || false,
        createdAt: new Date().toISOString(),
      });
      await deleteDoc(doc(db, "backup_goals", goal.id));
      setBackupGoals((prev) => prev.filter((g) => g.id !== goal.id));
    } catch (err) {
      console.error("Error restoring goal:", err);
    }
  };

  const permanentlyDelete = async (goal) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const allGoalsRef = collection(db, "all_goals");
      await addDoc(allGoalsRef, {
        uid: user.uid,
        text: goal.text,
        completed: goal.completed || false,
        originallyDeletedAt: goal.deletedAt || new Date().toISOString(),
        permanentlyDeletedAt: new Date().toISOString(),
      });
      await deleteDoc(doc(db, "backup_goals", goal.id));
      setBackupGoals((prev) => prev.filter((g) => g.id !== goal.id));
    } catch (err) {
      console.error("Error permanently deleting goal:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedGoal) await permanentlyDelete(selectedGoal);
    setDeleteModalVisible(false);
    setSelectedGoal(null);
  };

  const restoreAll = async () => {
    const user = auth.currentUser;
    if (!user || backupGoals.length === 0) return;
    try {
      for (const goal of backupGoals) {
        const restoreRef = doc(db, "goals", goal.id);
        await setDoc(restoreRef, {
          uid: user.uid,
          text: goal.text,
          completed: goal.completed || false,
          createdAt: new Date().toISOString(),
        });
        await deleteDoc(doc(db, "backup_goals", goal.id));
      }
      setBackupGoals([]);
      setRestoreAllVisible(false);
      console.log("Restored all goals successfully!");
    } catch (err) {
      console.error("Error restoring all:", err);
    }
  };

  const deleteAll = async () => {
    const user = auth.currentUser;
    if (!user || backupGoals.length === 0) return;
    try {
      const allGoalsRef = collection(db, "all_goals");
      for (const goal of backupGoals) {
        await addDoc(allGoalsRef, {
          uid: user.uid,
          text: goal.text,
          completed: goal.completed || false,
          originallyDeletedAt: goal.deletedAt || new Date().toISOString(),
          permanentlyDeletedAt: new Date().toISOString(),
        });
        await deleteDoc(doc(db, "backup_goals", goal.id));
      }
      setBackupGoals([]);
      setDeleteAllVisible(false);
      console.log("Deleted all backup goals");
    } catch (err) {
      console.error("Error deleting all:", err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBackupGoals();
    setRefreshing(false);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: darkMode ? "#121212" : "#fff" },
        ]}
      >
        <Text
          style={[
            styles.header,
            { color: darkMode ? "#fff" : "#000", textAlign: "center" },
          ]}
        >
          Recently Deleted Goals
        </Text>

        {/* Action Row */}
        {backupGoals.length > 0 && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#0078ff" }]}
              onPress={() => setRestoreAllVisible(true)}
            >
              <Ionicons name="refresh-circle" size={22} color="#fff" />
              <Text style={styles.actionText}>Restore All</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#ff3b30" }]}
              onPress={() => setDeleteAllVisible(true)}
            >
              <Ionicons name="trash-bin" size={22} color="#fff" />
              <Text style={styles.actionText}>Delete All</Text>
            </TouchableOpacity>
          </View>
        )}

        {backupGoals.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0078ff"
                colors={["#0078ff"]}
              />
            }
            alwaysBounceVertical
            overScrollMode="always"
          >
            <Text style={{ color: darkMode ? "#fff" : "#555" }}>
              No recently deleted goals.
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0078ff"
                colors={["#0078ff"]}
              />
            }
            alwaysBounceVertical
            overScrollMode="always"
          >
            {backupGoals.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.goalItem,
                  { backgroundColor: darkMode ? "#1E1E1E" : "#f9f9f9" },
                ]}
              >
                <Text style={{ color: darkMode ? "#fff" : "#000", flex: 1 }}>
                  {item.text}
                </Text>

                <TouchableOpacity onPress={() => restoreGoal(item)}>
                  <Ionicons
                    name="refresh-circle"
                    size={26}
                    color="#0078ff"
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedGoal(item);
                    setDeleteModalVisible(true);
                  }}
                >
                  <Ionicons
                    name="trash-bin"
                    size={26}
                    color="#ff3b30"
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Individual Delete Modal */}
        <Modal transparent visible={deleteModalVisible} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { backgroundColor: darkMode ? "#222" : "#fff" }]}>
              <Ionicons name="alert-circle-outline" size={50} color="#ff3b30" />
              <Text style={[styles.modalTitle, { color: darkMode ? "#fff" : "#000" }]}>
                Delete Goal
              </Text>
              <Text style={[styles.modalText, { color: darkMode ? "#aaa" : "#555" }]}>
                Are you sure you want to delete this goal forever?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ff3b30" }]} onPress={handleConfirmDelete}>
                  <Text style={styles.btnText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#888" }]} onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.btnText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Restore All Modal */}
        <Modal transparent visible={restoreAllVisible} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { backgroundColor: darkMode ? "#222" : "#fff" }]}>
              <Ionicons name="refresh-circle-outline" size={50} color="#0078ff" />
              <Text style={[styles.modalTitle, { color: darkMode ? "#fff" : "#000" }]}>
                Restore All Goals?
              </Text>
              <Text style={[styles.modalText, { color: darkMode ? "#aaa" : "#555" }]}>
                This will restore all deleted goals back to your list.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#0078ff" }]} onPress={restoreAll}>
                  <Text style={styles.btnText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#888" }]} onPress={() => setRestoreAllVisible(false)}>
                  <Text style={styles.btnText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete All Modal */}
        <Modal transparent visible={deleteAllVisible} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={[styles.modalContainer, { backgroundColor: darkMode ? "#222" : "#fff" }]}>
              <Ionicons name="alert-circle-outline" size={50} color="#ff3b30" />
              <Text style={[styles.modalTitle, { color: darkMode ? "#fff" : "#000" }]}>
                Delete All Goals?
              </Text>
              <Text style={[styles.modalText, { color: darkMode ? "#aaa" : "#555" }]}>
                This will permanently delete all goals and cannot be undone.
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#ff3b30" }]} onPress={deleteAll}>
                  <Text style={styles.btnText}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#888" }]} onPress={() => setDeleteAllVisible(false)}>
                  <Text style={styles.btnText}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { fontSize: 28, fontWeight: "700", marginTop: 15 },
  goalItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginVertical: 6,
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  actionRow: { flexDirection: "row", justifyContent: "center", marginTop: 15, gap: 12 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  actionText: { color: "#fff", fontWeight: "600", marginLeft: 6, fontSize: 15 },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: { width: "80%", borderRadius: 15, padding: 20, alignItems: "center" },
  modalTitle: { fontSize: 20, fontWeight: "700", marginTop: 10 },
  modalText: { fontSize: 15, marginBottom: 20, textAlign: "center" },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
  modalBtn: { flex: 1, paddingVertical: 12, marginHorizontal: 6, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "600" },
});
