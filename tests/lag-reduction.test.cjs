const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = script.indexOf('-- ---------- v5.4: CPU + GIẢM LAG CẦU CÓ THỂ ĐIỀU CHỈNH ----------');
const end = script.indexOf('\nS.HubPanelCat =', start);
assert.notEqual(start, -1, 'Script Hub phải có khối CPU + cầu');
assert.notEqual(end, -1, 'khối CPU + cầu phải kết thúc trước phần lọc tab');
const panel = script.slice(start, end);

test('khung giữ CPU và tính năng cầu, không còn các chế độ cũ', () => {
    const modes = [...panel.matchAll(/\{id = "(cpu|range)"/g)].map(match => match[1]);
    assert.deepEqual(modes, ['cpu', 'range']);
    assert.match(panel, /Name = "HubPerf_Panel"[^\n]*LayoutOrder = -5/);
    assert.match(script, /HubPerf_Panel = "Tiện ích"/);
    assert.match(panel, /Name = "HubPerf_" \.\. modeId/);
    assert.doesNotMatch(panel, /id = "(quick|normal|gray|far|ultra)"/);
    assert.match(panel, /title = "🌐 Giảm lag cầu"/);
    assert.doesNotMatch(panel, /Vỏ cầu|Tầm nhìn/);
});

test('bán kính nhập bằng mét và quy đổi sang studs trong giới hạn', () => {
    assert.match(panel, /local STUDS_PER_METER = 1 \/ 0\.28/);
    assert.match(panel, /ViewDistanceMeters = 30/);
    assert.match(panel, /return Perf\.ViewDistanceMeters \* STUDS_PER_METER/);
    assert.match(panel, /math\.clamp\(math\.floor\(value \+ 0\.5\), 5, 1000\)/);
    assert.match(panel, /Name = "HubPerfViewDistance"/);
    assert.match(panel, /Bán kính \(m\)/);
    assert.match(panel, /Perf\.RangeSphere\.Radius = Perf\.GetViewDistanceStuds\(\)/);
});

test('cầu đặc bám nhân vật, đổi màu theo ánh sáng và không va chạm', () => {
    assert.match(panel, /Instance\.new\("SphereHandleAdornment"\)/);
    assert.match(panel, /sphere\.Adornee = root/);
    assert.match(panel, /sphere\.Parent = root/);
    assert.match(panel, /sphere\.Radius = Perf\.GetViewDistanceStuds\(\)/);
    assert.match(panel, /sphere\.Transparency = 0(?:\D|$)/);
    assert.match(panel, /sphere\.AlwaysOnTop = false/);
    assert.match(panel, /function Perf\.GetRangeSphereColor\(\)/);
    assert.match(panel, /lighting\.ClockTime >= 19 or lighting\.ClockTime <= 6/);
    assert.match(panel, /lighting\.Brightness \* ambientLevel < 0\.35/);
    assert.match(panel, /return dark and Color3\.fromRGB\(80, 80, 92\) or Color3\.new\(1, 1, 1\)/);
    assert.match(panel, /Perf\.RangeSphere\.Color3 = sphereColor/);
    assert.match(panel, /Perf\.SyncRangeSphere\(\) -- cầu theo nhân vật, đổi màu theo ánh sáng/);
    assert.match(panel, /function Perf\.SyncRangeSphere\(\)/);
    assert.match(panel, /if not Perf\.Modes\.range then Perf\.ClearRangeSphere\(\); return end/);
    assert.match(panel, /Perf\.SyncRangeSphere\(\)/);
    assert.doesNotMatch(panel, /\.CanCollide\s*=/);
});

test('bật tính năng cầu không ẩn, sửa hoặc xóa vật thể', () => {
    assert.doesNotMatch(panel, /outOfRange|LocalTransparencyModifier|TextureID|TextureId|ColorMap|desired\.Transparency/);
    assert.match(panel, /function Perf\.ApplyInstance\(instance\)/);
    assert.match(panel, /local desired = \{\}[\s\S]*?if Perf\.Modes\.cpu and instance:IsA\("BasePart"\)/);
    const toggleStart = panel.indexOf('function Perf.Toggle(id)');
    const toggleEnd = panel.indexOf('function Perf.ApplyViewDistance(text)', toggleStart);
    const toggle = panel.slice(toggleStart, toggleEnd);
    assert.match(toggle, /if id == "cpu" then Perf\.QueueScan\(\) end/);
    assert.equal([...toggle.matchAll(/Perf\.QueueScan\(\)/g)].length, 1);
    const watcherStart = panel.indexOf('function Perf.SyncRangeWatcher()');
    const watcherEnd = panel.indexOf('function Perf.Toggle(id)', watcherStart);
    const watcher = panel.slice(watcherStart, watcherEnd);
    assert.match(watcher, /Perf\.SyncRangeSphere\(\)/);
    assert.doesNotMatch(watcher, /Perf\.QueueScan/);
});

test('chế độ CPU tối ưu theo lô và khôi phục thiết lập', () => {
    assert.match(panel, /local batchSize = 90/);
    assert.match(panel, /if processed % batchSize == 0 then task\.wait\(\) end/);
    assert.match(panel, /WaterWaveSize/);
    assert.match(panel, /WaterWaveSpeed/);
    assert.match(panel, /function Perf\.RestoreAll/);
});

test('không xóa map; chỉ gỡ hình cầu khi tắt và giữ FPS', () => {
    assert.match(panel, /function Perf\.Stop\(\)/);
    assert.match(panel, /function Perf\.ClearRangeSphere\(\)[\s\S]*?sphere:Destroy\(\)/);
    assert.match(panel, /function Perf\.Stop\(\)[\s\S]*?Perf\.ClearRangeSphere\(\)/);
    assert.doesNotMatch(panel, /workspace:ClearAllChildren\(\)|instance:Destroy\(\)/);
    assert.match(panel, /Name = "HubPerfFPS"/);
    assert.match(panel, /trackConn\(RunService\.RenderStepped:Connect/);
    assert.match(panel, /if fpsElapsed < 0\.5 then return end/);
    assert.match(panel, /local fps = math\.floor\(fpsFrames \/ fpsElapsed \+ 0\.5\)/);
    assert.match(panel, /Perf\.FpsLabel\.Text = "FPS: " \.\. tostring\(shown\)/);
});
