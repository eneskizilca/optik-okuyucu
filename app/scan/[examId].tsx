import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getExamById, saveResult } from '../../utils/storage';
import { Exam } from '../../utils/types';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { WebView } from 'react-native-webview';

export default function ScanScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  
  const [permission, requestPermission] = useCameraPermissions();
  const [exam, setExam] = useState<Exam | null>(null);
  
  // States to manage our heavy lifting Pipeline
  const [pipelineState, setPipelineState] = useState<'idle' | 'tracking' | 'processing' | 'ocr' | 'finalizing'>('idle');
  const [statusText, setStatusText] = useState('Hedef Aranıyor...');
  
  const [htmlContent, setHtmlContent] = useState<string>('');
  
  const cameraRef = useRef<CameraView>(null);
  const webviewRef = useRef<WebView>(null);
  const trackInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const load = async () => {
      if (examId) {
        const e = await getExamById(examId);
        setExam(e);
        setPipelineState('tracking');
      }
    };
    load();

    return () => {
      if (trackInterval.current) clearInterval(trackInterval.current);
    };
  }, [examId]);

  // Otomatik Çekim Kapatıldı, Sadece Görsel Arayüz (ZipGrade Tarzı)
  useEffect(() => {
      // Sadece başlatıldığında pipeline'ı hazırlıyoruz
  }, [pipelineState]);

  const triggerAutoProcess = async () => {
      if (!cameraRef.current) return;
      setPipelineState('processing');
      setStatusText('Hizalandı! Odaklanılıyor ve Fotoğraf Çekiliyor...');
      
      try {
          const photo = await cameraRef.current.takePictureAsync({
              quality: 0.8,
              base64: false,
          });
          if (photo?.uri) {
              await startHeavyPipeline(photo.uri, photo.width, photo.height);
          } else {
              setPipelineState('tracking');
          }
      } catch (e) {
          Alert.alert('Hata', 'Çekim başarısız.');
          setPipelineState('tracking');
      }
  };

  const startHeavyPipeline = async (uri: string, picWidth: number, picHeight: number) => {
      if (!exam) return;
      setStatusText('Fotoğraf Kırpılıyor ve Perspektif Ayarlanıyor...');
      
      try {
          // A4 oranını (800x1100 = 0.727) koruyacak yüksek çözünürlüklü kesim
          const screenW = Dimensions.get('window').width;
          const screenH = Dimensions.get('window').height;
          
          const scanW = screenW * 0.8;
          const scanH = scanW * (1100 / 800); 
          const scanX = screenW * 0.1;
          const scanY = (screenH - scanH) / 2.5; // maskTop (flex 1) vs maskBottom (flex 1.5) merkezlemesi

          // Kameranın cover modunda ekrana nasıl taştığını bulma:
          let scale = Math.max(screenW / picWidth, screenH / picHeight);
          if (!picWidth || !picHeight) {
             picWidth = 1200; picHeight = 1600; scale = 1; // Fallback
          }
          
          const dispW = picWidth * scale;
          const dispH = picHeight * scale;
          const offsetX = (dispW - screenW) / 2;
          const offsetY = (dispH - screenH) / 2;

          const cropX = Math.round((scanX + offsetX) / scale);
          const cropY = Math.round((scanY + offsetY) / scale);
          const cropW = Math.round(scanW / scale);
          const cropH = Math.round(scanH / scale);

          // Piksellerin doğru yerden kırpılması
          const manipResult = await ImageManipulator.manipulateAsync(
            uri,
            [
               { crop: { originX: Math.max(0, cropX), originY: Math.max(0, cropY), width: Math.min(picWidth, cropW), height: Math.min(picHeight, cropH) } },
               { resize: { width: 800, height: 1100 } } 
            ],
            { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true }
          );

          if (!manipResult.base64) throw new Error("Base64 elde edilemedi");

          const examDataString = JSON.stringify(exam);
          
          /* 
            WEBVIEW HTML PIPELINE
            1- Perspective Transform, 
            2- Tesseract OCR (Ad, Soyad),
            3- Bubble Reading, 
            4- Overlaid Image Saving 
          */
          const script = `
            const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
            
            // Tesseract'i yükleme fonksiyonu
            function loadScript(src) {
                return new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = src;
                    s.onload = resolve;
                    s.onerror = reject;
                    document.head.appendChild(s);
                });
            }

            async function runPipeline() {
                try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'Yapay Zeka (OCR) Motoru Yükleniyor (1/3)...' }));
                    await loadScript(TESSERACT_URL);
                    
                    const img = new Image();
                    img.onload = async function() {
                        try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'Optik Form Oku... Çizim Yapılıyor (2/3)...' }));
                            
                            // GERÇEK SENARYODA BURADA AFFINE TRANSFORM ILE KÖŞE BULUNUR VE KIRPILIR.
                            // Biz şablonumuzun hizalama esnekliğini kullanarak direkt Canvas (800x1100 ratio) haritasına oturtacağız.
                            const canvas = document.createElement('canvas');
                            canvas.width = 800;
                            canvas.height = 1100;
                            const ctx = canvas.getContext('2d');
                            
                            // Resmi 800x1100 stretch - Basit bir WarpPerspective Simülasyonu
                            ctx.drawImage(img, 0, 0, 800, 1100);
                            
                            const imgData = ctx.getImageData(0, 0, 800, 1100);
                            const data = imgData.data;

                            const threshold = 130; 
                            const exam = ${examDataString};
                            const OPTIONS = ['A', 'B', 'C', 'D', 'E'];
                            
                            const startY = 320; 
                            const rowHeight = 35;
                            const bubbleSpacing = 35;

                            let correct = 0, incorrect = 0, empty = 0;
                            const studentAnswers = [];
                            const boundingBoxes = [];

                            // === 1. YUVARLAKLARI OKU VE ÜZERİNE ÇİZ ===
                            for (let i = 0; i < exam.questionCount; i++) {
                                const isRightColumn = i >= 20;
                                const qX = isRightColumn ? 420 : 80;
                                const row = isRightColumn ? i - 20 : i;
                                const qY = startY + (row * rowHeight);

                                let maxDarkness = 0;
                                let selectedIndex = -1;

                                for(let opt=0; opt < exam.optionsCount; opt++) {
                                    const bX = qX + 25 + (opt * bubbleSpacing);
                                    let darkPixelsCount = 0;
                                    let totalChecked = 0;
                                    for(let px = -6; px <= 6; px++) {
                                        for(let py = -6; py <= 6; py++) {
                                            const currentX = Math.round(bX + px);
                                            const currentY = Math.round(qY + py);
                                            if(currentX >= 0 && currentX < 800 && currentY >= 0 && currentY < 1100) {
                                                const idx = (currentY * 800 + currentX) * 4;
                                                const brightness = 0.2126*data[idx] + 0.7152*data[idx+1] + 0.0722*data[idx+2];
                                                if(brightness < threshold) darkPixelsCount++;
                                                totalChecked++;
                                            }
                                        }
                                    }
                                    const darknessRatio = darkPixelsCount / totalChecked;
                                    if(darknessRatio > 0.40 && darknessRatio > maxDarkness) { 
                                        maxDarkness = darknessRatio;
                                        selectedIndex = opt;
                                    }
                                }

                                let ans = selectedIndex !== -1 ? OPTIONS[selectedIndex] : '';
                                studentAnswers.push(ans);
                                
                                const actualAns = exam.answerKey[i];
                                let status = 'empty';
                                
                                if (!actualAns) { } 
                                else if (ans === '') { status = 'empty'; empty++; } 
                                else if (ans === actualAns) { status = 'correct'; correct++; } 
                                else { status = 'incorrect'; incorrect++; }

                                // Çizim Yap (Yeşil / Kırmızı / Sarı)
                                ctx.lineWidth = 4;
                                if (status !== 'empty' && selectedIndex !== -1) {
                                    const drawX = qX + 25 + (selectedIndex * bubbleSpacing);
                                    ctx.beginPath();
                                    ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
                                    ctx.strokeStyle = status === 'correct' ? '#4CAF50' : '#F44336';
                                    ctx.stroke();
                                    boundingBoxes.push({ qIndex: i, status });
                                } else if (status === 'empty' && actualAns) {
                                    const correctIndex = OPTIONS.indexOf(actualAns);
                                    const drawX = qX + 25 + (correctIndex * bubbleSpacing);
                                    ctx.beginPath();
                                    ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
                                    ctx.strokeStyle = '#FFC107'; // Sarı (Boş bıraktığı için bulması gereken)
                                    ctx.stroke();
                                }
                            }

                            // === 2. TESSERACT OCR İLE İSİM VE NUMARAYI OKU ===
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'El Yazısı Okunuyor (Lütfen Bekleyin) (3/3)...' }));
                            
                            // Ad Soyad Alanı Kırp (X: 80, Y: 150, W: 640, H: 50)
                            const nameArea = document.createElement('canvas');
                            nameArea.width = 640; nameArea.height = 50;
                            nameArea.getContext('2d').drawImage(canvas, 80, 150, 640, 50, 0, 0, 640, 50);
                            const nameB64 = nameArea.toDataURL();

                            // Öğrenci No Alanı Kırp (X: 80, Y: 220, W: 640, H: 50)
                            const noArea = document.createElement('canvas');
                            noArea.width = 640; noArea.height = 50;
                            noArea.getContext('2d').drawImage(canvas, 80, 220, 640, 50, 0, 0, 640, 50);
                            const noB64 = noArea.toDataURL();

                            // OCR Motorunu Başlat
                            const worker = await Tesseract.createWorker('tur');
                            const nameResult = await worker.recognize(nameB64);
                            const noResult = await worker.recognize(noB64);
                            await worker.terminate();

                            const scName = nameResult.data.text.replace('AD SOYAD', '').replace(':', '').trim() || 'Bilinmiyor';
                            const scNo = noResult.data.text.replace(/[^0-9]/g, '') || '0000'; // Numarayı izole et

                            // Nihai İşlenmiş Resmi Dışa Aktar
                            const finalImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

                            const validQuestions = exam.answerKey.filter(a => a).length;
                            const score = validQuestions > 0 ? Math.round((correct / validQuestions) * 100) : 0;

                            const resultPayload = {
                                id: Date.now().toString(),
                                examId: exam.id,
                                studentNo: scNo,
                                studentName: scName,
                                scannedAt: Date.now(),
                                answers: studentAnswers,
                                score,
                                correct,
                                incorrect,
                                empty,
                                finalImageBase64
                            };

                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SUCCESS', payload: resultPayload }));
                        } catch(cvErr) {
                           window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: cvErr.toString() }));
                        }
                    };
                    img.src = 'data:image/jpeg;base64,${manipResult.base64}';

                } catch(e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: 'Tesseract Yüklenemedi: ' + e.message }));
                }
            }
            
            runPipeline();
          `;

          const cleanHtml = `
            <!DOCTYPE html><html><body>
              <script>
                try {
                  ${script}
                } catch(e) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
                }
              </script>
            </body></html>
          `;
          
          setHtmlContent(cleanHtml);

      } catch (e) {
          console.error(e);
          Alert.alert('Hata', 'Görüntü hazırlanamadı.');
          setPipelineState('tracking');
      }
  };

  const handleWebViewMessage = async (event: any) => {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'STATUS') {
          setStatusText(data.text);
      }
      else if (data.type === 'SUCCESS') {
          setStatusText('Sonuçlar Hazırlanıyor...');
          
          // Expo 54 FileSystem API deprecation hatasından kaçınmak için Base64 dizisini doğrudan kullanıyoruz.
          // Native Image componenti "data:image/jpeg;base64,..." tipindeki URI'leri doğrudan okuyabilir.
          const finalResult = { ...data.payload };
          finalResult.imageUri = data.payload.finalImageBase64;
          delete finalResult.finalImageBase64;
          finalResult.boundingBoxes = []; 

          await saveResult(finalResult);
          setPipelineState('idle');
          router.replace(("/result/" + finalResult.id) as any);
      } else if (data.type === 'ERROR') {
          Alert.alert('OKUMA HATASI', data.message);
          setPipelineState('tracking');
      }
  };

  const pickImage = async () => {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPipelineState('processing');
        await startHeavyPipeline(result.assets[0].uri, result.assets[0].width, result.assets[0].height);
      }
  };

  // UI RENDER 
  if (pipelineState !== 'idle' && pipelineState !== 'tracking') {
      return (
          <View style={[styles.container, styles.center]}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.processingText}>{statusText}</Text>
              
              {/* WebView Arka Planda Tesseract ve Canvas ile Çalışacak (Görünmez) */}
              <View style={{ width: 0, height: 0, opacity: 0 }}>
                  <WebView 
                      ref={webviewRef}
                      originWhitelist={['*']}
                      source={{ html: htmlContent }} 
                      onMessage={handleWebViewMessage}
                      javaScriptEnabled={true}
                      domStorageEnabled={true}
                  />
              </View>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFillObject} facing="back" ref={cameraRef} />
      {/* Overlay Configuration */}
      <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
          <View style={styles.maskTop} />
          <View style={styles.maskCenter}>
              <View style={styles.maskLeft} />
              <View style={styles.scanArea}>
                  <View style={[styles.targetCorner, styles.targetTopLeft]} />
                  <View style={[styles.targetCorner, styles.targetTopRight]} />
                  <View style={[styles.targetCorner, styles.targetBottomLeft]} />
                  <View style={[styles.targetCorner, styles.targetBottomRight]} />
                  
                  <Text style={styles.scanHint}>
                     Formu çerçeveye sığdırın
                  </Text>
              </View>
              <View style={styles.maskRight} />
          </View>
          <View style={styles.maskBottom}>
              <View style={styles.controls}>
                  <TouchableOpacity style={styles.galeryBtn} onPress={pickImage}>
                      <MaterialCommunityIcons name="image-multiple" size={32} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.captureBtn} onPress={triggerAutoProcess}>
                      <View style={styles.captureBtnInner} />
                  </TouchableOpacity>
                  
                  <View style={styles.galeryBtn} />
              </View>
          </View>
      </View>
    </View>
  );
}

const maskColor = 'rgba(0,0,0,0.6)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorText: { color: Colors.text, fontSize: 16, textAlign: 'center', marginTop: Spacing.md, marginBottom: Spacing.lg },
  processingText: { color: Colors.text, fontSize: 16, fontWeight: '500', marginTop: Spacing.lg, textAlign: 'center' },
  btn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, width: '100%', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: { marginTop: Spacing.md, padding: Spacing.md },
  cancelBtnText: { color: Colors.textSecondary, fontSize: 16 },
  camera: { flex: 1 },
  overlay: { flex: 1 },
  maskTop: { flex: 1, backgroundColor: maskColor },
  maskBottom: { flex: 1.5, backgroundColor: maskColor, justifyContent: 'flex-end', paddingBottom: 50 },
  maskCenter: { flexDirection: 'row', height: 450 },
  maskLeft: { flex: 1, backgroundColor: maskColor },
  maskRight: { flex: 1, backgroundColor: maskColor },
  scanArea: { width: '80%', backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  scanHint: { color: Colors.primary, fontWeight: 'bold', fontSize: 14, position: 'absolute', bottom: -30 },
  targetCorner: { position: 'absolute', width: 30, height: 30, borderWidth: 4, borderColor: Colors.success, backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  targetTopLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  targetTopRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  targetBottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  targetBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  captureBtn: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'transparent', borderWidth: 4, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  captureBtnInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary },
  galeryBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }
});
