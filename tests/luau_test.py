#!/usr/bin/env python3
"""Chạy key-system.lua trong Luau THẬT (ngôn ngữ của Roblox) với key lấy từ code trang web.

- Key Free_v2_: sinh bằng hàm taoMaDemo của trang đang chạy (nhánh origin/main).
- Key Free_v4_: sinh bằng hàm taoMaDemo của index.html hiện tại (SHA-256 dùng bit32 thật của Luau).

Cần: binary `luau` (đặt biến môi trường LUAU=/đường/dẫn/luau hoặc có trong PATH), Node.js, git.
Build Luau: git clone https://github.com/luau-lang/luau && cd luau && make config=release luau
Chạy: LUAU=/tmp/luau-src/luau python3 tests/luau_test.py
"""
import json
import os
import pathlib
import random
import shutil
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import key_system_test as k  # noqa: E402

GOC = k.GOC
LUAU = os.environ.get("LUAU") or shutil.which("luau")
NOW = k.BAY_GIO


def tao_ma_trang_main(cases):
    """Sinh key bằng taoMaDemo của trang web đang chạy (origin/main)."""
    html = subprocess.run(["git", "show", "origin/main:index.html"], cwd=GOC,
                          capture_output=True, text=True, check=True).stdout
    code = r"""
const fs = require('fs');
const html = fs.readFileSync(0, 'utf8').split('\u0000');
const src = html[0].match(/function taoMaDemo\([\s\S]*?\n        }\n/)[0];
const MA_DEMO_PREFIX = html[0].match(/const MA_DEMO_PREFIX = '([^']+)'/)[1];
const taoMaDemo = eval('(' + src + ')');
console.log(JSON.stringify(JSON.parse(html[1]).map(([ten, id, time]) => taoMaDemo(ten, { id, time }))));
"""
    kq = subprocess.run(["node", "-e", code], input=html + "\u0000" + json.dumps(cases),
                        capture_output=True, text=True, check=True)
    return json.loads(kq.stdout)


def tao_v4(cases):
    """[tên, nhiệm vụ, ms, số quay, mã thiết bị?] -> key từ index.html (nonce ngẫu nhiên nhưng cố định theo seed)."""
    ngau_nhien = random.Random(len(cases))
    return k.tao_ma_bang_index_html([[c[0], c[1], c[2], c[3], c[4] if len(c) > 4 else k.MA_TB,
                                      ngau_nhien.randbytes(12).hex()] for c in cases])


def chuoi_luau(s):
    return '"' + "".join(f"\\{b}" for b in s.encode("utf-8")) + '"'


def chay_luau(than_test):
    """Ghép mock + key-system.lua + đoạn test thành một file Luau rồi chạy."""
    nguon = GOC.joinpath("key-system.lua").read_text(encoding="utf-8")
    mock = GOC.joinpath("tests", "roblox_mock.lua").read_text(encoding="utf-8")
    assert "]=========]" not in nguon
    code = f"""
local tao = (function()
{mock}
end)()
local SRC = [=========[{nguon}]=========]

local function hex(s)
    return (s:gsub(".", function(c) return string.format("%02x", c:byte()) end))
end

local function mo(tuy_chon, o_dia)
    local env, log = tao(tuy_chon)
    if o_dia then
        env.isfile = function(ten) return o_dia[ten] ~= nil end
        env.readfile = function(ten) return o_dia[ten] end
        env.writefile = function(ten, nd) o_dia[ten] = nd end
        env.delfile = function(ten) o_dia[ten] = nil end
    end
    local f = assert(loadstring(SRC, "=key-system.lua"))
    setfenv(f, env)
    local api = f()
    local gui = log.hui:FindFirstChild("Taodepzai_KeySystem")
    return {{ env = env, log = log, api = api, gui = gui,
        o = gui:FindFirstChildDeep("OKey"), tt = gui:FindFirstChildDeep("TrangThai"),
        nut = gui:FindFirstChildDeep("NutXacNhan") }}
end

local function thu(key, tuy_chon, o_dia)
    local p = mo(tuy_chon or {{ ten = "Tester", gio_may = {NOW} }}, o_dia)
    p.o.Text = key
    p.nut.MouseButton1Click:Fire()
    return (p.env._G.DA_CHAY_SCRIPT_CHINH or 0), p.tt.Text, p
end

local function ra(ten, ...)
    local phan = {{ ten }}
    for _, v in ipairs({{ ... }}) do phan[#phan + 1] = hex(tostring(v)) end
    print(table.concat(phan, "\\t"))
end

{than_test}
"""
    with tempfile.NamedTemporaryFile("w", suffix=".luau", delete=False, encoding="utf-8") as f:
        f.write(code)
        duong_dan = f.name
    try:
        kq = subprocess.run([LUAU, duong_dan], capture_output=True, text=True, timeout=120)
    finally:
        os.unlink(duong_dan)
    if kq.returncode != 0:
        raise AssertionError("Luau lỗi:\n" + kq.stdout[-2000:] + kq.stderr[-2000:])
    dong = {}
    for line in kq.stdout.splitlines():
        phan = line.split("\t")
        dong[phan[0]] = [bytes.fromhex(x).decode("utf-8", "replace") for x in phan[1:]]
    return dong


@unittest.skipUnless(LUAU and shutil.which("node"), "Cần binary luau (biến LUAU) và Node.js")
class LuauThatTest(unittest.TestCase):
    def test_key_that_tu_trang_web(self):
        t = (NOW - 120) * 1000 + 345
        v2 = tao_ma_trang_main([["Tester", "nv4", t], ["NguoiKhac", "nv4", t],
                                ["Tester", "nv1", (NOW - k.NGAY - 5) * 1000]])
        v3 = tao_v4([["Tester", "nv4", t, 58], ["NguoiKhac", "nv2", t, 999],
                     ["Tester", "nv3", (NOW - k.NGAY - 5) * 1000, 0], ["tester", "nv1", t, 0],
                     ["Tester", "nv4", t, 1, k.ma_thiet_bi("ip:14.232.7.9")]])
        sua = v3[0][:20] + ("A" if v3[0][20] != "A" else "B") + v3[0][21:]
        cases = {
            "v2_dung": v2[0], "v2_nguoi_khac": v2[1], "v2_het_han": v2[2],
            "v3_dung": v3[0], "v3_nguoi_khac": v3[1], "v3_het_han": v3[2], "v3_chu_thuong": v3[3],
            "v3_bi_sua": sua, "v3_dan_thua": f"  key: {v3[0]} \n", "rac": "abc", "v4_may_khac": v3[4],
        }
        than = "\n".join(f"do local n, tt = thu({chuoi_luau(key)}) ra({json.dumps(ten)}, n, tt) end"
                         for ten, key in cases.items())
        kq = chay_luau(than)
        mong_doi = {"v2_dung": 1, "v2_nguoi_khac": 0, "v2_het_han": 0, "v3_dung": 1, "v3_nguoi_khac": 0,
                    "v3_het_han": 0, "v3_chu_thuong": 1, "v3_bi_sua": 0, "v3_dan_thua": 1, "rac": 0, "v4_may_khac": 0}
        for ten, so in mong_doi.items():
            with self.subTest(ten=ten):
                self.assertEqual(int(kq[ten][0]), so, kq[ten][1])
        self.assertIn("Còn 23 giờ 58 phút", kq["v3_dung"][1])
        self.assertIn("không phải của tài khoản Tester", kq["v3_nguoi_khac"][1])
        self.assertIn("hết hạn", kq["v2_het_han"][1])
        self.assertIn("không hợp lệ", kq["v3_bi_sua"][1])
        self.assertIn("IP không khớp", kq["v4_may_khac"][1])

    def test_luu_key_tu_dien_va_tu_xoa(self):
        t = (NOW - k.NGAY + 600) * 1000  # còn 10 phút
        ma = tao_v4([["Tester", "nv4", t, 314]])[0]
        than = f"""
local o_dia = {{}}
local n = thu({chuoi_luau(ma)}, nil, o_dia)
ra("luu", n, o_dia["taodepzai_key_12345.txt"] or "")
local p = mo({{ ten = "Tester", gio_may = {NOW} }}, o_dia)
ra("tu_dien", p.o.Text, p.tt.Text)
p.log.tien_gio(11 * 60)
ra("tu_xoa", p.o.Text, o_dia["taodepzai_key_12345.txt"] or "<đã xoá>", p.tt.Text)
"""
        kq = chay_luau(than)
        self.assertEqual(kq["luu"], ["1", ma])
        self.assertEqual(kq["tu_dien"][0], ma)
        self.assertIn("Đã điền key đã lưu", kq["tu_dien"][1])
        self.assertEqual(kq["tu_xoa"][:2], ["", "<đã xoá>"])
        self.assertIn("tự xoá", kq["tu_xoa"][2])

    def test_gio_may_chu_trong_luau(self):
        ma = tao_v4([["Tester", "nv4", (NOW - 2 * k.NGAY) * 1000, 1]])[0]
        than = (f"do local n, tt = thu({chuoi_luau(ma)}, {{ ten = 'Tester', gio_may = {NOW - 2 * k.NGAY + 30}, "
                f"gio_may_chu = {NOW}.5 }}) ra('x', n, tt) end")
        kq = chay_luau(than)
        self.assertEqual(kq["x"][0], "0", "Lùi đồng hồ máy không qua được giờ máy chủ")

    def test_giai_ma_giong_tool_js(self):
        ngau_nhien = random.Random(11)
        ky_tu = list("abcXYZ019 _-.'\"\\/đĐăâêôơưÁÀẢÃẠ中🎮")
        cases, v2_cases = [], []
        for _ in range(120):
            ten = "".join(ngau_nhien.choice(ky_tu) for _ in range(ngau_nhien.randint(1, 24))).strip() or "x"
            t = ngau_nhien.randint(1, 4_000_000_000_000)
            cases.append([ten, ngau_nhien.choice(["nv1", "nv2", "nv3", "nv4"]), t, ngau_nhien.randint(0, 999)])
            v2_cases.append([ten, "nv2", t])
        cac_ma = tao_v4(cases) + tao_ma_trang_main(v2_cases)
        for i in range(0, len(cac_ma), 5):  # thêm vài key bị sửa
            ma = cac_ma[i]
            cac_ma.append(ma[:12] + ("x" if ma[12] != "x" else "y") + ma[13:])
        js = k.giai_ma_bang_tool_js(cac_ma)
        than = "local p = mo({ ten = 'Tester', gio_may = %d })\n" % NOW
        for i, ma in enumerate(cac_ma):
            than += (f"do local t = p.api.GiaiMaKey({chuoi_luau(ma)}) "
                     f"if t then ra('k{i}', t.ten, t.nhiemVu, t.thoiDiem, t.soQuay or -1, t.thietBi or '') "
                     f"else ra('k{i}') end end\n")
        kq = chay_luau(than)
        so_hop_le = 0
        for i, (ma, mong) in enumerate(zip(cac_ma, js)):
            lua = kq[f"k{i}"]
            if mong is None:
                self.assertEqual(lua, [], ma)
                continue
            so_hop_le += 1
            self.assertEqual(lua[0], mong["ten"], ma)
            self.assertEqual(lua[1], mong["nhiemVu"], ma)
            self.assertEqual(int(float(lua[2])), mong["thoiDiem"] // 1000, ma)
            self.assertEqual(int(float(lua[3])), mong.get("soQuay", -1), ma)
            self.assertEqual(lua[4], mong.get("thietBi", ""), ma)
        self.assertGreaterEqual(so_hop_le, 200)


    def test_ma_thiet_bi_theo_ip_va_bit32_that(self):
        than = """
ra("co_bit32", tostring(type(bit32) == "table" and bit32.rrotate ~= nil))
local p = mo({ ten = "Tester", gio_may = %d, ip = "14.232.7.9" })
ra("tb", p.api.MaThietBi(), p.gui:FindFirstChildDeep("MaThietBi").Text)
local p2 = mo({ ten = "Tester", gio_may = %d, ip_theo_url = { ["https://v4.ident.me"] = " 014.232.007.009 " } })
ra("du_phong", p2.api.MaThietBi())
local p3 = mo({ ten = "Tester", gio_may = %d, ip_loi = "offline" })
ra("mat_mang", tostring(p3.api.MaThietBi()), p3.gui:FindFirstChildDeep("MaThietBi").Text)
p.gui:FindFirstChildDeep("NutLayKey").MouseButton1Click:Fire()
ra("link", p.log.clipboard[1] or "")
""" % (NOW, NOW, NOW)
        kq = chay_luau(than)
        ma = k.ma_thiet_bi("ip:14.232.7.9")
        self.assertEqual(kq["co_bit32"], ["true"], "Luau thật phải có bit32 (nhánh Roblox dùng)")
        self.assertEqual(kq["tb"][0], ma)
        self.assertNotIn(ma, kq["tb"][1], "Không hiện mã thiết bị trong game")
        self.assertIn("đã nhận", kq["tb"][1])
        self.assertEqual(kq["du_phong"], [ma])
        self.assertEqual(kq["mat_mang"][0], "nil")
        self.assertIn("chưa lấy được", kq["mat_mang"][1])
        self.assertEqual(kq["link"], ["https://mncuadaigmailcom.github.io/taodepzai/?ten=Tester"])

    def test_key_mang_khac_trong_luau(self):
        t = (NOW - 60) * 1000
        ma = tao_v4([["Tester", "nv4", t, 5, k.ma_thiet_bi("ip:14.232.7.9")]])[0]
        than = f"""
do local n, tt = thu({chuoi_luau(ma)}) ra("khac", n, tt) end
do local n, tt = thu({chuoi_luau(ma)}, {{ ten = "Tester", gio_may = {NOW}, ip = "14.232.7.9" }}) ra("dung", n, tt) end
"""
        kq = chay_luau(than)
        self.assertEqual(kq["khac"][0], "0")
        self.assertIn("IP không khớp", kq["khac"][1])
        self.assertEqual(kq["dung"][0], "1")


if __name__ == "__main__":
    unittest.main(verbosity=2)
