import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Feather from "@expo/vector-icons/Feather";
import { Ionicons } from "@expo/vector-icons";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../utils/firebaseConfig";
import { Picker } from "@react-native-picker/picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from "@react-navigation/native";

export default function SignupScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordMatch, setPasswordMatch] = useState("");
  const navigation = useNavigation();

  const showModal = (message, error = false) => {
    setModalMessage(message);
    setIsError(error);
    setModalVisible(true);
  };

  const checkPasswordStrength = (pass) => {
    setPassword(pass);

    if (pass.length === 0) {
      setPasswordStrength("");
      return;
    }

    const hasUppercase = /[A-Z]/.test(pass);
    const hasLowercase = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);

    if (pass.length < 6 || !hasUppercase) {
      setPasswordStrength("Weak");
    } 
    else if (
      pass.length >= 6 &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecial
    ) {
      setPasswordStrength("Very Strong");
    } 
    else if (
      pass.length >= 6 &&
      hasUppercase &&
      (hasLowercase || hasNumber || hasSpecial)
    ) {
      setPasswordStrength("Strong");
    } 
    else {
      setPasswordStrength("Weak");
    }
  };

  const checkPasswordMatch = (confirmPass) => {
    setConfirm(confirmPass);
    if (confirmPass.length === 0) {
      setPasswordMatch("");
    } else if (confirmPass === password) {
      setPasswordMatch("match");
    } else {
      setPasswordMatch("unmatch");
    }
  };

  const handleSignup = async () => {
    if (!firstName || !lastName || !gender || !email || !password || !confirm) {
      showModal("Please fill out all fields.", true);
      return;
    }

    if (password.length < 6 || !/[A-Z]/.test(password)) {
      showModal("Password must be at least 6 characters and contain one uppercase letter.", true);
      return;
    }

    if (passwordStrength === "Weak" || passwordStrength === "") {
      showModal("Password too weak. Please make it Strong or Very Strong.", true);
      return;
    }

    if (password !== confirm) {
      showModal("Passwords do not match.", true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { 
        displayName: `${firstName} ${lastName}|${gender}` 
      });
      showModal("Account created successfully!");
      navigation.replace("MainTabs");
    } catch (error) {
      showModal("Sign Up Failed", error.message, true);
    }
  };

  // ✅ Strength color
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case "Weak":
        return "#ff3b30";
      case "Strong":
        return "#ffcc00";
      case "Very Strong":
        return "#28a745";
      default:
        return "#999";
    }
  };

  return (
    <LinearGradient
      colors={["#4facfe", "#00f2fe"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={50}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 60, alignItems: "center" }}
        style={{ width: "100%" }}
      >
        <Text style={styles.title}>Sign Up</Text>

        <View style={styles.box}>
          {/* First Name */}
          <View style={[styles.inputWrapper, focusedInput === "firstName" && styles.inputFocused]}>
            <Feather
              name="user"
              size={20}
              color={focusedInput === "firstName" ? "#0078ff" : "#999"}
              style={styles.icon}
            />
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              onFocus={() => setFocusedInput("firstName")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Last Name */}
          <View style={[styles.inputWrapper, focusedInput === "lastName" && styles.inputFocused]}>
            <Feather
              name="user"
              size={20}
              color={focusedInput === "lastName" ? "#0078ff" : "#999"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#999"
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              onFocus={() => setFocusedInput("lastName")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Gender Picker */}
          <View style={[styles.inputWrapper, { paddingLeft: 8 }]}>
            <Feather name="user-check" size={20} color="#999" style={styles.icon2} />
            <Picker
              selectedValue={gender}
              onValueChange={(value) => setGender(value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Gender" value="" color="#999" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          {/* Email */}
          <View style={[styles.inputWrapper, focusedInput === "email" && styles.inputFocused]}>
            <Feather
              name="mail"
              size={20}
              color={focusedInput === "email" ? "#0078ff" : "#999"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput("email")}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrapper, focusedInput === "password" && styles.inputFocused]}>
            <Feather
              name="lock"
              size={20}
              color={focusedInput === "password" ? "#0078ff" : "#999"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={checkPasswordStrength}
              onFocus={() => setFocusedInput("password")}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#999"
                style={styles.iconRight}
              />
            </TouchableOpacity>
          </View>
          {passwordStrength ? (
            <Text style={[styles.strengthText, { color: getStrengthColor() }]}>
              Password Strength: {passwordStrength}
            </Text>
          ) : null}

          {/* Confirm Password */}
          <View style={[styles.inputWrapper, focusedInput === "confirm" && styles.inputFocused]}>
            <Feather
              name="lock"
              size={20}
              color={focusedInput === "confirm" ? "#0078ff" : "#999"}
              style={styles.icon}
            />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              secureTextEntry={!showConfirmPassword}
              style={styles.input}
              value={confirm}
              onChangeText={checkPasswordMatch}
              onFocus={() => setFocusedInput("confirm")}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Feather
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={20}
                color="#999"
                style={styles.iconRight}
              />
            </TouchableOpacity>
          </View>

          {passwordMatch ? (
            <Text
              style={[
                styles.matchText,
                { color: passwordMatch === "match" ? "#28a745" : "#ff3b30" },
              ]}
            >
              {passwordMatch === "match" ? "Passwords Match" : "Passwords Do Not Match"}
            </Text>
          ) : null}

          {/* Sign Up Button */}
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
            Login
          </Text>
        </Text>
      </KeyboardAwareScrollView>

      {/* Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Ionicons
              name={isError ? "alert-circle-outline" : "checkmark-circle-outline"}
              size={50}
              color={isError ? "#ff3b30" : "#0078ff"}
            />
            <Text style={styles.modalText}>{modalMessage}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 80,
    marginBottom: 40,
    textAlign: "center",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ddd",
    width: "100%",
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  inputFocused: { borderColor: "#0078ff", backgroundColor: "#fff" },
  icon: { marginRight: 10 },
  icon2: { marginLeft: 5, marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#333" },
  picker: { flex: 1, color: "#333", height: 50 },
  iconRight: { marginLeft: 10 },
  button: {
    backgroundColor: "#0078ff",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: { color: "#fff", textAlign: "center", fontSize: 16, fontWeight: "bold" },
  strengthText: { alignSelf: "flex-start", marginLeft: 10, fontWeight: "600", marginBottom: 8 },
  matchText: { alignSelf: "flex-start", marginLeft: 10, fontWeight: "600", marginTop: 4 },
  footerText: { marginTop: 30, color: "#fff", fontSize: 14, textAlign: "center" },
  link: { color: "#0078ff", fontWeight: "bold" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    width: "80%",
  },
  modalText: { textAlign: "center", fontSize: 16, color: "#333", marginVertical: 10 },
  modalBtn: {
    backgroundColor: "#0078ff",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 10,
    width: "50%",
    alignItems: "center",
  },
  modalBtnText: { color: "#fff", fontWeight: "bold" },
});
