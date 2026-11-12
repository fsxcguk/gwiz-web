import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist/current-ng/browser/', import.meta.url)));
const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const requiredRuntimeVariables = ['API_URL', 'STRIPE_PUBLISHABLE_KEY'];
const missingRuntimeVariables = requiredRuntimeVariables.filter(
  (name) => !process.env[name]?.trim()
);

if (missingRuntimeVariables.length > 0) {
  console.error(
    `Missing required Railway environment variable(s): ${missingRuntimeVariables.join(', ')}`
  );
  process.exitCode = 1;
  throw new Error('Railway runtime configuration is incomplete.');
}

const runtimeConfigBody = JSON.stringify({
  apiUrl: process.env.API_URL.trim(),
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY.trim(),
});

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safePath(requestPath) {
  const pathname = decodeURIComponent(new URL(requestPath, 'http://localhost').pathname);
  const candidate = resolve(root, `.${normalize(pathname)}`);
  return candidate === root || candidate.startsWith(`${root}\\`) || candidate.startsWith(`${root}/`)
    ? candidate
    : null;
}

async function filePathFor(requestPath) {
  const candidate = safePath(requestPath);
  if (!candidate) return null;

  try {
    const stat = await fs.stat(candidate);
    return stat.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }

  if (request.url?.split('?')[0] === '/runtime-config.json') {
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Length': Buffer.byteLength(runtimeConfigBody),
      'Content-Type': 'application/json; charset=utf-8',
    });
    response.end(request.method === 'HEAD' ? undefined : runtimeConfigBody);
    return;
  }

  let filePath;
  try {
    filePath = await filePathFor(request.url ?? '/');
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  // Angular client-side routes need to receive index.html on direct navigation.
  filePath ??= join(root, 'index.html');

  try {
    const stat = await fs.stat(filePath);
    response.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': contentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    if (request.method === 'HEAD') {
      response.end();
    } else {
      createReadStream(filePath).pipe(response);
    }
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Serving ${root} on port ${port}`);
});
