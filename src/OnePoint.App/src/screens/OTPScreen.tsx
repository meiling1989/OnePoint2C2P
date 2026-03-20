import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { AuthStackParamList } from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'OTP'>;
type OTPRoute = RouteProp<AuthStackParamList, 'OTP'>;

export default function OTPScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<OTPRoute>();
  const phone = route.params?.phone ?? '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) text = text.slice(-1);
    if (text && !/^\d$/.test(text)) return;
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit code.');
      return;
    }
    setShowSuccess(true);
  };

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => navigation.navigate('Login'), 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess, navigation]);

  if (showSuccess) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.successTitle}>Registration Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your account has been created. Redirecting to login...
        </Text>
      </View>
    );
  }

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
        <Text style={styles.brand}>Verify OTP</Text>
        <Text style={styles.tagline}>
          Enter the 6-digit code sent to {phone || 'your phone'}
        </Text>
      </View>

      <View style={styles.otpRow}>
        {otp.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
            accessibilityLabel={`OTP digit ${i + 1}`}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.verifyBtn, otp.join('').length < 6 && styles.verifyBtnDisabled]}
        onPress={handleVerify}
        disabled={otp.join('').length < 6}
        accessibilityRole="button"
        accessibilityLabel="Verify OTP"
      >
        <Text style={styles.verifyBtnText}>Verify</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resendLink}
        onPress={() => Alert.alert('OTP Resent', `A new code has been sent to ${phone}`)}
        accessibilityRole="button"
      >
        <Text style={styles.resendText}>
          Didn't receive the code? <Text style={styles.resendBold}>Resend</Text>
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
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 28,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#fff',
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  otpBoxFilled: {
    borderColor: '#0066FF',
  },
  verifyBtn: {
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  verifyBtnDisabled: {
    backgroundColor: '#99C2FF',
  },
  verifyBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  resendLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendBold: {
    color: '#0066FF',
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    marginTop: 20,
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
