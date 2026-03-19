import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000";
const CACHE_KEY = "onepoint_balance_cache";

interface PartnerBalance {
  program_id: string;
  program_name: string;
  cached_balance: number;
}

interface BalanceData {
  onepoint_balance: number;
  partner_balances: PartnerBalance[];
  fetched_at: string;
}

async function loadCachedBalance(): Promise<BalanceData | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function saveCachedBalance(data: BalanceData): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // silent — caching is best-effort
  }
}

export default function HomeScreen() {
  const { session, user } = useAuth();
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stale, setStale] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user || !session) return;

    try {
      const res = await fetch(`${API_BASE}/api/balance/${user.id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const data: BalanceData = {
        onepoint_balance: json.onepoint_balance ?? 0,
        partner_balances: json.partner_balances ?? [],
        fetched_at: new Date().toISOString(),
      };

      await saveCachedBalance(data);
      setBalance(data);
      setStale(false);
    } catch {
      // API unreachable — fall back to cache
      const cached = await loadCachedBalance();
      if (cached) {
        setBalance(cached);
        setStale(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, session]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBalance();
  }, [fetchBalance]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading balance…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {stale && balance?.fetched_at && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleText}>
            ⚠ Showing cached data from{" "}
            {new Date(balance.fetched_at).toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>OnePoint Balance</Text>
        <Text style={styles.balanceValue}>
          {balance?.onepoint_balance?.toLocaleString() ?? "0"}
        </Text>
        <Text style={styles.balanceUnit}>points</Text>
      </View>

      <Text style={styles.sectionTitle}>Partner Programs</Text>

      {(!balance?.partner_balances ||
        balance.partner_balances.length === 0) && (
        <Text style={styles.emptyText}>No linked partner programs.</Text>
      )}

      {balance?.partner_balances?.map((p) => (
        <View key={p.program_id} style={styles.partnerRow}>
          <Text style={styles.partnerName}>{p.program_name}</Text>
          <Text style={styles.partnerBalance}>
            {p.cached_balance?.toLocaleString() ?? "0"}
          </Text>
        </View>
      ))}
    </ScrollView>
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
    flexGrow: 1,
    backgroundColor: "#F9FAFB",
    padding: 20,
  },
  staleBanner: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  staleText: {
    fontSize: 13,
    color: "#92400E",
    textAlign: "center",
  },
  balanceCard: {
    backgroundColor: "#4F46E5",
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#C7D2FE",
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  balanceUnit: {
    fontSize: 14,
    color: "#C7D2FE",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
  },
  partnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  partnerName: {
    fontSize: 15,
    color: "#374151",
  },
  partnerBalance: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4F46E5",
  },
});
