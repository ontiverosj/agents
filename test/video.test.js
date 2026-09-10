const test = require('node:test');
const assert = require('node:assert/strict');
const { parseExportOptions, videoChain, escapeSubtitlePath } = require('../src/video');

test('advanced export options are validated and clamped', () => {
  const options = parseExportOptions({
    resolution: '4k', video_one_crop_top: '10', video_one_crop_left: '55',
    video_one_reverse: 'true', brightness: '2', contrast: '-1', saturation: '9', blur: '4', sharpen: '1.2',
  });
  assert.deepEqual([options.width, options.height], [2160, 3840]);
  assert.equal(options.videoOne.crop.top, 0.1);
  assert.equal(options.videoOne.crop.left, 0.49);
  assert.equal(options.videoOne.reverse, true);
  assert.equal(options.brightness, 1);
  assert.equal(options.contrast, 0);
  assert.equal(options.saturation, 3);
});

test('unknown resolution safely falls back to vertical 720p', () => {
  const options = parseExportOptions({ resolution: '8k' });
  assert.deepEqual([options.width, options.height, options.resolution], [720, 1280, '720p']);
});

test('video chain includes requested transforms and filters', () => {
  const options = parseExportOptions({ video_one_crop_top: 5, video_one_reverse: 1,
    brightness: .1, contrast: 1.1, saturation: 1.2, blur: 2, sharpen: .5 });
  const chain = videoChain(options.videoOne, options, options.width, options.height);
  for (const expected of ['crop=', 'reverse', 'scale=720:1280', 'eq=brightness=0.1', 'gblur=sigma=2', 'unsharp=5:5:0.5']) {
    assert.match(chain, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('subtitle paths escape FFmpeg-sensitive characters', () => {
  assert.equal(escapeSubtitlePath("C:\\tmp\\it's.srt"), "C\\:/tmp/it\\'s.srt");
});
