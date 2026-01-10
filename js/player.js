/**
 * Audio Player
 * Custom audio player with controls
 */

class AudioPlayer {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            onPlay: null,
            onPause: null,
            onEnded: null,
            onTimeUpdate: null,
            ...options
        };

        this.audio = new Audio();
        this.currentTrack = null;
        this.playlist = [];
        this.playlistIndex = 0;
        this.isPlaying = false;

        this.init();
    }

    init() {
        this.audio.volume = CONFIG?.DEFAULT_VOLUME || 0.8;
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            if (this.options.onPlay) this.options.onPlay(this.currentTrack);
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            if (this.options.onPause) this.options.onPause(this.currentTrack);
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            if (this.playlistIndex < this.playlist.length - 1) {
                this.next();
            } else if (this.options.onEnded) {
                this.options.onEnded(this.currentTrack);
            }
        });

        this.audio.addEventListener('timeupdate', () => {
            this.updateProgress();
            if (this.options.onTimeUpdate) {
                this.options.onTimeUpdate(this.audio.currentTime, this.audio.duration);
            }
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateDuration();
        });
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="audio-player" id="playerMain">
                <div class="player-content">
                    <div class="player-cover" id="playerCover">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                        </svg>
                    </div>
                    <div class="player-info">
                        <div class="player-title" id="playerTitle">No audio selected</div>
                        <div class="player-artist" id="playerArtist"></div>
                    </div>
                </div>
                <div class="player-progress-section">
                    <div class="player-progress-bar" id="progressBar">
                        <div class="player-progress-fill" id="progressFill"></div>
                    </div>
                    <div class="player-time">
                        <span id="currentTime">0:00</span>
                        <span id="duration">0:00</span>
                    </div>
                </div>
                <div class="player-controls">
                    <button class="player-btn" id="prevBtn" title="Previous">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4"/><line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                    <button class="player-btn player-btn-main" id="playBtn" title="Play/Pause">
                        <svg id="playIcon" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21"/></svg>
                    </button>
                    <button class="player-btn" id="nextBtn" title="Next">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20"/><line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" stroke-width="2"/></svg>
                    </button>
                    <div class="player-volume">
                        <button class="player-btn" id="volumeBtn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        </button>
                        <input type="range" class="player-volume-slider" id="volumeSlider" min="0" max="100" value="80">
                    </div>
                </div>
            </div>
        `;

        this.bindUIEvents();
    }

    bindUIEvents() {
        const playBtn = document.getElementById('playBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const progressBar = document.getElementById('progressBar');
        const volumeSlider = document.getElementById('volumeSlider');

        if (playBtn) playBtn.onclick = () => this.togglePlay();
        if (prevBtn) prevBtn.onclick = () => this.prev();
        if (nextBtn) nextBtn.onclick = () => this.next();

        if (progressBar) {
            progressBar.onclick = (e) => {
                const rect = progressBar.getBoundingClientRect();
                const pos = (e.clientX - rect.left) / rect.width;
                if (this.audio.duration) {
                    this.audio.currentTime = pos * this.audio.duration;
                }
            };
        }

        if (volumeSlider) {
            volumeSlider.oninput = (e) => {
                this.audio.volume = e.target.value / 100;
            };
        }
    }

    loadTrack(track) {
        this.currentTrack = track;
        this.audio.src = track.github_url;

        // Update UI
        const title = document.getElementById('playerTitle');
        const artist = document.getElementById('playerArtist');
        const cover = document.getElementById('playerCover');

        if (title) title.textContent = track.title;
        if (artist) artist.textContent = track.artist || '';

        if (cover) {
            if (track.cover_url) {
                cover.innerHTML = `<img src="${track.cover_url}" alt="">`;
            } else {
                cover.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
            }
        }

        // Track play count
        if (track.id && window.api) {
            window.api.trackPlay(track.id).catch(() => { });
        }
    }

    loadPlaylist(tracks, startIndex = 0) {
        this.playlist = tracks;
        this.playlistIndex = startIndex;
        if (tracks.length > 0) {
            this.loadTrack(tracks[startIndex]);
        }
    }

    play() {
        if (this.audio.src) {
            this.audio.play();
        }
    }

    pause() {
        this.audio.pause();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    next() {
        if (this.playlist.length > 0 && this.playlistIndex < this.playlist.length - 1) {
            this.playlistIndex++;
            this.loadTrack(this.playlist[this.playlistIndex]);
            this.play();
        }
    }

    prev() {
        if (this.playlist.length > 0 && this.playlistIndex > 0) {
            this.playlistIndex--;
            this.loadTrack(this.playlist[this.playlistIndex]);
            this.play();
        }
    }

    updatePlayButton() {
        const playIcon = document.getElementById('playIcon');
        if (playIcon) {
            if (this.isPlaying) {
                playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
            } else {
                playIcon.innerHTML = '<polygon points="5 3 19 12 5 21"/>';
            }
        }
    }

    updateProgress() {
        const fill = document.getElementById('progressFill');
        const current = document.getElementById('currentTime');

        if (fill && this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            fill.style.width = percent + '%';
        }

        if (current) {
            current.textContent = formatDuration(this.audio.currentTime);
        }
    }

    updateDuration() {
        const duration = document.getElementById('duration');
        if (duration && this.audio.duration) {
            duration.textContent = formatDuration(this.audio.duration);
        }
    }
}

// Export
window.AudioPlayer = AudioPlayer;
