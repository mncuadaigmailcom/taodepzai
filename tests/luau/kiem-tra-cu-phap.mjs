// Kiểm tra cú pháp (compile) script.js bằng Luau thật (WASM) — không cần Roblox.
//     cd tests/luau && npm install && node kiem-tra-cu-phap.mjs
import { Lua } from '@luau-rs/luau';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const HUB = process.env.HUB ? path.resolve(process.env.HUB) : path.join(dir, '..', '..', 'script.js');
const src = fs.readFileSync(HUB, 'utf8');

const lua = await Lua.create();
try {
  const bytecode = lua.compile(src);
  const size = bytecode && (bytecode.byteLength ?? bytecode.length ?? 0);
  console.log(`✅ COMPILE OK — ${path.basename(HUB)} (${src.split('\n').length} dòng, ${size} byte bytecode)`);
} catch (e) {
  const m = String(e && e.message ? e.message : e);
  console.log('❌ COMPILE LỖI:');
  console.log(m.slice(0, 2000));
  process.exitCode = 1;
}
