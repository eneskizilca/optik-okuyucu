import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { Exam } from '../utils/types';

interface ExamCardProps {
  exam: Exam;
  scanCount?: number;
  onDelete?: () => void;
}

export default function ExamCard({ exam, scanCount = 0, onDelete }: ExamCardProps) {
  const date = new Date(exam.createdAt).toLocaleDateString('tr-TR');
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/exam/${exam.id}` as any)}
    >
      {/* Sil butonu — sağ üst köşeye gömülü */}
      {onDelete && (
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      )}

      <Text style={styles.title} numberOfLines={1}>{exam.name}</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statLabel}>
          <MaterialCommunityIcons name="format-list-numbered" size={15} color={Colors.textSecondary} />
          <Text style={styles.statText}>{exam.questionCount} Soru</Text>
        </View>
        <View style={styles.statLabel}>
          <MaterialCommunityIcons name="camera-iris" size={15} color={Colors.textSecondary} />
          <Text style={styles.statText}>{scanCount} Tarama</Text>
        </View>
        <View style={styles.statLabel}>
          <MaterialCommunityIcons name="calendar-month" size={15} color={Colors.textSecondary} />
          <Text style={styles.statText}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  deleteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: '#fca5a5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    paddingRight: 40,
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
    fontSize: 13,
    fontWeight: '500',
  },
});
