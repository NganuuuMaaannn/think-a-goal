import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { auth } from "../utils/firebaseConfig";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { ThemeContext } from "../utils/ThemeContext";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";

export default function EditProfileScreen() {
  const { darkMode } = useContext(ThemeContext);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("info");
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const displayName = currentUser.displayName || "";
        const [namePart, genderPart] = displayName.split("|");
        const parts = namePart.trim().split(" ");
        const first = parts.slice(0, -1).join(" ");
        const last = parts[parts.length - 1];
        setFirstName(first || "");
        setLastName(last || "");
        setGender(genderPart || "");
        setEmail(currentUser.email || "");
        setOriginalData({
          firstName: first || "",
          lastName: last || "",
          gender: genderPart || "",
        });
      }
    });
    return unsubscribe;
  }, []);

  const showModal = (message, type = "info") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      showModal("Please fill out your name.", "warning");
      return;
    }

    if (
      firstName === originalData.firstName &&
      lastName === originalData.lastName &&
      gender === originalData.gender
    ) {
      showModal("No changes detected.", "warning");
      return;
    }

    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: `${firstName} ${lastName}|${gender}`,
      });

      showModal("Profile updated successfully!", "success");
      setTimeout(() => {
        setModalVisible(false);
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error("Error updating profile:", error);
      showModal("Failed to update profile.", "error");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = () => {
    switch (modalType) {
      case "success":
        return <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />;
      case "error":
        return <Ionicons name="close-circle" size={60} color="#f44336" />;
      case "warning":
        return <Ionicons name="alert-circle" size={60} color="#FFC107" />;
      default:
        return <Ionicons name="information-circle" size={60} color="#0078ff" />;
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: darkMode ? "#121212" : "#fff" },
        ]}
      >
        <View style={styles.container}>
          <Text
            style={[
              styles.title,
              { color: darkMode ? "#4dabf7" : "#0078ff" },
            ]}
          >
            Edit Profile
          </Text>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: darkMode ? "#bbb" : "#555" }]}>
              First Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#1E1E1E" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                  borderColor: darkMode ? "#333" : "#ddd",
                },
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor={darkMode ? "#888" : "#999"}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: darkMode ? "#bbb" : "#555" }]}>
              Last Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#1E1E1E" : "#fff",
                  color: darkMode ? "#fff" : "#000",
                  borderColor: darkMode ? "#333" : "#ddd",
                },
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor={darkMode ? "#888" : "#999"}
            />
          </View>

          {/* Gender */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: darkMode ? "#bbb" : "#555" }]}>
              Gender
            </Text>
            <View
              style={[
                styles.pickerWrapper,
                {
                  backgroundColor: darkMode ? "#1E1E1E" : "#fff",
                  borderColor: darkMode ? "#333" : "#ddd",
                },
              ]}
            >
              <Picker
                selectedValue={gender}
                onValueChange={(value) => setGender(value)}
                style={[styles.picker, { color: darkMode ? "#fff" : "#000" }]}
                dropdownIconColor={darkMode ? "#fff" : "#000"}
              >
                <Picker.Item label="Select Gender" value="" color="#999" />
                <Picker.Item label="Male" value="Male" />
                <Picker.Item label="Female" value="Female" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          {/* Email (Read Only) */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: darkMode ? "#bbb" : "#555" }]}>
              Email (Read Only)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#333" : "#eee",
                  color: darkMode ? "#ccc" : "#000",
                  borderColor: darkMode ? "#444" : "#ddd",
                },
              ]}
              value={email}
              editable={false}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor: darkMode ? "#4dabf7" : "#0078ff",
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>

          {/* Custom Modal with Icon */}
          <Modal transparent visible={modalVisible} animationType="fade">
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: darkMode ? "#222" : "#fff" },
                ]}
              >
                {getIcon()}
                <Text
                  style={[
                    styles.modalMessage,
                    { color: darkMode ? "#fff" : "#000" },
                  ]}
                >
                  {modalMessage}
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: "#0078ff" }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 20 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 60,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  saveBtn: {
    marginTop: 30,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    width: "75%",
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
  },
  modalMessage: {
    fontSize: 16,
    marginVertical: 20,
    textAlign: "center",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
});
