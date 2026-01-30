/**
 * Internationalization (i18n) Module for YouTube Downloader
 * 
 * To add a new language:
 * 1. Add the language to LANGUAGES object with code, name, and flag
 * 2. Add translations object to TRANSLATIONS with the same language code
 * 3. The language will automatically appear in the dropdown
 */

const i18n = (function () {
    // Available languages with their display info
    const LANGUAGES = {
        en: { name: 'English', flag: '🇬🇧' },
        fr: { name: 'Français', flag: '🇫🇷' }
    };

    // All translations organized by language code
    const TRANSLATIONS = {
        en: {
            // Main UI
            urlLabel: 'YouTube URL',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'Clear',
            formatLabel: 'Format',
            formatBoth: 'Video + Audio',
            formatVideo: 'Video only',
            formatAudio: 'Audio only',
            timeRange: 'Time range',
            start: 'Start',
            end: 'End',
            destinationFolder: 'Destination folder',
            customPlaceholder: 'Custom (Empty = Downloads)',
            button1: 'Quick Folder 1',
            button2: 'Quick Folder 2',
            button3: 'Quick Folder 3',
        },
        fr: {
            // Main UI
            urlLabel: 'URL YouTube',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'Effacer',
            formatLabel: 'Format',
            formatBoth: 'Vidéo + Audio',
            formatVideo: 'Vidéo seule',
            formatAudio: 'Audio seul',
            timeRange: 'Plage temporelle',
            start: 'Début',
            end: 'Fin',
            destinationFolder: 'Dossier de destination',
            customPlaceholder: 'Personnalisé (Vide = Téléch.)',
            button1: 'Dossier Rapide 1',
            button2: 'Dossier Rapide 2',
            button3: 'Dossier Rapide 3',
        }
    };

    // Current language (default: English)
    let currentLanguage = 'en';

    /**
     * Get a translated string by key
     * @param {string} key - The translation key
     * @returns {string} The translated string or the key if not found
     */
    function get(key) {
        const translations = TRANSLATIONS[currentLanguage];
        if (translations && translations[key]) {
            return translations[key];
        }
        // Fallback to English
        if (TRANSLATIONS.en[key]) {
            return TRANSLATIONS.en[key];
        }
        // Return key if no translation found
        console.warn(`Missing translation for key: ${key}`);
        return key;
    }

    /**
     * Set the current language and update all UI elements
     * @param {string} langCode - The language code (e.g., 'en', 'fr')
     */
    function setLanguage(langCode) {
        if (!LANGUAGES[langCode]) {
            console.error(`Unknown language: ${langCode}`);
            return;
        }

        currentLanguage = langCode;
        localStorage.setItem('ytDownloaderLanguage', langCode);

        // Update all elements with data-i18n attribute
        updateUI();

        // Update the language button flag
        const langBtn = document.getElementById('currentLangBtn');
        if (langBtn) {
            langBtn.textContent = LANGUAGES[langCode].flag;
        }
    }

    /**
     * Update all UI elements with data-i18n attributes
     */
    function updateUI() {
        // Update text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = get(key);
        });

        // Update placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = get(key);
        });

        // Update titles
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = get(key);
        });
    }

    /**
     * Get the current language code
     * @returns {string} The current language code
     */
    function getCurrentLanguage() {
        return currentLanguage;
    }

    /**
     * Get all available languages
     * @returns {Object} Languages object with codes, names, and flags
     */
    function getLanguages() {
        return LANGUAGES;
    }

    /**
     * Initialize i18n - load saved language or use default
     */
    function init() {
        const savedLang = localStorage.getItem('ytDownloaderLanguage');
        if (savedLang && LANGUAGES[savedLang]) {
            currentLanguage = savedLang;
        } else {
            currentLanguage = 'en'; // Default to English
        }
        updateUI();
    }

    // Public API
    return {
        get,
        setLanguage,
        getCurrentLanguage,
        getLanguages,
        updateUI,
        init
    };
})();
