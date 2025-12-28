import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RefineScreen from '../screens/RefineScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#0d6efd',
          tabBarInactiveTintColor: '#6c757d',
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: '#dee2e6',
            backgroundColor: '#fff',
          },
          headerStyle: {
            backgroundColor: '#fff',
            borderBottomWidth: 1,
            borderBottomColor: '#dee2e6',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tab.Screen
          name="Refine"
          component={RefineScreen}
          options={{
            title: '다듬기',
            tabBarLabel: '다듬기',
            tabBarIcon: () => null,
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: '히스토리',
            tabBarLabel: '히스토리',
            tabBarIcon: () => null,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: '프로필',
            tabBarLabel: '프로필',
            tabBarIcon: () => null,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
