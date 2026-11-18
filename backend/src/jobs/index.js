import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tự nạp mọi job trong thư mục này (trừ index.js), gọi các hàm bắt đầu bằng start*
const jobFiles = fs.readdirSync(__dirname)
  .filter((fileName) => fileName.endsWith('.js') && fileName !== 'index.js')
  .sort();
const jobs = await Promise.all(
  jobFiles.map((fileName) => import(pathToFileURL(path.join(__dirname, fileName)).href))
);

function startJobs() {
  jobs.forEach((job) => {
    Object.entries(job)
      .filter(([name, startJob]) => name.startsWith('start') && typeof startJob === 'function')
      .forEach(([, startJob]) => startJob());
  });
}

export { startJobs };
