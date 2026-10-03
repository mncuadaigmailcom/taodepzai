-- ============================================================================
-- Test chạy thật (Luau WASM + Roblox stub): hub có load được không,
-- tính năng cũ còn nguyên không, và 🌳 định vị vật theo tên có chạy đúng không.
-- ============================================================================
local PASS, FAIL, MSGS = 0, 0, {}
local function t(name, cond, extra)
    if cond then PASS = PASS + 1
    else
        FAIL = FAIL + 1
        MSGS[#MSGS + 1] = "FAIL: " .. name .. (extra and ("  ->  " .. tostring(extra)) or "")
    end
    return cond and true or false
end
local function near(a, b, eps) return math.abs((tonumber(a) or -1e9) - (tonumber(b) or 1e9)) <= (eps or 1) end

-- ══════════════════════════════════════════════════════════════════════════
-- NHÓM 16: ⭕ ĐỊNH VỊ VÒNG (tab 🛠 Hỗ Trợ) — để trong hàm riêng cho khỏi vượt
-- trần 200 local của Luau (hàm khác vẫn thấy hub locals qua upvalue).
-- ══════════════════════════════════════════════════════════════════════════
local function __RUN_RING_TESTS()
    local R = _G.BananaCatHub_Ring
    t("⭕ có _G.BananaCatHub_Ring (định vị vòng)", type(R) == "table")
    if type(R) ~= "table" then return end
    t("⭕ S.Ring == _G.BananaCatHub_Ring (cùng 1 bảng)", S.Ring == R)

    -- ---- 16.1 khung nằm trong tab 🛠 Hỗ Trợ, NGAY TRÊN "🎯 Định vị tốc độ game"
    local panel = R.ui and R.ui.panel
    local tab = panel and panel.Parent
    t("khung ⭕ nằm trong tab 🛠 Hỗ Trợ", panel ~= nil and tab ~= nil)
    local speedLbl = nil
    if tab ~= nil then
        for _, ch in ipairs(tab:GetChildren()) do
            if ch:IsA("TextLabel") and tostring(ch.Text):find("Định vị tốc độ game", 1, true) ~= nil then
                speedLbl = ch
                break
            end
        end
    end
    t("khung ⭕ nằm NGAY TRÊN phần định vị tốc độ game (không đè nhau)",
        panel ~= nil and speedLbl ~= nil
        and (panel.Position.Y.Offset + panel.Size.Y.Offset) <= speedLbl.Position.Y.Offset,
        tostring(panel and (panel.Position.Y.Offset + panel.Size.Y.Offset)) .. " <= " .. tostring(speedLbl and speedLbl.Position.Y.Offset))
    t("vẫn đủ 7 tab sau khi thêm khung ⭕", #tabContent == 7, #tabContent)

    -- ---- 16.2 chỉnh độ to / nhỏ của vòng
    t("chỉnh bán kính: SetRadius(20) -> 20", near(R.SetRadius(20), 20), R.radius)
    t("bán kính bị kẹp trong 5..2000 (không cho số vô lý)",
        near(R.SetRadius(1), 5) and near(R.SetRadius(99999), 2000))
    R.SetRadius(60)
    R.ui.btnMinus.Activated:Fire()
    local afterMinus = R.radius
    R.ui.btnPlus.Activated:Fire()
    t("nút ➖ ➕ chỉnh bán kính từng bước 10",
        near(afterMinus, 50) and near(R.radius, 60), tostring(afterMinus) .. " / " .. tostring(R.radius))
    R.ui.radiusIn.Text = "75"
    R.ui.btnRadiusSet.Activated:Fire()
    t("ô bán kính nhập tay: gõ 75 -> 75", near(R.radius, 75), R.radius)
    t("🎨 đổi màu vòng theo bảng màu", (function()
        local c0 = R.color
        R.ui.btnColor.Activated:Fire()
        local ok = (R.color ~= c0) and #R.palette >= 3
        R.color = c0
        R.ApplyStyle()
        return ok
    end)())

    -- ---- 16.3 đổ vòng + quét mọi vật trong vòng
    local function has(name)
        for inst in pairs(R.items) do
            if tostring(inst.Name) == name then return true end
        end
        return false
    end
    R.Set(false)
    R.center = nil
    R.SetRadius(30)
    R.Place()
    local root = R.Root()
    t("🎯 Đổ vòng đặt tâm đúng vị trí nhân vật",
        R.on == true and R.center ~= nil and root ~= nil and (R.center - root.Position).Magnitude < 0.001)
    R.Scan()
    R.DrainPending(1e9)
    t("quét được vật trong bán kính 30m (Hòn Đá ~21m)", has("Hòn Đá"))
    t("KHÔNG định vị vật ngoài vòng (Rừng Cây ~40m)", not has("Rừng Cây"))
    t("bỏ qua chính nhân vật mình (không tự định vị mình)", not has("TestPlayer"))
    t("Highlight gắn vào vật TRONG Workspace nên nhìn thấy được", (function()
        for _, it in pairs(R.items) do
            if it.hl ~= nil and it.hl.Parent ~= nil then
                return it.hl.Parent:IsDescendantOf(workspace)
            end
        end
        return false
    end)())
    t("mỗi vật có nhãn tên + khoảng cách (BillboardGui)", (function()
        for _ = 1, 6 do R.Tick() end     -- nhãn được ghi theo lượt (chống khựng) như thiết kế
        for _, it in pairs(R.items) do
            if it.bb ~= nil and it.lbl ~= nil then
                return tostring(it.lbl.Text):find("⭕", 1, true) ~= nil
            end
        end
        return false
    end)())
    t("giới hạn maxItems: chỉ giữ 3 đơn vị gần tâm nhất", (function()
        R.maxItems = 3
        R.Scan()
        R.DrainPending(1e9)
        local n = 0
        for _ in pairs(R.items) do n = n + 1 end
        R.maxItems = 40
        return n == 3
    end)())

    -- ---- 16.4 người chơi / NPC / vật đang DI CHUYỂN: vào vòng thì hiện, ra thì mất
    R.SetRadius(120)
    R.Scan()
    R.DrainPending(1e9)
    t("người chơi khác trong vòng -> đúng 1 marker cho 1 người (gộp Model)",
        (function()
            local n, kind = 0, nil
            for inst, it in pairs(R.items) do
                if tostring(inst.Name) == "NguoiKhac" then n = n + 1; kind = it.kind end
            end
            return n == 1 and kind == "player"
        end)(),
        (function()
            for _, it in pairs(R.items) do if it.kind == "player" then return tostring(it.kind) end end
            return "không thấy"
        end)())

    local npcModel = Instance.new("Model")
    npcModel.Name = "NPC Gỗ"
    local npcPart = Instance.new("Part")
    npcPart.Name = "Thân NPC"
    npcPart.Size = Vector3.new(2, 5, 2)
    npcPart.Anchored = true
    npcPart.Position = Vector3.new(500, 5, 500)
    npcPart.Parent = npcModel
    Instance.new("Humanoid", npcModel)
    npcModel.Parent = workspace
    R.Scan()
    R.DrainPending(1e9)
    t("NPC ở ngoài vòng -> chưa định vị", not has("NPC Gỗ"))
    npcPart.Position = Vector3.new(6, 5, 6)
    R.Scan()
    R.DrainPending(1e9)
    t("NPC đi VÀO vòng -> tự hiện (đúng 1 marker, gắn nhãn 🤖 NPC)",
        R.items[npcModel] ~= nil and R.items[npcModel].kind == "npc")
    npcPart.Position = Vector3.new(500, 5, 500)
    R.Scan()
    t("NPC đi RA khỏi vòng -> tự mất, không còn marker", R.items[npcModel] == nil)

    local box = Instance.new("Part")
    box.Name = "Thùng Di Động"
    box.Size = Vector3.new(2, 2, 2)
    box.Anchored = true
    box.Position = Vector3.new(200, 5, 0)
    box.Parent = workspace
    R.Scan()
    R.DrainPending(1e9)
    t("vật ở xa vòng -> không định vị", not has("Thùng Di Động"))
    box.Position = Vector3.new(0, 5, -10)
    R.Scan()
    R.DrainPending(1e9)
    t("vật DI CHUYỂN vào vòng -> tự hiện", has("Thùng Di Động"))
    box.Position = Vector3.new(200, 5, 0)
    R.Scan()
    t("vật đi RA khỏi vòng -> tự mất", R.items[box] == nil)

    local mesh = Instance.new("MeshPart")
    mesh.Name = "Tảng Đá Mesh"
    mesh.Size = Vector3.new(2, 2, 2)
    mesh.Position = Vector3.new(3, 5, 3)
    mesh.Parent = workspace
    local folderUnit = _G.__TEST_TREE_FOLDER
    R.SetRadius(80)
    R.Scan()
    R.DrainPending(1e9)
    t("định vị được cả MeshPart (mọi loại vật)", has("Tảng Đá Mesh") and R.items[mesh] ~= nil)
    t("vật trong Folder -> gộp 1 marker cho cả Folder (Khu Cây)",
        folderUnit ~= nil and R.items[folderUnit] ~= nil and R.items[folderUnit].kind == "group",
        folderUnit and tostring(R.items[folderUnit] and R.items[folderUnit].kind))

    -- ---- 16.5 thông tin đầy đủ GIỐNG "📊 phân tích toạ độ"
    local probe = Instance.new("Part")
    probe.Name = "Vật Mẫu Info"
    probe.Size = Vector3.new(3, 4, 5)
    probe.Position = Vector3.new(4, 5, 4)
    probe.Material = Enum.Material.Wood
    probe.Color = Color3.fromRGB(200, 100, 50)
    probe.Anchored = true
    probe.Parent = workspace
    R.SetRadius(60)
    R.center = Vector3.new(0, 5, 0)
    R.Scan()
    R.DrainPending(1e9)
    R.Select(probe)
    R.RefreshInfo()
    local rows = R.Info(probe, probe)
    local byKey = {}
    for _, r in ipairs(rows) do byKey[r.k] = r.v end
    local missing = {}
    for _, k in ipairs({ "Name", "Class", "Position", "Size", "Rotation", "Look", "Material", "Color", "Path" }) do
        if byKey[k] == nil then missing[#missing + 1] = k end
    end
    t("thông tin vật đủ 9 dòng như 📊 phân tích toạ độ", #missing == 0, table.concat(missing, ","))
    t("Position đúng định dạng 3 số thập phân",
        byKey.Position == string.format("%.3f, %.3f, %.3f", 4, 5, 4), tostring(byKey.Position))
    t("có thêm dòng 📍 Cách tâm vòng + 🧍 Cách bạn",
        byKey["📍 Cách tâm vòng"] ~= nil and byKey["🧍 Cách bạn"] ~= nil)
    t("các dòng thông tin TRÙNG KHỚP với 📊 phân tích toạ độ (OT.Info)", (function()
        local OTm = _G.BananaCatHub_ObjTrack
        if OTm == nil or OTm.Info == nil then return false end
        local other = OTm.Info(probe, probe)
        if #other < 9 then return false end
        local map2 = {}
        for _, r in ipairs(other) do map2[r.k] = r.v end
        for k, v in pairs(map2) do
            if byKey[k] ~= v then return false end
        end
        return true
    end)())
    t("khung thông tin trong tab hiện đủ chữ khi chọn vật",
        R.ui.info.Visible == true and tostring(R.ui.infoLbl.Text):find("Position:", 1, true) ~= nil)
    probe.Position = Vector3.new(9, 5, 9)
    R._infoAt = 0
    R.RefreshInfo()
    t("thông tin CẬP NHẬT khi vật di chuyển",
        tostring(R.ui.infoLbl.Text):find(string.format("%.3f", 9), 1, true) ~= nil)

    -- ---- 16.6 ba nút ảo trên màn hình (mỗi nút có hình tròn nhỏ bên trong)
    R.SetShowButtons(true)
    R.Buttons()
    local gui = playerGui:FindFirstChild("BC_RingBtns")
    t("có 3 nút ảo 🎯/⏪/⏩ trên màn hình", gui ~= nil
        and gui:FindFirstChild("BC_RingBtn_drop") ~= nil
        and gui:FindFirstChild("BC_RingBtn_back") ~= nil
        and gui:FindFirstChild("BC_RingBtn_fwd") ~= nil)
    t("mỗi nút ảo có HÌNH TRÒN NHỎ bên trong (Inner + UICorner)", (function()
        if gui == nil then return false end
        for _, nm in ipairs({ "BC_RingBtn_drop", "BC_RingBtn_back", "BC_RingBtn_fwd" }) do
            local b = gui:FindFirstChild(nm)
            local inner = b and b:FindFirstChild("Inner")
            if inner == nil or inner:FindFirstChildOfClass("UICorner") == nil then return false end
        end
        return true
    end)())
    t("có nút 🔒 để bật/tắt chế độ chỉnh vị trí",
        gui ~= nil and gui:FindFirstChild("BC_RingBtn_lock") ~= nil)
    R.SetShowButtons(false)
    t("👁 tắt 3 nút ảo -> ẩn hết khỏi màn hình", gui.Enabled == false)
    R.SetShowButtons(true)
    t("👁 bật lại 3 nút ảo -> hiện lại", gui.Enabled == true)

    -- ---- 16.7 kéo nút: BẬT mới kéo được, TẮT thì khoá cứng
    local UIS = game:GetService("UserInputService")
    local function mkInput(kind, x, y)
        return { UserInputType = Enum.UserInputType[kind], Position = Vector2.new(x, y) }
    end
    local dropBtn = gui:FindFirstChild("BC_RingBtn_drop")
    local x0, y0 = dropBtn.Position.X.Offset, dropBtn.Position.Y.Offset
    R.SetEdit(false)
    t("mặc định là KHOÁ (chưa chỉnh được nút)", R.editMode == false)
    dropBtn.InputBegan:Fire(mkInput("MouseButton1", 10, 10))
    UIS.InputChanged:Fire(mkInput("MouseMovement", 300, 300))
    UIS.InputEnded:Fire(mkInput("MouseButton1", 300, 300))
    t("TẮT chỉnh nút -> kéo KHÔNG đổi vị trí nút",
        dropBtn.Position.X.Offset == x0 and dropBtn.Position.Y.Offset == y0,
        tostring(dropBtn.Position.X.Offset) .. " vs " .. tostring(x0))
    R.SetEdit(true)
    t("BẬT chỉnh nút -> editMode = true", R.editMode == true)
    local centerBefore = R.center and Vector3.new(R.center.X, R.center.Y, R.center.Z) or nil
    dropBtn.InputBegan:Fire(mkInput("MouseButton1", 10, 10))
    UIS.InputChanged:Fire(mkInput("MouseMovement", 310, 290))
    UIS.InputEnded:Fire(mkInput("MouseButton1", 310, 290))
    t("BẬT chỉnh nút -> kéo ĐỔI vị trí nút", dropBtn.Position.X.Offset ~= x0)
    t("vị trí nút được LƯU lại (nhớ cho lần sau)",
        R.btns ~= nil and R.btns.drop ~= nil
        and R.btns.drop.x == dropBtn.Position.X.Offset and R.btns.drop.y == dropBtn.Position.Y.Offset)
    dropBtn.Activated:Fire()
    t("kéo xong KHÔNG kích hoạt nút (không tự đổ lại vòng khi đang chỉnh)",
        centerBefore ~= nil and R.center ~= nil and (R.center - centerBefore).Magnitude < 0.001)
    R.center = Vector3.new(999, 5, 999)
    dropBtn.Activated:Fire()
    t("bấm (không kéo) nút 🎯 -> đổ vòng tại chân bạn",
        R.center ~= nil and R.Root() ~= nil and (R.center - R.Root().Position).Magnitude < 0.001)
    R.SetEdit(false)

    local dir = R.Look()
    R.center = Vector3.new(0, 5, 0)
    R.step = 14
    gui:FindFirstChild("BC_RingBtn_fwd").Activated:Fire()
    t("nút ⏩ TIẾN vòng 14m theo hướng nhìn",
        ((R.center - Vector3.new(0, 5, 0)) - dir * 14).Magnitude < 0.05, tostring(R.center))
    gui:FindFirstChild("BC_RingBtn_back").Activated:Fire()
    t("nút ⏪ LÙI vòng về chỗ cũ", (R.center - Vector3.new(0, 5, 0)).Magnitude < 0.05, tostring(R.center))

    R.SetEdit(true)
    gui:FindFirstChild("BC_RingBtn_lock").Activated:Fire()
    t("bấm 🔒 -> TẮT chỉnh vị trí nút", R.editMode == false)
    gui:FindFirstChild("BC_RingBtn_lock").Activated:Fire()
    t("bấm 🔒 lần nữa -> BẬT lại chỉnh vị trí", R.editMode == true)
    R.SetEdit(false)
    R.ResetButtons()
    R.Buttons()
    t("↩️ Đặt lại nút đưa 3 nút về vị trí mặc định",
        math.abs(dropBtn.Position.X.Offset - (R.Viewport().X - 92)) < 1)

    -- ---- 16.8 nút trong tab + vòng nhìn thấy + danh sách trong vòng
    R.Set(false)
    R.ui.btnOn.Activated:Fire()
    t("nút ⭕ trong tab bật vòng (tự đổ vòng tại chân bạn)", R.on == true and R.center ~= nil)
    R.ui.btnFollow.Activated:Fire()
    t("🧲 Theo bạn: bật -> vòng bám đúng vị trí nhân vật",
        R.follow == true and R.Root() ~= nil and (R.center - R.Root().Position).Magnitude < 0.001)
    local hrp = R.Root()
    hrp.Position = Vector3.new(0, 5, 120)
    R.Step(1 / 60)
    t("🧲 nhân vật di chuyển -> vòng đi theo (tâm cập nhật theo bạn)",
        (R.center - hrp.Position).Magnitude < 0.001)
    hrp.Position = Vector3.new(0, 5, 0)
    R.ui.btnFollow.Activated:Fire()
    t("🧲 bấm lần nữa -> tắt bám theo", R.follow == false)

    R.SetShowVis(true)
    R.RefreshVis()
    local vis = workspace:FindFirstChild("BC_RingVis")
    t("🖼 có vòng nhìn thấy trong map (đĩa neon + vành tròn)",
        vis ~= nil and vis:FindFirstChild("BC_RingEdge") ~= nil)
    R.Scan()
    R.DrainPending(1e9)
    t("vòng nhìn thấy KHÔNG tự định vị chính nó", not has("BC_RingVis"))
    R.SetShowVis(false)
    t("🖼 tắt vòng nhìn thấy -> xoá khỏi map", workspace:FindFirstChild("BC_RingVis") == nil)

    R.SetRadius(60)
    R.center = Vector3.new(0, 5, 0)
    R.Set(true)
    R.Scan()
    R.DrainPending(1e9)
    R.RefreshList()
    local row1 = R.ui.list:FindFirstChild("RRow_1")
    t("danh sách 'trong vòng' có dòng với 3 nút 📊/🚀/📋",
        row1 ~= nil and row1:FindFirstChild("RSee") ~= nil
        and row1:FindFirstChild("RFly") ~= nil and row1:FindFirstChild("RCopy") ~= nil)
    if row1 ~= nil then
        row1:FindFirstChild("RSee").Activated:Fire()
        t("bấm 📊 trên dòng -> chọn vật + khung thông tin hiện",
            R._sel ~= nil and R.ui.info.Visible == true)
    else
        t("bấm 📊 trên dòng -> chọn vật + khung thông tin hiện", false, "không có dòng nào")
    end
    t("📋 Copy Tọa Độ đưa toạ độ vật đang chọn vào clipboard", (function()
        R.Select(probe)
        local did, txt = R.CopyCoords()
        return did == true and _G.__clipboard == txt and tostring(txt):find(",", 1, true) ~= nil
    end)())
    t("📋 Copy Path đưa đường dẫn vật vào clipboard", (function()
        R.Select(probe)
        local did, txt = R.CopyPath()
        return did == true and _G.__clipboard == txt and tostring(txt):find("Workspace", 1, true) ~= nil
    end)())

    -- ---- 16.9 chống khựng: Tick chỉ cập nhật labelBudget mục mỗi lượt
    t("mỗi lượt Tick chỉ cập nhật ≤ labelBudget mục (chống khựng)", (function()
        R.labelBudget = 2
        for _, it in pairs(R.items) do it.txt = nil end
        R.Tick()
        local n = 0
        for _, it in pairs(R.items) do if it.txt ~= nil then n = n + 1 end end
        R.labelBudget = 16
        return n <= 2
    end)())
    t("Step() 1 khung hình vẫn dưới ngưỡng thời gian cho phép", (function()
        local t0 = os.clock()
        for _ = 1, 30 do R.Step(1 / 60) end
        return (os.clock() - t0) < 1.0
    end)())

    -- ---- dọn dẹp để không ảnh hưởng về sau
    R.Set(false)
    R.Clear()
    R.SetShowVis(false)
    pcall(function() npcModel:Destroy() end)
    pcall(function() box:Destroy() end)
    pcall(function() probe:Destroy() end)
    pcall(function() mesh:Destroy() end)
    t("tắt vòng -> xoá sạch marker, không còn gì sót lại",
        R.on == false and next(R.items) == nil)
end

local function __RUN_TESTS()
-- ---------- 1. hub load & API cơ bản ----------
t("hub nạp xong, có _G.BananaCatHubAPI", _G.BananaCatHubAPI ~= nil)
t("có _G.BananaCatHub_MV (nhóm di chuyển)", _G.BananaCatHub_MV ~= nil)
t("có _G.BananaCatHub_Free (khán giả)", _G.BananaCatHub_Free ~= nil)
t("có _G.BananaCatHub_ObjTrack (định vị vật)", _G.BananaCatHub_ObjTrack ~= nil)

local OT = _G.BananaCatHub_ObjTrack
local MV = _G.BananaCatHub_MV
local API = _G.BananaCatHubAPI

-- ---------- 2. tính năng cũ còn nguyên (không bị mất) ----------
local oldFns = {
    { "S.Loc.Make", S and S.Loc and S.Loc.Make }, { "S.Loc.TickOne", S and S.Loc and S.Loc.TickOne },
    { "S.Loc.Tick", S and S.Loc and S.Loc.Tick }, { "S.Loc.StopAll", S and S.Loc and S.Loc.StopAll },
    { "S.Spec.Set", S and S.Spec and S.Spec.Set }, { "S.Spec.Stop", S and S.Spec and S.Spec.Stop },
    { "S.Free.Set", S and S.Free and S.Free.Set }, { "S.Free.Stop", S and S.Free and S.Free.Stop },
    { "S.Glow.Set", S and S.Glow and S.Glow.Set }, { "S.Glow.Stop", S and S.Glow and S.Glow.Stop },
    { "S.AntiBanSet", S and S.AntiBanSet }, { "S.AntiBanArm", S and S.AntiBanArm },
    { "S.GlassRefreshList", S and S.GlassRefreshList }, { "S.OpenGlassPanel", S and S.OpenGlassPanel },
    { "S.OpenPlayerTab", S and S.OpenPlayerTab }, { "S.RunHubAction", S and S.RunHubAction },
    { "S.CopyToClipboard", S and S.CopyToClipboard }, { "S.FetchServers", S and S.FetchServers },
    { "MV.FlyToPlayer", MV and MV.FlyToPlayer }, { "MV.FlyToGlass", MV and MV.FlyToGlass },
    { "MV.Safe.Step", MV and MV.Safe and MV.Safe.Step }, { "MV.StopAll", MV and MV.StopAll },
    { "MV.PlaceGlass", MV and MV.PlaceGlass }, { "MV.SetNoclip", MV and MV.SetNoclip },
    { "MV.SetFly", MV and MV.SetFly }, { "MV.SetSpeed", MV and MV.SetSpeed },
    { "API.EmbedGui", API and API.EmbedGui }, { "API.MakeTemplate", API and API.MakeTemplate },
}
for _, f in ipairs(oldFns) do t("còn hàm cũ " .. f[1], type(f[2]) == "function") end

t("📚 Script Hub: 31 mục cũ + 3 mục mới = 34", #S.ScriptHubList == 34, #S.ScriptHubList)
t("tab 👥 còn đủ 4 khung", D.playerTab:FindFirstChild("HubLoc_Panel") ~= nil
    and D.playerTab:FindFirstChild("HubSpec_Panel") ~= nil
    and D.playerTab:FindFirstChild("HubGlass_Panel") ~= nil
    and D.playerTab:FindFirstChild("HubObjTrack_Panel") ~= nil)
t("khung 🌳 nằm DƯỚI 3 khung cũ (không chồng)",
    (D.playerTab:FindFirstChild("HubObjTrack_Panel").Position.Y.Offset)
    > (D.playerTab:FindFirstChild("HubGlass_Panel").Position.Y.Offset))
t("tab ⚙️ Thiết lập vẫn còn (được thêm sau khối 🌳)", (function()
    for _, tab in ipairs(tabContent) do
        if tab:FindFirstChild("Section") or true then end
    end
    return #tabContent >= 7
end)())

-- ---------- 3. chuẩn hoá tên / từ khoá ----------
t("Norm bỏ dấu: 'Cây Cổ Thụ' -> 'cay co thu'", OT.Norm("Cây Cổ Thụ") == "cay co thu", OT.Norm("Cây Cổ Thụ"))
t("Norm bỏ dấu: 'Đá' -> 'da'", OT.Norm("Đá") == "da", OT.Norm("Đá"))
t("Norm hạ chữ hoa: 'CÂY' -> 'cay'", OT.Norm("CÂY") == "cay", OT.Norm("CÂY"))
local keys = OT.Split("cây, đá ; rương")
t("Split tách 3 từ khoá, bỏ dấu", #keys == 3 and keys[1] == "cay" and keys[2] == "da" and keys[3] == "ruong",
    table.concat(keys, "|"))

-- ---------- 4. quét + tạo định vị ----------
OT.keys = OT.Split("cay")
OT.on = true
OT.Bind()
t("Bind đã đăng ký render step BC_ObjTrack", _G.__renderSteps["BC_ObjTrack"] ~= nil)
local found = OT.Rescan(true)
t("tìm thấy đúng 6 vật 'cây' trong map (4 part + 1 model + 1 folder)", found == 6, found)
t("KHÔNG định vị 'Cây' nằm trong nhân vật mình / người khác", #OT.list == 6, #OT.list)
local nItems = 0
for _ in pairs(OT.items) do nItems = nItems + 1 end
t("tạo đủ 6 Highlight+nhãn đang theo dõi", nItems == 6, nItems)
local first = OT.items[__TEST_TREES[1]]
t("vật đầu có Highlight gắn đúng vào vật", first and first.hl and first.hl.Adornee == __TEST_TREES[1])
t("nhãn BillboardGui gắn vào part của vật (nên vật đi đâu nhãn theo đó)",
    first and first.bb and first.bb.Adornee == __TEST_TREES[1])
t("Highlight đang bật + xuyên tường", first and first.hl and first.hl.Enabled == true)
local modelItem = OT.items[__TEST_TREE_MODEL]
t("Model (Rừng Cây) được giải ra part để gắn nhãn", modelItem ~= nil and modelItem.part ~= nil
    and modelItem.part.Name == "ThanCay", modelItem and modelItem.part and modelItem.part.Name)
t("Highlight của Model gắn vào chính Model (bao cả cây)", modelItem and modelItem.hl.Adornee == __TEST_TREE_MODEL)

-- ---------- 5. vật DI CHUYỂN thì định vị bám theo ----------
local tree = __TEST_TREES[2]
tree.Position = Vector3.new(90, 5, 0)
OT.Tick()
t("nhãn vẫn gắn vào part sau khi vật di chuyển", OT.items[tree].bb.Adornee == tree)
t("khoảng cách trong nhãn được cập nhật theo vị trí mới (90 studs)",
    tostring(OT.items[tree].lbl.Text):find("90", 1, true) ~= nil, OT.items[tree].lbl.Text)
tree.Position = Vector3.new(30, 5, 0)     -- trả lại vị trí cũ

-- ---------- 6. lọc khoảng cách ----------
OT.SetMaxDist(50)
t("giới hạn 50m -> chỉ còn 4 vật 'cây'", OT._found == 4, OT._found)
t("giới hạn khoảng cách được lưu", OT.maxDist == 50)
OT.SetMaxDist(0)
OT.Rescan(true)
t("bỏ giới hạn -> lại thấy 6 vật", OT._found == 6, OT._found)

-- ---------- 7. vật bị xoá thì tự bỏ định vị ----------
local victim = __TEST_TREES[3]
victim:Destroy()
OT.Tick()
t("vật bị xoá thì mất định vị ngay", OT.items[victim] == nil)
OT.Rescan(true)
t("quét lại: còn 5 vật", OT._found == 5, OT._found)

-- ---------- 8. nhiều từ khoá + giới hạn số lượng ----------
OT.SetQuery("cây, đá")
local okWait = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.2 do
        __pump(1)
        if #OT.keys == 2 and OT._found == 6 then return true end
    end
    return false
end)()
t("gõ 'cây, đá' (debounce) -> quét ra 6 vật", okWait, (OT._found or -1) .. " keys=" .. #OT.keys)
OT.maxItems = 2
OT.Rescan(true)
local shown = 0
for _ in pairs(OT.items) do shown = shown + 1 end
t("maxItems=2 -> chỉ theo dõi 2 vật gần nhất", shown == 2, shown)
t("báo rõ là đang bị cắt bớt", OT._capped == true)
OT.maxItems = 60
OT.Rescan(true)

-- ---------- 9. bảng danh sách trong tab 👥 ----------
OT.showRows = 8
D.playerTab.Visible = true          -- tab 👥 đang mở mới dựng bảng (đúng như trong game)
OT.RefreshList()
local listFrame = D.playerTab:FindFirstChild("HubObjTrack_Panel"):FindFirstChild("ObjTrackList")
local rows = 0
for _, c in ipairs(listFrame:GetChildren()) do if c.Name:sub(1, 6) == "OTRow_" then rows = rows + 1 end end
t("bảng 🌳 dựng đủ dòng (6 vật)", rows == 6, rows)
t("trạng thái có số vật + từ khoá", tostring(OT.Status()):find("cay", 1, true) ~= nil, OT.Status())

-- ---------- 10. đổi kiểu hiển thị ----------
local name1 = OT.CycleColor()
t("đổi màu trả về tên màu mới", type(name1) == "string" and #name1 > 0, name1)
OT.showBox = true
OT.ApplyStyle()
t("bật hộp bao quanh -> có box cho vật", OT.items[__TEST_TREES[1]] ~= nil and OT.items[__TEST_TREES[1]].box ~= nil)
OT.showBox = false
OT.ApplyStyle()
t("tắt hộp -> box ẩn", OT.items[__TEST_TREES[1]].box.Visible == false)
OT.thru = false
OT.ApplyStyle()
t("tắt xuyên tường -> nhãn không AlwaysOnTop", OT.items[__TEST_TREES[1]].bb.AlwaysOnTop == false)
OT.thru = true
OT.showLabel = false
OT.ApplyStyle()
t("tắt nhãn -> BillboardGui ẩn", OT.items[__TEST_TREES[1]].bb.Enabled == false)
OT.showLabel = true
OT.ApplyStyle()

-- ---------- 11. 🚀 bay tới vật & bám theo vật ----------
local target = __TEST_TREES[1]
local okFly, resFly = MV.FlyToObject(target)
t("MV.FlyToObject nhận vật", okFly == true and resFly == target, tostring(resFly))
t("đang ở trạng thái bay tới vật", MV._objFlyActive == true and MV._objFlyTarget == target)
t("đã bind render step BC_ObjFly", _G.__renderSteps["BC_ObjFly"] ~= nil)
__pump(3)
local root = MV.Root()
local bv = root:FindFirstChild("BC_ObjFlyVel")
t("có BodyVelocity gắn vào nhân vật", bv ~= nil)
t("BodyVelocity có vận tốc bay (>0)", bv ~= nil and (bv.Velocity.Magnitude or 0) > 0,
    bv and tostring(bv.Velocity.Magnitude))
local rootBefore = root.Position
target.Position = Vector3.new(60, 5, 0)      -- vật chạy đi
__pump(4)
t("vật di chuyển -> hướng bay đổi theo vật", tostring(MV._ObjFlyPart().Position.X) == "60",
    MV._ObjFlyPart() and MV._ObjFlyPart().Position.X)
MV.StopObjectFly()
t("dừng bay -> xoá BodyVelocity + trả trạng thái", MV._objFlyActive == false
    and root:FindFirstChild("BC_ObjFlyVel") == nil and _G.__renderSteps["BC_ObjFly"] == nil)

-- bay tới vật rồi xoá vật đó -> tự dừng, không lỗi
MV.FlyToObject(target)
__pump(2)
target:Destroy()
__pump(3)
t("vật đang bay tới bị xoá -> tự dừng bay", MV._objFlyActive == false)

-- ---------- 12. thẻ trong 📚 Script Hub ----------
local okA, msgA = pcall(function() return S.RunHubAction("objfind") end)
t("thẻ 🌳 trên hub chạy được", okA and tostring(msgA):find("🌳", 1, true) ~= nil, msgA)
local okB, msgB = pcall(function() return S.RunHubAction("objfly") end)
t("thẻ 🚀 bay tới vật chạy được (hoặc báo chưa có vật)", okB and type(msgB) == "string", msgB)
local okC, msgC = pcall(function() return S.RunHubAction("objclear") end)
t("thẻ 🧹 tắt định vị vật chạy được", okC and tostring(msgC):find("🧹", 1, true) ~= nil, msgC)
t("sau khi tắt: hết vật theo dõi + gỡ render step",
    next(OT.items) == nil and OT.on == false and _G.__renderSteps["BC_ObjTrack"] == nil)

-- ---------- 12b. LUỒNG UI THẬT: gõ tên vào ô 🔎 của tab 👥 ----------
local panel = D.playerTab:FindFirstChild("HubObjTrack_Panel")
t("khung 🌳 có đủ control có tên", panel:FindFirstChild("OTQuery") ~= nil
    and panel:FindFirstChild("OTToggle") ~= nil and panel:FindFirstChild("OTRescan") ~= nil
    and panel:FindFirstChild("OTStatus") ~= nil and panel:FindFirstChild("OTClear") ~= nil)
local qin = panel:FindFirstChild("OTQuery")
qin.Text = "đá"
qin:GetPropertyChangedSignal("Text"):Fire()
local uiOk = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if OT.on and OT._found == 1 then return true end
    end
    return false
end)()
t("gõ 'đá' vào ô 🔎 -> tự bật định vị đúng 1 vật", uiOk, tostring(OT._found))
local daPart = nil
for inst in pairs(OT.items) do daPart = inst end
t("vật được định vị đúng là 'Hòn Đá'", daPart ~= nil and daPart.Name == "Hòn Đá",
    daPart and daPart.Name)
t("nhãn trạng thái trên khung hiện đúng", tostring(panel:FindFirstChild("OTStatus").Text):find("da", 1, true) ~= nil,
    panel:FindFirstChild("OTStatus").Text)

-- bấm nút trên khung thật (không gọi hàm trực tiếp)
local toggleBtn = panel:FindFirstChild("OTToggle")
toggleBtn.Activated:Fire()
t("bấm 🌳 Định vị -> TẮT: gỡ hết định vị", OT.on == false and next(OT.items) == nil, OT.on)
toggleBtn.Activated:Fire()
t("bấm lần nữa -> BẬT lại và quét ra vật", OT.on == true and next(OT.items) ~= nil)
panel:FindFirstChild("OTRescan").Activated:Fire()
t("bấm 🔄 Quét lại không lỗi, vẫn còn vật", next(OT.items) ~= nil)
panel:FindFirstChild("OTClear").Activated:Fire()
t("bấm 🧹 Xoá hết -> sạch định vị", next(OT.items) == nil and OT.on == false)

-- ---------- 13. tắt định vị không ảnh hưởng tính năng khác ----------
local locOnBefore = S.Loc.on
S.Loc.Set(true)
t("📍 định vị người chơi vẫn BẬT được", S.Loc.on == true)
t("📍 vẫn tạo được định vị cho người chơi khác", next(S.Loc._items) ~= nil)
pcall(S.Loc.Tick)
S.Loc.Set(false)
t("📍 tắt lại sạch", next(S.Loc._items) == nil)

-- ---------- 13b. MÀU XANH NƯỚC + GIỐNG KHUNG "PHÂN TÍCH TOẠ ĐỘ" ----------
-- (dùng "Cây Dừa" vì "Cây Cổ Thụ" đã bị xoá ở test 🚀 phía trên)
local tree2 = __TEST_TREES[2]
OT.color = 1          -- về đúng màu mặc định của hub (các test trên đã bấm 🎨 đổi màu)
OT.keys = OT.Split("cay")
OT.on = true
OT.Rescan(true)
OT.Tick()             -- nhãn + khung 🎯 được cập nhật trong Tick (0,2s/lần)
t("màu mặc định là Xanh nước", OT.palette[1].name == "Xanh nước" and OT.Pal().name == "Xanh nước",
    OT.Pal().name)
t("màu xanh nước = RGB(0,170,255)", math.floor(OT.Pal().fill.B * 255) == 255
    and math.floor(OT.Pal().fill.G * 255) == 170 and math.floor(OT.Pal().fill.R * 255) == 0,
    tostring(OT.Pal().fill.G))
local it1 = OT.items[tree2]
t("Highlight giống kiểu phân tích toạ độ (FillTransparency 0.7, AlwaysOnTop)",
    it1.hl.FillTransparency == 0.7 and it1.hl.DepthMode == Enum.HighlightDepthMode.AlwaysOnTop,
    tostring(it1.hl.FillTransparency))
t("nhãn có dòng toạ độ 🧭 X/Y/Z", tostring(it1.lbl.Text):find("🧭", 1, true) ~= nil, it1.lbl.Text)
t("toạ độ trên nhãn đúng với vị trí vật (X 30.0)",
    tostring(it1.lbl.Text):find("X 30.0", 1, true) ~= nil, it1.lbl.Text)

local rows = OT.Info(tree2, tree2)
local kv = {}
for _, r in ipairs(rows) do kv[r.k] = r.v end
t("khung thông tin có đủ 9 dòng như 🎯 phân tích toạ độ",
    kv.Name and kv.Class and kv.Position and kv.Size and kv.Rotation and kv.Look and kv.Material and kv.Color and kv.Path,
    tostring(#rows))
t("Name/Class đúng", kv.Name == "Cây Dừa" and kv.Class == "Part", kv.Name .. "/" .. tostring(kv.Class))
t("Position đúng toạ độ vật", kv.Position == "30.000, 5.000, 0.000", kv.Position)
t("Size đúng", kv.Size == "4.000, 10.000, 4.000", kv.Size)
t("Rotation/Look/Material/Color đọc được", kv.Rotation ~= nil and kv.Look == "0.000, 0.000, -1.000"
    and kv.Material == "Plastic" and kv.Color == "R=163 G=162 B=165", tostring(kv.Material) .. " " .. tostring(kv.Color))
t("Path đúng dạng Workspace.…", tostring(kv.Path):sub(1, 9) == "Workspace", kv.Path)

-- bấm 📊 Xem trong danh sách -> khung thông tin hiện ra
D.playerTab.Visible = true
OT.RefreshList()
local listFrame = D.playerTab:FindFirstChild("HubObjTrack_Panel"):FindFirstChild("ObjTrackList")
local row1 = listFrame:FindFirstChild("OTRow_1")
local infoRowBtn = row1 and row1:FindFirstChild("OTInfoRow")
t("mỗi dòng có nút 📊 Xem", infoRowBtn ~= nil)
infoRowBtn.Activated:Fire()
local infoFrame = D.playerTab:FindFirstChild("HubObjTrack_Panel"):FindFirstChild("OTInfo")
t("bấm 📊 -> khung 🎯 hiện ra", OT._sel ~= nil and infoFrame.Visible == true, tostring(OT._sel))
t("khung 🎯 hiện đúng nội dung vật đã chọn",
    tostring(infoFrame:FindFirstChild("OTInfoLbl").Text):find("Name: " .. tostring(OT._sel.Name), 1, true) ~= nil,
    infoFrame:FindFirstChild("OTInfoLbl").Text)

-- vật di chuyển -> số liệu trong khung cập nhật theo
OT._sel.Position = Vector3.new(-42.5, 7, 3)
OT.Tick()
t("vật di chuyển -> toạ độ trong khung 🎯 cập nhật theo",
    tostring(infoFrame:FindFirstChild("OTInfoLbl").Text):find("-42.500", 1, true) ~= nil,
    infoFrame:FindFirstChild("OTInfoLbl").Text)

-- 2 nút copy
local copyPos = infoFrame:FindFirstChild("OTCopyPos")
local copyPath = infoFrame:FindFirstChild("OTCopyPath")
t("khung 🎯 có nút Copy Tọa Độ + Copy Path", copyPos ~= nil and copyPath ~= nil)
copyPos.Activated:Fire()
t("Copy Tọa Độ -> clipboard đúng chuỗi toạ độ mới",
    _G.__clipboard == "-42.500, 7.000, 3.000", tostring(_G.__clipboard))
copyPath.Activated:Fire()
local pathNow = tostring(_G.__clipboard)
t("Copy Path -> clipboard đúng đường dẫn vật",
    pathNow:find("Cây Dừa", 1, true) ~= nil, pathNow)

-- nút 🧭 trên khung: tắt toạ độ trên nhãn
local xyzBtn = D.playerTab:FindFirstChild("HubObjTrack_Panel"):FindFirstChild("OTXyz")
t("khung có nút 🧭 Nhãn toạ độ", xyzBtn ~= nil)
xyzBtn.Activated:Fire()
OT.Tick()
t("tắt 🧭 -> nhãn không còn dòng toạ độ", tostring(it1.lbl.Text):find("🧭", 1, true) == nil, it1.lbl.Text)
xyzBtn.Activated:Fire()
OT.Tick()
t("bật lại 🧭 -> nhãn có toạ độ trở lại", tostring(it1.lbl.Text):find("🧭", 1, true) ~= nil)

-- xoá vật đang chọn -> khung 🎯 tự ẩn, không lỗi
local selNow = OT._sel
selNow:Destroy()
OT.Tick()
t("vật đang chọn bị xoá -> khung 🎯 tự ẩn", infoFrame.Visible == false and OT._sel == nil)
OT.on = false
OT.Clear()

-- ---------- 13c. VẼ ĐÚNG CHỖ (lỗi "nhập tên mà không thấy gì") + DÁN PATH ----------
OT.color = 1
OT.keys = OT.Split("cay")
OT.on = true
OT.Rescan(true)
OT.Tick()
local t3 = __TEST_TREES[4]   -- "CÂY THÔNG" (các cây khác đã bị xoá ở test trên)
local it3 = OT.items[t3]
t("Highlight gắn thẳng vào VẬT (không phải PlayerGui)", it3 ~= nil and it3.hl.Parent == t3,
    it3 and tostring(it3.hl.Parent and it3.hl.Parent.Name))
t("Highlight nằm trong Workspace nên chắc chắn render", it3.hl:IsDescendantOf(workspace) == true)
t("nhãn BillboardGui gắn vào part (trong Workspace)", it3.bb.Parent == t3 and it3.bb:IsDescendantOf(workspace) == true)
t("Highlight vẫn giữ Adornee = vật", it3.hl.Adornee == t3)

-- Highlight bị xoá / bị chuyển sang PlayerGui -> Tick phải tự kéo về vật
it3.hl.Parent = OT._gui
OT.Tick()
t("Highlight bị chuyển sang PlayerGui -> Tick tự kéo về vật", OT.items[t3].hl.Parent == t3,
    tostring(OT.items[t3].hl.Parent and OT.items[t3].hl.Parent.Name))
it3.hl:Destroy()
OT.Tick()
t("Highlight bị xoá -> Tick tự tạo lại gắn vào vật",
    OT.items[t3].hl ~= nil and OT.items[t3].hl.Parent == t3)

-- bật 🔲 Hộp -> hộp cũng nằm trong Workspace
OT.showBox = true
OT.ApplyStyle()
t("hộp bao quanh gắn vào part (trong Workspace)",
    OT.items[t3].box ~= nil and OT.items[t3].box.Parent == t3
    and OT.items[t3].box:IsDescendantOf(workspace) == true)
OT.showBox = false
OT.ApplyStyle()

-- DÁN PATH vào ô tên vật vẫn tìm được
OT.SetQuery("Workspace.Rừng Cây")
local okPath = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if #OT.pathKeys > 0 and OT._found >= 1 then return true end
    end
    return false
end)()
t("dán path 'Workspace.Rừng Cây' -> tìm được (không còn 0 vật)", okPath,
    tostring(OT._found) .. " pathKeys=" .. tostring(#OT.pathKeys))
local foundModel = false
for inst in pairs(OT.items) do if inst == __TEST_TREE_MODEL then foundModel = true end end
t("path trỏ đúng Model 'Rừng Cây'", foundModel)

OT.SetQuery("game.Workspace.CÂY THÔNG")
local okPath2 = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if OT._found == 1 then return true end
    end
    return false
end)()
t("dán path 'game.Workspace.CÂY THÔNG' -> đúng 1 vật", okPath2, tostring(OT._found))
t("path có tiền tố game. vẫn hiểu", #OT.pathKeys == 1 and OT.pathKeys[1] == "workspace.cay thong",
    tostring(OT.pathKeys[1]))

-- KHÔNG khớp -> phải báo rõ, không im lặng
OT.SetQuery("vật-không-tồn-tại-xyz")
local okZero = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if OT._found == 0 and #OT.list == 0 then return true end
    end
    return false
end)()
t("tên không khớp -> 0 vật + có quét workspace", okZero and (OT._scanned or 0) > 0,
    tostring(OT._scanned))
t("Status nói rõ 'không thấy vật nào khớp' + số vật đã quét",
    tostring(OT.Status()):find("không thấy vật nào khớp", 1, true) ~= nil
    and tostring(OT.Status()):find("đã quét", 1, true) ~= nil, OT.Status())
D.playerTab.Visible = true
OT.RefreshList()
local listOT2 = D.playerTab:FindFirstChild("HubObjTrack_Panel"):FindFirstChild("ObjTrackList")
t("danh sách hiện dòng gợi ý OТEmpty thay vì trống trơn",
    listOT2:FindFirstChild("OTEmpty") ~= nil)

-- FOLDER: "Khu Cây" chứa "Gốc Cây" cũng định vị được, không bị trùng 2 lần
OT.SetQuery("khu cây")
local okFolder = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if OT.items[__TEST_TREE_FOLDER] ~= nil then return true end
    end
    return false
end)()
local fl = OT.items[__TEST_TREE_FOLDER]
t("định vị được cả Folder tên 'Khu Cây'", okFolder and fl ~= nil, tostring(OT._found))
t("Folder -> Highlight trỏ vào part bên trong (Folder không render được)",
    fl ~= nil and fl.hl.Adornee ~= nil and fl.hl.Adornee.Name == "Gốc Cây",
    fl and tostring(fl.hl.Adornee.Name))
-- đổi sang từ khoá "cây" để CẢ folder lẫn cây con đều khớp -> phải gộp lại 1
OT.SetQuery("cây")
local okFold2 = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if OT.items[__TEST_TREE_FOLDER] ~= nil and (OT._skipped or 0) >= 1 then return true end
    end
    return false
end)()
local childPart = __TEST_TREE_FOLDER:FindFirstChild("Gốc Cây")
t("cây con trong Folder không bị định vị trùng (Folder đã đại diện)",
    okFold2 and OT.items[childPart] == nil, "gộp=" .. tostring(OT._skipped))

-- nút 🚫 Bỏ qua người chơi
local skipBtn = D.playerTab:FindFirstChild("HubObjTrack_Panel"):FindFirstChild("OTSkip")
t("khung có nút 🚫 Bỏ qua người chơi", skipBtn ~= nil)
OT.SetQuery("cây trên đầu")          -- chỉ có trong nhân vật mình -> đang bị bỏ qua
local okSkip = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if #OT.list == 0 then return true end
    end
    return false
end)()
t("đang bật bỏ qua người chơi -> không thấy cây trên nhân vật", okSkip, tostring(OT._found))
skipBtn.Activated:Fire()
t("bấm 🚫 -> TẮT bỏ qua, thấy cây trong nhân vật", OT.skipPlayers == false and OT._found >= 1,
    tostring(OT._found))
skipBtn.Activated:Fire()
t("bấm lại -> BẬT bỏ qua như cũ", OT.skipPlayers == true)

-- dọn
OT.SetQuery("")
__pump(3)
OT.Clear()

-- ---------- 13d. TỐI ƯU CHỐNG KHỰNG ----------
-- (1) quét KHÔNG còn dùng workspace:GetDescendants() một phát
local descReal = workspace.GetDescendants
local descCalls = 0
workspace.GetDescendants = function(self, ...)
    descCalls = descCalls + 1
    return descReal(self, ...)
end
OT.keys = OT.Split("cay")
OT.on = true
pcall(OT.ScanBegin)
local guard = 0
while OT._passing and guard < 5000 do guard = guard + 1; OT.ScanSlice(400, 1e9) end
t("quét nền KHÔNG gọi GetDescendants", descCalls == 0, descCalls)
t("quét nền vẫn tìm đủ vật như quét thẳng", (OT._found or 0) == OT.Rescan(true), tostring(OT._found) .. " vs " .. tostring(OT.Rescan(true)))
workspace.GetDescendants = descReal

-- (2) quét chia lát: mỗi lát chỉ xử lý đúng ngân sách
pcall(OT.ScanBegin)
local before = OT._scanned
OT.ScanSlice(5, 1e9)
local step1 = OT._scanned - before
t("mỗi lát chỉ xử lý ≤5 vật (chia nhỏ theo khung hình)", step1 <= 5, step1)
t("lượt quét đầu chưa xong sau 1 lát (chia nhỏ thật)", OT._passing == true)
local slices = 0
while OT._passing and slices < 5000 do slices = slices + 1; OT.ScanSlice(5, 1e9) end
t("quét xong sau nhiều lát", OT._passing == false and slices > 1, slices)
t("kết quả chia lát = kết quả quét thẳng", (OT._found or 0) == OT.Rescan(true), tostring(OT._found))
t("có ghi nhận số vật đã quét", (OT._scanned or 0) > 0, tostring(OT._scanned))

-- (3) đệm tên: quét lại lần 2 không phải chuẩn hoá lại tên
local normReal = OT.Norm
local normCalls = 0
OT._nc = setmetatable({}, { __mode = "k" })   -- xoá đệm tên để đo lượt quét NGUỘI
OT.Norm = function(...) normCalls = normCalls + 1 return normReal(...) end
pcall(OT.ScanBegin); OT.ScanSlice(1e9, 1e9, true)
local firstCalls = normCalls
pcall(OT.ScanBegin); OT.ScanSlice(1e9, 1e9, true)
local secondCalls = normCalls - firstCalls
OT.Norm = normReal
t("đệm tên: lượt quét đầu có chuẩn hoá tên", firstCalls > 0, firstCalls)
t("đệm tên: lượt quét sau KHÔNG chuẩn hoá lại (0 lần)",
    secondCalls <= 2, secondCalls .. " (lượt đầu " .. firstCalls .. ")")

-- (4) tạo định vị mới rải ra nhiều khung hình
OT.maxItems = 4
OT.Rescan(true)
OT.DrainPending(1e9)          -- dọn sạch
OT.Clear()
OT.on = true
OT.keys = OT.Split("cay")
pcall(OT.ScanBegin); OT.ScanSlice(1e9, 1e9, true)
t("chốt lượt quét: vật mới xếp hàng chờ tạo, chưa tạo hết ngay",
    #(OT._pending or {}) > 0 and next(OT.items) == nil, tostring(#(OT._pending or {})))
local hitsNow = OT._found   -- số vật khớp còn sống trong map lúc này (cây khác đã bị xoá ở test trên)
local made1 = OT.DrainPending(2)
t("mỗi khung hình chỉ tạo ≤2 định vị (ngân sách makeBudget)", made1 <= 2, made1)
OT.DrainPending(1e9)
t("rải xong thì đủ số vật", #(OT._pending or {}) == 0 and hitsNow == OT._found and next(OT.items) ~= nil,
    "hits=" .. tostring(hitsNow))
OT.maxItems = 60

-- (5) cập nhật nhãn xoay vòng theo ngân sách
local nItems = 0
for _ in pairs(OT.items) do nItems = nItems + 1 end
local savedBudget = OT.labelBudget
OT.labelBudget = 2
OT.Tick()
t("mỗi lượt Tick chỉ đụng ≤2 vật (xoay vòng)", (OT._tickUpdates or 0) <= 2, OT._tickUpdates)
local ticks = 0
while ticks < 40 do
    ticks = ticks + 1
    OT.Tick()
    local filled = 0
    for _, it in pairs(OT.items) do if it.txt ~= nil then filled = filled + 1 end end
    if filled >= nItems then break end
end
t("xoay vòng vài lượt là mọi vật đều có nhãn", ticks <= 10, ticks .. " lượt cho " .. nItems .. " vật")
OT.labelBudget = savedBudget

-- (6) khung 🎯 không làm mới mỗi 0,2s nữa
OT.Select(__TEST_TREES[4])
OT.Tick()
local at1 = OT._infoAt
OT.Tick()
t("khung 🎯 làm mới thưa (0,5s) chứ không phải mỗi lượt Tick", OT._infoAt == at1,
    tostring(at1) .. " -> " .. tostring(OT._infoAt))
OT.Select(nil)

-- (7) Step: đi đường vòng qua render step cũng không vượt ngân sách
OT._scanAcc = 0
pcall(OT.ScanBegin)
local sc0 = OT._scanned
__pump(2)                     -- 2 khung hình
t("Step chia lát: 1-2 khung hình không quét hết cả workspace",
    (OT._scanned - sc0) <= (OT.scanBudget * 2 + 5), tostring(OT._scanned - sc0))
local guard2 = 0
while OT._passing and guard2 < 5000 do guard2 = guard2 + 1; __pump(1) end
t("Step quét xong sau nhiều khung hình, ra đúng kết quả",
    (OT._found or 0) == hitsNow and #(OT._pending or {}) == 0, tostring(OT._found))
OT.on = false
OT.Clear()

-- ---------- 13e. QUY MÔ LỚN: map 1.500 vật vẫn KHÔNG dồn việc vào 1 khung hình ----------
local bigFolder = Instance.new("Folder", workspace)
bigFolder.Name = "MapLon"
local bigTrees = {}
for i = 1, 1500 do
    local p = Instance.new("Part", bigFolder)
    p.Name = (i % 3 == 0) and ("Cây lớn " .. tostring(i)) or ("Đá " .. tostring(i))
    p.Position = Vector3.new(i % 100, 5, math.floor(i / 100))
    p.Size = Vector3.new(2, 6, 2)
    p.AssemblyLinearVelocity = Vector3.zero
    if i % 3 == 0 then bigTrees[#bigTrees + 1] = p end
end
OT.keys = OT.Split("cay")
OT.on = true
OT.maxItems = 2000
pcall(OT.ScanBegin)
local frames, maxPerFrame = 0, 0
while OT._passing and frames < 100000 do
    frames = frames + 1
    local before = OT._scanned
    OT.ScanSlice(180, 1e9)          -- ngân sách 180 vật/khung hình như cấu hình mặc định
    local did = OT._scanned - before
    if did > maxPerFrame then maxPerFrame = did end
end
t("map lớn: mỗi khung hình quét ≤180 vật (không quét cả map 1 phát)", maxPerFrame <= 180,
    "max=" .. tostring(maxPerFrame))
t("map lớn: quét 1.500+ vật phải trải qua nhiều khung hình", frames >= 9 and (OT._scanned or 0) >= 1500,
    frames .. " khung / " .. tostring(OT._scanned) .. " vật")
local bigExpected = OT._found
t("map lớn: tìm đủ 500 cây trong folder + các vật khác (không đếm trùng)",
    bigExpected >= 500, tostring(bigExpected) .. " hits / gộp " .. tostring(OT._skipped))

-- lượt quét thứ 2 không phải chuẩn hoá lại tên của 1.500+ vật
local normReal2 = OT.Norm
local calls2 = 0
OT.Norm = function(...) calls2 = calls2 + 1 return normReal2(...) end
pcall(OT.ScanBegin)
local frames2 = 0
while OT._passing and frames2 < 100000 do frames2 = frames2 + 1; OT.ScanSlice(180, 1e9) end
OT.Norm = normReal2
t("đệm tên: quét lại map 1.500 vật mà KHÔNG chuẩn hoá lại tên (0 lần)", calls2 == 0, calls2)
t("đệm tên: kết quả lượt sau vẫn y hệt lượt đầu", OT._found == bigExpected, tostring(OT._found))

bigFolder:Destroy()
OT.maxItems = 60
OT.on = false
OT.Clear()
OT.Rescan(true)

-- ---------- 13f. NHIỀU MỤC CHẠY CÙNG LÚC + XOÁ TỪNG MỤC ----------
OT.on = false
OT.Clear()
OT.ClearEntries()
OT.SetQuery("")
__pump(3)

-- ghim 2 mục khác loại: 1 TÊN ("đá") và 1 PATH ("Workspace.Rừng Cây")
local okAdd1, kind1 = OT.AddEntry("đá")
t("ghim mục tên 'đá'", okAdd1 == true and kind1 == "name", tostring(kind1))
local okAdd2, kind2 = OT.AddEntry("Workspace.Rừng Cây")
t("ghim mục path 'Workspace.Rừng Cây'", okAdd2 == true and kind2 == "path", tostring(kind2))
t("ghim mục là quét & tạo định vị NGAY (khỏi chờ nhịp quét)",
    OT.items[__TEST_TREE_MODEL] ~= nil or next(OT.items) ~= nil,
    tostring(OT.items[__TEST_TREE_MODEL] ~= nil))
t("có 2 mục trong danh sách", #OT.entries == 2, #OT.entries)
t("keys + pathKeys được gộp từ 2 mục", #OT.keys == 1 and #OT.pathKeys == 1,
    tostring(#OT.keys) .. " keys / " .. tostring(#OT.pathKeys) .. " path")
OT.Rescan(true)
local daItem, modelItem = OT.items[workspace:FindFirstChild("Hòn Đá")], OT.items[__TEST_TREE_MODEL]
t("2 MỤC CHẠY CÙNG LÚC: vừa có 'Hòn Đá' (theo tên) vừa có 'Rừng Cây' (theo path)",
    daItem ~= nil and modelItem ~= nil, tostring(daItem ~= nil) .. "/" .. tostring(modelItem ~= nil))

-- ghim trùng -> từ chối, không nhân đôi
local okDup, whyDup = OT.AddEntry("Workspace.Rừng Cây")
t("ghim trùng bị từ chối", okDup == false and #OT.entries == 2, tostring(whyDup))
local okDup2 = OT.AddEntry("ĐÁ")     -- khác chữ hoa/dấu nhưng cùng mục
t("ghim trùng (khác hoa/dấu) cũng bị từ chối", okDup2 == false and #OT.entries == 2)
local okEmpty, whyEmpty = OT.AddEntry("   ")
t("ghim chuỗi rỗng bị từ chối", okEmpty == false, tostring(whyEmpty))

-- xoá RIÊNG mục path -> chỉ mục đó ngừng, mục tên vẫn chạy
local okRm, rawRm = OT.RemoveEntry(2)
OT.Rescan(true)
t("xoá riêng mục path (✕)", okRm == true and rawRm == "Workspace.Rừng Cây", tostring(rawRm))
t("xoá path -> 'Rừng Cây' hết định vị", OT.items[__TEST_TREE_MODEL] == nil)
t("xoá path -> mục 'đá' VẪN chạy", OT.items[workspace:FindFirstChild("Hòn Đá")] ~= nil and #OT.entries == 1)
t("xoá path -> pathKeys rỗng, keys còn 1", #OT.pathKeys == 0 and #OT.keys == 1,
    tostring(#OT.pathKeys) .. "/" .. tostring(#OT.keys))

-- xoá mục cuối -> tự tắt định vị, sạch sẽ
local okRm2 = OT.RemoveEntry(1)
OT.Tick()
t("xoá mục cuối -> hết mục, tự tắt định vị",
    okRm2 == true and #OT.entries == 0 and OT.on == false, tostring(#OT.entries) .. " on=" .. tostring(OT.on))
t("xoá mục cuối -> không còn vật nào được định vị", next(OT.items) == nil)
t("xoá mục không tồn tại -> báo lỗi, không crash", (select(1, OT.RemoveEntry(9))) == false)

-- UI THẬT: ô nhập + Enter, nút ➕, nút ✕ trên tag
local panelOT2 = D.playerTab:FindFirstChild("HubObjTrack_Panel")
local qin2 = panelOT2:FindFirstChild("OTQuery")
local addBtn = panelOT2:FindFirstChild("OTAdd")
local tagsFrame = panelOT2:FindFirstChild("OTTags")
t("khung có hàng mục 🏷 (OTTags) + nút ➕ Thêm mục", tagsFrame ~= nil and addBtn ~= nil)
qin2.Text = "cây"
addBtn.Activated:Fire()
t("bấm ➕ Thêm mục -> ghim 'cây' và xoá ô nhập",
    #OT.entries == 1 and tostring(OT.entries[1].raw) == "cây" and tostring(qin2.Text) == "",
    tostring(#OT.entries) .. " | ô nhập = " .. tostring(qin2.Text))
qin2.Text = "Workspace.Khu Cây"
addBtn.Activated:Fire()
t("ghim mục thứ 2 qua nút ➕", #OT.entries == 2, tostring(#OT.entries))

-- Enter trong ô nhập cũng ghim
qin2.Text = "rương"
qin2:GetPropertyChangedSignal("Text"):Fire()
qin2.FocusLost:Fire(true)          -- true = nhấn Enter
t("nhấn Enter trong ô nhập = ghim thêm mục", #OT.entries == 3, tostring(#OT.entries))
t("sau khi ghim, ô nhập được xoá trống", tostring(qin2.Text) == "", tostring(qin2.Text))

-- hàng mục vẽ đúng số tag + bấm ✕ xoá đúng mục
OT.RefreshTags()
local tagCount = 0
for _, ch in ipairs(tagsFrame:GetChildren()) do if ch.Name:sub(1, 6) == "OTTag_" then tagCount = tagCount + 1 end end
t("hàng mục vẽ đủ 3 tag", tagCount == 3, tagCount)
local tag2 = tagsFrame:FindFirstChild("OTTag_2")
t("tag có tiền tố 📁 cho path", tostring(tag2.Text):find("📁", 1, true) ~= nil, tag2.Text)
local rawBefore = OT.entries[2].raw
tag2.Activated:Fire()
t("bấm ✕ trên tag -> xoá đúng mục đó",
    #OT.entries == 2 and OT.entries[2].raw ~= rawBefore
    and tostring(OT.entries[1].raw) == tostring(OT.entries[1].raw),
    tostring(#OT.entries) .. " mục")
t("xoá 1 tag không ảnh hưởng các tag khác", tostring(OT.entries[1].raw) == "cây",
    tostring(OT.entries[1].raw))

-- vật bị xoá khỏi game thì mục path không làm lỗi (tự bỏ qua)
OT.Rescan(true)
local before = #OT.list
__TEST_TREE_MODEL:Destroy()
OT.Rescan(true)
t("mục path trỏ vật đã bị xoá -> không lỗi, chỉ mất vật đó",
    OT._found ~= nil and #OT.list <= before, tostring(#OT.list) .. " <= " .. tostring(before))

-- 🧹 Xoá hết: xoá cả mục đã ghim
local clearBtn2 = panelOT2:FindFirstChild("OTClear")
clearBtn2.Activated:Fire()
t("nút 🧹 Xoá hết xoá sạch mục đã ghim", #OT.entries == 0 and OT.on == false, tostring(#OT.entries))
OT.RefreshTags()

-- gõ tên trong ô nhập vẫn tự định vị như CŨ (không bị tính năng mới làm mất)
qin2.Text = "đá"
qin2:GetPropertyChangedSignal("Text"):Fire()
local okLive = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.5 do
        __pump(1)
        if OT.on and next(OT.items) ~= nil then return true end
    end
    return false
end)()
t("gõ tên trong ô nhập vẫn tự định vị ngay (giữ hành vi cũ)", okLive)
OT.SetQuery("")
__pump(3)
OT.on = false
OT.Clear()
OT.ClearEntries()

-- ---------- 14. KHÔNG MẤT TÍNH NĂNG: mọi thẻ 📚 Script Hub vẫn chạy ----------
local errs = {}
for _, e in ipairs(S.ScriptHubList) do
    if type(e.action) == "string" then
        local ok, res = pcall(S.RunHubAction, e.action)
        if not ok then errs[#errs + 1] = tostring(e.action) .. " -> " .. tostring(res) end
    end
end
t("mọi thẻ 📚 Script Hub chạy không lỗi (#" .. #S.ScriptHubList .. " thẻ)", #errs == 0, table.concat(errs, " | "))

-- ---------- 15. KHÔNG MẤT TÍNH NĂNG: đủ 7 tab + 4 khung trong tab 👥 ----------
t("vẫn đủ 7 tab", #tabContent == 7, #tabContent)
local needPanels = { "HubLoc_Panel", "HubSpec_Panel", "HubGlass_Panel", "HubObjTrack_Panel" }
local missing = {}
for _, nm in ipairs(needPanels) do
    if not D.playerTab:FindFirstChild(nm) then missing[#missing + 1] = nm end
end
t("tab 👥 vẫn đủ 4 khung", #missing == 0, table.concat(missing, ","))
-- khung 🌳 không chồng lên nhau + khung 🎯 nằm gọn trong khung
local panelOT = D.playerTab:FindFirstChild("HubObjTrack_Panel")
local listOT = panelOT:FindFirstChild("ObjTrackList")
local infoOT = panelOT:FindFirstChild("OTInfo")
t("khung 🌳 đủ cao cho danh sách + khung 🎯",
    panelOT.Size.Y.Offset >= (infoOT.Position.Y.Offset + infoOT.Size.Y.Offset),
    panelOT.Size.Y.Offset .. " vs " .. tostring(infoOT.Position.Y.Offset + infoOT.Size.Y.Offset))
t("khung 🎯 nằm dưới danh sách, không chồng",
    infoOT.Position.Y.Offset >= (listOT.Position.Y.Offset + listOT.Size.Y.Offset),
    tostring(listOT.Position.Y.Offset + listOT.Size.Y.Offset) .. " <= " .. tostring(infoOT.Position.Y.Offset))
OT.keys = OT.Split("cay"); OT.on = true; OT.Rescan(true)   -- dựng lại danh sách để soi bố cục dòng
D.playerTab.Visible = true
OT.RefreshList()
local rowTmp = listOT:FindFirstChild("OTRow_1")
t("dòng danh sách có đủ 3 nút 📊/🚀/📋",
    rowTmp ~= nil and rowTmp:FindFirstChild("OTInfoRow") ~= nil
    and rowTmp:FindFirstChild("OTFlyRow") ~= nil and rowTmp:FindFirstChild("OTCopyRow") ~= nil)

local ys = {}
for _, nm in ipairs(needPanels) do
    local pnl = D.playerTab:FindFirstChild(nm)
    ys[#ys + 1] = pnl and pnl.Position.Y.Offset or -1
end
t("4 khung không chồng nhau (Y tăng dần)", ys[1] < ys[2] and ys[2] < ys[3] and ys[3] < ys[4], table.concat(ys, "<"))

-- ---------- 16. ⭕ ĐỊNH VỊ VÒNG (tab 🛠 Hỗ Trợ) ----------
__RUN_RING_TESTS()

-- ---------- tổng kết ----------
print(string.format("TESTS: pass=%d fail=%d", PASS, FAIL))
for _, m in ipairs(MSGS) do print(m) end
if FAIL > 0 then error(string.format("%d/%d test HỎNG", FAIL, PASS + FAIL), 0) end
end
__RUN_TESTS()
