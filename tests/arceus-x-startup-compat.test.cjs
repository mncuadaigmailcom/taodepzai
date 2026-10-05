const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const startupEnd = script.indexOf('local function trackConn');
const startup = script.slice(0, startupEnd);
assert.notEqual(startupEnd, -1, 'phải có phần khởi động hub');

test('lỗi truy cập CoreGui không làm dừng script trước khi dựng giao diện', () => {
    assert.match(startup, /pcall\(function\(\) addCleanupParent\(game:GetService\("CoreGui"\)\) end\)/);
    assert.doesNotMatch(startup, /ipairs\(\{targetGui, playerGui, game:GetService\("CoreGui"\)\}\)/);
});

test('nếu gethui không hợp lệ hoặc không cho gắn ScreenGui thì chuyển sang PlayerGui', () => {
    assert.match(startup, /if hui and typeof\(hui\) == "Instance" then targetGui = hui end/);
    assert.match(script,
        /local guiOk = pcall\(function\(\) gui = New\("ScreenGui", guiProps, targetGui\) end\)[\s\S]*?if not guiOk or not gui or gui\.Parent ~= targetGui then[\s\S]*?targetGui = playerGui[\s\S]*?gui = New\("ScreenGui", guiProps, playerGui\)/);
});
