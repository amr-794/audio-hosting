/**
 * Embed Generator
 * Generate embed codes for audio files
 */

class EmbedGenerator {
    constructor(audioId = null) {
        this.audioId = audioId;
        this.settings = {
            width: CONFIG?.EMBED_DEFAULT_WIDTH || '100%',
            height: CONFIG?.EMBED_DEFAULT_HEIGHT || '150',
            autoplay: false,
            loop: false
        };
    }

    setAudioId(id) {
        this.audioId = id;
    }

    getPlayerUrl() {
        if (!this.audioId) return '';

        // Use current origin for player URL
        const baseUrl = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
        let url = `${baseUrl}player.html?id=${this.audioId}`;

        if (this.settings.autoplay) url += '&autoplay=1';
        if (this.settings.loop) url += '&loop=1';

        return url;
    }

    getStreamUrl() {
        if (!this.audioId) return '';
        return `${CONFIG.API_BASE_URL}/stream.php?id=${this.audioId}`;
    }

    generateIframe() {
        const url = this.getPlayerUrl();
        return `<iframe src="${url}" width="${this.settings.width}" height="${this.settings.height}" frameborder="0" allow="autoplay" style="border:none; border-radius:12px;"></iframe>`;
    }

    generateHtml5Audio(audioUrl) {
        return `<audio controls${this.settings.autoplay ? ' autoplay' : ''}${this.settings.loop ? ' loop' : ''} style="width:100%;">
    <source src="${audioUrl}" type="audio/mpeg">
    Your browser does not support the audio element.
</audio>`;
    }

    generateJsWidget() {
        const url = this.getPlayerUrl();
        return `<div id="audio-player-${this.audioId}"></div>
<script>
(function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${url}';
    iframe.width = '${this.settings.width}';
    iframe.height = '${this.settings.height}';
    iframe.frameBorder = '0';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.allow = 'autoplay';
    document.getElementById('audio-player-${this.audioId}').appendChild(iframe);
})();
<\/script>`;
    }

    generateDirectLink() {
        return this.getPlayerUrl();
    }

    generateFullHtml() {
        const url = this.getPlayerUrl();
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Audio Player</title>
    <style>
        body { margin: 0; padding: 20px; background: #1e1b4b; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        iframe { width: 100%; max-width: 600px; }
    </style>
</head>
<body>
    <iframe src="${url}" height="${this.settings.height}" frameborder="0" allow="autoplay" style="border:none; border-radius:12px;"></iframe>
</body>
</html>`;
    }

    getAllCodes(audioUrl) {
        return {
            iframe: this.generateIframe(),
            html5: this.generateHtml5Audio(audioUrl),
            javascript: this.generateJsWidget(),
            direct: this.generateDirectLink(),
            fullHtml: this.generateFullHtml()
        };
    }
}

// Export
window.EmbedGenerator = EmbedGenerator;
