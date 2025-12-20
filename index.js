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
        albumOptionsBtn.setAttribute('aria-label', 'Album-Optionen');
        albumOptionsBtn.dataset.albumId = album.id;
        
        albumHeader.appendChild(albumName);
        albumHeader.appendChild(albumOptionsBtn);
        
        const albumLocation = document.createElement('p');
        albumLocation.className = 'album-location';
        albumLocation.textContent = album.ort;
        
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
    if (!confirm('Möchten Sie dieses Album wirklich löschen?')) {
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
            alert('Bitte geben Sie einen Namen ein.');
            return;
        }
        
        if (saveAlbumChanges(currentEditingAlbumId, newName)) {
            closeAlbumOptionsModal();
        }
    });
});

// Initialisierung
loadAlbums();

