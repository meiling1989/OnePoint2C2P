import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_PROMOTIONS, Promotion } from '../mockData';

export default function PromotionsScreen() {
  const [selected, setSelected] = useState<Promotion | null>(null);
  const promotions = MOCK_PROMOTIONS;

  if (promotions.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="pricetag-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No promotions available right now</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Promotion }) => (
    <TouchableOpacity style={styles.card} onPress={() => setSelected(item)} accessibilityRole="button">
      <View style={styles.cardHeader}>
        <Text style={styles.merchantName}>{item.merchantName}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.validity}>{item.validFrom} — {item.validUntil}</Text>
        {item.requiredPoints > 0 && <Text style={styles.pts}>{item.requiredPoints.toLocaleString()} pts</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <FlatList data={promotions} keyExtractor={(p) => p.id} renderItem={renderItem} contentContainerStyle={styles.list} />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.overlay}>
          <View style={styles.detail}>
            {selected && (
              <>
                <Text style={styles.detailTitle}>{selected.merchantName}</Text>
                <Text style={styles.detailDesc}>{selected.description}</Text>
                <Text style={styles.detailLabel}>Terms & Conditions</Text>
                <Text style={styles.detailTerms}>{selected.termsConditions}</Text>
                <Text style={styles.detailLabel}>Validity</Text>
                <Text style={styles.detailRow}>{selected.validFrom} — {selected.validUntil}</Text>
                {selected.requiredPoints > 0 && (
                  <><Text style={styles.detailLabel}>Required Points</Text><Text style={styles.detailRow}>{selected.requiredPoints.toLocaleString()}</Text></>
                )}
              </>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)} accessibilityRole="button" accessibilityLabel="Close">
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
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  merchantName: { fontSize: 16, fontWeight: '700', color: '#333' },
  badge: { backgroundColor: '#E8F0FE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#0066FF', fontWeight: '600' },
  desc: { fontSize: 14, color: '#555', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  validity: { fontSize: 12, color: '#999' },
  pts: { fontSize: 13, fontWeight: '700', color: '#0066FF' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 12, fontSize: 15, color: '#999' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  detail: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  detailTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 4 },
  detailDesc: { fontSize: 15, color: '#555', marginBottom: 16 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#999', marginTop: 12, marginBottom: 4 },
  detailTerms: { fontSize: 14, color: '#555' },
  detailRow: { fontSize: 14, color: '#333' },
  closeBtn: { backgroundColor: '#0066FF', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 20 },
  closeText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
