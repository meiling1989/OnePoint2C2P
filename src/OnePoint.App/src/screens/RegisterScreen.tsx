import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSendOtp = () => {
    if (!phone.trim() || phone.trim().length < 8) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number.');
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters.');
      return;
    }
    navigation.navigate('OTP', { phone: phone.trim() });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoArea}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.brand}>Create Account</Text>
        <Text style={styles.tagline}>Enter your mobile number to get started</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoFocus
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!phone.trim() || !password.trim()) && styles.sendBtnDisabled]}
          onPress={handleSendOtp}
          disabled={!phone.trim() || !password.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send OTP"
        >
          <Text style={styles.sendBtnText}>Send OTP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => navigation.navigate('Login')}
        accessibilityRole="link"
        accessibilityLabel="Go to login"
      >
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginBold}>Log In</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 160,
    height: 80,
    marginBottom: 8,
  },
  brand: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#99C2FF',
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 28,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginBold: {
    color: '#0066FF',
    fontWeight: '600',
  },
});
