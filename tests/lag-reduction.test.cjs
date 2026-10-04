const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const start = script.indexOf('-- ---------- v5.4: CPU + ĐỒ HỌA NHẸ + GIẢM TẦM NHÌN CÓ THỂ ĐIỀU CHỈNH ----------');
const end = script.indexOf('\nS.HubPanelCat =', start);
assert.notEqual(start, -1, 'Script Hub phải có khối CPU + giảm tầm nhìn');
assert.notEqual(end, -1, 'khối hiệu năng phải kết thúc trước phần lọc tab');
const panel = script.slice(start, end);

test('khung giữ CPU, giảm tầm nhìn và thêm giảm lag nhẹ riêng', () => {
    const modes = [...panel.matchAll(/\{id = "(cpu|range|quality)"/g)].map(match => match[1]);
    assert.deepEqual(modes, ['cpu', 'range', 'quality']);
    assert.match(panel, /Name = "HubPerf_Panel"[^\n]*LayoutOrder = -5/);
    assert.match(script, /HubPerf_Panel = "Tiện ích"/);
    assert.match(panel, /Name = "HubPerf_" \.\. modeId/);
    assert.match(panel, /title = "🌫 Giảm tầm nhìn"/);
    assert.match(panel, /title = "🎨 Giảm lag nhẹ"/);
    assert.match(panel, /Size = UDim2\.new\(1, 0, 0, 184\)/);
    assert.doesNotMatch(panel, /SphereHandleAdornment|RangeSphere|Vỏ cầu|Giảm lag cầu/);
});

test('khoảng nhìn nhập bằng mét và quy đổi sang studs trong giới hạn', () => {
    assert.match(panel, /local STUDS_PER_METER = 1 \/ 0\.28/);
    assert.match(panel, /ViewDistanceMeters = 30/);
    assert.match(panel, /return Perf\.ViewDistanceMeters \* STUDS_PER_METER/);
    assert.match(panel, /math\.clamp\(math\.floor\(value \+ 0\.5\), 5, 1000\)/);
    assert.match(panel, /Name = "HubPerfViewDistance"/);
    assert.match(panel, /Tầm nhìn \(m\)/);
});

test('fog tầm nhìn có fallback Atmosphere và khôi phục thiết lập gốc', () => {
    assert.match(panel, /function Perf\.SyncRangeFog\(\)/);
    assert.match(panel, /FindFirstChildOfClass\("Atmosphere"\)/);
    assert.match(panel, /fogEnd = Perf\.GetViewDistanceStuds\(\)/);
    assert.match(panel, /fogStart = fogEnd \* 0\.75/);
    assert.match(panel, /Perf\.Write\(lighting, "FogStart", fogStart\)/);
    assert.match(panel, /Perf\.Write\(lighting, "FogEnd", fogEnd\)/);
    assert.match(panel, /densityIncrease = math\.clamp\(40 \/ Perf\.GetViewDistanceStuds\(\), 0\.01, 0\.7\)/);
    assert.match(panel, /Perf\.Write\(atmosphere, "Density", math\.clamp\(originalDensity \+ densityIncrease, 0, 1\)\)/);
    assert.match(panel, /Perf\.RestoreProperty\(Perf\.RangeAtmosphere, "Density"\)/);
    assert.match(panel, /DescendantAdded:Connect\([\s\S]*?instance:IsA\("Atmosphere"\)/);
    assert.match(panel, /DescendantRemoving:Connect\([\s\S]*?instance == Perf\.RangeAtmosphere/);
    assert.match(panel, /if id == "cpu" or id == "quality" then Perf\.QueueScan\(\) else\s+Perf\.UpdateGlobals\(\)/);
    assert.doesNotMatch(panel, /SphereHandleAdornment|RangeSphere|LocalTransparencyModifier|outOfRange|instance:Destroy\(\)/);
});

test('giảm lag nhẹ làm nhạt màu/giảm mesh detail nhưng không tắt ánh sáng hay hiệu ứng', () => {
    const qualityStart = panel.indexOf('if Perf.Modes.quality and isPart then');
    const qualityEnd = panel.indexOf('if Perf.Modes.cpu and Perf.IsVisualEffect(instance)', qualityStart);
    assert.notEqual(qualityStart, -1);
    assert.notEqual(qualityEnd, -1);
    const quality = panel.slice(qualityStart, qualityEnd);
    assert.match(quality, /desired\.Material = Enum\.Material\.Plastic/);
    assert.match(quality, /desired\.RenderFidelity = Enum\.RenderFidelity\.Performance/);
    assert.match(quality, /originalColor:Lerp\(PALE_COLOR, 0\.22\)/);
    assert.doesNotMatch(quality, /CastShadow|Reflectance|Enabled|GlobalShadows|IsVisualEffect/);
    assert.match(panel, /if Perf\.Modes\.cpu and Perf\.IsVisualEffect\(instance\) then desired\.Enabled = false end/);
    assert.match(panel, /if Perf\.Modes\.cpu then shadows = false end/);
    assert.match(panel, /function Perf\.QueueScan\(\)[\s\S]*?if not Perf\.Modes\.cpu and not Perf\.Modes\.quality then[\s\S]*?Perf\.RestoreAll/);
    assert.match(panel, /if not Perf\.Modes\.cpu and not Perf\.Modes\.quality then return end/);
});

test('chế độ CPU tối ưu theo lô và khôi phục thiết lập', () => {
    assert.match(panel, /local batchSize = 90/);
    assert.match(panel, /if processed % batchSize == 0 then task\.wait\(\) end/);
    assert.match(panel, /WaterWaveSize/);
    assert.match(panel, /WaterWaveSpeed/);
    assert.match(panel, /function Perf\.RestoreAll/);
    assert.match(panel, /Perf\.UpdateGlobals\(\)/);
});

test('reset khôi phục fog; không xóa map; FPS vẫn hiển thị', () => {
    assert.match(panel, /function Perf\.Reset\(\)[\s\S]*?Perf\.QueueScan\(\)/);
    assert.match(panel, /function Perf\.Stop\(\)[\s\S]*?Perf\.RestoreAll\(\)/);
    assert.doesNotMatch(panel, /workspace:ClearAllChildren\(\)|instance:Destroy\(\)/);
    assert.match(panel, /Name = "HubPerfFPS"/);
    assert.match(panel, /trackConn\(RunService\.RenderStepped:Connect/);
    assert.match(panel, /if fpsElapsed < 0\.5 then return end/);
    assert.match(panel, /local fps = math\.floor\(fpsFrames \/ fpsElapsed \+ 0\.5\)/);
    assert.match(panel, /Perf\.FpsLabel\.Text = "FPS: " \.\. tostring\(shown\)/);
});
