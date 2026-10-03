--[[
    taodepzai v5.0 NOIR — FULL CODE  ·  OBSIDIAN NOIR + layout kiểu DELTA
    v5.0 NOIR: Code Da Luu la tab thuong; Script Hub + Ho Tro duoc tach thanh cac module URL.
    v4.66: 🎥 quay camera. v4.65: xuyên tường. v4.64: khán giả thay 👻.
    v4.43: 🔐 Anti Ban. v4.42 rút gọn. v4.41 chip. v4.40 ⚙. v4.39–v4.36 bay/nhảy/tốc độ.
    Giữ: 🚀/🛡 bay · 🧱 noclip · 🦘 nhảy · 💨 sprint · 📍👣 · ✨ · 👥 · ⚙️.
    Kiem tra: parser Luau + static regression (script.js la Luau, khong phai JavaScript).
--]]
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local HttpService = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")   -- v4.6.3: Reset / Hop / vào server theo mã

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local camera = workspace.CurrentCamera

local targetGui = playerGui
pcall(function()
    -- Executor có gethui thì dùng nó; LocalScript chuẩn phải ở PlayerGui.
    if type(gethui) == "function" then
        local hui = gethui()
        if hui then targetGui = hui end
    end
end)

pcall(function()
    local cleanup = _G.BananaCatHub_FeatureCleanup
    if type(cleanup) == "function" then cleanup() end
    _G.BananaCatHub_FeatureCleanup = nil
end)
pcall(function()
    local old = _G.TDZSupportStandalone
    if type(old) == "table" and type(old.Destroy) == "function" then old.Destroy() end
end)
pcall(function()
    local old = _G.TDZSavedCodeStandalone
    if type(old) == "table" and type(old.Destroy) == "function" then old.Destroy() end
end)

do
    local old = _G.BananaCatHub_MV
    if old then
        if old.StopAll then pcall(old.StopAll) end
        old._wdToken = nil
        if type(old._wd) == "thread" then pcall(task.cancel, old._wd) end
        old._wd = nil
    end
end

if _G.BananaCatHub_Connections then
    for _, c in ipairs(_G.BananaCatHub_Connections) do
        pcall(function() c:Disconnect() end)
    end
end
_G.BananaCatHub_Connections = {}
pcall(function()
    local oldUnhook = _G.BananaCatHub_AntiBanUnhook
    if type(oldUnhook) == "function" then pcall(oldUnhook) end
    _G.BananaCatHub_AntiBanUnhook = nil
end)
pcall(function()
    local f = _G.BananaCatHub_Free
    if type(f) == "table" and f.Stop then pcall(f.Stop) end
end)

pcall(function()
    local old = _G.BananaCatHub_SpecCam
    if old ~= nil then
        local cam = workspace.CurrentCamera
        if cam then
            if old ~= Enum.CameraType.Scriptable then
                pcall(function() cam.CameraType = old end)
            else
                pcall(function() cam.CameraType = Enum.CameraType.Custom end)
            end
            pcall(function()
                local char = player and player.Character
                local hum = char and char:FindFirstChildOfClass("Humanoid")
                local root = char and char:FindFirstChild("HumanoidRootPart")
                if hum then cam.CameraSubject = hum end
                if root then
                    cam.CFrame = CFrame.new(root.Position + Vector3.new(0, 3.2, 12), root.Position + Vector3.new(0,1.5,0))
                    cam.Focus = CFrame.new(root.Position)
                end
            end)
        end
        _G.BananaCatHub_SpecCam = nil
    end
    pcall(function() RunService:UnbindFromRenderStep("BC_Spec") end)
end)

for _, parent in ipairs({targetGui, playerGui, game:GetService("CoreGui")}) do
    pcall(function()
        local old = parent:FindFirstChild("BananaCatHub_Crosshair")
        if old then old:Destroy() end
    end)
end

local function trackConn(conn)
    local t = _G.BananaCatHub_Connections
    if #t > 300 then
        local alive, n = {}, 0
        for i = 1, #t do
            local c = t[i]
            if c ~= nil and c.Connected ~= false then n = n + 1; alive[n] = c end
        end
        for i = 1, #t do t[i] = alive[i] end   -- dồn lên đầu; phần tử thừa tự thành nil
    end
    table.insert(t, conn)
    return conn
end

pcall(function() RunService:UnbindFromRenderStep("Fly") end)
pcall(function() RunService:UnbindFromRenderStep("Carpet") end)
pcall(function() RunService:UnbindFromRenderStep("BC_Speed") end)
pcall(function() RunService:UnbindFromRenderStep("BC_FreeCam") end)
pcall(function() RunService:UnbindFromRenderStep("BC_Invis") end)
pcall(function() RunService:UnbindFromRenderStep("BC_InvisNet") end)
pcall(function() RunService:UnbindFromRenderStep("BC_SafeInvis") end)
pcall(function() RunService:UnbindFromRenderStep("BC_SafeInvisFly") end)
pcall(function() RunService:UnbindFromRenderStep("BC_AutoGlass") end)
pcall(function() RunService:UnbindFromRenderStep("BC_GlassFly") end)

local C = {
    WHITE  = Color3.fromRGB(255, 255, 255),
    DARK   = Color3.fromRGB(238, 241, 248),   -- chữ chính trên nền tối
    GRAY   = Color3.fromRGB(120, 128, 146),   -- nút tắt / chữ phụ
    GREEN  = Color3.fromRGB(64, 214, 152),
    BLUE   = Color3.fromRGB(79, 150, 240),
    RED    = Color3.fromRGB(230, 88, 88),
    YELLOW = Color3.fromRGB(250, 204, 102),
    PURPLE = Color3.fromRGB(155, 128, 245),
    ORANGE = Color3.fromRGB(251, 146, 60),
    PINK   = Color3.fromRGB(226, 82, 158),
    BG     = Color3.fromRGB(11, 12, 17),      -- nền cửa sổ chính (obsidian)

    INK      = Color3.fromRGB(12, 10, 6),     -- chữ ĐẬM dùng trên nền vàng/cam/sáng
    SURFACE  = Color3.fromRGB(20, 22, 30),    -- thẻ, ô nhập liệu
    SURFACE2 = Color3.fromRGB(29, 32, 43),    -- panel, dòng hover, thanh tiêu đề
    SURFACE3 = Color3.fromRGB(44, 49, 64),    -- viền sáng, scrollbar, nút mặc định
    BORDER   = Color3.fromRGB(60, 66, 84),    -- viền mảnh 1px
    MUTED    = Color3.fromRGB(154, 162, 180), -- chữ phụ
    ACCENT   = Color3.fromRGB(240, 201, 122), -- champagne (màu nhận diện hub)
    ACCENT2  = Color3.fromRGB(198, 141, 62),  -- đồng (đuôi gradient / viền nhấn)

    ACCENT3  = Color3.fromRGB(255, 238, 203), -- đỉnh sáng nhất của vàng (highlight mép trên)
    HAIRLINE = Color3.fromRGB(72, 79, 99),    -- đường tách khối sáng hơn BORDER một bậc
    GLOW     = Color3.fromRGB(255, 214, 140), -- màu quầng sáng ấm
    DEEP     = Color3.fromRGB(7, 8, 11),      -- đáy của mọi gradient dọc (hút chiều sâu)
}

local function New(cls, props, parent)
    local obj = Instance.new(cls)
    pcall(function()
        if cls == "Frame" or cls == "ScrollingFrame" or cls == "TextButton"
           or cls == "TextLabel" or cls == "TextBox" or cls == "ImageButton" then
            obj.BorderSizePixel = 0          -- phẳng, không viền 1px kiểu cũ
        end
        if cls == "ScrollingFrame" then
            obj.ScrollBarThickness = 3       -- scrollbar mảnh kiểu hiện đại
            obj.ScrollBarImageColor3 = Color3.fromRGB(88, 96, 118)   -- v4.9: sáng hơn để thấy trên nền obsidian
            obj.ScrollBarImageTransparency = 0.45
        end
    end)
    for k, v in pairs(props or {}) do
        obj[k] = v
    end
    if parent then obj.Parent = parent end
    pcall(function()
        if cls == "TextButton" or cls == "TextLabel" or cls == "TextBox" then
            local w = Enum.FontWeight.Medium
            local f = obj.Font
            if f == Enum.Font.GothamBold or f == Enum.Font.GothamBlack then
                w = Enum.FontWeight.Bold
            elseif f == Enum.Font.GothamSemibold then
                w = Enum.FontWeight.SemiBold
            elseif f == Enum.Font.Gotham or f == Enum.Font.GothamLight or f == Enum.Font.GothamItalic then
                w = Enum.FontWeight.Regular
            end
            obj.FontFace = Font.new("rbxasset://fonts/families/GothamSSo.json", w)
        end
    end)
    pcall(function()
        if cls == "TextBox" then
            trackConn(obj.Focused:Connect(function()
                local st = obj:FindFirstChildOfClass("UIStroke")
                if not st then   -- ô chưa có viền thì tạo lúc được focus (không tạo thừa lúc dựng UI)
                    st = New("UIStroke", {
                        Thickness = 1.3, Transparency = 0.05,
                        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
                    }, obj)
                end
                TweenService:Create(st, TweenInfo.new(0.16, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
                    {Color = C.ACCENT, Transparency = 0.02}):Play()
            end))
            trackConn(obj.FocusLost:Connect(function()
                local st = obj:FindFirstChildOfClass("UIStroke")
                if st then
                    TweenService:Create(st, TweenInfo.new(0.28, Enum.EasingStyle.Quart, Enum.EasingDirection.Out),
                        {Color = C.BORDER, Transparency = 0.35}):Play()
                end
            end))
        end
    end)
    pcall(function()
        if (cls == "TextButton" or cls == "TextLabel") and props
           and props.BackgroundColor3 ~= nil and props.TextColor3 ~= nil
           and (props.BackgroundTransparency or 0) < 0.5 then
            local bg = props.BackgroundColor3
            if typeof(bg) == "Color3" then
                local lum = 0.2126 * bg.R + 0.7152 * bg.G + 0.0722 * bg.B
                if lum > 0.6 and props.TextColor3 == Color3.fromRGB(255, 255, 255) then
                    obj.TextColor3 = C.INK
                end
            end
        end
    end)
    return obj
end

local function Corner(p, r)
    return New("UICorner", {CornerRadius = r or UDim.new(0, 10)}, p)   -- v4.5: bo 10px (trước 8px)
end

local function Stroke(p, c, t)
    return New("UIStroke", {
        Color = c or C.BORDER,                          -- v4.9: viền tách khối rõ hơn trên nền obsidian
        Thickness = t or 1,
        Transparency = 0.15,                            -- v4.9: nét viền "có mặt" hơn (trước 0.25)
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
    }, p)
end

local flashBack = setmetatable({}, { __mode = "k" })
local function flash(btn, temp, secs, tempColor, back)
    if not btn then return end
    if flashBack[btn] == nil then flashBack[btn] = { back or btn.Text, btn.TextColor3 } end
    pcall(function()
        btn.Text = tostring(temp)
        if tempColor then btn.TextColor3 = tempColor end
    end)
    task.delay(secs or 1.6, function()
        if not (btn and btn.Parent) then return end
        local old = flashBack[btn]
        if not old then return end
        pcall(function() btn.Text = old[1]; btn.TextColor3 = old[2] end)
        flashBack[btn] = nil
    end)
end

local function Tween(o, p, d, e)
    TweenService:Create(o, TweenInfo.new(d or 1.5, e or Enum.EasingStyle.Quart, Enum.EasingDirection.Out), p):Play()
end

local D = {}

local S

function D.Say(msg, color)
    if not D.hubStatus then return end
    pcall(function()
        D.hubStatus.Text = tostring(msg)
        D.hubStatus.TextColor3 = color or C.RED
    end)
end

function D.BestText(bg)
    if typeof(bg) ~= "Color3" then return C.WHITE end
    local lum = 0.2126 * bg.R + 0.7152 * bg.G + 0.0722 * bg.B
    return (lum > 0.6) and C.INK or C.WHITE
end

function D.Edge(bg)
    if typeof(bg) ~= "Color3" then return C.BORDER end
    return Color3.new(
        math.min(1, bg.R + 0.11), math.min(1, bg.G + 0.12), math.min(1, bg.B + 0.16))
end

function D.Grad(obj)
    local g = obj:FindFirstChildOfClass("UIGradient")
    if not g then
        g = New("UIGradient", {Color = ColorSequence.new(Color3.new(1,1,1), Color3.new(1,1,1))}, obj)
    end
    return g
end

function D.Paint(obj, c1, c2, rotation)
    pcall(function()
        obj.BackgroundColor3 = Color3.new(1, 1, 1)
        local g = D.Grad(obj)
        g.Color = ColorSequence.new(c1, c2 or c1)
        g.Rotation = rotation or 90
    end)
    return obj
end

function D.Unpaint(obj)
    pcall(function()
        if not obj then return end
        local g = obj:FindFirstChildOfClass("UIGradient")
        if g then g.Color = ColorSequence.new(Color3.new(1, 1, 1), Color3.new(1, 1, 1)) end
    end)
    return obj
end

function D.Paint3(obj, colors, rotation)
    pcall(function()
        if type(colors) ~= "table" or #colors == 0 then return obj end
        obj.BackgroundColor3 = Color3.new(1, 1, 1)
        local g = D.Grad(obj)
        local n = #colors
        if n == 1 then
            g.Color = ColorSequence.new(colors[1], colors[1])
        else
            local kp = {}
            for i, col in ipairs(colors) do
                kp[i] = ColorSequenceKeypoint.new((i - 1) / (n - 1), col)
            end
            g.Color = ColorSequence.new(kp)
        end
        g.Rotation = rotation or 90
    end)
    return obj
end

function D.TopLight(obj, color, thickness, inset)
    local line = nil
    pcall(function()
        inset = inset or 14
        line = New("Frame", {
            Name = "BC_TopLight",
            Size = UDim2.new(1, -inset * 2, 0, thickness or 1),
            Position = UDim2.new(0, inset, 0, 0),
            BackgroundColor3 = color or C.HAIRLINE,
            BackgroundTransparency = 0.3,
            BorderSizePixel = 0,
            ZIndex = (obj.ZIndex or 1) + 1,
        }, obj)
        local g = New("UIGradient", {Rotation = 0}, line)
        g.Transparency = NumberSequence.new({
            NumberSequenceKeypoint.new(0.00, 1.00),
            NumberSequenceKeypoint.new(0.50, 0.05),
            NumberSequenceKeypoint.new(1.00, 1.00),
        })
    end)
    return line
end

function D.Shade(obj, k1, k2, rotation)
    pcall(function()
        local g = D.Grad(obj)
        local a = k1 or Color3.new(1.0, 1.0, 1.0)
        local b = k2 or Color3.new(0.82, 0.84, 0.90)
        local function mix(t)
            return Color3.new(a.R + (b.R - a.R) * t, a.G + (b.G - a.G) * t, a.B + (b.B - a.B) * t)
        end
        g.Color = ColorSequence.new({
            ColorSequenceKeypoint.new(0.00, a),        -- mép trên: hắt sáng
            ColorSequenceKeypoint.new(0.10, mix(0.28)),
            ColorSequenceKeypoint.new(0.58, mix(0.62)),
            ColorSequenceKeypoint.new(1.00, b),        -- đáy: hút tối
        })
        g.Rotation = rotation or 90
    end)
    return obj
end

function D.PaintText(obj, c1, c2)
    pcall(function()
        obj.TextColor3 = Color3.new(1, 1, 1)
        local g = D.Grad(obj)
        g.Color = ColorSequence.new(c1, c2 or c1)
        g.Rotation = 0
    end)
    return obj
end

function D.Tactile(btn, baseTrans)
    baseTrans = baseTrans or 0.08
    pcall(function()
        trackConn(btn.MouseEnter:Connect(function()
            Tween(btn, {BackgroundTransparency = math.max(0, baseTrans - 0.06)}, 0.16)
        end))
        trackConn(btn.MouseLeave:Connect(function()
            Tween(btn, {BackgroundTransparency = baseTrans}, 0.2)
        end))
        trackConn(btn.MouseButton1Down:Connect(function()
            Tween(btn, {BackgroundTransparency = math.min(1, baseTrans + 0.12)}, 0.08)
        end))
        trackConn(btn.MouseButton1Up:Connect(function()
            Tween(btn, {BackgroundTransparency = baseTrans}, 0.14)
        end))
    end)
    return btn
end

function D.HoverText(btn, overColor, downColor)
    pcall(function()
        local base = btn.TextColor3
        trackConn(btn.MouseEnter:Connect(function() Tween(btn, {TextColor3 = overColor or C.WHITE}, 0.15) end))
        trackConn(btn.MouseLeave:Connect(function() Tween(btn, {TextColor3 = base}, 0.2) end))
        trackConn(btn.MouseButton1Down:Connect(function()
            Tween(btn, {TextColor3 = downColor or overColor or C.WHITE}, 0.08)
        end))
    end)
    return btn
end

function D.Glow(obj, color, pad, trans)
    local glow = nil
    pcall(function()
        if not obj or not obj.Parent then return end
        pad = pad or 7
        local function posOf()
            local pp = obj.Position
            return UDim2.new(pp.X.Scale, pp.X.Offset - pad, pp.Y.Scale, pp.Y.Offset - pad)
        end
        glow = New("Frame", {
            Name = "BC_Glow",
            Size = UDim2.new(1, pad * 2, 1, pad * 2),
            Position = posOf(),
            BackgroundColor3 = color or C.ACCENT,
            BackgroundTransparency = trans or 0.86,
            BorderSizePixel = 0,
            ZIndex = (obj.ZIndex or 1) - 1,
        }, obj.Parent)
        Corner(glow, UDim.new(1, 0))
        trackConn(obj:GetPropertyChangedSignal("Position"):Connect(function()
            pcall(function() glow.Position = posOf() end)
        end))
    end)
    return glow
end

function D.SetBg(obj, color, trans)
    pcall(function()
        if not obj then return end
        obj.BackgroundColor3 = color
        if trans ~= nil then obj.BackgroundTransparency = trans end
        if obj:IsA("TextButton") or obj:IsA("TextLabel") then
            obj.TextColor3 = D.BestText(color)
        end
        local st = obj:FindFirstChildOfClass("UIStroke")
        if st then st.Color = D.Edge(color) end
    end)
    return obj
end

function D.Breathe(obj, props, dur)
    pcall(function()
        local ti = TweenInfo.new(dur or 1.9, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut, -1, true)
        TweenService:Create(obj, ti, props):Play()
    end)
end

local function ReleaseHubFocus()
    pcall(function()
        local tb = UserInputService:GetFocusedTextBox()
        if tb then tb:ReleaseFocus() end
    end)
    pcall(function() playerGui:ReleaseFocus() end)
end

if targetGui:FindFirstChild("ExMenu") then
    targetGui.ExMenu:Destroy()
end

local gui = New("ScreenGui", {
    Name="ExMenu",
    IgnoreGuiInset=true,
    ResetOnSpawn=false,
    ZIndexBehavior=Enum.ZIndexBehavior.Sibling,
}, targetGui)

local togBtn = New("TextButton", {
    Size=UDim2.new(0,48,0,48),
    Position=UDim2.new(1,-60,1,-60),
    Text="",
    BackgroundColor3=Color3.fromRGB(0,0,0),
    BackgroundTransparency=1, -- trong suốt hoàn toàn, không che màn hình
    TextColor3=Color3.fromRGB(255,255,255),
    Font=Enum.Font.GothamBold,
    TextSize=32,
    BorderSizePixel=0,
    ZIndex=1000,
}, gui)
Corner(togBtn, UDim.new(1,0))
-- viền cầu vồng mỏng, chỉ viền, không che
local rainbowStroke = Instance.new("UIStroke")
rainbowStroke.Thickness = 2
rainbowStroke.Color = Color3.fromRGB(255,255,255)
rainbowStroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
rainbowStroke.Parent = togBtn
pcall(function()
    local grad = Instance.new("UIGradient")
    grad.Color = ColorSequence.new{
        ColorSequenceKeypoint.new(0.00, Color3.fromRGB(255,0,0)),
        ColorSequenceKeypoint.new(0.20, Color3.fromRGB(255,255,0)),
        ColorSequenceKeypoint.new(0.40, Color3.fromRGB(0,255,0)),
        ColorSequenceKeypoint.new(0.60, Color3.fromRGB(0,255,255)),
        ColorSequenceKeypoint.new(0.80, Color3.fromRGB(0,0,255)),
        ColorSequenceKeypoint.new(1.00, Color3.fromRGB(255,0,255)),
    }
    grad.Rotation = 0
    grad.Parent = rainbowStroke
    task.spawn(function()
        while true do
            if not togBtn.Parent then break end
            for r=0,360,4 do
                if not togBtn.Parent then break end
                pcall(function() grad.Rotation = r end)
                task.wait(0.03)
            end
        end
    end)
end)
D.Tactile(togBtn, 1)
-- đã bỏ glow toàn màn hình để không che góc phải khi kéo nút vào giữa

local main = New("Frame", {
    Size=UDim2.new(0,540,0,340),
    Position=UDim2.new(0.5,-270,0.5,-170),
    BackgroundColor3=C.BG,
    BackgroundTransparency=0,      -- v4.9: đục tuyệt đối để gradient 4 chặng lên đúng màu
    BorderSizePixel=0,
    Visible=false,
    ClipsDescendants=false,
    ZIndex=2,
}, gui)
Corner(main, UDim.new(0,16))
Stroke(main, C.HAIRLINE, 1.2)
D.Paint3(main, {C.SURFACE2, C.BG, C.BG, C.DEEP}, 90)

local Hit = {}

function Hit.inObject(o, x, y)
    if not o then return false end
    local ok, res = pcall(function()
        if not o.Visible then return false end
        local p, s = o.AbsolutePosition, o.AbsoluteSize
        return x >= p.X and x <= p.X + s.X and y >= p.Y and y <= p.Y + s.Y
    end)
    return ok and res == true
end

function Hit.onHub(x, y)
    local ok, objs = pcall(function()
        return playerGui:GetGuiObjectsAtPosition(x, y)
    end)
    if ok and type(objs) == "table" then
        for _, o in ipairs(objs) do
            if o == gui or o:IsDescendantOf(gui) then return true end
        end
    end
    if Hit.inObject(main, x, y) then return true end
    if Hit.inObject(togBtn, x, y) then return true end
    return false
end

local bgPattern = New("ImageLabel", {
    Name = "CheckeredBG",
    Size = UDim2.new(1, 0, 1, 0),
    Position = UDim2.new(0, 0, 0, 0),
    BackgroundTransparency = 1,
    Image = "rbxassetid://9822602710",
    ScaleType = Enum.ScaleType.Tile,
    TileSize = UDim2.new(0, 13, 0, 13),               -- v4.9: hạt nhỏ hơn -> chất liệu mịn như vải, không còn "caro"
    ImageTransparency = 0.955,                        -- v4.9: nhẹ hơn nữa, chỉ còn là ánh kim loại
    ImageColor3 = C.ACCENT2,                          -- v4.9: ánh đồng (trước là vàng chuối gắt)
    ZIndex = 2,
}, main)
Corner(bgPattern, UDim.new(0, 14))

local titleBar = New("Frame", {
    Size=UDim2.new(1,0,0,30),
    BackgroundColor3=C.SURFACE2,
    BackgroundTransparency=0,      -- v4.9: đục để gradient 3 chặng lên đúng
    BorderSizePixel=0,
    ZIndex=3,
}, main)
Corner(titleBar, UDim.new(0,16))
D.Paint3(titleBar, {C.SURFACE3, C.SURFACE2, C.SURFACE}, 90)
D.TopLight(titleBar, C.ACCENT3, 1, 22)   -- v4.9: chỉ vàng mảnh chạy dọc mép trên cửa sổ

D.Paint3(New("Frame", {
    Name="TitleAccent", Size=UDim2.new(1,-2,0,2), Position=UDim2.new(0,1,1,-1),
    BackgroundColor3=C.ACCENT, BorderSizePixel=0, ZIndex=5,
}, titleBar), {C.ACCENT2, C.ACCENT3, C.ACCENT2}, 0)

D.PaintText(New("TextLabel", {
    Size=UDim2.new(1,-90,1,0),
    Position=UDim2.new(0,12,0,0),
    Text="taodepzai v5.0 NOIR",
    BackgroundTransparency=1,
    TextColor3=C.DARK,
    Font=Enum.Font.GothamBold,
    TextSize=13,
    TextXAlignment=Enum.TextXAlignment.Left,
    ZIndex=4,
}, titleBar), C.ACCENT, C.ACCENT3)   -- v4.9: chữ gradient vàng sâm-panh -> trắng ngà

D.verPill = New("Frame", {
    Name="VersionPill", Size=UDim2.new(0,62,0,16), Position=UDim2.new(0,158,0,7),
    BackgroundColor3=C.DEEP, BackgroundTransparency=0.15, BorderSizePixel=0, ZIndex=5,
}, titleBar)
Corner(D.verPill, UDim.new(1,0))
Stroke(D.verPill, C.ACCENT2, 1)   -- v4.9: huy hiệu đen + viền đồng, chữ champagne
New("TextLabel", {
    Size=UDim2.new(1,0,1,0), Text="v5.0 · NOIR", BackgroundTransparency=1,
    TextColor3=C.ACCENT3, Font=Enum.Font.GothamBold, TextSize=8, ZIndex=6,
}, D.verPill)

local function TitleBtn(txt, xOff)
    return New("TextButton", {
        Size=UDim2.new(0,30,0,30), Position=UDim2.new(1,-xOff,0,0), Text=txt,
        BackgroundTransparency=1, TextColor3=C.MUTED, Font=Enum.Font.GothamBold,
        TextSize=15, BorderSizePixel=0, ZIndex=4,
    }, titleBar)
end
local dragLockBtn = TitleBtn("🔒", 64)
local closeBtn    = TitleBtn("✕", 32)
D.HoverText(closeBtn, C.RED, C.RED)
D.HoverText(dragLockBtn, C.ACCENT, C.ACCENT)

local minW, minH = 440, 260

local function BcFit()
    local fn = _G.BananaCatHub_SyncEmbeds
    if type(fn) ~= "function" then return end
    local ok, now = pcall(os.clock)
    if ok and _G.BcFitLast and now - _G.BcFitLast < 0.05 then return end
    _G.BcFitLast = ok and now or 0
    task.defer(fn)
end

local function SetupResizeHandle(btn, cornerType)
    local resizing, sizeStart, posStart, inputStart
    trackConn(btn.InputBegan:Connect(function(i)
        if i.UserInputType==Enum.UserInputType.MouseButton1 or i.UserInputType==Enum.UserInputType.Touch then
            pcall(function() if D.openTween then D.openTween:Cancel() D.openTween = nil end end)  -- v4.5
            resizing=true
            sizeStart=main.Size
            posStart=main.Position
            inputStart=i.Position
        end
    end))
    trackConn(UserInputService.InputChanged:Connect(function(i)
        if resizing and sizeStart and posStart and inputStart and (i.UserInputType==Enum.UserInputType.MouseMovement or i.UserInputType==Enum.UserInputType.Touch) then
            local d = i.Position - inputStart
            local w, h = sizeStart.X.Offset, sizeStart.Y.Offset
            local posX, posY = posStart.X.Offset, posStart.Y.Offset
            local newW, newH = w, h
            local newX, newY = posX, posY
            if cornerType == "BR" then
                newW = math.max(minW, w + d.X)
                newH = math.max(minH, h + d.Y)
            elseif cornerType == "BL" then
                newW = math.max(minW, w - d.X)
                newH = math.max(minH, h + d.Y)
                newX = posX + (w - newW)
            elseif cornerType == "TR" then
                newW = math.max(minW, w + d.X)
                newH = math.max(minH, h - d.Y)
                newY = posY + (h - newH)
            elseif cornerType == "TL" then
                newW = math.max(minW, w - d.X)
                newH = math.max(minH, h - d.Y)
                newX = posX + (w - newW)
                newY = posY + (h - newH)
            end
            main.Size = UDim2.new(sizeStart.X.Scale, newW, sizeStart.Y.Scale, newH)
            main.Position = UDim2.new(posStart.X.Scale, newX, posStart.Y.Scale, newY)
        end
    end))
    trackConn(UserInputService.InputEnded:Connect(function(i)
        if i.UserInputType==Enum.UserInputType.MouseButton1 or i.UserInputType==Enum.UserInputType.Touch then
            resizing=false
        end
    end))
end

local function CreateHandle(icon, pos)
    local btn = New("TextButton", {
        Size=UDim2.new(0,20,0,20),
        Position=pos,
        Text=icon,
        BackgroundColor3=C.SURFACE3,
        BackgroundTransparency=0.35,
        TextColor3=C.MUTED,
        Font=Enum.Font.GothamBold,
        TextSize=11,
        BorderSizePixel=0,
        ZIndex=100,
    }, main)
    Corner(btn, UDim.new(0,5))
    Stroke(btn, C.HAIRLINE, 1)
    D.Shade(btn, Color3.fromRGB(255,255,255), Color3.fromRGB(190,196,210), 90)
    D.Tactile(btn, 0.35)
    return btn
end

SetupResizeHandle(CreateHandle("↖", UDim2.new(0, 2, 0, 2)), "TL")
SetupResizeHandle(CreateHandle("↗", UDim2.new(1, -22, 0, 2)), "TR")
SetupResizeHandle(CreateHandle("↙", UDim2.new(0, 2, 1, -22)), "BL")
SetupResizeHandle(CreateHandle("↘", UDim2.new(1, -22, 1, -22)), "BR")

local tabs = {}
local tabContent = {}

local tabBar = New("ScrollingFrame", {
    Size=UDim2.new(0,56,1,-30),
    Position=UDim2.new(0,0,0,30),
    BackgroundColor3=C.SURFACE,
    BackgroundTransparency=0,
    BorderSizePixel=0,
    ZIndex=3,
    ScrollBarThickness=3,
    CanvasSize=UDim2.new(0,0,0,0),
}, main)
D.Paint3(tabBar, {C.SURFACE, C.BG, C.DEEP}, 90)

New("Frame", {
    Name="TabRailDivider", Size=UDim2.new(0,1,1,-30), Position=UDim2.new(0,56,0,30),
    BackgroundColor3=C.HAIRLINE, BackgroundTransparency=0.45, BorderSizePixel=0, ZIndex=4,
}, main)

New("UIListLayout", {
    FillDirection=Enum.FillDirection.Vertical,
    SortOrder=Enum.SortOrder.LayoutOrder,
    Padding=UDim.new(0,4),
}, tabBar)

New("UIPadding", {PaddingTop=UDim.new(0,6), PaddingLeft=UDim.new(0,4)}, tabBar)

local contentArea = New("Frame", {
    Size=UDim2.new(1,-56,1,-54),     -- v4.5: nhường 56px cho thanh icon + 24px cho header trang
    Position=UDim2.new(0,56,0,54),
    BackgroundTransparency=1,
    BorderSizePixel=0,
    ZIndex=3,
    ClipsDescendants=true,
}, main)

D.pageHeader = New("Frame", {
    Name="PageHeader", Size=UDim2.new(1,-56,0,24), Position=UDim2.new(0,56,0,30),
    BackgroundColor3=C.SURFACE, BackgroundTransparency=0.2, BorderSizePixel=0, ZIndex=3,
}, main)
D.Paint3(D.pageHeader, {C.SURFACE2, C.SURFACE}, 90)   -- v4.9: dải chrome mảnh dưới thanh tiêu đề
D.pageTitle = New("TextLabel", {
    Name="PageTitle", Size=UDim2.new(1,-196,1,0), Position=UDim2.new(0,10,0,0),
    Text="💾 Code Đã Lưu", BackgroundTransparency=1, TextColor3=C.ACCENT,   -- v4.6.2: trang đầu tiên
    Font=Enum.Font.GothamBold, TextSize=11,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=5,
}, D.pageHeader)
D.pageChips = New("Frame", {
    Name="PageChips", Size=UDim2.new(0,150,1,-6), Position=UDim2.new(1,-156,0,3),
    BackgroundTransparency=1, BorderSizePixel=0, ZIndex=5,
}, D.pageHeader)
New("UIListLayout", {
    FillDirection=Enum.FillDirection.Horizontal, Padding=UDim.new(0,8),
    SortOrder=Enum.SortOrder.LayoutOrder, VerticalAlignment=Enum.VerticalAlignment.Center,
}, D.pageChips)

D.hdrSwitches = {}
for i, sw in ipairs({
    {key="embed", icon="🧩", onColor=C.GREEN,  tip="Nhúng GUI của script vào tab tính năng"},
    {key="guess", icon="🕵", onColor=C.ORANGE, tip="Đoán GUI tạo trễ (dễ ăn nhầm GUI game)"},
    {key="park",  icon="🪟", onColor=C.GREEN,  tip="Đưa GUI của tab 💻 Code vào menu"},
}) do
    local btn = New("TextButton", {
        Size=UDim2.new(0,42,0,16), Text="", AutoButtonColor=false,
        BackgroundTransparency=1, BorderSizePixel=0, LayoutOrder=i, ZIndex=6,
    }, D.pageChips)
    btn:SetAttribute("BCSwKey", sw.key)
    local ic = New("TextLabel", {
        Size=UDim2.new(0,14,1,0), Position=UDim2.new(0,0,0,0), Text=sw.icon,
        BackgroundTransparency=1, TextColor3=C.MUTED, Font=Enum.Font.GothamBold,
        TextSize=10, TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
    }, btn)
    local track = New("Frame", {
        Name="BC_SwTrack", Size=UDim2.new(0,26,0,12), Position=UDim2.new(1,-26,0,2),
        BackgroundColor3=C.SURFACE3, BorderSizePixel=0, ZIndex=7,
    }, btn)
    Corner(track, UDim.new(1,0))
    local trackStroke = Stroke(track, C.HAIRLINE, 1)
    local knob = New("Frame", {
        Name="BC_SwKnob", Size=UDim2.new(0,8,0,8), Position=UDim2.new(0,2,0,2),
        BackgroundColor3=C.GRAY, BorderSizePixel=0, ZIndex=8,
    }, track)
    Corner(knob, UDim.new(1,0))
    D.hdrSwitches[sw.key] = {btn=btn, icon=ic, track=track, knob=knob, onColor=sw.onColor, stroke=trackStroke}

    btn.Activated:Connect(function()
        local fn = (sw.key == "embed" and S.DoToggleEmbed)
                or (sw.key == "guess" and S.DoToggleGuess)
                or (sw.key == "park"  and S.DoTogglePark)
        if type(fn) == "function" then
            pcall(fn)   -- hàm gốc đã tự đổi nhãn nút, ghi đĩa và báo trạng thái
        end
        D.SyncPageChips()
        pcall(function() if S.SyncEmbedToggles then S.SyncEmbedToggles() end end)
    end)
    btn.MouseEnter:Connect(function()
        D.pageTitle.Text = sw.icon .. "  " .. sw.tip
        D.pageTitle.TextColor3 = C.DARK
        D.pageTitle.TextTransparency = 0.25
    end)
    btn.MouseLeave:Connect(function()
        D.pageTitle.TextColor3 = C.ACCENT
        local back = D.hoverName or D.activeName
        if back then D.pageTitle.Text = back end
        D.pageTitle.TextTransparency = D.hoverName and 0.4 or 0
    end)
end
New("Frame", {   -- kẻ mảnh dưới header
    Name="PageHeaderRule", Size=UDim2.new(1,-56,0,1), Position=UDim2.new(0,56,0,53),
    BackgroundColor3=C.HAIRLINE, BackgroundTransparency=0.5, BorderSizePixel=0, ZIndex=4,
}, main)

local activeTab = nil

local function SwitchTab(index)
    ReleaseHubFocus()   -- v4.4b: đổi tab mà để TextBox còn focus là game chặn input (không đi/không bắn)
    for _, t in ipairs(tabContent) do t.Visible = false end
    for _, b in ipairs(tabs) do
        b.BackgroundColor3 = C.SURFACE2
        b.BackgroundTransparency = 1
        b.TextColor3 = C.MUTED
        D.Unpaint(b)   -- v4.9: rửa gradient của lần mở trước để pill ghost/hover lên đúng màu
        local bar = b:FindFirstChild("BC_Bar")
        if bar then bar.Visible = false end
    end
    if tabContent[index] and tabs[index] then
        tabContent[index].Visible = true
        local b = tabs[index]
        b.BackgroundColor3 = C.SURFACE2
        b.BackgroundTransparency = 0.1
        b.TextColor3 = C.ACCENT
        D.Paint3(b, {C.SURFACE3, C.SURFACE2, C.SURFACE}, 90)
        local bar = b:FindFirstChild("BC_Bar")
        if not bar then
            bar = New("Frame", {
                Name = "BC_Bar", Size = UDim2.new(0, 3, 1, -12), Position = UDim2.new(0, 2, 0, 6),
                BackgroundColor3 = C.ACCENT, BorderSizePixel = 0, ZIndex = 6,
            }, b)
            Corner(bar, UDim.new(1, 0))
            D.Paint3(bar, {C.ACCENT3, C.ACCENT, C.ACCENT2}, 90)   -- v4.9: vạch như thanh kim loại đánh bóng
        end
        bar.Visible = true
        activeTab = tabContent[index]
        pcall(function()
            if D.pageTitle then
                local ic = b:GetAttribute("BCTabIcon")
                local nm = b:GetAttribute("BCTabName")
                D.activeName = (ic and (ic .. "  ") or "") .. tostring(nm or ("Trang " .. index))
                if not D.hoverName then
                    D.pageTitle.Text = D.activeName
                    D.pageTitle.TextTransparency = 0
                end
            end
        end)
    end
    BcFit()   -- v4.4c: tab vừa hiện -> đo lại để GUI nằm vừa đúng ô của tab
end

local function OpenFirstPage()
    local idx, best = 1, nil
    for i, b in ipairs(tabs) do
        local o = b and b.LayoutOrder
        if type(o) == "number" and (best == nil or o < best) then best = o; idx = i end
    end
    SwitchTab(idx)
end

local function MakeTabFrame()
    return New("ScrollingFrame", {
        Size=UDim2.new(1,0,1,0),
        BackgroundTransparency=1,
        BorderSizePixel=0,
        ScrollBarThickness=4,                                   -- v4.9: mảnh hơn
        ScrollBarImageColor3=Color3.fromRGB(88, 96, 118),       -- v4.9: thấy rõ trên nền obsidian
        ClipsDescendants=true,
        CanvasSize=UDim2.new(0,0,0,0),
        Visible=false,
        Active=true,
        Selectable=false,
        ScrollingDirection=Enum.ScrollingDirection.Y,
        ZIndex=4,
    }, contentArea)
end

local function MakeTabButton(name, icon, order, onClick)
    local btn = New("TextButton", {
        Size=UDim2.new(1,-8,0,38),        -- v4.5 Delta: ô icon 48x38
        Text=icon,                        -- CHỈ icon; tên trang hiện ở header
        BackgroundColor3=C.SURFACE2,      -- pill ghost (SwitchTab tô màu khi trang mở)
        BackgroundTransparency=1,
        TextColor3=C.MUTED,
        Font=Enum.Font.GothamBold,
        TextSize=16,
        BorderSizePixel=0,
        LayoutOrder=order,
        TextXAlignment=Enum.TextXAlignment.Center,
        ZIndex=4,
    }, tabBar)
    Corner(btn, UDim.new(0,10))           -- v4.5 Delta: bo 10px cho ô icon
    pcall(function()
        btn:SetAttribute("BCTabName", name)   -- header + hover đọc tên trang từ đây
        btn:SetAttribute("BCTabIcon", icon)
    end)
    pcall(function()
        trackConn(btn.MouseEnter:Connect(function()
            if btn.BackgroundTransparency > 0.5 then Tween(btn, {BackgroundTransparency = 0.62}, 0.16) end
            pcall(function()   -- v4.5 Delta: rê vào icon nào thì header hiện TÊN trang đó (mờ nhẹ)
                if D.pageTitle then
                    D.hoverName = btn:GetAttribute("BCTabName")
                    local ic = btn:GetAttribute("BCTabIcon")
                    D.pageTitle.Text = (ic and (ic .. "  ") or "") .. tostring(D.hoverName or "")
                    D.pageTitle.TextTransparency = 0.4
                end
            end)
        end))
        trackConn(btn.MouseLeave:Connect(function()
            if btn.TextColor3 ~= C.ACCENT then Tween(btn, {BackgroundTransparency = 1}, 0.2) end
            pcall(function()   -- rời chuột: header trả về tên trang ĐANG MỞ
                D.hoverName = nil
                if D.pageTitle and D.activeName then
                    D.pageTitle.Text = D.activeName
                    D.pageTitle.TextTransparency = 0
                end
            end)
        end))
    end)
    btn.Activated:Connect(function()
        for i, b in ipairs(tabs) do
            if b == btn then
                SwitchTab(i)
                if onClick then pcall(onClick) end
                break
            end
        end
    end)
    return btn
end

local function AddTab(name, icon, order, customContent)
    local sf
    if customContent then
        sf = customContent
        sf.Parent = contentArea
        sf.Visible = false
    else
        sf = MakeTabFrame()
    end
    local btn = MakeTabButton(name, icon, order)
    table.insert(tabs, btn)
    table.insert(tabContent, sf)
    tabBar.CanvasSize = UDim2.new(0, 0, 0, #tabs * 44 + 10)
    return sf, btn
end
local codeTab      = AddTab("Code", "💻", 2)
local savedCodeTab = AddTab("Code Đã Lưu", "💾", 1)

OpenFirstPage()   -- mở tab Code Đã Lưu thường theo bố cục bản gốc

S = {
    dragMenu     = false,
    dragging     = false,
    dragStart    = nil,
    startPos     = nil,
    togDragging  = false,
    togDragStart = nil,
    togStartPos  = nil,
    togMoved     = false,
    embedEnabled = true,     -- tab 5 có nút 🧩 để tắt hoàn toàn việc nhúng
    embedGuessNew = false,   -- 🕵 nhận cả ScreenGui "lạ" mới xuất hiện (mạnh hơn nhưng dễ ăn GUI game)
    parkCodeGuis = true,
    embeds       = {},       -- registry: {host, gui, recs={{child,origParent,origPos,origSize}}, conns={}}

}

S.WRAP_MARK_OLD = "-- ===== AUTO-GENERATED SIZE WRAPPER"
S.WRAP_MARK_NEW = "-- ===== AUTO-GENERATED FIT WRAPPER"
function S.SanitizeCode(c)
    if type(c) ~= "string" then return c end
    if not c:find(S.WRAP_MARK_OLD, 1, true) then return c end
    local out = (c:gsub(
        "pcall%s*%(%s*function%s*%(%)%s*_ForceStretch%s*%(%s*g%s*%)%s*end%s*%)",
        ""))
    return out
end

-- BEGIN EXECUTOR_GLOBALS
-- Nhận diện đúng môi trường executor; giữ dấu shim qua lần nạp lại hub.
S.shimmedFns = type(_G.BananaCatHub_ExecutorShims) == "table" and _G.BananaCatHub_ExecutorShims or {}
_G.BananaCatHub_ExecutorShims = S.shimmedFns

function S.ExecutorEnv()
    if type(S.executorEnv) == "table" then return S.executorEnv end
    if type(getgenv) == "function" and getgenv ~= S.shimmedFns.getgenv then
        local ok, env = pcall(getgenv)
        if ok and type(env) == "table" then S.executorEnv = env; return env end
    end
    if type(getfenv) == "function" then
        local ok, env = pcall(getfenv, 0)
        if ok and type(env) == "table" then S.executorEnv = env; return env end
    end
    S.executorEnv = _G
    return _G
end

function S.GetGlobal(n)
    local env = S.ExecutorEnv()
    local ok, value = pcall(function() return env[n] end)
    if ok and value ~= nil then return value end
    if type(getfenv) == "function" then
        ok, value = pcall(function() return getfenv(0)[n] end)
        if ok and value ~= nil then return value end
    end
    return rawget(_G, n)
end

function S.HasGlobal(n) return S.GetGlobal(n) ~= nil end

function S.Shimmed(n)
    local value = S.shimmedFns and S.shimmedFns[n]
    return value ~= nil and S.GetGlobal(n) == value
end

function S.SetGlobal(n, value)
    if S.HasGlobal(n) then return false end -- không thay API thật, kể cả API không nằm trong _G
    local env = S.ExecutorEnv()
    local ok = pcall(function() env[n] = value end)
    if not ok or S.GetGlobal(n) ~= value then return false end
    S.compatAdded = S.compatAdded or {}
    S.compatAdded[#S.compatAdded + 1] = n
    S.shimmedFns[n] = value
    return true
end
-- END EXECUTOR_GLOBALS

function D.SyncPageChips()
    pcall(function()
        if not D.hdrSwitches then return end
        local state = {
            embed = (S.embedEnabled == true),
            guess = (S.embedGuessNew == true),
            park  = (S.parkCodeGuis ~= false),
        }
        for k, s in pairs(D.hdrSwitches) do
            local on = (state[k] == true)
            s.track.BackgroundColor3 = on and (s.onColor or C.GREEN) or C.SURFACE3
            s.knob.BackgroundColor3  = on and C.WHITE or C.GRAY
            s.knob.Position = on and UDim2.new(1,-10,0,2) or UDim2.new(0,2,0,2)
            s.icon.TextColor3 = on and C.DARK or C.GRAY
            if s.stroke then s.stroke.Color = on and D.Edge(s.onColor or C.GREEN) or C.HAIRLINE end
        end
    end)
end
local scripts = {}
local waypoints = {}          -- khai báo sớm để khối lưu trữ bên dưới dùng được
local featureTabs = {}        -- nt: khai báo sớm để Store.serialize() và nhãn trạng thái dùng được
local featureTabIndex = 8   -- 1=Code Đã Lưu 2=Code 3=Script Hub 4=Người Chơi 5=Hỗ Trợ 6=Thiết Lập 7=Tạo Tính Năng
local totalRuns, cancelled = 0, false
local curThread, curIndicator = nil, nil
local runActive = false       -- cờ trạng thái chạy (không dựa vào curThread nữa)

S.SupportScriptUrl = "https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/ho-tro.lua"
S.ScriptHubScriptUrl = "https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/script-hub.lua"

-- BEGIN FEATURE_LIFECYCLE
function S.CleanupFeatureCapture(ft)
    local st = ft and ft.hookState
    if not st then return end
    st.watchOn, st.inRun = false, false
    if type(st.stopWatch) == "function" then pcall(st.stopWatch) end
    if type(st.unhook) == "function" then pcall(st.unhook) end
    ft.hookState = nil
end

function S.CancelFeatureRun(ft)
    if not ft then return end
    ft._runToken = (tonumber(ft._runToken) or 0) + 1
    ft._jobToken = nil
    local thread = ft._thread
    ft._thread, ft.running, ft.hasRun = nil, false, false
    ft.state = "idle"
    if S.featureRunOwner == ft then S.featureRunOwner = nil end
    S.CleanupFeatureCapture(ft)
    if type(thread) == "thread" and thread ~= coroutine.running() then pcall(task.cancel, thread) end
end

function S.StartFeatureRun(ft, force)
    if not ft or ft.destroyed or not ft.frame or not ft.frame.Parent then return false, "Tab đã đóng" end
    if ft.running then return true, "running" end
    if ft.hasRun and not force then return true, "opened" end
    if runActive then return false, "Tab Code đang chạy; hãy dừng hoặc chờ xong trước khi kích hoạt" end
    local owner = S.featureRunOwner
    if owner and owner.running and owner ~= ft then
        return false, "Một script khác đang khởi chạy; hãy chờ xong rồi kích hoạt"
    end
    if type(ft.execute) ~= "function" then return false, "Tab chưa có hàm chạy script" end
    local token = {}
    ft._jobToken, ft.running, ft.state, ft.error = token, true, "running", nil
    S.featureRunOwner = ft
    local spawned, thread = pcall(task.spawn, function()
        local called, result, why = pcall(ft.execute)
        if ft._jobToken ~= token then return end -- tab bị xoá/huỷ trong lúc script yield
        ft._thread, ft.running = nil, false
        ft.hasRun = called and result == true
        ft.state = ft.hasRun and "ready" or "error"
        ft.error = not ft.hasRun and tostring(called and why or result) or nil
        if S.featureRunOwner == ft then S.featureRunOwner = nil end
        if not ft.hasRun then
            S.CleanupFeatureCapture(ft)
            pcall(function()
                if ft.status and ft.status.Parent then ft.status.Text = "❌ " .. tostring(ft.error) end
            end)
        end
    end)
    if not spawned then
        ft._jobToken, ft.running, ft.hasRun, ft.state = nil, false, false, "error"
        ft.error = tostring(thread)
        if S.featureRunOwner == ft then S.featureRunOwner = nil end
        return false, ft.error
    end
    if ft._jobToken == token and ft.running then ft._thread = thread end -- task.spawn có thể xong ngay
    return true, "running"
end
-- END FEATURE_LIFECYCLE

local Store = {}

Store.SAVE_FILE      = "banana_cat_saved.json"
Store.SAVE_VERSION   = 3
Store.mode           = "none"   -- "file" | "memory" | "empty" | "none"
Store.lastError      = nil
Store.lastSavedAt    = nil
Store.saveCount      = 0
Store.loadedScripts  = 0
Store.loadedWp       = 0
Store.loadedFeatures = {}     -- dữ liệu thô đọc từ đĩa; TAB5 sẽ dựng thành tab thật
Store.restoreFeatures = nil   -- TAB5 gán hàm dựng lại tab tính năng vào đây
Store.restoreWaypoints = nil  -- module Hỗ Trợ dùng getter dữ liệu waypoint sống
Store.statusLbl      = nil      -- nhãn trạng thái của tab Code Đã Lưu thường
Store.reloadBtn      = nil
Store._scheduled     = false
Store.refreshStatus  = nil      -- cập nhật nhãn lưu trong tab Code Đã Lưu

function Store.canWrite()
    if type(S.GetGlobal("writefile")) ~= "function" or type(S.GetGlobal("readfile")) ~= "function" then return false end
    if S.Shimmed("writefile") or S.Shimmed("readfile") then return false end
    return true
end

function Store.isFinite(n)
    return type(n) == "number" and n == n and n ~= math.huge and n ~= -math.huge
end

function Store.write(data)
    local okEnc, json = pcall(function() return HttpService:JSONEncode(data) end)
    if not okEnc then
        Store.mode = "memory"
        Store.lastError = "Không mã hoá được JSON: " .. tostring(json)
        _G.BananaCatHub_SavedData = data
        return false
    end

    if not Store.canWrite() then
        Store.mode = "memory"
        Store.lastError = "Executor không có writefile — chỉ giữ được trong phiên chơi này"
        _G.BananaCatHub_SavedData = data
        return false
    end

    local okW, errW = pcall(S.GetGlobal("writefile"), Store.SAVE_FILE, json)
    if not okW then
        Store.mode = "memory"
        Store.lastError = "Ghi file thất bại: " .. tostring(errW)
        _G.BananaCatHub_SavedData = data
        return false
    end

    Store.mode = "file"
    Store.lastError = nil
    Store.saveCount = Store.saveCount + 1
    pcall(function() Store.lastSavedAt = os.date("%H:%M:%S") end)
    _G.BananaCatHub_SavedData = data
    return true
end

function Store.read()
    if Store.canWrite() then
        local hasFile = true
        local fileExists = S.GetGlobal("isfile")
        if type(fileExists) == "function" and not S.Shimmed("isfile") then
            local okI, r = pcall(fileExists, Store.SAVE_FILE)
            hasFile = (okI and r == true)
        end
        if hasFile then
            local okR, txt = pcall(S.GetGlobal("readfile"), Store.SAVE_FILE)
            if okR and type(txt) == "string" and #txt > 0 then
                local okD, data = pcall(function() return HttpService:JSONDecode(txt) end)
                if okD and type(data) == "table" then
                    Store.mode = "file"
                    Store.lastError = nil
                    return data
                end
                Store.lastError = "File lưu bị hỏng (JSON không đọc được) — đã bỏ qua"
            end
        end
    end
    if Store.lastError and Store.lastError:find("bị hỏng", 1, true) then
        Store.mode = "none"
        return nil
    end
    if type(_G.BananaCatHub_SavedData) == "table" then
        Store.mode = "memory"
        return _G.BananaCatHub_SavedData
    end
    Store.mode = "none"
    return nil
end

function Store.serialize()
    local sOut = {}
    for _, s in ipairs(scripts) do
        table.insert(sOut, {
            name     = tostring(s.name or ""),
            code     = tostring(s.code or ""),
            expanded = (s.expanded == true),
        })
    end
    local wOut = {}
    for _, w in ipairs(waypoints) do
        local pos = w and w.pos
        if pos and Store.isFinite(pos.X) and Store.isFinite(pos.Y) and Store.isFinite(pos.Z) then
            table.insert(wOut, {name = tostring(w.name or ""), x = pos.X, y = pos.Y, z = pos.Z})
        end
    end
    local fOut = {}
    for _, f in ipairs(featureTabs) do
        -- Chỉ tab Script Hub có sẵn là transient; tab người dùng vẫn được lưu.
        if not f.transient then
            table.insert(fOut, {
                name = tostring(f.name or ""),
                icon = tostring(f.icon or "⚙️"),
                code = tostring(f.code or ""),
            })
        end
    end
    return {
        version   = Store.SAVE_VERSION,
        scripts   = sOut,
        waypoints = wOut,
        features  = fOut,
        settings  = {
            embedEnabled  = (S.embedEnabled == true),
            embedGuessNew = (S.embedGuessNew == true),
            parkCodeGuis  = (S.parkCodeGuis ~= false),   -- v4.4i
            hubFavs = (function()
                local out = {}
                if type(S.hubFavs) == "table" then
                    for nm, v in pairs(S.hubFavs) do if v then out[#out + 1] = tostring(nm) end end
                end
                return out
            end)(),
        },
    }
end

function Store.save()
    local ok = Store.write(Store.serialize())
    if Store.refreshStatus then pcall(Store.refreshStatus) end
    return ok
end

function Store.saveSoon()
    if Store._scheduled then return end
    Store._scheduled = true
    task.delay(0.3, function()
        Store._scheduled = false
        Store.save()
    end)
end

function Store.load()
    local data = Store.read()
    if type(data) ~= "table" then
        Store.mode = Store.canWrite() and "empty" or "none"
        Store.loadedScripts, Store.loadedWp = 0, 0
        Store.loadedFeatures = {}
        Store.loadedScripts = #scripts
        return
    end

    local fileVer = tonumber(data.version) or 1
    if fileVer > Store.SAVE_VERSION then
        Store.lastError = string.format(
            "File lưu là version %d, script này chỉ hiểu tới v%d — một số mục có thể không nạp",
            fileVer, Store.SAVE_VERSION)
    end

    if type(data.settings) == "table" then
        S.embedEnabled  = (data.settings.embedEnabled ~= false)
        S.embedGuessNew = (data.settings.embedGuessNew == true)
        S.parkCodeGuis  = (data.settings.parkCodeGuis ~= false)
        if type(data.settings.hubFavs) == "table" then
            S.hubFavs = {}
            for _, nm in ipairs(data.settings.hubFavs) do S.hubFavs[tostring(nm)] = true end
        end
    end

    local sOut = {}
    if type(data.scripts) == "table" then
        for _, s in ipairs(data.scripts) do
            if type(s) == "table" and type(s.code) == "string" and #s.code > 0 then
                table.insert(sOut, {
                    name     = (type(s.name) == "string" and #s.name > 0) and s.name or ("Script " .. (#sOut + 1)),
                    code     = S.SanitizeCode(s.code),
                    expanded = (s.expanded == true),
                })
            end
        end
    end

    local wOut = {}
    if type(data.waypoints) == "table" then
        for _, w in ipairs(data.waypoints) do
            if type(w) == "table" and Store.isFinite(w.x) and Store.isFinite(w.y) and Store.isFinite(w.z) then
                table.insert(wOut, {
                    name = (type(w.name) == "string" and #w.name > 0) and w.name or ("WP " .. (#wOut + 1)),
                    pos  = Vector3.new(w.x, w.y, w.z),
                })
            end
        end
    end

    local fOut = {}
    if type(data.features) == "table" then
        for _, f in ipairs(data.features) do
            if type(f) == "table" and type(f.code) == "string" and #f.code > 0 then
                table.insert(fOut, {
                    name = (type(f.name) == "string" and #f.name > 0) and f.name or ("Tính Năng " .. (#fOut + 1)),
                    icon = (type(f.icon) == "string" and #f.icon > 0) and f.icon or "⚙️",
                    code = S.SanitizeCode(f.code),
                })
            end
        end
    end

    scripts   = sOut
    waypoints = wOut
    Store.loadedFeatures = fOut
    Store.loadedScripts, Store.loadedWp = #scripts, #wOut
end

Store.load()

-- ----------------------------------------------------------------------------
S.compatAdded  = S.compatAdded or {}   -- tên các hàm đã bù (để báo lại cho người dùng)
S.compatTried  = false
S.vfs          = S.vfs or {}           -- ổ đĩa ảo trong RAM (khi executor không có readfile/writefile)
S.clipboardTxt = S.clipboardTxt or ""
S.queued       = S.queued or {}        -- queue_on_teleport: giữ lại, không tự chạy
S.lastRunReport = nil                  -- báo cáo lần chạy cuối (nhãn 💻 + nút 💾 dùng chung)
S.lastRunError  = nil
S.lastNormalizeNote = nil
S.lastParkedCount = 0
S.lastParkedNames = {}

function S.VRead(p)
    local f = S.vfs[tostring(p)]
    if f == nil then error("File not found: " .. tostring(p)) end
    return f
end
function S.VWrite(p, c)  S.vfs[tostring(p)] = tostring(c); return true end
function S.VAppend(p, c) S.vfs[tostring(p)] = (S.vfs[tostring(p)] or "") .. tostring(c); return true end
function S.VExists(p)    return S.vfs[tostring(p)] ~= nil end
function S.VDel(p)       S.vfs[tostring(p)] = nil; return true end
function S.VList(dir)
    dir = tostring(dir or ""):gsub("[/\\]+$", "")
    local out = {}
    for k in pairs(S.vfs) do
        if dir == "" or k:sub(1, #dir) == dir then out[#out + 1] = k end
    end
    return out
end

function S.CompatRequest(opts)
    if type(opts) ~= "table" then opts = {Url = tostring(opts)} end
    local url = tostring(opts.Url or opts.url or "")
    local body, status, good = "", 0, false
    pcall(function()
        local r = game:GetService("HttpService"):RequestAsync({
            Url = url,
            Method = tostring(opts.Method or opts.method or "GET"):upper(),
            Headers = opts.Headers or opts.headers,
            Body = opts.Body or opts.body,
        })
        body, status, good = tostring(r.Body or ""), tonumber(r.StatusCode) or 200, (r.Success == true)
    end)
    if body == "" then
        local okHttp, fetched = pcall(function() return game:HttpGet(url) end)
        if okHttp then
            body, status, good = tostring(fetched or ""), 200, true
        end
    end
    return {StatusCode = status, StatusMessage = "", Body = body, Success = good, Headers = {}}
end

function S.CompatDrawing()
    local D = {}
    D.Fonts = {UI = 0, System = 0, Plex = 1, Monospace = 2}
    D.new = function(cls)
        local o = {__class = tostring(cls or ""), Visible = false, ZIndex = 1, Transparency = 1}
        return setmetatable(o, {
            __index = function(t, k)
                if k == "Remove" or k == "Destroy" then
                    return function(self) rawset(self, "Visible", false) end
                end
                return rawget(t, k)
            end,
            __newindex = function(t, k, v) rawset(t, k, v) end,
        })
    end
    return D
end

function S.EnsureCompat()
    if S.compatTried then return S.compatAdded end
    S.compatTried = true
    pcall(function()
        if type(load) == "function" then
            S.SetGlobal("loadstring", function(src, nm) return load(tostring(src), nm or "compat") end)
        end
        S.SetGlobal("getgenv", function() return S.ExecutorEnv() end)
        S.SetGlobal("getrenv", function() return _G end)
        S.SetGlobal("identifyexecutor", function() return "taodepzai v5.0 NOIR-Compat", "4.7" end)
        S.SetGlobal("getexecutorname", function() return "taodepzai v5.0 NOIR-Compat" end)
        S.SetGlobal("getscript", function() return nil end)
        S.SetGlobal("getcallingscript", function() return nil end)
        S.SetGlobal("checkcaller", function() return false end)
        S.SetGlobal("isourclosure", function() return false end)
        S.SetGlobal("is_synapse_function", function() return false end)
        S.SetGlobal("setclipboard",  function(t) S.clipboardTxt = tostring(t); return true end)
        S.SetGlobal("toclipboard",   function(t) S.clipboardTxt = tostring(t); return true end)
        S.SetGlobal("set_clipboard", function(t) S.clipboardTxt = tostring(t); return true end)
        S.SetGlobal("readfile",   function(p) return S.VRead(p) end)
        S.SetGlobal("writefile",  function(p, c) return S.VWrite(p, c) end)
        S.SetGlobal("appendfile", function(p, c) return S.VAppend(p, c) end)
        S.SetGlobal("isfile",     function(p) return S.VExists(p) end)
        S.SetGlobal("delfile",    function(p) return S.VDel(p) end)
        S.SetGlobal("listfiles",  function(d) return S.VList(d) end)
        S.SetGlobal("makefolder", function() return true end)
        S.SetGlobal("isfolder",   function() return true end)
        S.SetGlobal("delfolder",  function() return true end)
        S.SetGlobal("getcustomasset", function(p) return tostring(p) end)
        S.SetGlobal("getsynasset",    function(p) return tostring(p) end)
        S.SetGlobal("request",      function(o) return S.CompatRequest(o) end)
        S.SetGlobal("http_request", function(o) return S.CompatRequest(o) end)
        S.SetGlobal("http", {request = function(o) return S.CompatRequest(o) end})
        S.SetGlobal("HttpRequest",  function(o) return S.CompatRequest(o) end)
        S.SetGlobal("hookfunction",      function(_, nw) return nw end)
        S.SetGlobal("hookmetamethod",    function() return function() end end)
        S.SetGlobal("getrawmetatable",   function(o) return getmetatable(o) or {} end)
        S.SetGlobal("setrawmetatable",   function(o, m) pcall(setmetatable, o, m); return o end)
        S.SetGlobal("setreadonly",       function() return true end)
        S.SetGlobal("isreadonly",        function() return false end)
        S.SetGlobal("newcclosure",       function(f) return f end)
        S.SetGlobal("getnamecallmethod", function() return "" end)
        S.SetGlobal("setnamecallmethod", function() return true end)
        S.SetGlobal("getconnections",    function() return {} end)
        S.SetGlobal("fireclickdetector",   function() return true end)
        S.SetGlobal("firetouchinterest",   function() return true end)
        S.SetGlobal("fireproximityprompt", function() return true end)
        S.SetGlobal("gethui", function() return targetGui end)
        S.SetGlobal("Drawing", S.CompatDrawing())
        S.SetGlobal("setfpscap", function() return true end)
        S.SetGlobal("getfpscap", function() return 60 end)
        S.SetGlobal("iswindowactive", function() return true end)
        S.SetGlobal("queue_on_teleport", function(src)
            S.queued[#S.queued + 1] = tostring(src); return true end)
    end)
    if #S.compatAdded > 0 then
        pcall(function() print("[taodepzai v5.0 NOIR] " .. S.CompatNote()) end)
    end
    return S.compatAdded
end

function S.CompatNote()
    local n = #S.compatAdded
    if n == 0 then return "" end
    local sample = {}
    for i = 1, math.min(4, n) do sample[#sample + 1] = S.compatAdded[i] end
    return "🩹 đã bù " .. n .. " hàm executor còn thiếu (" .. table.concat(sample, ", ")
        .. (n > 4 and "…" or "") .. ")"
end

function S.NormalizeRunnable(c)
    S.lastNormalizeNote = nil
    if type(c) ~= "string" then return "" end
    c = c:gsub("\239\187\191", ""):gsub("\226\128\139", "")
    c = c:gsub("\226\128\142", ""):gsub("\226\128\143", "")
    local t = c:match("^%s*(.-)%s*$") or ""
    local q = t:match('^["\'](.-)["\']$')      -- dán cả dấu nháy bao quanh link
    if q and q ~= "" then t = q end
    if t:match("^https?://") then
        if t:find('[%c"\\]') then
            S.lastNormalizeNote = "⚠️ link có ký tự lạ -> chạy nguyên văn"
            return c
        end
        S.lastNormalizeNote = "🔗 link trần -> tự bọc loadstring(game:HttpGet(...))()"
        return 'loadstring(game:HttpGet("' .. t .. '"))()'
    end
    local u = t:match('^game:HttpGet%s*%(%s*"(https?://.-)"%s*%)$')
        or t:match('^HttpGet%s*%(%s*"(https?://.-)"%s*%)$')
    if u then
        S.lastNormalizeNote = "🔗 HttpGet trần -> tự bọc loadstring(...)()"
        return 'loadstring(game:HttpGet("' .. u .. '"))()'
    end
    if t:match("^loadstring%s*%(") and t:sub(-2) ~= "()" then
        S.lastNormalizeNote = "➕ loadstring thiếu dấu () -> đã thêm để chạy được"
        return t .. "()"
    end
    return c
end

function S.RunReportText()
    local r = S.lastRunReport
    if not r then return "" end
    if r.fail > 0 and r.ok == 0 then
        local e = tostring(r.err or "không rõ"):gsub("%s+", " ")
        if #e > 160 then e = e:sub(1, 160) .. "…" end
        return "❌ Không chạy được: " .. e .. " · mở F9 xem đầy đủ"
    end
    local t = "✅ Đã chạy xong (" .. r.ok .. " lần)"
    if r.fail > 0 then t = t .. " · ⚠️ " .. r.fail .. " lần lỗi" end
    if r.guis and r.guis > 0 then
        local nm = (r.names and r.names[1]) and (" '" .. r.names[1] .. "'") or ""
        t = t .. " · 🧩 " .. r.guis .. " GUI đã vào tab 'GUI Ngoài'" .. nm .. " (bấm ↩ trả ra màn hình)"
    elseif r.parked then
        t = t .. " · " .. r.parked
    end
    if r.note then t = t .. " · " .. r.note end
    if r.compat and r.compat ~= "" then t = t .. " · " .. r.compat end
    return t
end

local function ExecOnce(code, name)
    if #name>0 then print("👤 Chạy bởi:", name) end
    code = S.SanitizeCode(code)          -- v4.4b: cắt wrapper "tự dãn kích thước" độc hại của bản cũ
    code = S.NormalizeRunnable(code)     -- v4.7: link trần / thiếu () / BOM -> chạy được
    S.EnsureCompat()                     -- v4.7: bù hàm executor còn thiếu (không đè hàm thật)
    local ok, err = pcall(function()
        local compiler = S.GetGlobal("loadstring")
        if type(compiler) ~= "function" then error("Executor không hỗ trợ loadstring để chạy script") end
        local fn, lerr = compiler(code)
        if not fn then error(lerr) end
        fn()
    end)
    if ok then
        S.lastRunError = nil
    else
        S.lastRunError = tostring(err)
        pcall(function() warn("[taodepzai v5.0 NOIR] ❌ '" .. tostring(name) .. "' lỗi: " .. tostring(err)) end)
    end
    return ok, err
end

local function Cancel()
    pcall(function() if S.AbortRunCapture then S.AbortRunCapture() end end)
    cancelled=true
    runActive=false
    if curThread then pcall(task.cancel, curThread); curThread=nil end
    if curIndicator then curIndicator.BackgroundColor3=C.BLUE; curIndicator=nil end
end

local function RunCode(code, name, ind, times, delay, noPark)
    if S.featureRunOwner and S.featureRunOwner.running then
        return false, "Một tab tính năng đang khởi chạy; hãy chờ xong trước khi chạy Code"
    end
    Cancel()
    ReleaseHubFocus()   -- v4.4b: nhả focus TextBox, nếu không game chặn hết input (không đi/không bắn)
    if #code==0 then return false, "⚠️ Vui lòng nhập code!" end
    cancelled=false
    if ind then curIndicator=ind; ind.BackgroundColor3=C.RED end
    local okC, failC = 0, 0
    local thread=task.spawn(function()
        runActive=true
        S.lastParkedCount, S.lastParkedNames = 0, {}   -- v4.7: đếm GUI của RIÊNG lần chạy này
        S.lastRunError = nil
        local skipPark, skipWhy = (noPark == true), (noPark == true and "nút script nhanh" or nil)
        if not skipPark and S.ShouldSkipPark then
            local s2, w2 = S.ShouldSkipPark(code, name)
            if s2 then skipPark, skipWhy = true, w2 end
        end
        local cap = nil
        if skipPark then
            S.lastParkNote = "🪟 GUI để NGOÀI màn hình game (công cụ cửa sổ riêng) — không đưa vào menu"
            pcall(function()
                print("[taodepzai v5.0 NOIR] 🛠 '" .. tostring(name) .. "': GUI ở NGOÀI màn hình game như cũ"
                    .. " (lý do không đưa vào menu: " .. tostring(skipWhy) .. ")")
            end)
        else
            S.lastParkNote = nil
            cap = S.BeginRunCapture()
        end
        for i=1,times do
            if cancelled then break end
            if i>1 and delay>0 then
                local e=0
                while e<delay do
                    if cancelled then break end
                    task.wait(0.1); e+=0.1
                end
                if cancelled then break end
            end
            local ok, err = ExecOnce(code, name)
            if ok then okC+=1 else failC+=1; warn("❌ Lần",i,err) end
            if cap then
                S.EndRunCapture(cap, (#name>0 and name or "Script"))
                S.lastParkedCount = cap.parked or 0    -- v4.7: để báo "GUI đang nằm ở đâu"
                S.lastParkedNames = cap.names or {}
                cap = nil
            end
        end
        if cap then S.EndRunCapture(cap, (#name>0 and name or "Script")) cap = nil end
        S.lastRunReport = {
            name   = name,
            ok     = okC,
            fail   = failC,
            err    = S.lastRunError,
            parked = (skipPark and S.lastParkNote or nil),
            guis   = S.lastParkedCount,
            names  = S.lastParkedNames,
            note   = S.lastNormalizeNote,
            compat = S.CompatNote(),
        }
        totalRuns+=okC+failC
        if ind then ind.BackgroundColor3=C.GREEN; if curIndicator==ind then curIndicator=nil end end
        runActive=false
        curThread=nil
    end)
    if runActive then curThread=thread end -- task.spawn có thể hoàn tất ngay; không giữ thread đã chết
    return true, nil
end

local function Label(parent, text, y)
    local isRule = (tostring(text):find("━") ~= nil)
    return New("TextLabel", {
        Size=UDim2.new(1,-16,0,14), Position=UDim2.new(0,8,0,y or 0),
        Text=text, BackgroundTransparency=1,
        TextColor3=(isRule and C.BORDER or C.MUTED),   -- v4.5: chữ phụ / đường kẻ trên nền tối
        Font=Enum.Font.GothamMedium, TextSize=10, TextXAlignment=Enum.TextXAlignment.Left, ZIndex=6,
    }, parent)
end

local function Button(parent, text, x, y, w, h, color)
    local base = color or C.SURFACE3
    local btn = New("TextButton", {
        Size=UDim2.new(0,w or 100,0,h or 24), Position=UDim2.new(0,x or 8,0,y or 0),
        Text=text, BackgroundColor3=base, BackgroundTransparency=0.08,
        TextColor3=D.BestText(base), Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=6,
    }, parent)
    Corner(btn, UDim.new(0,8))
    Stroke(btn, D.Edge(base), 1.1)
    D.Shade(btn, Color3.fromRGB(255,255,255), Color3.fromRGB(182,187,201), 90)
    D.Tactile(btn, 0.08)
    return btn
end

function S.Debounce(key, secs, fn)
    S._dbt = S._dbt or {}
    local n = (S._dbt[key] or 0) + 1
    S._dbt[key] = n
    task.delay(secs or 0.18, function()
        if S._dbt[key] ~= n then return end   -- đã có phím mới hơn -> lượt này bỏ qua
        S._dbt[key] = nil
        pcall(fn)
    end)
end

local y = 8
Label(codeTab, "💻 Nhập Code Tùy Chỉnh", y)
y = y + 14
Label(codeTab, "👤 Tên Script", y)
y = y + 14

local nameIn = New("TextBox", {
    Size=UDim2.new(1,-16,0,26), Position=UDim2.new(0,8,0,y), Text="",
    PlaceholderText="Nhập tên script...", PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0, TextColor3=Color3.fromRGB(233, 237, 245),
    Font=Enum.Font.GothamMedium, TextSize=12, BorderSizePixel=0, ClearTextOnFocus=false,
    Active=true, Selectable=true, ZIndex=10, TextXAlignment=Enum.TextXAlignment.Left,
}, codeTab)
Corner(nameIn, UDim.new(0,5))
Stroke(nameIn, Color3.fromRGB(100,120,200), 1.5)
New("UIPadding", {PaddingLeft=UDim.new(0,6)}, nameIn)

y = y + 32
Label(codeTab, "💻 Code (Lua)", y)
y = y + 14

local codeIn = New("TextBox", {
    Size=UDim2.new(1,-16,0,80), Position=UDim2.new(0,8,0,y), Text="",
    PlaceholderText="-- Nhập code Lua tại đây...", PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(28, 31, 41), BackgroundTransparency=0, TextColor3=Color3.fromRGB(233, 237, 245),
    Font=Enum.Font.Code, TextSize=11, BorderSizePixel=0, ClearTextOnFocus=false,
    MultiLine=true, TextWrapped=true, TextXAlignment=Enum.TextXAlignment.Left, TextYAlignment=Enum.TextYAlignment.Top,
    Active=true, Selectable=true, ZIndex=10,
}, codeTab)
Corner(codeIn, UDim.new(0,5))
Stroke(codeIn, Color3.fromRGB(100,120,200), 1.5)
New("UIPadding", {PaddingLeft=UDim.new(0,6), PaddingTop=UDim.new(0,4)}, codeIn)

y = y + 86
Label(codeTab, "🔁 Cài đặt lặp", y)
y = y + 14
Label(codeTab, "Số lần lặp:", y)

local repIn = New("TextBox", {
    Size=UDim2.new(0,55,0,24), Position=UDim2.new(0,8,0,y+12), Text="1",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148), BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0,
    TextColor3=Color3.fromRGB(233, 237, 245), Font=Enum.Font.GothamMedium, TextSize=12, BorderSizePixel=0,
    ClearTextOnFocus=false, Active=true, Selectable=true, ZIndex=10,
}, codeTab)
Corner(repIn, UDim.new(0,5))
Stroke(repIn, Color3.fromRGB(180,180,200), 1.2)

Label(codeTab, "Thời gian chờ:", y+36)

local delIn = New("TextBox", {
    Size=UDim2.new(0,55,0,24), Position=UDim2.new(0,8,0,y+50), Text="0",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148), BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0,
    TextColor3=Color3.fromRGB(233, 237, 245), Font=Enum.Font.GothamMedium, TextSize=12, BorderSizePixel=0,
    ClearTextOnFocus=false, Active=true, Selectable=true, ZIndex=10,
}, codeTab)
Corner(delIn, UDim.new(0,5))
Stroke(delIn, Color3.fromRGB(180,180,200), 1.2)

local unitBtn = New("TextButton", {
    Size=UDim2.new(0,55,0,24), Position=UDim2.new(0,75,0,y+50), Text="Giây ▾",
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0, TextColor3=C.DARK,
    Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=10,
}, codeTab)
Corner(unitBtn,UDim.new(0,4)); Stroke(unitBtn)

local ddFrame = New("Frame", {
    Size=UDim2.new(0,55,0,48), Position=UDim2.new(0,75,0,y+74),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0, BorderSizePixel=0, Visible=false, ZIndex=15,
}, codeTab)
Corner(ddFrame,UDim.new(0,4)); Stroke(ddFrame)

local secOpt = New("TextButton", {
    Size=UDim2.new(1,0,0,24), Text="Giây", BackgroundColor3=Color3.fromRGB(28, 31, 41),
    BackgroundTransparency=0, TextColor3=C.DARK, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=16,
}, ddFrame)

local minOpt = New("TextButton", {
    Size=UDim2.new(1,0,0,24), Position=UDim2.new(0,0,0,24), Text="Phút",
    BackgroundColor3=Color3.fromRGB(28, 31, 41), BackgroundTransparency=0, TextColor3=C.DARK,
    Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=16,
}, ddFrame)

unitBtn.Activated:Connect(function() ddFrame.Visible=not ddFrame.Visible end)
secOpt.Activated:Connect(function() unitBtn.Text="Giây ▾"; ddFrame.Visible=false end)
minOpt.Activated:Connect(function() unitBtn.Text="Phút ▾"; ddFrame.Visible=false end)

trackConn(UserInputService.InputBegan:Connect(function(i,gp)
    if gp then return end
    if i.UserInputType==Enum.UserInputType.MouseButton1 or i.UserInputType==Enum.UserInputType.Touch then
        local f = Hit.inObject(unitBtn, i.Position.X, i.Position.Y)
            or Hit.inObject(ddFrame, i.Position.X, i.Position.Y)
        if not f then ddFrame.Visible=false end
    end
end))

y = y + 82

local runBtn = Button(codeTab, "▶ Chạy Code", 8, y, 336, 26, Color3.fromRGB(0,160,90))
local stopBtn = Button(codeTab, "⏹ Dừng", 350, y, 126, 26, C.RED)
y = y + 32
local saveBtn = Button(codeTab, "🔗 Lưu Vào Code Đã Lưu", 8, y, 468, 26, C.BLUE)
y = y + 32

local statusLbl = Label(codeTab, "", y)
statusLbl.TextColor3=Color3.fromRGB(255, 205, 64); statusLbl.TextSize=9; statusLbl.ZIndex=6
y = y + 14

local countLbl = Label(codeTab, "🔄 Tổng số lần đã chạy: 0", y)
countLbl.TextColor3=C.GREEN; countLbl.TextSize=9; countLbl.ZIndex=6

codeTab.CanvasSize = UDim2.new(0, 0, 0, y + 30)

stopBtn.Activated:Connect(function() Cancel(); statusLbl.Text="⏹️ Đã dừng" end)

runBtn.Activated:Connect(function()
    local t=math.clamp(tonumber(repIn.Text)or 1,1,1000)
    local d=math.max(tonumber(delIn.Text)or 0,0)
    if unitBtn.Text:find("Phút") then d=d*60 end
    local ok,err=RunCode(codeIn.Text,nameIn.Text,nil,t,d)
    if not ok then
        statusLbl.Text=err or "❌ Lỗi không xác định"
    else
        statusLbl.Text="⏳ Đang thực thi..."
        task.spawn(function()
            while runActive do
                if cancelled then statusLbl.Text="⏹️ Đã dừng"; return end
                task.wait(0.1)
            end
            if not cancelled then
                local rep7 = S.RunReportText()
                statusLbl.Text = (rep7 ~= "") and rep7
                    or ("✅ Hoàn thành!" .. (S.lastParkNote and (" · " .. S.lastParkNote) or ""))
                statusLbl.TextColor3 = (S.lastRunReport and S.lastRunReport.fail > 0
                    and S.lastRunReport.ok == 0) and C.RED or Color3.fromRGB(255, 205, 64)
            end
            countLbl.Text="🔄 Tổng số lần đã chạy: "..totalRuns
            task.delay(1.5, function()
                if statusLbl and statusLbl.Parent and (S.lastParkNote or S.lastRunReport) then
                    local rep7 = S.RunReportText()
                    if rep7 ~= "" then statusLbl.Text = rep7 end
                end
            end)
        end)
    end
end)

-- BEGIN NATIVE_SAVED_CODE
local RebuildScripts

saveBtn.Activated:Connect(function()
    local n=nameIn.Text
    local c=codeIn.Text
    if #c==0 then statusLbl.Text="⚠️ Vui lòng nhập code!"; return end
    if #n==0 then n="Script "..(#scripts+1) end
    local bn=n
    local cnt=1
    while true do
        local ex=false
        for _,s in ipairs(scripts) do if s.name==n then ex=true; break end end
        if not ex then break end
        cnt+=1; n=bn.." ("..cnt..")"
    end
    table.insert(scripts,{name=n, code=c, expanded=false})
    if RebuildScripts then RebuildScripts() end
    Store.saveSoon()
    statusLbl.Text="✅ Đã lưu vào Code Đã Lưu · " .. (Store.mode == "file" and "đã ghi file" or "đang giữ trong RAM/chờ ghi file")
end)

local sy = 8
Label(savedCodeTab, "💾 Danh Sách Script Đã Lưu", sy)
sy = sy + 18

local searchIn = New("TextBox", {
    Name="SavedCodeSearch",
    Size=UDim2.new(1,-16,0,26), Position=UDim2.new(0,8,0,sy), Text="",
    PlaceholderText="🔍 Tìm kiếm script...", PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0, TextColor3=Color3.fromRGB(233, 237, 245),
    Font=Enum.Font.GothamMedium, TextSize=12, BorderSizePixel=0, ClearTextOnFocus=false,
    Active=true, Selectable=true, ZIndex=10, TextXAlignment=Enum.TextXAlignment.Left,
}, savedCodeTab)
Corner(searchIn, UDim.new(0,5))
Stroke(searchIn, Color3.fromRGB(180,180,200), 1.2)
New("UIPadding", {PaddingLeft=UDim.new(0,6)}, searchIn)
sy = sy + 32

Store.statusLbl = New("TextLabel", {
    Size=UDim2.new(1,-110,0,20), Position=UDim2.new(0,8,0,sy),
    Text="💾 ...", BackgroundTransparency=1, TextColor3=C.GRAY,
    Font=Enum.Font.GothamMedium, TextSize=9,
    TextXAlignment=Enum.TextXAlignment.Left, TextYAlignment=Enum.TextYAlignment.Center,
    TextTruncate=Enum.TextTruncate.AtEnd, ZIndex=7,
}, savedCodeTab)

Store.reloadBtn = New("TextButton", {
    Size=UDim2.new(0,94,0,20), Position=UDim2.new(1,-102,0,sy),
    Text="🔄 Nạp lại", BackgroundColor3=C.BLUE, BackgroundTransparency=0.1,
    TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=8,
}, savedCodeTab)
Corner(Store.reloadBtn, UDim.new(0,5))
Stroke(Store.reloadBtn, Color3.fromRGB(0,90,170), 1)

Store.refreshStatus = function()
    if not Store.statusLbl or not Store.statusLbl.Parent then return end
    local ns, nw, nf = #scripts, #waypoints, #featureTabs
    if Store.lastError then
        Store.statusLbl.TextColor3=Color3.fromRGB(255, 160, 90)
        Store.statusLbl.Text = string.format("⚠️ %d script · %d WP · %d tab — %s", ns, nw, nf, Store.lastError)
    elseif Store.mode == "file" then
        Store.statusLbl.TextColor3=Color3.fromRGB(58, 214, 140)
        Store.statusLbl.Text = string.format("💾 %d script · %d WP · %d tab · %s%s", ns, nw, nf, Store.SAVE_FILE,
            Store.lastSavedAt and (" · lưu lúc " .. Store.lastSavedAt) or "")
    elseif Store.mode == "memory" then
        Store.statusLbl.TextColor3=Color3.fromRGB(255, 205, 64)
        Store.statusLbl.Text = string.format("⚠️ %d script · %d WP · %d tab — chỉ giữ trong phiên chơi này (executor thiếu writefile)", ns, nw, nf)
    elseif Store.mode == "empty" then
        Store.statusLbl.TextColor3 = C.GRAY
        Store.statusLbl.Text = string.format("💾 Chưa lưu gì · sẽ ghi vào %s khi bạn bấm Lưu", Store.SAVE_FILE)
    else
        Store.statusLbl.TextColor3 = C.GRAY
        Store.statusLbl.Text = "💾 Chưa lưu gì (executor thiếu writefile — chỉ giữ trong phiên chơi)"
    end
end

S.DoReload = function()
    Store.load()
    RebuildScripts()
    S.Rebuild()
    if Store.restoreWaypoints then pcall(Store.restoreWaypoints) end
    if Store.restoreFeatures then pcall(Store.restoreFeatures) end
    flash(Store.reloadBtn, "✅ Đã nạp", 1.4)
end
Store.reloadBtn.Activated:Connect(S.DoReload)

sy = sy + 24

local scriptList = New("Frame", {
    Name="SavedCodeList",
    Size=UDim2.new(1,-16,0,0), Position=UDim2.new(0,8,0,sy),
    BackgroundTransparency=1, BorderSizePixel=0, ZIndex=6,
}, savedCodeTab)
New("UIListLayout", {SortOrder=Enum.SortOrder.LayoutOrder, Padding=UDim.new(0,6)}, scriptList)

RebuildScripts = function()
    for _,c in ipairs(scriptList:GetChildren()) do
        if not c:IsA("UIListLayout") then c:Destroy() end
    end

    local term=searchIn.Text:lower()
    local disp={}
    for _,d in ipairs(scripts) do
        if term=="" or d.name:lower():find(term,1,true) then table.insert(disp,d) end
    end

    if #disp==0 then
        New("TextLabel", {
            Size=UDim2.new(1,0,0,40),
            Text=term~="" and "📭 Không tìm thấy script phù hợp" or "📭 Chưa có script nào được lưu",
            BackgroundTransparency=1, TextColor3=C.GRAY, Font=Enum.Font.GothamMedium, TextSize=11,
            TextXAlignment=Enum.TextXAlignment.Center, TextYAlignment=Enum.TextYAlignment.Center, ZIndex=7,
        }, scriptList)
    end

    local totalHeight = 0

    for _, d in ipairs(disp) do
        local isExpanded = d.expanded or false
        local rowH = isExpanded and 160 or 42

        local row = New("Frame", {
            Name="SavedCodeRow",
            Size=UDim2.new(1,0,0,rowH), BackgroundColor3=Color3.fromRGB(26, 29, 38),
            BackgroundTransparency=0.1, BorderSizePixel=0, ZIndex=6,
            ClipsDescendants=true,
        }, scriptList)
        Corner(row,UDim.new(0,6)); Stroke(row)

        local arrowBtn = New("TextButton", {
            Name="SavedCodeExpand",
            Size=UDim2.new(0,24,0,24), Position=UDim2.new(0,6,0,9),
            Text=isExpanded and "▲" or "▼",
            BackgroundColor3=Color3.fromRGB(32, 36, 47), BackgroundTransparency=0,
            TextColor3=C.BLUE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=8,
        }, row)
        Corner(arrowBtn, UDim.new(0,4))

        local nameLbl = New("TextLabel", {
            Name="SavedCodeName",
            Size=UDim2.new(1,-175,0,42), Position=UDim2.new(0,36,0,0),
            Text=d.name, BackgroundTransparency=1, TextColor3=C.DARK,
            Font=Enum.Font.GothamBold, TextSize=11, TextXAlignment=Enum.TextXAlignment.Left,
            TextTruncate=Enum.TextTruncate.AtEnd, ZIndex=8,
        }, row)

        local delScriptBtn = New("TextButton", {
            Name="SavedCodeDelete",
            Size=UDim2.new(0,58,0,26), Position=UDim2.new(1,-132,0,8),
            Text="🗑 Xóa", BackgroundColor3=C.RED, BackgroundTransparency=0.1,
            TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=8,
        }, row)
        Corner(delScriptBtn, UDim.new(0,5))

        local runScriptBtn = New("TextButton", {
            Name="SavedCodeRun",
            Size=UDim2.new(0,62,0,26), Position=UDim2.new(1,-68,0,8),
            Text="▶ Chạy", BackgroundColor3=C.GREEN, BackgroundTransparency=0.1,
            TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=8,
        }, row)
        Corner(runScriptBtn, UDim.new(0,5))

        if isExpanded then
            local codeBoxFrame = New("ScrollingFrame", {
                Size=UDim2.new(1,-12,0,82), Position=UDim2.new(0,6,0,42),
                BackgroundColor3=Color3.fromRGB(24, 27, 35), BackgroundTransparency=0,
                BorderSizePixel=0, ZIndex=8, ScrollBarThickness=4,
                CanvasSize=UDim2.new(0,0,0,0),
                AutomaticCanvasSize=Enum.AutomaticSize.Y,
                ScrollingDirection=Enum.ScrollingDirection.Y,
                ScrollingEnabled=true,
                VerticalScrollBarInset=Enum.ScrollBarInset.ScrollBar,
            }, row)
            Corner(codeBoxFrame, UDim.new(0,5))
            Stroke(codeBoxFrame, Color3.fromRGB(190,195,210), 1)

            local codeLbl = New("TextBox", {
                Name="SavedCodeSource",
                Size=UDim2.new(1,-8,0,0), Position=UDim2.new(0,4,0,4),
                AutomaticSize=Enum.AutomaticSize.Y,
                Text=d.code, TextColor3=Color3.fromRGB(226, 230, 240), BackgroundTransparency=1,
                Font=Enum.Font.Code, TextSize=10, TextXAlignment=Enum.TextXAlignment.Left,
                TextYAlignment=Enum.TextYAlignment.Top, MultiLine=true, TextWrapped=true,
                ClearTextOnFocus=false, TextEditable=false, Active=true, ZIndex=9,
            }, codeBoxFrame)

            local copyBtn = New("TextButton", {
                Name="SavedCodeCopy",
                Size=UDim2.new(0,120,0,24), Position=UDim2.new(0,6,0,128),
                Text="📋 Sao Chép Code", BackgroundColor3=C.BLUE, BackgroundTransparency=0.1,
                TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=8,
            }, row)
            Corner(copyBtn, UDim.new(0,5))

            copyBtn.Activated:Connect(function()
                if S.CopyToClipboard(d.code) then
                    flash(copyBtn, "✅ Đã Sao Chép!", 1.5)
                else
                    codeLbl:CaptureFocus()
                    codeLbl.SelectionStart = 1
                    codeLbl.CursorPosition = #d.code + 1
                    flash(copyBtn, "⚠️ Đã Bôi Đen Code", 1.5)
                end
            end)
        end

        arrowBtn.Activated:Connect(function()
            d.expanded = not d.expanded
            RebuildScripts()
            Store.saveSoon()
        end)

        runScriptBtn.Activated:Connect(function()
            local prev = runScriptBtn.Text
            local prevColor = runScriptBtn.TextColor3
            local accepted, why = RunCode(d.code, d.name, runScriptBtn, 1, 0)
            if not accepted then
                Store.statusLbl.Text = "⚠️ " .. tostring(why or "Không chạy được")
                return
            end
            runScriptBtn.Text = "⏳ ..."
            task.spawn(function()
                local waited = 0
                while runActive and waited < 60 do task.wait(0.1); waited = waited + 0.1 end
                task.wait(0.4)                       -- chờ chụp/đậu GUI xong hẳn
                if not runScriptBtn.Parent then return end
                local rep = S.lastRunReport
                local txt = S.RunReportText()
                local bad = rep and rep.fail > 0 and rep.ok == 0
                if bad then
                    runScriptBtn.Text = "❌ lỗi"
                    runScriptBtn.TextColor3 = C.RED
                elseif rep and (rep.guis or 0) > 0 then
                    runScriptBtn.Text = "🧩 vào tab"
                elseif rep and rep.parked then
                    runScriptBtn.Text = "🪟 ngoài MH"
                else
                    runScriptBtn.Text = "✅ xong"
                end
                pcall(function()
                    if Store.statusLbl and Store.statusLbl.Parent then
                        Store.statusLbl.Text = "▶ '" .. tostring(d.name) .. "' · " .. (txt ~= "" and txt or "xong")
                        Store.statusLbl.TextColor3 = bad and C.RED or C.GRAY
                    end
                end)
                task.delay(2.2, function()
                    if runScriptBtn and runScriptBtn.Parent then
                        runScriptBtn.Text = prev
                        runScriptBtn.TextColor3 = prevColor
                    end
                end)
            end)
        end)

        delScriptBtn.Activated:Connect(function()
            local origIdx = nil
            for idx, s in ipairs(scripts) do
                if s == d then origIdx = idx; break end
            end
            if origIdx then
                table.remove(scripts, origIdx)
                RebuildScripts()
                Store.saveSoon()
            end
        end)

        totalHeight = totalHeight + rowH + 6
    end

    local listH = math.max(totalHeight, 40)
    scriptList.Size = UDim2.new(1,-16,0,listH)
    savedCodeTab.CanvasSize = UDim2.new(0, 0, 0, sy + listH + 30)
    if Store.refreshStatus then Store.refreshStatus() end
end

searchIn:GetPropertyChangedSignal("Text"):Connect(function() S.Debounce("savedSearch", 0.18, RebuildScripts) end)
RebuildScripts()

-- END NATIVE_SAVED_CODE

-- Support subsystem is loaded from ho-tro.lua through the built-in feature tab.

local function NormalizeCode(c)
    if type(c) ~= "string" then return "" end
    c = S.SanitizeCode(c)   -- v4.4b: cắt wrapper "SIZE WRAPPER" cũ (nó đè layout GUI của game)
    return S.NormalizeRunnable(c)
end

local GAME_OWNED_GUI_NAMES = {
    Topbar = true, TopbarContainer = true, PlayerList = true, Chat = true,
    Backpack = true, DevConsoleUI = true, ScriptInvitationUI = true,
    FollowPromptUI = true, TouchControlsFrame = true, Main = true, ExMenu = true,
    Notifications = true, PauseMenu = true, InGame = true, CoreGui = true,
}

local function ScanNewGuis(beforeGuis, mine, allowGuess)
    local found, seen = {}, {}
    local function take(g)
        if not g or seen[g] then return end
        seen[g] = true
        table.insert(found, g)
    end
    if mine then
        for _, g in ipairs(mine) do
            if g:IsA("ScreenGui") or g:IsA("Folder") then take(g) end
        end
    end
    local function scan(container)
        if not container then return end
        for _, g in ipairs(container:GetChildren()) do
            if not beforeGuis[g] then
                beforeGuis[g] = true
                if allowGuess and (g:IsA("ScreenGui") or g:IsA("Folder")) and not GAME_OWNED_GUI_NAMES[g.Name] then
                    local hasGuiChild = false
                    for _, c in ipairs(g:GetChildren()) do
                        if c:IsA("GuiObject") then hasGuiChild = true break end
                    end
                    if hasGuiChild then take(g) end
                end
            end
        end
    end
    scan(playerGui)
    if targetGui ~= playerGui then scan(targetGui) end
    return found
end

local function ForceStretchToParent(obj, maxDepth)
    if not obj then return end
    maxDepth = maxDepth or 0
    pcall(function()
        if obj:IsA("GuiObject") then
            if obj:IsA("Frame") or obj:IsA("ScrollingFrame") or obj:IsA("CanvasGroup") then
                local s = obj.Size
                if s.X.Scale < 0.9 and s.X.Offset > 0 then
                    obj.Size = UDim2.new(1, 0, s.Y.Scale > 0 and s.Y.Scale or 1, 0)
                end
                if obj.Position.X.Offset ~= 0 or obj.Position.Y.Offset ~= 0 then
                    obj.Position = UDim2.new(0, 0, 0, 0)
                end
            end
        end
    end)
    if maxDepth <= 0 then return end
    for _, child in ipairs(obj:GetChildren()) do
        ForceStretchToParent(child, maxDepth - 1)
    end
end

function S.RegisterEmbed(host, gui, recs)
    local entry = {host = host, gui = gui, recs = recs or {}, conns = {}}
    pcall(function()
        entry.conns[#entry.conns+1] = gui:GetPropertyChangedSignal("Enabled"):Connect(function()
            pcall(function() host.Visible = gui.Enabled end)
        end)
    end)
    pcall(function()
        entry.conns[#entry.conns+1] = gui:GetPropertyChangedSignal("Parent"):Connect(function()
            pcall(function() host.Visible = (gui.Parent ~= nil) and gui.Enabled end)
        end)
    end)
    pcall(function()
        entry.conns[#entry.conns+1] = gui.Destroying:Connect(function()
            S.DropEmbed(entry, true)
        end)
    end)
    S.embeds[#S.embeds+1] = entry
    return entry
end

function S.FindEmbedByHost(host)
    for i, e in ipairs(S.embeds) do
        if e.host == host then return e, i end
    end
    return nil
end

function S.RemoveEmbedAt(i)
    local e = S.embeds[i]
    if not e then return end
    for _, c in ipairs(e.conns) do pcall(function() c:Disconnect() end) end
    table.remove(S.embeds, i)
    return e
end

function S.DropEmbed(entry, keepQuiet)
    for i, e in ipairs(S.embeds) do
        if e == entry then S.RemoveEmbedAt(i); break end
    end
    pcall(function() if entry.host and entry.host.Parent then entry.host:Destroy() end end)
    if not keepQuiet then
        print("[taodepzai v5.0 NOIR] Đã gỡ host nhúng khỏi tab")
    end
end

function S.RestoreEmbed(entry)
    pcall(function() S.RestoreSnap(entry) end)
    entry.snap = nil
    for _, rec in ipairs(entry.recs or {}) do
        pcall(function()
            if rec.obj and rec.origParent then
                rec.obj.Parent = rec.origParent
            end
        end)
    end
    for i, e in ipairs(S.embeds) do
        if e == entry then S.RemoveEmbedAt(i); break end
    end
    pcall(function() if entry.host and entry.host.Parent then entry.host:Destroy() end end)
end

function S.PruneEmbeds()
    for i = #S.embeds, 1, -1 do
        local e = S.embeds[i]
        local hostAlive = e.host and e.host.Parent
        local guiAlive = e.gui and e.gui.Parent
        if not hostAlive or not guiAlive then
            if hostAlive then pcall(function() e.host:Destroy() end) end
            S.RemoveEmbedAt(i)
        end
    end
end

function S.MeasureHost(host)
    local hx, hy = host.AbsolutePosition.X, host.AbsolutePosition.Y
    local minX, minY, maxX, maxY = math.huge, math.huge, -math.huge, -math.huge
    local n = 0
    for _, ch in ipairs(host:GetChildren()) do
        if ch:IsA("GuiObject") and ch.Visible ~= false then
            local p, sz = ch.AbsolutePosition, ch.AbsoluteSize
            if p and sz then
                minX = math.min(minX, p.X); minY = math.min(minY, p.Y)
                maxX = math.max(maxX, p.X + sz.X); maxY = math.max(maxY, p.Y + sz.Y)
                n = n + 1
            end
        end
    end
    if n == 0 or maxX <= minX or maxY <= minY then return nil end
    return { x = minX - hx, y = minY - hy, w = maxX - minX, h = maxY - minY }
end

function S.SnapSubtree(list, node, isTop)
    for _, c in ipairs(node:GetChildren()) do
        if c:IsA("GuiObject") then
            list[#list+1] = {
                obj = c, top = isTop or nil,
                Position = c.Position, Size = c.Size,
                TextSize = ((c.TextSize and c.TextSize > 0) and not c.TextScaled) and c.TextSize or nil,
            }
            S.SnapSubtree(list, c, false)
        elseif c:IsA("UICorner") then
            list[#list+1] = { obj = c, CornerRadius = c.CornerRadius }
        elseif c:IsA("UIPadding") then
            list[#list+1] = { obj = c,
                PadT = c.PaddingTop, PadB = c.PaddingBottom,
                PadL = c.PaddingLeft, PadR = c.PaddingRight }
        elseif c:IsA("UIStroke") then
            list[#list+1] = { obj = c, Thick = c.Thickness }
        end
    end
end

function S.RestoreSnap(entry)
    if not entry.snap then return end
    for _, rec in ipairs(entry.snap) do
        local o = rec.obj
        if o and o.Parent then
            pcall(function()
                if rec.Position then o.Position = rec.Position end
                if rec.Size then o.Size = rec.Size end
                if rec.TextSize then o.TextSize = rec.TextSize end
                if rec.CornerRadius then o.CornerRadius = rec.CornerRadius end
                if rec.PadT then
                    o.PaddingTop, o.PaddingBottom = rec.PadT, rec.PadB
                    o.PaddingLeft, o.PaddingRight = rec.PadL, rec.PadR
                end
                if rec.Thick then o.Thickness = rec.Thick end
            end)
        end
    end
end

function S.FitEmbedded(entry)
    local host, gui = entry.host, entry.gui
    if not host or not host.Parent then return end
    local function mulUDim(u, k)
        return UDim2.new(u.X.Scale, math.floor(u.X.Offset * k + 0.5),
                         u.Y.Scale, math.floor(u.Y.Offset * k + 0.5))
    end
    local function mulUDimShift(u, k, dx, dy)
        return UDim2.new(u.X.Scale, math.floor(u.X.Offset * k + 0.5) + dx,
                         u.Y.Scale, math.floor(u.Y.Offset * k + 0.5) + dy)
    end
    local function mulDim(u, k)
        return UDim.new(u.Scale, math.floor(u.Offset * k + 0.5))
    end

    local area = host.Parent                      -- embedHost trong tab
    local aw = area.AbsoluteSize.X - 6
    local ah = area.AbsoluteSize.Y - 6
    if aw < 40 or ah < 40 then return end

    pcall(function()
        host.Size = UDim2.new(1, 0, 1, 0)
        host.Position = UDim2.new(0, 0, 0, 0)
        host.BackgroundTransparency = 1
        host.ClipsDescendants = true              -- phần dư (nếu có) vừa vô hình vừa không nhận click
    end)

    if not entry.snap then
        entry.snap = {}
        S.SnapSubtree(entry.snap, host, true)
        if #entry.snap == 0 then return end
    end
    for _, rec in ipairs(entry.snap) do
        rec.dx, rec.dy = 0, 0
    end

    S.RestoreSnap(entry)
    local base = S.MeasureHost(host)
    if not base then return end

    local s = math.clamp(math.min(aw / base.w, ah / base.h), 0.35, 3.0)

    local function apply(k)
        for _, rec in ipairs(entry.snap) do
            local o = rec.obj
            if o and o.Parent then
                pcall(function()
                    if rec.Size then o.Size = mulUDim(rec.Size, k) end
                    if rec.Position then
                        if rec.top then
                            o.Position = mulUDimShift(rec.Position, k, rec.dx or 0, rec.dy or 0)
                        else
                            o.Position = mulUDim(rec.Position, k)
                        end
                    end
                    if rec.TextSize then o.TextSize = math.max(8, math.floor(rec.TextSize * k + 0.5)) end
                    if rec.CornerRadius then
                        o.CornerRadius = UDim.new(rec.CornerRadius.Scale,
                            math.floor(rec.CornerRadius.Offset * k + 0.5))
                    end
                    if rec.PadT then
                        o.PaddingTop    = mulDim(rec.PadT, k)
                        o.PaddingBottom = mulDim(rec.PadB, k)
                        o.PaddingLeft   = mulDim(rec.PadL, k)
                        o.PaddingRight  = mulDim(rec.PadR, k)
                    end
                    if rec.Thick then o.Thickness = math.max(1, rec.Thick * k) end
                end)
            end
        end
    end

    local hw, hh = area.AbsoluteSize.X, area.AbsoluteSize.Y
    local function align(k, tries)
        apply(k)
        local m = S.MeasureHost(host)
        if not m then return k end
        local dx = math.floor(-m.x + math.max(0, (aw - m.w) / 2) + 0.5)
        local dy = math.floor(-m.y + math.max(0, (ah - m.h) / 2) + 0.5)
        if math.abs(dx) > 0.5 or math.abs(dy) > 0.5 then
            for _, rec in ipairs(entry.snap) do
                if rec.top then rec.dx, rec.dy = (rec.dx or 0) + dx, (rec.dy or 0) + dy end
            end
            apply(k)
            m = S.MeasureHost(host) or m
        end
        if m and tries < 2 and (m.w > hw + 1 or m.h > hh + 1) then
            local k2 = k * math.min(hw / m.w, hh / m.h)
            if k2 < k * 0.98 then
                for _, rec in ipairs(entry.snap) do rec.dx, rec.dy = 0, 0 end
                return align(math.max(k2, 0.15), tries + 1)
            end
        end
        return k
    end

    s = align(s, 0)
    entry.fitScale = s
    return s
end

function S.TabArea(nm)
    local frame
    if type(nm) == "string" and #nm > 0 then
        for _, ft in ipairs(featureTabs) do
            if ft.name == nm then frame = ft.frame break end
        end
    end
    frame = frame or activeTab
    if not frame then return nil end
    local host = frame:FindFirstChild("ScriptHost")
    local area = host or frame
    local sz = area.AbsoluteSize
    return Vector2.new(math.max(0, sz.X - 6), math.max(0, sz.Y - 6))
end

S.resizedCbs = {}
function S.OnResized(fn)
    if type(fn) ~= "function" then return nil end
    table.insert(S.resizedCbs, fn)
    return { Disconnect = function()
        for i, f in ipairs(S.resizedCbs) do
            if f == fn then table.remove(S.resizedCbs, i) break end
        end
    end }
end
function S.NotifyResize()
    local a = S.TabArea()
    local cbs = {}
    for _, f in ipairs(S.resizedCbs) do cbs[#cbs+1] = f end
    for _, f in ipairs(cbs) do pcall(f, a) end
end

function S.FeatureTabHost(nm)
    if type(nm) == "string" and #nm > 0 then
        for _, ft in ipairs(featureTabs) do
            if ft.name == nm then
                local h = ft.frame and ft.frame:FindFirstChild("ScriptHost")
                if h then return h end
            end
        end
    end
    return activeTab and activeTab:FindFirstChild("ScriptHost")
end

function S.FitToTab(obj, nm)
    if not obj then return nil end
    local host = S.FeatureTabHost(nm)
    if host and obj.Parent ~= host then
        pcall(function() obj.Parent = host end)
    end
    pcall(function()
        obj.Size = UDim2.new(1, 0, 1, 0)
        obj.Position = UDim2.new(0, 0, 0, 0)
    end)
    return obj
end

_G.BananaCatHubAPI = {
    Version = "5.0",
    LegacyVersion = "4.61", -- giữ thông tin tương thích cho script cũ
    HubGui = gui,     -- v4.4e: sửa lỗi cũ — biến tên là `gui`, không phải `hubGui` (trước đây là nil)
    Main = main,
    TabArea = function(self, nm) return S.TabArea(nm) end,
    OnResize = function(self, fn) return S.OnResized(fn) end,      -- API:OnResize(f) -> {Disconnect=}
    FeatureTabHost = function(self, nm) return S.FeatureTabHost(nm) end,
    FitToTab = function(self, obj, nm) return S.FitToTab(obj, nm) end,
    EmbedGui = function(self, guiOrFrame, nm)                        -- xin hub mượn GUI vào tab
        local scr = guiOrFrame
        if scr and not scr:IsA("ScreenGui") then scr = scr:FindFirstAncestorOfClass("ScreenGui") end
        local host = S.FeatureTabHost(nm)
        if not scr or not host then return nil end
        return S.EmbedGui(scr, host)
    end,
    MakeTemplate = function(self, nm, icon) return S.FeatureTemplate(nm, icon) end,
    ScriptHubBridge = function() return S.ScriptHubBridge end,
    SupportBridge = function() return S.SupportBridge end,
    ReleaseFocus = function(self) pcall(ReleaseHubFocus) end,
    ExternalGui = function(self, props)
        props = props or {}
        local g = Instance.new("ScreenGui")
        g.Name = props.Name or ("BC_External_" .. tostring(math.random(10000, 99999)))
        g.IgnoreGuiInset = props.IgnoreGuiInset ~= false
        g.ResetOnSpawn = false
        g.ZIndexBehavior = Enum.ZIndexBehavior.Global
        g.DisplayOrder = tonumber(props.DisplayOrder) or 9000
        g:SetAttribute("BCHub_External", true) -- báo cho hub biết đừng nhúng GUI này
        g.Parent = targetGui or (player and player:WaitForChild("PlayerGui"))
        return g
    end,
    Crosshair = function(self, on)
        if on == nil then return S.ToggleCrosshair() end
        S.SetCrosshair(on and true or false)
        return S.crosshairOn
    end,
}

function S.FeatureTemplate(nm, icon, stamp)
    if type(nm) ~= "string" or #nm == 0 then nm = "Tính Năng Mới" end
    if type(icon) ~= "string" or #icon == 0 then icon = "⚙️" end
    if type(stamp) ~= "string" then stamp = "" end
    local head = [==[
-- ---------------------------------------------------------------------------

local BC = { Name = "__BC_NAME__", Icon = "__BC_ICON__", DesignW = 620, DesignH = 384 }

local Players = game:GetService("Players")
local player = Players.LocalPlayer
local pg = player and player:WaitForChild("PlayerGui")
if not pg then return end

local gui = Instance.new("ScreenGui")
gui.Name = BC.Name
gui.ResetOnSpawn = false
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = pg

local root = Instance.new("Frame")
root.Name = "Root"
root.Size = UDim2.new(0, BC.DesignW, 0, BC.DesignH)
root.Position = UDim2.new(0.5, -BC.DesignW / 2, 0.5, -BC.DesignH / 2)
root.BackgroundColor3 = Color3.fromRGB(24, 26, 38)
root.BorderSizePixel = 0
root.Parent = gui
local function bcCorner(o, r)
    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, r)
    c.Parent = o
    return c
end
bcCorner(root, 8)

local API = _G.BananaCatHubAPI
local bcConn = nil        -- connection của API:OnResize, bcClose sẽ ngắt để không leak
local function bcHubMain()
    local ok, m = pcall(function() return API and API.Main end)
    if ok and m and m.AbsoluteSize then return m end
    local hub = pg:FindFirstChild("ExMenu") or pg:FindFirstChild("BananaCatHub")
    if hub then
        local f = hub:FindFirstChildWhichIsA("Frame")
        if f and f.AbsoluteSize.X > 300 then return f end
    end
end
local function bcArea()
    local ok, v = pcall(function() return API and API.TabArea and API:TabArea(BC.Name) end)
    if ok and v and v.X and v.X > 60 then return v end
    local m = bcHubMain()
    if m and m.AbsoluteSize.X > 300 then
        return Vector2.new(m.AbsoluteSize.X - 30, m.AbsoluteSize.Y - 72)
    end
    local vp = Vector2.new(1280, 720)
    pcall(function() vp = workspace.CurrentCamera.ViewportSize end)
    local w = math.max(320, math.min(vp.X * 0.55, vp.X - 60))
    return Vector2.new(w, w * BC.DesignH / BC.DesignW)
end
local function bcFit()
    pcall(function()
        local par = root.Parent
        if par and not par:IsA("ScreenGui") then
            root.Size = UDim2.new(1, 0, 1, 0)
            root.Position = UDim2.new(0, 0, 0, 0)
            return
        end
        local a = bcArea()
        root.Size = UDim2.new(0, math.floor(a.X), 0, math.floor(a.Y))
        root.Position = UDim2.new(0.5, -math.floor(a.X / 2), 0.5, -math.floor(a.Y / 2))
    end)
end
bcConn = nil
bcFit()
pcall(function()
    if API and API.OnResize then bcConn = API:OnResize(bcFit) end
end)
local bcHubFrame = bcHubMain()
if bcHubFrame then
    pcall(function()
        bcHubFrame:GetPropertyChangedSignal("AbsoluteSize"):Connect(bcFit)
    end)
end
task.delay(0.25, bcFit)
task.delay(1.2, bcFit)

]==]
    local body = [==[
-- ---------- giao diện mẫu (thêm/bớt thoải mái, miễn là CON của panel/root) ----
local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, -56, 0, 32)
title.Position = UDim2.new(0, 10, 0, 0)
title.BackgroundTransparency = 1
title.Text = BC.Icon .. "  " .. BC.Name
title.Font = Enum.Font.GothamBold
title.TextSize = 15
title.TextXAlignment = Enum.TextXAlignment.Left
title.TextColor3 = Color3.fromRGB(255, 255, 255)
title.Parent = root

local closeBtn = Instance.new("TextButton")
closeBtn.Name = "CloseBtn"
closeBtn.Size = UDim2.new(0, 26, 0, 26)
closeBtn.Position = UDim2.new(1, -34, 0, 3)
closeBtn.BackgroundColor3 = Color3.fromRGB(210, 70, 70)
closeBtn.Text = "X"
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextSize = 14
closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
closeBtn.AutoButtonColor = true
closeBtn.Parent = root
bcCorner(closeBtn, 6)

local panel = Instance.new("ScrollingFrame")
panel.Name = "Panel"
panel.Size = UDim2.new(1, -20, 1, -74)
panel.Position = UDim2.new(0, 10, 0, 38)
panel.BackgroundTransparency = 1
panel.BorderSizePixel = 0
panel.ScrollBarThickness = 4   -- v4.9: đồng bộ
panel.AutomaticCanvasSize = Enum.AutomaticSize.Y
panel.CanvasSize = UDim2.new(0, 0, 0, 0)
panel.Parent = root
local list = Instance.new("UIListLayout")
list.Padding = UDim.new(0, 6)
list.SortOrder = Enum.SortOrder.LayoutOrder
list.Parent = panel
local pad = Instance.new("UIPadding")
pad.PaddingRight = UDim.new(0, 8)
pad.Parent = panel

local bcStatus = Instance.new("TextLabel")
bcStatus.Name = "Status"
bcStatus.Size = UDim2.new(1, -20, 0, 22)
bcStatus.Position = UDim2.new(0, 10, 1, -30)
bcStatus.BackgroundTransparency = 1
bcStatus.Text = "Tắt"
bcStatus.TextColor3 = Color3.fromRGB(255, 214, 90)
bcStatus.Font = Enum.Font.Gotham
bcStatus.TextSize = 12
bcStatus.TextXAlignment = Enum.TextXAlignment.Left
bcStatus.Parent = root

local function bcButton(txt, color)
    local b = Instance.new("TextButton")
    b.Size = UDim2.new(1, 0, 0, 30)
    b.BackgroundColor3 = color or Color3.fromRGB(60, 120, 220)
    b.Text = txt
    b.Font = Enum.Font.GothamMedium
    b.TextSize = 13
    b.TextColor3 = Color3.fromRGB(255, 255, 255)
    b.AutoButtonColor = true
    b.Parent = panel
    bcCorner(b, 6)
    return b
end

bcToggle = bcButton(BC.Icon .. "  Bật " .. BC.Name)

-- ---------- EXTERNAL OVERLAY (vòng tròn niêm tâm / ESP / HUD ngoài màn hình) ------
local function bcMakeExternalGui(name, order)
    local ext
    local ok, API = pcall(function() return _G.BananaCatHubAPI end)
    if ok and API and API.ExternalGui then
        ext = API:ExternalGui({Name = name, DisplayOrder = order})
    else
        ext = Instance.new("ScreenGui")
        ext.Name = name
        ext.IgnoreGuiInset = true
        ext.ResetOnSpawn = false
        ext.ZIndexBehavior = Enum.ZIndexBehavior.Global
        ext.DisplayOrder = order or 9500
        ext:SetAttribute("BCHub_External", true)
        local pg2 = game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui")
        local hui = pg2
        if type(gethui) == "function" then
            local okH, gotH = pcall(gethui)
            if okH and gotH then hui = gotH end
        end
        ext.Parent = hui
    end
    return ext
end

local extGui = nil            -- ScreenGui overlay ngoài màn hình (được tạo khi bật tính năng)
local extCrossOn = false
local function bcToggleCross()
    if not extGui then return end
    extCrossOn = not extCrossOn
    local ring = extGui:FindFirstChild("BC_Ring")
    local dot  = extGui:FindFirstChild("BC_Dot")
    if ring then ring.Visible = extCrossOn end
    if dot  then dot.Visible  = extCrossOn end
    pcall(function()
        if _G.BananaCatHubAPI and _G.BananaCatHubAPI.Crosshair then
        end
    end)
end

local bcCrossBtn = bcButton("🎯  Niêm tâm: TẮT", Color3.fromRGB(160, 60, 255))

pcall(function()
    if _G.BananaCatHubAPI and _G.BananaCatHubAPI.OnResize then
    end
end)

]==]
    local foot = [==[
-- ---------- đóng / trả GUI (KHÔNG xóa khối này) ----------------------------
local bcEnabled = false
local bcConns = {}
local function bcOn(inst, sig, fn)
    table.insert(bcConns, inst[sig]:Connect(fn))
end

local function bcClose()
    if bcConn then pcall(function() bcConn:Disconnect() end) bcConn = nil end
    for _, c in ipairs(bcConns) do pcall(function() c:Disconnect() end) end
    for i = #bcConns, 1, -1 do bcConns[i] = nil end
    bcEnabled = false
    pcall(function() gui.Enabled = false end)
    task.delay(0.06, function() pcall(function() gui:Destroy() end) end)
end
bcOn(closeBtn, "MouseButton1Click", bcClose)

_G.BC_FEATURES = _G.BC_FEATURES or {}
_G.BC_FEATURES[BC.Name] = { name = BC.Name, Close = bcClose, Gui = gui, Root = root }

bcOn(bcCrossBtn, "MouseButton1Click", function()
    if not bcEnabled then
        bcToggle:Activate()
        task.wait(0.1)
    end
    bcToggleCross()
    bcCrossBtn.Text = extCrossOn and "🎯  Niêm tâm: BẬT" or "🎯  Niêm tâm: TẮT"
end)

bcOn(bcToggle, "MouseButton1Click", function()
    bcEnabled = not bcEnabled
    bcToggle.Text = (bcEnabled and "⏹  Tắt " or BC.Icon .. "  Bật ") .. BC.Name
    bcStatus.Text = bcEnabled and "Đang chạy…" or "Tắt"
    if bcEnabled then
        if not extGui or not extGui.Parent then
            extGui = bcMakeExternalGui(BC.Name .. "_Ext", 9500)

            local ring = Instance.new("Frame")
            ring.Name = "BC_Ring"
            ring.Size = UDim2.new(0, 32, 0, 32)
            ring.Position = UDim2.new(0.5, -16, 0.5, -16)
            ring.BackgroundTransparency = 1
            ring.BorderSizePixel = 0
            ring.AnchorPoint = Vector2.new(0.5, 0.5)
            ring.Visible = false
            ring.Parent = extGui
            local rc = Instance.new("UICorner"); rc.CornerRadius = UDim.new(1, 0); rc.Parent = ring
            local rs = Instance.new("UIStroke"); rs.Thickness = 1.5; rs.Color = Color3.fromRGB(255,255,255); rs.Parent = ring

            local dot = Instance.new("Frame")
            dot.Name = "BC_Dot"
            dot.Size = UDim2.new(0, 3, 0, 3)
            dot.Position = UDim2.new(0.5, -2, 0.5, -2)
            dot.BackgroundColor3 = Color3.fromRGB(255,255,255)
            dot.BorderSizePixel = 0
            dot.AnchorPoint = Vector2.new(0.5, 0.5)
            dot.Visible = false
            dot.Parent = extGui
            local dc = Instance.new("UICorner"); dc.CornerRadius = UDim.new(1, 0); dc.Parent = dot

            local gap, ll = 22, 10
            local function ln(w, h, x, y)
                local f = Instance.new("Frame")
                f.Size = UDim2.new(0,w,0,h); f.Position = UDim2.new(0.5,x,0.5,y)
                f.BackgroundColor3 = Color3.fromRGB(255,255,255); f.BorderSizePixel = 0
                f.AnchorPoint = Vector2.new(0.5,0.5); f.BackgroundTransparency = 0.2
                f.Name = "BC_Line"; f.Parent = extGui
            end
            ln(2, ll, -1, -gap - ll/2)
            ln(2, ll, -1,  gap + ll/2)
            ln(ll, 2, -gap - ll/2, -1)
            ln(ll, 2,  gap + ll/2, -1)
        end

        table.insert(bcConns, task.spawn(function()
            while bcEnabled do
                task.wait(0.2)
                pcall(function()
                end)
            end
        end))
    else
        extCrossOn = false
        pcall(function() if extGui then extGui:Destroy() end end)
        extGui = nil
        bcCrossBtn.Text = "🎯  Niêm tâm: TẮT"
    end
end)

print("✅ [" .. BC.Name .. "] đã nạp — dán vào tab \"Tạo Tính Năng\" của taodepzai v5.0 NOIR rồi bấm ▶ Chạy Script")
return BC.Name
]==]
    local out = head .. body .. foot
    out = (out:gsub("__BC_NAME__", function() return nm end))
    out = (out:gsub("__BC_ICON__", function() return icon end))
    out = (out:gsub("__BC_STAMP__", function() return (#stamp > 0) and stamp or "sinh bởi hub" end))
    return out
end

_G.BananaCatHub_SyncEmbeds = function()
    pcall(S.SyncAllEmbeds)
end
pcall(function()
    trackConn(main:GetPropertyChangedSignal("Size"):Connect(function()
        BcFit()                 -- GUI đang nhúng trong tab -> đo & scale lại
        pcall(S.NotifyResize)   -- script đứng ngoài (tự xin size) -> chạy lại bcFit của nó
    end))
end)

function S.SyncAllEmbeds()
    for _, e in ipairs(S.embeds) do
        if e.host and e.host.Parent then
            pcall(function() S.FitEmbedded(e) end)
        end
    end
end

function S.ClearEmbedsUnder(containerFrame)
    if not containerFrame then return 0 end
    local n = 0
    for i = #S.embeds, 1, -1 do
        local e = S.embeds[i]
        if e.host and e.host.Parent == containerFrame then
            S.RestoreEmbed(e)
            n += 1
        end
    end
    for _, child in ipairs(containerFrame:GetChildren()) do
        if child.Name:sub(1, 9) == "Embedded_" then
            pcall(function() child:Destroy() end)
        end
    end
    return n
end

function S.EmbedGui(scr, containerFrame)
    if not S.embedEnabled then return nil end
    if not scr or not scr.Parent then return nil end
    if not containerFrame or not containerFrame.Parent then return nil end
    if scr == gui or scr:IsDescendantOf(gui) then return nil end
    local isExt = false
    pcall(function() isExt = (scr:GetAttribute("BCHub_External") == true) end)
    if isExt then return nil end

    local hostName = "Embedded_"..scr.Name
    for _, ex in ipairs(containerFrame:GetChildren()) do
        if ex.Name == hostName then
            local e = S.FindEmbedByHost(ex)
            if e then
                S.RestoreEmbed(e)
            else
                pcall(function() ex:Destroy() end)
            end
        end
    end

    local host = New("Frame", {
        Size = UDim2.new(1,0,1,0),
        Position = UDim2.new(0,0,0,0),
        BackgroundTransparency = 1,
        BorderSizePixel = 0,
        ZIndex = 5,
        Name = hostName,
        ClipsDescendants = true,
    }, containerFrame)

    local recs = {}
    for _, ch in ipairs(scr:GetChildren()) do
        if ch:IsA("GuiObject") then
            recs[#recs+1] = {obj = ch, origParent = scr, origPos = ch.Position, origSize = ch.Size}
        end
    end
    if #recs == 0 then
        pcall(function() host:Destroy() end)
        return nil
    end
    for _, rec in ipairs(recs) do
        pcall(function() rec.obj.Parent = host end)
    end

    ForceStretchToParent(host)          -- root only (an toàn cho mấy frame con)
    local entry = S.RegisterEmbed(host, scr, recs)
    pcall(function() S.FitEmbedded(entry) end)
    task.delay(0.08, function() pcall(function() S.FitEmbedded(entry) end) end)
    task.delay(0.4,  function() pcall(function() S.FitEmbedded(entry) end) end)
    return host
end

S.crosshairGui   = nil
S.crosshairBtns  = {}    -- danh sách nút 🎯 trên các tab để cập nhật text đồng loạt
S.crosshairOn    = false
S.crosshairColor = Color3.fromRGB(255, 255, 255)
S.crosshairSize  = 32

function S._buildCrosshair()
    if S.crosshairGui and S.crosshairGui.Parent then return S.crosshairGui end
    local g = New("ScreenGui", {
        Name = "BananaCatHub_Crosshair",
        IgnoreGuiInset = true,
        ResetOnSpawn = false,
        ZIndexBehavior = Enum.ZIndexBehavior.Global,
        DisplayOrder = 9999,
    }, targetGui)
    g:SetAttribute("BCHub_External", true)

    local ring = New("Frame", {
        Name = "Ring",
        Size = UDim2.new(0, S.crosshairSize, 0, S.crosshairSize),
        Position = UDim2.new(0.5, -S.crosshairSize/2, 0.5, -S.crosshairSize/2),
        BackgroundTransparency = 1,
        BorderSizePixel = 0,
        AnchorPoint = Vector2.new(0.5, 0.5),
    }, g)
    New("UICorner", {CornerRadius = UDim.new(1, 0)}, ring)
    New("UIStroke", {Thickness = 1.5, Color = S.crosshairColor, Transparency = 0.1}, ring)

    local dot = New("Frame", {
        Name = "Dot",
        Size = UDim2.new(0, 3, 0, 3),
        Position = UDim2.new(0.5, -2, 0.5, -2),
        BackgroundColor3 = S.crosshairColor,
        BorderSizePixel = 0,
        AnchorPoint = Vector2.new(0.5, 0.5),
    }, g)
    New("UICorner", {CornerRadius = UDim.new(1, 0)}, dot)

    local gap = S.crosshairSize/2 + 6
    local lineLen = 10
    local function line(name, w, h, x, y)
        local ln = New("Frame", {
            Name = name, Size = UDim2.new(0, w, 0, h),
            Position = UDim2.new(0.5, x, 0.5, y),
            BackgroundColor3 = S.crosshairColor, BorderSizePixel = 0,
            AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 0.15,
        }, g)
        return ln
    end
    line("Top",    2, lineLen, -1, -gap - lineLen/2)
    line("Bottom", 2, lineLen, -1,  gap + lineLen/2)
    line("Left",   lineLen, 2, -gap - lineLen/2, -1)
    line("Right",  lineLen, 2,  gap + lineLen/2, -1)

    S.crosshairGui = g
    return g
end

function S.SetCrosshair(on)
    S.crosshairOn = (on == true)
    if S.crosshairOn then
        S._buildCrosshair()
        if S.crosshairGui then S.crosshairGui.Enabled = true end
    else
        if S.crosshairGui then S.crosshairGui.Enabled = false end
    end
    for _, b in ipairs(S.crosshairBtns) do
        pcall(function()
            if b and b.Parent then
                b.Text = S.crosshairOn and "🎯 Tâm: BẬT" or "🎯 Tâm"
                b.BackgroundColor3 = S.crosshairOn and Color3.fromRGB(180, 80, 220) or C.PURPLE
            end
        end)
    end
end

function S.ToggleCrosshair()
    S.SetCrosshair(not S.crosshairOn)
    return S.crosshairOn
end

function S.RegisterCrosshairBtn(btn)
    if not btn then return end
    table.insert(S.crosshairBtns, btn)
    pcall(function()
        btn.Text = S.crosshairOn and "🎯 Tâm: BẬT" or "🎯 Tâm"
        btn.BackgroundColor3 = S.crosshairOn and Color3.fromRGB(180, 80, 220) or C.PURPLE
    end)
    btn.Activated:Connect(function()
        S.ToggleCrosshair()
    end)
end

S.EMBED_TRY_DELAYS   = {0.6, 1.8, 4, 7, 10}  -- các mốc thử nhúng lại sau khi bấm ▶
S.EMBED_HOOK_GRACE   = 11                    -- giữ hook + watcher bấy nhiêu giây (bắt GUI sinh trễ)
S.EMBED_PROBABLE_AGE = 5                     -- GUI "không chắc chắn" chỉ tự nhận nếu sinh trong 5s đầu
S.EMBED_CHILD_WAIT   = 15                    -- số lần chờ GUI "chín" (0.2s/lần = tối đa 3s)
S.activeHook = nil                           -- chỉ 1 hook sống tại 1 thời điểm (tránh đè hook script khác)

S.SYSTEM_GUI_NAMES = {
    Topbar = true, TopbarContainer = true, PlayerList = true, Chat = true, Backpack = true,
    DevConsoleUI = true, ScriptInvitationUI = true, FollowPromptUI = true,
    TouchControlsFrame = true, PauseMenu = true, CoreGui = true, ExMenu = true,
}
S.GENERIC_GUI_NAMES = { Main = true, InGame = true, Notifications = true }

function S.IsEmbeddable(g, containerFrame, trust)
    if not g then return false, "không có GUI" end
    if not g.Parent then return false, "GUI chưa có Parent (script chưa gắn lên màn hình)" end
    if not (g:IsA("ScreenGui") or g:IsA("Folder")) then return false, "không phải ScreenGui/Folder" end
    if g == gui or g:IsDescendantOf(gui) then return false, "là GUI của chính hub" end
    if g.Name == "ExMenu" then return false, "trùng tên GUI của hub (ExMenu)" end
    if S.SYSTEM_GUI_NAMES[g.Name] then
        return false, "là GUI của game/hệ thống (" .. tostring(g.Name) .. ")"
    end
    if trust ~= "certain" and trust ~= "manual" and S.GENERIC_GUI_NAMES[g.Name] then
        return false, "tên '" .. tostring(g.Name) .. "' hay là UI của game — bật 🕵 hoặc bấm 🔁 để ép nhúng"
    end
    local isExt = false
    pcall(function() isExt = (g:GetAttribute("BCHub_External") == true) end)
    if isExt then return false, "là overlay ngoài màn hình (BCHub_External)" end
    if containerFrame and g:IsDescendantOf(containerFrame) then return false, "đã nằm trong tab rồi" end
    for _, e in ipairs(S.embeds) do
        if e.gui == g then return false, "đã được nhúng ở tab khác" end
    end
    local hasChild = false
    for _, c in ipairs(g:GetChildren()) do
        if c:IsA("GuiObject") then hasChild = true break end
    end
    if not hasChild then return false, "chưa có frame con (script còn đang dựng GUI)" end
    return true
end

function S.HookInstanceNew()
    if S.activeHook then pcall(S.activeHook) end   -- gỡ hook lần chạy trước, tránh chồng chain
    S.activeHook = nil

    local records = {}
    local st = {
        hooked = false, available = false, viaHookfunction = false,
        realNew = nil, ours = nil, origFromHook = nil,
        probing = false, probeSeen = false,
        inRun = true, graceUntil = nil, t0 = os.clock(),
    }
    local myCo = coroutine.running()

    local function unhook()
        if not st.hooked then return end
        st.hooked = false
        if st.viaHookfunction then
            pcall(function()
                if type(hookfunction) == "function" and st.origFromHook then
                    hookfunction(Instance.new, st.origFromHook)
                end
            end)
        else
            pcall(function()
                if Instance.new == st.ours then Instance.new = st.realNew end
            end)
        end
        if S.activeHook == unhook then S.activeHook = nil end
    end

    local function recorder(cls, ...)
        local inst = st.realNew(cls, ...)
        if st.probing then
            if cls == "ScreenGui" then st.probeSeen = true end
            return inst
        end
        if st.hooked and cls == "ScreenGui" then
            local now = os.clock()
            records[#records + 1] = {
                inst      = inst,
                certain   = (coroutine.running() == myCo),
                duringRun = (st.inRun == true) or (st.graceUntil ~= nil and now < st.graceUntil),
                age       = now - st.t0,
                embedded  = false,
                via       = "hook",
            }
        end
        return inst
    end

    pcall(function()
        st.realNew = Instance.new
        st.ours = recorder
        Instance.new = st.ours
        st.hooked = (Instance.new == st.ours)
    end)

    if not st.hooked and type(hookfunction) == "function" then
        pcall(function()
            st.ours = recorder
            st.origFromHook = hookfunction(Instance.new, st.ours)
            if st.origFromHook then st.realNew = st.origFromHook end
            st.hooked = true
            st.viaHookfunction = true
        end)
    end

    if st.hooked then
        pcall(function()
            st.probing, st.probeSeen = true, false
            local probe = Instance.new("ScreenGui")   -- không gắn Parent, hủy ngay
            st.probing = false
            st.available = (st.probeSeen == true)
            if probe and probe.Destroy then pcall(function() probe:Destroy() end) end
        end)
        if not st.available then
            pcall(unhook)
        end
    end

    st.unhook = unhook
    S.activeHook = unhook
    return unhook, records, st
end

function S.WatchNewGuis(records, st)
    local conns = {}
    local function already(g)
        for _, r in ipairs(records) do if r.inst == g then return true end end
        return false
    end
    local function makeHandler()
        return function(child)
            if st.watchOn == false then return end
            if not child then return end
            local okType, isGui = pcall(function()
                return child:IsA("ScreenGui") or child:IsA("Folder")
            end)
            if not (okType and isGui) then return end
            if child == gui or already(child) then return end
            local now = os.clock()
            records[#records + 1] = {
                inst      = child,
                certain   = false,
                duringRun = (st.inRun == true) or (st.graceUntil ~= nil and now < st.graceUntil),
                age       = now - st.t0,
                embedded  = false,
                via       = "watch",
            }
        end
    end
    local seenCtn, containers = {}, {playerGui, targetGui}
    pcall(function()
        local cg = game:GetService("CoreGui")
        if cg then containers[#containers + 1] = cg end
    end)
    for _, ctn in ipairs(containers) do
        if ctn and not seenCtn[ctn] then
            seenCtn[ctn] = true
            pcall(function()
                conns[#conns + 1] = ctn.ChildAdded:Connect(makeHandler())
            end)
        end
    end
    st.watchOn = true
    local function stopWatch()
        st.watchOn = false
        for _, c in ipairs(conns) do pcall(function() c:Disconnect() end) end
    end
    return stopWatch, conns
end

function S.EmbedRecorded(records, containerFrame, mode, verbose)
    if type(records) ~= "table" or #records == 0 then return 0, nil end
    if not containerFrame or not containerFrame.Parent then return 0, "tab đã bị đóng" end
    if not S.embedEnabled then return 0, "🧩 nhúng đang TẮT" end
    mode = mode or "run"

    local order = {}
    for _, r in ipairs(records) do
        if r and r.inst and not r.embedded then order[#order + 1] = r end
    end
    local function score(r)
        if r.certain then return 3 end
        if r.duringRun then return 2 end
        return 1
    end
    table.sort(order, function(a, b) return score(a) > score(b) end)

    local done, whyTop = 0, nil
    for _, r in ipairs(order) do
        local accept = false
        if mode == "all" then
            accept = true
        elseif r.certain then
            accept = true
        elseif r.duringRun and mode ~= "strict" then
            accept = true
        elseif mode == "any" and (r.age or 0) <= S.EMBED_PROBABLE_AGE then
            accept = true
        end
        if accept then
            local trust
            if r.certain then trust = "certain"
            elseif r.duringRun or mode == "all" then trust = "manual"
            else trust = "guess" end
            local okE, why = S.IsEmbeddable(r.inst, containerFrame, trust)
            if okE then
                if S.EmbedGui(r.inst, containerFrame) then
                    r.embedded = true
                    r.why = nil
                    done += 1
                else
                    r.why = "S.EmbedGui từ chối"
                    whyTop = r.why
                end
            else
                r.why = why
                if why then whyTop = why end
                if verbose and not r.reported then
                    r.reported = true
                    pcall(function()
                        print(string.format("[taodepzai v5.0 NOIR] 🔍 bỏ qua GUI '%s' (%s, %s): %s",
                            tostring(r.inst and r.inst.Name), tostring(r.via), trust, tostring(why)))
                    end)
                end
            end
        end
    end
    return done, whyTop
end

function S.FindFeatureByHost(host)
    if not host then return nil end
    for _, ft in ipairs(featureTabs) do
        if ft.frame and ft.frame.Parent and ft.frame:FindFirstChild("ScriptHost") == host then return ft end
    end
    return nil
end

function S.FindActiveFeature()
    for _, ft in ipairs(featureTabs) do
        if ft.frame == activeTab then return ft end
    end
    return nil
end

function S.DiagText(st, records)
    local hookTxt = "không rõ"
    if st then
        if st.available then
            hookTxt = st.viaHookfunction and "OK (qua hookfunction)" or "OK (ghi đè Instance.new)"
        elseif st.hooked then
            hookTxt = "cài được nhưng KHÔNG ăn (executor bỏ qua hook)"
        else
            hookTxt = "BỊ CHẶN (executor không cho sửa Instance.new)"
        end
    end
    local n, certain, watch, scan = 0, 0, 0, 0
    for _, r in ipairs(records or {}) do
        n += 1
        if r.certain then certain += 1 end
        if r.via == "watch" then watch += 1 end
        if r.via == "scan" then scan += 1 end
    end
    local lastWhy = nil
    for _, r in ipairs(records or {}) do if r.why then lastWhy = r.why end end
    return string.format("hook=%s · ghi nhận %d GUI (chắc chắn %d, watcher %d, quét %d) · nhúng=%s · lý do cuối: %s",
        hookTxt, n, certain, watch, scan, tostring(S.embedEnabled and "BẬT" or "TẮT"), tostring(lastWhy or "—"))
end

function S.RescueScan(ft, host)
    host = host or (ft and ft.frame and ft.frame:FindFirstChild("ScriptHost"))
    if not host or not host.Parent then return 0 end
    if not S.embedEnabled then return 0 end
    local containers = {playerGui}
    if targetGui ~= playerGui then containers[#containers + 1] = targetGui end
    pcall(function()
        local cg = game:GetService("CoreGui")
        if cg then containers[#containers + 1] = cg end
    end)
    local seen, n = {}, 0
    for _, ctn in ipairs(containers) do
        pcall(function()
            for _, g in ipairs(ctn:GetChildren()) do
                if n < 3 and not seen[g] then
                    seen[g] = true
                    local okE = S.IsEmbeddable(g, host, "manual")
                    if okE and S.EmbedGui(g, host) then
                        n += 1
                        if ft then
                            ft.records = ft.records or {}
                            ft.records[#ft.records + 1] =
                                {inst = g, certain = false, duringRun = true, age = 0, embedded = true, via = "rescue"}
                        end
                    end
                end
            end
        end)
        if n >= 3 then break end
    end
    return n
end

function S.ReembedFeature(ft, allowScan)
    if not ft or not ft.frame or not ft.frame.Parent then return 0, "tab không còn tồn tại" end
    if not S.embedEnabled then return 0, "🧩 nhúng đang TẮT" end
    local host = ft.frame:FindFirstChild("ScriptHost")
    if not host then return 0, "tab thiếu ScriptHost" end
    for _, e in ipairs(S.embeds) do
        if e.host and e.host.Parent == host then return 0, "tab đã có GUI nhúng sẵn" end
    end
    -- GUI đã trả ra màn hình không còn ở host; cho phép nhúng lại record cũ.
    for _, record in ipairs(ft.records or {}) do
        if record.inst and record.inst.Parent then record.embedded, record.reported = false, nil end
    end
    local n, why = S.EmbedRecorded(ft.records, host, "all", true)
    if n > 0 then return n end
    if allowScan == true then
        local m = S.RescueScan(ft, host)
        if m > 0 then return m end
        why = "không tìm thấy GUI nào nằm ngoài menu để nhúng"
    end
    if not why then
        why = (ft.records and #ft.records > 0)
            and (ft.lastWhy or "GUI chưa sẵn sàng để nhúng")
            or  "chưa ghi nhận được GUI nào (script có tạo ScreenGui không?)"
    end
    return 0, why
end

function S.OnFeatureTabOpened(ft)
    if not ft or not ft.frame or not ft.frame.Parent then return end
    local n = S.ReembedFeature(ft, false)
    if n > 0 then
        pcall(function()
            if ft.status and ft.status.Parent then
                ft.status.Text = string.format(
                    "✅ vừa nhúng lại %d GUI vào tab (lần trước bị rớt ngoài menu) — bấm ✕ để trả về game", n)
            end
            if ft.indicator and ft.indicator.Parent then ft.indicator.BackgroundColor3 = C.GREEN end
        end)
    end
end

S.parkTab   = nil
S.parkBtn   = nil
S.parkList  = nil
S.parkCount = 0
S.PARK_MAX  = 2      -- mỗi lần chạy chỉ đưa tối đa 2 GUI vào menu (tránh nuốt cả UI của game)

function S.ParkHost(label)
    if not (S.parkList and S.parkList.Parent) then
        local sf, btn = AddTab("GUI Ngoài", "🧩", 99)
        S.parkTab, S.parkBtn = sf, btn
        New("TextLabel", {
            Size = UDim2.new(1, -140, 0, 30), Position = UDim2.new(0, 8, 0, 4),
            Text = "🧩 GUI do script chạy ở tab 💻 Code tạo ra — hub đưa vào đây. Bấm ↩ để trả về màn hình game. (Dex/IY/SimpleSpy KHÔNG bao giờ vào đây.)",
            BackgroundTransparency = 1, TextColor3 = C.DARK, Font = Enum.Font.GothamMedium,
            TextSize = 10, TextWrapped = true, ZIndex = 6,
            TextXAlignment = Enum.TextXAlignment.Left,
        }, S.parkTab)
        local backAll = New("TextButton", {
            Size = UDim2.new(0, 124, 0, 24), Position = UDim2.new(1, -128, 0, 6),
            Text = "↩ Trả tất cả về game", BackgroundColor3 = C.RED, BackgroundTransparency = 0.15,
            TextColor3 = C.WHITE, Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 7,
        }, S.parkTab)
        Corner(backAll, UDim.new(0, 5))
        backAll.Activated:Connect(function()
            local n = S.RemoveAllParked()
            pcall(function()
                print("[taodepzai v5.0 NOIR] ↩ đã trả " .. n .. " GUI về màn hình game")
            end)
        end)
        S.parkList = New("Frame", {
            Name = "ParkList", Size = UDim2.new(1, -16, 1, -42), Position = UDim2.new(0, 8, 0, 38),
            BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 5,
        }, S.parkTab)
        New("UIListLayout", {Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder}, S.parkList)
    end

    S.parkCount += 1
    local box = New("Frame", {
        Name = "ParkBox_" .. tostring(label or "GUI"),
        Size = UDim2.new(1, 0, 0, 240), LayoutOrder = S.parkCount,
        BackgroundColor3 = C.BG, BackgroundTransparency = 0.35, BorderSizePixel = 0, ZIndex = 5,
    }, S.parkList)
    Corner(box, UDim.new(0, 8))
    Stroke(box, nil, 1)

    local back = New("TextButton", {
        Size = UDim2.new(0, 110, 0, 20), Position = UDim2.new(1, -114, 0, 2),
        Text = "↩ Trả về game", BackgroundColor3 = C.GRAY, BackgroundTransparency = 0.2,
        TextColor3 = C.WHITE, Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 7,
    }, box)
    Corner(back, UDim.new(0, 5))
    back.Activated:Connect(function()
        S.ClearEmbedsUnder(box)                    -- trả frame con về ScreenGui gốc + hủy host
        pcall(function() box:Destroy() end)
        S.parkCount = math.max(0, S.parkCount - 1)
        pcall(function() S.parkTab.CanvasSize = UDim2.new(0, 0, 0, S.parkCount * 246 + 10) end)
        pcall(function()
            if S.parkBtn then S.parkBtn.Text = S.parkCount > 0
                and ("🧩 GUI Ngoài (" .. S.parkCount .. ")") or "🧩 GUI Ngoài" end
        end)
    end)

    local area = New("Frame", {
        Name = "ParkArea", Size = UDim2.new(1, -8, 1, -30), Position = UDim2.new(0, 4, 0, 26),
        BackgroundTransparency = 1, BorderSizePixel = 0, ClipsDescendants = true, ZIndex = 5,
    }, box)
    pcall(function() S.parkTab.CanvasSize = UDim2.new(0, 0, 0, S.parkCount * 246 + 10) end)
    pcall(function()
        if S.parkBtn then S.parkBtn.Text = "🧩 GUI Ngoài (" .. S.parkCount .. ")" end
    end)
    return area, box
end

S.NO_PARK_MARKERS = {
    "dex.lua", "dex explorer", "dexexplorer", "infiniteyield", "infinite yield",
    "simplespy", "simple spy",
}
function S.ShouldSkipPark(code, name)
    local hay = (tostring(code or "") .. "\n" .. tostring(name or "")):lower()
    for _, m in ipairs(S.NO_PARK_MARKERS) do
        if hay:find(m, 1, true) then return true, m end
    end
    local code_l = tostring(code or ""):lower()
    local hasFetch = code_l:find("httpget", 1, true) or code_l:find("http_request", 1, true)
        or code_l:find("request(", 1, true) or code_l:find("https://", 1, true)
        or code_l:find("http://", 1, true)
    if hasFetch and (code_l:find("loadstring", 1, true) or code_l:find("load(", 1, true)) then
        return true, "script tải từ mạng (để GUI ngoài màn hình như tác giả thiết kế)"
    end
    return false, nil
end

function S.RemoveAllParked()
    if not (S.parkList and S.parkList.Parent) then return 0 end
    local n = 0
    local kids = S.parkList:GetChildren()
    for i = #kids, 1, -1 do
        local box = kids[i]
        if box.Name:sub(1, 8) == "ParkBox_" then
            S.ClearEmbedsUnder(box)
            pcall(function() box:Destroy() end)
            n += 1
        end
    end
    S.parkCount = 0
    pcall(function() S.parkTab.CanvasSize = UDim2.new(0, 0, 0, 10) end)
    pcall(function() if S.parkBtn then S.parkBtn.Text = "🧩 GUI Ngoài" end end)
    return n
end

function S.BeginRunCapture()
    if not S.embedEnabled then return nil end
    if S.parkCodeGuis == false then return nil end
    local ok, cap = pcall(function()
        local unhook, recs, st = S.HookInstanceNew()
        local stopWatch = S.WatchNewGuis(recs, st)
        st.stopWatch = stopWatch
        return {unhook = unhook, recs = recs, st = st, stopWatch = stopWatch,
            parked = 0, names = {}, cancelled = false}
    end)
    if not ok then return nil end
    S.activeCap = cap     -- để Cancel() gỡ được hook+watcher nếu người dùng bấm ⏹ Dừng giữa chừng
    return cap
end

function S.AbortRunCapture()
    local cap = S.activeCap
    if not cap then return false end
    S.activeCap = nil
    cap.cancelled = true
    pcall(function() if cap.st then cap.st.watchOn = false cap.st.inRun = false end end)
    pcall(cap.stopWatch)
    pcall(cap.unhook)
    return true
end

function S.EndRunCapture(cap, label)
    if not cap or cap.cancelled then return 0 end
    local st, recs = cap.st, cap.recs
    pcall(function()
        st.inRun = false
        st.graceUntil = os.clock() + 1.0
    end)

    local function try()
        if cap.cancelled or cap.parked >= S.PARK_MAX or not S.embedEnabled then return 0 end
        local added = 0
        for _, r in ipairs(recs) do
            if cap.parked >= S.PARK_MAX then break end
            if r and r.inst and not r.embedded then
                local trust
                if r.certain then trust = "certain"
                elseif r.duringRun then trust = "manual"
                else trust = "guess" end
                if S.IsEmbeddable(r.inst, nil, trust) then
                    local area, box = S.ParkHost(label)
                    if area and S.EmbedGui(r.inst, area) then
                        r.embedded = true
                        cap.parked += 1
                        cap.names[#cap.names + 1] = tostring(r.inst.Name)
                        added += 1
                        pcall(function()
                            print(string.format("[taodepzai v5.0 NOIR] 🧩 đã đưa GUI '%s' vào tab 'GUI Ngoài' (script chạy ở tab Code)",
                                tostring(r.inst.Name)))
                        end)
                    elseif box then
                        pcall(function() box:Destroy() end)   -- không nhúng được -> đừng để ô rỗng
                        S.parkCount = math.max(0, S.parkCount - 1)
                    end
                end
            end
        end
        return added
    end

    local total = try()
    for _, d in ipairs(S.EMBED_TRY_DELAYS) do
        task.delay(d, function()
            if cap.cancelled or cap.parked >= S.PARK_MAX then return end
            if not S.embedEnabled then return end
            try()
        end)
    end
    task.delay(S.EMBED_HOOK_GRACE, function()
        pcall(cap.unhook)
        pcall(cap.stopWatch)
        if S.activeCap == cap then S.activeCap = nil end
    end)
    pcall(function()
        print("[taodepzai v5.0 NOIR] ▶ tab Code · " .. S.DiagText(st, recs) .. " · đã đưa vào menu: " .. cap.parked)
    end)
    return total
end

local function RunFeatureScript(code, name, containerFrame, indicator, statusLabel)
    if #code == 0 then
        if statusLabel then statusLabel.Text = "⚠️ Vui lòng nhập code!" end
        return false, "empty"
    end

    code = NormalizeCode(code)
    S.EnsureCompat()   -- v4.7: tab ➕ Tính Năng cũng được bù hàm executor còn thiếu

    if indicator then indicator.BackgroundColor3 = C.RED end
    if statusLabel then statusLabel.Text = "⏳ Đang thực thi..." end
    ReleaseHubFocus()   -- v4.4b: đang dán code trong TextBox mà chạy luôn thì game vẫn "khóa" input

    local ft = S.FindFeatureByHost(containerFrame)
    local runToken = nil
    if ft then
        ft._runToken = (tonumber(ft._runToken) or 0) + 1
        runToken = ft._runToken
        ft.records = nil              -- lần chạy mới -> bỏ danh sách GUI của lần chạy cũ
    end

    local embedCount, lateCandidate = 0, 0
    local featureUnhook, records, lastWhy, hookState = nil, nil, nil, nil
    local ok, err = pcall(function()
        local compiler = S.GetGlobal("loadstring")
        if type(compiler) ~= "function" then error("Executor không hỗ trợ loadstring để chạy script") end
        local fn, lerr = compiler(code)
        if not fn then error("loadstring thất bại: "..tostring(lerr)) end

        local beforeGuis = {}
        for _, g in ipairs(playerGui:GetChildren()) do beforeGuis[g] = true end
        for _, g in ipairs(targetGui:GetChildren()) do beforeGuis[g] = true end
        pcall(function()
            for _, g in ipairs(game:GetService("CoreGui"):GetChildren()) do beforeGuis[g] = true end
        end)

        local unhook, recs, st = S.HookInstanceNew()
        local stopWatch = S.WatchNewGuis(recs, st)
        st.stopWatch = stopWatch
        featureUnhook, records, hookState = unhook, recs, st
        if ft then ft.records = recs ft.hookState = st end

        local fnOk, fnErr = pcall(fn)

        st.inRun = false
        st.graceUntil = os.clock() + 1.0

        local hookWorks = (st.available == true)
        local useScan = (not hookWorks) or (S.embedGuessNew == true)
        local mode = (S.embedGuessNew == true) and "any" or "run"

        for i = 1, S.EMBED_CHILD_WAIT do
            if useScan then
                local found = ScanNewGuis(beforeGuis, nil, true)
                for _, g in ipairs(found) do
                    local now = os.clock()
                    recs[#recs + 1] = {
                        inst = g, certain = false,
                        duringRun = (st.inRun == true) or (now < (st.graceUntil or 0)),
                        age = now - st.t0, embedded = false, via = "scan",
                    }
                end
            end
            local d, why = S.EmbedRecorded(recs, containerFrame, useScan and "any" or mode, true)
            embedCount += d
            if why then lastWhy = why end
            if embedCount > 0 then break end
            task.wait(0.2)
        end

        if embedCount > 0 then
            unhook()
            pcall(stopWatch)
        else
            task.delay(S.EMBED_HOOK_GRACE, function() pcall(unhook) pcall(stopWatch) end)
        end

        if not fnOk then error(fnErr) end

        for _, dly in ipairs(S.EMBED_TRY_DELAYS) do
            task.delay(dly, function()
                if ft and ft._runToken ~= runToken then return end
                if embedCount > 0 then return end
                if not (containerFrame and containerFrame.Parent) then return end
                if not S.embedEnabled then return end
                if useScan then
                    local found = ScanNewGuis(beforeGuis, nil, true)
                    for _, g in ipairs(found) do
                        local now = os.clock()
                        recs[#recs + 1] = {
                            inst = g, certain = false, duringRun = false,
                            age = now - st.t0, embedded = false, via = "scan",
                        }
                    end
                end
                local more = S.EmbedRecorded(recs, containerFrame, "any", true)
                if more > 0 then
                    embedCount += more
                    pcall(function()
                        if indicator and indicator.Parent then indicator.BackgroundColor3 = C.GREEN end
                        if statusLabel and statusLabel.Parent then
                            statusLabel.Text = string.format(
                                "✅ xong · GUI sinh trễ đã được nhúng vào tab (%d) — bấm ✕ để trả về màn hình game",
                                embedCount)
                        end
                    end)
                end
            end)
        end

        if embedCount == 0 then
            local late = ScanNewGuis(beforeGuis, nil, true)
            local real = 0
            for _, g in ipairs(late) do
                if g.Parent and not g:IsDescendantOf(containerFrame) then real += 1 end
            end
            if real > 0 then lateCandidate = real end
        end
    end)

    if embedCount > 0 then
        if featureUnhook then pcall(featureUnhook) end
        pcall(function() if hookState and hookState.stopWatch then hookState.stopWatch() end end)
    end
    if ft then
        ft.records   = records    -- giữ lại để MỞ tab / bấm 🔁 là nhúng tiếp được
        ft.lastWhy   = lastWhy
        ft.indicator = indicator
        ft.hookState = hookState
    end
    pcall(function()
        print("[taodepzai v5.0 NOIR] ▶ '" .. tostring(name) .. "' · " .. S.DiagText(hookState, records)
            .. " · đã nhúng: " .. embedCount)
    end)

    if ok then
        if indicator then indicator.BackgroundColor3 = C.GREEN end
        if statusLabel then
            if embedCount > 0 then
                statusLabel.Text = string.format(
                    "✅ xong · %d GUI đã nhúng vào tab (bấm ✕ để trả về màn hình game)", embedCount)
            elseif not S.embedEnabled then
                statusLabel.Text = "✅ xong · 🧩 nhúng đang TẮT nên GUI nằm ngoài màn hình — BẬT lại rồi bấm ▶"
            elseif hookState and hookState.available ~= true then
                statusLabel.Text = "⚠️ Executor CHẶN hook Instance.new — hub đã dùng chế độ quét dự phòng"
                    .. (lateCandidate > 0 and (" (thấy " .. lateCandidate .. " GUI mới)") or " (không thấy GUI mới nào)")
                    .. " · bấm 🔁 'Cứu GUI' ở tab Tạo Tính Năng để ép nhúng · chi tiết ở console (F9)"
            elseif lateCandidate > 0 then
                statusLabel.Text = string.format(
                    "✅ xong · thấy %d GUI mới nhưng chưa nhúng được — MỞ lại tab này hoặc bấm 🔁 'Cứu GUI'%s",
                    lateCandidate, (S.embedGuessNew == true) and "" or " · hoặc bật 🕵 'Đoán GUI trễ'")
            else
                statusLabel.Text = "✅ xong · không thấy script tạo GUI nào (script có tạo ScreenGui không?)"
                    .. (lastWhy and (" · lý do: " .. tostring(lastWhy)) or "")
            end
        end
        return true, nil, records
    else
        if indicator then indicator.BackgroundColor3 = C.RED end
        if statusLabel then statusLabel.Text = "❌ Lỗi: "..tostring(err) end
        warn("[taodepzai v5.0 NOIR] Feature script error:", err)
        return false, err, records
    end
end
local function CreateFeatureTab(name, icon, codeContent, options)
    if not name or #name == 0 then name = "Tính Năng " .. (#featureTabs + 1) end
    if not icon or #icon == 0 then icon = "⚙️" end

    options = options or {}
    codeContent = NormalizeCode(codeContent)

    local featureData

    local sf  = MakeTabFrame()
    local order = featureTabIndex
    for _, feature in ipairs(featureTabs) do if not feature.fixedOrder then order += 1 end end
    local btn = MakeTabButton(name, icon, options.fixedOrder or order, function()
        task.defer(function()
            if not featureData or featureData.destroyed or not featureData.frame.Parent then return end
            S.OnFeatureTabOpened(featureData)
        end)
    end)

    table.insert(tabs, btn)
    table.insert(tabContent, sf)
    tabBar.CanvasSize = UDim2.new(0, 0, 0, #tabs * 44 + 10)

    local tabIdx = #tabs

    featureData = {
        name = name,
        icon = icon,
        code = codeContent,
        btn = btn,
        frame = sf,
        tabIdx = tabIdx,
        transient = options.transient == true,
        builtinId = options.builtinId,
        fixedOrder = options.fixedOrder,
        state = "idle", running = false, hasRun = false,
    }
    table.insert(featureTabs, featureData)

    local embedHost = New("Frame", {
        Size = UDim2.new(1,0,1,-36),
        Position = UDim2.new(0,0,0,0),
        BackgroundTransparency = 1,
        BorderSizePixel = 0,
        ZIndex = 5,
        Name = "ScriptHost",
        Visible = true,
    }, sf)
    featureData.hostFrame = embedHost   -- v4.4g

    local toolbar = New("Frame", {
        Size = UDim2.new(1,0,0,36),
        Position = UDim2.new(0,0,1,-36),
        BackgroundColor3 = Color3.fromRGB(230,233,242),
        BackgroundTransparency = 0.1,
        BorderSizePixel = 0,
        ZIndex = 20,
    }, sf)
    Corner(toolbar, UDim.new(0,6))
    Stroke(toolbar, Color3.fromRGB(180,185,200), 1)

    local runFeatureBtn = New("TextButton", {
        Size=UDim2.new(0,90,0,26), Position=UDim2.new(0,6,0,5),
        Text="▶ Chạy Script", BackgroundColor3=C.GREEN, BackgroundTransparency=0.1,
        TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=21,
    }, toolbar)
    Corner(runFeatureBtn, UDim.new(0,5))

    local saveFeatureBtn = New("TextButton", {
        Size=UDim2.new(0,84,0,26), Position=UDim2.new(0,100,0,5),
        Text="📤 Chép Code", BackgroundColor3=C.BLUE, BackgroundTransparency=0.1,
        TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=21,
    }, toolbar)
    Corner(saveFeatureBtn, UDim.new(0,5))

    local editFeatureBtn = New("TextButton", {
        Size=UDim2.new(0,52,0,26), Position=UDim2.new(0,188,0,5),
        Text="✏️ Sửa", BackgroundColor3=C.ORANGE, BackgroundTransparency=0.1,
        TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=21,
    }, toolbar)
    Corner(editFeatureBtn, UDim.new(0,5))

    local crosshairBtn = New("TextButton", {
        Size=UDim2.new(0,68,0,26), Position=UDim2.new(0,244,0,5),
        Text="🎯 Tâm", BackgroundColor3=C.PURPLE, BackgroundTransparency=0.1,
        TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=21,
    }, toolbar)
    Corner(crosshairBtn, UDim.new(0,5))
    S.RegisterCrosshairBtn(crosshairBtn)

    local closeFeatureBtn = New("TextButton", {
        Name = "FeatureTabClose",
        Size=UDim2.new(0,40,0,26), Position=UDim2.new(1,-46,0,5),
        Text="✕", BackgroundColor3=C.RED, BackgroundTransparency=0.1,
        TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=12, BorderSizePixel=0, ZIndex=21,
    }, toolbar)
    Corner(closeFeatureBtn, UDim.new(0,5))

    local fStatus = New("TextLabel", {
        Size=UDim2.new(1,-52-316,0,26), Position=UDim2.new(0,316,0,5),
        Text="", BackgroundTransparency=1, TextColor3=Color3.fromRGB(255, 205, 64),
        Font=Enum.Font.GothamMedium, TextSize=8, TextXAlignment=Enum.TextXAlignment.Left,
        TextTruncate=Enum.TextTruncate.AtEnd, ZIndex=21,
    }, toolbar)
    featureData.status = fStatus   -- v4.4g: hub tự sửa nhãn khi nhúng trễ thành công

    local editorFrame = New("Frame", {
        Size=UDim2.new(1,0,1,-36),
        Position=UDim2.new(0,0,0,0),
        BackgroundColor3=Color3.fromRGB(245,247,252),
        BackgroundTransparency=0,
        BorderSizePixel=0,
        ZIndex=30,
        Visible=false,
    }, sf)

    local editorBox = New("TextBox", {
        Size=UDim2.new(1,-16,1,-70), Position=UDim2.new(0,8,0,8),
        Text=codeContent,
        PlaceholderText="Dán script hoàn chỉnh HOẶC link raw vào đây...\nScript có thể tạo GUI riêng, GUI đó sẽ được nhúng vào tab này.",
        PlaceholderColor3=Color3.fromRGB(122, 130, 148),
        BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0,
        TextColor3=Color3.fromRGB(233, 237, 245),
        Font=Enum.Font.Code, TextSize=11, BorderSizePixel=0, ClearTextOnFocus=false,
        MultiLine=true, TextWrapped=true, TextXAlignment=Enum.TextXAlignment.Left, TextYAlignment=Enum.TextYAlignment.Top,
        Active=true, Selectable=true, ZIndex=31,
    }, editorFrame)
    Corner(editorBox, UDim.new(0,5))
    Stroke(editorBox, Color3.fromRGB(100,120,200), 1.5)
    New("UIPadding", {PaddingLeft=UDim.new(0,6), PaddingTop=UDim.new(0,4)}, editorBox)

    local applyEditBtn = New("TextButton", {
        Size=UDim2.new(0,120,0,26), Position=UDim2.new(0,8,1,-34),
        Text="✅ Áp Dụng", BackgroundColor3=C.GREEN, BackgroundTransparency=0.1,
        TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=31,
    }, editorFrame)
    Corner(applyEditBtn, UDim.new(0,5))

    local cancelEditBtn = New("TextButton", {
        Size=UDim2.new(0,120,0,26), Position=UDim2.new(0,134,1,-34),
        Text="❌ Hủy", BackgroundColor3=C.RED, BackgroundTransparency=0.1,
        TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=31,
    }, editorFrame)
    Corner(cancelEditBtn, UDim.new(0,5))

    local function ClearHost()
        S.ClearEmbedsUnder(embedHost)
    end

    featureData.indicator = runFeatureBtn
    featureData.execute = function()
        ClearHost()
        fStatus.Text = "⏳ Đang chạy..."
        return RunFeatureScript(codeContent, name, embedHost, runFeatureBtn, fStatus)
    end
    featureData.setSource = function(source)
        if featureData.running then return false, "Script đang chạy" end
        if type(source) ~= "string" or source:match("^%s*$") then return false, "Script/link đang trống" end
        local valid = source
        S.CancelFeatureRun(featureData)
        codeContent = NormalizeCode(valid)
        featureData.code = codeContent
        ClearHost()
        featureData.records = nil
        return true
    end
    runFeatureBtn.Activated:Connect(function()
        local ok, why = S.StartFeatureRun(featureData, true)
        if not ok then fStatus.Text = "⚠️ " .. tostring(why) end
    end)

    saveFeatureBtn.Activated:Connect(function()
        if featureData.builtinId then
            fStatus.Text = "💾 Tính năng này có sẵn trong script chính; không chép/lưu trùng"
            return
        end
        local c = codeContent
        if #c == 0 then
            fStatus.Text = "⚠️ Không có code!"
            return
        end
        local n = name
        local bn = n
        local cnt = 1
        while true do
            local ex = false
            for _, s in ipairs(scripts) do
                if s.name == n then ex = true; break end
            end
            if not ex then break end
            cnt += 1
            n = bn.." ("..cnt..")"
        end
        table.insert(scripts, {name = n, code = c, expanded = false})
        if RebuildScripts then RebuildScripts() end
        Store.saveSoon()
        fStatus.Text = "✅ Đã chép sang tab Code!"
    end)

    editFeatureBtn.Activated:Connect(function()
        editorBox.Text = codeContent
        editorFrame.Visible = true
    end)

    applyEditBtn.Activated:Connect(function()
        local ok, err = featureData.setSource(editorBox.Text)
        if not ok then fStatus.Text = "⚠️ " .. tostring(err); return end
        editorFrame.Visible = false
        Store.saveSoon()
        fStatus.Text = "✏️ Đã cập nhật nguồn; bấm Chạy Script để chạy bản mới"
    end)

    cancelEditBtn.Activated:Connect(function()
        editorFrame.Visible = false
    end)

    closeFeatureBtn.Activated:Connect(function()
        if featureData.running then S.CancelFeatureRun(featureData) end
        ClearHost()
        if featureData.builtinId then
            for i, frame in ipairs(tabContent) do if frame == codeTab then SwitchTab(i); return end end
        end
        OpenFirstPage()   -- v4.6.2: đóng tab tính năng thì về trang đầu (🔗 Code Đã Lưu)
    end)

    return featureData
end

S.CreateFeatureTab = CreateFeatureTab
function S.OpenFeatureTab(ft)
    for i, frame in ipairs(tabContent) do
        if frame == ft.frame and frame.Parent then SwitchTab(i); return true end
    end
    return false
end

function S.DestroyFeatureTab(ft)
    if not ft or ft.destroyed then return false end
    ft.destroyed = true
    S.CancelFeatureRun(ft)
    if activeTab == ft.frame then OpenFirstPage() end
    local host = ft.hostFrame or (ft.frame and ft.frame:FindFirstChild("ScriptHost"))
    if host then pcall(S.ClearEmbedsUnder, host) end
    if type(S.PruneEmbeds) == "function" then pcall(S.PruneEmbeds) end
    for i, button in ipairs(tabs) do
        if button == ft.btn then table.remove(tabs, i); table.remove(tabContent, i); break end
    end
    for i, feature in ipairs(featureTabs) do
        if feature == ft then table.remove(featureTabs, i); break end
    end
    pcall(function() ft.btn:Destroy() end)
    pcall(function() ft.frame:Destroy() end)
    if S.scriptHubFeature == ft then S.scriptHubFeature = nil end
    if S.supportFeature == ft then S.supportFeature = nil end
    local order = featureTabIndex
    for _, feature in ipairs(featureTabs) do
        feature.btn.LayoutOrder = feature.fixedOrder or order
        if not feature.fixedOrder then order += 1 end
        for i, button in ipairs(tabs) do if button == feature.btn then feature.tabIdx = i; break end end
    end
    tabBar.CanvasSize = UDim2.new(0,0,0,#tabs * 44 + 10)
    return true
end

_G.BananaCatHub_FeatureCleanup = function()
    for i = #featureTabs, 1, -1 do S.DestroyFeatureTab(featureTabs[i]) end
end



-- BEGIN BUILTIN_SCRIPT_HUB_FEATURE
function S.EnsureScriptHubFeature()
    local ft = S.scriptHubFeature
    if ft and not ft.destroyed and ft.frame and ft.frame.Parent then return ft end
    if ft then S.DestroyFeatureTab(ft) end
    ft = S.CreateFeatureTab("Script Hub", "📚", S.ScriptHubScriptUrl,
        {builtinId = "script-hub", transient = true, fixedOrder = 3})
    S.scriptHubFeature = ft
    ft.status.Text = "📚 Có sẵn · bấm ▶ Chạy Script để tải Script Hub gốc"
    local hint = New("TextLabel", {
        Name="ScriptHubFeatureHint", Size=UDim2.new(1,-24,1,-24), Position=UDim2.new(0,12,0,12),
        Text="📚 Script Hub — giao diện gốc trong script riêng\n\nBấm ▶ Chạy Script để tải và nhúng giao diện.\nGiữ nguyên các script, tìm kiếm, danh mục, ghim và bảng điều khiển của bản gốc.",
        BackgroundTransparency=1, TextColor3=C.MUTED, Font=Enum.Font.GothamMedium,
        TextSize=12, TextWrapped=true, ZIndex=6,
    }, ft.hostFrame)
    local execute = ft.execute
    ft.execute = function()
        hint.Visible = false
        local ok, why, records = execute()
        if not ok and hint.Parent then hint.Visible = true end
        return ok, why, records
    end
    return ft
end
-- END BUILTIN_SCRIPT_HUB_FEATURE

-- BEGIN BUILTIN_SUPPORT_FEATURE
function S.EnsureSupportFeature()
    local ft = S.supportFeature
    if ft and not ft.destroyed and ft.frame and ft.frame.Parent then return ft end
    if ft then S.DestroyFeatureTab(ft) end
    ft = S.CreateFeatureTab("Hỗ Trợ", "🛠", S.SupportScriptUrl,
        {builtinId = "support", transient = true, fixedOrder = 5})
    S.supportFeature = ft
    ft.status.Text = "🛠 Có sẵn · bấm ▶ Chạy Script để tải Hỗ Trợ"
    return ft
end
-- END BUILTIN_SUPPORT_FEATURE


task.spawn(function()
    task.wait(1)
    local lastSize = main.AbsoluteSize
    while main and main.Parent do
        task.wait(0.15)
        if main.AbsoluteSize ~= lastSize then
            lastSize = main.AbsoluteSize
            if #S.embeds > 0 then
                S.SyncAllEmbeds()
            end
            S.PruneEmbeds()
            if _G.BananaCatHub_EmbedHosts then
                for i = #_G.BananaCatHub_EmbedHosts, 1, -1 do
                    local host = _G.BananaCatHub_EmbedHosts[i]
                    if not host or not host.Parent then
                        table.remove(_G.BananaCatHub_EmbedHosts, i)
                    end
                end
            end
        end
    end
end)

local createFeatureTab = AddTab("Tạo Tính Năng", "➕", 7)   -- v4.15: 6 -> 7 (👥 chen vào ô 4)

local cy = 8
Label(createFeatureTab, "➕ Tạo Tab Tính Năng Tích Hợp", cy)
cy = cy + 16
Label(createFeatureTab, "Dán NGUYÊN một script hoàn chỉnh HOẶC link raw.", cy)
cy = cy + 14
Label(createFeatureTab, "Script chạy trong tab; GUI của NÓ được nhúng vào menu (không đụng GUI game).", cy)
cy = cy + 14
Label(createFeatureTab, "💾 Tab tạo ra TỰ ĐỘNG được lưu — thoát game vào lại vẫn còn, khỏi cần bấm gì thêm.", cy)
cy = cy + 14
Label(createFeatureTab, "🧩 Bấm 🎯 Chạy Script xong nhớ bấm ✕ hoặc kéo menu to ra — hub tự nhả focus", cy)
cy = cy + 14
Label(createFeatureTab, "    để bạn quay chuột/bắn lại bình thường. Nếu script vẫn chiếm chuột: 🧩 TẮT nhúng.", cy)
cy = cy + 18

Label(createFeatureTab, "🏷️ Tên Tính Năng:", cy)
cy = cy + 14

local featureNameIn = New("TextBox", {
    Size=UDim2.new(1,-16,0,26), Position=UDim2.new(0,8,0,cy), Text="",
    PlaceholderText="VD: Auto Farm, Fly, Speed...",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0, TextColor3=Color3.fromRGB(233, 237, 245),
    Font=Enum.Font.GothamMedium, TextSize=12, BorderSizePixel=0, ClearTextOnFocus=false,
    Active=true, Selectable=true, ZIndex=10, TextXAlignment=Enum.TextXAlignment.Left,
}, createFeatureTab)
Corner(featureNameIn, UDim.new(0,5))
Stroke(featureNameIn, Color3.fromRGB(100,120,200), 1.5)
New("UIPadding", {PaddingLeft=UDim.new(0,6)}, featureNameIn)

cy = cy + 32
Label(createFeatureTab, "🎨 Icon (1 ký tự, tùy chọn):", cy)
cy = cy + 14

local featureIconIn = New("TextBox", {
    Size=UDim2.new(0,60,0,26), Position=UDim2.new(0,8,0,cy), Text="⚙️",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0, TextColor3=Color3.fromRGB(233, 237, 245),
    Font=Enum.Font.GothamBold, TextSize=14, BorderSizePixel=0, ClearTextOnFocus=false,
    Active=true, Selectable=true, ZIndex=10,
}, createFeatureTab)
Corner(featureIconIn, UDim.new(0,5))
Stroke(featureIconIn, Color3.fromRGB(180,180,200), 1.2)

cy = cy + 32
Label(createFeatureTab, "📜 Dán Script Hoàn Chỉnh HOẶC link raw:", cy)
cy = cy + 14

local featureCodeIn = New("TextBox", {
    Size=UDim2.new(1,-16,0,140), Position=UDim2.new(0,8,0,cy), Text="",
    PlaceholderText="Dán script hoặc link raw (https://...) vào đây...\nScript có thể tạo ScreenGui riêng, GUI đó sẽ được nhúng vào tab.",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(28, 31, 41), BackgroundTransparency=0, TextColor3=Color3.fromRGB(233, 237, 245),
    Font=Enum.Font.Code, TextSize=11, BorderSizePixel=0, ClearTextOnFocus=false,
    MultiLine=true, TextWrapped=true, TextXAlignment=Enum.TextXAlignment.Left, TextYAlignment=Enum.TextYAlignment.Top,
    Active=true, Selectable=true, ZIndex=10,
}, createFeatureTab)
Corner(featureCodeIn, UDim.new(0,5))
Stroke(featureCodeIn, Color3.fromRGB(100,120,200), 1.5)
New("UIPadding", {PaddingLeft=UDim.new(0,6), PaddingTop=UDim.new(0,4)}, featureCodeIn)

cy = cy + 146

local createTabBtn = Button(createFeatureTab, "➕ Tạo Tab Tính Năng", 8, cy, 210, 28, Color3.fromRGB(0,150,200))
local clearFormBtn = Button(createFeatureTab, "🧹 Xóa Form", 224, cy, 116, 28, C.ORANGE)
cy = cy + 34

local embedToggleBtn = Button(createFeatureTab, "🧩 Nhúng vào Tab: BẬT", 346, cy - 34, 130, 28, C.GREEN)
local guessToggleBtn = Button(createFeatureTab, "🕵 Đoán GUI trễ: TẮT", 8, cy, 176, 26, C.GRAY)
local grabSizeCodeBtn = Button(createFeatureTab, "📏 Code Tự Co Giãn (an toàn, Auto-Lưu)", 190, cy, 286, 26, C.PURPLE)
cy = cy + 34
local fixMouseBtn = Button(createFeatureTab, "🖱 Kẹt chuột / không bấm được? Bấm đây", 8, cy, 468, 24, C.RED)
cy = cy + 30
local copyTemplateBtn = Button(createFeatureTab, "📋 Copy Code Mẫu Cho AI (menu + niêm tâm)", 8, cy, 468, 26, C.BLUE)
cy = cy + 32

S.reembedBtn = Button(createFeatureTab,
    "🔁 Cứu GUI: nhúng lại GUI của tab ĐANG MỞ vào menu", 8, cy, 468, 26, C.BLUE)
cy = cy + 32

S.parkToggleBtn = Button(createFeatureTab,
    "🪟 GUI chạy ở tab 💻 Code → đưa vào menu: BẬT", 8, cy, 468, 26, C.GREEN)
cy = cy + 32

S.SyncEmbedToggles = function()
    pcall(function() if D.SyncPageChips then D.SyncPageChips() end end)   -- v4.5: chip trên header trang
    pcall(function()
        embedToggleBtn.Text = S.embedEnabled and "🧩 Nhúng vào Tab: BẬT" or "🧩 Nhúng vào Tab: TẮT"
        D.SetBg(embedToggleBtn, S.embedEnabled and C.GREEN or C.GRAY)   -- v4.5
        guessToggleBtn.Text = (S.embedGuessNew == true) and "🕵 Đoán GUI trễ: BẬT" or "🕵 Đoán GUI trễ: TẮT"
        D.SetBg(guessToggleBtn, (S.embedGuessNew == true) and C.ORANGE or C.GRAY)   -- v4.5
        if S.parkToggleBtn then
            local on = (S.parkCodeGuis ~= false)
            S.parkToggleBtn.Text = on and "🪟 GUI chạy ở tab 💻 Code → đưa vào menu: BẬT"
                                     or "🪟 GUI chạy ở tab 💻 Code → để ngoài màn hình: TẮT"
            D.SetBg(S.parkToggleBtn, on and C.GREEN or C.GRAY)
        end
    end)
end
S.SyncEmbedToggles()

local createStatus = Label(createFeatureTab, "", cy)
createStatus.TextColor3=C.YELLOW; createStatus.TextSize=9; createStatus.ZIndex=6
cy = cy + 14

S.DoToggleEmbed = function()
    S.embedEnabled = not S.embedEnabled
    if S.embedEnabled then
        embedToggleBtn.Text = "🧩 Nhúng vào Tab: BẬT"
        D.SetBg(embedToggleBtn, C.GREEN)
        createStatus.Text = "🧩 BẬT: GUI của script được mượn vào tab. Bấm ✕ trên tab để trả về như cũ."
    else
        embedToggleBtn.Text = "🧩 Nhúng vào Tab: TẮT"
        D.SetBg(embedToggleBtn, C.GRAY)
        for _, ft in ipairs(featureTabs) do
            local hostFrame = ft.frame and ft.frame:FindFirstChild("ScriptHost")
            if hostFrame then S.ClearEmbedsUnder(hostFrame) end
        end
        pcall(S.RemoveAllParked)
        S.PruneEmbeds()
        createStatus.Text = "🛡 Chế độ an toàn: hub không sửa GUI nào nữa. Muốn nhúng lại thì bấm BẬT."
    end
    Store.saveSoon()   -- v4.4g: lưu trạng thái 🧩 xuống đĩa -> thoát game vào lại vẫn giữ
    pcall(function() if Store.refreshStatus then Store.refreshStatus() end end)
end
embedToggleBtn.Activated:Connect(S.DoToggleEmbed)

S.DoToggleGuess = function()
    S.embedGuessNew = not (S.embedGuessNew == true)
    if S.embedGuessNew then
        guessToggleBtn.Text = "🕵 Đoán GUI trễ: BẬT"
        D.SetBg(guessToggleBtn, C.ORANGE)
        createStatus.Text = "🕵 BẬT: script tạo GUI trễ (sau HttpGet/task.wait) sẽ được nhúng — tiện hơn"
            .. " nhưng nếu game cũng vừa mở UI đúng lúc thì UI đó có thể bị mượn vào tab (bấm ✕ để trả)."
    else
        guessToggleBtn.Text = "🕵 Đoán GUI trễ: TẮT"
        D.SetBg(guessToggleBtn, C.GRAY)
        createStatus.Text = "🛡 An toàn nhất: chỉ nhúng GUI mà hub chắc chắn là của script."
            .. " Script tạo GUI trễ sẽ chạy bình thường ngoài màn hình, không bị nhúng."
    end
    Store.saveSoon()   -- v4.4g: lưu trạng thái 🕵 xuống đĩa
end
guessToggleBtn.Activated:Connect(S.DoToggleGuess)

S.DoTogglePark = function()
    S.parkCodeGuis = (S.parkCodeGuis == false)   -- đảo trạng thái
    S.SyncEmbedToggles()
    if S.parkCodeGuis == false then
        local n = S.RemoveAllParked()   -- hoàn tác ngay: trả GUI về màn hình game
        createStatus.Text = "🪟 TẮT: script chạy ở tab 💻 Code sẽ để GUI NGOÀI màn hình game"
            .. (n > 0 and (" · đã trả " .. n .. " GUI về màn hình") or "")
            .. " · tab tính năng dùng công tắc 🧩 nhúng riêng."
    else
        createStatus.Text = "🪟 BẬT: GUI của script chạy ở tab 💻 Code sẽ được đưa vào tab '🧩 GUI Ngoài'"
            .. " (mỗi GUI có nút ↩ trả về màn hình). Dex/IY/SimpleSpy vẫn LUÔN ở ngoài màn hình game."
    end
    Store.saveSoon()   -- lưu xuống đĩa: thoát game vào lại vẫn giữ lựa chọn này
end
S.parkToggleBtn.Activated:Connect(S.DoTogglePark)

grabSizeCodeBtn.Activated:Connect(function()
    local currentCode = featureCodeIn.Text
    if #currentCode == 0 then
        createStatus.Text = "⚠️ Ô code đang trống, không có gì để lấy!"
        return
    end

    local wrappedCode = [[
local _FIT_WRAPPER = true
local _bcRealNew = Instance.new
local _bcMine = {}
local _bcHookOn = true
pcall(function()
    Instance.new = function(cls, ...)
        local inst = _bcRealNew(cls, ...)
        if _bcHookOn and cls == "ScreenGui" then _bcMine[#_bcMine + 1] = inst end
        return inst
    end
end)

]] .. currentCode .. [[

pcall(function() _bcHookOn = false; Instance.new = _bcRealNew end)

task.delay(4, function()
    pcall(function() _bcHookOn = false; Instance.new = _bcRealNew end)
end)

task.defer(function()
    task.wait(0.4)
    local hub = nil
    pcall(function()
        local hubGui = (gethui and gethui()) or game:GetService("Players").LocalPlayer:FindFirstChildOfClass("PlayerGui")
        hub = hubGui and hubGui:FindFirstChild("ExMenu") and hubGui.ExMenu:FindFirstChildWhichIsA("Frame")
        if not hub then
            local pg = game:GetService("Players").LocalPlayer:FindFirstChildOfClass("PlayerGui")
            hub = pg and pg:FindFirstChild("ExMenu") and pg.ExMenu:FindFirstChildWhichIsA("Frame")
        end
    end)
    for _, g in ipairs(_bcMine) do
        pcall(function()
            if not g or not g.Parent then return end
            local root = g:FindFirstChildWhichIsA("Frame")
                or g:FindFirstChildWhichIsA("ScrollingFrame")
                or g:FindFirstChildWhichIsA("GuiObject")
            if not root then return end
            if root.Size and (root.Size.X.Scale ~= 0 or root.Size.Y.Scale ~= 0) then return end
            local us = root:FindFirstChild("BananaCatFitScale")
            if not us then
                us = _bcRealNew("UIScale")
                us.Name = "BananaCatFitScale"
                us.Parent = root
            end
            if hub then
                local function _bcSync()
                    us.Scale = math.clamp(hub.AbsoluteSize.X / 540, 0.8, 1.6)
                end
                _bcSync()
                hub:GetPropertyChangedSignal("AbsoluteSize"):Connect(function()
                    pcall(_bcSync)
                end)
            end
        end)
    end
end)
]]

    local saveName = "AutoSize_"..os.date("%H%M%S")
    local bn = saveName
    local cnt = 1
    while true do
        local ex = false
        for _, s in ipairs(scripts) do
            if s.name == saveName then ex = true; break end
        end
        if not ex then break end
        cnt += 1
        saveName = bn.." ("..cnt..")"
    end

    table.insert(scripts, {name = saveName, code = wrappedCode, expanded = false})
    if RebuildScripts then RebuildScripts() end
    Store.saveSoon()

    createStatus.Text = "✅ Đã lưu bản tự co giãn vào tab 'Code Đã Lưu': "..saveName..
        " · để tab tính năng co giãn theo menu thì KHÔNG cần bản này, hub tự làm khi bấm ▶ Chạy Script."
end)

S.DoFixMouse = function()
    local done = {}
    ReleaseHubFocus()
    done[#done+1] = "nhả focus"
    local restored = 0
    for _, ft in ipairs(featureTabs) do
        local hostFrame = ft.frame and ft.frame:FindFirstChild("ScriptHost")
        if hostFrame then restored = restored + S.ClearEmbedsUnder(hostFrame) end
    end
    if restored > 0 then done[#done+1] = "đã trả " .. restored .. " GUI về game" end
    for _, e in ipairs(S.embeds) do
        pcall(function() e.host.Visible = e.gui.Enabled end)
    end
    pcall(function() UserInputService.MouseBehavior = Enum.MouseBehavior.Default end)
    done[#done+1] = "chuột về mặc định"
    createStatus.Text = "🖱 " .. table.concat(done, " · ")
        .. " — vẫn không được? 🧩 TẮT nhúng rồi bấm ▶ lại (lúc đó hub không đụng GUI nào)"
    return table.concat(done, " · ")
end
fixMouseBtn.Activated:Connect(S.DoFixMouse)

S.reembedBtn.Activated:Connect(function()
    ReleaseHubFocus()
    local ft = S.FindActiveFeature()
    if not ft then
        createStatus.Text = "⚠️ Hãy MỞ tab tính năng cần cứu trước (bấm vào tab đó cho nó hiện ra) rồi hãy bấm 🔁."
        return
    end
    if not S.embedEnabled then
        createStatus.Text = "⚠️ 🧩 'Nhúng vào Tab' đang TẮT — BẬT lại rồi mới cứu GUI được."
        return
    end
    createStatus.Text = "⏳ Đang tìm GUI của '" .. ft.name .. "' để nhúng lại vào menu..."
    task.defer(function()
        local n, why = S.ReembedFeature(ft, true)
        if n > 0 then
            createStatus.Text = string.format(
                "✅ Đã nhúng lại %d GUI vào tab '%s'. Nếu lỡ nhúng nhầm GUI khác, mở tab đó bấm ✕ để trả về.",
                n, ft.name)
            pcall(function()
                if ft.status and ft.status.Parent then
                    ft.status.Text = string.format("✅ đã nhúng lại %d GUI vào tab (nút 🔁 Cứu GUI)", n)
                end
                if ft.indicator and ft.indicator.Parent then ft.indicator.BackgroundColor3 = C.GREEN end
            end)
        else
            createStatus.Text = "⚠️ Chưa nhúng được: " .. tostring(why or "không rõ lý do")
                .. " · bấm ▶ Chạy Script lại rồi CHỜ 10 giây (hub tự thử lại 5 lần) · xem console (F9) để biết hook có bị executor chặn không."
        end
        print(string.format("[taodepzai v5.0 NOIR] 🔁 Cứu GUI tab '%s': %d GUI đã nhúng%s",
            tostring(ft.name), n, why and (" · lý do bỏ qua: " .. tostring(why)) or ""))
    end)
end)

copyTemplateBtn.Activated:Connect(function()
    ReleaseHubFocus()
    local nm = (featureNameIn.Text or ""):gsub('[\r	"]', " "):gsub("^%s+", ""):gsub("%s+$", "")
    if #nm == 0 then nm = "Tính Năng Mới" end
    local ic = (featureIconIn.Text or ""):gsub('[\r	"]', " ")
    if #ic == 0 then ic = "⚙️" end
    local stamp
    pcall(function() stamp = os.date("sinh %H:%M %d/%m/%Y") end)
    local code = S.FeatureTemplate(nm, ic, stamp)

    local copied = S.CopyToClipboard(code)
    local inBox = false
    if #featureCodeIn.Text == 0 then
        featureCodeIn.Text = code
        inBox = true
    end
    local saveName = "Mẫu " .. nm
    local baseName = saveName
    local cnt = 1
    while true do
        local exists = false
        for _, sc in ipairs(scripts) do
            if sc.name == saveName then exists = true break end
        end
        if not exists then break end
        cnt = cnt + 1
        saveName = baseName .. " (" .. cnt .. ")"
    end
    table.insert(scripts, {name = saveName, code = code, expanded = false})
    if RebuildScripts then RebuildScripts() end
    Store.saveSoon()

    createStatus.Text = (copied and ("📋 ĐÃ COPY " .. #code .. " ký tự vào clipboard")
        or ("⚠️ Executor không có setclipboard — lấy code ở tab 'Code Đã Lưu'"))
        .. " · đã lưu '" .. saveName .. "'"
        .. (inBox and " · đã điền vào ô code" or " · ô code giữ nguyên code của bạn")
        .. " · gửi NGUYÊN đoạn code đó cho AI/người viết script, dán lại rồi bấm ▶ Chạy Script."
    local oldLabel = copyTemplateBtn.Text
    copyTemplateBtn.Text = "✅ Đã copy code mẫu cho: " .. nm
    task.delay(2.6, function()
        if copyTemplateBtn and copyTemplateBtn.Parent then copyTemplateBtn.Text = oldLabel end
    end)
    print("[taodepzai v5.0 NOIR] 📋 Code mẫu '" .. nm .. "' (" .. #code .. " ký tự) — clipboard: "
        .. tostring(copied))
end)

Label(createFeatureTab, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", cy)
cy = cy + 16
Label(createFeatureTab, "📋 Danh Sách Tab Tính Năng Đã Tạo:", cy)
cy = cy + 16

local featureListFrame = New("Frame", {
    Size=UDim2.new(1,-16,0,0), Position=UDim2.new(0,8,0,cy),
    BackgroundTransparency=1, BorderSizePixel=0, ZIndex=6,
}, createFeatureTab)
New("UIListLayout", {SortOrder=Enum.SortOrder.LayoutOrder, Padding=UDim.new(0,4)}, featureListFrame)

local function RebuildFeatureList()
    for _, c in ipairs(featureListFrame:GetChildren()) do
        if not c:IsA("UIListLayout") then c:Destroy() end
    end

    if #featureTabs == 0 then
        New("TextLabel", {
            Size=UDim2.new(1,0,0,30),
            Text="📭 Chưa có tab tính năng nào.",
            BackgroundTransparency=1, TextColor3=C.GRAY, Font=Enum.Font.GothamMedium, TextSize=10,
            TextXAlignment=Enum.TextXAlignment.Center, TextYAlignment=Enum.TextYAlignment.Center, ZIndex=7,
        }, featureListFrame)
        createFeatureTab.CanvasSize = UDim2.new(0, 0, 0, cy + 50)
        return
    end

    local totalH = 0
    for i, ft in ipairs(featureTabs) do
        local row = New("Frame", {
            Size=UDim2.new(1,0,0,32), BackgroundColor3=Color3.fromRGB(26, 29, 38),
            BackgroundTransparency=0.1, BorderSizePixel=0, ZIndex=6,
        }, featureListFrame)
        Corner(row, UDim.new(0,5)); Stroke(row)

        New("TextLabel", {
            Size=UDim2.new(1,-90,1,0), Position=UDim2.new(0,8,0,0),
            Text=ft.icon.." "..ft.name, BackgroundTransparency=1, TextColor3=C.DARK,
            Font=Enum.Font.GothamBold, TextSize=10, TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
        }, row)

        local goBtn = New("TextButton", {
            Size=UDim2.new(0,50,0,22), Position=UDim2.new(1,-78,0,5),
            Text="➡ Mở", BackgroundColor3=C.BLUE, BackgroundTransparency=0.1,
            TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=8,
        }, row)
        Corner(goBtn, UDim.new(0,4))
        goBtn.Activated:Connect(function()
            for i, b in ipairs(tabs) do
                if b == ft.btn then SwitchTab(i); break end
            end
        end)

        local delBtn = New("TextButton", {
            Size=UDim2.new(0,24,0,22), Position=UDim2.new(1,-26,0,5),
            Text="🗑", BackgroundColor3=C.RED, BackgroundTransparency=0.1,
            TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10, BorderSizePixel=0, ZIndex=8,
        }, row)
        Corner(delBtn, UDim.new(0,4))
        delBtn.Activated:Connect(function()
            if S.DestroyFeatureTab(ft) then
                RebuildFeatureList()
                Store.saveSoon()
            end
        end)

        totalH = totalH + 36
    end

    featureListFrame.Size = UDim2.new(1,-16,0,totalH)
    createFeatureTab.CanvasSize = UDim2.new(0, 0, 0, cy + totalH + 30)
end

createTabBtn.Activated:Connect(function()
    local n = featureNameIn.Text
    local ic = featureIconIn.Text
    local c = featureCodeIn.Text

    if #n == 0 then
        createStatus.Text = "⚠️ Vui lòng nhập tên tính năng!"
        return
    end
    if #c == 0 then
        createStatus.Text = "⚠️ Vui lòng dán script!"
        return
    end

    for _, ft in ipairs(featureTabs) do
        if ft.name == n then
            createStatus.Text = "⚠️ Tên tính năng đã tồn tại!"
            return
        end
    end

    CreateFeatureTab(n, ic, c)
    RebuildFeatureList()
    Store.saveSoon()   -- ⭐ lưu ngay vào file để thoát game vào lại vẫn còn tab này

    createStatus.Text = "✅ Đã tạo tab: "..n.." (đã lưu)"
    featureNameIn.Text = ""
    featureIconIn.Text = "⚙️"
    featureCodeIn.Text = ""

    SwitchTab(#tabs)
end)

clearFormBtn.Activated:Connect(function()
    featureNameIn.Text = ""
    featureIconIn.Text = "⚙️"
    featureCodeIn.Text = ""
    createStatus.Text = "🧹 Đã xóa form"
end)

RebuildFeatureList()
pcall(function()
    createFeatureTab.CanvasSize = UDim2.new(0, 0, 0, cy + 40)
end)

Store.restoreFeatures = function()
    for i = #featureTabs, 1, -1 do
        if not featureTabs[i].builtinId then S.DestroyFeatureTab(featureTabs[i]) end
    end
    S.EnsureScriptHubFeature()
    S.EnsureSupportFeature()

    for _, f in ipairs(Store.loadedFeatures) do
        CreateFeatureTab(f.name, f.icon, f.code)
    end

    -- Giữ tab Code Đã Lưu thường và tab Script Hub từ URL ở thứ tự gốc.
    tabBar.CanvasSize = UDim2.new(0, 0, 0, #tabs * 44 + 10)
    RebuildFeatureList()
    if Store.refreshStatus then Store.refreshStatus() end
end

if #Store.loadedFeatures > 0 then
    Store.restoreFeatures()
    createStatus.Text = string.format("💾 Đã khôi phục %d tab tính năng từ bộ nhớ", #Store.loadedFeatures)
end



S.Move = {
    fly = false, noclip = false, infJump = false, speed = false, carpet = false,
    runMode = false,                         -- 🏃 chế độ "chạy trên thảm" (gộp thảm + tốc độ + HUD)
    sprint = false, sprintSpeed = 50,        -- v4.37: 💨 tốc độ theo camera (mặt đất, không xuyên tường)
    highJump = false, highJumpSpeed = 80,    -- v4.38: 🦘 nhảy cao (công tắc độc lập, chỉnh tốc độ)
    _hud = nil, _hudUp = nil, _hudDown = nil, _hudCarpet = nil, _hudClose = nil, _menuWasOpen = nil,
    flySpeed = 50, walkSpeed = 16, jumpPower = 50,
    speedMode = "x", speedMul = 3, appliedWS = nil,
    carpetW = 6, carpetH = 0.5, carpetL = 6,     -- Rộng × Cao(dày) × Dài
    carpetGap = 0.2,                             -- thảm cách bàn chân bao nhiêu stud (0 = áp sát)
    carpetSlack = 0.5, carpetHold = true, carpetEdge = true,
    carpetY = nil,
    _carpet = nil, _bv = nil, _bg = nil, _floor = nil,
    _ncConn = nil, _ncDesc = nil, _ncChar = nil, _ncLast = nil,
    _ijConn = nil, _ijConn2 = nil, _speedThread = nil,
    _origCC = {},                                 -- [part] = CanCollide gốc
    _baseWS = 16, _baseJP = 50,                   -- tốc độ / lực nhảy GỐC CỦA GAME
    _wd = nil, _lastJump = nil, _ijBaseJP = nil, _ijBaseJH = nil,
    _carpetRetries = 0,                           -- số lần thảm bị game xoá
}
local MV = S.Move
_G.BananaCatHub_MV = S.Move  -- v4.28: expose for legacy refs (HubLoc fly)

function MV.comp(v, k, dft)
    if v == nil then return dft end
    local ok, val = pcall(function() return v[k] end)
    if ok and type(val) == "number" then return val end
    return dft
end
local function mvClamp(n, lo, hi, dft)
    n = tonumber(n)
    if n == nil or n ~= n then return dft end
    if n < lo then return lo end
    if n > hi then return hi end
    return n
end

function MV.Char() return player.Character end
function MV.Hum()
    local c = player.Character
    return c and c:FindFirstChildOfClass("Humanoid") or nil
end
function MV.Root()
    local c = player.Character
    return c and c:FindFirstChild("HumanoidRootPart") or nil
end

-- ---------- 🧱 XUYÊN TƯỜNG (NoClip) ----------
function MV._NcPart(p)
    if not (p and p.IsA and p:IsA("BasePart")) then return end
    MV._ncParts = MV._ncParts or {}
    if MV._origCC[p] == nil then
        MV._origCC[p] = MV._ncParts[p] and true or p.CanCollide
    end
    if p.CanCollide ~= false then pcall(function() p.CanCollide = false end) end
    MV._ncParts[p] = true
end
function MV._NcScan()
    local c = MV.Char()
    if not c then return end
    if MV._ncChar ~= c then                    -- đổi nhân vật (respawn) -> dọn kết nối cũ
        if MV._ncDesc then pcall(function() MV._ncDesc:Disconnect() end) end
        MV._ncChar = c
        MV._ncParts = {}                       -- nhân vật mới -> danh sách part mới
        MV._ncDesc = trackConn(c.DescendantAdded:Connect(MV._NcPart))
    end
    for _, p in ipairs(c:GetDescendants()) do MV._NcPart(p) end
end
function MV._NcEnforce()
    if not MV.noclip then return end
    local c = MV.Char()
    local parts = MV._ncParts
    if not c or not parts then return end
    for p in pairs(parts) do
        local ok = pcall(function()
            if p:IsDescendantOf(c) then
                if p.CanCollide ~= false then p.CanCollide = false end
            else
                parts[p] = nil                 -- part đã rời khỏi người (game xoá) -> thôi theo dõi
            end
        end)
        if not ok then parts[p] = nil end
    end
end
-- ---------- v4.22: 🧲 ĐẨY XUYÊN khi bị chặn CỨNG ----------
function MV._NcAssist()
    if MV.fly or not (MV.noclip and MV.ncPass ~= false) then
        MV._passBlocked, MV._passPX, MV._passPZ, MV._passAt = 0, nil, nil, nil
        return
    end
    local onCarpet = (MV.carpet == true) or (MV.runMode == true)
    local h, r = MV.Hum(), MV.Root()
    if not h or not r then
        MV._passBlocked, MV._passPX, MV._passPZ, MV._passAt = 0, nil, nil, nil
        return
    end
    local now = os.clock()
    local dt = now - (MV._passAt or now)
    MV._passAt = now
    if dt <= 0 or dt > 0.5 then dt = 1 / 60 end          -- frame đầu / lag -> coi như 1 frame
    local okMD, md = pcall(function() return h.MoveDirection end)
    local mx = okMD and MV.comp(md, "X", 0) or 0
    local mz = okMD and MV.comp(md, "Z", 0) or 0
    local want = math.sqrt(mx * mx + mz * mz)            -- 0..1: đang bấm hướng nào
    local px, pz = MV.comp(r.Position, "X", nil), MV.comp(r.Position, "Z", nil)
    if not (px and pz) then return end
    local moved = 0
    if MV._passPX then
        local dx, dz = px - MV._passPX, pz - MV._passPZ
        moved = math.sqrt(dx * dx + dz * dz)
    end
    MV._passPX, MV._passPZ = px, pz
    local spd = mvClamp(tonumber(MV.WantSpeed()) or 16, 6, 120)
    local ws = tonumber(MV.comp(h, "WalkSpeed", nil)) or spd
    local expect = math.min(spd, ws) * want * dt
    if want <= 0.1 then
        MV._passBlocked = 0                              -- không bấm gì -> không đẩy
    elseif moved < expect * (onCarpet and 0.12 or 0.35) then
        MV._passBlocked = (MV._passBlocked or 0) + dt    -- bị chặn -> đếm thời gian kẹt
    else
        MV._passBlocked = (MV._passBlocked or 0) * 0.5   -- đi được -> quên dần
    end
    if (MV._passBlocked or 0) < (onCarpet and 0.35 or 0.2) or want <= 0.1 then return end
    local ux, uz = mx / want, mz / want
    local stepLen = onCarpet and math.min(spd * dt * 0.5, 0.4)   -- trên thảm: nhích RẤT nhẹ
                    or math.min(spd * dt * 1.15, 3)              -- 1 frame không nhích quá 3 stud
    local y = MV.comp(r.Position, "Y", nil)
    if y == nil then return end
    pcall(function() r.CFrame = CFrame.new(px + ux * stepLen, y, pz + uz * stepLen) end)
end
function MV._NcStep()
    if not MV.noclip then return end
    local c = MV.Char()
    if not c then return end
    local now = os.clock()
    if MV._ncChar ~= c or not MV._ncLast or (now - MV._ncLast) > 0.5 then
        MV._ncLast = now
        MV._NcScan()                                  -- quét đầy đủ: bắt part mới / nhân vật mới
    end
    MV._NcEnforce()                                   -- MỖI FRAME: thắng game bật lại CanCollide
    MV._NcAssist()                                    -- 🧲 bị chặn cứng -> tự đẩy xuyên
end
function MV._NcBind(on)
    if on and not MV._ncBound then
        MV._ncBound = true
        local ok = pcall(function()
            RunService:BindToRenderStep("BC_NoClip", Enum.RenderPriority.Last.Value, function()
                pcall(MV._NcStep)
            end)
        end)
        if not ok then MV._ncBound = false end
    elseif (not on) and MV._ncBound then
        MV._ncBound = false
        pcall(function() RunService:UnbindFromRenderStep("BC_NoClip") end)
    end
    return MV._ncBound
end
function MV._NcForgetLost()
    for p in pairs(MV._origCC) do
        if not (p and p.Parent) then MV._origCC[p] = nil end
    end
end
function MV._NcRestore()
    for p, v in pairs(MV._origCC) do
        if p and p.Parent then
            pcall(function() p.CanCollide = v end)
        end
        MV._origCC[p] = nil
    end
    MV._origCC = {}
    MV._ncParts = {}
end
function MV.SetNoclip(on)
    on = (on == true)
    if on == MV.noclip then return MV.noclip end
    MV.noclip = on
    if on then
        MV._ncLast = nil
        MV._ncParts = {}
        MV._passBlocked, MV._passPX, MV._passPZ, MV._passAt = 0, nil, nil, nil
        if MV.ncPass == nil then MV.ncPass = true end   -- v4.22: 🧲 mặc định BẬT
        MV._NcScan()                                   -- quét ngay lần đầu cho chắc
        MV._ncConn = trackConn(RunService.Stepped:Connect(MV._NcStep))
        MV._NcBind(true)                               -- v4.22: thêm lớp ghi cuối frame
    else
        for _, c in ipairs({ MV._ncConn, MV._ncDesc }) do
            if c then pcall(function() c:Disconnect() end) end
        end
        MV._ncConn, MV._ncDesc, MV._ncChar, MV._ncLast = nil, nil, nil, nil
        MV._NcBind(false)
        MV._passBlocked, MV._passPX, MV._passPZ, MV._passAt = 0, nil, nil, nil
        MV._NcRestore()
    end
    MV._Watchdog()
    if MV.SyncFlyHud then MV.SyncFlyHud() end
    return MV.noclip
end

-- ---------- 🦘 NHẢY VÔ HẠN ----------
function MV._JumpGuard()
    local h = MV.Hum()
    if not h then return end
    pcall(function()
        local jp = mvClamp(MV.jumpPower, 1, 500)
        if h.UseJumpPower ~= false then
            if (tonumber(h.JumpPower) or 0) < 1 then h.JumpPower = jp end
        end
        if (tonumber(h.JumpHeight) or 0) < 0.1 then
            local g = tonumber(workspace.Gravity) or 0
            if g < 1 then g = 196.2 end
            h.JumpHeight = mvClamp((jp * jp) / (2 * g), 1, 500)
        end
    end)
end
function MV._JumpConfirm(y0)
    if not MV.infJump then return end
    local r2 = MV.Root()
    if not r2 then return end
    local up = r2.Position.Y - y0
    local v  = r2.AssemblyLinearVelocity
    local vy = MV.comp(v, "Y", 0)
    if up < 0.4 and vy < 10 then        -- chưa nhúc nhích -> game đã bỏ qua lệnh nhảy
        pcall(function()
            r2.AssemblyLinearVelocity = Vector3.new(
                MV.comp(v, "X", 0), MV.WantJumpSpeed(), MV.comp(v, "Z", 0))
        end)
    end
end
function MV._DoJump()
    if not MV.infJump then return false end
    local h, r = MV.Hum(), MV.Root()
    if not h or not r then return false end
    if h.Sit or h.PlatformStand then return false end      -- đang ngồi ghế/xe: không nhảy
    local now = os.clock()
    if MV._lastJump and (now - MV._lastJump) < 0.12 then return false end   -- chống bốc đúp
    MV._lastJump = now
    MV._JumpGuard()
    local y0 = r.Position.Y
    pcall(function() h:ChangeState(Enum.HumanoidStateType.Jumping) end)
    pcall(function() h.Jump = true end)
    task.delay(0.08, function() pcall(MV._JumpConfirm, y0) end)
    return true
end
function MV.SetInfJump(on)
    on = (on == true)
    if on == MV.infJump then return MV.infJump end
    MV.infJump = on
    if on then
        local h = MV.Hum()
        if h then MV._ijBaseJP, MV._ijBaseJH = h.JumpPower, h.JumpHeight end
        MV._JumpGuard()
        MV._ijConn  = trackConn(UserInputService.JumpRequest:Connect(function()
            pcall(MV._DoJump)
        end))
        MV._ijConn2 = trackConn(UserInputService.InputBegan:Connect(function(i, gp)
            if not MV.infJump then return end
            pcall(function()
                local tb = UserInputService:GetFocusedTextBox()
                if tb and tb:IsDescendantOf(gui) then return end   -- đang gõ trong hub thì thôi
                local k = i and i.KeyCode
                if k == Enum.KeyCode.Space or k == Enum.KeyCode.ButtonA then MV._DoJump() end
            end)
        end))
    else
        for _, c in ipairs({ MV._ijConn, MV._ijConn2 }) do
            if c then pcall(function() c:Disconnect() end) end
        end
        MV._ijConn, MV._ijConn2 = nil, nil
        local h = MV.Hum()
        if h then
            if MV._ijBaseJP ~= nil then pcall(function() h.JumpPower  = MV._ijBaseJP end) end
            if MV._ijBaseJH ~= nil then pcall(function() h.JumpHeight = MV._ijBaseJH end) end
        end
        MV._ijBaseJP, MV._ijBaseJH = nil, nil
    end
    MV._Watchdog()
    return MV.infJump
end

-- ---------- 👟 CHẠY ĐỘ (WalkSpeed / JumpPower) ----------
function MV.WantSpeed()
    if MV.speedMode == "x" then
        local base = tonumber(MV._baseWS) or 16
        return mvClamp(base * mvClamp(MV.speedMul, 1, 20), 0, 500)
    end
    return mvClamp(MV.walkSpeed, 0, 500)
end
function MV.ApplyChar()
    local h = MV.Hum()
    if not h then return end
    if MV.speed then
        local want = MV.WantSpeed()
        h.WalkSpeed = want
        MV.appliedWS = want
        if not MV.highJump then
            local jp = mvClamp(MV.jumpPower, 0, 500)
            if h.JumpPower ~= jp then h.JumpPower = jp end
        end
    else
        h.WalkSpeed  = MV._baseWS or 16
        if not MV.highJump then
            h.JumpPower  = MV._baseJP or 50
        end
        MV.appliedWS = nil
    end
end
function MV.SpeedStep()
    local h = MV.Hum()
    if not h or not MV.speed then return end
    if MV.appliedWS ~= nil and math.abs((tonumber(h.WalkSpeed) or 0) - MV.appliedWS) > 0.01 then
        MV._baseWS = tonumber(h.WalkSpeed) or MV._baseWS
    end
    MV.ApplyChar()
end
function MV.SetSpeed(on)
    on = (on == true)
    if on == MV.speed then return MV.speed end
    local h = MV.Hum()
    if on and not MV.speed and h then          -- chỉ nhớ mặc định ở lần BẬT đầu tiên
        MV._baseWS = h.WalkSpeed  or 16
        MV._baseJP = h.JumpPower  or 50
    end
    MV.speed = on
    MV.ApplyChar()
    MV._Watchdog()
    return MV.speed
end

-- ---------- v4.12.2: VÒNG CANH GÁC (lý do nhiều game "không hoạt động") ----------
function MV._NeedWatch()
    return (MV.fly or MV.noclip or MV.infJump or MV.speed or MV.runMode
            or MV.sprint or MV.highJump or (MV.Safe and MV.Safe.on)) == true
end
function MV._KeepAlive()
    if MV.speed or MV.runMode then pcall(MV.SpeedStep) end
    if MV.sprint then
        pcall(MV._EnsureSpeed)
        if not MV._speedBound or (tick() - (MV._speedFrameAt or 0)) > 0.6 then
            MV._speedBound = false
            pcall(MV._BindSpeed)
            pcall(MV._SpeedFrame)
        end
    end
    if MV.infJump or MV.runMode then pcall(MV._JumpGuard) end
    if MV.highJump then pcall(MV._HighJumpApplyPower) end
    -- [REMOVED] carpet keepalive
    if MV.fly then
        pcall(MV._EnsureFly)
        if not MV._flyBound or (tick() - (MV._flyFrameAt or 0)) > 0.6 then
            MV._flyBound = false
            pcall(MV._BindFly)
            pcall(MV._FlyFrame)
        end
    end
    if MV.Safe and MV.Safe.on and (tick() - (MV.Safe._lastFrameAt or 0)) > 0.6 then
        MV.Safe._bound = false
        pcall(MV.Safe.Bind)
        pcall(MV.Safe.Step, 0.1)
    end
end
function MV._Watchdog()
    if not MV._NeedWatch() then
        MV._wdToken = nil
        local thread = MV._wd
        MV._wd = nil
        if type(thread) == "thread" and thread ~= coroutine.running() then pcall(task.cancel, thread) end
        return
    end
    if MV._wdToken then return end
    local token = {}
    MV._wdToken = token
    local thread = task.spawn(function()
        while MV._wdToken == token and MV._NeedWatch() do
            pcall(MV._KeepAlive)
            task.wait(0.3)
        end
        if MV._wdToken == token then MV._wdToken, MV._wd = nil, nil end
    end)
    if MV._wdToken == token then MV._wd = thread end
end

-- ---------- 🚀 BAY THEO CAMERA (v4.36) ----------
do
local FL = { x = 0, z = 0, y = 0, holds = {}, showHud = true, focused = true, conns = {} }
MV.Flight = FL

function MV.ClearFlyInput()
    FL.x, FL.z, FL.y = 0, 0, 0
    FL.holds, FL.joyInput, FL.dragInput = {}, nil, nil
    if FL.knob and FL.knob.Parent then FL.knob.Position = UDim2.new(0.5, -14, 0.5, -14) end
end
function MV.SetFlyVirtual(x, z, y)
    FL.x, FL.z, FL.y = mvClamp(x, -1, 1, 0), mvClamp(z, -1, 1, 0), mvClamp(y, -1, 1, 0)
end
function MV._RestoreFlyHum()
    local h = FL.hum
    if h and h.Parent then
        h.PlatformStand = FL.platformStand
        h.AutoRotate = FL.autoRotate
    end
    FL.hum = nil
end
function MV._DestroyFlyParts()
    for _, key in ipairs({"_bv", "_bg", "_floor"}) do
        if MV[key] then MV[key]:Destroy(); MV[key] = nil end
    end
end
function MV._EnsureFly()
    local r, h = MV.Root(), MV.Hum()
    if not MV.fly then return nil end
    if not r or not h or h.Health <= 0 then
        MV._DestroyFlyParts()
        MV._RestoreFlyHum()
        MV.ClearFlyInput()
        FL.root = nil
        return nil
    end
    if FL.root ~= r then
        MV._DestroyFlyParts()
        MV._RestoreFlyHum()
        MV.ClearFlyInput()
        FL.root = r
    end
    if FL.hum ~= h then
        MV._RestoreFlyHum()
        FL.hum, FL.platformStand, FL.autoRotate = h, h.PlatformStand, h.AutoRotate
    end
    if not MV._bv or MV._bv.Parent ~= r then
        if MV._bv then MV._bv:Destroy() end
        MV._bv = New("BodyVelocity", {
            Name = "BC_FlyVel", MaxForce = Vector3.new(1e9, 1e9, 1e9), Velocity = Vector3.zero,
        }, r)
    end
    if not MV._bg or MV._bg.Parent ~= r then
        if MV._bg then MV._bg:Destroy() end
        MV._bg = New("BodyGyro", {
            Name = "BC_FlyGyro", MaxTorque = Vector3.new(1e9, 1e9, 1e9), P = 1e4, D = 50,
        }, r)
    end
    if h.PlatformStand ~= true then h.PlatformStand = true end
    if h.AutoRotate ~= false then h.AutoRotate = false end
    if not MV._floor or not MV._floor.Parent then
        MV._floor = New("Part", {
            Name = "BC_FlyFloor", Size = Vector3.new(6, 0.2, 6), Transparency = 0.7,
            Color = Color3.fromRGB(200, 230, 255), Material = Enum.Material.Glass,
            Anchored = true, CanCollide = false, CanTouch = false, CanQuery = false,
        }, workspace)
    end
    return r, h
end

function MV._ReadFlyInput(cf, h)
    if not FL.focused or UserInputService:GetFocusedTextBox() then return Vector3.zero end
    local x, z, y = FL.x, FL.z, FL.y
    local virtualDirection = FL.joyInput ~= nil or math.abs(x) + math.abs(z) > 0
    for _, v in pairs(FL.holds) do
        x += v.X; y += v.Y; z += v.Z
        if v.X ~= 0 or v.Z ~= 0 then virtualDirection = true end
    end
    local w = UserInputService:IsKeyDown(Enum.KeyCode.W)
    local s = UserInputService:IsKeyDown(Enum.KeyCode.S)
    local a = UserInputService:IsKeyDown(Enum.KeyCode.A)
    local d = UserInputService:IsKeyDown(Enum.KeyCode.D)
    if w or s or a or d then
        x, z = (d and 1 or 0) - (a and 1 or 0), (s and 1 or 0) - (w and 1 or 0)
    elseif not virtualDirection and h then
        local md = h.MoveDirection
        local right = Vector3.new(cf.RightVector.X, 0, cf.RightVector.Z)
        if right.Magnitude > 0.001 then right = right.Unit else right = Vector3.new(1, 0, 0) end
        local forward = Vector3.new(right.Z, 0, -right.X)
        x, z = md:Dot(right), -md:Dot(forward)
    end
    local up = UserInputService:IsKeyDown(Enum.KeyCode.Space)
    local down = UserInputService:IsKeyDown(Enum.KeyCode.LeftShift)
        or UserInputService:IsKeyDown(Enum.KeyCode.LeftControl)
    if up or down then y = (up and 1 or 0) - (down and 1 or 0) end
    return Vector3.new(x, y, z)
end
function MV.FlyVelocity(cf, input, speed)
    local direction = cf.RightVector * input.X - cf.LookVector * input.Z + Vector3.new(0, input.Y, 0)
    local magnitude = direction.Magnitude
    if magnitude < 0.001 then return Vector3.zero end
    if magnitude > 1 then direction = direction / magnitude end -- chéo không nhanh hơn, giữ analog
    return direction * mvClamp(speed, 1, 2000, 50)
end
function MV._FlyStep()
    if not MV.fly then return end
    MV._flyFrameAt = tick()
    local r, h = MV._EnsureFly()
    if not r then return end
    local cam = workspace.CurrentCamera
    if cam then
        local cf = cam.CFrame
        MV._bv.Velocity = MV.FlyVelocity(cf, MV._ReadFlyInput(cf, h), MV.flySpeed)
        MV._bg.CFrame = CFrame.new(r.Position) * cf.Rotation
    else
        MV._bv.Velocity = Vector3.zero
    end
    MV._floor.Position = r.Position - Vector3.new(0, 3.5, 0)
end
function MV._FlyFrame()
    local ok, err = pcall(MV._FlyStep)
    if not ok then
        FL.lastError = tostring(err)
        pcall(function() if MV._bv then MV._bv.Velocity = Vector3.zero end end)
        if tick() - (FL.errorAt or -math.huge) > 2 then
            FL.errorAt = tick()
            warn("[taodepzai v5.0 NOIR] 🚀 Bay: " .. FL.lastError)
        end
    end
end
function MV._BindFly()
    if MV._flyBound or not MV.fly then return end
    RunService:UnbindFromRenderStep("Fly")
    RunService:BindToRenderStep("Fly", Enum.RenderPriority.Camera.Value + 1, MV._FlyFrame)
    MV._flyBound = true
    MV._flyFrameAt = tick()
end
function MV._StopFly()
    RunService:UnbindFromRenderStep("Fly")
    MV._flyBound = false
    MV._DestroyFlyParts()
    MV._RestoreFlyHum()
    MV.ClearFlyInput()
    FL.root = nil
end
function MV.SetFly(on)
    on = (on == true)
    if on then
        local r, h = MV.Root(), MV.Hum()
        if not r or not h or h.Health <= 0 then return false, "chưa có nhân vật sống để bay" end
        if MV.Safe and MV.Safe.on then MV.Safe.Stop() end
        if MV._glassFlyActive then MV.StopGlassFly() end
        if MV._playerFlyActive then MV.StopPlayerFly() end
        if MV.runMode then MV.SetRunMode(false) end
        if not MV.fly then MV.ClearFlyInput() end
        MV.fly = true
        MV._EnsureFly()
        MV._BindFly()
        MV._FlyFrame() -- thả phím là giữ tại chỗ ngay, không có vận tốc mặc định lúc mới bật
    else
        MV.fly = false
        MV._StopFly()
    end
    MV._Watchdog()
    MV.SyncHud()
    if S.SyncTunePanel then pcall(S.SyncTunePanel) end
    return MV.fly
end
function MV.SetFlySpeed(n)
    n = tonumber(n)
    if not n or n ~= n or n == math.huge or n == -math.huge then return false, "nhập tốc độ 1–2000" end
    MV.flySpeed = mvClamp(n, 1, 2000, 50)
    MV.SyncHud()
    if S.RefreshMovePanel then S.RefreshMovePanel() end
    if S.SyncTunePanel then pcall(S.SyncTunePanel) end
    return true, MV.flySpeed
end
function MV.SetFlyHud(on)
    FL.showHud = (on == true)
    if not FL.showHud then MV.ClearFlyInput() end
    MV.SyncHud()
    return FL.showHud
end

function MV._BuildFlyHud()
    if FL.hud and FL.hud.Parent then return FL.hud end
    for _, c in ipairs(FL.conns) do c:Disconnect() end
    FL.conns = {}
    MV.ClearFlyInput()
    local function connect(signal, callback)
        local c = trackConn(signal:Connect(callback))
        FL.conns[#FL.conns + 1] = c
    end
    local hud = New("Frame", {
        Name = "BC_FlyHud", Size = UDim2.new(0, 292, 0, 184), Position = UDim2.new(0, 10, 1, -194),
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.18, BorderSizePixel = 0,
        Visible = false, ZIndex = 25,
    }, gui)
    FL.hud = hud
    Corner(hud, UDim.new(0, 12)); Stroke(hud, C.HAIRLINE, 1)
    D.Shade(hud, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)
    local title = New("TextLabel", {
        Name = "FlyHudTitle", Size = UDim2.new(1, -76, 0, 22), Position = UDim2.new(0, 10, 0, 2),
        Text = "🚀 Bay theo camera", Active = true, BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 11, ZIndex = 26,
        TextXAlignment = Enum.TextXAlignment.Left,
    }, hud)
    local function button(name, text, x, y, w, h, color)
        local b = New("TextButton", {
            Name = name, Text = text, Size = UDim2.new(0, w, 0, h), Position = UDim2.new(0, x, 0, y),
            BackgroundColor3 = color, TextColor3 = D.BestText(color), BackgroundTransparency = 0.15,
            Font = Enum.Font.GothamBold, TextSize = 11, BorderSizePixel = 0, ZIndex = 28,
        }, hud)
        Corner(b, UDim.new(0, 8))
        return b
    end
    local hide = button("FlyHudHide", "👁", 226, 2, 28, 22, C.SURFACE3)
    local close = button("FlyHudClose", "✕", 258, 2, 26, 22, C.RED)
    connect(hide.Activated, function() MV.SetFlyHud(false) end)
    local function stop()
        MV.SetFly(false)
        S.Rebuild()
        D.Say("🚀 Bay: TẮT — công tắc xuyên tường giữ nguyên", C.YELLOW)
    end
    connect(close.Activated, stop)
    local joy = New("Frame", {
        Name = "FlyJoystick", Active = true, Size = UDim2.new(0, 104, 0, 104),
        Position = UDim2.new(0, 10, 0, 32), BackgroundColor3 = C.SURFACE2,
        BackgroundTransparency = 0.15, BorderSizePixel = 0, ZIndex = 26,
    }, hud)
    Corner(joy, UDim.new(1, 0)); Stroke(joy, C.BORDER, 1)
    FL.knob = New("Frame", {
        Name = "FlyKnob", Size = UDim2.new(0, 28, 0, 28), Position = UDim2.new(0.5, -14, 0.5, -14),
        BackgroundColor3 = C.ACCENT, BorderSizePixel = 0, ZIndex = 27,
    }, joy)
    Corner(FL.knob, UDim.new(1, 0))
    local function pointer(input)
        return input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch
    end
    local function matches(held, input, moving)
        return held == input or (held and held.UserInputType == Enum.UserInputType.MouseButton1
            and input.UserInputType == (moving and Enum.UserInputType.MouseMovement or Enum.UserInputType.MouseButton1))
    end
    local function updateJoy(pos)
        local delta = Vector2.new(pos.X, pos.Y) - (joy.AbsolutePosition + joy.AbsoluteSize * 0.5)
        if delta.Magnitude > 38 then delta = delta.Unit * 38 end
        FL.x, FL.z = delta.X / 38, delta.Y / 38
        FL.knob.Position = UDim2.new(0.5, delta.X - 14, 0.5, delta.Y - 14)
    end
    connect(joy.InputBegan, function(input)
        if pointer(input) and MV.fly and FL.showHud and not FL.joyInput then
            FL.joyInput = input; updateJoy(input.Position)
        end
    end)
    local function hold(name, text, x, y, w, h, axis, color)
        local b = button(name, text, x, y, w, h, color or C.SURFACE3)
        connect(b.InputBegan, function(input)
            if pointer(input) and MV.fly and FL.showHud then FL.holds[input] = axis end
        end)
        connect(b.InputEnded, function(input) FL.holds[input] = nil end)
    end
    hold("FlyForward", "↑", 150, 32, 30, 30, Vector3.new(0, 0, -1))
    hold("FlyBack", "↓", 150, 100, 30, 30, Vector3.new(0, 0, 1))
    hold("FlyLeft", "←", 116, 66, 30, 30, Vector3.new(-1, 0, 0))
    hold("FlyRight", "→", 184, 66, 30, 30, Vector3.new(1, 0, 0))
    hold("FlyUp", "⬆", 238, 32, 40, 44, Vector3.new(0, 1, 0), C.GREEN)
    hold("FlyDown", "⬇", 238, 82, 40, 44, Vector3.new(0, -1, 0), C.RED)
    local stopBtn = button("FlyHudStop", "⏹ Dừng", 198, 144, 80, 28, C.RED)
    connect(stopBtn.Activated, stop)
    FL.status = New("TextLabel", {
        Name = "FlyHudStatus", Size = UDim2.new(0, 182, 0, 36), Position = UDim2.new(0, 10, 0, 140),
        BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium,
        TextSize = 9, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 26,
    }, hud)
    connect(title.InputBegan, function(input)
        if pointer(input) and not FL.dragInput then
            FL.dragInput, FL.dragStart, FL.dragPos = input, input.Position, hud.Position
        end
    end)
    connect(UserInputService.InputChanged, function(input)
        if matches(FL.joyInput, input, true) then updateJoy(input.Position) end
        if matches(FL.dragInput, input, true) then
            local delta = input.Position - FL.dragStart
            hud.Position = UDim2.new(FL.dragPos.X.Scale, FL.dragPos.X.Offset + delta.X,
                FL.dragPos.Y.Scale, FL.dragPos.Y.Offset + delta.Y)
        end
    end)
    connect(UserInputService.InputEnded, function(input)
        for held in pairs(FL.holds) do if matches(held, input, false) then FL.holds[held] = nil end end
        if matches(FL.joyInput, input, false) then
            FL.joyInput, FL.x, FL.z = nil, 0, 0
            FL.knob.Position = UDim2.new(0.5, -14, 0.5, -14)
        end
        if matches(FL.dragInput, input, false) then FL.dragInput = nil end
    end)
    connect(UserInputService.WindowFocusReleased, function()
        FL.focused = false
        MV.ClearFlyInput()
        if MV._bv then MV._bv.Velocity = Vector3.zero end
    end)
    connect(UserInputService.WindowFocused, function() FL.focused = true end)
    return hud
end
function MV.SyncFlyHud()
    if MV.fly then MV._BuildFlyHud() end
    if FL.hud and FL.hud.Parent then
        FL.hud.Visible = MV.fly and FL.showHud
        FL.status.Text = string.format("💨 %g · 🧱 %s\nThả phím / cần: đứng lơ lửng", MV.flySpeed, MV.noclip and "BẬT" or "TẮT")
    end
    if S.SyncFlyPanel then S.SyncFlyPanel() end
end
end -- 🚀 BAY THEO CAMERA

-- ---------- 💨 TỐC ĐỘ THEO CAMERA (v4.37) ----------
do
local CS = { focused = true }
MV.CamSpeed = CS

function MV._DestroySpeedParts()
    if MV._sv then MV._sv:Destroy(); MV._sv = nil end
end
function MV._EnsureSpeed()
    local r, h = MV.Root(), MV.Hum()
    if not MV.sprint then return nil end
    if MV.fly or (MV.Safe and MV.Safe.on) then
        MV._DestroySpeedParts()
        CS.root = nil
        return nil
    end
    if not r or not h or h.Health <= 0 then
        MV._DestroySpeedParts()
        CS.root = nil
        return nil
    end
    if CS.root ~= r then
        MV._DestroySpeedParts()
        CS.root = r
    end
    if not MV._sv or MV._sv.Parent ~= r then
        if MV._sv then MV._sv:Destroy() end
        MV._sv = New("BodyVelocity", {
            Name = "BC_SpeedVel", MaxForce = Vector3.new(1e9, 0, 1e9), Velocity = Vector3.zero,
        }, r)
    else
        local mf = MV._sv.MaxForce
        if mf and (mf.Y ~= 0) then
            MV._sv.MaxForce = Vector3.new(1e9, 0, 1e9)
        end
    end
    return r, h
end

function MV._ReadSpeedInput(cf, h)
    if not CS.focused or UserInputService:GetFocusedTextBox() then return Vector3.zero end
    local x, z = 0, 0
    local w = UserInputService:IsKeyDown(Enum.KeyCode.W)
    local s = UserInputService:IsKeyDown(Enum.KeyCode.S)
    local a = UserInputService:IsKeyDown(Enum.KeyCode.A)
    local d = UserInputService:IsKeyDown(Enum.KeyCode.D)
    if w or s or a or d then
        x, z = (d and 1 or 0) - (a and 1 or 0), (s and 1 or 0) - (w and 1 or 0)
    elseif h then
        local md = h.MoveDirection
        local right = Vector3.new(cf.RightVector.X, 0, cf.RightVector.Z)
        if right.Magnitude > 0.001 then right = right.Unit else right = Vector3.new(1, 0, 0) end
        local forward = Vector3.new(right.Z, 0, -right.X)
        x, z = md:Dot(right), -md:Dot(forward)
    end
    return Vector3.new(x, 0, z)
end
function MV.SpeedVelocity(cf, input, speed)
    local look = Vector3.new(cf.LookVector.X, 0, cf.LookVector.Z)
    local right = Vector3.new(cf.RightVector.X, 0, cf.RightVector.Z)
    if look.Magnitude < 0.001 then
        if right.Magnitude > 0.001 then right = right.Unit else right = Vector3.new(1, 0, 0) end
        look = Vector3.new(right.Z, 0, -right.X)
    else
        look = look.Unit
    end
    if right.Magnitude > 0.001 then right = right.Unit else right = Vector3.new(1, 0, 0) end
    local direction = right * input.X - look * input.Z
    direction = Vector3.new(direction.X, 0, direction.Z)
    local magnitude = direction.Magnitude
    if magnitude < 0.001 then return Vector3.zero end
    if magnitude > 1 then direction = direction / magnitude end
    return direction * mvClamp(speed, 1, 2000, 50)
end
function MV._SpeedStep()
    if not MV.sprint then return end
    MV._speedFrameAt = tick()
    local r, h = MV._EnsureSpeed()
    if not r or not MV._sv then return end
    local cam = workspace.CurrentCamera
    if not cam then
        MV._sv.MaxForce = Vector3.new(0, 0, 0)
        MV._sv.Velocity = Vector3.zero
        return
    end
    local vel = MV.SpeedVelocity(cam.CFrame, MV._ReadSpeedInput(cam.CFrame, h), MV.sprintSpeed)
    if vel.Magnitude < 0.001 then
        MV._sv.MaxForce = Vector3.new(0, 0, 0)
        MV._sv.Velocity = Vector3.zero
    else
        MV._sv.MaxForce = Vector3.new(1e9, 0, 1e9)
        MV._sv.Velocity = Vector3.new(vel.X, 0, vel.Z)
    end
end
function MV._SpeedFrame()
    local ok, err = pcall(MV._SpeedStep)
    if not ok then
        CS.lastError = tostring(err)
        pcall(function() if MV._sv then MV._sv.Velocity = Vector3.zero end end)
        if tick() - (CS.errorAt or -math.huge) > 2 then
            CS.errorAt = tick()
            warn("[taodepzai v5.0 NOIR] 💨 Tốc độ: " .. CS.lastError)
        end
    end
end
function MV._BindSpeed()
    if MV._speedBound or not MV.sprint then return end
    RunService:UnbindFromRenderStep("BC_Speed")
    RunService:BindToRenderStep("BC_Speed", Enum.RenderPriority.Camera.Value + 1, MV._SpeedFrame)
    MV._speedBound = true
    MV._speedFrameAt = tick()
end
function MV._StopSpeed()
    RunService:UnbindFromRenderStep("BC_Speed")
    MV._speedBound = false
    MV._DestroySpeedParts()
    CS.root = nil
end
function MV.SetSprint(on)
    on = (on == true)
    if on then
        local r, h = MV.Root(), MV.Hum()
        if not r or not h or h.Health <= 0 then return false, "chưa có nhân vật sống để chạy" end
        MV.sprint = true
        MV._EnsureSpeed()
        MV._BindSpeed()
        MV._SpeedFrame()
    else
        MV.sprint = false
        MV._StopSpeed()
    end
    MV._Watchdog()
    if S.SyncSpeedPanel then S.SyncSpeedPanel() end
    if S.SyncTunePanel then pcall(S.SyncTunePanel) end
    return MV.sprint
end
function MV.SetSprintSpeed(n)
    n = tonumber(n)
    if not n or n ~= n or n == math.huge or n == -math.huge then return false, "nhập tốc độ 1–2000" end
    MV.sprintSpeed = mvClamp(n, 1, 2000, 50)
    if S.SyncSpeedPanel then S.SyncSpeedPanel() end
    if S.SyncTunePanel then pcall(S.SyncTunePanel) end
    return true, MV.sprintSpeed
end
end -- 💨 TỐC ĐỘ THEO CAMERA

-- ---------- 🦘 NHẢY CAO (v4.38) ----------
do
local HJ = { last = 0 }
MV.HighJump = HJ

function MV.WantJumpSpeed()
    if MV.highJump then return mvClamp(MV.highJumpSpeed, 1, 500, 80) end
    return mvClamp(MV.jumpPower, 1, 500, 50)
end
function MV.HighJumpVelocity(current, speed)
    local vx = MV.comp(current, "X", 0)
    local vz = MV.comp(current, "Z", 0)
    return Vector3.new(vx, mvClamp(speed, 1, 500, 80), vz)
end
function MV._HighJumpApplyPower()
    if not MV.highJump then return end
    local h = MV.Hum()
    if not h then return end
    local jp = mvClamp(MV.highJumpSpeed, 1, 500, 80)
    pcall(function()
        if h.UseJumpPower ~= false then
            if (tonumber(h.JumpPower) or 0) ~= jp then h.JumpPower = jp end
        end
        local g = tonumber(workspace.Gravity) or 0
        if g < 1 then g = 196.2 end
        local jh = mvClamp((jp * jp) / (2 * g), 1, 500)
        if math.abs((tonumber(h.JumpHeight) or 0) - jh) > 0.05 then h.JumpHeight = jh end
    end)
end
function MV._DoHighJump()
    if not MV.highJump then return false end
    if MV.fly or (MV.Safe and MV.Safe.on) then return false end
    local h, r = MV.Hum(), MV.Root()
    if not h or not r then return false end
    if h.Sit then return false end
    local st = h:GetState()
    if st == Enum.HumanoidStateType.Freefall then return false end
    local now = os.clock()
    if HJ.last and (now - HJ.last) < 0.12 then return false end
    HJ.last = now
    MV._HighJumpApplyPower()
    pcall(function() h:ChangeState(Enum.HumanoidStateType.Jumping) end)
    pcall(function() h.Jump = true end)
    pcall(function()
        r.AssemblyLinearVelocity = MV.HighJumpVelocity(r.AssemblyLinearVelocity, MV.highJumpSpeed)
    end)
    return true
end
function MV._HighJumpBind()
    if HJ.conn or not MV.highJump then return end
    HJ.conn = trackConn(UserInputService.JumpRequest:Connect(function()
        pcall(MV._DoHighJump)
    end))
    HJ.conn2 = trackConn(UserInputService.InputBegan:Connect(function(i, gp)
        if not MV.highJump then return end
        pcall(function()
            local tb = UserInputService:GetFocusedTextBox()
            if tb and tb:IsDescendantOf(gui) then return end
            local k = i and i.KeyCode
            if k == Enum.KeyCode.Space or k == Enum.KeyCode.ButtonA then MV._DoHighJump() end
        end)
    end))
end
function MV._HighJumpUnbind()
    for _, c in ipairs({ HJ.conn, HJ.conn2 }) do
        if c then pcall(function() c:Disconnect() end) end
    end
    HJ.conn, HJ.conn2 = nil, nil
end
function MV.SetHighJump(on)
    on = (on == true)
    if on == MV.highJump then return MV.highJump end
    local h = MV.Hum()
    if on then
        if h then HJ.baseJP, HJ.baseJH = h.JumpPower, h.JumpHeight end
        MV.highJump = true
        MV._HighJumpApplyPower()
        MV._HighJumpBind()
    else
        MV.highJump = false
        MV._HighJumpUnbind()
        if h and not MV.infJump then
            if HJ.baseJP ~= nil then pcall(function() h.JumpPower = HJ.baseJP end) end
            if HJ.baseJH ~= nil then pcall(function() h.JumpHeight = HJ.baseJH end) end
        end
        HJ.baseJP, HJ.baseJH = nil, nil
    end
    MV._Watchdog()
    if S.SyncHighJumpPanel then S.SyncHighJumpPanel() end
    if S.SyncTunePanel then pcall(S.SyncTunePanel) end
    return MV.highJump
end
function MV.SetHighJumpSpeed(n)
    n = tonumber(n)
    if not n or n ~= n or n == math.huge or n == -math.huge then return false, "nhập tốc độ nhảy 1–500" end
    MV.highJumpSpeed = mvClamp(n, 1, 500, 80)
    if MV.highJump then pcall(MV._HighJumpApplyPower) end
    if S.SyncHighJumpPanel then S.SyncHighJumpPanel() end
    if S.SyncTunePanel then pcall(S.SyncTunePanel) end
    return true, MV.highJumpSpeed
end
end -- 🦘 NHẢY CAO

do
MV.Safe = {
    on = false,
    auto = true,        -- ➡ tự bay (không bấm gì vẫn bay theo hướng camera)
    radius = 25,        -- 📏 khoảng cách xác định để né (studs)
    speed = 60,         -- 💨 tốc độ bay
    steer = 4,          -- 🌀 né gắt (1–10)
    shield = true,      -- 🔲 bức tường trong suốt hình vuông bao quanh (nhìn thấy vùng né)
    shieldThk = 0.4,    -- độ dày vách
    shieldH = 0,        -- v4.23: 0 = chiều cao TỰ ĐỘNG theo nhân vật (trước đây cố định 16)
    shieldSize = 0,     -- v4.23: nửa cạnh khiên (studs). 0 = TỰ ĐỘNG ôm sát nhân vật; 📏 Né KHÔNG kéo giãn khiên
    shieldT = 0.86,     -- độ trong suốt (càng nhỏ càng thấy rõ)
    avoidPlayers = true,-- 👤 né cả NGƯỜI CHƠI khác (dù họ đứng yên)
    circle = true,      -- ⭕ không có mối nguy nào -> tự bay VÒNG TRÒN
    circleR = 20,       -- ⭕ bán kính vòng tròn
    lookTime = 1.0,     -- 👁 nhìn trước bao nhiêu giây để né vật ĐANG BAY TỚI mình
    lookMul = 1.6,      -- 👁 quét xa hơn vùng né bấy nhiêu lần (bắt vật từ xa lao tới)
    _holdAt = 0,        -- thời điểm cuối cùng còn mối nguy (né thêm 0,35s cho chắc)
    _myV = Vector3.new(0, 0, 0),   -- vận tốc mình ĐANG định bay (để tính tốc độ lao vào nhau)
    _ang = 0, _center = nil,       -- ⭕ góc + tâm vòng tròn
    noclip = true,      -- 🧱 tự bật Xuyên Tường để đẩy được xuyên vật cản
    _ncPrev = nil,      -- trạng thái Xuyên Tường TRƯỚC KHI bật 🛡 (để trả lại đúng)
    _shield = nil,      -- 4 vách trong suốt
    _shieldPos = nil,
    _hum = nil,         -- Humanoid mà Safe Fly đã thay đổi trạng thái
    _platformStandPrev = nil,
    _autoRotatePrev = nil,
    _root = nil,        -- v4.23: nhân vật đang gắn (đổi là tự dựng lại part bay + khiên)
    _bound = false,     -- v4.23: vòng lặp riêng "BC_Safe" đã gắn chưa
    _lastFrameAt = 0,   -- v4.23: lần cuối vòng lặp 🛡 chạy (watchdog soi còn sống không)
    playerThreats = 0,
    threats = 0, nearest = nil,     -- để hiện trạng thái
    _rep = Vector3.new(0, 0, 0),    -- vector đẩy của lần quét gần nhất
    _seen = {}, _cache = nil, _listAcc = 0, _sc = 0,
    _virtX = 0, _virtZ = 0, _virtY = 0,
    showHud = true,
    _hud = nil,
    _joyBG = nil, _joyKnob = nil, _dragging = false,
    _bv = nil, _bg = nil,
}
local SF = MV.Safe

local function sfIsPart(d)
    if d == nil then return false end
    local okA, isPart = pcall(function() return d:IsA("BasePart") end)   -- game thật: IsA có sẵn
    if okA and isPart ~= nil then return isPart == true end
    local okC, cls = pcall(function() return tostring(d.ClassName or "") end)
    if not okC then return false end
    return (cls == "Part" or cls == "MeshPart" or cls == "WedgePart" or cls == "TrussPart"
            or cls == "CornerWedgePart" or cls == "UnionOperation" or cls == "NegateOperation"
            or cls == "IntersectOperation" or cls == "Ball" or cls == "Cylinder"
            or cls == "SpawnLocation" or cls == "Seat" or cls == "VehicleSeat" or cls == "Platform")
end
local function sfIgnore(d, char)
    local nm = tostring(d.Name or "")
    if nm:sub(1, 3) == "BC_" then return true end
    if char and d:IsDescendantOf(char) then return true end
    local floor = MV._floor
    if floor and floor.Parent and d:IsDescendantOf(floor) then return true end
    return false
end
local function sfOverlap(char)
    if SF._op and SF._opChar == char then return SF._op end
    local ok, op = pcall(function() return OverlapParams.new() end)
    if not ok or op == nil then return nil end
    pcall(function() op.MaxParts = 0 end)                                  -- 0 = không giới hạn
    pcall(function() op.RespectCanCollide = false end)                     -- vật không va chạm vẫn tính
    pcall(function() op.FilterType = Enum.RaycastFilterType.Exclude end)   -- API mới
    pcall(function() op.FilterDescendantsInstances = { char } end)         -- bỏ qua part của chính mình
    SF._op, SF._opChar = op, char
    return op
end
local function sfCandidates(pos, dt, reach)
    local r0 = reach or SF.radius
    local char0 = MV.Char()
    local op0 = sfOverlap(char0)
    local okL, list = pcall(function() return workspace:GetPartBoundsInRadius(pos, r0, op0) end)
    if not okL then okL, list = pcall(function() return workspace:GetPartBoundsInRadius(pos, r0) end) end
    if okL and type(list) == "table" then return list end
    SF._listAcc = (SF._listAcc or 0) + (dt or 0.15)
    if not SF._cache or SF._listAcc >= 2 then
        SF._listAcc = 0
        local out = {}
        local ok2, desc = pcall(function() return workspace:GetDescendants() end)
        if ok2 and type(desc) == "table" then
            for _, d in ipairs(desc) do
                if #out >= 600 then break end
                if sfIsPart(d) then out[#out + 1] = d end
            end
        end
        SF._cache = out
    end
    return SF._cache or {}
end
local function sfPlayers(pos, rad, rep0, near0)
    local rep, n, near = rep0, 0, near0
    if not SF.avoidPlayers then return rep, n, near end
    local char = MV.Char()
    local ok, list = pcall(function() return Players:GetPlayers() end)
    if not ok or type(list) ~= "table" then return rep, n, near end
    for _, pl in ipairs(list) do
        if pl ~= player then
            local ch = pl.Character
            if ch and ch ~= char then
                local hrp = ch:FindFirstChild("HumanoidRootPart") or ch:FindFirstChildOfClass("BasePart")
                local pp = hrp and hrp.Position
                if pp then
                    local delta = pp - pos
                    local dist = delta.Magnitude
                    if dist <= rad and dist > 0.01 then
                        n = n + 1
                        if near == nil or dist < near then near = dist end
                        local w = 1 - (dist / rad)
                        rep = rep - (delta / dist) * (0.5 + w * w * 3)   -- TRỪ = đẩy RA XA
                    end
                end
            end
        end
    end
    return rep, n, near
end
function MV.Safe.Scan(pos, dt)
    local char = MV.Char()
    local rad = mvClamp(SF.radius, 1, 300, 25)
    local reach = rad * mvClamp(SF.lookMul, 1, 4, 1.6)
    local lookT = mvClamp(SF.lookTime, 0.1, 3, 1.0)
    local myV = SF._myV or Vector3.new(0, 0, 0)     -- vận tốc MÌNH (mình bay tới nó cũng tính)
    local rep = Vector3.new(0, 0, 0)
    local n, near = 0, nil
    local now = tick()
    local seen = {}
    local pchars = {}
    local pls = Players:GetPlayers()
    if type(pls) == "table" then
        for _, pl in ipairs(pls) do
            if pl ~= player then
                local ch2 = pl.Character
                if ch2 ~= nil and ch2 ~= char then pchars[ch2] = true end
            end
        end
    end
    local hasPChar = (next(pchars) ~= nil)
    local function inPChar(d)
        if not hasPChar then return false end
        for ch2 in pairs(pchars) do
            if d:IsDescendantOf(ch2) then return true end
        end
        return false
    end
    SF._mvCount = 0                       -- v4.20: đếm vật ĐANG CHẠY trong tầm (để soi trạng thái)
    for _, d in ipairs(sfCandidates(pos, dt, reach)) do
        if sfIsPart(d) and not sfIgnore(d, char) and not inPChar(d) then
            local p = d.Position
            if p then
                local delta = p - pos
                local dist = delta.Magnitude
                local rr = 0
                local sz = d.Size
                if sz then
                    local mx = math.max(sz.X, sz.Y, sz.Z)
                    if type(mx) == "number" then rr = mx * 0.5 end
                end
                if rr > rad * 0.75 then rr = rad * 0.75 end
                local surf = dist - rr
                if surf < 0 then surf = 0 end
                if surf <= reach and dist > 0.01 then
                    local dir = delta / dist                 -- hướng TỚI vật
                    local moving, closing = false, 0
                    local v = d.AssemblyLinearVelocity
                    if v and v.Magnitude then
                        if v.Magnitude > 1.5 then moving = true end
                        closing = -(v.X * dir.X + v.Y * dir.Y + v.Z * dir.Z)
                    end
                    local old = SF._seen[d]
                    if old then
                        local dd = (p - old.p).Magnitude
                        local ddt = math.max(now - old.t, 0.02)
                        if dd > 0.35 or (dd / ddt) > 1.5 then moving = true end
                        if closing <= 0.5 and dd > 0.1 then
                            closing = math.max(closing, dd / ddt)
                        end
                    end
                    if not moving then
                        local hum0 = d:FindFirstAncestorOfClass("Humanoid")
                        if hum0 == nil then
                            local anc = d.Parent
                            if anc then hum0 = anc:FindFirstChildOfClass("Humanoid") end
                        end
                        if hum0 ~= nil then
                            local md = hum0.MoveDirection
                            local mdMag = 0
                            if md then
                                local m2 = md.Magnitude
                                if type(m2) == "number" then mdMag = m2 end
                            end
                            if mdMag > 0.05 then moving = true end
                        end
                    end
                    if moving and surf <= reach then SF._mvCount = (SF._mvCount or 0) + 1 end
                    seen[d] = { p = p, t = now }
                    local danger = (surf <= rad and moving)
                    local tHit = nil
                    if closing > 0.5 then
                        tHit = (surf - rad * 0.35) / closing      -- còn bao lâu thì MẶT vật tới sát mình
                        if tHit <= lookT then danger = true end
                    end
                    if danger then
                        n = n + 1
                        if near == nil or surf < near then near = surf end
                        local w = mvClamp(1 - (surf / (rad * mvClamp(SF.lookMul, 1, 4, 1.6))), 0.2, 1)
                        local myDot = mvClamp(myV.X * dir.X + myV.Y * dir.Y + myV.Z * dir.Z, 0, 200)
                        local boost = 1 + mvClamp(closing, 0, 200) / 60 + myDot / 240
                        local pv = p
                        if v and v.Magnitude > 0.1 then pv = p + v * 0.35 end
                        local pdir = pv - pos
                        if pdir.Magnitude > 0.01 then
                            pdir = pdir.Unit
                            if (pdir.X * dir.X + pdir.Y * dir.Y + pdir.Z * dir.Z) < 0 then pdir = dir end
                        else
                            pdir = dir
                        end
                        rep = rep - pdir * (0.35 + w * w * 3) * boost
                    end
                end
            end
        end
    end
    local pn0 = n
    rep, n, near = sfPlayers(pos, rad, rep, near)
    SF.playerThreats = n
    n = pn0 + n
    SF._seen = seen
    SF._rep = rep
    SF.movers = SF._mvCount or 0
    SF._mvCount = nil
    SF.threats, SF.nearest = n, near
    if n > 0 then
        SF._holdAt = now
        SF._lastThreatAt = now                                     -- v4.20: nhớ vừa bị gí (để né tiếp)
        if rep.Magnitude > 0 then SF._lastRep = rep end            -- nhớ HƯỚNG đang né
    end
    return n, near, rep
end
-- ---------- v4.18: 🔲 BỨC TƯỜNG TRONG SUỐT HÌNH VUÔNG bao quanh mình ----------
function MV.Safe.KillShield()
    for i = 1, 4 do
        local w = SF._shield and SF._shield[i]
        if w then pcall(function() w:Destroy() end) end
    end
    SF._shield, SF._shieldPos = nil, nil
end
function MV.Safe.ShieldHalf()
    local n = tonumber(SF.shieldSize)
    if n and n > 0 then return mvClamp(n, 0.5, 300, 3) end          -- chỉnh tay
    local w = 2
    local r = MV.Root()
    if r then pcall(function() w = math.max(tonumber(r.Size.X) or 2, tonumber(r.Size.Z) or 2) end) end
    return mvClamp(w * 0.5 + 1.6, 2, 8, 3)                          -- người thường: 2,6 stud (cạnh ~5,2)
end
function MV.Safe.ShieldHeight()
    local n = tonumber(SF.shieldH)
    if n and n > 0 then return mvClamp(n, 1, 100, 8) end
    local hh = 2
    local r = MV.Root()
    if r then pcall(function() hh = tonumber(r.Size.Y) or 2 end) end
    return mvClamp(hh * 3 + 2, 4, 14, 8)                            -- người thường: 8 stud
end
function MV.Safe.BuildShield()
    MV.Safe.KillShield()
    local side, h = MV.Safe.ShieldHalf(), MV.Safe.ShieldHeight()
    local thk = SF.shieldThk
    SF._shield = {}
    for i = 1, 4 do
        local long = (i <= 2)
        local w = New("Part", {
            Name = "BC_Shield" .. i,
            Size = long and Vector3.new(side * 2 + thk, h, thk) or Vector3.new(thk, h, side * 2 + thk),
            Transparency = SF.shieldT,
            Color = Color3.fromRGB(120, 225, 255),
            Material = Enum.Material.Glass,
            Anchored = true, CanCollide = false, CastShadow = false,
        }, workspace)
        SF._shield[i] = w
    end
end
function MV.Safe.UpdateShield(pos)
    if not (SF.on and SF.shield) then
        if SF._shield then MV.Safe.KillShield() end
        return
    end
    local side = MV.Safe.ShieldHalf()
    local wallH = MV.Safe.ShieldHeight()
    local need = (SF._shield == nil)
    if not need then
        for i = 1, 4 do
            local w = SF._shield[i]
            if not w or not w.Parent then need = true break end
        end
    end
    if need then pcall(MV.Safe.BuildShield) end
    if not SF._shield or not SF._shield[1] then return end
    local q = SF._shieldPos
    if q and math.abs(q.X - pos.X) < 0.05 and math.abs(q.Y - pos.Y) < 0.05 and math.abs(q.Z - pos.Z) < 0.05
       and math.abs((q.S or 0) - side) < 0.01 and math.abs((q.H or 0) - wallH) < 0.01 then
        return
    end
    SF._shieldPos = { X = pos.X, Y = pos.Y, Z = pos.Z, S = side, H = wallH }
    for i = 1, 4 do
        local w = SF._shield[i]
        if w then
            local dx, dz = 0, 0
            if i == 1 then dz = side elseif i == 2 then dz = -side
            elseif i == 3 then dx = side else dx = -side end
            local okS = pcall(function()
                w.Size = (i <= 2) and Vector3.new(side * 2 + SF.shieldThk, wallH, SF.shieldThk)
                                      or Vector3.new(SF.shieldThk, wallH, side * 2 + SF.shieldThk)
                w.CFrame = CFrame.new(pos.X + dx, pos.Y, pos.Z + dz)
            end)
            if not okS then MV.Safe.KillShield(); return end
        end
    end
end
function MV.Safe._EnsureBV()
    local r = MV.Root()
    if not r then return nil, nil end
    if SF._bv and SF._bv.Parent == r and SF._bg and SF._bg.Parent == r then
        return SF._bv, SF._bg
    end
    pcall(function() if SF._bv then SF._bv:Destroy() end end)
    pcall(function() if SF._bg then SF._bg:Destroy() end end)
    local bv = New("BodyVelocity", { Name = "BC_SafeFlyVel", MaxForce = Vector3.new(1e9, 1e9, 1e9), Velocity = Vector3.new(0,0,0) }, r)
    local bg = New("BodyGyro", { Name = "BC_SafeFlyGyro", MaxTorque = Vector3.new(1e9, 1e9, 1e9), P = 1e4, D = 50 }, r)
    SF._bv, SF._bg = bv, bg
    local h = MV.Hum()
    if h then
        if SF._hum ~= h then
            SF._hum = h
            pcall(function() SF._platformStandPrev = h.PlatformStand end)
            pcall(function() SF._autoRotatePrev = h.AutoRotate end)
        end
        pcall(function() h.PlatformStand = true end)
        pcall(function() h.AutoRotate = false end)
    end
    return bv, bg
end

function MV.Safe._RestoreHum()
    local h = SF._hum
    if h and h.Parent then
        if SF._platformStandPrev ~= nil then
            pcall(function() h.PlatformStand = SF._platformStandPrev end)
        end
        if SF._autoRotatePrev ~= nil then
            pcall(function() h.AutoRotate = SF._autoRotatePrev end)
        end
    end
    SF._hum = nil
    SF._platformStandPrev = nil
    SF._autoRotatePrev = nil
end

function MV.Safe.Repair()
    local r = MV.Root()
    if not r then return false end
    local bv, bg = MV.Safe._EnsureBV()
    if not bv or MV.Root() ~= r then
        return false
    end
    MV.flySpeed = mvClamp(SF.speed, 1, 2000, 60)
    return true
end
function MV.Safe.Bind()
    if SF._bound then return true end
    SF._bound = pcall(function() RunService:BindToRenderStep("BC_Safe", 2, MV.Safe._Frame) end)
    return SF._bound == true
end
function MV.Safe.Unbind()
    SF._bound = false
    pcall(function() RunService:UnbindFromRenderStep("BC_Safe") end)
end
function MV.Safe._Frame(dt) pcall(MV.Safe.Step, dt) end
function MV.Safe.Step(dt)
    if not SF.on then return end
    SF._lastFrameAt = tick()
    local r, h = MV.Root(), MV.Hum()
    if not r then
        if SF._shield then pcall(MV.Safe.KillShield) end
        SF._root = nil
        return
    end
    if SF._root ~= r then
        SF._root = r
        pcall(MV.Safe.Reset)
        SF._shieldPos = nil
        if SF.shield then pcall(MV.Safe.KillShield) end
        pcall(MV.Safe._EnsureBV)
    end
    if not (SF._bv and SF._bv.Parent == r) then
        pcall(MV.Safe._EnsureBV)
    end
    local bv = SF._bv
    if not (bv and bv.Parent == r) then return end
    local bg = SF._bg
    if h then
        if h.PlatformStand ~= true then pcall(function() h.PlatformStand = true end) end
        if h.AutoRotate ~= false then pcall(function() h.AutoRotate = false end) end
    end
    local dtv = tonumber(dt) or 0.016
    SF._sc = (SF._sc or 0) + dtv
    local sinceThreat = tick() - (SF._lastThreatAt or 0)
    local ivScan = (((SF.threats or 0) > 0) or sinceThreat < 1.0) and 0.05 or 0.15
    if SF._sc >= ivScan then
        local okS = pcall(MV.Safe.Scan, r.Position, SF._sc)
        SF._sc = 0
        if not okS then SF.threats, SF.nearest = 0, nil end
    end
    local now = tick()
    local contact = ((SF.threats or 0) > 0) or ((now - (SF._holdAt or 0)) < 0.35)
    local keys = (h and h.MoveDirection) or Vector3.new(0, 0, 0)
    local vX = tonumber(SF._virtX) or 0
    local vZ = tonumber(SF._virtZ) or 0
    if math.abs(vX) > 0.01 or math.abs(vZ) > 0.01 then
        keys = Vector3.new(vX, 0, vZ)
    end
    local busy = keys.Magnitude >= 0.01                  -- đang bấm WASD / joystick ảo -> nhường quyền cho bạn
    local dir = keys
    if dir.Magnitude < 0.01 and SF.auto then
        local cam = workspace.CurrentCamera
        if cam then
            local look = cam.CFrame.LookVector
            dir = Vector3.new(look.X, 0, look.Z)
        end
    end
    if dir.Magnitude > 0 then dir = dir.Unit else dir = Vector3.new(0, 0, 0) end
    local up = UserInputService:IsKeyDown(Enum.KeyCode.Space)
    local down = UserInputService:IsKeyDown(Enum.KeyCode.LeftShift)
              or UserInputService:IsKeyDown(Enum.KeyCode.LeftControl)
    local vY = tonumber(SF._virtY) or 0
    local vv
    if math.abs(vY) > 0.01 then
        vv = vY
    else
        vv = (up and 1 or 0) - (down and 1 or 0)
    end
    local spd = mvClamp(SF.speed, 1, 2000, 60)
    local target
    if SF.circle and SF.auto and (not busy) and (not contact) then
        local R = mvClamp(SF.circleR, 3, 300, 20)
        local cx, cy, cz = r.Position.X, r.Position.Y, r.Position.Z
        if SF._center then cx, cy, cz = SF._center.X, SF._center.Y, SF._center.Z end
        local dxz = math.sqrt((r.Position.X - cx) ^ 2 + (r.Position.Z - cz) ^ 2)
        if dxz > R * 1.6 then
            SF._center = nil
            cx, cy, cz = r.Position.X, r.Position.Y, r.Position.Z
        elseif SF._center == nil then
            SF._center = { X = cx, Y = cy, Z = cz }
        end
        SF._ang = (SF._ang or 0) + dtv * (spd / math.max(R, 1))     -- bay đều quanh tâm
        local tx = cx + math.cos(SF._ang) * R
        local tz = cz + math.sin(SF._ang) * R
        local tang = Vector3.new(-math.sin(SF._ang), 0, math.cos(SF._ang)) * spd
        local want = Vector3.new(tx - r.Position.X, cy - r.Position.Y, tz - r.Position.Z)
        target = tang + want * 2.2 + Vector3.new(0, vv * spd, 0)
        if target.Magnitude > spd then target = target.Unit * spd end
    else
        SF._center = nil                                    -- rời chế độ vòng tròn -> tâm mới lần sau
        target = (dir + Vector3.new(0, vv, 0)) * spd
    end
    local rep = SF._rep
    if (rep == nil or rep.Magnitude < 0.01) and SF._lastRep ~= nil then
        local el = now - (SF._lastThreatAt or 0)
        if el < 0.9 then rep = SF._lastRep * (1 - el / 0.9) end       -- vơi dần, không lật hướng
    end
    if rep and rep.Magnitude > 0 then
        target = target + rep * (spd * (0.25 + 0.09 * mvClamp(SF.steer, 1, 10, 4)))
        local cap = spd * 2
        if target.Magnitude > cap then target = target.Unit * cap end
    end
    if SF.nearest and SF.nearest < mvClamp(SF.radius, 1, 300, 25) * 0.4 then
        target = target + Vector3.new(0, spd * 0.75, 0)
    end
    SF._myV = target
    bv.Velocity = target
    if bg and target.Magnitude > 0.1 then
        local lookPos = r.Position + Vector3.new(target.X, 0, target.Z)
        if (lookPos - r.Position).Magnitude > 0.1 then
            bg.CFrame = CFrame.new(r.Position, lookPos)
        end
    end
    if SF.shield then pcall(MV.Safe.UpdateShield, r.Position) end
    SF._hudAcc = (SF._hudAcc or 0) + dtv
    if SF._hudAcc >= 0.3 then
        SF._hudAcc = 0
        if SF._hudUpdate then pcall(SF._hudUpdate) end
    end
end
function MV.Safe.Set(on)
    if on == true and MV.fly then MV.SetFly(false) end -- không để hai BodyVelocity tranh lực
    SF.on = (on == true)
    if SF.on then
        if SF.noclip and SF._ncPrev == nil then
            SF._ncPrev = MV.noclip == true
            pcall(function() MV.SetNoclip(true) end)
        end
        pcall(MV.Safe._EnsureBV)
        MV.flySpeed = mvClamp(SF.speed, 1, 2000, 60)
        SF._root = MV.Root()
        pcall(MV._Watchdog)
        SF._lastFrameAt = tick()
        pcall(MV.Safe.Bind)
        pcall(function() MV.Safe.UpdateShield(MV.Root() and MV.Root().Position or Vector3.new(0, 0, 0)) end)
        pcall(function() MV.Safe.SyncHud() end)
    else
        pcall(MV.Safe.Unbind)
        MV.Safe.Reset()
        pcall(function() MV.Safe.ClearVirt() end)
        pcall(function() if SF._bv then SF._bv:Destroy() end end)
        pcall(function() if SF._bg then SF._bg:Destroy() end end)
        SF._bv, SF._bg = nil, nil
        if not MV.fly then
            pcall(MV.Safe._RestoreHum)
        end
        MV.Safe.KillShield()
        SF._root = nil
        if SF._ncPrev ~= nil then
            local was = SF._ncPrev
            SF._ncPrev = nil
            local stillFlying = (MV._glassFlyActive == true) or (MV._playerFlyActive == true)
            if not stillFlying then
                pcall(function() MV.SetNoclip(was) end)
            end
        end
        pcall(function() MV.Safe.SyncHud() end)
    end
    return SF.on
end
function MV.Safe.SetNoclipAuto(b)
    SF.noclip = (b == true)
    if SF.on then
        if SF.noclip then
            if SF._ncPrev == nil then SF._ncPrev = MV.noclip == true end
            pcall(function() MV.SetNoclip(true) end)
        elseif SF._ncPrev ~= nil then
            local was = SF._ncPrev
            SF._ncPrev = nil
            pcall(function() MV.SetNoclip(was) end)
        end
    end
    return SF.noclip
end
function MV.Safe.SetShield(b)
    SF.shield = (b == true)
    if SF.on and SF.shield then
        local r = MV.Root()
        if r then pcall(MV.Safe.UpdateShield, r.Position) end
    else
        MV.Safe.KillShield()
    end
    return SF.shield
end
function MV.Safe.SetAvoidPlayers(b)
    SF.avoidPlayers = (b == true)
    MV.Safe.Reset()
    return SF.avoidPlayers
end
function MV.Safe.Reset()                 -- quên dấu vết cũ (không dọa ma vật đã biến mất)
    SF._seen, SF._cache = {}, nil
    SF._rep = Vector3.new(0, 0, 0)
    SF.threats, SF.nearest, SF.playerThreats = 0, nil, 0
    SF.movers, SF._lastRep, SF._lastThreatAt, SF._mvCount = 0, nil, nil, nil   -- v4.20
    SF._holdAt, SF._center, SF._ang = 0, nil, 0
    SF._myV = Vector3.new(0, 0, 0)
end
function MV.Safe.Stop() return MV.Safe.Set(false) end
function MV.Safe.SetCircle(b)
    SF.circle = (b == true)
    SF._center = nil
    return SF.circle
end
function MV.Safe.SetCircleR(n)
    SF.circleR = mvClamp(n, 3, 300, 20)
    SF._center = nil
    return SF.circleR
end
function MV.Safe.Recenter()
    SF._center = nil
    return true
end
function MV.Safe.SetLook(t)        -- 👁 nhìn trước (giây) để né vật đang bay tới
    SF.lookTime = mvClamp(t, 0.1, 3, 1.0)
    return SF.lookTime
end
function MV.Safe.SetRadius(n)
    SF.radius = mvClamp(n, 1, 300, 25)
    MV.Safe.Reset()
    SF._shieldPos = nil                    -- đổi bán kính -> vẽ lại khiên theo cỡ mới
    if SF.on and SF.shield then
        local r = MV.Root()
        if r then pcall(MV.Safe.UpdateShield, r.Position) end
    end
    return SF.radius
end

function MV.Safe.SetShieldSize(n)
    SF.shieldSize = mvClamp(n, 0, 300, 0)
    SF._shieldPos = nil
    if SF.on and SF.shield then
        local r = MV.Root()
        if r then pcall(MV.Safe.UpdateShield, r.Position) end
    end
    return SF.shieldSize
end
function MV.Safe.SetSpeed(n)
    SF.speed = mvClamp(n, 1, 2000, 60)
    MV.flySpeed = SF.speed            -- để khung ⚙ và bảng trạng thái hiện cùng một số
    return SF.speed
end
function MV.Safe.SetSteer(n) SF.steer = mvClamp(n, 1, 10, 4); return SF.steer end
function MV.Safe.SetAuto(b) SF.auto = (b == true); return SF.auto end
function MV.Safe.Status()
    if not SF.on then return "🛡 bay an toàn: đang TẮT (khiên đã dọn, Xuyên Tường trả lại như cũ)" end
    local s = string.format("🛡 bay an toàn: BẬT · 💨 %g · 📏 né trong %gm · 🌀 %g",
        SF.speed, SF.radius, SF.steer)
    if SF.auto then s = s .. " · ➡ tự bay" end
    if SF.shield then
        local half = MV.Safe.ShieldHalf()
        s = s .. string.format(" · 🔲 khiên %g m/cạnh%s", half * 2, (tonumber(SF.shieldSize) or 0) > 0 and "" or " (tự)")
    end
    if SF.circle and SF.auto then
        local busy = false
        local hum0 = MV.Hum()
        local md0 = hum0 and hum0.MoveDirection
        if md0 and md0.Magnitude and md0.Magnitude >= 0.01 then busy = true end
        if math.abs(tonumber(SF._virtX) or 0) > 0.01 or math.abs(tonumber(SF._virtZ) or 0) > 0.01 then busy = true end
        if (SF.threats or 0) > 0 then
            s = s .. " · ⭕ tạm dừng (đang né)"
        elseif busy then
            s = s .. " · ⭕ tạm dừng (đang bấm phím)"
        else
            s = s .. " · ⭕ bay vòng tròn " .. tostring(math.floor(SF.circleR + 0.5)) .. "m"
        end
    end
    if (SF.movers or 0) > 0 and (SF.threats or 0) == 0 then
        s = s .. string.format(" · 🐾 thấy %d vật đang chạy", SF.movers)
    end
    if SF.noclip then s = s .. " · 🧱 xuyên vật cản" end
    if (SF.threats or 0) > 0 then
        s = s .. string.format(" · ⚠️ đang né %d mối nguy (gần nhất %gm)", SF.threats,
            math.floor((SF.nearest or 0) + 0.5))
        if (SF.playerThreats or 0) > 0 then s = s .. string.format(" — có %d người chơi", SF.playerThreats) end
    else
        s = s .. " · ✅ quanh đây không có gì lao tới mình"
    end
    if SF.showHud and SF.on then
        s = s .. " · 📱 nút ảo BẬT"
    end
    return s
end

function MV.Safe.SetVirt(x, z, y)
    SF._virtX = mvClamp(tonumber(x) or 0, -1, 1, 0)
    SF._virtZ = mvClamp(tonumber(z) or 0, -1, 1, 0)
    SF._virtY = mvClamp(tonumber(y) or 0, -1, 1, 0)
    return SF._virtX, SF._virtZ, SF._virtY
end
function MV.Safe.ClearVirt()
    SF._virtX, SF._virtZ, SF._virtY = 0, 0, 0
    return true
end
function MV.Safe.SetShowHud(b)
    SF.showHud = (b == true)
    if not SF.showHud then
        pcall(function() MV.Safe.ClearVirt() end)
        pcall(function()
            if SF._joyKnob then SF._joyKnob.Position = UDim2.new(0.5, -16, 0.5, -16) end
        end)
        SF._dragging = false
    end
    pcall(function() MV.Safe.SyncHud() end)
    return SF.showHud
end
function MV.Safe._BuildHud()
    if SF._hud and SF._hud.Parent then return SF._hud end
    local hud = New("Frame", {
        Name = "BC_SafeHud",
        Size = UDim2.new(0, 300, 0, 190),
        Position = UDim2.new(0, 10, 1, -200),
        BackgroundColor3 = C.SURFACE,
        BackgroundTransparency = 0.18,
        BorderSizePixel = 0,
        Visible = false,
        ZIndex = 25,
    }, gui)
    Corner(hud, UDim.new(0, 12))
    Stroke(hud, C.HAIRLINE, 1)
    D.Shade(hud, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)

    local title = New("TextLabel", {
        Size = UDim2.new(1, -70, 0, 18), Position = UDim2.new(0, 10, 0, 4),
        Text = "🛡 Bay An Toàn - Nút Ảo", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 26,
    }, hud)

    local hideBtn = New("TextButton", {
        Size = UDim2.new(0, 28, 0, 20), Position = UDim2.new(1, -62, 0, 2),
        Text = "👁", BackgroundColor3 = C.SURFACE3, BackgroundTransparency = 0.15,
        TextColor3 = C.MUTED, Font = Enum.Font.GothamBold, TextSize = 10,
        BorderSizePixel = 0, ZIndex = 26,
    }, hud)
    Corner(hideBtn, UDim.new(0, 6))
    hideBtn.Activated:Connect(function()
        MV.Safe.SetShowHud(false)
        D.Say("📱 đã ẩn nút ảo 🛡 (vào khung 🛡 trong 📚 Script Hub để BẬT lại)", C.MUTED)
    end)

    local closeBtn = New("TextButton", {
        Size = UDim2.new(0, 28, 0, 20), Position = UDim2.new(1, -32, 0, 2),
        Text = "✕", BackgroundColor3 = C.RED, BackgroundTransparency = 0.2,
        TextColor3 = C.WHITE, Font = Enum.Font.GothamBold, TextSize = 10,
        BorderSizePixel = 0, ZIndex = 26,
    }, hud)
    Corner(closeBtn, UDim.new(0, 6))
    closeBtn.Activated:Connect(function()
        MV.Safe.Stop()
        D.Say("🚫 đã tắt 🛡 Bay An Toàn", C.YELLOW)
    end)

    local joyBG = New("Frame", {
        Name = "JoyBG",
        Size = UDim2.new(0, 110, 0, 110), Position = UDim2.new(0, 10, 0, 26),
        BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.15,
        BorderSizePixel = 0, ZIndex = 26,
    }, hud)
    Corner(joyBG, UDim.new(0, 14))
    Stroke(joyBG, C.BORDER, 1)
    SF._joyBG = joyBG

    local joyKnob = New("Frame", {
        Name = "JoyKnob",
        Size = UDim2.new(0, 32, 0, 32), Position = UDim2.new(0.5, -16, 0.5, -16),
        BackgroundColor3 = C.ACCENT, BackgroundTransparency = 0.15,
        BorderSizePixel = 0, ZIndex = 27,
    }, joyBG)
    Corner(joyKnob, UDim.new(1, 0))
    Stroke(joyKnob, C.WHITE, 1)
    SF._joyKnob = joyKnob

    local function dirBtn(txt, x, y, vx, vz)
        local b = New("TextButton", {
            Size = UDim2.new(0, 28, 0, 28), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundColor3 = C.SURFACE3, BackgroundTransparency = 0.2,
            TextColor3 = C.DARK, Font = Enum.Font.GothamBold, TextSize = 12,
            BorderSizePixel = 0, ZIndex = 27,
        }, joyBG)
        Corner(b, UDim.new(1, 0))
        local holding = false
        b.InputBegan:Connect(function(inp)
            if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
                holding = true
                MV.Safe.SetVirt(vx, vz, SF._virtY)
            end
        end)
        b.InputEnded:Connect(function(inp)
            if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
                holding = false
                if not SF._dragging then MV.Safe.SetVirt(0, 0, SF._virtY) end
            end
        end)
        return b
    end
    dirBtn("↑", 41, 2, 0, -1)
    dirBtn("↓", 41, 80, 0, 1)
    dirBtn("←", 2, 41, -1, 0)
    dirBtn("→", 80, 41, 1, 0)

    local function updateJoy(inputPos)
        local okPos, absPos = pcall(function() return joyBG.AbsolutePosition end)
        local okSize, absSize = pcall(function() return joyBG.AbsoluteSize end)
        if not (okPos and okSize and absPos and absSize) then return end
        local cx = absPos.X + absSize.X * 0.5
        local cy = absPos.Y + absSize.Y * 0.5
        local dx = inputPos.X - cx
        local dy = inputPos.Y - cy
        local maxR = 38
        local mag = math.sqrt(dx*dx + dy*dy)
        if mag > maxR then
            dx = dx / mag * maxR
            dy = dy / mag * maxR
            mag = maxR
        end
        pcall(function()
            joyKnob.Position = UDim2.new(0.5, dx - 16, 0.5, dy - 16)
        end)
        local nx = dx / maxR
        local nz = dy / maxR
        pcall(function() MV.Safe.SetVirt(nx, nz, SF._virtY) end)
    end
    local function resetJoy()
        SF._dragging = false
        pcall(function()
            joyKnob.Position = UDim2.new(0.5, -16, 0.5, -16)
        end)
        MV.Safe.SetVirt(0, 0, SF._virtY)
    end

    joyBG.InputBegan:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
            SF._dragging = true
            updateJoy(inp.Position)
        end
    end)
    joyBG.InputChanged:Connect(function(inp)
        if SF._dragging and (inp.UserInputType == Enum.UserInputType.MouseMovement or inp.UserInputType == Enum.UserInputType.Touch) then
            updateJoy(inp.Position)
        end
    end)
    trackConn(UserInputService.InputChanged:Connect(function(inp)
        if SF._dragging and (inp.UserInputType == Enum.UserInputType.MouseMovement or inp.UserInputType == Enum.UserInputType.Touch) then
            local ok, pos = pcall(function() return inp.Position end)
            if ok and pos then updateJoy(pos) end
        end
    end))
    trackConn(UserInputService.InputEnded:Connect(function(inp)
        if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
            if SF._dragging then resetJoy() end
        end
    end))

    local function vBtn(txt, x, y, w, h, color, cb)
        local b = New("TextButton", {
            Size = UDim2.new(0, w, 0, h), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundColor3 = color or C.SURFACE3, BackgroundTransparency = 0.15,
            TextColor3 = D.BestText(color or C.SURFACE3), Font = Enum.Font.GothamBold, TextSize = 11,
            BorderSizePixel = 0, ZIndex = 27,
        }, hud)
        Corner(b, UDim.new(0, 8))
        Stroke(b, C.BORDER, 1)
        local hold = false
        if cb then
            b.InputBegan:Connect(function(inp)
                if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
                    hold = true
                    pcall(cb, true)
                end
            end)
            b.InputEnded:Connect(function(inp)
                if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
                    hold = false
                    pcall(cb, false)
                end
            end)
            b.Activated:Connect(function() pcall(cb, nil) end)
        end
        return b
    end

    vBtn("⬆", 130, 26, 40, 36, Color3.fromRGB(0,150,0), function(isDown)
        if isDown == true then MV.Safe.SetVirt(SF._virtX, SF._virtZ, 1)
        elseif isDown == false then MV.Safe.SetVirt(SF._virtX, SF._virtZ, 0)
        else
            pcall(function() MV.Nudge(2.5) end)
        end
    end)
    vBtn("⬇", 130, 66, 40, 36, Color3.fromRGB(150,0,0), function(isDown)
        if isDown == true then MV.Safe.SetVirt(SF._virtX, SF._virtZ, -1)
        elseif isDown == false then MV.Safe.SetVirt(SF._virtX, SF._virtZ, 0)
        else
            pcall(function() MV.Nudge(-2.5) end)
        end
    end)

    vBtn("⏹ Dừng", 130, 108, 82, 26, C.RED, function() MV.Safe.Stop() end)
    vBtn("⭕ Tâm", 216, 108, 52, 26, C.PURPLE, function() MV.Safe.Recenter() end)

    vBtn("↻", 174, 26, 36, 36, C.SURFACE3, function()
        SF._ang = (SF._ang or 0) + 0.6
    end)

    local autoTog = vBtn("➡ Tự: BẬT", 10, 142, 82, 24, C.GREEN, function()
        MV.Safe.SetAuto(not SF.auto)
        D.Say(SF.auto and "➡ tự bay: BẬT" or "➡ tự bay: TẮT", C.ACCENT)
        pcall(function() if S.SyncSafePanel then S.SyncSafePanel() end end)
        pcall(function() MV.Safe.SyncHud() end)
    end)
    local circTog = vBtn("⭕ Vòng: BẬT", 96, 142, 82, 24, C.GREEN, function()
        MV.Safe.SetCircle(not SF.circle)
        D.Say(SF.circle and "⭕ vòng tròn: BẬT" or "⭕ vòng tròn: TẮT", C.ACCENT)
        pcall(function() if S.SyncSafePanel then S.SyncSafePanel() end end)
        pcall(function() MV.Safe.SyncHud() end)
    end)

    local speedLbl = New("TextLabel", {
        Size = UDim2.new(0, 108, 0, 24), Position = UDim2.new(0, 182, 0, 142),
        Text = "💨 60", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 27,
    }, hud)

    do
        local dragging, startPos, startInput
        title.InputBegan:Connect(function(inp)
            if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
                dragging = true
                startInput = inp.Position
                startPos = hud.Position
            end
        end)
        trackConn(UserInputService.InputChanged:Connect(function(inp)
            if dragging and (inp.UserInputType == Enum.UserInputType.MouseMovement or inp.UserInputType == Enum.UserInputType.Touch) then
                local delta = inp.Position - startInput
                hud.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
            end
        end))
        trackConn(UserInputService.InputEnded:Connect(function(inp)
            if inp.UserInputType == Enum.UserInputType.MouseButton1 or inp.UserInputType == Enum.UserInputType.Touch then
                dragging = false
            end
        end))
    end

    function SF._hudUpdate()
        pcall(function()
            if autoTog then
                autoTog.Text = SF.auto and "➡ Tự: BẬT" or "➡ Tự: TẮT"
                autoTog.BackgroundColor3 = SF.auto and C.GREEN or C.SURFACE3
                autoTog.TextColor3 = D.BestText(autoTog.BackgroundColor3)
            end
            if circTog then
                circTog.Text = SF.circle and "⭕ Vòng: BẬT" or "⭕ Vòng: TẮT"
                circTog.BackgroundColor3 = SF.circle and C.GREEN or C.SURFACE3
                circTog.TextColor3 = D.BestText(circTog.BackgroundColor3)
            end
            if speedLbl then
                local thr = SF.threats or 0
                speedLbl.Text = string.format("💨 %g · %s%d", SF.speed or 60, thr>0 and "⚠️" or "✅", thr)
                speedLbl.TextColor3 = thr>0 and C.YELLOW or C.MUTED
            end
        end)
    end

    SF._hud = hud
    return hud
end

function MV.Safe.SyncHud()
    pcall(function()
        local hud = MV.Safe._BuildHud()
        if hud then
            local should = (SF.on == true) and (SF.showHud ~= false)
            hud.Visible = should
            if should and SF._hudUpdate then SF._hudUpdate() end
        end
        if SF.on then
            local old = MV._hud
            if old then old.Visible = false end
        else
            pcall(function() MV.SyncHud() end)
        end
    end)
end

end   -- hết khối 🛡 BAY AN TOÀN (v4.18)

-- ---------- 🪩 THẢM KÍNH (chỉnh Rộng × Cao × Dài + khoảng cách tới chân) ----------
-- Có hai chế độ độc lập:
--   • SetCarpet: thảm bám dưới chân để tương thích API cũ.
--   • PlaceGlass: các tấm kính CỐ ĐỊNH, được lưu trong _placedGlasses và không bị
--     tấm mới ghi đè. UI dùng các record { id, part, position, size } bên dưới.
function MV.SetCarpetSize(w, h, l)
    MV.carpetW = mvClamp(w, 0.5, 100, MV.carpetW or 6)
    MV.carpetH = mvClamp(h, 0.1, 20, MV.carpetH or 0.5)
    MV.carpetL = mvClamp(l, 0.5, 100, MV.carpetL or 6)
    if MV._carpet and MV._carpet.Parent then
        pcall(function()
            MV._carpet.Size = Vector3.new(MV.carpetW, MV.carpetH, MV.carpetL)
            MV._MakeEdge(MV._carpet)
        end)
    end
    return MV.carpetW, MV.carpetH, MV.carpetL
end
function MV.SetCarpetGap(g)
    MV.carpetGap = mvClamp(g, -10, 50, MV.carpetGap or 0.2)
    return MV.carpetGap
end
function MV.FootY()
    local r = MV.Root()
    if not r then return nil end
    return r.Position.Y - 3.0
end
function MV._StopCarpet()
    if MV._carpet then pcall(function() MV._carpet:Destroy() end) end
    MV._carpet = nil
    MV.carpetY = nil
    pcall(function() RunService:UnbindFromRenderStep("Carpet") end)
end
function MV.CarpetHost()
    return workspace
end
function MV._MakeEdge(cp)
    if not cp then return end
    local old = nil
    pcall(function() old = cp:FindFirstChild("BC_GlassEdge") end)
    if not MV.carpetEdge then
        if old then pcall(function() old:Destroy() end) end
        return
    end
    if old then return end
    pcall(function()
        local edge = Instance.new("SelectionBox")
        edge.Name = "BC_GlassEdge"
        edge.Adornee = cp
        edge.LineThickness = 0.035
        edge.SurfaceTransparency = 1
        edge.Color3 = C.ACCENT
        edge.Parent = cp
    end)
end
function MV.SetCarpetEdge(on)
    MV.carpetEdge = (on == true)
    pcall(function() MV._MakeEdge(MV._carpet) end)
    for _, rec in ipairs(MV.GetPlacedGlasses and MV.GetPlacedGlasses() or {}) do
        pcall(function() MV._MakeEdge(rec.part) end)
    end
    return MV.carpetEdge
end
function MV.SetCarpetHold(on)
    MV.carpetHold = (on == true)
    return MV.carpetHold
end
function MV.SetCarpetSlack(n)
    MV.carpetSlack = mvClamp(n, 0, 50, MV.carpetSlack or 0.5)
    return MV.carpetSlack
end
function MV.CreateCarpet(y)
    local r = MV.Root()
    if not r then return nil end
    local cp = MV._carpet
    if not cp or not cp.Parent then
        pcall(function() if cp then cp:Destroy() end end)
        cp = New("Part", {
            Name = "BC_GlassCarpet_Follow",
            Size = Vector3.new(MV.carpetW or 6, MV.carpetH or 0.5, MV.carpetL or 6),
            Anchored = true, CanCollide = true, CanTouch = false,
            Material = Enum.Material.Glass, Color = Color3.fromRGB(116, 221, 255),
            Transparency = 0.42, Reflectance = 0.04, CastShadow = false,
        }, MV.CarpetHost())
        MV._carpet = cp
    end
    local hh = mvClamp(MV.carpetH, 0.1, 20, 0.5)
    local cy = tonumber(y)
    if cy == nil then
        cy = MV.carpetY
        if cy == nil then
            cy = (MV.FootY() or r.Position.Y - 3.0) - (MV.carpetGap or 0.2) - hh / 2
        end
    end
    MV.carpetY = cy
    pcall(function()
        cp.Size = Vector3.new(
            mvClamp(MV.carpetW, 0.5, 100, 6),
            hh,
            mvClamp(MV.carpetL, 0.5, 100, 6)
        )
        cp.CFrame = CFrame.new(r.Position.X, cy, r.Position.Z)
        cp.Anchored = true
        cp.CanCollide = true
        cp.CanTouch = false
        cp.Material = Enum.Material.Glass
        cp.Transparency = 0.42
        cp.Color = Color3.fromRGB(116, 221, 255)
        MV._MakeEdge(cp)
    end)
    return cp
end
function MV.SetCarpet(on)
    on = (on == true)
    if not on then
        MV.carpet = false
        MV._StopCarpet()
        MV._carpetRetries = 0
        pcall(function() if MV.SyncHud then MV.SyncHud() end end)
        return false
    end
    if not MV.Root() then
        return false, "chưa có nhân vật để tạo thảm"
    end
    MV.carpet = true
    MV._carpetRetries = 0
    MV.carpetY = nil
    local cp = MV.CreateCarpet()
    if not cp then
        MV.carpet = false
        return false, "không tạo được thảm kính"
    end
    pcall(function() RunService:UnbindFromRenderStep("Carpet") end)
    local okBind = pcall(function()
        RunService:BindToRenderStep("Carpet", Enum.RenderPriority.Character.Value + 1, function()
            if not MV.carpet then return end
            local root = MV.Root()
            if not root then return end
            if not MV._carpet or not MV._carpet.Parent then
                MV._carpetRetries = (MV._carpetRetries or 0) + 1
                if MV._carpetRetries <= 3 then
                    MV.CreateCarpet(MV.carpetY)
                end
                return
            end
            local y = MV.carpetY
            if y == nil then
                y = (MV.FootY() or root.Position.Y - 3.0) - (MV.carpetGap or 0.2) - (MV.carpetH or 0.5) / 2
                MV.carpetY = y
            end
            pcall(function() MV._carpet.CFrame = CFrame.new(root.Position.X, y, root.Position.Z) end)
        end)
    end)
    if not okBind then
        MV.SetCarpet(false)
        return false, "executor không bind được thảm kính"
    end
    pcall(function() if MV.SyncHud then MV.SyncHud() end end)
    return true
end

-- ---------- v4.24: ĐẶT KÍNH DƯỚI CHÂN (đặt nhiều tấm kính cố định) ----------
MV._placedGlasses = MV._placedGlasses or {}
MV._glassId = tonumber(MV._glassId) or 0
MV.autoGlass = MV.autoGlass == true
MV._lastGlassPos = MV._lastGlassPos or nil
MV.glassMax = mvClamp(MV.glassMax, 1, 1000, 250)
MV._autoGlassBound = MV._autoGlassBound == true

function MV._GlassPart(entry)
    if type(entry) == "table" then return entry.part or entry.Part end
    return entry
end
function MV._GlassRecord(entry, fallbackId)
    if type(entry) == "table" then
        local p = MV._GlassPart(entry)
        if p then
            entry.part = p
            entry.id = tonumber(entry.id) or fallbackId
            return entry
        end
        return nil
    end
    if entry then
        return { id = fallbackId, part = entry }
    end
    return nil
end
function MV._GlassChanged()
    local refresh = S.GlassRefreshList
    if type(refresh) ~= "function" then return end
    if MV._glassRefreshQueued then return end
    MV._glassRefreshQueued = true
    local function run()
        MV._glassRefreshQueued = false
        pcall(refresh)
    end
    if task and type(task.defer) == "function" then task.defer(run) else run() end
end
function MV._GlassPosition(root)
    root = root or MV.Root()
    if not root then return nil end
    local h = mvClamp(MV.carpetH, 0.1, 20, 0.5)
    local foot = MV.FootY() or (root.Position.Y - root.Size.Y / 2)
    return Vector3.new(
        root.Position.X,
        foot - mvClamp(MV.carpetGap, -10, 50, 0.2) - h / 2,
        root.Position.Z
    )
end
function MV._CreateGlassAt(pos)
    if not pos then return nil, "không có vị trí đặt kính" end
    local list = MV._placedGlasses
    if type(list) ~= "table" then
        list = {}
        MV._placedGlasses = list
    end
    if #list >= mvClamp(MV.glassMax, 1, 1000, 250) then
        return nil, "đã đạt giới hạn " .. tostring(MV.glassMax) .. " tấm kính"
    end
    MV._glassId = (tonumber(MV._glassId) or 0) + 1
    local id = MV._glassId
    local w = mvClamp(MV.carpetW, 0.5, 100, 6)
    local h = mvClamp(MV.carpetH, 0.1, 20, 0.5)
    local l = mvClamp(MV.carpetL, 0.5, 100, 6)
    local part = New("Part", {
        Name = string.format("BC_GlassCarpet_%03d", id),
        Size = Vector3.new(w, h, l), CFrame = CFrame.new(pos),
        Anchored = true, CanCollide = true, CanTouch = false,
        Material = Enum.Material.Glass, Color = Color3.fromRGB(116, 221, 255),
        Transparency = 0.42, Reflectance = 0.04, CastShadow = false,
    }, MV.CarpetHost())
    pcall(function()
        part:SetAttribute("BananaCatGlass", true)
        part:SetAttribute("BananaCatGlassId", id)
        part:SetAttribute("BananaCatGlassFixed", true)
    end)
    local rec = { id = id, part = part, position = pos, size = Vector3.new(w, h, l), createdAt = os.clock() }
    table.insert(list, rec)
    MV._MakeEdge(part)
    return rec
end
function MV._RecoverPlacedGlasses()
    if type(MV._placedGlasses) ~= "table" then MV._placedGlasses = {} end
    local recovered = {}
    local ok, children = pcall(function() return workspace:GetChildren() end)
    if not ok or type(children) ~= "table" then return 0 end
    for _, child in ipairs(children) do
        local idText = nil
        pcall(function()
            if child:IsA("BasePart") then idText = tostring(child.Name):match("^BC_GlassCarpet_(%d+)$") end
        end)
        local id = tonumber(idText)
        if id then
            recovered[#recovered + 1] = { id = id, part = child, position = child.Position, size = child.Size }
            if id > (tonumber(MV._glassId) or 0) then MV._glassId = id end
            pcall(function() MV._MakeEdge(child) end)
        end
    end
    table.sort(recovered, function(a, b) return (a.id or 0) < (b.id or 0) end)
    for _, rec in ipairs(recovered) do table.insert(MV._placedGlasses, rec) end
    return #recovered
end
if type(MV._placedGlasses) ~= "table" then MV._placedGlasses = {} end
if #MV._placedGlasses == 0 then pcall(MV._RecoverPlacedGlasses) end

function MV.PlaceGlass(silent)
    local root = MV.Root()
    if not root then return false, "chưa có nhân vật để đặt kính" end
    local pos = MV._GlassPosition(root)
    local rec, err = MV._CreateGlassAt(pos)
    if not rec then return false, err end
    MV._lastGlassPos = root.Position
    if not silent then MV._GlassChanged() end
    return true, rec.part, rec
end
function MV.ClearPlacedGlasses()
    pcall(function() if MV.StopGlassFly then MV.StopGlassFly() end end)
    if MV.autoGlass then pcall(function() MV.SetAutoGlass(false) end) end
    local n = 0
    if type(MV._placedGlasses) == "table" then
        for _, entry in ipairs(MV._placedGlasses) do
            local part = MV._GlassPart(entry)
            if part and part.Parent then
                pcall(function() part:Destroy() end)
                n = n + 1
            end
        end
    end
    MV._placedGlasses = {}
    MV._lastGlassPos = nil
    MV._GlassChanged()
    return n
end
function MV.RemoveGlassAt(idx)
    local n = math.floor(tonumber(idx) or 0)
    if n < 1 or type(MV._placedGlasses) ~= "table" then return false, "không tìm thấy tấm kính" end
    local entry = MV._placedGlasses[n]
    if not entry then return false, "không tìm thấy tấm kính" end
    local part = MV._GlassPart(entry)
    if MV._glassFlyTarget == entry or MV._glassFlyIdx == n then
        pcall(function() MV.StopGlassFly() end)
    end
    table.remove(MV._placedGlasses, n)
    if part and part.Parent then pcall(function() part:Destroy() end) end
    MV._GlassChanged()
    return true, part, entry
end
function MV.RemoveGlass(part)
    if not part or type(MV._placedGlasses) ~= "table" then return false, "không tìm thấy tấm kính" end
    for i, entry in ipairs(MV._placedGlasses) do
        if MV._GlassPart(entry) == part then return MV.RemoveGlassAt(i) end
    end
    return false, "không tìm thấy tấm kính"
end
function MV.GetPlacedGlasses()
    local out = {}
    if type(MV._placedGlasses) ~= "table" then MV._placedGlasses = {} end
    for i = #MV._placedGlasses, 1, -1 do
        local old = MV._placedGlasses[i]
        local rec = MV._GlassRecord(old, i)
        local part = rec and rec.part
        if not part or not part.Parent then
            table.remove(MV._placedGlasses, i)
        else
            rec.position = part.Position
            rec.size = part.Size
            out[i] = rec
        end
    end
    local compact = {}
    for i = 1, #MV._placedGlasses do
        local rec = MV._GlassRecord(MV._placedGlasses[i], i)
        if rec and rec.part and rec.part.Parent then compact[#compact + 1] = rec end
    end
    if #compact ~= #MV._placedGlasses then MV._placedGlasses = compact end
    return compact
end
function MV.SetAutoGlass(on)
    local want = (on == true)
    MV.autoGlass = want
    if not want then
        MV._autoGlassBound = false
        pcall(function() RunService:UnbindFromRenderStep("BC_AutoGlass") end)
        MV._GlassChanged()
        return false
    end
    if not MV._autoGlassBound then
        local ok = pcall(function()
            RunService:BindToRenderStep("BC_AutoGlass", Enum.RenderPriority.Camera.Value - 5, function()
                pcall(function()
                    local root = MV.Root()
                    if root then MV._AutoGlassTick(root.Position) end
                end)
            end)
        end)
        MV._autoGlassBound = ok
    end
    local root = MV.Root()
    if root then pcall(function() MV._AutoGlassTick(root.Position) end) end
    MV._GlassChanged()
    return MV.autoGlass
end
function MV._AutoGlassTick(curPos)
    if not MV.autoGlass or not curPos then return false end
    local last = MV._lastGlassPos
    local w = mvClamp(MV.carpetW, 0.5, 100, 6)
    local l = mvClamp(MV.carpetL, 0.5, 100, 6)
    local step = mvClamp(math.min(w, l) * 0.65, 1, 100, 3)
    if last then
        local dx, dz = curPos.X - last.X, curPos.Z - last.Z
        if dx * dx + dz * dz < step * step then return false end
    end
    local ok = MV.PlaceGlass(true)
    if ok then
        MV._lastGlassPos = curPos
        MV._GlassChanged()
        return true
    end
    return false
end

-- ---------- v4.27: BAY TỚI TẤM KÍNH (đổi đặt kính thành bay tới kính, chỉnh được tốc độ) ----------
MV.glassFlySpeed = mvClamp(MV.glassFlySpeed, 1, 2000, 60)
MV._glassFlyTarget = MV._glassFlyTarget or nil
MV._glassFlyActive = MV._glassFlyActive == true
MV._glassFlyIdx = MV._glassFlyIdx or nil
MV._glassFlyBV = MV._glassFlyBV or nil
MV._glassFlyBG = MV._glassFlyBG or nil
MV._glassFlyNcPrev = MV._glassFlyNcPrev or nil
MV._glassFlyHum = MV._glassFlyHum or nil
MV._glassFlyPlatformStandPrev = MV._glassFlyPlatformStandPrev
MV._glassFlyAutoRotatePrev = MV._glassFlyAutoRotatePrev

function MV.SetGlassFlySpeed(n)
    local v = tonumber(n)
    if v == nil or v ~= v then return false, "nhập tốc độ bay 1-2000" end
    MV.glassFlySpeed = mvClamp(v, 1, 2000, MV.glassFlySpeed or 60)
    return true, MV.glassFlySpeed
end
function MV._EnsureGlassFlyBV()
    local r = MV.Root()
    if not r then return nil, nil end
    if MV._glassFlyBV and MV._glassFlyBV.Parent == r and MV._glassFlyBG and MV._glassFlyBG.Parent == r then
        local h = MV.Hum()
        if h and MV._glassFlyHum ~= h then
            MV._glassFlyHum = h
            pcall(function() MV._glassFlyPlatformStandPrev = h.PlatformStand end)
            pcall(function() MV._glassFlyAutoRotatePrev = h.AutoRotate end)
            pcall(function() h.PlatformStand = true; h.AutoRotate = false end)
        end
        return MV._glassFlyBV, MV._glassFlyBG
    end
    pcall(function() if MV._glassFlyBV then MV._glassFlyBV:Destroy() end end)
    pcall(function() if MV._glassFlyBG then MV._glassFlyBG:Destroy() end end)
    MV._glassFlyBV, MV._glassFlyBG = nil, nil
    local bv = New("BodyVelocity", {
        Name = "BC_GlassFlyVel", MaxForce = Vector3.new(1e9, 1e9, 1e9), Velocity = Vector3.new(0, 0, 0)
    }, r)
    local bg = New("BodyGyro", {
        Name = "BC_GlassFlyGyro", MaxTorque = Vector3.new(1e9, 1e9, 1e9), P = 1e4, D = 50
    }, r)
    MV._glassFlyBV, MV._glassFlyBG = bv, bg
    local h = MV.Hum()
    if h then
        MV._glassFlyHum = h
        pcall(function() MV._glassFlyPlatformStandPrev = h.PlatformStand end)
        pcall(function() MV._glassFlyAutoRotatePrev = h.AutoRotate end)
        pcall(function() h.PlatformStand = true; h.AutoRotate = false end)
    end
    return bv, bg
end
function MV.StopGlassFly()
    MV._glassFlyActive = false
    MV._glassFlyTarget = nil
    MV._glassFlyIdx = nil
    pcall(function() RunService:UnbindFromRenderStep("BC_GlassFly") end)
    pcall(function() if MV._glassFlyBV then MV._glassFlyBV:Destroy() end end)
    pcall(function() if MV._glassFlyBG then MV._glassFlyBG:Destroy() end end)
    MV._glassFlyBV, MV._glassFlyBG = nil, nil
    local h = MV._glassFlyHum
    local safeOn = MV.Safe and MV.Safe.on == true
    if h and h.Parent and not MV.fly and not MV._playerFlyActive and not safeOn then
        if MV._glassFlyPlatformStandPrev ~= nil then pcall(function() h.PlatformStand = MV._glassFlyPlatformStandPrev end) end
        if MV._glassFlyAutoRotatePrev ~= nil then pcall(function() h.AutoRotate = MV._glassFlyAutoRotatePrev end) end
    end
    MV._glassFlyHum = nil
    MV._glassFlyPlatformStandPrev = nil
    MV._glassFlyAutoRotatePrev = nil
    if MV._glassFlyNcPrev ~= nil then
        local was = MV._glassFlyNcPrev
        MV._glassFlyNcPrev = nil
        local safeOwnsNoclip = safeOn and MV.Safe.noclip == true
        if not MV._playerFlyActive and not safeOwnsNoclip then
            pcall(function() MV.SetNoclip(was) end)
        end
    end
    return true
end
function MV._GlassFlyStep(dt)
    if not MV._glassFlyActive then return end
    local rec = MV._glassFlyTarget
    local part = MV._GlassPart(rec)
    if not part or not part.Parent then
        MV.StopGlassFly()
        MV._GlassChanged()
        return
    end
    local root = MV.Root()
    if not root then return end -- respawn: giữ mục tiêu, Refresh/khung sau sẽ gắn lực vào root mới
    local topY = part.Position.Y + part.Size.Y / 2
    local want = Vector3.new(part.Position.X, topY + 3.2, part.Position.Z)
    local pos = root.Position
    local dx, dy, dz = want.X - pos.X, want.Y - pos.Y, want.Z - pos.Z
    local dist = math.sqrt(dx * dx + dy * dy + dz * dz)
    if dist <= 0.75 then
        pcall(function() root.CFrame = CFrame.new(want) end)
        MV.StopGlassFly()
        return
    end
    local speed = mvClamp(MV.glassFlySpeed, 1, 2000, 60)
    if dist < 2 then speed = math.max(4, speed * 0.15)
    elseif dist < 5 then speed = math.max(8, speed * 0.45) end
    pcall(function() MV.SetNoclip(true) end)
    local bv, bg = MV._EnsureGlassFlyBV()
    local dir = Vector3.new(dx / dist, dy / dist, dz / dist)
    if bv then bv.Velocity = dir * speed end
    local horizontal = Vector3.new(want.X - pos.X, 0, want.Z - pos.Z)
    if bg and horizontal.Magnitude > 0.05 then
        pcall(function() bg.CFrame = CFrame.new(pos, Vector3.new(want.X, pos.Y, want.Z)) end)
    end
    if not bv then
        local step = math.min(dist, speed * (tonumber(dt) or 0.05))
        pcall(function() root.CFrame = CFrame.new(pos + dir * step) end)
    end
end
function MV.NearestGlassIndex()
    local root = MV.Root()
    if not root then return nil end
    local best, bestD = nil, math.huge
    for i, rec in ipairs(MV.GetPlacedGlasses()) do
        local part = MV._GlassPart(rec)
        if part and part.Parent then
            local d = (part.Position - root.Position).Magnitude
            if d < bestD then best, bestD = i, d end
        end
    end
    return best
end
function MV.FlyToGlass(idx)
    local list = MV.GetPlacedGlasses()
    local n = math.floor(tonumber(idx) or 0)
    local rec = (n >= 1 and list[n]) or nil
    if not rec and n > 0 then
        for i, item in ipairs(list) do
            if tonumber(item.id) == n then rec, n = item, i break end
        end
    end
    if not rec then return false, "không tìm thấy tấm kính" end
    if not MV.Root() then return false, "chưa có nhân vật để bay" end
    if MV.fly then pcall(function() MV.SetFly(false) end) end
    if MV._playerFlyActive then pcall(function() MV.StopPlayerFly() end) end
    if MV._glassFlyNcPrev == nil and (not MV.Safe or MV.Safe.noclip ~= true) then
        MV._glassFlyNcPrev = MV.noclip == true
    end
    MV._glassFlyTarget = rec
    MV._glassFlyIdx = n
    MV._glassFlyActive = true
    pcall(function() MV.SetNoclip(true) end)
    pcall(function() MV._EnsureGlassFlyBV() end)
    pcall(function() RunService:UnbindFromRenderStep("BC_GlassFly") end)
    local okBind = pcall(function()
        RunService:BindToRenderStep("BC_GlassFly", Enum.RenderPriority.Camera.Value - 1, function(dt)
            pcall(MV._GlassFlyStep, dt)
        end)
    end)
    if not okBind then
        MV.StopGlassFly()
        return false, "executor không bind được bay tới kính"
    end
    pcall(MV._Watchdog)
    return true, rec
end

-- ---------- v4.28: BAY TỚI NGƯỜI CHƠI (xuyên tường, chỉnh tốc độ, 0=auto lấy tốc độ game) ----------
MV.playerFlySpeed = MV.playerFlySpeed or 0
MV._playerFlyTarget = MV._playerFlyTarget or nil
MV._playerFlyActive = MV._playerFlyActive or false
MV._playerFlyPos = MV._playerFlyPos or nil
MV._playerFlyBV = MV._playerFlyBV or nil
MV._playerFlyBG = MV._playerFlyBG or nil
MV._playerFlyNcPrev = MV._playerFlyNcPrev or nil

function MV.SetPlayerFlySpeed(n)
    local v = tonumber(n)
    if v == nil then return false, "nhập số 0-500 (0=auto)" end
    if v == 0 then
        MV.playerFlySpeed = 0
        return true, 0
    end
    MV.playerFlySpeed = mvClamp(v, 1, 500, MV.playerFlySpeed or 0)
    return true, MV.playerFlySpeed
end

function MV.GetPlayerFlySpeed()
    local s = tonumber(MV.playerFlySpeed) or 0
    if s == 0 then
        local base = tonumber(MV._baseWS) or 16
        local flySp = tonumber(MV.flySpeed) or 60
        if MV._playerFlyActive or MV.fly then
            return flySp
        else
            return base > 0 and base or 16
        end
    end
    return s
end

function MV._EnsurePlayerFlyBV()
    local r = MV.Root()
    if not r then return nil, nil end
    if MV._playerFlyBV and MV._playerFlyBV.Parent == r then
        return MV._playerFlyBV, MV._playerFlyBG
    end
    pcall(function() if MV._playerFlyBV then MV._playerFlyBV:Destroy() end end)
    pcall(function() if MV._playerFlyBG then MV._playerFlyBG:Destroy() end end)
    local bv = New("BodyVelocity", { Name = "BC_PlayerFlyVel", MaxForce = Vector3.new(1e9, 1e9, 1e9), Velocity = Vector3.new(0,0,0) }, r)
    local bg = New("BodyGyro", { Name = "BC_PlayerFlyGyro", MaxTorque = Vector3.new(1e9, 1e9, 1e9), P = 1e4, D = 50 }, r)
    MV._playerFlyBV, MV._playerFlyBG = bv, bg
    local h = MV.Hum()
    if h then
        pcall(function() h.PlatformStand = true end)
        pcall(function() h.AutoRotate = false end)
    end
    return bv, bg
end

function MV.StopPlayerFly()
    MV._playerFlyActive = false
    MV._playerFlyTarget = nil
    MV._playerFlyPos = nil
    pcall(function() RunService:UnbindFromRenderStep("BC_PlayerFly") end)
    pcall(function() if MV._playerFlyBV then MV._playerFlyBV:Destroy() end end)
    pcall(function() if MV._playerFlyBG then MV._playerFlyBG:Destroy() end end)
    MV._playerFlyBV, MV._playerFlyBG = nil, nil
    if not MV.fly then
        local h = MV.Hum()
        if h then
            pcall(function() h.PlatformStand = false end)
            pcall(function() h.AutoRotate = true end)
        end
    end
    if MV._playerFlyNcPrev ~= nil then
        local was = MV._playerFlyNcPrev
        MV._playerFlyNcPrev = nil
        local stillFlying = (MV.Safe and MV.Safe.on == true)
        if not stillFlying then
            if was == false then
                pcall(function() MV.SetNoclip(false) end)
            end
        end
    end
    return true
end

function MV._PlayerFlyStep(dt)
    if not MV._playerFlyActive then return end
    local targetPlayer = MV._playerFlyTarget
    if not targetPlayer or not targetPlayer.Parent then
        MV.StopPlayerFly()
        return
    end
    local c, r = nil, nil
    pcall(function()
        local char = targetPlayer.Character
        if char then
            r = char:FindFirstChild("HumanoidRootPart")
            c = char
        end
    end)
    if not r then
        return
    end
    local myRoot = MV.Root()
    if not myRoot then
        MV.StopPlayerFly()
        return
    end
    local want = r.Position + Vector3.new(0, 3.5, 0)
    MV._playerFlyPos = want
    local pos = myRoot.Position
    local dx = want.X - pos.X
    local dy = want.Y - pos.Y
    local dz = want.Z - pos.Z
    local dist = math.sqrt(dx*dx + dy*dy + dz*dz)
    local speed = tonumber(MV.GetPlayerFlySpeed()) or 16
    local close = dist < 2
    if close then
        speed = math.max(2, speed * 0.15)
    elseif dist < 3.5 then
        speed = math.max(6, speed * 0.45)
    end
    MV.SetNoclip(true)                       -- ⚡ v4.34: gọi thẳng (hàm nội bộ, đã tự bọc pcall)
    local bv, bg = MV._EnsurePlayerFlyBV()
    local dir = Vector3.zero
    if dist > 0.1 then
        dir = Vector3.new(dx / dist, dy / dist, dz / dist)
    end
    if bv then
        if close then
            local targetVel = (r and r.Velocity) or Vector3.new(0, 0, 0)
            bv.Velocity = targetVel + dir * speed
        else
            bv.Velocity = dir * speed
        end
    end
    if bg then
        bg.CFrame = CFrame.new(pos, Vector3.new(want.X, pos.Y, want.Z))
    end
    if not bv and dist > 0.1 then
        local step = math.min(dist, speed * (tonumber(dt) or 0.05))
        myRoot.CFrame = CFrame.new(pos.X + dir.X * step, pos.Y + dir.Y * step, pos.Z + dir.Z * step)
    end
end

function MV.FlyToPlayer(p)
    if not p or not p.Parent then return false, "người chơi không tồn tại" end
    if p == player then return false, "không thể bay tới chính mình" end
    if not MV.Root() then return false, "chưa có nhân vật" end
    if MV.fly then MV.SetFly(false) end
    if MV._playerFlyNcPrev == nil and (not MV.Safe or MV.Safe._ncPrev == nil) then
        MV._playerFlyNcPrev = MV.noclip == true
    end
    MV._playerFlyTarget = p
    MV._playerFlyActive = true
    MV._playerFlyPos = nil
    pcall(function() MV.SetNoclip(true) end)
    pcall(function() MV._EnsurePlayerFlyBV() end)
    pcall(function() RunService:UnbindFromRenderStep("BC_PlayerFly") end)
    pcall(function()
        RunService:BindToRenderStep("BC_PlayerFly", Enum.RenderPriority.Camera.Value - 1, function(dt)
            pcall(MV._PlayerFlyStep, dt)
        end)
    end)
    MV._Watchdog()
    return true, p
end

-- ---------- ⬆⬇ nâng/hạ: thảm thì đổi độ cao, bay thì đẩy người ----------
function MV.Nudge(dy)
    if MV.carpet then
        MV.carpetY = (MV.carpetY or MV.FootY() or 0) + dy
        return true, "thảm"
    elseif MV.fly then
        local r = MV.Root()
        if r then r.CFrame = CFrame.new(r.Position.X, r.Position.Y + dy, r.Position.Z) end
        return true, "bay"
    end
    return false, nil
end

-- ---------- HUD: cụm nút NỔI TRÊN MÀN HÌNH GAME (⬆ 🪩 ⬇ ✕) ----------
function MV._HudNudge(dy)
    local ok, what = MV.Nudge(dy)
    MV._HudSay(ok and ((dy > 0 and "⬆ nâng " or "⬇ hạ ") .. tostring(what) .. " 2.5")
                   or "⬆⬇ bật Bay trước đã")
end
function MV._BuildHud()
    if MV._hud then return MV._hud end
    local hud = New("Frame", {
        Name = "BC_MoveHud",
        Size = UDim2.new(0, 180, 0, 160), Position = UDim2.new(1, -190, 0.5, -80),
        BackgroundTransparency = 1, Visible = false, ZIndex = 20,
    }, gui)
    local function obtn(txt, y, size, color, cb)
        local b = New("TextButton", {
            Size = UDim2.new(0, size, 0, size), Position = UDim2.new(0.5, -size / 2, 0, y),
            Text = txt, BackgroundColor3 = color or C.BLUE, BackgroundTransparency = 0.3,
            TextColor3 = C.WHITE, Font = Enum.Font.GothamBold, TextSize = 20,
            BorderSizePixel = 0, ZIndex = 21,
        }, hud)
        Corner(b, UDim.new(1, 0))
        Stroke(b, C.WHITE, 2)
        b.Activated:Connect(function() pcall(cb) end)
        return b
    end
    MV._hudCarpet = nil -- [REMOVED] tham kinh
    MV._hudUp   = obtn("⬆", 60,  50, Color3.fromRGB(0, 150, 0),   function() MV._HudNudge(2.5) end)
    MV._hudDown = obtn("⬇", 120, 50, Color3.fromRGB(150, 0, 0),   function() MV._HudNudge(-2.5) end)
    MV._hudClose = New("TextButton", {
        Size = UDim2.new(0, 34, 0, 34), Position = UDim2.new(1, -44, 0, 10),
        Text = "✕", BackgroundColor3 = C.RED, BackgroundTransparency = 0.3,
        TextColor3 = C.WHITE, Font = Enum.Font.GothamBold, TextSize = 18,
        BorderSizePixel = 0, ZIndex = 21,
    }, hud)
    Corner(MV._hudClose, UDim.new(1, 0))
    Stroke(MV._hudClose, C.WHITE, 2)
    MV._hudClose.Activated:Connect(function()
        MV.SetRunMode(false)
        MV._HudSay("🛑 đã tắt chế độ chạy trên thảm")
    end)
    MV._hud = hud
    return hud
end
function MV._HudSay(msg)
    pcall(function() if D.hubStatus then D.hubStatus.Text = msg end end)
end
function MV.SyncHud()
    pcall(function()
        local hud = MV._BuildHud()
        local safeOn = (MV.Safe and MV.Safe.on == true)
        local on = (MV.fly or MV.runMode)
        if safeOn or MV.fly then on = false end -- 🚀 dùng HUD điều khiển tay, 🪩/🏃 giữ HUD cũ
        hud.Visible = (on == true)
        if MV._hudCarpet then                       -- xám như bản gốc, XANH khi thảm đang bật
            MV._hudCarpet.BackgroundColor3 = MV.carpet and C.GREEN or C.GRAY
        end
    end)
    if MV.SyncFlyHud then MV.SyncFlyHud() end
end

-- ---------- 🏃 CHẠY TRÊN THẢM = "🕹️ BAY CHẠY BỘ" của aiaiaitao3 (v4.12.4: GIỐNG 100%) ----------
function MV.SetRunMode(on)
    MV.runMode = false
    pcall(function() if main then main.Visible = true end end)
    pcall(function() if togBtn then togBtn.Text = (main and main.Visible) and "✕" or "" end end)
    MV._menuWasOpen = nil
    MV.SyncHud()
    return false, "tinh nang chay tren tham da bi xoa"
end

-- ---------- tắt hết / khôi phục sau respawn / tóm tắt trạng thái ----------
function MV.StopAll()
    pcall(function() if S.Free and S.Free.Stop then S.Free.Stop() end end)
    if MV.Safe and MV.Safe.on then pcall(function() MV.Safe.Stop() end) end
    pcall(function() MV.StopGlassFly() end)
    pcall(function() MV.StopPlayerFly() end)
    MV.SetFly(false)
    MV.SetCarpet(false)
    MV.SetNoclip(false)
    MV.SetInfJump(false)
    MV.SetHighJump(false)    -- v4.38: tắt 🦘 nhảy cao
    MV.SetSpeed(false)
    MV.SetSprint(false)      -- v4.37: tắt 💨 tốc độ theo camera
    MV.SetRunMode(false)     -- v4.12: thoát cả chế độ chạy trên thảm (trả menu + ẩn HUD)
    MV._Watchdog()
    MV.SyncHud()
    pcall(function() if MV.Safe and MV.Safe.SyncHud then MV.Safe.SyncHud() end end)
end
S.MoveActionState = {
    fly     = function() return S.Move.fly     end,
    noclip  = function() return S.Move.noclip  end,
    infjump = function() return S.Move.infJump end,
    highjump= function() return S.Move.highJump end,
    speed   = function() return S.Move.speed   end,
    camspeed= function() return S.Move.sprint  end,
    carpet  = function() return S.Move.carpet  end,
    runmode = function() return S.Move.runMode end,
    loc_all  = function() return S.Loc and S.Loc.on   end,
    loc_solo = function() return S.Loc and S.Loc.solo end,
    spec_on  = function() return S.Spec and S.Spec.on   end,
    glow     = function() return S.Glow and S.Glow.on   end,
    freecam  = function() return S.Free and S.Free.on end,
    safefly  = function() return S.Move.Safe and S.Move.Safe.on end,
}

function MV.Refresh()
    MV._NcForgetLost()      -- v4.22: chỉ quên part đã mất (giữ giá trị gốc của part đang bật 🧱)
    if MV.speed then MV.ApplyChar() end -- không ép tốc độ mặc định nếu chỉ đang bay
    if MV.noclip then MV._NcStep() end
    if MV.fly then
        MV._EnsureFly()
        MV._BindFly()
    end
    if MV.sprint then
        MV._EnsureSpeed()
        MV._BindSpeed()
    end
    if MV.highJump then
        pcall(MV._HighJumpApplyPower)
        pcall(MV._HighJumpBind)
    end
    if MV.Safe and MV.Safe.on then pcall(MV.Safe.Step, 0.05) end     -- v4.23: 🛡 tự chữa lành sau respawn
    if MV._glassFlyActive then pcall(MV._EnsureGlassFlyBV) end       -- giữ mục tiêu qua respawn
    if MV.autoGlass and not MV._autoGlassBound then pcall(MV.SetAutoGlass, true) end
    MV.SyncHud()
    pcall(function() if MV.Safe and MV.Safe.SyncHud then MV.Safe.SyncHud() end end)
end
function MV.Status()
    local t = {}
    if MV.fly then t[#t + 1] = string.format("🚀 bay %d", MV.flySpeed) end
    if MV.noclip then t[#t + 1] = "🧱 xuyên tường" end
    if MV.infJump then t[#t + 1] = "🦘 nhảy vô hạn" end
    if MV.highJump then t[#t + 1] = string.format("🦘 nhảy cao %d", MV.highJumpSpeed) end
    if MV.sprint then t[#t + 1] = string.format("💨 tốc độ %d", MV.sprintSpeed) end
    if MV.speed then
        if MV.speedMode == "x" then
            t[#t + 1] = string.format("👟 chạy ×%g (game %g)", MV.speedMul, MV._baseWS or 16)
        else
            t[#t + 1] = string.format("👟 chạy %g", MV.walkSpeed)
        end
    end
    if MV._playerFlyActive then
        local pn = MV._playerFlyTarget and tostring(MV._playerFlyTarget.Name) or "?"
        local sp = MV.GetPlayerFlySpeed and MV.GetPlayerFlySpeed() or (MV.playerFlySpeed or 0)
        if (tonumber(MV.playerFlySpeed) or 0) == 0 then
            t[#t + 1] = string.format("🚀 bay tới người %s (auto %g)", pn, sp)
        else
            t[#t + 1] = string.format("🚀 bay tới người %s %g", pn, sp)
        end
    end
    local glassCount = 0
    pcall(function() glassCount = #MV.GetPlacedGlasses() end)
    if glassCount > 0 then t[#t + 1] = "🧱 kính " .. tostring(glassCount) .. " tấm" end
    if MV._glassFlyActive then
        local targetId = MV._glassFlyTarget and MV._glassFlyTarget.id or "?"
        t[#t + 1] = "🚀 bay tới kính #" .. tostring(targetId)
    end
    if #t == 0 then return "🚶 di chuyển: đang TẮT hết" end
    return "🚶 đang BẬT: " .. table.concat(t, " · ")
end
trackConn(player.CharacterAdded:Connect(function()
    task.spawn(function()
        task.wait(0.3)
        pcall(MV.Refresh)
    end)
end))

-- ---------- v4.6.3: NHÓM TÍNH NĂNG 🌐 SERVER (Reset · Hop · Lấy mã · Vào theo mã) ----------
function S.GetJobId()
    local id = game.JobId
    if id == nil then return nil end
    id = tostring(id)
    if id == "" then return nil end
    return id
end

function S.CopyToClipboard(text)
    for _, name in ipairs({"setclipboard", "toclipboard", "set_clipboard"}) do
        local fn = S.GetGlobal(name)
        if type(fn) == "function" and not S.Shimmed(name) then
            local ok, result = pcall(fn, tostring(text))
            if ok and result ~= false then return true end
        end
    end
    S.clipboardTxt = tostring(text) -- chỉ giữ bản sao trong RAM; KHÔNG báo đã copy thật
    return false
end

function S.FetchServers(cursor)
    local url = "https://games.roblox.com/v1/games/" .. tostring(game.PlaceId)
             .. "/servers/Public?sortOrder=Asc&limit=100"
    if cursor and cursor ~= "" then url = url .. "&cursor=" .. tostring(cursor) end
    local raw = game:HttpGet(url)
    local data = HttpService:JSONDecode(raw)
    if type(data) ~= "table" then return {}, nil end
    return (type(data.data) == "table" and data.data or {}), data.nextPageCursor
end

function S.ResetServer()
    local me = S.GetJobId()
    if me then
        TeleportService:TeleportToPlaceInstance(game.PlaceId, me, player)
        return "🔄 Đang vào lại ĐÚNG server này: " .. me .. " (giữ nguyên người chơi cùng server)..."
    end
    TeleportService:Teleport(game.PlaceId, player)
    return "🔄 Không đọc được mã server (Studio/server đơn) → đang nạp lại game..."
end

function S.JoinServer(jobId)
    TeleportService:TeleportToPlaceInstance(game.PlaceId, tostring(jobId), player)
end

function S.HopServer()
    local me = tostring(S.GetJobId() or "")
    local cand, cursor = {}, ""
    for _ = 1, 3 do
        local list, nextCursor = S.FetchServers(cursor)
        for _, sv in ipairs(list) do
            local sid = (sv and sv.id) and tostring(sv.id) or nil
            local playing = tonumber(sv and sv.playing) or 0
            local maxp = tonumber(sv and sv.maxPlayers) or 0
            if sid and sid ~= me and (maxp <= 0 or playing < maxp) then
                cand[#cand + 1] = {id = sid, playing = playing, maxPlayers = maxp}
            end
        end
        if #cand > 0 then break end                        -- có ứng viên rồi thì khỏi lật trang
        if not nextCursor or nextCursor == "" then break end
        cursor = nextCursor
    end
    if #cand == 0 then
        return "⚠️ Không tìm thấy server nào còn chỗ trống (hoặc game này không cho xem danh sách server)"
    end
    local pick = cand[math.random(1, #cand)]
    S.JoinServer(pick.id)
    return "🔀 Đang nhảy sang server " .. pick.id .. " (" .. pick.playing .. "/" .. pick.maxPlayers
        .. " người) · tìm được " .. #cand .. " server khác để chọn, đã bỏ qua server hiện tại"
end


function S.HopLowServer()
    local me = tostring(S.GetJobId() or "")
    local cand, cursor = {}, ""
    local pages = 0
    local maxPages = 8 -- quét 800 server để tìm server vắng nhất
    for _ = 1, maxPages do
        pages = pages + 1
        local ok, list, nextCursor = pcall(function() return S.FetchServers(cursor) end)
        if not ok then
            -- nếu lỗi http, thử lại 1 lần
            task.wait(0.3)
            ok, list, nextCursor = pcall(function() return S.FetchServers(cursor) end)
        end
        if not ok or type(list) ~= "table" then break end
        for _, sv in ipairs(list) do
            local sid = (sv and sv.id) and tostring(sv.id) or nil
            local playing = tonumber(sv and sv.playing) or 0
            local maxp = tonumber(sv and sv.maxPlayers) or 0
            if sid and sid ~= me and (maxp <= 0 or playing < maxp) then
                -- chỉ lấy server còn chỗ và không phải server hiện tại
                cand[#cand + 1] = {id = sid, playing = playing, maxPlayers = maxp}
            end
        end
        if not nextCursor or nextCursor == "" then break end
        cursor = nextCursor
        task.wait(0.15) -- tránh spam api
    end
    if #cand == 0 then
        return "⚠️ Không tìm thấy server nào còn chỗ trống (đã quét "..pages.." trang)"
    end
    -- sắp xếp theo số người chơi tăng dần (ít người nhất lên đầu)
    table.sort(cand, function(a,b) return (a.playing or 0) < (b.playing or 0) end)
    local minPlay = cand[1].playing
    -- lấy tất cả server có số người = minPlay (hoặc chênh lệch 1) để random cho đỡ trùng
    local best = {}
    for _, sv in ipairs(cand) do
        if sv.playing <= minPlay + 1 then
            best[#best+1] = sv
        else
            break
        end
    end
    local pick = best[math.random(1, #best)]
    S.JoinServer(pick.id)
    return "🔀 [ÍT NGƯỜI] Đang nhảy sang server " .. pick.id .. " (" .. pick.playing .. "/" .. pick.maxPlayers .. " người) · đã quét " .. #cand .. " server qua " .. pages .. " trang, vắng nhất " .. minPlay .. " người"
end

function S.HopEmptyServer()
    local me = tostring(S.GetJobId() or "")
    local cand, cursor = {}, ""
    local pages = 0
    local maxPages = 10
    for _ = 1, maxPages do
        pages = pages + 1
        local ok, list, nextCursor = pcall(function() return S.FetchServers(cursor) end)
        if not ok then
            task.wait(0.3)
            ok, list, nextCursor = pcall(function() return S.FetchServers(cursor) end)
        end
        if not ok or type(list) ~= "table" then break end
        for _, sv in ipairs(list) do
            local sid = (sv and sv.id) and tostring(sv.id) or nil
            local playing = tonumber(sv and sv.playing) or 0
            local maxp = tonumber(sv and sv.maxPlayers) or 0
            if sid and sid ~= me and (maxp <= 0 or playing < maxp) and playing <= 3 then
                cand[#cand + 1] = {id = sid, playing = playing, maxPlayers = maxp}
            end
        end
        if #cand >= 5 then break end -- đủ 5 server vắng thì dừng sớm
        if not nextCursor or nextCursor == "" then break end
        cursor = nextCursor
        task.wait(0.15)
    end
    if #cand == 0 then
        -- fallback sang HopLowServer nếu không có server siêu vắng
        return S.HopLowServer()
    end
    table.sort(cand, function(a,b) return (a.playing or 0) < (b.playing or 0) end)
    local pick = cand[math.random(1, #cand)]
    S.JoinServer(pick.id)
    return "🔀 [SIÊU VẮNG ≤3] Đang nhảy sang server " .. pick.id .. " (" .. pick.playing .. "/" .. pick.maxPlayers .. " người) · tìm thấy " .. #cand .. " server vắng qua " .. pages .. " trang"
end


-- ---------- 🔐 ANTI BAN (v4.43) ----------
S.AntiBan = S.AntiBan or {
    on = (_G.BananaCatHub_AntiBan == true),
    busy = false, lastHop = 0, cooldown = 10, hops = 0,
    lastReason = "", armed = false, snaps = 0, snapAt = 0,
    conns = {}, _unhookKick = nil,
}

function S.AntiBanIsMsg(msg)
    local s = string.lower(tostring(msg or ""))
    if s == "" then return false end
    local keys = {
        "you have been banned", "you have been kicked", "you've been banned", "you've been kicked",
        "banned from this", "kicked from this", "exploit detected", "cheat detected",
        "cheats detected", "anti-cheat", "anticheat", "kicked by", "banned by",
        "you are banned", "account banned", "game banned", "server banned", "client kicked",
    }
    for i = 1, #keys do
        if string.find(s, keys[i], 1, true) then return true end
    end
    return false
end

function S.AntiBanStatus()
    local a = S.AntiBan
    if not a.on then return "🔐 Anti Ban: TẮT" end
    local extra = (a.lastReason ~= "" and (" · lần cuối: " .. a.lastReason)) or ""
    return "🔐 Anti Ban: BẬT · đã hop " .. tostring(a.hops) .. " lần · chờ " .. tostring(a.cooldown) .. "s" .. extra
end

function S.AntiBanHop(reason)
    local a = S.AntiBan
    if not a or not a.on then return false, "off" end
    if a.busy then return false, "busy" end
    local now = 0
    pcall(function() now = tick() end)
    local cd = tonumber(a.cooldown) or 10
    if now > 0 and a.lastHop > 0 and (now - a.lastHop) < cd then return false, "cooldown" end
    a.busy = true
    a.lastHop = now
    a.lastReason = tostring(reason or "suspect")
    a.hops = (tonumber(a.hops) or 0) + 1
    pcall(function() _G.BananaCatHub_AntiBan = true end)
    local msg = "⚠️ chưa hop"
    local ok = pcall(function() msg = S.HopServer() end)
    if not ok then
        pcall(function() TeleportService:Teleport(game.PlaceId, player) end)
        msg = "🔐 không lấy danh sách được → rời PlaceId (không reset đúng server cũ)"
    end
    a.busy = false
    pcall(function() if S.SyncAntiBanPanel then S.SyncAntiBanPanel() end end)
    pcall(function() if D.Say then D.Say("🔐 " .. tostring(msg), C.ACCENT) end end)
    return true, msg
end

function S.AntiBanDisarm()
    local a = S.AntiBan
    if not a then return end
    if a._unhookKick then
        pcall(a._unhookKick)
        if _G.BananaCatHub_AntiBanUnhook == a._unhookKick then
            _G.BananaCatHub_AntiBanUnhook = nil
        end
        a._unhookKick = nil
    end
    for i = #(a.conns or {}), 1, -1 do
        local c = a.conns[i]
        pcall(function() if c then c:Disconnect() end end)
        a.conns[i] = nil
    end
    a.armed = false
end

function S.AntiBanSet(on)
    S.AntiBan.on = on and true or false
    pcall(function() _G.BananaCatHub_AntiBan = S.AntiBan.on end)
    if S.AntiBan.on then
        S.AntiBanArm()
    else
        S.AntiBanDisarm()
    end
    if S.SyncAntiBanPanel then pcall(S.SyncAntiBanPanel) end
    return S.AntiBan.on
end

function S.AntiBanArm()
    local a = S.AntiBan
    if a.armed then return end
    a.armed = true
    a.conns = a.conns or {}
    local function antiConnect(signal, fn)
        local c = signal:Connect(fn)
        a.conns[#a.conns + 1] = c
        trackConn(c)
        return c
    end
    pcall(function()
        if type(hookfunction) == "function" then
            local old
            old = hookfunction(player.Kick, function(...)
                if a.on then S.AntiBanHop("kick") return end
                if old then return old(...) end
            end)
            if old then
                local removed = false
                local function unhookKick()
                    if removed then return end
                    removed = true
                    pcall(function() hookfunction(player.Kick, old) end)
                end
                a._unhookKick = unhookKick
                _G.BananaCatHub_AntiBanUnhook = unhookKick
            end
        end
    end)
    pcall(function()
        antiConnect(Players.PlayerRemoving, function(p)
            if p == player and a.on then S.AntiBanHop("player_removing") end
        end)
    end)
    pcall(function()
        local gs = game:GetService("GuiService")
        antiConnect(gs.ErrorMessageChanged, function()
            if not a.on then return end
            local msg = ""
            pcall(function() msg = tostring(gs.ErrorMessage or "") end)
            if msg == "" then pcall(function() msg = tostring(gs:GetErrorMessage()) end) end
            if S.AntiBanIsMsg(msg) then S.AntiBanHop("gui_error") end
        end)
    end)
    pcall(function()
        antiConnect(TeleportService.TeleportInitFailed, function()
            if not a.on then return end
            task.delay(1.2, function()
                S.AntiBan.busy = false
                S.AntiBanHop("teleport_fail")
            end)
        end)
    end)
    pcall(function()
        antiConnect(game:GetService("LogService").MessageOut, function(msg)
            if a.on and S.AntiBanIsMsg(msg) then S.AntiBanHop("log") end
        end)
    end)
    local function watchHum(hum)
        if not hum then return end
        pcall(function()
            antiConnect(hum:GetPropertyChangedSignal("WalkSpeed"), function()
                if not a.on then return end
                local m = S.Move
                local hot = m and (m.fly or m.noclip or m.sprint or m.infJump or m.highJump or (m.Safe and m.Safe.on))
                if not hot then return end
                local now = tick()
                if now - (S.AntiBan.snapAt or 0) > 4 then S.AntiBan.snaps = 0 end
                S.AntiBan.snapAt = now
                S.AntiBan.snaps = (S.AntiBan.snaps or 0) + 1
                if S.AntiBan.snaps >= 3 then
                    S.AntiBan.snaps = 0
                    S.AntiBanHop("speed_reset")
                end
            end)
        end)
    end
    pcall(function()
        if player.Character then watchHum(player.Character:FindFirstChildOfClass("Humanoid")) end
        antiConnect(player.CharacterAdded, function(ch)
            task.wait(0.25)
            watchHum(ch:FindFirstChildOfClass("Humanoid"))
        end)
    end)
end
if S.AntiBan.on then pcall(S.AntiBanArm) end
-- ---------- HẾT 🔐 ANTI BAN ----------

-- Catalog/UI are in script-hub.lua; game actions/controllers remain in main.

function S.RunHubAction(id)
    if id == "crosshair" then
        local okC = pcall(function() S.ToggleCrosshair() end)
        if not okC then return "⚠️ chưa bật được niêm tâm" end
        S.Rebuild()                                        -- cập nhật nhãn nút
        return "🎯 Niêm tâm: " .. (S.crosshairOn and "BẬT (giữa màn hình game)" or "TẮT")
    elseif id == "unpark" then
        local n = 0
        pcall(function() n = n + (S.RemoveAllParked() or 0) end)
        for _, ft in ipairs(featureTabs) do
            local host = ft.frame and ft.frame:FindFirstChild("ScriptHost")
            if host then pcall(function() n = n + S.ClearEmbedsUnder(host) end) end
        end
        pcall(S.PruneEmbeds)
        pcall(function() if S.SyncEmbedToggles then S.SyncEmbedToggles() end end)
        return "🧩 đã trả " .. n .. " GUI về màn hình game (GUI gốc giữ nguyên, không Destroy)"
    elseif id == "fixmouse" then
        if type(S.DoFixMouse) == "function" then
            local msg = nil
            pcall(function() msg = S.DoFixMouse() end)
            return "🖱 " .. tostring(msg or "đã trả input cho game")
        end
        pcall(ReleaseHubFocus)
        pcall(function() UserInputService.MouseBehavior = Enum.MouseBehavior.Default end)
        return "🖱 đã nhả focus + đặt lại chuột"
    elseif id == "reload" then
        if type(S.DoReload) == "function" then
            task.spawn(function() pcall(S.DoReload) end)
            return "🔄 đang nạp lại hub từ đĩa..."
        end
        return "⚠️ hub chưa sẵn sàng để nạp lại"
    elseif id == "prune" then
        pcall(S.PruneEmbeds)
        return "🧹 đã dọn các host nhúng rác"
    elseif id == "resetserver" then
        local msg = "⚠️ chưa reset được"
        local okRs = pcall(function() msg = S.ResetServer() end)
        if not okRs then return "⚠️ Reset server thất bại: " .. tostring(msg) end
        return tostring(msg)
    elseif id == "hopserver" then
        local msg = "⚠️ chưa hop được"
        local okHp = pcall(function() msg = S.HopServer() end)
        if not okHp then
            return "⚠️ Hop server thất bại: " .. tostring(msg)
                .. " — vẫn dùng được ô 🎟 dán mã server bên dưới để vào thủ công"
        end
        return tostring(msg)
    elseif id == "hoplow" then
        local msg = "⚠️ chưa hop được"
        local okHp = pcall(function() msg = S.HopLowServer() end)
        if not okHp then
            return "⚠️ Hop ít người thất bại: " .. tostring(msg)
                .. " — thử lại hoặc dùng ô 🎟 dán mã thủ công"
        end
        return tostring(msg)
    elseif id == "hopempty" then
        local msg = "⚠️ chưa hop được"
        local okHp = pcall(function() msg = S.HopEmptyServer() end)
        if not okHp then
            return "⚠️ Hop siêu vắng thất bại: " .. tostring(msg)
                .. " — thử lại hoặc dùng ô 🎟"
        end
        return tostring(msg)
    elseif id == "antiban" then
        local wanted = not S.AntiBan.on
        local okAb = pcall(function() S.AntiBanSet(wanted) end)
        if not okAb then return "⚠️ chưa bật được Anti Ban" end
        S.Rebuild()
        return S.AntiBanStatus()
    elseif id == "getjobid" then
        local jid = S.GetJobId()
        if not jid then return "⚠️ Không đọc được mã server (đang ở Studio / server đơn)" end
        local okCp = S.CopyToClipboard(jid)
        pcall(function() if D.hubJobIn then D.hubJobIn.Text = jid end end)
        pcall(function() if S.SyncServerPanel then S.SyncServerPanel() end end)
        return (okCp and "🌐 Đã copy mã server: " or "🌐 Mã server (executor không cho copy, hãy chép tay): ") .. jid

    -- ---------- v4.12: BỘ DI CHUYỂN ----------
    elseif id == "fly" then
        local wanted = not S.Move.fly
        local okF, on, err = pcall(S.Move.SetFly, wanted)
        if not okF then return "⚠️ lỗi bay: " .. tostring(on) end
        if wanted and not on then return "⚠️ " .. tostring(err) end
        S.Rebuild()
        return S.Move.fly and ("🚀 Bay theo camera: BẬT — WASD/joystick · thả phím đứng lơ lửng · tốc độ " .. tostring(S.Move.flySpeed))
                            or "🚀 Bay: TẮT — xuyên tường giữ nguyên theo công tắc 🧱"
    elseif id == "camspeed" then
        local wanted = not S.Move.sprint
        local okS, on, err = pcall(S.Move.SetSprint, wanted)
        if not okS then return "⚠️ lỗi tốc độ: " .. tostring(on) end
        if wanted and not on then return "⚠️ " .. tostring(err) end
        S.Rebuild()
        return S.Move.sprint and ("💨 Tốc độ theo camera: BẬT — WASD/joystick mặt đất · nhảy bình thường · rơi theo game · tốc độ " .. tostring(S.Move.sprintSpeed))
                               or "💨 Tốc độ theo camera: TẮT — trọng lực/nhảy trả về game"
    elseif id == "noclip" then
        if not S.Move.noclip and not S.Move.Root() then return "⚠️ chưa có nhân vật (đợi vào game xong hãy bấm)" end
        pcall(function() S.Move.SetNoclip(not S.Move.noclip) end)
        S.Rebuild()
        return S.Move.noclip and "🧱 Xuyên tường: BẬT (đi xuyên mọi vật cản)"
                              or "🧱 Xuyên tường: TẮT (CanCollide đã trả lại giá trị gốc)"
    elseif id == "infjump" then
        pcall(function() S.Move.SetInfJump(not S.Move.infJump) end)
        S.Rebuild()
        return S.Move.infJump and "🦘 Nhảy vô hạn: BẬT (Space/🐸 A — nhảy được cả game cấm nhảy/không bốc JumpRequest)"
                               or "🦘 Nhảy vô hạn: TẮT (JumpPower/JumpHeight đã trả lại game)"
    elseif id == "highjump" then
        local wanted = not S.Move.highJump
        local okH, on = pcall(S.Move.SetHighJump, wanted)
        if not okH then return "⚠️ lỗi nhảy cao: " .. tostring(on) end
        S.Rebuild()
        return S.Move.highJump and ("🦘 Nhảy cao: BẬT — tốc độ " .. tostring(S.Move.highJumpSpeed) .. " · Space nhảy cao · rơi theo game")
                                or "🦘 Nhảy cao: TẮT — JumpPower trả về game"
    elseif id == "speed" then
        pcall(function() S.Move.SetSpeed(not S.Move.speed) end)
        S.Rebuild()
        return S.Move.speed and ("👟 Chạy độ: BẬT — " .. (S.Move.speedMode == "x"
                                     and ("theo game ×" .. tostring(S.Move.speedMul)
                                          .. " = " .. tostring(S.Move.WantSpeed()))
                                     or  ("cố định " .. tostring(S.Move.walkSpeed)))
                                 .. " · JumpPower " .. tostring(S.Move.jumpPower))
                            or ("👟 Chạy độ: TẮT — về tốc độ game (" .. tostring(S.Move._baseWS) .. ")")
    elseif id == "carpet" then
        local wanted = not S.Move.carpet
        local okC, on, errC = pcall(S.Move.SetCarpet, wanted)
        if not okC then return "⚠️ lỗi thảm kính: " .. tostring(on) end
        if wanted and not on then return "⚠️ " .. tostring(errC) end
        S.Rebuild()
        return S.Move.carpet and "🪩 Thảm kính bám chân: BẬT — thảm di chuyển cùng bạn"
                              or "🪩 Thảm kính bám chân: TẮT"
    elseif id == "placeglass" then
        local okP, part, rec = S.Move.PlaceGlass()
        if not okP then return "⚠️ " .. tostring(part) end
        pcall(function() if S.GlassRefreshList then S.GlassRefreshList() end end)
        S.Rebuild()
        return "🧱 Đã đặt tấm kính cố định #" .. tostring(rec and rec.id or "?")
            .. " · tổng " .. tostring(#(S.Move.GetPlacedGlasses() or {})) .. " tấm"
    elseif id == "clearglass" then
        local n = S.Move.ClearPlacedGlasses()
        pcall(function() if S.GlassRefreshList then S.GlassRefreshList() end end)
        S.Rebuild()
        return "🧹 Đã xóa toàn bộ " .. tostring(n) .. " tấm kính cố định"
    elseif id == "autoglass" then
        local on = S.Move.SetAutoGlass(not S.Move.autoGlass)
        pcall(function() if S.GlassRefreshList then S.GlassRefreshList() end end)
        S.Rebuild()
        return on and "🔄 Tự đặt kính: BẬT — đi tới đâu tự đặt tấm cố định ở đó"
                   or "🔄 Tự đặt kính: TẮT"
    elseif id == "openglasspanel" then
        local okOpen = false
        pcall(function() okOpen = S.OpenGlassPanel and S.OpenGlassPanel() or S.OpenPlayerTab() end)
        return okOpen and "📋 Đã mở 👥 Người Chơi → danh sách thảm kính"
                      or "⚠️ chưa mở được bảng thảm kính"
    elseif id == "flyglass" then
        local idx = S.Move.NearestGlassIndex and S.Move.NearestGlassIndex()
        if not idx then return "⚠️ chưa có tấm kính cố định để bay tới" end
        local okF, rec = S.Move.FlyToGlass(idx)
        if not okF then return "⚠️ " .. tostring(rec) end
        return "🚀 đang bay tới tấm kính #" .. tostring(rec and rec.id or idx)
            .. " · tốc độ " .. tostring(S.Move.glassFlySpeed) .. " — sẽ dừng khi tới nơi"
    elseif id == "stopglassfly" then
        S.Move.StopGlassFly()
        return "⏹ đã dừng bay tới kính"
    elseif id == "flyplayer" then
        if not S.Move.Root() then return "⚠️ chưa có nhân vật để bay (đợi vào game xong hãy bấm)" end
        local target = nil
        if S.Loc and S.Loc.Nearest then target = S.Loc.Nearest() end
        if not target then return "⚠️ không có người chơi nào để bay tới" end
        local ok, res = S.Move.FlyToPlayer(target)
        if S.Loc and S.Loc.RefreshList then pcall(S.Loc.RefreshList) end
        if S.SyncLocPanel then pcall(S.SyncLocPanel) end
        S.Rebuild()
        return ok and string.format("🚀 đang bay tới người %s tốc độ %g (0=auto lấy tốc độ game) — bấm ⏹ Dừng bay tới người để dừng, theo dõi mục tiêu di chuyển, dừng khi <2 studs", tostring(target.Name), S.Move.GetPlayerFlySpeed and S.Move.GetPlayerFlySpeed() or S.Move.playerFlySpeed or 0)
                    or ("⚠️ " .. tostring(res))
    elseif id == "stopflyplayer" then
        S.Move.StopPlayerFly()
        if S.Loc and S.Loc.RefreshList then pcall(S.Loc.RefreshList) end
        if S.SyncLocPanel then pcall(S.SyncLocPanel) end
        S.Rebuild()
        return "⏹ đã dừng bay tới người chơi"
    elseif id == "runmode" then
        return "⚠️ Tính năng chạy trên thảm đã bị xóa"
    elseif id == "loc_all" then
        pcall(function() S.Loc.Set(not S.Loc.on) end)
        S.Rebuild()
        return (S.Loc.on and "📍 ĐỊNH VỊ: BẬT — " or "📍 ĐỊNH VỊ: TẮT — ") .. S.Loc.Status()
    elseif id == "loc_solo" then
        if S.Loc.solo then
            pcall(function() S.Loc.SetSolo(false) end)
        else
            pcall(function() S.Loc.SetTarget(S.Loc.target or S.Loc.Nearest()) end)
        end
        S.Rebuild()
        return (S.Loc.solo and "🎯 ĐỊNH VỊ LẺ: " .. tostring(S.Loc.target and S.Loc.target.Name or "?")
                .. " — chỉ hiện người này (bấm tên khác trong khung 📍 để đổi)")
               or "🎯 ĐỊNH VỊ LẺ: TẮT (trở lại bình thường)"
    -- ---------- v4.17: 🛡 BAY AN TOÀN ----------
    elseif id == "safefly" then
        if not S.Move.Root() then return "⚠️ chưa có nhân vật để bay (đợi vào game xong hãy bấm)" end
        if not S.Move.Safe.on then
            local okf = S.Move.SetFly(true)
            if okf == false then return "⚠️ không bật được bay" end
        end
        pcall(function() S.Move.Safe.Set(not S.Move.Safe.on) end)
        pcall(function() if S.SyncSafePanel then S.SyncSafePanel() end end)
        S.Rebuild()
        return S.Move.Safe.Status()
    elseif id == "safefly_off" then
        pcall(function() S.Move.Safe.Stop() end)
        pcall(function() if S.SyncSafePanel then S.SyncSafePanel() end end)
        S.Rebuild()
        return "🚫 " .. S.Move.Safe.Status()

    -- ---------- v4.16: ✨ PHÁT SÁNG ----------
    elseif id == "glow" then
        pcall(function() S.Glow.Set(not S.Glow.on) end)
        pcall(function() if S.SyncGlowPanel then S.SyncGlowPanel() end end)
        S.Rebuild()
        return S.Glow.Status()
    elseif id == "glow_off" then
        pcall(function() S.Glow.Stop() end)
        pcall(function() if S.SyncGlowPanel then S.SyncGlowPanel() end end)
        S.Rebuild()
        return "🚫 " .. S.Glow.Status()

    -- ---------- v4.64: 🎥 KHÁN GIẢ ----------
    elseif id == "freecam" then
        pcall(function() S.Free.Set(not S.Free.on) end)
        pcall(function() if S.SyncFreePanel then S.SyncFreePanel() end end)
        S.Rebuild()
        return S.Free.Status()
    elseif id == "freecam_off" then
        pcall(function() S.Free.Stop() end)
        pcall(function() if S.SyncFreePanel then S.SyncFreePanel() end end)
        S.Rebuild()
        return "🚫 " .. S.Free.Status()

    -- ---------- v4.14: 👣 XEM NGƯỜI CHƠI ----------
    elseif id == "spec_on" then
        if S.Spec and S.Spec.on then
            pcall(function() S.Spec.Stop() end)
            pcall(function() if S.Spec.RefreshList then S.Spec.RefreshList() end end)
            S.Rebuild()
            return "🚫 " .. (S.Spec.Status and S.Spec.Status() or "đã dừng xem")
        end
        local p = S.Spec.target or S.Loc.target or S.Loc.Nearest()
        if not p then return "⚠️ chưa có ai để xem (server chỉ có mình bạn)" end
        pcall(function() S.Loc.SetTarget(p) end)
        pcall(function() S.Spec.Set(p) end)
        pcall(function() if S.Spec.RefreshList then S.Spec.RefreshList() end end)
        S.Rebuild()
        return "👣 " .. S.Spec.Status() .. " (bấm lại thẻ để dừng · chọn người ở tab 👥)"
    elseif id == "spec_off" then
        pcall(function() S.Spec.Stop() end)
        pcall(function() if S.Spec.RefreshList then S.Spec.RefreshList() end end)
        S.Rebuild()
        return "🚫 " .. S.Spec.Status()
    elseif id == "loc_stop" then
        pcall(function() S.Loc.StopAll() end)
        S.Rebuild()
        return "🚫 đã tắt hết định vị: " .. S.Loc.Status()
    elseif id == "movestop" then
        pcall(function() S.Move.StopAll() end)
        S.Rebuild()
        return "🛑 đã tắt hết: " .. S.Move.Status()
    end
    return "⚠️ không rõ thao tác: " .. tostring(id)
end


-- Script Hub GUI moved to script-hub.lua (original block 1).

function S.Rebuild()
    pcall(function() if S.RebuildHubList then S.RebuildHubList() end end)
end

-- Script Hub GUI moved to script-hub.lua (original block 2).

S.Loc = {

    on = false,             -- 👁️ định vị TẤT CẢ người chơi
    solo = false,           -- 🎯 chỉ định vị ĐÚNG 1 người (S.Loc.target)
    target = nil,
    maxDist = 0,            -- 0 = không giới hạn; >0 = chỉ hiện người trong bán kính này (stud)
    _gui = nil, _items = {}, _friend = {}, _downAt = {},
    _acc = 0, _listAcc = 0, _bound = false,
}
local LOC = S.Loc
local LOCC = {
    normal = { fill = Color3.fromRGB(0, 255, 100),   out = Color3.fromRGB(255, 255, 255), txt = Color3.fromRGB(0, 255, 100) },
    friend = { fill = Color3.fromRGB(255, 105, 180), out = Color3.fromRGB(255, 182, 193), txt = Color3.fromRGB(255, 182, 193) },
    down   = { fill = Color3.fromRGB(200, 0, 0),     out = Color3.fromRGB(255, 100, 100), txt = Color3.fromRGB(255, 100, 100) },
    fdown  = { fill = Color3.fromRGB(138, 43, 226),  out = Color3.fromRGB(200, 150, 255), txt = Color3.fromRGB(200, 150, 255) },
}
local function locRound(n) return math.floor((tonumber(n) or 0) + 0.5) end
local function locTime(sec)                      -- số giây -> "mm:ss"
    local v = math.max(0, math.floor(tonumber(sec) or 0))
    return string.format("%02d:%02d", math.floor(v / 60), v % 60)
end
function S.Loc.Root()
    local c = player.Character
    return (c and c:FindFirstChild("HumanoidRootPart")) or nil
end
function S.Loc.CharOf(p)
    local c = p and p.Character
    if not c then return nil end
    local r = c:FindFirstChild("HumanoidRootPart")
    local h = c:FindFirstChildOfClass("Humanoid")
    if r and h then return c, r, h end
    return nil
end
function S.Loc.IsFriend(p)
    local uid = p and p.UserId
    if uid == nil then return false end
    if LOC._friend[uid] == nil then
        local ok, res = pcall(function() return player:IsFriendsWith(uid) end)
        LOC._friend[uid] = (ok and res == true) or false
    end
    return LOC._friend[uid] == true
end
function S.Loc.IsDown(h)
    if not h then return false end
    if h.PlatformStand == true then return true end
    if (tonumber(h.Health) or 1) <= 0 then return true end
    return false
end
function S.Loc.NoteDown(p, down)
    if p == nil then return end
    if down then
        if not LOC._downAt[p] then LOC._downAt[p] = tick() end
    else
        LOC._downAt[p] = nil
    end
end
function S.Loc.DownSecs(p)
    local st = LOC._downAt[p]
    if not st then return 0 end
    return tick() - st
end
function S.Loc.Dist(p)
    local r = LOC.Root()
    local _, pr = LOC.CharOf(p)
    if not r or not pr then return nil end
    return (r.Position - pr.Position).Magnitude
end
function S.Loc.Nearest()
    local best, bd = nil, nil
    for _, p in ipairs(Players:GetPlayers()) do
        if p ~= player then
            local d = LOC.Dist(p)
            if d and (bd == nil or d < bd) then best, bd = p, d end
            if not best then best = p end
        end
    end
    return best
end
function S.Loc.Wanted(p)
    if p == nil or p == player then return false end
    if LOC.solo then return LOC.target == p end
    return LOC.on == true
end
function S.Loc.Gui()
    if LOC._gui and LOC._gui.Parent then return LOC._gui end
    LOC._gui = New("ScreenGui", {
        Name = "BC_LocEsp", ResetOnSpawn = false,
        ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
    }, gui)
    return LOC._gui
end
function S.Loc.Kill(p)
    local it = LOC._items[p]
    if not it then return end
    pcall(function() if it.hl then it.hl:Destroy() end end)
    pcall(function() if it.bb then it.bb:Destroy() end end)
    LOC._items[p] = nil
end
function S.Loc.Clear()
    for p, _ in pairs(LOC._items) do LOC.Kill(p) end
    pcall(function() if LOC._gui then LOC._gui:ClearAllChildren() end end)
end
function S.Loc.Make(p)
    local c, r = LOC.CharOf(p)
    if not c then return end
    LOC.Kill(p)
    local g = LOC.Gui()
    local hl = New("Highlight", {
        Name = tostring(p.Name) .. "_HL", Adornee = c,
        FillColor = LOCC.normal.fill, FillTransparency = 0.55,
        OutlineColor = LOCC.normal.out, OutlineTransparency = 0,
    }, g)
    local bb = New("BillboardGui", {
        Name = tostring(p.Name) .. "_BB", Adornee = r,
        Size = UDim2.new(0, 170, 0, 46), StudsOffset = Vector3.new(0, 3.6, 0),
        AlwaysOnTop = true,
    }, g)
    local lbl = New("TextLabel", {
        Size = UDim2.new(1, 0, 1, 0), BackgroundTransparency = 1,
        TextColor3 = LOCC.normal.txt, Font = Enum.Font.GothamBold, TextSize = 11,
        TextStrokeColor3 = Color3.fromRGB(0, 0, 0), TextStrokeTransparency = 0.35,
    }, bb)
    LOC._items[p] = { hl = hl, bb = bb, lbl = lbl }
    LOC.TickOne(p)
end
function S.Loc.TickOne(p)
    local it = LOC._items[p]
    if not it then return end
    local c, r, h = LOC.CharOf(p)
    if not c then LOC.Kill(p); return end
    local down, fr = LOC.IsDown(h), LOC.IsFriend(p)
    S.Loc.NoteDown(p, down)
    local col = down and (fr and LOCC.fdown or LOCC.down) or (fr and LOCC.friend or LOCC.normal)
    local r0 = LOC.Root()
    local dist = (r0 and r) and (r0.Position - r.Position).Magnitude or nil
    local far = (LOC.maxDist > 0 and dist ~= nil and dist > LOC.maxDist)
    it.hl.FillColor = col.fill
    it.hl.OutlineColor = col.out
    it.lbl.TextColor3 = col.txt
    it.hl.Enabled = not far
    it.bb.Enabled = not far
    local mid = {}
    if down then mid[#mid + 1] = "☠️ Hạ gục ⏱ " .. locTime(LOC.DownSecs(p)) end
    if h then mid[#mid + 1] = string.format("❤️ %d/%d", locRound(h.Health or 0), locRound(h.MaxHealth or 100)) end
    mid[#mid + 1] = dist and string.format("📏 %dm", locRound(dist)) or "📏 --m"
    it.lbl.Text = p.Name .. (fr and "  💗 Bạn Bè" or "") .. "\n" .. table.concat(mid, " · ")   -- v4.34: Name vốn là chuỗi, khỏi tostring
end
function S.Loc.Tick()
    for p, _ in pairs(LOC._items) do
        if not LOC.Wanted(p) then
            LOC.Kill(p)
        else
            pcall(LOC.TickOne, p)
        end
    end
    if not (LOC.on or LOC.solo) then return end
    local ok, list = pcall(function() return Players:GetPlayers() end)
    if not ok or not list then return end
    for _, p in ipairs(list) do
        if LOC.Wanted(p) and not LOC._items[p] and LOC.CharOf(p) then
            pcall(function() LOC.Make(p) end)
        end
    end
end
function S.Loc.Bind(on)
    if on and not LOC._bound then
        LOC._bound = true
        pcall(function()
            RunService:BindToRenderStep("BC_Loc", Enum.RenderPriority.Camera.Value - 2, function(dt)
                LOC._acc = (LOC._acc or 0) + (tonumber(dt) or 0.016)
                if LOC._acc < 0.2 then return end
                LOC._acc = 0
                pcall(function() LOC.Tick() end)
                LOC._listAcc = (LOC._listAcc or 0) + 0.2
                if LOC._listAcc >= 1 then
                    LOC._listAcc = 0
                    if LOC.RefreshList then pcall(LOC.RefreshList) end
                end
            end)
        end)
    elseif (not on) and LOC._bound then
        LOC._bound = false
        pcall(function() RunService:UnbindFromRenderStep("BC_Loc") end)
    end
end
function S.Loc.Refresh()
    if not (LOC.on or LOC.solo) then
        LOC.Clear()
        LOC.Bind(false)
        return
    end
    for p, _ in pairs(LOC._items) do if not LOC.Wanted(p) then LOC.Kill(p) end end
    local ok, list = pcall(function() return Players:GetPlayers() end)
    if ok and list then
        for _, p in ipairs(list) do
            if LOC.Wanted(p) and not LOC._items[p] and LOC.CharOf(p) then
                pcall(function() LOC.Make(p) end)
            end
        end
    end
    LOC.Bind(true)
end
function S.Loc.Set(on)
    LOC.on = (on == true)
    LOC.Refresh()
    return LOC.on
end
function S.Loc.SetSolo(on)
    LOC.solo = (on == true)
    if not LOC.solo then LOC.target = nil end
    LOC.Refresh()
    return LOC.solo
end
function S.Loc.SetTarget(p)
    LOC.target = (p ~= nil and p ~= player) and p or nil
    LOC.solo = (LOC.target ~= nil)
    LOC.Refresh()
    return LOC.target
end
function S.Loc.SetMaxDist(n)
    LOC.maxDist = math.max(0, tonumber(n) or 0)
    pcall(LOC.Tick)
    return LOC.maxDist
end
function S.Loc.StopAll()
    LOC.on = false; LOC.solo = false; LOC.target = nil
    LOC._downAt = {}
    LOC.Clear()
    LOC.Bind(false)
    return true
end
function S.Loc.Status()
    if not (LOC.on or LOC.solo) then return "📍 định vị: đang TẮT (chưa hiện ai)" end
    local n = 0
    for _ in pairs(LOC._items) do n = n + 1 end
    local t = {}
    if LOC.on then t[#t + 1] = "👁️ tất cả" end
    if LOC.solo then t[#t + 1] = "🎯 lẻ: " .. tostring(LOC.target and LOC.target.Name or "chưa chọn") end
    if LOC.maxDist > 0 then t[#t + 1] = string.format("📏 ≤ %dm", locRound(LOC.maxDist)) end
    return string.format("📍 đang định vị %d người (%s)", n, table.concat(t, " · "))
end
do
    local function hookLoc(p)
        if p == player then return nil end
        trackConn(p.CharacterAdded:Connect(function()
            if LOC.Wanted(p) then pcall(function() LOC.Make(p) end) end
        end))
        trackConn(p.CharacterRemoving:Connect(function() LOC.Kill(p) end))
        if LOC.Wanted(p) then pcall(function() LOC.Make(p) end) end
    end
    for _, p in ipairs(Players:GetPlayers()) do if p ~= player then pcall(hookLoc, p) end end
    trackConn(Players.PlayerAdded:Connect(function(p) pcall(hookLoc, p) end))
    trackConn(Players.PlayerRemoving:Connect(function(p)
        LOC._friend[p.UserId] = nil
        LOC._downAt[p] = nil
        if LOC.target == p then LOC.target = nil end
        LOC.Kill(p)
    end))
end

do
    local tab = AddTab("Người Chơi", "👥", 4)      -- 4 = ngay sau 📚 Script Hub (3), trước ➕ (7)
    D.playerTab = tab
    function S.OpenPlayerTab()
        for i, tc in ipairs(tabContent) do
            if tc == D.playerTab then
                SwitchTab(i)
                return true
            end
        end
        return false
    end
    New("TextLabel", {
        Name = "PlayerTitle",
        Size = UDim2.new(1, -16, 0, 18), Position = UDim2.new(0, 8, 0, 8),
        Text = "👥 NGƯỜI CHƠI — ĐỊNH VỊ & XEM NGƯỜI CHƠI",
        BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 11,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, tab)
    New("TextLabel", {
        Name = "PlayerNote",
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 26),
        Text = "📍 = thấy người khác xuyên tường · 👣 = bám camera theo 1 người để xem họ đang làm gì."
             .. "  (Các nút tắt/mở nhanh vẫn có thẻ trong 📚 Script Hub.)",
        BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium, TextSize = 8,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, tab)
    D.playerY = 46
end

-- ---------- KHUNG 📍 ĐỊNH VỊ (nằm trong trang 👥 NGƯỜI CHƠI) ----------
do
    local PH = 380
    local P = New("Frame", {
        Name = "HubLoc_Panel",
        Size = UDim2.new(1, -16, 0, PH),
        Position = UDim2.new(0, 8, 0, D.playerY or 46),
        LayoutOrder = 1,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.playerTab)
    D.playerY = (D.playerY or 46) + PH + 8
    Corner(P, UDim.new(0, 10))
    Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)

    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 4),
        Text = "📍 ĐỊNH VỊ NGƯỜI CHƠI (xuyên tường) + 🚀 BAY TỚI NGƯỜI",
        BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    local function act(txt, x, y, w, color)
        local b = New("TextButton", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundColor3 = color, TextColor3 = D.BestText(color),
            Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6))
        D.Shade(b, Color3.fromRGB(255, 255, 255), Color3.fromRGB(182, 187, 201), 90)
        D.Tactile(b, 0.08)
        return b
    end
    local function lab(txt, x, y, w)
        New("TextLabel", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundTransparency = 1, TextColor3 = C.MUTED,
            Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, P)
    end

    local allBtn  = act("👁️ Tất Cả", 8, 22, 76, C.GRAY)
    local soloBtn = act("🎯 Lẻ", 90, 22, 76, C.GRAY)
    local stopBtn = act("🚫 Tắt", 172, 22, 56, C.SURFACE3)

    local flyNearBtn = act("🚀 Gần nhất", 234, 22, 76, C.ACCENT)
    local flyStopBtn = act("⏹️ Dừng bay", 316, 22, 76, C.SURFACE3)

    lab("📏 Xa nhất:", 8, 48, 58)
    local distIn = New("TextBox", {
        Size = UDim2.new(0, 50, 0, 20), Position = UDim2.new(0, 66, 0, 48),
        Text = "0", ClearTextOnFocus = false,
        BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
        PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
    }, P)
    Corner(distIn, UDim.new(0, 6))
    lab("m (0 = không giới hạn)", 122, 48, 120)

    lab("🚀 Tốc độ bay tới người:", 8, 72, 122)
    local flySpeedIn = New("TextBox", {
        Size = UDim2.new(0, 56, 0, 20), Position = UDim2.new(0, 132, 0, 72),
        Text = "0", ClearTextOnFocus = false,
        BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
        PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
    }, P)
    Corner(flySpeedIn, UDim.new(0, 6))
    lab("0=auto (lấy tốc độ game)", 194, 72, 160)
    local flySpeedApply = act("✅ Đặt", 354, 72, 38, C.GREEN)

    local searchIn = New("TextBox", {
        Size = UDim2.new(1, -16, 0, 22), Position = UDim2.new(0, 8, 0, 96),
        Text = "", PlaceholderText = "🔍 Tìm tên người chơi...", ClearTextOnFocus = false,
        PlaceholderColor3 = C.GRAY, BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1,
        TextColor3 = C.DARK, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Left, BorderSizePixel = 0, ZIndex = 7,
    }, P)
    Corner(searchIn, UDim.new(0, 6))
    New("UIPadding", { PaddingLeft = UDim.new(0, 6) }, searchIn)

    local list = New("ScrollingFrame", {
        Name = "LocList", Size = UDim2.new(1, -16, 0, 190), Position = UDim2.new(0, 8, 0, 122),
        BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 4,
        CanvasSize = UDim2.new(0, 0, 0, 0), ZIndex = 7,
    }, P)
    New("UIListLayout", { Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }, list)

    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 56), Position = UDim2.new(0, 8, 0, 316),
        Text = "💡 Bấm TÊN = chỉ định vị người đó. 🟢 thường · 💗 bạn bè · 🔴 bị hạ gục (⏱ đếm giờ) · "
             .. "🟣 bạn bè bị hạ gục. 📏 Xa nhất: chỉ hiện người trong bán kính đó. "
             .. "🚀 Bay tới = xuyên tường (tự bật 🧱 + 🚀), theo dõi mục tiêu di chuyển, dừng khi <2 studs. "
             .. "Tốc độ 0 = auto lấy tốc độ mặc định của game.",
        TextWrapped = true, BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)

    local function paint()
        allBtn.Text = LOC.on and "👁️ Tất Cả: BẬT" or "👁️ Tất Cả"
        allBtn.BackgroundColor3 = LOC.on and C.GREEN or C.GRAY
        allBtn.TextColor3 = D.BestText(allBtn.BackgroundColor3)
        soloBtn.Text = LOC.solo and ("🎯 " .. tostring(LOC.target and LOC.target.Name or "?")) or "🎯 Lẻ"
        soloBtn.BackgroundColor3 = LOC.solo and C.PURPLE or C.GRAY
        soloBtn.TextColor3 = D.BestText(soloBtn.BackgroundColor3)
        local mv = S.Move
        local sp = mv and mv.playerFlySpeed or 0
        if tonumber(sp) == 0 then
            flySpeedIn.Text = "0"
            flySpeedIn.PlaceholderText = tostring(mv and mv.GetPlayerFlySpeed and mv.GetPlayerFlySpeed() or 16)
        else
            flySpeedIn.Text = tostring(sp)
        end
        local active = mv and mv._playerFlyActive
        flyNearBtn.BackgroundColor3 = active and C.GREEN or C.ACCENT
        flyNearBtn.TextColor3 = D.BestText(flyNearBtn.BackgroundColor3)
        flyNearBtn.Text = active and ("🚀 Đang bay " .. tostring(mv._playerFlyTarget and mv._playerFlyTarget.Name or "?")) or "🚀 Gần nhất"
    end

    LOC.RefreshList = function(force)
        local term = tostring(searchIn.Text or ""):lower()
        local ok, players = pcall(function() return Players:GetPlayers() end)
        if not ok or not players then return end
        local want = {}
        local sig = term
        for _, p in ipairs(players) do
            if p ~= player then
                local nm = tostring(p.Name)
                if term == "" or nm:lower():find(term, 1, true) then
                    want[#want + 1] = p
                    local _, _, h0 = LOC.CharOf(p)
                    sig = sig .. "|" .. nm
                        .. (LOC.IsFriend(p) and "F" or "") .. (LOC.IsDown(h0) and "D" or "")
                        .. (LOC.target == p and "T" or "")
                end
            end
        end
        local cache = LOC._rows
        if (force == true) or (sig ~= LOC._rowSig) or (cache == nil) then
            LOC._rowSig = sig
            LOC._rows = {}
            cache = LOC._rows
            for _, c in ipairs(list:GetChildren()) do
                if not c:IsA("UIListLayout") then pcall(function() c:Destroy() end) end
            end
            local order = 0
            for _, p in ipairs(want) do
                local nm = tostring(p.Name)
                order = order + 1
                local _, _, h = LOC.CharOf(p)
                local fr, down = LOC.IsFriend(p), LOC.IsDown(h)
                local col = down and (fr and LOCC.fdown or LOCC.down) or (fr and LOCC.friend or LOCC.normal)
                    local row = New("Frame", {
                        Size = UDim2.new(1, 0, 0, 28), LayoutOrder = order,
                        BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.25,
                        BorderSizePixel = 0, ZIndex = 8,
                    }, list)
                    Corner(row, UDim.new(0, 6))
                    local sub = {}
                    if fr then sub[#sub + 1] = "💗 Bạn Bè" end
                    if down then sub[#sub + 1] = "☠️ " .. locTime(LOC.DownSecs(p)) end
                    local b = New("TextButton", {
                        Size = UDim2.new(1, -162, 1, 0), Position = UDim2.new(0, 6, 0, 0),
                        Text = (LOC.target == p and "🎯 " or "") .. nm
                             .. (#sub > 0 and ("  " .. table.concat(sub, "  ")) or ""),
                        BackgroundTransparency = 1, TextColor3 = col.txt,
                        Font = Enum.Font.GothamBold, TextSize = 9,
                        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 9,
                    }, row)
                    b.Activated:Connect(function()
                        ReleaseHubFocus()
                        if LOC.target == p then
                            LOC.SetSolo(false)
                            if S.Spec and S.Spec.on and S.Spec.target == p then pcall(function() S.Spec.Stop() end) end
                        else
                            LOC.SetTarget(p)
                            if S.Spec and S.Spec.on then
                                pcall(function() S.Spec.Set(p) end)
                                pcall(function() if S.Spec.RefreshList then S.Spec.RefreshList() end end)
                            end
                        end
                        paint()
                        if LOC.RefreshList then LOC.RefreshList() end
                        S.Rebuild()
                    end)
                    local d = LOC.Dist(p)
                    local distLbl = New("TextLabel", {
                        Size = UDim2.new(0, 56, 1, 0), Position = UDim2.new(1, -156, 0, 0),
                        Text = d and string.format("📏 %dm", locRound(d)) or "📏 --m",
                        BackgroundTransparency = 1, TextColor3 = col.txt,
                        Font = Enum.Font.GothamMedium, TextSize = 9,
                        TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 9,
                    }, row)
                    local mv = S.Move
                    local isFlyingToThis = mv and mv._playerFlyActive and mv._playerFlyTarget == p
                    local flyBtn = New("TextButton", {
                        Size = UDim2.new(0, 70, 0, 20), Position = UDim2.new(1, -76, 0, 4),
                        Text = isFlyingToThis and "⏹️ Dừng" or "🚀 Bay tới",
                        BackgroundColor3 = isFlyingToThis and C.RED or C.ACCENT,
                        TextColor3 = Color3.fromRGB(255,255,255),
                        Font = Enum.Font.GothamBold, TextSize = 8, BorderSizePixel = 0, ZIndex = 10,
                    }, row)
                    Corner(flyBtn, UDim.new(0, 6))
                    D.Shade(flyBtn, Color3.fromRGB(255, 255, 255), Color3.fromRGB(182, 187, 201), 90)
                    D.Tactile(flyBtn, 0.08)
                    cache[p] = { dist = distLbl, fly = flyBtn }   -- v4.34: lần sau chỉ cập nhật chữ, không dựng lại
                    flyBtn.Activated:Connect(function()
                        ReleaseHubFocus()
                        local mv2 = S.Move
                        if not mv2 then return end
                        local currentlyFlyingToThis = mv2._playerFlyActive and mv2._playerFlyTarget == p
                        if currentlyFlyingToThis then
                            pcall(function() mv2.StopPlayerFly() end)
                        else
                            pcall(function() mv2.FlyToPlayer(p) end)
                        end
                        if S.SyncMovePanel then pcall(S.SyncMovePanel) end
                        if D.hubStatus then
                            if mv2._playerFlyActive then
                                flash(D.hubStatus, "🚀 Bay tới " .. tostring(p.Name) .. " " .. tostring(mv2.GetPlayerFlySpeed and mv2.GetPlayerFlySpeed() or mv2.playerFlySpeed or 0), 1.8, C.ACCENT)
                            else
                                flash(D.hubStatus, "⏹️ Đã dừng bay tới " .. tostring(p.Name), 1.2, C.GRAY)
                            end
                        end
                        if LOC.RefreshList then pcall(LOC.RefreshList) end
                        S.Rebuild()
                    end)
            end
            pcall(function() list.CanvasSize = UDim2.new(0, 0, 0, order * 32) end)
        else
            local mv = S.Move
            for _, p in ipairs(want) do
                local r = cache[p]
                if r then
                    local d2 = LOC.Dist(p)
                    if r.dist then r.dist.Text = d2 and string.format("📏 %dm", locRound(d2)) or "📏 --m" end
                    if r.fly then
                        local flying = mv and mv._playerFlyActive and mv._playerFlyTarget == p
                        r.fly.Text = flying and "⏹️ Dừng" or "🚀 Bay tới"
                        r.fly.BackgroundColor3 = flying and C.RED or C.ACCENT
                    end
                end
            end
        end
        paint()
    end

    allBtn.Activated:Connect(function()
        ReleaseHubFocus()
        LOC.Set(not LOC.on)
        paint()
        if LOC.RefreshList then LOC.RefreshList() end
        S.Rebuild()
        if D.hubStatus then flash(D.hubStatus, "📍 " .. LOC.Status(), 1.8, C.ACCENT) end
    end)
    soloBtn.Activated:Connect(function()
        ReleaseHubFocus()
        if LOC.solo then
            LOC.SetSolo(false)
        else
            LOC.SetTarget(LOC.target or LOC.Nearest())
        end
        paint()
        if LOC.RefreshList then LOC.RefreshList() end
        S.Rebuild()
        if D.hubStatus then flash(D.hubStatus, "🎯 " .. LOC.Status(), 1.8, C.ACCENT) end
    end)
    stopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        LOC.StopAll()
        paint()
        if LOC.RefreshList then LOC.RefreshList() end
        S.Rebuild()
        if D.hubStatus then flash(D.hubStatus, "🚫 " .. LOC.Status(), 1.8, C.ACCENT) end
    end)
    distIn.FocusLost:Connect(function()
        ReleaseHubFocus()
        local n = tonumber(tostring(distIn.Text or ""):match("%-?%d+%.?%d*")) or 0
        LOC.SetMaxDist(n)
        distIn.Text = tostring(LOC.maxDist)
        if D.hubStatus then
            flash(D.hubStatus, (LOC.maxDist > 0 and string.format("📏 chỉ hiện người trong %dm", locRound(LOC.maxDist))
                 or "📏 không giới hạn khoảng cách"), 1.8, C.ACCENT)
        end
    end)
    flySpeedApply.Activated:Connect(function()
        ReleaseHubFocus()
        local mv = S.Move
        if not mv then return end
        local n = tonumber(tostring(flySpeedIn.Text or ""):match("%-?%d+%.?%d*"))
        if n == nil then
            if D.hubStatus then flash(D.hubStatus, "⚠️ Nhập số 0-500 (0=auto)", 1.5, C.RED) end
            return
        end
        local ok, msg = mv.SetPlayerFlySpeed(n)
        if not ok and D.hubStatus then
            flash(D.hubStatus, "⚠️ " .. tostring(msg), 1.5, C.RED)
        else
            paint()
            if D.hubStatus then
                local sp = mv.GetPlayerFlySpeed and mv.GetPlayerFlySpeed() or mv.playerFlySpeed or 0
                if (tonumber(mv.playerFlySpeed) or 0) == 0 then
                    flash(D.hubStatus, string.format("🚀 Tốc độ bay tới người: auto (%g = tốc độ game)", sp), 1.8, C.ACCENT)
                else
                    flash(D.hubStatus, string.format("🚀 Tốc độ bay tới người: %g", sp), 1.5, C.GREEN)
                end
            end
            if S.SyncMovePanel then pcall(S.SyncMovePanel) end
            S.Rebuild()
        end
    end)
    flySpeedIn.FocusLost:Connect(function(enter)
        if not enter then return end
        ReleaseHubFocus()
        local mv = S.Move
        if not mv then return end
        local n = tonumber(tostring(flySpeedIn.Text or ""):match("%-?%d+%.?%d*"))
        if n == nil then return end
        local ok = mv.SetPlayerFlySpeed(n)
        if ok then
            paint()
            S.Rebuild()
        end
    end)
    flyNearBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local mv = S.Move
        if not mv then return end
        local target = LOC.Nearest()
        if not target then
            if D.hubStatus then flash(D.hubStatus, "⚠️ Không có người chơi nào để bay tới", 1.5, C.RED) end
            return
        end
        pcall(function() mv.FlyToPlayer(target) end)
        paint()
        if LOC.RefreshList then pcall(LOC.RefreshList) end
        if S.SyncMovePanel then pcall(S.SyncMovePanel) end
        S.Rebuild()
        if D.hubStatus then flash(D.hubStatus, "🚀 Bay tới gần nhất: " .. tostring(target.Name), 1.8, C.ACCENT) end
    end)
    flyStopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local mv = S.Move
        if mv then pcall(function() mv.StopPlayerFly() end) end
        paint()
        if LOC.RefreshList then pcall(LOC.RefreshList) end
        if S.SyncMovePanel then pcall(S.SyncMovePanel) end
        S.Rebuild()
        if D.hubStatus then flash(D.hubStatus, "⏹️ Đã dừng bay tới người", 1.2, C.GRAY) end
    end)

    if LOC.RefreshList then pcall(LOC.RefreshList) end
    S.SyncLocPanel = function()
        paint()
        distIn.Text = tostring(LOC.maxDist)
        local mv = S.Move
        if mv then
            flySpeedIn.Text = tostring(mv.playerFlySpeed or 0)
        end
        if LOC.RefreshList then pcall(LOC.RefreshList) end
    end
end

S.Spec = {
    on = false, target = nil,       -- 👣 đang xem ai
    auto = true,                    -- người đang xem thoát thì tự chuyển sang người gần nhất
    follow = true, dist = 12, height = 3.2,
    moving = false, jumping = false, falling = false, speed = 0, act = "",
    lastMove = 0, lastJump = 0, lastFall = 0,
    _prev = nil, _oldType = nil, _oldSubject = nil, _bound = false, _ui = {},
}
local SP = S.Spec
local function spRound(n) return math.floor((tonumber(n) or 0) + 0.5) end

function S.Spec.CamOn()
    local cam = workspace.CurrentCamera
    if not cam then return end
    if SP._oldType == nil then
        pcall(function()
            local ct = cam.CameraType
            if ct ~= Enum.CameraType.Scriptable then
                SP._oldType = ct
            else
                SP._oldType = Enum.CameraType.Custom
            end
        end)
    end
    if SP._oldSubject == nil then
        pcall(function() SP._oldSubject = cam.CameraSubject end)
    end
    if SP._oldType then _G.BananaCatHub_SpecCam = SP._oldType end
    pcall(function() cam.CameraType = Enum.CameraType.Scriptable end)
end
function S.Spec.CamOff()
    local cam = workspace.CurrentCamera
    pcall(function()
        if cam then
            if SP._oldType and SP._oldType ~= Enum.CameraType.Scriptable then
                cam.CameraType = SP._oldType
            else
                cam.CameraType = Enum.CameraType.Custom
            end
        end
    end)
    pcall(function()
        if not cam then return end
        local char = player and player.Character
        local hum = char and char:FindFirstChildOfClass("Humanoid")
        local root = char and char:FindFirstChild("HumanoidRootPart")
        if hum then
            cam.CameraSubject = hum
        elseif SP._oldSubject then
            pcall(function() cam.CameraSubject = SP._oldSubject end)
        end
        if root then
            local pos = root.Position
            cam.CFrame = CFrame.new(pos + Vector3.new(0, 3.2, 12), pos + Vector3.new(0, 1.5, 0))
            cam.Focus = CFrame.new(pos)
        end
    end)
    SP._oldType = nil
    SP._oldSubject = nil
    _G.BananaCatHub_SpecCam = nil
end
function S.Spec.Acting(p)
    if not p or not SP.on then return "—" end
    local c, r, h = S.Loc.CharOf(p)
    if not c then return "⏳ đang chờ nhân vật (đang hồi sinh?)" end
    if S.Loc.IsDown(h) then
        local t = S.Loc.DownSecs(p)
        return "☠️ đang BỊ HẠ GỤC" .. (t > 0 and (" (⏱ " .. string.format("%02d:%02d", math.floor(t / 60), math.floor(t % 60)) .. ")") or "")
    end
    if h and h.Sit == true then return "🪑 đang NGỒI" end
    if SP.jumping then return "🦘 đang NHẢY" end
    if SP.falling then return "🪂 đang RƠI" end
    local sp = tonumber(SP.speed) or 0
    if sp > 0.6 then
        local base = (h and tonumber(h.WalkSpeed)) or 16
        if sp >= base * 1.25 then return "🏃 đang CHẠY NHANH (" .. spRound(sp) .. " m/s)"
        elseif sp >= base * 0.6 then return "🚶 đang CHẠY (" .. spRound(sp) .. " m/s)"
        else return "🐌 đang đi CHẬM (" .. spRound(sp) .. " m/s)" end
    end
    return "🧍 đang ĐỨNG YÊN"
end
function S.Spec.Step(dt)
    if not (SP.on and SP.target) then return end
    local p = SP.target
    if p.Parent == nil then
        SP.target = nil
        if SP.auto then
            local n = S.Loc.Nearest()
            if n then pcall(function() S.Spec.Set(n) end) end
        end
        if not SP.target then pcall(function() S.Spec.Stop() end) end
        pcall(function() if S.Spec.RefreshList then S.Spec.RefreshList() end end)
        return
    end
    local c, r = S.Loc.CharOf(p)
    if not c or not r then
        if SP.auto then
            local n = S.Loc.Nearest()
            if n and n ~= p and S.Loc.CharOf(n) then
                SP.target = n
                SP._prev = nil
                SP.lastMove, SP.lastJump, SP.lastFall = 0, 0, 0
                S.Spec.RefreshList()
            end
        end
        SP.moving, SP.jumping, SP.falling, SP.speed = false, false, false, 0
        S.Loc.NoteDown(p, false)
        S.Spec.Sync()
        return
    end
    S.Loc.NoteDown(p, S.Loc.IsDown(c:FindFirstChildOfClass("Humanoid")))
    local pos = r.Position
    local now = tick()
    local pv = SP._prev
    if pv and pv.p == p then
        local d = math.max(now - pv.t, 0.001)
        local dx, dz = pos.X - pv.x, pos.Z - pv.z
        local sp = math.sqrt(dx * dx + dz * dz) / d
        if sp > 0.6 then SP.lastMove = now; SP.speed = sp end
        local dy = pos.Y - pv.y
        if dy > 0.8 then SP.lastJump = now end
        if dy < -0.8 then SP.lastFall = now end
    end
    SP.moving = (SP.lastMove > 0) and (now - SP.lastMove < 0.5) or false
    SP.jumping = (SP.lastJump > 0) and (now - SP.lastJump < 0.9) or false
    SP.falling = (SP.lastFall > 0) and (now - SP.lastFall < 0.6) or false
    if not SP.moving then SP.speed = 0 end
    SP._prev = { p = p, t = now, x = pos.X, y = pos.Y, z = pos.Z }
    if SP.follow then
        local cam = workspace.CurrentCamera
        if cam then
            local look = r.CFrame.LookVector
            local want = pos - look * SP.dist + Vector3.new(0, SP.height, 0)
            cam.CFrame = CFrame.lookAt(want, pos + Vector3.new(0, 1.5, 0))   -- v4.34: ghi thẳng
        end
    end
    SP._acc = (SP._acc or 0) + (tonumber(dt) or 0.016)
    if SP._acc >= 0.25 then
        SP._acc = 0
        S.Spec.Sync()
        if SP.follow then
            local cam = workspace.CurrentCamera
            if cam and cam.CameraType ~= Enum.CameraType.Scriptable then
                pcall(function() cam.CameraType = Enum.CameraType.Scriptable end)
            end
        end
    end
end
function S.Spec.Bind(on)
    if on and not SP._bound then
        SP._bound = true
        pcall(function()
            RunService:BindToRenderStep("BC_Spec", Enum.RenderPriority.Camera.Value - 3, function(dt)
                pcall(S.Spec.Step, dt)
            end)
        end)
    elseif (not on) and SP._bound then
        SP._bound = false
        pcall(function() RunService:UnbindFromRenderStep("BC_Spec") end)
    end
end
function S.Spec.Set(p)
    if p == nil or p == player or p.Parent == nil then
        SP.on = false; SP.target = nil; SP._prev = nil
        SP.moving, SP.jumping, SP.falling, SP.speed = false, false, false, 0
        SP.lastMove, SP.lastJump, SP.lastFall = 0, 0, 0
        S.Spec.Bind(false)
        S.Spec.CamOff()
        S.Spec.Sync()
        return false
    end
    SP.target, SP.on, SP._prev = p, true, nil
    SP.lastMove, SP.lastJump, SP.lastFall = 0, 0, 0
    SP.moving, SP.jumping, SP.falling, SP.speed = false, false, false, 0
    S.Spec.Bind(true)
    if SP.follow then S.Spec.CamOn() end
    S.Spec.Sync()
    return true
end
function S.Spec.Stop() return S.Spec.Set(nil) end
function S.Spec.SetFollow(on)
    SP.follow = (on == true)
    if SP.follow and SP.on then S.Spec.CamOn() else S.Spec.CamOff() end
    S.Spec.Sync()
    return SP.follow
end
function S.Spec.SetAuto(on) SP.auto = (on == true); S.Spec.Sync(); return SP.auto end
function S.Spec.SetDist(n) SP.dist = mvClamp(n, 3, 200); S.Spec.Sync(); return SP.dist end
function S.Spec.SetHeight(n) SP.height = mvClamp(n, -30, 60); S.Spec.Sync(); return SP.height end
function S.Spec.Status()
    if not (SP.on and SP.target) then return "👣 xem người chơi: đang TẮT (camera của bạn bình thường)" end
    return "👣 đang xem " .. tostring(SP.target.Name) .. " — " .. S.Spec.Acting(SP.target)
end
do
    trackConn(Players.PlayerRemoving:Connect(function(p)
        if SP.target == p then
            SP.target = nil
            if SP.on and SP.auto then
                local n = S.Loc.Nearest()
                if n then pcall(function() S.Spec.Set(n) end) end
            end
            if not SP.target then pcall(function() S.Spec.Stop() end) end
            pcall(function() S.Spec.RefreshList() end)
        end
    end))
    trackConn(player.CharacterAdded:Connect(function()
        task.spawn(function()
            task.wait(0.5)
            if not SP.on then
                pcall(function() S.Spec.CamOff() end)
                pcall(function()
                    local cam = workspace.CurrentCamera
                    local char = player.Character
                    local hum = char and char:FindFirstChildOfClass("Humanoid")
                    if cam and hum then
                        cam.CameraSubject = hum
                        cam.CameraType = Enum.CameraType.Custom
                    end
                end)
            else
                pcall(function() S.Spec.CamOn() end)
            end
            pcall(function() if S.Spec.RefreshList then S.Spec.RefreshList() end end)
        end)
    end))
    pcall(function()
        trackConn(workspace:GetPropertyChangedSignal("CurrentCamera"):Connect(function()
            task.spawn(function()
                task.wait(0.1)
                if SP.on and SP.follow then
                    pcall(function() S.Spec.CamOn() end)
                end
            end)
        end))
    end)
end

-- ---------- BẢNG NỔI 👣 (hiện trên màn hình game, menu đóng vẫn thấy) ----------
do
    local g = New("ScreenGui", {
        Name = "BC_SpecHud", ResetOnSpawn = false,
        ZIndexBehavior = Enum.ZIndexBehavior.Sibling, Enabled = false,
    }, gui)
    local F = New("Frame", {
        Name = "SpecBox", Size = UDim2.new(0, 250, 0, 92), Position = UDim2.new(0, 10, 0, 10),
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 20,
    }, g)
    Corner(F, UDim.new(0, 10))
    Stroke(F, C.ACCENT, 1.2)
    D.Shade(F, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)
    SP._ui.gui = g
    SP._ui.title = New("TextLabel", {
        Name = "title",
        Size = UDim2.new(1, -46, 0, 14), Position = UDim2.new(0, 8, 0, 4),
        Text = "👣 ĐANG XEM", BackgroundTransparency = 1, TextColor3 = C.ACCENT,
        Font = Enum.Font.GothamBold, TextSize = 10, TextXAlignment = Enum.TextXAlignment.Left,
        ZIndex = 21,
    }, F)
    SP._ui.who = New("TextLabel", {
        Name = "who",
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 19),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.DARK,
        Font = Enum.Font.GothamBold, TextSize = 11, TextXAlignment = Enum.TextXAlignment.Left,
        TextTruncate = Enum.TextTruncate.AtEnd, ZIndex = 21,
    }, F)
    SP._ui.info = New("TextLabel", {
        Name = "info",
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 37),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left,
        ZIndex = 21,
    }, F)
    SP._ui.act = New("TextLabel", {
        Name = "act",
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 52),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.GREEN,
        Font = Enum.Font.GothamBold, TextSize = 11, TextXAlignment = Enum.TextXAlignment.Left,
        TextTruncate = Enum.TextTruncate.AtEnd, ZIndex = 21,
    }, F)
    local stopBtn = New("TextButton", {
        Name = "stopBtn",
        Size = UDim2.new(0, 30, 0, 20), Position = UDim2.new(1, -38, 0, 4),
        Text = "🚫", BackgroundColor3 = C.RED, TextColor3 = D.BestText(C.RED),
        Font = Enum.Font.GothamBold, TextSize = 11, BorderSizePixel = 0, ZIndex = 22,
    }, F)
    Corner(stopBtn, UDim.new(0, 7))
    D.Tactile(stopBtn, 0.1)
    stopBtn.Activated:Connect(function()
        pcall(function() S.Spec.Stop() end)
        pcall(function() S.Spec.RefreshList() end)
        pcall(S.Rebuild)
    end)
    local followBtnHud = New("TextButton", {
        Name = "followBtn",
        Size = UDim2.new(0, 46, 0, 20), Position = UDim2.new(1, -88, 0, 4),
        Text = "🎥 Bám", BackgroundColor3 = C.GREEN, TextColor3 = D.BestText(C.GREEN),
        Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 22,
    }, F)
    Corner(followBtnHud, UDim.new(0, 7))
    D.Tactile(followBtnHud, 0.1)
    followBtnHud.Activated:Connect(function()
        pcall(function() S.Spec.SetFollow(not SP.follow) end)
        pcall(function() S.Spec.RefreshList() end)
    end)
    SP._ui.followBtn = followBtnHud
    SP._ui.note = New("TextLabel", {
        Name = "note",
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 70),
        Text = "💡 bấm 🚫 để trả camera về cho bạn", BackgroundTransparency = 1, TextColor3 = C.GRAY,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        ZIndex = 21,
    }, F)
end
function S.Spec.Sync()
    local u = SP._ui
    if not u then return end
    local on = (SP.on and SP.target ~= nil)
    pcall(function() if u.gui then u.gui.Enabled = on end end)
    if not on then return end
    pcall(function()
        if u.followBtn then
            u.followBtn.Text = SP.follow and "🎥 Bám" or "🎥 Thôi"
            u.followBtn.BackgroundColor3 = SP.follow and C.GREEN or C.SURFACE3
            u.followBtn.TextColor3 = D.BestText(u.followBtn.BackgroundColor3)
        end
    end)
    local p = SP.target
    local c, r, h = S.Loc.CharOf(p)
    local fr = S.Loc.IsFriend(p)
    local nm = tostring(p.Name) .. (fr and "  💗 Bạn Bè" or "")
    local dist = S.Loc.Dist(p)
    local lines = {}
    if h then lines[#lines + 1] = string.format("❤️ %d/%d", spRound(h.Health or 0), spRound(h.MaxHealth or 100)) end
    lines[#lines + 1] = dist and ("📏 " .. spRound(dist) .. "m") or "📏 --m"
    lines[#lines + 1] = "💨 " .. spRound(SP.speed) .. " m/s"
    pcall(function()
        if u.who then u.who.Text = "👣 " .. nm end
        if u.info then u.info.Text = table.concat(lines, "   ") end
        if u.act then
            local txt = S.Spec.Acting(p)
            u.act.Text = txt
            u.act.TextColor3 = S.Loc.IsDown(h) and Color3.fromRGB(255, 100, 100) or C.GREEN
        end
        if u.title then
            u.title.Text = "👣 ĐANG XEM" .. (SP.follow and "" or " (KHÔNG bám)") .. (SP.auto and " · 🔄" or "")
        end
    end)
end

-- ---------- 🎥 KHÁN GIẢ (v4.64) ----------
S.Free = {
    on = false, speed = 50,
    _bound = false, _cf = nil, _wasAnchored = nil, _hrp = nil,
    _camType = nil, _camSub = nil, _yaw = 0, _pitch = 0,
    _mdx = 0, _mdy = 0, _step = nil, _mouse = nil, _pos = nil, _mouseBeh = nil,
}
local FR = S.Free
function S.Free.Char() return player and player.Character or nil end
function S.Free.HRP(ch)
    ch = ch or S.Free.Char()
    return ch and ch:FindFirstChild("HumanoidRootPart")
end
function S.Free.HoldChar()
    -- Nhân vật ĐỨNG YÊN. Không cướp bay / đứng nền / xuyên tường.
    if not FR.on then return end
    local hrp = S.Free.HRP()
    if not hrp then return end
    if FR._hrp ~= hrp then
        FR._hrp = hrp
        FR._wasAnchored = hrp.Anchored
        FR._cf = hrp.CFrame
    end
    if not FR._cf then FR._cf = hrp.CFrame end
    hrp.Anchored = true
    hrp.CFrame = FR._cf
end
function S.Free.ReleaseChar()
    local hrp = FR._hrp or S.Free.HRP()
    if hrp and hrp.Parent then
        pcall(function()
            hrp.Anchored = (FR._wasAnchored == true)
            if FR._cf then hrp.CFrame = FR._cf end
        end)
    end
    FR._hrp, FR._wasAnchored, FR._cf = nil, nil, nil
end
function S.Free.AimCam()
    -- Lỗi: Scriptable tắt chuột game; InputChanged.Delta = 0 nếu không LockCenter → không quay được.
    local cam = workspace.CurrentCamera
    if not cam then return end
    if FR._camType == nil then FR._camType = cam.CameraType end
    if FR._camSub == nil then FR._camSub = cam.CameraSubject end
    cam.CameraType = Enum.CameraType.Scriptable
    pcall(function() cam.CameraSubject = nil end)
    pcall(function()
        if FR._mouseBeh == nil then FR._mouseBeh = UserInputService.MouseBehavior end
        if UserInputService:GetFocusedTextBox() then
            UserInputService.MouseBehavior = Enum.MouseBehavior.Default
            return
        end
        UserInputService.MouseBehavior = Enum.MouseBehavior.LockCenter
        local d = UserInputService:GetMouseDelta()
        if d then
            FR._mdx = (FR._mdx or 0) + d.X
            FR._mdy = (FR._mdy or 0) + d.Y
        end
    end)
end
function S.Free.RestoreCam()
    local cam = workspace.CurrentCamera
    FR._yaw, FR._pitch, FR._mdx, FR._mdy = 0, 0, 0, 0
    pcall(function()
        UserInputService.MouseBehavior = FR._mouseBeh or Enum.MouseBehavior.Default
    end)
    FR._mouseBeh = nil
    if not cam then FR._camType, FR._camSub, FR._pos = nil, nil, nil return end
    local t = FR._camType
    pcall(function()
        if t and t ~= Enum.CameraType.Scriptable then
            cam.CameraType = t
        else
            cam.CameraType = Enum.CameraType.Custom
        end
    end)
    local ch = S.Free.Char()
    local hum = ch and ch:FindFirstChildOfClass("Humanoid")
    local sub = hum or FR._camSub
    if sub then pcall(function() cam.CameraSubject = sub end) end
    FR._camType, FR._camSub, FR._pos = nil, nil, nil
end
function S.Free.Look()
    local yaw = FR._yaw or 0
    local pitch = FR._pitch or 0
    yaw = yaw - (FR._mdx or 0) * 0.004
    pitch = pitch - (FR._mdy or 0) * 0.004
    if pitch > 1.4 then pitch = 1.4 elseif pitch < -1.4 then pitch = -1.4 end
    FR._mdx, FR._mdy = 0, 0
    FR._yaw, FR._pitch = yaw, pitch
    return CFrame.Angles(0, yaw, 0) * CFrame.Angles(pitch, 0, 0)
end
function S.Free.Step(dt)
    -- Lỗi: lấy vị trí camera đã bị Popper + Camera+1 → không xuyên tường.
    -- Sửa: FR._pos tự lưu; Scriptable mỗi frame; ghi lúc Last.
    if not FR.on then return end
    S.Free.HoldChar()
    local cam = workspace.CurrentCamera
    if not cam then return end
    S.Free.AimCam()
    dt = tonumber(dt) or 0.016
    if dt < 0 then dt = 0 end
    if dt > 0.1 then dt = 0.1 end
    local look = S.Free.Look()
    local pos = FR._pos
    if not pos then return end
    local ch = S.Free.Char()
    local hum = ch and ch:FindFirstChildOfClass("Humanoid")
    local cf = CFrame.new(pos) * look
    local input = Vector3.zero
    pcall(function()
        input = MV._ReadFlyInput(cf, hum)
    end)
    local vel = MV.FlyVelocity(cf, input, FR.speed)
    pos = pos + vel * dt
    FR._pos = pos
    cam.CFrame = CFrame.new(pos) * look
end
function S.Free.Bind(on)
    if on and not FR._bound then
        FR._bound = true
        pcall(function()
            RunService:BindToRenderStep("BC_FreeCam", Enum.RenderPriority.Last.Value, function(dt)
                pcall(S.Free.Step, dt)
            end)
        end)
        if not FR._step then
            FR._step = RunService.Stepped:Connect(function()
                if FR.on then pcall(S.Free.HoldChar) end
            end)
        end
    elseif (not on) and FR._bound then
        FR._bound = false
        pcall(function() RunService:UnbindFromRenderStep("BC_FreeCam") end)
        pcall(function() if FR._step then FR._step:Disconnect() end end)
        FR._step, FR._mouse = nil, nil
    end
end
function S.Free.Set(on)
    on = (on == true)
    if on then
        if S.Spec and S.Spec.on then pcall(function() S.Spec.Stop() end) end
        local cam = workspace.CurrentCamera
        if cam then
            local look = cam.CFrame.LookVector
            local y = look.Y
            if y > 1 then y = 1 elseif y < -1 then y = -1 end
            FR._yaw = math.atan2(-look.X, -look.Z)
            FR._pitch = math.asin(y)
            FR._mdx, FR._mdy = 0, 0
            FR._pos = cam.CFrame.Position
        end
        FR.on = true
        S.Free.HoldChar()
        S.Free.AimCam()
        S.Free.Bind(true)
        S.Free.Step(0)
    else
        FR.on = false
        S.Free.Bind(false)
        S.Free.ReleaseChar()
        S.Free.RestoreCam()
    end
    if S.SyncFreePanel then pcall(S.SyncFreePanel) end
    return FR.on
end
function S.Free.Stop() return S.Free.Set(false) end
function S.Free.SetSpeed(n)
    n = tonumber(n)
    if not n or n ~= n or n == math.huge or n == -math.huge then return false, FR.speed end
    FR.speed = mvClamp(n, 1, 2000, 50)
    if S.SyncFreePanel then pcall(S.SyncFreePanel) end
    return true, FR.speed
end
function S.Free.Status()
    if not FR.on then return "🎥 khán giả: đang TẮT · nhân vật đi bình thường" end
    return string.format("🎥 khán giả: BẬT · camera bay (WASD · Space/Shift) · nhân vật đứng yên · 💨 %g", FR.speed)
end
do
    trackConn(player.CharacterAdded:Connect(function()
        FR._hrp, FR._wasAnchored, FR._cf = nil, nil, nil
        if not FR.on then return end
        task.defer(function()
            if FR.on then S.Free.HoldChar() end
        end)
    end))
end
_G.BananaCatHub_Free = S.Free
-- ---------- HẾT 🎥 KHÁN GIẢ ----------

S.Glow = {
    on = false, width = 18, bright = 3,
    color = Color3.fromRGB(120, 220, 255),
    thru = true,          -- 👁 xuyên tường (mặc định BẬT — đúng ý "ánh sáng không bị trói")
    light = true,         -- 💡 đèn thật toả sáng quanh người
    _hl = nil, _pl = nil, _char = nil, _bound = false, _acc = 0, palIdx = 1,
}
local GL = S.Glow
local function glowRound(n) return math.floor((tonumber(n) or 0) + 0.5) end
GL.palette = {
    { name = "Xanh băng", c = Color3.fromRGB(120, 220, 255) },
    { name = "Xanh lá",  c = Color3.fromRGB(80, 255, 140) },
    { name = "Hồng",     c = Color3.fromRGB(255, 120, 210) },
    { name = "Vàng",     c = Color3.fromRGB(255, 220, 90) },
    { name = "Đỏ",       c = Color3.fromRGB(255, 80, 80) },
    { name = "Tím",      c = Color3.fromRGB(170, 120, 255) },
    { name = "Trắng",    c = Color3.fromRGB(255, 255, 255) },
}
function S.Glow.FillT() return mvClamp(0.94 - (tonumber(GL.bright) or 0) * 0.088, 0, 1, 1) end
function S.Glow.EdgeT() return mvClamp(0.60 - (tonumber(GL.bright) or 0) * 0.058, 0, 1, 1) end
function S.Glow.Char() return player and player.Character or nil end
function S.Glow.Kill()
    pcall(function() if GL._hl then GL._hl:Destroy() end end)
    pcall(function() if GL._pl then GL._pl:Destroy() end end)
    GL._hl, GL._pl, GL._char = nil, nil, nil
end
function S.Glow.Apply()
    if not GL.on then return end
    local ch = S.Glow.Char()
    if not ch then return end
    if GL._char ~= ch then S.Glow.Kill(); GL._char = ch end          -- respawn -> nhân vật mới
    local hrp = ch:FindFirstChild("HumanoidRootPart") or ch:FindFirstChildOfClass("BasePart")
    local mode = GL.thru and Enum.HighlightDepthMode.AlwaysOnTop or Enum.HighlightDepthMode.Occluded
    local host = (gui and gui.Parent and gui) or targetGui or playerGui
    if not host then return end
    if not (GL._hl and GL._hl.Parent) then                            -- bị game xoá -> dựng lại
        GL._hl = New("Highlight", {
            Name = "BC_GlowHL", Adornee = ch,
            FillColor = GL.color, OutlineColor = GL.color,
            FillTransparency = S.Glow.FillT(), OutlineTransparency = S.Glow.EdgeT(),
            DepthMode = mode,
        }, host)
    end
    pcall(function()
        if GL._hl.Parent ~= host then GL._hl.Parent = host end
        GL._hl.Adornee = ch
        GL._hl.FillColor = GL.color
        GL._hl.OutlineColor = GL.color
        GL._hl.FillTransparency = S.Glow.FillT()
        GL._hl.OutlineTransparency = S.Glow.EdgeT()
        GL._hl.DepthMode = mode
    end)
    if GL.light and hrp then
        if not (GL._pl and GL._pl.Parent) then                        -- bị xoá -> dựng lại
            GL._pl = New("PointLight", {
                Name = "BC_GlowLight", Brightness = GL.bright, Range = GL.width,
                Color = GL.color, Shadows = false,
            }, hrp)
        end
        pcall(function()
            GL._pl.Brightness = GL.bright
            GL._pl.Range = GL.width
            GL._pl.Color = GL.color
            GL._pl.Shadows = false                                     -- không bị vật cản chặn
            if GL._pl.Parent ~= hrp then GL._pl.Parent = hrp end
        end)
    elseif not GL.light then
        pcall(function() if GL._pl then GL._pl:Destroy() end end)
        GL._pl = nil
    end
end
function S.Glow.Bind(on)
    if on and not GL._bound then
        GL._bound = true
        pcall(function()
            RunService:BindToRenderStep("BC_Glow", Enum.RenderPriority.Camera.Value - 5, function(dt)
                GL._acc = (GL._acc or 0) + (tonumber(dt) or 0.016)
                if GL._acc < 0.5 then return end      -- 2 lần/giây là đủ để canh, không tốn gì
                GL._acc = 0
                pcall(S.Glow.Apply)
            end)
        end)
    elseif (not on) and GL._bound then
        GL._bound = false
        pcall(function() RunService:UnbindFromRenderStep("BC_Glow") end)
    end
end
function S.Glow.Set(on)
    GL.on = (on == true)
    if GL.on then S.Glow.Bind(true); S.Glow.Apply() else S.Glow.Kill(); S.Glow.Bind(false) end
    return GL.on
end
function S.Glow.SetWidth(n)  GL.width  = mvClamp(n, 1, 200, GL.width);  S.Glow.Apply(); return GL.width  end
function S.Glow.SetBright(n) GL.bright = mvClamp(n, 0, 10, GL.bright); S.Glow.Apply(); return GL.bright end
function S.Glow.SetThru(b)   GL.thru   = (b == true); S.Glow.Apply(); return GL.thru end
function S.Glow.SetLight(b)  GL.light  = (b == true); S.Glow.Apply(); return GL.light end
function S.Glow.SetColor(c)
    if typeof(c) == "Color3" then
        GL.color = c
    elseif type(c) == "number" and GL.palette[c] then
        GL.palIdx = c
        GL.color = GL.palette[c].c
    end
    S.Glow.Apply()
    return GL.color
end
function S.Glow.CycleColor()
    local n = #GL.palette
    GL.palIdx = ((GL.palIdx or 1) % n) + 1
    GL.color = GL.palette[GL.palIdx].c
    S.Glow.Apply()
    return GL.palette[GL.palIdx].name
end
function S.Glow.Stop() return S.Glow.Set(false) end
function S.Glow.ColorName()
    for _, p in ipairs(GL.palette) do
        if p.c == GL.color then return p.name end
    end
    return "tự chọn"
end
function S.Glow.Status()
    if not GL.on then return "✨ phát sáng: đang TẮT" end
    local t = { string.format("📏 rộng %g", GL.width), string.format("☀ sáng %g", GL.bright),
                "🎨 " .. S.Glow.ColorName() }
    if GL.thru then t[#t + 1] = "👁 xuyên tường" end
    if GL.light then t[#t + 1] = "💡 đèn thật" end
    return "✨ phát sáng: BẬT · " .. table.concat(t, " · ")
end
do
    trackConn(player.CharacterAdded:Connect(function()
        if GL.on then pcall(S.Glow.Apply) end
    end))
end

-- Script Hub GUI moved to script-hub.lua (original block 3).

-- ---------- TỰ LÀM MỚI 2 DANH SÁCH TRONG MENU (📍 + 👣) ----------
do
    local acc = 0
    RunService:BindToRenderStep("BC_HubList", Enum.RenderPriority.Camera.Value - 4, function(dt)
        acc = acc + (tonumber(dt) or 0.016)
        if acc < 2 then return end
        acc = 0
        pcall(function()
            local visible = false
            local function open(t) if t and t.Visible == true then return true end return false end
            if open(D.playerTab) or open(D.hubTab) then visible = true end
            if not visible then return end
            if S.Loc.RefreshList then S.Loc.RefreshList() end
            if S.Spec.RefreshList then S.Spec.RefreshList() end
            if S.GlassRefreshList then S.GlassRefreshList() end
        end)
    end)
end

-- ---------- KHUNG 👣 XEM NGƯỜI CHƠI (ngay dưới khung 📍 trong trang 👥 NGƯỜI CHƠI) -------
do
    local PH = 262
    local P = New("Frame", {
        Name = "HubSpec_Panel",
        Size = UDim2.new(1, -16, 0, PH),
        Position = UDim2.new(0, 8, 0, D.playerY or 46),
        LayoutOrder = 2,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.playerTab)
    D.playerY = (D.playerY or 46) + PH + 8
    Corner(P, UDim.new(0, 10))
    Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)

    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 4),
        Text = "👣 XEM NGƯỜI CHƠI (bám theo — xem họ đang làm gì)", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    local function act(txt, x, y, w, color)
        local b = New("TextButton", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundColor3 = color, TextColor3 = D.BestText(color),
            Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6))
        D.Shade(b, Color3.fromRGB(255, 255, 255), Color3.fromRGB(182, 187, 201), 90)
        D.Tactile(b, 0.08)
        return b
    end
    local function lab(txt, x, y, w)
        New("TextLabel", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundTransparency = 1, TextColor3 = C.MUTED,
            Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, P)
    end

    local watchBtn = act("👣 Bám theo", 8, 22, 106, C.GRAY)
    local followBtn = act("🎥 Bám: BẬT", 120, 22, 96, C.GREEN)
    local autoBtn = act("🔄 Tự chuyển", 222, 22, 66, C.GRAY)

    lab("📏", 8, 48, 14)
    local distIn = New("TextBox", {
        Size = UDim2.new(0, 44, 0, 20), Position = UDim2.new(0, 22, 0, 48),
        Text = "12", ClearTextOnFocus = false,
        BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
        PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
    }, P)
    Corner(distIn, UDim.new(0, 6))
    lab("m · ⬆", 70, 48, 30)
    local hiIn = New("TextBox", {
        Size = UDim2.new(0, 44, 0, 20), Position = UDim2.new(0, 100, 0, 48),
        Text = "3.2", ClearTextOnFocus = false,
        BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
        PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
    }, P)
    Corner(hiIn, UDim.new(0, 6))
    local applyBtn = act("✔ Áp dụng", 150, 48, 70, C.SURFACE3)
    lab("🚫 Dừng", 226, 48, 62)

    local searchIn = New("TextBox", {
        Size = UDim2.new(1, -16, 0, 22), Position = UDim2.new(0, 8, 0, 72),
        Text = "", PlaceholderText = "🔍 Tìm tên người chơi...", ClearTextOnFocus = false,
        PlaceholderColor3 = C.GRAY, BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1,
        TextColor3 = C.DARK, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Left, BorderSizePixel = 0, ZIndex = 7,
    }, P)
    Corner(searchIn, UDim.new(0, 6))
    New("UIPadding", { PaddingLeft = UDim.new(0, 6) }, searchIn)

    local list = New("ScrollingFrame", {
        Name = "SpecList", Size = UDim2.new(1, -16, 0, 130), Position = UDim2.new(0, 8, 0, 98),
        BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 4,
        CanvasSize = UDim2.new(0, 0, 0, 0), ZIndex = 7,
    }, P)
    New("UIListLayout", { Padding = UDim.new(0, 4), SortOrder = Enum.SortOrder.LayoutOrder }, list)

    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 30), Position = UDim2.new(0, 8, 0, 230),
        Text = "💡 Bấm TÊN = bám theo xem họ đang làm gì (video chạy trong mắt bạn). "
             .. "Chỉ ĐỔI CAMERA — nhân vật bạn không bị dịch chuyển; 🚫 Dừng là trả camera về ngay.",
        TextWrapped = true, BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)

    local function paint()
        local nm = (SP.on and SP.target) and tostring(SP.target.Name) or nil
        watchBtn.Text = nm and ("👣 " .. nm) or "👣 Bám theo"
        watchBtn.BackgroundColor3 = SP.on and C.GREEN or C.GRAY
        watchBtn.TextColor3 = D.BestText(watchBtn.BackgroundColor3)
        followBtn.Text = SP.follow and "🎥 Bám: BẬT" or "🎥 Bám: TẮT"
        followBtn.BackgroundColor3 = SP.follow and C.GREEN or C.SURFACE3
        followBtn.TextColor3 = D.BestText(followBtn.BackgroundColor3)
        autoBtn.BackgroundColor3 = SP.auto and C.PURPLE or C.SURFACE3
        autoBtn.TextColor3 = D.BestText(autoBtn.BackgroundColor3)
        distIn.Text, hiIn.Text = tostring(SP.dist), tostring(SP.height)
    end

    S.Spec.RefreshList = function()
        if not (list and list.Parent) then return end
        for _, c in ipairs(list:GetChildren()) do
            if not c:IsA("UIListLayout") then pcall(function() c:Destroy() end) end
        end
        local term = tostring(searchIn.Text or ""):lower()
        local order = 0
        local ok, players = pcall(function() return Players:GetPlayers() end)
        if not ok or not players then return end
        for _, p in ipairs(players) do
            if p ~= player then
                local nm = tostring(p.Name)
                if term == "" or nm:lower():find(term, 1, true) then
                    order = order + 1
                    local c, r, h = S.Loc.CharOf(p)
                    local fr, down = S.Loc.IsFriend(p), S.Loc.IsDown(h)
                    local col = down and Color3.fromRGB(255, 100, 100)
                             or (fr and Color3.fromRGB(255, 182, 193) or C.DARK)
                    local row = New("Frame", {
                        Size = UDim2.new(1, 0, 0, 26), LayoutOrder = order,
                        BackgroundColor3 = (SP.target == p) and C.SURFACE3 or C.SURFACE2,
                        BackgroundTransparency = (SP.target == p) and 0.05 or 0.25,
                        BorderSizePixel = 0, ZIndex = 8,
                    }, list)
                    Corner(row, UDim.new(0, 6))
                    local sub = {}
                    if fr then sub[#sub + 1] = "💗" end
                    if down then sub[#sub + 1] = "☠️" end
                    if c then
                        sub[#sub + 1] = (h and string.format("❤️%d", spRound(h.Health or 0)) or "❤️?")
                    else
                        sub[#sub + 1] = "⏳ chờ nhân vật"
                    end
                    local b = New("TextButton", {
                        Size = UDim2.new(1, -74, 1, 0), Position = UDim2.new(0, 6, 0, 0),
                        Text = (SP.target == p and "👣 " or "") .. nm .. "  " .. table.concat(sub, " "),
                        BackgroundTransparency = 1, TextColor3 = col,
                        Font = Enum.Font.GothamBold, TextSize = 9,
                        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 9,
                    }, row)
                    b.Activated:Connect(function()
                        ReleaseHubFocus()
                        pcall(function() S.Loc.SetTarget(p) end)      -- vừa định vị vừa bám theo
                        S.Spec.Set(p)
                        pcall(function() S.Loc.RefreshList() end)
                        paint()
                        if S.Spec.RefreshList then S.Spec.RefreshList() end
                        pcall(S.Rebuild)
                    end)
                    local d = S.Loc.Dist(p)
                    New("TextLabel", {
                        Size = UDim2.new(0, 66, 1, 0), Position = UDim2.new(1, -68, 0, 0),
                        Text = d and ("📏 " .. spRound(d) .. "m") or "📏 --m",
                        BackgroundTransparency = 1, TextColor3 = C.MUTED,
                        Font = Enum.Font.GothamMedium, TextSize = 9,
                        TextXAlignment = Enum.TextXAlignment.Right, ZIndex = 9,
                    }, row)
                end
            end
        end
        pcall(function() list.CanvasSize = UDim2.new(0, 0, 0, order * 30) end)
        paint()
    end

    watchBtn.Activated:Connect(function()
        ReleaseHubFocus()
        if SP.on then
            S.Spec.Stop()
        else
            local p = SP.target or S.Loc.target or S.Loc.Nearest()
            if not p then
                if D.hubStatus then flash(D.hubStatus, "⚠️ chưa có ai để xem (server chỉ có mình bạn)", 2, C.RED) end
            else
                S.Loc.SetTarget(p)
                S.Spec.Set(p)
            end
        end
        paint()
        if S.Spec.RefreshList then S.Spec.RefreshList() end
        pcall(function() S.Loc.RefreshList() end)
        pcall(S.Rebuild)
        if D.hubStatus then flash(D.hubStatus, S.Spec.Status(), 2, C.ACCENT) end
    end)
    followBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Spec.SetFollow(not SP.follow)
        paint()
        if D.hubStatus then flash(D.hubStatus, SP.follow and "🎥 camera bám theo người đang xem" or "🎥 đã trả camera về cho bạn (vẫn xem được bảng 👣)", 2, C.ACCENT) end
    end)
    autoBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Spec.SetAuto(not SP.auto)
        paint()
        if D.hubStatus then flash(D.hubStatus, SP.auto and "🔄 người đang xem thoát -> tự chuyển người gần nhất" or "🔄 đã tắt tự chuyển", 2, C.ACCENT) end
    end)
    applyBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local d = tonumber(tostring(distIn.Text or ""):match("%-?%d+%.?%d*")) or SP.dist
        local hh = tonumber(tostring(hiIn.Text or ""):match("%-?%d+%.?%d*")) or SP.height
        S.Spec.SetDist(d); S.Spec.SetHeight(hh)
        paint()
        if D.hubStatus then flash(D.hubStatus, string.format("📏 camera: lùi %gm · cao %gm", SP.dist, SP.height), 1.8, C.ACCENT) end
    end)
    local stopBtn2 = New("TextButton", {
        Size = UDim2.new(0, 108, 0, 20), Position = UDim2.new(1, -116, 0, 48),
        Text = "🚫 Dừng xem", BackgroundColor3 = C.RED, TextColor3 = D.BestText(C.RED),
        Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
    }, P)
    Corner(stopBtn2, UDim.new(0, 6))
    D.Tactile(stopBtn2, 0.1)
    stopBtn2.Activated:Connect(function()
        ReleaseHubFocus()
        S.Spec.Stop()
        paint()
        if S.Spec.RefreshList then S.Spec.RefreshList() end
        pcall(S.Rebuild)
        if D.hubStatus then flash(D.hubStatus, "🚫 " .. S.Spec.Status(), 2, C.ACCENT) end
    end)
    pcall(function() end)
    paint()
    if S.Spec.RefreshList then pcall(S.Spec.RefreshList) end
    pcall(function()
        if D.playerTab then D.playerTab.CanvasSize = UDim2.new(0, 0, 0, (D.playerY or 600) + 16) end
    end)
end

-- ---------- KHUNG 🧱 ĐẶT KÍNH & 🚀 BAY TỚI KÍNH (nhiều tấm cố định) ----------
do
    local PH = 354
    local P = New("Frame", {
        Name = "HubGlass_Panel",
        Size = UDim2.new(1, -16, 0, PH),
        Position = UDim2.new(0, 8, 0, D.playerY or 46),
        LayoutOrder = 3,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.playerTab)
    D.playerY = (D.playerY or 46) + PH + 8
    Corner(P, UDim.new(0, 10))
    Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)

    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 4),
        Text = "🧱 THẢM KÍNH CỐ ĐỊNH · 🚀 BAY TỚI TỪNG TẤM",
        BackgroundTransparency = 1, TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 22), Position = UDim2.new(0, 8, 0, 20),
        Text = "Bấm 🧱 Đặt thêm để tạo tấm mới tại chân bạn. Tấm đã đặt đứng yên, không bị ghi đè; mỗi dòng có nút bay tới và xóa riêng.",
        TextWrapped = true, BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)

    local function glassAct(txt, x, y, w, color)
        local b = New("TextButton", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundColor3 = color, TextColor3 = D.BestText(color),
            Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6))
        D.Shade(b, Color3.fromRGB(255, 255, 255), Color3.fromRGB(182, 187, 201), 90)
        D.Tactile(b, 0.08)
        return b
    end
    local function glassLab(txt, x, y, w)
        New("TextLabel", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundTransparency = 1, TextColor3 = C.MUTED,
            Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, P)
    end
    local function glassInput(txt, x, y, w)
        local box = New("TextBox", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, ClearTextOnFocus = false,
            BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
            PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
        }, P)
        Corner(box, UDim.new(0, 6))
        return box
    end
    local function numberFrom(box, fallback)
        local s = tostring(box and box.Text or "")
        return tonumber(s:match("[+-]?%d+%.?%d*")) or fallback
    end

    glassLab("Rộng", 8, 44, 32)
    local widthIn = glassInput(tostring(MV.carpetW or 6), 42, 44, 42)
    glassLab("Cao", 91, 44, 27)
    local heightIn = glassInput(tostring(MV.carpetH or 0.5), 119, 44, 42)
    glassLab("Dài", 168, 44, 27)
    local lengthIn = glassInput(tostring(MV.carpetL or 6), 196, 44, 42)
    glassLab("Gap", 245, 44, 28)
    local gapIn = glassInput(tostring(MV.carpetGap or 0.2), 275, 44, 43)
    local sizeApply = glassAct("✅ Áp dụng", 326, 44, 60, C.SURFACE3)

    local placeBtn = glassAct("🧱 Đặt thêm", 8, 70, 94, C.BLUE)
    local autoBtn = glassAct("🔄 Tự đặt: TẮT", 108, 70, 94, C.SURFACE3)
    local clearBtn = glassAct("🧹 Xóa tất cả", 208, 70, 94, C.RED)
    local stopBtn = glassAct("⏹ Dừng bay", 308, 70, 78, C.SURFACE3)

    glassLab("🚀 Tốc độ bay:", 8, 96, 90)
    local flySpeedIn = glassInput(tostring(MV.glassFlySpeed or 60), 98, 96, 48)
    local flySpeedApply = glassAct("✅ Đặt", 150, 96, 52, C.GREEN)
    local speedNote = New("TextLabel", {
        Size = UDim2.new(1, -210, 0, 20), Position = UDim2.new(0, 208, 0, 96),
        Text = "tấm gần nhất từ 📚 Script Hub · 1–2000",
        BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium, TextSize = 8,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    local countLbl = New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 18), Position = UDim2.new(0, 8, 0, 120),
        Text = "🧱 Đã đặt: 0 tấm · cố định",
        BackgroundTransparency = 1, TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local list = New("ScrollingFrame", {
        Name = "GlassList", Size = UDim2.new(1, -16, 0, 208), Position = UDim2.new(0, 8, 0, 142),
        BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 4,
        CanvasSize = UDim2.new(0, 0, 0, 0), ZIndex = 7,
    }, P)
    New("UIListLayout", {
        Padding = UDim.new(0, 3), SortOrder = Enum.SortOrder.LayoutOrder,
    }, list)

    local function applyGlassSettings()
        local w, h, l = MV.SetCarpetSize(
            numberFrom(widthIn, MV.carpetW or 6),
            numberFrom(heightIn, MV.carpetH or 0.5),
            numberFrom(lengthIn, MV.carpetL or 6)
        )
        local g = MV.SetCarpetGap(numberFrom(gapIn, MV.carpetGap or 0.2))
        widthIn.Text, heightIn.Text, lengthIn.Text, gapIn.Text = tostring(w), tostring(h), tostring(l), tostring(g)
        return w, h, l, g
    end
    local function glassCount()
        local ok, items = pcall(MV.GetPlacedGlasses)
        if ok and type(items) == "table" then return items end
        return {}
    end
    local function paintGlassButtons(items)
        local auto = MV.autoGlass == true
        autoBtn.Text = auto and "🔄 Tự đặt: BẬT" or "🔄 Tự đặt: TẮT"
        autoBtn.BackgroundColor3 = auto and C.GREEN or C.SURFACE3
        autoBtn.TextColor3 = D.BestText(autoBtn.BackgroundColor3)
        countLbl.Text = "🧱 Đã đặt: " .. tostring(#items) .. " tấm · cố định"
        speedNote.Text = "tấm gần nhất từ 📚 Script Hub · " .. tostring(MV.glassFlySpeed or 60) .. ""
    end

    S.GlassRefreshList = function()
        if not (list and list.Parent) then return end
        local items = glassCount()
        for _, child in ipairs(list:GetChildren()) do
            if not child:IsA("UIListLayout") then pcall(function() child:Destroy() end) end
        end
        for i, rec in ipairs(items) do
            local glassIndex = i
            local part = rec.part
            local pos = rec.position or (part and part.Position) or Vector3.new(0, 0, 0)
            local row = New("Frame", {
                Name = "GlassRow_" .. tostring(rec.id or i),
                Size = UDim2.new(1, 0, 0, 29), LayoutOrder = i,
                BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.18,
                BorderSizePixel = 0, ZIndex = 8,
            }, list)
            Corner(row, UDim.new(0, 6))
            Stroke(row, (MV._glassFlyTarget == rec) and C.ACCENT or C.BORDER, 1)
            New("TextLabel", {
                Size = UDim2.new(1, -126, 1, 0), Position = UDim2.new(0, 7, 0, 0),
                Text = string.format("#%s  X %.1f  Y %.1f  Z %.1f", tostring(rec.id or i), pos.X, pos.Y, pos.Z),
                BackgroundTransparency = 1, TextColor3 = C.DARK, Font = Enum.Font.GothamBold, TextSize = 8,
                TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 9,
            }, row)
            local fly = New("TextButton", {
                Size = UDim2.new(0, 56, 0, 21), Position = UDim2.new(1, -116, 0, 4),
                Text = "🚀 Tới", BackgroundColor3 = C.ACCENT, TextColor3 = D.BestText(C.ACCENT),
                Font = Enum.Font.GothamBold, TextSize = 8, BorderSizePixel = 0, ZIndex = 9,
            }, row)
            Corner(fly, UDim.new(0, 5)); D.Tactile(fly, 0.08)
            fly.Activated:Connect(function()
                ReleaseHubFocus()
                local ok, result = MV.FlyToGlass(glassIndex)
                if ok then
                    D.Say("🚀 đang bay tới tấm kính #" .. tostring(result and result.id or glassIndex) .. " · bấm ⏹ để dừng", C.YELLOW)
                else
                    D.Say("⚠️ " .. tostring(result), C.RED)
                end
                pcall(S.GlassRefreshList)
            end)
            local del = New("TextButton", {
                Size = UDim2.new(0, 52, 0, 21), Position = UDim2.new(1, -56, 0, 4),
                Text = "🗑 Xóa", BackgroundColor3 = C.RED, TextColor3 = D.BestText(C.RED),
                Font = Enum.Font.GothamBold, TextSize = 8, BorderSizePixel = 0, ZIndex = 9,
            }, row)
            Corner(del, UDim.new(0, 5)); D.Tactile(del, 0.08)
            del.Activated:Connect(function()
                ReleaseHubFocus()
                local ok, result = MV.RemoveGlassAt(glassIndex)
                if ok then
                    D.Say("🗑 đã xóa tấm kính #" .. tostring(result and result.id or glassIndex), C.GREEN)
                else
                    D.Say("⚠️ " .. tostring(result), C.RED)
                end
                pcall(S.GlassRefreshList)
            end)
        end
        pcall(function() list.CanvasSize = UDim2.new(0, 0, 0, math.max(0, #items * 32)) end)
        paintGlassButtons(items)
    end

    S.OpenGlassPanel = function()
        local ok = S.OpenPlayerTab and S.OpenPlayerTab() or false
        pcall(S.GlassRefreshList)
        return ok
    end
    sizeApply.Activated:Connect(function()
        ReleaseHubFocus()
        local w, h, l, g = applyGlassSettings()
        D.Say(string.format("✅ kích thước kính: %g × %g × %g · gap %g", w, h, l, g), C.GREEN)
    end)
    placeBtn.Activated:Connect(function()
        ReleaseHubFocus()
        applyGlassSettings()
        local ok, part, rec = MV.PlaceGlass()
        if ok then
            D.Say("🧱 đã đặt tấm kính cố định #" .. tostring(rec and rec.id or "?")
                .. " · tổng " .. tostring(#glassCount()) .. " tấm", C.GREEN)
        else
            D.Say("⚠️ " .. tostring(part), C.RED)
        end
        pcall(S.GlassRefreshList)
    end)
    autoBtn.Activated:Connect(function()
        ReleaseHubFocus()
        applyGlassSettings()
        local on = MV.SetAutoGlass(not MV.autoGlass)
        D.Say(on and "🔄 tự đặt kính: BẬT" or "🔄 tự đặt kính: TẮT", C.YELLOW)
        pcall(S.GlassRefreshList)
    end)
    clearBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local n = MV.ClearPlacedGlasses()
        D.Say("🧹 đã xóa toàn bộ " .. tostring(n) .. " tấm kính cố định", C.GREEN)
        pcall(S.GlassRefreshList)
    end)
    stopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.StopGlassFly()
        D.Say("⏹ đã dừng bay tới kính", C.YELLOW)
        pcall(S.GlassRefreshList)
    end)
    flySpeedApply.Activated:Connect(function()
        ReleaseHubFocus()
        local ok, value = MV.SetGlassFlySpeed(numberFrom(flySpeedIn, MV.glassFlySpeed or 60))
        if ok then
            flySpeedIn.Text = tostring(value)
            speedNote.Text = "tấm gần nhất từ 📚 Script Hub · " .. tostring(value)
            D.Say("🚀 tốc độ bay tới kính: " .. tostring(value), C.GREEN)
        else
            D.Say("⚠️ " .. tostring(value), C.RED)
        end
    end)
    pcall(S.GlassRefreshList)
    pcall(function()
        if D.playerTab then D.playerTab.CanvasSize = UDim2.new(0, 0, 0, (D.playerY or 600) + 16) end
    end)
end

-- Script Hub GUI moved to script-hub.lua (original block 4).


-- BEGIN SCRIPT_HUB_BRIDGE
-- Original controllers/catalog stay in main; the external GUI reads them through this session-scoped bridge.
S.ScriptHubBridge = {
    protocol = 1,
    alive = function() return gui and gui.Parent ~= nil end,
    S = S, D = D, C = C, Move = S.Move, Glow = S.Glow, Free = S.Free,
    New = New, Corner = Corner, Stroke = Stroke, flash = flash,
    RunCode = RunCode, ReleaseHubFocus = ReleaseHubFocus,
    mvClamp = mvClamp, Players = Players, player = player,
    getScripts = function() return scripts end,
    Store = Store, RebuildScripts = function() if RebuildScripts then RebuildScripts() end end,
}
S.EnsureScriptHubFeature() -- URL tab only: no fetch/GUI construction during startup
RebuildFeatureList()
-- END SCRIPT_HUB_BRIDGE


-- BEGIN SUPPORT_BRIDGE
S.SupportBridge = {
    protocol = 1, alive = function() return gui and gui.Parent ~= nil end,
    S = S, D = D, C = C, HubGui = gui, Main = main, ToggleButton = togBtn,
    New = New, Label = Label, Button = Button, Corner = Corner, Stroke = Stroke, flash = flash,
    RunCode = RunCode, player = player, Players = Players, RunService = RunService,
    UserInputService = UserInputService, Hit = Hit,
    getWaypoints = function() return waypoints end,
    saveSoon = function() Store.saveSoon() end,
}
Store.restoreWaypoints = function()
    local view = _G.TDZSupportStandalone
    if type(view) == "table" and view.Bridge == S.SupportBridge and not view.dead
        and type(view.RefreshWaypoints) == "function" then view.RefreshWaypoints() end
end
S.EnsureSupportFeature() -- tab URL only; does not download or start Support during main startup
RebuildFeatureList()
-- END SUPPORT_BRIDGE

do
    local setTab = AddTab("Thiết Lập", "⚙️", 6)   -- v4.15: 5 -> 6 (👥 chen vào ô 4)

    local sy = 8
    local function rule(y)
        New("TextLabel", {
            Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, y),
            Text = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", BackgroundTransparency = 1,
            TextColor3 = C.HAIRLINE, Font = Enum.Font.Gotham, TextSize = 8,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 6,
        }, setTab)
    end
    local function card(title, h)
        local f = New("Frame", {
            Size = UDim2.new(1, -16, 0, h), Position = UDim2.new(0, 8, 0, sy),
            BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.08,
            BorderSizePixel = 0, ZIndex = 6,
        }, setTab)
        Corner(f, UDim.new(0, 10))
        Stroke(f, C.HAIRLINE, 0.18)
        New("TextLabel", {
            Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 6),
            Text = title, BackgroundTransparency = 1, TextColor3 = C.ACCENT,
            Font = Enum.Font.GothamBold, TextSize = 10,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, f)
        sy = sy + h + 8
        return f
    end
    local function line(parent, text, y, color, h)
        return New("TextLabel", {
            Size = UDim2.new(1, -16, 0, h or 12), Position = UDim2.new(0, 8, 0, y),
            Text = text, BackgroundTransparency = 1, TextColor3 = color or C.MUTED,
            Font = Enum.Font.Gotham, TextSize = 9, TextWrapped = true,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, parent)
    end
    local function act(parent, text, x, y, w, color)
        local b = New("TextButton", {
            Size = UDim2.new(0, w, 0, 22), Position = UDim2.new(0, x, 0, y),
            Text = text, BackgroundColor3 = color or C.SURFACE3, BackgroundTransparency = 0.08,
            TextColor3 = D.BestText(color or C.SURFACE3), Font = Enum.Font.GothamBold,
            TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
        }, parent)
        Corner(b, UDim.new(0, 7))
        Stroke(b, D.Edge(color or C.SURFACE3), 0.22)
        return b
    end

    -- ---------- [1] TÌNH TRẠNG LƯU TRỮ ----------
    local c1 = card("💾  LƯU TRỮ — dữ liệu của bạn đang nằm ở đâu?", 82)
    local stTitle = line(c1, "", 24, C.GRAY, 12)
    local stBody  = line(c1, "", 38, C.MUTED, 26)
    local saveNow = act(c1, "💾 Lưu ngay", 8, 54, 92, C.GREEN)
    local reload  = act(c1, "🔄 Đọc lại từ đĩa", 106, 54, 116)

    local function refreshStorage()
        local ns, nw, nf = #scripts, #waypoints, #featureTabs
        local canDisk = Store.canWrite()
        stTitle.TextColor3 = canDisk and C.GREEN or C.YELLOW
        if canDisk then
            stTitle.Text = "✅  ĐANG GHI XUỐNG ĐĨA THẬT"
            stBody.Text = string.format(
                "File: %s\n%d script · %d waypoint · %d tab tính năng — sống qua cả lần rejoin.",
                tostring(Store.SAVE_FILE), ns, nw, nf)
        else
            stTitle.Text = "⚠️  CHỈ GIỮ TRONG RAM CỦA PHIÊN CHƠI NÀY"
            stBody.Text = string.format(
                "Executor không có writefile thật (hub đã bù bằng ổ đĩa ảo).\n%d script · %d WP · %d tab — REJOIN LÀ MẤT. Hãy bấm 📤 Xuất để sao lưu.",
                ns, nw, nf)
        end
    end
    refreshStorage()
    saveNow.Activated:Connect(function()
        local ok = Store.save()
        refreshStorage()
        flash(saveNow, ok and "✅ Đã lưu" or "❌ Lỗi", 1.4)
    end)
    reload.Activated:Connect(function()
        pcall(function() if S.DoReload then S.DoReload() end end)
        refreshStorage()
    end)

    -- ---------- [2] XUẤT / NHẬP ----------
    local c2 = card("📤  SAO LƯU & CHUYỂN MÁY", 132)
    line(c2, "Xuất toàn bộ dữ liệu ra clipboard để dán sang máy/executor khác, hoặc nhập lại chuỗi đã lưu. Nhập là GHÉP theo tên — không ghi đè cái đang có.", 24, C.MUTED, 24)
    local expBtn = act(c2, "📤 Xuất ra clipboard", 8, 50, 128, C.BLUE)
    local paste = New("TextBox", {
        Size = UDim2.new(1, -16, 0, 44), Position = UDim2.new(0, 8, 0, 76),
        PlaceholderText = "Dán JSON đã xuất vào đây rồi bấm 📥 Nhập…",
        Text = "", BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.06,
        TextColor3 = C.DARK, PlaceholderColor3 = C.GRAY, Font = Enum.Font.Code,
        TextSize = 9, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left,
        TextYAlignment = Enum.TextYAlignment.Top, ClearTextOnFocus = false, ZIndex = 7,
    }, c2)
    Corner(paste, UDim.new(0, 7))
    Stroke(paste, C.HAIRLINE, 0.2)
    local impBtn = act(c2, "📥 Nhập", 142, 50, 66, C.GREEN)

    expBtn.Activated:Connect(function()
        local ok, json = pcall(function() return HttpService:JSONEncode(Store.serialize()) end)
        if not ok or type(json) ~= "string" then
            flash(expBtn, "❌ Lỗi JSON", 1.6)
            return
        end
        local done = S.CopyToClipboard(json)
        if not done then
            paste.Text = json
            flash(expBtn, "⚠️ Đã dán vào ô", 1.8)
        else
            flash(expBtn, "✅ Đã copy", 1.8)
        end
    end)

    impBtn.Activated:Connect(function()
        local txt = paste.Text
        if type(txt) ~= "string" or #txt < 2 then
            flash(impBtn, "⚠️ Trống", 1.6); return
        end
        local ok, data = pcall(function() return HttpService:JSONDecode(txt) end)
        local hasPayload = ok and type(data) == "table" and (
            type(data.scripts) == "table" or type(data.waypoints) == "table"
            or type(data.features) == "table" or type(data.settings) == "table")
        if not hasPayload then
            flash(impBtn, "❌ JSON sai", 1.8); return
        end

        local function uniqueName(base, used, fallback)
            local nm = tostring(base or "")
            if nm == "" then nm = fallback end
            if not used[nm] then
                used[nm] = true
                return nm
            end
            local root, k = nm, 2
            repeat
                nm = root .. " (" .. k .. ")"
                k += 1
            until not used[nm]
            used[nm] = true
            return nm
        end

        local haveScripts, addedScripts = {}, 0
        for _, s in ipairs(scripts) do haveScripts[tostring(s.name)] = true end
        for _, s in ipairs(data.scripts or {}) do
            if type(s) == "table" and type(s.code) == "string" and #s.code > 0 then
                local nm = uniqueName(s.name, haveScripts, "Script " .. (#scripts + 1))
                scripts[#scripts + 1] = {
                    name = nm,
                    code = S.SanitizeCode(s.code),
                    expanded = (s.expanded == true),
                }
                addedScripts += 1
            end
        end

        local haveWaypoints, addedWaypoints = {}, 0
        for _, w in ipairs(waypoints) do haveWaypoints[tostring(w.name)] = true end
        for _, w in ipairs(data.waypoints or {}) do
            if type(w) == "table" and Store.isFinite(w.x) and Store.isFinite(w.y) and Store.isFinite(w.z) then
                local nm = uniqueName(w.name, haveWaypoints, "WP " .. (#waypoints + 1))
                waypoints[#waypoints + 1] = {
                    name = nm,
                    pos = Vector3.new(w.x, w.y, w.z),
                }
                addedWaypoints += 1
            end
        end

        local haveFeatures, addedFeatures = {}, 0
        for _, f in ipairs(featureTabs) do haveFeatures[tostring(f.name)] = true end
        for _, f in ipairs(data.features or {}) do
            if type(f) == "table" and type(f.code) == "string" and #f.code > 0 then
                local nm = uniqueName(f.name, haveFeatures, "Tính Năng " .. (#featureTabs + 1))
                local ic = tostring(f.icon or "⚙️")
                CreateFeatureTab(nm, ic, S.SanitizeCode(f.code))
                addedFeatures += 1
            end
        end

        if type(data.settings) == "table" then
            if type(data.settings.embedEnabled) == "boolean" then
                S.embedEnabled = data.settings.embedEnabled
            end
            if type(data.settings.embedGuessNew) == "boolean" then
                S.embedGuessNew = data.settings.embedGuessNew
            end
            if type(data.settings.parkCodeGuis) == "boolean" then
                S.parkCodeGuis = data.settings.parkCodeGuis
            end
            if type(data.settings.hubFavs) == "table" then
                S.hubFavs = S.hubFavs or {}
                for _, nm in ipairs(data.settings.hubFavs) do
                    if tostring(nm) ~= "" then S.hubFavs[tostring(nm)] = true end
                end
            end
        end

        pcall(function() RebuildScripts() end)
        pcall(function() if Store.restoreWaypoints then Store.restoreWaypoints() end end)
        pcall(function() RebuildFeatureList() end)
        pcall(function() if S.SyncEmbedToggles then S.SyncEmbedToggles() end end)
        if not S.embedEnabled then
            for _, ft in ipairs(featureTabs) do
                local hostFrame = ft.frame and ft.frame:FindFirstChild("ScriptHost")
                if hostFrame then S.ClearEmbedsUnder(hostFrame) end
            end
            pcall(S.RemoveAllParked)
            pcall(S.PruneEmbeds)
        end
        refreshStorage()
        Store.saveSoon()
        paste.Text = ""
        flash(impBtn, string.format("✅ +%d script · +%d WP · +%d tab", addedScripts, addedWaypoints, addedFeatures), 2.4)
    end)

    -- ---------- [3] MÔI TRƯỜNG EXECUTOR ----------
    local c3 = card("🖥  MÔI TRƯỜNG EXECUTOR", 74)
    local envTitle = line(c3, "", 24, C.DARK, 12)
    local envBody  = line(c3, "", 38, C.MUTED, 26)
    pcall(function()
        local nm, ver = "không rõ", ""
        if identifyexecutor then
            local a, b = identifyexecutor()
            nm = tostring(a or "không rõ"); ver = tostring(b or "")
        end
        envTitle.Text = "Executor: " .. nm .. (ver ~= "" and ("  ·  " .. ver) or "")
        local miss = {}
        for _, k in ipairs({"writefile", "readfile", "setclipboard", "gethui", "hookfunction", "Drawing", "request", "queue_on_teleport"}) do
            if not S.HasGlobal(k) or S.Shimmed(k) then miss[#miss + 1] = k end
        end
        if #miss == 0 then
            envBody.Text = "✅ Executor đủ mọi hàm hub cần — không phải bù gì."
            envBody.TextColor3 = C.GREEN
        else
            envBody.Text = "⚠️ " .. #miss .. " API thiếu/giả lập (không phải API thật): " .. table.concat(miss, ", ")
            envBody.TextColor3 = C.YELLOW
        end
    end)

    -- ---------- [4] VÙNG NGUY HIỂM ----------
    local c4 = card("⚠️  VÙNG NGUY HIỂM", 66)
    line(c4, "Xoá sạch script đã lưu, waypoint và tab tính năng. Không hoàn tác được.", 24, C.MUTED, 14)
    local clearBtn = act(c4, "🗑 Xoá sạch dữ liệu", 8, 40, 132, C.RED)
    local armed = false
    clearBtn.Activated:Connect(function()
        if not armed then
            armed = true
            clearBtn.Text = "⚠️ Bấm lần nữa để XÁC NHẬN"
            task.delay(4, function()
                armed = false
                if clearBtn and clearBtn.Parent then clearBtn.Text = "🗑 Xoá sạch dữ liệu" end
            end)
            return
        end
        armed = false
        for i = #scripts, 1, -1 do scripts[i] = nil end
        for i = #waypoints, 1, -1 do waypoints[i] = nil end
        pcall(function() RebuildScripts() end)
        pcall(function() if Store.restoreWaypoints then Store.restoreWaypoints() end end)
        Store.save()
        refreshStorage()
        flash(clearBtn, "✅ Đã xoá", 1.6)
    end)

    setTab.CanvasSize = UDim2.new(0, 0, 0, sy + 8)
    S.settingsTab = setTab
    S.settingsBtns = {save = saveNow, reload = reload, export = expBtn, import = impBtn,
                      paste = paste, clear = clearBtn, statusTitle = stTitle, statusBody = stBody,
                      envTitle = envTitle, envBody = envBody, cardStorage = c1, cardEnv = c3}
    S.refreshStorageCard = refreshStorage   -- để chỗ khác gọi lại sau khi trạng thái lưu thay đổi
end

local function ToggleMainFrame()
    main.Visible = not main.Visible
    togBtn.Text = main.Visible and "✕" or ""
    if not main.Visible then ReleaseHubFocus() end   -- v4.4b: đóng menu là phải trả input cho game
    if main.Visible then
        pcall(function()
            if D.openTween then D.openTween:Cancel() end
            local ts, tp = main.Size, main.Position
            main.Size = UDim2.new(ts.X.Scale, math.max(160, ts.X.Offset - 24),
                                  ts.Y.Scale, math.max(110, ts.Y.Offset - 16))
            main.Position = UDim2.new(tp.X.Scale, tp.X.Offset + 12, tp.Y.Scale, tp.Y.Offset + 8)
            D.openTween = TweenService:Create(main,
                TweenInfo.new(0.2, Enum.EasingStyle.Quint, Enum.EasingDirection.Out),
                {Size = ts, Position = tp})
            D.openTween:Play()
            D.openTween.Completed:Connect(function()
                D.openTween = nil
                pcall(BcFit)   -- đo lại để GUI đang nhúng vừa đúng ô tab
            end)
        end)
    end
end

closeBtn.Activated:Connect(function()
    pcall(function() if D.openTween then D.openTween:Cancel() D.openTween = nil end end)
    main.Visible = false
    togBtn.Text = ""
    ReleaseHubFocus()   -- v4.5: đóng bằng ✕ cũng phải trả input cho game (trước đây chỉ có nút  làm)
end)

dragLockBtn.Activated:Connect(function()
    S.dragMenu = not S.dragMenu
    if S.dragMenu then
        dragLockBtn.Text = "🔓"
        dragLockBtn.TextColor3 = C.ACCENT   -- v4.5: vàng accent thay vì xanh
    else
        dragLockBtn.Text = "🔒"
        dragLockBtn.TextColor3 = C.MUTED
    end
end)

trackConn(titleBar.InputBegan:Connect(function(i)
    if S.dragMenu and (i.UserInputType==Enum.UserInputType.MouseButton1 or i.UserInputType==Enum.UserInputType.Touch) then
        pcall(function() if D.openTween then D.openTween:Cancel() D.openTween = nil end end)  -- v4.5
        S.dragging=true
        S.dragStart=i.Position
        S.startPos=main.Position
    end
end))

trackConn(UserInputService.InputChanged:Connect(function(i)
    if S.dragging and S.startPos and S.dragStart and (i.UserInputType==Enum.UserInputType.MouseMovement or i.UserInputType==Enum.UserInputType.Touch) then
        local d=i.Position-S.dragStart
        main.Position=UDim2.new(S.startPos.X.Scale, S.startPos.X.Offset+d.X, S.startPos.Y.Scale, S.startPos.Y.Offset+d.Y)
    end
end))

trackConn(UserInputService.InputEnded:Connect(function(i)
    if i.UserInputType==Enum.UserInputType.MouseButton1 or i.UserInputType==Enum.UserInputType.Touch then
        S.dragging=false
    end
end))

trackConn(togBtn.InputBegan:Connect(function(i)
    if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
        if S.dragMenu then
            S.togDragging = true
            S.togDragStart = i.Position
            S.togStartPos = togBtn.Position
            S.togMoved = false
        end
    end
end))

trackConn(UserInputService.InputChanged:Connect(function(i)
    if S.togDragging and S.dragMenu and (i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch) then
        local delta = i.Position - S.togDragStart
        if delta.Magnitude > 5 then
            S.togMoved = true
        end
        if S.togMoved then
            togBtn.Position = UDim2.new(
                S.togStartPos.X.Scale, S.togStartPos.X.Offset + delta.X,
                S.togStartPos.Y.Scale, S.togStartPos.Y.Offset + delta.Y
            )
        end
    end
end))

trackConn(UserInputService.InputEnded:Connect(function(i)
    if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
        if S.togDragging then
            S.togDragging = false
            if not S.togMoved then
                ToggleMainFrame()
            end
        end
    end
end))

togBtn.Activated:Connect(function()
    if not S.dragMenu then
        ToggleMainFrame()
    end
end)

trackConn(UserInputService.InputBegan:Connect(function(i, gp)
    if not gp and i.KeyCode == Enum.KeyCode.RightControl then
        ToggleMainFrame()
    end
end))

main.Visible = true
togBtn.Text = "✕"

print(string.format(
    "✅ taodepzai v5.0 NOIR — sẵn sàng! Đã nạp lại %d script + %d waypoint + %d tab tính năng từ bộ nhớ (chế độ: %s%s)",
    Store.loadedScripts, Store.loadedWp, #Store.loadedFeatures, Store.mode,
    Store.lastError and (" | ⚠️ " .. Store.lastError) or ""
))
print("   💾 File lưu: " .. Store.SAVE_FILE .. (Store.canWrite() and " (executor có API lưu thật; kiểm tra trạng thái/lỗi ghi trong menu)" or " (hiện chỉ giữ trong RAM; hãy xuất dữ liệu để sao lưu)"))
print("   Tính năng: Code + Code Đã Lưu + Script Hub + Hỗ Trợ (POS+SIZE+ROT+LOOK+VẬT THỂ+HIGHLIGHT TÍM) + Thiết Lập + Tạo Tính Năng")
print("   🆕 v5.0: Di chuyển — 🚀/🛡 bay · 🧱 noclip · 🦘 nhảy · 💨 sprint · 👥 định vị/spectator · ✨ glow · 💾 lưu script/waypoint/tab")
