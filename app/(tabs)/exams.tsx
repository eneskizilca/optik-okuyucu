import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';
import { getExams, getResultsForExam, deleteExam } from '../../utils/storage';
import { Exam } from '../../utils/types';
import ExamCard from '../../components/ExamCard';
import { useFocusEffect } from 'expo-router';

export default function ExamsScreen() {
  const [exams, setExams] = useState<(Exam & { scanCount: number })[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const handleDelete = async (examId: string) => {
    await deleteExam(examId);
    await loadData();
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
            onDelete={() => handleDelete(exam.id)}
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
