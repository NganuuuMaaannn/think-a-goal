import React, { useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeContext } from '../utils/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DashboardScreen() {
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
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: darkMode ? '#121212' : '#fff' },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text
            style={[
              styles.header,
              { color: darkMode ? '#fff' : '#000' },
            ]}
          >
            Welcome back, Sean! 👋
          </Text>

          <Text
            style={[
              styles.quote,
              { color: darkMode ? '#bbb' : '#777' },
            ]}
          >
            “Act as if it were impossible to fail.”
          </Text>

          <View style={styles.goal}>
            <View
              style={[
                styles.progressCircle,
                { borderColor: darkMode ? '#0078ff' : '#0078ff' },
              ]}
            >
              <Text
                style={[
                  styles.percent,
                  { color: darkMode ? '#0078ff' : '#0078ff' },
                ]}
              >
                100%
              </Text>
            </View>
            <Text
              style={[
                styles.label,
                { color: darkMode ? '#fff' : '#000' },
              ]}
            >
              Goals Completed
            </Text>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: darkMode ? '#1E1E1E' : '#f9f9f9' },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                { color: darkMode ? '#fff' : '#000' },
              ]}
            >
              Upcoming Deadlines
            </Text>

            <View style={styles.deadlineItem}>
              <Text style={{ color: darkMode ? '#ddd' : '#000' }}>Read 20 pages</Text>
              <Text style={{ color: darkMode ? '#aaa' : '#999' }}>Today</Text>
            </View>

            <View style={styles.deadlineItem}>
              <Text style={{ color: darkMode ? '#ddd' : '#000' }}>Update resume</Text>
              <Text style={{ color: darkMode ? '#aaa' : '#999' }}>Apr 25</Text>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.addBtn,
            { backgroundColor: darkMode ? '#0078ff' : '#0078ff' },
          ]}
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
  header: { fontSize: 45, fontWeight: '600' },
  quote: { fontSize: 20, marginVertical: 10 },
  progressCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    borderWidth: 10,
    borderRadius: 100,
    width: 200,
    height: 200,
  },
  percent: { fontSize: 50, fontWeight: 'bold' },
  goal: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 15,
    padding: 20,
    marginTop: 40,
  },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 10 },
  label: { marginTop: 30, fontWeight: '600', fontSize: 24 },
  deadlineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  addBtn: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 50,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
