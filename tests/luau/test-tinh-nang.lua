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
t("tìm thấy đúng 5 vật 'cây' trong map (4 part + 1 model rừng)", found == 5, found)
t("KHÔNG định vị 'Cây' nằm trong nhân vật mình / người khác", #OT.list == 5, #OT.list)
local nItems = 0
for _ in pairs(OT.items) do nItems = nItems + 1 end
t("tạo đủ 5 Highlight+nhãn đang theo dõi", nItems == 5, nItems)
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
t("giới hạn 50m -> chỉ còn 3 vật 'cây'", OT._found == 3, OT._found)
t("giới hạn khoảng cách được lưu", OT.maxDist == 50)
OT.SetMaxDist(0)
OT.Rescan(true)
t("bỏ giới hạn -> lại thấy 5 vật", OT._found == 5, OT._found)

-- ---------- 7. vật bị xoá thì tự bỏ định vị ----------
local victim = __TEST_TREES[3]
victim:Destroy()
OT.Tick()
t("vật bị xoá thì mất định vị ngay", OT.items[victim] == nil)
OT.Rescan(true)
t("quét lại: còn 4 vật", OT._found == 4, OT._found)

-- ---------- 8. nhiều từ khoá + giới hạn số lượng ----------
OT.SetQuery("cây, đá")
local okWait = (function()
    local t0 = os.clock()
    while os.clock() - t0 < 1.2 do
        __pump(1)
        if #OT.keys == 2 and OT._found == 5 then return true end
    end
    return false
end)()
t("gõ 'cây, đá' (debounce) -> quét ra 5 vật", okWait, (OT._found or -1) .. " keys=" .. #OT.keys)
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
t("bảng 🌳 dựng đủ dòng (5 vật)", rows == 5, rows)
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
local ys = {}
for _, nm in ipairs(needPanels) do
    local pnl = D.playerTab:FindFirstChild(nm)
    ys[#ys + 1] = pnl and pnl.Position.Y.Offset or -1
end
t("4 khung không chồng nhau (Y tăng dần)", ys[1] < ys[2] and ys[2] < ys[3] and ys[3] < ys[4], table.concat(ys, "<"))

-- ---------- tổng kết ----------
print(string.format("TESTS: pass=%d fail=%d", PASS, FAIL))
for _, m in ipairs(MSGS) do print(m) end
if FAIL > 0 then error(string.format("%d/%d test HỎNG", FAIL, PASS + FAIL), 0) end
end
__RUN_TESTS()
