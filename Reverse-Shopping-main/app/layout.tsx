import { Slot } from 'expo-router';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';

export default function RootLayout() {
  return (
    <NavigationContainer>
      <Slot />
    </NavigationContainer>
  );
}