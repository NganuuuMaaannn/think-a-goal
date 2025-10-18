import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../utils/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function GoalsScreen() {
  const { darkMode, setDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('darkMode');
      if (saved !== null) setDarkMode(saved === 'true');
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: darkMode ? '#121212' : '#fff' },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: darkMode ? '#fff' : '#333' },
        ]}
      >
        No goals yet 📝
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16 },
});
