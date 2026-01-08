// Embed Code Generation and Preview
// Handles embed customization and code generation

const Embed = {
    currentAudioId: null,

    // Initialize embed system
    init() {
        this.setupEventListeners();
    },

    // Setup event listeners
    setupEventListeners() {
        // Customization inputs
        const inputs = [
            'embedType', 'embedTheme', 'embedWidth', 'embedWidthUnit',
            'embedHeight', 'embedPrimaryColor', 'embedSecondaryColor',
            'embedBgColor', 'embedAutoplay', 'embedShowControls', 'embedShowTime'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updatePreview());
                element.addEventListener('input', () => this.updatePreview());
            }
        });
    },

    // Open embed modal
    openEmbedModal(audioId) {
        this.currentAudioId = audioId;
        const audioFile = Storage.getAudioFile(audioId);

        if (!audioFile) {
            alert('الملف الصوتي غير موجود');
            return;
        }

        // Load default settings
        const settings = Storage.getSettings();
        document.getElementById('embedType').value = 'full';
        document.getElementById('embedTheme').value = settings.theme;
        document.getElementById('embedWidth').value = settings.embedWidth;
        document.getElementById('embedWidthUnit').value = settings.embedWidthUnit || '%';
        document.getElementById('embedHeight').value = settings.embedHeight;
        document.getElementById('embedPrimaryColor').value = settings.primaryColor;
        document.getElementById('embedSecondaryColor').value = settings.secondaryColor;
        document.getElementById('embedBgColor').value = '#1a1a2e';
        document.getElementById('embedAutoplay').checked = settings.autoplay;
        document.getElementById('embedShowControls').checked = settings.showControls;
        document.getElementById('embedShowTime').checked = settings.showTime;

        // Update preview and code
        this.updatePreview();
        this.updateCode();

        // Show modal
        openModal('embedModal');
    },

    // Get embed options
    getEmbedOptions() {
        return {
            audioId: this.currentAudioId,
            type: document.getElementById('embedType').value,
            theme: document.getElementById('embedTheme').value,
            width: document.getElementById('embedWidth').value,
            widthUnit: document.getElementById('embedWidthUnit').value,
            height: document.getElementById('embedHeight').value,
            primaryColor: document.getElementById('embedPrimaryColor').value,
            secondaryColor: document.getElementById('embedSecondaryColor').value,
            bgColor: document.getElementById('embedBgColor').value,
            autoplay: document.getElementById('embedAutoplay').checked,
            showControls: document.getElementById('embedShowControls').checked,
            showTime: document.getElementById('embedShowTime').checked
        };
    },

    // Update preview
    updatePreview() {
        const options = this.getEmbedOptions();
        const audioFile = Storage.getAudioFile(this.currentAudioId);

        if (!audioFile) return;

        const preview = document.getElementById('embedPreview');
        preview.innerHTML = this.generatePlayerHTML(audioFile, options);

        // Update code display
        this.updateCode();

        // Initialize preview player
        this.initPreviewPlayer();
    },

    // Generate player HTML
    generatePlayerHTML(audioFile, options) {
        const { type, theme, width, widthUnit, height, primaryColor, secondaryColor, bgColor, showControls, showTime } = options;

        const widthStyle = `width: ${width}${widthUnit}`;
        const heightStyle = `height: ${height}px`;

        if (type === 'minimal') {
            return this.generateMinimalPlayer(audioFile, options);
        } else if (type === 'button') {
            return this.generateButtonPlayer(audioFile, options);
        } else {
            return this.generateFullPlayer(audioFile, options);
        }
    },

    // Generate full player
    generateFullPlayer(audioFile, options) {
        const { width, widthUnit, height, primaryColor, secondaryColor, bgColor, showControls, showTime } = options;

        return `
            <div class="embed-player-full" style="
                width: ${width}${widthUnit};
                height: ${height}px;
                background: ${bgColor};
                border-radius: 12px;
                padding: 16px;
                display: flex;
                align-items: center;
                gap: 16px;
                font-family: 'Cairo', sans-serif;
                color: white;
            ">
                <div class="embed-artwork" style="
                    width: ${height - 32}px;
                    height: ${height - 32}px;
                    background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                ">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                        <path d="M9 18V5l12-2v13"/>
                    </svg>
                </div>
                <div class="embed-content" style="flex: 1; min-width: 0;">
                    <div class="embed-info" style="margin-bottom: 8px;">
                        <div style="font-weight: 600; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${audioFile.name}
                        </div>
                        ${showTime ? `<div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px;">
                            <span class="embed-current-time">0:00</span> / <span class="embed-duration">0:00</span>
                        </div>` : ''}
                    </div>
                    ${showControls ? `
                    <div class="embed-progress" style="
                        background: rgba(255,255,255,0.1);
                        height: 6px;
                        border-radius: 3px;
                        overflow: hidden;
                        cursor: pointer;
                        margin-bottom: 8px;
                    ">
                        <div class="embed-progress-fill" style="
                            width: 0%;
                            height: 100%;
                            background: linear-gradient(90deg, ${primaryColor}, ${secondaryColor});
                            transition: width 0.1s linear;
                        "></div>
                    </div>
                    <div class="embed-controls" style="display: flex; gap: 8px; align-items: center;">
                        <button class="embed-play-btn" style="
                            width: 36px;
                            height: 36px;
                            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                            border: none;
                            border-radius: 50%;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z"/>
                            </svg>
                        </button>
                        <input type="range" class="embed-volume" min="0" max="100" value="100" style="
                            flex: 1;
                            height: 4px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 2px;
                            outline: none;
                            -webkit-appearance: none;
                        ">
                    </div>
                    ` : ''}
                </div>
                <audio class="embed-audio" src="${audioFile.data}" ${options.autoplay ? 'autoplay' : ''}></audio>
            </div>
        `;
    },

    // Generate minimal player
    generateMinimalPlayer(audioFile, options) {
        const { width, widthUnit, primaryColor, secondaryColor, bgColor, showTime } = options;

        return `
            <div class="embed-player-minimal" style="
                width: ${width}${widthUnit};
                background: ${bgColor};
                border-radius: 8px;
                padding: 12px 16px;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: 'Cairo', sans-serif;
                color: white;
            ">
                <button class="embed-play-btn" style="
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                    border: none;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                ">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${audioFile.name}
                    </div>
                    ${showTime ? `<div style="font-size: 11px; color: rgba(255,255,255,0.7);">
                        <span class="embed-current-time">0:00</span> / <span class="embed-duration">0:00</span>
                    </div>` : ''}
                </div>
                <audio class="embed-audio" src="${audioFile.data}" ${options.autoplay ? 'autoplay' : ''}></audio>
            </div>
        `;
    },

    // Generate button player
    generateButtonPlayer(audioFile, options) {
        const { primaryColor, secondaryColor } = options;

        return `
            <button class="embed-player-button" style="
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                border: none;
                border-radius: 50px;
                padding: 12px 24px;
                color: white;
                font-family: 'Cairo', sans-serif;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: transform 0.2s;
            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" class="embed-play-icon">
                    <path d="M8 5v14l11-7z"/>
                </svg>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white" class="embed-pause-icon" style="display: none;">
                    <path d="M6 4h4v16H6zM14 4h4v16h-4z"/>
                </svg>
                <span>${audioFile.name}</span>
                <audio class="embed-audio" src="${audioFile.data}" ${options.autoplay ? 'autoplay' : ''}></audio>
            </button>
        `;
    },

    // Initialize preview player
    initPreviewPlayer() {
        const preview = document.getElementById('embedPreview');
        const audio = preview.querySelector('.embed-audio');
        const playBtn = preview.querySelector('.embed-play-btn');
        const progressBar = preview.querySelector('.embed-progress');
        const progressFill = preview.querySelector('.embed-progress-fill');
        const volumeSlider = preview.querySelector('.embed-volume');
        const currentTimeEl = preview.querySelector('.embed-current-time');
        const durationEl = preview.querySelector('.embed-duration');

        if (!audio) return;

        // Play/Pause
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                if (audio.paused) {
                    audio.play();
                    const playIcon = playBtn.querySelector('svg path');
                    if (playIcon) {
                        playIcon.setAttribute('d', 'M6 4h4v16H6zM14 4h4v16h-4z');
                    }
                } else {
                    audio.pause();
                    const playIcon = playBtn.querySelector('svg path');
                    if (playIcon) {
                        playIcon.setAttribute('d', 'M8 5v14l11-7z');
                    }
                }
            });
        }

        // Progress
        if (progressBar) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                audio.currentTime = audio.duration * percent;
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
            if (progressFill) {
                const percent = (audio.currentTime / audio.duration) * 100;
                progressFill.style.width = percent + '%';
            }
            if (currentTimeEl) {
                currentTimeEl.textContent = Storage.formatDuration(audio.currentTime);
            }
        });

        // Loaded metadata
        audio.addEventListener('loadedmetadata', () => {
            if (durationEl) {
                durationEl.textContent = Storage.formatDuration(audio.duration);
            }
        });
    },

    // Update code display
    updateCode() {
        const options = this.getEmbedOptions();
        const audioFile = Storage.getAudioFile(this.currentAudioId);

        if (!audioFile) return;

        const code = this.generateEmbedCode(audioFile, options);
        const codeDisplay = document.getElementById('embedCodeDisplay');

        if (codeDisplay) {
            codeDisplay.querySelector('code').textContent = code;
        }
    },

    // Generate embed code
    generateEmbedCode(audioFile, options) {
        const playerHTML = this.generatePlayerHTML(audioFile, options);

        // Add inline styles for slider thumb (not supported in inline styles)
        const additionalStyles = `
<style>
.embed-volume::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: ${options.primaryColor};
    border-radius: 50%;
    cursor: pointer;
}
.embed-volume::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: ${options.primaryColor};
    border-radius: 50%;
    cursor: pointer;
    border: none;
}
</style>`;

        return additionalStyles + '\n' + playerHTML;
    }
};

// Copy embed code to clipboard
function copyEmbedCode() {
    const code = document.getElementById('embedCodeDisplay').querySelector('code').textContent;

    navigator.clipboard.writeText(code).then(() => {
        const btn = document.querySelector('.copy-code-btn');
        const originalText = btn.innerHTML;

        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
            تم النسخ!
        `;

        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('فشل نسخ الكود');
    });
}

// Initialize embed system
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Embed.init());
} else {
    Embed.init();
}
