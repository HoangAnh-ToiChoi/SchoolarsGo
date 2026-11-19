import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Router } from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = Router();

// Tự nạp mọi file *.routes.js: tên file quyết định đường dẫn (auth.routes.js -> /auth)
const routeFiles = fs.readdirSync(__dirname)
  .filter((fileName) => fileName.endsWith('.routes.js'))
  .sort();

for (const fileName of routeFiles) {
  const routeName = fileName.replace(/\.routes\.js$/, '');
  const { default: route } = await import(pathToFileURL(path.join(__dirname, fileName)).href);
  router.use(`/${routeName}`, route);
}

export default router;
