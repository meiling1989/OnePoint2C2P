import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000";

const AVAILABLE_PROGRAMS = ["Lazada", "Central", "The1"];

interface PartnerLink {
  id: string;
  program_id: string;
  program_name: string;
  cached_balance: number;
}

interface SwapPreview {
  source_amount: number;
  onepoint_intermediate: number;
  target_amount: number;
  rate_to_onepoint: number;
  rate_from_onepoint: number;
}

export default function SwapScreen() {
  const { session } = useAuth();

  const [partners, setPartners] = useState<PartnerLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Swap form state
  const [sourceProgram, setSourceProgram] = useState("");
  const [targetProgram, setTargetProgram] = useState("");
  const [amount, setAmount] = useState("");
  const [preview, setPreview] = useState<SwapPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
    }),
    [session]
  );

  const getPartnerLabel = (programId: string): string => {
    const p = partners.find((x) => x.program_id === programId);
    return p ? `${p.program_name} (${p.cached_balance} pts)` : "Select…";
  };

  // ── Fetch linked partners ──
  const fetchPartners = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/api/partners`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setPartners(json ?? []);
    } catch {
      Alert.alert("Error", "Failed to load partner programs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, headers]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPartners();
  }, [fetchPartners]);

  // ── Link a new partner ──
  const handleLinkPartner = () => {
    const unlinkedPrograms = AVAILABLE_PROGRAMS.filter(
      (p) => !partners.some((l) => l.program_name === p)
    );

    if (unlinkedPrograms.length === 0) {
      Alert.alert("Info", "All available programs are already linked.");
      return;
    }

    Alert.alert(
      "Link Partner Program",
      "Select a program to link (mock OAuth):",
      [
        ...unlinkedPrograms.map((name) => ({
          text: name,
          onPress: () => linkPartner(name),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const linkPartner = async (programName: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/partners/link`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ program_name: programName }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }
      await fetchPartners();
      Alert.alert("Success", `${programName} linked successfully.`);
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to link partner.");
    }
  };

  // ── Unlink a partner ──
  const handleUnlinkPartner = (partner: PartnerLink) => {
    Alert.alert(
      "Unlink Partner",
      `Are you sure you want to unlink ${partner.program_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlink",
          style: "destructive",
          onPress: () => unlinkPartner(partner),
        },
      ]
    );
  };

  const unlinkPartner = async (partner: PartnerLink) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/partners/${partner.program_id}`,
        { method: "DELETE", headers: headers() }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }
      if (sourceProgram === partner.program_id) setSourceProgram("");
      if (targetProgram === partner.program_id) setTargetProgram("");
      setPreview(null);
      await fetchPartners();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to unlink partner.");
    }
  };

  // ── Program selector via Alert ──
  const showProgramPicker = (
    title: string,
    exclude: string,
    onSelect: (programId: string) => void
  ) => {
    const options = partners
      .filter((p) => p.program_id !== exclude)
      .map((p) => ({
        text: `${p.program_name} (${p.cached_balance} pts)`,
        onPress: () => onSelect(p.program_id),
      }));

    Alert.alert(title, "Choose a partner program:", [
      ...options,
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Swap preview ──
  const handlePreview = async () => {
    if (!sourceProgram || !targetProgram) {
      Alert.alert("Error", "Please select both source and target programs.");
      return;
    }
    if (sourceProgram === targetProgram) {
      Alert.alert("Error", "Source and target programs must be different.");
      return;
    }
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount greater than 0.");
      return;
    }

    setPreviewLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/swaps/rates?source=${encodeURIComponent(sourceProgram)}&target=${encodeURIComponent(targetProgram)}`,
        { headers: headers() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rates = await res.json();

      const intermediary = numAmount * rates.rate_to_onepoint;
      const targetAmt = intermediary * rates.rate_from_onepoint;

      setPreview({
        source_amount: numAmount,
        onepoint_intermediate: intermediary,
        target_amount: targetAmt,
        rate_to_onepoint: rates.rate_to_onepoint,
        rate_from_onepoint: rates.rate_from_onepoint,
      });
    } catch {
      Alert.alert("Error", "Failed to fetch conversion rates.");
    } finally {
      setPreviewLoading(false);
    }
  };

  // ── Confirm swap ──
  const handleConfirmSwap = async () => {
    if (!preview) return;

    setSwapLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/swaps`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          sourceProgram,
          targetProgram,
          amount: preview.source_amount,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.error?.code === "insufficient-balance") {
          const available = err.error.details?.available ?? "unknown";
          Alert.alert(
            "Insufficient Balance",
            `Your source balance is ${available}. Please enter a smaller amount.`
          );
        } else {
          throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
        }
        return;
      }

      Alert.alert(
        "Swap Complete",
        `Swapped ${preview.source_amount} → ${preview.target_amount.toFixed(2)} points.`
      );
      setAmount("");
      setPreview(null);
      await fetchPartners();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Swap failed.");
    } finally {
      setSwapLoading(false);
    }
  };

  // ── Render ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading partners…</Text>
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
      {/* ── Linked Partners ── */}
      <Text style={styles.sectionTitle}>Linked Partners</Text>

      {partners.length === 0 && (
        <Text style={styles.emptyText}>No linked partner programs.</Text>
      )}

      {partners.map((p) => (
        <View key={p.id} style={styles.partnerRow}>
          <View style={styles.partnerInfo}>
            <Text style={styles.partnerName}>{p.program_name}</Text>
            <Text style={styles.partnerBalance}>
              {p.cached_balance?.toLocaleString() ?? "0"} pts
            </Text>
          </View>
          <TouchableOpacity
            style={styles.unlinkBtn}
            onPress={() => handleUnlinkPartner(p)}
          >
            <Text style={styles.unlinkBtnText}>Unlink</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.linkBtn} onPress={handleLinkPartner}>
        <Text style={styles.linkBtnText}>+ Link Partner</Text>
      </TouchableOpacity>

      {/* ── Swap Form ── */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Swap Points</Text>

      {partners.length < 2 ? (
        <Text style={styles.emptyText}>
          Link at least 2 partner programs to swap points.
        </Text>
      ) : (
        <View style={styles.swapCard}>
          <Text style={styles.fieldLabel}>Source Program</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              showProgramPicker("Source Program", targetProgram, (id) => {
                setSourceProgram(id);
                setPreview(null);
              })
            }
          >
            <Text style={sourceProgram ? styles.selectorText : styles.selectorPlaceholder}>
              {sourceProgram ? getPartnerLabel(sourceProgram) : "Select source…"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Target Program</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() =>
              showProgramPicker("Target Program", sourceProgram, (id) => {
                setTargetProgram(id);
                setPreview(null);
              })
            }
          >
            <Text style={targetProgram ? styles.selectorText : styles.selectorPlaceholder}>
              {targetProgram ? getPartnerLabel(targetProgram) : "Select target…"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Amount</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount to swap"
            keyboardType="numeric"
            value={amount}
            onChangeText={(t: string) => {
              setAmount(t);
              setPreview(null);
            }}
          />

          <TouchableOpacity
            style={[styles.previewBtn, previewLoading && styles.btnDisabled]}
            onPress={handlePreview}
            disabled={previewLoading}
          >
            {previewLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.previewBtnText}>Preview Conversion</Text>
            )}
          </TouchableOpacity>

          {preview && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Conversion Preview</Text>
              <Text style={styles.previewRow}>
                Source: {preview.source_amount} pts
              </Text>
              <Text style={styles.previewRow}>
                × {preview.rate_to_onepoint} = {preview.onepoint_intermediate.toFixed(2)} OnePoint
              </Text>
              <Text style={styles.previewRow}>
                × {preview.rate_from_onepoint} = {preview.target_amount.toFixed(2)} target pts
              </Text>

              <TouchableOpacity
                style={[styles.confirmBtn, swapLoading && styles.btnDisabled]}
                onPress={handleConfirmSwap}
                disabled={swapLoading}
              >
                {swapLoading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Swap</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
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
    marginBottom: 12,
  },
  partnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  partnerBalance: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  unlinkBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  unlinkBtnText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "500",
  },
  linkBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  linkBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  swapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
    marginTop: 10,
  },
  selector: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 14,
  },
  selectorText: {
    fontSize: 15,
    color: "#111827",
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: "#9CA3AF",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#111827",
  },
  previewBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  previewBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  previewCard: {
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4338CA",
    marginBottom: 8,
  },
  previewRow: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 4,
  },
  confirmBtn: {
    backgroundColor: "#059669",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
