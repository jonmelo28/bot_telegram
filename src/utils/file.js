const fs = require('fs');
const path = require('path');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildTmpFilePath(filename) {
  const dir = path.resolve(process.cwd(), 'tmp');
  ensureDir(dir);
  return path.join(dir, filename);
}

module.exports = {
  ensureDir,
  buildTmpFilePath
};