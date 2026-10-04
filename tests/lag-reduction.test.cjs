const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = script.indexOf('-- ---------- v5.3: GIẢM LAG CỤC BỘ, CÓ THỂ HOÀN TÁC ----------');
const end = script.indexOf('\nS.HubPanelCat =', start);
assert.notEqual(start, -1, 'Script Hub phải có khối giảm lag');
assert.notEqual(end, -1, 'khối giảm lag phải kết thúc trước phần lọc tab');
const panel = script.slice(start, end);

test('Script Hub có đúng sáu chế độ giảm lag', () => {
    const modes = [...panel.matchAll(/\{id = "(quick|normal|gray|far|cpu|ultra)"/g)].map(match => match[1]);
    assert.deepEqual(modes, ['quick', 'normal', 'gray', 'far', 'cpu', 'ultra']);
    assert.match(panel, /Name = "HubPerf_Panel"[^\n]*LayoutOrder = -5/);
    assert.match(script, /HubPerf_Panel = "Tiện ích"/);
    assert.match(script, /if S\.SyncPerfPanel then pcall\(S\.SyncPerfPanel\) end/);
});

test('chế độ cực mạnh chỉ ẩn hình ảnh cục bộ, giữ nhân vật và va chạm', () => {
    assert.match(panel, /instance:IsDescendantOf\(character\)/);
    assert.match(panel, /desired\.LocalTransparencyModifier = 1/);
    assert.match(panel, /function Perf\.RestoreAll/);
    assert.match(panel, /function Perf\.Stop\(\)/);
    assert.doesNotMatch(panel, /:Destroy\(\)|\.CanCollide\s*=/);
});

test('màu xám chỉnh được và được giới hạn trong dải 0–255', () => {
    assert.match(panel, /Perf\.GrayValue = math\.clamp\(math\.floor\(value \+ 0\.5\), 0, 255\)/);
    assert.match(panel, /Perf\.AddGrayProperties\(instance, desired, Color3\.fromRGB\(Perf\.GrayValue, Perf\.GrayValue, Perf\.GrayValue\)\)/);
    assert.match(panel, /Name = "HubPerfGrayValue"/);
});

test('chế độ vật ở xa có khoảng cách cấu hình và cập nhật theo camera', () => {
    assert.match(panel, /\(anchor\.Position - cameraPosition\)\.Magnitude >= Perf\.FarDistance/);
    assert.match(panel, /Perf\.FarDistance = math\.clamp\(math\.floor\(value \+ 0\.5\), 50, 10000\)/);
    assert.match(panel, /Name = "HubPerfFarDistance"/);
    assert.match(panel, /Perf\.QueueScan\(true\)/);
});

test('chế độ CPU áp dụng theo lô và không tạo vòng lặp tải CPU nền', () => {
    assert.match(panel, /local batchSize = Perf\.Modes\.cpu and 90 or 220/);
    assert.match(panel, /if processed % batchSize == 0 then task\.wait\(\) end/);
    assert.match(panel, /WaterWaveSize/);
    assert.match(panel, /WaterWaveSpeed/);
});
