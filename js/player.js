// Audio Player Manager - Handles global audio playback
class AudioPlayerManager {
    constructor() {
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;

        this.audioElement = document.getElementById('audioElement');
        this.playerContainer = document.getElementById('globalPlayer');

        if (this.audioElement) {
            this.init();
        }
    }

    init() {
        // Player controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const closePlayerBtn = document.getElementById('closePlayerBtn');
        const progressSlider = document.getElementById('progressSlider');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeBtn = document.getElementById('volumeBtn');

        // Play/Pause
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }

        // Previous track
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.playPrevious();
            });
        }

        // Next track
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.playNext();
            });
        }

        // Close player
        if (closePlayerBtn) {
            closePlayerBtn.addEventListener('click', () => {
                this.stop();
            });
        }

        // Progress slider
        if (progressSlider) {
            progressSlider.addEventListener('input', (e) => {
                const time = (e.target.value / 100) * this.audioElement.duration;
                this.audioElement.currentTime = time;
            });
        }

        // Volume slider
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.audioElement.volume = e.target.value / 100;
            });
        }

        // Volume button (mute/unmute)
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => {
                this.toggleMute();
            });
        }

        // Audio element events
        this.audioElement.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audioElement.addEventListener('ended', () => {
            this.playNext();
        });

        this.audioElement.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayPauseButton();
        });

        this.audioElement.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayPauseButton();
        });

        // Load saved volume
        const settings = storage.getSettings();
        if (settings.defaultVolume) {
            this.audioElement.volume = settings.defaultVolume / 100;
            volumeSlider.value = settings.defaultVolume;
        }
    }

    playTrack(trackId, playlistTracks = null) {
        const track = storage.getAudioFileById(trackId);

        if (!track) {
            console.error('Track not found:', trackId);
            return;
        }

        this.currentTrack = track;

        // Set playlist
        if (playlistTracks) {
            this.playlist = playlistTracks;
            this.currentIndex = this.playlist.indexOf(trackId);
        } else {
            this.playlist = [trackId];
            this.currentIndex = 0;
        }

        // Load and play
        this.audioElement.src = track.fileData;
        this.audioElement.play();

        // Update UI
        this.showPlayer();
        this.updatePlayerInfo();

        // Increment play count
        storage.incrementPlays(trackId);
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.audioElement.pause();
        } else {
            this.audioElement.play();
        }
    }

    playNext() {
        if (this.playlist.length === 0) return;

        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.playTrack(this.playlist[this.currentIndex], this.playlist);
    }

    playPrevious() {
        if (this.playlist.length === 0) return;

        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.playTrack(this.playlist[this.currentIndex], this.playlist);
    }

    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.hidePlayer();
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = -1;
    }

    toggleMute() {
        this.audioElement.muted = !this.audioElement.muted;
        this.updateVolumeIcon();
    }

    showPlayer() {
        if (this.playerContainer) {
            this.playerContainer.classList.remove('hidden');
        }
    }

    hidePlayer() {
        if (this.playerContainer) {
            this.playerContainer.classList.add('hidden');
        }
    }

    updatePlayerInfo() {
        if (!this.currentTrack) return;

        const playerTitle = document.getElementById('playerTitle');
        const playerMeta = document.getElementById('playerMeta');

        if (playerTitle) {
            playerTitle.textContent = this.currentTrack.title;
        }

        if (playerMeta) {
            const duration = storage.formatDuration(this.currentTrack.duration);
            playerMeta.textContent = `00:00 / ${duration}`;
        }
    }

    updateProgress() {
        if (!this.audioElement.duration) return;

        const percentage = (this.audioElement.currentTime / this.audioElement.duration) * 100;

        const progressFill = document.getElementById('progressFill');
        const progressSlider = document.getElementById('progressSlider');
        const playerMeta = document.getElementById('playerMeta');

        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }

        if (progressSlider) {
            progressSlider.value = percentage;
        }

        if (playerMeta && this.currentTrack) {
            const current = storage.formatDuration(this.audioElement.currentTime);
            const total = storage.formatDuration(this.audioElement.duration);
            playerMeta.textContent = `${current} / ${total}`;
        }
    }

    updatePlayPauseButton() {
        const playIcon = document.getElementById('playIcon');
        const pauseIcon = document.getElementById('pauseIcon');

        if (this.isPlaying) {
            playIcon?.setAttribute('style', 'display: none;');
            pauseIcon?.setAttribute('style', 'display: block;');
        } else {
            playIcon?.setAttribute('style', 'display: block;');
            pauseIcon?.setAttribute('style', 'display: none;');
        }
    }

    updateVolumeIcon() {
        const volumeIcon = document.getElementById('volumeIcon');

        if (!volumeIcon) return;

        if (this.audioElement.muted || this.audioElement.volume === 0) {
            volumeIcon.innerHTML = '<path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>';
        } else {
            volumeIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>';
        }
    }
}

// Create global instance
let audioPlayer;

document.addEventListener('DOMContentLoaded', () => {
    audioPlayer = new AudioPlayerManager();
});
