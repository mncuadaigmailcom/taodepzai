const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const standalone = fs.readFileSync(path.join(root, 'code-da-luu.lua'), 'utf8').replace(/\r\n/g, '\n');
const main = fs.readFileSync(path.join(root, 'script.js'), 'utf8').replace(/\r\n/g, '\n');
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/hub-runtime.luau'), 'utf8');
const luau = process.env.LUAU_BIN || 'luau';
const compiler = process.env.LUAU_COMPILE_BIN || 'luau-compile';
const available = binary => !spawnSync(binary, ['--help'], { encoding: 'utf8' }).error;
const hasLuau = available(luau);
const hasCompiler = available(compiler);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'tdz-saved-code-tests-'));
after(() => fs.rmSync(temp, { recursive: true, force: true }));
assert.doesNotMatch(standalone, /\]====\]/);
const bootstrap = `function Mock.startSavedCode() return assert(loadstring([====[${standalone}]====]))() end\n`;
let sequence = 0;
function luaTest(name, code) {
    test(name, { skip: !hasLuau && 'Install Luau CLI or set LUAU_BIN' }, () => {
        const file = path.join(temp, `${++sequence}.luau`);
        fs.writeFileSync(file, `${fixture}\n${bootstrap}\n${code}\nMock.flush()\nprint("ASSERTIONS_OK")\n`);
        const result = spawnSync(luau, [file], { encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024 });
        assert.ifError(result.error);
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout, /ASSERTIONS_OK/);
    });
}

test('the standalone manager compiles independently', {skip: !hasCompiler && 'Install luau-compile'}, () => {
    const result = spawnSync(compiler, ['--null', path.join(root, 'code-da-luu.lua')], {encoding: 'utf8'});
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
});

test('the embedded factory matches the standalone source byte for byte after its declaration', () => {
    const extract = source => source.slice(source.indexOf('-- BEGIN SAVED_CODE_FACTORY'),
        source.indexOf('-- END SAVED_CODE_FACTORY') + '-- END SAVED_CODE_FACTORY'.length);
    assert.equal(extract(main), extract(standalone).replace('local function CreateSavedCode(options)',
        'S.SavedCodeFactory = function(options)'));
    assert.doesNotMatch(extract(standalone), /\bS\.|\bStore\.|_G\.BananaCatHubAPI/);
    const result = spawnSync(process.execPath, [path.join(root, 'tools/sync-saved-code.cjs'), '--check'], {encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
});

luaTest('standalone startup creates an embeddable ScreenGui without requiring the main hub', String.raw`
S = nil
_G.BananaCatHubAPI = nil
local view = Mock.startSavedCode()
assert(view.Mode == "standalone" and view.Gui.Name == "TDZSavedCode")
assert(view.Root.Parent == view.Gui and view.Gui.Parent == playerGui)
assert(view.Gui:GetAttribute("BCHub_External") ~= true)
assert(#view.Adapter.list() == 0 and #Mock.http == 0 and Mock.executed == 0)
`);

luaTest('the manager UI saves inline code and raw URLs without executing them', String.raw`
local view = Mock.startSavedCode()
view.NameInput.Text, view.SourceInput.Text = "Inline", Mock.guiCode
Mock.find(view.Root, "AddSavedLink").Activated:Fire()
view.NameInput.Text, view.SourceInput.Text = "URL", "https://example.test/code.lua"
Mock.find(view.Root, "AddSavedLink").Activated:Fire()
assert(#view.Adapter.list() == 2 and #Mock.http == 0 and Mock.executed == 0)
assert(view.NameInput.Text == "" and view.SourceInput.Text == "")
`);

luaTest('running a saved inline source needs no URL and reports its own success', String.raw`
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("Inline", Mock.guiCode))
assert(view.Adapter.run(entry))
assert(Mock.executed == 1 and #Mock.http == 0 and view.Adapter.state(entry).hasRun)
assert(view.Adapter.state(entry).thread == nil)
`);

luaTest('running a URL fetches only that URL and can be explicitly run again', String.raw`
local url = "https://example.test/code.lua"
Mock.sources[url] = Mock.guiCode
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("URL", url))
assert(view.Adapter.run(entry))
assert(view.Adapter.run(entry))
assert(Mock.executed == 2 and #Mock.http == 2)
`);

luaTest('syntax and HTTP errors are visible and do not lock future runs', String.raw`
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("Broken", "bad syntax ???"))
assert(view.Adapter.run(entry))
assert(view.Adapter.state(entry).state == "error" and view.StatusLabel.Text:find("❌",1,true))
assert(view.Adapter.update(entry, "https://example.test/missing.lua"))
assert(view.Adapter.run(entry))
assert(view.Adapter.state(entry).error:find("404",1,true))
assert(view.Adapter.update(entry, Mock.guiCode))
assert(view.Adapter.run(entry))
assert(Mock.executed == 1)
`);

luaTest('double clicks do not duplicate a pending job, and another code cannot run concurrently', String.raw`
local view = Mock.startSavedCode()
local a = assert(view.Adapter.add("A", "task.wait(1)\n" .. Mock.guiCode))
local b = assert(view.Adapter.add("B", Mock.guiCode))
assert(view.Adapter.run(a) and view.Adapter.run(a))
assert(view.Adapter.run(b) == false)
Mock.flush()
assert(Mock.executed == 1)
assert(view.Adapter.run(b))
assert(Mock.executed == 2)
`);

luaTest('the Stop button cancels the manager job without deleting its saved source', String.raw`
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("Stop", "task.wait(2)\n" .. Mock.guiCode))
assert(view.Adapter.run(entry))
Mock.find(view.Root, "SavedCodeStop").Activated:Fire()
Mock.flush()
assert(Mock.executed == 0 and #view.Adapter.list() == 1 and not view.Adapter.state(entry).running)
`);

luaTest('edits while running are rejected; edits after stop update the same record', String.raw`
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("Edit", "task.wait(2)\n" .. Mock.guiCode))
assert(view.Adapter.run(entry))
assert(view.Adapter.update(entry, Mock.guiCode) == false)
view.Adapter.stop(entry)
assert(view.Adapter.update(entry, Mock.guiCode))
assert(#view.Adapter.list() == 1 and entry.code == view.Adapter.list()[1].code)
assert(view.Adapter.run(entry))
assert(Mock.executed == 1)
`);

luaTest('deleting a running record removes it and cancels its late execution', String.raw`
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("Delete", "task.wait(2)\n" .. Mock.guiCode))
assert(view.Adapter.run(entry))
view.Adapter.remove(entry)
Mock.flush()
assert(#view.Adapter.list() == 0 and Mock.executed == 0 and view.Adapter.state(entry) == nil)
`);

luaTest('legacy migration reads only the scripts list and never overwrites hub data', String.raw`
local legacy = {version=3, scripts={{name="Old",code=Mock.guiCode,expanded=true}},
    waypoints={{name="WP",x=1,y=2,z=3}}, features={{name="Feature",code="print('x')"}}, settings={embedEnabled=false}}
local before = HttpService:JSONEncode(legacy)
writefile("banana_cat_saved.json",before)
local view = Mock.startSavedCode()
Mock.flush()
assert(#view.Adapter.list() == 1 and view.Adapter.list()[1].expanded)
assert(readfile("banana_cat_saved.json") == before)
assert(HttpService:JSONDecode(readfile("taodepzai_saved_code.json")).scripts[1].name == "Old")
assert(Mock.executed == 0)
`);

luaTest('reloading cancels pending jobs and loads the saved records without autorun', String.raw`
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("Reload", "task.wait(2)\n" .. Mock.guiCode))
assert(view.Adapter.save())
assert(view.Adapter.run(entry))
view.Adapter.reload()
Mock.flush()
assert(#view.Adapter.list() == 1 and view.Adapter.list()[1] ~= entry and Mock.executed == 0)
`);

luaTest('missing file/clipboard APIs use RAM and never claim persistence or a successful copy', String.raw`
getfenv(0).readfile, getfenv(0).writefile, getfenv(0).isfile = nil, nil, nil
local view = Mock.startSavedCode()
assert(view.Adapter.add("Memory", "print('kept')"))
assert(view.Adapter.save() == false and view.Adapter.storage().mode == "memory")
Mock.find(view.Root, "SavedCodeExport").Activated:Fire()
assert(view.SourceInput.Text:find("json:",1,true))
assert(view.StatusLabel.Text:find("Không có clipboard",1,true))
local reopened = Mock.startSavedCode()
assert(view.dead and #reopened.Adapter.list() == 1)
`);

luaTest('write failures retain the source and display storage error', String.raw`
getfenv(0).writefile = function() error("disk full") end
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("Disk", Mock.guiCode))
assert(view.Adapter.save() == false)
view.RefreshStorage()
assert(view.StorageLabel.Text:find("disk full",1,true))
assert(_G.TDZSavedCodeData.scripts[1].code == entry.code)
`);

luaTest('corrupt JSON is not overwritten by startup or a previously queued save after reload', String.raw`
writefile("taodepzai_saved_code.json","bad JSON")
local view = Mock.startSavedCode()
Mock.flush()
assert(readfile("taodepzai_saved_code.json") == "bad JSON")
assert(view.Adapter.storage().error:find("hỏng",1,true))
assert(view.Adapter.add("Keep", "print('keep')"))
view.Adapter.reload()
Mock.flush()
assert(readfile("taodepzai_saved_code.json") == "bad JSON" and #view.Adapter.list() == 1)
`);

luaTest('export/import preserves Unicode and source while not importing hub settings or autorunning', String.raw`
local view = Mock.startSavedCode()
assert(view.Adapter.add("Tên 🎯", Mock.guiCode))
local json = view.Export()
local ok, n = view.Import(json)
assert(ok and n == 1 and #view.Adapter.list() == 2)
assert(view.Adapter.list()[2].name == "Tên 🎯 (2)" and view.Adapter.list()[2].code == view.Adapter.list()[1].code)
assert(Mock.executed == 0 and #Mock.http == 0)
assert(view.Import("not JSON") == false)
`);

luaTest('destroying and rerunning the module does not leave a duplicate window or a pending job', String.raw`
local first = Mock.startSavedCode()
local entry = assert(first.Adapter.add("Pending", "task.wait(2)\n" .. Mock.guiCode))
assert(first.Adapter.run(entry))
local second = Mock.startSavedCode()
Mock.flush()
assert(first.dead and first.Gui.Parent == nil and #second.Adapter.list() == 1 and Mock.executed == 0)
local count = 0
for _, child in ipairs(playerGui:GetChildren()) do if child.Name == "TDZSavedCode" then count += 1 end end
assert(count == 1)
second.Destroy(); second.Destroy()
assert(second.dead and second.Gui.Parent == nil and _G.TDZSavedCodeStandalone == nil)
`);

luaTest('external destruction cleans up UI subscriptions and pending execution', String.raw`
local view = Mock.startSavedCode()
local entry = assert(view.Adapter.add("External close", "task.wait(2)\n" .. Mock.guiCode))
assert(view.Adapter.run(entry))
view.Root:Destroy()
Mock.flush()
assert(view.dead and view.Gui.Parent == nil and Mock.executed == 0)
`);

luaTest('search is literal and closing the GUI cancels pending refresh callbacks', String.raw`
local view = Mock.startSavedCode()
assert(view.Adapter.add("A [test]", "print('A')"))
assert(view.Adapter.add("B", "print('B')"))
Mock.find(view.Root,"SavedCodeSearch").Text = "[test]"
Mock.flush(0.2)
local rows = Mock.find(view.Root,"SavedLinkList"):GetChildren()
local n = 0
for _, row in ipairs(rows) do if row.Name == "SavedLinkRow" then n += 1 end end
assert(n == 1)
Mock.find(view.Root,"SavedCodeSearch").Text = "pending"
view.Destroy()
Mock.flush()
assert(view.dead)
`);
