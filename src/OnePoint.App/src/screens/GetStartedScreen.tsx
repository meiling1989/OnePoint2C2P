import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export default function GetStartedScreen({ onGetStarted, onSignIn }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <Image
          source={require('../../assets/getstarted.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Welcome to OnePoint</Text>
        <Text style={styles.subtitle}>
          Aggregate, swap, and spend your loyalty points across multiple programs — all in one place.
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.getStartedBtn}
          onPress={onGetStarted}
          accessibilityRole="button"
          accessibilityLabel="Get Started"
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSignIn}
          accessibilityRole="link"
          accessibilityLabel="Sign in as existing customer"
        >
          <Text style={styles.signInText}>
            Already a OnePoint customer?{' '}
            <Text style={styles.signInBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    paddingHorizontal: 28,
    paddingTop: 80,
    paddingBottom: 50,
  },
  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 260,
    height: 260,
  },
  content: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  bottom: {
    alignItems: 'center',
    gap: 20,
  },
  getStartedBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 60,
    width: '100%',
    alignItems: 'center',
  },
  getStartedText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  signInText: {
    fontSize: 14,
    color: '#666',
  },
  signInBold: {
    color: '#0066FF',
    fontWeight: '600',
  },
});
