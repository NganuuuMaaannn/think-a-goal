import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { useNavigation } from "@react-navigation/native";
import { ThemeContext } from "../utils/ThemeContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('darkMode');
      if (saved !== null) setDarkMode(saved === 'true');
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);
  
  // ✅ Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setModalVisible(false);
      navigation.replace('Login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkMode ? '#121212' : '#fff' },
      ]}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          { backgroundColor: darkMode ? '#444' : '#0078ff' },
        ]}
      >
        <Text style={styles.avatarText}>
          {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
        </Text>
      </View>

      {/* Dynamic Name, Gender & Email */}
      {user?.displayName ? (
        <>
          <Text
            style={[
              styles.name,
              { color: darkMode ? '#fff' : '#000' },
            ]}
          >
            {user.displayName.split('|')[0]} {/* 👈 Only name */}
          </Text>
          </>
        ) : (
          <Text
            style={[
              styles.name,
              { color: darkMode ? '#fff' : '#000' },
            ]}
          >
            User
          </Text>
      )}
      <Text
        style={[
          styles.email,
          { color: darkMode ? '#aaa' : '#777' },
        ]}
      >
        {user?.email ? user.email : 'Loading…'}
      </Text>

      {/* Options */}
      <TouchableOpacity
        style={[
          styles.option,
          { backgroundColor: darkMode ? '#1E1E1E' : '#f9f9f9' },
        ]}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Ionicons
          name="create-outline"
          size={20}
          color={darkMode ? '#4dabf7' : '#0078ff'}
        />
        <Text
          style={[
            styles.optionText,
            { color: darkMode ? '#fff' : '#333' },
          ]}
        >
          Edit Profile
        </Text>
      </TouchableOpacity>

      {/* Dark Mode Switch */}
      <View
        style={[
          styles.option,
          { backgroundColor: darkMode ? '#1E1E1E' : '#f9f9f9' },
        ]}
      >
        <Ionicons
          name="moon-outline"
          size={20}
          color={darkMode ? '#4dabf7' : '#0078ff'}
        />
        <Text
          style={[
            styles.optionText,
            { color: darkMode ? '#fff' : '#333' },
          ]}
        >
          Dark Mode
        </Text>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          thumbColor={darkMode ? '#0078ff' : '#f4f3f4'}
          trackColor={{ false: '#ccc', true: '#0078ff55' }}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[
          styles.option,
          { backgroundColor: darkMode ? '#1E1E1E' : '#f9f9f9' },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
        <Text
          style={[
            styles.optionText,
            { color: '#ff3b30' },
          ]}
        >
          Log Out
        </Text>
      </TouchableOpacity>

      {/* Logout Confirmation Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: darkMode ? '#222' : '#fff' },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={50} color="#0078ff" />
            <Text
              style={[
                styles.modalTitle,
                { color: darkMode ? '#fff' : '#000' },
              ]}
            >
              Log Out
            </Text>
            <Text
              style={[
                styles.modalText,
                { color: darkMode ? '#aaa' : '#555' },
              ]}
            >
              Are you sure you want to log out?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: darkMode ? '#444' : '#ddd' },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  { backgroundColor: '#0078ff' },
                ]}
                onPress={handleLogout}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 50 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  email: { marginBottom: 30 },
  option: {
    width: '90%',
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  optionText: { fontSize: 16, flex: 1, marginLeft: 10 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 15,
    alignItems: 'center',
    padding: 25,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', marginTop: 10 },
  modalText: { fontSize: 15, marginTop: 8, textAlign: 'center' },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
});
