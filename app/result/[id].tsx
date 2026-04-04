import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAlert } from '../../components/AlertProvider';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { getExams, getResultsForExam, updateResult } from '../../utils/storage';
import { Exam, ScanResult } from '../../utils/types';

export default function ResultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedNo, setEditedNo] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      const allExams = await getExams();
      for (const e of allExams) {
        const results = await getResultsForExam(e.id);
        const found = results.find(r => r.id === id);
        if (found) {
          setResult(found);
          setExam(e);
          setEditedName(found.studentName || '');
          setEditedNo(found.studentNo || '');
          break;
        }
      }
    };
    fetchResult();
  }, [id]);

  const handleSaveEdit = async () => {
    if (!result || !exam) return;
    
    const updatedResult = {
      ...result,
      studentName: editedName.trim() || 'Bilinmiyor',
      studentNo: editedNo.trim() || '0000',
    };
    
    await updateResult(exam.id, updatedResult);
    setResult(updatedResult);
    setIsEditing(false);
    
    showAlert({
      title: 'Başarılı',
      message: 'Öğrenci bilgileri güncellendi',
      type: 'success'
    });
  };

  const handleCancelEdit = () => {
    setEditedName(result?.studentName || '');
    setEditedNo(result?.studentNo || '');
    setIsEditing(false);
  };

  if (!result || !exam) {
    return (
      <View style={[styles.container, styles.center]}>
         <Text style={{color: Colors.text}}>Yükleniyor...</Text>
      </View>
    );
  }

  const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

  return (
    <View style={styles.outerContainer}>
    <ScrollView style={styles.container}>
      {/* Overview Card */}
      <View style={styles.card}>
         <View style={styles.headerRow}>
            <MaterialCommunityIcons name="account-circle" size={48} color={Colors.primary} />
            <View style={{marginLeft: Spacing.md, flex: 1}}>
                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.input}
                      value={editedName}
                      onChangeText={setEditedName}
                      placeholder="Ad Soyad"
                      placeholderTextColor={Colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.input, {marginTop: Spacing.sm}]}
                      value={editedNo}
                      onChangeText={setEditedNo}
                      placeholder="Öğrenci No"
                      placeholderTextColor={Colors.textSecondary}
                      keyboardType="numeric"
                    />
                  </>
                ) : (
                  <>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text style={styles.name}>{result.studentName || 'İsimsiz Öğrenci'}</Text>
                      <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editIconBtn}>
                        <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.no}>No: {result.studentNo || '-'}</Text>
                  </>
                )}
            </View>
            {isEditing ? (
              <View style={{flexDirection: 'row', gap: Spacing.sm}}>
                <TouchableOpacity onPress={handleCancelEdit} style={styles.iconBtn}>
                  <MaterialCommunityIcons name="close" size={24} color={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit} style={styles.iconBtn}>
                  <MaterialCommunityIcons name="check" size={24} color={Colors.success} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.scoreCircle}>
                  <Text style={styles.scoreText}>{result.score}</Text>
              </View>
            )}
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

    {/* Sticky bottom button */}
    <View style={styles.stickyBar}>
      <TouchableOpacity
        style={styles.scanAgainBtn}
        onPress={() => router.replace((`/scan/${result.examId}`) as any)}
      >
        <MaterialCommunityIcons name="camera-iris" size={22} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.scanAgainText}>Diğer Optiği Tara</Text>
      </TouchableOpacity>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
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
  },
  stickyBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: 30,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  scanAgainBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: Spacing.sm,
  },
});
