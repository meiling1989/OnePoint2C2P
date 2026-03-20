import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_TRANSACTIONS, RedemptionTransaction } from '../mockData';

export default function HistoryScreen() {
  const [data, setData] = useState(MOCK_TRANSACTIONS);
  const [selected, setSelected] = useState<RedemptionTransaction | null>(null);

  const loadMore = useCallback(() => {
    setData((prev) => [
      ...prev,
      ...MOCK_TRANSACTIONS.map((t, i) => ({ ...t, id: `${prev.length + i}` })),
    ]);
  }, []);

  const renderItem = ({ item }: { item: RedemptionTransaction }) => (
    <TouchableOpacity style={styles.row} onPress={() => setSelected(item)} accessibilityRole="button">
      <View style={styles.rowLeft}>
        <Text style={styles.merchant}>{item.merchantName}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.ref}>{item.transactionRef}</Text>
      </View>
      <Text style={styles.points}>-{item.pointsRedeemed.toLocaleString()} pts</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.detail}>
            {selected && (
              <>
                <Text style={styles.detailTitle}>{selected.merchantName}</Text>
                <Text style={styles.detailRow}>Location: {selected.merchantLocation}</Text>
                <Text style={styles.detailRow}>Method: {selected.method.replace('_', ' ')}</Text>
                <Text style={styles.detailRow}>Points: {selected.pointsRedeemed.toLocaleString()}</Text>
                <Text style={styles.detailRow}>Value: ฿{selected.monetaryValue}</Text>
                <Text style={styles.detailRow}>Status: {selected.status}</Text>
                <Text style={styles.detailRow}>Ref: {selected.transactionRef}</Text>
              </>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Close">
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  rowLeft: { flex: 1 },
  merchant: { fontSize: 15, fontWeight: '600', color: '#333' },
  date: { fontSize: 12, color: '#999', marginTop: 2 },
  ref: { fontSize: 11, color: '#bbb', marginTop: 2 },
  points: { fontSize: 15, fontWeight: '700', color: '#E53935' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  detail: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 12 },
  detailRow: { fontSize: 14, color: '#555', marginBottom: 6 },
  closeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0066FF', borderRadius: 10, paddingVertical: 12, marginTop: 16 },
  closeText: { color: '#fff', fontWeight: '600', marginLeft: 6 },
});
