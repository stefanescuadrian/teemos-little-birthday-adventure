import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['node_modules', '.git', 'dist', '.openai', 'work']);
const files = {};
async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    const name = relative(root, path).replaceAll('\\', '/');
    if (excluded.has(entry.name) || name === 'public/downloads' || entry.name.endsWith('.tsbuildinfo') || entry.name.startsWith('.env')) continue;
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) files[`teemo-birthday/${name}`] = new Uint8Array(await readFile(path));
  }
}
await collect(root);
const output = resolve(root, 'public/downloads');
await mkdir(output, { recursive: true });
await writeFile(resolve(output, 'teemo-birthday.zip'), zipSync(files, { level: 6 }));
console.log(`Source package ready (${Object.keys(files).length} files).`);
