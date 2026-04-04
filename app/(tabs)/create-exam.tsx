import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText } from 'react-native-svg';
import ViewShot from 'react-native-view-shot';
import { useAlert } from '../../components/AlertProvider';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { saveExam } from '../../utils/storage';
import { Exam } from '../../utils/types';

export default function CreateExamScreen() {
  const [name, setName] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [optionsCount, setOptionsCount] = useState<number>(5); // 4 or 5
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const viewShotRef = useRef<ViewShot>(null);
  const { showAlert } = useAlert();

  const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

  const handleCreate = async () => {
    if (!name.trim()) {
      showAlert({
        title: 'Hata',
        message: 'Lütfen sınav adını giriniz.',
        type: 'error',
      });
      return;
    }

    if (questionCount < 1 || questionCount > 40) {
      showAlert({
        title: 'Hata',
        message: 'Soru sayısı 1 ile 40 arasında olmalıdır.',
        type: 'error',
      });
      return;
    }

    const newExam: Exam = {
      id: Date.now().toString(),
      name: name.trim(),
      questionCount,
      optionsCount,
      createdAt: Date.now(),
      answerKey: Array(questionCount).fill(''), // Empty answer key initially
    };

    try {
      await saveExam(newExam);
      showAlert({
        title: 'Başarılı',
        message: 'Sınav oluşturuldu!',
        type: 'success',
        buttons: [
          { text: 'Tamam', onPress: () => router.push('/exams') }
        ],
      });
      setName('');
    } catch (e) {
      showAlert({
        title: 'Hata',
        message: 'Sınav kaydedilemedi.',
        type: 'error',
      });
    }
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
            dialogTitle: `${name || 'Sinav'}_optik_sablon.jpg`,
          });
        } else {
          showAlert({
            title: 'Hata',
            message: 'Paylaşım bu cihazda desteklenmiyor.',
            type: 'error',
          });
        }
      } catch (e) {
        console.error(e);
        showAlert({
          title: 'Hata',
          message: 'Şablon oluşturulamadı.',
          type: 'error',
        });
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // Generate SVG Bubble Sheet Template based on config
  const renderSvgTemplate = () => {
    const sheetWidth = 800;
    const sheetHeight = 1100;
    
    // Markers for alignment (top-left, top-right, bottom-left, bottom-right)
    const renderAlignMarker = (x: number, y: number) => (
      <Rect x={x} y={y} width={40} height={40} fill="black" />
    );

    const startY = 320; 
    const rowHeight = 35;
    const bubbleSpacing = 35;
    const bubbleRadius = 12;

    const halfCount = Math.ceil(questionCount / 2);

    const circles = [];
    for (let i = 0; i < questionCount; i++) {
        const isRightColumn = i >= halfCount;
        const qX = isRightColumn ? 420 : 80;
        const row = isRightColumn ? i - halfCount : i;
        
        const qY = startY + (row * rowHeight);

        // Question Number
        circles.push(
            <SvgText key={`qNum_${i}`} x={qX} y={qY + 5} fontSize="16" fill="black" textAnchor="end">
                {i + 1}.
            </SvgText>
        );

        // Bubbles
        for(let opt=0; opt<optionsCount; opt++) {
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
      <Svg width="100%" viewBox={`0 0 ${sheetWidth} ${sheetHeight}`} style={[{ aspectRatio: sheetWidth / sheetHeight }, styles.svgPreview]}>
        <Rect width="100%" height="100%" fill="white" />
        
        {/* Title */}
        <SvgText x={sheetWidth/2} y={60} fontSize="32" fontWeight="bold" fill="black" textAnchor="middle">
          {name || 'SINAV OPTİK FORMU'}
        </SvgText>

        <SvgText x={sheetWidth/2} y={100} fontSize="18" fill="gray" textAnchor="middle">
          Lütfen yuvarlakların içini tamamen karalayınız.
        </SvgText>

        {/* Alignment Markers */}
        {renderAlignMarker(20, 20)}
        {renderAlignMarker(sheetWidth - 60, 20)}
        {renderAlignMarker(20, sheetHeight - 60)}
        {renderAlignMarker(sheetWidth - 60, sheetHeight - 60)}

        {/* Student Info Area */}
        <Rect x={80} y={150} width={640} height={50} stroke="black" strokeWidth="2" fill="none" />
        <SvgText x={95} y={180} fontSize="20" fontWeight="bold" fill="black">AD SOYAD :</SvgText>

        <Rect x={80} y={220} width={640} height={50} stroke="black" strokeWidth="2" fill="none" />
        <SvgText x={95} y={250} fontSize="20" fontWeight="bold" fill="black">ÖĞRENCİ NO :</SvgText>

        {circles}
      </Svg>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formBox}>
        <Text style={styles.label}>Sınav Adı</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Web - A406"
          placeholderTextColor={Colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <View style={styles.row}>
          <View style={{flex: 1, marginRight: Spacing.sm}}>
            <Text style={styles.label}>Soru Sayısı (1-40)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={questionCount.toString()}
              onChangeText={(t) => setQuestionCount(parseInt(t) || 0)}
              maxLength={2}
            />
          </View>
          <View style={{flex: 1, marginLeft: Spacing.sm}}>
            <Text style={styles.label}>Şık Sayısı</Text>
            <View style={styles.optionSelector}>
              <TouchableOpacity
                style={[styles.optionBtn, optionsCount === 4 && styles.optionBtnActive]}
                onPress={() => setOptionsCount(4)}
              >
                <Text style={styles.optionBtnText}>4 (A-D)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionBtn, optionsCount === 5 && styles.optionBtnActive]}
                onPress={() => setOptionsCount(5)}
              >
                <Text style={styles.optionBtnText}>5 (A-E)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Sınavı Kaydet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.templateSection}>
        <Text style={styles.sectionTitle}>Optik Şablon Önizleme</Text>
        <Text style={styles.sectionSubtitle}>
          Sınavı oluşturduktan sonra veya buradan şablonu indirebilir / yazdırabilirsiniz.
        </Text>
        
        <ViewShot 
          ref={viewShotRef} 
          options={{ format: "jpg", quality: 0.9, width: 800, height: 1100 }} 
          style={styles.viewShotContainer}
        >
          {renderSvgTemplate()}
        </ViewShot>

        <TouchableOpacity 
          style={styles.shareButton} 
          onPress={handleShareTemplate}
          disabled={isGenerating}
        >
          <MaterialCommunityIcons name="export-variant" size={20} color="white" />
          <Text style={styles.shareButtonText}>Şablonu İndir / Paylaş</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  formBox: {
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
  },
  optionSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm + 4,
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: Colors.primary,
  },
  optionBtnText: {
    color: Colors.text,
    fontWeight: '500',
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  templateSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  viewShotContainer: {
    backgroundColor: 'white', // Must be white for scanner 
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    // Add simple shadow for visual depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  svgPreview: {
    backgroundColor: 'white',
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  shareButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});
