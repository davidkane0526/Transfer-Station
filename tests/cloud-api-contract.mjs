import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/index.mjs';
import {passwordVerifier} from '../worker/admin.mjs';

const sqlite = new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../worker/schema.sql', import.meta.url), 'utf8'));
const db = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    return this.withArgs(statement, []);
  },
  withArgs(statement, args) {
    return {
      bind: (...values) => this.withArgs(statement, values),
      first: async () => statement.get(...args),
      all: async () => ({results: statement.all(...args)}),
      run: async () => ({meta: statement.run(...args)}),
    };
  },
  async batch(statements) {
    sqlite.exec('BEGIN');
    try {
      const result = [];
      for (const statement of statements) result.push(await statement.run());
      sqlite.exec('COMMIT');
      return result;
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  },
};
const origin = 'https://davidkane0526.github.io';
const api = 'https://api.test';
const salt = '1234567890abcdef'.repeat(2);
const username = 'operator';
const password = 'a-random-password-for-tests-only';
const env = {
  DB: db, ADMIN_CREDENTIAL: JSON.stringify({username,salt,verifier:await passwordVerifier(password,salt)}),
  MEDIA_KEY: 'a'.repeat(64), WRITE_TOKEN: 'b'.repeat(64),
  ADMIN_LOGIN_LIMIT: {limit: async () => ({success: true})},
};

function call(path, {method='GET', body, token, from=origin, bindings=env} = {}) {
  const headers = {Origin: from};
  if (token) headers.Authorization = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return worker.fetch(new Request(api + path, {headers, method, body: JSON.stringify(body)}), bindings);
}

let response = await call('/api/health');
assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
assert.deepEqual(await response.json(), {ok:true,database:'ready'});
assert.deepEqual(await (await call('/api/parts')).json(), {parts:{}});
assert.equal((await call('/api/parts/A01', {method:'POST'})).status, 401);
assert.equal((await call('/api/import', {method:'POST',token:env.WRITE_TOKEN})).status, 401);
assert.equal((await call('/api/admin/media-key')).status, 401);
assert.equal((await call('/api/admin/login', {method:'POST',body:{username,password}})).status, 403);
assert.equal((await call('/api/admin/login', {method:'POST',from:api,body:{username,password:'bad'}})).status, 401);
assert.equal((await call('/api/admin/login', {
  method:'POST',from:api,body:{username,password},bindings:{...env,ADMIN_LOGIN_LIMIT:{limit:async()=>({success:false})}},
})).status, 429);
response = await call('/admin?origin=' + encodeURIComponent(origin) + '&state=12345678-1234-1234-1234-123456789abc');
assert.equal(response.status, 200);
assert.match(response.headers.get('Content-Security-Policy'), /frame-ancestors 'none'/);
response = await call('/api/admin/login', {method:'POST',from:api,body:{username,password}});
assert.equal(response.status, 200);
const {token,expiresAt} = await response.json();
assert.match(token, /^[a-f0-9]{64}$/);
assert.deepEqual(await (await call('/api/admin/session', {token})).json(), {expiresAt});
response = await call('/api/admin/media-key', {token});
assert.deepEqual(await response.json(), {key:env.MEDIA_KEY});
assert.equal(response.headers.get('Cache-Control'), 'no-store');
response = await call('/api/parts/A01', {method:'POST',token,body:{field:'manualConfirmed',value:'true',original:'false',baseRevision:0}});
assert.equal(response.status, 200);
assert.equal((await response.json()).part.values.manualConfirmed, 'true');
const {history} = await (await call('/api/parts/A01/history')).json();
assert.deepEqual([history[0].previous,history[0].value], ['false','true']);
assert.ok(Number.isFinite(Date.parse(history[0].changed_at)));
assert.equal((await call('/api/admin/logout', {method:'POST',token})).status, 200);
assert.equal((await call('/api/admin/session', {token})).status, 401);
assert.equal((await call('/api/admin/media-key', {token})).status, 401);
assert.equal((await call('/api/parts', {method:'OPTIONS'})).status, 204);
assert.equal((await call('/api/health', {from:'https://evil.example'})).headers.get('Access-Control-Allow-Origin'), null);
console.log('PASS: public reads, administrator login, rate limiting, authenticated edits and media, logout and CORS.');
