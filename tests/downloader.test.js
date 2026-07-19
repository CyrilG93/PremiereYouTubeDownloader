const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    getVideoFormatSelector,
    normalizeVideoQuality,
    getH264OutputPaths,
    findLatestFile,
    getPrivateRuntimeConfig,
    resolveYtDlpCommand,
    resolveDenoPath,
    parseYtDlpProgressPercent,
    parseYtDlpFinalPath,
    shouldRetryWithoutCookies,
    hasValidTimeRange,
    validateTimeRangeAgainstDuration,
    buildYtDlpArgs
} = require('../client/js/downloader');

// Maximum quality must prefer non-AV1 sources when the extension needs local H.264 conversion.
assert.strictEqual(
    getVideoFormatSelector('max'),
    'bestvideo[height>1080][dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[height>1080][vcodec!*=av01]+bestaudio/bestvideo[ext=mp4][vcodec*=avc1]+bestaudio[ext=m4a]/bestvideo[ext=mp4][vcodec*=avc1]+bestaudio[acodec*=mp4a]/best[ext=mp4][vcodec*=avc1]/bestvideo[dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[vcodec!*=av01]+bestaudio/best[vcodec!*=av01]/best[ext=mp4][vcodec!*=av01]'
);

// Explicit quality choices cap resolution while keeping the default H.264 path away from AV1.
assert.strictEqual(
    getVideoFormatSelector('4k'),
    'bestvideo[height<=2160][height>1080][dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[height<=2160][height>1080][vcodec!*=av01]+bestaudio/bestvideo[height<=2160][ext=mp4][vcodec*=avc1]+bestaudio[ext=m4a]/bestvideo[height<=2160][ext=mp4][vcodec*=avc1]+bestaudio[acodec*=mp4a]/best[height<=2160][ext=mp4][vcodec*=avc1]/bestvideo[height<=2160][dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[height<=2160][vcodec!*=av01]+bestaudio/best[height<=2160][vcodec!*=av01]/best[ext=mp4][vcodec!*=av01]'
);
assert.strictEqual(
    getVideoFormatSelector('1080'),
    'bestvideo[height<=1080][ext=mp4][vcodec*=avc1]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4][vcodec*=avc1]+bestaudio[acodec*=mp4a]/best[height<=1080][ext=mp4][vcodec*=avc1]/bestvideo[height<=1080][dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[height<=1080][vcodec!*=av01]+bestaudio/best[height<=1080][vcodec!*=av01]/best[ext=mp4][vcodec!*=av01]'
);

// Generic passthrough selectors remain permissive when no local transcode is needed.
assert.strictEqual(
    getVideoFormatSelector('max', 'passthrough'),
    'bestvideo[dynamic_range=SDR]+bestaudio/bestvideo+bestaudio/best'
);

// Unknown persisted values fall back to maximum quality.
assert.strictEqual(normalizeVideoQuality('unexpected'), 'max');

// H.264 conversions use a distinct final filename to avoid Premiere reusing the VP9 source cache.
const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'premiere-ytdl-paths-'));
const firstOutput = getH264OutputPaths(outputDirectory, 'Example');
assert.strictEqual(firstOutput.final, path.join(outputDirectory, 'Example [H264].mp4'));
assert.strictEqual(firstOutput.temporary, path.join(outputDirectory, 'Example [H264].converting.mp4'));
fs.writeFileSync(firstOutput.final, '');
const secondOutput = getH264OutputPaths(outputDirectory, 'Example');
assert.strictEqual(secondOutput.final, path.join(outputDirectory, 'Example [H264] 2.mp4'));

// Directory fallback must never pick a stale temporary conversion file over a real download.
const scanDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'premiere-ytdl-scan-'));
const realDownload = path.join(scanDirectory, 'Example.mp4');
const staleTemporary = path.join(scanDirectory, 'Example [H264].converting.mp4');
fs.writeFileSync(realDownload, '');
fs.writeFileSync(staleTemporary, '');
const staleTime = new Date(Date.now() + 10000);
fs.utimesSync(staleTemporary, staleTime, staleTime);
assert.strictEqual(findLatestFile(scanDirectory), realDownload);
assert.strictEqual(shouldRetryWithoutCookies('', '', 'firefox'), true);
assert.strictEqual(shouldRetryWithoutCookies('', '', 'none'), false);
assert.strictEqual(shouldRetryWithoutCookies('ERROR: [WinError 2] The system cannot find the file specified', '', 'firefox'), false);
assert.strictEqual(hasValidTimeRange(1440, 1510), true);
assert.strictEqual(hasValidTimeRange(1510, 1440), false);
assert.strictEqual(hasValidTimeRange(undefined, 1510), false);
assert.deepStrictEqual(validateTimeRangeAgainstDuration(0, 10, 89.69), { valid: true });
assert.deepStrictEqual(validateTimeRangeAgainstDuration(1800, 2160, 89.69), {
    valid: false,
    reason: 'start_after_duration'
});
assert.deepStrictEqual(validateTimeRangeAgainstDuration(80, 120, 89.69), {
    valid: false,
    reason: 'end_after_duration'
});

const h264DownloadArgs = buildYtDlpArgs(
    'https://www.youtube.com/watch?v=example',
    'both',
    outputDirectory,
    undefined,
    undefined,
    path.join(outputDirectory, 'ffmpeg.exe'),
    'none',
    'max',
    'wav',
    'h264'
);
assert.strictEqual(h264DownloadArgs.includes('--merge-output-format'), false);
assert.strictEqual(h264DownloadArgs.includes('--embed-metadata'), false);
assert.strictEqual(h264DownloadArgs.includes('--ignore-errors'), false);
assert.strictEqual(h264DownloadArgs.includes('--progress-template'), true);
assert.strictEqual(h264DownloadArgs.includes('--print'), true);

// Structured yt-dlp markers must isolate progress and final paths from human-readable logs.
assert.strictEqual(parseYtDlpProgressPercent('__YTDLP_PROGRESS__ 42.7%'), 42.7);
assert.strictEqual(parseYtDlpProgressPercent('[download] 12.0%'), null);
assert.strictEqual(
    parseYtDlpFinalPath('log line\n__YTDLP_FILE__/tmp/Example final.mp4\n'),
    '/tmp/Example final.mp4'
);

// Explicit Deno paths must be forwarded through yt-dlp's supported JS runtime option.
const fakeDenoPath = path.join(outputDirectory, os.platform() === 'win32' ? 'deno.exe' : 'deno');
fs.writeFileSync(fakeDenoPath, '');
assert.strictEqual(resolveDenoPath(fakeDenoPath, {}), fakeDenoPath);
const denoDownloadArgs = buildYtDlpArgs(
    'https://www.youtube.com/watch?v=example',
    'both',
    outputDirectory,
    undefined,
    undefined,
    path.join(outputDirectory, 'ffmpeg.exe'),
    'none',
    'max',
    'wav',
    'h264',
    fakeDenoPath
);
assert.strictEqual(denoDownloadArgs[denoDownloadArgs.indexOf('--js-runtimes') + 1], `deno:${fakeDenoPath}`);

const timeRangeArgs = buildYtDlpArgs(
    'https://www.youtube.com/watch?v=example',
    'both',
    outputDirectory,
    1440,
    1510,
    path.join(outputDirectory, 'ffmpeg.exe'),
    'none',
    'max',
    'wav',
    'h264'
);
assert.strictEqual(timeRangeArgs.includes('--download-sections'), true);
assert.strictEqual(timeRangeArgs[timeRangeArgs.indexOf('--download-sections') + 1], '*00:24:00-00:25:10');

if (os.platform() === 'win32') {
    // // A Windows EXE install must work even if the installer config.json is missing.
    const previousLocalAppData = process.env.LOCALAPPDATA;
    const localAppData = fs.mkdtempSync(path.join(os.tmpdir(), 'premiere-ytdl-localappdata-'));
    const runtimeRoot = path.join(localAppData, 'PremiereYouTubeDownloader', 'runtime');
    const toolPaths = [
        path.join(runtimeRoot, 'python', 'python.exe'),
        path.join(runtimeRoot, 'python', 'Scripts', 'yt-dlp.exe'),
        path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg.exe'),
        path.join(runtimeRoot, 'deno', 'bin', 'deno.exe')
    ];

    for (const toolPath of toolPaths) {
        fs.mkdirSync(path.dirname(toolPath), { recursive: true });
        fs.writeFileSync(toolPath, '');
    }

    process.env.LOCALAPPDATA = localAppData;
    const runtimeConfig = getPrivateRuntimeConfig();
    assert.strictEqual(runtimeConfig.ytDlpPath, path.join(runtimeRoot, 'python', 'Scripts', 'yt-dlp.exe'));
    assert.strictEqual(runtimeConfig.ffmpegPath, path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg.exe'));
    assert.strictEqual(runtimeConfig.denoPath, path.join(runtimeRoot, 'deno', 'bin', 'deno.exe'));
    const ytDlpCommand = resolveYtDlpCommand('', runtimeConfig);
    assert.strictEqual(ytDlpCommand.command, path.join(runtimeRoot, 'python', 'python.exe'));
    assert.deepStrictEqual(ytDlpCommand.baseArgs, ['-m', 'yt_dlp']);

    if (previousLocalAppData === undefined) {
        delete process.env.LOCALAPPDATA;
    } else {
        process.env.LOCALAPPDATA = previousLocalAppData;
    }
}

if (os.platform() === 'darwin') {
    // // The macOS PKG runtime must not execute the pip-generated yt-dlp launcher because it can keep build-machine paths.
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'premiere-ytdl-mac-home-'));
    const runtimeRoot = path.join(fakeHome, 'Library', 'Application Support', 'PremiereYouTubeDownloader', 'runtime');
    const toolPaths = [
        path.join(runtimeRoot, 'python', 'bin', 'python3'),
        path.join(runtimeRoot, 'ffmpeg', 'bin', 'ffmpeg'),
        path.join(runtimeRoot, 'deno', 'bin', 'deno')
    ];
    for (const toolPath of toolPaths) {
        fs.mkdirSync(path.dirname(toolPath), { recursive: true });
        fs.writeFileSync(toolPath, '');
    }
    const runtimeConfig = {
        pythonPath: toolPaths[0],
        ytDlpPath: path.join(runtimeRoot, 'python', 'bin', 'yt-dlp'),
        ffmpegPath: toolPaths[1],
        denoPath: toolPaths[2]
    };
    const ytDlpCommand = resolveYtDlpCommand('', runtimeConfig);
    assert.strictEqual(ytDlpCommand.command, path.join(runtimeRoot, 'python', 'bin', 'python3'));
    assert.deepStrictEqual(ytDlpCommand.baseArgs, ['-m', 'yt_dlp']);
}

// // Keep release tooling aligned with the supported Full Windows and ARM64 macOS scope.
const projectRoot = path.resolve(__dirname, '..');
const packageMetadata = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const windowsPackaging = fs.readFileSync(
    path.join(projectRoot, 'scripts', 'youtubedownloader-package-windows-exe.mjs'),
    'utf8'
);
const macPackaging = fs.readFileSync(
    path.join(projectRoot, 'scripts', 'youtubedownloader-package-macos-pkg.mjs'),
    'utf8'
);
const manifest = fs.readFileSync(path.join(projectRoot, 'CSXS', 'manifest.xml'), 'utf8');
assert.strictEqual(windowsPackaging.includes('Windows-Light-Installer'), false);
assert.strictEqual(windowsPackaging.includes('YTDL_WINDOWS_LIGHT_ONLY'), false);
assert.strictEqual(windowsPackaging.includes('windows-runtime.json'), false);
assert.strictEqual(windowsPackaging.includes('AfterInstall: RunFullInstallation'), true);
assert.strictEqual(windowsPackaging.includes('RaiseException'), true);
assert.strictEqual(macPackaging.includes('macArch !== "arm64"'), true);
assert.strictEqual(macPackaging.includes('COPYFILE_DISABLE: "1"'), true);
assert.strictEqual(macPackaging.includes('MACOSX_DEPLOYMENT_TARGET: macosDeploymentTarget'), true);
assert.strictEqual(macPackaging.includes('path.join(runtimeArchivesDir, assetName)'), true);
assert.strictEqual(manifest.includes(`ExtensionBundleVersion="${packageMetadata.version}"`), true);
assert.strictEqual(manifest.includes('example.com'), false);
assert.strictEqual(fs.existsSync(path.join(projectRoot, 'installers', 'licenses', 'DENO_LICENSE.md')), true);

console.log('downloader format selector tests passed');
