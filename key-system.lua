--[[
    taodepzai · KEY SYSTEM
    - Nhập key có chứa "Free_v2__" -> xác nhận thành công.
    - Thành công: ẩn (xoá) giao diện nhập key rồi chạy script chính.
    - Key sai / tải lỗi: báo lỗi ngay trên giao diện, cho nhập lại.

    Dùng trong executor:
        loadstring(game:HttpGet("<link tới file key-system.lua này>"))()

    Test: python3 tests/key_system_test.py
    LƯU Ý: kiểm tra key nằm ở phía người chơi, ai đọc mã nguồn cũng có thể
    bỏ qua. Đây chỉ là "cổng" đơn giản, không phải bảo mật thật.
]]

local CAU_HINH = {
    KEY_CAN_CO   = "Free_v2__", -- key chỉ cần CHỨA chuỗi này (phân biệt hoa/thường)
    SCRIPT_URL   = "https://mncuadaigmailcom.github.io/aiaiaitao2/script.js",
    LINK_LAY_KEY = "https://mncuadaigmailcom.github.io/taodepzai/", -- để "" nếu muốn ẩn nút
    TIEU_DE      = "taodepzai · Key System",
    TEN_GUI      = "Taodepzai_KeySystem",
}

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer

-- ================= Kiểm tra key =================
local function LamSachKey(key)
    if type(key) ~= "string" then return "" end
    key = key:gsub("^%s+", "")
    key = key:gsub("%s+$", "")
    return key
end

local function KiemTraKey(key)
    key = LamSachKey(key)
    if key == "" then
        return false, "Bạn chưa nhập key!"
    end
    -- find(..., 1, true): tìm chuỗi thường, không coi "_" hay "%" là pattern
    if string.find(key, CAU_HINH.KEY_CAN_CO, 1, true) then
        return true
    end
    return false, "Key sai! Key phải chứa \"" .. CAU_HINH.KEY_CAN_CO .. "\""
end

-- ================= Chọn nơi đặt GUI =================
local parentGui
pcall(function()
    if gethui then parentGui = gethui() end
end)
if not parentGui then
    pcall(function() parentGui = game:GetService("CoreGui") end)
end
if not parentGui then
    parentGui = player:WaitForChild("PlayerGui")
end

-- Chạy lại script -> xoá bảng key cũ để không bị chồng 2 bảng
for _, noi in ipairs({ parentGui, player:FindFirstChild("PlayerGui") }) do
    pcall(function()
        local cu = noi:FindFirstChild(CAU_HINH.TEN_GUI)
        if cu then cu:Destroy() end
    end)
end

-- ================= Giao diện =================
local MAU = {
    NEN     = Color3.fromRGB(11, 12, 17),
    O       = Color3.fromRGB(20, 22, 30),
    VIEN    = Color3.fromRGB(60, 66, 84),
    CHU     = Color3.fromRGB(238, 241, 248),
    PHU     = Color3.fromRGB(154, 162, 180),
    VANG    = Color3.fromRGB(240, 201, 122),
    DAM     = Color3.fromRGB(12, 10, 6),
    XANH    = Color3.fromRGB(64, 214, 152),
    DO      = Color3.fromRGB(230, 88, 88),
}

local function New(cls, props, parent)
    local obj = Instance.new(cls)
    for k, v in pairs(props or {}) do
        obj[k] = v
    end
    if parent then obj.Parent = parent end
    return obj
end

local function Bo(obj, r)
    return New("UICorner", { CornerRadius = UDim.new(0, r or 10) }, obj)
end

local function Vien(obj, mau)
    return New("UIStroke", {
        Color = mau or MAU.VIEN, Thickness = 1, Transparency = 0.15,
        ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
    }, obj)
end

local gui = New("ScreenGui", {
    Name = CAU_HINH.TEN_GUI,
    ResetOnSpawn = false,
    IgnoreGuiInset = true,
    DisplayOrder = 999,
    ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
})
pcall(function()
    if syn and syn.protect_gui then syn.protect_gui(gui) end
end)

local khung = New("Frame", {
    Name = "Khung",
    AnchorPoint = Vector2.new(0.5, 0.5),
    Position = UDim2.new(0.5, 0, 0.5, 0),
    Size = UDim2.new(0, 340, 0, 212),
    BackgroundColor3 = MAU.NEN,
    BorderSizePixel = 0,
    Active = true,
    Draggable = true,
}, gui)
Bo(khung, 14)
Vien(khung, MAU.VANG)

New("TextLabel", {
    Name = "TieuDe",
    BackgroundTransparency = 1,
    Position = UDim2.new(0, 16, 0, 12),
    Size = UDim2.new(1, -60, 0, 24),
    Font = Enum.Font.GothamBold,
    Text = CAU_HINH.TIEU_DE,
    TextColor3 = MAU.VANG,
    TextSize = 17,
    TextXAlignment = Enum.TextXAlignment.Left,
}, khung)

New("TextLabel", {
    Name = "MoTa",
    BackgroundTransparency = 1,
    Position = UDim2.new(0, 16, 0, 36),
    Size = UDim2.new(1, -32, 0, 18),
    Font = Enum.Font.Gotham,
    Text = "Nhập key để sử dụng script",
    TextColor3 = MAU.PHU,
    TextSize = 13,
    TextXAlignment = Enum.TextXAlignment.Left,
}, khung)

local nutDong = New("TextButton", {
    Name = "NutDong",
    AnchorPoint = Vector2.new(1, 0),
    Position = UDim2.new(1, -10, 0, 10),
    Size = UDim2.new(0, 28, 0, 28),
    BackgroundColor3 = MAU.O,
    BorderSizePixel = 0,
    Font = Enum.Font.GothamBold,
    Text = "X",
    TextColor3 = MAU.PHU,
    TextSize = 14,
    AutoButtonColor = true,
}, khung)
Bo(nutDong, 8)

local oKey = New("TextBox", {
    Name = "OKey",
    Position = UDim2.new(0, 16, 0, 66),
    Size = UDim2.new(1, -32, 0, 40),
    BackgroundColor3 = MAU.O,
    BorderSizePixel = 0,
    ClearTextOnFocus = false,
    Font = Enum.Font.Gotham,
    PlaceholderText = "Dán key Free_v2__... vào đây",
    PlaceholderColor3 = MAU.PHU,
    Text = "",
    TextColor3 = MAU.CHU,
    TextSize = 14,
    TextTruncate = Enum.TextTruncate.AtEnd,
}, khung)
Bo(oKey, 8)
Vien(oKey)

local coNutLayKey = type(CAU_HINH.LINK_LAY_KEY) == "string" and CAU_HINH.LINK_LAY_KEY ~= ""

local nutXacNhan = New("TextButton", {
    Name = "NutXacNhan",
    Position = UDim2.new(0, 16, 0, 116),
    Size = coNutLayKey and UDim2.new(0.5, -21, 0, 38) or UDim2.new(1, -32, 0, 38),
    BackgroundColor3 = MAU.VANG,
    BorderSizePixel = 0,
    Font = Enum.Font.GothamBold,
    Text = "Xác nhận key",
    TextColor3 = MAU.DAM,
    TextSize = 14,
    AutoButtonColor = true,
}, khung)
Bo(nutXacNhan, 8)

local nutLayKey
if coNutLayKey then
    nutLayKey = New("TextButton", {
        Name = "NutLayKey",
        AnchorPoint = Vector2.new(1, 0),
        Position = UDim2.new(1, -16, 0, 116),
        Size = UDim2.new(0.5, -21, 0, 38),
        BackgroundColor3 = MAU.O,
        BorderSizePixel = 0,
        Font = Enum.Font.GothamBold,
        Text = "Lấy key",
        TextColor3 = MAU.CHU,
        TextSize = 14,
        AutoButtonColor = true,
    }, khung)
    Bo(nutLayKey, 8)
    Vien(nutLayKey)
end

local trangThai = New("TextLabel", {
    Name = "TrangThai",
    BackgroundTransparency = 1,
    Position = UDim2.new(0, 16, 0, 162),
    Size = UDim2.new(1, -32, 0, 38),
    Font = Enum.Font.Gotham,
    Text = "",
    TextColor3 = MAU.PHU,
    TextSize = 13,
    TextWrapped = true,
    TextXAlignment = Enum.TextXAlignment.Left,
    TextYAlignment = Enum.TextYAlignment.Top,
}, khung)

gui.Parent = parentGui

-- ================= Logic =================
local function BaoTrangThai(text, mau)
    trangThai.Text = text
    trangThai.TextColor3 = mau or MAU.PHU
end

local function RungKhung()
    pcall(function()
        local goc = khung.Position
        local info = TweenInfo.new(0.05, Enum.EasingStyle.Linear, Enum.EasingDirection.InOut, 3, true)
        local tw = TweenService:Create(khung, info, { Position = goc + UDim2.new(0, 8, 0, 0) })
        tw.Completed:Connect(function() khung.Position = goc end)
        tw:Play()
    end)
end

local function ThongBao(tieuDe, noiDung)
    pcall(function()
        game:GetService("StarterGui"):SetCore("SendNotification", {
            Title = tieuDe, Text = noiDung, Duration = 6,
        })
    end)
end

local dangXuLy = false -- chặn bấm 2 lần -> chạy script 2 lần

local function DatNut(batDuoc, text)
    nutXacNhan.Active = batDuoc
    nutXacNhan.AutoButtonColor = batDuoc
    nutXacNhan.Text = text
    oKey.TextEditable = batDuoc
end

local function ThatBai(loi)
    dangXuLy = false
    DatNut(true, "Xác nhận key")
    BaoTrangThai("✖ " .. tostring(loi), MAU.DO)
    RungKhung()
end

local function ChayScriptChinh()
    -- 1) Tải script (lỗi mạng -> giữ bảng key để thử lại)
    local okTai, nguon = pcall(function()
        return game:HttpGet(CAU_HINH.SCRIPT_URL)
    end)
    if not okTai then
        return ThatBai("Không tải được script: " .. tostring(nguon))
    end
    if type(nguon) ~= "string" or nguon:gsub("%s", "") == "" then
        return ThatBai("Script tải về bị rỗng, hãy thử lại.")
    end

    -- 2) Biên dịch
    if type(loadstring) ~= "function" then
        return ThatBai("Executor không hỗ trợ loadstring.")
    end
    local ham, loiBienDich = loadstring(nguon)
    if type(ham) ~= "function" then
        return ThatBai("Script bị lỗi cú pháp: " .. tostring(loiBienDich))
    end

    -- 3) Mọi thứ OK -> ẩn hệ thống key rồi chạy script chính
    pcall(function() gui:Destroy() end)
    local okChay, loiChay = pcall(ham)
    if not okChay then
        warn("[taodepzai] Lỗi khi chạy script: " .. tostring(loiChay))
        ThongBao("taodepzai", "Script gặp lỗi khi chạy (xem F9).")
    end
end

local function XacNhan()
    if dangXuLy then return end
    local ok, loi = KiemTraKey(oKey.Text)
    if not ok then
        return ThatBai(loi)
    end
    dangXuLy = true
    DatNut(false, "Đang tải...")
    BaoTrangThai("✔ Key hợp lệ! Đang tải script...", MAU.XANH)
    task.spawn(ChayScriptChinh)
end

nutXacNhan.MouseButton1Click:Connect(XacNhan)

oKey.FocusLost:Connect(function(nhanEnter)
    if nhanEnter then XacNhan() end
end)

if nutLayKey then
    nutLayKey.MouseButton1Click:Connect(function()
        local daChep = pcall(function()
            local chep = setclipboard or toclipboard or (Clipboard and Clipboard.set)
            chep(CAU_HINH.LINK_LAY_KEY)
        end)
        if daChep then
            BaoTrangThai("Đã sao chép link lấy key, dán vào trình duyệt.", MAU.VANG)
        else
            BaoTrangThai("Link lấy key: " .. CAU_HINH.LINK_LAY_KEY, MAU.VANG)
        end
    end)
end

nutDong.MouseButton1Click:Connect(function()
    if dangXuLy then return end
    gui:Destroy()
end)
