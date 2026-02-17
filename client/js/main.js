// Global Error Handler for startup crashes
window.onerror = function (msg, url, line, col, error) {
    console.error(`Critical Error: ${msg}\nLine: ${line}\nFile: ${url}`);
    return false;
};

// Initialize CSInterface
const csInterface = new CSInterface();
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- MODULE LOADING ---
let downloader;

try {
    // Define possible paths for downloader.js
    const possiblePaths = [
        path.join(__dirname, 'client', 'js', 'downloader.js'),
        path.join(__dirname, 'js', 'downloader.js'),
        path.join(__dirname, 'downloader.js')
    ];

    console.log(`Searching for downloader.js...`);

    let foundPath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            foundPath = p;
            break;
        }
    }

    if (foundPath) {
        console.log(`Found downloader at: ${foundPath}`);
        downloader = require(foundPath);
        console.log('Downloader loaded successfully.');
    } else {
        console.error(`downloader.js not found in any checked path`);
    }
} catch (e) {
    console.error('Error loading downloader:', e);
}

// --- LOGGING SYSTEM ---
const logsContainer = document.getElementById('logsContainer');
const toggleLogsBtn = document.getElementById('toggleLogsBtn');

function addLog(message, type = 'normal') {
    if (!logsContainer) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    entry.textContent = `[${time}] ${message}`;
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}

const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
    originalLog.apply(console, args);
    addLog(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '));
};

console.error = function (...args) {
    originalError.apply(console, args);
    addLog(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' '), 'error');
};

console.log("YouTube Downloader v2.6.2 - Serverless Mode Initialized");

if (toggleLogsBtn) {
    toggleLogsBtn.addEventListener('click', () => {
        logsContainer.classList.toggle('active');
        toggleLogsBtn.classList.toggle('active');
    });
}

// --- DOM ELEMENTS ---
const urlInput = document.getElementById('urlInput');
const clearBtn = document.getElementById('clearBtn');
const formatBtns = document.querySelectorAll('.format-btn');
const enableTimeRange = document.getElementById('enableTimeRange');
const timeInputs = document.getElementById('timeInputs');
const startTime = document.getElementById('startTime');
const endTime = document.getElementById('endTime');
const folderPath = document.getElementById('folderPath');
const browseBtn = document.getElementById('browseBtn');
const pathTypeRadios = document.querySelectorAll('input[name="pathType"]');
const downloadBtn = document.getElementById('downloadBtn');
const cancelBtn = document.getElementById('cancelBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const statusMessage = document.getElementById('statusMessage');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const folderQuickBtns = document.querySelectorAll('.folder-quick-btn');
const folderPreset1Input = document.getElementById('folderPreset1');
const folderPreset2Input = document.getElementById('folderPreset2');
const folderPreset3Input = document.getElementById('folderPreset3');
const customYtdlpPathInput = document.getElementById('customYtdlpPath');
const customFfmpegPathInput = document.getElementById('customFfmpegPath');
const customDenoPathInput = document.getElementById('customDenoPath');
const codecQuickBtns = document.querySelectorAll('.codec-quick-btn');
const codecSection = document.getElementById('codecSection');
const folderDepthInput = document.getElementById('folderDepth');

// --- STATE ---
let selectedFormat = 'both';
let selectedFolderSlot = '1';
let selectedCodec = 'h264';
let isDownloading = false;
let downloadAbortController = null;

// --- SETTINGS STORAGE HELPERS ---
function getSettingsDir() {
    const platform = os.platform();
    if (platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', 'PremiereYouTubeDownloader');
    } else {
        return path.join(process.env.APPDATA || os.homedir(), 'PremiereYouTubeDownloader');
    }
}

function getSettingsFilePath() {
    return path.join(getSettingsDir(), 'settings.json');
}

function readSettingsFromFile() {
    try {
        const filePath = getSettingsFilePath();
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error reading settings file:', e);
    }
    return null;
}

function writeSettingsToFile(settings) {
    try {
        const dir = getSettingsDir();
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = getSettingsFilePath();
        fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
        console.log('Settings saved to file:', filePath);
    } catch (e) {
        console.error('Error writing settings file:', e);
    }
}

// --- SETTINGS ---
function loadSettings() {
    let settings = null;
    let migrated = false;

    // 1. Try to load from persistent file
    const fileSettings = readSettingsFromFile();
    if (fileSettings) {
        settings = fileSettings;
        console.log('Settings loaded from persistent file');
    } else {
        // 2. Fallback: load from localStorage (migration)
        const localSettings = localStorage.getItem('ytDownloaderSettings');
        if (localSettings) {
            try {
                settings = JSON.parse(localSettings);
                migrated = true;
                console.log('Settings migrated from localStorage');
            } catch (e) {
                console.error('Error parsing localStorage settings:', e);
            }
        }
    }

    // Default empty if nothing found
    if (!settings) settings = {};

    // 3. If migrated, save to file immediately
    if (migrated) {
        writeSettingsToFile(settings);
    }

    // Ensure localStorage is synced (backup)
    localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));

    // Load folder presets
    const presets = {
        1: settings.folderPreset1 || i18n.get('button1'),
        2: settings.folderPreset2 || i18n.get('button2'),
        3: settings.folderPreset3 || i18n.get('button3')
    };

    // Update preset input fields
    if (folderPreset1Input) folderPreset1Input.value = settings.folderPreset1 || '';
    if (folderPreset2Input) folderPreset2Input.value = settings.folderPreset2 || '';
    if (folderPreset3Input) folderPreset3Input.value = settings.folderPreset3 || '';

    // Button labels are updated by updateQuickFolderVisuals below
    // to handle the absolute path truncation logic centrally

    updateQuickFolderVisuals(settings);
}

function updateQuickFolderVisuals(settings) {
    if (!folderQuickBtns) return;

    folderQuickBtns.forEach(btn => {
        const slot = btn.dataset.folderSlot;
        if (slot === 'custom') return;

        // helper to get value
        // if inside loadSettings, settings might be partial, but here we pass full settings obj
        // or we can re-read if needed, but passing is better.
        // Fallback to i18n default if empty
        const value = settings[`folderPreset${slot}`] || i18n.get(`button${slot}`);

        // Update label logic:
        // If absolute path -> show basename only (e.g. "Test" from "C:/.../Test")
        // If relative path -> show value as is
        const normalizedValue = path.normalize(value);
        if (value && path.isAbsolute(normalizedValue)) {
            // Absolute: show basename
            // Handle root paths (C:\ or /) gracefully if needed, but basename usually works
            btn.querySelector('span').textContent = path.basename(normalizedValue);
        } else {
            // Relative: show as is
            btn.querySelector('span').textContent = value;
        }
    });

    // Load selected folder slot - Default to 'custom' if not set (first run)
    selectedFolderSlot = settings.selectedFolderSlot || 'custom';
    folderQuickBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.folderSlot === selectedFolderSlot);
    });

    // Load custom folder path
    if (settings.customFolderPath) {
        folderPath.value = settings.customFolderPath;
    } else {
        folderPath.value = '';
    }

    if (settings.defaultFormat) {
        selectedFormat = settings.defaultFormat;
        formatBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.format === selectedFormat);
        });
        document.getElementById('defaultFormat').value = selectedFormat;
    }

    if (settings.autoImport !== undefined) {
        document.getElementById('autoImport').checked = settings.autoImport;
    }

    if (settings.createBin !== undefined) {
        document.getElementById('createBin').checked = settings.createBin;
    }



    // Load custom tool paths & depth
    if (customYtdlpPathInput) customYtdlpPathInput.value = settings.customYtdlpPath || '';
    if (customFfmpegPathInput) customFfmpegPathInput.value = settings.customFfmpegPath || '';
    if (customDenoPathInput) customDenoPathInput.value = settings.customDenoPath || '';
    if (folderDepthInput) folderDepthInput.value = settings.folderDepth !== undefined ? settings.folderDepth : 0;
    if (settings.cookieBrowser && document.getElementById('cookieBrowser')) {
        document.getElementById('cookieBrowser').value = settings.cookieBrowser;
    }
}

function saveSettings() {
    const settings = {
        folderPreset1: folderPreset1Input ? folderPreset1Input.value.trim() : '',
        folderPreset2: folderPreset2Input ? folderPreset2Input.value.trim() : '',
        folderPreset3: folderPreset3Input ? folderPreset3Input.value.trim() : '',
        defaultFormat: document.getElementById('defaultFormat').value,
        autoImport: document.getElementById('autoImport').checked,
        createBin: document.getElementById('createBin').checked,
        customFolderPath: folderPath.value.trim(),
        selectedFolderSlot: selectedFolderSlot,
        // Custom tool paths
        customYtdlpPath: customYtdlpPathInput ? customYtdlpPathInput.value.trim() : '',
        customFfmpegPath: customFfmpegPathInput ? customFfmpegPathInput.value.trim() : '',
        customDenoPath: customDenoPathInput ? customDenoPathInput.value.trim() : '',
        folderDepth: folderDepthInput ? parseInt(folderDepthInput.value, 10) : 0,
        cookieBrowser: document.getElementById('cookieBrowser') ? document.getElementById('cookieBrowser').value : 'firefox'
    };

    // Save to persistent file
    writeSettingsToFile(settings);

    // Save to localStorage (backup/legacy)
    localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));

    // Update button labels after save
    // Update button labels and visuals after save

    updateQuickFolderVisuals(settings);

    showStatus(i18n.get('settingsSaved'), 'success');
    setTimeout(() => {
        settingsPanel.classList.remove('active');
    }, 1000);
}

// --- EVENT LISTENERS ---
clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInput.focus();
});

formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        formatBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFormat = btn.dataset.format;
        // Disable codec section for audio-only downloads
        if (codecSection) {
            codecSection.classList.toggle('disabled', selectedFormat === 'audio');
        }
    });
});

// Codec quick select buttons
codecQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        codecQuickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCodec = btn.dataset.codec;
    });
});

enableTimeRange.addEventListener('change', () => {
    if (enableTimeRange.checked) {
        timeInputs.style.opacity = '1';
        timeInputs.style.pointerEvents = 'all';
    } else {
        timeInputs.style.opacity = '0.5';
        timeInputs.style.pointerEvents = 'none';
    }
});

browseBtn.addEventListener('click', () => {
    csInterface.evalScript('YouTube_selectFolder()', (result) => {
        if (result && result !== 'null') {
            folderPath.value = result;
        }
    });
});

settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('active');
});

closeSettingsBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
});

// Browse path buttons for tool path settings
document.querySelectorAll('.browse-path-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetInputId = btn.dataset.target;
        const targetInput = document.getElementById(targetInputId);
        const type = btn.dataset.type || 'file'; // file or folder

        if (targetInput) {
            // Use ExtendScript to open file dialog
            const script = type === 'folder'
                ? 'YouTube_selectFolder()'
                : 'File.openDialog("Select executable")';

            csInterface.evalScript(script, (result) => {
                if (result && result !== 'null') {
                    targetInput.value = result;
                }
            });
        }
    });
});

saveSettingsBtn.addEventListener('click', saveSettings);
folderPath.addEventListener('change', () => {
    const settings = readSettingsFromFile() || {};
    settings.customFolderPath = folderPath.value.trim();
    writeSettingsToFile(settings);
    localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));
});



// Folder quick select buttons
folderQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        folderQuickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFolderSlot = btn.dataset.folderSlot;

        // Save selection
        const settings = readSettingsFromFile() || {};
        settings.selectedFolderSlot = selectedFolderSlot;
        writeSettingsToFile(settings);
        localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));
    });
});

// --- UTILITY FUNCTIONS ---
function showStatus(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message active ${type}`;

    if (type === 'error') {
        console.error(message);
    } else {
        console.log(`Status: ${message}`);
    }

    setTimeout(() => {
        statusMessage.classList.remove('active');
    }, 5000);
}

function updateProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    progressPercent.textContent = `${Math.round(percent)}%`;
    if (text) {
        progressText.textContent = text;
    }
}

function isValidYouTubeUrl(url) {
    // Supports: youtube.com/watch, youtu.be, youtube.com/shorts
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[\w-]+/;
    return pattern.test(url);
}

function parseTime(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
}

function getProjectPath(callback) {
    csInterface.evalScript('YouTube_getProjectPath()', (result) => {
        callback(result);
    });
}

function resolveFolderPath(callback) {
    const settings = readSettingsFromFile() || {};
    let folder;

    // Default depth is 0
    const depth = settings.folderDepth !== undefined ? settings.folderDepth : 0;

    // Determine folder based on selected slot
    if (selectedFolderSlot === 'custom') {
        const customPath = folderPath.value.trim();

        if (!customPath) {
            // If empty, use OS Downloads folder (Absolute fallback)
            const downloadsDir = path.join(os.homedir(), 'Downloads');
            console.log(`Custom path empty, using OS Downloads: ${downloadsDir}`);
            callback(downloadsDir);
            return;
        }

        const normalizedCustom = path.normalize(customPath);
        if (path.isAbsolute(normalizedCustom)) {
            // Absolute path processing
            callback(normalizedCustom);
            return;
        } else {
            // Relative path processing
            folder = customPath;
        }
    } else {
        // Preset
        const presetValue = settings[`folderPreset${selectedFolderSlot}`] || i18n.get(`button${selectedFolderSlot}`);

        const normalizedPreset = path.normalize(presetValue);
        if (path.isAbsolute(normalizedPreset)) {
            // Absolute path in preset
            callback(normalizedPreset);
            return;
        }

        // Relative path in preset
        folder = presetValue;
    }

    // Clean folder name - remove ./ or ../ prefixes users might have added previously
    folder = folder.replace(/^(\.\.?[\\/\\\\])+/, '');

    // Relative path resolution
    getProjectPath((projectPath) => {
        if (!projectPath || projectPath === 'null') {
            showStatus(i18n.get('errorSaveProject'), 'warning');
            callback(null);
            return;
        }

        // Get project file directory
        let baseDir = path.dirname(projectPath);

        // Traverse up based on depth setting
        for (let i = 0; i < depth; i++) {
            baseDir = path.dirname(baseDir);
        }

        const fullPath = path.join(baseDir, folder);
        console.log(`Resolved path (Depth: ${depth}): ${fullPath}`);
        callback(fullPath);
    });
}

// --- DOWNLOAD LOGIC ---
async function downloadVideo() {
    if (!downloader) {
        showStatus(i18n.get('errorCritical'), 'error');
        return;
    }

    const url = urlInput.value.trim();

    if (!url) {
        showStatus(i18n.get('errorEnterUrl'), 'error');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showStatus(i18n.get('errorInvalidUrl'), 'error');
        return;
    }

    resolveFolderPath(async (destinationPath) => {
        if (!destinationPath) {
            showStatus(i18n.get('errorSelectFolder'), 'error');
            return;
        }

        isDownloading = true;
        downloadBtn.classList.add('downloading');
        downloadBtn.querySelector('span').textContent = i18n.get('downloading');
        cancelBtn.classList.add('active');
        progressContainer.classList.add('active');
        updateProgress(0, i18n.get('initializing'));

        downloadAbortController = new AbortController();

        try {
            const settings = readSettingsFromFile() || {};
            const options = {
                url: url,
                format: selectedFormat,
                codec: selectedFormat === 'audio' ? 'h264' : selectedCodec,
                destination: destinationPath,
                signal: downloadAbortController.signal,
                // Custom tool paths from settings
                customYtdlpPath: settings.customYtdlpPath || null,
                customFfmpegPath: settings.customFfmpegPath || null,
                customDenoPath: settings.customDenoPath || null,
                cookieBrowser: settings.cookieBrowser || 'firefox',
                onProgress: (data) => {
                    // Translate status message if it's a key, otherwise show as is
                    const statusText = i18n.get(data.status);
                    updateProgress(data.progress, statusText);
                },
                onComplete: (filePath) => {
                    updateProgress(100, i18n.get('downloadComplete'));

                    if (settings.autoImport !== false) {
                        setTimeout(() => {
                            importToPremiere(filePath, settings.createBin !== false);
                        }, 500);
                    } else {
                        showStatus(i18n.get('downloadSuccess'), 'success');
                        resetDownloadButton();
                    }
                },
                onError: (error) => {
                    console.error('Download error callback:', error);
                }
            };

            if (enableTimeRange.checked) {
                const start = parseTime(startTime.value);
                const end = parseTime(endTime.value);

                if (start !== null && end !== null) {
                    if (end <= start) {
                        showStatus(i18n.get('errorEndTime'), 'error');
                        resetDownloadButton();
                        return;
                    }
                    options.startTime = start;
                    options.endTime = end;
                }
            }

            await downloader.downloadVideo(options);

        } catch (error) {
            if (error.message === 'Download cancelled' || error.name === 'AbortError') {
                showStatus(i18n.get('cancelled'), 'warning');
            } else {
                showStatus(`Erreur: ${error.message}`, 'error');
            }
            resetDownloadButton();
        }
    });
}

function importToPremiere(filePath, createBin) {
    updateProgress(100, 'Import dans Premiere...');
    console.log(`=== IMPORT DEBUG ===`);
    console.log(`File path received: ${filePath}`);
    console.log(`Create bin: ${createBin}`);
    console.log(`File exists check...`);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
        console.error(`ERROR: File does not exist at path: ${filePath}`);
        showStatus(i18n.get('errorFileNotFound'), 'error');
        resetDownloadButton();
        return;
    }
    console.log(`File exists: YES`);

    // Determine bin name based on selected folder slot
    const settings = readSettingsFromFile() || {};
    let binName;

    if (selectedFolderSlot === 'custom') {
        // Custom: use textbox value
        binName = folderPath.value.trim() || 'YouTube Downloads';
        // If absolute path, use only basename for the bin
        if (path.isAbsolute(path.normalize(binName))) {
            binName = path.basename(binName);
        } else {
            // Remove leading ./ and ../ prefixes only
            binName = binName.replace(/^(\.\.?[\\/\\\\])+/, '');
        }
    } else {
        // Preset: use preset value
        binName = settings[`folderPreset${selectedFolderSlot}`] || `Bouton ${selectedFolderSlot}`;
        // If absolute path, use only basename for the bin
        if (path.isAbsolute(path.normalize(binName))) {
            binName = path.basename(binName);
        } else {
            // Remove leading ./ and ../ prefixes only
            binName = binName.replace(/^(\.\.?[\\/\\\\])+/, '');
        }
    }
    console.log(`Bin path: ${binName}`);

    const escapedPath = filePath.replace(/\\/g, '\\\\');
    console.log(`Escaped path: ${escapedPath}`);

    const scriptCommand = `YouTube_importMedia("${escapedPath}", "${binName}", ${createBin})`;
    console.log(`ExtendScript command: ${scriptCommand}`);

    csInterface.evalScript(scriptCommand, (result) => {
        console.log(`Import result from ExtendScript: ${result}`);
        if (result === 'success') {
            showStatus(i18n.get('importedSuccess'), 'success');
        } else {
            // Log error but don't show popup since file is downloaded successfully
            console.error(`Import failed with result: ${result}`);
            showStatus(i18n.get('downloadSuccess'), 'success');
        }
        resetDownloadButton();
    });
}

function resetDownloadButton() {
    isDownloading = false;
    downloadBtn.classList.remove('downloading');
    downloadBtn.querySelector('span').textContent = i18n.get('download');
    cancelBtn.classList.remove('active');
    downloadAbortController = null;
    setTimeout(() => {
        progressContainer.classList.remove('active');
    }, 2000);
}

downloadBtn.addEventListener('click', () => {
    if (!isDownloading) {
        downloadVideo();
    }
});

cancelBtn.addEventListener('click', () => {
    if (isDownloading && downloadAbortController) {
        downloadAbortController.abort();
        updateProgress(0, i18n.get('cancelling'));
    }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize i18n first
    i18n.init();
    initLanguageDropdown();

    loadSettings();
    checkForUpdates();
});

// ============================================================================
// UPDATE SYSTEM
// ============================================================================

const GITHUB_REPO = 'CyrilG93/PremiereYouTubeDownloader';
let CURRENT_VERSION = '2.6.2';

/**
 * Compare two version strings (e.g. "1.0.0" vs "1.0.1")
 */
function compareVersions(v1, v2) {
    const p1 = v1.replace(/^v/, '').split('.').map(Number);
    const p2 = v2.replace(/^v/, '').split('.').map(Number);
    const len = Math.max(p1.length, p2.length);

    for (let i = 0; i < len; i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

/**
 * Get current version from manifest
 */
function getAppVersion() {
    try {
        const path = require('path');
        const fs = require('fs');
        const manifestPath = path.join(__dirname, '..', '..', 'CSXS', 'manifest.xml');

        if (fs.existsSync(manifestPath)) {
            const content = fs.readFileSync(manifestPath, 'utf8');
            const match = content.match(/ExtensionBundleVersion="([^"]+)"/);
            if (match && match[1]) {
                return match[1];
            }
        }
    } catch (e) {
        console.error('[Update] Error reading manifest:', e);
    }
    return CURRENT_VERSION;
}

/**
 * Check for updates on GitHub
 */
async function checkForUpdates() {
    console.log('[Update] Checking for updates...');
    const localVersion = getAppVersion();
    console.log('[Update] Local version:', localVersion);

    // Update settings badge
    const versionBadge = document.getElementById('versionInfo');
    if (versionBadge) {
        versionBadge.textContent = 'v' + localVersion;
    }

    try {
        // Use Node.js https module to avoid CORS issues
        const https = require('https');
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_REPO}/releases/latest`,
            method: 'GET',
            headers: {
                'User-Agent': 'PremiereCommon-UpdateCheck'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const release = JSON.parse(data);
                        const latestVersion = release.tag_name.replace(/^v/, '');

                        console.log('[Update] Latest version:', latestVersion);

                        if (compareVersions(latestVersion, localVersion) > 0) {
                            console.log('[Update] New version available!');

                            // Find zip asset
                            const zipAsset = release.assets.find(asset => asset.name.endsWith('.zip'));
                            const downloadUrl = zipAsset ? zipAsset.browser_download_url : release.html_url;

                            showUpdateBanner(downloadUrl);
                        } else {
                            console.log('[Update] App is up to date.');
                        }
                    } else {
                        console.error('[Update] GitHub API error:', res.statusCode);
                    }
                } catch (e) {
                    console.error('[Update] Error parsing response:', e);
                }
            });
        });

        req.on('error', (e) => {
            console.error('[Update] Network error:', e);
        });

        req.end();

    } catch (e) {
        console.error('[Update] Unexpected error:', e);
    }
}

/**
 * Show update banner
 */
function showUpdateBanner(downloadUrl) {
    const banner = document.getElementById('updateBanner');
    if (banner) {
        banner.style.display = 'block';
        banner.onclick = function () {
            if (downloadUrl) {
                try {
                    csInterface.openURLInDefaultBrowser(downloadUrl);
                } catch (e) {
                    console.error('[Update] Error opening URL:', e);
                    // Fallback
                    try {
                        window.location.href = downloadUrl;
                    } catch (e2) {
                        console.error('[Update] Fallback failed:', e2);
                    }
                }
            }
        };
    }
}

// --- LANGUAGE DROPDOWN ---
function initLanguageDropdown() {
    const languageSelector = document.getElementById('languageSelector');
    const currentLangBtn = document.getElementById('currentLangBtn');
    const languageDropdown = document.getElementById('languageDropdown');

    if (!languageSelector || !currentLangBtn || !languageDropdown) return;

    // Populate dropdown with available languages
    const languages = i18n.getLanguages();
    languageDropdown.innerHTML = '';

    Object.entries(languages).forEach(([code, lang]) => {
        const btn = document.createElement('button');
        btn.setAttribute('data-lang', code);
        btn.textContent = `${lang.flag} ${lang.name}`;
        if (code === i18n.getCurrentLanguage()) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            i18n.setLanguage(code);
            // Restore custom folder preset names after language change
            loadSettings();
            // Update active state
            languageDropdown.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Close dropdown
            languageSelector.classList.remove('active');
        });
        languageDropdown.appendChild(btn);
    });

    // Set initial flag
    currentLangBtn.textContent = languages[i18n.getCurrentLanguage()].flag;

    // Toggle dropdown on button click
    currentLangBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        languageSelector.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        languageSelector.classList.remove('active');
    });
}

// Time input formatting for HH:MM:SS
function formatTimeInput(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9:]/g, '');

        // Count existing colons
        const colonCount = (value.match(/:/g) || []).length;

        // Auto-insert first colon after 2 digits (HH:)
        if (value.length === 2 && colonCount === 0) {
            value += ':';
        }
        // Auto-insert second colon after 5 chars (HH:MM:)
        else if (value.length === 5 && colonCount === 1) {
            value += ':';
        }

        e.target.value = value;
    });

    input.addEventListener('blur', (e) => {
        let value = e.target.value;
        if (!value) return;

        const parts = value.split(':');

        // Normalize to HH:MM:SS format
        if (parts.length === 1) {
            // Just numbers, assume as seconds or minutes
            e.target.value = '00:00:' + parts[0].padStart(2, '0');
        } else if (parts.length === 2) {
            // MM:SS format - add hours
            e.target.value = '00:' + parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
        } else if (parts.length === 3) {
            // HH:MM:SS format - just pad
            e.target.value = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0') + ':' + parts[2].padStart(2, '0');
        }
    });
}

formatTimeInput(startTime);
formatTimeInput(endTime);
