const assert = require('node:assert/strict');
const {test, after} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.join(__dirname,'..');
const source = fs.readFileSync(path.join(root,'script.js'),'utf8').replace(/\r\n/g,'\n');
const moduleSource = fs.readFileSync(path.join(root,'script-hub.lua'),'utf8');
const fixture = fs.readFileSync(path.join(__dirname,'fixtures/hub-runtime.luau'),'utf8');
const controllerFixture = fs.readFileSync(path.join(__dirname,'fixtures/script-hub-runtime.luau'),'utf8');
const supportSource = fs.readFileSync(path.join(root,'ho-tro.lua'),'utf8');
const supportFixture = fs.readFileSync(path.join(__dirname,'fixtures/support-runtime.luau'),'utf8');
assert.doesNotMatch(supportSource,/\]====\]/);
const setupSupport = `${supportFixture}\n_G.BananaCatHubAPI={SupportBridge=function() return Mock.supportBridge() end}\n`;
assert.doesNotMatch(moduleSource,/\]====\]/);
function between(start,end) {
    const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
    assert(a>=0 && b>a,`Missing production section ${start}`);
    return source.slice(a,b);
}
const production = [
    between('function S.SanitizeCode(c)','\nfunction D.SyncPageChips()'),
    between('-- BEGIN FEATURE_LIFECYCLE','-- END FEATURE_LIFECYCLE'),
    between('local Store = {}','\n-- ----------------------------------------------------------------------------\nS.compatAdded'),
    between('S.compatAdded  =','\nlocal function ExecOnce('),
    between('local function ExecOnce(','\nlocal function Label('),
    between('function S.CopyToClipboard(text)','\nfunction S.FetchServers('),
    // Native Save control and saved list are production code, not a second implementation.
    'local nameIn=New("TextBox",{Text=""},codeTab)\nlocal codeIn=New("TextBox",{Text=""},codeTab)\nlocal saveBtn=New("TextButton",{},codeTab)\nlocal statusLbl=New("TextLabel",{},codeTab)\nlocal function flash(obj,text) obj.Text=text end\n',
    between('-- BEGIN NATIVE_SAVED_CODE','-- END NATIVE_SAVED_CODE').replace('local RebuildScripts\n',''),
    between('local function NormalizeCode(c)','\nlocal GAME_OWNED_GUI_NAMES'),
    between('S.EMBED_TRY_DELAYS   =','\nS.parkTab   ='),
    between('S.NO_PARK_MARKERS =', '\nfunction S.RemoveAllParked()'),
    between('function S.BeginRunCapture()', '\nlocal function RunFeatureScript('),
    between('local function RunFeatureScript(','\ntask.spawn(function()\n    task.wait(1)'),
    between('Store.restoreFeatures = function()','\nS.Move = {'),
].join('\n')+`\nS.PARK_MAX=2\nS.SupportScriptUrl="https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/ho-tro.lua"\nS.ScriptHubScriptUrl = "https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/script-hub.lua"\n`;
const setupModule = `${controllerFixture}\n${between('function S.RunHubAction(','\n-- Script Hub GUI moved')}\n_G.BananaCatHubAPI={ScriptHubBridge=function() return Mock.makeScriptHubBridge() end}\n`;
const luau=process.env.LUAU_BIN||'luau', compiler=process.env.LUAU_COMPILE_BIN||'luau-compile';
const available=bin=>!spawnSync(bin,['--help'],{encoding:'utf8'}).error;
const hasLuau=available(luau),hasCompiler=available(compiler);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tdz-main-tests-'));
after(()=>fs.rmSync(temp,{recursive:true,force:true}));
let sequence=0;
function luaTest(name,code) {
    test(name,{skip:!hasLuau && 'Install Luau CLI or set LUAU_BIN'},()=>{
        const file=path.join(temp,`${++sequence}.luau`);
        fs.writeFileSync(file,`${fixture}\n${production}\n${code}\nMock.flush()\nprint("ASSERTIONS_OK")\n`);
        const result=spawnSync(luau,[file],{encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});
        assert.ifError(result.error);assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout,/ASSERTIONS_OK/);
    });
}

test('main compiles as Luau, including local/register limits',{skip:!hasCompiler&&'Install luau-compile'},()=>{
    const result=spawnSync(compiler,['--null',path.join(root,'script.js')],{encoding:'utf8'});
    assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
});
test('Code Đã Lưu is native as in the original; ONLY Script Hub is a URL module',()=>{
    assert.match(source,/AddTab\("Code Đã Lưu", "💾", 1\)/);
    const ui=between('-- BEGIN NATIVE_SAVED_CODE','-- END NATIVE_SAVED_CODE');
    assert.match(ui,/RunCode\(d.code, d.name, runScriptBtn, 1, 0\)/);
    assert.doesNotMatch(ui,/CreateFeatureTab|HttpGet|SavedCodeAdapter/);
    assert.doesNotMatch(source,/code-da-luu\.lua|S\.SavedLinks|EnsureSavedCodeFeature|SavedCodeAdapter|BuiltinSavedScripts/);
    assert.match(source,/S\.CreateFeatureTab\("Script Hub", "📚", S\.ScriptHubScriptUrl/);
    assert.doesNotMatch(source,/Name = "HubTune_Panel"|D\.hubTab = AddTab\("Script Hub"/);
});
test('main is shorter and smaller than BOTH the original and previous incorrect version',()=>{
    const bytes=fs.statSync(path.join(root,'script.js')).size, lines=source.split('\n').length-1;
    assert(bytes<559899 && lines<12854,`Not smaller than original: ${bytes} bytes / ${lines} lines`);
    assert(bytes<493810 && lines<11562,`Not smaller than previous version: ${bytes} bytes / ${lines} lines`);
});

luaTest('native saved-code startup is available offline without a dynamic tab, download or autorun',String.raw`
assert(Mock.find(savedCodeTab,"SavedCodeSearch") and Mock.find(savedCodeTab,"SavedCodeList"))
assert(savedButton.LayoutOrder==1 and codeButton.LayoutOrder==2 and #featureTabs==0)
assert(#scripts==0 and #Mock.http==0 and Mock.executed==0 and S.SavedLinks==nil)
`);
luaTest('saving from Code preserves inline source and duplicate names without executing it',String.raw`
nameIn.Text,codeIn.Text="Own", "_G.Mock.executed += 1"
saveBtn.Activated:Fire(); saveBtn.Activated:Fire()
assert(#scripts==2 and scripts[1].name=="Own" and scripts[2].name=="Own (2)")
assert(Mock.row("Own") and #Mock.http==0 and Mock.executed==0)
`);
luaTest('blank code is rejected; empty names still get an original-style generated name',String.raw`
saveBtn.Activated:Fire(); assert(#scripts==0)
codeIn.Text="print('ok')"; saveBtn.Activated:Fire()
assert(#scripts==1 and scripts[1].name=="Script 1")
`);
luaTest('native saved-code Run uses the normal Code runner and never creates a feature tab',String.raw`
local entry=Mock.add("Inline","_G.Mock.executed += 1")
Mock.find(Mock.row(entry.name),"SavedCodeRun").Activated:Fire(); Mock.flush()
assert(Mock.executed==1 and #featureTabs==0 and #Mock.http==0)
assert(Mock.find(Mock.row(entry.name),"SavedCodeRun").Text=="▶ Chạy")
`);
luaTest('raw URLs remain supported through the normal Code runner',String.raw`
local url="https://example.test/inline.lua"
Mock.sources[url]="_G.Mock.executed += 1"
Mock.add("Raw",url)
Mock.find(Mock.row("Raw"),"SavedCodeRun").Activated:Fire(); Mock.flush()
assert(Mock.executed==1 and #Mock.http==1 and #featureTabs==0)
`);
luaTest('a saved syntax error is reported and a different saved source can run afterwards',String.raw`
Mock.add("Broken","invalid Luau ???")
Mock.find(Mock.row("Broken"),"SavedCodeRun").Activated:Fire(); Mock.flush(0.5)
assert(S.lastRunReport.fail==1 and Store.statusLbl.Text:find("❌",1,true))
Mock.add("Good","_G.Mock.executed += 1")
Mock.find(Mock.row("Good"),"SavedCodeRun").Activated:Fire(); Mock.flush()
assert(Mock.executed==1 and #featureTabs==0)
`);
luaTest('search is literal, expand preserves the original read-only source preview',String.raw`
local e=Mock.add("A [tag]","print('A')")
Mock.add("Other","print('B')")
Mock.find(savedCodeTab,"SavedCodeSearch").Text="[tag]"; Mock.flush(0.2)
assert(Mock.row("A [tag]"))
local rows=Mock.find(savedCodeTab,"SavedCodeList"):GetChildren(); local n=0
for _,row in ipairs(rows) do if row.Name=="SavedCodeRow" then n+=1 end end
assert(n==1)
Mock.find(Mock.row(e.name),"SavedCodeExpand").Activated:Fire()
assert(e.expanded and Mock.find(Mock.row(e.name),"SavedCodeSource").Text==e.code)
assert(Mock.find(Mock.row(e.name),"SavedCodeSource").TextEditable==false)
`);
luaTest('copy without a native clipboard selects source instead of falsely claiming success',String.raw`
local e=Mock.add("Copy","print('copy')"); e.expanded=true; RebuildScripts()
Mock.find(Mock.row(e.name),"SavedCodeCopy").Activated:Fire()
local box=Mock.find(Mock.row(e.name),"SavedCodeSource")
assert(box._focused and box.SelectionStart==1 and box.CursorPosition==#e.code+1)
`);
luaTest('deletion removes only the selected native saved item',String.raw`
Mock.add("A","print('A')"); Mock.add("B","print('B')")
Mock.find(Mock.row("A"),"SavedCodeDelete").Activated:Fire()
assert(#scripts==1 and scripts[1].name=="B" and #featureTabs==0)
`);
luaTest('deleting a row during a yielded run does not resurrect that GUI row or crash its completion reporter',String.raw`
Mock.add("Slow","task.wait(1)\n_G.Mock.executed += 1")
Mock.find(Mock.row("Slow"),"SavedCodeRun").Activated:Fire()
Mock.find(Mock.row("Slow"),"SavedCodeDelete").Activated:Fire()
Mock.flush(); assert(#scripts==0 and #featureTabs==0)
`);
luaTest('legacy file reload preserves native code/expanded state, waypoints and favorite settings without autorun',String.raw`
local e=Mock.add("Legacy","print('kept')"); e.expanded=true
waypoints={{name="WP",pos=Vector3.new(1,2,3)}}
S.hubFavs={Favorite=true}; assert(Store.save())
scripts={};waypoints={};Store.load();RebuildScripts()
assert(#scripts==1 and scripts[1].code==e.code and scripts[1].expanded)
assert(#waypoints==1 and S.hubFavs.Favorite and Mock.row("Legacy") and Mock.executed==0)
`);
luaTest('disk-write errors retain data in RAM and native save status does not claim persistence',String.raw`
getfenv(0).writefile=function() error("disk full") end
nameIn.Text,codeIn.Text="Keep","print('keep')";saveBtn.Activated:Fire();Mock.flush()
assert(Store.mode=="memory" and _G.BananaCatHub_SavedData.scripts[1].name=="Keep")
assert(Store.statusLbl.Text:find("disk full",1,true))
`);
luaTest('native clipboard support is detected outside _G',String.raw`
local copied
getfenv(0).setclipboard=function(text) copied=text end
assert(S.CopyToClipboard("native") and copied=="native")
`);
luaTest('storage finds real getgenv APIs and rejects a false isfile compatibility stub',String.raw`
local wr,rd=writefile,readfile
local gen={writefile=wr,readfile=rd}
getfenv(0).getgenv=function() return gen end
S.executorEnv=nil -- simulate APIs provided before a fresh hub startup
getfenv(0).writefile,getfenv(0).readfile=nil,nil
Mock.add("Env","print('stored')");assert(Store.save())
_G.BananaCatHub_SavedData=nil;scripts={};Store.load();RebuildScripts()
assert(#scripts==1 and Store.mode=="file" and Mock.row("Env"))
`);

luaTest('Script Hub is the only preconfigured feature and keeps native tab orders',String.raw`
local ft=S.EnsureScriptHubFeature()
assert(#featureTabs==1 and ft.builtinId=="script-hub" and ft.btn.LayoutOrder==3)
assert(savedButton.LayoutOrder==1 and codeButton.LayoutOrder==2 and ft.transient)
assert(S.EnsureScriptHubFeature()==ft and #Mock.http==0)
`);
luaTest('Script Hub loads the original module via its URL and embeds it without touching the native saved list',`
${setupModule}
Mock.sources[S.ScriptHubScriptUrl]=[====[${moduleSource}]====]
local ft=S.EnsureScriptHubFeature();Mock.button(ft.frame,"▶ Chạy Script").Activated:Fire();Mock.flush()
local view=assert(_G.TDZScriptHubStandalone)
assert(ft.hasRun and view.Root.Parent.Parent==ft.hostFrame and #Mock.http==1)
assert(Mock.find(view.Root,"HubTune_Panel") and Mock.find(view.Root,"HubSafe_Panel"))
assert(Mock.find(savedCodeTab,"SavedCodeList") and savedButton.LayoutOrder==1)
`);
luaTest('HTTP error is visible and retry uses the same Script Hub feature',`
${setupModule}
local ft=S.EnsureScriptHubFeature();assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.state=="error" and ft.status.Text:find("404",1,true))
Mock.sources[S.ScriptHubScriptUrl]=[====[${moduleSource}]====]
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.hasRun and #featureTabs==1 and #Mock.http==2)
`);
luaTest('module syntax failure releases the feature owner for retry',String.raw`
Mock.sources[S.ScriptHubScriptUrl]="invalid Luau ???"
local ft=S.EnsureScriptHubFeature();assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.state=="error" and S.featureRunOwner==nil and S.activeHook==nil)
`);
luaTest('a mid-mount UI error cleans partial GUI and can retry without replacing game controllers',`
${setupModule}
Mock.sources[S.ScriptHubScriptUrl]=[====[${moduleSource}]====]; D.SetBg=nil
local ft=S.EnsureScriptHubFeature();assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.state=="error" and _G.TDZScriptHubStandalone==nil and D.hubList==nil)
D.SetBg=function(obj,color) obj.BackgroundColor3=color end
assert(S.StartFeatureRun(ft,true));Mock.flush();assert(ft.hasRun)
`);
luaTest('close/reopen restores Script Hub GUI with no extra download',`
${setupModule}
Mock.sources[S.ScriptHubScriptUrl]=[====[${moduleSource}]====]
local ft=S.EnsureScriptHubFeature();assert(S.StartFeatureRun(ft,true));Mock.flush()
local view=_G.TDZScriptHubStandalone
Mock.find(ft.frame,"FeatureTabClose").Activated:Fire();assert(view.Root.Parent==view.Gui and activeTab==codeTab)
ft.btn.Activated:Fire();Mock.flush()
assert(view.Root.Parent.Parent==ft.hostFrame and #Mock.http==1 and not view.dead)
`);
luaTest('two Run clicks while HTTP yields create only one module/job',`
${setupModule}
local actual=game.HttpGet;game.HttpGet=function(self,url) task.wait(1);return actual(self,url) end
Mock.sources[S.ScriptHubScriptUrl]=[====[${moduleSource}]====]
local ft=S.EnsureScriptHubFeature();local b=Mock.button(ft.frame,"▶ Chạy Script")
b.Activated:Fire();b.Activated:Fire();Mock.flush()
assert(ft.hasRun and #featureTabs==1 and #Mock.http==1)
`);
luaTest('deleting Script Hub during yielded HTTP cancels late module creation',`
${setupModule}
local actual=game.HttpGet;game.HttpGet=function(self,url) task.wait(2);return actual(self,url) end
Mock.sources[S.ScriptHubScriptUrl]=[====[${moduleSource}]====]
local ft=S.EnsureScriptHubFeature();assert(S.StartFeatureRun(ft,true) and ft.running)
S.DestroyFeatureTab(ft);Mock.flush()
assert(S.scriptHubFeature==nil and _G.TDZScriptHubStandalone==nil and S.activeHook==nil)
`);
luaTest('the normal saved runner is blocked while a feature owns GUI capture and reports the actual reason',String.raw`
local ft=S.CreateFeatureTab("Slow","⚙️","task.wait(1)")
assert(S.StartFeatureRun(ft,true) and ft.running)
Mock.add("Wait","_G.Mock.executed += 1")
Mock.find(Mock.row("Wait"),"SavedCodeRun").Activated:Fire()
assert(Store.statusLbl.Text:find("khởi chạy",1,true) and Mock.executed==0)
Mock.flush(); assert(Mock.executed==0)
`);
luaTest('feature start is blocked while the native Code runner is active',String.raw`
assert(RunCode("task.wait(1)","Code",nil,1,0))
local ft=S.CreateFeatureTab("User","⚙️","print('user')")
local ok,why=S.StartFeatureRun(ft,true)
assert(not ok and why:find("Code",1,true));Mock.flush()
`);
luaTest('serialize keeps native saved items and user features but never duplicates the configured module',String.raw`
local ft=S.EnsureScriptHubFeature()
Mock.add("Keep","print('keep')")
local user=S.CreateFeatureTab("User","⚙️","print('user')")
Mock.button(ft.frame,"📤 Chép Code").Activated:Fire()
local data=Store.serialize()
assert(#data.scripts==1 and #data.features==1 and data.features[1].name==user.name)
`);
luaTest('native reload keeps the one module feature and restores user features without autorun',String.raw`
local ft=S.EnsureScriptHubFeature()
Mock.add("Saved","print('saved')")
S.CreateFeatureTab("User","⚙️","print('user')");assert(Store.save())
S.DoReload();Mock.flush()
assert(S.scriptHubFeature==ft and #featureTabs==3 and #scripts==1 and Mock.row("Saved"))
assert(#Mock.http==0 and Mock.executed==0 and savedButton.LayoutOrder==1)
`);
luaTest('dynamic feature deletion preserves native rails and the fixed Script Hub rail',String.raw`
local hub=S.EnsureScriptHubFeature()
local a=S.CreateFeatureTab("A","⚙️","print('a')")
local b=S.CreateFeatureTab("B","⚙️","print('b')")
assert(a.btn.LayoutOrder==8 and b.btn.LayoutOrder==9)
S.DestroyFeatureTab(a)
assert(b.btn.LayoutOrder==8 and hub.btn.LayoutOrder==3 and savedButton.LayoutOrder==1)
`);
luaTest('manually created feature toolbar still executes and stores its inline code',String.raw`
local ft=S.CreateFeatureTab("User","⚙️","_G.Mock.executed += 1")
Mock.button(ft.frame,"▶ Chạy Script").Activated:Fire();Mock.flush()
assert(ft.hasRun and Mock.executed==1 and #Store.serialize().features==1)
`);
luaTest('feature source edits preserve original editor behavior and invalidate prior capture safely',String.raw`
local ft=S.CreateFeatureTab("Edit","⚙️","_G.Mock.executed += 1")
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.setSource("_G.Mock.executed += 2"))
assert(not ft.hasRun and ft.records==nil and S.StartFeatureRun(ft,true));Mock.flush()
assert(Mock.executed==3 and ft.setSource("   ")==false)
`);
luaTest('global feature cleanup is idempotent and leaves the original saved tab/data intact',String.raw`
Mock.add("Keep","print('keep')");S.EnsureScriptHubFeature()
_G.BananaCatHub_FeatureCleanup();_G.BananaCatHub_FeatureCleanup()
assert(#featureTabs==0 and #scripts==1 and Mock.row("Keep") and savedCodeTab.Parent)
`);
luaTest('missing compiler produces an honest error without requesting remote source',String.raw`
local ft=S.EnsureScriptHubFeature();getfenv(0).loadstring=false
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.state=="error" and ft.error:find("loadstring",1,true) and #Mock.http==0)
`);

luaTest('an immediately completing noPark Code run never retains a dead coroutine',String.raw`
assert(RunCode("_G.Mock.executed += 1","Immediate",nil,1,0,true))
assert(Mock.executed==1 and not runActive and curThread==nil)
`);
luaTest('canceling a yielded native saved run removes capture and prevents late side effects',String.raw`
Mock.add("Stop","task.wait(2)\n_G.Mock.executed += 1")
Mock.find(Mock.row("Stop"),"SavedCodeRun").Activated:Fire()
Cancel();Mock.flush()
assert(Mock.executed==0 and not runActive and S.activeCap==nil and S.activeHook==nil)
assert(#scripts==1 and Mock.row("Stop"))
`);
luaTest('Code repeat controls still execute inline sources the requested number of times',String.raw`
assert(RunCode("_G.Mock.executed += 1","Repeat",nil,3,0.1))
Mock.flush();assert(Mock.executed==3 and S.lastRunReport.ok==3 and not runActive)
`);
luaTest('GUI parking/embedding disabled still runs the normal saved source outside feature tabs',String.raw`
S.embedEnabled=false
Mock.add("Outside","_G.Mock.executed += 1")
Mock.find(Mock.row("Outside"),"SavedCodeRun").Activated:Fire();Mock.flush()
assert(Mock.executed==1 and #featureTabs==0 and #S.embeds==0)
`);

luaTest('a user-created feature still embeds its GUI and explicitly reruns without duplicating its tab',String.raw`
local ft=S.CreateFeatureTab("Original GUI","⚙️",Mock.guiCode)
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.hasRun and Mock.executed==1 and Mock.embedded==1 and #featureTabs==1)
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(Mock.executed==2 and #featureTabs==1 and #Store.serialize().features==1)
`);
luaTest('late GUI records are embedded by the existing feature capture helpers',String.raw`
local ft=S.CreateFeatureTab("Late","⚙️","task.delay(3,function()\n"..Mock.guiCode.."\nend)")
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.hasRun and Mock.executed==1 and Mock.embedded==1)
`);
luaTest('disabling feature embedding does not prevent the original source from executing',String.raw`
S.embedEnabled=false
local ft=S.CreateFeatureTab("Outside","⚙️",Mock.guiCode)
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.hasRun and Mock.executed==1 and Mock.embedded==0 and #S.embeds==0)
`);

luaTest('Hỗ Trợ URL tab is preinstalled at original order 5 without moving the native saved-code tab',String.raw`
local hub=S.EnsureScriptHubFeature();local support=S.EnsureSupportFeature()
assert(hub.btn.LayoutOrder==3 and support.btn.LayoutOrder==5 and support.builtinId=="support")
assert(support.transient and savedButton.LayoutOrder==1 and codeButton.LayoutOrder==2)
assert(S.EnsureSupportFeature()==support and #featureTabs==2 and #Mock.http==0)
assert(_G.TDZSupportStandalone==nil and Mock.find(savedCodeTab,"SavedCodeList"))
`);
luaTest('Hỗ Trợ downloads the full source and embeds the module through the same feature pipeline as Script Hub',`
${setupSupport}
Mock.sources[S.SupportScriptUrl]=[====[${supportSource}]====]
local ft=S.EnsureSupportFeature();Mock.button(ft.frame,"▶ Chạy Script").Activated:Fire();Mock.flush()
local view=assert(_G.TDZSupportStandalone)
assert(ft.hasRun and view.Root.Parent.Parent==ft.hostFrame)
assert(#Mock.http==1 and Mock.http[1]==S.SupportScriptUrl)
assert(Mock.find(view.Root,"SupportAnalyze") and Mock.find(view.Root,"SupportTeleport"))
assert(Mock.find(view.Root,"SupportWaypoints") and savedButton.LayoutOrder==1)
`);
luaTest('Hỗ Trợ HTTP failure is retryable without duplicate tabs/input/render connections',`
${setupSupport}
local ft=S.EnsureSupportFeature();assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.state=="error" and _G.TDZSupportStandalone==nil and Mock.UIS.InputBegan:Count()==0)
Mock.sources[S.SupportScriptUrl]=[====[${supportSource}]====]
assert(S.StartFeatureRun(ft,true));Mock.flush()
assert(ft.hasRun and #featureTabs==1 and #Mock.http==2)
assert(Mock.UIS.InputBegan:Count()==1 and Mock.RS.RenderStepped:Count()==1)
`);
luaTest('Hỗ Trợ close/reopen preserves its GUI and controls without reloading the source',`
${setupSupport}
Mock.sources[S.SupportScriptUrl]=[====[${supportSource}]====]
local ft=S.EnsureSupportFeature();assert(S.StartFeatureRun(ft,true));Mock.flush()
local view=_G.TDZSupportStandalone
Mock.find(ft.frame,"FeatureTabClose").Activated:Fire();assert(view.Root.Parent==view.Gui and activeTab==codeTab)
ft.btn.Activated:Fire();Mock.flush()
assert(view.Root.Parent.Parent==ft.hostFrame and #Mock.http==1 and not view.dead)
assert(Mock.UIS.InputBegan:Count()==1)
`);
luaTest('save/reload retains both configured URL tabs while only storing native scripts and user features',String.raw`
local h=S.EnsureScriptHubFeature();local s=S.EnsureSupportFeature()
Mock.add("Normal saved code","print('keep')")
S.CreateFeatureTab("User feature","⚙️","print('user')")
assert(Store.save());S.DoReload();Mock.flush()
assert(S.scriptHubFeature==h and S.supportFeature==s and #featureTabs==3)
assert(#Store.serialize().features==1 and #scripts==1 and Mock.row("Normal saved code"))
assert(h.btn.LayoutOrder==3 and s.btn.LayoutOrder==5 and #Mock.http==0)
`);
luaTest('delete Support while HTTP yields prevents a late GUI/input hook and releases the feature owner',`
${setupSupport}
Mock.sources[S.SupportScriptUrl]=[====[${supportSource}]====]
local actual=game.HttpGet;game.HttpGet=function(self,url) task.wait(2);return actual(self,url) end
local ft=S.EnsureSupportFeature();assert(S.StartFeatureRun(ft,true) and ft.running)
S.DestroyFeatureTab(ft);Mock.flush()
assert(S.supportFeature==nil and _G.TDZSupportStandalone==nil and S.featureRunOwner==nil)
assert(Mock.UIS.InputBegan:Count()==0 and Mock.RS.RenderStepped:Count()==0)
`);
