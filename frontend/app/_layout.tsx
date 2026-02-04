import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
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