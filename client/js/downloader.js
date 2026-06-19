const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function fileExists(filePath) {
    // // Check optional tool paths without throwing when a folder is blocked or missing.
    return Boolean(filePath) && fs.existsSync(filePath);
}

function getWindowsLocalAppData() {
    // // Resolve LocalAppData even when CEP starts with a reduced Windows environment.
    return process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
}

function getPrivateRuntimeConfig() {
    // // Discover the installer private runtime directly so the extension does not depend only on config.json.
    const platform = os.platform();
    let runtimeRoot = null;
    let paths = null;

    if (platform === 'win32') {
        runtimeRoot = path.join(getWindowsLocalAppData(), 'PremiereYouTubeDownloader', 'runtime');
        paths = {
            pythonPath: path.join(runtimeRoot, 'python', 'python.exe'),
            ytDlpPath: path.join(runtimeRoot, 'python', 'Scripts', 'yt-dlp.exe'),
            ffmpegPath: path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg.exe'),
            denoPath: path.join(runtimeRoot, 'deno', 'bin', 'deno.exe')
        };
    } else if (platform === 'darwin') {
        runtimeRoot = path.join(os.homedir(), 'Library', 'Application Support', 'PremiereYouTubeDownloader', 'runtime');
        paths = {
            pythonPath: path.join(runtimeRoot, 'python', 'bin', 'python3'),
            ytDlpPath: path.join(runtimeRoot, 'python', 'bin', 'yt-dlp'),
            ffmpegPath: path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg'),
            denoPath: path.join(runtimeRoot, 'deno', 'bin', 'deno')
        };
    }

    if (!paths) {
        return {};
    }

    const config = {};
    for (const [key, value] of Object.entries(paths)) {
        if (fileExists(value)) {
            config[key] = value;
        }
    }

    if (config.ytDlpPath || config.ffmpegPath || config.denoPath) {
        console.log('Detected private runtime at:', runtimeRoot);
    }

    return config;
}

function loadAutoConfig() {
    // // Load installer-written paths, then fill missing values from the private runtime location.
    let autoConfig = {};
    try {
        const configPath = path.join(__dirname, 'config.json');
        if (fs.existsSync(configPath)) {
            console.log('Loading configuration from:', configPath);
            const configFile = fs.readFileSync(configPath, 'utf8');
            autoConfig = JSON.parse(configFile);
        }
    } catch (e) {
        console.error('Error loading config.json:', e);
    }

    const runtimeConfig = getPrivateRuntimeConfig();
    const mergedConfig = { ...runtimeConfig };
    for (const key of Object.keys(autoConfig)) {
        if (autoConfig[key]) {
            mergedConfig[key] = autoConfig[key];
        }
    }
    return mergedConfig;
}

function resolveYtDlpPath(customYtdlpPath, autoConfig) {
    // // Prefer user settings and installer paths before falling back to legacy system installs.
    let ytDlpPath = customYtdlpPath || autoConfig.ytDlpPath || null;

    if (!ytDlpPath && os.platform() === 'win32') {
        const userHome = os.homedir();
        const winPaths = [
            path.join(userHome, 'AppData', 'Local', 'Programs', 'Python', 'Python314', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Local', 'Programs', 'Python', 'Python313', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Roaming', 'Python', 'Python314', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Roaming', 'Python', 'Python313', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Roaming', 'Python', 'Python312', 'Scripts', 'yt-dlp.exe'),
            path.join(userHome, 'AppData', 'Roaming', 'Python', 'Python311', 'Scripts', 'yt-dlp.exe'),
            'C:\\Python314\\Scripts\\yt-dlp.exe',
            'C:\\Python313\\Scripts\\yt-dlp.exe',
            'C:\\Python312\\Scripts\\yt-dlp.exe',
            'C:\\Python311\\Scripts\\yt-dlp.exe',
        ];
        for (const p of winPaths) {
            if (fileExists(p)) {
                ytDlpPath = p;
                console.log('Found yt-dlp at:', ytDlpPath);
                break;
            }
        }
    } else if (!ytDlpPath && os.platform() === 'darwin') {
        const macPaths = [
            '/opt/homebrew/bin/yt-dlp',
            '/usr/local/bin/yt-dlp',
            '/usr/bin/yt-dlp'
        ];
        for (const p of macPaths) {
            if (fileExists(p)) {
                ytDlpPath = p;
                break;
            }
        }
    }

    if (!ytDlpPath) {
        ytDlpPath = 'yt-dlp';
        console.log('Using yt-dlp from system PATH (fallback)');
    }

    return ytDlpPath;
}

function shouldUseCookieBrowser(cookieBrowser) {
    // // Allow retry paths and future UI choices to disable browser cookie extraction explicitly.
    const normalized = String(cookieBrowser || '').trim().toLowerCase();
    return Boolean(normalized) && !['none', 'off', 'disabled', 'no', 'false'].includes(normalized);
}

function shouldRetryWithoutCookies(errorBuffer, outputBuffer, cookieBrowser) {
    // // Missing browser profiles often make yt-dlp exit immediately, sometimes without stderr in CEP.
    if (!shouldUseCookieBrowser(cookieBrowser)) {
        return false;
    }

    const combinedOutput = `${errorBuffer || ''}\n${outputBuffer || ''}`.trim();
    if (!combinedOutput) {
        return true;
    }

    return /cookie|cookies|browser|firefox|chrome|edge|brave|profile|could not find|not found|locked/i.test(combinedOutput);
}

/**
 * Download video from YouTube using yt-dlp
 */
async function downloadVideo(options) {
    const {
        url,
        format = 'both',
        codec = 'h264',
        videoQuality = 'max',
        audioFormat = 'wav',
        destination,
        startTime,
        endTime,
        onProgress,
        onComplete,
        onError,
        signal,
        // Custom tool paths from settings
        customYtdlpPath,
        customFfmpegPath,
        customDenoPath,
        cookieBrowser = 'firefox'
    } = options;

    const autoConfig = loadAutoConfig();

    return new Promise((resolve, reject) => {
        try {
            // Ensure destination directory exists
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }

            // Build yt-dlp command with custom paths
            // Priority: 1. Settings (UI) 2. AutoConfig (JSON) 3. Logic detection 4. PATH
            const effectiveFfmpegPath = customFfmpegPath || autoConfig.ffmpegPath || null;
            const effectiveCookieBrowser = cookieBrowser || 'firefox';
            const args = buildYtDlpArgs(
                url,
                format,
                destination,
                startTime,
                endTime,
                effectiveFfmpegPath,
                effectiveCookieBrowser,
                videoQuality,
                audioFormat,
                codec
            );

            // Determine yt-dlp executable path
            let ytDlpPath = resolveYtDlpPath(customYtdlpPath, autoConfig);

            console.log('Executing yt-dlp with args:', args);
            console.log('Using yt-dlp path:', ytDlpPath);

            // Build environment with full system PATH for yt-dlp to find deno, ffmpeg, etc.
            const customEnv = { ...process.env };
            if (os.platform() === 'win32') {
                // On Windows, CEP may have a limited PATH. Add common tool locations.
                const userHome = os.homedir();
                const additionalPaths = [
                    // Add custom deno path directory if specified
                    customDenoPath ? path.dirname(customDenoPath) : null,
                    path.join(userHome, '.deno', 'bin'),
                    path.join(userHome, 'AppData', 'Local', 'Microsoft', 'WindowsApps'),
                    path.join(userHome, 'multi-downloader-nx'),
                    'C:\\Program Files\\ffmpeg\\bin',
                    'C:\\ffmpeg\\bin',
                ].filter(p => p && fs.existsSync(p));

                // Add paths from AutoConfig if available
                if (autoConfig.denoPath) additionalPaths.push(path.dirname(autoConfig.denoPath));
                if (autoConfig.nodePath) additionalPaths.push(path.dirname(autoConfig.nodePath));
                if (autoConfig.pythonPath) additionalPaths.push(path.dirname(autoConfig.pythonPath));

                if (additionalPaths.length > 0) {
                    customEnv.PATH = additionalPaths.join(';') + ';' + (customEnv.PATH || '');
                    console.log('Extended PATH with:', additionalPaths);
                }
            } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
                // On macOS/Linux, also ensure common paths are present
                const userHome = os.homedir();
                const additionalPaths = [
                    '/opt/homebrew/bin',
                    '/usr/local/bin',
                    path.join(userHome, '.deno', 'bin'),
                    path.join(userHome, '.nvm', 'versions', 'node'), // conceptual, might need glob
                    '/usr/bin',
                    '/bin',
                    '/usr/sbin',
                    '/sbin'
                ].filter(p => p && fs.existsSync(p));

                if (additionalPaths.length > 0) {
                    customEnv.PATH = additionalPaths.join(':') + ':' + (customEnv.PATH || '');
                    console.log('Extended PATH with:', additionalPaths);
                }
            }

            // Spawn yt-dlp process
            const ytDlp = spawn(ytDlpPath, args, {
                cwd: destination,
                windowsHide: true,
                shell: false,
                env: customEnv
            });

            // Handle cancellation
            if (signal) {
                signal.addEventListener('abort', () => {
                    console.log('Download cancelled by user');
                    ytDlp.kill();
                    reject(new Error('Download cancelled'));
                });
            }

            let outputBuffer = '';
            let downloadedFile = null;
            let errorBuffer = '';

            // Handle stdout
            ytDlp.stdout.on('data', (data) => {
                const output = data.toString();
                outputBuffer += output;
                console.log('yt-dlp stdout:', output);

                // Parse progress
                const progressMatch = output.match(/(\d+\.?\d*)%/);
                if (progressMatch) {
                    const percent = parseFloat(progressMatch[1]);
                    if (onProgress) {
                        onProgress({
                            progress: percent,
                            status: 'downloadInProgress'
                        });
                    }
                }

                // Check for merge/conversion
                if (output.includes('Merging formats')) {
                    if (onProgress) {
                        onProgress({
                            progress: 95,
                            status: 'merging'
                        });
                    }
                }

                if (output.includes('Deleting original file')) {
                    if (onProgress) {
                        onProgress({
                            progress: 98,
                            status: 'finalizing'
                        });
                    }
                }

                // Extract filename - capture initial download destination
                const filenameMatch = output.match(/\[download\] Destination: (.+)/);
                if (filenameMatch) {
                    const tempFile = path.join(destination, path.basename(filenameMatch[1]));
                    console.log(`Download destination detected: ${tempFile}`);
                    // Only set if we don't have a final file yet
                    if (!downloadedFile || !downloadedFile.endsWith('.mp4')) {
                        downloadedFile = tempFile;
                    }
                }

                // Check for merger output - THIS IS THE FINAL MP4 FILE
                const mergerMatch = output.match(/\[Merger\] Merging formats into "(.+)"/);
                if (mergerMatch) {
                    downloadedFile = path.join(destination, path.basename(mergerMatch[1]));
                    console.log(`FINAL merged file detected: ${downloadedFile}`);
                }

                // Check for audio extraction (this is the final file for audio downloads)
                const audioMatch = output.match(/\[ExtractAudio\] Destination: (.+)/);
                if (audioMatch) {
                    downloadedFile = path.join(destination, path.basename(audioMatch[1]));
                    console.log(`FINAL audio file detected: ${downloadedFile}`);
                }

                // Also check for "has been downloaded" messages, including yt-dlp cache hits.
                const downloadedMatch = output.match(/\[download\] (.+) has (?:already )?been downloaded/);
                if (downloadedMatch) {
                    const completedFile = path.join(destination, path.basename(downloadedMatch[1]));
                    console.log(`Download completed message for: ${completedFile}`);
                    // Only update if it's an MP4 or we don't have a file yet
                    if (completedFile.endsWith('.mp4') || !downloadedFile) {
                        downloadedFile = completedFile;
                    }
                }
            });

            // Handle stderr (ffmpeg outputs progress info here, not just errors)
            ytDlp.stderr.on('data', (data) => {
                const errorStr = data.toString();
                errorBuffer += errorStr;
                // Use console.log since ffmpeg sends progress/metadata to stderr (not actual errors)
                console.log('yt-dlp stderr:', errorStr);
            });

            // Handle completion
            ytDlp.on('close', (code) => {
                console.log(`yt-dlp exited with code ${code}`);

                if (signal && signal.aborted) {
                    return;
                }

                if (code === 0 || (code === null && signal && signal.aborted)) {
                    // Success - verify captured file exists, fallback to directory scan
                    // This handles Unicode filenames that may not parse correctly from stdout
                    if (!downloadedFile || !fs.existsSync(downloadedFile)) {
                        console.log('File not found or not captured, scanning directory for latest file...');
                        downloadedFile = findLatestFile(destination);
                    }

                    console.log(`=== DOWNLOAD COMPLETE ===`);
                    console.log(`Final file to be used: ${downloadedFile}`);
                    console.log(`File exists: ${downloadedFile && fs.existsSync(downloadedFile)}`);

                    // NOTE: When startTime/endTime are specified, yt-dlp uses --download-sections
                    // which already downloads ONLY the requested section. No additional trimming needed.
                    // Previously, we called trimVideo here which corrupted the file by seeking
                    // to the original timestamp (e.g., 1 hour) in a file that's only 5 minutes.

                    // Apply the selected delivery codec after downloading the best source quality.
                    if (codec === 'prores' && format !== 'audio' && downloadedFile) {
                        convertToProRes(downloadedFile, effectiveFfmpegPath, onProgress, (proresFile) => {
                            const finalFile = proresFile || downloadedFile;
                            if (onComplete) onComplete(finalFile);
                            resolve(finalFile);
                        });
                    } else if (codec === 'h264' && format !== 'audio' && downloadedFile) {
                        ensureH264(downloadedFile, effectiveFfmpegPath, onProgress, (h264File, conversionError) => {
                            if (conversionError) {
                                if (onError) onError(conversionError);
                                reject(conversionError);
                                return;
                            }

                            const finalFile = h264File || downloadedFile;
                            if (onComplete) onComplete(finalFile);
                            resolve(finalFile);
                        });
                    } else {
                        if (onComplete) onComplete(downloadedFile);
                        resolve(downloadedFile);
                    }
                } else {
                    if (shouldRetryWithoutCookies(errorBuffer, outputBuffer, effectiveCookieBrowser)) {
                        console.log(`yt-dlp failed with ${effectiveCookieBrowser} cookies; retrying without browser cookies.`);
                        downloadVideo({ ...options, cookieBrowser: 'none' }).then(resolve).catch((retryError) => {
                            if (onError) onError(retryError);
                            reject(retryError);
                        });
                        return;
                    }

                    const error = new Error(`yt-dlp exited with code ${code}. Details: ${errorBuffer}`);
                    if (onError) onError(error);
                    reject(error);
                }
            });

            // Handle errors
            ytDlp.on('error', (err) => {
                console.error('yt-dlp error:', err);
                if (onError) onError(err);
                reject(err);
            });

        } catch (error) {
            console.error('Download error:', error);
            if (onError) onError(error);
            reject(error);
        }
    });
}

/**
 * Build yt-dlp command arguments
 */
function buildYtDlpArgs(url, format, destination, startTime, endTime, customFfmpegPath, cookieBrowser = 'firefox', videoQuality = 'max', audioFormat = 'wav', deliveryCodec = 'h264') {
    const args = [url];

    // Determine ffmpeg path for yt-dlp post-processing
    // Priority: 1. Custom path from settings, 2. Auto-detect common paths
    let ffmpegPath = customFfmpegPath || null;

    if (!ffmpegPath && os.platform() === 'win32') {
        // Check common Windows installation paths
        const userHome = os.homedir();
        const winPaths = [
            path.join(userHome, 'multi-downloader-nx', 'ffmpeg.exe'),
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            path.join(userHome, 'AppData', 'Local', 'Programs', 'ffmpeg', 'bin', 'ffmpeg.exe'),
        ];
        for (const p of winPaths) {
            if (fs.existsSync(p)) {
                ffmpegPath = p;
                console.log('Found ffmpeg at:', ffmpegPath);
                break;
            }
        }
    } else if (!ffmpegPath && os.platform() === 'darwin') {
        const macPaths = [
            '/opt/homebrew/bin/ffmpeg',  // Apple Silicon Homebrew
            '/usr/local/bin/ffmpeg',      // Intel Homebrew
            '/usr/bin/ffmpeg'             // System install
        ];
        for (const p of macPaths) {
            if (fs.existsSync(p)) {
                ffmpegPath = p;
                break;
            }
        }
    }

    // Fallback to system PATH
    if (!ffmpegPath) {
        ffmpegPath = 'ffmpeg';
    }

    ffmpegPath = normalizeFfmpegExecutablePath(ffmpegPath);

    // Tell yt-dlp where to find ffmpeg
    const ffmpegLocation = path.dirname(ffmpegPath);
    if (ffmpegLocation && ffmpegLocation !== '.') {
        args.push('--ffmpeg-location', ffmpegLocation);
    }

    // Format selection
    if (format === 'audio') {
        args.push('-f', 'bestaudio/best');
        args.push('-x');
        args.push('--audio-format', normalizeAudioFormat(audioFormat));
    } else {
        args.push('-f', getVideoFormatSelector(videoQuality, deliveryCodec));
        args.push('--merge-output-format', 'mp4');

        // Force audio to AAC codec (Premiere Pro doesn't support Opus/Vorbis)
        args.push('--audio-format', 'best');
        args.push('--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k');
    }

    // Specify download directory
    args.push('--paths', destination);

    // Output template
    args.push('-o', '%(title)s.%(ext)s');

    // Restrict filenames to Windows-safe characters only (allows Unicode)
    args.push('--windows-filenames');

    // Progress
    args.push('--newline');
    args.push('--progress');

    // No playlist
    args.push('--no-playlist');

    // Enable remote EJS scripts for YouTube n-challenge solving
    // This downloads solver scripts from GitHub automatically
    args.push('--remote-components', 'ejs:github');

    // Embed metadata
    args.push('--embed-metadata');

    if (shouldUseCookieBrowser(cookieBrowser)) {
        // Use cookies from browser to bypass SABR restrictions when that browser is available.
        args.push('--cookies-from-browser', cookieBrowser);
    }

    // Ignore errors
    args.push('--ignore-errors');

    // Skip SSL certificate verification (for corporate networks/VPNs with self-signed certs)
    args.push('--no-check-certificate');

    // Add time range if specified
    if (startTime !== undefined && endTime !== undefined) {
        // Convert seconds to HH:MM:SS format
        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const start = formatTime(startTime);
        const end = formatTime(endTime);
        args.push('--download-sections', `*${start}-${end}`);
    }

    return args;
}

function normalizeAudioFormat(audioFormat) {
    return audioFormat === 'mp3' ? 'mp3' : 'wav';
}

function normalizeVideoQuality(videoQuality) {
    const quality = String(videoQuality || 'max').toLowerCase();
    const allowed = new Set(['max', '144', '360', '480', '720', '1080', '4k']);
    return allowed.has(quality) ? quality : 'max';
}

function getVideoFormatSelector(videoQuality = 'max', deliveryCodec = 'h264') {
    const normalizedQuality = normalizeVideoQuality(videoQuality);
    const maxHeightByQuality = {
        '144': 144,
        '360': 360,
        '480': 480,
        '720': 720,
        '1080': 1080,
        '4k': 2160
    };

    const maxHeight = maxHeightByQuality[normalizedQuality];
    const heightFilter = maxHeight ? `[height<=${maxHeight}]` : '';

    // YouTube usually exposes high resolutions as VP9 or AV1; prefer non-AV1 sources because the private macOS FFmpeg runtime intentionally avoids GPL/nonfree AV1 libraries.
    if (deliveryCodec === 'h264' || deliveryCodec === 'prores') {
        return [
            `bestvideo${heightFilter}[dynamic_range=SDR][vcodec!*=av01]+bestaudio`,
            `bestvideo${heightFilter}[vcodec!*=av01]+bestaudio`,
            `best${heightFilter}[vcodec!*=av01]`,
            `best[ext=mp4][vcodec!*=av01]`
        ].join('/');
    }

    // Keep the generic selector permissive for workflows that do not need local video transcoding.
    return `bestvideo${heightFilter}[dynamic_range=SDR]+bestaudio/bestvideo${heightFilter}+bestaudio/best${heightFilter}`;
}

/**
 * Trim video using ffmpeg
 */
function trimVideo(inputFile, startTime, endTime, callback) {
    try {
        const ext = path.extname(inputFile);
        const basename = path.basename(inputFile, ext);
        const dirname = path.dirname(inputFile);
        const outputFile = path.join(dirname, `${basename}_trimmed${ext}`);

        const duration = endTime - startTime;

        const args = [
            '-i', inputFile,
            '-ss', startTime.toString(),
            '-t', duration.toString(),
            '-c', 'copy',
            '-y',
            outputFile
        ];

        console.log('Executing ffmpeg with args:', args);

        // Determine ffmpeg executable path based on platform
        let ffmpegPath = 'ffmpeg';
        if (os.platform() === 'darwin') {
            const macPaths = [
                '/opt/homebrew/bin/ffmpeg',  // Apple Silicon Homebrew
                '/usr/local/bin/ffmpeg',      // Intel Homebrew
                '/usr/bin/ffmpeg'             // System install
            ];
            for (const p of macPaths) {
                if (fs.existsSync(p)) {
                    ffmpegPath = p;
                    break;
                }
            }
        }
        console.log('Using ffmpeg path:', ffmpegPath);

        const ffmpeg = spawn(ffmpegPath, args, { shell: false });

        ffmpeg.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputFile)) {
                try {
                    fs.unlinkSync(inputFile);
                } catch (e) {
                    console.error('Error deleting original file:', e);
                }
                callback(outputFile);
            } else {
                console.error('ffmpeg trimming failed');
                callback(null);
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('ffmpeg error:', err);
            callback(null);
        });

    } catch (error) {
        console.error('Trim error:', error);
        callback(null);
    }
}

/**
 * Convert video to ProRes 422 using ffmpeg
 */
function convertToProRes(inputFile, customFfmpegPath, onProgress, callback) {
    try {
        const ext = path.extname(inputFile);
        const basename = path.basename(inputFile, ext);
        const dirname = path.dirname(inputFile);
        const outputFile = path.join(dirname, `${basename}.mov`);

        console.log(`Converting to ProRes 422: ${inputFile} -> ${outputFile}`);

        if (onProgress) {
            onProgress({
                progress: 95,
                status: 'convertingProRes'
            });
        }

        // Determine ffmpeg executable path
        let ffmpegPath = customFfmpegPath || null;

        if (!ffmpegPath && os.platform() === 'win32') {
            const userHome = os.homedir();
            const winPaths = [
                path.join(userHome, 'multi-downloader-nx', 'ffmpeg.exe'),
                'C:\\ffmpeg\\bin\\ffmpeg.exe',
                'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
                path.join(userHome, 'AppData', 'Local', 'Programs', 'ffmpeg', 'bin', 'ffmpeg.exe'),
            ];
            for (const p of winPaths) {
                if (fs.existsSync(p)) {
                    ffmpegPath = p;
                    break;
                }
            }
        } else if (!ffmpegPath && os.platform() === 'darwin') {
            const macPaths = [
                '/opt/homebrew/bin/ffmpeg',
                '/usr/local/bin/ffmpeg',
                '/usr/bin/ffmpeg'
            ];
            for (const p of macPaths) {
                if (fs.existsSync(p)) {
                    ffmpegPath = p;
                    break;
                }
            }
        }

        if (!ffmpegPath) {
            ffmpegPath = 'ffmpeg';
        }

        ffmpegPath = normalizeFfmpegExecutablePath(ffmpegPath);

        // ProRes 422 HQ encoding arguments
        // -c:v prores_ks: Use Apple ProRes Kostya encoder
        // -profile:v 3: ProRes 422 HQ profile (0=Proxy, 1=LT, 2=422, 3=HQ)
        // -c:a pcm_s16le: Uncompressed 16-bit PCM audio (native for ProRes workflows)
        const args = [
            '-i', inputFile,
            '-c:v', 'prores_ks',
            '-profile:v', '3',
            '-vendor', 'apl0',
            '-pix_fmt', 'yuv422p10le',
            '-c:a', 'pcm_s16le',
            '-y',
            outputFile
        ];

        console.log('Executing ffmpeg for ProRes conversion:', args.join(' '));
        console.log('Using ffmpeg path for ProRes conversion:', ffmpegPath);

        const ffmpeg = spawn(ffmpegPath, args, {
            shell: false,
            windowsHide: true
        });

        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            console.log('ffmpeg ProRes:', output);
            // Parse progress from ffmpeg stderr
            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
            if (timeMatch && onProgress) {
                onProgress({
                    progress: 96,
                    status: 'convertingProRes'
                });
            }
        });

        ffmpeg.on('close', (code) => {
            if (code === 0 && fs.existsSync(outputFile)) {
                console.log(`ProRes conversion successful: ${outputFile}`);
                // Delete original MP4 file
                try {
                    fs.unlinkSync(inputFile);
                    console.log(`Deleted original file: ${inputFile}`);
                } catch (e) {
                    console.error('Error deleting original file:', e);
                }
                callback(outputFile);
            } else {
                console.error(`ProRes conversion failed with code ${code}`);
                callback(null);
            }
        });

        ffmpeg.on('error', (err) => {
            console.error('ffmpeg ProRes error:', err);
            callback(null);
        });

    } catch (error) {
        console.error('ProRes conversion error:', error && error.stack ? error.stack : error);
        callback(null);
    }
}

/**
 * Normalize an ffmpeg setting value to an executable path.
 * Accepts either a direct binary path or a directory containing ffmpeg.
 */
function normalizeFfmpegExecutablePath(ffmpegPath) {
    if (!ffmpegPath || typeof ffmpegPath !== 'string') {
        return 'ffmpeg';
    }

    const trimmed = ffmpegPath.trim();
    if (!trimmed) {
        return 'ffmpeg';
    }

    try {
        if (fs.existsSync(trimmed) && fs.statSync(trimmed).isDirectory()) {
            return path.join(trimmed, os.platform() === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
        }
    } catch (e) {
        console.warn('Unable to inspect ffmpeg path, using provided value:', trimmed, e.message);
    }

    return trimmed;
}

/**
 * Keep an existing H.264 download or transcode VP9/AV1 sources to H.264 for Premiere Pro.
 */
function ensureH264(inputFile, customFfmpegPath, onProgress, callback) {
    const ffmpegPath = resolveFfmpegPath(customFfmpegPath);
    const ffprobePath = resolveFfprobePath(ffmpegPath);
    const probeArgs = [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=codec_name',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        inputFile
    ];

    // Probe first so native H.264 downloads are not needlessly recompressed.
    const ffprobe = spawn(ffprobePath, probeArgs, {
        shell: false,
        windowsHide: true
    });

    let codecOutput = '';
    let probeFinished = false;

    ffprobe.stdout.on('data', (data) => {
        codecOutput += data.toString();
    });

    ffprobe.on('close', (code) => {
        if (probeFinished) return;
        probeFinished = true;

        const sourceCodec = codecOutput.trim().toLowerCase();
        if (code === 0 && sourceCodec === 'h264') {
            console.log(`H.264 source detected, conversion skipped: ${inputFile}`);
            callback(inputFile, null);
            return;
        }

        // A failed probe is handled conservatively by transcoding to guarantee the requested output codec.
        console.log(`Source codec "${sourceCodec || 'unknown'}" requires H.264 conversion.`);
        convertToH264(inputFile, ffmpegPath, onProgress, callback);
    });

    ffprobe.on('error', (error) => {
        if (probeFinished) return;
        probeFinished = true;
        console.warn('ffprobe unavailable, converting to H.264 to guarantee compatibility:', error.message);
        convertToH264(inputFile, ffmpegPath, onProgress, callback);
    });
}

/**
 * Convert a downloaded video to an H.264 MP4 and replace the source only after success.
 */
function convertToH264(inputFile, ffmpegPath, onProgress, callback) {
    const ext = path.extname(inputFile);
    const basename = path.basename(inputFile, ext);
    const dirname = path.dirname(inputFile);
    const outputPaths = getH264OutputPaths(dirname, basename);
    const outputFile = outputPaths.temporary;
    const finalFile = outputPaths.final;
    let conversionFinished = false;

    // Complete the asynchronous conversion exactly once across close and error events.
    const finishConversion = (filePath, error) => {
        if (conversionFinished) return;
        conversionFinished = true;
        callback(filePath, error);
    };

    if (onProgress) {
        onProgress({
            progress: 95,
            status: 'finalizing'
        });
    }

    const buildArgs = (encoder) => {
        // Use libx264 when available, then fall back to macOS VideoToolbox for bundled FFmpeg builds without GPL encoders.
        const videoArgs = encoder === 'h264_videotoolbox'
            ? ['-c:v', 'h264_videotoolbox', '-b:v', '12000k', '-maxrate', '16000k', '-pix_fmt', 'yuv420p']
            : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p'];

        return [
            '-i', inputFile,
            '-map', '0:v:0',
            '-map', '0:a?',
            ...videoArgs,
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            '-y',
            outputFile
        ];
    };

    const runConversion = (encoder) => {
        const args = buildArgs(encoder);

        console.log(`Executing ffmpeg for H.264 conversion with ${encoder}:`, args.join(' '));
        console.log('Using ffmpeg path for H.264 conversion:', ffmpegPath);

        const ffmpeg = spawn(ffmpegPath, args, {
            shell: false,
            windowsHide: true
        });

        ffmpeg.stderr.on('data', (data) => {
            console.log(`ffmpeg H.264 (${encoder}):`, data.toString());
        });

        ffmpeg.on('close', (code) => {
            if (code !== 0 || !fs.existsSync(outputFile)) {
                if (encoder === 'libx264' && os.platform() === 'darwin') {
                    try {
                        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                    } catch (cleanupError) {
                        console.warn('Unable to remove failed H.264 temporary output:', cleanupError.message);
                    }
                    console.warn('libx264 conversion failed; retrying with macOS h264_videotoolbox.');
                    runConversion('h264_videotoolbox');
                    return;
                }

                finishConversion(null, new Error(`H.264 conversion failed with ${encoder} and code ${code}`));
                return;
            }

            try {
                // Use a distinct final path so Premiere never reuses the VP9 source's audio-only cache entry.
                fs.renameSync(outputFile, finalFile);
                try {
                    fs.unlinkSync(inputFile);
                    console.log(`Deleted VP9/AV1 source after H.264 conversion: ${inputFile}`);
                } catch (deleteError) {
                    console.warn('Unable to delete the original source after H.264 conversion:', deleteError.message);
                }
                console.log(`H.264 conversion successful: ${finalFile}`);
                finishConversion(finalFile, null);
            } catch (error) {
                console.error('Unable to finalize H.264 output:', error);
                finishConversion(outputFile, null);
            }
        });

        ffmpeg.on('error', (error) => {
            if (encoder === 'libx264' && os.platform() === 'darwin') {
                console.warn('Unable to start libx264 conversion; retrying with macOS h264_videotoolbox:', error.message);
                runConversion('h264_videotoolbox');
                return;
            }

            finishConversion(null, new Error(`Unable to start H.264 conversion with ${encoder}: ${error.message}`));
        });
    };

    // The private macOS runtime is LGPL-only, so start with VideoToolbox instead of unavailable libx264.
    const usesPrivateMacRuntime = os.platform() === 'darwin' && ffmpegPath.includes('PremiereYouTubeDownloader/runtime/ffmpeg');
    runConversion(usesPrivateMacRuntime ? 'h264_videotoolbox' : 'libx264');
}

/**
 * Build non-conflicting temporary and final H.264 paths for reliable Premiere imports.
 */
function getH264OutputPaths(directory, basename) {
    let counter = 1;
    let finalFile = path.join(directory, `${basename} [H264].mp4`);

    // Preserve an earlier conversion by adding a numeric suffix instead of overwriting it.
    while (fs.existsSync(finalFile)) {
        counter += 1;
        finalFile = path.join(directory, `${basename} [H264] ${counter}.mp4`);
    }

    const finalBasename = path.basename(finalFile, path.extname(finalFile));
    return {
        temporary: path.join(directory, `${finalBasename}.converting.mp4`),
        final: finalFile
    };
}

/**
 * Resolve ffmpeg from a custom setting or the standard platform locations.
 */
function resolveFfmpegPath(customFfmpegPath) {
    let ffmpegPath = customFfmpegPath || null;

    if (!ffmpegPath && os.platform() === 'win32') {
        const userHome = os.homedir();
        const winPaths = [
            path.join(userHome, 'multi-downloader-nx', 'ffmpeg.exe'),
            'C:\\ffmpeg\\bin\\ffmpeg.exe',
            'C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe',
            path.join(userHome, 'AppData', 'Local', 'Programs', 'ffmpeg', 'bin', 'ffmpeg.exe')
        ];
        ffmpegPath = winPaths.find(candidate => fs.existsSync(candidate)) || null;
    } else if (!ffmpegPath && os.platform() === 'darwin') {
        const macPaths = [
            '/opt/homebrew/bin/ffmpeg',
            '/usr/local/bin/ffmpeg',
            '/usr/bin/ffmpeg'
        ];
        ffmpegPath = macPaths.find(candidate => fs.existsSync(candidate)) || null;
    }

    return normalizeFfmpegExecutablePath(ffmpegPath || 'ffmpeg');
}

/**
 * Resolve ffprobe next to ffmpeg so codec detection uses the same installed toolchain.
 */
function resolveFfprobePath(ffmpegPath) {
    if (!ffmpegPath || ffmpegPath === 'ffmpeg') {
        return os.platform() === 'win32' ? 'ffprobe.exe' : 'ffprobe';
    }

    const extension = os.platform() === 'win32' ? '.exe' : '';
    return path.join(path.dirname(ffmpegPath), `ffprobe${extension}`);
}

/**
 * Estimate download size without downloading the file.
 */
async function estimateDownloadSize(options) {
    const {
        url,
        format = 'both',
        codec = 'h264',
        videoQuality = 'max',
        audioFormat = 'wav',
        startTime,
        endTime,
        customYtdlpPath,
        customFfmpegPath,
        customDenoPath,
        cookieBrowser = 'firefox'
    } = options || {};

    const autoConfig = loadAutoConfig();

    return new Promise((resolve, reject) => {
        try {
            const effectiveFfmpegPath = customFfmpegPath || autoConfig.ffmpegPath || null;

            let ytDlpPath = resolveYtDlpPath(customYtdlpPath, autoConfig);

            const customEnv = { ...process.env };
            if (os.platform() === 'win32') {
                const userHome = os.homedir();
                const additionalPaths = [
                    customDenoPath ? path.dirname(customDenoPath) : null,
                    path.join(userHome, '.deno', 'bin'),
                    path.join(userHome, 'AppData', 'Local', 'Microsoft', 'WindowsApps'),
                    path.join(userHome, 'multi-downloader-nx'),
                    'C:\\Program Files\\ffmpeg\\bin',
                    'C:\\ffmpeg\\bin',
                ].filter(p => p && fs.existsSync(p));
                if (autoConfig.denoPath) additionalPaths.push(path.dirname(autoConfig.denoPath));
                if (autoConfig.nodePath) additionalPaths.push(path.dirname(autoConfig.nodePath));
                if (autoConfig.pythonPath) additionalPaths.push(path.dirname(autoConfig.pythonPath));
                if (additionalPaths.length > 0) {
                    customEnv.PATH = additionalPaths.join(';') + ';' + (customEnv.PATH || '');
                }
            } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
                const userHome = os.homedir();
                const additionalPaths = [
                    '/opt/homebrew/bin',
                    '/usr/local/bin',
                    path.join(userHome, '.deno', 'bin'),
                    '/usr/bin',
                    '/bin',
                    '/usr/sbin',
                    '/sbin'
                ].filter(p => p && fs.existsSync(p));
                if (additionalPaths.length > 0) {
                    customEnv.PATH = additionalPaths.join(':') + ':' + (customEnv.PATH || '');
                }
            }

            const args = [url];
            let ffmpegPath = effectiveFfmpegPath || null;
            if (!ffmpegPath) ffmpegPath = 'ffmpeg';
            ffmpegPath = normalizeFfmpegExecutablePath(ffmpegPath);

            const ffmpegLocation = path.dirname(ffmpegPath);
            if (ffmpegLocation && ffmpegLocation !== '.') {
                args.push('--ffmpeg-location', ffmpegLocation);
            }

            if (format === 'audio') {
                args.push('-f', 'bestaudio/best');
                args.push('-x');
                args.push('--audio-format', normalizeAudioFormat(audioFormat));
            } else {
                args.push('-f', getVideoFormatSelector(videoQuality, codec));
                args.push('--merge-output-format', 'mp4');
            }

            args.push('--dump-single-json');
            args.push('--skip-download');
            args.push('--no-playlist');
            if (shouldUseCookieBrowser(cookieBrowser)) {
                args.push('--cookies-from-browser', cookieBrowser);
            }
            args.push('--ignore-errors');
            args.push('--no-check-certificate');

            if (startTime !== undefined && endTime !== undefined) {
                const formatTime = (seconds) => {
                    const h = Math.floor(seconds / 3600);
                    const m = Math.floor((seconds % 3600) / 60);
                    const s = seconds % 60;
                    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                };
                args.push('--download-sections', `*${formatTime(startTime)}-${formatTime(endTime)}`);
            }

            const ytDlp = spawn(ytDlpPath, args, {
                windowsHide: true,
                shell: false,
                env: customEnv
            });

            let stdoutBuffer = '';
            let stderrBuffer = '';

            ytDlp.stdout.on('data', (data) => {
                stdoutBuffer += data.toString();
            });

            ytDlp.stderr.on('data', (data) => {
                stderrBuffer += data.toString();
            });

            ytDlp.on('close', (code) => {
                if (code !== 0) {
                    if (shouldRetryWithoutCookies(stderrBuffer, stdoutBuffer, cookieBrowser || 'firefox')) {
                        console.log(`yt-dlp estimate failed with ${cookieBrowser || 'firefox'} cookies; retrying without browser cookies.`);
                        estimateDownloadSize({ ...(options || {}), cookieBrowser: 'none' }).then(resolve).catch(reject);
                        return;
                    }

                    reject(new Error(`yt-dlp estimate exited with code ${code}. ${stderrBuffer}`));
                    return;
                }

                const info = parseYtDlpJson(stdoutBuffer);
                if (!info) {
                    resolve({ bytes: null });
                    return;
                }

                let estimatedBytes = extractEstimatedBytes(info);
                if (estimatedBytes && Number.isFinite(info.duration) && startTime !== undefined && endTime !== undefined && endTime > startTime) {
                    const clippedDuration = Math.max(0, Math.min(info.duration, endTime) - Math.max(0, startTime));
                    if (clippedDuration > 0 && info.duration > 0) {
                        estimatedBytes = Math.round(estimatedBytes * (clippedDuration / info.duration));
                    }
                }

                resolve({
                    bytes: estimatedBytes || null,
                    duration: Number.isFinite(info.duration) ? info.duration : null
                });
            });

            ytDlp.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
}

function parseYtDlpJson(stdoutBuffer) {
    const trimmed = (stdoutBuffer || '').trim();
    if (!trimmed) return null;

    try {
        return JSON.parse(trimmed);
    } catch (e) {
        // Continue with fallback parsing
    }

    const lines = trimmed.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i].startsWith('{')) continue;
        try {
            return JSON.parse(lines[i]);
        } catch (e) {
            // Continue
        }
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        } catch (e) {
            return null;
        }
    }

    return null;
}

function extractEstimatedBytes(info) {
    const duration = Number(info.duration);

    const getItemSize = (item) => {
        if (!item || typeof item !== 'object') return 0;
        const directSize = Number(item.filesize) || Number(item.filesize_approx) || 0;
        if (directSize > 0) return directSize;
        const bitrate = Number(item.tbr);
        if (duration > 0 && bitrate > 0) {
            return Math.round((duration * bitrate * 1000) / 8);
        }
        return 0;
    };

    const sumArraySizes = (arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return 0;
        return arr.reduce((sum, item) => sum + getItemSize(item), 0);
    };

    let bytes = sumArraySizes(info.requested_downloads);
    if (bytes > 0) return bytes;

    bytes = sumArraySizes(info.requested_formats);
    if (bytes > 0) return bytes;

    bytes = getItemSize(info);
    return bytes > 0 ? bytes : null;
}

/**
 * Find the latest file in a directory
 */
function findLatestFile(directory) {
    try {
        console.log(`Searching for latest file in: ${directory}`);

        const files = fs.readdirSync(directory)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                // Ignore temporary conversion files so fallback scanning returns a completed media file.
                return !file.includes('.converting.') && ['.mp4', '.mov', '.mkv', '.webm', '.mp3', '.m4a', '.wav'].includes(ext);
            })
            .map(file => ({
                name: file,
                path: path.join(directory, file),
                ext: path.extname(file).toLowerCase(),
                time: fs.statSync(path.join(directory, file)).mtime.getTime()
            }))
            .sort((a, b) => {
                // Sort by time first (newest first)
                const timeDiff = b.time - a.time;
                if (timeDiff !== 0) return timeDiff;
                // Use extension as tiebreaker: prioritize MOV and MP4
                const priority = { '.mov': 0, '.mp4': 1 };
                const aPriority = priority[a.ext] ?? 2;
                const bPriority = priority[b.ext] ?? 2;
                return aPriority - bPriority;
            });

        console.log(`Found ${files.length} media files:`);
        files.forEach((file, index) => {
            console.log(`  ${index + 1}. ${file.name} (${file.ext}) - ${new Date(file.time).toLocaleString()}`);
        });

        if (files.length > 0) {
            console.log(`Selected file: ${files[0].name}`);
            return files[0].path;
        } else {
            console.log('No media files found in directory');
        }
    } catch (error) {
        console.error('Error finding latest file:', error);
    }

    return null;
}

module.exports = {
    downloadVideo,
    estimateDownloadSize,
    // Exported for focused regression tests without exposing these helpers in the panel UI.
    getPrivateRuntimeConfig,
    shouldRetryWithoutCookies,
    getVideoFormatSelector,
    normalizeVideoQuality,
    getH264OutputPaths,
    findLatestFile
};
