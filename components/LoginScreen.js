import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import { auth } from '../utils/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const showModal = (message, error = false) => {
    setModalMessage(message);
    setIsError(error);
    setModalVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showModal('Please enter both email and password.', true);
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showModal('Login successful!');
      setTimeout(() => navigation.replace('MainTabs'), 1500);
    } catch (error) {
      let message = "Login failed. Please try again.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
        message = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        message = "Please enter a valid email address.";
      } else if (error.code === "auth/missing-password") {
        message = "Please enter your password.";
      }
      showModal(message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4facfe', '#00f2fe',]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        extraScrollHeight={50}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingVertical: 40,
        }}
        style={{ width: "100%" }}
      >
        <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
        />
        <Text style={styles.title}>Think A Goal</Text>

        <View style={styles.box}>
          {/* Email */}
          <View style={[styles.inputWrapper, focusedInput === 'email' && styles.inputFocused]}>
            <Feather name="mail" size={20} color={focusedInput === 'email' ? '#0078ff' : '#999'} style={styles.icon} />
            <TextInput
              placeholder="Email"
              placeholderTextColor="#999"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedInput('email')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputFocused]}>
            <Feather name="lock" size={20} color={focusedInput === 'password' ? '#0078ff' : '#999'} style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#999"
                style={styles.iconRight}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Don’t have an account?{' '}
          <Text style={styles.link} onPress={() => navigation.navigate('Signup')}>
            Sign up
          </Text>
        </Text>

        {/* Success/Error Modal */}
        <Modal transparent visible={modalVisible} animationType="fade">
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <Ionicons
                name={isError ? 'alert-circle-outline' : 'checkmark-circle-outline'}
                size={50}
                color={isError ? '#ff3b30' : '#0078ff'}
              />
              <Text style={styles.modalText}>{modalMessage}</Text>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal transparent visible={loading} animationType="fade">
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#0078ff" />
              <Text style={styles.loadingText}>Logging in...</Text>
            </View>
          </View>
        </Modal>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },
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
  logo: { width: 150, height: 150, marginTop: -60, marginBottom: 40 },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 40,
    marginTop: -30,
    textAlign: "center",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    width: '100%',
    marginVertical: 10,
    paddingHorizontal: 12,
  },
  inputFocused: { borderColor: '#0078ff' },
  icon: { marginRight: 10 },
  iconRight: { marginLeft: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#333' },
  button: { backgroundColor: '#0078ff', width: '100%', padding: 15, borderRadius: 10, marginTop: 20 },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  footerText: { marginTop: 30, color: '#fff', fontSize: 14 },
  link: { color: '#0078ff', fontWeight: 'bold' },

  modalBackground: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 25, alignItems: 'center', width: '80%' },
  modalText: { textAlign: 'center', fontSize: 16, color: '#333', marginVertical: 10 },
  modalBtn: { backgroundColor: '#0078ff', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 8, marginTop: 10, width: '50%', alignItems: 'center' },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },

  loadingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  loadingBox: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', elevation: 10 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333', fontWeight: '600' },
});
