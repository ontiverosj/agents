const RESOLUTIONS = {
  '720p': [720, 1280],
  '1080p': [1080, 1920],
  '1440p': [1440, 2560],
  '4k': [2160, 3840],
};

const number = (value, fallback, min, max) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const bool = (value) => value === true || value === 1 || value === 'true' || value === '1';

const parseExportOptions = (body = {}) => {
  const resolution = RESOLUTIONS[body.resolution] ? body.resolution : '720p';
  const [width, height] = RESOLUTIONS[resolution];
  const crop = (prefix) => ({
    top: number(body[`${prefix}_crop_top`], 0, 0, 49) / 100,
    right: number(body[`${prefix}_crop_right`], 0, 0, 49) / 100,
    bottom: number(body[`${prefix}_crop_bottom`], 0, 0, 49) / 100,
    left: number(body[`${prefix}_crop_left`], 0, 0, 49) / 100,
  });
  return {
    resolution,
    width,
    height,
    videoOne: { crop: crop('video_one'), reverse: bool(body.video_one_reverse) },
    videoTwo: { crop: crop('video_two'), reverse: bool(body.video_two_reverse) },
    brightness: number(body.brightness, 0, -1, 1),
    contrast: number(body.contrast, 1, 0, 2),
    saturation: number(body.saturation, 1, 0, 3),
    blur: number(body.blur, 0, 0, 20),
    sharpen: number(body.sharpen, 0, 0, 2),
  };
};

const videoChain = ({ crop, reverse }, options, width, height) => {
  const filters = [];
  if (crop.top || crop.right || crop.bottom || crop.left) {
    filters.push(`crop=iw*${1 - crop.left - crop.right}:ih*${1 - crop.top - crop.bottom}:iw*${crop.left}:ih*${crop.top}`);
  }
  if (reverse) filters.push('reverse');
  filters.push(`scale=${width}:${height}:force_original_aspect_ratio=decrease`);
  filters.push(`pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`);
  filters.push('setsar=1');
  if (options.brightness !== 0 || options.contrast !== 1 || options.saturation !== 1) {
    filters.push(`eq=brightness=${options.brightness}:contrast=${options.contrast}:saturation=${options.saturation}`);
  }
  if (options.blur > 0) filters.push(`gblur=sigma=${options.blur}`);
  if (options.sharpen > 0) filters.push(`unsharp=5:5:${options.sharpen}`);
  return filters.join(',');
};

const escapeSubtitlePath = (file) => file.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");

module.exports = { RESOLUTIONS, parseExportOptions, videoChain, escapeSubtitlePath };
