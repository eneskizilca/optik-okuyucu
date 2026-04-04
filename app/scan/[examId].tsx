import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { WebView } from 'react-native-webview';
import { useAlert } from '../../components/AlertProvider';
import { BorderRadius, Colors, Spacing } from '../../constants/theme';
import { getExamById, saveResult } from '../../utils/storage';
import { Exam } from '../../utils/types';

export default function ScanScreen() {
    const { examId } = useLocalSearchParams<{ examId: string }>();
    const router = useRouter();
    const { showAlert } = useAlert();

    console.log('🚀 ScanScreen render - examId:', examId);

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const [exam, setExam] = useState<Exam | null>(null);

    // States to manage our heavy lifting Pipeline
    const [pipelineState, setPipelineState] = useState<'idle' | 'tracking' | 'processing' | 'ocr' | 'finalizing'>('idle');
    const [statusText, setStatusText] = useState('Hedef Aranıyor...');
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [isCameraReady, setIsCameraReady] = useState(false);

    console.log('📊 Pipeline state:', pipelineState);

    const cameraRef = useRef<Camera>(null);
    const webviewRef = useRef<WebView>(null);

    useEffect(() => {
        const load = async () => {
            if (examId) {
                console.log('🔵 Exam yükleniyor:', examId);
                const e = await getExamById(examId);
                setExam(e);
                console.log('📋 Exam yüklendi:', e?.name);
            }
        };
        load();
    }, [examId]);

    useEffect(() => {
        // Kamera izni alındıktan sonra tracking moduna geç
        if (exam && hasPermission) {
            console.log('✅ Pipeline tracking moduna geçiyor');
            setPipelineState('tracking');
        }
    }, [exam, hasPermission]);

    const triggerAutoProcess = async () => {
        console.log('📸 Çekim başlatılıyor...');
        console.log('📸 Camera ref:', cameraRef.current ? 'VAR' : 'YOK');
        console.log('📸 Device:', device ? 'VAR' : 'YOK');
        console.log('📸 Permission:', hasPermission);
        console.log('📸 Camera ready:', isCameraReady);
        
        if (!cameraRef.current || !device) {
            console.log('⚠️ Camera hazır değil');
            showAlert({
                title: 'Hata',
                message: 'Kamera hazır değil',
                type: 'error'
            });
            return;
        }

        if (!isCameraReady) {
            console.log('⚠️ Kamera henüz başlatılıyor');
            showAlert({
                title: 'Bekleyin',
                message: 'Kamera hazırlanıyor...',
                type: 'warning'
            });
            return;
        }

        try {
            console.log('📸 takePhoto çağrılıyor...');
            // ÖNEMLİ: State değiştirmeden ÖNCE fotoğrafı çek
            const photo = await cameraRef.current.takePhoto({
                flash: 'off',
            });
            
            console.log('📸 Fotoğraf çekildi:', photo);

            // Fotoğraf çekildikten SONRA state değiştir
            setPipelineState('processing');
            setStatusText('Fotoğraf işleniyor...');

            if (photo?.path) {
                const uri = `file://${photo.path}`;
                
                // Fotoğrafın gerçek boyutlarını al
                const imageInfo = await ImageManipulator.manipulateAsync(
                    uri,
                    [],
                    { format: ImageManipulator.SaveFormat.JPEG }
                );
                
                console.log('📐 Fotoğraf boyutları:', imageInfo.width, 'x', imageInfo.height);
                
                await startHeavyPipeline(uri, imageInfo.width, imageInfo.height);
            } else {
                console.log('⚠️ Photo path yok');
                showAlert({
                    title: 'Hata',
                    message: 'Fotoğraf alınamadı',
                    type: 'error'
                });
                setPipelineState('tracking');
            }
        } catch (e: any) {
            console.error('📸 Çekim hatası:', e);
            showAlert({
                title: 'Hata',
                message: `Çekim başarısız: ${e.message || 'Bilinmeyen hata'}`,
                type: 'error'
            });
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

            const scanW = screenW * 0.85; // UI ile birebir senkronize
            const scanH = scanW * (1100 / 800);
            const scanX = (screenW - scanW) / 2;
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

            // Piksellerin tam olarak çerçevenin içinden kırpılması (Kullanıcı Çerçevesi = Kağıt)
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

            const scriptContent = `
            const TESSERACT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
            const OPENCV_URL = "https://docs.opencv.org/4.8.0/opencv.js";
            
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
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'Yapay Zeka (Görüntü İşleme) Yükleniyor (1/4)...' }));
                    
                    await loadScript(OPENCV_URL);
                    await new Promise((resolve) => {
                       let check = setInterval(() => { if (window.cv && window.cv.Mat) { clearInterval(check); resolve(); } }, 200);
                    });

                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'El Yazısı Motoru Yükleniyor (2/4)...' }));
                    await loadScript(TESSERACT_URL);
                    
                    const img = new Image();
                    img.onload = async function() {
                        try {
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'Optik Sınırlar Bulunuyor (3/4)...' }));
                            
                            const origCanvas = document.createElement('canvas');
                            origCanvas.width = img.width;
                            origCanvas.height = img.height;
                            const ctxOrig = origCanvas.getContext('2d');
                            ctxOrig.drawImage(img, 0, 0, img.width, img.height);
                            
                            let src = cv.imread(origCanvas);
                            let warped = new cv.Mat();
                            cv.resize(src, warped, new cv.Size(800, 1100), 0, 0, cv.INTER_LINEAR);
                            
                            const canvas = document.createElement('canvas');
                            canvas.width = 800;
                            canvas.height = 1100;
                            cv.imshow(canvas, warped);

                            src.delete();

                            let ctx = canvas.getContext('2d');
                            let data = ctx.getImageData(0, 0, 800, 1100).data;
                            
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'Yazıcı Payı (Margin) Düzeltiliyor (4/5)...' }));
                            
                            let gray = new cv.Mat();
                            cv.cvtColor(warped, gray, cv.COLOR_RGBA2GRAY, 0);
                            
                            let thresh = new cv.Mat();
                            cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 51, 10);
                            
                            let ctrs = new cv.MatVector();
                            let hrchy = new cv.Mat();
                            cv.findContours(thresh, ctrs, hrchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

                            let markers = [];
                            for (let i = 0; i < ctrs.size(); ++i) {
                                let cnt = ctrs.get(i);
                                let area = cv.contourArea(cnt);
                                if (area > 100 && area < 8000) {
                                    let rect = cv.boundingRect(cnt);
                                    let ratio = rect.width / rect.height;
                                    if (ratio > 0.6 && ratio < 1.6) {
                                        let extent = area / (rect.width * rect.height);
                                        if (extent > 0.80) { 
                                            markers.push({
                                                x: rect.x + rect.width / 2,
                                                y: rect.y + rect.height / 2
                                            });
                                        }
                                    }
                                }
                            }
                            
                            gray.delete(); thresh.delete(); ctrs.delete(); hrchy.delete();

                            let tl = null, tr = null, br = null, bl = null;
                            if (markers.length >= 4) {
                                markers.sort((a, b) => (a.x + a.y) - (b.x + b.y));
                                tl = markers[0];
                                br = markers[markers.length - 1];

                                markers.sort((a, b) => (a.x - a.y) - (b.x - b.y));
                                bl = markers[0];
                                tr = markers[markers.length - 1];
                            }

                            if (tl && tr && br && bl) {
                                let srcCoords2 = cv.matFromArray(4, 1, cv.CV_32FC2, [ tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y ]);
                                let dstCoords2 = cv.matFromArray(4, 1, cv.CV_32FC2, [ 40, 40, 760, 40, 760, 1060, 40, 1060 ]);
                                
                                let M2 = cv.getPerspectiveTransform(srcCoords2, dstCoords2);
                                let finalWarped = new cv.Mat();
                                cv.warpPerspective(warped, finalWarped, M2, new cv.Size(800, 1100), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(255,255,255,255));
                                
                                cv.circle(finalWarped, new cv.Point(40, 40), 10, new cv.Scalar(255, 0, 255, 255), -1);
                                cv.circle(finalWarped, new cv.Point(760, 40), 10, new cv.Scalar(255, 0, 255, 255), -1);
                                cv.circle(finalWarped, new cv.Point(760, 1060), 10, new cv.Scalar(255, 0, 255, 255), -1);
                                cv.circle(finalWarped, new cv.Point(40, 1060), 10, new cv.Scalar(255, 0, 255, 255), -1);
                                
                                cv.imshow(canvas, finalWarped);
                                
                                srcCoords2.delete(); dstCoords2.delete(); M2.delete(); finalWarped.delete();
                                
                                data = ctx.getImageData(0,0,800,1100).data;
                            }
                            
                            warped.delete();
                            
                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'Cevaplar Hesaplanıyor (5/5)...' }));

                            const threshold = 130; 
                            const exam = ${examDataString};
                            const OPTIONS = ['A', 'B', 'C', 'D', 'E'];
                            
                            const startY = 320; 
                            const rowHeight = 35;
                            const bubbleSpacing = 35;

                            let correct = 0, incorrect = 0, empty = 0;
                            const studentAnswers = [];
                            const boundingBoxes = [];

                            for (let i = 0; i < exam.questionCount; i++) {
                                const halfCount = Math.ceil(exam.questionCount / 2);
                                const isRightColumn = i >= halfCount;
                                const qX = isRightColumn ? 420 : 80;
                                const row = isRightColumn ? i - halfCount : i;
                                const qY = startY + (row * rowHeight);

                                // TÜM seçeneklerin karanlık oranlarını topla
                                let darknessRatios = [];
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
                                    darknessRatios.push({ index: opt, ratio: darknessRatio });
                                }

                                // 0.40'ın üzerinde olan tüm işaretli seçenekleri bul
                                let markedOptions = darknessRatios.filter(d => d.ratio > 0.40);
                                
                                let ans = '';
                                let isMultipleMarked = markedOptions.length > 1;
                                
                                if (markedOptions.length === 1) {
                                    // Tek işaretli - normal
                                    ans = OPTIONS[markedOptions[0].index];
                                } else if (markedOptions.length > 1) {
                                    // Birden fazla işaretli - yanlış say ama cevabı en koyu olan olsun
                                    markedOptions.sort((a, b) => b.ratio - a.ratio);
                                    ans = OPTIONS[markedOptions[0].index];
                                }

                                studentAnswers.push(ans);
                                
                                const actualAns = exam.answerKey[i];
                                let status = 'empty';
                                
                                if (!actualAns) { } 
                                else if (ans === '') { status = 'empty'; empty++; } 
                                else if (isMultipleMarked) { 
                                    // Birden fazla işaretli - yanlış say
                                    status = 'incorrect'; 
                                    incorrect++; 
                                } 
                                else if (ans === actualAns) { status = 'correct'; correct++; } 
                                else { status = 'incorrect'; incorrect++; }

                                ctx.lineWidth = 4;
                                
                                if (isMultipleMarked && actualAns) {
                                    // Birden fazla işaretli - hepsini göster
                                    for (let marked of markedOptions) {
                                        const drawX = qX + 25 + (marked.index * bubbleSpacing);
                                        ctx.beginPath();
                                        ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
                                        // Doğru cevap yeşil, diğerleri kırmızı
                                        ctx.strokeStyle = OPTIONS[marked.index] === actualAns ? '#4CAF50' : '#F44336';
                                        ctx.stroke();
                                    }
                                    boundingBoxes.push({ qIndex: i, status: 'incorrect' });
                                } else if (status !== 'empty' && markedOptions.length === 1) {
                                    // Tek işaretli - normal çizim
                                    const drawX = qX + 25 + (markedOptions[0].index * bubbleSpacing);
                                    ctx.beginPath();
                                    ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
                                    ctx.strokeStyle = status === 'correct' ? '#4CAF50' : '#F44336';
                                    ctx.stroke();
                                    boundingBoxes.push({ qIndex: i, status });

                                    if (status === 'incorrect' && actualAns) {
                                        const correctIndex = OPTIONS.indexOf(actualAns);
                                        if (correctIndex !== -1) {
                                            const correctDrawX = qX + 25 + (correctIndex * bubbleSpacing);
                                            ctx.beginPath();
                                            ctx.arc(correctDrawX, qY, 14, 0, 2 * Math.PI);
                                            ctx.strokeStyle = '#4CAF50';
                                            ctx.stroke();
                                        }
                                    }
                                } else if (status === 'empty' && actualAns) {
                                    const correctIndex = OPTIONS.indexOf(actualAns);
                                    if (correctIndex !== -1) {
                                        const drawX = qX + 25 + (correctIndex * bubbleSpacing);
                                        ctx.beginPath();
                                        ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
                                        ctx.strokeStyle = '#FFC107';
                                        ctx.stroke();
                                    }
                                }
                            }

                            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', text: 'El Yazısı Okunuyor (Lütfen Bekleyin) (3/3)...' }));
                            
                            const nameArea = document.createElement('canvas');
                            nameArea.width = 640; nameArea.height = 50;
                            nameArea.getContext('2d').drawImage(canvas, 80, 150, 640, 50, 0, 0, 640, 50);
                            const nameB64 = nameArea.toDataURL();

                            const noArea = document.createElement('canvas');
                            noArea.width = 640; noArea.height = 50;
                            noArea.getContext('2d').drawImage(canvas, 80, 220, 640, 50, 0, 0, 640, 50);
                            const noB64 = noArea.toDataURL();

                            const worker = await Tesseract.createWorker('tur');
                            const nameResult = await worker.recognize(nameB64);
                            const noResult = await worker.recognize(noB64);
                            await worker.terminate();

                            const scName = nameResult.data.text
                                .replace('AD SOYAD', '')
                                .replace('AD SOYAD:', '')
                                .replace('ADSOYAD', '')
                                .replace(':', '')
                                .replace('-', '')
                                .trim() || 'Bilinmiyor';
                            const scNo = noResult.data.text.replace(/[^0-9]/g, '') || '0000';

                            const finalImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

                            const validQuestions = exam.answerKey.filter(a => a).length;
                            let score = validQuestions > 0 ? (correct / validQuestions) * 100 : 0;
                            // Tam sayıysa tam, değilse 2 ondalık
                            score = Number.isInteger(score) ? score : parseFloat(score.toFixed(2));

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
                  ${scriptContent}
                } catch(e) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', message: e.message }));
                }
              </script>
            </body></html>
          `;

            setHtmlContent(cleanHtml);

        } catch (e) {
            console.error(e);
            showAlert({
                title: 'Hata',
                message: 'Görüntü hazırlanamadı.',
                type: 'error'
            });
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

            const finalResult = { ...data.payload };
            finalResult.imageUri = data.payload.finalImageBase64;
            delete finalResult.finalImageBase64;
            finalResult.boundingBoxes = [];

            await saveResult(finalResult);
            setPipelineState('idle');
            router.replace(("/result/" + finalResult.id) as any);
        } else if (data.type === 'ERROR') {
            showAlert({
                title: 'OKUMA HATASI',
                message: data.message,
                type: 'error'
            });
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
    // Önce izin kontrolü
    if (!hasPermission) {
        return (
            <View style={[styles.container, styles.center]}>
                <MaterialCommunityIcons name="camera-off" size={64} color={Colors.textSecondary} />
                <Text style={styles.errorText}>Kamera izni gerekli</Text>
                <TouchableOpacity style={styles.btn} onPress={requestPermission}>
                    <Text style={styles.btnText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Sonra processing kontrolü
    if (pipelineState !== 'idle' && pipelineState !== 'tracking') {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.processingText}>{statusText}</Text>

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

    // Exam yüklenmemişse loading göster
    if (!exam) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.processingText}>Sınav yükleniyor...</Text>
            </View>
        );
    }

    // Device yoksa loading
    if (!device) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.processingText}>Kamera hazırlanıyor...</Text>
            </View>
        );
    }

    const screenW = Dimensions.get('window').width;
    const scanH = screenW * 0.85 * (1100 / 800);

    return (
        <View style={styles.container}>
            <Camera 
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                device={device}
                isActive={true}
                photo={true}
                onInitialized={() => {
                    console.log('📸 Kamera hazır!');
                    setIsCameraReady(true);
                }}
            />
            
            <View style={[styles.overlay, StyleSheet.absoluteFillObject]}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="close" size={28} color="white" />
                </TouchableOpacity>
                <View style={styles.maskTop} />
                <View style={[styles.maskCenter, { height: scanH }]}>
                    <View style={styles.maskLeft} />
                    <View style={styles.scanArea}>
                        <View style={[styles.targetBox, { top: '12%', left: '12%' }]} />
                        <View style={[styles.targetBox, { top: '12%', right: '12%' }]} />
                        <View style={[styles.targetBox, { bottom: '12%', left: '12%' }]} />
                        <View style={[styles.targetBox, { bottom: '12%', right: '12%' }]} />

                        <Text style={styles.scanHint}>
                            Siyah kareleri bu yeşil kutulara hizalayın
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
    btnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    
    overlay: { flex: 1 },
    closeBtn: { position: 'absolute', top: 50, left: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
    
    maskTop: { flex: 1, backgroundColor: maskColor },
    maskCenter: { flexDirection: 'row' },
    maskLeft: { flex: 0.075, backgroundColor: maskColor },
    scanArea: { 
        flex: 0.85, 
        borderWidth: 3, 
        borderColor: Colors.success, 
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center'
    },
    maskRight: { flex: 0.075, backgroundColor: maskColor },
    maskBottom: { flex: 1.5, backgroundColor: maskColor, justifyContent: 'center', alignItems: 'center' },
    
    targetBox: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderWidth: 3,
        borderColor: Colors.success,
        borderRadius: 8,
        backgroundColor: 'rgba(76, 175, 80, 0.2)'
    },
    
    scanHint: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm
    },
    
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '80%' },
    galeryBtn: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center' },
    captureBtn: { 
        width: 80, 
        height: 80, 
        borderRadius: 40, 
        backgroundColor: 'white', 
        justifyContent: 'center', 
        alignItems: 'center',
        borderWidth: 4,
        borderColor: Colors.primary
    },
    captureBtnInner: { 
        width: 64, 
        height: 64, 
        borderRadius: 32, 
        backgroundColor: Colors.primary 
    }
});
