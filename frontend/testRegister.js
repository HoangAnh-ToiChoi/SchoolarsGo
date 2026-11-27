import { register } from 'node:module';

// Chạy: node --import ./testRegister.js --test 'src/**/*.test.js'  (script `npm test` đã có sẵn)
register('./testAliasLoader.js', import.meta.url);
