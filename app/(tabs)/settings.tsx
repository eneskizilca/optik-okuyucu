import React from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const clearData = () => {
    Alert.alert(
      "Verileri Temizle",
      "Tüm sınavlar ve tarama sonuçları silinecek. Emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Başarılı", "Tüm veriler temizlendi.");
            } catch (e) {
              Alert.alert("Hata", "Veriler temizlenemedi.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
      </View>
      
      <View style={styles.section}>
        <TouchableOpacity style={styles.dangerButton} onPress={clearData}>
          <MaterialCommunityIcons name="delete" size={24} color={Colors.error} />
          <View style={styles.btnContent}>
            <Text style={styles.btnTitle}>Tüm Verileri Temizle</Text>
            <Text style={styles.btnSubtitle}>Sınavlar ve sonuçlar kalıcı olarak silinir</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLine}>Geliştiren: Enes Kızılca</Text>
        <Text style={styles.footerLine}>3. Sınıf Yazılım Mühendisliği Öğrencisi</Text>
        <Text style={styles.footerLine}>235541116 | GECE-B</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  btnContent: {
    flex: 1,
  },
  btnTitle: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
  btnSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 'auto',
  },
  footerLine: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
});
