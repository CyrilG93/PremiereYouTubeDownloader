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

// --- STATE ---
let selectedFormat = 'both';
let isDownloading = false;
let downloadAbortController = null;

// --- SETTINGS ---
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');

    if (settings.defaultFolder) {
        folderPath.value = settings.defaultFolder;
        document.getElementById('defaultFolder').value = settings.defaultFolder;
    } else {
        folderPath.value = './ELEMENTS';
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

    // Load current folder path
    if (settings.currentFolder) {
        folderPath.value = settings.currentFolder;
    }
}

function saveSettings() {
    const settings = {
        defaultFolder: document.getElementById('defaultFolder').value,
        defaultFormat: document.getElementById('defaultFormat').value,
        autoImport: document.getElementById('autoImport').checked,
        createBin: document.getElementById('createBin').checked,
        pathType: document.querySelector('input[name="pathType"]:checked').value,
        currentFolder: folderPath.value.trim()
    };

    localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));
    folderPath.value = settings.defaultFolder;

    showStatus('Paramètres enregistrés', 'success');
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
    csInterface.evalScript('selectFolder()', (result) => {
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

saveSettingsBtn.addEventListener('click', saveSettings);
// Save path preferences when changed
folderPath.addEventListener('change', () => {
    const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
    settings.currentFolder = folderPath.value.trim();
    localStorage.setItem('ytDownloaderSettings', JSON.stringify(settings));
});

pathTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
        settings.pathType = radio.value;
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
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
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
    csInterface.evalScript('getProjectPath()', (result) => {
        callback(result);
    });
}

function resolveFolderPath(callback) {
    const pathType = document.querySelector('input[name="pathType"]:checked').value;
    const folder = folderPath.value.trim();

    if (pathType === 'absolute') {
        callback(folder);
    } else {
        // Relative to project - go up one level from PROJETS folder
        getProjectPath((projectPath) => {
            if (!projectPath || projectPath === 'null') {
                showStatus('Veuillez d\'abord enregistrer votre projet Premiere', 'warning');
                callback(null);
                return;
            }

            // Get project directory (e.g., D:\...\PROJETS)
            const projectDir = projectPath.substring(0, projectPath.lastIndexOf('\\'));
            // Go up one level to parent (e.g., D:\...\NomProjet)
            const parentDir = projectDir.substring(0, projectDir.lastIndexOf('\\'));
            // Append folder name
            const fullPath = `${parentDir}\\${folder}`;
            callback(fullPath);
        });
    }
}

// --- DOWNLOAD LOGIC ---
async function downloadVideo() {
    if (!downloader) {
        showStatus('Erreur critique: Module de téléchargement non chargé', 'error');
        return;
    }

    const url = urlInput.value.trim();

    if (!url) {
        showStatus('Veuillez entrer une URL YouTube', 'error');
        return;
    }

    if (!isValidYouTubeUrl(url)) {
        showStatus('URL YouTube invalide', 'error');
        return;
    }

    resolveFolderPath(async (destinationPath) => {
        if (!destinationPath) {
            showStatus('Veuillez choisir un dossier de destination valide', 'error');
            return;
        }

        isDownloading = true;
        downloadBtn.classList.add('downloading');
        downloadBtn.querySelector('span').textContent = 'Téléchargement...';
        cancelBtn.classList.add('active');
        progressContainer.classList.add('active');
        updateProgress(0, 'Initialisation...');

        downloadAbortController = new AbortController();

        try {
            const options = {
                url: url,
                format: selectedFormat,
                destination: destinationPath,
                signal: downloadAbortController.signal,
                onProgress: (data) => {
                    updateProgress(data.progress, data.status);
                },
                onComplete: (filePath) => {
                    updateProgress(100, 'Téléchargement terminé');

                    const settings = JSON.parse(localStorage.getItem('ytDownloaderSettings') || '{}');
                    if (settings.autoImport !== false) {
                        setTimeout(() => {
                            importToPremiere(filePath, settings.createBin !== false);
                        }, 500);
                    } else {
                        showStatus('Téléchargement terminé avec succès', 'success');
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
                        showStatus('Le temps de fin doit être après le temps de début', 'error');
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
                showStatus('Téléchargement annulé', 'warning');
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
        showStatus('Erreur: Fichier introuvable pour import', 'error');
        resetDownloadButton();
        return;
    }
    console.log(`File exists: YES`);

    // Extract folder name from path (remove ./ ../ prefixes)
    let binName = folderPath.value.trim() || 'YouTube Downloads';
    // Remove all ./ and ../ prefixes to get just the folder name
    binName = binName.replace(/^(\.\.?[\/\\])+/, '');
    // If there's a path separator, get the last part
    if (binName.includes('\\') || binName.includes('/')) {
        binName = binName.split(/[\/\\]/).pop();
    }
    console.log(`Bin name: ${binName}`);

    const escapedPath = filePath.replace(/\\/g, '\\\\');
    console.log(`Escaped path: ${escapedPath}`);

    const scriptCommand = `importMedia("${escapedPath}", "${binName}", ${createBin})`;
    console.log(`ExtendScript command: ${scriptCommand}`);

    csInterface.evalScript(scriptCommand, (result) => {
        console.log(`Import result from ExtendScript: ${result}`);
        if (result === 'success') {
            showStatus('Importé dans Premiere avec succès', 'success');
        } else {
            // Log error but don't show popup since file is downloaded successfully
            console.error(`Import failed with result: ${result}`);
            showStatus('Téléchargement terminé avec succès', 'success');
        }
        resetDownloadButton();
    });
}

function resetDownloadButton() {
    isDownloading = false;
    downloadBtn.classList.remove('downloading');
    downloadBtn.querySelector('span').textContent = 'Télécharger';
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
        updateProgress(0, 'Annulation...');
    }
});

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
});

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
