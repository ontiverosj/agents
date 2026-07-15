// Automated render via the Remotion Node APIs.
//   node scripts/render.mjs [preview|4k] [--frames=a-b]
// Produces H.264 MP4 + AAC audio + yuv420p, identical to the CLI commands.

import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const which = process.argv[2] === '4k' ? '4k' : 'preview';
const framesArg = process.argv.find((a) => a.startsWith('--frames='));
const frameRange = framesArg
  ? framesArg.replace('--frames=', '').split('-').map(Number)
  : null;

const compositionId = which === '4k' ? 'BreakfastASMR4K' : 'BreakfastASMRPreview';
const outName = which === '4k' ? 'breakfast-asmr-4k.mp4' : 'breakfast-asmr-preview.mp4';

const run = async () => {
  console.log(`Bundling...`);
  const serveUrl = await bundle({ entryPoint: join(ROOT, 'src/index.ts') });

  console.log(`Selecting ${compositionId}...`);
  const composition = await selectComposition({ serveUrl, id: compositionId });

  console.log(`Rendering ${composition.width}x${composition.height} @ ${composition.fps}fps...`);
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    audioCodec: 'aac',
    pixelFormat: 'yuv420p',
    crf: which === '4k' ? 15 : 16,
    imageFormat: 'jpeg',
    jpegQuality: 95,
    outputLocation: join(ROOT, 'out', outName),
    frameRange: frameRange ? [frameRange[0], frameRange[1]] : null,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r${(progress * 100).toFixed(1)}%   `);
    },
  });
  console.log(`\nDone -> out/${outName}`);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
