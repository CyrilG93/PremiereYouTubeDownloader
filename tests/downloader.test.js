const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    getVideoFormatSelector,
    normalizeVideoQuality,
    getH264OutputPaths
} = require('../client/js/downloader');

// Maximum quality must allow VP9/AV1 sources because YouTube commonly reserves 4K for those codecs.
assert.strictEqual(
    getVideoFormatSelector('max'),
    'bestvideo[dynamic_range=SDR]+bestaudio/bestvideo+bestaudio/best'
);

// Explicit quality choices cap resolution without restricting the source codec.
assert.strictEqual(
    getVideoFormatSelector('4k'),
    'bestvideo[height<=2160][dynamic_range=SDR]+bestaudio/bestvideo[height<=2160]+bestaudio/best[height<=2160]'
);
assert.strictEqual(
    getVideoFormatSelector('1080'),
    'bestvideo[height<=1080][dynamic_range=SDR]+bestaudio/bestvideo[height<=1080]+bestaudio/best[height<=1080]'
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

console.log('downloader format selector tests passed');
