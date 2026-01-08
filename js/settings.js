// Settings Manager - Handles application settings
class SettingsManager {
    constructor() {
        this.init();
    }

    init() {
        // Load current settings
        this.loadSettings();

        // Update statistics
        this.updateStatistics();

        // Save settings button
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        // Reset settings button
        const resetSettingsBtn = document.getElementById('resetSettingsBtn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Export data button
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Import data button
        const importDataBtn = document.getElementById('importDataBtn');
        const importFileInput = document.getElementById('importFileInput');

        if (importDataBtn && importFileInput) {
            importDataBtn.addEventListener('click', () => {
                importFileInput.click();
            });

            importFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.importData(e.target.files[0]);
                }
            });
        }

        // Clear data button
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.confirmClearData();
            });
        }

        // Volume slider real-time update
        const defaultVolumeSlider = document.getElementById('defaultVolumeSlider');
        const volumeValue = document.getElementById('volumeValue');

        if (defaultVolumeSlider && volumeValue) {
            defaultVolumeSlider.addEventListener('input', (e) => {
                volumeValue.textContent = e.target.value + '%';
            });
        }
    }

    loadSettings() {
        const settings = storage.getSettings();

        // Theme
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = settings.theme || 'dark';
        }

        // Player theme
        const playerThemeSelect = document.getElementById('playerThemeSelect');
        if (playerThemeSelect) {
            playerThemeSelect.value = settings.playerTheme || 'gradient';
        }

        // Autoplay
        const autoplayToggle = document.getElementById('autoplayToggle');
        if (autoplayToggle) {
            autoplayToggle.checked = settings.autoPlay || false;
        }

        // Default volume
        const defaultVolumeSlider = document.getElementById('defaultVolumeSlider');
        const volumeValue = document.getElementById('volumeValue');
        if (defaultVolumeSlider) {
            defaultVolumeSlider.value = settings.defaultVolume || 70;
            if (volumeValue) {
                volumeValue.textContent = (settings.defaultVolume || 70) + '%';
            }
        }

        // Embed defaults
        if (settings.embedDefaults) {
            const embedWidthInput = document.getElementById('embedWidthInput');
            const embedHeightInput = document.getElementById('embedHeightInput');
            const embedThemeSelect = document.getElementById('embedThemeSelect');
            const embedControlsToggle = document.getElementById('embedControlsToggle');
            const embedAutoplayToggle = document.getElementById('embedAutoplayToggle');

            if (embedWidthInput) {
                embedWidthInput.value = settings.embedDefaults.width || 600;
            }

            if (embedHeightInput) {
                embedHeightInput.value = settings.embedDefaults.height || 150;
            }

            if (embedThemeSelect) {
                embedThemeSelect.value = settings.embedDefaults.theme || 'dark';
            }

            if (embedControlsToggle) {
                embedControlsToggle.checked = settings.embedDefaults.controls !== false;
            }

            if (embedAutoplayToggle) {
                embedAutoplayToggle.checked = settings.embedDefaults.autoplay || false;
            }
        }
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('themeSelect')?.value || 'dark',
            playerTheme: document.getElementById('playerThemeSelect')?.value || 'gradient',
            autoPlay: document.getElementById('autoplayToggle')?.checked || false,
            defaultVolume: parseInt(document.getElementById('defaultVolumeSlider')?.value || 70),
            embedDefaults: {
                width: parseInt(document.getElementById('embedWidthInput')?.value || 600),
                height: parseInt(document.getElementById('embedHeightInput')?.value || 150),
                theme: document.getElementById('embedThemeSelect')?.value || 'dark',
                controls: document.getElementById('embedControlsToggle')?.checked !== false,
                autoplay: document.getElementById('embedAutoplayToggle')?.checked || false
            }
        };

        storage.saveSettings(settings);

        // Show success message
        this.showNotification('تم حفظ الإعدادات بنجاح', 'success');
    }

    resetSettings() {
        if (confirm('هل تريد إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟')) {
            const defaultSettings = storage.getDefaultSettings();
            storage.saveSettings(defaultSettings);
            this.loadSettings();
            this.showNotification('تم إعادة تعيين الإعدادات', 'success');
        }
    }

    updateStatistics() {
        const stats = storage.getStatistics();

        // Storage used
        const storageUsed = document.getElementById('storageUsed');
        const storageFill = document.getElementById('storageFill');

        if (storageUsed) {
            const usedMB = (stats.storageUsed / (1024 * 1024)).toFixed(2);
            const maxMB = 10; // Approximate localStorage limit
            const percentage = Math.min((usedMB / maxMB) * 100, 100);

            storageUsed.textContent = `${usedMB} ميجابايت من ${maxMB} ميجابايت`;

            if (storageFill) {
                storageFill.style.width = percentage + '%';
            }
        }

        // Files count
        const filesCount = document.getElementById('filesCount');
        if (filesCount) {
            filesCount.textContent = `${stats.totalFiles} ${stats.totalFiles === 1 ? 'ملف' : 'ملفات'}`;
        }

        // Playlists count
        const playlistsCount = document.getElementById('playlistsCount');
        if (playlistsCount) {
            playlistsCount.textContent = `${stats.totalPlaylists} ${stats.totalPlaylists === 1 ? 'قائمة' : 'قوائم'}`;
        }
    }

    exportData() {
        const data = storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `audio-hosting-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('تم تصدير البيانات بنجاح', 'success');
    }

    async importData(file) {
        try {
            const text = await file.text();
            const success = storage.importData(text);

            if (success) {
                this.showNotification('تم استيراد البيانات بنجاح', 'success');
                this.loadSettings();
                this.updateStatistics();

                // Reload page after 2 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                this.showNotification('فشل استيراد البيانات. تأكد من صحة الملف', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('حدث خطأ أثناء الاستيراد', 'error');
        }
    }

    confirmClearData() {
        const modal = document.getElementById('confirmModal');
        const title = document.getElementById('confirmTitle');
        const message = document.getElementById('confirmMessage');
        const yesBtn = document.getElementById('confirmYesBtn');
        const noBtn = document.getElementById('confirmNoBtn');
        const closeBtn = document.getElementById('closeConfirmModal');

        if (!modal) return;

        title.textContent = 'تأكيد حذف البيانات';
        message.textContent = 'هل أنت متأكد من حذف جميع الملفات وقوائم التشغيل والإعدادات؟ هذا الإجراء لا يمكن التراجع عنه!';

        modal.classList.add('show');

        const handleYes = () => {
            this.clearAllData();
            modal.classList.remove('show');
            cleanup();
        };

        const handleNo = () => {
            modal.classList.remove('show');
            cleanup();
        };

        const cleanup = () => {
            yesBtn.removeEventListener('click', handleYes);
            noBtn.removeEventListener('click', handleNo);
            closeBtn.removeEventListener('click', handleNo);
        };

        yesBtn.addEventListener('click', handleYes);
        noBtn.addEventListener('click', handleNo);
        closeBtn.addEventListener('click', handleNo);
    }

    clearAllData() {
        storage.clearAllData();
        this.showNotification('تم حذف جميع البيانات', 'success');
        this.loadSettings();
        this.updateStatistics();

        // Reload page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 1rem 2rem;
            background: ${type === 'success' ? 'var(--gradient-success)' : 'var(--gradient-danger)'};
            color: var(--text-primary);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideDown 0.3s ease;
            font-weight: 600;
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
});
