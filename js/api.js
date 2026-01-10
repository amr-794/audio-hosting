/**
 * API Client
 * Handles all communication with the PHP backend
 */

class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || CONFIG.API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors',
            ...options
        };

        try {
            const response = await fetch(url, config);

            // Try to parse JSON
            let data;
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Invalid JSON response:', text);
                throw new Error('Server returned invalid response');
            }

            if (!response.ok || data.success === false) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'DELETE' });
    }

    // Audio API
    async getAudios(params = {}) {
        return this.get('audio.php', params);
    }

    async getAudio(id) {
        return this.get('audio.php', { id });
    }

    async addAudio(data) {
        return this.post('audio.php', data);
    }

    async updateAudio(data) {
        return this.put('audio.php', data);
    }

    async deleteAudio(id) {
        return this.delete('audio.php', { id });
    }

    // Stats API
    async trackPlay(id) {
        return this.post('stats.php', { id, action: 'play' });
    }

    async trackDownload(id) {
        return this.post('stats.php', { id, action: 'download' });
    }

    // Playlists API
    async getPlaylists() {
        return this.get('playlists.php');
    }

    async getPlaylist(id) {
        return this.get('playlists.php', { id });
    }

    async createPlaylist(data) {
        return this.post('playlists.php', data);
    }

    async updatePlaylist(data) {
        return this.put('playlists.php', data);
    }

    async deletePlaylist(id) {
        return this.delete('playlists.php', { id });
    }

    async addToPlaylist(playlistId, audioId) {
        return this.post('playlists.php', {
            action: 'add_item',
            playlist_id: playlistId,
            audio_id: audioId
        });
    }

    async removeFromPlaylist(playlistId, audioId) {
        return this.post('playlists.php', {
            action: 'remove_item',
            playlist_id: playlistId,
            audio_id: audioId
        });
    }

    // Settings API
    async getSettings(category = null) {
        const params = category ? { category } : {};
        return this.get('settings.php', params);
    }

    async saveSettings(settings) {
        return this.post('settings.php', settings);
    }
}

// Create global instance
window.api = new ApiClient();
