import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

interface Conversation {
  id: number;
  other_user_name: string;
  other_user_id: number;
  last_message: string;
  last_message_at: string;
}

export default function ChatListScreen() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      other_user_name: 'Mario Coach',
      other_user_id: 1,
      last_message: 'Perfetto! Domani gambe 💪',
      last_message_at: '10:40'
    },
    {
      id: 2,
      other_user_name: 'Luca Cliente',
      other_user_id: 2,
      last_message: 'Grazie per i consigli!',
      last_message_at: '09:15'
    }
  ]);

  const router = useRouter();

  const openChat = (userId: number, userName: string) => {
    router.push({
      pathname: '/chat-detail',
      params: { userId, userName }
    });
  };

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100)}>
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => openChat(item.other_user_id, item.other_user_name)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.other_user_name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.userName}>{item.other_user_name}</Text>
            <Text style={styles.timeText}>{item.last_message_at}</Text>
          </View>

          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message}
          </Text>
        </View>

        <View style={styles.unreadBadge}>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CHAT</Text>
        <TouchableOpacity style={styles.newChatButton}>
          <Ionicons name="create-outline" size={24} color={Colors.light.buttonText} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        style={styles.conversationsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: Colors.light.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  newChatButton: {
    backgroundColor: Colors.light.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.buttonText,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  timeText: {
    fontSize: 14,
    color: '#999',
  },
  lastMessage: {
    fontSize: 16,
    color: '#666',
  },
  unreadBadge: {
    marginLeft: 10,
  },
});