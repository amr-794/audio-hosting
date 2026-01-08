// Playlists Manager - Handles playlist CRUD operations
class PlaylistsManager {
    constructor() {
        this.currentPlaylist = null;
        this.selectedTracks = [];

        this.init();
    }

    init() {
        // Load playlists
        this.loadPlaylists();

        // Create playlist buttons
        const createPlaylistBtn = document.getElementById('createPlaylistBtn');
        const createPlaylistBtnEmpty = document.getElementById('createPlaylistBtnEmpty');

        if (createPlaylistBtn) {
            createPlaylistBtn.addEventListener('click', () => {
                this.openPlaylistModal();
            });
        }

        if (createPlaylistBtnEmpty) {
            createPlaylistBtnEmpty.addEventListener('click', () => {
                this.openPlaylistModal();
            });
        }

        // Playlist modal
        const closePlaylistModal = document.getElementById('closePlaylistModal');
        const cancelPlaylistBtn = document.getElementById('cancelPlaylistBtn');
        const savePlaylistBtn = document.getElementById('savePlaylistBtn');

        if (closePlaylistModal) {
            closePlaylistModal.addEventListener('click', () => {
                this.closePlaylistModal();
            });
        }

        if (cancelPlaylistBtn) {
            cancelPlaylistBtn.addEventListener('click', () => {
                this.closePlaylistModal();
            });
        }

        if (savePlaylistBtn) {
            savePlaylistBtn.addEventListener('click', () => {
                this.savePlaylist();
            });
        }

        // Playlist details modal
        const closePlaylistDetailsModal = document.getElementById('closePlaylistDetailsModal');
        const editPlaylistBtn = document.getElementById('editPlaylistBtn');
        const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');
        const addTracksBtn = document.getElementById('addTracksBtn');
        const addTracksEmptyBtn = document.getElementById('addTracksEmptyBtn');

        if (closePlaylistDetailsModal) {
            closePlaylistDetailsModal.addEventListener('click', () => {
                this.closePlaylistDetailsModal();
            });
        }

        if (editPlaylistBtn) {
            editPlaylistBtn.addEventListener('click', () => {
                this.editCurrentPlaylist();
            });
        }

        if (deletePlaylistBtn) {
            deletePlaylistBtn.addEventListener('click', () => {
                this.deleteCurrentPlaylist();
            });
        }

        if (addTracksBtn) {
            addTracksBtn.addEventListener('click', () => {
                this.openAddTracksModal();
            });
        }

        if (addTracksEmptyBtn) {
            addTracksEmptyBtn.addEventListener('click', () => {
                this.openAddTracksModal();
            });
        }

        // Add tracks modal
        const closeAddTracksModal = document.getElementById('closeAddTracksModal');
        const cancelAddTracksBtn = document.getElementById('cancelAddTracksBtn');
        const confirmAddTracksBtn = document.getElementById('confirmAddTracksBtn');
        const trackSearchInput = document.getElementById('trackSearchInput');

        if (closeAddTracksModal) {
            closeAddTracksModal.addEventListener('click', () => {
                this.closeAddTracksModal();
            });
        }

        if (cancelAddTracksBtn) {
            cancelAddTracksBtn.addEventListener('click', () => {
                this.closeAddTracksModal();
            });
        }

        if (confirmAddTracksBtn) {
            confirmAddTracksBtn.addEventListener('click', () => {
                this.addSelectedTracks();
            });
        }

        if (trackSearchInput) {
            trackSearchInput.addEventListener('input', (e) => {
                this.filterAvailableTracks(e.target.value);
            });
        }
    }

    loadPlaylists() {
        const playlists = storage.getPlaylists();
        const container = document.getElementById('playlistsContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) return;

        if (playlists.length === 0) {
            container.innerHTML = '';
            if (emptyState) {
                emptyState.classList.add('show');
            }
            return;
        }

        if (emptyState) {
            emptyState.classList.remove('show');
        }

        container.innerHTML = playlists.map(playlist => this.createPlaylistCard(playlist)).join('');

        // Add click listeners
        document.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openPlaylistDetails(card.dataset.id);
            });
        });
    }

    createPlaylistCard(playlist) {
        const trackCount = playlist.tracks.length;
        const tracks = playlist.tracks.slice(0, 3).map(id => storage.getAudioFileById(id)).filter(Boolean);

        return `
            <div class="playlist-card" data-id="${playlist.id}">
                <div class="playlist-card-header">
                    <div>
                        <div class="playlist-card-title">${this.escapeHtml(playlist.name)}</div>
                        <div class="playlist-card-count">${trackCount} ${trackCount === 1 ? 'ملف' : 'ملفات'}</div>
                    </div>
                </div>
                ${playlist.description ? `<p style="color: var(--text-secondary); font-size: 0.875rem; margin: var(--spacing-sm) 0;">${this.escapeHtml(playlist.description)}</p>` : ''}
                ${tracks.length > 0 ? `
                    <div class="playlist-tracks-preview">
                        ${tracks.map(track => `
                            <div class="track-preview-item">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 18V5l12-2v13"/>
                                </svg>
                                <span>${this.escapeHtml(track.title)}</span>
                            </div>
                        `).join('')}
                        ${trackCount > 3 ? `<div style="text-align: center; color: var(--text-muted); font-size: 0.875rem;">+${trackCount - 3} المزيد</div>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
    }

    openPlaylistModal(playlist = null) {
        this.currentPlaylist = playlist;

        const modal = document.getElementById('playlistModal');
        const title = document.getElementById('playlistModalTitle');
        const nameInput = document.getElementById('playlistName');
        const descInput = document.getElementById('playlistDescription');

        if (playlist) {
            title.textContent = 'تعديل قائمة التشغيل';
            nameInput.value = playlist.name;
            descInput.value = playlist.description || '';
        } else {
            title.textContent = 'إنشاء قائمة تشغيل جديدة';
            nameInput.value = '';
            descInput.value = '';
        }

        modal?.classList.add('show');
    }

    closePlaylistModal() {
        document.getElementById('playlistModal')?.classList.remove('show');
        this.currentPlaylist = null;
    }

    savePlaylist() {
        const name = document.getElementById('playlistName').value.trim();
        const description = document.getElementById('playlistDescription').value.trim();

        if (!name) {
            alert('الرجاء إدخال اسم القائمة');
            return;
        }

        if (this.currentPlaylist) {
            // Update existing
            storage.updatePlaylist(this.currentPlaylist.id, { name, description });
        } else {
            // Create new
            storage.addPlaylist({ name, description });
        }

        this.closePlaylistModal();
        this.loadPlaylists();
    }

    openPlaylistDetails(playlistId) {
        const playlist = storage.getPlaylistById(playlistId);
        if (!playlist) return;

        this.currentPlaylist = playlist;

        const modal = document.getElementById('playlistDetailsModal');
        const title = document.getElementById('playlistDetailsTitle');
        const description = document.getElementById('playlistDetailsDescription');

        title.textContent = playlist.name;
        description.textContent = playlist.description || 'لا يوجد وصف';

        this.loadPlaylistTracks();

        modal?.classList.add('show');
    }

    closePlaylistDetailsModal() {
        document.getElementById('playlistDetailsModal')?.classList.remove('show');
        this.currentPlaylist = null;
    }

    loadPlaylistTracks() {
        if (!this.currentPlaylist) return;

        const container = document.getElementById('playlistTracksContainer');
        const emptyState = document.getElementById('emptyPlaylist');

        if (!container) return;

        const tracks = this.currentPlaylist.tracks
            .map(id => storage.getAudioFileById(id))
            .filter(Boolean);

        if (tracks.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.remove('hidden');
            return;
        }

        emptyState?.classList.add('hidden');

        container.innerHTML = tracks.map((track, index) => `
            <div class="track-item" data-id="${track.id}">
                <div class="track-drag-handle">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                        <circle cx="9" cy="5" r="1"/>
                        <circle cx="9" cy="12" r="1"/>
                        <circle cx="9" cy="19" r="1"/>
                        <circle cx="15" cy="5" r="1"/>
                        <circle cx="15" cy="12" r="1"/>
                        <circle cx="15" cy="19" r="1"/>
                    </svg>
                </div>
                <div class="track-item-info">
                    <div class="track-item-title">${this.escapeHtml(track.title)}</div>
                    <div class="track-item-meta">${storage.formatDuration(track.duration)} • ${track.plays || 0} تشغيل</div>
                </div>
                <button class="icon-btn" data-action="play">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>
                <button class="icon-btn" data-action="remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add event listeners
        container.querySelectorAll('.track-item').forEach(item => {
            const trackId = item.dataset.id;

            item.querySelector('[data-action="play"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof audioPlayer !== 'undefined') {
                    audioPlayer.playTrack(trackId, this.currentPlaylist.tracks);
                }
            });

            item.querySelector('[data-action="remove"]')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTrack(trackId);
            });
        });
    }

    editCurrentPlaylist() {
        if (!this.currentPlaylist) return;

        this.closePlaylistDetailsModal();
        this.openPlaylistModal(this.currentPlaylist);
    }

    deleteCurrentPlaylist() {
        if (!this.currentPlaylist) return;

        if (confirm(`هل تريد حذف قائمة "${this.currentPlaylist.name}"؟`)) {
            storage.deletePlaylist(this.currentPlaylist.id);
            this.closePlaylistDetailsModal();
            this.loadPlaylists();
        }
    }

    removeTrack(trackId) {
        if (!this.currentPlaylist) return;

        storage.removeTrackFromPlaylist(this.currentPlaylist.id, trackId);
        this.currentPlaylist = storage.getPlaylistById(this.currentPlaylist.id);
        this.loadPlaylistTracks();
    }

    openAddTracksModal() {
        if (!this.currentPlaylist) return;

        this.selectedTracks = [];
        this.loadAvailableTracks();

        document.getElementById('addTracksModal')?.classList.add('show');
    }

    closeAddTracksModal() {
        document.getElementById('addTracksModal')?.classList.remove('show');
        this.selectedTracks = [];
    }

    loadAvailableTracks(searchQuery = '') {
        const allFiles = storage.getAudioFiles();
        const playlistTrackIds = this.currentPlaylist.tracks;

        let availableFiles = allFiles.filter(file => !playlistTrackIds.includes(file.id));

        if (searchQuery) {
            availableFiles = availableFiles.filter(file =>
                file.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        const container = document.getElementById('availableTracksContainer');
        if (!container) return;

        if (availableFiles.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-lg);">لا توجد ملفات متاحة</p>';
            return;
        }

        container.innerHTML = availableFiles.map(file => `
            <div class="track-checkbox-item">
                <input type="checkbox" value="${file.id}" data-track-checkbox>
                <div class="track-item-info">
                    <div class="track-item-title">${this.escapeHtml(file.title)}</div>
                    <div class="track-item-meta">${storage.formatDuration(file.duration)}</div>
                </div>
            </div>
        `).join('');

        // Add change listeners
        container.querySelectorAll('[data-track-checkbox]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.selectedTracks.push(e.target.value);
                } else {
                    this.selectedTracks = this.selectedTracks.filter(id => id !== e.target.value);
                }
            });
        });
    }

    filterAvailableTracks(query) {
        this.loadAvailableTracks(query);
    }

    addSelectedTracks() {
        if (this.selectedTracks.length === 0) {
            alert('الرجاء اختيار ملف واحد على الأقل');
            return;
        }

        this.selectedTracks.forEach(trackId => {
            storage.addTrackToPlaylist(this.currentPlaylist.id, trackId);
        });

        this.currentPlaylist = storage.getPlaylistById(this.currentPlaylist.id);
        this.loadPlaylistTracks();
        this.closeAddTracksModal();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const playlistsManager = new PlaylistsManager();
});
