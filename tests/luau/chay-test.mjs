// ============================================================================
// Chạy test Luau thật cho script.js (hub taodepzai) trên @luau-rs/luau (WASM).
// Cách dùng:
//     cd tests/luau && npm install
//     node chay-test.mjs                       # test mặc định (test-tinh-nang.lua)
//     HUB=../../script.js node chay-test.mjs   # chỉ định file hub khác
//     node chay-test.mjs duong-dan-test.lua    # chạy file test khác
// ============================================================================
import { Lua } from '@luau-rs/luau';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const HUB_PATH = process.env.HUB ? path.resolve(process.env.HUB) : path.join(dir, '..', '..', 'script.js');
const STUB_PATH = path.join(dir, 'gia-lap-roblox.lua');
const TEST_PATH = process.argv[2] ? path.resolve(process.argv[2]) : path.join(dir, 'test-tinh-nang.lua');

const stub = fs.readFileSync(STUB_PATH, 'utf8');
const hub = fs.readFileSync(HUB_PATH, 'utf8').replace(/\r\n/g, '\n');
const test = fs.existsSync(TEST_PATH) ? fs.readFileSync(TEST_PATH, 'utf8') : '';
const HUB_LINES = hub.split('\n').length;

console.log(`hub  : ${path.relative(process.cwd(), HUB_PATH)} (${HUB_LINES} dòng)`);
console.log(`test : ${path.relative(process.cwd(), TEST_PATH)} (${test.split('\n').length} dòng)`);

const lua = await Lua.create();

function run(label, src) {
  try {
    return { ok: true, out: lua.execute(src) };
  } catch (e) {
    const m = String(e && e.message ? e.message : e);
    console.log(`\n=== ${label} LỖI ===`);
    const mm = m.match(/:(\d+):/);
    if (mm && Number(mm[1]) >= HUB_LINES) {
      console.log(`(lỗi nằm trong file test — dòng ${Number(mm[1]) - HUB_LINES} của file test)`);
    }
    console.log(m.slice(0, 3000));
    process.exitCode = 1;
    return { ok: false };
  }
}

run('nạp giả lập Roblox', stub);
// Hub + test phải nằm chung 1 chunk để test thấy được các local cấp cao nhất (S, D, MV...),
// nhưng thân test được bọc trong 1 hàm riêng cho khỏi vượt giới hạn 200 local của Luau.
const r = run('chạy hub + test', test ? hub + '\n' + test : hub);
if (r.ok) console.log('hub nạp + chạy test xong, không lỗi runtime');

let prints = '';
try {
  const v = lua.execute("return table.concat(__prints, '\\n')");
  prints = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '');
} catch {}
if (prints) {
  const lines = prints.split('\n');
  const keep = lines.filter((l) => /TESTS:|^FAIL:/.test(l));
  if (keep.length) console.log(keep.join('\n'));
}
