const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = script.indexOf('S.ObjTrack = {');
const end = script.indexOf('-- ---------- 🌳 KHUNG ĐỊNH VỊ VẬT THEO TÊN', start);
assert.notEqual(start, -1, 'phải có bộ định vị vật theo tên');
assert.notEqual(end, -1, 'khối định vị phải kết thúc trước giao diện người chơi');
const tracker = script.slice(start, end);

test('tìm đồng thời nhiều tên, không giới hạn ở năm hoặc sáu từ khóa', () => {
    assert.match(tracker, /function OT.RebuildKeys\(\)[\s\S]*?for i = 1, #OT\.entries do push\(OT\.entries\[i\]\.raw\) end/);
    assert.match(tracker, /function OT.MatchesNorm\(n\)[\s\S]*?for i = 1, #keys do[\s\S]*?n:find\(keys\[i\], 1, true\)/);
    const keys = ['cay1', 'cay2', 'cay3', 'cay4', 'cay5', 'cay6'];
    const matches = name => keys.some(key => name.includes(key));
    assert.equal(matches('cay6_trunk'), true);
    assert.equal(matches('cay7_trunk'), false);
});

test('Model cha chỉ gộp part con khi không có từ khóa riêng ở part', () => {
    assert.match(tracker, /function OT\.SharedNameMatch\(a, b\)[\s\S]*?if inPart and not inModel then return false end[\s\S]*?if inPart and inModel then shared = true end/);
    assert.match(tracker, /anc:IsA\("Model"\)[\s\S]*?OT\.SharedNameMatch\(inst, anc\)/);
    assert.doesNotMatch(tracker, /anc:IsA\("Model"\) or anc:IsA\("Folder"\)/);

    const sameResult = (part, model, queryKeys) => {
        let shared = false;
        for (const key of queryKeys) {
            const inPart = part.includes(key);
            const inModel = model.includes(key);
            if (inPart && !inModel) return false;
            if (inPart && inModel) shared = true;
        }
        return shared;
    };
    const terms = ['oak', 'fruit', 'stone', 'tree', 'chest', 'crystal'];
    assert.equal(sameResult('fruit_part', 'oak_tree_model', terms), false,
        'từ khóa khớp Model cha không được làm mất kết quả khớp tên khác ở part con');
    assert.equal(sameResult('oak_leaf', 'oak_tree_model', terms), true,
        'part chỉ khớp tên đã được Model đại diện thì được gộp');
    assert.equal(sameResult('oak_fruit', 'oak_tree_model', terms), false,
        'part có thêm từ khóa riêng vẫn phải được định vị');
});

test('quét chia lát tiếp tục đến hết workspace và chỉ giới hạn kết quả ở mức cấu hình', () => {
    assert.match(tracker, /while OT\._qN > 0 do/);
    assert.match(tracker, /return false\s+-- hết ngân sách khung hình này, khung sau quét tiếp/);
    assert.match(tracker, /local maxN = math\.max\(1, tonumber\(OT\.maxItems\) or 60\)/);
    assert.match(tracker, /if OT\._capped then t = t \.\. " \(gần nhất " \.\. tostring\(OT\.maxItems\)/);
});
