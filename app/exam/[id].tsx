import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExamById, saveExam, getResultsForExam, deleteExam, deleteResult } from '../../utils/storage';
import { Exam, ScanResult } from '../../utils/types';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import Svg, { Circle, Text as SvgText, Rect, G } from 'react-native-svg';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

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

  const handleShareTemplate = async () => {
    if (viewShotRef.current?.capture) {
      setIsGenerating(true);
      try {
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/jpeg',
            dialogTitle: `${exam?.name || 'Sinav'}_optik_sablon.jpg`,
          });
        } else {
          Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Hata', 'Şablon oluşturulamadı.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const renderSvgTemplate = () => {
    if (!exam) return null;
    const sheetWidth = 800;
    const sheetHeight = 1100;
    
    const renderAlignMarker = (x: number, y: number) => (
      <Rect x={x} y={y} width={40} height={40} fill="black" />
    );

    const startY = 320; 
    const rowHeight = 35;
    const bubbleSpacing = 35;
    const bubbleRadius = 12;

    const halfCount = Math.ceil(exam.questionCount / 2);

    const circles = [];
    for (let i = 0; i < exam.questionCount; i++) {
        const isRightColumn = i >= halfCount;
        const qX = isRightColumn ? 420 : 80;
        const row = isRightColumn ? i - halfCount : i;
        const qY = startY + (row * rowHeight);

        circles.push(
            <SvgText key={`qNum_${i}`} x={qX} y={qY + 5} fontSize="16" fill="black" textAnchor="end">
                {i + 1}.
            </SvgText>
        );

        for(let opt=0; opt<exam.optionsCount; opt++) {
            const bX = qX + 25 + (opt * bubbleSpacing);
            circles.push(
                <G key={`q${i}_o${opt}`}>
                    <Circle cx={bX} cy={qY} r={bubbleRadius} stroke="black" strokeWidth="2" fill="white" />
                    <SvgText x={bX} y={qY + 5} fontSize="14" fill="black" textAnchor="middle">
                        {OPTIONS[opt]}
                    </SvgText>
                </G>
            );
        }
    }

    return (
      <Svg width="100%" viewBox={`0 0 ${sheetWidth} ${sheetHeight}`} style={{ aspectRatio: sheetWidth / sheetHeight, backgroundColor: 'white' }}>
        <Rect width="100%" height="100%" fill="white" />
        <SvgText x={sheetWidth/2} y={60} fontSize="32" fontWeight="bold" fill="black" textAnchor="middle">
          {exam.name || 'SINAV OPTİK FORMU'}
        </SvgText>
        <SvgText x={sheetWidth/2} y={100} fontSize="18" fill="gray" textAnchor="middle">
          Lütfen yuvarlakların içini tamamen karalayınız.
        </SvgText>
        {renderAlignMarker(20, 20)}
        {renderAlignMarker(sheetWidth - 60, 20)}
        {renderAlignMarker(20, sheetHeight - 60)}
        {renderAlignMarker(sheetWidth - 60, sheetHeight - 60)}

        <Rect x={80} y={150} width={640} height={50} stroke="black" strokeWidth="2" fill="none" />
        <SvgText x={95} y={180} fontSize="20" fontWeight="bold" fill="black">AD SOYAD :</SvgText>
        <Rect x={80} y={220} width={640} height={50} stroke="black" strokeWidth="2" fill="none" />
        <SvgText x={95} y={250} fontSize="20" fontWeight="bold" fill="black">ÖĞRENCİ NO :</SvgText>
        {circles}
      </Svg>
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
          <View style={{flexDirection: 'row', alignItems: 'center', gap: Spacing.sm}}>
              <TouchableOpacity onPress={handleShareTemplate} style={styles.downloadBtn} disabled={isGenerating}>
                 {isGenerating ? (
                     <ActivityIndicator size="small" color={Colors.primary} />
                 ) : (
                     <MaterialCommunityIcons name="download" size={24} color={Colors.primary} />
                 )}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteExam} style={styles.deleteBtn}>
                 <MaterialCommunityIcons name="delete-outline" size={24} color={Colors.error} />
              </TouchableOpacity>
          </View>
        </View>

        {/* Off-screen ViewShot container for generating SVG image */}
        <View style={{ position: 'absolute', left: -10000, top: -10000 }}>
           <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 1 }}>
             <View style={{ width: 800, backgroundColor: 'white' }}>
                 {renderSvgTemplate()}
             </View>
           </ViewShot>
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
  downloadBtn: {
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
