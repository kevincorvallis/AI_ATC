import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { realpathSync } from 'node:fs';

export const root = fileURLToPath(new URL('../', import.meta.url));
// Only public runtime assets belong in a deployment. Never copy the repository.
export const publicFiles = [
  'index.html', 'favicon.svg', 'styles.css', 'demo-styles.css', 'core.js',
  'config.js', 'scenarios-config.js', 'phraseology.js', 'scenario-state.js',
  'aviation-visual.js', 'feedback-engine.js', 'demo-data.js', 'demo-onboarding.js', 'app.js',
  'lesson-engine.js', 'lesson-voice.js', 'lesson-ui.js', 'lesson.css',
];

export async function build({ basePath } = {}) {
  if (basePath !== undefined && !/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath)) {
    throw new Error('Base path must be an absolute directory path ending in /');
  }
  const destination = resolve(root, 'dist');
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
  await Promise.all(publicFiles.map(file => copyFile(resolve(root, file), resolve(destination, file))));
  let html = await readFile(resolve(destination, 'index.html'), 'utf8');
  // Static hosts can serve directory indexes without redirecting to a final slash.
  if (basePath) {
    html = html.replace('<head>', `<head>\n    <base href="${basePath}">`);
    await writeFile(resolve(destination, 'index.html'), html);
  }
  for (const [, asset] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(?:https?:|\/|mailto:)/.test(asset)) continue;
    if (!publicFiles.includes(asset)) throw new Error(`Missing public asset: ${asset}`);
  }
  console.log(`Built ${publicFiles.length} public assets in dist/`);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const option = process.argv.slice(2).find(argument => argument.startsWith('--base-path='));
  await build({ basePath: option?.slice('--base-path='.length) });
}
