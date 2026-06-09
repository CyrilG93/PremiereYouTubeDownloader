const assert = require('assert');
const {
    getVideoFormatSelector,
    normalizeVideoQuality
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

console.log('downloader format selector tests passed');
