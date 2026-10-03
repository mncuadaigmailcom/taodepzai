-- Script Hub gốc của taodepzai, tách GUI thành module URL giống Code Đã Lưu.
-- Chạy từ tab 📚 Script Hub có sẵn trong script.js cập nhật.
-- Giữ nguyên catalog/nút/panel gốc. Game controllers vẫn thuộc main, không nhân đôi hooks/physics.

-- BEGIN SCRIPT_HUB_FACTORY
local function CreateScriptHub(bridge)
    assert(type(bridge) == "table" and bridge.protocol == 1 and type(bridge.alive) == "function" and bridge.alive(),
        "Hãy mở script taodepzai cập nhật trước khi chạy Script Hub riêng")
    local S, D, C = bridge.S, bridge.D, bridge.C
    local MV, GL, FR = bridge.Move, bridge.Glow, bridge.Free
    local Corner, Stroke, flash = bridge.Corner, bridge.Stroke, bridge.flash
    local RunCode, ReleaseHubFocus, mvClamp = bridge.RunCode, bridge.ReleaseHubFocus, bridge.mvClamp
    local Players, player = bridge.Players, bridge.player
    local UserInputService = game:GetService("UserInputService")
    local Store, RebuildScripts = bridge.Store, bridge.RebuildScripts
    local view, connections = {dead = false}, {}
    local searchJob
    local function trackConn(connection) connections[#connections + 1] = connection; return connection end
    local function delaySearch(fn)
        if searchJob then pcall(task.cancel, searchJob) end
        searchJob = task.delay(0.18, function() searchJob = nil; if not view.dead then fn() end end)
    end
    local function New(class, props, parent) return bridge.New(class, props, parent) end
    local syncKeys = {"SyncServerPanel", "SyncHubPanels", "RebuildHubList", "SyncTunePanel", "SyncAntiBanPanel",
        "SyncFlyPanel", "SyncSpeedPanel", "SyncHighJumpPanel", "RefreshMovePanel", "SyncGlowPanel", "SyncFreePanel",
        "SyncSafePanel", "tuneBtns", "flyBtns", "speedBtns", "highJumpBtns"}
    local oldS, oldD, oldOther, ownedS, ownedD, ownedOther = {}, {}, {}, {}, {}, {}
    for _, key in ipairs(syncKeys) do oldS[key] = S[key] end
    for key, value in pairs(D) do if key:sub(1,3) == "hub" then oldD[key] = value end end
    oldOther.card = D.CardBtn
    oldOther.pass, oldOther.glass, oldOther.glow, oldOther.free, oldOther.safe = MV._passBtn, MV._glassBtns, GL.RefreshPanel, FR.RefreshPanel, MV.Safe.RefreshPanel
    local gui = New("ScreenGui", {Name="TDZScriptHub", ResetOnSpawn=false, IgnoreGuiInset=true,
        ZIndexBehavior=Enum.ZIndexBehavior.Sibling}, player.PlayerGui or player:WaitForChild("PlayerGui"))
    local hubRoot = New("ScrollingFrame", {Name="ScriptHubRoot", Size=UDim2.new(1,0,1,0),
        Position=UDim2.new(), BackgroundColor3=C.BG, CanvasSize=UDim2.new(), ScrollBarThickness=0,
        ClipsDescendants=true, ZIndex=5}, gui)
    view.Gui, view.Root = gui, hubRoot
    local function snapshotInstalled()
        for _, key in ipairs(syncKeys) do ownedS[key] = S[key] end
        for key, value in pairs(D) do if key:sub(1,3) == "hub" then ownedD[key] = value end end
        ownedOther.card = D.CardBtn
        ownedOther.pass, ownedOther.glass, ownedOther.glow, ownedOther.free, ownedOther.safe = MV._passBtn, MV._glassBtns, GL.RefreshPanel, FR.RefreshPanel, MV.Safe.RefreshPanel
    end
    function view.Destroy(alreadyDestroying)
        if view.dead then return end
        view.dead = true
        if searchJob then pcall(task.cancel, searchJob); searchJob = nil end
        for _, connection in ipairs(connections) do pcall(function() connection:Disconnect() end) end
        for _, key in ipairs(syncKeys) do if S[key] == ownedS[key] then S[key] = oldS[key] end end
        for key, value in pairs(ownedD) do if D[key] == value then D[key] = oldD[key] end end
        if D.CardBtn == ownedOther.card then D.CardBtn = oldOther.card end
        if MV._passBtn == ownedOther.pass then MV._passBtn = oldOther.pass end
        if MV._glassBtns == ownedOther.glass then MV._glassBtns = oldOther.glass end
        if GL.RefreshPanel == ownedOther.glow then GL.RefreshPanel = oldOther.glow end
        if FR.RefreshPanel == ownedOther.free then FR.RefreshPanel = oldOther.free end
        if MV.Safe.RefreshPanel == ownedOther.safe then MV.Safe.RefreshPanel = oldOther.safe end
        if _G.TDZScriptHubStandalone == view then _G.TDZScriptHubStandalone = nil end
        if not alreadyDestroying then pcall(function() gui:Destroy() end)
        elseif gui.Parent then task.defer(function() if gui.Parent then gui:Destroy() end end) end
    end
    local ok, err = pcall(function()
-- BEGIN SCRIPT_HUB_CATALOG
S.ScriptHubList = {
    {icon="🛡", name="Infinite Yield", cat="Admin", ord=1,
     desc="Admin commands: kill, speed, jump, noclip, teleport, bring, prefix tùy chỉnh...",
     code=[[loadstring(game:HttpGet("https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source"))()]],
     noPark=true},
    {icon="🧰", name="Dex Explorer", cat="Explorer", ord=2,
     desc="Duyệt toàn bộ instance trong game, xem/sửa property, tìm object theo đường dẫn.",
     code=[[loadstring(game:HttpGet("https://raw.githubusercontent.com/infyiff/backup/main/dex.lua"))()]],
     noPark=true},
    {icon="📡", name="SimpleSpy v3", cat="Spy", ord=3,
     desc="Theo dõi RemoteEvent/RemoteFunction: tên, tham số, copy code để gọi lại y hệt.",
     code=[[loadstring(game:HttpGet("https://raw.githubusercontent.com/ex-serum/SimpleSpy/main/SimpleSpy.lua"))()]],
     noPark=true},
    {icon="🎯", name="Niêm tâm (Crosshair)", cat="Tiện ích", ord=4, action="crosshair",
     desc="Bật/tắt vòng tròn niêm tâm + 4 nét ngắn ở GIỮA màn hình game (ngoài menu)."},
    {icon="🧩", name="Trả GUI về màn hình", cat="Tiện ích", ord=5, action="unpark",
     desc="Hoàn tác MỌI GUI hub đang mượn vào menu: tab tính năng + tab 🧩 GUI Ngoài."},
    {icon="🖱", name="Sửa kẹt chuột", cat="Tiện ích", ord=6, action="fixmouse",
     desc="Nhả focus ô nhập, trả GUI về game, đặt lại MouseBehavior — hết cảnh không quay chuột/không bắn."},
    {icon="🔄", name="Nạp lại hub từ đĩa", cat="Tiện ích", ord=7, action="reload",
     desc="Đọc lại file lưu: script đã lưu, waypoint, tab tính năng, cài đặt 🧩 / 🕵 / 🪟."},
    {icon="🧹", name="Dọn host nhúng rác", cat="Tiện ích", ord=8, action="prune",
     desc="Xóa các khung Embedded_ mồ côi/rỗng còn sót trong tab (script tự Destroy GUI để lại)."},
    {icon="🔄", name="Reset Server", cat="Server", ord=9, action="resetserver",
     desc="Vào lại ĐÚNG server đang chơi (giữ nguyên bạn bè/người chơi cùng server). Studio thì nạp lại game."},
    {icon="🔀", name="Hop Server", cat="Server", ord=10, action="hopserver",
     desc="Tự đi lấy mã server: đọc danh sách server công khai, bỏ server hiện tại + server đầy, nhảy sang 1 server khác."},
    {icon="👥", name="Hop Server Ít Người", cat="Server", ord=10.1, action="hoplow",
     desc="Quét 800 server (8 trang) tìm server VẮNG NHẤT (ít người nhất), ưu tiên server chỉ 1-2 người, rồi nhảy sang. Dùng khi muốn farm yên tĩnh."},
    {icon="🌙", name="Hop Server Siêu Vắng (≤3)", cat="Server", ord=10.2, action="hopempty",
     desc="Chỉ tìm server có ≤3 người đang chơi (siêu vắng). Nếu không có, tự động fallback sang tìm server ít người nhất. Quét tối đa 10 trang."},
    {icon="🔐", name="Anti Ban", cat="Server", ord=10.5, action="antiban",
     desc="Tự hop SANG SERVER KHÁC (cùng game) khi bị kick/ban hoặc server nghi hành động (bay/xuyên/tốc độ bị reset). Đánh lạc hướng chủ server. Bấm lại để TẮT."},
    {icon="🌐", name="Lấy mã server (JobId)", cat="Server", ord=11, action="getjobid",
     desc="Đọc mã server hiện tại, copy ra clipboard và điền sẵn vào ô 🎟 để gửi cho bạn bè vào cùng."},
    {icon="🚀", name="Bay theo camera", cat="Di chuyển", ord=12, action="fly",
     desc="Bay ĐIỀU KHIỂN TAY theo camera (khác 🛡 Bay An Toàn). Nhìn xuống 60° + tiến tới = xuống 60°. WASD/joystick; thả phím đứng lơ lửng. Space lên · Shift/Ctrl xuống. 🧱 xuyên tường bật/tắt riêng ở khung 🚀."},
    {icon="💨", name="Tốc độ theo camera", cat="Di chuyển", ord=12.2, action="camspeed",
     desc="Chạy trên mặt đất 100% kiểu 🚀: WASD/joystick theo hướng camera. KHÔNG xuyên tường, nhảy bình thường, rơi theo trọng lực game, không nút ảo. Chỉnh tốc độ ở khung 💨."},
    {icon="🪩", name="Thảm kính bám chân", cat="Di chuyển", ord=12.6, action="carpet",
     desc="Bật/tắt một thảm kính trong suốt bám dưới chân; tương thích chế độ thảm cũ, không ảnh hưởng các tấm kính cố định."},
    {icon="🧱", name="Đặt tấm kính cố định", cat="Di chuyển", ord=12.7, action="placeglass",
     desc="Đặt thêm một tấm kính dưới chân tại vị trí hiện tại. Mỗi lần bấm tạo một tấm mới, không ghi đè tấm trước."},
    {icon="📋", name="Quản lý kính đã đặt", cat="Di chuyển", ord=12.8, action="openglasspanel",
     desc="Mở tab 👥 Người Chơi để xem số lượng/danh sách, bay tới hoặc xóa riêng từng tấm kính."},
    {icon="🔄", name="Tự đặt kính theo đường đi", cat="Di chuyển", ord=12.9, action="autoglass",
     desc="Tự thêm kính cố định khi di chuyển đủ xa; bấm lại để dừng. Danh sách và số lượng cập nhật trong menu."},
    {icon="🧹", name="Xóa toàn bộ kính", cat="Di chuyển", ord=12.95, action="clearglass",
     desc="Xóa tất cả tấm kính cố định đã đặt, không tắt thảm kính bám chân."},
    {icon="🚀", name="Bay tới kính gần nhất", cat="Di chuyển", ord=12.96, action="flyglass",
     desc="Bay xuyên vật cản tới tâm tấm kính cố định gần nhất; tốc độ chỉnh trong tab 👥 Người Chơi."},
    {icon="⏹", name="Dừng bay tới kính", cat="Di chuyển", ord=12.97, action="stopglassfly",
     desc="Dừng ngay lực bay tới tấm kính và khôi phục trạng thái nhân vật trước khi bay."},
    {icon="🧱", name="Xuyên Tường", cat="Di chuyển", ord=13, action="noclip",
     desc="Đi xuyên mọi vật cản. Tắt đi trả lại ĐÚNG CanCollide gốc của từng part (không gán cứng như bản cũ)."},
    {icon="🦘", name="Nhảy Vô Hạn", cat="Di chuyển", ord=14, action="infjump",
     desc="Nhảy mãi không chạm đất. Tự thử 3 cách nhảy (ChangeState · lệnh Jump · đẩy vận tốc) nên cả game cấm nhảy, để JumpPower=0 hay ăn mất phím Space vẫn nhảy được."},
    {icon="🦘", name="Nhảy Cao", cat="Di chuyển", ord=14.2, action="highjump",
     desc="Công tắc độc lập kiểu 👤 Né người (🛡): BẬT/TẮT + chỉnh tốc độ nhảy. Space là nhảy cao, rơi theo trọng lực game. Không xuyên tường, không nút ảo. Không thay 🦘 Nhảy vô hạn."},
            {icon="🎥", name="Khán giả", cat="Tiện ích", ord=21.5, action="freecam",
     desc="Camera BAY khắp nơi giống 🚀 (WASD · Space/Shift · nhìn chuột). Nhân vật MÌNH đứng yên tại chỗ. Tắt thì trả camera. Không FireServer. Không cướp 🚀💨🦘🛡✨🔐."},
    {icon="✨", name="Phát Sáng", cat="Tiện ích", ord=22, action="glow",
     desc="CHÍNH BẠN phát sáng: nhuộm sáng cả nhân vật + đèn toả sáng thật quanh người. Chỉnh CHIỀU RỘNG + ĐỘ SÁNG + MÀU ở khung ✨ ngay đầu danh sách. 👁 xuyên tường (sáng xuyên vật cản) · 💡 đèn không bị vật cản chặn · bị game xoá hay respawn thì tự gắn lại."},
    {icon="🛡", name="Bay An Toàn", cat="Di chuyển", ord=23, action="safefly",
     desc="Bật là TỰ BAY + TỰ NÉ NGƯỜI CHƠI và mọi vật có dấu hiệu chuyển động (kể cả vật bị script/tween kéo đi) trong bán kính bạn chỉnh: càng gần đẩy càng mạnh, quá gần thì vọt lên trên. 🔲 Có BỨC TƯỜNG TRONG SUỐT HÌNH VUÔNG bao quanh cho thấy vùng né · 🧱 tự bật Xuyên Tường để đẩy bạn QUA vật cản. Chỉnh 💨 tốc độ · 📏 khoảng cách né · 🌀 né gắt ở khung 🛡 ngay đầu danh sách."},
    {icon="📍", name="Định Vị Người Chơi", cat="Định vị", ord=17, action="loc_all",
     desc="Xuyên tường thấy TẤT CẢ người chơi. Bấm lại để TẮT. Chọn từng người / khoảng cách: tab 👥 Người Chơi."},
    {icon="👣", name="Xem Người Chơi", cat="Định vị", ord=19, action="spec_on",
     desc="Bám camera theo người gần nhất. Bấm lại để TRẢ CAMERA. Danh sách chọn người: tab 👥."},
}
S.hubFavs   = S.hubFavs or {}
S.hubCat    = "Tất cả"
S.hubSearch = ""

-- END SCRIPT_HUB_CATALOG

function D.CardBtn(parent, text, posX, w, color)
    local b = New("TextButton", {
        Size = UDim2.new(0, w, 0, 24), Position = UDim2.new(1, posX, 0, 16),
        Text = text, BackgroundColor3 = color or C.SURFACE3, BackgroundTransparency = 0.08,
        TextColor3 = D.BestText(color or C.SURFACE3), Font = Enum.Font.GothamBold, TextSize = 9,
        BorderSizePixel = 0, ZIndex = 8,
    }, parent)
    Corner(b, UDim.new(0, 7))
    Stroke(b, D.Edge(color or C.SURFACE3), 1.1)
    D.Shade(b, Color3.fromRGB(255,255,255), Color3.fromRGB(182,187,201), 90)   -- v4.9: bevel sâu hơn
    D.Tactile(b, 0.08)
    return b
end

-- BEGIN ORIGINAL_SCRIPT_HUB_UI
D.hubTab = hubRoot

D.hubSearchBox = New("TextBox", {
    Size = UDim2.new(1, -16, 0, 26), Position = UDim2.new(0, 8, 0, 8),
    PlaceholderText = "🔍  Tìm script hoặc tiện ích...", Text = "", ClearTextOnFocus = false,
    BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.08, TextColor3 = C.DARK,
    PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 10,
    TextXAlignment = Enum.TextXAlignment.Left, BorderSizePixel = 0, ZIndex = 6,
}, D.hubTab)
Corner(D.hubSearchBox, UDim.new(0, 10))
Stroke(D.hubSearchBox, C.BORDER, 1)
New("UIPadding", {PaddingLeft = UDim.new(0, 9)}, D.hubSearchBox)

D.hubChips = New("Frame", {
    Size = UDim2.new(1, -16, 0, 22), Position = UDim2.new(0, 8, 0, 38),
    BackgroundTransparency = 1, BorderSizePixel = 0, ZIndex = 6,
}, D.hubTab)
New("UIListLayout", {
    FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 5),
    SortOrder = Enum.SortOrder.LayoutOrder, VerticalAlignment = Enum.VerticalAlignment.Center,
}, D.hubChips)

D.hubList = New("ScrollingFrame", {
    Size = UDim2.new(1, -16, 1, -146), Position = UDim2.new(0, 8, 0, 64),   -- v4.6.3: bớt 54px cho khung 🌐 Server
    BackgroundTransparency = 1, BorderSizePixel = 0, CanvasSize = UDim2.new(0, 0, 0, 0),
    ScrollBarThickness = 3, ClipsDescendants = true, ZIndex = 6,
    AutomaticCanvasSize = Enum.AutomaticSize.Y,
}, D.hubTab)
New("UIListLayout", {Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder}, D.hubList)

D.hubStatus = New("TextLabel", {
    Size = UDim2.new(1, -16, 0, 22), Position = UDim2.new(0, 8, 1, -24),
    Text = "📚 Bấm ▶ để chạy script, ⚡ để thực hiện tiện ích · ⭐ để ghim lên đầu",
    BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium, TextSize = 9,
    TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left,
    TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 6,
}, D.hubTab)

-- ---------- v4.6.3: KHUNG 🌐 SERVER nằm ngay dưới danh sách thẻ ----------
D.hubSrvPanel = New("Frame", {
    Name = "HubServerPanel", Size = UDim2.new(1, -16, 0, 80), Position = UDim2.new(0, 8, 1, -80),
    BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.25, BorderSizePixel = 0, ZIndex = 6,
}, D.hubTab)
Corner(D.hubSrvPanel, UDim.new(0, 10))
Stroke(D.hubSrvPanel, C.BORDER, 1)

D.hubJobLbl = New("TextLabel", {
    Size = UDim2.new(1, -44, 0, 14), Position = UDim2.new(0, 8, 0, 5),
    Text = "🌐 Mã server: đang đọc...", BackgroundTransparency = 1, TextColor3 = C.MUTED,
    Font = Enum.Font.GothamMedium, TextSize = 9,
    TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
}, D.hubSrvPanel)

D.hubJobCopy = New("TextButton", {
    Size = UDim2.new(0, 26, 0, 16), Position = UDim2.new(1, -32, 0, 4), Text = "📋",
    BackgroundColor3 = C.BLUE, BackgroundTransparency = 0.1, TextColor3 = C.INK,
    Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, AutoButtonColor = false, ZIndex = 7,
}, D.hubSrvPanel)
Corner(D.hubJobCopy, UDim.new(0, 6))
D.Tactile(D.hubJobCopy, 0.1)

D.hubJobIn = New("TextBox", {
    Size = UDim2.new(1, -124, 0, 24), Position = UDim2.new(0, 8, 0, 24),
    PlaceholderText = "🎟 Dán mã server (JobId) vào đây...", Text = "", ClearTextOnFocus = false,
    BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
    PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
    TextXAlignment = Enum.TextXAlignment.Left, BorderSizePixel = 0, ZIndex = 7,
}, D.hubSrvPanel)
Corner(D.hubJobIn, UDim.new(0, 8))
Stroke(D.hubJobIn, C.BORDER, 1)
New("UIPadding", {PaddingLeft = UDim.new(0, 7)}, D.hubJobIn)

D.hubJoinBtn = D.CardBtn(D.hubSrvPanel, "🚀 Vào", -110, 52, C.GREEN)
D.hubJoinBtn.Position = UDim2.new(1, -110, 0, 24)
D.hubHopBtn = D.CardBtn(D.hubSrvPanel, "🔀 Hop", -54, 50, C.PURPLE)
D.hubHopBtn.Position = UDim2.new(1, -54, 0, 24)

-- Nút hop ít người
D.hubLowBtn = D.CardBtn(D.hubSrvPanel, "👥 Ít", -110, 40, C.BLUE)
D.hubLowBtn.Position = UDim2.new(1, -110, 0, 52)
D.hubEmptyBtn = D.CardBtn(D.hubSrvPanel, "🌙 Vắng", -62, 44, C.ORANGE)
D.hubEmptyBtn.Position = UDim2.new(1, -62, 0, 52)


function S.SyncServerPanel()
    pcall(function()
        if not D.hubJobLbl then return end
        local jid = S.GetJobId()
        if jid then
            D.hubJobLbl.Text = "🌐 Mã server: " .. jid
            D.hubJobLbl.TextColor3 = C.DARK
        else
            D.hubJobLbl.Text = "🌐 Không đọc được mã server (Studio/server đơn) — 🔄 Reset vẫn dùng được"
            D.hubJobLbl.TextColor3 = C.MUTED
        end
    end)
end

D.hubJobCopy.Activated:Connect(function()
    local jid = S.GetJobId()
    if not jid then
        D.Say("⚠️ Không có mã server để copy (đang ở Studio / server đơn)")
        return
    end
    local okCp = S.CopyToClipboard(jid)
    pcall(function() D.hubJobIn.Text = jid end)
    D.Say(okCp and ("📋 Đã copy mã server: " .. jid)
              or ("⚠️ Executor không cho copy — mã server là: " .. jid), okCp and C.GREEN or C.YELLOW)
end)

D.hubJoinBtn.Activated:Connect(function()
    local id = tostring(D.hubJobIn.Text or "")
    id = id:gsub("^%s+", ""):gsub("%s+$", "")
    id = id:gsub('^"', ""):gsub('"$', ""):gsub("^'", ""):gsub("'$", "")
    if id == "" then
        D.Say("⚠️ Hãy DÁN mã server (JobId) vào ô 🎟 trước khi bấm 🚀 Vào")
        ReleaseHubFocus()
        return
    end
    D.Say("🚀 Đang vào server " .. id .. " ...", C.YELLOW)
    ReleaseHubFocus()   -- nhả focus ô nhập, không thì game chặn input sau khi teleport
    local okJ, errJ = pcall(function() S.JoinServer(id) end)
    if not okJ then
        D.Say("⚠️ Không vào được server này (mã sai/hết chỗ/game chặn): " .. tostring(errJ))
    end
end)

D.hubHopBtn.Activated:Connect(function()
    ReleaseHubFocus()
    D.Say("🔀 Đang đi lấy mã server...", C.YELLOW)
    D.hubStatus.Text = S.RunHubAction("hopserver")
end)

D.hubLowBtn.Activated:Connect(function()
    ReleaseHubFocus()
    D.Say("👥 Đang quét 800 server tìm server ÍT NGƯỜI nhất...", C.YELLOW)
    D.hubStatus.Text = S.RunHubAction("hoplow")
end)

D.hubEmptyBtn.Activated:Connect(function()
    ReleaseHubFocus()
    D.Say("🌙 Đang tìm server SIÊU VẮNG ≤3 người...", C.YELLOW)
    D.hubStatus.Text = S.RunHubAction("hopempty")
end)



S.HubPanelCat = {
    HubTune_Panel = "Di chuyển",
    HubFly_Panel = "Di chuyển",
    HubSpeed_Panel = "Di chuyển",
    HubHighJump_Panel = "Di chuyển",
    HubMove_Panel = "Di chuyển",
    HubSafe_Panel = "Di chuyển",
    HubGlow_Panel = "Tiện ích",
    HubFree_Panel = "Tiện ích",
    HubAntiBan_Panel = "Server",
}
function S.SyncHubPanels()
    local list = D.hubList
    if not list or not list.Parent then return end
    local cat = S.hubCat or "Tất cả"
    for _, c in ipairs(list:GetChildren()) do
        local want = S.HubPanelCat[c.Name]
        if want then
            c.Visible = (cat == "Tất cả") or (cat == want)
        end
    end
end

function S.RebuildHubList()
    local list = D.hubList
    if not list or not list.Parent then return end
    local stale = {}
    for _, c in ipairs(list:GetChildren()) do
        if c:IsA("Frame") and c.Name:sub(1, 8) == "HubCard_" then stale[#stale + 1] = c end
    end
    for _, c in ipairs(stale) do pcall(function() c:Destroy() end) end

    local q = tostring(S.hubSearch or ""):lower()
    local cat = S.hubCat or "Tất cả"
    local items = {}
    for _, it in ipairs(S.ScriptHubList) do
        local okCat = (cat == "Tất cả") or (it.cat == cat)
        local okQ = (q == "")
            or tostring(it.name):lower():find(q, 1, true) ~= nil
            or tostring(it.desc or ""):lower():find(q, 1, true) ~= nil
            or tostring(it.cat or ""):lower():find(q, 1, true) ~= nil
        if okCat and okQ then items[#items + 1] = it end
    end
    table.sort(items, function(a, b)
        local fa = S.hubFavs[a.name] and 1 or 0
        local fb = S.hubFavs[b.name] and 1 or 0
        if fa ~= fb then return fa > fb end
        return (a.ord or 99) < (b.ord or 99)
    end)

    for i, it in ipairs(items) do
        local card = New("Frame", {
            Name = "HubCard_" .. tostring(it.name), Size = UDim2.new(1, 0, 0, 56), LayoutOrder = i + 1,
            BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
        }, list)
        Corner(card, UDim.new(0, 10))
        Stroke(card, S.hubFavs[it.name] and C.ACCENT or C.HAIRLINE, 1)   -- v4.9: viền tách khối rõ hơn
        D.Shade(card, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)   -- v4.9: thẻ có khối

        local ico = New("TextLabel", {
            Size = UDim2.new(0, 34, 0, 34), Position = UDim2.new(0, 8, 0, 11), Text = it.icon,
            BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.15, TextColor3 = C.ACCENT,
            Font = Enum.Font.GothamBold, TextSize = 16, BorderSizePixel = 0, ZIndex = 7,
        }, card)
        Corner(ico, UDim.new(0, 9))
        D.Shade(ico, Color3.fromRGB(255,255,255), Color3.fromRGB(176,181,196), 90)
        Stroke(ico, C.HAIRLINE, 1)

        New("TextLabel", {
            Size = UDim2.new(1, -214, 0, 14), Position = UDim2.new(0, 50, 0, 8),
            Text = tostring(it.name) .. (S.hubFavs[it.name] and "  ⭐" or ""),
            BackgroundTransparency = 1, TextColor3 = C.DARK, Font = Enum.Font.GothamBold, TextSize = 11,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, card)
        New("TextLabel", {
            Size = UDim2.new(1, -214, 0, 10), Position = UDim2.new(0, 50, 0, 22),
            Text = string.upper(tostring(it.cat or "")), BackgroundTransparency = 1,
            TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 8,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, card)
        New("TextLabel", {
            Size = UDim2.new(1, -214, 0, 20), Position = UDim2.new(0, 50, 0, 33),
            Text = tostring(it.desc or ""), BackgroundTransparency = 1, TextColor3 = C.MUTED,
            Font = Enum.Font.GothamMedium, TextSize = 9, TextWrapped = true,
            TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
        }, card)

        local isAction = (it.action ~= nil)
        local runText
        if isAction then
            if it.action == "crosshair" then
                runText = (S.crosshairOn and "🎯 TẮT") or "🎯 BẬT"
            elseif S.MoveActionState and S.MoveActionState[it.action] then
                local on = false
                pcall(function() on = S.MoveActionState[it.action]() end)
                runText = tostring(it.icon) .. " " .. ((on and "TẮT") or "BẬT")
            else
                runText = "⚡ Chạy"
            end
        else
            runText = "▶ Chạy"
        end
        local runBtn = D.CardBtn(card, runText, -166, 78, isAction and C.SURFACE3 or C.GREEN)
        runBtn.Name = "ScriptHubRun"
        runBtn.Activated:Connect(function()
            ReleaseHubFocus()
            if it.code then
                local okR = RunCode(it.code, it.name, nil, 1, 0, it.noPark == true)
                D.Say((okR and "▶ đã chạy '" or "⚠️ không chạy được '") .. it.name .. "'"
                    .. (it.noPark and " · 🪟 GUI của nó ở NGOÀI màn hình game (đúng như tab 🛠)" or "")
                    .. " · xem chi tiết ở tab 💻 Code", C.YELLOW)
            else
                D.Say(S.RunHubAction(it.action), C.YELLOW)
            end
        end)

        if it.code then
            local copyBtn = D.CardBtn(card, "📋", -84, 24, C.BLUE)
            copyBtn.Name = "ScriptHubCopy"
            copyBtn.Activated:Connect(function()
                local did = S.CopyToClipboard(it.code)
                D.Say(did and ("📋 đã copy loadstring của '" .. it.name .. "'")
                           or "⚠️ executor này không hỗ trợ clipboard", did and C.GREEN or C.RED)
            end)
            local saveBtn = D.CardBtn(card, "💾", -56, 24, C.PURPLE)
            saveBtn.Name = "ScriptHubSave"
            saveBtn.Activated:Connect(function()
                local nm = it.name
                local cnt = 1
                while true do
                    local ex = false
                    for _, s in ipairs(bridge.getScripts()) do if s.name == nm then ex = true break end end
                    if not ex then break end
                    cnt += 1
                    nm = it.name .. " (" .. cnt .. ")"
                end
                table.insert(bridge.getScripts(), {name = nm, code = it.code, expanded = false})
                pcall(function() if RebuildScripts then RebuildScripts() end end)
                pcall(function() Store.saveSoon() end)
                D.Say("💾 đã lưu '" .. nm .. "' sang tab 💾 Code Đã Lưu", C.GREEN)
            end)
        end

        local favBtn = D.CardBtn(card, S.hubFavs[it.name] and "⭐" or "☆", -28, 24,
            S.hubFavs[it.name] and C.YELLOW or C.SURFACE3)
        favBtn.Name = "ScriptHubFavorite"
        favBtn.Activated:Connect(function()
            if S.hubFavs[it.name] then S.hubFavs[it.name] = nil else S.hubFavs[it.name] = true end
            pcall(function() Store.saveSoon() end)   -- lưu yêu thích xuống đĩa
            S.RebuildHubList()
            D.Say(S.hubFavs[it.name] and ("⭐ đã ghim '" .. it.name .. "' lên đầu")
                                      or ("☆ đã bỏ ghim '" .. it.name .. "'"), C.MUTED)
        end)
    end

    pcall(function()
        if S.SyncHubPanels then S.SyncHubPanels() end
        local panelH = 0
        for _, c in ipairs(list:GetChildren()) do
            if c:IsA("Frame") and c.Name:sub(1, 8) ~= "HubCard_" and c.Visible ~= false then
                panelH = panelH + ((c.Size and c.Size.Y.Offset) or 0) + 6
            end
        end
        list.CanvasSize = UDim2.new(0, 0, 0, #items * 62 + 6 + panelH)
    end)
    if S.SyncFlyPanel then pcall(S.SyncFlyPanel) end          -- v4.36: Bay + xuyên tường độc lập
    if S.SyncSpeedPanel then pcall(S.SyncSpeedPanel) end      -- v4.37: 💨 tốc độ theo camera
    if S.SyncHighJumpPanel then pcall(S.SyncHighJumpPanel) end -- v4.38: 🦘 nhảy cao
    if S.SyncTunePanel then pcall(S.SyncTunePanel) end         -- v4.40: ⚙ tuỳ chỉnh gom
    if S.RefreshMovePanel then pcall(S.RefreshMovePanel) end   -- v4.12: nhãn trạng thái di chuyển
    if S.SyncGlowPanel then pcall(S.SyncGlowPanel) end         -- v4.16: nhãn khung ✨ phát sáng
    if S.SyncFreePanel then pcall(S.SyncFreePanel) end         -- v4.64: 🎥 khán giả
    if S.SyncSafePanel then pcall(S.SyncSafePanel) end         -- v4.17: nhãn khung 🛡 bay an toàn
    if S.SyncAntiBanPanel then pcall(S.SyncAntiBanPanel) end   -- v4.43: 🔐 anti ban
    if #items == 0 and D.hubStatus then
        D.Say("🔍 không tìm thấy gì khớp '" .. tostring(S.hubSearch or "") .. "'", C.MUTED)
    end
end

-- ---------- v4.40: KHUNG ⚙ TUỲ CHỈNH (Bay · Tốc độ camera · Nhảy cao · Di chuyển) ----------
do
    local P = New("Frame", {
        Name = "HubTune_Panel", Size = UDim2.new(1, 0, 0, 172), LayoutOrder = -4,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10)); Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 4),
        Text = "⚙ TUỲ CHỈNH — 🚀 Bay · 💨 Tốc độ camera · 🦘 Nhảy cao · 👟 Di chuyển",
        BackgroundTransparency = 1, TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local function button(name, text, x, y, w, color)
        local b = New("TextButton", {
            Name = name, Text = text, Size = UDim2.new(0, w, 0, 22), Position = UDim2.new(0, x, 0, y),
            BackgroundColor3 = color, TextColor3 = D.BestText(color), BorderSizePixel = 0,
            Font = Enum.Font.GothamBold, TextSize = 9, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6)); D.Tactile(b, 0.08)
        return b
    end
    local function box(name, x, y, val)
        local b = New("TextBox", {
            Name = name, Size = UDim2.new(0, 52, 0, 22), Position = UDim2.new(0, x, 0, y),
            Text = tostring(val), ClearTextOnFocus = false, BackgroundColor3 = C.SURFACE2,
            TextColor3 = C.DARK, Font = Enum.Font.GothamMedium, TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6))
        return b
    end
    local function lab(txt, x, y, w)
        New("TextLabel", {
            Size = UDim2.new(0, w, 0, 22), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundTransparency = 1, TextColor3 = C.MUTED,
            Font = Enum.Font.GothamMedium, TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, P)
    end

    local flyBtn = button("TuneFly", "🚀 Bay: TẮT", 8, 24, 110, C.GRAY)
    local flyBox = box("TuneFlySpeed", 122, 24, MV.flySpeed)
    local flyApply = button("TuneFlyApply", "✔", 178, 24, 32, C.GREEN)
    local flyStop = button("TuneFlyStop", "⏹", 214, 24, 32, C.RED)

    local spdBtn = button("TuneSprint", "💨 Tốc độ: TẮT", 8, 50, 110, C.GRAY)
    local spdBox = box("TuneSprintSpeed", 122, 50, MV.sprintSpeed)
    local spdApply = button("TuneSprintApply", "✔", 178, 50, 32, C.GREEN)
    local spdStop = button("TuneSprintStop", "⏹", 214, 50, 32, C.RED)

    local hjBtn = button("TuneHighJump", "🦘 Nhảy cao: TẮT", 8, 76, 110, C.GRAY)
    local hjBox = box("TuneHighJumpSpeed", 122, 76, MV.highJumpSpeed)
    local hjApply = button("TuneHighJumpApply", "✔", 178, 76, 32, C.GREEN)
    local hjStop = button("TuneHighJumpStop", "⏹", 214, 76, 32, C.RED)

    lab("👟 Chạy", 254, 24, 48)
    local wsBox = box("TuneWalkSpeed", 304, 24, (MV.speedMode == "x") and ("x" .. tostring(MV.speedMul)) or tostring(MV.walkSpeed))
    lab("🦘 Lực nhảy", 254, 50, 70)
    local jpBox = box("TuneJumpPower", 324, 50, MV.jumpPower)
    local mvApply = button("TuneMoveApply", "✔ Di chuyển", 254, 76, 122, C.GREEN)

    local status = New("TextLabel", {
        Name = "TuneStatus", Size = UDim2.new(1, -16, 0, 28), Position = UDim2.new(0, 8, 0, 102),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium,
        TextSize = 9, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 32), Position = UDim2.new(0, 8, 0, 134),
        Text = "💡 ✔ = áp tốc độ dòng đó. 👟 gõ x3 = theo game ×3, gõ số = cố định. Bay tới người chơi và Safe Fly ở khung ⚙ bên dưới.",
        BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium, TextSize = 8,
        TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    local function paintToggle(b, on, label)
        b.Text = label .. (on and "BẬT" or "TẮT")
        D.SetBg(b, on and C.GREEN or C.GRAY)
    end
    local function focused()
        return UserInputService:GetFocusedTextBox()
    end
    function S.SyncTunePanel()
        if not (P and P.Parent) then return end
        paintToggle(flyBtn, MV.fly, "🚀 Bay: ")
        paintToggle(spdBtn, MV.sprint, "💨 Tốc độ: ")
        paintToggle(hjBtn, MV.highJump, "🦘 Nhảy cao: ")
        local tb = focused()
        if tb ~= flyBox then flyBox.Text = tostring(MV.flySpeed) end
        if tb ~= spdBox then spdBox.Text = tostring(MV.sprintSpeed) end
        if tb ~= hjBox then hjBox.Text = tostring(MV.highJumpSpeed) end
        if tb ~= wsBox then
            wsBox.Text = (MV.speedMode == "x") and ("x" .. tostring(MV.speedMul)) or tostring(MV.walkSpeed)
        end
        if tb ~= jpBox then jpBox.Text = tostring(MV.jumpPower) end
        status.Text = (MV.Status and MV.Status()) or ""
    end

    flyBtn.Activated:Connect(function() ReleaseHubFocus(); D.Say(S.RunHubAction("fly"), C.YELLOW) end)
    spdBtn.Activated:Connect(function() ReleaseHubFocus(); D.Say(S.RunHubAction("camspeed"), C.YELLOW) end)
    hjBtn.Activated:Connect(function() ReleaseHubFocus(); D.Say(S.RunHubAction("highjump"), C.YELLOW) end)
    flyStop.Activated:Connect(function()
        ReleaseHubFocus(); MV.SetFly(false); S.Rebuild()
        D.Say("🚀 Bay: TẮT", C.YELLOW)
    end)
    spdStop.Activated:Connect(function()
        ReleaseHubFocus(); MV.SetSprint(false); S.Rebuild()
        D.Say("💨 Tốc độ theo camera: TẮT", C.YELLOW)
    end)
    hjStop.Activated:Connect(function()
        ReleaseHubFocus(); MV.SetHighJump(false); S.Rebuild()
        D.Say("🦘 Nhảy cao: TẮT", C.YELLOW)
    end)
    local function applyFly()
        ReleaseHubFocus()
        local ok, result = MV.SetFlySpeed(flyBox.Text)
        D.Say(ok and ("💨 Tốc độ bay: " .. tostring(result)) or ("⚠️ " .. tostring(result)), ok and C.GREEN or C.YELLOW)
        S.SyncTunePanel()
    end
    local function applySprint()
        ReleaseHubFocus()
        local ok, result = MV.SetSprintSpeed(spdBox.Text)
        D.Say(ok and ("💨 Tốc độ chạy camera: " .. tostring(result)) or ("⚠️ " .. tostring(result)), ok and C.GREEN or C.YELLOW)
        S.SyncTunePanel()
    end
    local function applyHj()
        ReleaseHubFocus()
        local ok, result = MV.SetHighJumpSpeed(hjBox.Text)
        D.Say(ok and ("💨 Tốc độ nhảy cao: " .. tostring(result)) or ("⚠️ " .. tostring(result)), ok and C.GREEN or C.YELLOW)
        S.SyncTunePanel()
    end
    flyApply.Activated:Connect(applyFly)
    spdApply.Activated:Connect(applySprint)
    hjApply.Activated:Connect(applyHj)
    flyBox.FocusLost:Connect(function(enter) if enter then applyFly() end end)
    spdBox.FocusLost:Connect(function(enter) if enter then applySprint() end end)
    hjBox.FocusLost:Connect(function(enter) if enter then applyHj() end end)
    mvApply.Activated:Connect(function()
        ReleaseHubFocus()
        local wmul = tostring(wsBox.Text or ""):match("^[xX×]%s*([%d%.]+)")
        if wmul then
            MV.speedMode = "x"
            MV.speedMul = mvClamp(tonumber(wmul), 1, 20)
        else
            local w = tonumber(wsBox.Text)
            if w then
                MV.speedMode = "num"
                MV.walkSpeed = mvClamp(w, 0, 500, 16)
            end
        end
        local j = tonumber(jpBox.Text)
        if j then MV.jumpPower = mvClamp(j, 0, 500, 50) end
        pcall(function() if MV.speed then MV.ApplyChar() end end)
        if S.RefreshMovePanel then pcall(S.RefreshMovePanel) end
        S.SyncTunePanel()
        D.Say(string.format("⚙ di chuyển: chạy %s · lực nhảy %d",
            (MV.speedMode == "x") and ("×" .. tostring(MV.speedMul)) or tostring(MV.walkSpeed),
            MV.jumpPower), C.GREEN)
    end)
    S.tuneBtns = {panel = P, fly = flyBtn, sprint = spdBtn, highjump = hjBtn, flySpeed = flyBox, sprintSpeed = spdBox, highJumpSpeed = hjBox, walk = wsBox, jump = jpBox}
    S.SyncTunePanel()
end
-- ---------- HẾT KHUNG ⚙ TUỲ CHỈNH ----------

-- ---------- v4.43: KHUNG 🔐 ANTI BAN ----------
do
    local P = New("Frame", {
        Name = "HubAntiBan_Panel", Size = UDim2.new(1, 0, 0, 88), LayoutOrder = 3,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10)); Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 4),
        Text = "🔐 ANTI BAN — tự hop server khác khi bị nghi / định ban",
        BackgroundTransparency = 1, TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local function abtn(name, text, x, y, w, color)
        local b = New("TextButton", {
            Name = name, Text = text, Size = UDim2.new(0, w, 0, 22), Position = UDim2.new(0, x, 0, y),
            BackgroundColor3 = color, TextColor3 = D.BestText(color), BorderSizePixel = 0,
            Font = Enum.Font.GothamBold, TextSize = 9, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6)); D.Tactile(b, 0.08)
        return b
    end
    local onBtn = abtn("AntiBanOn", "🔐 TẮT", 8, 24, 88, C.GRAY)
    local hopBtn = abtn("AntiBanHopNow", "🔀 Hop ngay", 100, 24, 88, C.PURPLE)
    New("TextLabel", {
        Size = UDim2.new(0, 52, 0, 22), Position = UDim2.new(0, 194, 0, 24),
        Text = "⏳ chờ s", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local cdBox = New("TextBox", {
        Name = "AntiBanCooldown", Size = UDim2.new(0, 44, 0, 22), Position = UDim2.new(0, 246, 0, 24),
        Text = tostring(S.AntiBan.cooldown), ClearTextOnFocus = false, BackgroundColor3 = C.SURFACE2,
        TextColor3 = C.DARK, Font = Enum.Font.GothamMedium, TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
    }, P)
    Corner(cdBox, UDim.new(0, 6))
    local st = New("TextLabel", {
        Name = "AntiBanStatus", Size = UDim2.new(1, -16, 0, 32), Position = UDim2.new(0, 8, 0, 50),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium,
        TextSize = 9, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    function S.SyncAntiBanPanel()
        pcall(function()
            onBtn.Text = S.AntiBan.on and "🔐 BẬT" or "🔐 TẮT"
            D.SetBg(onBtn, S.AntiBan.on and C.GREEN or C.GRAY)
            if UserInputService:GetFocusedTextBox() ~= cdBox then
                cdBox.Text = tostring(S.AntiBan.cooldown or 10)
            end
            st.Text = S.AntiBanStatus() .. " · kick/ban/error → hop. Bay/xuyên bị reset tốc độ 3 lần/4s → hop. Không vào lại đúng server cũ."
        end)
    end
    onBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.RunHubAction("antiban")
        S.SyncAntiBanPanel()
    end)
    hopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        if not S.AntiBan.on then S.AntiBanSet(true) end
        local n = tonumber(cdBox.Text)
        if n then S.AntiBan.cooldown = math.clamp(n, 3, 60) end
        S.AntiBanHop("manual")
        S.SyncAntiBanPanel()
    end)
    cdBox.FocusLost:Connect(function()
        local n = tonumber(cdBox.Text)
        if n then S.AntiBan.cooldown = math.clamp(n, 3, 60) end
        S.SyncAntiBanPanel()
    end)
    S.SyncAntiBanPanel()
end
-- ---------- HẾT KHUNG 🔐 ANTI BAN ----------

-- ---------- v4.36: KHUNG 🚀 BAY THEO CAMERA (công tắc 🧱 độc lập) ----------
do
    local P = New("Frame", {
        Name = "HubFly_Panel", Size = UDim2.new(1, 0, 0, 154), LayoutOrder = -1,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10)); Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 4),
        Text = "🚀 BAY THEO CAMERA — điều khiển tay", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local function button(name, text, x, y, w, color)
        local b = New("TextButton", {
            Name = name, Text = text, Size = UDim2.new(0, w, 0, 24), Position = UDim2.new(0, x, 0, y),
            BackgroundColor3 = color, TextColor3 = D.BestText(color), BorderSizePixel = 0,
            Font = Enum.Font.GothamBold, TextSize = 10, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6)); D.Tactile(b, 0.08)
        return b
    end
    local onBtn = button("FlyToggle", "🚀 Bay: TẮT", 8, 24, 100, C.GRAY)
    local ncBtn = button("FlyNoclip", "🧱 Xuyên tường: TẮT", 114, 24, 158, C.GRAY)
    local hudBtn = button("FlyHudToggle", "📱 Nút ảo: BẬT", 278, 24, 124, C.GREEN)
    New("TextLabel", {
        Size = UDim2.new(0, 128, 0, 24), Position = UDim2.new(0, 8, 0, 54),
        Text = "💨 Tốc độ (1–2000)", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 10, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local speed = New("TextBox", {
        Name = "FlySpeed", Size = UDim2.new(0, 56, 0, 24), Position = UDim2.new(0, 140, 0, 54),
        Text = tostring(MV.flySpeed), ClearTextOnFocus = false, BackgroundColor3 = C.SURFACE2,
        TextColor3 = C.DARK, Font = Enum.Font.GothamMedium, TextSize = 10, BorderSizePixel = 0, ZIndex = 8,
    }, P)
    Corner(speed, UDim.new(0, 6))
    local apply = button("FlySpeedApply", "✔ Áp dụng", 202, 54, 92, C.GREEN)
    local stop = button("FlyStop", "⏹ Dừng bay", 300, 54, 102, C.RED)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 46), Position = UDim2.new(0, 8, 0, 84),
        Text = "WASD / joystick: bay theo camera cả lên và xuống. Nhìn xuống 60° + tiến tới = bay xuống 60°. "
            .. "Space / ⬆: lên; Shift/Ctrl / ⬇: xuống. Thả điều khiển: đứng lơ lửng. "
            .. "🧱 là công tắc riêng, Bay không tự bật/tắt xuyên tường.",
        BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)
    local status = New("TextLabel", {
        Name = "FlyPanelStatus", Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 134),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium,
        TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    function S.SyncFlyPanel()
        local function paint(b, on, label)
            b.Text = label .. (on and "BẬT" or "TẮT")
            D.SetBg(b, on and C.GREEN or C.GRAY)
        end
        paint(onBtn, MV.fly, "🚀 Bay: ")
        paint(ncBtn, MV.noclip, "🧱 Xuyên tường: ")
        paint(hudBtn, MV.Flight.showHud, "📱 Nút ảo: ")
        if UserInputService:GetFocusedTextBox() ~= speed then speed.Text = tostring(MV.flySpeed) end
        status.Text = MV.fly and ("🚀 Đang bay theo camera · tốc độ " .. tostring(MV.flySpeed) .. " · thả phím để dừng tại chỗ")
            or "🚀 Đã tắt bay · 🧱 xuyên tường " .. (MV.noclip and "BẬT" or "TẮT")
    end
    onBtn.Activated:Connect(function() ReleaseHubFocus(); D.Say(S.RunHubAction("fly"), C.YELLOW) end)
    ncBtn.Activated:Connect(function() ReleaseHubFocus(); D.Say(S.RunHubAction("noclip"), C.YELLOW) end)
    hudBtn.Activated:Connect(function() ReleaseHubFocus(); MV.SetFlyHud(not MV.Flight.showHud) end)
    local function applySpeed()
        local value = speed.Text
        ReleaseHubFocus()
        local ok, result = MV.SetFlySpeed(value)
        if ok then D.Say("💨 Tốc độ bay: " .. tostring(result), C.GREEN)
        else D.Say("⚠️ " .. tostring(result), C.YELLOW) end
        S.SyncFlyPanel()
    end
    apply.Activated:Connect(applySpeed)
    speed.FocusLost:Connect(function(enter) if enter then applySpeed() end end)
    stop.Activated:Connect(function()
        ReleaseHubFocus(); MV.SetFly(false); S.Rebuild()
        D.Say("🚀 Bay: TẮT — xuyên tường giữ nguyên theo công tắc 🧱", C.YELLOW)
    end)
    S.flyBtns = {on = onBtn, noclip = ncBtn, hud = hudBtn, speed = speed, apply = apply, stop = stop, panel = P}
    S.SyncFlyPanel()
end
-- ---------- HẾT KHUNG 🚀 BAY THEO CAMERA ----------

-- ---------- v4.37: KHUNG 💨 TỐC ĐỘ THEO CAMERA (không xuyên tường, không nút ảo) ----------
do
    local P = New("Frame", {
        Name = "HubSpeed_Panel", Size = UDim2.new(1, 0, 0, 130), LayoutOrder = -2,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10)); Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 4),
        Text = "💨 TỐC ĐỘ THEO CAMERA — mặt đất, nhảy/rơi theo game", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local function button(name, text, x, y, w, color)
        local b = New("TextButton", {
            Name = name, Text = text, Size = UDim2.new(0, w, 0, 24), Position = UDim2.new(0, x, 0, y),
            BackgroundColor3 = color, TextColor3 = D.BestText(color), BorderSizePixel = 0,
            Font = Enum.Font.GothamBold, TextSize = 10, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6)); D.Tactile(b, 0.08)
        return b
    end
    local onBtn = button("SpeedToggle", "💨 Tốc độ: TẮT", 8, 24, 132, C.GRAY)
    local stop = button("SpeedStop", "⏹ Dừng", 146, 24, 80, C.RED)
    New("TextLabel", {
        Size = UDim2.new(0, 128, 0, 24), Position = UDim2.new(0, 8, 0, 54),
        Text = "💨 Tốc độ (1–2000)", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 10, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local speed = New("TextBox", {
        Name = "SprintSpeed", Size = UDim2.new(0, 56, 0, 24), Position = UDim2.new(0, 140, 0, 54),
        Text = tostring(MV.sprintSpeed), ClearTextOnFocus = false, BackgroundColor3 = C.SURFACE2,
        TextColor3 = C.DARK, Font = Enum.Font.GothamMedium, TextSize = 10, BorderSizePixel = 0, ZIndex = 8,
    }, P)
    Corner(speed, UDim.new(0, 6))
    local apply = button("SpeedApply", "✔ Áp dụng", 202, 54, 92, C.GREEN)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 32), Position = UDim2.new(0, 8, 0, 82),
        Text = "WASD / joystick game: chạy theo hướng camera trên mặt đất. Nhảy = Space của game. "
            .. "Rơi theo trọng lực game. Không xuyên tường, không nút ảo.",
        BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)
    local status = New("TextLabel", {
        Name = "SpeedPanelStatus", Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 112),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium,
        TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    function S.SyncSpeedPanel()
        onBtn.Text = "💨 Tốc độ: " .. (MV.sprint and "BẬT" or "TẮT")
        D.SetBg(onBtn, MV.sprint and C.GREEN or C.GRAY)
        if UserInputService:GetFocusedTextBox() ~= speed then speed.Text = tostring(MV.sprintSpeed) end
        status.Text = MV.sprint
            and ("💨 Đang chạy theo camera · tốc độ " .. tostring(MV.sprintSpeed) .. " · nhảy/rơi theo game")
            or "💨 Đã tắt · va chạm tường + nhảy + trọng lực = của game"
    end
    onBtn.Activated:Connect(function() ReleaseHubFocus(); D.Say(S.RunHubAction("camspeed"), C.YELLOW) end)
    local function applySpeed()
        local value = speed.Text
        ReleaseHubFocus()
        local ok, result = MV.SetSprintSpeed(value)
        if ok then D.Say("💨 Tốc độ chạy: " .. tostring(result), C.GREEN)
        else D.Say("⚠️ " .. tostring(result), C.YELLOW) end
        S.SyncSpeedPanel()
    end
    apply.Activated:Connect(applySpeed)
    speed.FocusLost:Connect(function(enter) if enter then applySpeed() end end)
    stop.Activated:Connect(function()
        ReleaseHubFocus(); MV.SetSprint(false); S.Rebuild()
        D.Say("💨 Tốc độ theo camera: TẮT", C.YELLOW)
    end)
    S.speedBtns = {on = onBtn, speed = speed, apply = apply, stop = stop, panel = P}
    S.SyncSpeedPanel()
end
-- ---------- HẾT KHUNG 💨 TỐC ĐỘ THEO CAMERA ----------

-- ---------- v4.38: KHUNG 🦘 NHẢY CAO (công tắc độc lập kiểu 👤 Né người) ----------
do
    local P = New("Frame", {
        Name = "HubHighJump_Panel", Size = UDim2.new(1, 0, 0, 118), LayoutOrder = -3,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10)); Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255,255,255), Color3.fromRGB(188,192,205), 90)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 4),
        Text = "🦘 NHẢY CAO — BẬT/TẮT độc lập (kiểu 👤 Né người)", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local function button(name, text, x, y, w, color)
        local b = New("TextButton", {
            Name = name, Text = text, Size = UDim2.new(0, w, 0, 24), Position = UDim2.new(0, x, 0, y),
            BackgroundColor3 = color, TextColor3 = D.BestText(color), BorderSizePixel = 0,
            Font = Enum.Font.GothamBold, TextSize = 10, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6)); D.Tactile(b, 0.08)
        return b
    end
    local onBtn = button("HighJumpToggle", "🦘 Nhảy cao: TẮT", 8, 24, 148, C.GRAY)
    local stop = button("HighJumpStop", "⏹ Dừng", 162, 24, 80, C.RED)
    New("TextLabel", {
        Size = UDim2.new(0, 148, 0, 24), Position = UDim2.new(0, 8, 0, 54),
        Text = "💨 Tốc độ nhảy (1–500)", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 10, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local speed = New("TextBox", {
        Name = "HighJumpSpeed", Size = UDim2.new(0, 56, 0, 24), Position = UDim2.new(0, 160, 0, 54),
        Text = tostring(MV.highJumpSpeed), ClearTextOnFocus = false, BackgroundColor3 = C.SURFACE2,
        TextColor3 = C.DARK, Font = Enum.Font.GothamMedium, TextSize = 10, BorderSizePixel = 0, ZIndex = 8,
    }, P)
    Corner(speed, UDim.new(0, 6))
    local apply = button("HighJumpApply", "✔ Áp dụng", 222, 54, 92, C.GREEN)
    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 16), Position = UDim2.new(0, 8, 0, 82),
        Text = "BẬT rồi bấm Space: nhảy cao theo số trên. Rơi theo game. Không xuyên tường, không nút ảo.",
        BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local status = New("TextLabel", {
        Name = "HighJumpStatus", Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 100),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED, Font = Enum.Font.GothamMedium,
        TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    function S.SyncHighJumpPanel()
        onBtn.Text = "🦘 Nhảy cao: " .. (MV.highJump and "BẬT" or "TẮT")
        D.SetBg(onBtn, MV.highJump and C.GREEN or C.GRAY)
        if UserInputService:GetFocusedTextBox() ~= speed then speed.Text = tostring(MV.highJumpSpeed) end
        status.Text = MV.highJump
            and ("🦘 Đang nhảy cao · tốc độ " .. tostring(MV.highJumpSpeed) .. " · rơi theo trọng lực game")
            or "🦘 Đã tắt · nhảy = của game (🦘 vô hạn vẫn độc lập)"
    end
    onBtn.Activated:Connect(function() ReleaseHubFocus(); D.Say(S.RunHubAction("highjump"), C.YELLOW) end)
    local function applySpeed()
        local value = speed.Text
        ReleaseHubFocus()
        local ok, result = MV.SetHighJumpSpeed(value)
        if ok then D.Say("💨 Tốc độ nhảy cao: " .. tostring(result), C.GREEN)
        else D.Say("⚠️ " .. tostring(result), C.YELLOW) end
        S.SyncHighJumpPanel()
    end
    apply.Activated:Connect(applySpeed)
    speed.FocusLost:Connect(function(enter) if enter then applySpeed() end end)
    stop.Activated:Connect(function()
        ReleaseHubFocus(); MV.SetHighJump(false); S.Rebuild()
        D.Say("🦘 Nhảy cao: TẮT", C.YELLOW)
    end)
    S.highJumpBtns = {on = onBtn, speed = speed, apply = apply, stop = stop, panel = P}
    S.SyncHighJumpPanel()
end
-- ---------- HẾT KHUNG 🦘 NHẢY CAO ----------

-- ---------- v4.12: KHUNG ⚙ TUỲ CHỈNH DI CHUYỂN (DA XOA THAM KINH) ----------
-- ---------- v4.12: KHUNG ⚙ TUỲ CHỈNH DI CHUYỂN (DA XOA THAM KINH) ----------
do
    local PH = 180
    local P = New("Frame", {
        Name = "HubMove_Panel",
        Size = UDim2.new(1, 0, 0, PH),
        LayoutOrder = 0,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10))
    Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)

    local function title(txt)
        New("TextLabel", {
            Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 4),
            Text = txt, BackgroundTransparency = 1, TextColor3 = C.ACCENT,
            Font = Enum.Font.GothamBold, TextSize = 10,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, P)
    end
    local function lab(txt, x, y, w)
        New("TextLabel", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundTransparency = 1, TextColor3 = C.MUTED,
            Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
        }, P)
    end
    local function box(x, y, w, val)
        local b = New("TextBox", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = tostring(val), ClearTextOnFocus = false,
            BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
            PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
        }, P)
        Corner(b, UDim.new(0, 6))
        Stroke(b, C.BORDER, 1)
        return b
    end
    local function act(txt, x, y, w, color)
        local b = New("TextButton", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundColor3 = color or C.SURFACE3, BackgroundTransparency = 0.08,
            TextColor3 = D.BestText(color or C.SURFACE3), Font = Enum.Font.GothamBold,
            TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6))
        D.Tactile(b, 0.08)
        return b
    end
    local function say(msg, good) D.Say(msg, good and C.GREEN or C.RED) end

    title("⚙ Tuỳ chỉnh di chuyển (áp dụng ngay)")

    lab("🚀 Bay", 8, 22, 52)
    local flyIn = box(62, 22, 44, S.Move.flySpeed)
    lab("👟 Chạy", 114, 22, 50)
    local wsIn = box(166, 22, 40, (S.Move.speedMode == "x") and ("x" .. tostring(S.Move.speedMul)) or tostring(S.Move.walkSpeed))
    lab("🦘 Nhảy", 214, 22, 46)
    local jpIn = box(262, 22, 40, S.Move.jumpPower)
    local ap1 = act("✔", 308, 22, 28, C.GREEN)

    lab("0=auto tốc độ bay người", 8, 48, 140)
    local speedPlayerBox = box(150, 48, 44, S.Move.playerFlySpeed or 0)
    local applyPlayerSpeedBtn = act("✔ Tốc bay người", 200, 48, 110, C.GREEN)

    local upBtn  = act("⬆ Nâng", 8, 74, 62, C.BLUE)
    local dnBtn  = act("⬇ Hạ", 76, 74, 56, C.BLUE)
    local stopBtn = act("🛑 Tắt hết", 138, 74, 76, C.RED)
    local st = New("TextLabel", {
        Size = UDim2.new(1, -230, 0, 20), Position = UDim2.new(0, 222, 0, 74),
        Text = S.Move.Status(), BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    ap1.Activated:Connect(function()
        ReleaseHubFocus()
        local f = tonumber(flyIn.Text); local w = tonumber(wsIn.Text); local j = tonumber(jpIn.Text)
        if f then
            S.Move.flySpeed = (f >= 1 and f <= 2000) and f or S.Move.flySpeed
            S.Move.SyncFlyHud()
        end
        local wmul = tostring(wsIn.Text or ""):match("^[xX×]%s*([%d%.]+)")
        if wmul then
            S.Move.speedMode = "x"
            S.Move.speedMul  = mvClamp(tonumber(wmul), 1, 20)
        elseif w then
            S.Move.speedMode = "num"
            S.Move.walkSpeed = (w >= 1 and w <= 500) and w or S.Move.walkSpeed
        end
        if j then S.Move.jumpPower = (j >= 0 and j <= 500) and j or S.Move.jumpPower end
        flyIn.Text = tostring(S.Move.flySpeed)
        wsIn.Text  = (S.Move.speedMode == "x") and ("x" .. tostring(S.Move.speedMul)) or tostring(S.Move.walkSpeed)
        jpIn.Text  = tostring(S.Move.jumpPower)
        pcall(function() if S.Move.speed then S.Move.ApplyChar() end end)
        say(string.format("⚙ đã áp dụng: bay %d · chạy %s · nhảy %d%s",
            S.Move.flySpeed,
            (S.Move.speedMode == "x") and ("×" .. tostring(S.Move.speedMul) .. " (theo game)") or tostring(S.Move.walkSpeed),
            S.Move.jumpPower,
            (S.Move.speedMode == "x" and S.Move.speed) and (" = " .. tostring(S.Move.WantSpeed())) or ""), true)
    end)

    upBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local ok, what = S.Move.Nudge(2.5)
        say(ok and ("⬆ đã nâng " .. tostring(what) .. " lên 2.5") or "⬆ bật Bay trước đã", ok == true)
        st.Text = S.Move.Status()
    end)
    dnBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local ok, what = S.Move.Nudge(-2.5)
        say(ok and ("⬇ đã hạ " .. tostring(what) .. " xuống 2.5") or "⬇ bật Bay trước đã", ok == true)
        st.Text = S.Move.Status()
    end)
    stopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        D.Say(S.RunHubAction("movestop"), C.YELLOW)
        st.Text = S.Move.Status()
    end)

    local pcBtn
    local TXT_PASS_ON  = "🧲 Đẩy xuyên khi kẹt: BẬT"
    local TXT_PASS_OFF = "🧲 Đẩy xuyên khi kẹt: TẮT"
    local function paintPass()
        local on = (S.Move.ncPass ~= false)
        pcBtn.Text = on and TXT_PASS_ON or TXT_PASS_OFF
        pcBtn.BackgroundColor3 = on and C.GREEN or C.GRAY
        pcBtn.TextColor3 = D.BestText(pcBtn.BackgroundColor3)
    end
    pcBtn = act(TXT_PASS_ON, 8, 100, 168, C.GREEN)
    S.Move._passBtn = pcBtn
    pcBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Move.ncPass = (S.Move.ncPass == false)
        paintPass()
        say(S.Move.ncPass and "🧲 tự đẩy xuyên: BẬT" or "🧲 tự đẩy xuyên: TẮT", true)
    end)

    local flyPlayerBtn = act("🚀 Bay tới người gần nhất", 184, 100, 150, C.ACCENT)
    local stopPlayerFlyBtn = act("⏹ Dừng bay người", 340, 100, 110, C.RED)

    local function paintGlass()
        local pFlying = S.Move._playerFlyActive == true
        flyPlayerBtn.Text = pFlying and ("🚀 Đang bay tới " .. tostring(S.Move._playerFlyTarget and S.Move._playerFlyTarget.Name or "?")) or "🚀 Bay tới người gần nhất"
        flyPlayerBtn.BackgroundColor3 = pFlying and C.GREEN or C.ACCENT
        flyPlayerBtn.TextColor3 = D.BestText(flyPlayerBtn.BackgroundColor3)
        if speedPlayerBox then speedPlayerBox.Text = tostring(S.Move.playerFlySpeed or 0) end
    end
    flyPlayerBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local target = nil
        if S.Loc and S.Loc.Nearest then target = S.Loc.Nearest() end
        if not target then
            say("⚠️ không có người chơi nào để bay tới", false)
            return
        end
        local ok, res = S.Move.FlyToPlayer(target)
        st.Text = S.Move.Status()
        paintGlass()
        if S.Loc and S.Loc.RefreshList then pcall(S.Loc.RefreshList) end
        say(ok and ("🚀 đang bay tới " .. tostring(target.Name)) or ("⚠️ " .. tostring(res)), ok==true)
    end)
    stopPlayerFlyBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Move.StopPlayerFly()
        st.Text = S.Move.Status()
        paintGlass()
        if S.Loc and S.Loc.RefreshList then pcall(S.Loc.RefreshList) end
        say("⏹ đã dừng bay tới người", true)
    end)
    applyPlayerSpeedBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local v = tonumber(tostring(speedPlayerBox.Text or ""):match("%-?%d+%.?%d*"))
        if v == nil then v = S.Move.playerFlySpeed or 0 end
        S.Move.SetPlayerFlySpeed(v)
        speedPlayerBox.Text = tostring(S.Move.playerFlySpeed or 0)
        st.Text = S.Move.Status()
        paintGlass()
        local sp = S.Move.GetPlayerFlySpeed and S.Move.GetPlayerFlySpeed() or S.Move.playerFlySpeed or 0
        if (tonumber(S.Move.playerFlySpeed) or 0) == 0 then
            say(string.format("🚀 tốc độ bay tới người: auto (%g = tốc độ game)", sp), true)
        else
            say("🚀 tốc độ bay tới người: " .. tostring(sp), true)
        end
        if S.Loc and S.Loc.RefreshList then pcall(S.Loc.RefreshList) end
        if S.SyncLocPanel then pcall(S.SyncLocPanel) end
    end)
    paintGlass()
    S.Move._glassBtns = { flyPlayer = flyPlayerBtn, stopPlayer = stopPlayerFlyBtn, speedPlayerBox = speedPlayerBox, paint = paintGlass }

    function S.RefreshMovePanel()
        pcall(function()
            st.Text = S.Move.Status()
            flyIn.Text = tostring(S.Move.flySpeed)
            wsIn.Text = (S.Move.speedMode == "x") and ("x" .. tostring(S.Move.speedMul)) or tostring(S.Move.walkSpeed)
            jpIn.Text = tostring(S.Move.jumpPower)
            paintPass()
            if S.Move._glassBtns and S.Move._glassBtns.paint then pcall(S.Move._glassBtns.paint) end
        end)
    end
end


-- ---------- KHUNG ✨ PHÁT SÁNG (trên cùng danh sách thẻ trong 📚 Script Hub) ----------
do
    local PH = 132
    local P = New("Frame", {
        Name = "HubGlow_Panel",
        Size = UDim2.new(1, 0, 0, PH), LayoutOrder = 1,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10))
    Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)

    New("TextLabel", {
        Name = "GlowTitle",
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 4),
        Text = "✨ PHÁT SÁNG (nhân vật của MÌNH)", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    local function act(txt, x, y, w, color, name)
        local b = New("TextButton", {
            Name = name or "GlowBtn",
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
    local function box(x, y, w, val)
        local b = New("TextBox", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = tostring(val), ClearTextOnFocus = false,
            BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
            PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
        }, P)
        Corner(b, UDim.new(0, 6))
        return b
    end

    local onBtn   = act("✨ BẬT", 8, 22, 92, C.GRAY, "GlowOn")
    local thruBtn = act("👁 Xuyên tường: BẬT", 106, 22, 112, C.GREEN, "GlowThru")
    local litBtn  = act("💡 Đèn thật: BẬT", 224, 22, 104, C.GREEN, "GlowLight")

    lab("📏 Rộng", 8, 48, 44)
    local wIn = box(52, 48, 46, 18)
    lab("☀ Sáng", 106, 48, 44)
    local bIn = box(150, 48, 46, 3)
    local colBtn = act("🎨 Đổi màu", 204, 48, 124, C.PURPLE, "GlowColor")

    local applyBtn = act("✔ Áp dụng", 8, 74, 84, C.SURFACE3, "GlowApply")
    local stopBtn  = act("🚫 Tắt", 98, 74, 70, C.RED, "GlowStop")
    local statusLbl = New("TextLabel", {
        Name = "GlowStatus",
        Size = UDim2.new(1, -188, 0, 20), Position = UDim2.new(0, 174, 0, 74),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        TextTruncate = Enum.TextTruncate.AtEnd, ZIndex = 7,
    }, P)

    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 30), Position = UDim2.new(0, 8, 0, 98),
        Text = "💡 📏 Rộng = bán kính toả sáng (1–200) · ☀ Sáng = độ sáng (0–10). "
             .. "👁 Xuyên tường = thấy mình sáng qua tường · 💡 Đèn thật = ánh sáng KHÔNG bị vật cản chặn. "
             .. "Bị game xoá hay respawn thì tự gắn lại; chỉ thêm hiệu ứng, KHÔNG đụng vào di chuyển.",
        TextWrapped = true, BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)

    local function paint()
        onBtn.Text = GL.on and "✨ TẮT" or "✨ BẬT"
        onBtn.BackgroundColor3 = GL.on and C.GREEN or C.GRAY
        onBtn.TextColor3 = D.BestText(onBtn.BackgroundColor3)
        thruBtn.Text = GL.thru and "👁 Xuyên tường: BẬT" or "👁 Xuyên tường: TẮT"
        thruBtn.BackgroundColor3 = GL.thru and C.GREEN or C.SURFACE3
        thruBtn.TextColor3 = D.BestText(thruBtn.BackgroundColor3)
        litBtn.Text = GL.light and "💡 Đèn thật: BẬT" or "💡 Đèn thật: TẮT"
        litBtn.BackgroundColor3 = GL.light and C.GREEN or C.SURFACE3
        litBtn.TextColor3 = D.BestText(litBtn.BackgroundColor3)
        wIn.Text, bIn.Text = tostring(GL.width), tostring(GL.bright)
        colBtn.Text = "🎨 " .. S.Glow.ColorName()
        statusLbl.Text = S.Glow.Status()
    end
    S.SyncGlowPanel = paint                     -- S.RebuildHubList gọi để nhãn luôn đúng
    S.Glow.RefreshPanel = paint

    onBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Glow.Set(not GL.on)
        paint()
        if D.hubStatus then flash(D.hubStatus, S.Glow.Status(), 2, C.ACCENT) end
        pcall(S.Rebuild)   -- đổi chữ thẻ ✨ trong danh sách
    end)
    thruBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Glow.SetThru(not GL.thru)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, GL.thru and "👁 xuyên tường: thấy mình sáng qua vật cản"
                 or "👁 chỉ sáng khi không bị vật cản che", 2, C.ACCENT)
        end
    end)
    litBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Glow.SetLight(not GL.light)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, GL.light and "💡 đèn thật: toả sáng quanh người, không bị vật cản chặn"
                 or "💡 đã tắt đèn (chỉ còn nhuộm sáng nhân vật)", 2, C.ACCENT)
        end
    end)
    colBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local nm = S.Glow.CycleColor()
        paint()
        if D.hubStatus then flash(D.hubStatus, "🎨 màu phát sáng: " .. nm, 1.8, C.ACCENT) end
    end)
    applyBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local w = tonumber(tostring(wIn.Text or ""):match("%-?%d+%.?%d*"))
        local b = tonumber(tostring(bIn.Text or ""):match("%-?%d+%.?%d*"))
        if w then S.Glow.SetWidth(w) end
        if b then S.Glow.SetBright(b) end
        if not GL.on then S.Glow.Set(true) end          -- áp dụng là bật luôn cho khỏi phải bấm 2 lần
        paint()
        if D.hubStatus then flash(D.hubStatus, S.Glow.Status(), 2, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    stopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Glow.Stop()
        paint()
        if D.hubStatus then flash(D.hubStatus, "🚫 " .. S.Glow.Status(), 1.8, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    paint()
end


-- ---------- v4.64: KHUNG 🎥 KHÁN GIẢ ----------
do
    local PH = 108
    local P = New("Frame", {
        Name = "HubFree_Panel",
        Size = UDim2.new(1, 0, 0, PH), LayoutOrder = 2,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10))
    Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)

    New("TextLabel", {
        Name = "FreeTitle",
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 4),
        Text = "🎥 KHÁN GIẢ (camera bay khắp nơi · nhân vật đứng yên)", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    local function act(txt, x, y, w, color, name)
        local b = New("TextButton", {
            Name = name or "FreeBtn",
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = txt, BackgroundColor3 = color, TextColor3 = D.BestText(color),
            Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 8,
        }, P)
        Corner(b, UDim.new(0, 6))
        D.Shade(b, Color3.fromRGB(255, 255, 255), Color3.fromRGB(182, 187, 201), 90)
        D.Tactile(b, 0.08)
        return b
    end

    local onBtn = act("🎥 BẬT", 8, 22, 92, C.GRAY, "FreeOn")
    local stopBtn = act("🚫 Tắt", 106, 22, 70, C.RED, "FreeStop")
    local statusLbl = New("TextLabel", {
        Name = "FreeStatus",
        Size = UDim2.new(1, -192, 0, 20), Position = UDim2.new(0, 182, 0, 22),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        TextTruncate = Enum.TextTruncate.AtEnd, ZIndex = 7,
    }, P)

    New("TextLabel", {
        Size = UDim2.new(0, 36, 0, 20), Position = UDim2.new(0, 8, 0, 46),
        Text = "💨", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 9, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)
    local spdIn = New("TextBox", {
        Size = UDim2.new(0, 52, 0, 20), Position = UDim2.new(0, 36, 0, 46),
        Text = tostring(FR.speed), ClearTextOnFocus = false,
        BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
        PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
        TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
    }, P)
    Corner(spdIn, UDim.new(0, 6))
    local applyBtn = act("✔ Áp dụng", 94, 46, 84, C.SURFACE3, "FreeApply")

    New("TextLabel", {
        Size = UDim2.new(1, -16, 0, 32), Position = UDim2.new(0, 8, 0, 70),
        Text = "WASD + Space/Shift bay camera giống 🚀. Chuột xoay nhìn. Nhân vật đứng yên. Không FireServer. Không cướp bay/nhảy/🛡.",
        TextWrapped = true, BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextXAlignment = Enum.TextXAlignment.Left,
        TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)

    local function paint()
        onBtn.Text = FR.on and "🎥 TẮT" or "🎥 BẬT"
        onBtn.BackgroundColor3 = FR.on and C.GREEN or C.GRAY
        onBtn.TextColor3 = D.BestText(onBtn.BackgroundColor3)
        spdIn.Text = tostring(FR.speed)
        statusLbl.Text = S.Free.Status()
    end
    S.SyncFreePanel = paint
    S.Free.RefreshPanel = paint

    onBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Free.Set(not FR.on)
        paint()
        if D.hubStatus then flash(D.hubStatus, S.Free.Status(), 2, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    stopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        S.Free.Stop()
        paint()
        if D.hubStatus then flash(D.hubStatus, "🚫 " .. S.Free.Status(), 1.8, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    applyBtn.Activated:Connect(function()
        ReleaseHubFocus()
        local n = tonumber(tostring(spdIn.Text or ""):match("%-?%d+%.?%d*"))
        if n then S.Free.SetSpeed(n) end
        if not FR.on then S.Free.Set(true) end
        paint()
        if D.hubStatus then flash(D.hubStatus, S.Free.Status(), 2, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    paint()
end
-- ---------- HẾT KHUNG 🎥 KHÁN GIẢ ----------

-- ---------- KHUNG 🛡 BAY AN TOÀN (trên cùng danh sách thẻ, dưới ⚙ và ✨) ----------
do
    local PH = 200
    local P = New("Frame", {
        Name = "HubSafe_Panel",
        Size = UDim2.new(1, 0, 0, PH), LayoutOrder = 2,
        BackgroundColor3 = C.SURFACE, BackgroundTransparency = 0.12, BorderSizePixel = 0, ZIndex = 6,
    }, D.hubList)
    Corner(P, UDim.new(0, 10))
    Stroke(P, C.HAIRLINE, 1)
    D.Shade(P, Color3.fromRGB(255, 255, 255), Color3.fromRGB(188, 192, 205), 90)

    New("TextLabel", {
        Name = "SafeTitle",
        Size = UDim2.new(1, -16, 0, 14), Position = UDim2.new(0, 8, 0, 4),
        Text = "🛡 BAY AN TOÀN (tự bay + né vật có dấu hiệu chuyển động)", BackgroundTransparency = 1,
        TextColor3 = C.ACCENT, Font = Enum.Font.GothamBold, TextSize = 10,
        TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 7,
    }, P)

    local function act(txt, x, y, w, color, name)
        local b = New("TextButton", {
            Name = name or "SafeBtn",
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
    local function box(x, y, w, val)
        local b = New("TextBox", {
            Size = UDim2.new(0, w, 0, 20), Position = UDim2.new(0, x, 0, y),
            Text = tostring(val), ClearTextOnFocus = false,
            BackgroundColor3 = C.SURFACE2, BackgroundTransparency = 0.1, TextColor3 = C.DARK,
            PlaceholderColor3 = C.GRAY, Font = Enum.Font.GothamMedium, TextSize = 9,
            TextXAlignment = Enum.TextXAlignment.Center, BorderSizePixel = 0, ZIndex = 7,
        }, P)
        Corner(b, UDim.new(0, 6))
        return b
    end

    local onBtn = act("🛡 BẬT", 8, 22, 92, C.GRAY, "SafeOn")
    lab("📏 Né", 104, 22, 30)
    local radIn = box(132, 22, 44, 25)
    lab("💨 Bay", 180, 22, 36)
    local spdIn = box(216, 22, 44, 60)
    lab("🌀 Gắt", 264, 22, 32)
    local strIn = box(296, 22, 38, 4)

    local autoBtn  = act("➡ Tự bay: BẬT", 8, 48, 96, C.GREEN, "SafeAuto")
    local shBtn    = act("🔲 Khiên: BẬT", 108, 48, 82, C.GREEN, "SafeShield")
    local plBtn    = act("👤 Né người: BẬT", 194, 48, 92, C.GREEN, "SafePlayers")
    local ncBtn    = act("🧱 Xuyên: BẬT", 290, 48, 44, C.GREEN, "SafeNoclip")

    local ciBtn    = act("⭕ Vòng tròn: BẬT", 8, 74, 104, C.GREEN, "SafeCircle")
    lab("⭕ Bán kính", 116, 74, 48)
    local cirIn    = box(166, 74, 40, 20)
    lab("👁 Nhìn trước", 210, 74, 54)
    local lookIn   = box(266, 74, 34, 1)
    lab("giây", 302, 74, 30)

    local applyBtn = act("✔ Áp dụng", 8, 100, 84, C.SURFACE3, "SafeApply")
    local stopBtn  = act("🚫 Tắt", 98, 100, 50, C.RED, "SafeStop")
    lab("🔲 Cỡ", 154, 100, 32)
    local szIn = box(188, 100, 34, 0)
    lab("(0 = tự)", 224, 100, 40)
    local hudBtn = act("📱 Nút ảo: BẬT", 268, 100, 86, C.GREEN, "SafeHud")
    local statusLbl = New("TextLabel", {
        Name = "SafeStatus",
        Size = UDim2.new(1, -16, 0, 20), Position = UDim2.new(0, 8, 0, 124),
        Text = "", BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextWrapped = true,
        TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)
    New("TextLabel", {
        Name = "SafeNote",
        Size = UDim2.new(1, -16, 0, 48), Position = UDim2.new(0, 8, 0, 148),
        Text = "💡 🔲 Khiên = bức tường trong suốt hình vuông ÔM QUANH nhân vật (cỡ hợp lí; muốn to/nhỏ "
             .. "thì chỉnh ô 🔲 Cỡ — 0 = tự động. 📏 Né chỉ là khoảng cách né, không kéo giãn khiên) · "
             .. "👤 Né người = coi NGƯỜI CHƠI khác là mối nguy dù họ đứng yên · 🧱 Xuyên = tự bật Xuyên "
             .. "Tường để lực đẩy đưa bạn QUA vật cản, tắt 🛡 là trả lại như cũ. ⭕ Vòng tròn = khi KHÔNG "
             .. "có ai/vật nào đang lao tới mình thì tự bay vòng tròn quanh chỗ đang đứng (bán kính "
             .. "chỉnh ở ô ⭕), đang né hoặc đang bấm WASD/joystick ảo thì TẠM DỪNG, né xong tự bay vòng lại. "
             .. "👁 Nhìn trước = quét xa 📏 × 1,6 và bắt vật ĐANG LAO TỚI từ ngoài tầm. 📱 Nút ảo = joystick "
             .. "kéo + ⬆⬇ giữ để lên/xuống, hiện khi 🛡 BẬT. 🛡 tự sống qua respawn / hết trận sang trận mới.",

        BackgroundTransparency = 1, TextColor3 = C.MUTED,
        Font = Enum.Font.GothamMedium, TextSize = 8, TextWrapped = true,
        TextXAlignment = Enum.TextXAlignment.Left, TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 7,
    }, P)

    local function paint()
        onBtn.Text = MV.Safe.on and "🛡 TẮT" or "🛡 BẬT"
        onBtn.BackgroundColor3 = MV.Safe.on and C.GREEN or C.GRAY
        onBtn.TextColor3 = D.BestText(onBtn.BackgroundColor3)
        autoBtn.Text = MV.Safe.auto and "➡ Tự bay: BẬT" or "➡ Tự bay: TẮT"
        autoBtn.BackgroundColor3 = MV.Safe.auto and C.GREEN or C.SURFACE3
        autoBtn.TextColor3 = D.BestText(autoBtn.BackgroundColor3)
        shBtn.Text = MV.Safe.shield and "🔲 Khiên: BẬT" or "🔲 Khiên: TẮT"
        shBtn.BackgroundColor3 = MV.Safe.shield and C.GREEN or C.SURFACE3
        shBtn.TextColor3 = D.BestText(shBtn.BackgroundColor3)
        plBtn.Text = MV.Safe.avoidPlayers and "👤 Né người: BẬT" or "👤 Né người: TẮT"
        plBtn.BackgroundColor3 = MV.Safe.avoidPlayers and C.GREEN or C.SURFACE3
        plBtn.TextColor3 = D.BestText(plBtn.BackgroundColor3)
        ncBtn.Text = MV.Safe.noclip and "🧱 Xuyên: BẬT" or "🧱 Xuyên: TẮT"
        ncBtn.BackgroundColor3 = MV.Safe.noclip and C.GREEN or C.SURFACE3
        ncBtn.TextColor3 = D.BestText(ncBtn.BackgroundColor3)
        ciBtn.Text = MV.Safe.circle and "⭕ Vòng tròn: BẬT" or "⭕ Vòng tròn: TẮT"
        ciBtn.BackgroundColor3 = MV.Safe.circle and C.GREEN or C.SURFACE3
        ciBtn.TextColor3 = D.BestText(ciBtn.BackgroundColor3)
        hudBtn.Text = MV.Safe.showHud and "📱 Nút ảo: BẬT" or "📱 Nút ảo: TẮT"
        hudBtn.BackgroundColor3 = MV.Safe.showHud and C.GREEN or C.SURFACE3
        hudBtn.TextColor3 = D.BestText(hudBtn.BackgroundColor3)
        radIn.Text, spdIn.Text, strIn.Text =
            tostring(MV.Safe.radius), tostring(MV.Safe.speed), tostring(MV.Safe.steer)
        cirIn.Text, lookIn.Text = tostring(MV.Safe.circleR), tostring(MV.Safe.lookTime)
        szIn.Text = tostring(MV.Safe.shieldSize)
        statusLbl.Text = MV.Safe.Status()
        statusLbl.TextColor3 = ((MV.Safe.threats or 0) > 0) and C.YELLOW or C.MUTED
    end
    S.SyncSafePanel = paint
    MV.Safe.RefreshPanel = paint

    onBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.Set(not MV.Safe.on)
        paint()
        if D.hubStatus then flash(D.hubStatus, MV.Safe.Status(), 2.2, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    autoBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.SetAuto(not MV.Safe.auto)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, MV.Safe.auto and "➡ tự bay: không bấm gì vẫn bay theo hướng camera"
                 or "➡ tự bay TẮT: chỉ bay khi bấm WASD (nhưng vẫn tự né)", 2, C.ACCENT)
        end
    end)
    shBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.SetShield(not MV.Safe.shield)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, MV.Safe.shield and ("🔲 khiên trong suốt hình vuông: BẬT · "
                 .. string.format("%g m/cạnh%s", MV.Safe.ShieldHalf() * 2,
                      (tonumber(MV.Safe.shieldSize) or 0) > 0 and " (chỉnh tay)" or " (tự động)"))
                 or "🔲 đã ẩn khiên (vẫn né y như cũ)", 2, C.ACCENT)
        end
    end)
    plBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.SetAvoidPlayers(not MV.Safe.avoidPlayers)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, MV.Safe.avoidPlayers and "👤 coi NGƯỜI CHƠI khác là mối nguy (né dù họ đứng yên)"
                 or "👤 đã bỏ qua người chơi (chỉ né vật chuyển động)", 2, C.ACCENT)
        end
    end)
    ncBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.SetNoclipAuto(not MV.Safe.noclip)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, MV.Safe.noclip and "🧱 lực đẩy đưa bạn XUYÊN QUA vật cản (Xuyên Tường tự bật)"
                 or "🧱 đã trả Xuyên Tường về như trước", 2, C.ACCENT)
        end
    end)
    ciBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.SetCircle(not MV.Safe.circle)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, MV.Safe.circle and ("⭕ không có gì lao tới mình -> tự bay VÒNG TRÒN bán kính " .. tostring(math.floor(MV.Safe.circleR + 0.5)) .. "m")
                 or "⭕ đã tắt bay vòng tròn (chỉ bay theo hướng đang nhìn)", 2, C.ACCENT)
        end
    end)
    applyBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.SetRadius(tonumber(tostring(radIn.Text or ""):match("%-?%d+%.?%d*")) or MV.Safe.radius)
        MV.Safe.SetSpeed(tonumber(tostring(spdIn.Text or ""):match("%-?%d+%.?%d*")) or MV.Safe.speed)
        MV.Safe.SetSteer(tonumber(tostring(strIn.Text or ""):match("%-?%d+%.?%d*")) or MV.Safe.steer)
        MV.Safe.SetCircleR(tonumber(tostring(cirIn.Text or ""):match("%-?%d+%.?%d*")) or MV.Safe.circleR)
        MV.Safe.SetLook(tonumber(tostring(lookIn.Text or ""):match("%-?%d+%.?%d*")) or MV.Safe.lookTime)
        MV.Safe.SetShieldSize(tonumber(tostring(szIn.Text or ""):match("%-?%d+%.?%d*")) or MV.Safe.shieldSize)
        if not MV.Safe.on then MV.Safe.Set(true) end      -- áp dụng là bật luôn
        paint()
        if D.hubStatus then flash(D.hubStatus, MV.Safe.Status(), 2.4, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    stopBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.Stop()
        paint()
        if D.hubStatus then flash(D.hubStatus, "🚫 " .. MV.Safe.Status(), 1.8, C.ACCENT) end
        pcall(S.Rebuild)
    end)
    hudBtn.Activated:Connect(function()
        ReleaseHubFocus()
        MV.Safe.SetShowHud(not MV.Safe.showHud)
        paint()
        if D.hubStatus then
            flash(D.hubStatus, MV.Safe.showHud and "📱 nút ảo 🛡: BẬT — hiện joystick + ⬆⬇ khi 🛡 đang bật"
                 or "📱 nút ảo 🛡: TẮT — đã ẩn cụm nút nổi", 1.8, C.ACCENT)
        end
    end)
    paint()
end


D.hubChipBtns = {}
for _, cname in ipairs({"Tất cả", "Admin", "Explorer", "Spy", "Tiện ích", "Server", "Di chuyển", "Định vị"}) do
    local w = (cname == "Tất cả" and 58) or (cname == "Explorer" and 68) or (cname == "Tiện ích" and 64)
              or (cname == "Server" and 56) or (cname == "Admin" and 52) or (cname == "Di chuyển" and 66) or (cname == "Định vị" and 58) or 44
    local chip = New("TextButton", {
        Size = UDim2.new(0, w, 0, 20), Text = cname,
        BackgroundColor3 = (S.hubCat == cname) and C.ACCENT or C.SURFACE2,
        BackgroundTransparency = (S.hubCat == cname) and 0.08 or 1,
        TextColor3 = (S.hubCat == cname) and C.INK or C.MUTED,
        Font = Enum.Font.GothamBold, TextSize = 9, BorderSizePixel = 0, ZIndex = 7,
    }, D.hubChips)
    Corner(chip, UDim.new(1, 0))
    Stroke(chip, (S.hubCat == cname) and C.ACCENT2 or C.BORDER, 1)
    chip.Activated:Connect(function()
        S.hubCat = cname
        for nm, cb in pairs(D.hubChipBtns) do
            local on = (nm == cname)
            cb.BackgroundColor3 = on and C.ACCENT or C.SURFACE2
            cb.BackgroundTransparency = on and 0.08 or 1
            cb.TextColor3 = on and C.INK or C.MUTED
            local st = cb:FindFirstChildOfClass("UIStroke")
            if st then st.Color = on and C.ACCENT2 or C.BORDER end
        end
        S.RebuildHubList()
    end)
    D.hubChipBtns[cname] = chip
end

trackConn(D.hubSearchBox:GetPropertyChangedSignal("Text"):Connect(function()
    S.hubSearch = D.hubSearchBox.Text          -- ghi nhận ngay (rẻ) để chip/lọc khác đọc đúng
    delaySearch(S.RebuildHubList)   -- nhưng chỉ DỰNG lại thẻ 1 lần sau phím cuối
end))
S.RebuildHubList()

pcall(D.SyncPageChips)
S.SyncServerPanel()   -- v4.6.3: hiện mã server (JobId) lên khung 🌐 SERVER

-- END ORIGINAL_SCRIPT_HUB_UI

    end)
    snapshotInstalled()
    if not ok then view.Destroy(); error("Script Hub GUI: " .. tostring(err)) end
    trackConn(hubRoot.Destroying:Connect(function() view.Destroy(true) end))
    trackConn(gui.Destroying:Connect(function() view.Destroy(true) end))
    view.Refresh = function() if not view.dead and type(S.RebuildHubList) == "function" then S.RebuildHubList() end end
    return view
end
-- END SCRIPT_HUB_FACTORY

local api = rawget(_G, "BananaCatHubAPI")
local getBridge = type(api) == "table" and api.ScriptHubBridge or nil
local bridge = type(getBridge) == "function" and getBridge(api) or getBridge
assert(type(bridge) == "table" and bridge.protocol == 1 and bridge.alive(),
    "Hãy mở bản script.js cập nhật trước; module này dùng các controller gốc của hub")
local old = rawget(_G, "TDZScriptHubStandalone")
if type(old) == "table" and type(old.Destroy) == "function" then pcall(old.Destroy) end
local view = CreateScriptHub(bridge)
_G.TDZScriptHubStandalone = view
return view
