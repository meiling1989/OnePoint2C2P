import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const API_BASE = "http://localhost:5000";

interface PartnerLink {
  id: string;
  program_id: string;
  program_name: string;
  cached_balance: number;
}

export default function ProfileScreen() {
  const { session, user, signOut } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [partners, setPartners] = useState<PartnerLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${session?.access_token}`,
      "Content-Type": "application/json",
    }),
    [session]
  );

  const phoneNumber = user?.phone || user?.email || "—";

  // ── Fetch profile data and partners ──
  const fetchData = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch(`${API_BASE}/api/partners`, {
        headers: headers(),
      });
      if (res.ok) {
        const json = await res.json();
        setPartners(json ?? []);
      }
    } catch {
      // silent — best effort
    }

    // Display name from user metadata
    const name = user?.user_metadata?.display_name ?? "";
    setDisplayName(name);
    setNameInput(name);
    setLoading(false);
  }, [session, user, headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Save display name ──
  const handleSaveName = async () => {
    if (!session) return;
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert("Validation", "Display name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ display_name: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
      }
      setDisplayName(trimmed);
      setEditingName(false);
      Alert.alert("Success", "Display name updated.");
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Logout ──
  const handleLogout = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  // ── Delete account ──
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE}/api/auth/account`, {
                method: "DELETE",
                headers: headers(),
              });
              if (!res.ok) {
                const err = await res.json().catch(() => null);
                throw new Error(err?.error?.message ?? `HTTP ${res.status}`);
              }
              await signOut();
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Failed to delete account.");
            }
          },
        },
      ]
    );
  };

  // ── Render ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* ── Profile Info ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <Text style={styles.fieldLabel}>Phone / Email</Text>
        <Text style={styles.fieldValue}>{phoneNumber}</Text>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Display Name</Text>
        {editingName ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              placeholder="Enter display name"
            />
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.btnDisabled]}
              onPress={handleSaveName}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setNameInput(displayName);
                setEditingName(false);
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.nameRow}
            onPress={() => setEditingName(true)}
          >
            <Text style={styles.fieldValue}>
              {displayName || "Not set"}
            </Text>
            <Text style={styles.editHint}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Linked Partners ── */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Linked Partners</Text>
        {partners.length === 0 ? (
          <Text style={styles.emptyText}>No linked partner programs.</Text>
        ) : (
          partners.map((p) => (
            <View key={p.id} style={styles.partnerRow}>
              <Text style={styles.partnerName}>{p.program_name}</Text>
              <Text style={styles.partnerBalance}>
                {p.cached_balance?.toLocaleString() ?? "0"} pts
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ── Actions ── */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteBtnText}>Delete Account</Text>
      </TouchableOpacity>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    color: "#111827",
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editHint: {
    fontSize: 13,
    color: "#4F46E5",
    fontWeight: "500",
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: "#111827",
  },
  saveBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: "#6B7280",
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  partnerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  partnerName: {
    fontSize: 15,
    color: "#374151",
  },
  partnerBalance: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
  },
  logoutBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  logoutBtnText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginBottom: 32,
  },
  deleteBtnText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "600",
  },
});
