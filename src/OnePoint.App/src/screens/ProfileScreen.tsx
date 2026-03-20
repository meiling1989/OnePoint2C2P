import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { MOCK_CONSUMER, MOCK_PARTNERS } from '../mockData';

export default function ProfileScreen() {
  const { logout } = useAuth();
  const [displayName, setDisplayName] = useState(MOCK_CONSUMER.displayName);

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.avatar}>
        <Ionicons name="person-circle" size={80} color="#0066FF" />
      </View>

      <Text style={styles.label}>Display Name</Text>
      <TextInput
        style={styles.input}
        value={displayName}
        onChangeText={setDisplayName}
        accessibilityLabel="Display name"
      />

      <Text style={styles.label}>Phone Number</Text>
      <Text style={styles.value}>{MOCK_CONSUMER.phoneNumber}</Text>

      <Text style={styles.label}>User ID</Text>
      <Text style={styles.value}>{MOCK_CONSUMER.id}</Text>

      <Text style={styles.sectionTitle}>Linked Partners</Text>
      {MOCK_PARTNERS.map((p) => (
        <View key={p.programId} style={styles.partnerRow}>
          <Text style={styles.partnerName}>{p.programName}</Text>
          <Text style={styles.partnerBal}>{p.cachedBalance.toLocaleString()} pts</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} accessibilityRole="button" accessibilityLabel="Logout">
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} accessibilityRole="button" accessibilityLabel="Delete account">
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 40 },
  avatar: { alignItems: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#999', marginTop: 16, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16 },
  value: { backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 16, color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginTop: 24, marginBottom: 10 },
  partnerRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  partnerName: { fontSize: 15, color: '#333' },
  partnerBal: { fontSize: 15, fontWeight: '600', color: '#0066FF' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0066FF', borderRadius: 10, paddingVertical: 14, marginTop: 32 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 16, marginLeft: 8 },
  deleteBtn: { alignItems: 'center', marginTop: 16 },
  deleteText: { color: '#E53935', fontSize: 14, fontWeight: '600' },
});
