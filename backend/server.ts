// Feasibility backend: serves the model catalog, mirrors model files over the LAN, and collects benchmark results.
// Zero dependencies. Run: node --experimental-strip-types server.ts
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { networkInterfaces } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(ROOT, '..', 'ai-feasibility', 'src', 'lib', 'catalog', 'catalog.json');
const TARA_CATALOG_PATH = join(ROOT, 'tara_catalog.json');
const MODELS_DIR = join(ROOT, 'models');
const DATA_DIR = join(ROOT, 'data');
const RESULTS_PATH = join(DATA_DIR, 'results.json');
const PORT = Number(process.env.PORT ?? 8787);

type ResultRow = Record<string, unknown> & { id: string; created_at?: string };

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(MODELS_DIR, { recursive: true });
const results = new Map<string, ResultRow>(
  existsSync(RESULTS_PATH) ? (JSON.parse(readFileSync(RESULTS_PATH, 'utf8')) as ResultRow[]).map((r) => [r.id, r]) : [],
);

const COLUMNS = ['created_at', 'device_model', 'device_ram_gb', 'task', 'model_id', 'target', 'lang', 'load_ms', 'latency_ms', 'tokens_per_s', 'realtime_factor', 'score', 'input', 'output', 'error'];

function send(res: ServerResponse, status: number, body: string, type = 'application/json'): void {
  res.writeHead(status, { 'content-type': type, 'access-control-allow-origin': '*' });
  res.end(body);
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
      if (body.length > 256_000) reject(new Error('body too large'));
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

type MirrorFile = { url: string; file_name: string };

// Model files present in backend/models are served from this laptop instead of Hugging Face (venue Wi-Fi saver).
function mirror(file: MirrorFile, host: string): void {
  if (existsSync(join(MODELS_DIR, file.file_name))) file.url = `http://${host}/files/${encodeURIComponent(file.file_name)}`;
}

function catalogWithMirror(host: string): string {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8')) as { models: { files: MirrorFile[] }[] };
  for (const model of catalog.models) model.files.forEach((f) => mirror(f, host));
  return JSON.stringify(catalog);
}

// Tara's tiers: the only place model specifics live. The app shows tier labels, pros and cons, never model names.
function taraCatalogWithMirror(host: string): string {
  const catalog = JSON.parse(readFileSync(TARA_CATALOG_PATH, 'utf8')) as { capabilities: { tiers: { files: MirrorFile[] }[] }[] };
  for (const cap of catalog.capabilities) for (const tier of cap.tiers) tier.files.forEach((f) => mirror(f, host));
  return JSON.stringify(catalog);
}

function sortedRows(): ResultRow[] {
  return [...results.values()].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
}

const escapeHtml = (v: unknown) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function resultsHtml(): string {
  const rows = sortedRows()
    .map((r) => `<tr>${COLUMNS.map((c) => `<td>${escapeHtml(r[c])}</td>`).join('')}</tr>`)
    .join('');
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Results</title>
<style>body{font:13px system-ui;margin:16px}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 6px;vertical-align:top;max-width:320px}th{background:#f3f3f3;position:sticky;top:0}</style>
<p>${results.size} runs · <a href="/results.csv">download CSV</a> · auto-refreshes every 10s</p>
<script>setTimeout(()=>location.reload(),10000)</script>
<table><tr>${COLUMNS.map((c) => `<th>${c}</th>`).join('')}</tr>${rows}</table>`;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  try {
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, '{"ok":true}');
    if (req.method === 'GET' && url.pathname === '/catalog') return send(res, 200, catalogWithMirror(req.headers.host ?? `localhost:${PORT}`));
    if (req.method === 'GET' && url.pathname === '/tara/catalog') return send(res, 200, taraCatalogWithMirror(req.headers.host ?? `localhost:${PORT}`));
    if (req.method === 'GET' && url.pathname === '/results') return send(res, 200, resultsHtml(), 'text/html; charset=utf-8');
    if (req.method === 'GET' && url.pathname === '/results.csv') {
      const csv = [COLUMNS.join(','), ...sortedRows().map((r) => COLUMNS.map((c) => csvCell(r[c])).join(','))].join('\n');
      return send(res, 200, csv, 'text/csv; charset=utf-8');
    }
    if (req.method === 'POST' && url.pathname === '/results') {
      const row = JSON.parse(await readBody(req)) as ResultRow;
      if (typeof row.id !== 'string' || !row.id) return send(res, 400, '{"error":"id required"}');
      results.set(row.id, row);
      writeFileSync(RESULTS_PATH, JSON.stringify([...results.values()], null, 2));
      return send(res, 200, '{"ok":true}');
    }
    if (req.method === 'GET' && url.pathname.startsWith('/files/')) {
      const path = join(MODELS_DIR, basename(decodeURIComponent(url.pathname.slice('/files/'.length))));
      if (!existsSync(path)) return send(res, 404, '{"error":"not found"}');
      res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': statSync(path).size });
      createReadStream(path).pipe(res);
      return;
    }
    send(res, 404, '{"error":"not found"}');
  } catch (err) {
    send(res, 500, JSON.stringify({ error: err instanceof Error ? err.message : String(err) }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i?.address);
  console.log(`backend on port ${PORT}. Put one of these in the app's Backend URL:`);
  for (const ip of ips) console.log(`  http://${ip}:${PORT}`);
  console.log(`results table: http://localhost:${PORT}/results`);
});
