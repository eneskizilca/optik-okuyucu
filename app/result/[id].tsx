import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { getResultsForExam, getExams } from '../../utils/storage';
import { Exam, ScanResult } from '../../utils/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      // Because we don't pass examId directly in the path for this route (to simplify links),
      // we have to search across exams to find this result.
      // In a real DB, result table would just be queried by ID.
      const allExams = await getExams();
      for (const e of allExams) {
        const results = await getResultsForExam(e.id);
        const found = results.find(r => r.id === id);
        if (found) {
          setResult(found);
          setExam(e);
          break;
        }
      }
    };
    fetchResult();
  }, [id]);

  if (!result || !exam) {
    return (
      <View style={[styles.container, styles.center]}>
         <Text style={{color: Colors.text}}>Yükleniyor...</Text>
      </View>
    );
  }

  const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

  return (
    <ScrollView style={styles.container}>
      {/* Overview Card */}
      <View style={styles.card}>
         <View style={styles.headerRow}>
            <MaterialCommunityIcons name="account-circle" size={48} color={Colors.primary} />
            <View style={{marginLeft: Spacing.md, flex: 1}}>
                <Text style={styles.name}>{result.studentName || 'İsimsiz Öğrenci'}</Text>
                <Text style={styles.no}>No: {result.studentNo || '-'}</Text>
            </View>
            <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{result.score}</Text>
            </View>
         </View>
         
         <View style={styles.statsRow}>
            <View style={[styles.statBox, {borderLeftColor: Colors.success}]}>
                <Text style={styles.statVal}>{result.correct}</Text>
                <Text style={styles.statLabel}>Doğru</Text>
            </View>
            <View style={[styles.statBox, {borderLeftColor: Colors.error}]}>
                <Text style={styles.statVal}>{result.incorrect}</Text>
                <Text style={styles.statLabel}>Yanlış</Text>
            </View>
            <View style={[styles.statBox, {borderLeftColor: Colors.warning}]}>
                <Text style={styles.statVal}>{result.empty}</Text>
                <Text style={styles.statLabel}>Boş</Text>
            </View>
         </View>
      </View>

      {/* Scanned Image with Bounding Boxes */}
      {result.imageUri && (
         <View style={styles.imageSection}>
             <Text style={styles.sectionTitle}>Form Önizlemesi</Text>
             <View style={styles.imageContainer}>
                 <Image 
                    source={{ uri: result.imageUri }} 
                    style={styles.scannedImage} 
                    resizeMode="contain"
                 />
             </View>
         </View>
      )}

      {/* Answer Comparison */}
      <View style={styles.section}>
         <Text style={styles.sectionTitle}>Cevap Karşılaştırması</Text>
         <View style={styles.grid}>
             <View style={styles.gridHeader}>
                 <Text style={[styles.cell, {flex: 0.5}]}>#</Text>
                 <Text style={styles.cell}>Cevap A.</Text>
                 <Text style={styles.cell}>Öğrenci</Text>
                 <Text style={[styles.cell, {flex: 0, width: 30}]}></Text>
             </View>
             
             {exam.answerKey.map((correctOpt, i) => {
                 const studentOpt = result.answers[i] || '';
                 let statusIcon = 'minus';
                 let iconColor = Colors.warning;
                 
                 if (!correctOpt) {
                    statusIcon = 'help'; // Answer key not set
                    iconColor = Colors.textSecondary;
                 } else if (!studentOpt) {
                    statusIcon = 'minus-circle-outline'; // Empty
                    iconColor = Colors.warning;
                 } else if (correctOpt === studentOpt) {
                    statusIcon = 'check-circle';
                    iconColor = Colors.success;
                 } else {
                    statusIcon = 'close-circle';
                    iconColor = Colors.error;
                 }

                 return (
                    <View key={i} style={styles.gridRow}>
                        <Text style={[styles.cellVal, {flex: 0.5, color: Colors.textSecondary}]}>{i+1}</Text>
                        <Text style={styles.cellVal}>{correctOpt || '-'}</Text>
                        <Text style={styles.cellVal}>{studentOpt || '-'}</Text>
                        <MaterialCommunityIcons name={statusIcon as any} size={20} color={iconColor} style={{width: 30, textAlign: 'center'}}/>
                    </View>
                 );
             })}
         </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  name: {
      color: Colors.text,
      fontSize: 20,
      fontWeight: 'bold',
  },
  no: {
      color: Colors.textSecondary,
      fontSize: 14,
      marginTop: 2,
  },
  scoreCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: Colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: Colors.primary,
  },
  scoreText: {
      color: Colors.text,
      fontSize: 20,
      fontWeight: 'bold',
  },
  statsRow: {
      flexDirection: 'row',
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
  },
  statBox: {
      flex: 1,
      alignItems: 'center',
      borderLeftWidth: 3,
  },
  statVal: {
      color: Colors.text,
      fontSize: 18,
      fontWeight: 'bold',
  },
  statLabel: {
      color: Colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
  },
  section: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
  },
  sectionTitle: {
      color: Colors.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: Spacing.md,
  },
  grid: {
      backgroundColor: Colors.card,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: 'hidden',
  },
  gridHeader: {
      flexDirection: 'row',
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
  },
  cell: {
      flex: 1,
      color: Colors.textSecondary,
      fontSize: 12,
      fontWeight: 'bold',
  },
  gridRow: {
      flexDirection: 'row',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      alignItems: 'center',
  },
  cellVal: {
      flex: 1,
      color: Colors.text,
      fontSize: 16,
      fontWeight: '500',
  },
  imageSection: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
  },
  imageContainer: {
      width: '100%',
      aspectRatio: 800 / 1100,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      overflow: 'hidden',
  },
  scannedImage: {
      flex: 1,
      width: '100%',
      height: '100%',
  },
  boxesOverlay: {
      ...StyleSheet.absoluteFillObject,
  },
  boundingBox: {
      position: 'absolute',
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
  },
  boxIcon: {
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 10,
      padding: 2,
  }
});
