// Upload Manager - Handles file upload with realistic progress simulation
class UploadManager {
    constructor() {
        this.currentUpload = null;
        this.uploadCancelled = false;

        this.init();
    }

    init() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const selectFileBtn = document.getElementById('selectFileBtn');
        const cancelUploadBtn = document.getElementById('cancelUploadBtn');
        const uploadAnotherBtn = document.getElementById('uploadAnotherBtn');
        const shareUploadedBtn = document.getElementById('shareUploadedBtn');

        // Click to select file
        if (selectFileBtn) {
            selectFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleFile(e.target.files[0]);
                }
            });
        }

        // Drag and drop
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');

                if (e.dataTransfer.files.length > 0) {
                    const file = e.dataTransfer.files[0];
                    if (file.type.startsWith('audio/')) {
                        this.handleFile(file);
                    } else {
                        alert('الرجاء رفع ملف صوتي فقط');
                    }
                }
            });
        }

        // Cancel upload
        if (cancelUploadBtn) {
            cancelUploadBtn.addEventListener('click', () => {
                this.cancelUpload();
            });
        }

        // Upload another
        if (uploadAnotherBtn) {
            uploadAnotherBtn.addEventListener('click', () => {
                this.resetUpload();
            });
        }

        // Share uploaded file
        if (shareUploadedBtn) {
            shareUploadedBtn.addEventListener('click', () => {
                if (this.currentUpload && this.currentUpload.savedFile) {
                    if (typeof embedManager !== 'undefined') {
                        embedManager.openShareModal(this.currentUpload.savedFile.id);
                    }
                }
            });
        }
    }

    handleFile(file) {
        // Validate file type
        if (!file.type.startsWith('audio/')) {
            alert('الرجاء رفع ملف صوتي فقط');
            return;
        }

        // Validate file size (max 50MB for demo)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            alert('حجم الملف كبير جداً. الحد الأقصى 50 ميجابايت');
            return;
        }

        this.uploadFile(file);
    }

    async uploadFile(file) {
        this.uploadCancelled = false;

        // Hide upload area, show progress
        document.getElementById('uploadArea')?.classList.add('hidden');
        document.getElementById('uploadSuccess')?.classList.add('hidden');
        document.getElementById('uploadProgressContainer')?.classList.remove('hidden');

        // Set file info
        document.getElementById('uploadFileName').textContent = file.name;
        document.getElementById('uploadFileSize').textContent = storage.formatFileSize(file.size);

        // Read file as base64
        const fileData = await this.readFileAsBase64(file);

        // Get audio duration
        const duration = await this.getAudioDuration(fileData);

        // Simulate upload with realistic progress
        await this.simulateUpload(file.size);

        if (this.uploadCancelled) {
            this.resetUpload();
            return;
        }

        // Save to storage
        const savedFile = storage.addAudioFile({
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            filename: file.name,
            fileSize: file.size,
            duration: duration,
            fileData: fileData
        });

        this.currentUpload = {
            file: file,
            savedFile: savedFile,
            originalFile: file
        };

        // Automatically download file to uploads folder
        this.downloadFileToUploads(file, savedFile.id);

        // Show success
        this.showSuccess(file.name);
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

    async simulateUpload(fileSize) {
        const progressFill = document.getElementById('uploadProgressFill');
        const progressPercentage = document.getElementById('uploadPercentage');
        const uploadSpeed = document.getElementById('uploadSpeed');
        const uploadedSize = document.getElementById('uploadedSize');
        const timeRemaining = document.getElementById('timeRemaining');

        // Simulate realistic upload speed (2-8 MB/s)
        const baseSpeed = 2 + Math.random() * 6; // MB/s
        const speedVariation = 0.2; // 20% variation

        let uploaded = 0;
        const startTime = Date.now();

        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (this.uploadCancelled) {
                    clearInterval(interval);
                    resolve();
                    return;
                }

                // Calculate current speed with variation
                const currentSpeed = baseSpeed * (1 + (Math.random() - 0.5) * speedVariation);
                const bytesPerTick = (currentSpeed * 1024 * 1024) / 10; // 100ms ticks

                uploaded += bytesPerTick;

                if (uploaded >= fileSize) {
                    uploaded = fileSize;
                    clearInterval(interval);

                    // Final update
                    progressFill.style.width = '100%';
                    progressPercentage.textContent = '100%';
                    uploadSpeed.textContent = storage.formatFileSize(currentSpeed * 1024 * 1024) + '/s';
                    uploadedSize.textContent = storage.formatFileSize(fileSize);
                    timeRemaining.textContent = '00:00';

                    setTimeout(resolve, 500);
                    return;
                }

                // Update progress
                const percentage = (uploaded / fileSize) * 100;
                progressFill.style.width = percentage + '%';
                progressPercentage.textContent = Math.floor(percentage) + '%';

                // Update speed
                uploadSpeed.textContent = storage.formatFileSize(currentSpeed * 1024 * 1024) + '/s';

                // Update uploaded size
                uploadedSize.textContent = storage.formatFileSize(uploaded);

                // Calculate time remaining
                const remaining = fileSize - uploaded;
                const timeLeft = remaining / (currentSpeed * 1024 * 1024);
                const minutes = Math.floor(timeLeft / 60);
                const seconds = Math.floor(timeLeft % 60);
                timeRemaining.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            }, 100); // Update every 100ms for smooth animation
        });
    }

    showSuccess(filename) {
        document.getElementById('uploadProgressContainer')?.classList.add('hidden');

        const successSection = document.getElementById('uploadSuccess');
        successSection?.classList.remove('hidden');

        document.getElementById('successFileName').textContent = filename;
    }

    cancelUpload() {
        this.uploadCancelled = true;
        this.resetUpload();
    }


    downloadFileToUploads(file, fileId) {
        // Create a download link to save file to uploads folder
        const blob = new Blob([file], { type: file.type });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileId}_${file.name}`;
        a.style.display = 'none';
        document.body.appendChild(a);

        // Auto-click to trigger download
        setTimeout(() => {
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    resetUpload() {
        this.currentUpload = null;
        this.uploadCancelled = false;

        // Reset UI
        document.getElementById('uploadArea')?.classList.remove('hidden');
        document.getElementById('uploadProgressContainer')?.classList.add('hidden');
        document.getElementById('uploadSuccess')?.classList.add('hidden');

        // Reset progress
        document.getElementById('uploadProgressFill').style.width = '0%';
        document.getElementById('uploadPercentage').textContent = '0%';
        document.getElementById('uploadSpeed').textContent = '0 MB/s';
        document.getElementById('uploadedSize').textContent = '0 MB';
        document.getElementById('timeRemaining').textContent = '--:--';

        // Reset file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const uploadManager = new UploadManager();
});
