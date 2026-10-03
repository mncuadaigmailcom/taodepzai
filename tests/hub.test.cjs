const assert = require('node:assert/strict');
const {test, after} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.join(__dirname,'..');
const source = fs.readFileSync(path.join(root,'script.js'),'utf8').replace(/\r\n/g,'\n');
const fixture = fs.readFileSync(path.join(__dirname,'fixtures/hub-runtime.luau'),'utf8');
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
    between('S.parkTab   =','\nS.NO_PARK_MARKERS ='),
    between('S.NO_PARK_MARKERS =', '\nfunction S.RemoveAllParked()'),
    between('function S.BeginRunCapture()', '\nlocal function RunFeatureScript('),
    between('local function RunFeatureScript(','\ntask.spawn(function()\n    task.wait(1)'),
    between('Store.restoreFeatures = function()','\nS.Move = {'),
].join('\n')+`\nS.PARK_MAX=2\n`;
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
test('exactly five primary tabs remain and removed modules have no loaders/bridges/files',()=>{
    const tabs=[...source.matchAll(/AddTab\("([^"]+)", "[^"]+", (\d+)\)/g)]
        .map(m=>({name:m[1],order:Number(m[2])})).sort((a,b)=>a.order-b.order);
    assert.deepEqual(tabs,[{name:'Code Đã Lưu',order:1},{name:'Code',order:2},{name:'Người Chơi',order:3},
        {name:'Thiết Lập',order:4},{name:'Tạo Tính Năng',order:5}]);
    assert.doesNotMatch(source,/EnsureScriptHubFeature|EnsureSupportFeature|ScriptHubScriptUrl|SupportScriptUrl|ScriptHubBridge|SupportBridge|ho-tro\.lua|script-hub\.lua|S\.RunHubAction/);
    assert(!fs.existsSync(path.join(root,'ho-tro.lua')) && !fs.existsSync(path.join(root,'script-hub.lua')));
    assert.match(between('-- BEGIN NATIVE_SAVED_CODE','-- END NATIVE_SAVED_CODE'),/RunCode\(d.code, d.name, runScriptBtn, 1, 0\)/);
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

test('retained controllers/player panels survive while retired module files are removed',()=>{
    const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/retained-features.json'),'utf8'));
    for(const name of manifest.functions) assert(source.includes(name),`Lost retained controller ${name}`);
    for(const panel of manifest.playerPanels) assert(source.includes(`Name = "${panel}"`),`Lost retained Player panel ${panel}`);
    assert.doesNotMatch(source,/D\.hubStatus|D\.hubTab|RebuildHubList/);
    assert.match(source,/Name="PlayerStatus"/);
});

luaTest('reload restores only user-created feature tabs and never recreates the deleted module tabs',String.raw`
Mock.add("Saved","print('keep')")
local a=S.CreateFeatureTab("My A","⚙️","print('a')")
local b=S.CreateFeatureTab("My B","⚙️","print('b')")
assert(Store.save());S.DoReload();Mock.flush()
assert(#featureTabs==2 and #tabs==7 and #scripts==1 and Mock.row("Saved"))
assert(#Mock.http==0 and Mock.executed==0)
assert(featureTabs[1].name=="My A" and featureTabs[2].name=="My B")
assert(featureTabs[1].btn.LayoutOrder==6 and featureTabs[2].btn.LayoutOrder==7)
`);
luaTest('manual feature deletion/recreation preserves the five primary orders and starts user tabs at six',String.raw`
local a=S.CreateFeatureTab("A","⚙️","print('a')")
local b=S.CreateFeatureTab("B","⚙️","print('b')")
assert(a.btn.LayoutOrder==6 and b.btn.LayoutOrder==7)
S.DestroyFeatureTab(a)
local c=S.CreateFeatureTab("C","⚙️","print('c')")
assert(b.btn.LayoutOrder==6 and c.btn.LayoutOrder==7)
assert(savedButton.LayoutOrder==1 and codeButton.LayoutOrder==2 and playerButton.LayoutOrder==3)
assert(settingsButton.LayoutOrder==4 and creatorButton.LayoutOrder==5 and #tabs==7)
`);
luaTest('Code-generated GUI parking is embedded inside Code and never adds a sixth automatic primary tab',String.raw`
codeTab.CanvasSize=UDim2.new(0,0,0,450)
local area,box=S.ParkHost("Owned GUI")
assert(#tabs==5 and #featureTabs==0 and S.parkTab.Parent==codeTab and area.Parent==box)
assert(S.parkTab.Name=="CodeGuiParking" and codeTab.CanvasSize.Y.Offset>450)
local g=New("ScreenGui",{Name="Owned"},playerGui);local frame=New("Frame",{},g)
assert(S.EmbedGui(g,area))
Mock.button(box,"↩ Trả về game").Activated:Fire()
assert(frame.Parent==g and #tabs==5 and S.parkCount==0)
`);
luaTest('feature cleanup is idempotent, leaves all five primary pages and never touches saved scripts',String.raw`
Mock.add("Keep","print('keep')")
S.CreateFeatureTab("User","⚙️","print('user')")
_G.BananaCatHub_FeatureCleanup();_G.BananaCatHub_FeatureCleanup()
assert(#tabs==5 and #featureTabs==0 and #scripts==1 and Mock.row("Keep"))
`);
luaTest('legacy waypoints/favorites/settings remain serialized even though the two UI tabs were removed',String.raw`
waypoints={{name="Existing WP",pos=Vector3.new(3,4,5)}}
S.hubFavs={OldFavorite=true};S.embedEnabled=false
assert(Store.save());Store.load()
local data=Store.serialize()
assert(#data.waypoints==1 and data.waypoints[1].name=="Existing WP")
assert(data.settings.embedEnabled==false and #data.settings.hubFavs==1)
assert(#featureTabs==0 and #tabs==5 and #Mock.http==0)
`);
luaTest('player feedback remains live without a deleted Script Hub status label',`
D.playerStatus=New("TextLabel",{Text=""},playerTab)
${between('function D.Say(msg, color)','\nfunction D.BestText')}
D.Say("Test player result",C.GREEN)
assert(D.playerStatus.Text=="Test player result" and D.playerStatus.TextColor3==C.GREEN)
`);

luaTest('player refresh routes only to retained controls and does not require either withdrawn module',`
local refreshed={loc=0,spec=0,glass=0}
S.SyncLocPanel=function() refreshed.loc+=1 end
S.Spec={RefreshList=function() refreshed.spec+=1 end}
S.GlassRefreshList=function() refreshed.glass+=1 end
${between('function S.Rebuild()','\nS.Loc = {')}
S.Rebuild()
assert(refreshed.loc==1 and refreshed.spec==1 and refreshed.glass==1)
`);
luaTest('manual feature Copy Code still writes into the original native saved list',String.raw`
local ft=S.CreateFeatureTab("User Code","⚙️","print('keep')")
Mock.button(ft.frame,"📤 Chép Code").Activated:Fire()
assert(#scripts==1 and scripts[1].name==ft.name and scripts[1].code==ft.code and Mock.row(ft.name))
assert(#featureTabs==1 and #Store.serialize().features==1)
`);
luaTest('serialized v3 data roundtrips the retained code/user tabs and settings without any module data',String.raw`
Mock.add("Saved","print('saved')");S.CreateFeatureTab("Own","⚙️","print('own')")
S.embedGuessNew=true;S.parkCodeGuis=false
local exported=HttpService:JSONEncode(Store.serialize())
local imported=HttpService:JSONDecode(exported)
assert(imported.version==3 and #imported.scripts==1 and #imported.features==1)
assert(imported.features[1].name=="Own" and imported.settings.parkCodeGuis==false and imported.settings.embedGuessNew)
assert(#Mock.http==0)
`);
