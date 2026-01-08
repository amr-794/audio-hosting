// Audio Player Management
// Handles global audio player functionality

const Player = {
    audio: null,
    currentAudio: null,
    currentPlaylist: null,
    isPlaying: false,

    // Initialize player
    init() {
        this.audio = document.getElementById('audioElement');
        this.setupEventListeners();
        this.loadLastPlayed();
    },

    // Setup event listeners
    setupEventListeners() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeSlider = document.getElementById('volumeSlider');
        const progressTrack = document.getElementById('progressTrack');

        // Play/Pause
        playPauseBtn.addEventListener('click', () => this.togglePlayPause());

        // Previous/Next
        prevBtn.addEventListener('click', () => this.playPrevious());
        nextBtn.addEventListener('click', () => this.playNext());

        // Volume
        volumeBtn.addEventListener('click', () => this.toggleMute());
        volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Progress
        progressTrack.addEventListener('click', (e) => {
            const rect = progressTrack.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.seek(percent);
        });

        // Audio events
        this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audio.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.audio.addEventListener('ended', () => this.onEnded());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.onError(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.togglePlayPause();
            }
        });
    },

    // Load audio file
    loadAudio(audioId, playlistId = null) {
        const audioFile = Storage.getAudioFile(audioId);
        if (!audioFile) {
            console.error('Audio file not found');
            return;
        }

        this.currentAudio = audioFile;
        this.currentPlaylist = playlistId;

        // Set audio source
        this.audio.src = audioFile.data;

        // Update UI
        this.showPlayer();
        this.updatePlayerInfo();

        // Save current audio
        Storage.setCurrentAudio(audioId, playlistId);

        // Increment play count
        Storage.incrementPlays(audioId);
    },

    // Play audio
    play(audioId, playlistId = null) {
        if (this.currentAudio?.id !== audioId) {
            this.loadAudio(audioId, playlistId);
        }

        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Playback error:', error);
            });
        }
    },

    // Pause audio
    pause() {
        this.audio.pause();
    },

    // Toggle play/pause
    togglePlayPause() {
        if (!this.currentAudio) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            this.audio.play();
        }
    },

    // Play next track
    playNext() {
        if (!this.currentPlaylist) return;

        const playlist = Storage.getPlaylist(this.currentPlaylist);
        if (!playlist) return;

        const currentIndex = playlist.audioIds.indexOf(this.currentAudio.id);
        const nextIndex = (currentIndex + 1) % playlist.audioIds.length;
        const nextAudioId = playlist.audioIds[nextIndex];

        this.play(nextAudioId, this.currentPlaylist);
    },

    // Play previous track
    playPrevious() {
        if (!this.currentPlaylist) return;

        const playlist = Storage.getPlaylist(this.currentPlaylist);
        if (!playlist) return;

        const currentIndex = playlist.audioIds.indexOf(this.currentAudio.id);
        const prevIndex = currentIndex === 0 ? playlist.audioIds.length - 1 : currentIndex - 1;
        const prevAudioId = playlist.audioIds[prevIndex];

        this.play(prevAudioId, this.currentPlaylist);
    },

    // Seek to position
    seek(percent) {
        if (!this.audio.duration) return;
        this.audio.currentTime = this.audio.duration * percent;
    },

    // Set volume
    setVolume(volume) {
        this.audio.volume = Math.max(0, Math.min(1, volume));
        document.getElementById('volumeSlider').value = volume * 100;
        this.updateVolumeIcon();
    },

    // Toggle mute
    toggleMute() {
        this.audio.muted = !this.audio.muted;
        this.updateVolumeIcon();
    },

    // Update volume icon
    updateVolumeIcon() {
        const volumeIcon = document.getElementById('volumeIcon');
        const muteIcon = document.getElementById('muteIcon');

        if (this.audio.muted || this.audio.volume === 0) {
            volumeIcon.style.display = 'none';
            muteIcon.style.display = 'block';
        } else {
            volumeIcon.style.display = 'block';
            muteIcon.style.display = 'none';
        }
    },

    // Show player
    showPlayer() {
        document.getElementById('globalPlayer').style.display = 'block';
    },

    // Hide player
    hidePlayer() {
        document.getElementById('globalPlayer').style.display = 'none';
    },

    // Update player info
    updatePlayerInfo() {
        if (!this.currentAudio) return;

        document.getElementById('playerTitle').textContent = this.currentAudio.name;
        this.updateTimeDisplay();
    },

    // Update time display
    updateTimeDisplay() {
        const current = Storage.formatDuration(this.audio.currentTime);
        const duration = Storage.formatDuration(this.audio.duration);
        document.getElementById('playerTime').textContent = `${current} / ${duration}`;
    },

    // Update progress bar
    updateProgress() {
        if (!this.audio.duration) return;

        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        const progressFill = document.getElementById('progressFill');
        const progressHandle = document.getElementById('progressHandle');

        progressFill.style.width = percent + '%';
        progressHandle.style.left = percent + '%';
    },

    // Event: Loaded metadata
    onLoadedMetadata() {
        this.updateTimeDisplay();
        this.updateProgress();
    },

    // Event: Time update
    onTimeUpdate() {
        this.updateTimeDisplay();
        this.updateProgress();
    },

    // Event: Ended
    onEnded() {
        if (this.currentPlaylist) {
            // Auto-play next track in playlist
            this.playNext();
        } else {
            this.isPlaying = false;
            this.updatePlayPauseButton();
        }
    },

    // Event: Play
    onPlay() {
        this.isPlaying = true;
        this.updatePlayPauseButton();
    },

    // Event: Pause
    onPause() {
        this.isPlaying = false;
        this.updatePlayPauseButton();
    },

    // Event: Error
    onError(e) {
        console.error('Audio error:', e);
        alert('حدث خطأ في تشغيل الملف الصوتي');
    },

    // Update play/pause button
    updatePlayPauseButton() {
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');

        if (this.isPlaying) {
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        } else {
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        }
    },

    // Load last played audio
    loadLastPlayed() {
        const currentAudio = Storage.getCurrentAudio();
        if (currentAudio && currentAudio.audioId) {
            const audioFile = Storage.getAudioFile(currentAudio.audioId);
            if (audioFile) {
                this.loadAudio(currentAudio.audioId, currentAudio.playlistId);
                // Don't auto-play, just load
            }
        }
    },

    // Get current time
    getCurrentTime() {
        return this.audio.currentTime;
    },

    // Get duration
    getDuration() {
        return this.audio.duration;
    },

    // Check if playing
    getIsPlaying() {
        return this.isPlaying;
    }
};

// Initialize player when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Player.init());
} else {
    Player.init();
}
