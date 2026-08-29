import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RemindersProvider } from './src/context/RemindersContext';
import { ThemeProvider, useTheme } from './src/theme';
import { ensurePermissionsAndChannel } from './src/utils/notifications';
import HomeScreen from './src/screens/HomeScreen';
import CreateReminderScreen from './src/screens/CreateReminderScreen';
import EditReminderScreen from './src/screens/EditReminderScreen';

const Stack = createNativeStackNavigator();

function buildNavTheme(colors, isDark) {
  return {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.primary,
    },
  };
}

function RootNavigator() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <NavigationContainer theme={buildNavTheme(colors, isDark)}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '700', color: colors.text },
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen
            name="Reminders"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="CreateReminder"
            component={CreateReminderScreen}
            options={{ title: 'New Reminder', presentation: 'modal' }}
          />
          <Stack.Screen
            name="EditReminder"
            component={EditReminderScreen}
            options={{ title: 'Edit Reminder' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  useEffect(() => {
    ensurePermissionsAndChannel();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <RemindersProvider>
          <RootNavigator />
        </RemindersProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

