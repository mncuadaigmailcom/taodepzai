#!/usr/bin/env python3
"""Test Luau thật cho key-system.lua (chỉ Free_v5_).

Chạy:  pip install lupa  rồi  python3 tests/key_system_lua_test.py
Không có lupa thì test tự bỏ qua (in SKIP) thay vì báo lỗi.
Kiểm tra: biên dịch Luau, key JS-tạo -> Lua giải đúng, key gõ tay bị chặn
(YEU_CAU_TEN_TU_ROBLOX=true), key v4/v2/sửa 1 ký tự đều bị từ chối.
"""
import hashlib, hmac, base64, json, sys, time
from pathlib import Path

try:
    from lupa import LuaRuntime
except ImportError:
    print("SKIP: chưa cài lupa (pip install lupa)")
    sys.exit(0)

BI_MAT = b"z!V~~RO3mS2dCMvW-GE@#v2XYYuLsNoQKS5U0pGeAY5EOkd_"
BANG = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

def than_thiet_bi(ip):
    h = hashlib.sha256(b"taodepzai|thiet-bi|ip:" + ip.encode()).digest()
    out = ""
    for i in range(10):
        v = 0
        for j in range(i * 5, i * 5 + 5):
            v = v * 2 + ((h[j >> 3] >> (7 - (j & 7))) & 1)
        out += BANG[v]
    return out

def tao_key(ten, ms, co_tu_roblox):
    tb = than_thiet_bi("203.0.113.7")
    p = bytes([5, co_tu_roblox, 0, 42]) + ms.to_bytes(6, "big") + bytes([4]) + tb.encode() + ten.encode()
    utc = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime(ms / 1000)) + f".{ms % 1000:03d}"
    tron = b"tdz5|tron|" + tb.encode() + b"|" + ten.encode() + f"|{utc}|042|{co_tu_roblox}".encode()
    khoa_con = hmac.new(BI_MAT, tron, hashlib.sha256).digest()
    nonce = bytes([7]) * 16
    tag = hmac.new(khoa_con, b"tdz5|tag|" + nonce + p, hashlib.sha256).digest()
    khoa = hmac.new(BI_MAT, b"tdz5|enc|" + nonce + tag, hashlib.sha256).digest()
    ma = bytes(b ^ hashlib.sha256(khoa + bytes([i // 32])).digest()[i % 32] for i, b in enumerate(p))
    return "Free_v5_" + base64.urlsafe_b64encode(nonce + tag + ma).decode().rstrip("=")

src = Path(__file__).with_name("..").joinpath("key-system.lua").resolve().read_text(encoding="utf-8")
marker = "-- ================= Chọn nơi đặt GUI ================="
harness = (
    'game = { GetService = function(self, n) return { LocalPlayer = { Name="Player_01", DisplayName="Player_01", UserId=123 } } end,'
    ' HttpGet = function() error("no net") end }\n'
    'workspace = { GetServerTimeNow = function(self) return os.time() end }\n'
    + src[: src.index(marker)]
    + "\nreturn { GiaiMaKey = GiaiMaKey, KiemTraKey = KiemTraKey, MaHoaTen = MaHoaTen }\n"
)
lua = LuaRuntime()
fn = (lua.globals().loadstring or lua.globals().load)(harness)
assert callable(fn), f"Luau không biên dịch được: {fn}"
api = fn()

ms = int(time.time() * 1000)
key_roblox, key_tay = tao_key("Player_01", ms, 1), tao_key("Player_01", ms, 0)

tt = api.GiaiMaKey(key_roblox)
assert tt and tt["ten"] == "Player_01" and tt["tuRoblox"] is True and tt["soQuay"] == 42, dict(tt or {})
assert api.KiemTraKey(key_roblox)[0] is True, "key từ link Roblox phải hợp lệ"
assert api.KiemTraKey(key_tay)[0] is False, "key gõ tay phải bị chặn"
for bad in ("Free_v4_" + "A" * 50, "Free_v2_" + "A" * 20, key_roblox[:-2] + "AA"):
    assert api.GiaiMaKey(bad) is None and api.KiemTraKey(bad)[0] is False, bad
assert len(api.MaHoaTen("Player_01")) > 20
print("OK: Luau biên dịch + giải/kiểm tra Free_v5_ đúng, v4/v2/key sửa đều bị từ chối")
