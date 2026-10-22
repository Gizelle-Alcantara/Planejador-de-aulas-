import test from 'node:test';
import assert from 'node:assert/strict';
import { request as httpRequest, createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, basename } from 'node:path';
import { securityHeaders, requestByteLimit } from '../lib/http-security.js';

test('limite de entrada tem padrão compatível com restauração e recusa configurações inválidas', () => {
  assert.equal(requestByteLimit(), 64 * 1024 * 1024);
  assert.equal(requestByteLimit('1024'), 1024);
  for (const value of ['', '0', '-1', 'Infinity', '1024.5', '268435457', 'abc']) {
    assert.throws(() => requestByteLimit(value), /MAX_REQUEST_BYTES/);
  }
});

test('política de segurança está sincronizada com Vercel e Netlify', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.fromEntries(config.headers.find(h => h.source === '/(.*)').headers.map(h => [h.key, h.value])), securityHeaders);
  const netlify = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  assert.ok(netlify.includes('for = "/*"'));
  for (const [name, value] of Object.entries(securityHeaders)) assert.ok(netlify.includes(`${JSON.stringify(name)} = ${JSON.stringify(value)}`));
});

test('servidor responde 413 para corpos declarados e em partes, mantém API funcional e protege páginas', async () => {
  const temp = mkdtempSync(join(tmpdir(), 'senai-http-security-'));
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, ['server.js'], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, PORT: String(port), MAX_REQUEST_BYTES: '1024', TURSO_DATABASE_URL: `file:${join(temp, 'test.db')}`, ADMIN_PASSWORD: 'senha-http-teste', SESSION_SECRET: 'segredo-temporario-http-teste-123456' },
    stdio: 'ignore',
  });
  const send = (chunks, length) => new Promise((resolve, reject) => {
    const req = httpRequest(base + '/api', { method: 'POST', headers: { 'content-type': 'application/json', ...(length === undefined ? {} : { 'content-length': String(length) }) } }, res => {
      let body = ''; res.setEncoding('utf8'); res.on('data', c => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Timeout de requisição')));
    for (const chunk of chunks) req.write(chunk);
    req.end();
  });
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(base + '/api')).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, 'Servidor de teste deve iniciar');
    const body = JSON.stringify({ op: 'login', password: 'senha-http-teste' });
    assert.equal((await send([body], Buffer.byteLength(body))).status, 200);
    for (const response of [await send(['x'.repeat(2048)], 2048), await send(['x'.repeat(600), 'x'.repeat(600)])]) {
      assert.equal(response.status, 413);
      assert.match(JSON.parse(response.body).error, /muito grande/);
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
    }
    // Exactly the byte limit is accepted, and multibyte input counts bytes, not characters.
    assert.equal((await send([body.padEnd(1024)], 1024)).status, 200);
    assert.equal((await send(['á'.repeat(600)])).status, 413);
    assert.equal((await send([body])).status, 200);
    for (const path of ['/', '/ambientes.html', '/secretaria-chaves.html', '/not-found-security-test']) {
      const res = await fetch(base + path);
      for (const [name, value] of Object.entries(securityHeaders)) assert.equal(res.headers.get(name), value, `${path}: ${name}`);
    }
    assert.match((await fetch(base + '/manifest.webmanifest')).headers.get('content-type'), /application\/manifest\+json/);
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const done = new Promise(resolve => server.once('exit', resolve)); server.kill(); await done;
    }
    if (dirname(resolve(temp)) !== resolve(tmpdir()) || !basename(temp).startsWith('senai-http-security-')) throw Error('Diretório temporário inesperado');
    rmSync(temp, { recursive: true, force: true });
  }
});
