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
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
          colors={[Colors.primary]}
        />
      }
    >
      {/* Hero Banner */}
      <View style={styles.heroBanner}>
        <MaterialCommunityIcons
          name="dots-grid"
          size={120}
          color="rgba(255,255,255,0.12)"
          style={styles.heroDecor}
        />
        <View style={styles.heroContent}>
          <Text style={styles.greeting}>Hoş Geldiniz 👋</Text>
          <Text style={styles.subtitle}>Optik Okuyucu Kontrol Paneli</Text>
        </View>
        <View style={styles.heroIconWrap}>
          <MaterialCommunityIcons name="school-outline" size={36} color="rgba(255,255,255,0.9)" />
        </View>
      </View>

      {/* Stat Cards — biraz header üzerine taşıyor */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: Colors.primaryLight }]}>
            <MaterialCommunityIcons name="file-document-multiple-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.statValue}>{exams.length}</Text>
          <Text style={styles.statLabel}>Sınavlar</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: Colors.accentLight }]}>
            <MaterialCommunityIcons name="camera-iris" size={22} color={Colors.accent} />
          </View>
          <Text style={styles.statValue}>{totalScans}</Text>
          <Text style={styles.statLabel}>Taramalar</Text>
        </View>
      </View>

      {/* Son Sınavlar Bölümü */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccentBar} />
            <Text style={styles.sectionTitle}>Son Sınavlar</Text>
          </View>
        </View>

        {exams.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialCommunityIcons name="flask-empty-outline" size={40} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyText}>Henüz sınav bulunmuyor</Text>
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

  /* ── Hero ── */
  heroBanner: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl + 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroDecor: {
    position: 'absolute',
    right: -20,
    top: -20,
  },
  heroContent: {
    flex: 1,
  },
  heroIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '400',
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: -28,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 4,
  },
  statIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },

  /* ── Section ── */
  section: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionAccentBar: {
    width: 4,
    height: 20,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },

  /* ── Empty State ── */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
