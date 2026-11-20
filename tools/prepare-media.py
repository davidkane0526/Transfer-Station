"""Build public previews and an encrypted GitHub media-branch directory from a ZIP."""
import argparse
import hashlib
import io
import json
import re
import secrets
import subprocess
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

import imageio_ffmpeg
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image, ImageOps


def preview_image(original, target):
    with Image.open(io.BytesIO(original)) as opened:
        image = ImageOps.exif_transpose(opened).convert('RGB')
        image.thumbnail((256, 256), Image.Resampling.LANCZOS)
        image.save(target, format='WEBP', quality=55)


def preview_video(original, target):
    with tempfile.TemporaryDirectory() as scratch:
        source = Path(scratch) / 'input.mp4'
        source.write_bytes(original)
        subprocess.run([
            imageio_ffmpeg.get_ffmpeg_exe(), '-nostdin', '-hide_banner', '-loglevel', 'error',
            '-i', str(source), '-map', '0:v:0', '-t', '12', '-an', '-map_metadata', '-1', '-map_chapters', '-1',
            '-vf', 'scale=256:256:force_original_aspect_ratio=decrease:force_divisible_by=2,fps=12',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '32', '-movflags', '+faststart', '-y', str(target),
        ], check=True)


def build(archive, public, encrypted, key):
    key_id = hashlib.sha256(key).hexdigest()[:16]
    public.mkdir(parents=True, exist_ok=True)
    encrypted = encrypted / key_id
    encrypted.mkdir(parents=True, exist_ok=True)
    cipher = AESGCM(key)
    assets = []
    with zipfile.ZipFile(archive) as source:
        candidates = []
        for entry in source.infolist():
            path = PurePosixPath(entry.filename)
            if entry.is_dir() or '__MACOSX' in path.parts or path.name.startswith('.'):
                continue
            if path.suffix.lower() not in ('.jpg', '.jpeg', '.png', '.webp', '.mp4'):
                raise ValueError(f'Unsupported media file: {path.name}')
            if entry.file_size > 90 * 1024 * 1024:
                raise ValueError(f'File exceeds the 90 MiB media limit: {path.name}')
            match = re.search(r'_(\d+)_\d+$', path.stem)
            number = int(match[1]) if match else None
            candidates.append((path.suffix.lower() == '.mp4', number is None, number or 0, entry.filename, entry))
        for video, missing_number, number, filename, entry in sorted(candidates, key=lambda row: row[:4]):
            original = source.read(entry)
            asset_id = hashlib.sha256(filename.encode() + b'\0' + original).hexdigest()[:32]
            preview = f'{asset_id}.{"mp4" if video else "webp"}'
            mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp', 'mp4': 'video/mp4'}
            extension = PurePosixPath(filename).suffix.lower()[1:]
            label = '视频' if video else '照片'
            label += f' {len([item for item in assets if item["type"].startswith("video/")]) + 1}' if video else f' {number if not missing_number else len(assets) + 1}'
            iv = secrets.token_bytes(12)
            payload = iv + cipher.encrypt(iv, original, asset_id.encode('ascii'))
            assert cipher.decrypt(payload[:12], payload[12:], asset_id.encode('ascii')) == original
            (encrypted / f'{asset_id}.bin').write_bytes(payload)
            (preview_video if video else preview_image)(original, public / preview)
            assets.append({'id': asset_id, 'label': label, 'preview': preview, 'type': mime[extension],
                           'extension': extension, 'bytes': len(original)})
    (public / 'manifest.json').write_text(json.dumps({'version': 1, 'keyId': key_id, 'assets': assets}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared and verified {len(assets)} encrypted originals and previews.')


if __name__ == '__main__':
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('archive', type=Path)
    cli.add_argument('public', type=Path)
    cli.add_argument('encrypted', type=Path)
    cli.add_argument('--key-file', type=Path, required=True)
    args = cli.parse_args()
    key = bytes.fromhex(args.key_file.read_text(encoding='ascii').strip())
    if len(key) != 32:
        cli.error('The key file must contain a 256-bit key as 64 hexadecimal characters.')
    build(args.archive, args.public, args.encrypted, key)
