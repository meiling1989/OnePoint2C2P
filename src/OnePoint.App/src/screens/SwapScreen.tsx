import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, FlatList, Image, ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  MOCK_AVAILABLE_PROGRAMS, MOCK_SWAP_TRANSACTIONS,
  type LinkedProgram, type SwapTransaction,
} from '../mockData';

const PROGRAM_LOGOS: Record<string, ImageSourcePropType> = {
  lazada: require('../../assets/lazadalogo.png'),
  grab: require('../../assets/grablogo.png'),
  the1: require('../../assets/the1logo.png'),
  ktc: require('../../assets/ktclogo.png'),
};

type Step = 'history' | 'selectProgram' | 'enterUserId' | 'enterAmount' | 'success';

export default function SwapScreen() {
  const [step, setStep] = useState<Step>('history');
  const [selectedProgram, setSelectedProgram] = useState<LinkedProgram | null>(null);
  const [userId, setUserId] = useState('');
  const [availablePoints, setAvailablePoints] = useState(0);
  const [amount, setAmount] = useState('');

  const resetFlow = () => {
    setStep('history');
    setSelectedProgram(null);
    setUserId('');
    setAmount('');
    setAvailablePoints(0);
  };

  const handleSelectProgram = (program: LinkedProgram) => {
    setSelectedProgram(program);
    setStep('enterUserId');
  };

  const handleSubmitUserId = () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter your User ID for this program.');
      return;
    }
    // Mock: generate random available points
    const mockPoints = Math.floor(Math.random() * 5000) + 1000;
    setAvailablePoints(mockPoints);
    setStep('enterAmount');
  };

  const handleSwap = () => {
    const val = parseInt(amount, 10);
    if (!val || val <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (val > availablePoints) {
      Alert.alert('Insufficient Balance', `You only have ${availablePoints.toLocaleString()} points available.`);
      return;
    }
    setStep('success');
  };

  const onepointAmount = selectedProgram
    ? Math.floor(parseInt(amount || '0', 10) * selectedProgram.rateToOnepoint)
    : 0;

  // Step: Success
  if (step === 'success') {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.successTitle}>Swap Successful!</Text>
        <Text style={styles.successSub}>
          {amount} {selectedProgram?.programName} pts → {onepointAmount.toLocaleString()} OnePoint
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={resetFlow}>
          <Text style={styles.primaryText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step: Select program
  if (step === 'selectProgram') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Select Program</Text>
        <Text style={styles.pageSubtitle}>Choose a loyalty program to swap points from</Text>
        {MOCK_AVAILABLE_PROGRAMS.map((p) => (
          <TouchableOpacity key={p.programId} style={styles.programCard}
            onPress={() => handleSelectProgram(p)} accessibilityRole="button">
            <Image source={PROGRAM_LOGOS[p.programId]} style={styles.programLogo} resizeMode="contain" />
            <View style={styles.programInfo}>
              <Text style={styles.programName}>{p.programName}</Text>
              <Text style={styles.programRate}>Rate: 1 pt → {p.rateToOnepoint} OnePoint</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.backLink} onPress={resetFlow}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step: Enter user ID
  if (step === 'enterUserId') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.pageTitle}>{selectedProgram?.programName}</Text>
        <Text style={styles.pageSubtitle}>Enter your {selectedProgram?.programName} User ID</Text>
        <TextInput
          style={styles.input}
          placeholder={`${selectedProgram?.programName} User ID`}
          placeholderTextColor="#999"
          value={userId}
          onChangeText={setUserId}
          autoFocus
        />
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitUserId}>
          <Text style={styles.primaryText}>Verify</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => setStep('selectProgram')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step: Enter amount
  if (step === 'enterAmount') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>{selectedProgram?.programName}</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Available Points</Text>
          <Text style={styles.infoValue}>{availablePoints.toLocaleString()} pts</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Conversion Rate</Text>
          <Text style={styles.infoValue}>1 {selectedProgram?.programName} pt → {selectedProgram?.rateToOnepoint} OnePoint</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Points to swap"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />
        {parseInt(amount || '0', 10) > 0 && (
          <View style={styles.previewBox}>
            <Text style={styles.previewText}>
              You will receive: <Text style={styles.previewHighlight}>{onepointAmount.toLocaleString()} OnePoint</Text>
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSwap}>
          <Text style={styles.primaryText}>Swap to OnePoint</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={() => setStep('enterUserId')}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Default: History with swap button
  const renderSwapTx = ({ item }: { item: SwapTransaction }) => {
    const dateStr = new Date(item.createdAt).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    return (
      <View style={styles.txRow}>
        <View style={styles.txIconWrap}>
          <Ionicons name="swap-horizontal-outline" size={22} color="#0066FF" />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txDesc}>{item.sourceProgram} → OnePoint</Text>
          <Text style={styles.txDate}>{dateStr}</Text>
        </View>
        <View style={styles.txAmounts}>
          <Text style={styles.txSource}>-{item.sourceAmount.toLocaleString()} pts</Text>
          <Text style={styles.txOnepoint}>+{item.onepointAmount.toLocaleString()} OP</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <FlatList
        data={MOCK_SWAP_TRANSACTIONS}
        keyExtractor={(item) => item.id}
        renderItem={renderSwapTx}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Swap History</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No swap transactions yet.</Text>
        }
      />
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.swapFab} onPress={() => setStep('selectProgram')}
          accessibilityRole="button" accessibilityLabel="Swap Points">
          <Ionicons name="swap-horizontal" size={22} color="#fff" />
          <Text style={styles.swapFabText}>Swap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 16, paddingBottom: 100 },
  centerContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A2E', textAlign: 'center', marginBottom: 6 },
  pageSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  // Program selection
  programCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  programLogo: { width: 44, height: 44, borderRadius: 8, marginRight: 14 },
  programInfo: { flex: 1 },
  programName: { fontSize: 16, fontWeight: '600', color: '#333' },
  programRate: { fontSize: 12, color: '#999', marginTop: 2 },
  // Input
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0', width: '100%', marginBottom: 14 },
  // Info cards
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontSize: 14, color: '#666' },
  infoValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  // Preview
  previewBox: { backgroundColor: '#E8F5E9', borderRadius: 10, padding: 14, marginBottom: 14, alignItems: 'center' },
  previewText: { fontSize: 15, color: '#333' },
  previewHighlight: { fontWeight: '700', color: '#4CAF50' },
  // Buttons
  primaryBtn: { backgroundColor: '#0066FF', borderRadius: 12, paddingVertical: 15, alignItems: 'center', width: '100%', marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  backLink: { marginTop: 20, alignItems: 'center' },
  backText: { fontSize: 14, color: '#0066FF', fontWeight: '500' },
  // Transaction list
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  txIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F0FE', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: '500', color: '#333' },
  txDate: { fontSize: 12, color: '#999', marginTop: 2 },
  txAmounts: { alignItems: 'flex-end' },
  txSource: { fontSize: 13, color: '#E53935' },
  txOnepoint: { fontSize: 13, fontWeight: '600', color: '#4CAF50', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 15 },
  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#F5F7FA' },
  swapFab: { backgroundColor: '#0066FF', borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  swapFabText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  // Success
  successTitle: { fontSize: 24, fontWeight: '700', color: '#1A1A2E', marginTop: 20, marginBottom: 10 },
  successSub: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 30 },
});
