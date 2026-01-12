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
            button1: 'Button 1',
            button2: 'Button 2',
            button3: 'Button 3',
            custom: 'Custom',
            relativePath: 'Relative to project',
            absolutePath: 'Absolute path',
            download: 'Download',
            downloading: 'Downloading...',
            cancel: 'Cancel',
            showLogs: 'Show logs',
            hideLogs: 'Hide logs',

            // Settings panel
            settings: 'Settings',
            quickFolder1: 'Quick folder 1',
            quickFolder2: 'Quick folder 2',
            quickFolder3: 'Quick folder 3',
            defaultFormat: 'Default format',
            autoImport: 'Auto-import to Premiere',
            createBin: 'Create project folder',
            save: 'Save',

            // Status messages
            settingsSaved: 'Settings saved',
            downloadComplete: 'Download complete',
            importedSuccess: 'Imported to Premiere successfully',
            downloadSuccess: 'Download completed successfully',
            errorInvalidUrl: 'Invalid YouTube URL',
            errorEnterUrl: 'Please enter a YouTube URL',
            errorSaveProject: 'Please save your Premiere project first',
            errorSelectFolder: 'Please select a valid destination folder',
            errorFileNotFound: 'Error: File not found for import',
            errorCritical: 'Critical error: Download module not loaded',
            errorEndTime: 'End time must be after start time',
            cancelled: 'Download cancelled',

            // Progress messages
            initializing: 'Initializing...',
            downloadInProgress: 'Downloading...',
            merging: 'Merging formats...',
            finalizing: 'Finalizing...',
            importing: 'Importing to Premiere...',
            cancelling: 'Cancelling...'
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
            button1: 'Bouton 1',
            button2: 'Bouton 2',
            button3: 'Bouton 3',
            custom: 'Personnalisé',
            relativePath: 'Relatif au projet',
            absolutePath: 'Chemin absolu',
            download: 'Télécharger',
            downloading: 'Téléchargement...',
            cancel: 'Annuler',
            showLogs: 'Afficher les logs',
            hideLogs: 'Masquer les logs',

            // Settings panel
            settings: 'Paramètres',
            quickFolder1: 'Dossier rapide 1',
            quickFolder2: 'Dossier rapide 2',
            quickFolder3: 'Dossier rapide 3',
            defaultFormat: 'Format par défaut',
            autoImport: 'Importer automatiquement dans Premiere',
            createBin: 'Créer un dossier dans le projet',
            save: 'Enregistrer',

            // Status messages
            settingsSaved: 'Paramètres enregistrés',
            downloadComplete: 'Téléchargement terminé',
            importedSuccess: 'Importé dans Premiere avec succès',
            downloadSuccess: 'Téléchargement terminé avec succès',
            errorInvalidUrl: 'URL YouTube invalide',
            errorEnterUrl: 'Veuillez entrer une URL YouTube',
            errorSaveProject: 'Veuillez d\'abord enregistrer votre projet Premiere',
            errorSelectFolder: 'Veuillez choisir un dossier de destination valide',
            errorFileNotFound: 'Erreur: Fichier introuvable pour import',
            errorCritical: 'Erreur critique: Module de téléchargement non chargé',
            errorEndTime: 'Le temps de fin doit être après le temps de début',
            cancelled: 'Téléchargement annulé',

            // Progress messages
            initializing: 'Initialisation...',
            downloadInProgress: 'Téléchargement en cours...',
            merging: 'Fusion des formats...',
            finalizing: 'Finalisation...',
            importing: 'Import dans Premiere...',
            cancelling: 'Annulation...'
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
