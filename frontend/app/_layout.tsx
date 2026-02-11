import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import axios from 'axios';

// Get backend URL
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function RootLayout() {
  
  // WARM UP SERVER ON APP LAUNCH
  useEffect(() => {
    const warmUpServer = async () => {
      try {
        console.log('Warming up backend server...');
        // Just ping the root endpoint to wake up Render free tier
        await axios.get(`${EXPO_PUBLIC_BACKEND_URL}/`);
        console.log('Backend server awake!');
      } catch (error) {
        // Ignore errors, this is just a background optimization
        console.log('Warmup ping failed (server might be sleeping or offline)', error);
      }
    };

    if (EXPO_PUBLIC_BACKEND_URL) {
      warmUpServer();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Home',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="camera" 
          options={{ 
            title: 'Capture Issue',
            presentation: 'modal'
          }} 
        />
        <Stack.Screen 
          name="diagnosis" 
          options={{ 
            title: 'Diagnosis Results'
          }} 
        />
        <Stack.Screen 
          name="project" 
          options={{ 
            title: 'Project Details'
          }} 
        />
        <Stack.Screen 
          name="history" 
          options={{ 
            title: 'My Projects'
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
