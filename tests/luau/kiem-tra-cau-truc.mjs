// ============================================================================
// Kiểm tra CẤU TRÚC script.js — chống lỗi "hàm bị nuốt vào hàm khác".
//
// Vì sao cần: Luau chỉ cho 200 local mỗi hàm, nên các khối lớn của hub phải bọc
// trong do…end hoặc hàm riêng. Chỉ cần LỆCH 1 chữ `end` là một loạt `function X.Y`
// bị lồng vào trong hàm khác -> KHÔNG bao giờ được định nghĩa, nhưng script vẫn
// compile OK (đúng lỗi từng làm 🌳 định vị vật "nhập tên mà không chạy").
//
//     cd tests/luau && npm install && node kiem-tra-cau-truc.mjs
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'luau-parser';

const dir = path.dirname(fileURLToPath(import.meta.url));
const HUB = process.env.HUB ? path.resolve(process.env.HUB) : path.join(dir, '..', '..', 'script.js');
const src = fs.readFileSync(HUB, 'utf8').replace(/\r\n/g, '\n');

// Ngoại lệ có chủ đích: hàm được định nghĩa khi khối UI của nó được dựng (có guard khi gọi)
const CHO_PHEP_LONG = new Set([
    'SF._hudUpdate',   // định nghĩa khi khối HUD được dựng (mọi chỗ gọi đều có guard "if SF._hudUpdate")
    'D.new',           // là bảng Drawing giả LOCAL bên trong S.CompatDrawing(), không phải D của hub
]);

// Những hàm BẮT BUỘC phải ở cấp cao nhất (được định nghĩa ngay khi nạp script)
const BAT_BUOC = [
    'S.ObjTrack', 'S.OpenObjectPanel', 'S.RunHubAction',
    'MV.FlyToObject', 'MV.StopObjectFly', 'MV._ObjectFlyStep',
];
const NESTED_OK = [
    'OT.ScanBegin', 'OT.ScanHit', 'OT.ScanSlice', 'OT.ScanFinish', 'OT.DrainPending',
    'OT.Rescan', 'OT.Step', 'OT.Tick', 'OT.TickOne', 'OT.Make', 'OT.Kill', 'OT.Clear',
    'OT.Norm', 'OT.NormCached', 'OT.Candidate', 'OT.ResolvePath', 'OT.RefreshPaths',
    'OT.RefreshChars', 'OT.Split', 'OT.Skip', 'OT.PartOf', 'OT.Info', 'OT.Select',
];

let ast;
try {
    ast = parse(src);
} catch (e) {
    console.error('❌ Không parse được script.js:', String(e.message || e).slice(0, 400));
    process.exit(1);
}

const found = new Map();   // tên -> { line, funcDepth }
function walk(node, funcDepth) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { for (const c of node) walk(c, funcDepth); return; }
    if (node.type === 'FunctionDeclarationStatement') {
        const base = node.target?.base?.name ?? '';
        const sub = (node.target?.path ?? []).map((p) => p.name).join('.');
        const full = base + (sub ? '.' + sub : '');
        if (!found.has(full)) found.set(full, { line: node.line?.start, funcDepth, kind: 'decl' });
    }
    // dạng gán: S.OpenObjectPanel = function() ... end  /  S.ObjTrack = { ... }
    if (node.type === 'AssignmentStatement') {
        const t = node.targets?.[0];
        const v = node.values?.[0];
        if (t?.type === 'MemberExpression' && t.object?.type === 'Identifier'
            && (v?.type === 'FunctionExpression' || v?.type === 'TableConstructor' || v?.type === 'TableExpression')) {
            const full = t.object.name + '.' + (t.property?.name ?? '?');
            if (!found.has(full)) found.set(full, { line: node.line?.start, funcDepth, kind: 'assign' });
        }
    }
    const isFunc = node.type === 'FunctionBody';
    for (const [k, v] of Object.entries(node)) {
        if (k === 'line' || k === 'column' || k === 'parent') continue;
        if (v && typeof v === 'object') walk(v, funcDepth + (isFunc ? 1 : 0));
    }
}
walk(ast, 0);

const problems = [];

// 1) KHÔNG được khai báo "function X.Y()" lồng trong hàm khác (trừ ngoại lệ có chủ đích).
//    (dạng gán X.Y = function() bên trong hàm là hợp lệ — nhiều chỗ khởi tạo trễ)
for (const [name, info] of found) {
    if (info.kind === 'decl' && info.funcDepth > 0 && !CHO_PHEP_LONG.has(name)) {
        problems.push(`${name} (dòng ${info.line}) bị lồng trong ${info.funcDepth} lớp hàm -> không được định nghĩa khi nạp script`);
    }
}

// 2) các hàm sống còn của hub phải ở cấp cao nhất
for (const name of BAT_BUOC) {
    const info = found.get(name);
    if (!info) problems.push(`thiếu hàm ${name}`);
    else if (info.funcDepth > 0) problems.push(`${name} (dòng ${info.line}) không ở cấp cao nhất`);
}

// 3) các hàm 🌳 phải TỒN TẠI và ở cấp cao nhất
for (const name of NESTED_OK) {
    const info = found.get(name);
    if (!info) problems.push(`thiếu hàm 🌳 ${name}`);
    else if (info.funcDepth > 0) problems.push(`hàm 🌳 ${name} (dòng ${info.line}) bị lồng trong hàm khác`);
}

const total = found.size;
if (problems.length) {
    console.log(`❌ CẤU TRÚC CÓ VẤN ĐỀ (${problems.length}) — đã quét ${total} khai báo function:`);
    problems.slice(0, 30).forEach((p) => console.log('   •', p));
    process.exitCode = 1;
} else {
    console.log(`✅ CẤU TRÚC OK — ${total} khai báo function, tất cả hàm cần thiết đều ở cấp cao nhất`);
}
