import {randomBytes} from 'node:crypto';
import {passwordVerifier} from '../worker/admin.mjs';

const username = process.argv[2]?.trim();
if (!username || username.length > 100 || process.stdin.isTTY) {
  process.stderr.write('Usage: pipe a masked password to node tools/prepare-admin-credential.mjs USERNAME\n');
  process.exit(1);
}
let password = '';
process.stdin.setEncoding('utf8');
for await (const text of process.stdin) password += text;
password = password.replace(/\r?\n$/, '');
if (password.length < 20 || password.length > 256) {
  process.stderr.write('Choose a unique random password of 20–256 characters.\n');
  process.exit(1);
}
const salt = randomBytes(16).toString('hex');
const verifier = await passwordVerifier(password, salt);
process.stdout.write(JSON.stringify({username, salt, verifier}));
