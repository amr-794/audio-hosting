// Storage Management for Audio Hosting Platform
// Handles localStorage operations for audio files, playlists, and settings

const Storage = {
    // Keys
    KEYS: {
        AUDIO_FILES: 'audioFiles',
        PLAYLISTS: 'playlists',
        SETTINGS: 'settings',
        CURRENT_AUDIO: 'currentAudio'
    },

    // Initialize storage
    init() {
        if (!localStorage.getItem(this.KEYS.AUDIO_FILES)) {
            localStorage.setItem(this.KEYS.AUDIO_FILES, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.PLAYLISTS)) {
            localStorage.setItem(this.KEYS.PLAYLISTS, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            this.setSettings(this.getDefaultSettings());
        }
    },

    // Default settings
    getDefaultSettings() {
        return {
            theme: 'dark',
            primaryColor: '#667eea',
            secondaryColor: '#764ba2',
            autoplay: false,
            embedWidth: 100,
            embedWidthUnit: '%',
            embedHeight: 120,
            showControls: true,
            showTime: true
        };
    },

    // Audio Files Operations
    getAudioFiles() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.AUDIO_FILES)) || [];
        } catch (e) {
            console.error('Error getting audio files:', e);
            return [];
        }
    },

    addAudioFile(audioData) {
        try {
            const files = this.getAudioFiles();
            const newFile = {
                id: this.generateId(),
                name: audioData.name,
                size: audioData.size,
                type: audioData.type,
                duration: audioData.duration || 0,
                data: audioData.data, // Base64 data URL
                uploadedAt: new Date().toISOString(),
                plays: 0
            };
            files.push(newFile);
            localStorage.setItem(this.KEYS.AUDIO_FILES, JSON.stringify(files));
            return newFile;
        } catch (e) {
            console.error('Error adding audio file:', e);
            if (e.name === 'QuotaExceededError') {
                throw new Error('التخزين ممتلئ! الرجاء حذف بعض الملفات.');
            }
            throw e;
        }
    },

    getAudioFile(id) {
        const files = this.getAudioFiles();
        return files.find(file => file.id === id);
    },

    updateAudioFile(id, updates) {
        const files = this.getAudioFiles();
        const index = files.findIndex(file => file.id === id);
        if (index !== -1) {
            files[index] = { ...files[index], ...updates };
            localStorage.setItem(this.KEYS.AUDIO_FILES, JSON.stringify(files));
            return files[index];
        }
        return null;
    },

    deleteAudioFile(id) {
        const files = this.getAudioFiles();
        const filtered = files.filter(file => file.id !== id);
        localStorage.setItem(this.KEYS.AUDIO_FILES, JSON.stringify(filtered));
        
        // Also remove from playlists
        const playlists = this.getPlaylists();
        playlists.forEach(playlist => {
            playlist.audioIds = playlist.audioIds.filter(audioId => audioId !== id);
        });
        localStorage.setItem(this.KEYS.PLAYLISTS, JSON.stringify(playlists));
    },

    incrementPlays(id) {
        const file = this.getAudioFile(id);
        if (file) {
            this.updateAudioFile(id, { plays: (file.plays || 0) + 1 });
        }
    },

    // Playlists Operations
    getPlaylists() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.PLAYLISTS)) || [];
        } catch (e) {
            console.error('Error getting playlists:', e);
            return [];
        }
    },

    addPlaylist(playlistData) {
        const playlists = this.getPlaylists();
        const newPlaylist = {
            id: this.generateId(),
            name: playlistData.name,
            description: playlistData.description || '',
            audioIds: playlistData.audioIds || [],
            createdAt: new Date().toISOString()
        };
        playlists.push(newPlaylist);
        localStorage.setItem(this.KEYS.PLAYLISTS, JSON.stringify(playlists));
        return newPlaylist;
    },

    getPlaylist(id) {
        const playlists = this.getPlaylists();
        return playlists.find(playlist => playlist.id === id);
    },

    updatePlaylist(id, updates) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(playlist => playlist.id === id);
        if (index !== -1) {
            playlists[index] = { ...playlists[index], ...updates };
            localStorage.setItem(this.KEYS.PLAYLISTS, JSON.stringify(playlists));
            return playlists[index];
        }
        return null;
    },

    deletePlaylist(id) {
        const playlists = this.getPlaylists();
        const filtered = playlists.filter(playlist => playlist.id !== id);
        localStorage.setItem(this.KEYS.PLAYLISTS, JSON.stringify(filtered));
    },

    addAudioToPlaylist(playlistId, audioId) {
        const playlist = this.getPlaylist(playlistId);
        if (playlist && !playlist.audioIds.includes(audioId)) {
            playlist.audioIds.push(audioId);
            this.updatePlaylist(playlistId, playlist);
        }
    },

    removeAudioFromPlaylist(playlistId, audioId) {
        const playlist = this.getPlaylist(playlistId);
        if (playlist) {
            playlist.audioIds = playlist.audioIds.filter(id => id !== audioId);
            this.updatePlaylist(playlistId, playlist);
        }
    },

    getPlaylistAudios(playlistId) {
        const playlist = this.getPlaylist(playlistId);
        if (!playlist) return [];
        
        const audioFiles = this.getAudioFiles();
        return playlist.audioIds
            .map(id => audioFiles.find(file => file.id === id))
            .filter(file => file !== undefined);
    },

    // Settings Operations
    getSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem(this.KEYS.SETTINGS));
            return { ...this.getDefaultSettings(), ...settings };
        } catch (e) {
            console.error('Error getting settings:', e);
            return this.getDefaultSettings();
        }
    },

    setSettings(settings) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
    },

    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        this.setSettings(newSettings);
        return newSettings;
    },

    // Current Audio (for player state)
    getCurrentAudio() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.CURRENT_AUDIO));
        } catch (e) {
            return null;
        }
    },

    setCurrentAudio(audioId, playlistId = null) {
        localStorage.setItem(this.KEYS.CURRENT_AUDIO, JSON.stringify({
            audioId,
            playlistId,
            timestamp: new Date().toISOString()
        }));
    },

    // Storage Info
    getStorageInfo() {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length + key.length;
            }
        }
        
        // Convert to MB
        const usedMB = (totalSize / (1024 * 1024)).toFixed(2);
        const totalMB = 5; // Approximate localStorage limit
        const percentage = ((usedMB / totalMB) * 100).toFixed(1);
        
        return {
            used: usedMB,
            total: totalMB,
            percentage: percentage,
            available: (totalMB - usedMB).toFixed(2)
        };
    },

    // Clear all data
    clearAll() {
        if (confirm('هل أنت متأكد من حذف جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
            localStorage.removeItem(this.KEYS.AUDIO_FILES);
            localStorage.removeItem(this.KEYS.PLAYLISTS);
            localStorage.removeItem(this.KEYS.CURRENT_AUDIO);
            this.init();
            return true;
        }
        return false;
    },

    // Export data
    exportData() {
        const data = {
            audioFiles: this.getAudioFiles(),
            playlists: this.getPlaylists(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `audio-hosting-backup-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    },

    // Import data
    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate data structure
                    if (!data.audioFiles || !data.playlists || !data.settings) {
                        throw new Error('ملف غير صالح');
                    }
                    
                    // Confirm import
                    if (confirm('سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟')) {
                        localStorage.setItem(this.KEYS.AUDIO_FILES, JSON.stringify(data.audioFiles));
                        localStorage.setItem(this.KEYS.PLAYLISTS, JSON.stringify(data.playlists));
                        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data.settings));
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                } catch (e) {
                    reject(new Error('فشل استيراد البيانات: ' + e.message));
                }
            };
            
            reader.onerror = () => reject(new Error('فشل قراءة الملف'));
            reader.readAsText(file);
        });
    },

    // Search audio files
    searchAudioFiles(query) {
        const files = this.getAudioFiles();
        const lowerQuery = query.toLowerCase();
        return files.filter(file => 
            file.name.toLowerCase().includes(lowerQuery)
        );
    },

    // Sort audio files
    sortAudioFiles(files, sortBy) {
        const sorted = [...files];
        
        switch (sortBy) {
            case 'newest':
                return sorted.sort((a, b) => 
                    new Date(b.uploadedAt) - new Date(a.uploadedAt)
                );
            case 'oldest':
                return sorted.sort((a, b) => 
                    new Date(a.uploadedAt) - new Date(b.uploadedAt)
                );
            case 'name':
                return sorted.sort((a, b) => 
                    a.name.localeCompare(b.name, 'ar')
                );
            case 'size':
                return sorted.sort((a, b) => b.size - a.size);
            default:
                return sorted;
        }
    },

    // Utility: Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Utility: Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    // Utility: Format duration
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

// Initialize storage on load
Storage.init();
