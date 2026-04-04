import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAlert } from '../../components/AlertProvider';
import ExamCard from '../../components/ExamCard';
import { Colors, Spacing } from '../../constants/theme';
import { deleteExam, getExams, getResultsForExam } from '../../utils/storage';
import { Exam } from '../../utils/types';

export default function ExamsScreen() {
  const [exams, setExams] = useState<(Exam & { scanCount: number })[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { showAlert } = useAlert();

  const loadData = async () => {
    try {
      const storedExams = await getExams();
      const examsWithCounts = await Promise.all(
        storedExams.map(async (exam) => {
          const results = await getResultsForExam(exam.id);
          return { ...exam, scanCount: results.length };
        })
      );
      setExams(examsWithCounts);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleDelete = async (exam: Exam & { scanCount: number }) => {
    showAlert({
      title: 'Sınavı Sil',
      message: `"${exam.name}" sınavını ve tüm tarama verilerini silmek istiyor musunuz?`,
      type: 'confirm',
      buttons: [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive', 
          onPress: async () => {
            await deleteExam(exam.id);
            await loadData();
          }
        },
      ],
    });
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tüm Sınavlar</Text>
        <Text style={styles.subtitle}>{exams.length} sınav listeleniyor</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {exams.map((exam) => (
          <ExamCard
            key={exam.id}
            exam={exam}
            scanCount={exam.scanCount}
            onDelete={() => handleDelete(exam)}
          />
        ))}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  listContainer: {
    padding: Spacing.lg,
  }
});
