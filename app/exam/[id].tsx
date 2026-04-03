import React, { useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExamById, saveExam, getResultsForExam, deleteExam, deleteResult, saveExcelForExam, getExcelForExam, deleteExcelForExam, ExcelMeta } from '../../utils/storage';
import { processExcel } from '../../utils/excelProcessor';
import { Exam, ScanResult } from '../../utils/types';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import Svg, { Circle, Text as SvgText, Rect, G } from 'react-native-svg';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [excelMeta, setExcelMeta] = useState<ExcelMeta | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
        const excel = await getExcelForExam(id);
        setExcelMeta(excel);
      } else {
        Alert.alert('Hata', 'Sınav bulunamadı', [{ text: 'Tamam', onPress: () => router.back() }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id])
  );

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

  const handleDeleteResult = (resultId: string) => {
    Alert.alert(
      'Taramayı Sil',
      'Bu tarama sonucunu kalıcı olarak silmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (exam) {
              await deleteResult(exam.id, resultId);
              await loadData();
            }
          },
        },
      ]
    );
  };

  // ─── Excel İşlemleri ─────────────────────────────────────────────
  const handlePickExcel = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      // Dosyayı base64 olarak oku (legacy API binary-safe)
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const meta: ExcelMeta = {
        fileName: asset.name,
        uploadedAt: Date.now(),
        base64,
      };
      await saveExcelForExam(id as string, meta);
      setExcelMeta(meta);
      Alert.alert('Başarılı', `"${asset.name}" yüklendi.`);
    } catch (e: any) {
      Alert.alert('Hata', 'Dosya okunamadı: ' + e.message);
    }
  };

  const handleProcessExcel = async () => {
    if (!excelMeta || !exam) return;
    if (results.length === 0) {
      Alert.alert('Uyarı', 'Henüz tarama yapılmamış. Lütfen önce optikleri tarayın.');
      return;
    }

    setIsProcessing(true);
    try {
      const { matched, notFound, outputBase64 } = await processExcel(excelMeta.base64, results);

      // Çıktı dosyasını geçici dizine yaz
      // Dosyayı gerçek binary olarak yaz (base64 → .xlsx)
      const safeFileName = `notlar_${exam.name.replace(/[/\\:*?"<>|]/g, '_')}.xlsx`;
      const cacheDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '';
      const outPath = cacheDir + safeFileName;
      await FileSystem.writeAsStringAsync(outPath, outputBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const outUri = outPath;

      // Uyarı göster sonra paylaş
      const msg = notFound.length > 0
        ? `${matched} öğrencinin notu işlendi.\n\nExcel'de bulunamayan taramalar: ${notFound.join(', ')}`
        : `${matched} öğrencinin notu başarıyla işlendi.`;

      Alert.alert('İşlem Tamamlandı', msg, [
        {
          text: 'Excel\u2019i İndir',
          onPress: async () => {
            const available = await Sharing.isAvailableAsync();
            if (available) {
              await Sharing.shareAsync(outUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: `${exam.name} Notlar.xlsx`,
              });
            } else {
              Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor.');
            }
          },
        },
        { text: 'Kapat', style: 'cancel' },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.message || 'Excel işlenemedi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveExcel = () => {
    Alert.alert('Excel Kaldır', 'Yüklenen Excel dosyası silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: async () => {
          await deleteExcelForExam(id as string);
          setExcelMeta(null);
        },
      },
    ]);
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

  // Arama filtresi (must be before early return — Rules of Hooks)
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return results;
    return results.filter(r =>
      (r.studentName || '').toLowerCase().includes(q) ||
      (r.studentNo || '').toLowerCase().includes(q)
    );
  }, [results, searchQuery]);

  if (loading || !exam) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const dateStr = new Date(exam.createdAt).toLocaleDateString('tr-TR');
  const missingAnsCount = exam.answerKey.filter(a => !a).length;

  // ─── Sınav İstatistikleri ───
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : null;

  const wrongCounts: number[] = Array(exam.questionCount).fill(0);
  results.forEach(r => {
    r.answers.forEach((ans, i) => {
      if (exam.answerKey[i] && ans && ans !== exam.answerKey[i]) {
        wrongCounts[i]++;
      }
    });
  });
  const top3Wrong = wrongCounts
    .map((count, i) => ({ q: i + 1, count }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

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

        {/* Sınav İstatistikleri */}
        {results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sınav İstatistikleri</Text>
            <View style={styles.statsCard}>
              {/* Sınıf Ortalaması */}
              <View style={styles.avgRow}>
                <View style={styles.avgIconBox}>
                  <MaterialCommunityIcons name="chart-line" size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.avgLabel}>Sınıf Ortalaması</Text>
                  <Text style={styles.avgValue}>{avgScore} / 100</Text>
                </View>
                <View style={styles.avgBadge}>
                  <Text style={styles.avgBadgeText}>{results.length} Öğrenci</Text>
                </View>
              </View>

              {/* Divider */}
              {top3Wrong.length > 0 && (
                <View style={styles.divider} />
              )}

              {/* En çok yanlış yapılan sorular */}
              {top3Wrong.length > 0 && (
                <View>
                  <Text style={styles.top3Title}>En Çok Yanlış Yapılan Sorular</Text>
                  {top3Wrong.map((item, idx) => {
                    const barWidth = (item.count / results.length) * 100;
                    return (
                      <View key={idx} style={styles.top3Row}>
                        <View style={styles.top3Medal}>
                          <Text style={styles.top3MedalText}>{idx + 1}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                          <View style={styles.top3LabelRow}>
                            <Text style={styles.top3Q}>{item.q}. Soru</Text>
                            <Text style={styles.top3Count}>{item.count}/{results.length} yanlış</Text>
                          </View>
                          <View style={styles.barBg}>
                            <View style={[styles.barFill, { width: `${barWidth}%` as any }]} />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Excel Entegrasyonu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Excel Entegrasyonu</Text>
          <View style={styles.excelCard}>
            {excelMeta ? (
              // Dosya yüklü
              <View>
                <View style={styles.excelFileRow}>
                  <MaterialCommunityIcons name="microsoft-excel" size={28} color="#1D6F42" />
                  <View style={{ flex: 1, marginLeft: Spacing.md }}>
                    <Text style={styles.excelFileName} numberOfLines={1}>{excelMeta.fileName}</Text>
                    <Text style={styles.excelFileDate}>
                      {new Date(excelMeta.uploadedAt).toLocaleString('tr-TR')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveExcel} style={styles.excelRemoveBtn}>
                    <MaterialCommunityIcons name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.excelHint}>
                  "ÖĞRENCİ NO" sütunu eşleştirilerek "NOT" sütununa puan yazılır.
                </Text>
              </View>
            ) : (
              // Dosya yüklü değil
              <View>
                <Text style={styles.excelHint}>
                  Sınıf listesini içeren .xlsx dosyasını yükleyin. Taramalar bittikten sonra notlar otomatik eşleştirilir.
                </Text>
                <TouchableOpacity style={styles.excelUploadBtn} onPress={handlePickExcel}>
                  <MaterialCommunityIcons name="upload" size={20} color={Colors.primary} />
                  <Text style={styles.excelUploadText}>Excel Dosyası Seç (.xlsx)</Text>
                </TouchableOpacity>
              </View>
            )}

            {excelMeta && (
              <TouchableOpacity style={styles.excelChangeBtn} onPress={handlePickExcel}>
                <Text style={styles.excelChangeBtnText}>Farklı Dosya Seç</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Scans List */}
        <View style={styles.section}>
           <Text style={styles.sectionTitle}>Taramalar ({results.length})</Text>

           {/* Arama Kutusu */}
           {results.length > 0 && (
             <View style={styles.searchBar}>
               <MaterialCommunityIcons name="magnify" size={20} color={Colors.textSecondary} />
               <TextInput
                 style={styles.searchInput}
                 placeholder="İsim veya numara ile ara..."
                 placeholderTextColor={Colors.textSecondary}
                 value={searchQuery}
                 onChangeText={setSearchQuery}
                 clearButtonMode="while-editing"
               />
             </View>
           )}

           {filteredResults.length === 0 ? (
               <View style={styles.emptyCard}>
                   <Text style={{color: Colors.textSecondary}}>
                     {results.length === 0 ? 'Henüz tarama yapılmadı.' : 'Sonuç bulunamadı.'}
                   </Text>
               </View>
           ) : (
               filteredResults.map(r => (
                   <View key={r.id} style={styles.resultCard}>
                     <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => router.push(`/result/${r.id}`)}>
                         <View style={{ flex: 1 }}>
                             <Text style={styles.studentName}>{r.studentName || 'Bilinmiyor'} ({r.studentNo || 'No Yok'})</Text>
                             <Text style={styles.resultSub}>D: {r.correct} | Y: {r.incorrect} | B: {r.empty}</Text>
                         </View>
                         <View style={styles.scoreBox}>
                             <Text style={styles.scoreText}>{r.score}</Text>
                         </View>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.resultDeleteBtn} onPress={() => handleDeleteResult(r.id)}>
                         <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
                     </TouchableOpacity>
                   </View>
               ))
           )}
        </View>
      </ScrollView>

      {/* Excel İşle FAB */}
      {excelMeta && (
        <TouchableOpacity
          style={[styles.excelFab, isProcessing && { opacity: 0.6 }]}
          onPress={handleProcessExcel}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialCommunityIcons name="microsoft-excel" size={24} color="#fff" />
          )}
          <Text style={styles.excelFabText}>{isProcessing ? 'İşleniyor...' : "Excel'e İşle & İndir"}</Text>
        </TouchableOpacity>
      )}

      {/* FAB - Camera Button */}
      <TouchableOpacity
        style={[styles.fab, excelMeta && { bottom: 110 }]}
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
      gap: Spacing.sm,
  },
  resultDeleteBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
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
  },
  // İstatistik Kartı
  statsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  avgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avgLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  avgValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  avgBadge: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avgBadgeText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  top3Title: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  top3Row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  top3Medal: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  top3MedalText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  top3LabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  top3Q: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  top3Count: {
    color: Colors.error,
    fontSize: 12,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    backgroundColor: Colors.error,
    borderRadius: 3,
  },
  // ─── Excel Stilleri ───
  excelCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  excelFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  excelFileName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  excelFileDate: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  excelRemoveBtn: {
    padding: 6,
  },
  excelHint: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  excelUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  excelUploadText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  excelChangeBtn: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  excelChangeBtnText: {
    color: Colors.primary,
    fontSize: 13,
  },
  excelFab: {
    position: 'absolute',
    bottom: 30,
    left: Spacing.lg,
    right: 80,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1D6F42',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: '#1D6F42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  excelFabText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
});
