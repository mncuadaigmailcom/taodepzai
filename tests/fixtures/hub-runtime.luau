-- Deterministic Roblox/executor adapters for the real code extracted from script.js.
-- No network calls, movement code, or third-party scripts are executed by these tests.
_G = {}
S = {embedEnabled = true, embedGuessNew = false, parkCodeGuis = true, embeds = {},
    BuiltinSavedScripts = {}, WRAP_MARK_OLD = "-- ===== AUTO-GENERATED SIZE WRAPPER"}
local Mock = {now = 0, queue = {}, cancelled = {}, errors = {}, http = {}, sources = {},
    executed = 0, embedded = 0, restored = 0, savedRebuilds = 0, featureRebuilds = 0}
_G.Mock = Mock
local function signal()
    local handlers = {}
    return {
        Connect = function(_, fn)
            local c = {Connected = true, fn = fn}
            function c:Disconnect() self.Connected = false end
            handlers[#handlers + 1] = c
            return c
        end,
        Fire = function(_, ...)
            for _, c in ipairs(table.clone(handlers)) do if c.Connected then c.fn(...) end end
        end,
        DisconnectAll = function()
            for _, c in ipairs(handlers) do c.Connected = false end
        end,
        Count = function()
            local n = 0
            for _, c in ipairs(handlers) do if c.Connected then n += 1 end end
            return n
        end,
    }
end
local methods = {}
function methods:IsA(class)
    return self.ClassName == class or (class == "GuiObject" and
        (self.ClassName == "Frame" or self.ClassName == "ScrollingFrame" or self.ClassName == "TextButton"
        or self.ClassName == "TextBox" or self.ClassName == "TextLabel"))
end
function methods:GetChildren() return table.clone(self._children) end
function methods:GetDescendants()
    local out = {}
    local function walk(o)
        for _, c in ipairs(o:GetChildren()) do out[#out + 1] = c; walk(c) end
    end
    walk(self)
    return out
end
function methods:FindFirstChild(name)
    for _, c in ipairs(self._children) do if c.Name == name then return c end end
end
function methods:FindFirstChildOfClass(class)
    for _, c in ipairs(self._children) do if c:IsA(class) then return c end end
end
function methods:IsDescendantOf(parent)
    local p = self.Parent
    while p do if p == parent then return true end; p = p.Parent end
    return false
end
function methods:GetPropertyChangedSignal(key)
    self._changed[key] = self._changed[key] or signal()
    return self._changed[key]
end
function methods:SetAttribute(key, value) self._attributes[key] = value end
function methods:GetAttribute(key) return self._attributes[key] end
function methods:Destroy()
    if self._destroyed then return end
    self._destroyed = true
    self.Destroying:Fire()
    for _, child in ipairs(self:GetChildren()) do child:Destroy() end
    self.Parent = nil
    for _, event in pairs(self._events) do event:DisconnectAll() end
    for _, event in pairs(self._changed) do event:DisconnectAll() end
end
local objectMt = {
    __index = function(o, key)
        if methods[key] then return methods[key] end
        if o._values[key] ~= nil then return o._values[key] end
        if key == "Activated" or key == "MouseEnter" or key == "MouseLeave" or key == "Focused"
            or key == "FocusLost" or key == "ChildAdded" or key == "Destroying" then
            o._events[key] = o._events[key] or signal()
            return o._events[key]
        end
        for _, c in ipairs(o._children) do if c.Name == key then return c end end
    end,
    __newindex = function(o, key, value)
        if key:sub(1, 1) == "_" then rawset(o, key, value); return end
        local old = o._values[key]
        if old == value then return end
        if key == "Parent" and old then
            for i, child in ipairs(old._children) do if child == o then table.remove(old._children, i); break end end
        end
        o._values[key] = value
        if key == "Parent" and value then value._children[#value._children + 1] = o; value.ChildAdded:Fire(o) end
        if o._changed[key] then o._changed[key]:Fire() end
    end,
}
Instance = {}
function Instance.new(class, parent)
    local o = setmetatable({_values = {ClassName = class, Name = class, Visible = true, Enabled = true},
        _children = {}, _changed = {}, _attributes = {}, _events = {}}, objectMt)
    if parent then o.Parent = parent end
    return o
end
Color3 = {fromRGB = function(r, g, b) return {r, g, b} end}
UDim = {new = function(scale, offset) return {Scale = scale or 0, Offset = offset or 0} end}
UDim2 = {new = function(xs, xo, ys, yo) return {X = UDim.new(xs, xo), Y = UDim.new(ys, yo)} end}
Vector3 = {new = function(x, y, z) return {X = x or 0, Y = y or 0, Z = z or 0} end}
Enum = setmetatable({}, {__index = function(t, key)
    local group = setmetatable({}, {__index = function(g, name) rawset(g, name, name); return name end})
    rawset(t, key, group)
    return group
end})
local C = {RED = "red", GREEN = "green", BLUE = "blue", WHITE = "white", GRAY = "gray",
    INK = "ink", DARK = "dark", MUTED = "muted", ACCENT = "accent", ORANGE = "orange",
    PURPLE = "purple", SURFACE = "surface", SURFACE2 = "surface2", SURFACE3 = "surface3", BORDER = "border"}
local D = {BestText = function() return C.WHITE end}
local function New(class, props, parent)
    local o = Instance.new(class)
    for k, v in pairs(props or {}) do o[k] = v end
    o.Parent = parent
    return o
end
local function Corner() end
local function Stroke() end
local function flash(btn, text) btn.Text = text end
local function ReleaseHubFocus() end
local function trackConn(c) return c end
local root = Instance.new("Folder")
local playerGui = New("Folder", {Name = "PlayerGui"}, root)
local targetGui = playerGui
local coreGui = New("Folder", {Name = "CoreGui"}, root)
local gui = New("ScreenGui", {Name = "ExMenu"}, playerGui)
local main = New("Frame", {}, gui)
local tabBar = New("Frame", {}, main)
local contentArea = New("Frame", {}, main)
local codeTab = New("ScrollingFrame", {}, contentArea)
local savedCodeTab = New("ScrollingFrame", {}, contentArea)
local codeButton = New("TextButton", {LayoutOrder = 2}, tabBar)
local savedButton = New("TextButton", {LayoutOrder = 1}, tabBar)
local tabs, tabContent = {codeButton, savedButton}, {codeTab, savedCodeTab}
local activeTab = savedCodeTab
local featureTabIndex = 8
local runActive = false
local totalRuns, cancelled, curThread, curIndicator = 0, false, nil, nil
local scripts, waypoints, featureTabs = {}, {}, {}
local RebuildScripts
local createStatus = New("TextLabel", {}, main)
local function RebuildFeatureList() Mock.featureRebuilds += 1 end
local function SwitchTab(index)
    for i, frame in ipairs(tabContent) do frame.Visible = i == index end
    activeTab = tabContent[index]
end
local function OpenFirstPage() SwitchTab(2) end
local function MakeTabFrame() return New("ScrollingFrame", {}, contentArea) end
local function MakeTabButton(name, icon, order, onClick)
    local btn = New("TextButton", {Text = icon, LayoutOrder = order}, tabBar)
    btn:SetAttribute("BCTabName", name)
    btn.Activated:Connect(function()
        for i, b in ipairs(tabs) do if b == btn then SwitchTab(i); if onClick then onClick() end; break end end
    end)
    return btn
end
local function Label(parent, text, y)
    return New("TextLabel", {Text = text, Position = UDim2.new(0,8,0,y)}, parent)
end
function S.RegisterCrosshairBtn() end
function S.Debounce(_, _, fn) task.defer(fn) end
function S.Rebuild() end
function S.CopyToClipboard() return false end
local function schedule(co, delay) Mock.queue[#Mock.queue + 1] = {co = co, at = Mock.now + delay} end
local function resume(co)
    if Mock.cancelled[co] then return end
    local ok, delay = coroutine.resume(co)
    if not ok then Mock.errors[#Mock.errors + 1] = tostring(delay); return end
    if coroutine.status(co) == "suspended" then schedule(co, tonumber(delay) or 0) end
end
task = {}
function task.spawn(fn)
    local co = coroutine.create(fn)
    resume(co)
    return co
end
function task.defer(fn) local co = coroutine.create(fn); schedule(co, 0); return co end
function task.delay(seconds, fn) local co = coroutine.create(fn); schedule(co, seconds); return co end
function task.wait(seconds) return coroutine.yield(seconds or 0.01) end
function task.cancel(co) Mock.cancelled[co] = true; coroutine.close(co) end
function Mock.flush(seconds)
    local target, steps = Mock.now + (seconds or 20), 0
    while #Mock.queue > 0 do
        table.sort(Mock.queue, function(a, b) return a.at < b.at end)
        if Mock.queue[1].at > target then break end
        local next = table.remove(Mock.queue, 1)
        Mock.now = next.at
        resume(next.co)
        steps += 1
        assert(steps < 3000, "test scheduler stuck")
    end
    Mock.now = target
    assert(#Mock.errors == 0, table.concat(Mock.errors, "\n"))
end
function tick() return Mock.now end
function warn(...) end
local function clone(value)
    if type(value) ~= "table" then return value end
    local out = {}
    for key, item in pairs(value) do out[key] = clone(item) end
    return out
end
local jsonValues, jsonId, files = {}, 0, {}
local HttpService = {}
function HttpService:JSONEncode(data)
    jsonId += 1
    local key = "json:" .. jsonId
    jsonValues[key] = clone(data)
    return key
end
function HttpService:JSONDecode(value) assert(jsonValues[value], "invalid JSON"); return clone(jsonValues[value]) end
function writefile(path, value) files[path] = value end
function readfile(path) assert(files[path], "missing file"); return files[path] end
function isfile(path) return files[path] ~= nil end
game = {PlaceId = 123, JobId = "mock-job"}
function game:GetService(name)
    if name == "HttpService" then return HttpService end
    if name == "CoreGui" then return coreGui end
    if name == "Players" then return {LocalPlayer = {PlayerGui = playerGui}} end
    error("unmocked service " .. name)
end
function game:HttpGet(url)
    Mock.http[#Mock.http + 1] = url
    assert(Mock.sources[url], "HTTP 404: " .. url)
    return Mock.sources[url]
end
local function ScanNewGuis(before)
    local found = {}
    for _, g in ipairs(playerGui:GetChildren()) do if not before[g] and g ~= gui then found[#found + 1] = g end end
    return found
end
function S.EmbedGui(g, host)
    local embeddedHost = New("Frame", {Name = "Embedded_" .. g.Name}, host)
    local entry = {host = embeddedHost, gui = g, recs = {}}
    for _, c in ipairs(g:GetChildren()) do
        entry.recs[#entry.recs + 1] = {obj = c, origParent = g}
        c.Parent = embeddedHost
    end
    S.embeds[#S.embeds + 1] = entry
    Mock.embedded += 1
    return true
end
function S.ClearEmbedsUnder(host)
    for i = #S.embeds, 1, -1 do
        local entry = S.embeds[i]
        if entry.host.Parent == host then
            for _, rec in ipairs(entry.recs) do rec.obj.Parent = rec.origParent end
            entry.host:Destroy()
            table.remove(S.embeds, i)
            Mock.restored += 1
        end
    end
end
function Mock.find(parent, name)
    for _, o in ipairs(parent:GetDescendants()) do if o.Name == name then return o end end
    error("missing object " .. name)
end
function Mock.button(parent, text)
    for _, o in ipairs(parent:GetDescendants()) do if o.ClassName == "TextButton" and o.Text == text then return o end end
    error("missing button " .. text)
end
function Mock.row(name)
    for _, row in ipairs(Mock.find(savedCodeTab, "SavedLinkList"):GetChildren()) do
        local link = row:FindFirstChild("SavedLinkActivateName")
        if link and link.Text == "🔗 " .. name then return row end
    end
    error("missing saved row " .. name)
end
function Mock.add(name, code)
    local entry = assert(S.SavedLinks.Add(scripts, name, code))
    RebuildScripts()
    return entry
end
Mock.guiCode = [[
_G.Mock.executed += 1
local g = Instance.new("ScreenGui")
g.Name = "TestPayload"
g.Parent = game:GetService("Players").LocalPlayer.PlayerGui
Instance.new("Frame", g)
]]
