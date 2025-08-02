# SVG Metin Editörü - Ürün Gereksinimleri Dökümanı (PRD)

## 1. Ürün Özeti

SVG dosyalarını yükleyip, içindeki placeholder metinleri (`[###]` formatında) kullanıcı tanımlı metinlerle değiştiren bir vektörel metin editörü uygulaması.

## 2. Temel Özellikler

### 2.1 SVG Dosya Yönetimi
- **SVG Kaydetme**: Kullanıcılar SVG dosyalarını sisteme kaydedebilir
- **Metadata**: Her dosya için:
  - **Tanım** (zorunlu): Dosyanın ne olduğunu açıklayan kısa başlık
  - **Açıklama** (isteğe bağlı): Detaylı açıklama metni
- **Dosya Listesi**: Kaydedilen tüm SVG dosyalarının görüntülendiği ana ekran

### 2.2 Ana Ekran (SVG Listesi)
- Kaydedilen SVG dosyalarının listesi
- Her item için görüntülenen bilgiler:
  - Dosya adı/tanımı
  - Açıklama (varsa)
  - Küçük önizleme
  - Son düzenleme tarihi
- Dosya seçme ve düzenleme işlevleri

### 2.3 Özelleştirme Ekranı
Seçilen SVG dosyası için düzenleme arayüzü:

#### 2.3.1 Çıktı Ayarları
- **Boyut Seçimi**: Çıktı dosyasının boyutlarını belirleme (genişlik x yükseklik)
- **Çözünürlük**: DPI/PPI ayarları

#### 2.3.2 Placeholder Metin Değiştirme
- **Otomatik Algılama**: SVG içindeki `[###]` formatındaki placeholder'ları tanıma
  - Farklı uzunluklardaki placeholder'lar desteklenir: `[######]`, `[###################]` vb.
- **Metin Girişi**: Her placeholder için kullanıcı metni girişi
- **Pozisyon Tabanlı Yerleştirme**: 
  - Placeholder'ın XY koordinatlarını alır
  - Bu koordinatları aşmayacak şekilde metni yerleştirir
  - Otomatik boyutlandırma ile metni alana sığdırır

#### 2.3.3 SVG Harf Sistemi
- **Letters Klasörü Kullanımı**: `/letters/` klasöründeki A-Z SVG dosyalarını kullanır
- **Metin Dönüşümü**: Girilen metin normal font yerine SVG harflerle oluşturulur
- **Harf Birleştirme**: Her harf için ilgili SVG dosyası yüklenir ve birleştirilir

## 3. Teknik Gereksinimler

### 3.1 Dosya Yapısı
```
letters/
├── A.svg
├── B.svg
├── ...
└── Z.svg
```

### 3.2 Placeholder Format
- Köşeli parantez başlangıcı: `[`
- Dies işaretleri: `#` (değişken sayıda)
- Köşeli parantez bitişi: `]`
- Örnek: `[#############]`

### 3.3 Koordinat Sistemi
- SVG viewBox koordinat sistemini kullanır
- Placeholder bounding box'ını hesaplar
- Metin boyutunu otomatik ayarlar

## 4. Kullanıcı Hikayesi

### 4.1 SVG Kaydetme
1. Kullanıcı "Yeni SVG Ekle" butonuna tıklar
2. SVG dosyasını seçer
3. Tanım alanını doldurur (zorunlu)
4. Açıklama alanını doldurur (isteğe bağlı)
5. "Kaydet" butonuna tıklar

### 4.2 SVG Düzenleme
1. Ana ekranda kaydedilen SVG'lerden birini seçer
2. Özelleştirme ekranı açılır
3. Çıktı boyutunu belirler
4. Placeholder'lar otomatik algılanır ve form alanları oluşur
5. Her placeholder için istediği metni yazar
6. "Önizleme" ile sonucu kontrol eder
7. "İndir" ile düzenlenmiş SVG'yi bilgisayarına kaydeder

## 5. Örnek Senaryo
- Kullanıcı `örnek.svg` dosyasını yükler (içinde `[#############]` placeholder'ı var)
- "Toktaşların Evi" metnini girer
- Program bu metni T.svg, O.svg, K.svg... harflerini birleştirerek oluşturur
- Placeholder koordinatlarını kullanarak metni doğru pozisyona yerleştirir
- Sonuç SVG dosyasını çıktı olarak verir

## 6. Geliştirme Öncelikleri

### Faz 1 (MVP)
- Temel SVG kaydetme ve listeleme
- Placeholder algılama
- Basit metin değiştirme

### Faz 2
- SVG harf sistemi entegrasyonu
- Otomatik boyutlandırma
- Önizleme özelliği

### Faz 3
- Gelişmiş koordinat hesaplamaları
- Performans optimizasyonları
- UI/UX iyileştirmeleri

## 7. Teknik Kısıtlar

- Sadece A-Z harfleri desteklenir (letters klasöründeki dosyalar)
- Placeholder format sabit: `[#]` dizisi
- SVG dosyaları valid XML formatında olmalı
- Koordinat hesaplamaları viewBox'a bağlı