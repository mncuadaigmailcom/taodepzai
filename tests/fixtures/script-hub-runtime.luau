-- Controllers/services are fake; catalog, dispatch, original GUI and callbacks are production code.
local hubLog = {runs={},actions={},clipboard={},joins={},focus=0}
Mock.hubLog = hubLog
local function controller(defaults)
    return setmetatable(defaults or {}, {__index=function(o,key)
        local fn = function(...)
            hubLog.actions[#hubLog.actions+1] = {name=key,args={...}}
            if key:match("^Status") then return "fixture status" end
            if key == "GetPlacedGlasses" then return {} end
            if key == "GetPlayerFlySpeed" then return 50 end
            if key:match("^Set") then
                local field = key:sub(4,4):lower() .. key:sub(5)
                local args = {...}; o[field] = args[1]
                return true, args[1]
            end
            if key == "IsRunning" then return false end
            return true
        end
        rawset(o,key,fn)
        return fn
    end})
end
S.Move = controller({fly=false,sprint=false,highJump=false,noclip=false,infJump=false,speed=false,
    flySpeed=50,sprintSpeed=50,highJumpSpeed=80,walkSpeed=16,jumpPower=50,speedMode="x",speedMul=3,
    safeAvoidDist=25,playerFlySpeed=50,glassFlySpeed=60})
S.Move.Flight = {showHud=true}
S.Move.Safe = controller({on=false,speed=60,radius=25,steer=4,power=4,threats=0,circleR=20,shieldSize=8,shield=true,noclip=false,circle=false,wall=true,showWall=true,showHud=true,
    lookMul=1.6,lookTime=1,avoidPlayers=true,avoidObjects=true,mode="camera",gap=3,body=8,upBias=0,wallSize=0,wallHeight=0})
S.Glow = controller({on=false,width=20,bright=4,thru=false,light=true,palIdx=1,
    color=Color3.fromRGB(100,200,255),palette={{c=Color3.fromRGB(100,200,255),name="blue"}}})
S.Glow.ColorName = function() return "blue" end
S.Free = controller({on=false,speed=50})
S.Loc = controller({on=false,solo=false,maxDist=0})
S.Spec = controller({on=false})
S.AntiBan = {on=false,busy=false,reason="",hops=0,pings=0,last=0}
local MV, GL, FR = S.Move, S.Glow, S.Free
local function mvClamp(n,lo,hi,dft) return math.clamp(tonumber(n) or dft or lo,lo,hi) end
local function ReleaseHubFocus() hubLog.focus += 1 end
local function RunCode(code,name,indicator,repeats,delay,noPark)
    hubLog.runs[#hubLog.runs+1] = {code=code,name=name,noPark=noPark}
    return true
end
local function flash(obj,text) obj.Text=text end
D = {}
D.SetBg = function(obj,color) obj.BackgroundColor3=color end
D.Shade = function() end
D.Tactile = function() end
D.Edge = function(color) return color end
D.BestText = function() return C.WHITE end
D.SyncPageChips = function() end
D.Say = function(text,color) hubLog.message=text; if D.hubStatus then D.hubStatus.Text=text end end
function S.GetJobId() return "mock-job" end
function S.JoinServer(id) hubLog.joins[#hubLog.joins+1]=id end
function S.CopyToClipboard(text) hubLog.clipboard[#hubLog.clipboard+1]=text; return true end
function S.GetGlobal(name) return getfenv(0)[name] end
function S.Rebuild() if S.RebuildHubList then S.RebuildHubList() end end
function S.DoReload() hubLog.actions[#hubLog.actions+1]={name="reload"} end
S.MoveActionState = {fly=function() return MV.fly end,camspeed=function() return MV.sprint end,
    highjump=function() return MV.highJump end,noclip=function() return MV.noclip end}
local actualGetService = game.GetService
function game:GetService(name)
    if name == "UserInputService" then return {GetFocusedTextBox=function() return nil end} end
    if name == "Players" then return {LocalPlayer={PlayerGui=playerGui},GetPlayers=function() return {} end} end
    return actualGetService(self,name)
end
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local Store = {saveSoon=function() Mock.savedRebuilds += 1 end}
local function RebuildScripts() Mock.savedRebuilds += 1 end
function Mock.makeScriptHubBridge()
    return {protocol=1,alive=function() return gui.Parent ~= nil end,S=S,D=D,C=C,Move=MV,Glow=GL,Free=FR,
        New=New,Corner=Corner,Stroke=Stroke,flash=flash,RunCode=RunCode,ReleaseHubFocus=ReleaseHubFocus,
        mvClamp=mvClamp,Players=Players,player=player,Store=Store,RebuildScripts=RebuildScripts,
        getScripts=function() return scripts end}
end
