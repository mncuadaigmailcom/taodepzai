-- Hỗ Trợ taodepzai — full subsystem extracted from the existing main script.
-- Requires the updated taodepzai main; click Run in its preinstalled Hỗ Trợ tab.
-- Code Đã Lưu stays a normal/native tab. This file does not launch external scripts automatically.

-- BEGIN SUPPORT_FACTORY
local function CreateSupport(bridge)
    assert(type(bridge) == "table" and bridge.protocol == 1 and bridge.alive(),
        "Hãy mở taodepzai cập nhật trước khi chạy Hỗ Trợ riêng")
    local owner, mainD, C = bridge.S, bridge.D, bridge.C
    local view = {Bridge = bridge, dead = false}
    local S = setmetatable({}, {__index = owner})
    local D = setmetatable({}, {__index = mainD})
    S.AnaCfg = type(owner.AnaCfg) == "table" and table.clone(owner.AnaCfg) or nil
    S.AnaUi, S.AnaLast, S.SpeedMeter = {}, nil, {}
    local New, Label, Button = bridge.New, bridge.Label, bridge.Button
    local Corner, Stroke, flash, RunCode = bridge.Corner, bridge.Stroke, bridge.flash, bridge.RunCode
    local player, Players = bridge.player, bridge.Players
    local RunService, UserInputService = bridge.RunService, bridge.UserInputService
    local gui, main = bridge.HubGui, bridge.Main
    local playerGui = player.PlayerGui or player:WaitForChild("PlayerGui")
    local camera = workspace.CurrentCamera
    local mouse = player:GetMouse()
    local Store = {saveSoon = bridge.saveSoon}
    local connections, jobs, oldOwner, installed = {}, {}, {}, {}
    local function trackConn(c) connections[#connections + 1] = c; return c end
    local function runOwned(fn)
        return function(...)
            if view.dead then return end
            fn(...)
        end
    end
    local realTask = task
    local task = {wait = realTask.wait, cancel = realTask.cancel}
    task.delay = function(seconds, fn)
        local thread = realTask.delay(seconds, runOwned(fn))
        jobs[#jobs + 1] = thread; return thread
    end
    task.spawn = function(fn)
        local thread = realTask.spawn(runOwned(fn))
        jobs[#jobs + 1] = thread; return thread
    end
    local screen = New("ScreenGui", {Name="TDZSupport", ResetOnSpawn=false, IgnoreGuiInset=true,
        ZIndexBehavior=Enum.ZIndexBehavior.Sibling}, playerGui)
    local supportRoot = New("ScrollingFrame", {Name="SupportRoot", Size=UDim2.new(1,0,1,0),
        Position=UDim2.new(), BackgroundColor3=C.BG, CanvasSize=UDim2.new(), ScrollBarThickness=3,
        ClipsDescendants=true, ZIndex=5}, screen)
    view.Gui, view.Root = screen, supportRoot
    local function isVisible(root)
        if not (main and main.Visible and root.Parent) then return false end
        local ancestor = root
        while ancestor do
            if ancestor:IsA("GuiObject") and ancestor.Visible == false then return false end
            if ancestor:IsA("ScreenGui") and ancestor.Enabled == false then return false end
            ancestor = ancestor.Parent
        end
        return true
    end
    local Hit = {onHub = function(x,y)
        if bridge.Hit.onHub(x,y) then return true end
        return isVisible(supportRoot) and bridge.Hit.inObject(supportRoot,x,y)
    end}
    function view.Destroy(alreadyDestroying)
        if view.dead then return end
        view.dead = true
        if view.restoreHub then pcall(view.restoreHub); view.restoreHub = nil end
        for _, c in ipairs(connections) do pcall(function() c:Disconnect() end) end
        for _, thread in ipairs(jobs) do if thread ~= coroutine.running() then pcall(realTask.cancel,thread) end end
        if view.stopSpeedMeter then pcall(view.stopSpeedMeter)
        elseif type(S.SpeedMeter) == "table" then
            pcall(function()
                if S.SpeedMeter._bound then RunService:UnbindFromRenderStep("BC_SpeedMeter") end
                if S.SpeedMeter.hud then S.SpeedMeter.hud:Destroy() end
            end)
        end
        if view.clearHighlight then pcall(view.clearHighlight) end
        for key, value in pairs(installed) do if owner[key] == value then owner[key] = oldOwner[key] end end
        if _G.TDZSupportStandalone == view then _G.TDZSupportStandalone = nil end
        if not alreadyDestroying then pcall(function() screen:Destroy() end)
        elseif screen.Parent then realTask.defer(function() if screen.Parent then screen:Destroy() end end) end
    end
    local ok, err = pcall(function()
-- BEGIN ORIGINAL_SUPPORT_SUBSYSTEM
local supportTab = supportRoot

local posY = 8

Label(supportTab, "⚡ Script Nhanh - Nhấn để chạy ngay", posY)
posY = posY + 16

local quickScripts = {
    {n="Dex Explorer", d="Mở Dex Explorer", c=[[loadstring(game:HttpGet("https://raw.githubusercontent.com/infyiff/backup/main/dex.lua"))()]], cl=Color3.fromRGB(72, 148, 248)},
    {n="Infinite Yield", d="Admin Commands", c=[[loadstring(game:HttpGet("https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source"))()]], cl=C.PURPLE},
    {n="SimpleSpy v3", d="Theo dõi RemoteEvent & RemoteFunction", c=[[loadstring(game:HttpGet("https://raw.githubusercontent.com/ex-serum/SimpleSpy/main/SimpleSpy.lua"))()]], cl=Color3.fromRGB(38, 194, 118)},
}

for _, s in ipairs(quickScripts) do
    local btn = New("TextButton", {
        Size=UDim2.new(1,-16,0,28), Position=UDim2.new(0,8,0,posY), Text="",
        BackgroundColor3=s.cl, BackgroundTransparency=0.3, BorderSizePixel=0, ZIndex=6,
    }, supportTab)
    Corner(btn, UDim.new(0,5))
    Stroke(btn, s.cl, 1.2)
    New("TextLabel", {
        Size=UDim2.new(1,-10,1,0), Position=UDim2.new(0,10,0,0), Text=s.n.."\n"..s.d,
        BackgroundTransparency=1, TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10,
        TextXAlignment=Enum.TextXAlignment.Left, TextYAlignment=Enum.TextYAlignment.Center, ZIndex=7,
    }, btn)
    btn.Activated:Connect(function() RunCode(s.c, s.n, nil, 1, 0, true) end)
    posY = posY + 32
end

posY = posY + 6
Label(supportTab, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", posY)
posY = posY + 16

Label(supportTab, "🛠 Hỗ Trợ — Phân Tích Tọa Độ", posY)
posY = posY + 18
Label(supportTab, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", posY)
posY = posY + 16

local analyzeObjectEnabled = false
local highlightEnabled = true

local objectAnalyzeBtn = Button(supportTab, "🎯 Phân Tích Vật Thể: TẮT", 8, posY, 372, 26, C.GRAY)
objectAnalyzeBtn.Name = "SupportAnalyze"
local clearObjectBtn = Button(supportTab, "🧹 Xóa KQ", 386, posY, 90, 26, C.RED)
clearObjectBtn.Name = "SupportClearObject"
posY = posY + 32

local highlightToggleBtn = Button(supportTab, "💜 Highlight Tím: BẬT", 8, posY, 372, 26, C.PURPLE)
highlightToggleBtn.Name = "SupportHighlight"
local removeHighlightBtn = Button(supportTab, "❌ Xóa Highlight", 386, posY, 90, 26, C.RED)
removeHighlightBtn.Name = "SupportRemoveHighlight"
posY = posY + 32

-- ---------- v4.8: PHÂN TÍCH ĐA NỀN TẢNG (📱 điện thoại + 🖥 máy tính) ----------
S.AnaUi = S.AnaUi or {}
S.AnaUi.devLbl = Label(supportTab, "📱/🖥 Đang nhận diện thiết bị...", posY)
S.AnaUi.devLbl.TextSize = 9
S.AnaUi.devLbl.TextColor3 = C.ACCENT
posY = posY + 16
S.AnaUi.centerBtn = Button(supportTab, "⊕ Vật thể ở GIỮA màn hình", 8, posY, 232, 26, C.BLUE)
S.AnaUi.nearBtn   = Button(supportTab, "🧭 Vật thể GẦN nhất", 246, posY, 230, 26, C.ORANGE)
posY = posY + 30
S.AnaUi.skipGuiBtn = Button(supportTab, "🛡 Phân tích xuyên HUD game: BẬT", 8, posY, 300, 24, C.GREEN)
S.AnaUi.scanFbBtn  = Button(supportTab, "🧭 Quét dự phòng: BẬT", 314, posY, 162, 24, C.GREEN)
posY = posY + 28
S.AnaUi.whyLbl = Label(supportTab, "🔎 Lý do: — (bật 🎯 Phân Tích Vật Thể rồi chạm/chuột phải vào vật)", posY)
S.AnaUi.whyLbl.TextSize = 9
posY = posY + 16

Label(supportTab, "💡 Bật rồi NHẤP CHUỘT PHẢI (lệt) vào vật thể để chọn (chuột trái vẫn bắn/đi bình thường)", posY)
Label(supportTab, "    Click xuyên qua nút HUD/menu của game sẽ được tự động bỏ qua, không hit nhầm vật phía sau", posY+14)
posY = posY + 30

local objResultPanel = New("Frame", {
    Name="SupportObjectResult",
    Size=UDim2.new(1,-16,0,190),
    Position=UDim2.new(0,8,0,posY),
    BackgroundColor3=Color3.fromRGB(20, 25, 35),
    BackgroundTransparency=0,
    BorderSizePixel=0,
    ZIndex=6,
    Visible=false,
}, supportTab)
Corner(objResultPanel, UDim.new(0,6))
Stroke(objResultPanel, C.PURPLE, 1.5)

New("TextLabel", {   -- (objTitleLbl: bien local khong dung -> bo de tiet kiem slot local)
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,4),
    Text="🎯 VẬT THỂ ĐƯỢC CHỌN", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(180, 130, 255),
    Font=Enum.Font.GothamBold, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objNameLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,22),
    Text="Name: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 255, 100),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objClassLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,38),
    Text="Class: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(200, 200, 255),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objPosLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,54),
    Text="Position: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 180, 180),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objSizeLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,70),
    Text="Size: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(180, 255, 180),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objRotLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,86),
    Text="Rotation: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(180, 220, 255),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objLookLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,102),
    Text="Look: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(220, 200, 255),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objMatLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,118),
    Text="Material: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 220, 180),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objColorLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,134),
    Text="Color: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 180, 220),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, objResultPanel)

local objPathLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,150),
    Text="Path: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(180, 255, 220),
    Font=Enum.Font.Code, TextSize=9,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
    TextTruncate=Enum.TextTruncate.AtEnd,
}, objResultPanel)

local copyObjBtn = New("TextButton", {
    Name="SupportCopyHit",
    Size=UDim2.new(0,120,0,20), Position=UDim2.new(0,8,0,168),
    Text="📋 Copy Tọa Độ", BackgroundColor3=C.BLUE, BackgroundTransparency=0.1,
    TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=8,
}, objResultPanel)
Corner(copyObjBtn, UDim.new(0,4))

local copyPathBtn = New("TextButton", {
    Name="SupportCopyPath",
    Size=UDim2.new(0,120,0,20), Position=UDim2.new(0,134,0,168),
    Text="📋 Copy Path", BackgroundColor3=C.PURPLE, BackgroundTransparency=0.1,
    TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9, BorderSizePixel=0, ZIndex=8,
}, objResultPanel)
Corner(copyPathBtn, UDim.new(0,4))

posY = posY + 198

Label(supportTab, "📍 Tọa Độ Hiện Tại (Real-time)", posY)
posY = posY + 16

local coordDisplay = New("Frame", {
    Size=UDim2.new(1,-16,0,290),
    Position=UDim2.new(0,8,0,posY),
    BackgroundColor3=Color3.fromRGB(30, 35, 45),
    BackgroundTransparency=0,
    BorderSizePixel=0,
    ZIndex=6,
}, supportTab)
Corner(coordDisplay, UDim.new(0,6))
Stroke(coordDisplay, C.BLUE, 1.5)

local function CreateCoordRow(parent, yPos, labelText, labelColor, valueDefault)
    New("TextLabel", {
        Size=UDim2.new(0,90,0,16), Position=UDim2.new(0,8,0,yPos),
        Text=labelText, BackgroundTransparency=1, TextColor3=labelColor,
        Font=Enum.Font.GothamBold, TextSize=10,
        TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
    }, parent)
    return New("TextLabel", {
        Size=UDim2.new(1,-100,0,16), Position=UDim2.new(0,100,0,yPos),
        Text=valueDefault or "...", BackgroundTransparency=1,
        TextColor3=Color3.fromRGB(255,255,255),
        Font=Enum.Font.Code, TextSize=10,
        TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
    }, parent)
end

New("TextLabel", {
    Size=UDim2.new(1,-16,0,14), Position=UDim2.new(0,8,0,4),
    Text="📍 POSITION (DƯỚI CHÂN)", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 200, 100),
    Font=Enum.Font.GothamBold, TextSize=9,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

local xValLbl = CreateCoordRow(coordDisplay, 20, "X:", Color3.fromRGB(255,100,100), "0.000")
local yValLbl = CreateCoordRow(coordDisplay, 36, "Y:", Color3.fromRGB(100,255,100), "0.000")
local zValLbl = CreateCoordRow(coordDisplay, 52, "Z:", Color3.fromRGB(100,150,255), "0.000")

New("TextLabel", {
    Size=UDim2.new(1,-16,0,14), Position=UDim2.new(0,8,0,72),
    Text="📦 SIZE", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 200, 100),
    Font=Enum.Font.GothamBold, TextSize=9,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

local sizeXValLbl = CreateCoordRow(coordDisplay, 88, "Size X:", Color3.fromRGB(255,150,150), "0.000")
local sizeYValLbl = CreateCoordRow(coordDisplay, 104, "Size Y:", Color3.fromRGB(150,255,150), "0.000")
local sizeZValLbl = CreateCoordRow(coordDisplay, 120, "Size Z:", Color3.fromRGB(150,180,255), "0.000")

New("TextLabel", {
    Size=UDim2.new(1,-16,0,14), Position=UDim2.new(0,8,0,140),
    Text="🧭 ROTATION", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 200, 100),
    Font=Enum.Font.GothamBold, TextSize=9,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

local rotPValLbl = CreateCoordRow(coordDisplay, 156, "Pitch (X):", Color3.fromRGB(255,150,150), "0.0°")
local rotYValLbl = CreateCoordRow(coordDisplay, 172, "Yaw (Y):", Color3.fromRGB(150,255,150), "0.0°")
local rotRValLbl = CreateCoordRow(coordDisplay, 188, "Roll (Z):", Color3.fromRGB(150,180,255), "0.0°")

New("TextLabel", {
    Size=UDim2.new(1,-16,0,14), Position=UDim2.new(0,8,0,206),
    Text="👁 LOOK / STATE / HP", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255, 200, 100),
    Font=Enum.Font.GothamBold, TextSize=9,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

local lookValLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,222),
    Text="Look: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(200,220,255),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

local stateValLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,240),
    Text="State: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(200,255,200),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

local hpValLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,16), Position=UDim2.new(0,8,0,258),
    Text="HP: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(255,200,200),
    Font=Enum.Font.Code, TextSize=10,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

local placeLbl = New("TextLabel", {
    Size=UDim2.new(1,-16,0,14), Position=UDim2.new(0,8,0,274),
    Text="Place: ...", BackgroundTransparency=1,
    TextColor3=Color3.fromRGB(150, 200, 255),
    Font=Enum.Font.GothamMedium, TextSize=9,
    TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
}, coordDisplay)

posY = posY + 298

local lastPos = Vector3.new()
local lastSize = Vector3.new()
local lastRot = Vector3.new()
local lastLook = Vector3.new()
local lastState = ""
local lastHp = -1

local function GetRootPart()
    local char = player.Character
    if not char then return nil end
    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local rootPart = (humanoid and humanoid.RootPart)
        or char:FindFirstChild("HumanoidRootPart")
        or char.PrimaryPart
        or char:FindFirstChild("UpperTorso")
        or char:FindFirstChild("Torso")
    return rootPart
end

local function GetGroundPosition()
    local char = player.Character
    if not char then return nil end
    local rootPart = GetRootPart()
    if not rootPart then return nil end

    local origin = rootPart.Position
    local direction = Vector3.new(0, -500, 0)

    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = {char}
    params.IgnoreWater = false

    local result = workspace:Raycast(origin, direction, params)
    if result then
        return result.Position, result.Instance, result.Normal, result.Material
    end
    return nil
end

local coordAcc = 0
local coordLbls
local function coordNA(all)
    coordLbls = coordLbls or {xValLbl, yValLbl, zValLbl, sizeXValLbl, sizeYValLbl, sizeZValLbl,
                              rotPValLbl, rotYValLbl, rotRValLbl}
    for _, l in ipairs(coordLbls) do pcall(function() l.Text = "N/A" end) end
    if all then
        lookValLbl.Text = "Look: N/A"
        stateValLbl.Text = "State: N/A"
        hpValLbl.Text = "HP: N/A"
    end
end

local coordUpdateConn = RunService.RenderStepped:Connect(function(stepDt)
    coordAcc = coordAcc + (tonumber(stepDt) or 0.016)
    if coordAcc < 0.05 then return end
    coordAcc = 0
    if not isVisible(supportTab) then return end
    local char = player.Character
    if not char then
        coordNA(true)
        return
    end

    local humanoid = char:FindFirstChildOfClass("Humanoid")
    local rootPart = GetRootPart()

    if not rootPart then
        coordNA()
        return
    end

    local groundPos = GetGroundPosition()
    local displayPos = groundPos or rootPart.CFrame.Position

    local cf = rootPart.CFrame
    local size = rootPart.Size
    local rx, ry, rz = cf:ToOrientation()
    local look = cf.LookVector

    if (displayPos - lastPos).Magnitude > 0.001 then
        lastPos = displayPos
        xValLbl.Text = string.format("%.3f", displayPos.X)
        yValLbl.Text = string.format("%.3f", displayPos.Y)
        zValLbl.Text = string.format("%.3f", displayPos.Z)
    end

    if (size - lastSize).Magnitude > 0.001 then
        lastSize = size
        sizeXValLbl.Text = string.format("%.3f", size.X)
        sizeYValLbl.Text = string.format("%.3f", size.Y)
        sizeZValLbl.Text = string.format("%.3f", size.Z)
    end

    local newRot = Vector3.new(rx, ry, rz)
    if (newRot - lastRot).Magnitude > 0.001 then
        lastRot = newRot
        rotPValLbl.Text = string.format("%.1f°", math.deg(rx))
        rotYValLbl.Text = string.format("%.1f°", math.deg(ry))
        rotRValLbl.Text = string.format("%.1f°", math.deg(rz))
    end

    if (look - lastLook).Magnitude > 0.001 then
        lastLook = look
        lookValLbl.Text = string.format("Look: %.3f, %.3f, %.3f", look.X, look.Y, look.Z)
    end

    if humanoid then
        local state = humanoid:GetState()
        if state ~= lastState then
            lastState = state
            stateValLbl.Text = "State: "..tostring(state):gsub("Enum.HumanoidStateType.", "")
        end

        local hp = math.floor(humanoid.Health)
        if hp ~= lastHp then
            lastHp = hp
            hpValLbl.Text = string.format("HP: %d / %d", hp, math.floor(humanoid.MaxHealth))
        end
    else
        stateValLbl.Text = "State: No Humanoid"
        hpValLbl.Text = "HP: N/A"
    end

    if placeLbl.Text == "Place: ..." and (os.clock() - (D.placeTryAt or -99)) >= 10 then
        D.placeTryAt = os.clock()
        pcall(function()
            local info = game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId)
            placeLbl.Text = "Place: "..game.PlaceId.." — "..info.Name
        end)
    end
end)
trackConn(coordUpdateConn)

local currentHighlight = nil

local function RemoveCurrentHighlight()
    if currentHighlight then
        pcall(function() currentHighlight:Destroy() end)
        currentHighlight = nil
    end
end

view.clearHighlight = RemoveCurrentHighlight

local function CreateHighlight(target)
    RemoveCurrentHighlight()
    if not target then return end
    if not target:IsA("BasePart") then return end

    local hl = Instance.new("Highlight")
    hl.Name = "BananaCatHub_Highlight"
    hl.Adornee = target
    hl.FillColor = Color3.fromRGB(160, 60, 255)
    hl.FillTransparency = 0.7
    hl.OutlineColor = Color3.fromRGB(200, 100, 255)
    hl.OutlineTransparency = 0
    hl.DepthMode = Enum.HighlightDepthMode.AlwaysOnTop
    hl.Parent = target

    currentHighlight = hl
end

local function GetFullPath(obj)
    if not obj then return "nil" end
    local parts = {}
    local cur = obj
    while cur and cur ~= game do
        table.insert(parts, 1, cur.Name)
        cur = cur.Parent
    end
    return table.concat(parts, ".")
end

-- ----------------------------------------------------------------------------
S.AnaCfg = S.AnaCfg or {
    skipGameGui  = true,   -- 🛡 bỏ qua HUD/nền của game khi phân tích (nguyên nhân số 1)
    scanFallback = true,   -- 🧭 tia trượt thì quét vật gần tia (game dùng CanQuery=false)
    ignoreWater  = true,   -- 🌊 không để mặt nước ăn tia
    holdTime     = 0.4,    -- 📱 giữ ngón bao nhiêu giây thì = "chuột phải"
    holdMove     = 18,     -- 📱 ngón xê dịch tối đa (px) mà vẫn tính là "giữ"
    maxDist      = 10000,  -- tầm tia
}
S.AnaUi   = S.AnaUi or {}
S.AnaLast = S.AnaLast or {ok = false, why = nil, name = nil, how = nil}
S.AnaNote = nil
S.AnaWhyScan = nil

function S.AnaCam()
    local cam = workspace.CurrentCamera
    if not cam then pcall(function() cam = camera end) end
    return cam
end

function S.AnaSay(msg)
    S.AnaLast.why = tostring(msg or "")
    pcall(function()
        local l = S.AnaUi.whyLbl
        if l and l.Parent then l.Text = "🔎 " .. tostring(msg) end
    end)
    pcall(function() print("[taodepzai v5.0 NOIR] 🔎 " .. tostring(msg)) end)
end

function S.DeviceText()
    local touch, mouse = false, false
    pcall(function() touch = (UserInputService.TouchEnabled == true) end)
    pcall(function() mouse = (UserInputService.MouseEnabled == true) end)
    local hold = string.format("%.2f", S.AnaCfg.holdTime)
    if touch and mouse then
        return "🖥📱 Máy có cảm ứng: CHUỘT PHẢI hoặc GIỮ NGÓN " .. hold .. "s lên vật · hoặc bấm ⊕ Giữa màn hình"
    elseif touch then
        return "📱 Điện thoại: GIỮ NGÓN " .. hold .. "s lên vật (chạm nhanh vẫn đi/bắn bình thường) · hoặc ⊕ Giữa màn hình"
    elseif mouse then
        return "🖥 Máy tính: CHUỘT PHẢI vào vật (chuột trái vẫn chơi bình thường) · hoặc ⊕ Giữa màn hình"
    end
    return "🎮 Chưa rõ thiết bị: dùng ⊕ Giữa màn hình hoặc 🧭 Gần nhất — nền tảng nào cũng chạy"
end

function S.RefreshDevLabel()
    pcall(function()
        local l = S.AnaUi.devLbl
        if l and l.Parent then l.Text = S.DeviceText() end
    end)
end

function S.GuiBlockAt(x, y)
    local hard, soft = nil, nil
    local vpx, vpy = 1280, 720
    pcall(function()
        local cam2 = S.AnaCam()
        if cam2 then vpx, vpy = cam2.ViewportSize.X, cam2.ViewportSize.Y end
    end)
    local bigArea = vpx * vpy * 0.36
    local conts = {}
    pcall(function() conts[#conts+1] = playerGui end)
    pcall(function() conts[#conts+1] = game:GetService("CoreGui") end)
    for _, cont in ipairs(conts) do
        local ok, objs = pcall(function() return cont:GetGuiObjectsAtPosition(x, y) end)
        if ok and type(objs) == "table" then
            for _, o in ipairs(objs) do
                local area, trans, isAct = 0, 1, false
                pcall(function() area = o.AbsoluteSize.X * o.AbsoluteSize.Y end)
                pcall(function() trans = o.BackgroundTransparency end)
                pcall(function() isAct = (o.Active == true) end)
                local interactive = (o:IsA("GuiButton") or o:IsA("TextBox"))
                local tag = tostring(o.Name) .. " (" .. tostring(o.ClassName) .. ")"
                if interactive and area < bigArea then
                    hard = hard or tag
                elseif interactive or isAct or trans < 0.5 then
                    soft = soft or tag
                end
            end
        end
    end
    return hard, soft
end

function S.PickByRayScan(ray, filterList)
    local maxD = 220
    local okOp, parts = pcall(function()
        local op = OverlapParams.new()
        op.FilterType = Enum.RaycastFilterType.Exclude
        op.FilterDescendantsInstances = filterList or {}
        op.MaxParts = 80
        return workspace:GetPartBoundsInRadius(ray.Origin + ray.Direction * (maxD / 2), maxD / 2, op)
    end)
    if not okOp or type(parts) ~= "table" or #parts == 0 then
        return nil, "không quét được vật nào quanh tia (game có thể chặn quét)"
    end
    local best, bestD = nil, math.huge
    for _, pt in ipairs(parts) do
        local okV, v = pcall(function() return pt.Position - ray.Origin end)
        if okV and v then
            local okT, t = pcall(function() return v:Dot(ray.Direction) end)
            if okT and t and t > 0.5 then
                local okD, d = pcall(function()
                    local closest = ray.Origin + ray.Direction * t
                    local dd = (pt.Position - closest).Magnitude
                    local r = 0
                    pcall(function() r = math.max(pt.Size.X, pt.Size.Y, pt.Size.Z) / 2 end)
                    return math.max(0, dd - r)
                end)
                if okD and d and d < bestD then bestD, best = d, pt end
            end
        end
    end
    if not best then return nil, "quét " .. #parts .. " vật nhưng không vật nào nằm trước tia" end
    return best, "quét dự phòng — vật này Raycast không thấy (CanQuery=false), lệch tia "
        .. string.format("%.1f", bestD) .. "m"
end

function S.NearestParts(n)
    local char = player.Character
    local root = char and char:FindFirstChild("HumanoidRootPart")
    if not root then return nil, "chưa có nhân vật (đang ở lobby/menu?)" end
    local ok, parts = pcall(function()
        local op = OverlapParams.new()
        op.FilterType = Enum.RaycastFilterType.Exclude
        op.FilterDescendantsInstances = {char, gui}
        op.MaxParts = 120
        return workspace:GetPartBoundsInRadius(root.Position, 60, op)
    end)
    if not ok or type(parts) ~= "table" or #parts == 0 then
        return nil, "không quét được vật nào trong 60 studs quanh bạn"
    end
    local list = {}
    for _, pt in ipairs(parts) do
        local okD, d = pcall(function() return (pt.Position - root.Position).Magnitude end)
        if okD and d then list[#list+1] = {p = pt, d = d} end
    end
    table.sort(list, function(a, b) return a.d < b.d end)
    local names = {}
    for i = 1, math.min(n or 5, #list) do
        names[#names+1] = list[i].p.Name .. " (" .. string.format("%.1f", list[i].d) .. "m)"
    end
    return (list[1] and list[1].p or nil), table.concat(names, " · "), #list
end

function S.FillObjPanel(inst, hitPos, hitNormal, hitMat, how)
    if not inst then return false end
    objResultPanel.Visible = true

    objNameLbl.Text = "Name: "..inst.Name
    objClassLbl.Text = "Class: "..inst.ClassName
    objPosLbl.Text = string.format("Position: %.3f, %.3f, %.3f", hitPos.X, hitPos.Y, hitPos.Z)

    if inst:IsA("BasePart") then
        local size = inst.Size
        local cf = inst.CFrame
        local rx, ry, rz = cf:ToOrientation()
        local look = cf.LookVector
        local color = inst.Color
        local material = inst.Material

        objSizeLbl.Text = string.format("Size: %.3f, %.3f, %.3f", size.X, size.Y, size.Z)
        objRotLbl.Text = string.format("Rotation: P=%.1f° Y=%.1f° R=%.1f°",
            math.deg(rx), math.deg(ry), math.deg(rz))
        objLookLbl.Text = string.format("Look: %.3f, %.3f, %.3f", look.X, look.Y, look.Z)
        objMatLbl.Text = "Material: "..tostring(material):gsub("Enum.Material.", "")
        objColorLbl.Text = string.format("Color: R=%d G=%d B=%d",
            math.floor(color.R*255), math.floor(color.G*255), math.floor(color.B*255))

        if highlightEnabled then CreateHighlight(inst) end
    else
        objSizeLbl.Text = "Size: N/A (không phải BasePart)"
        objRotLbl.Text = "Rotation: N/A"
        objLookLbl.Text = "Look: N/A"
        objMatLbl.Text = "Material: N/A"
        objColorLbl.Text = "Color: N/A"
        RemoveCurrentHighlight()
    end

    objPathLbl.Text = "Path: "..GetFullPath(inst)
    objResultPanel:SetAttribute("LastHitPos", tostring(hitPos))
    objResultPanel:SetAttribute("LastPath", GetFullPath(inst))
    objResultPanel:SetAttribute("LastNormal", tostring(hitNormal))
    objResultPanel:SetAttribute("LastMaterial", tostring(hitMat))

    S.AnaLast.ok = true
    S.AnaLast.name = tostring(inst.Name)
    S.AnaLast.how = tostring(how or "")
    S.AnaSay(tostring(how or "🎯 tia bắn trúng") .. ": " .. inst.Name .. " (" .. inst.ClassName .. ")"
        .. (S.AnaNote and (" · " .. S.AnaNote) or ""))
    return true
end

S.RefreshDevLabel()   -- v4.8: hiện đúng cách chọn vật của thiết bị đang dùng

local function PickObjectAt(mousePos, isRightClick, ignoreHubGui)
    local x, y = mousePos.X, mousePos.Y
    S.AnaLast.ok = false
    S.AnaNote = nil
    S.AnaWhyScan = nil

    if not ignoreHubGui and Hit.onHub(x, y) then
        S.AnaSay("⏭️ Điểm chạm nằm trên menu của hub — bấm ra ngoài game rồi thử lại")
        return
    end
    local hardGui, softGui = S.GuiBlockAt(x, y)
    if hardGui then
        S.AnaSay("🚫 Điểm chạm là NÚT của game (" .. hardGui .. ") — dời ra chỗ khác để không hit xuyên nút")
        return
    end
    if softGui and not S.AnaCfg.skipGameGui then
        S.AnaSay("🚫 HUD của game (" .. softGui .. ") đang chặn — BẬT '🛡 Phân tích xuyên HUD game' là dùng được")
        return
    end
    if softGui then
        S.AnaNote = "🛡 phân tích xuyên HUD của game (" .. softGui .. ")"
    end

    local cam2 = S.AnaCam()
    if not cam2 then
        S.AnaSay("⚠️ Game chưa có camera (Workspace.CurrentCamera = nil) — vào lại game rồi thử")
        return
    end
    local unitRay = cam2:ViewportPointToRay(x, y)
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    local filterList = {}
    if player.Character then table.insert(filterList, player.Character) end
    if gui then table.insert(filterList, gui) end
    params.FilterDescendantsInstances = filterList
    params.IgnoreWater = S.AnaCfg.ignoreWater   -- v4.8: không để mặt nước ăn tia

    local result = workspace:Raycast(unitRay.Origin, unitRay.Direction * S.AnaCfg.maxDist, params)
    if result and result.Material == Enum.Material.Water then
        local pw = RaycastParams.new()
        pw.FilterType = Enum.RaycastFilterType.Exclude
        pw.FilterDescendantsInstances = filterList
        pw.IgnoreWater = true
        local rw = workspace:Raycast(unitRay.Origin, unitRay.Direction * S.AnaCfg.maxDist, pw)
        if rw and rw.Instance then
            result = rw
            S.AnaNote = "🌊 đã xuyên qua mặt nước để lấy vật bên dưới"
        end
    end

    local inst, hitPos, hitNormal, hitMat, how
    if result and result.Instance then
        inst, hitPos, hitNormal, hitMat = result.Instance, result.Position, result.Normal, result.Material
        how = "🎯 tia bắn trúng"
    elseif S.AnaCfg.scanFallback then
        local part, why2 = S.PickByRayScan(unitRay, filterList)
        if part then
            inst, hitPos, how = part, part.Position, "🧭 " .. tostring(why2)
            pcall(function() hitNormal = part.CFrame.LookVector end)
            pcall(function() hitMat = part.Material end)
        else
            S.AnaWhyScan = why2
        end
    end
    objResultPanel.Visible = true

    if inst then
        S.FillObjPanel(inst, hitPos, hitNormal, hitMat, how)
    else
        local prevName = objNameLbl.Text
        objNameLbl.Text = "⚠️ Không hit gì — giữ vật đang chọn"
        S.AnaSay("⚠️ Không thấy vật ở điểm chạm"
            .. (S.AnaWhyScan and (" (" .. S.AnaWhyScan .. ")") or " (tia đi vào khoảng không)")
            .. " — thử ⊕ Giữa màn hình, 🧭 Gần nhất, hoặc lại gần vật hơn")
        task.delay(1.0, function()
            if objNameLbl and objNameLbl.Parent and objNameLbl.Text == "⚠️ Không hit gì — giữ vật đang chọn" then
                objNameLbl.Text = prevName
            end
        end)
    end
end

trackConn(UserInputService.InputBegan:Connect(function(input, gp)
    if gp then return end   -- Roblox đã xử lý input này (nút GUI / TextBox focus)
    if not analyzeObjectEnabled then return end

    if input.UserInputType == Enum.UserInputType.MouseButton2 then
        PickObjectAt(input.Position, true)
        return
    end

    if input.UserInputType == Enum.UserInputType.Touch then
        local startTick = tick()
        local startPos = input.Position
        local holdConn, moveConn
        holdConn = trackConn(UserInputService.InputEnded:Connect(function(e)
            if e == input then
                holdConn:Disconnect()
                if moveConn then moveConn:Disconnect() end
                if tick() - startTick >= S.AnaCfg.holdTime then   -- v4.8: ngưỡng giữ ngón chỉnh được
                    task.spawn(function() PickObjectAt(input.Position, false) end)
                end
            end
        end))
        moveConn = trackConn(UserInputService.InputChanged:Connect(function(e)
            if e == input then
                local d = (e.Position - startPos).Magnitude
                if d > S.AnaCfg.holdMove then   -- v4.8: ngón tay trên mobile hay xê dịch -> nới 12px lên 18px
                    holdConn:Disconnect()
                    moveConn:Disconnect()
                end
            end
        end))
        return
    end
end))

objectAnalyzeBtn.Activated:Connect(function()
    analyzeObjectEnabled = not analyzeObjectEnabled
    if analyzeObjectEnabled then
        objectAnalyzeBtn.Text = "🎯 Phân Tích Vật: BẬT"
        D.SetBg(objectAnalyzeBtn, C.GREEN)   -- v4.5: đổi màu kèm chữ tương phản
        S.RefreshDevLabel()
        S.AnaSay("✅ Đã BẬT phân tích vật thể · " .. S.DeviceText())
    else
        objectAnalyzeBtn.Text = "🎯 Phân Tích Vật: TẮT"
        D.SetBg(objectAnalyzeBtn, C.GRAY)
        RemoveCurrentHighlight()
    end
end)

highlightToggleBtn.Activated:Connect(function()
    highlightEnabled = not highlightEnabled
    if highlightEnabled then
        highlightToggleBtn.Text = "💜 Highlight Tím: BẬT"
        D.SetBg(highlightToggleBtn, C.PURPLE)
    else
        highlightToggleBtn.Text = "💜 Highlight Tím: TẮT"
        D.SetBg(highlightToggleBtn, C.GRAY)
        RemoveCurrentHighlight()
    end
end)

removeHighlightBtn.Activated:Connect(function()
    RemoveCurrentHighlight()
end)

-- ---------- v4.8: ⊕ VẬT THỂ Ở GIỮA MÀN HÌNH (nền tảng nào cũng bấm được, khỏi cần chuột phải) ----------
S.AnaUi.centerBtn.Activated:Connect(function()
    local vpx, vpy = 1280, 720
    pcall(function()
        local cam2 = S.AnaCam()
        if cam2 then vpx, vpy = cam2.ViewportSize.X, cam2.ViewportSize.Y end
    end)
    S.AnaSay("⊕ Đang ẩn menu 0.35s để lấy vật ở GIỮA màn hình...")
    local prevEnabled = true
    pcall(function() prevEnabled = gui.Enabled end)
    view.restoreHub = function() if gui.Parent then gui.Enabled = prevEnabled end end
    pcall(function() gui.Enabled = false end)
    task.wait(0.12)
    if view.dead then return end
    PickObjectAt(Vector2.new(vpx / 2, vpy / 2), true, true)
    task.wait(0.25)
    if view.restoreHub then pcall(view.restoreHub); view.restoreHub = nil end
end)

-- ---------- v4.8: 🧭 VẬT GẦN NHẤT (cứu cánh cho game không cho chọn theo điểm chạm) ----------
S.AnaUi.nearBtn.Activated:Connect(function()
    local part, info, total = S.NearestParts(5)
    if not part then
        S.AnaSay("⚠️ Không tìm được vật gần bạn: " .. tostring(info))
        return
    end
    local hp = nil
    pcall(function() hp = part.Position end)
    S.FillObjPanel(part, hp, nil, nil, "🧭 vật gần bạn nhất (trong " .. tostring(total) .. " vật quét được)")
    pcall(function()
        local l = S.AnaUi.whyLbl
        if l and l.Parent then l.Text = "🔎 Quanh bạn 60 studs: " .. tostring(info) end
    end)
end)

-- ---------- v4.8: 2 công tắc cho game "khó" (đều mặc định BẬT) ----------
S.AnaUi.skipGuiBtn.Activated:Connect(function()
    S.AnaCfg.skipGameGui = not S.AnaCfg.skipGameGui
    local on = S.AnaCfg.skipGameGui
    S.AnaUi.skipGuiBtn.Text = on and "🛡 Phân tích xuyên HUD game: BẬT"
                                 or "🛡 Xuyên HUD game: TẮT (như bản cũ)"
    D.SetBg(S.AnaUi.skipGuiBtn, on and C.GREEN or C.GRAY)
    S.AnaSay(on and "🛡 BẬT: bỏ qua HUD/nền bán trong suốt của game (khuyên dùng, nhất là 📱 mobile)"
                or "🛡 TẮT: quay lại kiểu cũ — HUD của game sẽ CHẶN phân tích ở điểm chạm")
end)
S.AnaUi.scanFbBtn.Activated:Connect(function()
    S.AnaCfg.scanFallback = not S.AnaCfg.scanFallback
    local on = S.AnaCfg.scanFallback
    S.AnaUi.scanFbBtn.Text = on and "🧭 Quét dự phòng: BẬT" or "🧭 Quét dự phòng: TẮT"
    D.SetBg(S.AnaUi.scanFbBtn, on and C.GREEN or C.GRAY)
    S.AnaSay(on and "🧭 BẬT: tia trượt sẽ tự quét vật gần tia — game đặt CanQuery=false vẫn phân tích được"
                or "🧭 TẮT: chỉ dùng tia raycast (nhanh hơn, nhưng game khó sẽ không ra kết quả)")
end)

clearObjectBtn.Activated:Connect(function()
    objResultPanel.Visible = false
    RemoveCurrentHighlight()
end)

copyObjBtn.Activated:Connect(function()
    local pos = objResultPanel:GetAttribute("LastHitPos")
    if pos and pos ~= "" then
        local copied = S.CopyToClipboard(pos)
        flash(copyObjBtn, copied and "✅ Đã Copy!" or "⚠️ Không có clipboard", 1.2)
    end
end)

copyPathBtn.Activated:Connect(function()
    local path = objResultPanel:GetAttribute("LastPath")
    if path and path ~= "" then
        local copied = S.CopyToClipboard(path)
        flash(copyPathBtn, copied and "✅ Đã Copy!" or "⚠️ Không có clipboard", 1.2)
    end
end)

posY = posY + 6

local copyCoordBtn = Button(supportTab, "📋 Copy Tọa Độ Dưới Chân", 8, posY, 468, 26, C.BLUE)
copyCoordBtn.Name = "SupportCopyGround"
posY = posY + 32

copyCoordBtn.Activated:Connect(function()
    local groundPos = GetGroundPosition()
    local rootPart = GetRootPart()
    local finalPos = groundPos or (rootPart and rootPart.CFrame.Position)
    if not finalPos then return end
    local text = string.format("%.3f, %.3f, %.3f", finalPos.X, finalPos.Y, finalPos.Z)
    local copied = S.CopyToClipboard(text)
    flash(copyCoordBtn, copied and ("✅ Đã Copy: " .. text) or ("⚠️ " .. text), 2)
end)

Label(supportTab, "🚀 Teleport Tới Tọa Độ", posY)
posY = posY + 14

D.tpLblX = Label(supportTab, "X:", posY)
D.tpLblX.Size = UDim2.new(0,14,0,14); D.tpLblX.Position = UDim2.new(0,8,0,posY)
local tpXIn = New("TextBox", {
    Name="SupportX",
    Size=UDim2.new(0,136,0,24), Position=UDim2.new(0,24,0,posY-2), Text="0",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0,
    TextColor3=Color3.fromRGB(233, 237, 245), Font=Enum.Font.Code, TextSize=11,
    BorderSizePixel=0, ClearTextOnFocus=false, Active=true, Selectable=true, ZIndex=10,
}, supportTab)
Corner(tpXIn, UDim.new(0,4)); Stroke(tpXIn, Color3.fromRGB(255,100,100), 1.2)

D.tpLblY = Label(supportTab, "Y:", posY)
D.tpLblY.Size = UDim2.new(0,14,0,14); D.tpLblY.Position = UDim2.new(0,166,0,posY)
local tpYIn = New("TextBox", {
    Name="SupportY",
    Size=UDim2.new(0,136,0,24), Position=UDim2.new(0,182,0,posY-2), Text="0",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0,
    TextColor3=Color3.fromRGB(233, 237, 245), Font=Enum.Font.Code, TextSize=11,
    BorderSizePixel=0, ClearTextOnFocus=false, Active=true, Selectable=true, ZIndex=10,
}, supportTab)
Corner(tpYIn, UDim.new(0,4)); Stroke(tpYIn, Color3.fromRGB(100,255,100), 1.2)

D.tpLblZ = Label(supportTab, "Z:", posY)
D.tpLblZ.Size = UDim2.new(0,14,0,14); D.tpLblZ.Position = UDim2.new(0,324,0,posY)
local tpZIn = New("TextBox", {
    Name="SupportZ",
    Size=UDim2.new(0,136,0,24), Position=UDim2.new(0,340,0,posY-2), Text="0",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0,
    TextColor3=Color3.fromRGB(233, 237, 245), Font=Enum.Font.Code, TextSize=11,
    BorderSizePixel=0, ClearTextOnFocus=false, Active=true, Selectable=true, ZIndex=10,
}, supportTab)
Corner(tpZIn, UDim.new(0,4)); Stroke(tpZIn, Color3.fromRGB(100,150,255), 1.2)

posY = posY + 30

local fillCurrentBtn = Button(supportTab, "📍 Lấy Vị Trí Dưới Chân", 8, posY, 372, 24, C.ORANGE)
fillCurrentBtn.Name = "SupportFillPosition"
local tpBtn = Button(supportTab, "🚀 Teleport", 386, posY, 90, 24, C.GREEN)
tpBtn.Name = "SupportTeleport"
posY = posY + 30

fillCurrentBtn.Activated:Connect(function()
    local groundPos = GetGroundPosition()
    local rootPart = GetRootPart()
    local p = groundPos or (rootPart and rootPart.CFrame.Position)
    if not p then return end
    tpXIn.Text = string.format("%.3f", p.X)
    tpYIn.Text = string.format("%.3f", p.Y)
    tpZIn.Text = string.format("%.3f", p.Z)
end)

tpBtn.Activated:Connect(function()
    local rootPart = GetRootPart()
    if not rootPart then return end
    local x = tonumber(tpXIn.Text) or 0
    local y = tonumber(tpYIn.Text) or 0
    local z = tonumber(tpZIn.Text) or 0
    rootPart.CFrame = CFrame.new(Vector3.new(x, y, z))
    flash(tpBtn, "✅ Đã Teleport!", 1.5)
end)

S.SpeedMeter = S.SpeedMeter or {}
do            -- do..end: main chunk gần cạn 200 slot local -> KHÔNG khai báo local ở scope chunk
local SV = S.SpeedMeter

SV.on     = (SV.on == true)
SV.live   = tonumber(SV.live) or 0        -- tốc độ hiện tại (studs/s, đã làm mượt)
SV.max    = tonumber(SV.max)  or 0        -- đỉnh cao nhất đo được trong phiên
SV.base   = tonumber(SV.base)             -- mặc định của game (studs/s) — nil = chưa dò được
SV.src    = SV.src or "chưa dò"
SV.ws     = tonumber(SV.ws) or 0          -- WalkSpeed hiện tại của Humanoid
SV._bound = (SV._bound == true)

local function num(v)
    v = tonumber(v)
    if v == nil or v ~= v then return nil end          -- NaN -> nil
    return v
end
local function fmt(n) return string.format("%.1f", num(n) or 0) end
local function say(msg) pcall(function() if D.hubStatus then D.hubStatus.Text = msg end end) end

local function move() return S.Move end
local function myHum()
    local m = move()
    if m and m.Hum then
        local ok, h = pcall(m.Hum)
        if ok and h then return h end
    end
    local ch = player.Character
    if not ch then return nil end
    local ok, h = pcall(function() return ch:FindFirstChildOfClass("Humanoid") end)
    if ok and h then return h end
    return ch:FindFirstChild("Humanoid")
end
local function myRoot()
    local m = move()
    if m and m.Root then
        local ok, r = pcall(m.Root)
        if ok and r then return r end
    end
    local ch = player.Character
    return ch and ch:FindFirstChild("HumanoidRootPart") or nil
end
local function readWS(h)
    if not h then return nil end
    local ok, v = pcall(function() return h.WalkSpeed end)
    if ok then local n = num(v); if n then return n end end
    local m = move()
    if m and m.comp then return num(m.comp(h, "WalkSpeed", nil)) end
    return nil
end
local function readPos(r)
    if not r then return nil end
    local m = move()
    local x, y, z
    if m and m.comp then
        local p
        pcall(function() p = r.Position end)
        x, y, z = m.comp(p, "X", nil), m.comp(p, "Y", nil), m.comp(p, "Z", nil)
    else
        pcall(function() local p = r.Position; x, y, z = p.X, p.Y, p.Z end)
    end
    x, y, z = num(x), num(y), num(z)
    if x == nil or y == nil or z == nil then return nil end
    return x, y, z
end

-- ---------- dò tốc độ MẶC ĐỊNH của game ----------
function SV.Detect()
    local m = move()
    local h = myHum()
    local hws = readWS(h)
    local baseWS = m and num(m._baseWS) or nil
    local applying = (m ~= nil) and (m.speed == true or m.runMode == true)
    local src
    if applying and baseWS then
        SV.base = baseWS
        src = "game (hub đã học khi 👟 bật)"
    elseif hws and hws > 0 then
        if (not applying) and SV._lastWS and math.abs(hws - SV._lastWS) > 0.01 then
            src = "game VỪA ĐỔI tốc độ → mặc định mới"
        else
            src = "game (WalkSpeed của nhân vật)"
        end
        SV.base = hws
    elseif baseWS then
        SV.base = baseWS
        src = "hub (đã học)"
    else
        SV.base = 16
        src = "mặc định Roblox"
    end
    if hws and hws > 0 and not applying then SV._lastWS = hws end
    if hws then SV.ws = hws end
    SV.src = src
    return SV.base, SV.src
end

-- ---------- đo tốc độ HIỆN TẠI + giữ đỉnh CAO NHẤT ----------
function SV.Step(dt)
    dt = num(dt)
    if not dt or dt <= 0 then dt = 1 / 60 end
    if dt > 0.5 then dt = 0.5 end
    local h = myHum()
    local x, y, z = readPos(myRoot())
    if x then
        if SV._px then
            local dx, dy, dz = x - SV._px, y - SV._py, z - SV._pz
            local d = math.sqrt(dx * dx + dy * dy + dz * dz)
            if d <= 25 then                                  -- > 25 studs/frame = teleport/respawn/lag -> bỏ mẫu
                local inst = d / dt
                if d > 0.001 then                            -- chỉ tính mẫu CÓ dịch chuyển (đứng yên không phá số liệu)
                    SV._n = (SV._n or 0) + 1
                    SV.live = (SV._n <= 1) and inst or (SV.live + (inst - SV.live) * 0.35)
                    if inst >= 0.5 and inst > SV.max then SV.max = inst end
                end
            end
        end
        SV._px, SV._py, SV._pz = x, y, z
    else
        SV._px = nil
        SV.live = 0
    end
    if h then SV.ws = readWS(h) or SV.ws end
    SV.Detect()
    SV.Sync()
    return SV.live
end

local function setText(lbl, s)
    if lbl and lbl.Text ~= s then lbl.Text = s end
end

-- ---------- vẽ số liệu ra widget + HUD ----------
function SV.Sync()
    local base = num(SV.base) or 0
    local ratio = (base > 0) and (SV.ws / base) or 0
    local scale = math.max(SV.max, base, 1)
    local pct = SV.live / scale
    if pct < 0 then pct = 0 elseif pct > 1 then pct = 1 end   -- KHÔNG dùng math.clamp (chỉ có trong Luau)
    local bpct = base / scale
    if bpct < 0 then bpct = 0 elseif bpct > 1 then bpct = 1 end
    setText(SV.baseLbl, string.format("🎯 Mặc định game: %s studs/s · nguồn: %s", fmt(base), tostring(SV.src)))
    setText(SV.wsLbl, string.format("🚶 WalkSpeed hiện tại: %s%s", fmt(SV.ws),
        (ratio > 0) and string.format("  (×%.2f mặc định)", ratio) or ""))
    setText(SV.liveLbl, string.format("⚡ Tốc độ thật: %s studs/s", fmt(SV.live)))
    setText(SV.maxLbl, string.format("🏁 Cao nhất: %s studs/s", fmt(SV.max)))
    if SV.btn then
        setText(SV.btn, SV.on and "🎯 Định vị tốc độ: BẬT" or "🎯 Định vị tốc độ: TẮT")
        if SV._btnOn ~= SV.on then
            SV._btnOn = SV.on
            SV.btn.BackgroundColor3 = SV.on and C.GREEN or C.GRAY
        end
    end
    if SV.barFill and SV._barPct ~= pct then
        SV._barPct = pct
        SV.barFill.Size = UDim2.new(pct, 0, 1, 0)
    end
    if SV.barBase and SV._barBase ~= bpct then
        SV._barBase = bpct
        SV.barBase.Position = UDim2.new(bpct, -1, 0, 0)
    end
    if SV.hud then
        if SV.hud.Visible ~= SV.on then SV.hud.Visible = SV.on end
        setText(SV.hudLbl, string.format("🎯 %s (mặc định game) · 🚶 %s\n⚡ %s · 🏁 %s studs/s",
            fmt(base), fmt(SV.ws), fmt(SV.live), fmt(SV.max)))
    end
end

function SV.Status()
    return string.format("🎯 %s · ⚡ %s · 🏁 %s", fmt(SV.base), fmt(SV.live), fmt(SV.max))
end

-- ---------- bật/tắt vòng đo (chỉ chạy khi BẬT -> không tốn tài nguyên) ----------
function SV.Bind(on)
    if on and not SV._bound then
        SV._bound = true
        local ok = pcall(function()
            RunService:BindToRenderStep("BC_SpeedMeter", Enum.RenderPriority.Camera.Value - 6, function(dt)
                pcall(function() SV.Step(dt) end)
            end)
        end)
        if not ok then SV._bound = false end
    elseif (not on) and SV._bound then
        SV._bound = false
        pcall(function() RunService:UnbindFromRenderStep("BC_SpeedMeter") end)
    end
    return SV._bound
end
function SV.Set(on)
    SV.on = (on == true)
    if SV.on then
        SV._px, SV._n = nil, 0
        SV.Detect()
        SV._lastWS = nil
        SV.Bind(true)
        SV.Step(1 / 60)                 -- có số ngay, không phải đợi frame sau
    else
        SV.Bind(false)
        SV._px, SV._n = nil, 0
    end
    SV.Sync()
    return SV.on
end
function SV.Toggle() return SV.Set(not SV.on) end
function SV.Reset()                     -- xoá đỉnh, vẫn đo tiếp
    SV.max, SV.live = 0, 0
    SV._n = 0
    SV.Sync()
    return SV.max
end

-- ---------- widget trong tab 🛠 Hỗ Trợ ----------
Label(supportTab, "🎯 Định vị tốc độ game (mặc định · hiện tại · cao nhất)", posY)
posY = posY + 18
SV.btn      = Button(supportTab, "🎯 Định vị tốc độ: TẮT", 8, posY, 300, 26, C.GRAY)
SV.resetBtn = Button(supportTab, "🗑 Xoá đỉnh", 314, posY, 162, 26, C.RED)
posY = posY + 30
SV.baseLbl = Label(supportTab, "🎯 Mặc định game: — studs/s", posY)
SV.baseLbl.TextColor3 = C.ACCENT
SV.baseLbl.TextSize = 9
posY = posY + 16
SV.wsLbl = Label(supportTab, "🚶 WalkSpeed hiện tại: —", posY)
SV.wsLbl.TextSize = 9
posY = posY + 16
SV.liveLbl = Label(supportTab, "⚡ Tốc độ thật: 0.0 studs/s", posY)
SV.liveLbl.TextColor3 = C.GREEN
SV.liveLbl.TextSize = 9
posY = posY + 16
SV.maxLbl = Label(supportTab, "🏁 Cao nhất: 0.0 studs/s", posY)
SV.maxLbl.TextColor3 = C.ORANGE
SV.maxLbl.TextSize = 9
posY = posY + 16

local smBarBg = New("Frame", {
    Size=UDim2.new(1,-16,0,10), Position=UDim2.new(0,8,0,posY),
    BackgroundColor3=Color3.fromRGB(24, 28, 38), BackgroundTransparency=0.15,
    BorderSizePixel=0, ZIndex=6,
}, supportTab)
Corner(smBarBg, UDim.new(0,5)); Stroke(smBarBg, C.BORDER, 1)
SV.barFill = New("Frame", {
    Size=UDim2.new(0,0,1,0), Position=UDim2.new(0,0,0,0),
    BackgroundColor3=C.BLUE, BackgroundTransparency=0.15, BorderSizePixel=0, ZIndex=7,
}, smBarBg)
Corner(SV.barFill, UDim.new(0,5))
SV.barBase = New("Frame", {                -- vạch xanh = tốc độ MẶC ĐỊNH của game (mốc so sánh)
    Size=UDim2.new(0,2,1,0), Position=UDim2.new(0.25,-1,0,0),
    BackgroundColor3=C.GREEN, BackgroundTransparency=0, BorderSizePixel=0, ZIndex=8,
}, smBarBg)
posY = posY + 16

SV.hintLbl = Label(supportTab, "ℹ️ Chỉ ĐO, không sửa gì · Vạch xanh = mặc định game · Tự học lại khi game đổi.", posY)
SV.hintLbl.TextSize = 9
posY = posY + 18

-- ---------- HUD nổi trong màn hình game (đóng menu vẫn thấy) ----------
SV.hud = New("Frame", {
    Name = "TDZ_SupportSpeedHud",
    Size = UDim2.new(0, 214, 0, 44), Position = UDim2.new(0, 12, 0.5, -22),
    BackgroundColor3 = Color3.fromRGB(16, 19, 26), BackgroundTransparency = 0.25,
    BorderSizePixel = 0, Visible = false, ZIndex = 24,
}, gui)
Corner(SV.hud, UDim.new(0,8)); Stroke(SV.hud, C.ACCENT, 1.4)
SV.hudLbl = New("TextLabel", {
    Size = UDim2.new(1,-12,1,0), Position = UDim2.new(0,6,0,0), Text = "🎯 ...",
    BackgroundTransparency = 1, TextColor3 = C.WHITE,
    Font = Enum.Font.GothamBold, TextSize = 9,
    TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Center,
    ZIndex = 25, TextWrapped = true,
}, SV.hud)

SV.btn.Activated:Connect(function()
    local on = SV.Set(not SV.on)
    say(on and ("🎯 định vị tốc độ: BẬT · mặc định game " .. fmt(SV.base) .. " studs/s")
           or "🎯 định vị tốc độ: TẮT")
end)
SV.resetBtn.Activated:Connect(function()
    SV.Reset()
    say("🎯 đã xoá đỉnh · cao nhất = 0")
end)

SV.Detect()
SV.Sync()
view.stopSpeedMeter = function()
    SV.on = false
    SV.Bind(false)
    if SV.hud then SV.hud:Destroy(); SV.hud = nil end
end
end
Label(supportTab, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", posY)
posY = posY + 16
Label(supportTab, "💾 Waypoint Đã Lưu", posY)
posY = posY + 14

local wpNameIn = New("TextBox", {
    Name="SupportWaypointName",
    Size=UDim2.new(1,-130,0,24), Position=UDim2.new(0,8,0,posY), Text="",
    PlaceholderText="Tên waypoint...",
    PlaceholderColor3=Color3.fromRGB(122, 130, 148),
    BackgroundColor3=Color3.fromRGB(26, 29, 38), BackgroundTransparency=0,
    TextColor3=Color3.fromRGB(233, 237, 245), Font=Enum.Font.GothamMedium, TextSize=11,
    BorderSizePixel=0, ClearTextOnFocus=false, Active=true, Selectable=true, ZIndex=10,
}, supportTab)
Corner(wpNameIn, UDim.new(0,4)); Stroke(wpNameIn, Color3.fromRGB(180,180,200), 1.2)
New("UIPadding", {PaddingLeft=UDim.new(0,6)}, wpNameIn)

local saveWpBtn = Button(supportTab, "💾 Lưu", 0, 0, 100, 24, C.PURPLE)
saveWpBtn.Name = "SupportSaveWaypoint"
saveWpBtn.Position = UDim2.new(1, -110, 0, posY)

posY = posY + 32

local wpListFrame = New("Frame", {
    Name="SupportWaypoints",
    Size=UDim2.new(1,-16,0,0), Position=UDim2.new(0,8,0,posY),
    BackgroundTransparency=1, BorderSizePixel=0, ZIndex=6,
}, supportTab)
New("UIListLayout", {SortOrder=Enum.SortOrder.LayoutOrder, Padding=UDim.new(0,4)}, wpListFrame)

local RebuildWaypoints

saveWpBtn.Activated:Connect(function()
    local rootPart = GetRootPart()
    if not rootPart then return end
    local name = wpNameIn.Text
    if #name == 0 then name = "WP "..(#bridge.getWaypoints()+1) end
    table.insert(bridge.getWaypoints(), {name = name, pos = rootPart.CFrame.Position})
    wpNameIn.Text = ""
    if RebuildWaypoints then RebuildWaypoints() end
    Store.saveSoon()
end)

RebuildWaypoints = function()
    for _, c in ipairs(wpListFrame:GetChildren()) do
        if not c:IsA("UIListLayout") then c:Destroy() end
    end

    if #bridge.getWaypoints() == 0 then
        New("TextLabel", {
            Size=UDim2.new(1,0,0,26),
            Text="📭 Chưa có waypoint nào.",
            BackgroundTransparency=1, TextColor3=C.GRAY,
            Font=Enum.Font.GothamMedium, TextSize=10,
            TextXAlignment=Enum.TextXAlignment.Center, ZIndex=7,
        }, wpListFrame)
        supportTab.CanvasSize = UDim2.new(0, 0, 0, posY + 40)
        return
    end

    local totalH = 0
    for i, wp in ipairs(bridge.getWaypoints()) do
        local row = New("Frame", {
            Size=UDim2.new(1,0,0,30),
            BackgroundColor3=Color3.fromRGB(26, 29, 38),
            BackgroundTransparency=0.1, BorderSizePixel=0, ZIndex=6,
        }, wpListFrame)
        Corner(row, UDim.new(0,5)); Stroke(row)

        New("TextLabel", {
            Size=UDim2.new(1,-120,1,0), Position=UDim2.new(0,8,0,0),
            Text=wp.name.." ("..string.format("%.0f, %.0f, %.0f", wp.pos.X, wp.pos.Y, wp.pos.Z)..")",
            BackgroundTransparency=1, TextColor3=C.DARK,
            Font=Enum.Font.GothamBold, TextSize=9,
            TextXAlignment=Enum.TextXAlignment.Left, ZIndex=7,
        }, row)

        local goBtn = New("TextButton", {
            Size=UDim2.new(0,50,0,22), Position=UDim2.new(1,-84,0,4),
            Text="🚀 Tới", BackgroundColor3=C.GREEN, BackgroundTransparency=0.1,
            TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=9,
            BorderSizePixel=0, ZIndex=8,
        }, row)
        Corner(goBtn, UDim.new(0,4))
        goBtn.Activated:Connect(function()
            local rootPart = GetRootPart()
            if not rootPart then return end
            rootPart.CFrame = CFrame.new(wp.pos)
        end)

        local delBtn = New("TextButton", {
            Size=UDim2.new(0,26,0,22), Position=UDim2.new(1,-30,0,4),
            Text="🗑", BackgroundColor3=C.RED, BackgroundTransparency=0.1,
            TextColor3=C.WHITE, Font=Enum.Font.GothamBold, TextSize=10,
            BorderSizePixel=0, ZIndex=8,
        }, row)
        Corner(delBtn, UDim.new(0,4))
        delBtn.Activated:Connect(function()
            for index, entry in ipairs(bridge.getWaypoints()) do
                if entry == wp then table.remove(bridge.getWaypoints(), index); break end
            end
            RebuildWaypoints()
            Store.saveSoon()
        end)

        totalH = totalH + 34
    end

    wpListFrame.Size = UDim2.new(1,-16,0,totalH)
    supportTab.CanvasSize = UDim2.new(0, 0, 0, posY + totalH + 20)
end

RebuildWaypoints()
view.RefreshWaypoints = RebuildWaypoints

-- END ORIGINAL_SUPPORT_SUBSYSTEM
    end)
    if not ok then view.Destroy(); error("Hỗ Trợ: " .. tostring(err)) end
    -- Publish this session's analyzer/speed API while active; do not overwrite game controllers.
    for key, value in pairs(S) do oldOwner[key], installed[key], owner[key] = owner[key], value, value end
    view.State = S
    trackConn(supportRoot.Destroying:Connect(function() view.Destroy(true) end))
    trackConn(screen.Destroying:Connect(function() view.Destroy(true) end))
    return view
end
-- END SUPPORT_FACTORY

local api = rawget(_G, "BananaCatHubAPI")
local getter = type(api) == "table" and api.SupportBridge or nil
local bridge = type(getter) == "function" and getter(api) or getter
assert(type(bridge) == "table" and bridge.protocol == 1 and bridge.alive(),
    "Hãy mở bản taodepzai cập nhật trước khi chạy Hỗ Trợ riêng")
local old = rawget(_G, "TDZSupportStandalone")
if type(old) == "table" and type(old.Destroy) == "function" then pcall(old.Destroy) end
local view = CreateSupport(bridge)
_G.TDZSupportStandalone = view
return view
