import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_NOTIFICATIONS, Notification } from '../mockData';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const categoryIcon = (cat: string): keyof typeof Ionicons.glyphMap => {
    switch (cat) {
      case 'transaction': return 'card';
      case 'promotion': return 'pricetag';
      case 'points': return 'star';
      default: return 'notifications';
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.row, !item.isRead && styles.unread]}
      onPress={() => markAsRead(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? 'Read' : 'Unread'}: ${item.title}`}
    >
      <View style={[styles.iconWrap, !item.isRead && styles.iconUnread]}>
        <Ionicons name={categoryIcon(item.category)} size={20} color={item.isRead ? '#999' : '#0066FF'} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.bodyText} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      {!item.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },
  list: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  unread: { backgroundColor: '#F0F6FF' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconUnread: { backgroundColor: '#E8F0FE' },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#555' },
  titleUnread: { color: '#333' },
  bodyText: { fontSize: 13, color: '#777', marginTop: 2 },
  time: { fontSize: 11, color: '#bbb', marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0066FF', marginLeft: 8 },
});
