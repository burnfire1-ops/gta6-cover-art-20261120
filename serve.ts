// Bay of Light Cover Studio — tiny local static server (Node 22, standard
// library only). It serves app/ so the cover studio can be tried in a
// desktop browser without any build step:
//   node serve.ts            (http://localhost:8080)
//   node serve.ts --port 9000
// Development convenience only — it binds to localhost and is not a server
// for the internet.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// The folder served, and the port: --port N when given, 8080 otherwise.
const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const flagAt = argv.indexOf('--port');
const wanted = flagAt === -1 ? 8080 : Number(argv[flagAt + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

// Content types an offline web app needs, keyed by file extension.
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

createServer((req, res) => {
  // Turn the request path into a file path inside app/. A trailing slash
  // means the folder's index page.
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathPart: string;
  try {
    pathPart = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  if (pathPart.endsWith('/')) pathPart += 'index.html';
  const file = resolve(join(appRoot, normalize(pathPart)));

  // Refuse anything that would escape app/ (a path climbing out with ..).
  if (file !== appRoot && !file.startsWith(appRoot + sep)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  // 404 when the file is missing or is not a plain file.
  let bytes: number;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('not a file');
    bytes = info.size;
  } catch {
    res.writeHead(404).end('not found');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
    'content-length': bytes,
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => {
  console.log(`Bay of Light Cover Studio is on http://localhost:${port}`);
});
