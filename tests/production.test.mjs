import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { root, publicFiles } from '../scripts/build.mjs';

test('deployment contains only runtime assets and resolves every local script', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'wilco-build-'));
  try {
    await cp(resolve(root, 'scripts'), resolve(directory, 'scripts'), { recursive: true });
    for (const name of publicFiles) await cp(resolve(root, name), resolve(directory, name));
    // Representative private files must not escape into the public output.
    await cp(resolve(root, 'package.json'), resolve(directory, 'package.json'));
    await promisify(execFile)(process.execPath, [resolve(directory, 'scripts/build.mjs')]);
    const output = await readdir(resolve(directory, 'dist'));
    assert.deepEqual(output.sort(), [...publicFiles].sort());
    const html = await readFile(resolve(directory, 'dist/index.html'), 'utf8');
    for (const [, script] of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
      assert.ok(output.includes(script), `Unshipped script ${script}`);
      await promisify(execFile)(process.execPath, ['--check', resolve(directory, 'dist', script)]);
    }
    await promisify(execFile)(process.execPath, [resolve(directory, 'scripts/build.mjs'), '--base-path=/projects/wilco/']);
    const mounted = await readFile(resolve(directory, 'dist/index.html'), 'utf8');
    assert.ok(mounted.includes('<base href="/projects/wilco/">'));
    for (const page of ['https://example.com/projects/wilco', 'https://example.com/projects/wilco/', 'https://example.com/projects/wilco/index.html']) {
      const base = new URL('/projects/wilco/', page);
      for (const [, script] of mounted.matchAll(/<script[^>]+src="([^"]+)"/g)) {
        assert.equal(new URL(script, base).pathname, `/projects/wilco/${script}`);
      }
    }
    await assert.rejects(promisify(execFile)(process.execPath, [resolve(directory, 'scripts/build.mjs'), '--base-path=//evil.example/']));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
