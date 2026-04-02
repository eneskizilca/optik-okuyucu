import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="exam/[id]" options={{ title: 'Sınav Detayı', headerBackTitle: 'Geri' }} />
        <Stack.Screen name="scan/[examId]" options={{ title: 'Optik Tarama', headerBackTitle: 'İptal', presentation: 'fullScreenModal' }} />
        <Stack.Screen name="result/[id]" options={{ title: 'Tarama Sonucu', headerBackTitle: 'Geri' }} />
      </Stack>
    </>
  );
}
