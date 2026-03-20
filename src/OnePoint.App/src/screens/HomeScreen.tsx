import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/AppNavigator';
import { MOCK_CONSUMER, MOCK_RECENT_ACTIVITY } from '../mockData';

type Nav = BottomTabNavigationProp<MainTabParamList>;

const ACTIVITY_CONFIG = {
  redeem: { icon: 'arrow-down-circle' as const, color: '#E53935' },
  swap: { icon: 'swap-horizontal-outline' as const, color: '#0066FF' },
  earn: { icon: 'arrow-up-circle' as const, color: '#4CAF50' },
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>OnePoint Balance</Text>
        <Text style={styles.balanceValue}>
          {MOCK_CONSUMER.onepointBalance.toLocaleString()}
        </Text>
        <Text style={styles.balanceUnit}>points</Text>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('QR')}
          accessibilityRole="button" accessibilityLabel="Scan QR">
          <Ionicons name="qr-code" size={28} color="#0066FF" />
          <Text style={styles.actionLabel}>Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Swap')}
          accessibilityRole="button" accessibilityLabel="Swap Points">
          <Ionicons name="swap-horizontal" size={28} color="#0066FF" />
          <Text style={styles.actionLabel}>Swap Points</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('History')}
          accessibilityRole="button" accessibilityLabel="View History">
          <Ionicons name="time" size={28} color="#0066FF" />
          <Text style={styles.actionLabel}>View History</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent Transactions</Text>
      {MOCK_RECENT_ACTIVITY.map((item) => {
        const cfg = ACTIVITY_CONFIG[item.type];
        const dateStr = new Date(item.createdAt).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        });
        return (
          <View key={item.id} style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: cfg.color + '15' }]}>
              <Ionicons name={cfg.icon} size={22} color={cfg.color} />
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txDesc}>{item.description}</Text>
              <Text style={styles.txDate}>{dateStr}</Text>
            </View>
            <Text style={[styles.txPoints, { color: item.points >= 0 ? '#4CAF50' : '#E53935' }]}>
              {item.points >= 0 ? '+' : ''}{item.points.toLocaleString()}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 32 },
  balanceCard: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: { color: '#ffffffcc', fontSize: 14, marginBottom: 4 },
  balanceValue: { color: '#fff', fontSize: 40, fontWeight: '700' },
  balanceUnit: { color: '#ffffffcc', fontSize: 14, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
  actionLabel: { marginTop: 6, fontSize: 13, color: '#333', fontWeight: '500' },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '500', color: '#333' },
  txDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txPoints: { fontSize: 15, fontWeight: '700' },
});
