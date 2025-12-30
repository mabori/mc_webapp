
// Grid-Layout optimieren
function optimizeAlbumGrid() {
    const albumsContainer = document.getElementById('albumsContainer');
    if (!albumsContainer || albumsContainer.style.display === 'none') return;
    
    const albums = albumsContainer.querySelectorAll('.album-card');
    if (albums.length === 0) return;
    
    const containerWidth = albumsContainer.offsetWidth;
    const gap = parseInt(getComputedStyle(albumsContainer).gap) || 20;
    
    // Berechne verfügbare Breite (Container-Breite minus Padding)
    const containerPadding = parseInt(getComputedStyle(albumsContainer).paddingLeft) + 
                             parseInt(getComputedStyle(albumsContainer).paddingRight);
    const availableWidth = containerWidth - containerPadding;
    
    // Min/Max Größen basierend auf Viewport
    let minSize = 160;
    let maxSize = 280;
    
    const isMobile = window.innerWidth <= 768;
    
    if (window.innerWidth <= 480) {
        minSize = 120;
        maxSize = 220;
    } else if (isMobile) {
        minSize = 140;
        maxSize = 260;
    }
    
    // Auf Handys: Maximale Größe auf die Größe setzen, die zwei Alben nebeneinander hätten
    if (isMobile) {
        const totalGapWidthForTwo = gap * (2 - 1);
        const sizeForTwoAlbums = (availableWidth - totalGapWidthForTwo) / 2;
        maxSize = Math.max(minSize, sizeForTwoAlbums);
    }
    
    // Finde die maximale Anzahl von Alben, die in eine Zeile passen
    // Die Größe muss mindestens minSize sein
    let maxColsInRow = 1;
    for (let cols = albums.length; cols >= 1; cols--) {
        const totalGapWidth = gap * (cols - 1);
        const sizeForCols = (availableWidth - totalGapWidth) / cols;
        
        // Wenn die Größe mindestens minSize ist, passen diese viele Alben in eine Zeile
        if (sizeForCols >= minSize) {
            maxColsInRow = cols;
            break;
        }
    }
    
    // Berechne die optimale Größe für diese Anzahl von Spalten
    const totalGapWidth = gap * (maxColsInRow - 1);
    const optimalSize = Math.min(maxSize, Math.max(minSize, (availableWidth - totalGapWidth) / maxColsInRow));
    
    // Setze die optimale Größe als Grid-Template-Columns
    // Verwende auto-fill, damit mehrere Zeilen erstellt werden können
    albumsContainer.style.gridTemplateColumns = `repeat(${maxColsInRow}, ${optimalSize}px)`;
}

// Alben laden und anzeigen
function loadAlbums() {
    const albums = JSON.parse(localStorage.getItem('albums') || '[]');
    const albumsContainer = document.getElementById('albumsContainer');
    const noAlbums = document.getElementById('noAlbums');
    const mainHeading = document.getElementById('mainHeading');
    
    if (albums.length === 0) {
        albumsContainer.style.display = 'none';
        noAlbums.style.display = 'flex';
        mainHeading.style.display = 'none';
        return;
    }
    
    albumsContainer.style.display = 'grid';
    noAlbums.style.display = 'none';
    mainHeading.style.display = 'block';
    albumsContainer.innerHTML = '';
    
    albums.forEach(album => {
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        
        // Erstes Bild als Vorschaubild
        const previewImg = document.createElement('img');
        previewImg.src = album.photos && album.photos.length > 0 ? album.photos[0] : '';
        previewImg.alt = album.name;
        previewImg.className = 'album-preview';
        
        // Nach Bildladung Textgrößen anpassen
        previewImg.addEventListener('load', () => {
            adjustAlbumTextSizes();
        });
        
        const albumInfo = document.createElement('div');
        albumInfo.className = 'album-info';
        
        const albumHeader = document.createElement('div');
        albumHeader.className = 'album-header';
        
        const albumName = document.createElement('h3');
        albumName.className = 'album-name';
        albumName.textContent = album.name;
        
        const albumOptionsBtn = document.createElement('button');
        albumOptionsBtn.className = 'album-options-btn';
        albumOptionsBtn.innerHTML = '⋮';
        albumOptionsBtn.setAttribute('aria-label', 'Album options');
        albumOptionsBtn.dataset.albumId = album.id;
        
        albumHeader.appendChild(albumName);
        albumHeader.appendChild(albumOptionsBtn);
        
        const albumLocation = document.createElement('p');
        albumLocation.className = 'album-location';
        albumLocation.innerHTML = '<span class="location-icon">📍</span>' + (album.ort || 'No location specified');
        
        albumInfo.appendChild(albumHeader);
        albumInfo.appendChild(albumLocation);
        
        albumCard.appendChild(previewImg);
        albumCard.appendChild(albumInfo);
        
        // Album-Karte anklickbar machen
        albumCard.style.cursor = 'pointer';
        albumCard.addEventListener('click', (e) => {
            // Nicht öffnen wenn Options-Button geklickt wurde
            if (e.target.closest('.album-options-btn')) {
                return;
            }
            window.location.href = `album-view.html?id=${album.id}`;
        });
        
        albumsContainer.appendChild(albumCard);
        
        // Event Listener für Options Button
        albumOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openAlbumOptionsModal(album.id, album.name);
        });
    });
    
    // Grid-Layout optimieren nach dem Laden
    setTimeout(() => {
        optimizeAlbumGrid();
        // Warte kurz, damit die Bilder geladen sind
        setTimeout(() => {
            adjustAlbumTextSizes();
        }, 100);
    }, 0);
}

// Schriftgrößen dynamisch an Kartengröße anpassen
function adjustAlbumTextSizes() {
    const albumCards = document.querySelectorAll('.album-card');
    
    albumCards.forEach(card => {
        const cardWidth = card.offsetWidth;
        const albumInfo = card.querySelector('.album-info');
        const albumName = card.querySelector('.album-name');
        const albumLocation = card.querySelector('.album-location');
        const albumOptionsBtn = card.querySelector('.album-options-btn');
        
        if (!albumInfo || !albumName || !albumLocation) return;
        
        // Basis-Schriftgröße basierend auf Kartengröße
        // Für kleine Karten (120px): ~0.7rem, für große (280px): ~1rem
        const minCardSize = 120;
        const maxCardSize = 280;
        const normalizedSize = Math.max(0, Math.min(1, (cardWidth - minCardSize) / (maxCardSize - minCardSize)));
        const baseFontSize = 0.7 + (normalizedSize * 0.3); // 0.7rem bis 1rem
        card.style.fontSize = `${baseFontSize}rem`;
        
        // Info-Höhe berechnen
        const infoHeight = albumInfo.offsetHeight;
        const infoPadding = parseFloat(getComputedStyle(albumInfo).paddingTop) + 
                          parseFloat(getComputedStyle(albumInfo).paddingBottom);
        const infoGap = parseFloat(getComputedStyle(albumInfo).gap) || 0;
        const availableHeight = infoHeight - infoPadding - infoGap;
        
        if (availableHeight > 0) {
            // Line-height Verhältnisse (minimal)
            const nameLineHeightRatio = 1.05;
            const locationLineHeightRatio = 1.0;
            const nameMarginBottomEm = 0.15; // margin-bottom in em
            
            // Basis-Schriftgröße der Karte für em-Berechnungen
            const cardFontSizePx = parseFloat(getComputedStyle(card).fontSize) || 16;
            const nameMarginBottomPx = nameMarginBottomEm * cardFontSizePx;
            
            // Aufteilung des verfügbaren Platzes: Name bekommt mehr Platz, Ort weniger
            // Bei großen Alben mehr Platz für Name nutzen
            const nameAllocatedRatio = cardWidth > 200 ? 0.78 : 0.72; // Mehr Platz bei großen Alben
            const nameAllocatedHeight = availableHeight * nameAllocatedRatio - nameMarginBottomPx;
            const locationAllocatedHeight = availableHeight * (1 - nameAllocatedRatio);
            
            // Name: Berechnung basierend auf verfügbarer Höhe (maximal 2 Zeilen)
            // Verwende direkte Berechnung für größere Schriftgrößen bei großen Alben
            const maxNameFontSizeForHeight = nameAllocatedHeight / (nameLineHeightRatio * 16 * 2); // Max 2 Zeilen
            // Bei großen Alben zusätzlichen Faktor anwenden für deutlich größere Schrift
            const sizeMultiplier = cardWidth > 200 ? 1.3 : (cardWidth > 160 ? 1.15 : 1.0); // Größerer Multiplikator bei großen Alben
            const finalNameFontSize = Math.max(0.85, maxNameFontSizeForHeight * sizeMultiplier);
            
            albumName.style.fontSize = `${finalNameFontSize}rem`;
            albumName.style.lineHeight = `${nameLineHeightRatio}`;
            albumName.style.margin = '0';
            albumName.style.marginBottom = '0.15em';
            albumName.style.padding = '0';
            
            // Ort: Berechnung basierend auf verfügbarer Höhe (1 Zeile)
            // Ort soll etwa 65% der Namensgröße sein, aber nicht größer als der verfügbare Platz erlaubt
            const maxLocationFontSizeForHeight = locationAllocatedHeight / (locationLineHeightRatio * 16);
            const locationFontSizeFromName = finalNameFontSize * 0.65;
            // Bei großen Alben auch Ort etwas größer machen
            const finalLocationFontSize = Math.max(0.6, Math.min(maxLocationFontSizeForHeight * sizeMultiplier, locationFontSizeFromName));
            
            albumLocation.style.fontSize = `${finalLocationFontSize}rem`;
            albumLocation.style.lineHeight = `${locationLineHeightRatio}`;
            albumLocation.style.margin = '0';
            albumLocation.style.marginTop = '0';
            albumLocation.style.padding = '0';
        }
        
        // Header explizit auf Inhalt anpassen
        const albumHeader = card.querySelector('.album-header');
        if (albumHeader) {
            albumHeader.style.margin = '0';
            albumHeader.style.marginBottom = '0';
            albumHeader.style.padding = '0';
            albumHeader.style.height = 'auto';
            albumHeader.style.maxHeight = 'fit-content';
            albumHeader.style.lineHeight = '0';
        }
        
        // Options-Button Größe anpassen - im gleichen Stil wie Name und Ort
        if (albumOptionsBtn) {
            // Berechne Button-Größe basierend auf Album-Größe mit gleichem Multiplikator
            const sizeMultiplier = cardWidth > 200 ? 1.3 : (cardWidth > 160 ? 1.15 : 1.0);
            const btnFontSize = baseFontSize * 1.1 * sizeMultiplier; // Basis * 1.1 * Multiplikator für große Alben
            albumOptionsBtn.style.fontSize = `${btnFontSize}rem`;
            albumOptionsBtn.style.width = `${btnFontSize}rem`;
            albumOptionsBtn.style.height = `${btnFontSize}rem`;
            albumOptionsBtn.style.minWidth = `${btnFontSize}rem`;
            albumOptionsBtn.style.minHeight = `${btnFontSize}rem`;
        }
    });
}

// Click-Effekt für den FAB Button
document.querySelector('.fab-button').addEventListener('click', function(e) {
    this.classList.add('fab-clicked');
    setTimeout(() => {
        this.classList.remove('fab-clicked');
    }, 300);
});

// Album Options Modal öffnen
let currentEditingAlbumId = null;

function openAlbumOptionsModal(albumId, albumName) {
    currentEditingAlbumId = albumId;
    const modal = document.getElementById('albumOptionsModal');
    const nameInput = document.getElementById('editAlbumName');
    
    if (modal && nameInput) {
        nameInput.value = albumName;
        modal.style.display = 'flex';
        nameInput.focus();
    }
}

// Album Options Modal schließen
function closeAlbumOptionsModal() {
    const modal = document.getElementById('albumOptionsModal');
    const form = document.getElementById('albumOptionsForm');
    
    if (modal) {
        modal.style.display = 'none';
    }
    if (form) {
        form.reset();
    }
    currentEditingAlbumId = null;
}

// Album umbenennen/speichern
function saveAlbumChanges(albumId, newName) {
    const albums = JSON.parse(localStorage.getItem('albums') || '[]');
    const album = albums.find(a => a.id === albumId);
    
    if (!album) return false;
    
    if (newName && newName.trim() !== '' && newName.trim() !== album.name) {
        album.name = newName.trim();
        localStorage.setItem('albums', JSON.stringify(albums));
        loadAlbums(); // Alben neu laden
        return true;
    }
    return false;
}

// Album löschen
function deleteAlbum(albumId) {
    if (!confirm('Do you really want to delete this album?')) {
        return;
    }
    
    const albums = JSON.parse(localStorage.getItem('albums') || '[]');
    const filteredAlbums = albums.filter(a => a.id !== albumId);
    localStorage.setItem('albums', JSON.stringify(filteredAlbums));
    loadAlbums(); // Alben neu laden
    closeAlbumOptionsModal();
}

// Event Listeners für Album Options Modal
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('albumOptionsModal');
    const form = document.getElementById('albumOptionsForm');
    const closeBtn = document.getElementById('closeOptionsBtn');
    const deleteBtn = document.getElementById('deleteAlbumBtn');
    const nameInput = document.getElementById('editAlbumName');
    
    if (!modal || !form || !closeBtn || !deleteBtn || !nameInput) {
        return;
    }
    
    // Modal schließen bei Klick außerhalb
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAlbumOptionsModal();
        }
    });
    
    // X Button zum Schließen
    closeBtn.addEventListener('click', () => {
        closeAlbumOptionsModal();
    });
    
    // Löschen Button
    deleteBtn.addEventListener('click', () => {
        if (currentEditingAlbumId) {
            deleteAlbum(currentEditingAlbumId);
        }
    });
    
    // Form Submit (Speichern)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentEditingAlbumId) return;
        
        const newName = nameInput.value.trim();
        if (!newName) {
            alert('Please enter a name.');
            return;
        }
        
        if (saveAlbumChanges(currentEditingAlbumId, newName)) {
            closeAlbumOptionsModal();
        }
    });
});

// Initialisierung - Onboarding-Check
document.addEventListener('DOMContentLoaded', () => {
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    
    if (!onboardingCompleted) {
        // Onboarding noch nicht abgeschlossen - zur Landing-Page weiterleiten
        window.location.href = 'onboarding.html';
        return;
    }
    
    // Onboarding abgeschlossen - Alben laden
    loadAlbums();
    
    // Resize-Listener für Grid-Optimierung
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            optimizeAlbumGrid();
            adjustAlbumTextSizes();
        }, 150);
    });
});

