const assert = require('node:assert/strict');
const {test,after}=require('node:test');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const main=fs.readFileSync(path.join(root,'script.js'),'utf8').replace(/\r\n/g,'\n');
const moduleSource=fs.readFileSync(path.join(root,'ho-tro.lua'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/support-original.json'),'utf8'));
const fixture=fs.readFileSync(path.join(__dirname,'fixtures/hub-runtime.luau'),'utf8')+'\n'+
    fs.readFileSync(path.join(__dirname,'fixtures/support-runtime.luau'),'utf8');
const luau=process.env.LUAU_BIN||'luau',compiler=process.env.LUAU_COMPILE_BIN||'luau-compile';
const available=bin=>!spawnSync(bin,['--help'],{encoding:'utf8'}).error;
const hasLuau=available(luau),hasCompiler=available(compiler);
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tdz-support-tests-'));
after(()=>fs.rmSync(temp,{recursive:true,force:true}));
assert.doesNotMatch(moduleSource,/\]====\]/);
const startup=`_G.BananaCatHubAPI={SupportBridge=function() return Mock.supportBridge() end}\nfunction Mock.openSupport() return assert(loadstring([====[${moduleSource}]====]))() end\n`;
let sequence=0;
function luaTest(name,code) {
    test(name,{skip:!hasLuau&&'Install Luau CLI or set LUAU_BIN'},()=>{
        const file=path.join(temp,`${++sequence}.luau`);
        fs.writeFileSync(file,`${fixture}\n${startup}\n${code}\nMock.flush()\nprint("ASSERTIONS_OK")\n`);
        const result=spawnSync(luau,[file],{encoding:'utf8',timeout:15000,maxBuffer:4*1024*1024});
        assert.ifError(result.error);assert.equal(result.status,0,`${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout,/ASSERTIONS_OK/);
    });
}
test('the full Support subsystem compiles as its own Luau module',{skip:!hasCompiler&&'Install luau-compile'},()=>{
    const result=spawnSync(compiler,['--null',path.join(root,'ho-tro.lua')],{encoding:'utf8'});
    assert.ifError(result.error);assert.equal(result.status,0,result.stderr);
});
test('Support becomes a configured URL feature; Code Đã Lưu remains normal/native',()=>{
    assert.doesNotMatch(main,/AddTab\("Hỗ Trợ"|local objectAnalyzeBtn|function S\.FillObjPanel|BC_SpeedHud/);
    assert.match(main,/S\.CreateFeatureTab\("Hỗ Trợ", "🛠", S\.SupportScriptUrl/);
    assert.match(main,/builtinId = "support", transient = true, fixedOrder = 5/);
    assert.match(main,/AddTab\("Code Đã Lưu", "💾", 1\)/);
});
test('all original Support functions, quick sources and action labels survive extraction',()=>{
    for(const name of manifest.functions) assert(moduleSource.includes(name),`Missing ${name}`);
    for(const code of manifest.quickSources) assert(moduleSource.includes(code),`Missing quick script ${code}`);
    for(const label of manifest.labels) assert(moduleSource.includes(label),`Missing action ${label}`);
});
luaTest('mounts the full support page without external script execution, losing native data or a duplicate analyzer',String.raw`
local view=Mock.openSupport()
assert(view.Gui.Name=="TDZSupport" and view.Root.Parent==view.Gui)
assert(Mock.find(view.Root,"SupportAnalyze") and Mock.find(view.Root,"SupportWaypoints"))
assert(Mock.find(view.Root,"SupportTeleport") and view.State.SpeedMeter.btn)
assert(#supportLog.runs==0 and #Mock.http==0 and #supportLog.clipboard==0)
assert(Mock.UIS.InputBegan:Count()==1 and Mock.RS.RenderStepped:Count()==1)
`);
luaTest('quick scripts retain their source and noPark behavior',String.raw`
local view=Mock.openSupport()
local names={"Dex Explorer","Infinite Yield","SimpleSpy v3"}
local i=0
for _,child in ipairs(view.Root:GetChildren()) do
    if child:IsA("TextButton") then
        local label=child:FindFirstChildOfClass("TextLabel")
        if label then
            i+=1;child.Activated:Fire()
            assert(supportLog.runs[i].name==names[i] and supportLog.runs[i].noPark==true)
        end
    end
end
assert(i==3 and #supportLog.runs==3)
`);
luaTest('teleport inputs fill the underfoot position and teleport to the requested XYZ',String.raw`
local view=Mock.openSupport()
Mock.supportHit()
Mock.find(view.Root,"SupportFillPosition").Activated:Fire()
assert(Mock.find(view.Root,"SupportX").Text=="10.000")
Mock.find(view.Root,"SupportX").Text="100"
Mock.find(view.Root,"SupportY").Text="200"
Mock.find(view.Root,"SupportZ").Text="300"
Mock.find(view.Root,"SupportTeleport").Activated:Fire()
assert(Mock.rootPart.CFrame.Position.X==100 and Mock.rootPart.CFrame.Position.Y==200)
`);
luaTest('waypoint save uses the live array after reload and does not autorun or erase old waypoints',String.raw`
local view=Mock.openSupport()
Mock.replaceSupportWaypoints({{name="Old",pos=Vector3.new(1,2,3)}})
view.RefreshWaypoints()
Mock.find(view.Root,"SupportWaypointName").Text="New"
Mock.find(view.Root,"SupportSaveWaypoint").Activated:Fire()
local list=Mock.supportBridge().getWaypoints()
assert(#list==2 and list[1].name=="Old" and list[2].name=="New" and supportLog.saved>0)
`);
luaTest('waypoint go/delete preserve the targeted entry rather than deleting a stale index',String.raw`
local a={name="A",pos=Vector3.new(1,2,3)};local b={name="B",pos=Vector3.new(4,5,6)}
Mock.replaceSupportWaypoints({a,b})
local view=Mock.openSupport()
local rows=Mock.find(view.Root,"SupportWaypoints"):GetChildren()
local row=rows[2]
for _,r in ipairs(rows) do if r:IsA("Frame") then row=r;break end end
Mock.button(row,"🚀 Tới").Activated:Fire();assert(Mock.rootPart.CFrame.Position.X==1)
Mock.replaceSupportWaypoints({b,a})
Mock.button(row,"🗑").Activated:Fire()
local list=Mock.supportBridge().getWaypoints();assert(#list==1 and list[1]==b)
`);
luaTest('right-click analyzer preserves object property/path/highlight and copy actions',String.raw`
local view=Mock.openSupport()
Mock.find(view.Root,"SupportAnalyze").Activated:Fire();Mock.supportHit()
Mock.UIS.InputBegan:Fire({UserInputType=Enum.UserInputType.MouseButton2,Position=Vector2.new(900,400)},false)
assert(view.State.AnaLast.ok and view.State.AnaLast.name=="HumanoidRootPart")
local result=Mock.find(view.Root,"SupportObjectResult")
assert(result:GetAttribute("LastPath"):find("HumanoidRootPart",1,true))
assert(Mock.rootPart:FindFirstChild("BananaCatHub_Highlight"))
Mock.find(view.Root,"SupportCopyHit").Activated:Fire()
Mock.find(view.Root,"SupportCopyPath").Activated:Fire()
assert(#supportLog.clipboard==2)
Mock.find(view.Root,"SupportRemoveHighlight").Activated:Fire()
assert(Mock.rootPart:FindFirstChild("BananaCatHub_Highlight")==nil)
`);
luaTest('copy reports unavailable native clipboard rather than false success',String.raw`
local view=Mock.openSupport();Mock.supportHit();supportLog.noClipboard=true
Mock.find(view.Root,"SupportCopyGround").Activated:Fire()
assert(Mock.find(view.Root,"SupportCopyGround").Text:find("⚠️",1,true) and #supportLog.clipboard==0)
`);
luaTest('speed meter measures game/current/max, renders outside-menu HUD and can stop/reset',String.raw`
local view=Mock.openSupport();local meter=view.State.SpeedMeter
meter.btn.Activated:Fire()
assert(meter.on and supportLog.bound.BC_SpeedMeter and meter.base==16 and meter.hud.Parent==gui)
Mock.rootPart.Position=Vector3.new(11,20,30);supportLog.bound.BC_SpeedMeter(0.1)
assert(meter.live>0 and meter.max>0 and meter.hud.Visible)
meter.resetBtn.Activated:Fire();assert(meter.max==0)
meter.btn.Activated:Fire();assert(not meter.on and supportLog.bound.BC_SpeedMeter==nil)
`);
luaTest('repeat module execution owns one render/input listener, removes its highlight/HUD and keeps waypoint data',String.raw`
local first=Mock.openSupport();first.State.SpeedMeter.btn.Activated:Fire()
Mock.find(first.Root,"SupportAnalyze").Activated:Fire();Mock.supportHit()
Mock.UIS.InputBegan:Fire({UserInputType=Enum.UserInputType.MouseButton2,Position=Vector2.new(900,400)},false)
Mock.find(first.Root,"SupportSaveWaypoint").Activated:Fire()
local second=Mock.openSupport()
assert(first.dead and first.Gui.Parent==nil and not second.dead)
assert(Mock.UIS.InputBegan:Count()==1 and Mock.RS.RenderStepped:Count()==1)
assert(supportLog.bound.BC_SpeedMeter==nil and Mock.rootPart:FindFirstChild("BananaCatHub_Highlight")==nil)
assert(#Mock.supportBridge().getWaypoints()==1)
`);
luaTest('destroying during a touch hold disconnects temporary listeners and prevents later selection',String.raw`
local view=Mock.openSupport();Mock.find(view.Root,"SupportAnalyze").Activated:Fire()
local touch={UserInputType=Enum.UserInputType.Touch,Position=Vector2.new(900,400)}
Mock.UIS.InputBegan:Fire(touch,false)
assert(Mock.UIS.InputEnded:Count()==1 and Mock.UIS.InputChanged:Count()==1)
view.Destroy();Mock.flush(1)
assert(Mock.UIS.InputBegan:Count()==0 and Mock.UIS.InputEnded:Count()==0 and Mock.UIS.InputChanged:Count()==0)
`);
luaTest('destruction is idempotent and restores hub-owned APIs without deleting newer replacements',String.raw`
local view=Mock.openSupport();local newer=function() return "newer" end
S.AnaCam=newer
view.Destroy();view.Destroy();Mock.flush()
assert(S.AnaCam==newer and S.SpeedMeter==nil and _G.TDZSupportStandalone==nil)
assert(Mock.RS.RenderStepped:Count()==0 and supportLog.bound.BC_SpeedMeter==nil)
`);
luaTest('without a live main hub the module errors before installing GUI/input/hooks',String.raw`
_G.BananaCatHubAPI=nil
local ok,why=pcall(Mock.openSupport)
assert(not ok and tostring(why):find("cập nhật",1,true))
assert(Mock.UIS.InputBegan:Count()==0 and Mock.RS.RenderStepped:Count()==0)
`);

luaTest('processed GUI input and hub/menu clicks never select a game object',String.raw`
local view=Mock.openSupport();Mock.find(view.Root,"SupportAnalyze").Activated:Fire();Mock.supportHit()
local i={UserInputType=Enum.UserInputType.MouseButton2,Position=Vector2.new(900,400)}
Mock.UIS.InputBegan:Fire(i,true);assert(not view.State.AnaLast.ok)
supportLog.hubHit=true;Mock.UIS.InputBegan:Fire(i,false)
assert(not view.State.AnaLast.ok and view.State.AnaLast.why:find("menu",1,true))
`);
luaTest('ray fallback and nearest-object actions retain their existing selection behavior',String.raw`
local view=Mock.openSupport();Mock.find(view.Root,"SupportAnalyze").Activated:Fire()
local part=New("Part",{Name="Target",Position=Vector3.new(0,0,-10),CFrame=CFrame.new(0,0,-10),
    Size=Vector3.new(2,2,2),Color=Color3.fromRGB(100,150,200),Material=Enum.Material.Plastic},workspace)
supportLog.hit=nil;supportLog.parts={part}
Mock.UIS.InputBegan:Fire({UserInputType=Enum.UserInputType.MouseButton2,Position=Vector2.new(900,400)},false)
assert(view.State.AnaLast.ok and view.State.AnaLast.name=="Target" and view.State.AnaLast.how:find("quét",1,true))
view.State.AnaUi.nearBtn.Activated:Fire()
assert(view.State.AnaLast.ok and view.State.AnaLast.name=="Target")
`);
luaTest('water hits reraycast through water instead of silently dropping the analyzer feature',String.raw`
local view=Mock.openSupport();Mock.find(view.Root,"SupportAnalyze").Activated:Fire()
local actual=workspace.Raycast;local calls=0
workspace.Raycast=function(self,o,d,p)
    calls+=1
    if calls==1 then return {Instance=Mock.rootPart,Position=Vector3.new(0,0,0),Normal=Vector3.new(0,1,0),Material=Enum.Material.Water} end
    return {Instance=Mock.rootPart,Position=Vector3.new(10,0,30),Normal=Vector3.new(0,1,0),Material=Enum.Material.Plastic}
end
Mock.UIS.InputBegan:Fire({UserInputType=Enum.UserInputType.MouseButton2,Position=Vector2.new(900,400)},false)
assert(calls==2 and view.State.AnaLast.ok and view.State.AnaNote:find("nước",1,true))
`);
luaTest('a valid touch hold picks the object; movement beyond the old threshold cancels picking',String.raw`
local view=Mock.openSupport();Mock.find(view.Root,"SupportAnalyze").Activated:Fire();Mock.supportHit()
local t={UserInputType=Enum.UserInputType.Touch,Position=Vector2.new(900,400)}
Mock.UIS.InputBegan:Fire(t,false);Mock.flush(0.6);Mock.UIS.InputEnded:Fire(t);Mock.flush()
assert(view.State.AnaLast.ok)
view.State.AnaLast.ok=false
local moved={UserInputType=Enum.UserInputType.Touch,Position=Vector2.new(900,400)}
Mock.UIS.InputBegan:Fire(moved,false);moved.Position=Vector2.new(980,400);Mock.UIS.InputChanged:Fire(moved)
Mock.flush(0.6);Mock.UIS.InputEnded:Fire(moved);Mock.flush()
assert(not view.State.AnaLast.ok)
`);
luaTest('destroying Support while center picker yields restores the hub Enabled state',String.raw`
local view=Mock.openSupport();Mock.supportHit()
task.spawn(function() view.State.AnaUi.centerBtn.Activated:Fire() end)
assert(gui.Enabled==false)
view.Destroy();assert(gui.Enabled==true);Mock.flush()
assert(view.dead and gui.Enabled==true and Mock.RS.RenderStepped:Count()==0)
`);
luaTest('real-time coordinate update respects ancestor visibility while keeping the speed HUD independent',String.raw`
local view=Mock.openSupport();Mock.supportHit();Mock.RS.RenderStepped:Fire(0.1)
local found=false
for _,obj in ipairs(view.Root:GetDescendants()) do
    if obj.ClassName=="TextLabel" and obj.Text=="10.000" then found=true end
end
assert(found)
local holder=New("Frame",{Visible=false},main);view.Root.Parent=holder
local before=#supportLog.rayCalls;Mock.RS.RenderStepped:Fire(0.1)
assert(#supportLog.rayCalls==before)
`);

luaTest('mid-mount failure after HUD creation removes every owned GUI/render/input listener',String.raw`
local actualBridge=Mock.supportBridge
Mock.supportBridge=function()
    local b=actualBridge();local actualNew=b.New
    b.New=function(class,props,parent)
        if props and props.Name=="SupportWaypoints" then error("fixture mount failure") end
        return actualNew(class,props,parent)
    end
    return b
end
local ok,why=pcall(Mock.openSupport)
assert(not ok and tostring(why):find("fixture mount failure",1,true))
assert(Mock.UIS.InputBegan:Count()==0 and Mock.RS.RenderStepped:Count()==0 and S.AnaUi==nil)
assert(gui:FindFirstChild("TDZ_SupportSpeedHud")==nil and _G.TDZSupportStandalone==nil)
for _,g in ipairs(playerGui:GetChildren()) do assert(g.Name~="TDZSupport") end
`);
