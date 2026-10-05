const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const glassStart = script.indexOf('MV.glassFlySpeed =');
const playerFlyStart = script.indexOf('-- ---------- v4.28: BAY TỚI NGƯỜI CHƠI', glassStart);
assert.notEqual(glassStart, -1, 'phải có logic bay tới kính');
assert.notEqual(playerFlyStart, -1, 'khối bay tới kính phải kết thúc trước bay tới người chơi');
const glass = script.slice(glassStart, playerFlyStart);
const flyStart = glass.indexOf('function MV.FlyToGlass(idx)');
const stopStart = glass.indexOf('function MV.StopGlassFly()');
const stepStart = glass.indexOf('function MV._GlassFlyStep(dt)');
const nearestGlassStart = glass.indexOf('function MV.NearestGlassIndex()');
assert.notEqual(flyStart, -1, 'phải có hàm khởi chạy bay tới kính');
assert.notEqual(stopStart, -1, 'phải có hàm dừng bay tới kính');
assert.notEqual(stepStart, -1, 'phải có vòng lặp bay tới kính');
assert.notEqual(nearestGlassStart, -1, 'vòng lặp bay phải kết thúc trước hàm tìm kính gần nhất');
const flyToGlass = glass.slice(flyStart);
const stopGlassFly = glass.slice(stopStart, stepStart);
const glassFlyStep = glass.slice(stepStart, nearestGlassStart);
const safeSetStart = script.indexOf('function MV.Safe.Set(on)');
const safeNoclipAutoStart = script.indexOf('function MV.Safe.SetNoclipAuto(b)');
const safeNoclipAutoEnd = script.indexOf('function MV.Safe.SetShield(b)', safeNoclipAutoStart);
assert.notEqual(safeSetStart, -1, 'phải có logic bật/tắt Safe Fly');
assert.notEqual(safeNoclipAutoStart, -1, 'phải có tùy chọn noclip tự động của Safe Fly');
assert.notEqual(safeNoclipAutoEnd, -1, 'tùy chọn noclip phải kết thúc trước cài đặt khiên');
const safeSet = script.slice(safeSetStart, safeNoclipAutoStart);
const safeNoclipAuto = script.slice(safeNoclipAutoStart, safeNoclipAutoEnd);

test('bay tới kính và Safe Fly cùng giữ đúng mốc noclip ban đầu', () => {
    assert.match(flyToGlass,
        /local safeOwnsNoclip = MV\.Safe and MV\.Safe\.on == true and MV\.Safe\.noclip == true/);
    assert.match(flyToGlass,
        /if MV\._glassFlyNcPrev == nil then\s+if safeOwnsNoclip and MV\.Safe\._ncPrev ~= nil then\s+MV\._glassFlyNcPrev = MV\.Safe\._ncPrev\s+else\s+MV\._glassFlyNcPrev = MV\.noclip == true\s+end\s+end/);
    assert.match(safeSet,
        /if MV\._glassFlyActive == true and MV\._glassFlyNcPrev ~= nil then\s+SF\._ncPrev = MV\._glassFlyNcPrev/,
        'Safe Fly khởi động trong lúc bay tới kính phải lấy mốc trước kính bay');
    assert.match(safeNoclipAuto,
        /if MV\._glassFlyActive == true and MV\._glassFlyNcPrev ~= nil then\s+SF\._ncPrev = MV\._glassFlyNcPrev/,
        'bật tùy chọn noclip giữa chuyến bay không được coi noclip tự bật là trạng thái gốc');
    assert.match(script, /do MV\.Safe = \{\s+on = false,[\s\S]*?noclip = true/,
        'mặc định Safe Fly tắt dù tùy chọn noclip của nó mặc định bật');
});

test('dừng bay khôi phục đúng trạng thái noclip đã lưu, trừ khi Safe Fly hoặc bay tới người đang sở hữu', () => {
    assert.match(stopGlassFly, /if MV\._glassFlyNcPrev ~= nil then local was = MV\._glassFlyNcPrev/);
    assert.match(stopGlassFly, /MV\._glassFlyNcPrev = nil local safeOwnsNoclip = safeOn and MV\.Safe\.noclip == true/);
    assert.match(stopGlassFly,
        /if not MV\._playerFlyActive and not safeOwnsNoclip then pcall\(function\(\) MV\.SetNoclip\(was\) end\)/);
});

test('bay tới kính bật noclip và gọi cleanup khi bind thất bại, tới đích hoặc mất tấm kính', () => {
    const missingGlass = flyToGlass.indexOf('if not rec then return false');
    const missingCharacter = flyToGlass.indexOf('if not MV.Root() then return false');
    const enableNoclip = flyToGlass.indexOf('MV.SetNoclip(true)');
    assert.ok(missingGlass >= 0 && missingGlass < enableNoclip,
        'nếu không có kính thì phải thoát trước khi bật noclip');
    assert.ok(missingCharacter >= 0 && missingCharacter < enableNoclip,
        'nếu chưa có nhân vật thì phải thoát trước khi bật noclip');
    assert.match(flyToGlass, /MV\._glassFlyActive = true pcall\(function\(\) MV\.SetNoclip\(true\) end\)/);
    assert.match(flyToGlass, /if not okBind then MV\.StopGlassFly\(\)/);
    assert.match(glassFlyStep, /if not part or not part\.Parent then\s+MV\.StopGlassFly\(\)/);
    assert.match(glassFlyStep, /if dist <= 0\.75 then[\s\S]*?MV\.StopGlassFly\(\)/);
    assert.match(script, /elseif id == "stopglassfly" then S\.Move\.StopGlassFly\(\)/,
        'nút dừng thủ công phải đi qua cùng hàm cleanup');
});

test('khôi phục trạng thái ban đầu và bàn giao đúng quyền sở hữu với Safe Fly', () => {
    const rememberNoclip = (current, safeOn, safeNoclip, safePrior = null) =>
        safeOn && safeNoclip && safePrior !== null ? safePrior === true : current === true;
    const restoreNoclip = (saved, safeOn, safeNoclip, playerFly = false) =>
        saved !== null && !playerFly && !(safeOn && safeNoclip) ? saved : null;

    // Safe Fly mặc định tắt; noclip=true trong tùy chọn không đồng nghĩa nó đang sở hữu noclip.
    const defaultPrior = rememberNoclip(false, false, true);
    assert.equal(defaultPrior, false);
    assert.equal(restoreNoclip(defaultPrior, false, true), false,
        'noclip do chuyến bay tự bật phải tự tắt khi kết thúc');

    const manualPrior = rememberNoclip(true, false, true);
    assert.equal(restoreNoclip(manualPrior, false, true), true,
        'nếu noclip đã bật từ trước thì phải giữ nguyên trạng thái đó');

    const safePriorOff = rememberNoclip(true, true, true, false);
    assert.equal(safePriorOff, false,
        'nếu Safe Fly đã bật noclip thì dùng mốc mà Safe Fly lưu trước khi bật');
    assert.equal(restoreNoclip(safePriorOff, true, true), null,
        'không can thiệp khi Safe Fly vẫn đang sở hữu noclip');
    assert.equal(restoreNoclip(safePriorOff, false, true), false,
        'nếu Safe Fly tắt trước chuyến bay, glass flight hoàn tất việc khôi phục');

    const safePriorOn = rememberNoclip(true, true, true, true);
    assert.equal(restoreNoclip(safePriorOn, false, true), true,
        'giữ noclip thủ công vốn đã bật trước Safe Fly');

    const safeWithoutNoclip = rememberNoclip(false, true, false);
    assert.equal(safeWithoutNoclip, false);
    assert.equal(restoreNoclip(safeWithoutNoclip, true, false), false,
        'Safe Fly không sở hữu noclip nếu tùy chọn tự xuyên tường đã tắt');

    assert.match(safeSet,
        /local stillFlying = \(MV\._glassFlyActive == true\) or \(MV\._playerFlyActive == true\)[\s\S]*?if not stillFlying then\s+pcall\(function\(\) MV\.SetNoclip\(was\) end\)/,
        'Safe Fly phải giao việc khôi phục lại cho chuyến bay đang hoạt động');
});
