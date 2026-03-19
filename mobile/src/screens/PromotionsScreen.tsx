import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000";

interface Promotion {
  id: string;
  merchant_id: string;
  merchant_name?: string;
  description: string;
  category: string;
  required_points: number;
  terms_conditions: string;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export default function PromotionsScreen() {
  const { session } = useAuth();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);

  const fetchPromotions = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/api/promotions`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items: Promotion[] = json.items ?? json.data ?? json ?? [];
      setPromotions(Array.isArray(items) ? items : []);
    } catch {
      // network error — keep existing data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPromotions();
  }, [fetchPromotions]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderItem = ({ item }: { item: Promotion }) => (
    <Pressable
      style={styles.card}
      onPress={() => setSelected(item)}
      accessibilityRole="button"
      accessibilityLabel={`Promotion from ${item.merchant_name ?? "Unknown"}`}
    >
      <View style={styles.cardTop}>
        <Text style={styles.merchantName}>
          {item.merchant_name ?? "Unknown Merchant"}
        </Text>
        <Text style={styles.points}>
          {item.required_points.toLocaleString()} pts
        </Text>
      </View>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <Text style={styles.dateText}>
        {formatDate(item.valid_from)} — {formatDate(item.valid_until)}
      </Text>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading promotions…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={promotions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>No promotions available</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for new deals from merchants.
            </Text>
          </View>
        }
      />

      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setSelected(null)}
        >
          <Pressable style={styles.modal} onPress={() => {}}>
            {selected && (
              <>
                <Text style={styles.modalTitle}>Promotion Details</Text>

                <DetailRow
                  label="Merchant"
                  value={selected.merchant_name ?? "Unknown"}
                />
                <DetailRow label="Category" value={selected.category} />
                <DetailRow label="Description" value={selected.description} />
                <DetailRow
                  label="Required Points"
                  value={selected.required_points.toLocaleString()}
                />
                <DetailRow
                  label="Valid From"
                  value={formatDate(selected.valid_from)}
                />
                <DetailRow
                  label="Valid Until"
                  value={formatDate(selected.valid_until)}
                />

                {selected.terms_conditions ? (
                  <View style={styles.termsSection}>
                    <Text style={styles.termsLabel}>Terms & Conditions</Text>
                    <Text style={styles.termsText}>
                      {selected.terms_conditions}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  style={styles.closeBtn}
                  onPress={() => setSelected(null)}
                  accessibilityRole="button"
                  accessibilityLabel="Close details"
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },
  points: {
    fontSize: 14,
    fontWeight: "700",
    color: "#4F46E5",
  },
  description: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    flexShrink: 1,
    textAlign: "right",
    maxWidth: "60%",
  },
  termsSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  termsLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },
  termsText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 20,
  },
  closeBtn: {
    marginTop: 20,
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
