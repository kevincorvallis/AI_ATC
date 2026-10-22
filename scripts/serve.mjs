import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { root, publicFiles } from './build.mjs';

const port = Number(process.env.PORT || 8000);
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'index.html'; }
  catch { res.writeHead(400).end(); return; }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  if (!publicFiles.includes(path)) { res.writeHead(404).end('Not found'); return; }
  try {
    const body = await readFile(resolve(root, path));
    res.writeHead(200, { 'Content-Type': `${types[extname(path)]}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500).end('Unable to load asset'); }
});
server.listen(port, '127.0.0.1', () => console.log(`Wilco: http://127.0.0.1:${port}`));
