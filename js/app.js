// Main Application Logic
// Handles UI interactions, file uploads, and view management

const App = {
    currentView: 'upload',
    uploadingFile: null,

    // Initialize app
    init() {
        this.setupNavigation();
        this.setupUpload();
        this.setupModals();
        this.setupSettings();
        this.setupPlaylists();
        this.renderLibrary();
        this.renderPlaylists();
        this.updateStorageInfo();
    },

    // Setup navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.dataset.view;
                this.switchView(view);
            });
        });
    },

    // Switch view
    switchView(viewName) {
        // Update nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}-view`).classList.add('active');

        this.currentView = viewName;

        // Refresh content
        if (viewName === 'library') {
            this.renderLibrary();
        } else if (viewName === 'playlists') {
            this.renderPlaylists();
        } else if (viewName === 'settings') {
            this.loadSettings();
            this.updateStorageInfo();
        }
    },

    // Setup upload
    setupUpload() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('audioFileInput');
        const uploadAnotherBtn = document.getElementById('uploadAnotherBtn');

        // Click to upload
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');

            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type.startsWith('audio/')) {
                    this.handleFileUpload(file);
                } else {
                    alert('الرجاء رفع ملف صوتي فقط');
                }
            }
        });

        // Upload another
        uploadAnotherBtn.addEventListener('click', () => {
            this.resetUpload();
        });

        // Share and embed buttons
        document.getElementById('shareBtn').addEventListener('click', () => {
            this.openShareModal(this.uploadingFile.id);
        });

        document.getElementById('embedBtn').addEventListener('click', () => {
            Embed.openEmbedModal(this.uploadingFile.id);
        });
    },

    // Handle file upload
    handleFileUpload(file) {
        // Validate file type
        if (!file.type.startsWith('audio/')) {
            alert('الرجاء اختيار ملف صوتي');
            return;
        }

        // Validate file size (max 10MB for demo)
        if (file.size > 10 * 1024 * 1024) {
            alert('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
            return;
        }

        // Hide upload zone
        document.getElementById('uploadZone').style.display = 'none';

        // Show progress
        const progressContainer = document.getElementById('uploadProgressContainer');
        progressContainer.style.display = 'block';

        // Update file info
        document.getElementById('uploadFileName').textContent = file.name;
        document.getElementById('uploadFileSize').textContent = Storage.formatFileSize(file.size);

        // Simulate upload with realistic progress
        this.simulateUpload(file);
    },

    // Simulate upload progress
    simulateUpload(file) {
        const progressBar = document.getElementById('uploadProgressBar');
        const percentage = document.getElementById('uploadPercentage');
        const speed = document.getElementById('uploadSpeed');

        let progress = 0;
        const fileSize = file.size;
        const totalTime = 3000; // 3 seconds for simulation
        const interval = 50; // Update every 50ms
        const increment = (100 / totalTime) * interval;

        const progressInterval = setInterval(() => {
            progress += increment;

            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);

                // Read file and save
                this.readAndSaveFile(file);
            }

            // Update UI
            progressBar.style.width = progress + '%';
            percentage.textContent = Math.round(progress) + '%';

            // Calculate speed (simulated)
            const uploadedBytes = (fileSize * progress) / 100;
            const speedKBps = (uploadedBytes / 1024) / ((progress / 100) * (totalTime / 1000));
            speed.textContent = speedKBps.toFixed(0) + ' KB/s';
        }, interval);
    },

    // Read and save file
    readAndSaveFile(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            // Create audio element to get duration
            const audio = new Audio(e.target.result);

            audio.addEventListener('loadedmetadata', () => {
                try {
                    // Save to storage
                    const savedFile = Storage.addAudioFile({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        duration: audio.duration,
                        data: e.target.result
                    });

                    this.uploadingFile = savedFile;

                    // Show success
                    setTimeout(() => {
                        document.getElementById('uploadProgressContainer').style.display = 'none';
                        document.getElementById('uploadSuccess').style.display = 'block';
                    }, 500);

                } catch (error) {
                    alert(error.message);
                    this.resetUpload();
                }
            });

            audio.addEventListener('error', () => {
                alert('فشل قراءة الملف الصوتي');
                this.resetUpload();
            });
        };

        reader.onerror = () => {
            alert('فشل قراءة الملف');
            this.resetUpload();
        };

        reader.readAsDataURL(file);
    },

    // Reset upload
    resetUpload() {
        document.getElementById('uploadZone').style.display = 'block';
        document.getElementById('uploadProgressContainer').style.display = 'none';
        document.getElementById('uploadSuccess').style.display = 'none';
        document.getElementById('audioFileInput').value = '';
        document.getElementById('uploadProgressBar').style.width = '0%';
        this.uploadingFile = null;
    },

    // Render library
    renderLibrary() {
        const audioGrid = document.getElementById('audioGrid');
        const emptyState = document.getElementById('libraryEmpty');
        let audioFiles = Storage.getAudioFiles();

        // Apply search
        const searchQuery = document.getElementById('librarySearch')?.value || '';
        if (searchQuery) {
            audioFiles = Storage.searchAudioFiles(searchQuery);
        }

        // Apply sort
        const sortBy = document.getElementById('librarySort')?.value || 'newest';
        audioFiles = Storage.sortAudioFiles(audioFiles, sortBy);

        if (audioFiles.length === 0) {
            audioGrid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            audioGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            audioGrid.innerHTML = audioFiles.map(file => this.createAudioCard(file)).join('');
        }

        // Setup search and sort
        this.setupLibraryControls();
    },

    // Setup library controls
    setupLibraryControls() {
        const searchInput = document.getElementById('librarySearch');
        const sortSelect = document.getElementById('librarySort');

        if (searchInput) {
            searchInput.removeEventListener('input', this.renderLibrary);
            searchInput.addEventListener('input', () => this.renderLibrary());
        }

        if (sortSelect) {
            sortSelect.removeEventListener('change', this.renderLibrary);
            sortSelect.addEventListener('change', () => this.renderLibrary());
        }
    },

    // Create audio card
    createAudioCard(file) {
        return `
            <div class="audio-card" data-id="${file.id}">
                <div class="audio-card-header">
                    <div class="audio-artwork">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18V5l12-2v13"/>
                        </svg>
                    </div>
                    <div class="audio-info">
                        <h3>${file.name}</h3>
                        <p>${Storage.formatFileSize(file.size)} • ${Storage.formatDuration(file.duration)}</p>
                    </div>
                </div>
                <div class="audio-card-actions">
                    <button class="icon-btn" onclick="App.playAudio('${file.id}')" title="تشغيل">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </button>
                    <button class="icon-btn" onclick="App.openShareModal('${file.id}')" title="مشاركة">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="18" cy="5" r="3"/>
                            <circle cx="6" cy="12" r="3"/>
                            <circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                    </button>
                    <button class="icon-btn" onclick="Embed.openEmbedModal('${file.id}')" title="كود التضمين">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 18 22 12 16 6"/>
                            <polyline points="8 6 2 12 8 18"/>
                        </svg>
                    </button>
                    <button class="icon-btn" onclick="App.showAddToPlaylistMenu('${file.id}')" title="إضافة لقائمة">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </button>
                    <button class="icon-btn" onclick="App.deleteAudio('${file.id}')" title="حذف">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    },

    // Play audio
    playAudio(audioId) {
        Player.play(audioId);
    },

    // Delete audio
    deleteAudio(audioId) {
        if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
            Storage.deleteAudioFile(audioId);
            this.renderLibrary();
            this.updateStorageInfo();
        }
    },

    // Show add to playlist menu
    showAddToPlaylistMenu(audioId) {
        const playlists = Storage.getPlaylists();

        if (playlists.length === 0) {
            alert('لا توجد قوائم تشغيل. قم بإنشاء قائمة أولاً');
            return;
        }

        const playlistNames = playlists.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
        const choice = prompt(`اختر قائمة التشغيل:\n${playlistNames}\n\nأدخل الرقم:`);

        if (choice) {
            const index = parseInt(choice) - 1;
            if (index >= 0 && index < playlists.length) {
                Storage.addAudioToPlaylist(playlists[index].id, audioId);
                alert('تمت الإضافة بنجاح');
            }
        }
    },

    // Setup modals
    setupModals() {
        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
    },

    // Open share modal
    openShareModal(audioId) {
        const audioFile = Storage.getAudioFile(audioId);
        if (!audioFile) return;

        // Generate share link (in real app, this would be actual URL)
        const shareLink = `${window.location.origin}/audio/${audioId}`;
        document.getElementById('shareLink').value = shareLink;

        openModal('shareModal');
    },

    // Setup playlists
    setupPlaylists() {
        document.getElementById('createPlaylistBtn').addEventListener('click', () => {
            openModal('createPlaylistModal');
        });

        document.getElementById('createPlaylistBtn2').addEventListener('click', () => {
            openModal('createPlaylistModal');
        });

        document.getElementById('savePlaylistBtn').addEventListener('click', () => {
            this.createPlaylist();
        });
    },

    // Create playlist
    createPlaylist() {
        const name = document.getElementById('playlistName').value.trim();
        const description = document.getElementById('playlistDescription').value.trim();

        if (!name) {
            alert('الرجاء إدخال اسم القائمة');
            return;
        }

        Storage.addPlaylist({ name, description });

        // Reset form
        document.getElementById('playlistName').value = '';
        document.getElementById('playlistDescription').value = '';

        closeModal('createPlaylistModal');
        this.renderPlaylists();

        if (this.currentView === 'playlists') {
            this.switchView('playlists');
        }
    },

    // Render playlists
    renderPlaylists() {
        const playlistsGrid = document.getElementById('playlistsGrid');
        const emptyState = document.getElementById('playlistsEmpty');
        const playlists = Storage.getPlaylists();

        if (playlists.length === 0) {
            playlistsGrid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            playlistsGrid.style.display = 'grid';
            emptyState.style.display = 'none';
            playlistsGrid.innerHTML = playlists.map(playlist => this.createPlaylistCard(playlist)).join('');
        }
    },

    // Create playlist card
    createPlaylistCard(playlist) {
        const audioCount = playlist.audioIds.length;

        return `
            <div class="playlist-card" onclick="App.openPlaylist('${playlist.id}')">
                <div class="playlist-icon">
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15V6M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM12 12H3M16 6H3M12 18H3"/>
                    </svg>
                </div>
                <h3>${playlist.name}</h3>
                ${playlist.description ? `<p>${playlist.description}</p>` : ''}
                <div class="playlist-count">${audioCount} ${audioCount === 1 ? 'ملف' : 'ملفات'}</div>
            </div>
        `;
    },

    // Open playlist
    openPlaylist(playlistId) {
        const playlist = Storage.getPlaylist(playlistId);
        if (!playlist) return;

        const audios = Storage.getPlaylistAudios(playlistId);

        if (audios.length === 0) {
            alert('القائمة فارغة');
            return;
        }

        // Play first audio in playlist
        Player.play(audios[0].id, playlistId);
    },

    // Setup settings
    setupSettings() {
        // Default theme
        document.getElementById('defaultTheme').addEventListener('change', (e) => {
            Storage.updateSettings({ theme: e.target.value });
        });

        // Default colors
        document.getElementById('defaultPrimaryColor').addEventListener('change', (e) => {
            Storage.updateSettings({ primaryColor: e.target.value });
        });

        document.getElementById('defaultSecondaryColor').addEventListener('change', (e) => {
            Storage.updateSettings({ secondaryColor: e.target.value });
        });

        // Default autoplay
        document.getElementById('defaultAutoplay').addEventListener('change', (e) => {
            Storage.updateSettings({ autoplay: e.target.checked });
        });

        // Default width/height
        document.getElementById('defaultWidth').addEventListener('change', (e) => {
            Storage.updateSettings({ embedWidth: parseInt(e.target.value) });
        });

        document.getElementById('defaultHeight').addEventListener('change', (e) => {
            Storage.updateSettings({ embedHeight: parseInt(e.target.value) });
        });

        // Default show controls
        document.getElementById('defaultShowControls').addEventListener('change', (e) => {
            Storage.updateSettings({ showControls: e.target.checked });
        });

        // Clear storage
        document.getElementById('clearStorageBtn').addEventListener('click', () => {
            if (Storage.clearAll()) {
                this.renderLibrary();
                this.renderPlaylists();
                this.updateStorageInfo();
                alert('تم مسح جميع البيانات');
            }
        });

        // Export data
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            Storage.exportData();
        });

        // Import data
        document.getElementById('importDataBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                try {
                    const success = await Storage.importData(e.target.files[0]);
                    if (success) {
                        alert('تم استيراد البيانات بنجاح');
                        this.renderLibrary();
                        this.renderPlaylists();
                        this.updateStorageInfo();
                        this.loadSettings();
                    }
                } catch (error) {
                    alert(error.message);
                }
                e.target.value = '';
            }
        });
    },

    // Load settings
    loadSettings() {
        const settings = Storage.getSettings();

        document.getElementById('defaultTheme').value = settings.theme;
        document.getElementById('defaultPrimaryColor').value = settings.primaryColor;
        document.getElementById('defaultSecondaryColor').value = settings.secondaryColor;
        document.getElementById('defaultAutoplay').checked = settings.autoplay;
        document.getElementById('defaultWidth').value = settings.embedWidth;
        document.getElementById('defaultHeight').value = settings.embedHeight;
        document.getElementById('defaultShowControls').checked = settings.showControls;
    },

    // Update storage info
    updateStorageInfo() {
        const info = Storage.getStorageInfo();

        document.getElementById('storageUsed').style.width = info.percentage + '%';
        document.getElementById('storageUsedText').textContent = info.used + ' MB';
        document.getElementById('storageTotalText').textContent = info.total + ' MB';
    }
};

// Global functions for inline handlers
function switchView(viewName) {
    App.switchView(viewName);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function copyToClipboard(inputId) {
    const input = document.getElementById(inputId);
    input.select();

    navigator.clipboard.writeText(input.value).then(() => {
        alert('تم النسخ!');
    }).catch(() => {
        document.execCommand('copy');
        alert('تم النسخ!');
    });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
