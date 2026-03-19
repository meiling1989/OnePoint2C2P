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
const PAGE_SIZE = 20;

interface RedemptionTransaction {
  id: string;
  transaction_ref: string;
  consumer_id: string;
  merchant_id: string;
  merchant_name?: string;
  points_redeemed: number;
  monetary_value: number;
  method: string;
  status: string;
  created_at: string;
  merchant_location?: string;
}

export default function HistoryScreen() {
  const { session, user } = useAuth();
  const [transactions, setTransactions] = useState<RedemptionTransaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<RedemptionTransaction | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!user || !session) return;

      try {
        const url = `${API_BASE}/api/redemptions?consumerId=${user.id}&page=${pageNum}&pageSize=${PAGE_SIZE}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const items: RedemptionTransaction[] = json.items ?? json.data ?? json ?? [];
        const list = Array.isArray(items) ? items : [];

        setTransactions((prev) => (replace ? list : [...prev, ...list]));
        setHasMore(list.length >= PAGE_SIZE);
        setPage(pageNum);
      } catch {
        // network error — keep existing data
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [user, session],
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchPage(1, true);
  }, [fetchPage]);

  const onEndReached = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchPage(page + 1, false);
  }, [hasMore, loadingMore, page, fetchPage]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const methodLabel = (m: string) =>
    m === "qr_code" ? "QR Code" : m === "user_id" ? "User ID" : m;

  const statusColor = (s: string) => {
    switch (s) {
      case "approved":
        return "#059669";
      case "pending":
        return "#D97706";
      case "failed":
      case "reversed":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const renderItem = ({ item }: { item: RedemptionTransaction }) => (
    <Pressable
      style={styles.card}
      onPress={() => setSelected(item)}
      accessibilityRole="button"
      accessibilityLabel={`Transaction at ${item.merchant_name ?? "Unknown"}`}
    >
      <View style={styles.cardTop}>
        <Text style={styles.merchantName}>
          {item.merchant_name ?? "Unknown Merchant"}
        </Text>
        <Text style={[styles.status, { color: statusColor(item.status) }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.dateText}>
        {formatDate(item.created_at)} · {formatTime(item.created_at)}
      </Text>
      <View style={styles.cardBottom}>
        <Text style={styles.points}>
          -{item.points_redeemed.toLocaleString()} pts
        </Text>
        <Text style={styles.ref}>Ref: {item.transaction_ref}</Text>
      </View>
    </Pressable>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#4F46E5" />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading transactions…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySubtitle}>
              Your redemption history will appear here.
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
                <Text style={styles.modalTitle}>Transaction Details</Text>

                <DetailRow
                  label="Merchant"
                  value={selected.merchant_name ?? "Unknown"}
                />
                <DetailRow
                  label="Date"
                  value={`${formatDate(selected.created_at)} ${formatTime(selected.created_at)}`}
                />
                <DetailRow
                  label="Points Redeemed"
                  value={selected.points_redeemed.toLocaleString()}
                />
                <DetailRow
                  label="Monetary Value"
                  value={`฿${selected.monetary_value.toFixed(2)}`}
                />
                <DetailRow label="Reference" value={selected.transaction_ref} />
                <DetailRow
                  label="Method"
                  value={methodLabel(selected.method)}
                />
                <DetailRow
                  label="Status"
                  value={selected.status}
                  valueColor={statusColor(selected.status)}
                />
                {selected.merchant_location && (
                  <DetailRow
                    label="Location"
                    value={selected.merchant_location}
                  />
                )}

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
  status: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dateText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  points: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4F46E5",
  },
  ref: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
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
