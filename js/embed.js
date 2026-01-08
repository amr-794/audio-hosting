// Embed Code Generator - Handles embed code generation and live preview
class EmbedManager {
    constructor() {
        this.currentFileId = null;
        this.embedSettings = {
            width: 600,
            height: 150,
            theme: 'dark',
            autoplay: false,
            controls: true
        };

        this.init();
    }

    init() {
        const shareModal = document.getElementById('shareModal');
        const closeShareModal = document.getElementById('closeShareModal');

        // Close modal
        if (closeShareModal) {
            closeShareModal.addEventListener('click', () => {
                this.closeShareModal();
            });
        }

        // Close on outside click
        if (shareModal) {
            shareModal.addEventListener('click', (e) => {
                if (e.target === shareModal) {
                    this.closeShareModal();
                }
            });
        }

        // Share tabs
        const shareTabs = document.querySelectorAll('.share-tab');
        shareTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });

        // Embed options - live update
        const embedWidth = document.getElementById('embedWidth');
        const embedHeight = document.getElementById('embedHeight');
        const embedTheme = document.getElementById('embedTheme');
        const embedAutoplay = document.getElementById('embedAutoplay');
        const embedControls = document.getElementById('embedControls');

        if (embedWidth) {
            embedWidth.addEventListener('input', () => {
                this.embedSettings.width = parseInt(embedWidth.value);
                this.updateEmbedPreview();
                this.updateEmbedCode();
            });
        }

        if (embedHeight) {
            embedHeight.addEventListener('input', () => {
                this.embedSettings.height = parseInt(embedHeight.value);
                this.updateEmbedPreview();
                this.updateEmbedCode();
            });
        }

        if (embedTheme) {
            embedTheme.addEventListener('change', () => {
                this.embedSettings.theme = embedTheme.value;
                this.updateEmbedPreview();
                this.updateEmbedCode();
            });
        }

        if (embedAutoplay) {
            embedAutoplay.addEventListener('change', () => {
                this.embedSettings.autoplay = embedAutoplay.checked;
                this.updateEmbedCode();
            });
        }

        if (embedControls) {
            embedControls.addEventListener('change', () => {
                this.embedSettings.controls = embedControls.checked;
                this.updateEmbedPreview();
                this.updateEmbedCode();
            });
        }

        // Copy buttons
        const copyEmbedBtn = document.getElementById('copyEmbedBtn');
        const copyDirectBtn = document.getElementById('copyDirectBtn');
        const copyHtmlBtn = document.getElementById('copyHtmlBtn');

        if (copyEmbedBtn) {
            copyEmbedBtn.addEventListener('click', () => {
                this.copyToClipboard('embedCode');
            });
        }

        if (copyDirectBtn) {
            copyDirectBtn.addEventListener('click', () => {
                this.copyToClipboard('directLink');
            });
        }

        if (copyHtmlBtn) {
            copyHtmlBtn.addEventListener('click', () => {
                this.copyToClipboard('htmlCode');
            });
        }
    }

    openShareModal(fileId) {
        this.currentFileId = fileId;

        const file = storage.getAudioFileById(fileId);
        if (!file) {
            console.error('File not found:', fileId);
            return;
        }

        // Load default settings
        const settings = storage.getSettings();
        if (settings.embedDefaults) {
            this.embedSettings = { ...settings.embedDefaults };

            // Update UI
            document.getElementById('embedWidth').value = this.embedSettings.width;
            document.getElementById('embedHeight').value = this.embedSettings.height;
            document.getElementById('embedTheme').value = this.embedSettings.theme;
            document.getElementById('embedAutoplay').checked = this.embedSettings.autoplay;
            document.getElementById('embedControls').checked = this.embedSettings.controls;
        }

        // Generate codes
        this.updateEmbedPreview();
        this.updateEmbedCode();
        this.updateDirectLink();
        this.updateHtmlCode();

        // Show modal
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentFileId = null;
    }

    switchTab(tabName) {
        // Update tabs
        document.querySelectorAll('.share-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');

        // Update panels
        document.querySelectorAll('.share-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.querySelector(`[data-panel="${tabName}"]`)?.classList.add('active');
    }

    updateEmbedPreview() {
        const preview = document.getElementById('embedPreview');
        if (!preview || !this.currentFileId) return;

        const file = storage.getAudioFileById(this.currentFileId);
        if (!file) return;

        // Create preview player
        const playerHTML = this.generatePlayerHTML(file);
        preview.innerHTML = playerHTML;

        // Initialize preview player
        this.initPreviewPlayer(preview);
    }

    generatePlayerHTML(file) {
        const themeClass = `theme-${this.embedSettings.theme}`;
        const controlsHTML = this.embedSettings.controls ? this.generateControlsHTML() : '';

        return `
            <div class="embed-player ${themeClass}" style="max-width: ${this.embedSettings.width}px;">
                <div class="embed-player-info">
                    <div class="embed-artwork">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
                        </svg>
                    </div>
                    <div class="embed-details">
                        <div class="embed-title">${this.escapeHtml(file.title)}</div>
                        <div class="embed-duration">${storage.formatDuration(file.duration)}</div>
                    </div>
                </div>
                ${controlsHTML}
            </div>
        `;
    }

    generateControlsHTML() {
        return `
            <div class="embed-controls">
                <button class="embed-play-btn" data-action="play">
                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <svg class="pause-icon" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                </button>
                <div class="embed-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%;"></div>
                        <input type="range" class="progress-slider" min="0" max="100" value="0">
                    </div>
                    <div class="embed-time">
                        <span class="current-time">00:00</span>
                        <span class="total-time">${storage.formatDuration(0)}</span>
                    </div>
                </div>
                <div class="embed-volume-control">
                    <button class="control-btn volume-btn">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                        </svg>
                    </button>
                    <input type="range" class="volume-slider" min="0" max="100" value="70">
                </div>
            </div>
        `;
    }

    initPreviewPlayer(container) {
        if (!this.embedSettings.controls) return;

        const file = storage.getAudioFileById(this.currentFileId);
        if (!file) return;

        const playBtn = container.querySelector('[data-action="play"]');
        const progressSlider = container.querySelector('.progress-slider');
        const volumeSlider = container.querySelector('.volume-slider');

        // Create audio element for preview
        let audio = container.querySelector('audio');
        if (!audio) {
            audio = document.createElement('audio');
            audio.src = file.fileData;
            container.appendChild(audio);
        }

        // Play/Pause
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (audio.paused) {
                    audio.play();
                    playBtn.querySelector('.play-icon').style.display = 'none';
                    playBtn.querySelector('.pause-icon').style.display = 'block';
                } else {
                    audio.pause();
                    playBtn.querySelector('.play-icon').style.display = 'block';
                    playBtn.querySelector('.pause-icon').style.display = 'none';
                }
            });
        }

        // Progress
        if (progressSlider) {
            progressSlider.addEventListener('input', (e) => {
                const time = (e.target.value / 100) * audio.duration;
                audio.currentTime = time;
            });
        }

        // Volume
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                audio.volume = e.target.value / 100;
            });
        }

        // Time update
        audio.addEventListener('timeupdate', () => {
            if (!audio.duration) return;

            const percentage = (audio.currentTime / audio.duration) * 100;
            const progressFill = container.querySelector('.progress-fill');
            const currentTime = container.querySelector('.current-time');
            const totalTime = container.querySelector('.total-time');

            if (progressFill) {
                progressFill.style.width = percentage + '%';
            }

            if (progressSlider) {
                progressSlider.value = percentage;
            }

            if (currentTime) {
                currentTime.textContent = storage.formatDuration(audio.currentTime);
            }

            if (totalTime) {
                totalTime.textContent = storage.formatDuration(audio.duration);
            }
        });
    }

    updateEmbedCode() {
        if (!this.currentFileId) return;

        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        const embedUrl = `${baseUrl}/embed.html?id=${this.currentFileId}&width=${this.embedSettings.width}&height=${this.embedSettings.height}&theme=${this.embedSettings.theme}&autoplay=${this.embedSettings.autoplay}&controls=${this.embedSettings.controls}`;

        const embedCode = `<iframe src="${embedUrl}" width="${this.embedSettings.width}" height="${this.embedSettings.height}" frameborder="0" allowfullscreen></iframe>`;

        const textarea = document.getElementById('embedCode');
        if (textarea) {
            textarea.value = embedCode;
        }
    }

    updateDirectLink() {
        if (!this.currentFileId) return;

        const file = storage.getAudioFileById(this.currentFileId);
        if (!file) return;

        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        const directLink = `${baseUrl}/index.html?play=${this.currentFileId}`;

        const input = document.getElementById('directLink');
        if (input) {
            input.value = directLink;
        }
    }

    updateHtmlCode() {
        if (!this.currentFileId) return;

        const file = storage.getAudioFileById(this.currentFileId);
        if (!file) return;

        const htmlCode = `<audio controls${this.embedSettings.autoplay ? ' autoplay' : ''}>
  <source src="${file.fileData}" type="audio/mpeg">
  متصفحك لا يدعم تشغيل الملفات الصوتية.
</audio>`;

        const textarea = document.getElementById('htmlCode');
        if (textarea) {
            textarea.value = htmlCode;
        }
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.select();
        document.execCommand('copy');

        // Show feedback
        const btn = event.target.closest('button');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'تم النسخ!';
            btn.style.background = 'var(--gradient-success)';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
let embedManager;

document.addEventListener('DOMContentLoaded', () => {
    embedManager = new EmbedManager();
});
