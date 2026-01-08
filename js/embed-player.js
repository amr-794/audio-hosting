// Embed Player - Standalone player for iframe embedding
class EmbedPlayer {
    constructor() {
        this.fileId = null;
        this.settings = {
            width: 600,
            height: 150,
            theme: 'dark',
            autoplay: false,
            controls: true
        };

        this.audio = null;
        this.isPlaying = false;

        this.init();
    }

    init() {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);

        this.fileId = urlParams.get('id');
        this.settings.width = parseInt(urlParams.get('width')) || 600;
        this.settings.height = parseInt(urlParams.get('height')) || 150;
        this.settings.theme = urlParams.get('theme') || 'dark';
        this.settings.autoplay = urlParams.get('autoplay') === 'true';
        this.settings.controls = urlParams.get('controls') !== 'false';

        if (!this.fileId) {
            this.showError('معرف الملف غير موجود');
            return;
        }

        // Load and display player
        this.loadPlayer();
    }

    loadPlayer() {
        const file = storage.getAudioFileById(this.fileId);

        if (!file) {
            this.showError('الملف غير موجود');
            return;
        }

        const container = document.getElementById('embedPlayer');
        if (!container) return;

        // Create player HTML
        container.innerHTML = this.generatePlayerHTML(file);

        // Initialize audio
        this.audio = document.getElementById('embedAudio');
        if (!this.audio) {
            this.audio = document.createElement('audio');
            this.audio.id = 'embedAudio';
            this.audio.src = file.fileData;
            container.appendChild(this.audio);
        } else {
            this.audio.src = file.fileData;
        }

        // Setup event listeners
        this.setupEventListeners();

        // Autoplay if enabled
        if (this.settings.autoplay) {
            this.audio.play().catch(err => {
                console.log('Autoplay prevented:', err);
            });
        }

        // Increment play count
        storage.incrementPlays(this.fileId);
    }

    generatePlayerHTML(file) {
        const themeClass = `theme-${this.settings.theme}`;

        return `
            <div class="embed-player ${themeClass}">
                <div class="embed-player-info">
                    <div class="embed-artwork">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
                        </svg>
                    </div>
                    <div class="embed-details">
                        <div class="embed-title">${this.escapeHtml(file.title)}</div>
                        <div class="embed-duration">${this.formatDuration(file.duration)}</div>
                    </div>
                </div>
                ${this.settings.controls ? this.generateControlsHTML() : ''}
            </div>
        `;
    }

    generateControlsHTML() {
        return `
            <div class="embed-controls">
                <button class="embed-play-btn" id="embedPlayBtn">
                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                </button>
                <div class="embed-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="embedProgressFill"></div>
                        <input type="range" class="progress-slider" id="embedProgressSlider" min="0" max="100" value="0">
                    </div>
                    <div class="embed-time">
                        <span class="current-time" id="embedCurrentTime">00:00</span>
                        <span class="total-time" id="embedTotalTime">00:00</span>
                    </div>
                </div>
                <div class="embed-volume-control">
                    <button class="control-btn volume-btn" id="embedVolumeBtn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                    </button>
                    <input type="range" class="volume-slider" id="embedVolumeSlider" min="0" max="100" value="70">
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        if (!this.settings.controls || !this.audio) return;

        const playBtn = document.getElementById('embedPlayBtn');
        const progressSlider = document.getElementById('embedProgressSlider');
        const volumeSlider = document.getElementById('embedVolumeSlider');
        const volumeBtn = document.getElementById('embedVolumeBtn');

        // Play/Pause
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.togglePlayPause();
            });
        }

        // Progress
        if (progressSlider) {
            progressSlider.addEventListener('input', (e) => {
                const time = (e.target.value / 100) * this.audio.duration;
                this.audio.currentTime = time;
            });
        }

        // Volume
        if (volumeSlider) {
            this.audio.volume = 0.7;
            volumeSlider.addEventListener('input', (e) => {
                this.audio.volume = e.target.value / 100;
            });
        }

        // Volume button (mute/unmute)
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => {
                this.audio.muted = !this.audio.muted;
            });
        }

        // Audio events
        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
        });

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        this.audio.addEventListener('loadedmetadata', () => {
            const totalTime = document.getElementById('embedTotalTime');
            if (totalTime) {
                totalTime.textContent = this.formatDuration(this.audio.duration);
            }
        });
    }

    togglePlayPause() {
        if (!this.audio) return;

        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }

    updateProgress() {
        if (!this.audio || !this.audio.duration) return;

        const percentage = (this.audio.currentTime / this.audio.duration) * 100;

        const progressFill = document.getElementById('embedProgressFill');
        const progressSlider = document.getElementById('embedProgressSlider');
        const currentTime = document.getElementById('embedCurrentTime');

        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }

        if (progressSlider) {
            progressSlider.value = percentage;
        }

        if (currentTime) {
            currentTime.textContent = this.formatDuration(this.audio.currentTime);
        }
    }

    updatePlayButton() {
        const playIcon = document.querySelector('.play-icon');
        const pauseIcon = document.querySelector('.pause-icon');

        if (this.isPlaying) {
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
        } else {
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
        }
    }

    showError(message) {
        const container = document.getElementById('embedPlayer');
        if (container) {
            container.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 48px; height: 48px; margin: 0 auto 1rem;">
                        <circle cx="12" cy="12" r="10" stroke-width="2"/>
                        <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" stroke-linecap="round"/>
                        <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';

        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);

        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const embedPlayer = new EmbedPlayer();
});
