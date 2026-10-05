const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function section(startMarker, endMarker, description) {
    const start = script.indexOf(startMarker);
    assert.notEqual(start, -1, `phải có ${description}`);
    const end = script.indexOf(endMarker, start);
    assert.notEqual(end, -1, `khối ${description} phải có điểm kết thúc`);
    return script.slice(start, end);
}

const ensureSpeed = section('function MV._EnsureSpeed()', 'function MV._ReadSpeedInput', 'bộ điều khiển chạy nhanh');
const glassFly = section('function MV.FlyToGlass(idx)', '-- ---------- v4.28: BAY TỚI NGƯỜI CHƠI', 'bay tới kính');
const playerFly = section('function MV.FlyToPlayer(p)', '-- ---------- v5.1:', 'bay tới người chơi');
const objectFly = section('function MV.FlyToObject(target, speed)', '-- ---------- ⬆⬇ nâng/hạ', 'bay tới vật');

test('không để BodyVelocity chạy nhanh tranh lực với bộ điều khiển bay tự động', () => {
    assert.match(ensureSpeed, /if not MV\.sprint then return nil end/);
    assert.match(ensureSpeed,
        /if MV\.fly or MV\._playerFlyActive or MV\._glassFlyActive or MV\._objFlyActive or \(MV\.Safe and MV\.Safe\.on\) then\s+MV\._DestroySpeedParts\(\) CS\.root = nil return nil\s+end/);

    const canApplySprintVelocity = ({ sprint, cameraFly, playerFly, glassFly, objectFly, safeFly }) =>
        sprint && !cameraFly && !playerFly && !glassFly && !objectFly && !safeFly;
    assert.equal(canApplySprintVelocity({ sprint: true, playerFly: true }), false);
    assert.equal(canApplySprintVelocity({ sprint: true, glassFly: true }), false);
    assert.equal(canApplySprintVelocity({ sprint: true, objectFly: true }), false);
    assert.equal(canApplySprintVelocity({ sprint: true }), true,
        'chạy nhanh được tiếp tục hoạt động sau khi chuyến bay kết thúc');
});

test('bay tới kính, người chơi và vật chủ động gỡ BodyVelocity chạy nhanh khi bắt đầu', () => {
    assert.match(glassFly,
        /MV\._glassFlyActive = true pcall\(function\(\) MV\._EnsureSpeed\(\) end\)/);
    assert.match(playerFly,
        /MV\._playerFlyTarget = p MV\._playerFlyActive = true MV\._playerFlyPos = nil\s+pcall\(function\(\) MV\._EnsureSpeed\(\) end\)/);
    assert.match(objectFly,
        /MV\._objFlyTarget = target MV\._objFlyActive = true pcall\(function\(\) MV\._EnsureSpeed\(\) end\)/);
});

test('chỉ một bộ bay mục tiêu chạy cùng lúc để tránh các lực điều khiển chồng nhau', () => {
    assert.match(glassFly,
        /if MV\._playerFlyActive then pcall\(function\(\) MV\.StopPlayerFly\(\) end\) end\s+if MV\._objFlyActive then pcall\(function\(\) MV\.StopObjectFly\(\) end\) end/);
    assert.match(playerFly,
        /if MV\._glassFlyActive then pcall\(function\(\) MV\.StopGlassFly\(\) end\) end\s+if MV\._objFlyActive then pcall\(function\(\) MV\.StopObjectFly\(\) end\) end/);
    assert.match(objectFly,
        /if MV\._playerFlyActive then pcall\(function\(\) MV\.StopPlayerFly\(\) end\) end\s+if MV\._glassFlyActive then pcall\(function\(\) MV\.StopGlassFly\(\) end\) end/);
});

test('bay tới người chơi dọn trạng thái nếu executor không bind được vòng lặp', () => {
    assert.match(playerFly,
        /local okBind = pcall\(function\(\)[\s\S]*?RunService:BindToRenderStep\("BC_PlayerFly"[\s\S]*?if not okBind then MV\.StopPlayerFly\(\)\s+return false, "executor không bind được bay tới người chơi"/);
});
