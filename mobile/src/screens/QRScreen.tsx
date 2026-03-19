import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../contexts/AuthContext";

export default function QRScreen() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const userId = user?.id ?? "";

  const qrValue = `${userId}:${refreshKey}`;

  const handleRefresh = useCallback(() => {
    setRefreshKey(Date.now());
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My QR Code</Text>

        <View style={styles.qrContainer}>
          {userId ? (
            <QRCode
              value={qrValue}
              size={250}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
          ) : (
            <Text style={styles.errorText}>User ID not available</Text>
          )}
        </View>

        <Text style={styles.label}>User ID</Text>
        <Text style={styles.userId}>{userId || "—"}</Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Refresh QR Code"
        >
          <Text style={styles.refreshButtonText}>Refresh QR Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 32,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  userId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  refreshButton: {
    backgroundColor: "#6C47FF",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#CC0000",
  },
});
