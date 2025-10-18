import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { auth } from '../utils/firebaseConfig';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../utils/ThemeContext';
import { Picker } from '@react-native-picker/picker';


export default function EditProfileScreen() {
  const { darkMode } = useContext(ThemeContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
        const displayName = currentUser.displayName || "";
        const [namePart, genderPart] = displayName.split("|");
        const parts = namePart.trim().split(" ");
        const first = parts.slice(0, -1).join(" "); // all except last word
        const last = parts[parts.length - 1]; // last word only
        setFirstName(first || "");
        setLastName(last || "");
        setGender(genderPart || ""); // ✅ load gender from profile
        setEmail(currentUser.email || "");
        }
    });
    return unsubscribe;
    }, []);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert('Please fill out your name.');
      return;
    }

    setLoading(true);
    try {
        await updateProfile(auth.currentUser, {
        displayName: `${firstName} ${lastName}|${gender}`,
        });
      alert('Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: darkMode ? '#121212' : '#fff' },
        ]}
      >
        <View style={styles.container}>
          <Text
            style={[
              styles.title,
              { color: darkMode ? '#4dabf7' : '#0078ff' },
            ]}
          >
            Edit Profile
          </Text>

          {/* First Name */}
          <View style={styles.inputGroup}>
            <Text
              style={[styles.label, { color: darkMode ? '#bbb' : '#555' }]}
            >
              First Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? '#1E1E1E' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  borderColor: darkMode ? '#333' : '#ddd',
                },
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor={darkMode ? '#888' : '#999'}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputGroup}>
            <Text
              style={[styles.label, { color: darkMode ? '#bbb' : '#555' }]}
            >
              Last Name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? '#1E1E1E' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  borderColor: darkMode ? '#333' : '#ddd',
                },
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor={darkMode ? '#888' : '#999'}
            />
          </View>

          {/* Gender */}
        <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: darkMode ? '#bbb' : '#555' }]}>
            Gender
        </Text>
        <View
            style={[
            styles.pickerWrapper,
            {
                backgroundColor: darkMode ? '#1E1E1E' : '#fff',
                borderColor: darkMode ? '#333' : '#ddd',
            },
            ]}
        >
            <Picker
            selectedValue={gender}
            onValueChange={(value) => setGender(value)}
            style={[styles.picker, { color: darkMode ? '#fff' : '#000' }]}
            dropdownIconColor={darkMode ? '#fff' : '#000'}
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
            <Text
              style={[styles.label, { color: darkMode ? '#bbb' : '#555' }]}
            >
              Email (Read Only)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? '#333' : '#eee',
                  color: darkMode ? '#ccc' : '#000',
                  borderColor: darkMode ? '#444' : '#ddd',
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
                backgroundColor: darkMode ? '#4dabf7' : '#0078ff',
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            style={[
              styles.backBtn,
              { backgroundColor: darkMode ? '#4dabf7' : '#0078ff' },
            ]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
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
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 60,
    textAlign: 'center',
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
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backBtn: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  backText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    pickerWrapper: {
        borderWidth: 1,
        borderRadius: 10,
    },
    picker: {
        height: 50,
        width: '100%',
    },
});
