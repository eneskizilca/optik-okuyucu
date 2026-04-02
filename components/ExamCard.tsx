import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Exam } from '../utils/types';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { Link } from 'expo-router';

interface ExamCardProps {
  exam: Exam;
  scanCount?: number;
}

export default function ExamCard({ exam, scanCount = 0 }: ExamCardProps) {
  const date = new Date(exam.createdAt).toLocaleDateString('tr-TR');
  
  return (
    <Link href={`/exam/${exam.id}`} asChild>
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{exam.name}</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textSecondary} />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statLabel}>
            <MaterialCommunityIcons name="format-list-numbered" size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>{exam.questionCount} Soru</Text>
          </View>
          <View style={styles.statLabel}>
            <MaterialCommunityIcons name="camera-iris" size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>{scanCount} Tarama</Text>
          </View>
          <View style={styles.statLabel}>
            <MaterialCommunityIcons name="calendar-month" size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>{date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    color: Colors.textSecondary,
    fontSize: 14,
  }
});
