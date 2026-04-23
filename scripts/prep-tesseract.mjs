// Copy tesseract.js runtime assets into /public so we serve them from our own origin.
// Also fetch eng.traineddata.gz once (cached in /public, committed to repo).

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const dst = path.join(root, 'public', 'tesseract');
const langDst = path.join(dst, 'lang');

fs.mkdirSync(dst, { recursive: true });
fs.mkdirSync(langDst, { recursive: true });

const copies = [
  ['node_modules/tesseract.js/dist/worker.min.js',              'worker.min.js'],
  ['node_modules/tesseract.js-core/tesseract-core.wasm.js',     'tesseract-core.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core.wasm',        'tesseract-core.wasm'],
  ['node_modules/tesseract.js-core/tesseract-core-simd.wasm.js','tesseract-core-simd.wasm.js'],
  ['node_modules/tesseract.js-core/tesseract-core-simd.wasm',   'tesseract-core-simd.wasm'],
];

for (const [from, to] of copies) {
  const src = path.join(root, from);
  const dest = path.join(dst, to);
  if (!fs.existsSync(src)) { console.error('missing:', src); process.exit(1); }
  fs.copyFileSync(src, dest);
  console.log('copied', to);
}

const langFile = path.join(langDst, 'eng.traineddata.gz');
if (!fs.existsSync(langFile)) {
  console.log('downloading eng.traineddata.gz');
  await new Promise((resolve, reject) => {
    const file = fs.createWriteStream(langFile);
    https.get('https://tessdata.projectnaptha.com/4.0.0/eng.traineddata.gz', (res) => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode));
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve()));
    }).on('error', reject);
  });
  console.log('lang data saved');
} else {
  console.log('lang data already present');
}
