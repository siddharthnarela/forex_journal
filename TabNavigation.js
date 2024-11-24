import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from './screens/Home';
import Trades from './screens/Trades';
import Strategies from './screens/Strategies';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Risk from './screens/Risk';
import Profile from './screens/Profile';

const Tab = createBottomTabNavigator();

export default function TabNavigation() {
  return (
    <SafeAreaProvider>
      <Tab.Navigator
        initialRouteName='Home'
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarShowLabel: false, // Move this here instead of tabBarStyle
          tabBarStyle: {
            backgroundColor: "#050C1D",
            position: 'absolute',
            borderTopEndRadius: 15,
            borderTopStartRadius: 15,
            // margin: 10,
            paddingTop:8,
            height: 55, // Add fixed height
            paddingBottom: 10, // Add bottom padding
            borderTopWidth: 0, // Remove top border
            elevation: 0, // Remove shadow on Android
            shadowOpacity: 0, // Remove shadow on iOS
          }
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={Home} 
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name="bar-chart" 
                size={24} 
                color={focused ? "#007AFF" : "white"} 
              />
            )
          }}     
        />
        <Tab.Screen 
          name="Trades" 
          component={Trades} 
          options={{
            tabBarIcon: ({ focused }) => (
              <MaterialIcons 
                name="featured-play-list" 
                size={28} 
                color={focused ? "#007AFF" : "white"} 
              />
            )
          }}     
        />
        <Tab.Screen 
          name="Strategies" 
          component={Strategies} 
          options={{
            tabBarIcon: ({ focused }) => (
              <FontAwesome5 
                name="chess-knight" 
                size={24} 
                color={focused ? "#007AFF" : "white"} 
              />
            )
          }}     
        />
        <Tab.Screen 
          name="Risk" 
          component={Risk} 
          options={{
            tabBarIcon: ({ focused }) => (
              <FontAwesome5 
                name="calculator" 
                size={22} 
                color={focused ? "#007AFF" : "white"} 
              />
            )
          }}     
        />
        <Tab.Screen 
          name="Profile" 
          component={Profile} 
          options={{
            tabBarIcon: ({ focused }) => (
              <MaterialIcons 
                name="account-balance" 
                size={24} 
                color={focused ? "#007AFF" : "white"} 
              />
            )
          }}     
        />
      </Tab.Navigator>
    </SafeAreaProvider>
  );
}