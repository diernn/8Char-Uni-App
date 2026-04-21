const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');

const ROOT_DIR = __dirname;
const decoder = new TextDecoder('utf-8', { fatal: true });
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const IGNORE_DIRS = new Set(['.claude', '.git', 'dist', 'node_modules', 'unpackage']);
const INCLUDE_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.scss',
  '.vue',
  '.yaml',
  '.yml',
]);
const INCLUDE_FILES = new Set([
  '.editorconfig',
  '.env.development',
  '.env.production',
  '.eslintrc.cjs',
  '.prettierrc.json',
  'CLAUDE.md',
  'README.md',
  'package.json',
]);

const shouldCheckFile = (filePath) => {
  const fileName = path.basename(filePath);
  return INCLUDE_FILES.has(fileName) || INCLUDE_EXTENSIONS.has(path.extname(filePath));
};

const collectFiles = (currentPath) => {
  const stat = fs.statSync(currentPath);
  if (stat.isFile()) {
    return shouldCheckFile(currentPath) ? [currentPath] : [];
  }

  return fs.readdirSync(currentPath).flatMap((entry) => {
    const nextPath = path.join(currentPath, entry);
    if (fs.statSync(nextPath).isDirectory() && IGNORE_DIRS.has(entry)) {
      return [];
    }
    return collectFiles(nextPath);
  });
};

const verifyUtf8File = (filePath) => {
  const buffer = fs.readFileSync(filePath);
  if (buffer.subarray(0, 3).equals(UTF8_BOM)) {
    return `${filePath} 包含 UTF-8 BOM`;
  }

  try {
    decoder.decode(buffer);
    return null;
  } catch (error) {
    return `${filePath} 不是有效的 UTF-8 文本：${error.message}`;
  }
};

const files = collectFiles(ROOT_DIR);
const errors = files
  .map(verifyUtf8File)
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right));

if (errors.length) {
  console.error('发现编码问题：');
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`已检查 ${files.length} 个文件，均为 UTF-8 无 BOM。`);
