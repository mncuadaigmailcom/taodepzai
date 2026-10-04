const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = script.indexOf('-- ---------- v5.4: CPU + VỎ CẦU CÓ THỂ ĐIỀU CHỈNH ----------');
const end = script.indexOf('\nS.HubPanelCat =', start);
assert.notEqual(start, -1, 'Script Hub phải có khối CPU + tầm nhìn');
assert.notEqual(end, -1, 'khối CPU + tầm nhìn phải kết thúc trước phần lọc tab');
const panel = script.slice(start, end);

test('khung chỉ giữ nút CPU và vỏ cầu, không còn các chế độ cũ', () => {
    const modes = [...panel.matchAll(/\{id = "(cpu|range)"/g)].map(match => match[1]);
    assert.deepEqual(modes, ['cpu', 'range']);
    assert.match(panel, /Name = "HubPerf_Panel"[^\n]*LayoutOrder = -5/);
    assert.match(script, /HubPerf_Panel = "Tiện ích"/);
    assert.match(panel, /Name = "HubPerf_" \.\. modeId/);
    assert.doesNotMatch(panel, /id = "(quick|normal|gray|far|ultra)"/);
    assert.doesNotMatch(panel, /Tầm nhìn/);
});

test('tầm nhìn nhập bằng mét và được quy đổi sang studs có giới hạn hợp lệ', () => {
    assert.match(panel, /local STUDS_PER_METER = 1 \/ 0\.28/);
    assert.match(panel, /ViewDistanceMeters = 30/);
    assert.match(panel, /return Perf\.ViewDistanceMeters \* STUDS_PER_METER/);
    assert.match(panel, /math\.clamp\(math\.floor\(value \+ 0\.5\), 5, 1000\)/);
    assert.match(panel, /Name = "HubPerfViewDistance"/);
    assert.match(panel, /Bán kính \(m\)/);
});

test('vùng nhìn là một vỏ cầu trong suốt, bám nhân vật và dùng cùng bán kính', () => {
    assert.match(panel, /Instance\.new\("SphereHandleAdornment"\)/);
    assert.match(panel, /sphere\.Adornee = root/);
    assert.match(panel, /sphere\.Parent = root/);
    assert.match(panel, /sphere\.Radius = Perf\.GetViewDistanceStuds\(\)/);
    assert.match(panel, /sphere\.Transparency = 0\.82/);
    assert.match(panel, /sphere\.AlwaysOnTop = true/);
    assert.match(panel, /Perf\.RangeSphere\.Radius = Perf\.GetViewDistanceStuds\(\)/);
    assert.match(panel, /function Perf\.SyncRangeSphere\(\)/);
    assert.match(panel, /if not Perf\.Modes\.range then Perf\.ClearRangeSphere\(\); return end/);
    assert.match(panel, /Perf\.SyncRangeSphere\(\)/);
});

test('vật ngoài tầm nhìn được ẩn cục bộ và được khôi phục khi vào bán kính', () => {
    assert.match(panel, /function Perf\.GetRangePosition\(\)/);
    assert.match(panel, /local root = character and character:FindFirstChild\("HumanoidRootPart"\)/);
    assert.match(panel, /\(anchor\.Position - centerPosition\)\.Magnitude >= Perf\.GetViewDistanceStuds\(\)/);
    assert.match(panel, /if outOfRange then desired\.LocalTransparencyModifier = 1 end/);
    assert.match(panel, /if desired\[property\] == nil then restore\[#restore \+ 1\] = property end/);
    assert.match(panel, /Perf\.RestoreProperty\(instance, property\)/);
    assert.match(panel, /function Perf\.SyncRangeWatcher\(\)/);
    assert.match(panel, /Perf\.QueueScan\(true\)/);
    assert.match(panel, /Perf\.GetViewDistanceStuds\(\) \* 0\.1/);
});

test('chế độ CPU áp dụng theo lô và khôi phục cài đặt toàn cục', () => {
    assert.match(panel, /local batchSize = Perf\.Modes\.cpu and 90 or 220/);
    assert.match(panel, /if processed % batchSize == 0 then task\.wait\(\) end/);
    assert.match(panel, /WaterWaveSize/);
    assert.match(panel, /WaterWaveSpeed/);
    assert.match(panel, /function Perf\.RestoreAll/);
});

test('không xóa map hay thay đổi va chạm; giữ nhân vật cục bộ', () => {
    assert.match(panel, /instance:IsDescendantOf\(character\)/);
    assert.match(panel, /function Perf\.Stop\(\)/);
    assert.match(panel, /function Perf\.ClearRangeSphere\(\)[\s\S]*?sphere:Destroy\(\)/);
    assert.match(panel, /function Perf\.Stop\(\)[\s\S]*?Perf\.ClearRangeSphere\(\)/);
    assert.doesNotMatch(panel, /instance:Destroy\(\)|workspace:ClearAllChildren\(\)|\.CanCollide\s*=/);
});

test('FPS vẫn hiển thị trong panel và cập nhật theo khung hình định kỳ', () => {
    assert.match(panel, /Name = "HubPerfFPS"/);
    assert.match(panel, /trackConn\(RunService\.RenderStepped:Connect/);
    assert.match(panel, /if fpsElapsed < 0\.5 then return end/);
    assert.match(panel, /local fps = math\.floor\(fpsFrames \/ fpsElapsed \+ 0\.5\)/);
    assert.match(panel, /Perf\.FpsLabel\.Text = "FPS: " \.\. tostring\(shown\)/);
});
