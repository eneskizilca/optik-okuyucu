import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          paddingBottom: 5,
        },
        headerStyle: {
          backgroundColor: Colors.background,
          shadowColor: 'transparent',
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTintColor: Colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        sceneStyle: {
          backgroundColor: Colors.background,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          title: 'Sınavlar',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="file-document-multiple" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-exam"
        options={{
          title: 'Sınav Oluştur',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="plus-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="cog" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
