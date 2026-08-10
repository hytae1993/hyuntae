import {
  createCipheriv,
  pbkdf2Sync,
  randomBytes
} from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const privateRoot = path.join(projectRoot, 'private_content');
const notesRoot = path.join(privateRoot, 'research_notes');
const passwordPath = path.join(privateRoot, 'research-notes-password.txt');
const outputPath = path.join(projectRoot, 'assets', 'research-notes.enc.json');
const aad = 'hyuntae-research-notes:v2';
const iterations = 600000;

const readText = (filePath) => readFile(filePath, 'utf8');

const unquote = (value) => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const parseFrontMatter = (source, filePath) => {
  const normalized = source.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    throw new Error(`Missing front matter: ${filePath}`);
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    throw new Error(`Invalid front matter: ${filePath}`);
  }

  const attributes = {};
  const header = normalized.slice(4, closingIndex);
  for (const line of header.split('\n')) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!match) throw new Error(`Unsupported front matter line in ${filePath}: ${line}`);
    attributes[match[1]] = unquote(match[2]);
  }

  return {
    attributes,
    body: normalized.slice(closingIndex + 5).trim()
  };
};

const loadProject = async (directoryName) => {
  const directory = path.join(notesRoot, directoryName);
  const metadataPath = path.join(directory, 'project.json');
  const metadata = JSON.parse(await readText(metadataPath));

  if (!metadata.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(metadata.id)) {
    throw new Error(`project.json needs a URL-safe id: ${metadataPath}`);
  }
  if (!metadata.title || typeof metadata.title !== 'string') {
    throw new Error(`project.json needs a title: ${metadataPath}`);
  }

  const algorithmDescription = await readText(
    path.join(directory, '알고리즘 설명', 'index.md')
  );
  const relatedWork = await readText(
    path.join(directory, '관련 연구', 'index.md')
  );

  const progressDirectory = path.join(directory, '연구 진행');
  const progressEntries = await readdir(progressDirectory, { withFileTypes: true });
  const postFiles = progressEntries
    .filter((entry) => entry.isFile() && /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const posts = [];
  for (const fileName of postFiles) {
    const filePath = path.join(progressDirectory, fileName);
    const { attributes, body } = parseFrontMatter(await readText(filePath), filePath);
    const fileDate = fileName.slice(0, 10);

    if (!attributes.title) throw new Error(`Research progress post needs a title: ${filePath}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(attributes.date || '')) {
      throw new Error(`Research progress post needs date: YYYY-MM-DD: ${filePath}`);
    }
    if (attributes.date !== fileDate) {
      throw new Error(`Post date must match its filename: ${filePath}`);
    }

    posts.push({
      id: fileName.slice(0, -3),
      title: attributes.title,
      date: attributes.date,
      content: body
    });
  }

  posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

  return {
    id: metadata.id,
    title: metadata.title,
    order: Number.isFinite(metadata.order) ? metadata.order : 999,
    algorithmDescription: algorithmDescription.trim(),
    relatedWork: relatedWork.trim(),
    researchProgress: posts
  };
};

const passwordFile = await readText(passwordPath);
const password = passwordFile.replace(/\r?\n$/, '');

if (!password || password.includes('이 문장을 지우고')) {
  throw new Error('Enter a password in private_content/research-notes-password.txt first.');
}

const entries = await readdir(notesRoot, { withFileTypes: true });
const projectDirectories = entries
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
  .map((entry) => entry.name)
  .sort();

const projects = await Promise.all(projectDirectories.map(loadProject));
projects.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

const ids = new Set();
for (const project of projects) {
  if (ids.has(project.id)) throw new Error(`Duplicate project id: ${project.id}`);
  ids.add(project.id);
}

const source = JSON.stringify({ version: 2, projects });
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
  version: 2,
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

const postCount = projects.reduce(
  (total, project) => total + project.researchProgress.length,
  0
);
console.log(`Encrypted ${projects.length} project(s) and ${postCount} progress post(s).`);
