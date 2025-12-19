const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Download video from YouTube using yt-dlp
 */
async function downloadVideo(options) {
    const {
        url,
        format = 'both',
        destination,
        startTime,
        endTime,
        onProgress,
        onComplete,
        onError,
        signal
    } = options;

    return new Promise((resolve, reject) => {
        try {
            // Ensure destination directory exists
            if (!fs.existsSync(destination)) {
                fs.mkdirSync(destination, { recursive: true });
            }

            // Build yt-dlp command
            const args = buildYtDlpArgs(url, format, destination, startTime, endTime);

            console.log('Executing yt-dlp with args:', args);

            // Spawn yt-dlp process
            const ytDlp = spawn('yt-dlp', args, {
                cwd: destination,
                windowsHide: true,
                shell: false
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
                            status: 'Téléchargement en cours...'
                        });
                    }
                }

                // Check for merge/conversion
                if (output.includes('Merging formats')) {
                    if (onProgress) {
                        onProgress({
                            progress: 95,
                            status: 'Fusion des formats...'
                        });
                    }
                }

                if (output.includes('Deleting original file')) {
                    if (onProgress) {
                        onProgress({
                            progress: 98,
                            status: 'Finalisation...'
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

                // Also check for "has been downloaded" message
                const downloadedMatch = output.match(/\[download\] (.+) has been downloaded/);
                if (downloadedMatch) {
                    const completedFile = path.join(destination, path.basename(downloadedMatch[1]));
                    console.log(`Download completed message for: ${completedFile}`);
                    // Only update if it's an MP4 or we don't have a file yet
                    if (completedFile.endsWith('.mp4') || !downloadedFile) {
                        downloadedFile = completedFile;
                    }
                }
            });

            // Handle stderr
            ytDlp.stderr.on('data', (data) => {
                const errorStr = data.toString();
                errorBuffer += errorStr;
                console.error('yt-dlp stderr:', errorStr);
            });

            // Handle completion
            ytDlp.on('close', (code) => {
                console.log(`yt-dlp exited with code ${code}`);

                if (signal && signal.aborted) {
                    return;
                }

                if (code === 0 || (code === null && signal && signal.aborted)) {
                    // Success
                    if (!downloadedFile) {
                        console.log('No file captured from yt-dlp output, searching directory...');
                        downloadedFile = findLatestFile(destination);
                    }

                    console.log(`=== DOWNLOAD COMPLETE ===`);
                    console.log(`Final file to be used: ${downloadedFile}`);
                    console.log(`File exists: ${downloadedFile && fs.existsSync(downloadedFile)}`);

                    // Apply time trimming if needed
                    if (startTime !== undefined && endTime !== undefined && downloadedFile) {
                        console.log(`Applying time trimming: ${startTime}s to ${endTime}s`);
                        trimVideo(downloadedFile, startTime, endTime, (trimmedFile) => {
                            if (trimmedFile) {
                                console.log(`Trimmed file created: ${trimmedFile}`);
                                if (onComplete) onComplete(trimmedFile);
                                resolve(trimmedFile);
                            } else {
                                console.log(`Trimming failed, using original file: ${downloadedFile}`);
                                if (onComplete) onComplete(downloadedFile);
                                resolve(downloadedFile);
                            }
                        });
                    } else {
                        if (onComplete) onComplete(downloadedFile);
                        resolve(downloadedFile);
                    }
                } else {
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
function buildYtDlpArgs(url, format, destination, startTime, endTime) {
    const args = [url];

    // Format selection
    if (format === 'audio') {
        args.push('-f', 'bestaudio/best');
        args.push('-x');
        args.push('--audio-format', 'wav');
    } else {
        // Video - EXCLUDE VP9 codec (not supported by Premiere Pro)
        // Prefer H.264/AVC which is universally supported
        // Format string explanation:
        // - bestvideo[vcodec^=avc1] : Try H.264 (avc1) first
        // - bestvideo[vcodec^=avc]  : Try any AVC variant
        // - bestvideo[vcodec!=vp9]  : Try any codec EXCEPT VP9
        // - best                    : Fallback to best available
        args.push('-f', 'bestvideo[vcodec^=avc1]+bestaudio/bestvideo[vcodec^=avc]+bestaudio/bestvideo[vcodec!=vp9]+bestaudio/best');
        args.push('--merge-output-format', 'mp4');

        // Force audio to AAC codec (Premiere Pro doesn't support Opus/Vorbis)
        args.push('--audio-format', 'best');
        args.push('--postprocessor-args', 'ffmpeg:-c:a aac -b:a 192k');
    }

    // Specify download directory
    args.push('--paths', destination);

    // Output template
    args.push('-o', '%(title)s.%(ext)s');

    // Restrict filenames to Windows-safe characters
    args.push('--windows-filenames');

    // Replace problematic characters
    args.push('--restrict-filenames');

    // Progress
    args.push('--newline');
    args.push('--progress');

    // No playlist
    args.push('--no-playlist');

    // Embed metadata
    args.push('--embed-metadata');

    // Use cookies from browser to bypass SABR restrictions
    // This allows access to high quality formats
    args.push('--cookies-from-browser', 'firefox');

    // Ignore errors
    args.push('--ignore-errors');

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
        const ffmpeg = spawn('ffmpeg', args, { shell: false });

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
 * Find the latest file in a directory
 */
function findLatestFile(directory) {
    try {
        console.log(`Searching for latest file in: ${directory}`);

        const files = fs.readdirSync(directory)
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.mp4', '.mkv', '.webm', '.mp3', '.m4a', '.wav'].includes(ext);
            })
            .map(file => ({
                name: file,
                path: path.join(directory, file),
                ext: path.extname(file).toLowerCase(),
                time: fs.statSync(path.join(directory, file)).mtime.getTime()
            }))
            .sort((a, b) => {
                // Prioritize MP4 files over other formats
                if (a.ext === '.mp4' && b.ext !== '.mp4') return -1;
                if (a.ext !== '.mp4' && b.ext === '.mp4') return 1;
                // Then sort by time (newest first)
                return b.time - a.time;
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
    downloadVideo
};
