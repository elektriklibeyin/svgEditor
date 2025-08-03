// SVG Metin Editörü - Ana JavaScript Dosyası

class SVGEditor {
    constructor() {
        this.svgData = [];
        this.filteredSvgData = [];
        this.currentSvg = null;
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.loadSvgData();
        this.filteredSvgData = [...this.svgData]; // Başlangıçta tüm veriyi göster
        this.setupEventListeners();
        this.renderSvgList();
    }

    // LocalStorage işlemleri
    loadSvgData() {
        const stored = localStorage.getItem('svgEditorData');
        this.svgData = stored ? JSON.parse(stored) : [];
    }

    saveSvgData() {
        localStorage.setItem('svgEditorData', JSON.stringify(this.svgData));
    }

    // Event Listeners
    setupEventListeners() {
        // Ana butonlar
        document.getElementById('addNewSvg').addEventListener('click', () => this.showUploadModal());
        
        // Form submit
        document.getElementById('svgUploadForm').addEventListener('submit', (e) => this.handleSvgUpload(e));
        
        // Dosya seçimi
        document.getElementById('svgFile').addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Arama işlemleri
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e));
        document.getElementById('clearSearch').addEventListener('click', () => this.clearSearch());
        
        // Modal kapatma
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeUploadModal();
            }
        });
        
        // Escape tuşu ile modal kapatma
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeUploadModal();
            }
        });
        
        // Yazma alanı genişliği değiştiğinde otomatik önizleme
        document.addEventListener('input', (e) => {
            if (e.target.id === 'widthInput') {
                this.generatePreview();
            }
            // Koordinat inputları değiştiğinde otomatik güncelleme
            if (e.target.id === 'coordX' || e.target.id === 'coordY') {
                this.updateCoordinates();
            }
        });
    }

    // Modal işlemleri
    showUploadModal() {
        const modal = document.getElementById('uploadModal');
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeUploadModal() {
        const modal = document.getElementById('uploadModal');
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Formu temizle
        document.getElementById('svgUploadForm').reset();
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('previewSection').style.display = 'none';
    }

    // Dosya seçimi işlemi
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.includes('svg')) {
            this.showToast('Lütfen geçerli bir SVG dosyası seçin', 'error');
            return;
        }

        try {
            const svgContent = await this.readFileAsText(file);
            this.displayFileInfo(file, svgContent);
            this.showSvgPreview(svgContent);
        } catch (error) {
            this.showToast('Dosya okuma hatası: ' + error.message, 'error');
        }
    }

    // Dosyayı text olarak oku
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Dosya okunamadı'));
            reader.readAsText(file);
        });
    }

    // Dosya bilgilerini göster
    displayFileInfo(file, svgContent) {
        const fileInfo = document.getElementById('fileInfo');
        const fileSize = (file.size / 1024).toFixed(2);
        
        fileInfo.innerHTML = `
            <strong>Dosya:</strong> ${file.name}<br>
            <strong>Boyut:</strong> ${fileSize} KB<br>
            <strong>Tip:</strong> ${file.type}
        `;
        fileInfo.style.display = 'block';
    }

    // SVG önizlemesini göster
    showSvgPreview(svgContent) {
        const previewSection = document.getElementById('previewSection');
        const svgPreview = document.getElementById('svgPreview');
        const placeholderInfo = document.getElementById('placeholderInfo');
        
        // SVG'yi önizleme alanına ekle
        svgPreview.innerHTML = svgContent;
        
        // Placeholder'ları bul ve göster
        const placeholders = this.findPlaceholders(svgContent);
        this.displayPlaceholderInfo(placeholders);
        
        previewSection.style.display = 'block';
    }

    // Placeholder'ları bul
    findPlaceholders(svgContent) {
        const placeholderRegex = /\[#+\]/g;
        const matches = svgContent.match(placeholderRegex) || [];
        return [...new Set(matches)]; // Benzersiz placeholder'lar
    }

    // Placeholder bilgilerini göster
    displayPlaceholderInfo(placeholders) {
        const placeholderInfo = document.getElementById('placeholderInfo');
        
        if (placeholders.length > 0) {
            placeholderInfo.innerHTML = `
                <h5>Bulunan Placeholder'lar (${placeholders.length} adet):</h5>
                <ul class="placeholder-list">
                    ${placeholders.map(p => `<li>${p}</li>`).join('')}
                </ul>
                <p style="margin-top: 10px; color: #7f8c8d; font-size: 0.9rem;">
                    Bu placeholder'lar düzenleme ekranında değiştirilebilir metin alanları olacak.
                </p>
            `;
        } else {
            placeholderInfo.innerHTML = `
                <h5>Placeholder Bulunamadı</h5>
                <p style="color: #e74c3c; font-size: 0.9rem;">
                    Bu SVG dosyasında [###] formatında placeholder bulunamadı. 
                    Metin değiştirme özelliği kullanılamayacak.
                </p>
            `;
        }
    }

    // SVG yükleme işlemi
    async handleSvgUpload(event) {
        event.preventDefault();
        
        const fileInput = document.getElementById('svgFile');
        const title = document.getElementById('svgTitle').value.trim();
        const description = document.getElementById('svgDescription').value.trim();
        
        if (!fileInput.files[0]) {
            this.showToast('Lütfen bir SVG dosyası seçin', 'error');
            return;
        }
        
        if (!title) {
            this.showToast('Lütfen bir tanım girin', 'error');
            return;
        }

        try {
            const file = fileInput.files[0];
            const svgContent = await this.readFileAsText(file);
            const placeholders = this.findPlaceholders(svgContent);
            
            // Yeni SVG objesi oluştur
            const newSvg = {
                id: Date.now().toString(),
                title: title,
                description: description,
                fileName: file.name,
                content: svgContent,
                placeholders: placeholders,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Veri listesine ekle
            this.svgData.push(newSvg);
            this.filteredSvgData = [...this.svgData]; // Filtrelenmiş veriyi de güncelle
            this.saveSvgData();
            
            // UI'ı güncelle
            this.renderSvgList();
            this.closeUploadModal();
            
            this.showToast('SVG başarıyla kaydedildi!', 'success');
            
        } catch (error) {
            this.showToast('SVG kaydetme hatası: ' + error.message, 'error');
        }
    }

    // Arama işlemi
    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase().trim();
        
        if (this.searchTerm === '') {
            this.filteredSvgData = [...this.svgData];
            document.getElementById('clearSearch').style.display = 'none';
            document.getElementById('searchResults').style.display = 'none';
        } else {
            this.filteredSvgData = this.svgData.filter(svg => {
                const titleMatch = svg.title.toLowerCase().includes(this.searchTerm);
                const descriptionMatch = svg.description && svg.description.toLowerCase().includes(this.searchTerm);
                return titleMatch || descriptionMatch;
            });
            
            document.getElementById('clearSearch').style.display = 'block';
            this.showSearchResults();
        }
        
        this.renderSvgList();
    }

    // Arama sonuçlarını göster
    showSearchResults() {
        const searchResults = document.getElementById('searchResults');
        const resultCount = document.getElementById('resultCount');
        
        resultCount.textContent = this.filteredSvgData.length;
        searchResults.style.display = 'block';
        
        if (this.filteredSvgData.length > 0) {
            searchResults.className = 'search-results has-results';
        } else {
            searchResults.className = 'search-results no-results';
        }
    }

    // Aramayı temizle
    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.searchTerm = '';
        this.filteredSvgData = [...this.svgData];
        document.getElementById('clearSearch').style.display = 'none';
        document.getElementById('searchResults').style.display = 'none';
        this.renderSvgList();
    }

    // SVG listesini render et
    renderSvgList() {
        const svgGrid = document.getElementById('svgGrid');
        const emptyState = document.getElementById('emptyState');
        const dataToRender = this.searchTerm ? this.filteredSvgData : this.svgData;
        
        if (this.svgData.length === 0) {
            svgGrid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        if (dataToRender.length === 0 && this.searchTerm) {
            svgGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #7f8c8d;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">🔍</div>
                    <h3>Arama sonucu bulunamadı</h3>
                    <p>"${this.escapeHtml(this.searchTerm)}" için sonuç bulunamadı</p>
                    <button class="btn btn-secondary" onclick="svgEditor.clearSearch()" style="margin-top: 15px;">
                        Aramayı Temizle
                    </button>
                </div>
            `;
            svgGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            return;
        }
        
        svgGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        svgGrid.innerHTML = dataToRender.map(svg => this.createSvgCard(svg)).join('');
    }

    // SVG kartı oluştur
    createSvgCard(svg) {
        const createdDate = new Date(svg.createdAt).toLocaleDateString('tr-TR');
        const placeholderCount = svg.placeholders.length;
        const highlightClass = this.searchTerm ? 'highlight' : '';
        
        // Arama terimi varsa metinleri vurgula
        let highlightedTitle = this.escapeHtml(svg.title);
        let highlightedDescription = svg.description ? this.escapeHtml(svg.description) : '';
        
        if (this.searchTerm) {
            const regex = new RegExp(`(${this.escapeRegex(this.searchTerm)})`, 'gi');
            highlightedTitle = highlightedTitle.replace(regex, '<mark>$1</mark>');
            if (highlightedDescription) {
                highlightedDescription = highlightedDescription.replace(regex, '<mark>$1</mark>');
            }
        }
        
        return `
            <div class="svg-card ${highlightClass}" onclick="svgEditor.editSvg('${svg.id}')">
                <div class="svg-card-preview">
                    ${svg.content}
                </div>
                <div class="svg-card-content">
                    <div class="svg-card-title">${highlightedTitle}</div>
                    ${svg.description ? `<div class="svg-card-description">${highlightedDescription}</div>` : ''}
                    <div class="svg-card-meta">
                        <span>${createdDate}</span>
                        <span>${placeholderCount} placeholder</span>
                    </div>
                    <div class="svg-card-actions" onclick="event.stopPropagation()">
                        <button class="btn btn-primary" onclick="svgEditor.editSvg('${svg.id}')">Düzenle</button>
                        <button class="btn btn-danger" onclick="svgEditor.deleteSvg('${svg.id}')">Sil</button>
                    </div>
                </div>
            </div>
        `;
    }

    // SVG düzenleme ekranına git
    editSvg(svgId) {
        const svg = this.svgData.find(s => s.id === svgId);
        if (!svg) {
            this.showToast('SVG bulunamadı', 'error');
            return;
        }
        
        this.currentSvg = svg;
        this.showEditScreen();
    }

    // SVG sil
    deleteSvg(svgId) {
        if (!confirm('Bu SVG dosyasını silmek istediğinizden emin misiniz?')) {
            return;
        }
        
        this.svgData = this.svgData.filter(svg => svg.id !== svgId);
        this.filteredSvgData = this.filteredSvgData.filter(svg => svg.id !== svgId);
        this.saveSvgData();
        this.renderSvgList();
        this.showToast('SVG silindi', 'success');
    }

    // Düzenleme ekranını göster
    showEditScreen() {
        document.getElementById('mainScreen').classList.remove('active');
        document.getElementById('editScreen').classList.add('active');
        
        // Başlığı güncelle
        document.getElementById('editTitle').textContent = this.currentSvg.title;
        
        // SVG'yi canvas'a yükle
        document.getElementById('svgCanvas').innerHTML = this.currentSvg.content;
        
        // Placeholder input'larını oluştur
        this.createPlaceholderInputs();
        
        // Yazma alanı bilgisini göster
        this.showPlaceholderInfo();
        
        // Placeholder koordinatlarını göster
        this.showPlaceholderCoordinates();
        
        // Varsayılan boyutları ayarla
        this.setDefaultDimensions();
    }

    // Ana ekrana dön
    backToMain() {
        document.getElementById('editScreen').classList.remove('active');
        document.getElementById('mainScreen').classList.add('active');
        this.currentSvg = null;
    }

    // Placeholder input alanlarını oluştur
    createPlaceholderInputs() {
        const container = document.getElementById('placeholderInputs');
        
        if (this.currentSvg.placeholders.length === 0) {
            container.innerHTML = '<p style="color: #7f8c8d;">Bu SVG\'de değiştirilebilir metin bulunamadı.</p>';
            return;
        }
        
        container.innerHTML = this.currentSvg.placeholders.map((placeholder, index) => `
            <div class="placeholder-input">
                <label for="placeholder_${index}">${placeholder}</label>
                <input type="text" id="placeholder_${index}" placeholder="Buraya metninizi yazın" />
            </div>
        `).join('');
        
        // Otomatik önizleme için event listener'lar ekle
        this.currentSvg.placeholders.forEach((placeholder, index) => {
            const input = document.getElementById(`placeholder_${index}`);
            if (input) {
                input.addEventListener('input', () => {
                    this.generatePreview();
                });
            }
        });
        
        // Harf boyutu değişikliğinde otomatik önizleme
        const letterScaleInput = document.getElementById('letterScale');
        if (letterScaleInput) {
            letterScaleInput.addEventListener('input', () => {
                this.generatePreview();
            });
        }
    }

    // Varsayılan boyutları ayarla
    setDefaultDimensions() {
        const svgElement = document.querySelector('#svgCanvas svg');
        if (svgElement) {
            const viewBox = svgElement.getAttribute('viewBox');
            if (viewBox) {
                const [x, y, width, height] = viewBox.split(' ').map(Number);
                document.getElementById('outputWidth').value = Math.round(width);
                document.getElementById('outputHeight').value = Math.round(height);
            } else {
                // ViewBox yoksa varsayılan değerler
                document.getElementById('outputWidth').value = 800;
                document.getElementById('outputHeight').value = 600;
            }
        }
    }

    // Basit önizleme - sadece [####] replace
    generatePreview() {
        if (!this.currentSvg) return;
        
        let modifiedSvg = this.currentSvg.content;
        
        // İlk input alanındaki metni al
        const input = document.getElementById('placeholder_0');
        const userText = input ? input.value.trim() : '';
        
        if (userText) {
            // Placeholder'ı bul ve uzunluğunu hesapla
            const placeholderMatch = modifiedSvg.match(/\[#+\]/);
            if (placeholderMatch) {
                const placeholder = placeholderMatch[0];
                const placeholderLength = placeholder.length - 2; // [ ve ] hariç
                
                // Font boyutu: 140px, karakter genişliği: 140 * 0.75 = 105px
                const fontSize = 140;
                const charWidth = fontSize * 0.72;
                // Input'tan genişlik oku, yoksa hesapla
                const widthInput = document.getElementById('widthInput');
                const placeholderWidth = widthInput?.value ? parseFloat(widthInput.value) : placeholderLength * charWidth;
                
                console.log(`Placeholder: ${placeholder}, Uzunluk: ${placeholderLength}, Genişlik: ${placeholderWidth}`);
                
                // Placeholder'ı sil
                modifiedSvg = modifiedSvg.replace(placeholder, '');
                
                // Text elementini bul ve kaldır
                const textRegex = /<text[^>]*><\/text>/g;
                modifiedSvg = modifiedSvg.replace(textRegex, '');
                
                // Transform koordinatlarını bul (orijinal placeholder konumu)
                const originalTransformMatch = this.currentSvg.content.match(/transform="translate\(([^,]+)[,\s]+([^)]+)\)"/);
                if (originalTransformMatch) {
                    let originalX = parseFloat(originalTransformMatch[1]);
                    let originalY = parseFloat(originalTransformMatch[2]);
                    
                    // Kaydedilmiş özel koordinatları kontrol et
                    const customCoords = this.loadCustomCoordinates(this.currentSvg.id);
                    if (customCoords) {
                        originalX = customCoords.x;
                        originalY = customCoords.y;
                        console.log(`Önizlemede özel koordinatlar kullanılıyor: X:${originalX}, Y:${originalY}`);
                    }
                    
                    // Yazı genişliğini hesapla
                    const totalTextWidth = userText.length * charWidth;
                    
                    // Otomatik scale hesapla (yazı placeholder'dan büyükse küçült)
                    let autoScale = 1.0;
                    if (totalTextWidth > placeholderWidth) {
                        autoScale = placeholderWidth / totalTextWidth;
                        console.log(`Yazı çok uzun! Otomatik scale: ${autoScale.toFixed(2)}`);
                    }
                    
                    // Scale'i charWidth'e uygula
                    const adjustedCharWidth = charWidth * autoScale;
                    const adjustedTotalWidth = userText.length * adjustedCharWidth;
                    
                    // Başlangıç pozisyonu (ortalamak için)
                    const startX = originalX + (placeholderWidth / 2) - (adjustedTotalWidth / 2);
                    
                    // Y koordinatını placeholder ile aynı hizaya getir
                    const adjustedY = originalY - 100;
                    
                    console.log(`Placeholder: ${placeholderWidth}px, Yazı: ${totalTextWidth}px, Scale: ${autoScale}, Yeni genişlik: ${adjustedTotalWidth}px`);
                    
                    // Harfleri letters klasöründen yükle ve ekle
                    this.addLettersToSvg(modifiedSvg, userText, startX, adjustedY, adjustedCharWidth, autoScale);
                    return;
                }
            }
        }
        
        // SVG'yi göster
        document.getElementById('svgCanvas').innerHTML = modifiedSvg;
        
        console.log('Basit replace yapıldı:', userText);
    }

    // Yazma alanı bilgisini göster
    showPlaceholderInfo() {
        const container = document.getElementById('placeholderInfo');
        
        // Placeholder'ı bul
        const placeholderMatch = this.currentSvg.content.match(/\[#+\]/);
        
        if (placeholderMatch) {
            const placeholder = placeholderMatch[0];
            const placeholderLength = placeholder.length - 2; // [ ve ] hariç
            
            // Genişlik hesapla
            const charWidth = 140 * 0.72; // Font boyutu × çarpan
            const calculatedWidth = placeholderLength * charWidth;
            
            // Sadece text'leri güncelle, input'u koruma
            document.getElementById('placeholderText').textContent = placeholder;
            document.getElementById('placeholderCount').textContent = placeholderLength;
            document.getElementById('widthInput').value = Math.round(calculatedWidth);
        } else {
            document.getElementById('placeholderText').textContent = 'Bulunamadı';
            document.getElementById('placeholderCount').textContent = '0';
        }
    }

    // Placeholder koordinatlarını göster ve düzenlenebilir yap
    showPlaceholderCoordinates() {
        const container = document.getElementById('placeholderCoords');
        
        // Transform koordinatlarını bul
        const transformMatch = this.currentSvg.content.match(/transform="translate\(([^,]+)[,\s]+([^)]+)\)"/);
        
        if (transformMatch) {
            let originalX = parseFloat(transformMatch[1]);
            let originalY = parseFloat(transformMatch[2]);
            
            // Placeholder genişliğini hesapla
            const placeholderMatch = this.currentSvg.content.match(/\[#+\]/);
            let placeholderWidth = 800; // Varsayılan
            if (placeholderMatch) {
                const placeholder = placeholderMatch[0];
                const placeholderLength = placeholder.length - 2; // [ ve ] hariç
                const charWidth = 140 * 0.72;
                placeholderWidth = placeholderLength * charWidth;
            }
            
            // Kaydedilmiş özel koordinatları kontrol et
            const customCoords = this.loadCustomCoordinates(this.currentSvg.id);
            if (customCoords) {
                originalX = customCoords.x;
                originalY = customCoords.y;
                
                // SVG içeriğini özel koordinatlarla güncelle
                this.currentSvg.content = this.currentSvg.content.replace(
                    /transform="translate\([^,]+[,\s]+[^)]+\)"/,
                    `transform="translate(${originalX}, ${originalY})"`
                );
                
                console.log(`Kaydedilmiş koordinatlar yüklendi: X:${originalX}, Y:${originalY}`);
            }
            
            // Sadece değerleri güncelle, HTML'i değiştirme
            document.getElementById('coordX').value = originalX;
            document.getElementById('coordY').value = originalY;
            
            // Status mesajını göster
            const statusElement = document.getElementById('coordStatus');
            if (customCoords) {
                statusElement.textContent = '✓ Özel koordinatlar yüklendi';
                statusElement.style.display = 'block';
            } else {
                statusElement.style.display = 'none';
            }
        }
    }

    // Koordinatları güncelle
    async updateCoordinates() {
        const newX = document.getElementById('coordX').value;
        const newY = document.getElementById('coordY').value;
        
        console.log(`Koordinatlar güncellendi: X=${newX}, Y=${newY}`);
        
        // SVG içeriğini güncelle
        const transformRegex = /transform="translate\([^,]+[,\s]+[^)]+\)"/;
        this.currentSvg.content = this.currentSvg.content.replace(
            transformRegex, 
            `transform="translate(${newX}, ${newY})"`
        );
        
        // Koordinatları localStorage'a kaydet
        this.saveCustomCoordinates(this.currentSvg.id, newX, newY);
        
        // SVG verisini güncelle
        this.updateSvgInStorage();
        
        // Otomatik önizleme
        await this.generatePreview();
        
        // Başarı mesajı
        this.showToast('Koordinatlar kaydedildi!');
    }

    // Özel koordinatları kaydet
    saveCustomCoordinates(svgId, x, y) {
        let customCoords = JSON.parse(localStorage.getItem('customCoordinates') || '{}');
        customCoords[svgId] = { x: parseFloat(x), y: parseFloat(y) };
        localStorage.setItem('customCoordinates', JSON.stringify(customCoords));
        console.log(`Koordinatlar kaydedildi: SVG ${svgId} -> X:${x}, Y:${y}`);
    }

    // Özel koordinatları yükle
    loadCustomCoordinates(svgId) {
        const customCoords = JSON.parse(localStorage.getItem('customCoordinates') || '{}');
        return customCoords[svgId] || null;
    }

    // SVG'yi storage'da güncelle
    updateSvgInStorage() {
        const svgData = this.getSvgData();
        const index = svgData.findIndex(svg => svg.id === this.currentSvg.id);
        if (index !== -1) {
            svgData[index] = this.currentSvg;
            localStorage.setItem('svgData', JSON.stringify(svgData));
        }
    }

    // Harfleri SVG'ye ekle
    async addLettersToSvg(modifiedSvg, text, startX, startY, charWidth, autoScale = 1.0) {
        try {
            let currentX = startX;
            let letterElements = '';
            
            // Her harf için
            for (let i = 0; i < text.length; i++) {
                const char = text[i].toUpperCase();
                
                if (char === ' ') {
                    // Boşluk için pozisyonu kaydır + 5px boşluk
                    currentX += charWidth * 0.5 + 10;
                    continue;
                }
                
                // Harf SVG'sini yükle
                const letterSvg = await this.loadLetterSvg(char);
                if (letterSvg) {
                    // Scale değerini al ve autoScale ile çarp
                    const manualScale = document.getElementById('letterScale')?.value || 1.0;
                    const finalScale = manualScale * autoScale;
                    
                    // Harfi konumlandır ve ölçeklendir
                    const scaledLetter = this.scaleLetter(letterSvg, currentX, startY, charWidth, finalScale);
                    letterElements += scaledLetter;
                    
                    console.log(`${char} harfi eklendi: X=${currentX}`);
                    
                    // Harfin gerçek genişliğini kullan + 5px boşluk
                    const letterWidth = this.getLetterWidth(letterSvg, finalScale);
                    const oldX = currentX;
                    currentX += letterWidth + 10;
                    console.log(`${char} harfi: genişlik=${letterWidth}, eski X=${oldX}, yeni X=${currentX}`);
                } else {
                    // Harf bulunamazsa varsayılan genişlik + 5px boşluk
                    currentX += charWidth + 10;
                }
            }
            
            // Harfleri SVG'ye ekle (</svg> etiketinden önce)
            const finalSvg = modifiedSvg.replace('</svg>', letterElements + '</svg>');
            
            // SVG'yi göster
            document.getElementById('svgCanvas').innerHTML = finalSvg;
            
            console.log('Harf sistemi ile yazı eklendi:', text);
            
        } catch (error) {
            console.error('Harf ekleme hatası:', error);
            // Hata durumunda normal SVG'yi göster
            document.getElementById('svgCanvas').innerHTML = modifiedSvg;
        }
    }

    // Harf SVG'sini yükle
    async loadLetterSvg(letter) {
        try {
            const response = await fetch(`letters/${letter}.svg`);
            if (!response.ok) {
                console.warn(`${letter}.svg bulunamadı`);
                return null;
            }
            return await response.text();
        } catch (error) {
            console.error(`${letter} harfi yüklenirken hata:`, error);
            return null;
        }
    }

    // Harfi ölçeklendir ve konumlandır
    scaleLetter(letterSvg, x, y, targetWidth, scale = 0.5) {
        // SVG içeriğini al (path elementlerini)
        const pathMatch = letterSvg.match(/<path[^>]*d="([^"]*)"[^>]*>/g);
        if (!pathMatch) return '';
        
        // Her path için transform ekle
        return pathMatch.map(path => {
            // Beyaz renk ve konumlandırma ekle
            return path.replace('<path', `<path transform="translate(${x}, ${y}) scale(${scale})" fill="white" stroke="white"`);
        }).join('');
    }

    // Harfin gerçek genişliğini al
    getLetterWidth(letterSvg, scale) {
        if (!letterSvg) return 50; // Varsayılan genişlik
        
        // viewBox'tan genişlik çıkar
        const viewBoxMatch = letterSvg.match(/viewBox="([^"]+)"/);
        if (viewBoxMatch) {
            const viewBoxParts = viewBoxMatch[1].split(' ');
            const width = parseFloat(viewBoxParts[2]);
            return width * scale; // Scale ile çarp
        }
        
        return 50 * scale; // Varsayılan
    }

    // SVG'yi indir
    downloadSvg() {
        this.generatePreview(); // Önce önizlemeyi güncelle
        
        const svgElement = document.querySelector('#svgCanvas svg');
        if (!svgElement) {
            this.showToast('İndirilecek SVG bulunamadı', 'error');
            return;
        }
        
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.currentSvg.title.replace(/[^a-z0-9]/gi, '_')}.svg`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('SVG indirildi', 'success');
    }

    // Yardımcı fonksiyonlar
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Toast bildirimi göster
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Global fonksiyonlar (HTML'den çağrılabilir)
function showUploadModal() {
    svgEditor.showUploadModal();
}

function closeUploadModal() {
    svgEditor.closeUploadModal();
}

function backToMain() {
    svgEditor.backToMain();
}

function generatePreview() {
    svgEditor.generatePreview();
}

function downloadSvg() {
    svgEditor.downloadSvg();
}

// Uygulama başlatma
let svgEditor;
document.addEventListener('DOMContentLoaded', () => {
    svgEditor = new SVGEditor();
});