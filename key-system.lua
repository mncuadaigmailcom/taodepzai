--[[
    taodepzai · KEY SYSTEM (v2)
    Key Free_v3_... do trang https://mncuadaigmailcom.github.io/taodepzai/ tạo ra gồm
    vòng quay 3 số + ngày/tháng + giây/mili-giây + [tên người chơi, nhiệm vụ cuối, thời điểm]
    + mã kiểm tra 32 bit, được xáo bằng dòng khoá sinh từ (số quay, ngày, tháng, giây,
    mili-giây) và trộn thêm từng byte của tên.
    Script này giải mã key (cùng thuật toán với taoMaDemo trong index.html) rồi kiểm tra:
      0. Mã kiểm tra khớp -> key không bị sửa / tự bịa.
      1. Tên trong key phải trùng tên tài khoản Roblox (hoặc tên hiển thị) của bạn
         -> key của người khác không dùng được.
      2. Key chỉ có hạn 24 giờ kể từ lúc hoàn thành nhiệm vụ cuối cùng
         (giờ lấy theo máy chủ Roblox nếu có, chỉnh đồng hồ máy không gia hạn được).
    Đúng hết -> ẩn (xoá) bảng nhập key rồi chạy script chính.
      3. Key đúng được lưu vào file (writefile) theo từng tài khoản; lần sau mở script
         key tự điền sẵn vào ô nhập. Hết 24 giờ key tự bị xoá (khi mở lại script,
         hoặc ngay lúc hết hạn nếu game vẫn đang chạy).

    Test: python3 tests/key_system_test.py
    LƯU Ý: thuật toán tạo key là công khai, người biết đọc code vẫn có thể tự tạo key
    cho tên của chính họ. Chặn được việc dùng lại key của người khác / key cũ,
    nhưng không phải bảo mật tuyệt đối (muốn vậy cần máy chủ cấp key có chữ ký).
]]

local CAU_HINH = {
    KEY_PREFIX         = "Free_v3_",      -- vòng quay 3 số + ngày/tháng + giây/mili-giây + tên
    CHAP_NHAN_KEY_V2   = true,            -- nhận cả key Free_v2_ (trang web bản cũ đang chạy);
                                          -- đặt false sau khi trang web đã lên bản Free_v3_
    HAN_KEY_GIAY       = 24 * 60 * 60,    -- key có hạn 1 ngày
    LECH_GIO_CHO_PHEP  = 5 * 60,          -- cho phép giờ máy lệch tối đa 5 phút
    KIEM_TRA_TEN       = true,            -- false = không bắt trùng tên
    CHAP_NHAN_TEN_HIEN_THI = true,        -- chấp nhận cả DisplayName, không chỉ username
    LUU_KEY            = true,            -- lưu key đúng, tự điền lại, hết hạn tự xoá
    TEN_FILE_KEY       = "taodepzai_key_", -- + UserId + ".txt" (mỗi tài khoản một file)
    SCRIPT_URL   = "https://mncuadaigmailcom.github.io/aiaiaitao2/script.js",
    LINK_LAY_KEY = "https://mncuadaigmailcom.github.io/taodepzai/", -- để "" nếu muốn ẩn nút
    TIEU_DE      = "taodepzai · Key System",
    TEN_GUI      = "Taodepzai_KeySystem",
}

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer

-- ================= Tiện ích =================
local function Trim(s)
    s = s:gsub("^%s+", "")
    s = s:gsub("%s+$", "")
    return s
end

local function Xor8(a, b)
    if bit32 and bit32.bxor then return bit32.bxor(a, b) end
    local kq, gia = 0, 1
    for _ = 1, 8 do
        if a % 2 ~= b % 2 then kq = kq + gia end
        a = math.floor(a / 2)
        b = math.floor(b / 2)
        gia = gia * 2
    end
    return kq
end

local B64_GIA_TRI = {}
do
    local bang = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    for i = 1, #bang do B64_GIA_TRI[bang:sub(i, i)] = i - 1 end
end

-- base64url (không có dấu "=") -> mảng byte; nil nếu sai định dạng
local function GiaiBase64Url(s)
    if #s % 4 == 1 then return nil end
    local bytes, dem, soBit = {}, 0, 0
    for i = 1, #s do
        local v = B64_GIA_TRI[s:sub(i, i)]
        if not v then return nil end
        dem = dem * 64 + v
        soBit = soBit + 6
        if soBit >= 8 then
            soBit = soBit - 8
            local chia = 2 ^ soBit
            local byte = math.floor(dem / chia)
            dem = dem - byte * chia
            bytes[#bytes + 1] = byte
        end
    end
    if dem ~= 0 then return nil end -- bit thừa khác 0: key đã bị sửa
    return bytes
end

local function Utf8HopLe(s)
    local i, n = 1, #s
    while i <= n do
        local c = s:byte(i)
        local so, min
        if c < 0x80 then so, min = 0, 0
        elseif c >= 0xC2 and c <= 0xDF then so, min = 1, 0x80
        elseif c >= 0xE0 and c <= 0xEF then so, min = 2, 0x800
        elseif c >= 0xF0 and c <= 0xF4 then so, min = 3, 0x10000
        else return false end
        local cp = c % (2 ^ (6 - so + (so == 0 and 1 or 0)))
        for k = 1, so do
            local d = s:byte(i + k)
            if not d or d < 0x80 or d > 0xBF then return false end
            cp = cp * 64 + (d - 0x80)
        end
        if cp < min or cp > 0x10FFFF or (cp >= 0xD800 and cp <= 0xDFFF) then return false end
        i = i + so + 1
    end
    return true
end

-- Độ dài theo cách JavaScript đếm (UTF-16), để khớp giới hạn 32 ký tự của trang web
local function DoDaiJs(s)
    local n = 0
    for i = 1, #s do
        local c = s:byte(i)
        if c < 0x80 or c >= 0xC0 then n = n + 1 end -- đầu mỗi ký tự
        if c >= 0xF0 then n = n + 1 end             -- ký tự ngoài BMP (emoji) = 2 đơn vị
    end
    return n
end

local function Utf8Char(cp)
    if cp < 0x80 then return string.char(cp) end
    if cp < 0x800 then
        return string.char(0xC0 + math.floor(cp / 64), 0x80 + cp % 64)
    end
    if cp < 0x10000 then
        return string.char(0xE0 + math.floor(cp / 4096), 0x80 + math.floor(cp / 64) % 64, 0x80 + cp % 64)
    end
    return string.char(0xF0 + math.floor(cp / 262144), 0x80 + math.floor(cp / 4096) % 64,
        0x80 + math.floor(cp / 64) % 64, 0x80 + cp % 64)
end

-- Đọc đúng dạng JSON.stringify([ten, nhiemVu, thoiDiem]) mà trang web tạo
local THOAT_JSON = { ['"'] = '"', ['\\'] = '\\', ['/'] = '/', b = '\b', f = '\f', n = '\n', r = '\r', t = '\t' }
local function DocMangJson(s)
    local i = 1
    local function BoTrang() i = s:find("[^ \t\r\n]", i) or (#s + 1) end
    local function Can(kyTu)
        BoTrang()
        if s:sub(i, i) ~= kyTu then return false end
        i = i + 1
        return true
    end
    local function DocChuoi()
        if not Can('"') then return nil end
        local phan = {}
        while true do
            local c = s:sub(i, i)
            if c == "" then return nil end
            if c == '"' then i = i + 1; return table.concat(phan) end
            if c == "\\" then
                local e = s:sub(i + 1, i + 1)
                if THOAT_JSON[e] then
                    phan[#phan + 1] = THOAT_JSON[e]
                    i = i + 2
                elseif e == "u" then
                    local hex = s:match("^u(%x%x%x%x)", i + 1)
                    if not hex then return nil end
                    local cp = tonumber(hex, 16)
                    i = i + 6
                    if cp >= 0xD800 and cp <= 0xDBFF then
                        local hex2 = s:match("^\\u(%x%x%x%x)", i)
                        local thap = hex2 and tonumber(hex2, 16)
                        if not thap or thap < 0xDC00 or thap > 0xDFFF then return nil end
                        cp = 0x10000 + (cp - 0xD800) * 0x400 + (thap - 0xDC00)
                        i = i + 6
                    elseif cp >= 0xDC00 and cp <= 0xDFFF then
                        return nil
                    end
                    phan[#phan + 1] = Utf8Char(cp)
                else
                    return nil
                end
            elseif c:byte() < 32 then
                return nil
            else
                phan[#phan + 1] = c
                i = i + 1
            end
        end
    end
    if not Can("[") then return nil end
    local ten = DocChuoi()
    if not ten or not Can(",") then return nil end
    local nhiemVu = DocChuoi()
    if not nhiemVu or not Can(",") then return nil end
    BoTrang()
    local so = s:match("^%d+", i)
    if not so then return nil end
    i = i + #so
    if not Can("]") then return nil end
    BoTrang()
    if i <= #s then return nil end
    return ten, nhiemVu, tonumber(so)
end

-- ================= Giải mã key =================
-- Kiểm tra phần [tên, nhiệm vụ, thời điểm ms] chung cho v2 và v3
local function KiemTraNoiDung(json)
    if not Utf8HopLe(json) then return nil end
    local ten, nhiemVu, thoiDiemMs = DocMangJson(json)
    if not ten or ten == "" or ten ~= Trim(ten) or DoDaiJs(ten) > 32 then return nil end
    if not (nhiemVu == "nv1" or nhiemVu == "nv2" or nhiemVu == "nv3" or nhiemVu == "nv4") then return nil end
    if not thoiDiemMs or thoiDiemMs <= 0 or thoiDiemMs > 8.64e15 then return nil end
    return ten, nhiemVu, thoiDiemMs
end

local function ByteSangChuoi(dsByte, tu, den)
    local kyTu = {}
    for i = tu, den do kyTu[#kyTu + 1] = string.char(dsByte[i]) end
    return table.concat(kyTu)
end

-- v2 (cũ): XOR theo vị trí, không có mã kiểm tra
local function GiaiMaV2(noiDung)
    local bytes = GiaiBase64Url(noiDung)
    if not bytes then return nil end
    for viTri = 0, #bytes - 1 do
        bytes[viTri + 1] = Xor8(bytes[viTri + 1], (viTri * 73 + 0xA5) % 256)
    end
    local ten, nhiemVu, thoiDiemMs = KiemTraNoiDung(ByteSangChuoi(bytes, 1, #bytes))
    if not ten then return nil end
    return { ten = ten, nhiemVu = nhiemVu, thoiDiem = math.floor(thoiDiemMs / 1000), phienBan = 2 }
end

-- v3: phải khớp BI_MAT_V3 / bamV3 / taoMaDemo trong index.html
local BI_MAT_V3 = "taodepzai|v3|HoiAn"
local P31 = 2147483647 -- 2^31 - 1: x * 48271 < 2^47 nên số thực double tính chính xác

local function BamV3(dsByte, h, coSo, mod)
    for i = 1, #dsByte do h = (h * coSo + dsByte[i] + 1) % mod end
    return h
end

local function ByteCua(chuoi)
    local t = {}
    for i = 1, #chuoi do t[i] = chuoi:byte(i) end
    return t
end

-- Ngày/tháng UTC từ mili-giây (thuật toán civil_from_days, không phụ thuộc os.date)
local function NgayThangUTC(ms)
    local z = math.floor(ms / 86400000) + 719468
    local era = math.floor(z / 146097)
    local doe = z - era * 146097
    local yoe = math.floor((doe - math.floor(doe / 1460) + math.floor(doe / 36524) - math.floor(doe / 146096)) / 365)
    local doy = doe - (365 * yoe + math.floor(yoe / 4) - math.floor(yoe / 100))
    local mp = math.floor((5 * doy + 2) / 153)
    local ngay = doy - math.floor((153 * mp + 2) / 5) + 1
    local thang = mp < 10 and mp + 3 or mp - 9
    return ngay, thang
end

local function GiaiMaV3(noiDung)
    local raw = GiaiBase64Url(noiDung)
    if not raw or #raw < 5 + 4 + 8 then return nil end
    local biMat = ByteCua(BI_MAT_V3)

    -- Đầu mã 5 byte: số quay, ngày, tháng, giây, mili-giây (xích từng byte)
    local y = BamV3(biMat, 7, 131, P31)
    if y == 0 then y = 1 end
    local dau, giaTriDau = {}, 0
    for i = 1, 5 do
        y = (y * 48271) % P31
        local b = (raw[i] - math.floor(y / 8388608) - (i > 1 and raw[i - 1] or 0)) % 256
        dau[i] = b
        giaTriDau = giaTriDau * 256 + b
    end
    local mili = giaTriDau % 1024
    local giay = math.floor(giaTriDau / 1024) % 64
    local thang = math.floor(giaTriDau / 65536) % 16
    local ngay = math.floor(giaTriDau / 1048576) % 32
    local soQuay = math.floor(giaTriDau / 33554432)
    if soQuay > 999 or ngay < 1 or ngay > 31 or thang < 1 or thang > 12 or giay > 59 or mili > 999 then
        return nil
    end

    -- Dòng khoá từ (bí mật, số quay, ngày, tháng, giây, mili-giây); byte của tên trộn tiếp vào khoá
    local x = BamV3(ByteCua(BI_MAT_V3 .. "|" .. soQuay .. "|" .. ngay .. "|" .. thang
        .. "|" .. giay .. "|" .. mili), 11, 257, P31)
    if x == 0 then x = 1 end
    local truoc, byteTruoc = soQuay % 256, 0
    local than = {}
    for i = 6, #raw do
        x = (x * 48271 + byteTruoc) % P31
        if x == 0 then x = 1 end
        byteTruoc = (raw[i] - math.floor(x / 8388608) - truoc) % 256
        than[#than + 1] = byteTruoc
        truoc = raw[i]
    end

    -- Mã kiểm tra 32 bit (2 hàm băm độc lập) phải khớp -> không sửa / bịa được key
    local soNoiDung = #than - 4
    local tatCa = {}
    for i = 1, #biMat do tatCa[#tatCa + 1] = biMat[i] end
    for i = 1, 5 do tatCa[#tatCa + 1] = dau[i] end
    for i = 1, soNoiDung do tatCa[#tatCa + 1] = than[i] end
    local h1 = BamV3(tatCa, 5, 131, P31)
    local h2 = BamV3(tatCa, 3, 257, 2147483629)
    if than[soNoiDung + 1] ~= math.floor(h1 / 256) % 256 or than[soNoiDung + 2] ~= h1 % 256
        or than[soNoiDung + 3] ~= math.floor(h2 / 256) % 256 or than[soNoiDung + 4] ~= h2 % 256 then
        return nil
    end

    local ten, nhiemVu, thoiDiemMs = KiemTraNoiDung(ByteSangChuoi(than, 1, soNoiDung))
    if not ten then return nil end
    -- Ngày, tháng, giây, mili-giây ở đầu mã phải khớp đúng thời điểm bên trong
    local ngayThat, thangThat = NgayThangUTC(thoiDiemMs)
    if ngayThat ~= ngay or thangThat ~= thang or math.floor(thoiDiemMs / 1000) % 60 ~= giay
        or thoiDiemMs % 1000 ~= mili then
        return nil
    end
    return { ten = ten, nhiemVu = nhiemVu, thoiDiem = math.floor(thoiDiemMs / 1000), soQuay = soQuay, phienBan = 3 }
end

-- Trả về { ten, nhiemVu, thoiDiem (giây, UTC), soQuay?, phienBan } hoặc nil
local function GiaiMaKey(ma)
    if type(ma) ~= "string" then return nil end
    local phienBan, noiDung = ma:match("^Free_v(%d)_(.*)$")
    if not noiDung or #noiDung < 8 or #noiDung > 700 or noiDung:find("[^%w_%-]") then return nil end
    if phienBan == "3" and CAU_HINH.KEY_PREFIX == "Free_v3_" then return GiaiMaV3(noiDung) end
    if phienBan == "2" and (CAU_HINH.CHAP_NHAN_KEY_V2 or CAU_HINH.KEY_PREFIX == "Free_v2_") then
        return GiaiMaV2(noiDung)
    end
    return nil
end

-- ================= Thời gian & tên =================
local function BayGio()
    -- Ưu tiên giờ máy chủ Roblox: chỉnh đồng hồ máy không làm key sống lâu hơn
    local ok, t = pcall(function() return workspace:GetServerTimeNow() end)
    if ok and type(t) == "number" and t > 1e9 then return math.floor(t) end
    ok, t = pcall(function() return DateTime.now().UnixTimestamp end)
    if ok and type(t) == "number" and t > 1e9 then return t end
    return os.time()
end

local function DinhDangGio(t)
    local ok, kq = pcall(function()
        local d = os.date("*t", t)
        return string.format("%02d:%02d ngày %02d/%02d/%04d", d.hour, d.min, d.day, d.month, d.year)
    end)
    return ok and kq or tostring(t)
end

local function DinhDangConLai(giay)
    local gio = math.floor(giay / 3600)
    local phut = math.floor((giay % 3600) / 60)
    if gio > 0 then return gio .. " giờ " .. phut .. " phút" end
    return phut .. " phút"
end

local function ChuanHoaTen(s)
    s = Trim(tostring(s or ""))
    s = s:gsub("^@", "")
    return s:lower() -- chỉ đổi chữ ASCII, không làm hỏng chữ có dấu
end

local function TenKhop(tenTrongKey)
    local can = ChuanHoaTen(tenTrongKey)
    if can == ChuanHoaTen(player.Name) then return true end
    if CAU_HINH.CHAP_NHAN_TEN_HIEN_THI and player.DisplayName and can == ChuanHoaTen(player.DisplayName) then
        return true
    end
    return false
end

-- ================= Kiểm tra key =================
-- Trả về: ok, thongBaoLoi, thongTin
local function KiemTraKey(nhap)
    nhap = type(nhap) == "string" and Trim(nhap) or ""
    if nhap == "" then
        return false, "Bạn chưa nhập key!"
    end
    -- Lấy phần key trong đoạn dán vào (dán thừa chữ vẫn nhận)
    local ma = nhap:match("Free_v%d_[%w_%-]+")
    if not ma then
        return false, "Key sai! Key phải bắt đầu bằng \"" .. CAU_HINH.KEY_PREFIX .. "\""
    end
    if ma:sub(1, #CAU_HINH.KEY_PREFIX) ~= CAU_HINH.KEY_PREFIX
        and not (CAU_HINH.CHAP_NHAN_KEY_V2 and ma:sub(1, 8) == "Free_v2_") then
        return false, "Key " .. ma:sub(1, 8) .. " cũ không còn dùng được. Hãy lấy key "
            .. CAU_HINH.KEY_PREFIX .. " mới trên trang web."
    end
    local thongTin = GiaiMaKey(ma)
    if not thongTin then
        return false, "Key không hợp lệ (bị sửa hoặc thiếu ký tự). Hãy sao chép lại key."
    end
    if CAU_HINH.KIEM_TRA_TEN and not TenKhop(thongTin.ten) then
        local tenHienThi = ""
        if CAU_HINH.CHAP_NHAN_TEN_HIEN_THI and player.DisplayName and player.DisplayName ~= player.Name then
            tenHienThi = " hoặc \"" .. tostring(player.DisplayName) .. "\""
        end
        return false, "Key này không phải của tài khoản " .. player.Name
            .. ". Trên web hãy nhập đúng tên \"" .. player.Name .. "\"" .. tenHienThi .. " rồi lấy key mới."
    end
    local bayGio = BayGio()
    if thongTin.thoiDiem - bayGio > CAU_HINH.LECH_GIO_CHO_PHEP then
        return false, "Thời gian trong key ở tương lai. Kiểm tra lại giờ máy rồi lấy key mới."
    end
    local hetHan = thongTin.thoiDiem + CAU_HINH.HAN_KEY_GIAY
    thongTin.hetHan = hetHan
    if bayGio >= hetHan then
        return false, "Key đã hết hạn lúc " .. DinhDangGio(hetHan) .. ". Hãy lấy key mới."
    end
    thongTin.conLai = hetHan - bayGio
    thongTin.ma = ma
    return true, nil, thongTin
end

-- ================= Lưu key (file của executor) =================
local FILE_KEY = CAU_HINH.TEN_FILE_KEY .. tostring(player.UserId) .. ".txt"

local function DocKeyDaLuu()
    local ok, noiDung = pcall(function()
        if isfile and not isfile(FILE_KEY) then return nil end
        return readfile(FILE_KEY)
    end)
    if ok and type(noiDung) == "string" then return Trim(noiDung) end
    return nil
end

local function LuuKey(ma)
    if not CAU_HINH.LUU_KEY then return end
    pcall(function() writefile(FILE_KEY, ma) end)
end

-- chiKhiLa: chỉ xoá nếu file vẫn đang chứa đúng key đó (không xoá nhầm key mới hơn)
local function XoaKeyDaLuu(chiKhiLa)
    pcall(function()
        if isfile and not isfile(FILE_KEY) then return end
        if chiKhiLa and DocKeyDaLuu() ~= chiKhiLa then return end
        if delfile then delfile(FILE_KEY) else writefile(FILE_KEY, "") end
    end)
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
    Size = UDim2.new(0, 340, 0, 236),
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
    Text = "Tạo key bằng tên: " .. tostring(player.Name),
    TextTruncate = Enum.TextTruncate.AtEnd,
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
    PlaceholderText = "Dán key " .. CAU_HINH.KEY_PREFIX .. "... (hạn 24 giờ)",
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
    Size = UDim2.new(1, -32, 0, 62),
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

-- Hẹn giờ: đúng lúc key hết hạn thì xoá file (và xoá khỏi ô nhập nếu bảng còn mở)
local function HenGioXoaKey(ma, conLai)
    if not (CAU_HINH.LUU_KEY and task and task.delay) then return end
    task.delay(math.max(1, conLai + 1), function()
        local conHan, _, tt = KiemTraKey(ma)
        if conHan then -- giờ máy chủ lệch chút -> hẹn lại phần còn thiếu
            return HenGioXoaKey(ma, tt.conLai)
        end
        XoaKeyDaLuu(ma)
        if gui.Parent ~= nil and Trim(oKey.Text) == ma then
            oKey.Text = ""
            if not dangXuLy then
                BaoTrangThai("Key đã lưu hết hạn 24 giờ và đã tự xoá. Hãy lấy key mới.", MAU.VANG)
            end
        end
    end)
end

local function XacNhan()
    if dangXuLy then return end
    local ok, loi, thongTin = KiemTraKey(oKey.Text)
    if not ok then
        return ThatBai(loi)
    end
    dangXuLy = true
    if DocKeyDaLuu() ~= thongTin.ma then
        LuuKey(thongTin.ma)
        HenGioXoaKey(thongTin.ma, thongTin.conLai)
    end
    DatNut(false, "Đang tải...")
    BaoTrangThai("✔ Key hợp lệ! Còn " .. DinhDangConLai(thongTin.conLai)
        .. " (hết hạn " .. DinhDangGio(thongTin.hetHan) .. "). Đang tải script...", MAU.XANH)
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

-- Mở script: điền sẵn key đã lưu nếu còn hạn, hết hạn / sai thì xoá luôn
if CAU_HINH.LUU_KEY then
    local daLuu = DocKeyDaLuu()
    if daLuu and daLuu ~= "" then
        local conHan, _, tt = KiemTraKey(daLuu)
        if conHan then
            oKey.Text = tt.ma
            BaoTrangThai("Đã điền key đã lưu · còn " .. DinhDangConLai(tt.conLai)
                .. " (tự xoá lúc " .. DinhDangGio(tt.hetHan) .. "). Bấm Xác nhận key.", MAU.VANG)
            HenGioXoaKey(tt.ma, tt.conLai)
        else
            XoaKeyDaLuu()
        end
    end
end

-- Trả về các hàm kiểm tra (để test; không ảnh hưởng khi chạy bằng loadstring)
return { GiaiMaKey = GiaiMaKey, KiemTraKey = KiemTraKey }
