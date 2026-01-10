/**
 * Main Application
 * UI utilities and common functions
 */

// Toast Notifications
class Toast {
    static show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container') || Toast.createContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static createContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    static success(message) { this.show(message, 'success'); }
    static error(message) { this.show(message, 'error'); }
    static warning(message) { this.show(message, 'warning'); }
    static info(message) { this.show(message, 'info'); }
}

// Modal System
class Modal {
    static show(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    static hide(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    static confirm(message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>تأكيد</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">إلغاء</button>
                    <button class="btn btn-danger" id="confirmBtn">تأكيد</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('#confirmBtn').onclick = () => {
            modal.remove();
            if (onConfirm) onConfirm();
        };
    }
}

// Utility Functions
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function copyToClipboard(text, message = 'تم النسخ!') {
    navigator.clipboard.writeText(text).then(() => {
        Toast.success(message);
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        Toast.success(message);
    });
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initialize tabs
function initTabs() {
    document.querySelectorAll('.tabs .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            const container = tab.closest('.card') || document;

            container.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            container.querySelectorAll('.tab-content').forEach(content => {
                content.classList.toggle('active', content.dataset.tab === target);
            });
        });
    });
}

// Export globals
window.Toast = Toast;
window.Modal = Modal;
window.formatDuration = formatDuration;
window.formatNumber = formatNumber;
window.copyToClipboard = copyToClipboard;
window.debounce = debounce;
window.initTabs = initTabs;
