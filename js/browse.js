// Browse Files Manager - Handles browsing and importing files from uploads folder
class BrowseManager {
    constructor() {
        this.selectedFiles = new Map(); // Map of file path to file object

        this.init();
    }

    init() {
        const selectFilesBtn = document.getElementById('selectFilesBtn');
        const manualFileInput = document.getElementById('manualFileInput');
        const addSelectedBtn = document.getElementById('addSelectedBtn');
        const clearSelectionBtn = document.getElementById('clearSelectionBtn');

        // Select files button
        if (selectFilesBtn) {
            selectFilesBtn.addEventListener('click', () => {
                manualFileInput.click();
            });
        }

        // File input change
        if (manualFileInput) {
            manualFileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }

        // Add selected files
        if (addSelectedBtn) {
            addSelectedBtn.addEventListener('click', () => {
                this.addSelectedFiles();
            });
        }

        // Clear selection
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        }
    }

    handleFiles(files) {
        if (!files || files.length === 0) {
            return;
        }

        // Filter audio files only
        const audioFiles = Array.from(files).filter(file =>
            file.type.startsWith('audio/')
        );

        if (audioFiles.length === 0) {
            alert('لم يتم العثور على ملفات صوتية في المجلد المحدد');
            return;
        }

        this.displayFiles(audioFiles);
    }

    displayFiles(files) {
        const container = document.getElementById('filesListContainer');
        const emptyState = document.getElementById('emptyState');

        if (!container) return;

        if (files.length === 0) {
            container.innerHTML = '';
            emptyState?.classList.add('show');
            return;
        }

        emptyState?.classList.remove('show');

        container.innerHTML = `
            <div class="files-list-header">
                <h3>الملفات الموجودة في المجلد (${files.length} ملف)</h3>
                <button class="btn btn-outline" id="selectAllBtn">تحديد الكل</button>
            </div>
            <div class="files-list">
                ${files.map(file => this.createFileItem(file)).join('')}
            </div>
        `;

        // Add select all button listener
        document.getElementById('selectAllBtn')?.addEventListener('click', () => {
            this.selectAll(files);
        });

        // Add checkbox listeners
        container.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const fileIndex = parseInt(e.target.dataset.index);
                const file = files[fileIndex];

                if (e.target.checked) {
                    this.selectedFiles.set(file.name, file);
                } else {
                    this.selectedFiles.delete(file.name);
                }

                this.updateSelectedCount();
            });
        });
    }

    createFileItem(file) {
        const fileIndex = Array.from(this.selectedFiles.keys()).indexOf(file.name);
        const isSelected = this.selectedFiles.has(file.name);

        return `
            <div class="file-list-item">
                <input type="checkbox" class="file-checkbox" data-index="${fileIndex}" ${isSelected ? 'checked' : ''}>
                <div class="file-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
                    </svg>
                </div>
                <div class="file-info">
                    <div class="file-name">${this.escapeHtml(file.name)}</div>
                    <div class="file-meta">
                        ${storage.formatFileSize(file.size)} • ${file.type}
                    </div>
                </div>
                <div class="file-status">
                    ${this.isFileInSystem(file.name) ?
                '<span class="status-badge status-exists">موجود في النظام</span>' :
                '<span class="status-badge status-new">جديد</span>'
            }
                </div>
            </div>
        `;
    }

    isFileInSystem(filename) {
        const files = storage.getAudioFiles();
        return files.some(f => f.filename === filename || f.filename.includes(filename));
    }

    selectAll(files) {
        files.forEach(file => {
            this.selectedFiles.set(file.name, file);
        });

        // Update checkboxes
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.checked = true;
        });

        this.updateSelectedCount();
    }

    clearSelection() {
        this.selectedFiles.clear();

        // Update checkboxes
        document.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        this.updateSelectedCount();
    }

    updateSelectedCount() {
        const count = this.selectedFiles.size;
        const selectedActions = document.getElementById('selectedActions');
        const selectedCount = document.getElementById('selectedCount');

        if (selectedCount) {
            selectedCount.textContent = count;
        }

        if (selectedActions) {
            if (count > 0) {
                selectedActions.classList.remove('hidden');
            } else {
                selectedActions.classList.add('hidden');
            }
        }
    }

    async addSelectedFiles() {
        if (this.selectedFiles.size === 0) {
            alert('الرجاء اختيار ملف واحد على الأقل');
            return;
        }

        const filesToAdd = Array.from(this.selectedFiles.values());
        let addedCount = 0;
        let skippedCount = 0;

        // Show progress
        const progressDiv = document.createElement('div');
        progressDiv.className = 'import-progress';
        progressDiv.innerHTML = `
            <div class="progress-content">
                <h3>جاري إضافة الملفات...</h3>
                <div class="progress-bar">
                    <div class="progress-fill" id="importProgressFill"></div>
                </div>
                <p id="importProgressText">0 / ${filesToAdd.length}</p>
            </div>
        `;
        document.body.appendChild(progressDiv);

        for (let i = 0; i < filesToAdd.length; i++) {
            const file = filesToAdd[i];

            // Check if already exists
            if (this.isFileInSystem(file.name)) {
                skippedCount++;
            } else {
                try {
                    // Read file as base64
                    const fileData = await this.readFileAsBase64(file);

                    // Get audio duration
                    const duration = await this.getAudioDuration(fileData);

                    // Add to storage
                    storage.addAudioFile({
                        title: file.name.replace(/\.[^/.]+$/, ''),
                        filename: file.name,
                        fileSize: file.size,
                        duration: duration,
                        fileData: fileData
                    });

                    addedCount++;
                } catch (error) {
                    console.error('Error adding file:', file.name, error);
                    skippedCount++;
                }
            }

            // Update progress
            const progress = ((i + 1) / filesToAdd.length) * 100;
            document.getElementById('importProgressFill').style.width = progress + '%';
            document.getElementById('importProgressText').textContent = `${i + 1} / ${filesToAdd.length}`;
        }

        // Remove progress
        document.body.removeChild(progressDiv);

        // Show result
        alert(`تمت الإضافة بنجاح!\n\nتمت الإضافة: ${addedCount} ملف\nتم التخطي (موجود مسبقاً): ${skippedCount} ملف`);

        // Clear selection
        this.clearSelection();

        // Refresh display
        const manualFileInput = document.getElementById('manualFileInput');
        if (manualFileInput && manualFileInput.files) {
            this.handleFiles(manualFileInput.files);
        }
    }

    async readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                resolve(e.target.result);
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    }

    async getAudioDuration(dataUrl) {
        return new Promise((resolve) => {
            const audio = new Audio();

            audio.addEventListener('loadedmetadata', () => {
                resolve(audio.duration);
            });

            audio.addEventListener('error', () => {
                resolve(0);
            });

            audio.src = dataUrl;
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const browseManager = new BrowseManager();
});
