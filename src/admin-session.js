export const cloudApiRoot = 'https://transfer-station-api.dk-weather.workers.dev';
const storageKey = 'transfer-station-admin-session-v1';
export const adminEvents = new EventTarget();
let expiryTimer;
let session = null;
try { session = JSON.parse(sessionStorage.getItem(storageKey)); } catch {}

export function adminToken() {
  return /^[0-9a-f]{64}$/.test(session?.token ?? '') && session.expiresAt > Date.now() / 1000
    ? session.token : null;
}

function scheduleExpiry() {
  clearTimeout(expiryTimer);
  if (adminToken()) expiryTimer = setTimeout(() => setSession(null), session.expiresAt * 1000 - Date.now());
}

function setSession(value) {
  session = value;
  try {
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
    else sessionStorage.removeItem(storageKey);
  } catch {}
  scheduleExpiry();
  adminEvents.dispatchEvent(new Event('change'));
}

export function rejectAdminToken(token) {
  if (token && token === adminToken()) setSession(null);
}

scheduleExpiry();

async function validateSession() {
  const token = adminToken();
  if (!token) return;
  try {
    const response = await fetch(cloudApiRoot + '/api/admin/session', {headers: {Authorization: 'Bearer ' + token}, cache: 'no-store'});
    if (response.status === 401) rejectAdminToken(token);
  } catch {} // An established session can still save local drafts while offline.
}

export function mountAdminControl(button, status) {
  let popup;
  let expectedState;
  const update = () => { button.textContent = adminToken() ? '退出管理员' : '管理员登录'; };
  adminEvents.addEventListener('change', update);
  update();
  void validateSession();
  addEventListener('message', event => {
    const data = event.data;
    if (event.origin !== cloudApiRoot || event.source !== popup || !expectedState ||
        data?.type !== 'transfer-station-admin' || data.state !== expectedState ||
        !/^[0-9a-f]{64}$/.test(data.token) || !Number.isSafeInteger(data.expiresAt) ||
        data.expiresAt <= Date.now() / 1000 || data.expiresAt > Date.now() / 1000 + 8 * 3600 + 60) return;
    expectedState = null;
    setSession({token: data.token, expiresAt: data.expiresAt});
    status.textContent = '管理员已登录。';
  });
  button.onclick = async () => {
    status.textContent = '';
    const token = adminToken();
    if (token) {
      setSession(null);
      button.disabled = true;
      try {
        const response = await fetch(cloudApiRoot + '/api/admin/logout', {
          method: 'POST', headers: {Authorization: 'Bearer ' + token}, cache: 'no-store',
        });
        if (!response.ok) throw new Error();
        status.textContent = '已退出管理员。';
      } catch { status.textContent = '已退出本页，云端会话将在到期后失效。'; }
      finally { button.disabled = false; }
      return;
    }
    if (popup && !popup.closed) { popup.focus(); return; }
    expectedState = crypto.randomUUID();
    const url = new URL('/admin', cloudApiRoot);
    url.search = new URLSearchParams({origin: location.origin, state: expectedState});
    popup = window.open(url, '_blank', 'popup,width=480,height=450');
    if (!popup) status.textContent = '请允许登录弹窗后重试。';
  };
}
