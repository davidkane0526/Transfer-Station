import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';
const db={
  prepare(sql){return {
    bind(){return this;},
    async first(){if(sql.includes('SELECT 1 AS ok'))return {ok:1};return null;},
    async all(){return {results:[]};},
    async run(){return {meta:{changes:0}};}
  };},
  async batch(){return [];}
};
const env={DB:db,WRITE_TOKEN:'unit-test-write-token-which-is-long-enough'};
const origin='https://davidkane0526.github.io';
let response=await worker.fetch(new Request('https://api.test/api/health',{headers:{Origin:origin}}),env);
assert.equal(response.status,200);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
assert.deepEqual(await response.json(),{ok:true,database:'ready'});
response=await worker.fetch(new Request('https://api.test/api/parts',{headers:{Origin:origin}}),env);
assert.equal(response.status,200);assert.deepEqual(await response.json(),{parts:{}});
response=await worker.fetch(new Request('https://api.test/api/auth/check',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'}),env);
assert.equal(response.status,401);
response=await worker.fetch(new Request('https://api.test/api/auth/check',{method:'POST',headers:{Origin:origin,Authorization:'Bearer '+env.WRITE_TOKEN,'Content-Type':'application/json'},body:'{}'}),env);
assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
response=await worker.fetch(new Request('https://api.test/api/parts',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}}),env);
assert.equal(response.status,204);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
response=await worker.fetch(new Request('https://api.test/api/health',{headers:{Origin:'https://evil.example'}}),env);
assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
console.log('PASS: Worker health, public reads, bearer-token authorization, and CORS allowlist.');
