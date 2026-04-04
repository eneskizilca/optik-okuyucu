# 📱 OPTİK OKUYUCU UYGULAMASI - TEKNİK DOKÜMANTASYON

## Teknik Altyapı

### Platform ve Teknolojiler

- **React Native (Expo Framework)** - iOS ve Android için tek kod tabanı
- **TypeScript** - Tip güvenli kod yapısı
- **AsyncStorage** - Yerel veri depolama
- **Expo Camera** - Kamera erişimi ve fotoğraf çekimi
- **WebView + OpenCV.js** - Görüntü işleme ve perspektif düzeltme
- **Tesseract.js** - El yazısı tanıma (OCR)
- **XLSX Kütüphanesi** - Excel dosya işleme
- **React Native SVG** - Optik form şablonu oluşturma

### Veri Yapısı

- **Sınavlar (Exam)**: Ad, soru sayısı, şık sayısı, cevap anahtarı
- **Tarama Sonuçları (ScanResult)**: Öğrenci bilgileri, cevaplar, puan, istatistikler
- **Excel Entegrasyonu**: Base64 formatında dosya saklama

## Çalışma Mantığı (Adım Adım)

### 1. Sınav Oluşturma

- Hoca sınav adını, soru sayısını (1-40) ve şık sayısını (4 veya 5) girer
- Sistem otomatik olarak A4 formatında optik form şablonu oluşturur
- Şablon 4 köşede hizalama kareleri, öğrenci bilgi alanları ve cevap balonları içerir
- Şablon indirilebilir veya paylaşılabilir (yazdırma için)

### 2. Cevap Anahtarı Girişi

- Hoca her soru için doğru cevabı seçer (A, B, C, D, E)
- Cevaplar anında kaydedilir
- Eksik cevaplar görsel olarak işaretlenir

### 3. Optik Form Tarama (Yapay Zeka Destekli)

- Öğrenci doldurulmuş formu kameraya tutar
- Sistem 4 köşedeki siyah kareleri otomatik algılar
- Perspektif düzeltme yapılır (eğik çekilse bile düzeltir)
- Adaptive Threshold algoritması ile ışık/gölge farklarından etkilenmez
- Her cevap balonu piksel karanlık oranına göre analiz edilir (%40+ karanlık = işaretli)
- Tesseract OCR ile ad-soyad ve öğrenci numarası otomatik okunur

### 4. Otomatik Değerlendirme

- Öğrenci cevapları ile cevap anahtarı karşılaştırılır
- Doğru, yanlış ve boş sayıları hesaplanır
- 100 üzerinden puan otomatik hesaplanır
- Sonuçlar yeşil (doğru), kırmızı (yanlış), sarı (boş) renklerle işaretlenir

### 5. Excel Entegrasyonu

- Hoca sınıf listesini içeren Excel dosyasını yükler
- Excel'de "ÖĞRENCİ NO" ve "NOT" sütunları aranır
- Tarama sonuçları öğrenci numarasına göre eşleştirilir
- Notlar otomatik olarak Excel'e yazılır
- Güncellenmiş Excel dosyası indirilebilir

### 6. İstatistik ve Raporlama

- Sınıf ortalaması otomatik hesaplanır
- En çok yanlış yapılan sorular görsel grafiklerle gösterilir
- Her öğrencinin detaylı cevap karşılaştırması yapılabilir
- Taranmış form görüntüleri işaretlemelerle birlikte saklanır

## Kullanım Avantajları

- ✅ Tamamen offline çalışır (internet gerektirmez)
- ✅ Eğik veya kötü ışıkta çekilen fotoğrafları düzeltir
- ✅ El yazısını otomatik okur (manuel giriş gerektirmez)
- ✅ Excel ile tam entegrasyon (not girişi otomatik)
- ✅ Sınırsız sınav ve öğrenci desteği
- ✅ Tüm veriler cihazda güvenle saklanır

## Kurulum ve Başlatma

```bash
# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npx expo start
```

Uygulama akademik ortamda kullanıma hazır durumda. Hocalar kolayca sınav oluşturabilir, optik formları tarayabilir ve notları Excel'e aktarabilir.
