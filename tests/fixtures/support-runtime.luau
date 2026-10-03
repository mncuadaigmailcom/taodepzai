-- Deterministic input/render/raycast/character adapters for the REAL Support module.
-- No Roblox network payloads or engine physics are executed here.
local supportLog = {clipboard={},runs={},saved=0,rayCalls={},bound={}}
Mock.supportLog = supportLog
Color3.fromRGB=function(r,g,b) return {R=r/255,G=g/255,B=b/255} end
Enum.RenderPriority.Camera={Value=100}
local vectorMt = {}
vectorMt.__index = function(v,key)
    if key == "Magnitude" then return math.sqrt(v.X*v.X+v.Y*v.Y+v.Z*v.Z) end
    if key == "Unit" then local m=v.Magnitude; return Vector3.new(v.X/m,v.Y/m,v.Z/m) end
    if key == "Dot" then return function(a,b) return a.X*b.X+a.Y*b.Y+a.Z*b.Z end end
end
vectorMt.__add = function(a,b) return Vector3.new(a.X+b.X,a.Y+b.Y,a.Z+b.Z) end
vectorMt.__sub = function(a,b) return Vector3.new(a.X-b.X,a.Y-b.Y,a.Z-b.Z) end
vectorMt.__mul = function(a,k) return Vector3.new(a.X*k,a.Y*k,a.Z*k) end
vectorMt.__tostring = function(v) return string.format("%.3f, %.3f, %.3f",v.X,v.Y,v.Z) end
Vector3 = {new=function(x,y,z) return setmetatable({X=x or 0,Y=y or 0,Z=z or 0},vectorMt) end}
Vector2 = {new=function(x,y) return Vector3.new(x,y,0) end}
CFrame = {new=function(x,y,z)
    local p=type(x)=="table" and x or Vector3.new(x,y,z)
    return {Position=p,LookVector=Vector3.new(0,0,-1),ToOrientation=function() return 0.1,0.2,0.3 end}
end}
RaycastParams = {new=function() return {} end}
OverlapParams = {new=function() return {} end}
local priorIsA = methods.IsA
function methods:IsA(class)
    if class=="BasePart" then return self.ClassName=="Part" or self.ClassName=="MeshPart" end
    if class=="GuiButton" then return self.ClassName=="TextButton" or self.ClassName=="ImageButton" end
    return priorIsA(self,class)
end
function methods:GetBoundingBox() return self.CFrame,self.Size end
function methods:GetGuiObjectsAtPosition() return supportLog.guiObjects or {} end
local character=New("Model",{Name="Character"},root)
local rootPart=New("Part",{Name="HumanoidRootPart",Position=Vector3.new(10,20,30),CFrame=CFrame.new(10,20,30),
    Size=Vector3.new(2,2,1),Color=Color3.fromRGB(100,150,200),Material=Enum.Material.Plastic},character)
local humanoid=New("Humanoid",{Name="Humanoid",RootPart=rootPart,WalkSpeed=16,Health=90,MaxHealth=100},character)
humanoid.GetState=function() return "Enum.HumanoidStateType.Running" end
local player={PlayerGui=playerGui,Character=character}
function player:GetMouse() return {X=500,Y=400,Target=nil} end
local Players={LocalPlayer=player}
local UIS={InputBegan=signal(),InputEnded=signal(),InputChanged=signal(),TouchEnabled=false,MouseEnabled=true}
function UIS:GetFocusedTextBox() return nil end
local RS={RenderStepped=signal()}
function RS:BindToRenderStep(name,priority,fn) supportLog.bound[name]=fn end
function RS:UnbindFromRenderStep(name) supportLog.bound[name]=nil end
workspace=New("Folder",{Name="Workspace"},root)
local camera={ViewportSize=Vector3.new(1280,720,0)}
function camera:ViewportPointToRay() return {Origin=Vector3.new(0,0,0),Direction=Vector3.new(0,0,-1)} end
workspace.CurrentCamera=camera
function workspace:Raycast(origin,direction,params)
    supportLog.rayCalls[#supportLog.rayCalls+1]={origin=origin,direction=direction,params=params}
    return supportLog.hit
end
function workspace:GetPartBoundsInRadius() return supportLog.parts or {} end
local actualGetService=game.GetService
function game:GetService(name)
    if name=="Players" then return Players end
    if name=="UserInputService" then return UIS end
    if name=="RunService" then return RS end
    if name=="MarketplaceService" then return {GetProductInfo=function() return {Name="Fixture place"} end} end
    return actualGetService(self,name)
end
D={SetBg=function(obj,color) obj.BackgroundColor3=color end,hubStatus=New("TextLabel",{},main)}
local function Button(parent,text,x,y,w,h,color)
    return New("TextButton",{Text=text,Position=UDim2.new(0,x,0,y),Size=UDim2.new(0,w,0,h),BackgroundColor3=color},parent)
end
local function flash(obj,text) obj.Text=text end
local function RunCode(code,name,indicator,times,delay,noPark)
    supportLog.runs[#supportLog.runs+1]={code=code,name=name,noPark=noPark}; return true
end
S.CopyToClipboard=function(text)
    if supportLog.noClipboard then return false end
    supportLog.clipboard[#supportLog.clipboard+1]=text; return true
end
local toggle=New("TextButton",{Text="✕"},gui)
main.Visible=true;gui.Enabled=true
S.Move={Hum=function() return humanoid end,Root=function() return rootPart end,speed=false,runMode=false,
    comp=function(obj,key,dft) return obj and obj[key] or dft end}
local supportWaypoints={}
function Mock.supportBridge()
    return {protocol=1,alive=function() return gui.Parent~=nil end,S=S,D=D,C=C,HubGui=gui,Main=main,ToggleButton=toggle,
        New=New,Label=Label,Button=Button,Corner=Corner,Stroke=Stroke,flash=flash,RunCode=RunCode,
        player=player,Players=Players,RunService=RS,UserInputService=UIS,
        Hit={onHub=function() return supportLog.hubHit==true end,inObject=function() return supportLog.supportHit==true end},
        getWaypoints=function() return supportWaypoints end,saveSoon=function() supportLog.saved+=1 end}
end
function Mock.supportHit(part)
    supportLog.hit={Instance=part or rootPart,Position=Vector3.new(10,0,30),Normal=Vector3.new(0,1,0),Material=Enum.Material.Plastic}
end
Mock.character,Mock.rootPart,Mock.humanoid,Mock.UIS,Mock.RS=character,rootPart,humanoid,UIS,RS
function Mock.replaceSupportWaypoints(list) supportWaypoints=list end
