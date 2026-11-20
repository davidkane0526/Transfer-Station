import {adminEvents,adminToken,cloudApiRoot,mountAdminControl,rejectAdminToken} from './admin-session.js';
import {photoRefsForPart} from './photo-library.js';

const $ = id => document.getElementById(id);
const grid = $('media-grid');
const dialog = $('original');
const rawBase = 'https://raw.githubusercontent.com/davidkane0526/Transfer-Station/transfer-station-media';
const originalButtons = [];
let request;
let objectUrl;

function clearOriginal() {
  request?.abort();
  request = null;
  $('original-content').replaceChildren();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = null;
}

function updateAccess() {
  const admin = Boolean(adminToken());
  for (const button of originalButtons) button.hidden = !admin;
  if (!admin) {
    clearOriginal();
    if (dialog.open) dialog.close();
  }
}

function validPayload(asset) {
  return /^[0-9a-f]{32}$/.test(asset?.id) && Number.isSafeInteger(asset.bytes) &&
    asset.bytes > 0 && asset.bytes <= 90 * 1024 * 1024;
}

async function decryptPayload(asset, keyId, key, signal) {
  const response = await fetch(`${rawBase}/${keyId}/${asset.id}.bin`, {signal, credentials: 'omit', redirect: 'error'});
  if (!response.ok) throw new Error('加密素材尚未发布或暂不可用。');
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length !== asset.bytes + 28) throw new Error('加密素材大小与清单不符。');
  return crypto.subtle.decrypt({
    name: 'AES-GCM', iv: bytes.subarray(0, 12), additionalData: new TextEncoder().encode(asset.id),
  }, key, bytes.subarray(12));
}

function downloadLink(asset, href) {
  const link = document.createElement('a');
  link.href = href;
  link.download = `${asset.label}.${asset.extension}`;
  link.textContent = '下载原件';
  return link;
}

async function showOriginal(asset, keyId) {
  const token = adminToken();
  if (!token) return;
  clearOriginal();
  const controller = new AbortController();
  request = controller;
  const {signal} = controller;
  $('original-title').textContent = asset.label + ' · 原件';
  $('original-status').textContent = '正在获取并解密原件…';
  if (!dialog.open) dialog.showModal();
  try {
    const response = await fetch(cloudApiRoot + '/api/admin/media-key', {
      headers: {Authorization: 'Bearer ' + token}, cache: 'no-store', signal,
    });
    if (response.status === 401) rejectAdminToken(token);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '无法获取原件密钥。');
    if (!/^[0-9a-f]{64}$/.test(data.key)) throw new Error('原件密钥格式不正确。');
    const secret = Uint8Array.from(data.key.match(/../g), byte => parseInt(byte, 16));
    const id = new Uint8Array(await crypto.subtle.digest('SHA-256', secret)).slice(0, 8);
    if (Array.from(id, byte => byte.toString(16).padStart(2, '0')).join('') !== keyId) throw new Error('原件密钥与素材版本不匹配。');
    const key = await crypto.subtle.importKey('raw', secret, 'AES-GCM', false, ['decrypt']);
    secret.fill(0);
    const playback = asset.type === 'video/mp4' && validPayload(asset.playback) ? asset.playback : null;
    const mediaBytes = await decryptPayload(playback || asset, keyId, key, signal);
    if (signal.aborted || adminToken() !== token) return;
    objectUrl = URL.createObjectURL(new Blob([mediaBytes], {type: asset.type}));
    const media = mediaElement(asset, objectUrl);
    $('original-content').append(media);
    const caption = playback ? '同分辨率播放版 · 下载可取得未转码原件' : '';
    $('original-status').textContent = caption;
    if (playback) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '下载原件';
      button.onclick = async () => {
        button.disabled = true;
        $('original-status').textContent = '正在解密未转码原件…';
        try {
          const original = await decryptPayload(asset, keyId, key, signal);
          if (signal.aborted || adminToken() !== token) return;
          const url = URL.createObjectURL(new Blob([original], {type: asset.type}));
          downloadLink(asset, url).click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          $('original-status').textContent = caption;
        } catch (error) {
          if (!signal.aborted) $('original-status').textContent = error.message || '解密失败。';
        } finally { button.disabled = false; }
      };
      $('original-content').append(button);
    } else $('original-content').append(downloadLink(asset, objectUrl));
  } catch (error) {
    if (!signal.aborted) $('original-status').textContent = error.message || '解密失败。';
  }
}

function mediaElement(asset, url, preview = false) {
  const video = asset.type === 'video/mp4';
  const element = document.createElement(video ? 'video' : 'img');
  if (video) {
    element.controls = true;
    element.playsInline = true;
    element.preload = preview ? 'none' : 'metadata';
    element.setAttribute('aria-label', asset.label);
  } else {
    element.alt = asset.label;
    element.loading = preview ? 'lazy' : 'eager';
  }
  element.src = url;
  return element;
}

async function loadGallery() {
  const response = await fetch('./assets/media/manifest.json');
  if (!response.ok) throw new Error('素材清单暂不可用。');
  const {version,keyId,assets} = await response.json();
  if (version !== 1 || !/^[0-9a-f]{16}$/.test(keyId) || !Array.isArray(assets)) throw new Error('素材清单格式有误。');
  const params = new URLSearchParams(location.search);
  const selected = params.get('photo');
  const partId = params.get('part');
  const part = /^[AB](?:\d{2}[A-Z]{0,2}|-H\d{2})$/.test(partId ?? '') ? partId : null;
  const photoLabels = part ? new Set(photoRefsForPart(part[0], part).map(ref => '照片 ' + ref.id)) : null;
  let target;
  for (const asset of assets) {
    if (photoLabels && !photoLabels.has(asset.label)) continue;
    if (!validPayload(asset) || ![asset.id + '.mp4', asset.id + '.webp'].includes(asset.preview) ||
        !['image/jpeg','image/png','image/webp','video/mp4'].includes(asset.type)) continue;
    const figure = document.createElement('figure');
    const caption = document.createElement('figcaption');
    caption.textContent = asset.label;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '查看原件';
    button.onclick = () => void showOriginal(asset, keyId);
    originalButtons.push(button);
    figure.append(mediaElement(asset, './assets/media/' + asset.preview, true), caption, button);
    grid.append(figure);
    if (asset.label === '照片 ' + selected) target = figure;
  }
  updateAccess();
  if (target) target.scrollIntoView({block: 'center'});
  $('media-status').textContent = part
    ? `${part} · ${grid.children.length ? '关联照片的低清预览' : '此批素材没有关联的编号照片'}`
    : '低清预览 · 管理员可查看原始分辨率素材';
}

dialog.addEventListener('close', clearOriginal);
adminEvents.addEventListener('change', updateAccess);
mountAdminControl($('admin-login'), $('admin-status'));
loadGallery().catch(error => { $('media-status').textContent = error.message; });
