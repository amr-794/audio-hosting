// Main Application Controller - Handles index.html functionality
class AppController {
    constructor() {
        this.currentView = 'grid';
        this.currentSort = 'date-desc';
        this.searchQuery = '';

        this.init();
    }

    init() {
        // Load and display files
        this.loadAudioFiles();

        // Update statistics
        this.updateStatistics();

        // Search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.loadAudioFiles();
            });
        }

        // View toggle
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view) {
                    this.currentView = view;
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadAudioFiles();
                }
            });
        });

        // Sort
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.loadAudioFiles();
            });
        }

        // Check for play parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const playId = urlParams.get('play');
        if (playId && typeof audioPlayer !== 'undefined') {
            setTimeout(() => {
                audioPlayer.playTrack(playId);
            }, 500);
        }
    }

    loadAudioFiles() {
        let files = storage.getAudioFiles();

        // Filter by search
        if (this.searchQuery) {
            files = files.filter(file =>
                file.title.toLowerCase().includes(this.searchQuery) ||
                file.filename.toLowerCase().includes(this.searchQuery)
            );
        }

        // Sort
        files = this.sortFiles(files);

        // Display
        this.displayFiles(files);
    }

    sortFiles(files) {
        const sorted = [...files];

        switch (this.currentSort) {
            case 'date-desc':
                sorted.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                break;
            case 'date-asc':
                sorted.sort((a, b) => new Date(a.uploadDate) - new Date(b.uploadDate));
                break;
            case 'name-asc':
                sorted.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
                break;
            case 'name-desc':
                sorted.sort((a, b) => b.title.localeCompare(a.title, 'ar'));
                break;
            case 'plays-desc':
                sorted.sort((a, b) => (b.plays || 0) - (a.plays || 0));
                break;
        }

        return sorted;
    }

    displayFiles(files) {
        const container = document.getElementById('audioFilesContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) return;

        if (files.length === 0) {
            container.innerHTML = '';
            if (emptyState) {
                emptyState.classList.add('show');
            }
            return;
        }

        if (emptyState) {
            emptyState.classList.remove('show');
        }

        container.innerHTML = files.map(file => this.createAudioCard(file)).join('');

        // Add event listeners
        this.attachCardListeners();
    }

    createAudioCard(file) {
        return `
            <div class="audio-card" data-id="${file.id}">
                <div class="audio-card-artwork">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
                    </svg>
                </div>
                <div class="audio-card-title">${this.escapeHtml(file.title)}</div>
                <div class="audio-card-meta">
                    <span>${storage.formatDuration(file.duration)}</span>
                    <span>${file.plays || 0} تشغيل</span>
                </div>
                <div class="audio-card-actions">
                    <button class="icon-btn" data-action="play" title="تشغيل">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="icon-btn" data-action="share" title="مشاركة">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="18" cy="5" r="3" stroke-width="2"/>
                            <circle cx="6" cy="12" r="3" stroke-width="2"/>
                            <circle cx="18" cy="19" r="3" stroke-width="2"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke-width="2"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke-width="2"/>
                        </svg>
                    </button>
                    <button class="icon-btn" data-action="delete" title="حذف">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    attachCardListeners() {
        const cards = document.querySelectorAll('.audio-card');

        cards.forEach(card => {
            const fileId = card.dataset.id;

            // Play button
            const playBtn = card.querySelector('[data-action="play"]');
            if (playBtn) {
                playBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof audioPlayer !== 'undefined') {
                        audioPlayer.playTrack(fileId);
                    }
                });
            }

            // Share button
            const shareBtn = card.querySelector('[data-action="share"]');
            if (shareBtn) {
                shareBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (typeof embedManager !== 'undefined') {
                        embedManager.openShareModal(fileId);
                    }
                });
            }

            // Delete button
            const deleteBtn = card.querySelector('[data-action="delete"]');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteFile(fileId);
                });
            }

            // Card click - play
            card.addEventListener('click', () => {
                if (typeof audioPlayer !== 'undefined') {
                    audioPlayer.playTrack(fileId);
                }
            });
        });
    }

    deleteFile(fileId) {
        const file = storage.getAudioFileById(fileId);
        if (!file) return;

        if (confirm(`هل تريد حذف "${file.title}"؟`)) {
            storage.deleteAudioFile(fileId);
            this.loadAudioFiles();
            this.updateStatistics();
        }
    }

    updateStatistics() {
        const stats = storage.getStatistics();

        const totalFiles = document.getElementById('totalFiles');
        const totalPlaylists = document.getElementById('totalPlaylists');
        const totalPlays = document.getElementById('totalPlays');

        if (totalFiles) {
            totalFiles.textContent = stats.totalFiles;
        }

        if (totalPlaylists) {
            totalPlaylists.textContent = stats.totalPlaylists;
        }

        if (totalPlays) {
            totalPlays.textContent = stats.totalPlays;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
});
