import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../AuthContext';
import SplashScreen from '../screens/SplashScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import OTPScreen from '../screens/OTPScreen';
import HomeScreen from '../screens/HomeScreen';
import QRScreen from '../screens/QRScreen';
import HistoryScreen from '../screens/HistoryScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import SwapScreen from '../screens/SwapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { MOCK_NOTIFICATIONS } from '../mockData';

export type AuthStackParamList = {
  GetStarted: undefined;
  Login: undefined;
  Register: undefined;
  OTP: { phone: string };
};

export type MainTabParamList = {
  Home: undefined;
  QR: undefined;
  History: undefined;
  Promotions: undefined;
  Swap: undefined;
  Profile: undefined;
  Notifications: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  QR: 'qr-code',
  History: 'time',
  Promotions: 'pricetag',
  Swap: 'swap-horizontal',
  Profile: 'person',
  Notifications: 'notifications',
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="GetStarted">
        {(props) => (
          <GetStartedScreen
            onGetStarted={() => props.navigation.navigate('Register')}
            onSignIn={() => props.navigation.navigate('Login')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="OTP" component={OTPScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#0066FF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        ...(route.name === 'Notifications' && unreadCount > 0
          ? { tabBarBadge: unreadCount }
          : {}),
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="QR" component={QRScreen} options={{ title: 'My QR' }} />
      <MainTab.Screen name="History" component={HistoryScreen} />
      <MainTab.Screen name="Promotions" component={PromotionsScreen} />
      <MainTab.Screen name="Swap" component={SwapScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
      <MainTab.Screen name="Notifications" component={NotificationsScreen} />
    </MainTab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoggedIn } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinish = useCallback(() => setShowSplash(false), []);

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
