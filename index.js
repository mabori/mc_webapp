
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
    }, 0);
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
        }, 150);
    });
});

