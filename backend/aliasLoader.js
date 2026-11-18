import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Cho Node hiểu `~/` = thư mục src/ (giống alias `~/` của frontend). Nạp bằng register.js qua `--import`.
const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('~/')) {
    return nextResolve(pathToFileURL(path.join(srcDir, specifier.slice(2))).href, context);
  }
  return nextResolve(specifier, context);
}
