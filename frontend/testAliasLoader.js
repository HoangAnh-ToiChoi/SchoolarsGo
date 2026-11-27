import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Cho `node --test` hiểu code FE viết theo kiểu Vite: alias `~/` = src/, import không đuôi, import theo thư mục (index.js),
// và `import.meta.env` (Vite thay lúc build; chạy bằng Node thì là undefined). Chỉ dùng cho test, nạp qua testRegister.js.
const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'src');
const srcUrl = pathToFileURL(srcDir).href;
const VITE_ENV = '({ MODE: "test", DEV: false, PROD: false, BASE_URL: "/" })';

function isFile(filePath) {
  return existsSync(filePath) && statSync(filePath).isFile();
}

/** Đường dẫn tuyệt đối của import trong src/, hoặc null nếu không phải import nội bộ. */
function toSrcPath(specifier, parentURL) {
  if (specifier.startsWith('~/')) return path.join(srcDir, specifier.slice(2));
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
  if (!isRelative || !parentURL?.startsWith(srcUrl)) return null;
  return path.resolve(path.dirname(fileURLToPath(parentURL)), specifier);
}

/** Thêm `.js` hoặc `/index.js` như Vite khi import thiếu đuôi. */
function withExtension(filePath) {
  const candidates = [filePath, `${filePath}.js`, path.join(filePath, 'index.js')];
  return candidates.find(isFile) ?? filePath;
}

export function resolve(specifier, context, nextResolve) {
  const srcPath = toSrcPath(specifier, context.parentURL);
  if (!srcPath) return nextResolve(specifier, context);
  const resolved = withExtension(srcPath);
  return nextResolve(pathToFileURL(resolved).href, context);
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  if (!url.startsWith(srcUrl) || result.format !== 'module') return result;
  const source = String(result.source);
  if (!source.includes('import.meta.env')) return result;
  return { ...result, source: source.replaceAll('import.meta.env', VITE_ENV) };
}
