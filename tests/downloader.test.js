const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    getVideoFormatSelector,
    normalizeVideoQuality,
    getH264OutputPaths,
    findLatestFile
} = require('../client/js/downloader');

// Maximum quality must prefer non-AV1 sources when the extension needs local H.264 conversion.
assert.strictEqual(
    getVideoFormatSelector('max'),
    'bestvideo[dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[vcodec!*=av01]+bestaudio/best[vcodec!*=av01]/best[ext=mp4][vcodec!*=av01]'
);

// Explicit quality choices cap resolution while keeping the default H.264 path away from AV1.
assert.strictEqual(
    getVideoFormatSelector('4k'),
    'bestvideo[height<=2160][dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[height<=2160][vcodec!*=av01]+bestaudio/best[height<=2160][vcodec!*=av01]/best[ext=mp4][vcodec!*=av01]'
);
assert.strictEqual(
    getVideoFormatSelector('1080'),
    'bestvideo[height<=1080][dynamic_range=SDR][vcodec!*=av01]+bestaudio/bestvideo[height<=1080][vcodec!*=av01]+bestaudio/best[height<=1080][vcodec!*=av01]/best[ext=mp4][vcodec!*=av01]'
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

console.log('downloader format selector tests passed');
