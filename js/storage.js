// Storage Manager - Handles all data persistence using localStorage and JSON
class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            AUDIO_FILES: 'audioHosting_files',
            PLAYLISTS: 'audioHosting_playlists',
            SETTINGS: 'audioHosting_settings'
        };

        this.initializeStorage();
    }

    // Initialize storage with default data if empty
    initializeStorage() {
        if (!localStorage.getItem(this.STORAGE_KEYS.AUDIO_FILES)) {
            this.saveAudioFiles([]);
        }

        if (!localStorage.getItem(this.STORAGE_KEYS.PLAYLISTS)) {
            this.savePlaylists([]);
        }

        if (!localStorage.getItem(this.STORAGE_KEYS.SETTINGS)) {
            this.saveSettings(this.getDefaultSettings());
        }
    }

    // Default settings
    getDefaultSettings() {
        return {
            theme: 'dark',
            playerTheme: 'gradient',
            autoPlay: false,
            defaultVolume: 70,
            embedDefaults: {
                width: 600,
                height: 150,
                theme: 'dark',
                controls: true,
                autoplay: false
            }
        };
    }

    // Audio Files Management
    getAudioFiles() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.AUDIO_FILES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading audio files:', error);
            return [];
        }
    }

    saveAudioFiles(files) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.AUDIO_FILES, JSON.stringify(files));
            return true;
        } catch (error) {
            console.error('Error saving audio files:', error);
            return false;
        }
    }

    addAudioFile(fileData) {
        const files = this.getAudioFiles();
        const newFile = {
            id: this.generateId(),
            title: fileData.title,
            filename: fileData.filename,
            fileSize: fileData.fileSize,
            duration: fileData.duration || 0,
            uploadDate: new Date().toISOString(),
            plays: 0,
            fileData: fileData.fileData // base64 or blob URL
        };

        files.push(newFile);
        this.saveAudioFiles(files);
        return newFile;
    }

    getAudioFileById(id) {
        const files = this.getAudioFiles();
        return files.find(file => file.id === id);
    }

    updateAudioFile(id, updates) {
        const files = this.getAudioFiles();
        const index = files.findIndex(file => file.id === id);

        if (index !== -1) {
            files[index] = { ...files[index], ...updates };
            this.saveAudioFiles(files);
            return files[index];
        }

        return null;
    }

    deleteAudioFile(id) {
        const files = this.getAudioFiles();
        const filtered = files.filter(file => file.id !== id);
        this.saveAudioFiles(filtered);

        // Also remove from playlists
        const playlists = this.getPlaylists();
        playlists.forEach(playlist => {
            playlist.tracks = playlist.tracks.filter(trackId => trackId !== id);
        });
        this.savePlaylists(playlists);

        return true;
    }

    incrementPlays(id) {
        const file = this.getAudioFileById(id);
        if (file) {
            file.plays = (file.plays || 0) + 1;
            this.updateAudioFile(id, { plays: file.plays });
        }
    }

    // Playlists Management
    getPlaylists() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.PLAYLISTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading playlists:', error);
            return [];
        }
    }

    savePlaylists(playlists) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
            return true;
        } catch (error) {
            console.error('Error saving playlists:', error);
            return false;
        }
    }

    addPlaylist(playlistData) {
        const playlists = this.getPlaylists();
        const newPlaylist = {
            id: this.generateId(),
            name: playlistData.name,
            description: playlistData.description || '',
            tracks: playlistData.tracks || [],
            createdDate: new Date().toISOString()
        };

        playlists.push(newPlaylist);
        this.savePlaylists(playlists);
        return newPlaylist;
    }

    getPlaylistById(id) {
        const playlists = this.getPlaylists();
        return playlists.find(playlist => playlist.id === id);
    }

    updatePlaylist(id, updates) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(playlist => playlist.id === id);

        if (index !== -1) {
            playlists[index] = { ...playlists[index], ...updates };
            this.savePlaylists(playlists);
            return playlists[index];
        }

        return null;
    }

    deletePlaylist(id) {
        const playlists = this.getPlaylists();
        const filtered = playlists.filter(playlist => playlist.id !== id);
        this.savePlaylists(filtered);
        return true;
    }

    addTrackToPlaylist(playlistId, trackId) {
        const playlist = this.getPlaylistById(playlistId);
        if (playlist && !playlist.tracks.includes(trackId)) {
            playlist.tracks.push(trackId);
            this.updatePlaylist(playlistId, { tracks: playlist.tracks });
            return true;
        }
        return false;
    }

    removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.getPlaylistById(playlistId);
        if (playlist) {
            playlist.tracks = playlist.tracks.filter(id => id !== trackId);
            this.updatePlaylist(playlistId, { tracks: playlist.tracks });
            return true;
        }
        return false;
    }

    reorderPlaylistTracks(playlistId, trackIds) {
        return this.updatePlaylist(playlistId, { tracks: trackIds });
    }

    // Settings Management
    getSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        this.saveSettings(newSettings);
        return newSettings;
    }

    // Data Export/Import
    exportData() {
        const data = {
            audioFiles: this.getAudioFiles(),
            playlists: this.getPlaylists(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        return JSON.stringify(data, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            if (data.audioFiles) {
                this.saveAudioFiles(data.audioFiles);
            }

            if (data.playlists) {
                this.savePlaylists(data.playlists);
            }

            if (data.settings) {
                this.saveSettings(data.settings);
            }

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    clearAllData() {
        localStorage.removeItem(this.STORAGE_KEYS.AUDIO_FILES);
        localStorage.removeItem(this.STORAGE_KEYS.PLAYLISTS);
        localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
        this.initializeStorage();
        return true;
    }

    // Statistics
    getStatistics() {
        const files = this.getAudioFiles();
        const playlists = this.getPlaylists();

        const totalPlays = files.reduce((sum, file) => sum + (file.plays || 0), 0);
        const totalSize = files.reduce((sum, file) => sum + (file.fileSize || 0), 0);

        return {
            totalFiles: files.length,
            totalPlaylists: playlists.length,
            totalPlays: totalPlays,
            totalSize: totalSize,
            storageUsed: this.getStorageSize()
        };
    }

    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }

    // Utility Functions
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            return date.toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } else if (days > 0) {
            return `منذ ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
        } else if (hours > 0) {
            return `منذ ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`;
        } else if (minutes > 0) {
            return `منذ ${minutes} ${minutes === 1 ? 'دقيقة' : 'دقائق'}`;
        } else {
            return 'الآن';
        }
    }
}

// Create global instance
const storage = new StorageManager();
