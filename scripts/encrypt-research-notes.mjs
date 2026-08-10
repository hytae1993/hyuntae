import {
  createCipheriv,
  pbkdf2Sync,
  randomBytes
} from 'node:crypto';
import {
  mkdir,
  readFile,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const passwordPath = path.join(projectRoot, 'private_content', 'research-notes-password.txt');
const sourcePath = path.join(projectRoot, 'private_content', 'research-notes.html');
const outputPath = path.join(projectRoot, 'assets', 'research-notes.enc.json');
const aad = 'hyuntae-research-notes:v1';
const iterations = 600000;

const passwordFile = await readFile(passwordPath, 'utf8');
const password = passwordFile.replace(/\r?\n$/, '');
const source = await readFile(sourcePath, 'utf8');

if (!password || password.includes('이 문장을 지우고')) {
  throw new Error('Enter a password in private_content/research-notes-password.txt first.');
}

const salt = randomBytes(16);
const iv = randomBytes(12);
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const cipher = createCipheriv('aes-256-gcm', key, iv);
cipher.setAAD(Buffer.from(aad, 'utf8'));

const encrypted = Buffer.concat([
  cipher.update(source, 'utf8'),
  cipher.final()
]);
const ciphertext = Buffer.concat([encrypted, cipher.getAuthTag()]);

const payload = {
  version: 1,
  algorithm: 'AES-256-GCM',
  kdf: 'PBKDF2-SHA-256',
  iterations,
  aad,
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ciphertext: ciphertext.toString('base64')
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(`Encrypted research notes (${Buffer.byteLength(source, 'utf8')} source bytes).`);
