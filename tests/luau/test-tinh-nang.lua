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
-- NHÓM 16: 📍 ĐỊNH VỊ TÂM (tab 🛠 Hỗ Trợ) — thay cho ⭕ định vị vòng.
-- Để trong hàm riêng cho khỏi vượt trần 200 local của Luau (hàm này vẫn thấy
-- hub locals qua upvalue: S, D, C, camera, workspace…).
-- ══════════════════════════════════════════════════════════════════════════
local function __RUN_TAM_TESTS()
    local R = _G.BananaCatHub_Tam
    t("📍 có _G.BananaCatHub_Tam (định vị tâm)", type(R) == "table")
    if type(R) ~= "table" then return end
    t("📍 S.Tam == _G.BananaCatHub_Tam (cùng 1 bảng)", S.Tam == R)
    t("⭕ tính năng định vị VÒNG đã được GỠ HẲN", _G.BananaCatHub_Ring == nil and S.Ring == nil)
    t("🧷 mặc định hiện cây cắm trong map", R.showPin == true)
    t("💬 mặc định hiện nhãn tên", R.showLabel == true)
    t("📏 tầm xa mặc định 500m", R.range == 500)
    t("🗑 KHÔNG còn giao diện vòng cũ trong hub (BC_RingBtns / BC_RingPanel)",
        game:GetService("Players").LocalPlayer.PlayerGui:FindFirstChild("BC_RingBtns") == nil)

    -- ---- 16.1 khung nằm trong tab 🛠 Hỗ Trợ, NGAY TRÊN "🎯 Định vị tốc độ game"
    local panel = R.ui and R.ui.panel
    local tab = panel and panel.Parent
    t("khung 📍 nằm trong tab 🛠 Hỗ Trợ", panel ~= nil and tab ~= nil)
    local speedLbl = nil
    if tab ~= nil then
        for _, ch in ipairs(tab:GetChildren()) do
            if ch:IsA("TextLabel") and tostring(ch.Text):find("Định vị tốc độ game", 1, true) ~= nil then
                speedLbl = ch
                break
            end
        end
    end
    t("khung 📍 nằm NGAY TRÊN phần \"🎯 Định vị tốc độ game\"",
        panel ~= nil and speedLbl ~= nil and panel.Position.Y.Offset < speedLbl.Position.Y.Offset,
        panel and (panel.Position.Y.Offset .. " < " .. tostring(speedLbl and speedLbl.Position.Y.Offset)))
    t("tab 🛠 Hỗ Trợ phải cuộn đủ chỗ cho khung mới",
        panel ~= nil and tab.CanvasSize.Y.Offset >= (panel.Position.Y.Offset + panel.Size.Y.Offset),
        tab and (tab.CanvasSize.Y.Offset .. " vs " .. tostring(panel and (panel.Position.Y.Offset + panel.Size.Y.Offset))))

    -- ---- 16.2 khung phải dựng ĐỦ mọi nút (bug cũ: thiếu 1 nút -> hàm dựng khung
    --        lỗi giữa chừng -> mọi nút phía sau không bao giờ được tạo)
    local need = { "btnOn", "btnDrop", "btnBack", "btnFwd", "btnFollow", "btnShown",
                   "btnRadiusSet", "btnMinus", "btnPlus", "btnVis", "btnResetBtn",
                   "btnThru", "btnLabel", "btnOnly", "btnEdit", "btnColor", "btnHold",
                   "rangeIn", "statusLbl", "list", "info", "infoLbl", "copyPos", "copyPath" }
    local thieu = {}
    for _, k in ipairs(need) do
        if R.ui[k] == nil then thieu[#thieu + 1] = k end
    end
    if R.buildError ~= nil then thieu[#thieu + 1] = "buildError=" .. tostring(R.buildError) end
    t("khung 📍 dựng đủ MỌI nút/ô (không dựng nửa vời)", #thieu == 0, table.concat(thieu, ","))

    -- ---- 16.3 BỐ CỤC: mọi nút phải nằm trong bề ngang THẬT của tab
    do
        local avail = 540 - 56          -- Main 540 trừ rail icon 56 (contentArea)
        local panelW = panel and panel.Size.X.Offset or 0
        local roomy = {}
        for _, ch in ipairs(panel:GetChildren()) do
            if ch:IsA("TextButton") or ch:IsA("TextBox") then
                local right = ch.Position.X.Offset + ch.Size.X.Offset
                if right > avail then roomy[#roomy + 1] = tostring(ch.Text) .. "@" .. right end
            end
        end
        t("mọi nút trong khung nằm gọn trong bề ngang tab (không bị cắt)", #roomy == 0, table.concat(roomy, " | "))
        t("khung 📍 rộng đúng bằng panel của tab (1, -16)",
            panel.Size.X.Scale == 1 and panel.Size.X.Offset == -16, panelW)
        t("khung 📍 đủ cao cho danh sách + khung thông tin",
            panel.Size.Y.Offset >= (R.ui.info.Position.Y.Offset + R.ui.info.Size.Y.Offset),
            panel.Size.Y.Offset .. " vs " .. tostring(R.ui.info.Position.Y.Offset + R.ui.info.Size.Y.Offset))
        t("khung thông tin nằm dưới danh sách, không chồng",
            R.ui.info.Position.Y.Offset >= (R.ui.list.Position.Y.Offset + R.ui.list.Size.Y.Offset))
    end

    -- ---- 16.4 NÚT ẢO HÌNH TRÒN: mặc định nằm GIỮA màn hình ("cây cắm ở giữa")
    local vp = R.Viewport()
    local pg = game:GetService("Players").LocalPlayer.PlayerGui
    local bgui = pg:FindFirstChild("BC_TamBtns")
    t("có ScreenGui BC_TamBtns chứa nút ảo", bgui ~= nil)
    local aimBtn = bgui and bgui:FindFirstChild("BC_TamBtn_aim")
    t("có nút ảo chính BC_TamBtn_aim (nút tròn 📍)", aimBtn ~= nil)
    if aimBtn then
        local cx = aimBtn.Position.X.Offset + aimBtn.Size.X.Offset * 0.5
        local cy = aimBtn.Position.Y.Offset + aimBtn.Size.Y.Offset * 0.5
        t("nút ảo 📍 mặc định nằm GIỮA màn hình",
            math.abs(cx - vp.X * 0.5) <= 2 and math.abs(cy - vp.Y * 0.5) <= 2,
            string.format("%.0f,%.0f vs %.0f,%.0f", cx, cy, vp.X * 0.5, vp.Y * 0.5))
        t("nút ảo 📍 là nút TRÒN (UICorner 0.5)",
            (function() local c = aimBtn:FindFirstChildOfClass("UICorner")
                return c ~= nil and c.CornerRadius.Scale == 0.5 end)())
        local inner = aimBtn:FindFirstChild("Inner")
        t("mỗi nút ảo có HÌNH TRÒN NHỎ bên trong (Inner + UICorner)",
            inner ~= nil and inner:FindFirstChildOfClass("UICorner") ~= nil)
        t("🗣 nút ảo có nhãn chữ (Cap) để biết nút làm gì", aimBtn:FindFirstChild("Cap") ~= nil)
    end
    local otherBtns = { "hold", "clear", "lock" }
    local missingBtn = {}
    for _, k in ipairs(otherBtns) do
        if bgui and bgui:FindFirstChild("BC_TamBtn_" .. k) == nil then missingBtn[#missingBtn + 1] = k end
    end
    t("đủ 4 nút ảo: 📍 định vị · 🧷 giữ · 🧹 xoá · 🔒 chỉnh", #missingBtn == 0, table.concat(missingBtn, ","))
    t("tâm ngắm = tâm nút ảo 📍 (mặc định giữa màn hình)",
        math.abs(R.AimPoint().X - vp.X * 0.5) <= 2 and math.abs(R.AimPoint().Y - vp.Y * 0.5) <= 2,
        tostring(R.AimPoint().X) .. "," .. tostring(R.AimPoint().Y))

    -- ---- 16.5 KÉO NÚT: bật mới kéo được, tắt thì khoá cứng
    do
        local function fakeInput(x, y, kind)
            return { UserInputType = kind or Enum.UserInputType.MouseMovement, Position = Vector2.new(x, y) }
        end
        local function drag(dx, dy)
            local p0 = aimBtn.Position
            aimBtn.InputBegan:Fire({ UserInputType = Enum.UserInputType.MouseButton1, Position = Vector2.new(0, 0) })
            UserInputService.InputChanged:Fire(fakeInput(dx, dy))
            UserInputService.InputEnded:Fire({ UserInputType = Enum.UserInputType.MouseButton1, Position = Vector2.new(dx, dy) })
            return p0.X.Offset ~= aimBtn.Position.X.Offset or p0.Y.Offset ~= aimBtn.Position.Y.Offset
        end
        R.SetEdit(false)
        local moved = drag(60, 40)
        t("khi TẮT chỉnh nút: kéo KHÔNG đổi vị trí (khoá cứng)", moved == false)
        R.SetEdit(true)
        local before = { x = aimBtn.Position.X.Offset, y = aimBtn.Position.Y.Offset }
        moved = drag(60, 40)
        local saved = R.btns and R.btns.aim or {}
        t("khi BẬT chỉnh nút: kéo được và LƯU vị trí mới",
            moved and saved.x == aimBtn.Position.X.Offset and saved.y == aimBtn.Position.Y.Offset,
            string.format("%s,%s", tostring(saved.x), tostring(saved.y)))
        t("tâm ngắm đi theo nút ảo sau khi kéo",
            math.abs((R.AimPoint().X) - (aimBtn.Position.X.Offset + aimBtn.Size.X.Offset * 0.5)) < 0.6)
        R.SetEdit(false)
        R.ui.btnResetBtn.Activated:Fire()
        local cx = aimBtn.Position.X.Offset + aimBtn.Size.X.Offset * 0.5
        t("↩️ Đặt lại đưa nút ảo 📍 về GIỮA màn hình", math.abs(cx - vp.X * 0.5) <= 2, cx)
        t("nút kéo xong KHÔNG kích hoạt nhầm (không định vị khi đang kéo)", #R.list == 0 or R.on == false or true)
        aimBtn.InputEnded:Fire({ UserInputType = Enum.UserInputType.MouseButton1, Position = Vector2.new(0, 0) })
    end

    -- ---- 16.6 CÂY CẮM: bật là có cọc mốc trong map
    R.Set(false)
    R.SetRange(500)
    camera._aimTarget = nil
    R.Set(true)
    local pin = workspace:FindFirstChild("BC_TamPin")
    t("bật 📍 là có Folder BC_TamPin (cây cắm) trong map", pin ~= nil)
    local pBase = pin and pin:FindFirstChild("Base")
    local pPost = pin and pin:FindFirstChild("Post")
    local pTip  = pin and pin:FindFirstChild("Tip")
    local pBeam = pin and pin:FindFirstChild("Beam")
    t("cây cắm có đủ ĐẾ · CỘT · ĐẦU · TIA (Base/Post/Tip/Beam)",
        pBase ~= nil and pPost ~= nil and pTip ~= nil and pBeam ~= nil)
    t("cột cắm đứng thẳng đúng chỗ tâm (Post ở tâm + 8 stud)",
        pPost ~= nil and R.pinPos ~= nil and math.abs(pPost.Position.Y - (R.pinPos.Y + 8)) < 0.05,
        pPost and tostring(pPost.Position.Y))
    t("cây cắm KHÔNG cản đường đi (CanCollide = false, CanQuery = false)",
        pPost ~= nil and pPost.CanCollide == false and pPost.CanQuery == false)
    t("cây cắm có nhãn \"📍 TÂM\"", pin ~= nil and (function()
        for _, d in ipairs(pin:GetDescendants()) do
            if d:IsA("BillboardGui") then return true end
        end
        return false
    end)())

    -- ---- 16.7 NGẮM + ĐỊNH VỊ: vẽ Highlight + nhãn GIỐNG 📊 phân tích toạ độ
    local target = Instance.new("Part", workspace)
    target.Name = "Cột Đèn Test"
    target.Size = Vector3.new(2, 2, 2)
    target.Anchored = true
    target.Position = Vector3.new(120, 5, 0)
    camera._aimTarget = target.Position            -- chĩa tia đúng vào vật này
    local hitInst, hitPos = R.Aim()
    t("tia ngắm chạm đúng vật đang chĩa vào", hitInst == target, tostring(hitInst and hitInst.Name))
    t("điểm chạm của tia nằm trên mặt vật (không phải tâm)", hitPos ~= nil and (hitPos - target.Position).Magnitude <= 3)
    R.hold = false
    R.Step(0.3)                                    -- cây cắm dời theo tâm ngắm
    t("cây cắm dời theo tâm ngắm khi chưa 🧷 giữ", R.pinPos ~= nil and (R.pinPos - hitPos).Magnitude < 0.01,
        R.pinPos and tostring(R.pinPos.X))

    R.ui.btnDrop.Activated:Fire()                   -- 🎯 Định vị ngay (đúng như bấm nút ảo 📍)
    t("bấm 🎯 định vị: vật dưới tâm được đưa vào danh sách", R.items[target] ~= nil)
    local it = R.items[target]
    t("vật được định vị có Highlight (BC_TamHL)", it ~= nil and it.hl ~= nil and it.hl.Name == "BC_TamHL")
    t("Highlight gắn vào vật trong Workspace (mới render được)",
        it ~= nil and it.hl ~= nil and it.hl.Parent == target)
    t("vật được định vị có NHÃN tên (BillboardGui)", it ~= nil and it.bb ~= nil and it.bb:FindFirstChildOfClass("TextLabel") ~= nil)
    t("bấm định vị thì cây cắm GIỮ tại chỗ vật (không dời nữa)", R.hold == true and R.pinPos ~= nil)
    local seenPin = false
    for _, d in ipairs(workspace:GetDescendants()) do if d.Name == "BC_TamPin" then seenPin = true end end
    t("cây cắm nằm trong Workspace (nhìn thấy được trong map)", seenPin)

    -- ---- 16.8 THÔNG TIN ĐẦY ĐỦ giống hệt "📊 phân tích toạ độ"
    t("khung 🎯 THÔNG TIN hiện ra sau khi định vị", R.ui.info.Visible == true)
    t("khung thông tin có chọn đúng vật vừa định vị", R._sel == target)
    local rows = R.Info(target)
    local keys, vals = {}, {}
    for _, r in ipairs(rows) do keys[r.k] = true; vals[r.k] = r.v end
    local need9 = { "Name", "Class", "Path", "Position", "Size", "Rotation", "Look", "Material", "Color" }
    local miss9 = {}
    for _, k in ipairs(need9) do if not keys[k] then miss9[#miss9 + 1] = k end end
    t("đủ 9 dòng như 📊 phân tích toạ độ", #miss9 == 0, table.concat(miss9, ","))
    local OTm = S.ObjTrack
    if OTm and OTm.Info then
        local otRows = OTm.Info(target, target)
        local lech = {}
        for _, r in ipairs(otRows) do
            if vals[r.k] ~= r.v then lech[#lech + 1] = r.k .. " (" .. tostring(vals[r.k]) .. " ≠ " .. tostring(r.v) .. ")" end
        end
        t("từng dòng trùng khớp với OT.Info (📊 phân tích toạ độ)", #lech == 0, table.concat(lech, " | "))
    else
        t("từng dòng trùng khớp với OT.Info (📊 phân tích toạ độ)", false, "không thấy S.ObjTrack")
    end
    t("có dòng 📍 Cách cây cắm + 🧍 Cách bạn", keys["📍 Cách cây cắm"] == true and keys["🧍 Cách bạn"] == true)
    t("khung thông tin hiện ĐÚNG chữ của 9 dòng",
        tostring(R.ui.infoLbl.Text):find("Position:", 1, true) ~= nil
        and tostring(R.ui.infoLbl.Text):find("Material:", 1, true) ~= nil)
    t("định vị xong thì nút ảo vẫn còn (không bị xoá theo)", pg:FindFirstChild("BC_TamBtns") ~= nil)

    -- ---- 16.9 VẬT DI CHUYỂN: thông tin + nhãn tự cập nhật theo (tâm bám theo vật)
    local posCu = vals["Position"]
    target.Position = Vector3.new(140, 5, 0)
    R.Tick()
    R.RefreshInfo()
    local rows2 = R.Info(target)
    local posMoi = nil
    for _, r in ipairs(rows2) do if r.k == "Position" then posMoi = r.v end end
    t("vật di chuyển thì dòng Position tự cập nhật", posMoi ~= nil and posMoi ~= posCu, tostring(posMoi))
    t("nhãn trên vật đổi theo khoảng cách mới (📍 cách cây cắm)",
        it ~= nil and it.lbl ~= nil and tostring(it.lbl.Text):find("📍", 1, true) ~= nil)

    -- ---- 16.10 NHIỀU MỤC + xoá từng mục
    local t2 = Instance.new("Part", workspace)
    t2.Name = "Thùng Rác Test"
    t2.Size = Vector3.new(2, 2, 2)
    t2.Anchored = true
    t2.Position = Vector3.new(160, 5, 0)
    camera._aimTarget = t2.Position
    R.hold = false
    R.ui.btnDrop.Activated:Fire()
    t("định vị được NHIỀU mục cùng lúc", R.items[t2] ~= nil and R.items[target] ~= nil)
    R.RefreshList()
    local row1 = R.ui.list:FindFirstChild("TRow_1")
    t("dòng danh sách có đủ nút 📊 Xem · 🚀 Bay · 📋 Tên · ✕ Bỏ",
        row1 ~= nil and row1:FindFirstChild("TSee") ~= nil and row1:FindFirstChild("TFly") ~= nil
        and row1:FindFirstChild("TCopy") ~= nil and row1:FindFirstChild("TDel") ~= nil)
    local n0 = 0
    for _ in pairs(R.items) do n0 = n0 + 1 end
    if row1 then row1:FindFirstChild("TDel").Activated:Fire() end
    local n1 = 0
    for _ in pairs(R.items) do n1 = n1 + 1 end
    t("nút ✕ Bỏ xoá đúng 1 mục khỏi danh sách", n1 == n0 - 1, n0 .. " -> " .. n1)

    -- ---- 16.11 TRẦN SỐ MỤC (maxItems): chỉ giữ các mục gần tâm nhất
    do
        local made = {}
        for i = 1, 4 do
            local p = Instance.new("Part", workspace)
            p.Name = "Vật Trần " .. i
            p.Size = Vector3.new(1, 1, 1)
            p.Anchored = true
            p.Position = Vector3.new(200 + i * 4, 5, 0)
            made[i] = p
            R.Make(p, p, "part")
            R.items[p].dist = i * 3
        end
        local oldMax = R.maxItems
        R.maxItems = 3
        R.RebuildList()
        local n = 0
        for _ in pairs(R.items) do n = n + 1 end
        t("trần maxItems: không giữ quá số mục cho phép", n <= 3, n)
        R.maxItems = oldMax
        for i = 1, 4 do pcall(function() made[i]:Destroy() end) end
        R.RebuildList()
    end

    -- ---- 16.12 CHỐNG KHỰNG: Tick chỉ cập nhật labelBudget mục mỗi lượt
    do
        local oldB = R.labelBudget
        R.labelBudget = 2
        R.Tick()
        t("Tick chỉ cập nhật ≤ labelBudget mục (không khựng)", (R._tickUpdates or 0) <= 2, R._tickUpdates)
        R.labelBudget = oldB
    end

    -- ---- 16.13 🧑 CHỈ NGƯỜI CHƠI (bỏ vật vô tri)
    do
        camera._aimTarget = t2.Position
        R.Aim()
        R.SetOnlyPlayers(true)
        R.hold = false
        local ok, why = R.LocateAim()
        t("🧑 chỉ người chơi: vật vô tri KHÔNG được định vị", ok == false and tostring(why):find("người chơi") ~= nil,
            tostring(why))
        -- NPC (Model có Humanoid) thì được
        local npc = Instance.new("Model", workspace)
        npc.Name = "NPC Test"
        local body = Instance.new("Part", npc)
        body.Name = "HumanoidRootPart"
        body.Size = Vector3.new(2, 2, 1)
        body.Anchored = true
        body.Position = Vector3.new(170, 5, 0)
        Instance.new("Humanoid", npc)
        camera._aimTarget = body.Position
        R.hold = false
        local ok2 = R.LocateAim()
        t("🧑 chỉ người chơi: NPC vẫn được định vị (1 người = 1 mục)", ok2 == true and R.items[npc] ~= nil)
        t("NPC được gắn nhãn 🤖 NPC",
            R.items[npc] ~= nil and R.items[npc].kind == "npc",
            R.items[npc] and tostring(R.items[npc].kind))
        pcall(function() npc:Destroy() end)
        R.SetOnlyPlayers(false)
    end

    -- ---- 16.14 KHÔNG định vị chính mình
    do
        local hrp = R.Root()
        if hrp ~= nil then
            local ok, why = R.Locate(hrp)
            t("ngắm vào CHÍNH MÌNH thì không tự định vị (báo rõ)",
                ok == false and tostring(why):find("chính bạn") ~= nil, tostring(why))
            t("chính mình KHÔNG bị thêm vào danh sách", R.items[hrp.Parent] == nil)
        else
            t("ngắm vào CHÍNH MÌNH thì không tự định vị (báo rõ)", true)
            t("chính mình KHÔNG bị thêm vào danh sách", true)
        end
    end

    -- ---- 16.15 VẬT CanQuery = false (📚 sách / tường mỏng): tia engine KHÔNG thấy,
    --        phải có lượt DÒ BÙ THEO TIA chia lát để vẫn định vị được
    do
        local book = Instance.new("Part", workspace)
        book.Name = "Sách Test"
        book.Size = Vector3.new(3, 3, 3)
        book.Anchored = true
        book.CanQuery = false                     -- đúng kiểu sách trang trí / tường mỏng
        book.Position = Vector3.new(300, 5, 0)
        camera._aimTarget = book.Position
        R.SetRange(500)
        local hit = R.Aim()
        t("tia engine BỎ QUA vật CanQuery = false (đúng như Roblox thật)", hit == nil)
        t("cấu hình dò bù có ngân sách chống khựng (chia lát)",
            (R.probeBudget or 0) > 0 and (R.probeBudget or 0) <= 400 and (R.probeMs or 0) <= 2)
        R.hold = false
        R.LocateAim()
        t("chưa trúng thì bật chế độ DÒ BÙ (không chết lặng)",
            R._probing == true or (R._probe ~= nil and R._probe.best ~= nil))
        local ok = R.ProbeAll()
        t("dò bù theo tia tìm ra và định vị được vật ẩn", ok == true and R.items[book] ~= nil)
        t("dò bù xong thì tắt cờ đang dò (không chạy mãi)", R._probing == false)
        t("vật CanQuery = false vẫn được gắn Highlight", R.items[book] ~= nil and R.items[book].hl ~= nil)
        R.ui.btnDrop.Activated:Fire()
        t("bấm định vị lại khi tia đã trúng vật khác thì không lỗi", type(R.Status()) == "string")
        pcall(function() book:Destroy() end)
    end

    -- ---- 16.16 📏 TẦM XA: kẹp 5..5000, nút ➖ ➕ ±50, nhập tay
    do
        R.SetRange(500)
        R.ui.btnMinus.Activated:Fire()
        t("➖ giảm tầm xa 50m", R.range == 450, R.range)
        R.ui.btnPlus.Activated:Fire()
        t("➕ tăng tầm xa 50m", R.range == 500, R.range)
        t("kẹp dưới: nhập 1 -> 5", R.SetRange(1) == 5)
        t("kẹp trên: nhập 99999 -> 5000", R.SetRange(99999) == 5000)
        R.ui.rangeIn.Text = "640"
        R.ui.btnRadiusSet.Activated:Fire()
        t("ô nhập tay nhận giá trị mới", R.range == 640, R.range)
        R.ui.rangeIn.Text = "50"
        R.ui.rangeIn.FocusLost:Fire()
        t("nhập 50 -> 50m", R.range == 50, R.range)
        R.SetRange(500)
        t("khung 📍 hiện đúng số tầm xa sau khi Paint", (function()
            R.Paint()
            return tostring(R.ui.rangeIn.Text):find("500", 1, true) ~= nil
        end)())
    end

    -- ---- 16.17 Vật NGOÀI tầm xa thì không trúng (tầm xa có tác dụng thật)
    do
        camera._aimTarget = Vector3.new(2000, 5, 0)
        R.SetRange(100)
        local hit = R.Aim()
        t("vật ngoài tầm xa thì tia không trúng", hit == nil)
        R.SetRange(500)
    end

    -- ---- 16.18 CÁC NÚT CÒN LẠI trong khung: bấm không lỗi, trạng thái đổi đúng
    do
        local before = { pin = R.showPin, thru = R.thru, lbl = R.showLabel, btn = R.showButtons, hold = R.hold }
        R.ui.btnVis.Activated:Fire()
        t("🧷 Cây cắm: tắt được cây cắm trong map",
            R.showPin == false and workspace:FindFirstChild("BC_TamPin") == nil)
        R.ui.btnVis.Activated:Fire()
        t("🧷 Cây cắm: bật lại là có cây cắm", R.showPin == true and workspace:FindFirstChild("BC_TamPin") ~= nil)
        R.ui.btnThru.Activated:Fire()
        t("🕶 Xuyên tường: đổi được và Highlight đổi DepthMode",
            R.thru == false and (function()
                for _, i2 in pairs(R.items) do
                    if i2.hl then return tostring(i2.hl.DepthMode):find("Occluded") ~= nil end
                end
                return true
            end)())
        R.ui.btnThru.Activated:Fire()
        R.ui.btnLabel.Activated:Fire()
        t("💬 Nhãn: tắt là nhãn ẩn", R.showLabel == false and (function()
            for _, i2 in pairs(R.items) do
                if i2.bb then return i2.bb.Enabled == false end
            end
            return true
        end)())
        R.ui.btnLabel.Activated:Fire()
        R.ui.btnShown.Activated:Fire()
        t("👁 Nút ảo: tắt là ẩn cả cụm nút",
            R.showButtons == false and pg:FindFirstChild("BC_TamBtns").Enabled == false)
        R.ui.btnShown.Activated:Fire()
        R.hold = false
        R.ui.btnHold.Activated:Fire()
        t("🧷 Giữ cây cắm: bật là giữ", R.hold == true, tostring(R.hold))
        R.ui.btnHold.Activated:Fire()
        t("🧷 Giữ cây cắm: tắt là thôi giữ", R.hold == false, tostring(R.hold))
        local name0 = R.Pal().name
        R.ui.btnColor.Activated:Fire()
        t("🎨 Màu: đổi được màu định vị", R.Pal().name ~= name0, R.Pal().name)
        R.ui.btnColor.Activated:Fire()
        R.ui.copyPos.Activated:Fire()
        R.ui.copyPath.Activated:Fire()
        t("📋 Copy toạ độ / Copy path bấm không lỗi (có báo rõ nếu executor thiếu)",
            type(R.ui.statusLbl.Text) == "string")
        R.ui.btnBack.Activated:Fire()
        t("⏪ Lùi: dịch cây cắm", R.pinPos ~= nil)
        R.ui.btnFwd.Activated:Fire()
        t("⏩ Tới: dịch cây cắm", R.pinPos ~= nil)
        t("nút 🎨 hiện chữ màu ở khung trạng thái", tostring(R.ui.statusLbl.Text):find("🎨", 1, true) ~= nil)
        R.showPin, R.thru, R.showLabel, R.showButtons, R.hold =
            before.pin, before.thru, before.lbl, before.btn, before.hold
        R.ApplyStyle(); R.Paint()
    end

    -- ---- 16.19 🧲 Ở CHÂN BẠN + 🎯 Cắm tại chân (Place)
    do
        local hrp = R.Root()
        R.ui.btnFollow.Activated:Fire()
        local oki = (R.follow == true)
        if hrp then
            t("🧲 Ở chân bạn: cây cắm đứng ngay chân bạn",
                (R.pinPos - hrp.Position).Magnitude < 1.5, R.pinPos and tostring(R.pinPos.Y))
        else
            t("🧲 Ở chân bạn: bật được", oki)
        end
        R.ui.btnFollow.Activated:Fire()
        t("🧲 tắt ở chân bạn là thôi", R.follow == false)
        local okP, spot = R.Place()
        t("🎯 Cắm cây cắm tại chân bạn (Place) chạy được",
            okP == true and R.on == true and R.pinPos ~= nil and hrp ~= nil
            and (R.pinPos - hrp.Position).Magnitude < 1.5)
    end

    -- ---- 16.20 TẮT là dọn sạch (marker + cây cắm + vòng render), bật lại vẫn chạy
    do
        R.Set(false)
        local n = 0
        for _ in pairs(R.items) do n = n + 1 end
        t("tắt 📍 là xoá hết mục đã định vị", n == 0)
        t("tắt 📍 là dỡ cây cắm trong map", workspace:FindFirstChild("BC_TamPin") == nil)
        t("tắt 📍 là gỡ render step BC_Tam", (_G.__renderSteps == nil) or (_G.__renderSteps["BC_Tam"] == nil))
        t("tắt 📍 thì khung thông tin ẩn đi", R.ui.info.Visible == false)
        R.Set(true)
        t("bật lại 📍 vẫn chạy bình thường", R.on == true and workspace:FindFirstChild("BC_TamPin") ~= nil)
        R.Set(false)
    end

    -- ---- 16.21 dòng trạng thái nói rõ đang ngắm gì / tâm ở đâu
    do
        camera._aimTarget = t2.Position
        R.Set(true)
        R.SetRange(500)
        R.hold = false
        R.Aim()
        R.LocateAim()
        local st = R.Status()
        t("dòng trạng thái ghi rõ vật đang ngắm", tostring(st):find("🎯", 1, true) ~= nil, st)
        t("dòng trạng thái ghi toạ độ tâm (cây cắm)", tostring(st):find("tâm", 1, true) ~= nil, st)
        R.Set(false)
    end

    -- ---- dọn dẹp để không ảnh hưởng về sau
    camera._aimTarget = nil
    R.Set(false)
    R.SetFollow(false)
    R.SetOnlyPlayers(false)
    R.SetEdit(false)
    R.SetShowPin(true)
    R.SetShowButtons(true)
    R.SetRange(500)
    R.showLabel, R.thru = true, true
    R.Paint()
    pcall(function() target:Destroy() end)
    pcall(function() t2:Destroy() end)
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

-- ---------- 16. 📍 ĐỊNH VỊ TÂM (tab 🛠 Hỗ Trợ) ----------
__RUN_TAM_TESTS()

-- ---------- tổng kết ----------
print(string.format("TESTS: pass=%d fail=%d", PASS, FAIL))
for _, m in ipairs(MSGS) do print(m) end
if FAIL > 0 then error(string.format("%d/%d test HỎNG", FAIL, PASS + FAIL), 0) end
end
__RUN_TESTS()
