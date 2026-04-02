import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExamById, saveExam, getResultsForExam, deleteExam, deleteResult } from '../../utils/storage';
import { Exam, ScanResult } from '../../utils/types';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);

  const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const e = await getExamById(id);
      if (e) {
        setExam(e);
        const r = await getResultsForExam(id);
        setResults(r);
      } else {
        Alert.alert('Hata', 'Sınav bulunamadı', [{ text: 'Tamam', onPress: () => router.back() }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const updateAnswerKey = async (questionIndex: number, optionIndex: number) => {
    if (!exam) return;
    
    const newAnswerKey = [...exam.answerKey];
    const selectedOption = OPTIONS[optionIndex];
    
    // Toggle (if clicked the already selected one, clear it)
    if (newAnswerKey[questionIndex] === selectedOption) {
      newAnswerKey[questionIndex] = '';
    } else {
      newAnswerKey[questionIndex] = selectedOption;
    }

    const updatedExam = { ...exam, answerKey: newAnswerKey };
    setExam(updatedExam);
    await saveExam(updatedExam);
  };

  const handleDeleteExam = () => {
    Alert.alert(
      "Sınavı Sil",
      "Sınavı ve altındaki tüm okumaları silmek istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
             if (exam) {
                 await deleteExam(exam.id);
                 router.back();
             }
          }
        }
      ]
    );
  };

  if (loading || !exam) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const dateStr = new Date(exam.createdAt).toLocaleDateString('tr-TR');
  const missingAnsCount = exam.answerKey.filter(a => !a).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Info Header */}
        <View style={styles.headerBox}>
          <View style={{flex: 1}}>
            <Text style={styles.examTitle}>{exam.name}</Text>
            <Text style={styles.examSub}>{exam.questionCount} Soru • {dateStr}</Text>
          </View>
          <TouchableOpacity onPress={handleDeleteExam} style={styles.deleteBtn}>
             <MaterialCommunityIcons name="delete-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Answer Key Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Cevap Anahtarı</Text>
            {missingAnsCount > 0 && (
              <Text style={styles.warningText}>{missingAnsCount} soru eksik</Text>
            )}
          </View>

          <View style={styles.grid}>
            {exam.answerKey.map((ans, qIndex) => (
              <View key={qIndex} style={styles.gridRow}>
                <Text style={styles.qNum}>{qIndex + 1}.</Text>
                <View style={styles.optionsRow}>
                  {Array.from({ length: exam.optionsCount }).map((_, oIndex) => {
                    const isSelected = ans === OPTIONS[oIndex];
                    return (
                      <TouchableOpacity 
                        key={oIndex} 
                        style={[styles.bubble, isSelected && styles.bubbleSelected]}
                        onPress={() => updateAnswerKey(qIndex, oIndex)}
                      >
                        <Text style={[styles.bubbleText, isSelected && styles.bubbleTextSelected]}>
                          {OPTIONS[oIndex]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Scans List */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Taramalar ({results.length})</Text>
           {results.length === 0 ? (
               <View style={styles.emptyCard}>
                   <Text style={{color: Colors.textSecondary}}>Henüz tarama yapılmadı.</Text>
               </View>
           ) : (
               results.map(r => (
                   <TouchableOpacity key={r.id} style={styles.resultCard} onPress={() => router.push(`/result/${r.id}`)}>
                       <View style={{ flex: 1}}>
                           <Text style={styles.studentName}>{r.studentName || 'Bilinmiyor'} ({r.studentNo || 'No Yok'})</Text>
                           <Text style={styles.resultSub}>D: {r.correct} | Y: {r.incorrect} | B: {r.empty}</Text>
                       </View>
                       <View style={styles.scoreBox}>
                           <Text style={styles.scoreText}>{r.score}</Text>
                       </View>
                   </TouchableOpacity>
               ))
           )}
        </View>
      </ScrollView>

      {/* FAB - Camera Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push(`/scan/${exam.id}`)}
      >
        <MaterialCommunityIcons name="camera-iris" size={32} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBox: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  examTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  examSub: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  warningText: {
    color: Colors.warning,
    fontSize: 12,
  },
  grid: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  qNum: {
    width: 30,
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  optionsRow: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  bubble: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bubbleEmpty,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bubbleText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  bubbleTextSelected: {
    color: '#FFF',
  },
  emptyCard: {
      backgroundColor: Colors.card,
      padding: Spacing.xl,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border,
      borderStyle: 'dashed'
  },
  resultCard: {
      flexDirection: 'row',
      backgroundColor: Colors.card,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
  },
  studentName: {
      color: Colors.text,
      fontSize: 16,
      fontWeight: '600',
  },
  resultSub: {
      color: Colors.textSecondary,
      fontSize: 14,
      marginTop: 4,
  },
  scoreBox: {
      backgroundColor: Colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: Colors.border,
  },
  scoreText: {
      color: Colors.text,
      fontSize: 18,
      fontWeight: 'bold',
  },
  fab: {
      position: 'absolute',
      bottom: 30,
      right: 30,
      width: 65,
      height: 65,
      borderRadius: 32.5,
      backgroundColor: Colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#00D9FF",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5.46,
      elevation: 9,
  }
});
