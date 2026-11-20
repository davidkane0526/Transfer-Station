const sessionDuration = 8 * 60 * 60;
const hex = bytes => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const unhex = value => Uint8Array.from(value.match(/../g), byte => parseInt(byte, 16));
const encoder = new TextEncoder();

export async function passwordVerifier(password, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: unhex(salt), iterations: 100000}, key, 256));
}

function credential(env) {
  try {
    const value = JSON.parse(env.ADMIN_CREDENTIAL);
    if (typeof value.username === 'string' && value.username.length &&
        /^[0-9a-f]{32}$/.test(value.salt) && /^[0-9a-f]{64}$/.test(value.verifier)) return value;
  } catch {}
  return null;
}

const equal = (left, right) => crypto.subtle.timingSafeEqual
  ? crypto.subtle.timingSafeEqual(encoder.encode(left), encoder.encode(right))
  : left === right;

async function sessionDigest(token, verifier) {
  return hex(await crypto.subtle.digest('SHA-256', encoder.encode(token + verifier)));
}

export async function adminSession(request, env) {
  const account = credential(env);
  const token = request.headers.get('Authorization')?.match(/^Bearer ([0-9a-f]{64})$/)?.[1];
  if (!account || !token) return null;
  const digest = await sessionDigest(token, account.verifier);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare('SELECT expires_at FROM admin_session WHERE digest = ? AND expires_at > ?').bind(digest, now).first();
  return row ? {digest, expiresAt: row.expires_at} : null;
}

export async function login(request, env, readJson, json) {
  // The password form lives on this Worker and submits only to this origin.
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json(request, {error: '登录来源无效。'}, 403);
  const account = credential(env);
  if (!account || !env.ADMIN_LOGIN_LIMIT) return json(request, {error: '管理员账号尚未配置。'}, 503);
  const client = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!(await env.ADMIN_LOGIN_LIMIT.limit({key: client})).success) {
    return json(request, {error: '登录尝试过多，请稍后重试。'}, 429);
  }
  let body;
  try { body = await readJson(request); } catch { return json(request, {error: '登录请求无效。'}, 400); }
  if (typeof body?.username !== 'string' || body.username.length > 100 ||
      typeof body.password !== 'string' || !body.password || body.password.length > 256) {
    return json(request, {error: '用户名或密码错误。'}, 401);
  }
  const verifier = await passwordVerifier(body.password, account.salt);
  if (!equal(verifier, account.verifier) || body.username !== account.username) {
    return json(request, {error: '用户名或密码错误。'}, 401);
  }
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + sessionDuration;
  const digest = await sessionDigest(token, account.verifier);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM admin_session WHERE expires_at <= ?').bind(now),
    env.DB.prepare('INSERT INTO admin_session (digest, expires_at) VALUES (?, ?)').bind(digest, expiresAt),
  ]);
  return json(request, {token, expiresAt});
}

export function loginPage(request, origins) {
  const params = new URL(request.url).searchParams;
  const origin = params.get('origin');
  const state = params.get('state');
  if (!origins.has(origin) || !/^[a-f0-9-]{36}$/.test(state ?? '')) return new Response('Invalid login request', {status: 400});
  const nonce = hex(crypto.getRandomValues(new Uint8Array(16)));
  return new Response(`<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Transfer Station 管理员登录</title>
<style nonce="${nonce}">
html{color-scheme:dark}body{font:16px system-ui;background:#101b28;color:#edf3fa;margin:2rem auto;padding:0 1rem;max-width:28rem}form,label{display:grid;gap:.6rem}form{gap:1rem}input,button{font:inherit;padding:.65rem;border:1px solid #54728c;border-radius:.4rem}button{background:#204766;color:white;cursor:pointer}#status{min-height:1.5em}
</style>
<h1>管理员登录</h1>
<form method="post"><label>账号<input name="username" autocomplete="username" maxlength="100" required autofocus></label>
<label>密码<input name="password" type="password" autocomplete="current-password" maxlength="256" required></label>
<button disabled>登录</button><div id="status" role="status"></div></form>
<script nonce="${nonce}">
const form = document.querySelector('form');
const status = document.querySelector('#status');
const button = form.querySelector('button');
if (window.opener) button.disabled = false;
else status.textContent = '请从 Transfer Station 页面打开管理员登录。';
form.addEventListener('submit', async event => {
  event.preventDefault();
  button.disabled = true;
  try {
    const response = await fetch('/api/admin/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(Object.fromEntries(new FormData(form)))});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    form.reset();
    window.opener.postMessage({type: 'transfer-station-admin', state: ${JSON.stringify(state)}, ...result}, ${JSON.stringify(origin)});
    window.close();
  } catch (error) {
    status.textContent = error.message || '登录失败，请重试。';
    button.disabled = false;
  }
});
</script></html>`, {headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; form-action 'none'; frame-ancestors 'none'`,
  }});
}
