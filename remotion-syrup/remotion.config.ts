import { Config } from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setOverwriteOutput(true);
// JPEG frames keep memory/render time sane; quality 95 avoids visible banding
// in the syrup gradients.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
// yuv420p for maximum social-platform compatibility.
Config.setPixelFormat('yuv420p');
