// Global Error Handler for startup crashes
window.onerror = function (msg, url, line, col, error) {
    console.error(`Critical Error: ${msg}\nLine: ${line}\nFile: ${url}`);
    return false;
};

// Initialize CSInterface
const csInterface = new CSInterface();
const path = require('path');
const fs = require('fs');

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

console.log("YouTube Downloader v2.0 - Serverless Mode Initialized");

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

// --- STATE ---
let selectedFormat = 'both';
let selectedFolderSlot = '1';
let selectedCodec = 'h264';
let isDownloading = false;
let downloadAbortController = null;

// --- SETTINGS ---
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');

    // Load folder presets
    const presets = {
        1: settings.folderPreset1 || 'Bouton 1',
        2: settings.folderPreset2 || 'Bouton 2',
        3: settings.folderPreset3 || 'Bouton 3'
    };

    // Update preset input fields
    if (folderPreset1Input) folderPreset1Input.value = settings.folderPreset1 || '';
    if (folderPreset2Input) folderPreset2Input.value = settings.folderPreset2 || '';
    if (folderPreset3Input) folderPreset3Input.value = settings.folderPreset3 || '';

    // Update button labels
    folderQuickBtns.forEach(btn => {
        const slot = btn.dataset.folderSlot;
        if (slot !== 'custom' && presets[slot]) {
            btn.querySelector('span').textContent = presets[slot];
        }
    });

    // Load selected folder slot
    if (settings.selectedFolderSlot) {
        selectedFolderSlot = settings.selectedFolderSlot;
        folderQuickBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.folderSlot === selectedFolderSlot);
        });
    }

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

    // Load path type
    if (settings.pathType) {
        const radio = document.querySelector(`input[name="pathType"][value="${settings.pathType}"]`);
        if (radio) radio.checked = true;
    }

    // Load custom tool paths
    if (customYtdlpPathInput) customYtdlpPathInput.value = settings.customYtdlpPath || '';
    if (customFfmpegPathInput) customFfmpegPathInput.value = settings.customFfmpegPath || '';
    if (customDenoPathInput) customDenoPathInput.value = settings.customDenoPath || '';
}

function saveSettings() {
    const settings = {
        folderPreset1: folderPreset1Input ? folderPreset1Input.value.trim() : '',
        folderPreset2: folderPreset2Input ? folderPreset2Input.value.trim() : '',
        folderPreset3: folderPreset3Input ? folderPreset3Input.value.trim() : '',
        defaultFormat: document.getElementById('defaultFormat').value,
        autoImport: document.getElementById('autoImport').checked,
        createBin: document.getElementById('createBin').checked,
        pathType: document.querySelector('input[name="pathType"]:checked').value,
        customFolderPath: folderPath.value.trim(),
        selectedFolderSlot: selectedFolderSlot,
        // Custom tool paths
        customYtdlpPath: customYtdlpPathInput ? customYtdlpPathInput.value.trim() : '',
        customFfmpegPath: customFfmpegPathInput ? customFfmpegPathInput.value.trim() : '',
        customDenoPath: customDenoPathInput ? customDenoPathInput.value.trim() : ''
    };

    localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));

    // Update button labels after save
    folderQuickBtns.forEach(btn => {
        const slot = btn.dataset.folderSlot;
        if (slot === '1' && settings.folderPreset1) {
            btn.querySelector('span').textContent = settings.folderPreset1;
        } else if (slot === '2' && settings.folderPreset2) {
            btn.querySelector('span').textContent = settings.folderPreset2;
        } else if (slot === '3' && settings.folderPreset3) {
            btn.querySelector('span').textContent = settings.folderPreset3;
        }
    });

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
            document.querySelector('input[name="pathType"][value="absolute"]').checked = true;
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
        if (targetInput) {
            // Use ExtendScript to open file dialog
            csInterface.evalScript('File.openDialog("Select executable")', (result) => {
                if (result && result !== 'null') {
                    targetInput.value = result;
                }
            });
        }
    });
});

saveSettingsBtn.addEventListener('click', saveSettings);
folderPath.addEventListener('change', () => {
    const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
    settings.customFolderPath = folderPath.value.trim();
    localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));
});

pathTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
        settings.pathType = radio.value;
        localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));
    });
});

// Folder quick select buttons
folderQuickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        folderQuickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedFolderSlot = btn.dataset.folderSlot;

        // Save selection
        const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
        settings.selectedFolderSlot = selectedFolderSlot;
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
    const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
    let folder;

    // Determine folder based on selected slot
    if (selectedFolderSlot === 'custom') {
        // Custom: use textbox value
        const pathType = document.querySelector('input[name="pathType"]:checked').value;
        folder = folderPath.value.trim();

        if (pathType === 'absolute') {
            callback(folder);
            return;
        }
    } else {
        // Preset: use preset value (always relative)
        folder = settings[`folderPreset${selectedFolderSlot}`] || `Bouton ${selectedFolderSlot}`;
    }

    // Relative path resolution
    getProjectPath((projectPath) => {
        if (!projectPath || projectPath === 'null') {
            showStatus(i18n.get('errorSaveProject'), 'warning');
            callback(null);
            return;
        }

        // Cross-platform path handling using path module
        // Get project directory (e.g., D:\...\PROJETS or /Users/.../PROJETS)
        const projectDir = path.dirname(projectPath);
        // Go up one level to parent (e.g., D:\...\NomProjet or /Users/.../NomProjet)
        const parentDir = path.dirname(projectDir);
        // Append folder name using platform-appropriate separator
        const fullPath = path.join(parentDir, folder);
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
            const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
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
                onProgress: (data) => {
                    updateProgress(data.progress, data.status);
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
    const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
    let binName;

    if (selectedFolderSlot === 'custom') {
        // Custom: use textbox value (keep full path for nested bins)
        binName = folderPath.value.trim() || 'YouTube Downloads';
        // Remove leading ./ and ../ prefixes only
        binName = binName.replace(/^(\.\.?[\\/\\\\])+/, '');
    } else {
        // Preset: use preset value (keep full path for nested bins)
        binName = settings[`folderPreset${selectedFolderSlot}`] || `Bouton ${selectedFolderSlot}`;
        // Remove leading ./ and ../ prefixes only
        binName = binName.replace(/^(\.\.?[\\/\\\\])+/, '');
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
});

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

// Time input formatting
function formatTimeInput(input) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^0-9:]/g, '');

        if (value.length === 2 && !value.includes(':')) {
            value += ':';
        }

        e.target.value = value;
    });

    input.addEventListener('blur', (e) => {
        let value = e.target.value;
        if (value && !value.includes(':')) {
            e.target.value = value + ':00';
        }
    });
}

formatTimeInput(startTime);
formatTimeInput(endTime);
