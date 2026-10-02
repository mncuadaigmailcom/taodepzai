const assert = require('node:assert/strict');
const { test, after } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'script.js'), 'utf8').replace(/\r\n/g, '\n');
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/hub-runtime.luau'), 'utf8');
const savedCodeSource = fs.readFileSync(path.join(root, 'code-da-luu.lua'), 'utf8');
assert.doesNotMatch(savedCodeSource, /\]====\]/);
const luau = process.env.LUAU_BIN || 'luau';
const compiler = process.env.LUAU_COMPILE_BIN || 'luau-compile';
const available = binary => !spawnSync(binary, ['--help'], { encoding: 'utf8' }).error;
const hasLuau = available(luau);
const hasCompiler = available(compiler);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'taodepzai-hub-tests-'));
after(() => fs.rmSync(temp, { recursive: true, force: true }));

function between(start, end) {
    const a = source.indexOf(start);
    assert.notEqual(a, -1, `Missing production section: ${start}`);
    const b = source.indexOf(end, a + start.length);
    assert.notEqual(b, -1, `Missing section end: ${end}`);
    return source.slice(a, b);
}

// Functions and UI handlers are extracted from the real main script, not reimplemented.
// Geometry rendering, Roblox services and executor I/O are deterministic offline adapters.
const production = [
    between('function S.SanitizeCode(c)', '\nfunction D.SyncPageChips()'),
    between('-- BEGIN SAVED_SCRIPT_LINKS', '-- END SAVED_SCRIPT_LINKS'),
    between('local Store = {}', '\n-- ----------------------------------------------------------------------------\nS.compatAdded'),
    between('S.compatAdded  =', '\nlocal function ExecOnce('),
    between('local function ExecOnce(', '\nlocal function Label('),
    between('function S.CopyToClipboard(text)', '\nfunction S.FetchServers('),
    between('-- BEGIN SAVED_CODE_FACTORY', '-- END SAVED_CODE_MOUNT'),
    between('local function NormalizeCode(c)', '\nlocal GAME_OWNED_GUI_NAMES'),
    between('S.EMBED_TRY_DELAYS   =', '\nS.parkTab   ='),
    between('local function RunFeatureScript(', '\ntask.spawn(function()\n    task.wait(1)'),
    between('Store.restoreFeatures = function()', '\nS.Move = {'),
].join('\n') + `\n_G.BananaCatHubAPI = {SavedCodeAdapter = S.SavedCodeAdapter}\nfunction Mock.reloadGlobalHelpers()\nS = {}\n${between('-- BEGIN EXECUTOR_GLOBALS', '-- END EXECUTOR_GLOBALS')}\nend\n`;
let sequence = 0;
function luaTest(name, code) {
    test(name, { skip: !hasLuau && 'Install Luau CLI or set LUAU_BIN to run behavioral tests' }, () => {
        const file = path.join(temp, `${++sequence}.luau`);
        fs.writeFileSync(file, `${fixture}\n${production}\n${code}\nMock.flush()\nprint("ASSERTIONS_OK")\n`);
        const result = spawnSync(luau, [file], { encoding: 'utf8', timeout: 15000, maxBuffer: 4 * 1024 * 1024 });
        assert.ifError(result.error);
        assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout, /ASSERTIONS_OK/);
    });
}

test('the entire main script compiles as Luau (including local/register limits)', {
    skip: !hasCompiler && 'Install luau-compile or set LUAU_COMPILE_BIN',
}, () => {
    const result = spawnSync(compiler, ['--null', path.join(root, 'script.js')], { encoding: 'utf8', timeout: 15000 });
    assert.ifError(result.error);
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

test('Code Đã Lưu uses the standalone factory in the main hub instead of a second UI implementation', () => {
    assert.match(source, /AddTab\("Code Đã Lưu", "💾", 1\)/);
    assert.match(source, /S\.SavedCodeView = S\.SavedCodeFactory\(\{parent = savedCodeTab, adapter = S\.SavedCodeAdapter\}\)/);
    const factory = between('-- BEGIN SAVED_CODE_FACTORY', '-- END SAVED_CODE_FACTORY');
    assert.doesNotMatch(factory, /S\.SavedLinks|Store\.|RunCode\(/);
    assert.match(source, /return RunFeatureScript\(codeContent, name, embedHost, runFeatureBtn, fStatus\)/);
});

luaTest('invalid and blank URLs are rejected without changing saved data', String.raw`
for _, url in ipairs({"", "   ", "ftp://host/file", "https://", "https:///file", "https://user:pass@host/file",
    'https://host/"evil"', "https://host/bad\\path", "https://host/a b", "https://host/a\nb", "https://" .. string.rep("x", 4100)}) do
    local entry, why = S.SavedLinks.Add(scripts, "Test", url, true)
    assert(entry == nil and type(why) == "string", url)
end
assert(#scripts == 0 and #Mock.http == 0)
`);

luaTest('raw links, legacy inline code, quoted links and Unicode names remain supported', String.raw`
local url = "https://example.test/source.lua?version=2&name=a%20b"
local a = assert(S.SavedLinks.Add(scripts, "  Tính năng 🎯  ", "  " .. url .. "  ", true))
assert(a.code == url and a.name == "Tính năng 🎯")
assert(S.SavedLinks.Source({code = '"' .. url .. '"'}) == url)
assert(S.SavedLinks.Source({code = "'" .. url .. "'"}) == url)
local inline = assert(S.SavedLinks.Add(scripts, "Tính năng 🎯", "print('xin chào')"))
assert(inline.name == "Tính năng 🎯 (2)" and inline.code == "print('xin chào')")
assert(S.SavedLinks.Source({code = "file://script.lua"}) == nil)
`);

luaTest('scripts embedded in the main preset table merge once without replacing user edits', String.raw`
local user = Mock.add("Own", "print('user')")
local seeds = {{name = "Own", code = "print('builtin')"}, {name = "Built", code = Mock.guiCode},
    {name = "Remote", url = "https://example.test/code.lua"}, {name = "Empty", code = ""}, false}
assert(S.SavedLinks.MergeBuiltins(scripts, seeds) == 2)
assert(S.SavedLinks.MergeBuiltins(scripts, seeds) == 0)
assert(user.code == "print('user')" and #scripts == 3)
assert(scripts[2].builtin and scripts[3].code == seeds[3].url)
assert(Mock.executed == 0 and #Mock.http == 0)
`);

luaTest('the add-link UI saves the raw source but never executes or downloads it', String.raw`
Mock.find(savedCodeTab, "SavedLinkName").Text = "My link"
Mock.find(savedCodeTab, "SavedLinkUrl").Text = "https://example.test/script.lua"
Mock.find(savedCodeTab, "AddSavedLink").Activated:Fire()
assert(#scripts == 1 and scripts[1].code == "https://example.test/script.lua")
assert(#featureTabs == 0 and #Mock.http == 0 and Mock.executed == 0)
assert(Mock.row("My link"):FindFirstChild("SavedLinkActivate"))
`);

luaTest('clicking a saved name executes embedded code through the actual feature GUI pipeline', String.raw`
local entry = Mock.add("Embedded", Mock.guiCode)
Mock.row(entry.name):FindFirstChild("SavedLinkActivateName").Activated:Fire()
Mock.flush()
local ft = assert(S.SavedLinks.Tab(entry))
assert(ft.savedEntry == entry and ft.transient and ft.hasRun and ft.state == "ready")
assert(activeTab == ft.frame and Mock.executed == 1 and Mock.embedded == 1 and #S.embeds == 1)
assert(#Mock.http == 0)
`);

luaTest('raw URL activation downloads once; later clicks reuse the tab without rerunning', String.raw`
local url = "https://example.test/script.lua"
Mock.sources[url] = Mock.guiCode
local entry = Mock.add("Remote", url)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
Mock.flush()
local again, same, mode = S.SavedLinks.Activate(entry)
assert(again and same == ft and mode == "opened")
assert(#featureTabs == 1 and #Mock.http == 1 and Mock.executed == 1)
`);

luaTest('double activation during a yielded script never creates another tab or run', String.raw`
local entry = Mock.add("Slow", "task.wait(1)\n" .. Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok and ft.running)
assert(S.SavedLinks.Activate(entry))
Mock.row(entry.name):FindFirstChild("SavedLinkActivate").Activated:Fire()
assert(#featureTabs == 1)
Mock.flush()
assert(ft.hasRun and Mock.executed == 1 and ft._thread == nil and S.featureRunOwner == nil)
`);

luaTest('a different feature cannot replace the GUI hook while another script is starting', String.raw`
local a = Mock.add("A", "task.wait(1)\n" .. Mock.guiCode)
local b = Mock.add("B", Mock.guiCode)
assert(S.SavedLinks.Activate(a))
local ok, why = S.SavedLinks.Activate(b)
assert(not ok and why:find("khác", 1, true))
assert(Mock.executed == 0)
Mock.flush()
assert(S.SavedLinks.Activate(b))
Mock.flush()
assert(Mock.executed == 2)
`);

luaTest('syntax failure produces a per-script error and allows editing and retry', String.raw`
local entry = Mock.add("Broken", "this is not valid Luau ???")
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
Mock.flush()
assert(ft.state == "error" and not ft.hasRun and not ft.running and ft.error ~= nil)
assert(S.SavedLinks.statusLabel.Text:find("lỗi", 1, true), S.SavedLinks.statusLabel.Text)
assert(S.featureRunOwner == nil and ft._thread == nil)
entry.code = Mock.guiCode
assert(S.SavedLinks.Activate(entry))
Mock.flush()
assert(ft.hasRun and Mock.executed == 1 and #featureTabs == 1)
`);

luaTest('HTTP failure cleans capture/watchers and a retry uses the same tab', String.raw`
local url = "https://example.test/missing.lua"
local entry = Mock.add("404", url)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
Mock.flush()
assert(ft.state == "error" and ft.error:find("404", 1, true))
assert(ft.hookState == nil and S.activeHook == nil and playerGui.ChildAdded:Count() == 0)
Mock.sources[url] = Mock.guiCode
assert(S.SavedLinks.Activate(entry))
Mock.flush()
assert(ft.hasRun and #featureTabs == 1 and #Mock.http == 2)
`);

luaTest('successful immediate completion does not retain a dead coroutine or loading status', String.raw`
local entry = Mock.add("Immediate", Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok and ft.hasRun and not ft.running and ft._thread == nil)
assert(S.featureRunOwner == nil)
assert(not S.SavedLinks.statusLabel.Text:find("đang kích hoạt", 1, true), S.SavedLinks.statusLabel.Text)
`);

luaTest('opening a closed feature reembeds its existing GUI without executing code again', String.raw`
local entry = Mock.add("Reopen", Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok and ft.hasRun)
Mock.button(ft.frame, "✕").Activated:Fire()
assert(#S.embeds == 0 and Mock.restored == 1)
assert(S.SavedLinks.Activate(entry))
assert(Mock.executed == 1 and #featureTabs == 1 and #S.embeds == 1 and Mock.embedded == 2)
`);

luaTest('the explicit feature Run button reruns on demand without adding another tab', String.raw`
local entry = Mock.add("Rerun", Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
Mock.button(ft.frame, "▶ Chạy Script").Activated:Fire()
Mock.flush()
assert(Mock.executed == 2 and #featureTabs == 1 and ft.hasRun)
`);

luaTest('editing a feature updates its saved source rather than persisting a duplicate feature', String.raw`
local entry = Mock.add("Edit", Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
Mock.button(ft.frame, "✏️ Sửa").Activated:Fire()
for _, box in ipairs(ft.frame:GetDescendants()) do
    if box.ClassName == "TextBox" then box.Text = "_G.Mock.executed += 10" end
end
Mock.button(ft.frame, "✅ Áp Dụng").Activated:Fire()
assert(entry.code == "_G.Mock.executed += 10" and not ft.hasRun)
local data = Store.serialize()
assert(#data.scripts == 1 and data.scripts[1].code == entry.code and #data.features == 0)
assert(S.SavedLinks.Activate(entry))
Mock.flush()
assert(Mock.executed == 11)
`);

luaTest('editing a source while its coroutine is running is rejected without losing the original', String.raw`
local code = "task.wait(2)\n" .. Mock.guiCode
local entry = Mock.add("Busy", code)
local original = entry.code
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
local changed, why = ft.setSource("print('replacement')")
assert(not changed and why and entry.code == original and ft.code == original)
Mock.flush()
assert(Mock.executed == 1)
`);

luaTest('expanded saved-source UI saves edits and reruns the updated inline script', String.raw`
local entry = Mock.add("Inline edit", Mock.guiCode)
assert(S.SavedLinks.Activate(entry))
entry.expanded = true
RebuildScripts()
local row = Mock.row(entry.name)
Mock.find(row, "SavedLinkSource").Text = "_G.Mock.executed += 3"
Mock.button(row, "💾 Lưu sửa").Activated:Fire()
assert(entry.code == "_G.Mock.executed += 3")
assert(S.SavedLinks.Activate(entry))
Mock.flush()
assert(Mock.executed == 4 and #featureTabs == 1)
`);

luaTest('deleting a saved entry cancels pending execution and removes its tab and GUI hook', String.raw`
local entry = Mock.add("Delete", "task.wait(2)\n" .. Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok and ft.running)
Mock.button(Mock.row(entry.name), "🗑 Xóa").Activated:Fire()
Mock.flush()
assert(#scripts == 0 and #featureTabs == 0 and Mock.executed == 0)
assert(ft.destroyed and ft._thread == nil and S.featureRunOwner == nil and S.activeHook == nil)
assert(playerGui.ChildAdded:Count() == 0)
`);

luaTest('removing only a feature tab preserves its saved source and activation can recreate the tab', String.raw`
local entry = Mock.add("Keep source", Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
assert(S.DestroyFeatureTab(ft))
assert(#scripts == 1 and #featureTabs == 0 and S.SavedLinks.Tab(entry) == nil)
local second, new = S.SavedLinks.Activate(entry)
assert(second and new ~= ft and #featureTabs == 1)
Mock.flush()
assert(Mock.executed == 2)
`);

luaTest('stale externally-destroyed tabs can be recreated without retaining a running owner', String.raw`
local entry = Mock.add("Stale", "task.wait(2)\n" .. Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
ft.frame:Destroy()
local again, new = S.SavedLinks.Activate(entry)
assert(again and new ~= ft)
Mock.flush()
assert(ft.destroyed and Mock.executed == 1 and #featureTabs == 1)
`);

luaTest('serialized data contains one saved source and only genuine user-created features', String.raw`
local entry = Mock.add("Legacy", "print('legacy')")
assert(S.SavedLinks.Activate(entry))
local custom = S.CreateFeatureTab("Custom", "⚙️", "print('custom')")
local data = Store.serialize()
assert(data.version == 3 and #data.scripts == 1 and data.scripts[1].code == entry.code)
assert(#data.features == 1 and data.features[1].name == custom.name)
`);

luaTest('save/reload preserves raw links, code and expanded state without auto-running or duplicate tabs', String.raw`
local a = Mock.add("Link 🎯", "https://example.test/script.lua")
local b = Mock.add("Code", "print('legacy')")
a.expanded = true
Mock.sources[a.code] = Mock.guiCode
assert(S.SavedLinks.Activate(a))
assert(Store.save())
S.DoReload()
Mock.flush()
assert(#scripts == 2 and scripts[1].name == a.name and scripts[1].code == a.code and scripts[1].expanded)
assert(scripts[2].code == b.code and #featureTabs == 0 and #Mock.http == 1 and Mock.executed == 1)
assert(S.SavedLinks.Activate(scripts[1]))
Mock.flush()
assert(#featureTabs == 1 and #Mock.http == 2)
`);

luaTest('reloading while a script is yielded cancels its late work and safely replaces entry identities', String.raw`
local entry = Mock.add("Reload", "task.wait(2)\n" .. Mock.guiCode)
assert(Store.save())
assert(S.SavedLinks.Activate(entry))
S.DoReload()
Mock.flush()
assert(Mock.executed == 0 and #featureTabs == 0 and S.featureRunOwner == nil)
assert(#scripts == 1 and scripts[1] ~= entry and scripts[1].code == entry.code)
assert(S.activeHook == nil and playerGui.ChildAdded:Count() == 0)
`);

luaTest('global feature cleanup is idempotent and leaves saved data untouched', String.raw`
local entry = Mock.add("Cleanup", Mock.guiCode)
assert(S.SavedLinks.Activate(entry))
_G.BananaCatHub_FeatureCleanup()
_G.BananaCatHub_FeatureCleanup()
assert(#scripts == 1 and #featureTabs == 0 and #S.embeds == 0 and S.SavedLinks.Tab(entry) == nil)
`);

luaTest('native executor functions outside _G are detected and never overwritten by compatibility shims', String.raw`
local nativeLoader, nativeWrite = loadstring, writefile
assert(rawget(_G, "loadstring") == nil and rawget(_G, "writefile") == nil)
assert(S.HasGlobal("loadstring") and S.HasGlobal("writefile"))
S.EnsureCompat()
assert(S.GetGlobal("loadstring") == nativeLoader and S.GetGlobal("writefile") == nativeWrite)
assert(not S.Shimmed("loadstring") and not S.Shimmed("writefile") and Store.canWrite())
`);

luaTest('shim identity survives resetting the hub state and cannot masquerade as native disk I/O', String.raw`
local shim = function() return "RAM only" end
getfenv(0).writefile = nil
getfenv(0).readfile = nil
assert(S.SetGlobal("writefile", shim) and S.SetGlobal("readfile", shim))
assert(S.Shimmed("writefile") and not Store.canWrite())
Mock.reloadGlobalHelpers()
assert(S.GetGlobal("writefile") == shim and S.Shimmed("writefile") and not Store.canWrite())
`);

luaTest('single-argument asset/teleport fallbacks preserve the supplied path and source', String.raw`
S.EnsureCompat()
assert(S.GetGlobal("getcustomasset")("icon.png") == "icon.png")
assert(S.GetGlobal("getsynasset")("icon.png") == "icon.png")
assert(S.GetGlobal("queue_on_teleport")("print('queued')"))
assert(S.queued[1] == "print('queued')")
`);

luaTest('the clipboard adapter never reports success for a RAM-only fallback', String.raw`
S.EnsureCompat()
assert(S.Shimmed("setclipboard"))
assert(S.CopyToClipboard("backup") == false and S.clipboardTxt == "backup")
local copied
getfenv(0).setclipboard = function(text) copied = text end
assert(S.CopyToClipboard("real backup") and copied == "real backup")
getfenv(0).setclipboard = function() error("clipboard blocked") end
getfenv(0).toclipboard = function(text) copied = text end
assert(S.CopyToClipboard("second API") and copied == "second API")
`);

luaTest('missing loadstring support produces a clear feature error rather than a broken fake loader', String.raw`
getfenv(0).loadstring = false
local entry = Mock.add("Unsupported", Mock.guiCode)
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok and ft.state == "error")
assert(ft.error:find("không hỗ trợ loadstring", 1, true))
assert(S.featureRunOwner == nil and S.activeHook == nil)
`);

luaTest('a real disk-write failure falls back to memory and preserves the saved source', String.raw`
local entry = Mock.add("Disk error", "https://example.test/script.lua")
getfenv(0).writefile = function() error("disk full") end
assert(Store.save() == false and Store.mode == "memory")
assert(_G.BananaCatHub_SavedData.scripts[1].code == entry.code and Store.lastError:find("Ghi file", 1, true))
`);

luaTest('opening another source is blocked while the Code runner owns execution', String.raw`
runActive = true
local entry = Mock.add("Blocked", Mock.guiCode)
local ok, why = S.SavedLinks.Activate(entry)
assert(not ok and why:find("Code đang chạy", 1, true) and Mock.executed == 0)
runActive = false
assert(S.SavedLinks.Activate(entry))
Mock.flush()
assert(Mock.executed == 1)
`);

luaTest('the Code runner cannot abort or replace a feature capture that is still starting', String.raw`
local entry = Mock.add("Feature owner", "task.wait(1)\n" .. Mock.guiCode)
assert(S.SavedLinks.Activate(entry))
local ok, why = RunCode("_G.Mock.executed += 100", "Code", nil, 1, 0)
assert(not ok and why:find("tính năng", 1, true))
Mock.flush()
assert(Mock.executed == 1)
`);

luaTest('deleting and recreating tabs preserves primary rail order and unique feature orders', String.raw`
local a = Mock.add("Order A", Mock.guiCode)
local b = Mock.add("Order B", Mock.guiCode)
local c = Mock.add("Order C", Mock.guiCode)
local _, fa = S.SavedLinks.Activate(a)
local _, fb = S.SavedLinks.Activate(b)
assert(fa.btn.LayoutOrder == 8 and fb.btn.LayoutOrder == 9)
S.DestroyFeatureTab(fa)
local _, fc = S.SavedLinks.Activate(c)
assert(fb.btn.LayoutOrder == 8 and fc.btn.LayoutOrder == 9)
assert(savedButton.LayoutOrder == 1 and codeButton.LayoutOrder == 2)
assert(tabs[fb.tabIdx] == fb.btn and tabs[fc.tabIdx] == fc.btn)
assert(Store.save())
S.DoReload()
assert(savedButton.LayoutOrder == 1 and codeButton.LayoutOrder == 2)
`);

luaTest('a configured inline preset exists after load but runs only when its saved link is activated', String.raw`
S.BuiltinSavedScripts = {{name = "In main script", code = Mock.guiCode}}
Store.load()
RebuildScripts()
assert(#scripts == 1 and scripts[1].builtin and Store.loadedScripts == 1)
assert(Mock.executed == 0 and #Mock.http == 0 and #featureTabs == 0)
Mock.row("In main script"):FindFirstChild("SavedLinkActivate").Activated:Fire()
Mock.flush()
assert(Mock.executed == 1 and #featureTabs == 1 and #Mock.http == 0)
`);

luaTest('existing manually created features still run and persist through their original toolbar', String.raw`
local ft = S.CreateFeatureTab("Original feature", "⚙️", Mock.guiCode)
assert(not ft.transient and ft.savedEntry == nil and Mock.executed == 0)
Mock.button(ft.frame, "▶ Chạy Script").Activated:Fire()
Mock.flush()
assert(ft.hasRun and Mock.executed == 1 and Mock.embedded == 1)
assert(#Store.serialize().features == 1 and #scripts == 0)
`);

luaTest('a queued tab-open callback cannot recreate an entry after it has been deleted', String.raw`
local entry = Mock.add("Queued", Mock.guiCode)
local _, ft = S.SavedLinks.Activate(entry)
ft.btn.Activated:Fire()
Mock.button(Mock.row(entry.name), "🗑 Xóa").Activated:Fire()
Mock.flush()
assert(#scripts == 0 and #featureTabs == 0 and Mock.executed == 1)
`);

luaTest('late-created GUI is captured by the feature retry pipeline without rerunning its source', String.raw`
local entry = Mock.add("Late GUI", "task.delay(3, function()\n" .. Mock.guiCode .. "\nend)")
local ok, ft = S.SavedLinks.Activate(entry)
assert(ok)
Mock.flush()
assert(ft.hasRun and Mock.executed == 1 and Mock.embedded == 1 and #featureTabs == 1)
assert(S.activeHook == nil and playerGui.ChildAdded:Count() == 0)
`);

luaTest('disabling GUI embedding still executes a saved source without moving its GUI into the hub', String.raw`
S.embedEnabled = false
local entry = Mock.add("External GUI", Mock.guiCode)
assert(S.SavedLinks.Activate(entry))
Mock.flush()
assert(Mock.executed == 1 and Mock.embedded == 0 and #S.embeds == 0)
assert(playerGui:FindFirstChild("TestPayload"):FindFirstChildOfClass("Frame"))
`);

luaTest('storage uses real executor APIs supplied by getgenv even when unqualified globals are absent', String.raw`
local env = {readfile = readfile, writefile = writefile, isfile = isfile}
getfenv(0).readfile, getfenv(0).writefile, getfenv(0).isfile = nil, nil, nil
getgenv = function() return env end
S.executorEnv = nil
local entry = Mock.add("Executor env", "print('stored')")
assert(Store.canWrite() and Store.save())
scripts = {}
Store.load()
assert(Store.mode == "file" and #scripts == 1 and scripts[1].code == entry.code)
`);

luaTest('a fake isfile helper cannot hide a real saved JSON file on reload', String.raw`
getfenv(0).isfile = nil
S.EnsureCompat()
assert(S.Shimmed("isfile"))
local entry = Mock.add("Real disk", "print('stored')")
assert(Store.save())
_G.BananaCatHub_SavedData = nil
scripts = {}
Store.load()
assert(Store.mode == "file" and #scripts == 1 and scripts[1].code == entry.code)
`);

luaTest('pasting the whole Code Đã Lưu script into Tạo Tính Năng creates and embeds its manager GUI', `
local entry = Mock.add("Existing saved code", Mock.guiCode)
local ft = S.CreateFeatureTab("Code Đã Lưu riêng", "💾", [====[${savedCodeSource}]====])
assert(S.StartFeatureRun(ft, true))
Mock.flush()
local manager = assert(_G.TDZSavedCodeStandalone)
assert(ft.hasRun and manager.Mode == "hub" and manager.Adapter == S.SavedCodeAdapter)
assert(manager.Root.Parent.Parent == ft.hostFrame and manager.Gui.Parent == playerGui)
assert(#manager.Adapter.list() == 1 and manager.Adapter.list()[1] == entry and Mock.executed == 0)
`);

luaTest('the standalone manager and native tab observe the same saved list and mutations', `
local manager = assert(loadstring([====[${savedCodeSource}]====]))()
manager.NameInput.Text, manager.SourceInput.Text = "From separate script", Mock.guiCode
Mock.find(manager.Root, "AddSavedLink").Activated:Fire()
assert(#scripts == 1 and scripts[1].name == "From separate script")
assert(Mock.row("From separate script"))
assert(manager.Adapter.update(scripts[1], "print('changed')"))
assert(Store.serialize().scripts[1].code == "print('changed')")
manager.Adapter.remove(scripts[1])
assert(#scripts == 0 and #manager.Adapter.list() == 0 and #Store.serialize().scripts == 0)
`);

luaTest('closing a separate shared view does not destroy the native manager or its saved data', `
local entry = Mock.add("Shared", Mock.guiCode)
local manager = assert(loadstring([====[${savedCodeSource}]====]))()
local before = 0
for _ in pairs(S.SavedLinks.listeners) do before += 1 end
manager.Destroy()
local after = 0
for _ in pairs(S.SavedLinks.listeners) do after += 1 end
assert(manager.dead and not S.SavedCodeView.dead and before == after + 1)
assert(#scripts == 1 and scripts[1] == entry)
Mock.add("Still working", "print('ok')")
assert(Mock.row("Still working"))
`);

luaTest('Code Đã Lưu manager can be restored into its feature tab without rerunning or duplicating its window', `
local ft = S.CreateFeatureTab("Manager", "💾", [====[${savedCodeSource}]====])
assert(S.StartFeatureRun(ft,true))
Mock.flush()
local manager = assert(_G.TDZSavedCodeStandalone)
Mock.find(ft.frame,"FeatureTabClose").Activated:Fire()
assert(manager.Root.Parent == manager.Gui and not manager.dead)
S.OnFeatureTabOpened(ft)
assert(manager.Root.Parent.Parent == ft.hostFrame and _G.TDZSavedCodeStandalone == manager)
assert(not manager.dead and #featureTabs == 1)
`);

luaTest('the separate manager uses an isolated store when the host lacks the new adapter', `
_G.BananaCatHubAPI = {Version="older hub"}
local manager = assert(loadstring([====[${savedCodeSource}]====]))()
assert(manager.Mode == "standalone" and manager.Adapter ~= S.SavedCodeAdapter)
assert(manager.Adapter.add("Isolated", "print('ok')"))
assert(#scripts == 0 and manager.Adapter.storage().file == "taodepzai_saved_code.json")
`);

luaTest('destroying an embedded manager releases only its observer, not the native tab', `
local ft = S.CreateFeatureTab("Manager", "💾", [====[${savedCodeSource}]====])
assert(S.StartFeatureRun(ft,true))
Mock.flush()
local manager = assert(_G.TDZSavedCodeStandalone)
manager.Gui:Destroy()
Mock.flush()
assert(manager.dead and not S.SavedCodeView.dead)
local count = 0
for _ in pairs(S.SavedLinks.listeners) do count += 1 end
assert(count == 1)
Mock.add("After destruction", "print('ok')")
assert(Mock.row("After destruction"))
`);
