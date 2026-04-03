import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExams, getResultsForExam } from '../../utils/storage';
import { Exam } from '../../utils/types';
import ExamCard from '../../components/ExamCard';
import { useNavigation } from 'expo-router';

export default function HomeScreen() {
  const [exams, setExams] = useState<(Exam & { scanCount: number })[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const loadData = async () => {
    try {
      const storedExams = await getExams();

      let scans = 0;
      const examsWithCounts = await Promise.all(
        storedExams.map(async (exam) => {
          const results = await getResultsForExam(exam.id);
          scans += results.length;
          return { ...exam, scanCount: results.length };
        })
      );
      setExams(examsWithCounts.slice(0, 3));
      setTotalScans(scans);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hoş Geldiniz 👋</Text>
        <Text style={styles.subtitle}>Optik Okuyucu Kontrol Paneli</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="file-document-multiple-outline" size={32} color={Colors.primary} />
          <Text style={styles.statValue}>{exams.length}</Text>
          <Text style={styles.statLabel}>Sınavlar</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="camera-iris" size={32} color={Colors.accent} />
          <Text style={styles.statValue}>{totalScans}</Text>
          <Text style={styles.statLabel}>Taramalar</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Son Sınavlar</Text>
        </View>
        
        {exams.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="flask-empty-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Henüz sınav bulunmuyor.</Text>
            <Text style={styles.emptySubtext}>"Sınav Oluştur" sekmesinden başlayın.</Text>
          </View>
        ) : (
          exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} scanCount={exam.scanCount} />
          ))
        )}
      </View>
    </ScrollView>
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
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    color: Colors.text,
    fontSize: 16,
    marginTop: Spacing.md,
    fontWeight: '500',
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.xs,
  }
});
