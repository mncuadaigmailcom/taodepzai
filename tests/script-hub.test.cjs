const assert = require('node:assert/strict');
const {test, after} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.join(__dirname, '..');
const normalize = text => text.replace(/\r\n/g, '\n');
const main = normalize(fs.readFileSync(path.join(root, 'script.js'), 'utf8'));
const moduleSource = normalize(fs.readFileSync(path.join(root, 'script-hub.lua'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/script-hub-original.json'), 'utf8'));
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/hub-runtime.luau'), 'utf8') + '\n' +
    fs.readFileSync(path.join(__dirname, 'fixtures/script-hub-runtime.luau'), 'utf8');
function between(start,end) {
    const a=main.indexOf(start), b=main.indexOf(end,a+start.length);
    assert(a>=0 && b>a, `Missing main section ${start}`);
    return main.slice(a,b);
}
const production = [between('function S.RunHubAction(', '\n-- Script Hub GUI moved'),
    `\n_G.BananaCatHubAPI = {ScriptHubBridge=function() return Mock.makeScriptHubBridge() end}\n`,
    `function Mock.openScriptHub() return assert(loadstring([====[${moduleSource}]====]))() end\n`].join('\n');
assert.doesNotMatch(moduleSource,/\]====\]/);
const luau = process.env.LUAU_BIN || 'luau';
const compiler = process.env.LUAU_COMPILE_BIN || 'luau-compile';
const available = binary => !spawnSync(binary,['--help'],{encoding:'utf8'}).error;
const hasLuau = available(luau), hasCompiler = available(compiler);
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'tdz-script-hub-tests-'));
after(()=>fs.rmSync(temp,{recursive:true,force:true}));
let sequence=0;
function luaTest(name, code) {
    test(name,{skip:!hasLuau && 'Install Luau CLI or set LUAU_BIN'},()=>{
        const file=path.join(temp,`${++sequence}.luau`);
        fs.writeFileSync(file, `${fixture}\n${production}\n${code}\nMock.flush()\nprint("ASSERTIONS_OK")\n`);
        const result=spawnSync(luau,[file],{encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});
        assert.ifError(result.error);
        assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout,/ASSERTIONS_OK/);
    });
}

test('the extracted original Script Hub module compiles', {skip:!hasCompiler && 'Install luau-compile'},()=>{
    const result=spawnSync(compiler,['--null',path.join(root,'script-hub.lua')],{encoding:'utf8'});
    assert.ifError(result.error); assert.equal(result.status,0,result.stderr);
});

test('all original named controllers and all catalog items survive the extraction',()=>{
    const all = main + '\n' + moduleSource;
    for(const name of manifest.functions) assert(all.includes(name), `Lost original function: ${name}`);
    const catalog = moduleSource.slice(moduleSource.indexOf('S.ScriptHubList = {'),
        moduleSource.indexOf('\n-- END SCRIPT_HUB_CATALOG'));
    assert.equal(catalog, manifest.catalogSource);
    assert.doesNotMatch(main, /S\.SavedLinks|SavedCodeAdapter|code-da-luu\.lua|EnsureSavedCodeFeature/);
    assert.match(main, /AddTab\("Code Đã Lưu", "💾", 1\)/);
    for(const panel of manifest.panelNames) assert(moduleSource.includes(`Name = "${panel}"`), `Lost panel ${panel}`);
    assert.equal(manifest.panelNames.length,9);
    assert.match(main,/AddTab\("Người Chơi", "👥", 4\)/);
    assert.match(main,/AddTab\("Hỗ Trợ", "🛠", 5\)/);
    assert.match(main,/AddTab\("Thiết Lập", "⚙️", 6\)/);
    assert.match(main,/AddTab\("Tạo Tính Năng", "➕", 7\)/);
});

test('Script Hub has a preconfigured URL feature rather than a copied primary GUI',()=>{
    assert.doesNotMatch(main,/D\.hubTab = AddTab\("Script Hub"|Name = "HubTune_Panel"|Name = "HubGlow_Panel"/);
    assert.match(main,/S\.ScriptHubScriptUrl.*script-hub\.lua/);
    assert.match(main,/S\.CreateFeatureTab\("Script Hub", "📚", S\.ScriptHubScriptUrl/);
    assert.match(main,/builtinId = "script-hub", transient = true, fixedOrder = 3/);
});

luaTest('the module mounts the original catalog and all nine panels without autorunning scripts',String.raw`
local view = Mock.openScriptHub()
assert(view.Gui.Name == "TDZScriptHub" and view.Root.Parent == view.Gui)
assert(view.Gui:GetAttribute("BCHub_External") ~= true)
for _, name in ipairs({"HubTune_Panel","HubAntiBan_Panel","HubFly_Panel","HubSpeed_Panel","HubHighJump_Panel",
    "HubMove_Panel","HubGlow_Panel","HubFree_Panel","HubSafe_Panel"}) do assert(Mock.find(view.Root,name)) end
assert(Mock.find(view.Root,"HubCard_Infinite Yield"))
assert(#hubLog.runs == 0 and #Mock.http == 0 and #scripts == 0)
`);

luaTest('all external script buttons preserve the original code and noPark setting',String.raw`
local view = Mock.openScriptHub()
local n = 0
for _, item in ipairs(S.ScriptHubList) do
    if item.code then
        Mock.find(Mock.find(view.Root,"HubCard_"..item.name),"ScriptHubRun").Activated:Fire()
        n += 1
        assert(hubLog.runs[n].code == item.code and hubLog.runs[n].name == item.name and hubLog.runs[n].noPark)
    end
end
assert(n == 3 and #hubLog.runs == 3)
`);

luaTest('utility buttons dispatch their original action IDs instead of treating them as external payloads',String.raw`
local view = Mock.openScriptHub()
local ids = {}
S.RunHubAction = function(id) ids[#ids+1] = id; return "done" end
for _, item in ipairs(S.ScriptHubList) do
    if item.action then
        Mock.find(Mock.find(view.Root,"HubCard_"..item.name),"ScriptHubRun").Activated:Fire()
        assert(ids[#ids] == item.action)
    end
end
assert(#ids == #S.ScriptHubList - 3 and #hubLog.runs == 0)
`);

luaTest('search and category chips filter the original catalog and show matching panels',String.raw`
local view = Mock.openScriptHub()
D.hubSearchBox.Text = "[missing]"
Mock.flush(0.2)
assert(D.hubList:FindFirstChild("HubCard_Infinite Yield") == nil)
D.hubSearchBox.Text = ""
Mock.flush(0.2)
D.hubChipBtns["Di chuyển"].Activated:Fire()
assert(D.hubList:FindFirstChild("HubCard_Infinite Yield") == nil)
assert(D.hubList:FindFirstChild("HubCard_Bay theo camera"))
assert(Mock.find(view.Root,"HubTune_Panel").Visible and not Mock.find(view.Root,"HubGlow_Panel").Visible)
D.hubChipBtns["Tất cả"].Activated:Fire()
assert(D.hubList:FindFirstChild("HubCard_Infinite Yield"))
`);

luaTest('favorites are persisted and move the original card to the top without dropping its controls',String.raw`
local view = Mock.openScriptHub()
local name = "Dex Explorer"
Mock.find(Mock.find(view.Root,"HubCard_"..name),"ScriptHubFavorite").Activated:Fire()
assert(S.hubFavs[name] and Mock.savedRebuilds > 0)
assert(Mock.find(view.Root,"HubCard_"..name).LayoutOrder == 2)
assert(Mock.find(Mock.find(view.Root,"HubCard_"..name),"ScriptHubCopy"))
`);

luaTest('copy and save retain the original payload and saving after reload uses the live scripts array',String.raw`
local view = Mock.openScriptHub()
local item = S.ScriptHubList[1]
Mock.find(Mock.find(view.Root,"HubCard_"..item.name),"ScriptHubCopy").Activated:Fire()
assert(hubLog.clipboard[1] == item.code)
scripts = {}
Mock.find(Mock.find(view.Root,"HubCard_"..item.name),"ScriptHubSave").Activated:Fire()
Mock.find(Mock.find(view.Root,"HubCard_"..item.name),"ScriptHubSave").Activated:Fire()
assert(#scripts == 2 and scripts[1].code == item.code and scripts[2].name == item.name .. " (2)")
`);

luaTest('server panel still copies the JobId and joins the entered server through original callbacks',String.raw`
local view = Mock.openScriptHub()
D.hubJobCopy.Activated:Fire()
assert(hubLog.clipboard[1] == "mock-job" and D.hubJobIn.Text == "mock-job")
D.hubJobIn.Text = "  'target-server'  "
D.hubJoinBtn.Activated:Fire()
assert(hubLog.joins[1] == "target-server" and hubLog.focus > 0)
`);

luaTest('module reload replaces its own GUI but never resets game controllers or favorites',String.raw`
local first = Mock.openScriptHub()
local move = S.Move
S.hubFavs["Dex Explorer"] = true
local second = Mock.openScriptHub()
assert(first.dead and first.Gui.Parent == nil and not second.dead and S.Move == move)
assert(S.hubFavs["Dex Explorer"])
local count=0
for _, g in ipairs(playerGui:GetChildren()) do if g.Name == "TDZScriptHub" then count += 1 end end
assert(count == 1)
`);

luaTest('destroying the module cancels search and restores controller UI hooks without losing controllers',String.raw`
local prior = S.Move._glassBtns
local view = Mock.openScriptHub()
local move = S.Move
D.hubSearchBox.Text = "pending"
view.Destroy(); view.Destroy()
Mock.flush()
assert(view.dead and view.Gui.Parent == nil and S.Move == move)
assert(S.Move._glassBtns == prior and _G.TDZScriptHubStandalone == nil)
assert(S.RebuildHubList == nil and D.hubList == nil)
`);

luaTest('without a live matching main hub, the module gives a clear error without a half-created GUI',String.raw`
_G.BananaCatHubAPI = nil
local ok, why = pcall(Mock.openScriptHub)
assert(not ok and tostring(why):find("cập nhật",1,true))
assert(_G.TDZScriptHubStandalone == nil)
for _, g in ipairs(playerGui:GetChildren()) do assert(g.Name ~= "TDZScriptHub") end
`);

luaTest('original movement controls apply their input values and stop through the original controller API',String.raw`
local view = Mock.openScriptHub()
Mock.find(view.Root,"TuneFlySpeed").Text = "123"
Mock.find(view.Root,"TuneFlyApply").Activated:Fire()
assert(S.Move.flySpeed == "123")
Mock.find(view.Root,"HighJumpSpeed").Text = "95"
Mock.find(view.Root,"HighJumpApply").Activated:Fire()
local found = false
for _, action in ipairs(hubLog.actions) do if action.name == "SetHighJumpSpeed" then found = true end end
assert(found)
`);

luaTest('mid-mount UI failure cleans partial GUI and restores previously installed UI hooks',String.raw`
local before = S.Move._glassBtns
D.SetBg = nil
local ok, why = pcall(Mock.openScriptHub)
assert(not ok and tostring(why):find("Script Hub GUI",1,true))
assert(D.hubList == nil and S.RebuildHubList == nil and S.Move._glassBtns == before)
for _, g in ipairs(playerGui:GetChildren()) do assert(g.Name ~= "TDZScriptHub") end
`);

luaTest('module destruction restores other page controls and never replaces a newer UI callback',String.raw`
local view = Mock.openScriptHub()
local newer = function() return "newer owner" end
S.SyncSafePanel = newer
view.Destroy()
assert(S.SyncSafePanel == newer)
assert(S.Move.Safe.RefreshPanel ~= S.SyncSafePanel)
assert(D.hubSearchBox == nil and D.hubTab == nil)
`);
