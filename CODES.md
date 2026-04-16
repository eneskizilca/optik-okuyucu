# OPTİK OKUYUCU - PROJE DOKÜMANTASYONU

Bu dokümantasyon, React Native Expo tabanlı Optik İşaretli Form (OMR) okuma uygulamasının tam yapısını, bileşenlerini ve çalışma mantığını içermektedir.

---

## 📁 PROJE AĞAÇ YAPISI

```
optik-okuyucu/
├── .expo/                          # Expo yapılandırma ve önbellek dosyaları
├── .git/                           # Git versiyon kontrol sistemi
├── .vscode/                        # VS Code editör ayarları
├── android/                        # Android native build dosyaları
│   ├── app/
│   │   ├── build/                  # Derleme çıktıları
│   │   └── src/                    # Android kaynak kodları
│   ├── gradle/                     # Gradle build sistemi
│   └── build.gradle                # Android build yapılandırması
├── app/                            # Ana uygulama sayfaları (Expo Router)
│   ├── (tabs)/                     # Tab navigasyon sayfaları
│   │   ├── index.tsx               # Ana sayfa (Sınavlar listesi)
│   │   ├── exams.tsx               # Sınavlar sayfası
│   │   ├── create-exam.tsx         # Sınav oluşturma sayfası
│   │   └── settings.tsx            # Ayarlar sayfası
│   ├── exam/
│   │   └── [id].tsx                # Sınav detay sayfası (dinamik route)
│   ├── scan/
│   │   └── [examId].tsx            # Optik okuma/tarama sayfası
│   ├── result/
│   │   └── [id].tsx                # Tarama sonuç detay sayfası
│   └── _layout.tsx                 # Root layout (navigasyon yapısı)
├── assets/                         # Statik dosyalar (resimler, fontlar)
├── components/                     # Yeniden kullanılabilir bileşenler
│   ├── AlertProvider.tsx           # Global alert/uyarı sistemi
│   └── ExamCard.tsx                # Sınav kartı bileşeni
├── constants/                      # Sabit değerler
│   └── theme.ts                    # Renk, spacing, border radius sabitleri
├── utils/                          # Yardımcı fonksiyonlar
│   ├── storage.ts                  # AsyncStorage veri yönetimi
│   ├── types.ts                    # TypeScript tip tanımlamaları
│   ├── excelProcessor.ts           # Excel dosya işleme
│   └── omr-processor.ts            # OMR işleme yardımcıları
├── .gitignore                      # Git ignore kuralları
├── BILGILENDIRME.md                # Türkçe bilgilendirme dosyası
├── README.md                       # Proje açıklama dosyası
├── app.json                        # Expo uygulama yapılandırması
├── package.json                    # NPM bağımlılıkları ve scriptler
└── tsconfig.json                   # TypeScript yapılandırması
```

---

## 📱 UYGULAMA SAYFALARI

### 1. **app/(tabs)/index.tsx** - Ana Sayfa
**İçerik:**
- Oluşturulan tüm sınavların listesini gösterir
- Her sınav için ExamCard bileşeni kullanılır
- Sınavlar tarihe göre sıralanır (en yeni üstte)
- Floating Action Button (FAB) ile yeni sınav oluşturma sayfasına yönlendirir
- Sınav kartlarına tıklandığında detay sayfasına gider

**Özellikler:**
- AsyncStorage'dan sınavları yükler
- useFocusEffect ile sayfa her açıldığında verileri yeniler
- Boş durum gösterimi (henüz sınav yoksa)

---

### 2. **app/(tabs)/exams.tsx** - Sınavlar Sayfası
**İçerik:**
- Ana sayfa ile aynı içeriği gösterir
- Tab navigasyonunda "Sınavlar" sekmesi
- Sınav listesi ve yönetim işlemleri

---

### 3. **app/(tabs)/create-exam.tsx** - Sınav Oluşturma Sayfası
**İçerik:**
- Yeni sınav oluşturma formu
- Sınav adı girişi
- Soru sayısı seçimi (1-100 arası)
- Seçenek sayısı seçimi (4 veya 5: A-D veya A-E)
- Form validasyonu
- Sınav oluşturulduktan sonra detay sayfasına yönlendirir

**Özellikler:**
- TextInput ile sınav adı
- Picker/Dropdown ile soru ve seçenek sayısı
- Kaydet butonu ile AsyncStorage'a kayıt

---

### 4. **app/(tabs)/settings.tsx** - Ayarlar Sayfası
**İçerik:**
- Uygulama ayarları
- Hakkında bilgisi
- Versiyon bilgisi
- Geliştirici bilgileri

---

### 5. **app/exam/[id].tsx** - Sınav Detay Sayfası
**İçerik:**
- Sınav bilgileri (ad, tarih, soru sayısı)
- **Cevap Anahtarı Düzenleme:** Her soru için doğru cevabı seçme (A-E arası)
- **Optik Şablon İndirme:** SVG ile oluşturulan optik formu resim olarak paylaşma
- **Sınav İstatistikleri:**
  - Sınıf ortalaması hesaplama
  - En çok yanlış yapılan ilk 3 soru
  - Toplam öğrenci sayısı
- **Excel Entegrasyonu:**
  - Excel dosyası yükleme (.xlsx)
  - Öğrenci numarası ile eşleştirme
  - Notları Excel'e otomatik yazma
  - İşlenmiş Excel'i indirme
- **Tarama Listesi:**
  - Tüm öğrenci taramalarını gösterme
  - Arama kutusu (isim/numara ile filtreleme)
  - Her tarama için: isim, numara, doğru/yanlış/boş sayısı, puan
  - Tarama silme işlemi
- **Floating Action Button (FAB):** Kamera ile yeni tarama başlatma
- **Sınav Silme:** Sınavı ve tüm taramaları kalıcı olarak silme

**Özellikler:**
- Dinamik route parametresi ([id])
- ViewShot ile SVG'yi resme çevirme
- React Native SVG ile optik form şablonu oluşturma
- Excel işleme ve paylaşma
- Gerçek zamanlı istatistik hesaplama

---

### 6. **app/scan/[examId].tsx** - Optik Okuma/Tarama Sayfası
**İçerik:**
- **Kamera Görünümü:** react-native-vision-camera ile canlı kamera akışı
- **Tarama Çerçevesi:** A4 oranında (800x1100) yeşil çerçeve overlay
- **Hizalama Göstergeleri:** 4 köşede yeşil kutular (siyah kareleri hizalamak için)
- **Çekim Butonu:** Fotoğraf çekme ve işleme başlatma
- **Galeri Butonu:** Galeriden fotoğraf seçme
- **İşleme Durumu:** ActivityIndicator ve durum mesajları
- **WebView Pipeline:** Gizli WebView içinde OpenCV.js ve Tesseract.js çalıştırma

**Özellikler:**
- Kamera izni yönetimi
- Gerçek zamanlı kamera önizlemesi
- Fotoğraf kırpma ve perspektif düzeltme
- Ağır işlemleri WebView'da yapma (UI thread'i bloklamaz)
- OCR ile isim ve numara okuma
- Cevap işaretlerini algılama
- Sonuçları kaydetme ve sonuç sayfasına yönlendirme

---

### 7. **app/result/[id].tsx** - Tarama Sonuç Detay Sayfası
**İçerik:**
- **İşlenmiş Optik Form Görüntüsü:** Doğru/yanlış cevaplar çember içinde işaretli
- **Öğrenci Bilgileri:** Ad, soyad, numara (düzenlenebilir)
- **Puan ve İstatistikler:** Toplam puan, doğru/yanlış/boş sayıları
- **Soru-Soru Cevap Karşılaştırma Tablosu:**
  - Her soru için: Soru numarası, doğru cevap, öğrenci cevabı, durum ikonu
  - Doğru cevaplar yeşil ✓ işaretli
  - Yanlış cevaplar kırmızı ✗ işaretli
  - Boş bırakılanlar sarı ⊖ işaretli
- **Görüntü Gösterimi:** Canvas'ta işaretlenmiş optik form (800x1100 oranında)
- **"Diğer Optiği Tara" Butonu:** Aynı sınav için yeni tarama başlatma

**Özellikler:**
- Öğrenci bilgilerini düzenleme (isim/numara)
- İşaretli fotoğrafı görüntüleme
- Detaylı soru analizi
- Hızlı yeni tarama başlatma

---

## 🧩 BILEŞENLER (COMPONENTS)

### 1. **components/ExamCard.tsx**
**Amaç:** Sınav listesinde her bir sınavı temsil eden kart bileşeni

**Props:**
- `exam`: Exam tipinde sınav objesi
- `onPress`: Karta tıklandığında çalışacak fonksiyon

**İçerik:**
- Sınav adı
- Soru sayısı
- Oluşturulma tarihi
- Tarama sayısı (badge)
- Sağ ok ikonu

**Stil:**
- Card layout
- Border ve shadow
- Hover/press efekti

---

### 2. **components/AlertProvider.tsx**
**Amaç:** Uygulama genelinde kullanılabilecek global alert/uyarı sistemi

**Özellikler:**
- Context API ile global state yönetimi
- `showAlert()` fonksiyonu ile her yerden çağrılabilir
- Alert tipleri: success, error, warning, confirm
- Özelleştirilebilir butonlar
- Modal overlay ile gösterim

**Kullanım:**
```typescript
const { showAlert } = useAlert();
showAlert({
  title: 'Başarılı',
  message: 'İşlem tamamlandı',
  type: 'success'
});
```

---

## 🛠️ YARDIMCI MODÜLLER (UTILS)

### 1. **utils/storage.ts**
**Amaç:** AsyncStorage ile veri yönetimi

**Fonksiyonlar:**
- `saveExam(exam)`: Sınav kaydetme
- `getExams()`: Tüm sınavları getirme
- `getExamById(id)`: ID'ye göre sınav getirme
- `deleteExam(id)`: Sınav silme
- `saveResult(result)`: Tarama sonucu kaydetme
- `getResultsForExam(examId)`: Sınava ait tüm taramaları getirme
- `deleteResult(examId, resultId)`: Tarama silme
- `saveExcelForExam(examId, meta)`: Excel dosyası kaydetme
- `getExcelForExam(examId)`: Excel dosyası getirme
- `deleteExcelForExam(examId)`: Excel dosyası silme

**Veri Yapısı:**
- Sınavlar: `@exams` key'inde array olarak
- Taramalar: `@results_{examId}` key'inde array olarak
- Excel: `@excel_{examId}` key'inde obje olarak

---

### 2. **utils/types.ts**
**Amaç:** TypeScript tip tanımlamaları

**Tipler:**
```typescript
export interface Exam {
  id: string;
  name: string;
  questionCount: number;
  optionsCount: number;
  answerKey: string[];
  createdAt: number;
}

export interface ScanResult {
  id: string;
  examId: string;
  studentNo: string;
  studentName: string;
  scannedAt: number;
  answers: string[];
  score: number;
  correct: number;
  incorrect: number;
  empty: number;
  imageUri: string;
}

export interface ExcelMeta {
  fileName: string;
  uploadedAt: number;
  base64: string;
}
```

---

### 3. **utils/excelProcessor.ts**
**Amaç:** Excel dosyalarını işleme ve not yazma

**Ana Fonksiyon:**
```typescript
export async function processExcel(
  inputBase64: string,
  results: ScanResult[]
): Promise<{
  matched: number;
  notFound: string[];
  outputBase64: string;
}>
```

**İşlem Adımları:**
1. Base64 Excel'i XLSX kütüphanesi ile parse etme
2. "ÖĞRENCİ NO" sütununu bulma
3. "NOT" sütununu bulma veya oluşturma
4. Her tarama sonucu için öğrenci numarasını Excel'de arama
5. Eşleşen satıra puanı yazma
6. İşlenmiş Excel'i base64 olarak döndürme

**Özellikler:**
- Büyük/küçük harf duyarsız sütun arama
- Boşluk ve özel karakter temizleme
- Eşleşmeyen öğrencileri raporlama

---

### 4. **utils/omr-processor.ts**
**Amaç:** OMR işleme yardımcı fonksiyonları

**Fonksiyonlar:**
- Görüntü ön işleme
- Perspektif düzeltme hesaplamaları
- Bubble algılama algoritmaları
- Koordinat dönüşümleri

---

## 🔬 OPTİK OKUMA MODÜLÜ MANTIK VE KODU

Optik okuma işlemi `app/scan/[examId].tsx` dosyasındaki `startHeavyPipeline()` fonksiyonu içinde gerçekleştirilir. Bu fonksiyon, gizli bir WebView içinde çalışan JavaScript kodu oluşturur ve ağır işlemleri (OpenCV, Tesseract) ana UI thread'ini bloklamadan yapar.

### İşlem Akışı:

1. **Fotoğraf Çekme ve Kırpma**
   - Kamera ile fotoğraf çekilir
   - Ekrandaki yeşil çerçeve koordinatları kullanılarak fotoğraf kırpılır
   - A4 oranında (800x1100) yeniden boyutlandırılır
   - Base64 formatına çevrilir

2. **WebView Pipeline Başlatma**
   - OpenCV.js ve Tesseract.js CDN'den yüklenir
   - Sınav bilgileri JSON olarak JavaScript'e aktarılır

3. **Görüntü İşleme (OpenCV.js)**
   - Gri tonlamaya çevirme
   - Adaptive threshold ile ikili görüntü elde etme
   - Kontur bulma ile hizalama markerlarını tespit etme
   - 4 köşe marker bulunursa perspektif düzeltme uygulama

4. **Cevap İşaretlerini Algılama**
   - Her soru için 4-5 seçenek bölgesini tarama
   - Her bubble'ın karanlık piksel oranını hesaplama
   - 0.6 eşik değerinin üzerindeki işaretleri tespit etme
   - Birden fazla işaret varsa "yanlış" olarak işaretleme
   - Doğru cevaplarla karşılaştırma

5. **OCR ile İsim ve Numara Okuma (Tesseract.js)**
   - İsim alanını kırpma ve OCR uygulama
   - Numara alanını kırpma ve OCR uygulama
   - Özel karakterleri temizleme

6. **Sonuç Hesaplama**
   - Doğru, yanlış, boş sayılarını hesaplama
   - Puan hesaplama (doğru / toplam geçerli soru * 100)
   - İşaretli görüntüyü base64 olarak döndürme

### Tam Kod:


```javascript
// startHeavyPipeline fonksiyonu içindeki JavaScript kodu
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
        // 1. OpenCV.js Yükleme
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'STATUS', 
            text: 'Yapay Zeka (Görüntü İşleme) Yükleniyor (1/4)...' 
        }));
        
        await loadScript(OPENCV_URL);
        await new Promise((resolve) => {
           let check = setInterval(() => { 
               if (window.cv && window.cv.Mat) { 
                   clearInterval(check); 
                   resolve(); 
               } 
           }, 200);
        });

        // 2. Tesseract.js Yükleme
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'STATUS', 
            text: 'El Yazısı Motoru Yükleniyor (2/4)...' 
        }));
        await loadScript(TESSERACT_URL);
        
        const img = new Image();
        img.onload = async function() {
            try {
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'STATUS', 
                    text: 'Optik Sınırlar Bulunuyor (3/4)...' 
                }));
                
                // 3. Görüntüyü Canvas'a Çizme
                const origCanvas = document.createElement('canvas');
                origCanvas.width = img.width;
                origCanvas.height = img.height;
                const ctxOrig = origCanvas.getContext('2d');
                ctxOrig.drawImage(img, 0, 0, img.width, img.height);
                
                // 4. OpenCV Mat Oluşturma ve Yeniden Boyutlandırma
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
                
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'STATUS', 
                    text: 'Yazıcı Payı (Margin) Düzeltiliyor (4/5)...' 
                }));
                
                // 5. Hizalama Markerlarını Bulma
                let gray = new cv.Mat();
                cv.cvtColor(warped, gray, cv.COLOR_RGBA2GRAY, 0);
                
                let thresh = new cv.Mat();
                cv.adaptiveThreshold(gray, thresh, 255, 
                    cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
                    cv.THRESH_BINARY_INV, 51, 10);
                
                let ctrs = new cv.MatVector();
                let hrchy = new cv.Mat();
                cv.findContours(thresh, ctrs, hrchy, 
                    cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

                // 6. Marker Filtreleme (Siyah Kareler)
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
                
                gray.delete(); 
                thresh.delete(); 
                ctrs.delete(); 
                hrchy.delete();

                // 7. 4 Köşe Marker Bulma
                let tl = null, tr = null, br = null, bl = null;
                if (markers.length >= 4) {
                    // Top-left ve bottom-right (x+y toplamına göre)
                    markers.sort((a, b) => (a.x + a.y) - (b.x + b.y));
                    tl = markers[0];
                    br = markers[markers.length - 1];

                    // Bottom-left ve top-right (x-y farkına göre)
                    markers.sort((a, b) => (a.x - a.y) - (b.x - b.y));
                    bl = markers[0];
                    tr = markers[markers.length - 1];
                }

                // 8. Perspektif Düzeltme
                if (tl && tr && br && bl) {
                    let srcCoords2 = cv.matFromArray(4, 1, cv.CV_32FC2, 
                        [ tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y ]);
                    let dstCoords2 = cv.matFromArray(4, 1, cv.CV_32FC2, 
                        [ 40, 40, 760, 40, 760, 1060, 40, 1060 ]);
                    
                    let M2 = cv.getPerspectiveTransform(srcCoords2, dstCoords2);
                    let finalWarped = new cv.Mat();
                    cv.warpPerspective(warped, finalWarped, M2, 
                        new cv.Size(800, 1100), cv.INTER_LINEAR, 
                        cv.BORDER_CONSTANT, new cv.Scalar(255,255,255,255));
                    
                    // Debug: Köşeleri işaretle
                    cv.circle(finalWarped, new cv.Point(40, 40), 10, 
                        new cv.Scalar(255, 0, 255, 255), -1);
                    cv.circle(finalWarped, new cv.Point(760, 40), 10, 
                        new cv.Scalar(255, 0, 255, 255), -1);
                    cv.circle(finalWarped, new cv.Point(760, 1060), 10, 
                        new cv.Scalar(255, 0, 255, 255), -1);
                    cv.circle(finalWarped, new cv.Point(40, 1060), 10, 
                        new cv.Scalar(255, 0, 255, 255), -1);
                    
                    cv.imshow(canvas, finalWarped);
                    
                    srcCoords2.delete(); 
                    dstCoords2.delete(); 
                    M2.delete(); 
                    finalWarped.delete();
                    
                    data = ctx.getImageData(0,0,800,1100).data;
                }
                
                warped.delete();
                
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'STATUS', 
                    text: 'Cevaplar Hesaplanıyor (5/5)...' 
                }));

                // 9. Cevap İşaretlerini Algılama
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

                    // Her seçeneğin karanlık oranını hesapla
                    let darknessRatios = [];
                    for(let opt=0; opt < exam.optionsCount; opt++) {
                        const bX = qX + 25 + (opt * bubbleSpacing);
                        let darkPixelsCount = 0;
                        let totalChecked = 0;
                        
                        // 13x13 piksel alan tarama (bubble içi)
                        for(let px = -6; px <= 6; px++) {
                            for(let py = -6; py <= 6; py++) {
                                const currentX = Math.round(bX + px);
                                const currentY = Math.round(qY + py);
                                if(currentX >= 0 && currentX < 800 && 
                                   currentY >= 0 && currentY < 1100) {
                                    const idx = (currentY * 800 + currentX) * 4;
                                    // Parlaklık hesaplama (RGB → Grayscale)
                                    const brightness = 0.2126*data[idx] + 
                                                      0.7152*data[idx+1] + 
                                                      0.0722*data[idx+2];
                                    if(brightness < threshold) darkPixelsCount++;
                                    totalChecked++;
                                }
                            }
                        }
                        const darknessRatio = darkPixelsCount / totalChecked;
                        darknessRatios.push({ index: opt, ratio: darknessRatio });
                    }

                    // 0.6 eşiğinin üzerindeki işaretleri bul
                    let markedOptions = darknessRatios.filter(d => d.ratio > 0.6);
                    
                    let ans = '';
                    let isMultipleMarked = markedOptions.length > 1;
                    
                    if (markedOptions.length === 1) {
                        // Tek işaretli - normal
                        ans = OPTIONS[markedOptions[0].index];
                    } else if (markedOptions.length > 1) {
                        // Birden fazla işaretli - en koyu olanı al ama yanlış say
                        markedOptions.sort((a, b) => b.ratio - a.ratio);
                        ans = OPTIONS[markedOptions[0].index];
                    }

                    studentAnswers.push(ans);
                    
                    const actualAns = exam.answerKey[i];
                    let status = 'empty';
                    
                    if (!actualAns) { 
                        // Cevap anahtarında bu soru yok
                    } 
                    else if (ans === '') { 
                        status = 'empty'; 
                        empty++; 
                    } 
                    else if (isMultipleMarked) { 
                        // Birden fazla işaretli - yanlış say
                        status = 'incorrect'; 
                        incorrect++; 
                    } 
                    else if (ans === actualAns) { 
                        status = 'correct'; 
                        correct++; 
                    } 
                    else { 
                        status = 'incorrect'; 
                        incorrect++; 
                    }

                    // 10. Görsel İşaretleme (Doğru/Yanlış Daireler)
                    ctx.lineWidth = 4;
                    
                    if (isMultipleMarked && actualAns) {
                        // Birden fazla işaretli - hepsini göster
                        for (let marked of markedOptions) {
                            const drawX = qX + 25 + (marked.index * bubbleSpacing);
                            ctx.beginPath();
                            ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
                            // Doğru cevap yeşil, diğerleri kırmızı
                            ctx.strokeStyle = OPTIONS[marked.index] === actualAns 
                                ? '#4CAF50' : '#F44336';
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

                        // Yanlışsa doğru cevabı da göster
                        if (status === 'incorrect' && actualAns) {
                            const correctIndex = OPTIONS.indexOf(actualAns);
                            if (correctIndex !== -1) {
                                const correctDrawX = qX + 25 + 
                                    (correctIndex * bubbleSpacing);
                                ctx.beginPath();
                                ctx.arc(correctDrawX, qY, 14, 0, 2 * Math.PI);
                                ctx.strokeStyle = '#4CAF50';
                                ctx.stroke();
                            }
                        }
                    } else if (status === 'empty' && actualAns) {
                        // Boş bırakılmış - doğru cevabı sarı göster
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

                // 11. OCR ile İsim ve Numara Okuma
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'STATUS', 
                    text: 'El Yazısı Okunuyor (Lütfen Bekleyin) (3/3)...' 
                }));
                
                // İsim alanını kırp
                const nameArea = document.createElement('canvas');
                nameArea.width = 640; 
                nameArea.height = 50;
                nameArea.getContext('2d').drawImage(canvas, 
                    80, 150, 640, 50, 0, 0, 640, 50);
                const nameB64 = nameArea.toDataURL();

                // Numara alanını kırp
                const noArea = document.createElement('canvas');
                noArea.width = 640; 
                noArea.height = 50;
                noArea.getContext('2d').drawImage(canvas, 
                    80, 220, 640, 50, 0, 0, 640, 50);
                const noB64 = noArea.toDataURL();

                // Tesseract OCR
                const worker = await Tesseract.createWorker('tur');
                const nameResult = await worker.recognize(nameB64);
                const noResult = await worker.recognize(noB64);
                await worker.terminate();

                // İsim temizleme
                let scName = nameResult.data.text
                    .replace('AD SOYAD', '')
                    .replace('AD SOYAD:', '')
                    .replace('ADSOYAD', '')
                    .replace(':', '')
                    .replace('-', '')
                    .replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '') // Sadece harf ve boşluk
                    .replace(/\s+/g, ' ') // Çoklu boşlukları tek yap
                    .trim();
                
                if (!scName) scName = 'Bilinmiyor';
                
                // Numara temizleme (sadece rakamlar)
                const scNo = noResult.data.text.replace(/[^0-9]/g, '') || '0000';

                // 12. Final Görüntü ve Sonuç Objesi
                const finalImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

                const validQuestions = exam.answerKey.filter(a => a).length;
                let score = validQuestions > 0 
                    ? (correct / validQuestions) * 100 
                    : 0;
                // Tam sayıysa tam, değilse 2 ondalık
                score = Number.isInteger(score) 
                    ? score 
                    : parseFloat(score.toFixed(2));

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

                // 13. React Native'e Sonuç Gönderme
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    type: 'SUCCESS', 
                    payload: resultPayload 
                }));
            } catch(cvErr) {
               window.ReactNativeWebView.postMessage(JSON.stringify({ 
                   type: 'ERROR', 
                   message: cvErr.toString() 
               }));
            }
        };
        img.src = 'data:image/jpeg;base64,${manipResult.base64}';

    } catch(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'ERROR', 
            message: 'Tesseract Yüklenemedi: ' + e.message 
        }));
    }
}

runPipeline();
`;
```

### Algoritma Özeti:

**Marker Algılama:**
- Alan: 100-8000 piksel arası
- En-boy oranı: 0.6-1.6 arası (kareye yakın)
- Doluluk oranı (extent): %80'in üzerinde

**Bubble Algılama:**
- 13x13 piksel alan tarama
- Parlaklık eşiği: 130
- Karanlık oran eşiği: 0.6 (yani %60 karanlık piksel)
- Birden fazla işaret: En koyu olan seçilir ama "yanlış" sayılır

**Perspektif Düzeltme:**
- 4 köşe marker bulunursa getPerspectiveTransform uygulanır
- Hedef koordinatlar: (40,40), (760,40), (760,1060), (40,1060)
- Margin düzeltmesi ile optik formun tam ortası kullanılır

---

## 🎯 DOĞRU/YANLIŞ CEVAPLARI ÇEMBER İÇİNE ALMA VE FOTOĞRAFA EKLEMEKodu

Optik okuma işlemi sırasında, her sorunun doğru/yanlış durumu tespit edildikten sonra, Canvas API kullanılarak cevaplar üzerine renkli çemberler çizilir. Bu işlem `app/scan/[examId].tsx` dosyasındaki JavaScript pipeline'ının 10. adımında gerçekleşir:

### Çember Çizme Kodu:

```javascript
// 10. Görsel İşaretleme (Doğru/Yanlış Daireler)
ctx.lineWidth = 4;

if (isMultipleMarked && actualAns) {
    // DURUM 1: Birden fazla seçenek işaretli
    // Tüm işaretli seçenekleri göster
    for (let marked of markedOptions) {
        const drawX = qX + 25 + (marked.index * bubbleSpacing);
        ctx.beginPath();
        ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
        
        // Doğru cevap yeşil (#4CAF50), diğerleri kırmızı (#F44336)
        ctx.strokeStyle = OPTIONS[marked.index] === actualAns 
            ? '#4CAF50'  // Yeşil - Doğru cevap
            : '#F44336'; // Kırmızı - Yanlış işaretler
        ctx.stroke();
    }
    boundingBoxes.push({ qIndex: i, status: 'incorrect' });
    
} else if (status !== 'empty' && markedOptions.length === 1) {
    // DURUM 2: Tek seçenek işaretli (normal durum)
    const drawX = qX + 25 + (markedOptions[0].index * bubbleSpacing);
    ctx.beginPath();
    ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
    
    // Doğruysa yeşil, yanlışsa kırmızı
    ctx.strokeStyle = status === 'correct' 
        ? '#4CAF50'  // Yeşil - Doğru cevap
        : '#F44336'; // Kırmızı - Yanlış cevap
    ctx.stroke();
    boundingBoxes.push({ qIndex: i, status });

    // Eğer yanlış cevap verdiyse, doğru cevabı da yeşil göster
    if (status === 'incorrect' && actualAns) {
        const correctIndex = OPTIONS.indexOf(actualAns);
        if (correctIndex !== -1) {
            const correctDrawX = qX + 25 + (correctIndex * bubbleSpacing);
            ctx.beginPath();
            ctx.arc(correctDrawX, qY, 14, 0, 2 * Math.PI);
            ctx.strokeStyle = '#4CAF50'; // Yeşil - Doğru cevap
            ctx.stroke();
        }
    }
    
} else if (status === 'empty' && actualAns) {
    // DURUM 3: Boş bırakılmış soru
    // Doğru cevabı sarı (#FFC107) ile göster
    const correctIndex = OPTIONS.indexOf(actualAns);
    if (correctIndex !== -1) {
        const drawX = qX + 25 + (correctIndex * bubbleSpacing);
        ctx.beginPath();
        ctx.arc(drawX, qY, 14, 0, 2 * Math.PI);
        ctx.strokeStyle = '#FFC107'; // Sarı - Boş bırakılan sorunun doğru cevabı
        ctx.stroke();
    }
}
```

### Çizim Mantığı:

**1. Birden Fazla İşaretli Soru:**
- Tüm işaretli seçenekler çember içine alınır
- Doğru cevap yeşil, diğer işaretler kırmızı çizilir
- Soru otomatik olarak "yanlış" sayılır

**2. Tek İşaretli Soru:**
- Öğrencinin işaretlediği seçenek çember içine alınır
- Doğruysa yeşil, yanlışsa kırmızı
- Yanlış cevap verdiyse, doğru cevap da yeşil çember ile gösterilir

**3. Boş Bırakılan Soru:**
- Doğru cevap sarı çember ile gösterilir
- Öğrencinin hiçbir işareti yoktur

### Renk Kodları:
- **Yeşil (#4CAF50):** Doğru cevap
- **Kırmızı (#F44336):** Yanlış cevap
- **Sarı (#FFC107):** Boş bırakılan sorunun doğru cevabı

### Canvas Parametreleri:
- **Çizgi kalınlığı:** 4 piksel
- **Çember yarıçapı:** 14 piksel
- **Çizim metodu:** `ctx.arc()` ile tam daire (0 - 2π)

### Fotoğrafa Ekleme:
```javascript
// İşaretli canvas'ı base64 JPEG olarak dönüştürme
const finalImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

// Sonuç objesine ekleme
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
    finalImageBase64  // İşaretli fotoğraf
};
```

Bu işaretli fotoğraf, AsyncStorage'a kaydedilir ve sonuç detay sayfasında gösterilir.

---

## 📊 TARANMIŞ SINAV KAĞIDINDA SORU-SORU ANALİZ TABLOSU

Bir öğrencinin taranmış sınav kağıdına girildiğinde (`app/result/[id].tsx`), o öğrencinin her soruyu nasıl cevapladığını gösteren detaylı bir tablo görüntülenir.

### Tablo Yapısı:

| # | Cevap Anahtarı | Öğrenci Cevabı | Durum |
|---|----------------|----------------|-------|
| 1 | A | A | ✓ (Yeşil) |
| 2 | B | C | ✗ (Kırmızı) |
| 3 | D | - | ⊖ (Sarı - Boş) |

### Tam Kod:

```typescript
// app/result/[id].tsx - Cevap Karşılaştırma Tablosu

const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

// Tablo Başlığı
<View style={styles.gridHeader}>
    <Text style={[styles.cell, {flex: 0.5}]}>#</Text>
    <Text style={styles.cell}>Cevap A.</Text>
    <Text style={styles.cell}>Öğrenci</Text>
    <Text style={[styles.cell, {flex: 0, width: 30}]}></Text>
</View>

// Her Soru İçin Satır
{exam.answerKey.map((correctOpt, i) => {
    const studentOpt = result.answers[i] || '';
    let statusIcon = 'minus';
    let iconColor = Colors.warning;
    
    // Durum Belirleme
    if (!correctOpt) {
        // Cevap anahtarında bu soru tanımlı değil
        statusIcon = 'help';
        iconColor = Colors.textSecondary;
    } else if (!studentOpt) {
        // Öğrenci boş bırakmış
        statusIcon = 'minus-circle-outline';
        iconColor = Colors.warning;
    } else if (correctOpt === studentOpt) {
        // Doğru cevap
        statusIcon = 'check-circle';
        iconColor = Colors.success;
    } else {
        // Yanlış cevap
        statusIcon = 'close-circle';
        iconColor = Colors.error;
    }

    return (
        <View key={i} style={styles.gridRow}>
            {/* Soru Numarası */}
            <Text style={[styles.cellVal, {flex: 0.5, color: Colors.textSecondary}]}>
                {i+1}
            </Text>
            
            {/* Doğru Cevap */}
            <Text style={styles.cellVal}>
                {correctOpt || '-'}
            </Text>
            
            {/* Öğrenci Cevabı */}
            <Text style={styles.cellVal}>
                {studentOpt || '-'}
            </Text>
            
            {/* Durum İkonu */}
            <MaterialCommunityIcons 
                name={statusIcon as any} 
                size={20} 
                color={iconColor} 
                style={{width: 30, textAlign: 'center'}}
            />
        </View>
    );
})}
```

### Durum İkonları ve Anlamları:

| Durum | İkon | Renk | Açıklama |
|-------|------|------|----------|
| **Doğru** | `check-circle` | Yeşil (#4CAF50) | Öğrenci doğru cevap vermiş |
| **Yanlış** | `close-circle` | Kırmızı (#F44336) | Öğrenci yanlış cevap vermiş |
| **Boş** | `minus-circle-outline` | Sarı (#FFC107) | Öğrenci boş bırakmış |
| **Tanımsız** | `help` | Gri (#757575) | Cevap anahtarında bu soru yok |

### Örnek Çıktı:

```
# | Cevap A. | Öğrenci | Durum
--|----------|---------|-------
1 | A        | A       | ✓ (Yeşil)
2 | B        | C       | ✗ (Kırmızı)
3 | D        | -       | ⊖ (Sarı)
4 | C        | C       | ✓ (Yeşil)
5 | -        | A       | ? (Gri)
```

### Özellikler:

1. **Soru Numarası:** 1'den başlayarak tüm sorular listelenir
2. **Cevap Anahtarı:** Öğretmenin belirlediği doğru cevap
3. **Öğrenci Cevabı:** Optik okuma ile tespit edilen cevap
4. **Görsel Durum:** Renkli ikon ile hızlı anlama

### Stil Kodları:

```typescript
const styles = StyleSheet.create({
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
});
```

### Kullanım Senaryosu:

1. **Öğretmen Perspektifi:**
   - Hangi soruları yanlış yaptığını görür
   - Öğrencinin güçlü/zayıf yönlerini tespit eder
   - Bireysel geri bildirim verebilir

2. **Öğrenci Perspektifi:**
   - Kendi performansını detaylı görebilir
   - Hangi konularda eksik olduğunu anlar
   - Doğru cevapları öğrenir

3. **Veli Perspektifi:**
   - Çocuğunun sınav performansını detaylı inceler
   - Hangi konularda destek gerektiğini görür

---

## �️ İŞARETLİ FOTOĞRAF GÖSTERME

Tarama sonuç detay sayfasında (`app/result/[id].tsx`), işaretli optik form görüntüsü gösterilir:

### Görüntü Gösterim Kodu:

```typescript
// İşaretli fotoğrafı gösterme
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
```

### Stil Kodları:

```typescript
imageSection: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
},
imageContainer: {
    width: '100%',
    aspectRatio: 800 / 1100,  // A4 oranı
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
```

### Görüntü İçeriği:

Gösterilen fotoğraf, optik okuma işlemi sırasında Canvas API ile işaretlenmiş halidir:
- **Yeşil çemberler:** Doğru cevaplar
- **Kırmızı çemberler:** Yanlış cevaplar
- **Sarı çemberler:** Boş bırakılan soruların doğru cevapları
- **Mor noktalar:** 4 köşe hizalama markerları (debug)

Bu görüntü, WebView pipeline'ından `canvas.toDataURL('image/jpeg', 0.8)` ile base64 formatında alınır ve AsyncStorage'a kaydedilir.

---

## �📊 SINIF GENELİ İSTATİSTİK - EN ÇOK YANLIŞ YAPILAN SORULAR

Sınav detay sayfasında (`app/exam/[id].tsx`) tüm öğrencilerin hangi soruları en çok yanlış yaptığını analiz eden kod:

```typescript
// Sınav İstatistikleri Hesaplama
// Sınıf ortalaması
let avgScore = results.length > 0
  ? results.reduce((sum, r) => sum + r.score, 0) / results.length
  : null;

// Tam sayıysa tam, değilse 2 ondalık
if (avgScore !== null) {
  avgScore = Number.isInteger(avgScore) 
    ? avgScore 
    : parseFloat(avgScore.toFixed(2));
}

// Her soru için yanlış sayısını hesaplama
const wrongCounts: number[] = Array(exam.questionCount).fill(0);

results.forEach(r => {
  r.answers.forEach((ans, i) => {
    // Eğer cevap anahtarında bu soru varsa VE
    // Öğrenci cevap vermişse VE
    // Cevap yanlışsa
    if (exam.answerKey[i] && ans && ans !== exam.answerKey[i]) {
      wrongCounts[i]++;
    }
  });
});

// En çok yanlış yapılan ilk 3 soruyu bulma
const top3Wrong = wrongCounts
  .map((count, i) => ({ q: i + 1, count }))  // Soru numarası ve yanlış sayısı
  .filter(x => x.count > 0)                   // Hiç yanlış yapılmayanları çıkar
  .sort((a, b) => b.count - a.count)          // Yanlış sayısına göre azalan sırala
  .slice(0, 3);                               // İlk 3'ünü al

// Örnek çıktı:
// top3Wrong = [
//   { q: 15, count: 8 },  // 15. soru 8 öğrenci tarafından yanlış yapıldı
//   { q: 7, count: 6 },   // 7. soru 6 öğrenci tarafından yanlış yapıldı
//   { q: 22, count: 5 }   // 22. soru 5 öğrenci tarafından yanlış yapıldı
// ]
```

### UI'da Gösterim:

```typescript
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
          <Text style={styles.top3Count}>
            {item.count}/{results.length} yanlış
          </Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${barWidth}%` }]} />
        </View>
      </View>
    </View>
  );
})}
```

### Açıklama:

1. **wrongCounts Dizisi:** Her soru için yanlış yapan öğrenci sayısını tutar
   - Index: Soru numarası (0-based)
   - Değer: O soruyu yanlış yapan öğrenci sayısı

2. **Filtreleme Mantığı:**
   - `exam.answerKey[i]`: Cevap anahtarında bu soru tanımlı mı?
   - `ans`: Öğrenci bu soruya cevap vermiş mi?
   - `ans !== exam.answerKey[i]`: Cevap yanlış mı?

3. **Sıralama ve Gösterim:**
   - En çok yanlış yapılan sorular başta
   - Her soru için yüzdelik bar gösterimi
   - Madalya sistemi (1, 2, 3)

4. **Kullanım Senaryosu:**
   - Öğretmen hangi soruların zor olduğunu görebilir
   - Sınıfın genel olarak zorlandığı konuları tespit edebilir
   - Soru kalitesini değerlendirebilir

---

## 📦 BAĞIMLILIKLAR (package.json)

### Ana Bağımlılıklar:
- **expo**: ~54.0.33 - Expo framework
- **react**: 19.1.0 - React kütüphanesi
- **react-native**: 0.81.5 - React Native framework
- **expo-router**: ~6.0.23 - Dosya tabanlı routing
- **react-native-vision-camera**: ^4.7.3 - Kamera işlemleri
- **react-native-webview**: ^13.16.1 - WebView (OpenCV/Tesseract için)
- **@react-native-async-storage/async-storage**: 2.2.0 - Veri saklama
- **expo-image-manipulator**: ~14.0.8 - Görüntü işleme
- **expo-image-picker**: ~17.0.10 - Galeri erişimi
- **react-native-svg**: 15.12.1 - SVG çizimi
- **react-native-view-shot**: 4.0.3 - Ekran görüntüsü alma
- **xlsx**: ^0.18.5 - Excel işleme
- **expo-sharing**: ~14.0.8 - Dosya paylaşma

### Geliştirme Bağımlılıkları:
- **typescript**: ~5.9.2
- **@types/react**: ~19.1.0
- **eslint**: ^9.25.0

---

## 🚀 ÇALIŞTIRMA KOMUTLARI

```bash
# Geliştirme sunucusunu başlat
npm start

# Android'de çalıştır
npm run android

# iOS'ta çalıştır
npm run ios

# Web'de çalıştır
npm run web

# Linting
npm run lint
```

---

## 📝 NOTLAR

1. **Performans:** Ağır işlemler (OpenCV, Tesseract) WebView içinde çalıştırılarak ana UI thread bloklanmaz.

2. **Doğruluk:** Bubble algılama %60 karanlık eşiği ile çalışır. Işık koşullarına göre ayarlanabilir.

3. **OCR Dili:** Tesseract 'tur' (Türkçe) dil paketi kullanır.

4. **Veri Saklama:** Tüm veriler AsyncStorage'da JSON formatında saklanır. Görüntüler base64 olarak.

5. **Excel Formatı:** "ÖĞRENCİ NO" ve "NOT" sütunları aranır. Büyük/küçük harf duyarsız.

6. **Perspektif Düzeltme:** 4 köşe marker (siyah kareler) bulunursa otomatik düzeltme yapılır.

7. **Çoklu İşaretleme:** Bir soruda birden fazla seçenek işaretliyse otomatik olarak "yanlış" sayılır.

---

## 🔧 TEKNİK DETAYLAR

### Koordinat Sistemi:
- Canvas boyutu: 800x1100 (A4 oranı)
- İsim alanı: (80, 150, 640x50)
- Numara alanı: (80, 220, 640x50)
- Sorular başlangıç Y: 320
- Satır yüksekliği: 35 piksel
- Bubble arası mesafe: 35 piksel
- Sol sütun X: 80
- Sağ sütun X: 420

### Görüntü İşleme Parametreleri:
- Adaptive threshold block size: 51
- Adaptive threshold C: 10
- Parlaklık eşiği: 130
- Karanlık oran eşiği: 0.6
- Bubble tarama alanı: 13x13 piksel

### Marker Özellikleri:
- Boyut: 40x40 piksel
- Köşe koordinatları: (40,40), (760,40), (760,1060), (40,1060)
- Alan: 100-8000 piksel
- En-boy oranı: 0.6-1.6
- Doluluk: >%80

---

**Hazırlayan:** Optik Okuyucu Geliştirme Ekibi  
**Tarih:** 2026  
**Versiyon:** 1.0.0
