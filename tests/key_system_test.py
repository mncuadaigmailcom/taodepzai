#!/usr/bin/env python3
"""Test key-system.lua trong môi trường Roblox giả lập (Lua 5.1 qua lupa).

Cài: pip install lupa   (cần thêm Node.js để đối chiếu với index.html)
Chạy: python3 tests/key_system_test.py
"""
import base64
import datetime
import hashlib
import hmac
import json
import os
import pathlib
import random
import shutil
import subprocess
import unittest

from lupa import lua51

GOC = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = (GOC / "key-system.lua").read_text(encoding="utf-8")
MOCK = (GOC / "tests" / "roblox_mock.lua").read_text(encoding="utf-8")
SCRIPT_V2 = SCRIPT  # mặc định nhận cả key Free_v2_ (trang web bản cũ)
SCRIPT_KHONG_V2 = SCRIPT.replace("CHAP_NHAN_KEY_V2   = true", "CHAP_NHAN_KEY_V2   = false")
assert SCRIPT_KHONG_V2 != SCRIPT
SCRIPT_KHONG_TB = SCRIPT  # mặc định: không bắt cùng mạng (đổi mạng vẫn dùng key được)
assert "KIEM_TRA_THIET_BI  = false," in SCRIPT
SCRIPT_KIEM_TRA_MANG = SCRIPT.replace("KIEM_TRA_THIET_BI  = false,", "KIEM_TRA_THIET_BI  = true,")
URL = "https://mncuadaigmailcom.github.io/aiaiaitao2/script.js"
NGAY = 24 * 60 * 60
BAY_GIO = 1790000000  # giây, UTC (giờ "hiện tại" giả lập)
CO_NODE = shutil.which("node") is not None

# ---- Bản Python của mã hoá v4 (hashlib/hmac, độc lập với SHA-256 tự viết trong Lua/JS) ----
BI_MAT_V4 = b"z!V~~RO3mS2dCMvW-GE@#v2XYYuLsNoQKS5U0pGeAY5EOkd_"
BANG_TB = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
PREFIX = "Free_v4_"


def _b64(ds):
    return base64.urlsafe_b64encode(bytes(ds)).decode().rstrip("=")


def _json(ten, nhiem_vu, thoi_diem_ms):
    return json.dumps([ten.strip(), nhiem_vu, thoi_diem_ms], ensure_ascii=False,
                      separators=(",", ":")).encode("utf-8")


def _lay_bit(ds, tu, so):
    v = 0
    for i in range(tu, tu + so):
        v = v * 2 + (ds[i // 8] >> (7 - i % 8) & 1)
    return v


def ky_tu_kiem_tra(than):
    h = hashlib.sha256(("taodepzai|kiem-tra|" + than).encode()).digest()
    return BANG_TB[_lay_bit(h, 0, 5)] + BANG_TB[_lay_bit(h, 5, 5)]


def than_thiet_bi(ma_goc):
    h = hashlib.sha256(("taodepzai|thiet-bi|" + ma_goc).encode()).digest()
    return "".join(BANG_TB[_lay_bit(h, i * 5, 5)] for i in range(10))


def ma_thiet_bi(ma_goc):
    """Mã XXXX-XXXX-XXXX mà script hiển thị cho máy có mã gốc ma_goc."""
    d = than_thiet_bi(ma_goc)
    d += ky_tu_kiem_tra(d)
    return f"{d[:4]}-{d[4:8]}-{d[8:]}"


IP = "113.161.10.20"  # IP mạng mặc định của mock (tests/roblox_mock.lua)
GOC_TB = "ip:" + IP
THAN_TB = than_thiet_bi(GOC_TB)
MA_TB = ma_thiet_bi(GOC_TB)


def ngay_gio_utc(ms):
    """ms -> 'YYYY-MM-DD HH:MM:SS.mmm' (UTC). Dùng lịch Gregory đếm ngày (datetime chỉ tới năm 9999)."""
    giay, phan_ms = divmod(ms, 1000)
    ngay, trong_ngay = divmod(giay, 86400)
    d = datetime.date(1970, 1, 1).toordinal() + ngay
    if d <= datetime.date.max.toordinal():
        dd = datetime.date.fromordinal(d)
        nam, thang, ngay_thang = dd.year, dd.month, dd.day
    else:  # sau năm 9999: đếm tiếp theo chu kỳ 400 năm = 146097 ngày
        chu_ky, du = divmod(d - datetime.date(2000, 1, 1).toordinal(), 146097)
        dd = datetime.date(2000, 1, 1) + datetime.timedelta(days=du)
        nam, thang, ngay_thang = dd.year + 400 * chu_ky, dd.month, dd.day
    return (f"{nam:04d}-{thang:02d}-{ngay_thang:02d} {trong_ngay // 3600:02d}:{trong_ngay % 3600 // 60:02d}:"
            f"{trong_ngay % 60:02d}.{phan_ms:03d}")


def chuoi_tron(ban_ro):
    """'tdz4|tron|' + mã mạng + '|' + tên + '|' + ngày giờ ms UTC + '|' + số quay (3 chữ số)."""
    ban_ro = bytes(ban_ro)
    so_quay = ban_ro[1] * 256 + ban_ro[2]
    ms = int.from_bytes(ban_ro[3:9], "big")
    return (b"tdz4|tron|" + ban_ro[10:20] + b"|" + ban_ro[20:] + b"|"
            + f"{ngay_gio_utc(ms)}|{so_quay:03d}".encode())


def tag_v4(nonce, ban_ro):
    khoa_con = hmac.new(BI_MAT_V4, chuoi_tron(ban_ro), hashlib.sha256).digest()
    return hmac.new(khoa_con, b"tdz4|tag|" + bytes(nonce) + bytes(ban_ro), hashlib.sha256).digest()[:16]


def ma_v4_tu_ban_ro(ban_ro, nonce=b"\x07" * 12):
    """Mã hoá bản rõ bất kỳ đúng chuẩn v4 (tag hợp lệ) -> dùng để thử bản rõ sai định dạng."""
    ban_ro, nonce = bytes(ban_ro), bytes(nonce)
    tag = tag_v4(nonce, ban_ro)
    khoa = hmac.new(BI_MAT_V4, b"tdz4|enc|" + nonce + tag, hashlib.sha256).digest()
    dong = b"".join(hashlib.sha256(khoa + bytes([j])).digest() for j in range((len(ban_ro) + 31) // 32))
    return PREFIX + _b64(nonce + tag + bytes(b ^ k for b, k in zip(ban_ro, dong)))


def ban_ro_v4(ten, nhiem_vu, thoi_diem_ms, so_quay, than_tb, phien_ban=4):
    return (bytes([phien_ban, so_quay >> 8, so_quay & 255]) + thoi_diem_ms.to_bytes(6, "big")
            + bytes([int(nhiem_vu[2:])]) + than_tb.encode() + ten.strip().encode("utf-8"))


def nonce_mac_dinh(*gia_tri):
    return hashlib.sha256(repr(gia_tri).encode()).digest()[:16]


def tao_ma_v4(ten, nhiem_vu="nv4", thoi_diem_ms=None, so_quay=472, thiet_bi=THAN_TB, nonce=None):
    """Key Free_v4_ (bản cũ, trang main đang chạy). thiet_bi = 10 ký tự thân của mã thiết bị."""
    if thoi_diem_ms is None:
        thoi_diem_ms = (BAY_GIO - 60) * 1000
    if nonce is None:
        nonce = nonce_mac_dinh(ten, nhiem_vu, thoi_diem_ms, so_quay, thiet_bi)[:12]
    return ma_v4_tu_ban_ro(ban_ro_v4(ten, nhiem_vu, thoi_diem_ms, so_quay, thiet_bi), nonce)


PREFIX_V5 = "Free_v5_"


def chuoi_tron5(ban_ro):
    """'tdz5|tron|' + mã mạng + '|' + tên + '|' + ngày giờ ms UTC + '|' + số quay + '|' + cờ tên từ Roblox."""
    ban_ro = bytes(ban_ro)
    so_quay = ban_ro[2] * 256 + ban_ro[3]
    ms = int.from_bytes(ban_ro[4:10], "big")
    return (b"tdz5|tron|" + ban_ro[11:21] + b"|" + ban_ro[21:] + b"|"
            + f"{ngay_gio_utc(ms)}|{so_quay:03d}|{ban_ro[1]}".encode())


def tag_v5(nonce, ban_ro):
    khoa_con = hmac.new(BI_MAT_V4, chuoi_tron5(ban_ro), hashlib.sha256).digest()
    return hmac.new(khoa_con, b"tdz5|tag|" + bytes(nonce) + bytes(ban_ro), hashlib.sha256).digest()


def ma_v5_tu_ban_ro(ban_ro, nonce=b"\x07" * 16, tag=None):
    """Mã hoá bản rõ bất kỳ theo chuẩn v5 (nonce 16, tag 32 byte)."""
    ban_ro, nonce = bytes(ban_ro), bytes(nonce)
    tag = tag or tag_v5(nonce, ban_ro)
    khoa = hmac.new(BI_MAT_V4, b"tdz5|enc|" + nonce + tag, hashlib.sha256).digest()
    dong = b"".join(hashlib.sha256(khoa + bytes([j])).digest() for j in range((len(ban_ro) + 31) // 32))
    return PREFIX_V5 + _b64(nonce + tag + bytes(b ^ k for b, k in zip(ban_ro, dong)))


def ban_ro_v5(ten, nhiem_vu, thoi_diem_ms, so_quay, than_tb, tu_roblox=0, phien_ban=5):
    return (bytes([phien_ban, tu_roblox, so_quay >> 8, so_quay & 255]) + thoi_diem_ms.to_bytes(6, "big")
            + bytes([int(nhiem_vu[2:])]) + than_tb.encode() + ten.strip().encode("utf-8"))


def tao_ma(ten, nhiem_vu="nv4", thoi_diem_ms=None, so_quay=472, thiet_bi=THAN_TB, nonce=None, tu_roblox=False):
    """Bản Python của taoMaDemo (Free_v5_) trong index.html. thiet_bi = 10 ký tự thân của mã thiết bị."""
    if thoi_diem_ms is None:
        thoi_diem_ms = (BAY_GIO - 60) * 1000
    if nonce is None:
        nonce = hashlib.sha256(repr((ten, nhiem_vu, thoi_diem_ms, so_quay, thiet_bi, 5)).encode()).digest()[:16]
    return ma_v5_tu_ban_ro(ban_ro_v5(ten, nhiem_vu, thoi_diem_ms, so_quay, thiet_bi, 1 if tu_roblox else 0), nonce)


def _dong_ten(nonce, tag, dai):
    khoa = hmac.new(BI_MAT_V4, b"tdz4|ten|enc|" + nonce + tag, hashlib.sha256).digest()
    return b"".join(hashlib.sha256(khoa + bytes([j])).digest() for j in range((dai + 31) // 32))


def tao_ma_ten(ten, nonce, tag_gia=None):
    """Bản Python của MaHoaTen (key-system.lua): tên người chơi mã hoá cho link ?mahoa=. tag_gia: giả mạo (test)."""
    ban, nonce = ten.encode("utf-8"), bytes(nonce)
    tag = tag_gia or hmac.new(BI_MAT_V4, b"tdz4|ten|tag|" + nonce + ban, hashlib.sha256).digest()[:12]
    return _b64(nonce + tag + bytes(b ^ k for b, k in zip(ban, _dong_ten(nonce, tag, len(ban)))))


def giai_ma_ten(tk):
    try:
        raw = base64.urlsafe_b64decode(tk + "=" * (-len(tk) % 4))
    except Exception:
        return None
    if len(raw) < 21 or _b64(raw) != tk:
        return None
    nonce, tag, ma = raw[:8], raw[8:20], raw[20:]
    ban = bytes(b ^ k for b, k in zip(ma, _dong_ten(nonce, tag, len(ma))))
    if not hmac.compare_digest(hmac.new(BI_MAT_V4, b"tdz4|ten|tag|" + nonce + ban, hashlib.sha256).digest()[:12], tag):
        return None
    return ban.decode("utf-8")


def tao_ma_v2(ten, nhiem_vu="nv4", thoi_diem_ms=None):
    """Mã v2 cũ (XOR theo vị trí)."""
    if thoi_diem_ms is None:
        thoi_diem_ms = (BAY_GIO - 60) * 1000
    du_lieu = _json(ten, nhiem_vu, thoi_diem_ms)
    return "Free_v2_" + _b64(b ^ ((i * 73 + 0xA5) & 255) for i, b in enumerate(du_lieu))


NODE_TAO_MA = r"""
const fs = require('fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const dau = html.indexOf('// === MÃ HOÁ V4 BẮT ĐẦU ==='), cuoi = html.indexOf('// === MÃ HOÁ V4 KẾT THÚC ===');
if (dau < 0 || cuoi < 0) throw new Error('Không thấy khối mã hoá v4 trong index.html');
const taoMaDemo = new Function(html.slice(dau, cuoi) + 'return taoMaDemo;')();
const cases = JSON.parse(fs.readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([ten, id, time, so, tb, nonce, tuRoblox]) =>
    taoMaDemo(ten, { id, time }, so, tb, [...Buffer.from(nonce, 'hex')], !!tuRoblox))));
"""


def tao_ma_bang_index_html(cac_truong_hop):
    """Chạy đúng hàm taoMaDemo lấy từ index.html bằng Node.
    Mỗi trường hợp: [tên, nhiệm vụ, thời điểm ms, số quay, mã thiết bị, nonce hex (32 ký tự), cờ tên từ Roblox?]."""
    kq = subprocess.run(["node", "-e", NODE_TAO_MA, str(GOC / "index.html")],
                        input=json.dumps(cac_truong_hop), capture_output=True, text=True, check=True,
                        env={**os.environ, "TZ": "Asia/Ho_Chi_Minh"})  # giờ VN: bắt lỗi dùng giờ máy thay vì UTC
    return json.loads(kq.stdout)


def giai_ma_bang_tool_js(cac_ma):
    code = ("const {giaiMaDemo}=require(process.argv[1]);"
            "const ds=JSON.parse(require('fs').readFileSync(0,'utf8'));"
            "console.log(JSON.stringify(ds.map(m=>{try{return giaiMaDemo(m)}catch{return null}})))")
    kq = subprocess.run(["node", "-e", code, str(GOC / "tools" / "decode-demo.cjs")],
                        input=json.dumps(cac_ma), capture_output=True, text=True, check=True)
    return json.loads(kq.stdout)


def PhienMang(**tuy_chon):
    """Phiên với KIEM_TRA_THIET_BI = true (bắt cùng IP mạng)."""
    tuy_chon.setdefault("script", SCRIPT_KIEM_TRA_MANG)
    return Phien(**tuy_chon)


class Phien:
    """Một lần chạy key-system.lua trong executor giả."""

    def __init__(self, o_dia=None, khong_delfile=False, script=None, **tuy_chon):
        tuy_chon.setdefault("ten", "Tester")
        tuy_chon.setdefault("gio_may", BAY_GIO)
        self.lua = lua51.LuaRuntime(unpack_returned_tuples=True)
        if isinstance(tuy_chon.get("bit32"), dict):  # bit32 của Roblox là một bảng Lua
            tuy_chon["bit32"] = self.lua.table_from(tuy_chon["bit32"])
        tao = self.lua.execute(MOCK)
        self.env, self.log = tao(self.lua.table_from(tuy_chon))
        if o_dia is not None:  # "ổ đĩa" của executor, dùng chung giữa các lần chạy script
            self.env.isfile = lambda ten: ten in o_dia
            self.env.readfile = lambda ten: o_dia[ten]
            self.env.writefile = lambda ten, nd: o_dia.__setitem__(ten, nd)
            if not khong_delfile:
                self.env.delfile = lambda ten: o_dia.pop(ten)
        nap = self.lua.eval("function(src, env) local f, e = loadstring(src, '=key-system.lua') "
                            "if not f then error(e) end setfenv(f, env) return f end")
        self.nap = nap
        self.api = nap(script or SCRIPT, self.env)()
        self.gui = self._tim_gui()

    def _tim_gui(self):
        for noi in (self.log.hui, self.log.coreGui, self.log.playerGui):
            g = noi.FindFirstChild(noi, "Taodepzai_KeySystem")
            if g is not None:
                return g
        return None

    def cung(self, a, b):
        return bool(self.lua.globals().rawequal(a, b))

    def phan_tu(self, ten):
        return self.gui.FindFirstChildDeep(self.gui, ten)

    def nhap(self, key):
        self.phan_tu("OKey").Text = key

    def bam(self, ten="NutXacNhan"):
        nut = self.phan_tu(ten)
        nut.MouseButton1Click.Fire(nut.MouseButton1Click)

    def thu_key(self, key):
        self.nhap(key)
        self.bam()
        return self

    @property
    def o_key(self):
        return self.phan_tu("OKey").Text

    def tua(self, giay):
        self.log.tien_gio(giay)

    def enter(self, nhan_enter=True):
        o = self.phan_tu("OKey")
        o.FocusLost.Fire(o.FocusLost, nhan_enter)

    def giai_ma(self, ma):
        t = self.api.GiaiMaKey(ma)
        if t is None:
            return None
        kq = {"ten": t.ten, "nhiemVu": t.nhiemVu, "thoiDiem": t.thoiDiem}
        if t.soQuay is not None:
            kq["soQuay"] = t.soQuay
        if t.thietBi is not None:
            kq["thietBi"] = t.thietBi
        if t.tuRoblox:
            kq["tuRoblox"] = True
        return kq

    @property
    def trang_thai(self):
        return self.phan_tu("TrangThai").Text

    @property
    def so_lan_chay(self):
        return self.env._G.DA_CHAY_SCRIPT_CHINH or 0

    @property
    def da_an_gui(self):
        return bool(self.gui._destroyed)

    def httpget(self):
        return list(self.log.httpget.values())


class GiaoDienTest(unittest.TestCase):
    def test_hien_gui_va_chua_chay_script(self):
        p = Phien()
        self.assertIsNotNone(p.gui, "Phải tạo ScreenGui nhập key")
        self.assertTrue(p.cung(p.gui.Parent, p.log.hui), "Ưu tiên đặt GUI vào gethui()")
        self.assertIn("Tester", p.phan_tu("MoTa").Text, "Phải cho biết cần tạo key bằng tên nào")
        self.assertFalse(p.da_an_gui)
        self.assertEqual(p.httpget(), [])
        self.assertEqual(p.so_lan_chay, 0)

    def test_key_dung_an_gui_va_chay_script(self):
        p = Phien().thu_key(tao_ma("Tester"))
        self.assertTrue(p.da_an_gui, "Key đúng thì phải ẩn giao diện key")
        self.assertEqual(p.httpget(), [URL])
        self.assertEqual(p.so_lan_chay, 1)

    def test_thong_bao_thoi_gian_con_lai(self):
        p = Phien(spawn_tre=True).thu_key(tao_ma("Tester", thoi_diem_ms=(BAY_GIO - 3600) * 1000))
        self.assertIn("Còn 23 giờ 0 phút", p.trang_thai)
        self.assertRegex(p.trang_thai, r"\d\d:\d\d ngày \d\d/\d\d/\d{4}")

    def test_nhan_enter_de_xac_nhan(self):
        p = Phien()
        p.nhap(tao_ma("Tester"))
        p.enter(False)
        self.assertEqual(p.so_lan_chay, 0)
        p.enter(True)
        self.assertEqual(p.so_lan_chay, 1)

    def test_bam_nhieu_lan_chi_chay_mot_lan(self):
        p = Phien(spawn_tre=True)
        p.nhap(tao_ma("Tester"))
        p.bam(); p.bam(); p.enter(True); p.bam("NutDong")
        self.assertEqual(p.phan_tu("NutXacNhan").Text, "Đang tải...")
        self.assertFalse(p.da_an_gui, "Đang tải thì nút X không được đóng bảng")
        p.log.chay_hang_doi()
        self.assertEqual(p.so_lan_chay, 1)
        self.assertEqual(len(p.httpget()), 1)
        self.assertTrue(p.da_an_gui)

    def test_loi_mang_giu_gui_de_thu_lai(self):
        p = Phien(http_loi="HTTP 404").thu_key(tao_ma("Tester"))
        self.assertFalse(p.da_an_gui)
        self.assertIn("Không tải được script", p.trang_thai)
        self.assertEqual(p.phan_tu("NutXacNhan").Text, "Xác nhận key")
        p.bam()
        self.assertEqual(len(p.httpget()), 2)

    def test_script_rong_hoac_loi_cu_phap(self):
        for nguon, thong_bao in (("", "rỗng"), ("  \n ", "rỗng"), ("local = = 1", "lỗi cú pháp")):
            with self.subTest(nguon=nguon):
                p = Phien(nguon=nguon).thu_key(tao_ma("Tester"))
                self.assertFalse(p.da_an_gui)
                self.assertIn(thong_bao, p.trang_thai)

    def test_khong_co_loadstring(self):
        p = Phien(khong_loadstring=True).thu_key(tao_ma("Tester"))
        self.assertFalse(p.da_an_gui)
        self.assertIn("loadstring", p.trang_thai)

    def test_script_chinh_loi_khi_chay_khong_lam_crash(self):
        p = Phien(nguon="error('boom')").thu_key(tao_ma("Tester"))
        self.assertTrue(p.da_an_gui)
        self.assertTrue(any("boom" in w for w in p.log.warn.values()))
        self.assertEqual(len(p.log.thong_bao), 1)

    def test_gui_bi_xoa_truoc_khi_script_chinh_chay(self):
        nguon = ("local g = gethui():FindFirstChild('Taodepzai_KeySystem') "
                 "_G.CON_GUI_KHI_CHAY = (g ~= nil)")
        p = Phien(nguon=nguon).thu_key(tao_ma("Tester"))
        self.assertFalse(p.env._G.CON_GUI_KHI_CHAY)

    def test_nut_lay_key_sao_chep_link(self):
        p = Phien()
        p.bam("NutLayKey")
        p.bam("NutLayKey")
        link = list(p.log.clipboard.values())[0]
        self.assertTrue(link.startswith("https://mncuadaigmailcom.github.io/taodepzai/?mahoa="))
        self.assertEqual(giai_ma_ten(link.split("?mahoa=")[1]), "Tester")

    def test_nhan_lay_key_2_lan_moi_sao_chep(self):
        p = Phien(ten="Tao_Dep_01")
        p.bam("NutLayKey")
        self.assertEqual(list(p.log.clipboard.values()), [], "Nhấn 1 lần chưa sao chép")
        self.assertIn("thêm 1 lần nữa", p.trang_thai)
        self.assertIn("Tao_Dep_01", p.phan_tu("MoTa").Text, "Chưa gửi tên mã hoá thì vẫn hiện tên")
        p.tua(4)  # quá 3 giây -> tính lại từ đầu
        p.bam("NutLayKey")
        self.assertEqual(list(p.log.clipboard.values()), [])
        p.tua(2)
        p.bam("NutLayKey")
        ds = list(p.log.clipboard.values())
        self.assertEqual(len(ds), 1)
        self.assertIn("tên đã mã hoá", p.trang_thai)
        self.assertNotIn("Tao_Dep_01", p.phan_tu("MoTa").Text, "Đã mã hoá tên -> ẩn tên trên bảng script")
        self.assertIn("đã mã hoá", p.phan_tu("MoTa").Text)
        self.assertNotIn("Tao_Dep_01", p.trang_thai)
        self.assertNotIn("Tao_Dep_01", ds[0], "Link không chứa tên dạng đọc được")
        self.assertNotIn("ten=", ds[0])
        # Nhấn tiếp 1 lần: phải nhấn đủ 2 lần mới sao chép lại; link mới khác (nonce ngẫu nhiên) nhưng cùng tên
        p.bam("NutLayKey")
        self.assertEqual(len(list(p.log.clipboard.values())), 1)
        p.bam("NutLayKey")
        ds = list(p.log.clipboard.values())
        self.assertEqual(len(ds), 2)
        self.assertNotEqual(ds[0], ds[1])
        self.assertEqual({giai_ma_ten(x.split("?mahoa=")[1]) for x in ds}, {"Tao_Dep_01"})
        self.assertEqual(p.so_lan_chay, 0, "Nút lấy key không chạy script")

    def test_nhan_2_lan_thu_tu_mo_trinh_duyet(self):
        for dv in ("GuiService", "BrowserService"):
            with self.subTest(dv=dv):
                p = Phien(mo_web=dv)
                p.bam("NutLayKey")
                self.assertEqual(list(p.log.mo_web.values()), [], "Nhấn 1 lần chưa mở")
                p.bam("NutLayKey")
                mo = list(p.log.mo_web.values())
                self.assertEqual(len(mo), 1)
                self.assertEqual(giai_ma_ten(mo[0].split("?mahoa=")[1]), "Tester")
                self.assertEqual(list(p.log.clipboard.values()), mo, "Vẫn sao chép link để dự phòng")
                self.assertIn("Đang mở trang lấy key", p.trang_thai)
        # Executor chặn (báo lỗi) hoặc không có dịch vụ -> chỉ sao chép, báo rõ
        for tc in ({"mo_web": "chan"}, {}):
            p = Phien(**tc)
            p.bam("NutLayKey")
            p.bam("NutLayKey")
            self.assertEqual(list(p.log.mo_web.values()), [])
            self.assertEqual(len(list(p.log.clipboard.values())), 1)
            self.assertIn("không cho tự mở web", p.trang_thai)
        # Tắt tự mở trong cấu hình
        p = Phien(mo_web="GuiService", script=SCRIPT.replace("TU_MO_TRINH_DUYET = true,", "TU_MO_TRINH_DUYET = false,"))
        p.bam("NutLayKey")
        p.bam("NutLayKey")
        self.assertEqual(list(p.log.mo_web.values()), [])

    def test_ma_hoa_ten_giong_python(self):
        p = Phien()
        for ten in ("Tester", "a", "x" * 20, "Nguyễn Văn 🎮", "y" * 40):
            with self.subTest(ten=ten):
                nonce = hashlib.sha256(ten.encode()).digest()[:8]
                tk = p.api.MaHoaTen(ten, p.lua.table_from(list(nonce)))
                self.assertEqual(tk, tao_ma_ten(ten, nonce))
                self.assertEqual(giai_ma_ten(tk), ten)
        tk = tao_ma_ten("Tester", b"\x01" * 8)
        for vt in (0, 10, len(tk) - 2):
            sai = tk[:vt] + ("A" if tk[vt] != "A" else "B") + tk[vt + 1:]
            self.assertIsNone(giai_ma_ten(sai))

    def test_nut_dong(self):
        p = Phien()
        p.bam("NutDong")
        self.assertTrue(p.da_an_gui)
        self.assertEqual(p.so_lan_chay, 0)

    def test_khong_co_gethui_dung_coregui(self):
        p = Phien(khong_gethui=True)
        self.assertTrue(p.cung(p.gui.Parent, p.log.coreGui))

    def test_chay_lai_khong_bi_chong_hai_bang(self):
        p = Phien()
        cu = p.gui
        p.nap(SCRIPT, p.env)()
        self.assertTrue(cu._destroyed)
        self.assertEqual(len(list(p.log.hui.GetChildren(p.log.hui).values())), 1)


class TenNguoiChoiTest(unittest.TestCase):
    def test_key_cua_nguoi_khac_bi_tu_choi(self):
        p = Phien(ten="Tester").thu_key(tao_ma("NguoiKhac"))
        self.assertFalse(p.da_an_gui)
        self.assertEqual(p.httpget(), [])
        self.assertIn("không phải của tài khoản Tester", p.trang_thai)
        self.assertIn('nhập đúng tên "Tester"', p.trang_thai)
        self.assertNotIn("NguoiKhac", p.trang_thai, "Không để lộ tên chủ key")
        p = Phien(ten="tao_123", ten_hien_thi="Tao Dep").thu_key(tao_ma("NguoiKhac"))
        self.assertIn('"tao_123" hoặc "Tao Dep"', p.trang_thai, "Gợi ý cả tên hiển thị")

    def test_ten_gan_giong_van_bi_tu_choi(self):
        for ten_key in ("Teste", "Tester1", "Test er", "Tëster", "Tester_", "xTester"):
            with self.subTest(ten_key=ten_key):
                self.assertEqual(Phien(ten="Tester").thu_key(tao_ma(ten_key)).so_lan_chay, 0)

    def test_ten_khong_phan_biet_hoa_thuong_va_bo_dau_at(self):
        for ten_key in ("tester", "TESTER", "TeStEr", "@Tester", " Tester "):
            with self.subTest(ten_key=ten_key):
                self.assertEqual(Phien(ten="Tester").thu_key(tao_ma(ten_key)).so_lan_chay, 1)

    def test_chap_nhan_ten_hien_thi(self):
        p = Phien(ten="tao_dep_zai_123", ten_hien_thi="Tao Dep Zai").thu_key(tao_ma("Tao Dep Zai"))
        self.assertEqual(p.so_lan_chay, 1)
        p = Phien(ten="tao_dep_zai_123", ten_hien_thi="Tao Dep Zai").thu_key(tao_ma("tao_dep_zai_123"))
        self.assertEqual(p.so_lan_chay, 1)

    def test_dan_key_kem_chu_thua(self):
        ma = tao_ma("Tester")
        for nhap in (f"  {ma}  \n", f"Key: {ma}", f"{ma} <- key cua minh"):
            with self.subTest(nhap=nhap):
                self.assertEqual(Phien().thu_key(nhap).so_lan_chay, 1)


class HanKeyTest(unittest.TestCase):
    def _thu(self, lech_giay, **tuy_chon):
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - lech_giay) * 1000)
        return Phien(**tuy_chon).thu_key(ma)

    def test_trong_han_24_gio(self):
        for lech in (0, 1, 3600, NGAY - 60, NGAY - 1):
            with self.subTest(lech=lech):
                self.assertEqual(self._thu(lech).so_lan_chay, 1)

    def test_qua_24_gio_het_han(self):
        for lech in (NGAY, NGAY + 1, 2 * NGAY, 365 * NGAY):
            with self.subTest(lech=lech):
                p = self._thu(lech)
                self.assertEqual(p.so_lan_chay, 0)
                self.assertFalse(p.da_an_gui)
                self.assertIn("hết hạn", p.trang_thai)

    def test_key_o_tuong_lai(self):
        self.assertEqual(self._thu(-4 * 60).so_lan_chay, 1, "Lệch giờ nhỏ vẫn cho qua")
        p = self._thu(-10 * 60)
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("tương lai", p.trang_thai)

    def test_uu_tien_gio_may_chu_khong_bi_chinh_dong_ho(self):
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - 2 * NGAY) * 1000)
        # Lùi đồng hồ máy về đúng lúc tạo key, nhưng giờ máy chủ vẫn là hiện tại -> hết hạn
        p = Phien(gio_may=BAY_GIO - 2 * NGAY + 10, gio_may_chu=BAY_GIO + 0.75).thu_key(ma)
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("hết hạn", p.trang_thai)
        p = Phien(gio_may=0, gio_may_chu=BAY_GIO + 0.75).thu_key(tao_ma("Tester"))
        self.assertEqual(p.so_lan_chay, 1)


FILE = "taodepzai_key_12345.txt"


class LuuKeyTest(unittest.TestCase):
    def test_key_dung_duoc_luu_va_tu_dien_lan_sau(self):
        o_dia = {}
        ma = tao_ma("Tester")
        p = Phien(o_dia=o_dia).thu_key(f"Key: {ma}  ")
        self.assertEqual(p.so_lan_chay, 1)
        self.assertEqual(o_dia, {FILE: ma}, "Chỉ lưu đúng phần key, mỗi tài khoản một file")

        p2 = Phien(o_dia=o_dia, gio_may=BAY_GIO + 3600)  # mở lại script sau 1 giờ
        self.assertEqual(p2.o_key, ma, "Key đã lưu phải tự điền vào ô nhập")
        self.assertIn("Đã điền key đã lưu", p2.trang_thai)
        self.assertIn("còn 22 giờ 59 phút", p2.trang_thai)
        self.assertEqual(p2.so_lan_chay, 0, "Điền sẵn nhưng chưa tự chạy")
        p2.bam()
        self.assertEqual(p2.so_lan_chay, 1)
        self.assertEqual(o_dia, {FILE: ma})

    def test_mo_lai_khi_da_het_han_thi_tu_xoa(self):
        o_dia = {}
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - 60) * 1000)
        Phien(o_dia=o_dia).thu_key(ma)
        self.assertIn(FILE, o_dia)
        p = Phien(o_dia=o_dia, gio_may=BAY_GIO - 60 + NGAY)  # đúng 24 giờ sau
        self.assertEqual(p.o_key, "", "Key hết hạn không được điền vào ô")
        self.assertEqual(o_dia, {}, "Key hết hạn phải bị xoá khỏi file")
        self.assertEqual(p.trang_thai, "")

    def test_het_han_trong_luc_bang_dang_mo(self):
        o_dia = {}
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - NGAY + 600) * 1000)  # còn 10 phút
        Phien(o_dia=o_dia).thu_key(ma)
        p = Phien(o_dia=o_dia)
        self.assertEqual(p.o_key, ma)
        p.tua(9 * 60)
        self.assertEqual(p.o_key, ma, "Chưa tới hạn thì chưa xoá")
        self.assertIn(FILE, o_dia)
        p.tua(2 * 60)
        self.assertEqual(p.o_key, "", "Hết 24 giờ phải tự xoá key trong ô")
        self.assertEqual(o_dia, {})
        self.assertIn("hết hạn 24 giờ và đã tự xoá", p.trang_thai)
        p.bam()
        self.assertEqual(p.so_lan_chay, 0)

    def test_hen_gio_chay_som_khong_xoa_key_con_han(self):
        # task.delay chạy sớm 5 phút so với giờ máy chủ -> chưa được xoá, phải hẹn lại
        o_dia = {}
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - NGAY + 600) * 1000)  # còn 10 phút
        Phien(o_dia=o_dia).thu_key(ma)
        p = Phien(o_dia=o_dia, delay_lech=-300)
        p.tua(6 * 60)
        self.assertEqual(p.o_key, ma)
        self.assertIn(FILE, o_dia)
        self.assertGreater(p.log.so_hen_gio(), 0, "Phải hẹn lại lần xoá")
        p.tua(5 * 60)
        self.assertEqual(p.o_key, "")
        self.assertEqual(o_dia, {})

    def test_het_han_sau_khi_script_da_chay(self):
        o_dia = {}
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - 60) * 1000)
        p = Phien(o_dia=o_dia).thu_key(ma)
        self.assertTrue(p.da_an_gui)
        p.tua(NGAY - 120)
        self.assertEqual(o_dia, {FILE: ma})
        p.tua(120)
        self.assertEqual(o_dia, {}, "Game vẫn chạy thì tới hạn cũng tự xoá file")

    def test_het_han_khong_xoa_chu_nguoi_dung_dang_go(self):
        o_dia = {}
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - NGAY + 60) * 1000)
        Phien(o_dia=o_dia).thu_key(ma)
        p = Phien(o_dia=o_dia)
        p.nhap("dang go key moi")
        p.tua(120)
        self.assertEqual(p.o_key, "dang go key moi")
        self.assertEqual(o_dia, {})

    def test_key_moi_ghi_de_va_hen_gio_cu_khong_xoa_nham(self):
        o_dia = {}
        cu = tao_ma("Tester", "nv1", (BAY_GIO - NGAY + 60) * 1000)   # còn 1 phút
        moi = tao_ma("Tester", "nv2", (BAY_GIO - 30) * 1000)
        p = Phien(o_dia=o_dia, spawn_tre=True)
        p.thu_key(cu)
        p2 = Phien(o_dia=o_dia).thu_key(moi)
        self.assertEqual(o_dia, {FILE: moi})
        p.tua(120)
        p2.tua(120)
        self.assertEqual(o_dia, {FILE: moi}, "Hẹn giờ của key cũ không được xoá key mới")

    def test_key_sai_khong_ghi_de_key_da_luu(self):
        o_dia = {}
        ma = tao_ma("Tester")
        Phien(o_dia=o_dia).thu_key(ma)
        for sai in ("abc", tao_ma("NguoiKhac"), tao_ma("Tester", thoi_diem_ms=(BAY_GIO - 2 * NGAY) * 1000)):
            Phien(o_dia=o_dia).thu_key(sai)
        self.assertEqual(o_dia, {FILE: ma})

    def test_file_rac_hoac_bi_sua_thi_xoa(self):
        for noi_dung in ("rac", "Free_v2__abcdefghijklmn", tao_ma("NguoiKhac"), "   "):
            with self.subTest(noi_dung=noi_dung):
                o_dia = {FILE: noi_dung}
                p = Phien(o_dia=o_dia)
                self.assertEqual(p.o_key, "")
                self.assertNotIn(noi_dung.strip() or "x", p.o_key or "")
                if noi_dung.strip():
                    self.assertEqual(o_dia, {})

    def test_moi_tai_khoan_mot_file(self):
        o_dia = {}
        Phien(o_dia=o_dia, ten="Tester", user_id=1).thu_key(tao_ma("Tester"))
        Phien(o_dia=o_dia, ten="BanKhac", user_id=2).thu_key(tao_ma("BanKhac"))
        self.assertEqual(set(o_dia), {"taodepzai_key_1.txt", "taodepzai_key_2.txt"})
        p = Phien(o_dia=o_dia, ten="BanKhac", user_id=2)
        self.assertEqual(p.o_key, o_dia["taodepzai_key_2.txt"])
        self.assertEqual(len(o_dia), 2, "Không xoá key của tài khoản khác")

    def test_executor_khong_ho_tro_file(self):
        p = Phien().thu_key(tao_ma("Tester"))  # không có writefile/readfile
        self.assertEqual(p.so_lan_chay, 1)
        p.tua(2 * NGAY)  # hẹn giờ xoá chạy mà không lỗi

    def test_khong_co_delfile_thi_ghi_rong(self):
        o_dia = {}
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - 60) * 1000)
        Phien(o_dia=o_dia, khong_delfile=True).thu_key(ma)
        p = Phien(o_dia=o_dia, khong_delfile=True, gio_may=BAY_GIO + NGAY)
        self.assertEqual(o_dia, {FILE: ""})
        self.assertEqual(p.o_key, "")

    def test_gio_may_chu_quyet_dinh_han_key_da_luu(self):
        o_dia = {}
        ma = tao_ma("Tester", thoi_diem_ms=(BAY_GIO - 60) * 1000)
        Phien(o_dia=o_dia).thu_key(ma)
        # Lùi đồng hồ máy cũng không giữ được key đã quá hạn theo giờ máy chủ
        p = Phien(o_dia=o_dia, gio_may=BAY_GIO, gio_may_chu=BAY_GIO + 2 * NGAY)
        self.assertEqual(p.o_key, "")
        self.assertEqual(o_dia, {})

    def test_tat_luu_key(self):
        global SCRIPT
        goc = SCRIPT
        try:
            SCRIPT = goc.replace("LUU_KEY            = true", "LUU_KEY            = false")
            o_dia = {}
            Phien(o_dia=o_dia).thu_key(tao_ma("Tester"))
            self.assertEqual(o_dia, {})
            o_dia[FILE] = tao_ma("Tester")
            self.assertEqual(Phien(o_dia=o_dia).o_key, "")
        finally:
            SCRIPT = goc


class GiaiMaTest(unittest.TestCase):
    def test_key_sai_dinh_dang(self):
        for key in ("", "   ", "abc", "free_v2__abc", "FREE_V2__abc", "Free-v2__abc", "Free_v1__abcdefghij",
                    "Free_v2__abc", "Free_v2__abcdefghijklmnop", "Free_v2__" + "A" * 600):
            with self.subTest(key=key):
                p = Phien().thu_key(key)
                self.assertFalse(p.da_an_gui)
                self.assertEqual(p.httpget(), [])
                self.assertIn("✖", p.trang_thai)

    def test_key_bi_sua_mot_ky_tu(self):
        ma = tao_ma("Tester")
        bang = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        p = Phien()
        for vt in range(len(PREFIX), len(ma)):
            for doi in (1, 17, 40):
                moi = ma[:vt] + bang[(bang.index(ma[vt]) + doi) % 64] + ma[vt + 1:]
                self.assertIsNone(p.giai_ma(moi), f"Sửa ký tự {vt} phải bị mã kiểm tra phát hiện")
        self.assertEqual(Phien().thu_key(ma[:-3]).so_lan_chay, 0, "Thiếu ký tự phải bị từ chối")
        self.assertEqual(Phien().thu_key(ma + "AAAA").so_lan_chay, 0, "Thừa ký tự phải bị từ chối")

    def test_base64_khong_chuan_bi_tu_choi(self):
        bang = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
        dem = 0
        for ten in ("Tester", "tester1", "TESTER22", "@Tester"):
            ma = tao_ma(ten)
            du = len(ma[len("Free_v2_"):]) % 4
            if du == 0:
                continue
            # Ký tự cuối có 2 hoặc 4 bit thừa luôn = 0; bật bit thừa thấp nhất -> cùng byte nhưng sai chuẩn
            moi = ma[:-1] + bang[bang.index(ma[-1]) + 1]
            with self.subTest(ma=moi):
                self.assertIsNone(Phien().giai_ma(moi))
                self.assertEqual(Phien().thu_key(moi).so_lan_chay, 0)
                dem += 1
        self.assertGreater(dem, 0)

    def test_utf8_sai_bi_tu_choi(self):
        ms = (BAY_GIO - 60) * 1000
        dau = ban_ro_v4("x", "nv1", ms, 5, THAN_TB)[:-1]  # bản rõ hợp lệ, bỏ tên
        self.assertEqual(Phien().thu_key(ma_v4_tu_ban_ro(dau + b"Tester")).so_lan_chay, 1)
        for ten_sai in (b"Tes\xc1\xb4er", b"Test\xed\xa0\x80er", b"Tester\xff", b"Tester\xe1\x80", b"\xf5\x80\x80\x80",
                        b"Tes\xe0\x80\xafter", b"Tes\xf0\x80\x80\xafter", b"\xf4\x90\x80\x80"):
            with self.subTest(ten=ten_sai):
                self.assertIsNone(Phien().giai_ma(ma_v4_tu_ban_ro(dau + ten_sai)))

    def test_gioi_han_32_ky_tu_nhu_trang_web(self):
        p = Phien()
        t = (BAY_GIO - 60) * 1000
        for ten, hop_le in (("a" * 32, True), ("a" * 33, False), ("ễ" * 32, True), ("ễ" * 33, False),
                            ("🎮" * 16, True), ("🎮" * 16 + "a", False), ("中" * 32, True)):
            with self.subTest(ten=ten):
                kq = p.giai_ma(tao_ma(ten, "nv1", t))
                self.assertEqual(kq is not None, hop_le)

    def test_giai_ma_ten_dac_biet(self):
        p = Phien()
        for ten in ("Nguyễn Văn A", 'a"b\\c/d', "tab\there", "emoji 🎮🔥", "中文名", "x"):
            with self.subTest(ten=ten):
                self.assertEqual(p.giai_ma(tao_ma(ten, "nv2", 1790000000123, so_quay=7)),
                                 {"ten": ten, "nhiemVu": "nv2", "thoiDiem": 1790000000, "soQuay": 7, "thietBi": THAN_TB})

    def test_xor_bang_bit32_giong_ban_tu_viet(self):
        p1 = Phien(script=SCRIPT_V2)
        p2 = Phien(script=SCRIPT_V2, bit32={"bxor": lambda a, b: int(a) ^ int(b)})
        ma = tao_ma_v2("Tester Nguyễn 🎮")
        self.assertIsNotNone(p1.giai_ma(ma))
        self.assertEqual(p1.giai_ma(ma), p2.giai_ma(ma))
        self.assertEqual(p2.thu_key(tao_ma_v2("Tester")).so_lan_chay, 1)

    def test_sha256_bang_bit32_giong_ban_tu_tinh(self):
        # Roblox dùng bit32 thật; Lua 5.1 dùng bảng tra -> hai nhánh phải cho cùng kết quả
        dem = {"n": 0}

        def goi(f):
            def g(*a):
                dem["n"] += 1
                return f(*(int(x) for x in a))
            return g
        bit32 = {"bxor": goi(lambda a, b: a ^ b), "band": goi(lambda a, b: a & b),
                 "rshift": goi(lambda a, n: a >> n),
                 "rrotate": goi(lambda a, n: ((a >> n) | (a << (32 - n))) & 0xFFFFFFFF)}
        p_bit = Phien(bit32=bit32, script=SCRIPT_KIEM_TRA_MANG)
        self.assertGreater(dem["n"], 1000, "Có bit32 thì phải dùng bit32")
        self.assertEqual(p_bit.api.MaThietBi(), MA_TB)
        p = Phien()
        for ten in ("Tester", "Nguyễn 🎮 " + "x" * 20):
            ma = tao_ma(ten, so_quay=999)
            self.assertEqual(p_bit.giai_ma(ma), p.giai_ma(ma))
            self.assertIsNotNone(p.giai_ma(ma))
        self.assertEqual(p_bit.thu_key(tao_ma("Tester")).so_lan_chay, 1)

    def test_ban_ro_sai_dinh_dang_bi_tu_choi_du_tag_dung(self):
        p = Phien()
        ms = (BAY_GIO - 60) * 1000
        self.assertIsNotNone(p.giai_ma(ma_v4_tu_ban_ro(ban_ro_v4("Tester", "nv1", ms, 999, THAN_TB))))
        sai = {
            "phiên bản 3": ban_ro_v4("Tester", "nv1", ms, 5, THAN_TB, phien_ban=3),
            "số quay 1000": ban_ro_v4("Tester", "nv1", ms, 1000, THAN_TB),
            "thời điểm 0": ban_ro_v4("Tester", "nv1", 0, 5, THAN_TB),
            "nhiệm vụ 0": ban_ro_v4("Tester", "nv0", ms, 5, THAN_TB),
            "nhiệm vụ 5": ban_ro_v4("Tester", "nv5", ms, 5, THAN_TB),
            "mã thiết bị chữ U": ban_ro_v4("Tester", "nv1", ms, 5, "UUUUUUUUUU"),
            "mã thiết bị chữ thường": ban_ro_v4("Tester", "nv1", ms, 5, THAN_TB.lower()),
            "tên rỗng": ban_ro_v4("Tester", "nv1", ms, 5, THAN_TB)[:20],
            "tên có khoảng trắng đầu": ban_ro_v4("x", "nv1", ms, 5, THAN_TB)[:20] + b" Tester",
            "tên có xuống dòng cuối": ban_ro_v4("x", "nv1", ms, 5, THAN_TB)[:20] + b"Tester\n",
            "thiếu byte": ban_ro_v4("x", "nv1", ms, 5, THAN_TB)[:15],
        }
        for ten, ban_ro in sai.items():
            with self.subTest(ten=ten):
                self.assertIsNone(p.giai_ma(ma_v4_tu_ban_ro(ban_ro)))

    def test_tag_sai_mot_byte_bi_tu_choi(self):
        # Tự dựng key: bản rõ đúng nhưng tag lệch đúng 1 byte (mã hoá bằng khoá của tag lệch)
        ban_ro = ban_ro_v4("Tester", "nv4", (BAY_GIO - 60) * 1000, 5, THAN_TB)
        nonce = b"\x09" * 12
        tag = tag_v4(nonce, ban_ro)
        p = Phien()
        for vt in (0, 7, 15):
            for doi in (1, 128):
                tag_sai = bytearray(tag)
                tag_sai[vt] ^= doi
                khoa = hmac.new(BI_MAT_V4, b"tdz4|enc|" + nonce + bytes(tag_sai), hashlib.sha256).digest()
                dong = hashlib.sha256(khoa + b"\0").digest() + hashlib.sha256(khoa + b"\1").digest()
                ma = PREFIX + _b64(nonce + bytes(tag_sai) + bytes(b ^ k for b, k in zip(ban_ro, dong)))
                with self.subTest(vt=vt, doi=doi):
                    self.assertIsNone(p.giai_ma(ma))
        self.assertIsNotNone(p.giai_ma(ma_v4_tu_ban_ro(ban_ro, nonce)))

    def test_so_quay_va_nonce(self):
        p = Phien()
        ms = (BAY_GIO - 60) * 1000
        for so in (0, 1, 99, 500, 998, 999):
            with self.subTest(so=so):
                self.assertEqual(p.giai_ma(tao_ma("Tester", thoi_diem_ms=ms, so_quay=so))["soQuay"], so)
        # Cùng tên + thời điểm + số quay nhưng nonce khác -> key khác hẳn, đều dùng được
        cac_ma = {tao_ma("Tester", so_quay=5, nonce=bytes([i % 256, i // 256]) + b"\0" * 14) for i in range(300)}
        self.assertEqual(len(cac_ma), 300)
        for ma in list(cac_ma)[:5]:
            self.assertEqual(Phien().thu_key(ma).so_lan_chay, 1)

    def test_moi_mili_giay_cho_key_khac_hoan_toan(self):
        p = Phien()
        goc = (BAY_GIO - 60) * 1000
        nonce = b"\x01" * 16
        cac_ma = []
        for lech in range(0, 2000, 37):  # cùng tên, cùng số quay, CÙNG nonce, chỉ khác mili-giây
            ma = tao_ma("Tester", thoi_diem_ms=goc + lech, so_quay=123, nonce=nonce)
            self.assertEqual(p.giai_ma(ma)["thoiDiem"], (goc + lech) // 1000)
            cac_ma.append(ma[len(PREFIX_V5) + 22:])  # bỏ phần nonce (16 byte ~ 22 ký tự)
        for a, b in zip(cac_ma, cac_ma[1:]):
            khac = sum(1 for x, y in zip(a, b) if x != y)
            self.assertGreater(khac, len(a) * 0.8, "Khác 1 mili-giây -> gần như toàn bộ key khác")

    def test_ten_khac_mot_ky_tu_key_khac_hoan_toan(self):
        a = tao_ma("Aester", so_quay=1, nonce=b"\x02" * 16)[len(PREFIX_V5) + 22:]
        b = tao_ma("Bester", so_quay=1, nonce=b"\x02" * 16)[len(PREFIX_V5) + 22:]
        khac = sum(1 for x, y in zip(a, b) if x != y)
        self.assertGreater(khac, len(a) * 0.8)

    def test_thoi_diem_bat_ky(self):
        p = Phien()
        ngau_nhien = random.Random(3)
        moc = [1, 86399999, 86400000, 951782400000, 4107542400000, 2 ** 48 - 1]
        moc += [ngau_nhien.randint(1, 7_258_118_400_000) for _ in range(150)]
        for ms in moc:
            self.assertEqual(p.giai_ma(tao_ma("x", "nv1", ms, so_quay=ms % 1000))["thoiDiem"], ms // 1000, ms)

    def test_mac_dinh_nhan_ca_key_v2_cua_trang_web_hien_tai(self):
        # Trang web đang chạy (nhánh main) vẫn tạo Free_v2_ -> key đúng phải được nhận
        self.assertEqual(Phien().thu_key(tao_ma_v2("Tester")).so_lan_chay, 1)
        self.assertEqual(Phien().thu_key(tao_ma("Tester")).so_lan_chay, 1)
        # ...nhưng key v2 vẫn phải đúng tên và còn hạn
        p = Phien().thu_key(tao_ma_v2("NguoiKhac"))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("không phải của tài khoản", p.trang_thai)
        p = Phien().thu_key(tao_ma_v2("Tester", thoi_diem_ms=(BAY_GIO - NGAY - 1) * 1000))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("hết hạn", p.trang_thai)
        o_dia = {}
        Phien(o_dia=o_dia).thu_key(tao_ma_v2("Tester"))
        self.assertEqual(Phien(o_dia=o_dia).o_key, tao_ma_v2("Tester"), "Key v2 cũng được lưu và tự điền")

    def test_tat_nhan_key_v2(self):
        p = Phien(script=SCRIPT_KHONG_V2).thu_key(tao_ma_v2("Tester"))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("cũ không còn dùng được", p.trang_thai)
        self.assertIn("Free_v5_", p.trang_thai)
        self.assertEqual(Phien(script=SCRIPT_KHONG_V2).thu_key(tao_ma("Tester")).so_lan_chay, 1)

    def test_key_v3_cu_khong_con_dung(self):
        p = Phien().thu_key("Free_v3_" + tao_ma("Tester")[len(PREFIX):])
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("Free_v3_ cũ không còn dùng được", p.trang_thai)


class ThietBiTest(unittest.TestCase):
    """Khi BẬT KIEM_TRA_THIET_BI: key phải tạo trên cùng IP mạng (script tự lấy IP lúc chơi)."""

    def test_tu_lay_ip_va_hien_ma_thiet_bi(self):
        p = PhienMang()
        self.assertEqual(p.api.MaThietBi(), MA_TB, "Lua và Python phải tính ra cùng mã từ cùng IP")
        self.assertRegex(MA_TB, r"^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$")
        self.assertIn("đã nhận", p.phan_tu("MaThietBi").Text)
        self.assertIs(p.phan_tu("MaThietBi").Visible, False, "Mã mạng lấy ngầm, dòng trạng thái mạng bị ẩn")
        self.assertNotIn(MA_TB, p.phan_tu("MaThietBi").Text, "Không hiện mã thiết bị trong game")
        self.assertNotIn(IP, p.phan_tu("MaThietBi").Text, "Không hiện IP thật")
        self.assertEqual(list(p.log.ip_get.values()), ["https://api.ipify.org"], "Nguồn đầu được thì dừng")
        p.thu_key(tao_ma("Tester"))
        self.assertEqual(p.so_lan_chay, 1)
        self.assertEqual(len(p.log.ip_get), 1, "IP khớp thì không lấy lại")
        self.assertEqual(p.httpget(), [URL])

    def test_key_tao_o_mang_khac_bi_tu_choi(self):
        than_khac = than_thiet_bi("ip:14.232.7.9")
        o_dia = {}
        p = PhienMang(o_dia=o_dia).thu_key(tao_ma("Tester", thiet_bi=than_khac))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertFalse(p.da_an_gui)
        self.assertIn("IP không khớp", p.trang_thai)
        self.assertNotIn(than_khac[:4], p.trang_thai, "Không lộ mã thiết bị trong key")
        self.assertEqual(o_dia, {}, "Key sai thiết bị không được lưu")
        self.assertEqual(len(p.log.ip_get), 2, "Không khớp thì lấy lại IP 1 lần (phòng khi vừa đổi mạng)")
        # Người ở đúng mạng đó thì dùng được
        self.assertEqual(PhienMang(ip="14.232.7.9").thu_key(tao_ma("Tester", thiet_bi=than_khac)).so_lan_chay, 1)

    def test_doi_mang_sau_khi_mo_script(self):
        # Mở script ở wifi, rồi chuyển 4G và lấy key trên 4G -> bấm xác nhận vẫn nhận (script lấy lại IP)
        p = PhienMang()
        p.log.doi_ip("14.232.7.9")
        p.thu_key(tao_ma("Tester", thiet_bi=than_thiet_bi("ip:14.232.7.9")))
        self.assertEqual(p.so_lan_chay, 1)

    def test_mat_mang_roi_co_lai(self):
        p = PhienMang(ip_loi="timeout")
        self.assertIn("chưa lấy được", p.phan_tu("MaThietBi").Text)
        self.assertEqual(len(p.log.ip_get), 3, "Thử đủ 3 nguồn")
        p.thu_key(tao_ma("Tester"))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("Không lấy được IP", p.trang_thai)
        self.assertEqual(p.httpget(), [], "Chưa kiểm tra được thì không tải script")
        p.log.mat_mang(None)
        p.bam()
        self.assertEqual(p.so_lan_chay, 1)

    def test_nguon_ip_du_phong_va_chuan_hoa(self):
        p = PhienMang(ip_theo_url={"https://api.ipify.org": "2402:800:6310::1",
                               "https://ipv4.icanhazip.com": " 113.161.010.020 \n"})
        self.assertEqual(p.api.MaThietBi(), MA_TB, "Bỏ IPv6, chuẩn hoá số 0 đầu giống trang web")
        self.assertEqual(PhienMang(ip_theo_url={"https://v4.ident.me": IP}).api.MaThietBi(), MA_TB)
        for sai in ("256.1.1.1", "1.2.3", "1.2.3.4.5", "abc", "", "1.2.3.4x", "1111.2.3.4"):
            with self.subTest(sai=sai):
                p = PhienMang(ip_theo_url={u: sai for u in ("https://api.ipify.org", "https://ipv4.icanhazip.com",
                                                        "https://v4.ident.me")})
                self.assertIsNone(p.api.MaThietBi())

    def test_key_da_luu_khi_o_mang_khac(self):
        o_dia = {}
        ma = tao_ma("Tester")
        PhienMang(o_dia=o_dia).thu_key(ma)
        self.assertEqual(o_dia, {FILE: ma})
        p = PhienMang(o_dia=o_dia, ip="14.232.7.9")  # mở lại ở mạng khác
        self.assertEqual(o_dia, {FILE: ma}, "Đổi mạng tạm thời không xoá key đã lưu")
        self.assertEqual(p.o_key, ma)
        self.assertIn("IP không khớp", p.trang_thai)
        p.bam()
        self.assertEqual(p.so_lan_chay, 0)
        p2 = PhienMang(o_dia=o_dia)  # về lại mạng cũ -> dùng tiếp
        self.assertIn("Đã điền key đã lưu", p2.trang_thai)
        self.assertEqual(p2.bam() or p2.so_lan_chay, 1)
        # Hết hạn thì vẫn xoá dù đang ở mạng khác
        p3 = PhienMang(o_dia=o_dia, ip="14.232.7.9", gio_may=BAY_GIO + NGAY)
        self.assertEqual(o_dia, {})
        self.assertEqual(p3.o_key, "")

    def test_mat_mang_khi_mo_lai_khong_xoa_key(self):
        o_dia = {}
        ma = tao_ma("Tester")
        PhienMang(o_dia=o_dia).thu_key(ma)
        p = PhienMang(o_dia=o_dia, ip_loi="offline")
        self.assertEqual(o_dia, {FILE: ma})
        self.assertIn("Không lấy được IP", p.trang_thai)

    def test_key_v2_khong_kiem_tra_ip(self):
        self.assertEqual(PhienMang(ip_loi="offline").thu_key(tao_ma_v2("Tester")).so_lan_chay, 1)

    def test_link_lay_key_kem_ten(self):
        p = PhienMang(ten="Tao_Dep_01")
        p.bam("NutLayKey")
        p.bam("NutLayKey")
        link = list(p.log.clipboard.values())[0]
        self.assertEqual(giai_ma_ten(link.split("?mahoa=")[1]), "Tao_Dep_01")
        p2 = PhienMang(khong_clipboard=True)
        p2.bam("NutLayKey")
        p2.bam("NutLayKey")
        self.assertIn("taodepzai/?mahoa=", p2.trang_thai)
        self.assertEqual(giai_ma_ten(p2.trang_thai.split("?mahoa=")[1]), "Tester")


class DoiMangTest(unittest.TestCase):
    """Mặc định: mã mạng + tên + ngày giờ ms chỉ để trộn mã hoá; lấy key xong đổi mạng vẫn xác nhận được."""

    MANG_KHAC = "14.232.7.9"

    def test_lay_key_roi_doi_sang_mang_khac_van_xac_nhan(self):
        ma = tao_ma("Tester", thiet_bi=than_thiet_bi("ip:" + self.MANG_KHAC))  # lấy key ở mạng khác
        p = Phien().thu_key(ma)
        self.assertEqual(p.so_lan_chay, 1)
        self.assertTrue(p.da_an_gui)
        self.assertEqual(p.httpget(), [URL])
        self.assertEqual(len(p.log.ip_get), 0, "Không bắt cùng mạng thì game không gọi dịch vụ IP")
        self.assertIsNone(p.api.MaThietBi())

    def test_mat_mang_ip_van_xac_nhan(self):
        for tuy_chon in ({"ip_loi": "offline"}, {"ip": self.MANG_KHAC}):
            with self.subTest(**tuy_chon):
                self.assertEqual(Phien(**tuy_chon).thu_key(tao_ma("Tester")).so_lan_chay, 1)

    def test_key_ma_mang_du_phong_cua_trang_web(self):
        # Trang web không lấy được IP -> dùng mã mạng dự phòng "ip:0.0.0.0"; key vẫn dùng được
        self.assertEqual(Phien().thu_key(tao_ma("Tester", thiet_bi=than_thiet_bi("ip:0.0.0.0"))).so_lan_chay, 1)

    def test_key_da_luu_doi_mang_van_tu_dien_va_chay(self):
        o_dia = {}
        ma = tao_ma("Tester")
        Phien(o_dia=o_dia).thu_key(ma)
        p = Phien(o_dia=o_dia, ip=self.MANG_KHAC)  # mở lại script ở mạng khác
        self.assertEqual(p.o_key, ma)
        self.assertIn("Đã điền key đã lưu", p.trang_thai)
        p.bam()
        self.assertEqual(p.so_lan_chay, 1)
        self.assertEqual(o_dia, {FILE: ma})

    def test_van_bat_ten_va_han(self):
        ma = tao_ma("Tester", thiet_bi=than_thiet_bi("ip:" + self.MANG_KHAC))
        self.assertEqual(Phien(ten="NguoiKhac").thu_key(ma).so_lan_chay, 0)
        self.assertEqual(Phien(gio_may=BAY_GIO + NGAY).thu_key(ma).so_lan_chay, 0)
        self.assertEqual(Phien().thu_key(tao_ma("NguoiKhac")).so_lan_chay, 0)

    def test_chuoi_tron_mang_ten_ngay_gio_ms(self):
        ms = (BAY_GIO - 60) * 1000 + 123
        ban_ro = ban_ro_v4("Tester", "nv4", ms, 7, THAN_TB)
        self.assertEqual(chuoi_tron(ban_ro), b"tdz4|tron|" + THAN_TB.encode() + b"|Tester|"
                         + ngay_gio_utc(ms).encode() + b"|007")
        self.assertEqual(ngay_gio_utc(ms), "2026-09-21 14:12:20.123")
        # Tag tính từ chuỗi trộn lệch 1 thứ (mã mạng / tên / 1 mili giây / số quay) -> key bị từ chối
        p = Phien()
        nonce = b"\x05" * 12
        def ma_voi_chuoi(chuoi):
            khoa_con = hmac.new(BI_MAT_V4, chuoi, hashlib.sha256).digest()
            tag = hmac.new(khoa_con, b"tdz4|tag|" + nonce + ban_ro, hashlib.sha256).digest()[:16]
            khoa = hmac.new(BI_MAT_V4, b"tdz4|enc|" + nonce + tag, hashlib.sha256).digest()
            dong = hashlib.sha256(khoa + b"\0").digest() + hashlib.sha256(khoa + b"\1").digest()
            return PREFIX + _b64(nonce + tag + bytes(b ^ k for b, k in zip(ban_ro, dong)))
        dung = chuoi_tron(ban_ro)
        self.assertIsNotNone(p.giai_ma(ma_voi_chuoi(dung)))
        lech = {
            "mã mạng": dung.replace(THAN_TB.encode(), than_thiet_bi("ip:" + self.MANG_KHAC).encode()),
            "tên": dung.replace(b"|Tester|", b"|tester|"),
            "1 mili giây": dung.replace(b".123|", b".124|"),
            "ngày": dung.replace(b"2026-09-21", b"2026-09-22"),
            "số quay": dung.replace(b"|007", b"|008"),
            "không có chuỗi trộn (bản cũ)": None,
        }
        for ten, chuoi in lech.items():
            with self.subTest(ten=ten):
                if chuoi is None:
                    tag = hmac.new(BI_MAT_V4, b"tdz4|tag|" + nonce + ban_ro, hashlib.sha256).digest()[:16]
                    khoa = hmac.new(BI_MAT_V4, b"tdz4|enc|" + nonce + tag, hashlib.sha256).digest()
                    dong = hashlib.sha256(khoa + b"\0").digest() + hashlib.sha256(khoa + b"\1").digest()
                    ma = PREFIX + _b64(nonce + tag + bytes(b ^ k for b, k in zip(ban_ro, dong)))
                else:
                    self.assertNotEqual(chuoi, dung)
                    ma = ma_voi_chuoi(chuoi)
                self.assertIsNone(p.giai_ma(ma))

    def test_ngay_gio_moi_moc_lich_giong_lua(self):
        # Lua tự tính lịch (NgayGioUtc): năm nhuận, thế kỷ, cuối ngày, sau năm 9999
        p = Phien()
        moc = [1, 999, 86_399_999, 951_782_399_999, 951_868_800_000, 1_709_251_199_999,
               4_107_542_399_999, 4_107_542_400_000, 253_402_300_799_999, 253_402_300_800_000,
               2 ** 48 - 1, (BAY_GIO - 60) * 1000]
        for ms in moc:
            with self.subTest(ms=ms):
                kq = p.giai_ma(tao_ma("Tester", thoi_diem_ms=ms))
                self.assertIsNotNone(kq, ngay_gio_utc(ms))
                self.assertEqual(kq["thoiDiem"], ms // 1000)
        self.assertEqual(ngay_gio_utc(951_782_399_999), "2000-02-28 23:59:59.999")
        self.assertEqual(ngay_gio_utc(951_868_800_000), "2000-03-01 00:00:00.000")
        self.assertEqual(ngay_gio_utc(1_709_251_199_999), "2024-02-29 23:59:59.999")
        self.assertEqual(ngay_gio_utc(4_107_542_399_999), "2100-02-28 23:59:59.999")
        self.assertEqual(ngay_gio_utc(4_107_542_400_000), "2100-03-01 00:00:00.000")
        self.assertEqual(ngay_gio_utc(2 ** 48 - 1), "10889-08-02 05:31:50.655")
        self.assertEqual(ngay_gio_utc(253_402_300_800_000), "10000-01-01 00:00:00.000")

    def test_tat_kiem_tra_thiet_bi(self):
        ma = tao_ma("Tester", thiet_bi=than_thiet_bi("ip:14.232.7.9"))
        self.assertEqual(Phien(script=SCRIPT_KHONG_TB).thu_key(ma).so_lan_chay, 1)
        self.assertEqual(PhienMang().thu_key(ma).so_lan_chay, 0, "Bật KIEM_TRA_THIET_BI thì bắt cùng mạng")


SCRIPT_KHONG_V4 = SCRIPT.replace("CHAP_NHAN_KEY_V4   = true,", "CHAP_NHAN_KEY_V4   = false,")
SCRIPT_CAN_TEN_ROBLOX = SCRIPT.replace("YEU_CAU_TEN_TU_ROBLOX = false,", "YEU_CAU_TEN_TU_ROBLOX = true,")


class PhienBan5Test(unittest.TestCase):
    def test_cau_hinh_mac_dinh(self):
        self.assertIn('KEY_PREFIX         = "Free_v5_"', SCRIPT)
        self.assertNotEqual(SCRIPT_KHONG_V4, SCRIPT)
        self.assertNotEqual(SCRIPT_CAN_TEN_ROBLOX, SCRIPT)
        self.assertIn("Free_v5_", Phien().phan_tu("OKey").PlaceholderText)

    def test_key_v5_dung_duoc_va_dai_hon_v4(self):
        ma5, ma4 = tao_ma("Tester"), tao_ma_v4("Tester")
        self.assertTrue(ma5.startswith("Free_v5_"))
        self.assertGreaterEqual(len(ma5), len(ma4) + 28, "v5: nonce 128 bit + tag 256 bit + cờ (thêm 21 byte)")
        for ma in (ma5, tao_ma("Tester", tu_roblox=True)):
            p = Phien().thu_key(ma)
            self.assertEqual(p.so_lan_chay, 1)
            self.assertTrue(p.da_an_gui)

    def test_key_v4_cu_van_nhan_hoac_tat(self):
        self.assertEqual(Phien().thu_key(tao_ma_v4("Tester")).so_lan_chay, 1, "Trang main đang chạy tạo v4")
        p = Phien(script=SCRIPT_KHONG_V4).thu_key(tao_ma_v4("Tester"))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("cũ không còn dùng được", p.trang_thai)
        self.assertIn("Free_v5_", p.trang_thai)
        self.assertEqual(Phien(script=SCRIPT_KHONG_V4).thu_key(tao_ma("Tester")).so_lan_chay, 1)

    def test_tag_du_256_bit(self):
        p = Phien()
        ban_ro = ban_ro_v5("Tester", "nv4", (BAY_GIO - 60) * 1000, 5, THAN_TB)
        nonce = b"\x09" * 16
        tag = tag_v5(nonce, ban_ro)
        self.assertEqual(len(tag), 32)
        self.assertIsNotNone(p.giai_ma(ma_v5_tu_ban_ro(ban_ro, nonce, tag)))
        for vt in (0, 15, 16, 24, 31):  # v4 chỉ kiểm 16 byte đầu; v5 kiểm đủ 32
            with self.subTest(vt=vt):
                sai = bytearray(tag)
                sai[vt] ^= 1
                self.assertIsNone(p.giai_ma(ma_v5_tu_ban_ro(ban_ro, nonce, bytes(sai))))

    def test_tron_lan_phien_ban_bi_tu_choi(self):
        p = Phien()
        ma5, ma4 = tao_ma("Tester"), tao_ma_v4("Tester")
        self.assertIsNone(p.giai_ma("Free_v4_" + ma5[8:]), "Thân v5 gắn nhãn v4")
        self.assertIsNone(p.giai_ma("Free_v5_" + ma4[8:]), "Thân v4 gắn nhãn v5")
        ms = (BAY_GIO - 60) * 1000
        self.assertIsNone(p.giai_ma(ma_v5_tu_ban_ro(ban_ro_v5("Tester", "nv4", ms, 5, THAN_TB, phien_ban=4))))
        for co in (2, 7, 255):
            self.assertIsNone(p.giai_ma(ma_v5_tu_ban_ro(ban_ro_v5("Tester", "nv4", ms, 5, THAN_TB, co))), co)
        # Đổi cờ nhưng giữ tag cũ -> tag sai (cờ nằm trong chuỗi trộn và bản rõ)
        nonce = b"\x03" * 16
        goc = ban_ro_v5("Tester", "nv4", ms, 5, THAN_TB, 0)
        doi = ban_ro_v5("Tester", "nv4", ms, 5, THAN_TB, 1)
        self.assertIsNone(p.giai_ma(ma_v5_tu_ban_ro(doi, nonce, tag_v5(nonce, goc))))
        self.assertNotEqual(chuoi_tron5(goc), chuoi_tron5(doi))

    def test_yeu_cau_ten_tu_link_ma_hoa(self):
        p = Phien(script=SCRIPT_CAN_TEN_ROBLOX).thu_key(tao_ma("Tester"))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("tên gõ tay", p.trang_thai)
        self.assertIn("Lấy key", p.trang_thai)
        self.assertEqual(Phien(script=SCRIPT_CAN_TEN_ROBLOX).thu_key(tao_ma_v4("Tester")).so_lan_chay, 0)
        self.assertEqual(Phien(script=SCRIPT_CAN_TEN_ROBLOX).thu_key(tao_ma("Tester", tu_roblox=True)).so_lan_chay, 1)
        # Mặc định (false): tên gõ tay vẫn được
        self.assertEqual(Phien().thu_key(tao_ma("Tester")).so_lan_chay, 1)

    def test_link_lay_key_co_duoi_mahoa(self):
        p = Phien(ten="Tao_Dep_01")
        p.bam("NutLayKey")
        p.bam("NutLayKey")
        link = list(p.log.clipboard.values())[0]
        self.assertRegex(link, r"^https://mncuadaigmailcom\.github\.io/taodepzai/\?mahoa=[A-Za-z0-9_-]{28,}$")
        self.assertEqual(giai_ma_ten(link.split("?mahoa=")[1]), "Tao_Dep_01")
        # LINK_LAY_KEY đã có "?" -> nối bằng "&mahoa="
        s = SCRIPT.replace('LINK_LAY_KEY = "https://mncuadaigmailcom.github.io/taodepzai/"',
                           'LINK_LAY_KEY = "https://vd.com/key?src=rb"')
        p2 = Phien(script=s)
        p2.bam("NutLayKey")
        p2.bam("NutLayKey")
        link2 = list(p2.log.clipboard.values())[0]
        self.assertTrue(link2.startswith("https://vd.com/key?src=rb&mahoa="), link2)


@unittest.skipUnless(CO_NODE, "Cần Node.js để đối chiếu với index.html")
class DoiChieuIndexHtmlTest(unittest.TestCase):
    def test_ma_tu_index_html_duoc_chap_nhan(self):
        ten_thu = ["Tester", "tester", "Người chơi 123 🎮", 'Tên "đặc biệt" \\ /', "a", " Tester  "]
        cases = []
        for i, ten in enumerate(ten_thu):
            for nv, so in (("nv1", 0), ("nv4", 999), ("nv2", 314)):
                cases.append([ten, nv, (BAY_GIO - 120) * 1000 + 7 + i, so, MA_TB.lower().replace("-", ""),
                              nonce_mac_dinh(ten, nv, so).hex(), so == 314])
        cac_ma = tao_ma_bang_index_html(cases)
        for (ten, nv, t, so, _tb, nonce, tu_roblox), ma in zip(cases, cac_ma):
            with self.subTest(ten=ten, nv=nv):
                self.assertEqual(ma, tao_ma(ten, nv, t, so, nonce=bytes.fromhex(nonce), tu_roblox=tu_roblox),
                                 "Bản Python phải giống index.html")
                self.assertTrue(ma.startswith("Free_v5_"))
                p = Phien(ten="Tester", ten_hien_thi=ten.strip())
                mong = {"ten": ten.strip(), "nhiemVu": nv, "thoiDiem": t // 1000, "soQuay": so, "thietBi": THAN_TB}
                if tu_roblox:
                    mong["tuRoblox"] = True
                self.assertEqual(p.giai_ma(ma), mong)
                self.assertEqual(p.thu_key(ma).so_lan_chay, 1)

    def test_ten_ma_hoa_tu_script_giai_duoc_bang_index_html(self):
        # Link "Lấy key" của script (Lua) -> hàm giaiMaTen thật trong index.html phải đọc ra đúng tên
        cac_tk, mong = [], []
        for ten in ("Tester", "Tao_Dep_01", "a", "abcdefghijklmnopqrst"):
            p = Phien(ten=ten)
            p.bam("NutLayKey")
            p.bam("NutLayKey")
            cac_tk.append(list(p.log.clipboard.values())[0].split("?mahoa=")[1])
            mong.append(ten)
        tk0 = cac_tk[0]
        cac_tk += [tk0[:12] + ("A" if tk0[12] != "A" else "B") + tk0[13:], tk0[:-1], "abc", tk0 + "A",
                   tao_ma_ten(" Tester", b"\x02" * 8), tao_ma_ten("x" * 33, b"\x03" * 8),
                   tao_ma_ten("Người chơi 🎮", b"\x04" * 8), tao_ma_ten("KeGiaMao", b"\x05" * 8, b"\x01" * 12)]
        mong += [None, None, None, None, None, None, "Người chơi 🎮", None]
        self.assertIsNone(giai_ma_ten(cac_tk[-1]))
        code = r"""
const fs = require('fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const dau = html.indexOf('// === MÃ HOÁ V4 BẮT ĐẦU ==='), cuoi = html.indexOf('// === MÃ HOÁ V4 KẾT THÚC ===');
const giaiMaTen = new Function(html.slice(dau, cuoi) + 'return giaiMaTen;')();
console.log(JSON.stringify(JSON.parse(fs.readFileSync(0, 'utf8')).map(giaiMaTen)));
"""
        kq = subprocess.run(["node", "-e", code, str(GOC / "index.html")], input=json.dumps(cac_tk),
                            capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(kq.stdout), mong)

    def test_ngay_gio_moi_moc_lich_giong_index_html(self):
        # Chuỗi trộn có ngày giờ ms: index.html (Date UTC), Python (lịch đếm ngày) và Lua phải ra cùng key
        ngau_nhien = random.Random(7)
        moc = [1, 999, 86_399_999, 951_782_399_999, 951_868_800_000, 1_709_251_199_999, 4_107_542_400_000,
               253_402_300_799_999, 253_402_300_800_000, 2 ** 48 - 1] + [ngau_nhien.randint(1, 2 ** 48 - 1)
                                                                         for _ in range(40)]
        cases = [["Tester", "nv3", ms, i % 1000, MA_TB, nonce_mac_dinh(ms).hex()] for i, ms in enumerate(moc)]
        p = Phien()
        for (ten, nv, ms, so, _tb, nonce), ma in zip(cases, tao_ma_bang_index_html(cases)):
            with self.subTest(ms=ms, ngay=ngay_gio_utc(ms)):
                self.assertEqual(ma, tao_ma(ten, nv, ms, so, nonce=bytes.fromhex(nonce)))
                self.assertEqual(p.giai_ma(ma)["thoiDiem"], ms // 1000)

    def test_giai_ma_giong_tools_decode_demo(self):
        ngau_nhien = random.Random(42)
        ky_tu = list("abcXYZ019 _-.'\"\\/đĐăâêôơưÁÀẢÃẠ中🎮\t")
        cac_ma = []
        for _ in range(250):
            ten = "".join(ngau_nhien.choice(ky_tu) for _ in range(ngau_nhien.randint(1, 34))).strip() or "x"
            than = THAN_TB if ngau_nhien.random() < 0.8 else than_thiet_bi(str(ngau_nhien.random()))
            ma = tao_ma(ten, ngau_nhien.choice(["nv1", "nv2", "nv3", "nv4"]), ngau_nhien.randint(1, 2 ** 48 - 1),
                        so_quay=ngau_nhien.randint(0, 999), thiet_bi=than, nonce=ngau_nhien.randbytes(16),
                        tu_roblox=ngau_nhien.random() < 0.5)
            r = ngau_nhien.random()
            if r < 0.1:
                ma = tao_ma_v4(ten, "nv2", ngau_nhien.randint(1, 2 ** 48 - 1), thiet_bi=than,
                               nonce=ngau_nhien.randbytes(12))
            elif r < 0.2:  # v5: bản rõ sai định dạng (cả cờ > 1) nhưng tag đúng
                ban_ro = bytearray(ban_ro_v5(ten, "nv1", 123456789, 5, than, 1))
                vt = ngau_nhien.choice([0, 1, ngau_nhien.randrange(len(ban_ro))])
                ban_ro[vt] = ngau_nhien.randrange(256)
                ma = ma_v5_tu_ban_ro(ban_ro, ngau_nhien.randbytes(16))
            elif r < 0.3:
                ma = tao_ma_v2(ten)
            elif r < 0.4:  # bản rõ sai định dạng nhưng tag đúng
                ban_ro = bytearray(ban_ro_v4(ten, "nv1", 123456789, 5, than))
                vt = ngau_nhien.randrange(len(ban_ro))
                ban_ro[vt] = ngau_nhien.randrange(256)
                ma = ma_v4_tu_ban_ro(ban_ro, ngau_nhien.randbytes(12))
            if ngau_nhien.random() < 0.3:  # sửa ngẫu nhiên một ký tự
                vt = ngau_nhien.randrange(9, len(ma))
                ma = ma[:vt] + ngau_nhien.choice("AbZ9-_") + ma[vt + 1:]
            cac_ma.append(ma)
        ket_qua_js = giai_ma_bang_tool_js(cac_ma)
        p = Phien(script=SCRIPT_V2)  # bật cả v2 để so sánh hai phiên bản
        so_hop_le = 0
        for ma, js in zip(cac_ma, ket_qua_js):
            lua = p.giai_ma(ma)
            if js is None:
                self.assertIsNone(lua, ma)  # JS từ chối -> Lua cũng phải từ chối
                continue
            so_hop_le += 1
            mong_doi = {"ten": js["ten"], "nhiemVu": js["nhiemVu"], "thoiDiem": js["thoiDiem"] // 1000}
            for k in ("soQuay", "thietBi"):
                if k in js:
                    mong_doi[k] = js[k]
            if js.get("tuRoblox"):
                mong_doi["tuRoblox"] = True
            self.assertEqual(lua, mong_doi, ma)
        self.assertGreater(so_hop_le, 80)

    def test_ma_thiet_bi_giong_node(self):
        goc = ["ip:113.161.10.20", "ip:1.2.3.4", "ip:255.255.255.255", "ip:0.0.0.0"]
        code = ("const t=require(process.argv[1]);const ds=JSON.parse(require('fs').readFileSync(0,'utf8'));"
                "console.log(JSON.stringify(ds.map(g=>[t.maThietBiTuGoc(g),t.chuanHoaMaThietBi(t.maThietBiTuGoc(g))])))")
        kq = json.loads(subprocess.run(["node", "-e", code, str(GOC / "tools" / "decode-demo.cjs")],
                                       input=json.dumps(goc), capture_output=True, text=True, check=True).stdout)
        for g, (ma, than) in zip(goc, kq):
            self.assertEqual(ma, ma_thiet_bi(g))
            self.assertEqual(than, than_thiet_bi(g))
            self.assertEqual(Phien(ip=g[3:], script=SCRIPT_KIEM_TRA_MANG).api.MaThietBi(), ma)


if __name__ == "__main__":
    unittest.main(verbosity=2)
