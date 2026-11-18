import { register } from 'node:module';

// Chạy: node --import ./register.js src/server.js  (các lệnh trong package.json đã có sẵn)
register('./aliasLoader.js', import.meta.url);
