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
        fr: { name: 'Français', flag: '🇫🇷' },
        es: { name: 'Español', flag: '🇪🇸' },
        de: { name: 'Deutsch', flag: '🇩🇪' },
        'pt-BR': { name: 'Português (Brasil)', flag: '🇧🇷' },
        ja: { name: '日本語', flag: '🇯🇵' },
        it: { name: 'Italiano', flag: '🇮🇹' },
        'zh-CN': { name: '简体中文', flag: '🇨🇳' },
        ru: { name: 'Русский', flag: '🇷🇺' }
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
            codecLabel: 'Quality & Codec',
            qualityMax: 'Maximum',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: 'Estimated size',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: 'Calculating...',
            estimatedSizeUnavailable: 'Unavailable',
            showLogs: 'Show logs',
            hideLogs: 'Hide logs',
            download: 'Download',
            destinationFolder: 'Destination folder',
            customPlaceholder: 'Custom (Empty = Downloads)',
            button1: 'Quick Folder 1',
            button2: 'Quick Folder 2',
            button3: 'Quick Folder 3',
            // Settings
            settings: 'Settings',
            quickFolder1: 'Quick folder 1',
            quickFolder2: 'Quick folder 2',
            quickFolder3: 'Quick folder 3',
            folderDepth: 'Folder Depth',
            folderDepthDesc: 'Folder levels relative to project file (0 = Same folder)',
            defaultFormat: 'Default format',
            autoImport: 'Auto-import to Premiere',
            createBin: 'Create project folder',
            cookieBrowserLabel: 'Browser for Cookies',
            firefoxRecommended: 'Firefox (recommended)',
            save: 'Save',
            // Advanced
            advancedTools: 'Advanced Tools',
            advancedToolsDesc: 'Optional custom paths. Leave empty for auto-detection.',
            ytdlpPath: 'yt-dlp path',
            ffmpegPath: 'ffmpeg path',
            denoPath: 'deno path (optional)',
            browsePath: 'Browse',
            settingsSaved: 'Settings saved!',
            updateAvailable: '🚀 New version available! Click to update.',
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
            codecLabel: 'Qualité et Codec',
            qualityMax: 'Maximal',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: 'Taille estimée',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: 'Calcul en cours...',
            estimatedSizeUnavailable: 'Indisponible',
            showLogs: 'Afficher les logs',
            hideLogs: 'Masquer les logs',
            download: 'Télécharger',
            destinationFolder: 'Dossier de destination',
            customPlaceholder: 'Personnalisé (Vide = Téléch.)',
            button1: 'Dossier Rapide 1',
            button2: 'Dossier Rapide 2',
            button3: 'Dossier Rapide 3',
            // Settings
            settings: 'Paramètres',
            quickFolder1: 'Dossier rapide 1',
            quickFolder2: 'Dossier rapide 2',
            quickFolder3: 'Dossier rapide 3',
            folderDepth: 'Profondeur dossier',
            folderDepthDesc: 'Niveaux de dossiers par rapport au projet (0 = Même dossier)',
            defaultFormat: 'Format par défaut',
            autoImport: 'Import auto dans Premiere',
            createBin: 'Créer un dossier chutier',
            cookieBrowserLabel: 'Navigateur pour Cookies',
            firefoxRecommended: 'Firefox (recommandé)',
            save: 'Enregistrer',
            // Advanced
            advancedTools: 'Outils Avancés',
            advancedToolsDesc: 'Chemins personnalisés optionnels. Laisser vide pour auto-détection.',
            ytdlpPath: 'Chemin yt-dlp',
            ffmpegPath: 'Chemin ffmpeg',
            denoPath: 'Chemin deno (optionnel)',
            browsePath: 'Parcourir',
            settingsSaved: 'Paramètres sauvegardés !',
            updateAvailable: '🚀 Nouvelle version disponible ! Cliquez pour mettre à jour.',
        },
        es: {
            // Main UI
            urlLabel: 'URL de YouTube',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'Limpiar',
            formatLabel: 'Formato',
            formatBoth: 'Video + Audio',
            formatVideo: 'Solo video',
            formatAudio: 'Solo audio',
            timeRange: 'Rango de tiempo',
            start: 'Inicio',
            end: 'Fin',
            codecLabel: 'Calidad y Codec',
            qualityMax: 'Máxima',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: 'Tamaño estimado',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: 'Calculando...',
            estimatedSizeUnavailable: 'No disponible',
            showLogs: 'Mostrar logs',
            hideLogs: 'Ocultar logs',
            download: 'Descargar',
            destinationFolder: 'Carpeta de destino',
            customPlaceholder: 'Personalizado (Vacío = Descargas)',
            button1: 'Carpeta Rápida 1',
            button2: 'Carpeta Rápida 2',
            button3: 'Carpeta Rápida 3',
            // Settings
            settings: 'Configuración',
            quickFolder1: 'Carpeta rápida 1',
            quickFolder2: 'Carpeta rápida 2',
            quickFolder3: 'Carpeta rápida 3',
            folderDepth: 'Profundidad de carpeta',
            folderDepthDesc: 'Niveles de carpeta relativos al proyecto (0 = Misma carpeta)',
            defaultFormat: 'Formato predeterminado',
            autoImport: 'Importar automáticamente en Premiere',
            createBin: 'Crear carpeta de proyecto',
            cookieBrowserLabel: 'Navegador para cookies',
            firefoxRecommended: 'Firefox (recomendado)',
            save: 'Guardar',
            // Advanced
            advancedTools: 'Herramientas avanzadas',
            advancedToolsDesc: 'Rutas personalizadas opcionales. Déjalo vacío para detección automática.',
            ytdlpPath: 'Ruta de yt-dlp',
            ffmpegPath: 'Ruta de ffmpeg',
            denoPath: 'Ruta de deno (opcional)',
            browsePath: 'Examinar',
            settingsSaved: '¡Configuración guardada!',
            updateAvailable: '🚀 ¡Nueva versión disponible! Haz clic para actualizar.',
        },
        de: {
            // Main UI
            urlLabel: 'YouTube-URL',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'Leeren',
            formatLabel: 'Format',
            formatBoth: 'Video + Audio',
            formatVideo: 'Nur Video',
            formatAudio: 'Nur Audio',
            timeRange: 'Zeitbereich',
            start: 'Start',
            end: 'Ende',
            codecLabel: 'Qualität und Codec',
            qualityMax: 'Maximal',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: 'Geschätzte Größe',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: 'Wird berechnet...',
            estimatedSizeUnavailable: 'Nicht verfügbar',
            showLogs: 'Logs anzeigen',
            hideLogs: 'Logs ausblenden',
            download: 'Herunterladen',
            destinationFolder: 'Zielordner',
            customPlaceholder: 'Benutzerdefiniert (Leer = Downloads)',
            button1: 'Schnellordner 1',
            button2: 'Schnellordner 2',
            button3: 'Schnellordner 3',
            // Settings
            settings: 'Einstellungen',
            quickFolder1: 'Schnellordner 1',
            quickFolder2: 'Schnellordner 2',
            quickFolder3: 'Schnellordner 3',
            folderDepth: 'Ordnertiefe',
            folderDepthDesc: 'Ordnerebenen relativ zur Projektdatei (0 = Gleicher Ordner)',
            defaultFormat: 'Standardformat',
            autoImport: 'Automatisch in Premiere importieren',
            createBin: 'Projektordner erstellen',
            cookieBrowserLabel: 'Browser für Cookies',
            firefoxRecommended: 'Firefox (empfohlen)',
            save: 'Speichern',
            // Advanced
            advancedTools: 'Erweiterte Werkzeuge',
            advancedToolsDesc: 'Optionale benutzerdefinierte Pfade. Leer lassen für automatische Erkennung.',
            ytdlpPath: 'yt-dlp-Pfad',
            ffmpegPath: 'ffmpeg-Pfad',
            denoPath: 'deno-Pfad (optional)',
            browsePath: 'Durchsuchen',
            settingsSaved: 'Einstellungen gespeichert!',
            updateAvailable: '🚀 Neue Version verfügbar! Klicke zum Aktualisieren.',
        },
        'pt-BR': {
            // Main UI
            urlLabel: 'URL do YouTube',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'Limpar',
            formatLabel: 'Formato',
            formatBoth: 'Vídeo + Áudio',
            formatVideo: 'Somente vídeo',
            formatAudio: 'Somente áudio',
            timeRange: 'Intervalo de tempo',
            start: 'Início',
            end: 'Fim',
            codecLabel: 'Qualidade e Codec',
            qualityMax: 'Máxima',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: 'Tamanho estimado',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: 'Calculando...',
            estimatedSizeUnavailable: 'Indisponível',
            showLogs: 'Mostrar logs',
            hideLogs: 'Ocultar logs',
            download: 'Baixar',
            destinationFolder: 'Pasta de destino',
            customPlaceholder: 'Personalizado (Vazio = Downloads)',
            button1: 'Pasta Rápida 1',
            button2: 'Pasta Rápida 2',
            button3: 'Pasta Rápida 3',
            // Settings
            settings: 'Configurações',
            quickFolder1: 'Pasta rápida 1',
            quickFolder2: 'Pasta rápida 2',
            quickFolder3: 'Pasta rápida 3',
            folderDepth: 'Profundidade da pasta',
            folderDepthDesc: 'Níveis de pasta relativos ao arquivo do projeto (0 = Mesma pasta)',
            defaultFormat: 'Formato padrão',
            autoImport: 'Importar automaticamente para o Premiere',
            createBin: 'Criar pasta do projeto',
            cookieBrowserLabel: 'Navegador para cookies',
            firefoxRecommended: 'Firefox (recomendado)',
            save: 'Salvar',
            // Advanced
            advancedTools: 'Ferramentas avançadas',
            advancedToolsDesc: 'Caminhos personalizados opcionais. Deixe vazio para detecção automática.',
            ytdlpPath: 'Caminho do yt-dlp',
            ffmpegPath: 'Caminho do ffmpeg',
            denoPath: 'Caminho do deno (opcional)',
            browsePath: 'Procurar',
            settingsSaved: 'Configurações salvas!',
            updateAvailable: '🚀 Nova versão disponível! Clique para atualizar.',
        },
        ja: {
            // Main UI
            urlLabel: 'YouTube URL',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'クリア',
            formatLabel: '形式',
            formatBoth: '動画 + 音声',
            formatVideo: '動画のみ',
            formatAudio: '音声のみ',
            timeRange: '時間範囲',
            start: '開始',
            end: '終了',
            codecLabel: '画質とコーデック',
            qualityMax: '最高',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: '推定サイズ',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: '計算中...',
            estimatedSizeUnavailable: '利用不可',
            showLogs: 'ログを表示',
            hideLogs: 'ログを隠す',
            download: 'ダウンロード',
            destinationFolder: '保存先フォルダー',
            customPlaceholder: 'カスタム (空 = ダウンロード)',
            button1: 'クイックフォルダー 1',
            button2: 'クイックフォルダー 2',
            button3: 'クイックフォルダー 3',
            // Settings
            settings: '設定',
            quickFolder1: 'クイックフォルダー 1',
            quickFolder2: 'クイックフォルダー 2',
            quickFolder3: 'クイックフォルダー 3',
            folderDepth: 'フォルダー階層',
            folderDepthDesc: 'プロジェクトファイルからのフォルダー階層 (0 = 同じフォルダー)',
            defaultFormat: 'デフォルト形式',
            autoImport: 'Premiereへ自動インポート',
            createBin: 'プロジェクトフォルダーを作成',
            cookieBrowserLabel: 'Cookie用ブラウザー',
            firefoxRecommended: 'Firefox (推奨)',
            save: '保存',
            // Advanced
            advancedTools: '詳細ツール',
            advancedToolsDesc: '任意のカスタムパス。空欄で自動検出します。',
            ytdlpPath: 'yt-dlp パス',
            ffmpegPath: 'ffmpeg パス',
            denoPath: 'deno パス (任意)',
            browsePath: '参照',
            settingsSaved: '設定を保存しました！',
            updateAvailable: '🚀 新しいバージョンがあります！クリックして更新。',
        },
        it: {
            // Main UI
            urlLabel: 'URL YouTube',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'Cancella',
            formatLabel: 'Formato',
            formatBoth: 'Video + Audio',
            formatVideo: 'Solo video',
            formatAudio: 'Solo audio',
            timeRange: 'Intervallo temporale',
            start: 'Inizio',
            end: 'Fine',
            codecLabel: 'Qualità e Codec',
            qualityMax: 'Massima',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: 'Dimensione stimata',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: 'Calcolo in corso...',
            estimatedSizeUnavailable: 'Non disponibile',
            showLogs: 'Mostra log',
            hideLogs: 'Nascondi log',
            download: 'Scarica',
            destinationFolder: 'Cartella di destinazione',
            customPlaceholder: 'Personalizzato (Vuoto = Download)',
            button1: 'Cartella Rapida 1',
            button2: 'Cartella Rapida 2',
            button3: 'Cartella Rapida 3',
            // Settings
            settings: 'Impostazioni',
            quickFolder1: 'Cartella rapida 1',
            quickFolder2: 'Cartella rapida 2',
            quickFolder3: 'Cartella rapida 3',
            folderDepth: 'Profondità cartella',
            folderDepthDesc: 'Livelli cartella relativi al file progetto (0 = Stessa cartella)',
            defaultFormat: 'Formato predefinito',
            autoImport: 'Importazione automatica in Premiere',
            createBin: 'Crea cartella progetto',
            cookieBrowserLabel: 'Browser per i cookie',
            firefoxRecommended: 'Firefox (consigliato)',
            save: 'Salva',
            // Advanced
            advancedTools: 'Strumenti avanzati',
            advancedToolsDesc: 'Percorsi personalizzati opzionali. Lascia vuoto per il rilevamento automatico.',
            ytdlpPath: 'Percorso yt-dlp',
            ffmpegPath: 'Percorso ffmpeg',
            denoPath: 'Percorso deno (opzionale)',
            browsePath: 'Sfoglia',
            settingsSaved: 'Impostazioni salvate!',
            updateAvailable: '🚀 Nuova versione disponibile! Clicca per aggiornare.',
        },
        'zh-CN': {
            // Main UI
            urlLabel: 'YouTube 链接',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: '清除',
            formatLabel: '格式',
            formatBoth: '视频 + 音频',
            formatVideo: '仅视频',
            formatAudio: '仅音频',
            timeRange: '时间范围',
            start: '开始',
            end: '结束',
            codecLabel: '画质与编码',
            qualityMax: '最高',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: '预计大小',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: '正在计算...',
            estimatedSizeUnavailable: '不可用',
            showLogs: '显示日志',
            hideLogs: '隐藏日志',
            download: '下载',
            destinationFolder: '目标文件夹',
            customPlaceholder: '自定义 (留空 = 下载文件夹)',
            button1: '快捷文件夹 1',
            button2: '快捷文件夹 2',
            button3: '快捷文件夹 3',
            // Settings
            settings: '设置',
            quickFolder1: '快捷文件夹 1',
            quickFolder2: '快捷文件夹 2',
            quickFolder3: '快捷文件夹 3',
            folderDepth: '文件夹层级',
            folderDepthDesc: '相对于项目文件的文件夹层级 (0 = 同一文件夹)',
            defaultFormat: '默认格式',
            autoImport: '自动导入到 Premiere',
            createBin: '创建项目文件夹',
            cookieBrowserLabel: '用于 Cookies 的浏览器',
            firefoxRecommended: 'Firefox（推荐）',
            save: '保存',
            // Advanced
            advancedTools: '高级工具',
            advancedToolsDesc: '可选自定义路径。留空将自动检测。',
            ytdlpPath: 'yt-dlp 路径',
            ffmpegPath: 'ffmpeg 路径',
            denoPath: 'deno 路径 (可选)',
            browsePath: '浏览',
            settingsSaved: '设置已保存！',
            updateAvailable: '🚀 有新版本可用！点击更新。',
        },
        ru: {
            // Main UI
            urlLabel: 'URL YouTube',
            urlPlaceholder: 'https://www.youtube.com/watch?v=...',
            clearBtn: 'Очистить',
            formatLabel: 'Формат',
            formatBoth: 'Видео + Аудио',
            formatVideo: 'Только видео',
            formatAudio: 'Только аудио',
            timeRange: 'Диапазон времени',
            start: 'Начало',
            end: 'Конец',
            codecLabel: 'Качество и Кодек',
            qualityMax: 'Максимум',
            quality144: '144p',
            quality360: '360p',
            quality480: '480p',
            quality720: '720p',
            quality1080: '1080p',
            quality4k: '4K',
            estimatedSizeLabel: 'Оценочный размер',
            estimatedSizeUnknownValue: '--',
            estimatedSizeLoading: 'Расчет...',
            estimatedSizeUnavailable: 'Недоступно',
            showLogs: 'Показать логи',
            hideLogs: 'Скрыть логи',
            download: 'Скачать',
            destinationFolder: 'Папка назначения',
            customPlaceholder: 'Пользовательская (Пусто = Загрузки)',
            button1: 'Быстрая папка 1',
            button2: 'Быстрая папка 2',
            button3: 'Быстрая папка 3',
            // Settings
            settings: 'Настройки',
            quickFolder1: 'Быстрая папка 1',
            quickFolder2: 'Быстрая папка 2',
            quickFolder3: 'Быстрая папка 3',
            folderDepth: 'Глубина папки',
            folderDepthDesc: 'Уровни папки относительно файла проекта (0 = Та же папка)',
            defaultFormat: 'Формат по умолчанию',
            autoImport: 'Авто-импорт в Premiere',
            createBin: 'Создать папку проекта',
            cookieBrowserLabel: 'Браузер для Cookies',
            firefoxRecommended: 'Firefox (рекомендуется)',
            save: 'Сохранить',
            // Advanced
            advancedTools: 'Расширенные инструменты',
            advancedToolsDesc: 'Необязательные пользовательские пути. Оставьте пустым для автоопределения.',
            ytdlpPath: 'Путь yt-dlp',
            ffmpegPath: 'Путь ffmpeg',
            denoPath: 'Путь deno (опционально)',
            browsePath: 'Обзор',
            settingsSaved: 'Настройки сохранены!',
            updateAvailable: '🚀 Доступна новая версия! Нажмите для обновления.',
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
