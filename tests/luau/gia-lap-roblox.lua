-- ============================================================
-- Stub Roblox API — đủ để LOAD và chạy hub trong Luau thật (WASM)
-- ============================================================
local PRINT_LOG = {}
local real_print = print
_G.__prints = PRINT_LOG
local function log(...)
    local parts = {}
    for i = 1, select("#", ...) do parts[i] = tostring((select(i, ...))) end
    PRINT_LOG[#PRINT_LOG + 1] = table.concat(parts, " ")
end
print, warn = log, log

-- ---- Signal ----
local Signal = {}
Signal.__index = Signal
function Signal.new() return setmetatable({ _fns = {} }, Signal) end
function Signal:Connect(fn)
    local c = {}
    c.Connected = true
    self._fns[#self._fns + 1] = { fn = fn, c = c }
    function c:Disconnect()
        self.Connected = false
        for i, e in ipairs(self._owner._fns) do
            if e.c == self then table.remove(self._owner._fns, i) break end
        end
    end
    c._owner = self
    return c
end
function Signal:Fire(...)
    for _, e in ipairs({ table.unpack(self._fns) }) do
        if e.c.Connected then pcall(e.fn, ...) end
    end
end
function Signal:Wait()
    local done, val = false, nil
    local c = self:Connect(function(v) done, val = true, v end)
    while not done do coroutine.yield() end
    c:Disconnect()
    return val
end

-- ---- Roblox kiểu dữ liệu ----
local function mkclass(name, fields, methods)
    local t = {}
    t.__index = function(self, k)
        local v = fields[k]
        if v ~= nil then return v end
        local m = methods[k]
        if m then return m end
        return nil
    end
    t.__tostring = function() return name end
    return function(...)
        local args = { ... }
        local o = {}
        for i, f in ipairs(fields.__order or {}) do o[f] = args[i] end
        for k, v in pairs(fields) do if k ~= "__order" then o[k] = v end end
        return setmetatable(o, t)
    end, t
end

Vector3 = {}
function Vector3.new(x, y, z) return setmetatable({ X = x or 0, Y = y or 0, Z = z or 0, _rbx = "Vector3" }, Vector3) end
Vector3.zero = Vector3.new(0, 0, 0)
Vector3.__index = function(t, k)
    if k == "Magnitude" then return math.sqrt(t.X * t.X + t.Y * t.Y + t.Z * t.Z) end
    if k == "Unit" then local m = math.sqrt(t.X^2 + t.Y^2 + t.Z^2); if m == 0 then return Vector3.zero end return Vector3.new(t.X/m, t.Y/m, t.Z/m) end
    return rawget(t, k)
end
Vector3.__add = function(a, b) return Vector3.new(a.X + b.X, a.Y + b.Y, a.Z + b.Z) end
Vector3.__sub = function(a, b) return Vector3.new(a.X - b.X, a.Y - b.Y, a.Z - b.Z) end
Vector3.__mul = function(a, b) if type(a) == "number" then return Vector3.new(a * b.X, a * b.Y, a * b.Z) end if type(b) == "number" then return Vector3.new(a.X * b, a.Y * b, a.Z * b) end return Vector3.new(a.X * b.X, a.Y * b.Y, a.Z * b.Z) end
Vector3.__div = function(a, b) if type(b) == "number" then return Vector3.new(a.X / b, a.Y / b, a.Z / b) end return Vector3.new(a.X / b.X, a.Y / b.Y, a.Z / b.Z) end
Vector3.__unm = function(a) return Vector3.new(-a.X, -a.Y, -a.Z) end
Vector3.__eq = function(a, b) return a.X == b.X and a.Y == b.Y and a.Z == b.Z end

Vector2 = {}
function Vector2.new(x, y) return setmetatable({ X = x or 0, Y = y or 0, _rbx = "Vector2" }, Vector2) end
Vector2.__index = function(t, k) if k == "Magnitude" then return math.sqrt(t.X^2 + t.Y^2) end return rawget(t, k) end

Color3 = {}
function Color3.new(r, g, b) return setmetatable({ R = r or 0, G = g or 0, B = b or 0, _rbx = "Color3" }, Color3) end
function Color3.fromRGB(r, g, b) return Color3.new((r or 0) / 255, (g or 0) / 255, (b or 0) / 255) end
function Color3.fromHSV(h, s, v) return Color3.new(h, s, v) end
Color3.__index = function(t, k)
    if k == "Lerp" then return function(a, b, x) return Color3.new(a.R + (b.R - a.R) * x, a.G + (b.G - a.G) * x, a.B + (b.B - a.B) * x) end end
    return rawget(t, k)
end

CFrame = {}
function CFrame.new(a, b, c, d, e, f, g, h, i, j, k, l)
    local o = { _rbx = "CFrame", Position = Vector3.zero }
    if type(a) == "table" and type(b) ~= "table" then o.Position = a
    elseif type(a) == "table" and type(b) == "table" then o.Position = a
    elseif type(a) == "number" then o.Position = Vector3.new(a or 0, b or 0, c or 0) end
    return setmetatable(o, CFrame)
end
CFrame.__index = function(t, k)
    if k == "LookVector" then return Vector3.new(0, 0, -1) end
    if k == "RightVector" then return Vector3.new(1, 0, 0) end
    if k == "UpVector" then return Vector3.new(0, 1, 0) end
    if k == "X" then return t.Position.X end
    if k == "Y" then return t.Position.Y end
    if k == "Z" then return t.Position.Z end
    if k == "Inverse" then return t end
    if k == "ToOrientation" then return function(self) return 0, 0, 0 end end
    if k == "ToEulerAnglesXYZ" then return function(self) return 0, 0, 0 end end
    if k == "ToWorldSpace" or k == "ToObjectSpace" or k == "Lerp" then return function(self) return self end end
    if k == "PointToWorldSpace" or k == "PointToObjectSpace" then return function(self, v) return v end end
    return rawget(t, k)
end
CFrame.__mul = function(a, b)
    if type(b) == "table" and b._rbx == "Vector3" then return a.Position + b end
    return a
end
CFrame.identity = CFrame.new(0, 0, 0)

UDim = {}
function UDim.new(s, o) return setmetatable({ Scale = s or 0, Offset = o or 0, _rbx = "UDim" }, UDim) end
UDim.__index = UDim
UDim2 = {}
function UDim2.new(xs, xo, ys, yo) return setmetatable({ X = UDim.new(xs, xo), Y = UDim.new(ys, yo), _rbx = "UDim2" }, UDim2) end
function UDim2.fromScale(x, y) return UDim2.new(x, 0, y, 0) end
function UDim2.fromOffset(x, y) return UDim2.new(0, x, 0, y) end
UDim2.__index = function(t, k)
    if k == "Width" then return t.X end
    if k == "Height" then return t.Y end
    return rawget(t, k)
end

Rect = {}
function Rect.new(...) return setmetatable({ _rbx = "Rect", _a = { ... } }, Rect) end
Rect.__index = Rect

TweenInfo = {}
function TweenInfo.new(...) return setmetatable({ _args = { ... }, _rbx = "TweenInfo" }, TweenInfo) end
TweenInfo.__index = TweenInfo

NumberSequence = {}
function NumberSequence.new(a, b) return setmetatable({ _rbx = "NumberSequence", _a = a, _b = b }, NumberSequence) end
NumberSequence.__index = NumberSequence
NumberSequenceKeypoint = {}
function NumberSequenceKeypoint.new(t, v) return setmetatable({ Time = t, Value = v }, NumberSequenceKeypoint) end
NumberSequenceKeypoint.__index = NumberSequenceKeypoint
ColorSequence = {}
function ColorSequence.new(a, b) return setmetatable({ _rbx = "ColorSequence", _a = a, _b = b }, ColorSequence) end
ColorSequence.__index = ColorSequence
ColorSequenceKeypoint = {}
function ColorSequenceKeypoint.new(t, c) return setmetatable({ Time = t, Value = c }, ColorSequenceKeypoint) end
ColorSequenceKeypoint.__index = ColorSequenceKeypoint

Font = {}
function Font.new(family, weight, style) return setmetatable({ Family = family, Weight = weight, _rbx = "Font" }, Font) end
Font.__index = Font

-- ---- Enum ----
local enumCache = {}
local enumCounter = 0
Enum = setmetatable({}, {
    __index = function(_, kind)
        local t = enumCache[kind]
        if t then return t end
        t = setmetatable({}, {
            __index = function(self, name)
                local v = rawget(self, name)
                if v then return v end
                enumCounter = enumCounter + 1
                v = setmetatable({ Name = name, EnumType = kind, Value = enumCounter, _rbx = "EnumItem" }, {
                    __index = function(x, k) if k == "Name" or k == "Value" or k == "EnumType" then return rawget(x, k) end return nil end,
                    __tostring = function() return "Enum." .. kind .. "." .. name end,
                })
                rawset(self, name, v)
                return v
            end,
        })
        enumCache[kind] = t
        return t
    end,
})

SIGNAL_PROPS = {
    InputBegan = true, InputChanged = true, InputEnded = true, Activated = true,
    MouseEnter = true, MouseLeave = true, MouseButton1Down = true, MouseButton1Up = true,
    MouseButton1Click = true, MouseButton2Click = true, MouseMoved = true, MouseWheel = true,
    Focused = true, FocusLost = true, TextChanged = true, Changed = true,
    ChildAdded = true, ChildRemoved = true, DescendantAdded = true, DescendantRemoving = true,
    AncestorChanged = true, Touched = true, TouchEnded = true, Equipped = true, Unequipped = true,
    Died = true, StateChanged = true, Jumping = true, Running = true, Climbing = true,
    FreeFalling = true, Seated = true, GetPropertyChangedSignal = true,
    CharacterAdded = true, CharacterRemoving = true, PlayerAdded = true, PlayerRemoving = true,
    MessageOut = true, TeleportInitFailed = true, ErrorMessageChanged = true, Stopped = true,
    Completed = true, RenderStepped = true, Heartbeat = true, PreRender = true,
}
local DEFAULTS = {
    Frame = { Visible = true, ZIndex = 1, AbsoluteSize = Vector2.new(600, 400), AbsolutePosition = Vector2.new(0, 0), BackgroundTransparency = 0, TextTransparency = 0 },
    ScrollingFrame = { Visible = true, ZIndex = 1, AbsoluteSize = Vector2.new(600, 400), AbsolutePosition = Vector2.new(0, 0), CanvasPosition = Vector2.new(0, 0), AbsoluteCanvasSize = Vector2.new(600, 2000), BackgroundTransparency = 0 },
    TextLabel = { Visible = true, ZIndex = 1, AbsoluteSize = Vector2.new(120, 20), AbsolutePosition = Vector2.new(0, 0), BackgroundTransparency = 1, TextTransparency = 0, TextBounds = Vector2.new(80, 14) },
    TextButton = { Visible = true, ZIndex = 1, AbsoluteSize = Vector2.new(120, 20), AbsolutePosition = Vector2.new(0, 0), BackgroundTransparency = 0, TextTransparency = 0, TextBounds = Vector2.new(80, 14), AutoButtonColor = true },
    TextBox = { Visible = true, ZIndex = 1, AbsoluteSize = Vector2.new(120, 20), AbsolutePosition = Vector2.new(0, 0), BackgroundTransparency = 0, TextTransparency = 0, TextBounds = Vector2.new(80, 14), CursorPosition = -1, SelectionStart = -1 },
    ImageLabel = { Visible = true, ZIndex = 1, AbsoluteSize = Vector2.new(60, 60), AbsolutePosition = Vector2.new(0, 0) },
    ImageButton = { Visible = true, ZIndex = 1, AbsoluteSize = Vector2.new(60, 60), AbsolutePosition = Vector2.new(0, 0) },
    ScreenGui = { Enabled = true, DisplayOrder = 0, IgnoreGuiInset = false, ResetOnSpawn = true },
    BillboardGui = { Enabled = true, MaxDistance = 1000 },
    Highlight = { Enabled = true, FillTransparency = 0.5, OutlineTransparency = 0, Priority = 0 },
    BoxHandleAdornment = { Visible = true, Transparency = 0.5, ZIndex = 1, AlwaysOnTop = false },
    SelectionBox = { Visible = true, SurfaceTransparency = 0, Transparency = 0, LineThickness = 0.15 },
    BasePart = { Anchored = false, CanCollide = true, Massless = false, Transparency = 0, AssemblyLinearVelocity = Vector3.zero, Velocity = Vector3.zero, Rotation = Vector3.zero, Orientation = Vector3.zero, LocalTransparencyModifier = 0, CanTouch = true, CanQuery = true,
        Material = Enum.Material.Plastic, Color = Color3.fromRGB(163, 162, 165), CFrame = CFrame.new(0, 0, 0) },
    Part = { Anchored = false, CanCollide = true, Size = Vector3.new(1, 1, 1), AssemblyLinearVelocity = Vector3.zero, Velocity = Vector3.zero, Position = Vector3.zero, Rotation = Vector3.zero, Orientation = Vector3.zero, LocalTransparencyModifier = 0,
        Material = Enum.Material.Plastic, Color = Color3.fromRGB(163, 162, 165), CFrame = CFrame.new(0, 0, 0) },
    Humanoid = { Health = 100, MaxHealth = 100, WalkSpeed = 16, JumpPower = 50, UseJumpPower = true, PlatformStand = false, AutoRotate = true, HipHeight = 2, MoveDirection = Vector3.zero },
    Camera = { FieldOfView = 70, CameraType = Enum.CameraType.Custom, CFrame = CFrame.new(0, 10, 20), ViewportSize = Vector2.new(1280, 720) },
    Player = { UserId = 1, DisplayName = "Test", AccountAge = 1 },
    Model = { PrimaryPart = nil },
}
-- ---- Instance ----
local ISA = {
    Instance = { "Instance" },
    BasePart = { "Instance", "PVInstance", "BasePart" },
    Part = { "Instance", "PVInstance", "BasePart", "Part" },
    MeshPart = { "Instance", "PVInstance", "BasePart", "MeshPart" },
    Model = { "Instance", "PVInstance", "Model" },
    Folder = { "Instance", "Folder" },
    ScreenGui = { "Instance", "GuiBase2d", "LayerCollector", "ScreenGui" },
    BillboardGui = { "Instance", "GuiBase2d", "BillboardGui" },
    BillboardGui2 = { "Instance" },
    Highlight = { "Instance", "Highlight" },
    Frame = { "Instance", "GuiBase2d", "GuiObject", "Frame" },
    ScrollingFrame = { "Instance", "GuiBase2d", "GuiObject", "ScrollingFrame" },
    TextLabel = { "Instance", "GuiBase2d", "GuiObject", "TextLabel" },
    TextButton = { "Instance", "GuiBase2d", "GuiObject", "TextButton" },
    TextBox = { "Instance", "GuiBase2d", "GuiObject", "TextBox" },
    ImageLabel = { "Instance", "GuiBase2d", "GuiObject", "ImageLabel" },
    ImageButton = { "Instance", "GuiBase2d", "GuiObject", "ImageButton" },
    UICorner = { "Instance", "UIComponent", "UICorner" },
    UIStroke = { "Instance", "UIComponent", "UIStroke" },
    UIPadding = { "Instance", "UIComponent", "UIPadding" },
    UIListLayout = { "Instance", "UIComponent", "UILayout", "UIListLayout" },
    UIGridLayout = { "Instance", "UIComponent", "UILayout", "UIGridLayout" },
    UIGradient = { "Instance", "UIComponent", "UIGradient" },
    UIScale = { "Instance", "UIComponent", "UIScale" },
    UIAspectRatioConstraint = { "Instance", "UIComponent", "UIAspectRatioConstraint" },
    BoxHandleAdornment = { "Instance", "Adornment", "HandleAdornment", "BoxHandleAdornment" },
    SelectionBox = { "Instance", "GuiBase3d", "SelectionBox" },
    BodyVelocity = { "Instance", "BodyMover", "BodyVelocity" },
    BodyGyro = { "Instance", "BodyMover", "BodyGyro" },
    Humanoid = { "Instance", "Humanoid" },
    Player = { "Instance", "Player" },
    PlayerGui = { "Instance", "PlayerGui" },
    Camera = { "Instance", "Camera" },
    Terrain = { "Instance", "BasePart", "Terrain" },
    Sound = { "Instance", "Sound" },
    LocalScript = { "Instance", "LocalScript" },
    Script = { "Instance", "Script" },
    RaycastParams = { "Instance" },
    OverlapParams = { "Instance" },
}
local METHODS = {}
local function defm(name, fn) METHODS[name] = fn end

local allInstances = {}
local function newInstance(cls, parent)
    local o = {
        Name = cls, ClassName = cls, Parent = nil, _kids = {}, _attrs = {}, _sig = {},
        _isa = ISA[cls] or { "Instance", cls }, _destroyed = false,
        _defaults = DEFAULTS[cls] or nil,
    }
    allInstances[#allInstances + 1] = o
    local mt = {
        __index = function(t, k)
            local v = rawget(t, k)
            if v ~= nil then return v end
            local m = METHODS[k]
            if m then return m end
            local d = rawget(t, "_defaults")
            if d and d[k] ~= nil then return d[k] end
            if SIGNAL_PROPS[k] then
                t._sig[k] = t._sig[k] or Signal.new()
                return t._sig[k]
            end
            return nil
        end,
        __newindex = function(t, k, v)
            if k == "Parent" then
                local old = rawget(t, "Parent")
                if old and old._kids then
                    for i, c in ipairs(old._kids) do if c == t then table.remove(old._kids, i) break end end
                end
                rawset(t, "Parent", v)
                if v and v._kids then v._kids[#v._kids + 1] = t end
                return
            end
            rawset(t, k, v)
        end,
        __tostring = function(t) return rawget(t, "Name") or "Instance" end,
    }
    local inst = setmetatable(o, mt)
    if parent ~= nil then inst.Parent = parent end
    return inst
end

Instance = {}
function Instance.new(cls, parent)
    local o = newInstance(cls, parent)
    return o
end

defm("Destroy", function(self)
    if self._destroyed then return end
    self._destroyed = true
    for i = #self._kids, 1, -1 do pcall(function() self._kids[i]:Destroy() end) end
    local p = rawget(self, "Parent")
    if p and p._kids then
        for i, c in ipairs(p._kids) do if c == self then table.remove(p._kids, i) break end end
    end
    rawset(self, "Parent", nil)
end)
defm("FindFirstChild", function(self, name, recursive)
    for _, c in ipairs(self._kids) do if rawget(c, "Name") == name then return c end end
    if recursive then
        for _, c in ipairs(self._kids) do local f = c:FindFirstChild(name, true); if f then return f end end
    end
    return nil
end)
defm("FindFirstChildOfClass", function(self, cls)
    for _, c in ipairs(self._kids) do if rawget(c, "ClassName") == cls then return c end end
    return nil
end)
defm("FindFirstChildWhichIsA", function(self, cls, recursive)
    for _, c in ipairs(self._kids) do if c:IsA(cls) then return c end end
    if recursive then
        for _, c in ipairs(self._kids) do local f = c:FindFirstChildWhichIsA(cls, true); if f then return f end end
    end
    return nil
end)
defm("FindFirstAncestor", function(self, name)
    local p = rawget(self, "Parent")
    while p do if rawget(p, "Name") == name then return p end p = rawget(p, "Parent") end
    return nil
end)
defm("FindFirstAncestorOfClass", function(self, cls)
    local p = rawget(self, "Parent")
    while p do if p:IsA(cls) then return p end p = rawget(p, "Parent") end
    return nil
end)
defm("FindFirstAncestorWhichIsA", function(self, cls) return self:FindFirstAncestorOfClass(cls) end)
defm("GetChildren", function(self) local out = {}; for i, c in ipairs(self._kids) do out[i] = c end; return out end)
defm("GetDescendants", function(self)
    local out = {}
    local function rec(node)
        for _, c in ipairs(node._kids) do out[#out + 1] = c; rec(c) end
    end
    rec(self)
    return out
end)
defm("IsA", function(self, cls)
    for _, c in ipairs(rawget(self, "_isa") or {}) do if c == cls then return true end end
    return cls == rawget(self, "ClassName")
end)
defm("IsDescendantOf", function(self, other)
    local p = rawget(self, "Parent")
    while p do if p == other then return true end p = rawget(p, "Parent") end
    return false
end)
defm("ClearAllChildren", function(self) for i = #self._kids, 1, -1 do pcall(function() self._kids[i]:Destroy() end) end end)
defm("Clone", function(self) return newInstance(rawget(self, "ClassName"), nil) end)
defm("GetFullName", function(self)
    local parts, p = {}, self
    while p do table.insert(parts, 1, tostring(rawget(p, "Name"))); p = rawget(p, "Parent") end
    return table.concat(parts, ".")
end)
defm("GetPropertyChangedSignal", function(self, prop)
    self._sig[prop] = self._sig[prop] or Signal.new()
    return self._sig[prop]
end)
defm("GetAttribute", function(self, k) return self._attrs[k] end)
defm("SetAttribute", function(self, k, v) self._attrs[k] = v end)
defm("GetAttributeChangedSignal", function(self, k) return Signal.new() end)
defm("WaitForChild", function(self, name)
    local c = self:FindFirstChild(name)
    if c then return c end
    local n = newInstance(name, nil)
    n.Parent = self
    return n
end)
defm("CaptureFocus", function(self) local s = self:GetPropertyChangedSignal("Focused"); s:Fire(true) end)
defm("ReleaseFocus", function(self) local s = self:GetPropertyChangedSignal("Focused"); s:Fire(false) end)
defm("GetBoundingBox", function(self) return CFrame.new(0, 0, 0), Vector3.new(1, 1, 1) end)
defm("GetExtentsSize", function(self) return Vector3.new(1, 1, 1) end)
defm("GetPivot", function(self) local pp = self.PrimaryPart or self:FindFirstChildWhichIsA("BasePart", true); return pp and CFrame.new(pp.Position) or CFrame.new(0, 0, 0) end)
defm("GetPlayers", function(self) return _G.__TEST_PLAYERS or {} end)
defm("GetServers", function() return {} end)
defm("JSONEncode", function(_, t) return _G.__json_encode(t) end)
defm("JSONDecode", function(_, s) return _G.__json_decode(s) end)
defm("GetServerTimeNow", function() return os.time() end)
defm("BindToRenderStep", function(self, name, prio, fn)
    _G.__renderSteps = _G.__renderSteps or {}
    _G.__renderSteps[name] = fn
end)
defm("UnbindFromRenderStep", function(self, name) if _G.__renderSteps then _G.__renderSteps[name] = nil end end)
defm("IsKeyDown", function() return false end)
defm("GetFocusedTextBox", function() return nil end)
defm("GetPartBoundsInRadius", function() return {} end)
defm("GetPartsInPart", function() return {} end)
defm("Raycast", function() return { Instance = nil, Position = Vector3.zero, Normal = Vector3.new(0, 1, 0) } end)
defm("Create", function(self, obj, info, goal) return {
    Play = function() end, Cancel = function() end, Completed = Signal.new(),
} end)
defm("Play", function() end)
defm("Cancel", function() end)
defm("Pause", function() end)
defm("Teleport", function() end)
defm("TeleportToPlaceInstance", function() end)
defm("HttpGet", function() return "" end)
defm("GetAsync", function() return "" end)
defm("RequestAsync", function() return { Body = "", StatusCode = 200, Success = false, Headers = {} } end)
defm("GetErrorMessage", function() return "" end)
defm("IsFriendsWith", function() return false end)
defm("GetRankInGroup", function() return 0 end)
defm("Kick", function() end)
defm("LoadCharacter", function() end)
defm("ChangeState", function() end)
defm("MoveTo", function() end)
defm("GetMouse", function() return { Hit = CFrame.new(0, 0, 0), Target = nil, UnitRay = { Origin = Vector3.zero, Direction = Vector3.new(0, 0, -1) } } end)
defm("Wait", function() return nil end)
defm("GetMouseLocation", function() return Vector2.new(0, 0) end)
defm("GetGuiInset", function() return Vector2.new(0, 0), Vector2.new(0, 0) end)
defm("GetCore", function() return nil end)
defm("UserInputType", function() return nil end)
defm("GetNetworkOwner", function() return nil end)
defm("SetNetworkOwner", function() end)
defm("ApplyDescription", function() end)

-- ---- task / scheduler ----
task = {}
local threads = {}
task.spawn = function(fn, ...)
    local co = coroutine.create(fn)
    table.insert(threads, co)
    local ok, err = coroutine.resume(co, ...)
    if not ok then error(err, 0) end
    return co
end
task.defer = task.spawn
task.delay = function(secs, fn, ...)
    _G.__delayed = _G.__delayed or {}
    table.insert(_G.__delayed, { t = (os.clock() + (tonumber(secs) or 0)), fn = fn, args = { ... } })
end
task.wait = function(secs) return coroutine.yield() end
task.cancel = function(co) end
tick = function() return os.clock() end
time = tick
wait = task.wait
delay = task.delay
spawn = task.spawn
typeof = function(v)
    if type(v) == "table" then return rawget(v, "_rbx") or "table" end
    return type(v)
end
loadstring = load

-- ---- game / services ----
local services = {}
local function svc(name)
    if services[name] then return services[name] end
    local o = newInstance(name, nil)
    services[name] = o
    return o
end

game = newInstance("DataModel", nil)
game.Name = "Game"
game.PlaceId = 12345
game.JobId = "test-job-id"
game.PlaceVersion = 1
game.CreatorType = Enum.CreatorType.User

defm("GetService", function(self, name)
    if name == "CoreGui" then return svc("CoreGui") end
    if name == "Workspace" then return workspace end
    return svc(name)
end)

local Players = svc("Players")
workspace = newInstance("Workspace", nil)
workspace.Name = "Workspace"
workspace.Gravity = 196.2
svc("Workspace")._kids[#svc("Workspace")._kids + 1] = workspace  -- dot: Workspace là con của game
local cam = newInstance("Camera", nil)
cam.Name = "Camera"
cam.CameraType = Enum.CameraType.Custom
cam.CFrame = CFrame.new(0, 10, 20)
cam.CameraSubject = nil
cam.FieldOfView = 70
workspace.CurrentCamera = cam

local pg = newInstance("PlayerGui", nil)
pg.Name = "PlayerGui"

local char = newInstance("Model", workspace)
char.Name = "TestPlayer"
local hum = newInstance("Humanoid", char)
hum.Health, hum.MaxHealth = 100, 100
hum.WalkSpeed, hum.JumpPower = 16, 50
hum.UseJumpPower = true
hum.PlatformStand = false
hum.AutoRotate = true
hum.HipHeight = 2
hum.MoveDirection = Vector3.zero
hum.RootPart = nil
local hrp = newInstance("Part", char)
hrp.Name = "HumanoidRootPart"
hrp.Position = Vector3.new(0, 5, 0)
hrp.Size = Vector3.new(2, 2, 1)
hrp.AssemblyLinearVelocity = Vector3.zero
hum.RootPart = hrp
local head = newInstance("Part", char)
head.Name = "Head"
head.Position = Vector3.new(0, 6.5, 0)
head.Size = Vector3.new(1, 1, 1)
-- vật tên "Cây" NẰM TRONG nhân vật: phải bị bỏ qua (không định vị nhân vật)
local charTree = newInstance("Part", char)
charTree.Name = "Cây trên đầu"
charTree.Position = Vector3.new(0, 7.5, 0)
charTree.Size = Vector3.new(1, 1, 1)

local me = newInstance("Player", Players)
me.Name = "TestPlayer"
me.DisplayName = "TestPlayer"
me.UserId = 777
me.Character = char
me.PlayerGui = pg
pg.Parent = me
Players.LocalPlayer = me
_G.__TEST_PLAYERS = { me }
_G.__clipboard = nil
function setclipboard(txt) _G.__clipboard = tostring(txt) end

-- người chơi khác + nhân vật khác
local other = newInstance("Player", Players)
other.Name = "NguoiKhac"
other.UserId = 888
local otherChar = newInstance("Model", workspace)
otherChar.Name = "NguoiKhac"
local otherHum = newInstance("Humanoid", otherChar)
otherHum.Health, otherHum.MaxHealth = 100, 100
local otherHrp = newInstance("Part", otherChar)
otherHrp.Name = "HumanoidRootPart"
otherHrp.Position = Vector3.new(50, 5, 50)
otherHrp.Size = Vector3.new(2, 2, 1)
local otherTree = newInstance("Part", otherChar)
otherTree.Name = "Cây của người khác"
otherTree.Position = Vector3.new(50, 5, 50)
otherTree.Size = Vector3.new(2, 2, 2)
other.Character = otherChar
_G.__TEST_PLAYERS[2] = other

-- cây cối trong map
local function part(name, pos, size, cls)
    local p = newInstance(cls or "Part", workspace)
    p.Name = name
    p.Position = pos
    p.Size = size or Vector3.new(4, 10, 4)
    p.AssemblyLinearVelocity = Vector3.zero
    p.Anchored = true
    return p
end
_G.__TEST_TREES = {
    part("Cây Cổ Thụ", Vector3.new(10, 5, 0)),
    part("Cây Dừa", Vector3.new(30, 5, 0)),
    part("cay nho", Vector3.new(60, 5, 0)),
    part("CÂY THÔNG", Vector3.new(200, 5, 0)),
}
_G.__TEST_TREE_MODEL = newInstance("Model", workspace)
_G.__TEST_TREE_MODEL.Name = "Rừng Cây"
local modelPart = newInstance("Part", _G.__TEST_TREE_MODEL)
modelPart.Name = "ThanCay"
modelPart.Position = Vector3.new(0, 5, 40)
modelPart.Size = Vector3.new(3, 12, 3)
modelPart.AssemblyLinearVelocity = Vector3.zero
part("Hòn Đá", Vector3.new(15, 5, 15), Vector3.new(3, 3, 3))
part("Rương Gỗ", Vector3.new(-10, 5, -10), Vector3.new(4, 4, 4))
part("Tường", Vector3.new(0, 5, 80), Vector3.new(20, 20, 1))

-- ---- chạy hàng đợi (task.delay + render steps) ----
function _G.__pump(steps)
    steps = steps or 6
    for _ = 1, steps do
        -- task.wait đang chờ trong các thread đã spawn
        local list = { table.unpack(threads) }
        for _, co in ipairs(list) do
            if coroutine.status(co) == "suspended" then pcall(coroutine.resume, co) end
        end
        -- task.delay đã tới hạn
        if _G.__delayed then
            local now = os.clock()
            local keep = {}
            for _, d in ipairs(_G.__delayed) do
                if d.t <= now then pcall(d.fn, table.unpack(d.args)) else keep[#keep + 1] = d end
            end
            _G.__delayed = keep
        end
        -- render step (mô phỏng 60fps: 1/60 giây mỗi bước)
        if _G.__renderSteps then
            for name, fn in pairs(_G.__renderSteps) do pcall(fn, 1 / 60) end
        end
        os.clock()  -- no-op
    end
end

-- ---- JSON đơn giản (đủ cho Store) ----
function _G.__json_encode(v)
    local t = type(v)
    if t == "nil" then return "null" end
    if t == "boolean" or t == "number" then return tostring(v) end
    if t == "string" then return '"' .. v:gsub('"', '\\"'):gsub("\n", "\\n") .. '"' end
    if t == "table" then
        local isArray = true
        for k in pairs(v) do if type(k) ~= "number" then isArray = false break end end
        local out = {}
        if isArray then
            for i, x in ipairs(v) do out[i] = _G.__json_encode(x) end
            return "[" .. table.concat(out, ",") .. "]"
        end
        for k, x in pairs(v) do out[#out + 1] = '"' .. tostring(k) .. '":' .. _G.__json_encode(x) end
        return "{" .. table.concat(out, ",") .. "}"
    end
    return "null"
end
function _G.__json_decode(s)
    if type(s) ~= "string" or s == "" then return nil end
    if s:sub(1, 1) == "{" or s:sub(1, 1) == "[" then return {} end
    return nil
end
