import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_CONSUMER } from '../mockData';

export default function QRScreen() {
  const [timestamp, setTimestamp] = useState(Date.now());
  const qrValue = `${MOCK_CONSUMER.qrCodeData}-${timestamp}`;

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.label}>Show this QR to the merchant</Text>
        <View style={styles.qrWrap}>
          <QRCode value={qrValue} size={220} backgroundColor="#fff" color="#000" />
        </View>
        <Text style={styles.userId}>{MOCK_CONSUMER.id}</Text>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => setTimestamp(Date.now())}
          accessibilityRole="button"
          accessibilityLabel="Refresh QR Code"
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center', width: '100%', maxWidth: 360 },
  label: { fontSize: 15, color: '#666', marginBottom: 20 },
  qrWrap: { padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  userId: { marginTop: 16, fontSize: 14, fontWeight: '600', color: '#333', letterSpacing: 1 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0066FF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 20 },
  refreshText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
});
