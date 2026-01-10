/**
 * API Configuration
 * Update API_BASE_URL with your PHP hosting URL
 */

const CONFIG = {
    // Change this to your PHP backend URL
    // For local testing: 'http://localhost/other-projects/audio-hosting/backend/api'
    // For production: 'https://your-domain.com/api'
    API_BASE_URL: 'https://dar-al3elm.webze.eu.org/api',

    // GitHub repository base URL for audio files
    // Example: 'https://raw.githubusercontent.com/username/repo/main/audio'
    GITHUB_RAW_BASE: '',

    // Player settings
    DEFAULT_VOLUME: 0.8,

    // Embed settings
    EMBED_DEFAULT_WIDTH: '100%',
    EMBED_DEFAULT_HEIGHT: '150'
};

// Export for use
window.CONFIG = CONFIG;
