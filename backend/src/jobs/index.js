import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tự nạp mọi job trong thư mục này (trừ index.js): hàm nào tên bắt đầu bằng start* sẽ được gọi
const jobFiles = fs.readdirSync(__dirname)
  .filter((fileName) => fileName.endsWith('.js') && fileName !== 'index.js')
  .sort();

const starters = [];

for (const fileName of jobFiles) {
  const job = await import(pathToFileURL(path.join(__dirname, fileName)).href);
  for (const [name, start] of Object.entries(job)) {
    if (name.startsWith('start') && typeof start === 'function') starters.push(start);
  }
}

const startJobs = () => starters.forEach((start) => start());

export { startJobs };
