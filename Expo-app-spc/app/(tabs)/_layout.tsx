
import { Tabs } from 'expo-router';
import React from 'react';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.light.background,
          borderTopWidth: 2,
          borderTopColor: Colors.light.primary,
          height: 100,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.text,
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: 'bold',
          marginTop: 5,
        },
        tabBarIconStyle: {
          marginBottom: 5,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'ALLENAMENTO',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'ALIMENTAZIONE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={40} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'CHAT',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={40} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
