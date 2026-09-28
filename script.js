--[[
    taodepzai · KEY SYSTEM (v5)
    Key Free_v5_... do trang https://mncuadaigmailcom.github.io/taodepzai/ tạo ra gồm
    [số vòng quay 3 số, thời điểm hoàn thành (ms), nhiệm vụ cuối, MÃ THIẾT BỊ (theo IP), tên người chơi,
    cờ "tên lấy từ link mã hoá của Roblox"], được mã hoá bằng HMAC-SHA256 (nonce ngẫu nhiên 128 bit
    + tag 256 bit; bản Free_v4_ cũ: nonce 96 bit + tag 128 bit, vẫn nhận). Nhìn key không đọc được
    tên, ngày giờ hay mã thiết bị; sửa 1 ký tự là key hỏng.
    Script giải mã key (cùng thuật toán với taoMaDemo trong index.html) rồi kiểm tra:
      0. Tag khớp -> key không bị sửa / tự bịa.
      1. Tên trong key phải trùng tên tài khoản Roblox (hoặc tên hiển thị) của bạn.
      2. Mã mạng (băm SHA-256 IP 4G / 5G / wifi lúc lấy key) + tên + ngày tháng năm giờ phút giây
         mili giây tạo thành "chuỗi trộn" -> khoá con để mã hoá key. Lấy key xong đổi sang mạng
         khác vẫn xác nhận được (bật KIEM_TRA_THIET_BI = true nếu muốn bắt cùng mạng).
      3. Key chỉ có hạn 24 giờ kể từ lúc hoàn thành nhiệm vụ cuối cùng
         (giờ lấy theo máy chủ Roblox nếu có, chỉnh đồng hồ máy không gia hạn được).
    Đúng hết -> ẩn (xoá) bảng nhập key rồi chạy script chính.
      4. Key đúng được lưu vào file (writefile) theo từng tài khoản; lần sau mở script
         key tự điền sẵn vào ô nhập. Hết 24 giờ key tự bị xoá.

    Test: python3 tests/key_system_test.py  (và tests/luau_test.py với Luau thật)
    LƯU Ý: bí mật mã hoá nằm trong mã nguồn trang web, người đọc được code vẫn có thể tự tạo key.
    Chặn được việc xem hạn key, dùng lại key của người khác / key cũ, nhưng không phải
    bảo mật tuyệt đối (muốn vậy cần máy chủ cấp key giữ bí mật riêng).
]]

local CAU_HINH = {
    KEY_PREFIX         = "Free_v5_",      -- mã hoá HMAC-SHA256: số quay + thời điểm + tên + mã thiết bị
    CHAP_NHAN_KEY_V4   = true,            -- nhận cả key Free_v4_ (trang web bản cũ); false = chỉ nhận Free_v5_
    YEU_CAU_TEN_TU_ROBLOX = false,        -- true: chỉ nhận key Free_v5_ tạo bằng tên lấy từ link mã hoá
                                          -- (nhấn "Lấy key" 2 lần), không nhận tên gõ tay trên web
    CHAP_NHAN_KEY_V2   = true,            -- nhận cả key Free_v2_ (trang web bản cũ đang chạy, KHÔNG có
                                          -- mã thiết bị); đặt false sau khi trang web đã lên bản Free_v4_
    KIEM_TRA_THIET_BI  = false,           -- false: lấy key xong đổi sang mạng khác vẫn xác nhận được
                                          -- (mã mạng chỉ dùng để trộn mã hoá key). true = bắt cùng IP mạng
    HAN_KEY_GIAY       = 24 * 60 * 60,    -- key có hạn 1 ngày
    LECH_GIO_CHO_PHEP  = 5 * 60,          -- cho phép giờ máy lệch tối đa 5 phút
    KIEM_TRA_TEN       = true,            -- false = không bắt trùng tên
    CHAP_NHAN_TEN_HIEN_THI = true,        -- chấp nhận cả DisplayName, không chỉ username
    LUU_KEY            = true,            -- lưu key đúng, tự điền lại, hết hạn tự xoá
    TEN_FILE_KEY       = "taodepzai_key_", -- + UserId + ".txt" (mỗi tài khoản một file)
    SCRIPT_URL   = "https://mncuadaigmailcom.github.io/aiaiaitao2/script.js",
    LINK_LAY_KEY = "https://mncuadaigmailcom.github.io/taodepzai/", -- để "" nếu muốn ẩn nút
    THOI_GIAN_NHAN_DUP = 3,               -- nhấn "Lấy key" 2 lần trong 3 giây mới sao chép link
    TU_MO_TRINH_DUYET = true,             -- thử tự mở trang lấy key (chỉ được nếu executor cho phép)
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
-- Kiểm tra phần [tên, nhiệm vụ, thời điểm ms] của key v2
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

-- ================= Phép toán bit =================
-- Roblox (Luau) luôn có bit32. Không có (Lua 5.1 thuần) thì tự tính bằng bảng tra từng byte.
local BXor, BAnd, RShift, RRotate
if type(bit32) == "table" and bit32.bxor and bit32.band and bit32.rshift and bit32.rrotate then
    BXor, BAnd, RShift, RRotate = bit32.bxor, bit32.band, bit32.rshift, bit32.rrotate
else
    local XOR_BYTE, AND_BYTE = {}, {}
    for a = 0, 255 do
        for b = 0, 255 do
            local x, y, gia, kqXor, kqAnd = a, b, 1, 0, 0
            for _ = 1, 8 do
                local bx, by = x % 2, y % 2
                if bx ~= by then kqXor = kqXor + gia end
                if bx == 1 and by == 1 then kqAnd = kqAnd + gia end
                x, y, gia = (x - bx) / 2, (y - by) / 2, gia * 2
            end
            XOR_BYTE[a * 256 + b] = kqXor
            AND_BYTE[a * 256 + b] = kqAnd
        end
    end
    local function TheoByte(bang, a, b)
        local kq, he = 0, 1
        for _ = 1, 4 do
            local x, y = a % 256, b % 256
            kq = kq + bang[x * 256 + y] * he
            a, b, he = (a - x) / 256, (b - y) / 256, he * 256
        end
        return kq
    end
    BXor = function(a, b) return TheoByte(XOR_BYTE, a, b) end
    BAnd = function(a, b) return TheoByte(AND_BYTE, a, b) end
    RShift = function(a, n) return math.floor(a / 2 ^ n) end
    RRotate = function(a, n)
        local thap = a % 2 ^ n
        return (a - thap) / 2 ^ n + thap * 2 ^ (32 - n)
    end
end

-- ================= SHA-256 / HMAC-SHA256 (trên mảng byte) =================
local K256 = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
}
local H256 = { 0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19 }
local M32 = 4294967296

local function Sha256(dsByte)
    local n = #dsByte
    local m = {}
    for i = 1, n do m[i] = dsByte[i] end
    m[n + 1] = 0x80
    local tongDai = math.ceil((n + 9) / 64) * 64
    for i = n + 2, tongDai do m[i] = 0 end
    local soBit = n * 8
    for i = 0, 7 do
        m[tongDai - i] = soBit % 256
        soBit = math.floor(soBit / 256)
    end
    local h1, h2, h3, h4, h5, h6, h7, h8 = H256[1], H256[2], H256[3], H256[4], H256[5], H256[6], H256[7], H256[8]
    local w = {}
    for khoi = 0, tongDai - 1, 64 do
        for i = 0, 15 do
            local j = khoi + i * 4
            w[i] = ((m[j + 1] * 256 + m[j + 2]) * 256 + m[j + 3]) * 256 + m[j + 4]
        end
        for i = 16, 63 do
            local x, y = w[i - 15], w[i - 2]
            local s0 = BXor(BXor(RRotate(x, 7), RRotate(x, 18)), RShift(x, 3))
            local s1 = BXor(BXor(RRotate(y, 17), RRotate(y, 19)), RShift(y, 10))
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) % M32
        end
        local a, b, c, d, e, f, g, h = h1, h2, h3, h4, h5, h6, h7, h8
        for i = 0, 63 do
            local S1 = BXor(BXor(RRotate(e, 6), RRotate(e, 11)), RRotate(e, 25))
            local ch = BXor(g, BAnd(e, BXor(f, g)))
            local t1 = (h + S1 + ch + K256[i + 1] + w[i]) % M32
            local S0 = BXor(BXor(RRotate(a, 2), RRotate(a, 13)), RRotate(a, 22))
            local maj = BXor(BAnd(a, BXor(b, c)), BAnd(b, c))
            h, g, f, e, d, c, b, a = g, f, e, (d + t1) % M32, c, b, a, (t1 + S0 + maj) % M32
        end
        h1, h2, h3, h4 = (h1 + a) % M32, (h2 + b) % M32, (h3 + c) % M32, (h4 + d) % M32
        h5, h6, h7, h8 = (h5 + e) % M32, (h6 + f) % M32, (h7 + g) % M32, (h8 + h) % M32
    end
    local ra = {}
    for _, v in ipairs({ h1, h2, h3, h4, h5, h6, h7, h8 }) do
        ra[#ra + 1] = math.floor(v / 16777216)
        ra[#ra + 1] = math.floor(v / 65536) % 256
        ra[#ra + 1] = math.floor(v / 256) % 256
        ra[#ra + 1] = v % 256
    end
    return ra
end

local function HmacSha256(khoa, thongDiep)
    if #khoa > 64 then khoa = Sha256(khoa) end
    local trong, ngoai = {}, {}
    for i = 1, 64 do
        local b = khoa[i] or 0
        trong[i] = BXor(b, 0x36)
        ngoai[i] = BXor(b, 0x5C)
    end
    for i = 1, #thongDiep do trong[64 + i] = thongDiep[i] end
    local bamTrong = Sha256(trong)
    for i = 1, 32 do ngoai[64 + i] = bamTrong[i] end
    return Sha256(ngoai)
end

local function ByteCua(chuoi)
    local t = {}
    for i = 1, #chuoi do t[i] = chuoi:byte(i) end
    return t
end

local function Noi(...)
    local kq = {}
    for _, ds in ipairs({ ... }) do
        for i = 1, #ds do kq[#kq + 1] = ds[i] end
    end
    return kq
end

-- Lấy `so` bit (bit cao trước) bắt đầu từ bit thứ `tu` (tính từ 0) của mảng byte
local function LayBit(dsByte, tu, so)
    local v = 0
    for i = tu, tu + so - 1 do
        v = v * 2 + math.floor(dsByte[math.floor(i / 8) + 1] / 2 ^ (7 - i % 8)) % 2
    end
    return v
end

-- ================= Mã thiết bị =================
-- Mã gốc ("ip:" .. IP mạng) -> băm SHA-256 -> 10 ký tự + 2 ký tự kiểm tra.
-- Phải khớp chuanHoaMaThietBi / maKiemTraThietBi trong index.html.
local BANG_THIET_BI = "0123456789ABCDEFGHJKMNPQRSTVWXYZ" -- Crockford base32 (không có I, L, O, U)

local function KyTuThietBi(v) return BANG_THIET_BI:sub(v + 1, v + 1) end

local function ThanMaThietBi(maGoc)
    local bam = Sha256(ByteCua("taodepzai|thiet-bi|" .. maGoc))
    local kyTu = {}
    for i = 0, 9 do kyTu[#kyTu + 1] = KyTuThietBi(LayBit(bam, i * 5, 5)) end
    return table.concat(kyTu)
end

local function KiemTraThietBi(than)
    local bam = Sha256(ByteCua("taodepzai|kiem-tra|" .. than))
    return KyTuThietBi(LayBit(bam, 0, 5)) .. KyTuThietBi(LayBit(bam, 5, 5))
end

local function DinhDangThietBi(than)
    local d = than .. KiemTraThietBi(than)
    return d:sub(1, 4) .. "-" .. d:sub(5, 8) .. "-" .. d:sub(9, 12)
end

-- Mã thiết bị = băm của IP mạng (IPv4 công khai) của máy. Trang web tự lấy IP của điện thoại
-- lúc làm nhiệm vụ, script tự lấy IP lúc chơi -> phải cùng mạng (cùng wifi / 4G) mới khớp.
-- Phải khớp NGUON_IP / thanTuIp trong index.html.
local NGUON_IP = { "https://api.ipify.org", "https://ipv4.icanhazip.com", "https://v4.ident.me" }

-- "1.02.3.4\n" -> "1.2.3.4"; nil nếu không phải IPv4
local function ChuanHoaIp(s)
    if type(s) ~= "string" then return nil end
    local a, b, c, d = Trim(s):match("^(%d%d?%d?)%.(%d%d?%d?)%.(%d%d?%d?)%.(%d%d?%d?)$")
    if not a then return nil end
    local so = { tonumber(a), tonumber(b), tonumber(c), tonumber(d) }
    for i = 1, 4 do
        if so[i] > 255 then return nil end
    end
    return table.concat(so, ".")
end

local function LayIp()
    for _, url in ipairs(NGUON_IP) do
        local ok, kq = pcall(function() return game:HttpGet(url) end)
        local ip = ok and ChuanHoaIp(kq)
        if ip then return ip end
    end
    return nil
end

local THAN_THIET_BI, MA_THIET_BI -- nil khi chưa lấy được IP
local KhiDoiThietBi = function() end -- giao diện gắn vào sau

local function CapNhatThietBi()
    local ip = LayIp()
    if ip then
        THAN_THIET_BI = ThanMaThietBi("ip:" .. ip)
        MA_THIET_BI = DinhDangThietBi(THAN_THIET_BI)
    end
    KhiDoiThietBi()
    return THAN_THIET_BI
end

-- ================= Key v4 =================
-- Free_v4_ + base64url( nonce 12 byte | tag 16 byte | bản mã )
--   bản rõ P = [4, số quay (2 byte), thời điểm ms (6 byte), nhiệm vụ 1-4, mã thiết bị (10 ký tự), tên UTF-8]
--   chuỗi trộn = "tdz4|tron|" .. mã mạng .. "|" .. tên .. "|" .. "YYYY-MM-DD HH:MM:SS.mmm" (UTC) .. "|" .. số quay
--   khoá con = HMAC-SHA256(BI_MAT, chuỗi trộn)   -> mỗi mạng / tên / mili giây cho một khoá khác
--   tag   = HMAC-SHA256(khoá con, "tdz4|tag|" .. nonce .. P) lấy 16 byte đầu
--   khoá  = HMAC-SHA256(BI_MAT, "tdz4|enc|" .. nonce .. tag)
--   bản mã = P XOR (SHA256(khoá .. 0) .. SHA256(khoá .. 1) .. ...)
-- Phải khớp BI_MAT_V4 / taoMaDemo trong index.html và tools/decode-demo.cjs.
local BI_MAT_V4 = ByteCua("z!V~~RO3mS2dCMvW-GE@#v2XYYuLsNoQKS5U0pGeAY5EOkd_")

-- Key v5 (bản mới): Free_v5_ + base64url( nonce 16 byte | tag 32 byte | bản mã )
--   P = [5, cờ tên từ Roblox (0/1), số quay (2 byte), thời điểm ms (6 byte), nhiệm vụ, mã thiết bị 10 ký tự, tên]
--   chuỗi trộn = "tdz5|tron|" .. mã mạng .. "|" .. tên .. "|" .. ngày giờ UTC .. "|" .. số quay .. "|" .. cờ
--   nhãn "tdz5|tag|" / "tdz5|enc|", tag giữ đủ 32 byte (256 bit). Còn lại giống v4.
local CAU_TRUC_KEY = {
    [4] = { nonce = 12, tag = 16, lech = 0, nhan = "tdz4" },
    [5] = { nonce = 16, tag = 32, lech = 1, nhan = "tdz5" },
}
for _, pb in pairs(CAU_TRUC_KEY) do
    pb.nhanTag, pb.nhanKhoa = ByteCua(pb.nhan .. "|tag|"), ByteCua(pb.nhan .. "|enc|")
    pb.coDinh = pb.nonce + pb.tag + 20 + pb.lech
end

-- ms (UTC) -> "YYYY-MM-DD HH:MM:SS.mmm"; tự tính lịch (không phụ thuộc os.date / múi giờ máy)
local function NgayGioUtc(ms)
    local giay = math.floor(ms / 1000)
    local phanMs = ms - giay * 1000
    local ngay = math.floor(giay / 86400)
    local trongNgay = giay - ngay * 86400
    local z = ngay + 719468
    local ky = math.floor(z / 146097)
    local doe = z - ky * 146097
    local yoe = math.floor((doe - math.floor(doe / 1460) + math.floor(doe / 36524) - math.floor(doe / 146096)) / 365)
    local nam = yoe + ky * 400
    local doy = doe - (365 * yoe + math.floor(yoe / 4) - math.floor(yoe / 100))
    local mp = math.floor((5 * doy + 2) / 153)
    local ngayThang = doy - math.floor((153 * mp + 2) / 5) + 1
    local thang = mp < 10 and mp + 3 or mp - 9
    if thang <= 2 then nam = nam + 1 end
    return string.format("%04d-%02d-%02d %02d:%02d:%02d.%03d", nam, thang, ngayThang,
        math.floor(trongNgay / 3600), math.floor(trongNgay % 3600 / 60), trongNgay % 60, phanMs)
end

-- Chuỗi trộn từ bản rõ P: mã mạng + tên + ngày tháng năm giờ phút giây mili giây + số quay (+ cờ ở v5)
local function ChuoiTron(p, pb)
    local d = pb.lech
    local soQuay = p[2 + d] * 256 + p[3 + d]
    local ms = 0
    for i = 4 + d, 9 + d do ms = ms * 256 + p[i] end
    local kq = ByteCua(pb.nhan .. "|tron|")
    for i = 11 + d, 20 + d do kq[#kq + 1] = p[i] end
    kq[#kq + 1] = 124 -- "|"
    for i = 21 + d, #p do kq[#kq + 1] = p[i] end
    local duoi = "|" .. NgayGioUtc(ms) .. "|" .. string.format("%03d", soQuay)
    if d == 1 then duoi = duoi .. "|" .. tostring(p[2]) end
    return Noi(kq, ByteCua(duoi))
end

-- Giải key v4 / v5 (so = 4 hoặc 5)
local function GiaiMaMoi(noiDung, so)
    local pb = CAU_TRUC_KEY[so]
    local raw = GiaiBase64Url(noiDung)
    if not raw or #raw < pb.coDinh + 1 or #raw > pb.coDinh + 128 then return nil end
    local nonce, tag, banMa = {}, {}, {}
    for i = 1, pb.nonce do nonce[i] = raw[i] end
    for i = 1, pb.tag do tag[i] = raw[pb.nonce + i] end
    for i = pb.nonce + pb.tag + 1, #raw do banMa[#banMa + 1] = raw[i] end

    local khoa = HmacSha256(BI_MAT_V4, Noi(pb.nhanKhoa, nonce, tag))
    local p, dong = {}, nil
    for i = 1, #banMa do
        local viTri = (i - 1) % 32
        if viTri == 0 then dong = Sha256(Noi(khoa, { (i - 1) / 32 })) end
        p[i] = BXor(banMa[i], dong[viTri + 1])
    end

    -- Tag (128 bit ở v4, 256 bit ở v5) phải khớp -> sửa 1 ký tự hay tự bịa key đều bị phát hiện
    local khoaCon = HmacSha256(BI_MAT_V4, ChuoiTron(p, pb))
    local tagThat = HmacSha256(khoaCon, Noi(pb.nhanTag, nonce, p))
    local khac = 0
    for i = 1, pb.tag do
        if tagThat[i] ~= tag[i] then khac = khac + 1 end
    end
    if khac ~= 0 or p[1] ~= so then return nil end

    local d = pb.lech
    if d == 1 and p[2] > 1 then return nil end
    local soQuay = p[2 + d] * 256 + p[3 + d]
    local thoiDiemMs = 0
    for i = 4 + d, 9 + d do thoiDiemMs = thoiDiemMs * 256 + p[i] end
    local nv = p[10 + d]
    local thietBi = ByteSangChuoi(p, 11 + d, 20 + d)
    local ten = ByteSangChuoi(p, 21 + d, #p)
    if soQuay > 999 or thoiDiemMs <= 0 or thoiDiemMs > 8.64e15 or nv < 1 or nv > 4 then return nil end
    if thietBi:find("[^0-9A-HJKMNP-TV-Z]") then return nil end
    if ten == "" or not Utf8HopLe(ten) or ten ~= Trim(ten) or DoDaiJs(ten) > 32 then return nil end
    return {
        ten = ten, nhiemVu = "nv" .. nv, thoiDiem = math.floor(thoiDiemMs / 1000),
        soQuay = soQuay, thietBi = thietBi, phienBan = so, tuRoblox = d == 1 and p[2] == 1,
    }
end

-- ================= Tên người chơi mã hoá (link "Lấy key") =================
-- tk = base64url( nonce 8 byte | tag 12 byte | tên XOR dòng khoá )
--   tag  = HMAC-SHA256(BI_MAT, "tdz4|ten|tag|" .. nonce .. tên) lấy 12 byte đầu
--   khoá = HMAC-SHA256(BI_MAT, "tdz4|ten|enc|" .. nonce .. tag); dòng khoá = SHA256(khoá .. 0) .. SHA256(khoá .. 1) ...
-- Trang web giải mã (giaiMaTen trong index.html): hợp lệ thì tự điền tên vào ô tên người chơi.
local B64_BANG = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
local function MaHoaBase64Url(ds)
    local kq = {}
    for i = 1, #ds, 3 do
        local a, b, c = ds[i], ds[i + 1], ds[i + 2]
        local n = a * 65536 + (b or 0) * 256 + (c or 0)
        local so = b == nil and 2 or (c == nil and 3 or 4)
        for k = 1, so do
            local v = math.floor(n / 2 ^ (18 - 6 * (k - 1))) % 64
            kq[#kq + 1] = B64_BANG:sub(v + 1, v + 1)
        end
    end
    return table.concat(kq)
end

local NHAN_TEN_TAG, NHAN_TEN_KHOA = ByteCua("tdz4|ten|tag|"), ByteCua("tdz4|ten|enc|")

local function NonceNgauNhien(so)
    local rng
    pcall(function() rng = Random.new() end)
    local kq = {}
    for i = 1, so do
        kq[i] = rng and rng:NextInteger(0, 255) or math.random(0, 255)
    end
    return kq
end

local function MaHoaTen(ten, nonce)
    nonce = nonce or NonceNgauNhien(8)
    local ban = ByteCua(ten)
    local tagDu = HmacSha256(BI_MAT_V4, Noi(NHAN_TEN_TAG, nonce, ban))
    local tag = {}
    for i = 1, 12 do tag[i] = tagDu[i] end
    local khoa = HmacSha256(BI_MAT_V4, Noi(NHAN_TEN_KHOA, nonce, tag))
    local ma, dong = {}, nil
    for i = 1, #ban do
        local viTri = (i - 1) % 32
        if viTri == 0 then dong = Sha256(Noi(khoa, { (i - 1) / 32 })) end
        ma[i] = BXor(ban[i], dong[viTri + 1])
    end
    return MaHoaBase64Url(Noi(nonce, tag, ma))
end

-- Trả về { ten, nhiemVu, thoiDiem (giây, UTC), soQuay?, thietBi?, phienBan } hoặc nil
local function GiaiMaKey(ma)
    if type(ma) ~= "string" then return nil end
    local phienBan, noiDung = ma:match("^Free_v(%d)_(.*)$")
    if not noiDung or #noiDung < 8 or #noiDung > 700 or noiDung:find("[^%w_%-]") then return nil end
    if phienBan == "5" then return GiaiMaMoi(noiDung, 5) end
    if phienBan == "4" and CAU_HINH.CHAP_NHAN_KEY_V4 then return GiaiMaMoi(noiDung, 4) end
    if phienBan == "2" and CAU_HINH.CHAP_NHAN_KEY_V2 then return GiaiMaV2(noiDung) end
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
        and not (CAU_HINH.CHAP_NHAN_KEY_V4 and ma:sub(1, 8) == "Free_v4_")
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
    if CAU_HINH.YEU_CAU_TEN_TU_ROBLOX and not thongTin.tuRoblox then
        return false, "Key này tạo bằng tên gõ tay. Hãy nhấn \"Lấy key\" 2 lần, mở link (tên mã hoá) rồi lấy "
            .. CAU_HINH.KEY_PREFIX .. " mới."
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
    if CAU_HINH.KIEM_TRA_THIET_BI and thongTin.phienBan >= 4 and thongTin.thietBi ~= THAN_THIET_BI then
        -- Chưa có IP hoặc mạng vừa đổi -> lấy lại IP một lần rồi so tiếp
        CapNhatThietBi()
        if not THAN_THIET_BI then
            return false, "Không lấy được IP mạng để kiểm tra key. Kiểm tra kết nối rồi bấm Xác nhận lại.",
                { loi = "mang" }
        end
        if thongTin.thietBi ~= THAN_THIET_BI then
            return false, "Key này được tạo trên thiết bị / mạng khác (IP không khớp). Hãy mở trang lấy key "
                .. "bằng điện thoại này, cùng wifi hoặc 4G đang chơi, rồi lấy key mới.", { loi = "thiet_bi" }
        end
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
    Size = UDim2.new(0, 340, 0, 240),
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

local nhanTen = New("TextLabel", {
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

local nhanThietBi = New("TextLabel", {
    Name = "MaThietBi",
    BackgroundTransparency = 1,
    Position = UDim2.new(0, 16, 0, 58),
    Size = UDim2.new(1, -32, 0, 24),
    Visible = false, -- mã mạng lấy ngầm, không hiện trên bảng
    Font = Enum.Font.GothamBold,
    Text = "Mạng (4G / 5G / wifi): đang kiểm tra...",
    TextColor3 = MAU.CHU,
    TextSize = 13,
    TextTruncate = Enum.TextTruncate.AtEnd,
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

KhiDoiThietBi = function()
    if gui.Parent == nil then return end
    -- Không hiện mã mạng / IP, chỉ báo đã nhận mạng hay chưa
    nhanThietBi.Text = MA_THIET_BI and "Mạng (4G / 5G / wifi): ✓ đã nhận"
        or "Mạng: chưa lấy được, kiểm tra kết nối"
end
-- Chỉ lấy IP trong game khi bật kiểm tra mạng; mặc định không cần (đổi mạng vẫn dùng key được)
if CAU_HINH.KIEM_TRA_THIET_BI then CapNhatThietBi() end

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

local function SaoChep(noiDung)
    return pcall(function()
        local chep = setclipboard or toclipboard or (Clipboard and Clipboard.set)
        chep(noiDung)
    end)
end

-- Link lấy key kèm tên người chơi ĐÃ MÃ HOÁ (đuôi ?mahoa=...) -> trang web tự đọc link, điền tên vào ô tên
local function LinkLayKey()
    local noi = CAU_HINH.LINK_LAY_KEY:find("?", 1, true) and "&" or "?"
    return CAU_HINH.LINK_LAY_KEY .. noi .. "mahoa=" .. MaHoaTen(tostring(player.Name))
end

-- Đồng hồ cho nhấn đúp: os.clock (có phần lẻ) nếu có, không thì giờ máy chủ
local function DongHoNhan()
    local ok, t = pcall(function() return os.clock() end)
    if ok and type(t) == "number" then return t end
    return BayGio()
end

-- Thử tự mở trình duyệt. Roblox chỉ cho script lõi (CoreScript) mở web; đa số executor chặn các hàm này,
-- nên lỗi thì bỏ qua (link vẫn được sao chép). Trả về true nếu có hàm nào chạy không báo lỗi.
local function MoTrinhDuyet(link)
    if not CAU_HINH.TU_MO_TRINH_DUYET then return false end
    for _, cach in ipairs({
        function() game:GetService("GuiService"):OpenBrowserWindow(link) end,
        function() game:GetService("BrowserService"):OpenBrowserWindow(link) end,
    }) do
        if pcall(cach) then return true end
    end
    return false
end

-- Nhấn "Lấy key" 2 lần (trong 3 giây) -> thử tự mở trang lấy key + sao chép link (dán vào trình duyệt nếu không tự mở)
local lanNhanLayKey = nil
if nutLayKey then
    nutLayKey.MouseButton1Click:Connect(function()
        local bayGio = DongHoNhan()
        if not lanNhanLayKey or bayGio - lanNhanLayKey > CAU_HINH.THOI_GIAN_NHAN_DUP then
            lanNhanLayKey = bayGio
            BaoTrangThai("Nhấn \"Lấy key\" thêm 1 lần nữa để sao chép link lấy key.", MAU.VANG)
            return
        end
        lanNhanLayKey = nil
        local link = LinkLayKey()
        -- Tên đã được mã hoá vào link (hợp lệ, trang web tự điền) -> ẩn tên người chơi trên bảng
        nhanTen.Text = "Tên người chơi: 🔒 đã mã hoá, gửi sang trang lấy key"
        local daChep = SaoChep(link)
        if MoTrinhDuyet(link) then
            BaoTrangThai("Đang mở trang lấy key (tên đã mã hoá, tự điền)."
                .. (daChep and " Nếu trang không hiện, link đã được sao chép: dán vào trình duyệt." or ""), MAU.VANG)
        elseif daChep then
            BaoTrangThai("Executor không cho tự mở web. Đã sao chép link lấy key (tên đã mã hoá): "
                .. "dán vào trình duyệt để mở trang, tên sẽ tự điền.", MAU.VANG)
        else
            BaoTrangThai("Link lấy key: " .. link, MAU.VANG)
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
        local conHan, loi, tt = KiemTraKey(daLuu)
        if conHan then
            oKey.Text = tt.ma
            BaoTrangThai("Đã điền key đã lưu · còn " .. DinhDangConLai(tt.conLai)
                .. " (tự xoá lúc " .. DinhDangGio(tt.hetHan) .. "). Bấm Xác nhận key.", MAU.VANG)
            HenGioXoaKey(tt.ma, tt.conLai)
        elseif tt and (tt.loi == "mang" or tt.loi == "thiet_bi") then
            -- Lỗi mạng / đang ở mạng khác: giữ file (quay lại đúng mạng là dùng tiếp)
            oKey.Text = daLuu
            BaoTrangThai("Key đã lưu: " .. tostring(loi), MAU.VANG)
        else
            XoaKeyDaLuu()
        end
    end
end

-- Trả về các hàm kiểm tra (để test; không ảnh hưởng khi chạy bằng loadstring)
return { GiaiMaKey = GiaiMaKey, KiemTraKey = KiemTraKey, MaThietBi = function() return MA_THIET_BI end,
    MaHoaTen = MaHoaTen }