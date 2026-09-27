#!/usr/bin/env python3
"""Test key-system.lua trong môi trường Roblox giả lập (Lua 5.1 qua lupa).

Cài: pip install lupa   (cần thêm Node.js để đối chiếu với index.html)
Chạy: python3 tests/key_system_test.py
"""
import base64
import hashlib
import hmac
import json
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
SCRIPT_KHONG_TB = SCRIPT.replace("KIEM_TRA_THIET_BI  = true", "KIEM_TRA_THIET_BI  = false")
assert SCRIPT_KHONG_TB != SCRIPT
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


GOC_TB = "client:MOCK-CLIENT-0001"  # ClientId mặc định của mock
THAN_TB = than_thiet_bi(GOC_TB)
MA_TB = ma_thiet_bi(GOC_TB)


def ma_v4_tu_ban_ro(ban_ro, nonce=b"\x07" * 12):
    """Mã hoá bản rõ bất kỳ đúng chuẩn v4 (tag hợp lệ) -> dùng để thử bản rõ sai định dạng."""
    ban_ro, nonce = bytes(ban_ro), bytes(nonce)
    tag = hmac.new(BI_MAT_V4, b"tdz4|tag|" + nonce + ban_ro, hashlib.sha256).digest()[:16]
    khoa = hmac.new(BI_MAT_V4, b"tdz4|enc|" + nonce + tag, hashlib.sha256).digest()
    dong = b"".join(hashlib.sha256(khoa + bytes([j])).digest() for j in range((len(ban_ro) + 31) // 32))
    return PREFIX + _b64(nonce + tag + bytes(b ^ k for b, k in zip(ban_ro, dong)))


def ban_ro_v4(ten, nhiem_vu, thoi_diem_ms, so_quay, than_tb, phien_ban=4):
    return (bytes([phien_ban, so_quay >> 8, so_quay & 255]) + thoi_diem_ms.to_bytes(6, "big")
            + bytes([int(nhiem_vu[2:])]) + than_tb.encode() + ten.strip().encode("utf-8"))


def nonce_mac_dinh(*gia_tri):
    return hashlib.sha256(repr(gia_tri).encode()).digest()[:12]


def tao_ma(ten, nhiem_vu="nv4", thoi_diem_ms=None, so_quay=472, thiet_bi=THAN_TB, nonce=None):
    """Bản Python của taoMaDemo (v4) trong index.html. thiet_bi = 10 ký tự thân của mã thiết bị."""
    if thoi_diem_ms is None:
        thoi_diem_ms = (BAY_GIO - 60) * 1000
    if nonce is None:
        nonce = nonce_mac_dinh(ten, nhiem_vu, thoi_diem_ms, so_quay, thiet_bi)
    return ma_v4_tu_ban_ro(ban_ro_v4(ten, nhiem_vu, thoi_diem_ms, so_quay, thiet_bi), nonce)


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
console.log(JSON.stringify(cases.map(([ten, id, time, so, tb, nonce]) =>
    taoMaDemo(ten, { id, time }, so, tb, [...Buffer.from(nonce, 'hex')]))));
"""


def tao_ma_bang_index_html(cac_truong_hop):
    """Chạy đúng hàm taoMaDemo lấy từ index.html bằng Node.
    Mỗi trường hợp: [tên, nhiệm vụ, thời điểm ms, số quay, mã thiết bị, nonce hex (24 ký tự)]."""
    kq = subprocess.run(["node", "-e", NODE_TAO_MA, str(GOC / "index.html")],
                        input=json.dumps(cac_truong_hop), capture_output=True, text=True, check=True)
    return json.loads(kq.stdout)


def giai_ma_bang_tool_js(cac_ma):
    code = ("const {giaiMaDemo}=require(process.argv[1]);"
            "const ds=JSON.parse(require('fs').readFileSync(0,'utf8'));"
            "console.log(JSON.stringify(ds.map(m=>{try{return giaiMaDemo(m)}catch{return null}})))")
    kq = subprocess.run(["node", "-e", code, str(GOC / "tools" / "decode-demo.cjs")],
                        input=json.dumps(cac_ma), capture_output=True, text=True, check=True)
    return json.loads(kq.stdout)


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
        self.assertEqual(list(p.log.clipboard.values()),
                         [f"https://mncuadaigmailcom.github.io/taodepzai/?tb={MA_TB}&ten=Tester"])

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
        p_bit = Phien(bit32=bit32)
        self.assertGreater(dem["n"], 1000, "Có bit32 thì phải dùng bit32")
        self.assertEqual(p_bit.api.MaThietBi, MA_TB)
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
        tag = hmac.new(BI_MAT_V4, b"tdz4|tag|" + nonce + ban_ro, hashlib.sha256).digest()[:16]
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
        cac_ma = {tao_ma("Tester", so_quay=5, nonce=bytes([i % 256, i // 256]) + b"\0" * 10) for i in range(300)}
        self.assertEqual(len(cac_ma), 300)
        for ma in list(cac_ma)[:5]:
            self.assertEqual(Phien().thu_key(ma).so_lan_chay, 1)

    def test_moi_mili_giay_cho_key_khac_hoan_toan(self):
        p = Phien()
        goc = (BAY_GIO - 60) * 1000
        nonce = b"\x01" * 12
        cac_ma = []
        for lech in range(0, 2000, 37):  # cùng tên, cùng số quay, CÙNG nonce, chỉ khác mili-giây
            ma = tao_ma("Tester", thoi_diem_ms=goc + lech, so_quay=123, nonce=nonce)
            self.assertEqual(p.giai_ma(ma)["thoiDiem"], (goc + lech) // 1000)
            cac_ma.append(ma[len(PREFIX) + 16:])  # bỏ phần nonce (16 ký tự)
        for a, b in zip(cac_ma, cac_ma[1:]):
            khac = sum(1 for x, y in zip(a, b) if x != y)
            self.assertGreater(khac, len(a) * 0.8, "Khác 1 mili-giây -> gần như toàn bộ key khác")

    def test_ten_khac_mot_ky_tu_key_khac_hoan_toan(self):
        a = tao_ma("Aester", so_quay=1, nonce=b"\x02" * 12)[len(PREFIX) + 16:]
        b = tao_ma("Bester", so_quay=1, nonce=b"\x02" * 12)[len(PREFIX) + 16:]
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
        self.assertIn("Free_v4_", p.trang_thai)
        self.assertEqual(Phien(script=SCRIPT_KHONG_V2).thu_key(tao_ma("Tester")).so_lan_chay, 1)

    def test_key_v3_cu_khong_con_dung(self):
        p = Phien().thu_key("Free_v3_" + tao_ma("Tester")[len(PREFIX):])
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("Free_v3_ cũ không còn dùng được", p.trang_thai)


class ThietBiTest(unittest.TestCase):
    def test_hien_ma_thiet_bi_va_sao_chep(self):
        p = Phien()
        self.assertEqual(p.api.MaThietBi, MA_TB, "Lua và Python phải tính ra cùng mã thiết bị")
        self.assertRegex(MA_TB, r"^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$")
        self.assertIn(MA_TB, p.phan_tu("MaThietBi").Text)
        p.bam("NutChepThietBi")
        self.assertEqual(list(p.log.clipboard.values()), [MA_TB])
        self.assertIn("Đã sao chép mã thiết bị", p.trang_thai)
        p2 = Phien(khong_clipboard=True)
        p2.bam("NutChepThietBi")
        self.assertIn(MA_TB, p2.trang_thai)

    def test_key_cua_thiet_bi_khac_bi_tu_choi(self):
        than_khac = than_thiet_bi("client:MAY-KHAC")
        o_dia = {}
        p = Phien(o_dia=o_dia).thu_key(tao_ma("Tester", thiet_bi=than_khac))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertFalse(p.da_an_gui)
        self.assertIn("thiết bị khác", p.trang_thai)
        self.assertIn(MA_TB, p.trang_thai, "Chỉ cho biết mã của máy mình")
        self.assertNotIn(than_khac[:4], p.trang_thai.replace(MA_TB, ""), "Không lộ mã thiết bị trong key")
        self.assertEqual(o_dia, {}, "Key sai thiết bị không được lưu")
        # Máy kia (ClientId khác) thì dùng được
        self.assertEqual(Phien(client_id="MAY-KHAC").thu_key(tao_ma("Tester", thiet_bi=than_khac)).so_lan_chay, 1)

    def test_key_da_luu_mang_sang_may_khac_bi_xoa(self):
        o_dia = {}
        ma = tao_ma("Tester")
        Phien(o_dia=o_dia).thu_key(ma)
        self.assertEqual(o_dia, {FILE: ma})
        p = Phien(o_dia=o_dia, client_id="MAY-KHAC")  # chép file key sang máy khác
        self.assertEqual(p.o_key, "")
        self.assertEqual(o_dia, {})

    def test_nguon_ma_thiet_bi(self):
        self.assertEqual(Phien(client_id="ABC").api.MaThietBi, ma_thiet_bi("client:ABC"))
        self.assertEqual(Phien(khong_client_id=True, hwid="HW-1").api.MaThietBi, ma_thiet_bi("hwid:HW-1"))
        self.assertEqual(Phien(khong_client_id=True, user_id=777).api.MaThietBi, ma_thiet_bi("user:777"))
        p = Phien(khong_client_id=True, hwid="HW-1")
        self.assertEqual(p.thu_key(tao_ma("Tester", thiet_bi=than_thiet_bi("hwid:HW-1"))).so_lan_chay, 1)

    def test_tat_kiem_tra_thiet_bi(self):
        ma = tao_ma("Tester", thiet_bi=than_thiet_bi("client:MAY-KHAC"))
        self.assertEqual(Phien(script=SCRIPT_KHONG_TB).thu_key(ma).so_lan_chay, 1)
        # vẫn phải đúng tên
        self.assertEqual(Phien(script=SCRIPT_KHONG_TB).thu_key(tao_ma("NguoiKhac")).so_lan_chay, 0)

    def test_link_lay_key_kem_ma_thiet_bi_va_ten(self):
        p = Phien(ten="Tao Dep_01")
        p.bam("NutLayKey")
        self.assertEqual(list(p.log.clipboard.values()),
                         [f"https://mncuadaigmailcom.github.io/taodepzai/?tb={MA_TB}&ten=Tao%20Dep_01"])
        p2 = Phien(khong_clipboard=True)
        p2.bam("NutLayKey")
        self.assertIn(f"taodepzai/?tb={MA_TB}&ten=Tester", p2.trang_thai)


@unittest.skipUnless(CO_NODE, "Cần Node.js để đối chiếu với index.html")
class DoiChieuIndexHtmlTest(unittest.TestCase):
    def test_ma_tu_index_html_duoc_chap_nhan(self):
        ten_thu = ["Tester", "tester", "Người chơi 123 🎮", 'Tên "đặc biệt" \\ /', "a", " Tester  "]
        cases = []
        for i, ten in enumerate(ten_thu):
            for nv, so in (("nv1", 0), ("nv4", 999), ("nv2", 314)):
                cases.append([ten, nv, (BAY_GIO - 120) * 1000 + 7 + i, so, MA_TB.lower().replace("-", ""),
                              nonce_mac_dinh(ten, nv, so).hex()])
        cac_ma = tao_ma_bang_index_html(cases)
        for (ten, nv, t, so, _tb, nonce), ma in zip(cases, cac_ma):
            with self.subTest(ten=ten, nv=nv):
                self.assertEqual(ma, tao_ma(ten, nv, t, so, nonce=bytes.fromhex(nonce)), "Bản Python phải giống index.html")
                self.assertTrue(ma.startswith(PREFIX))
                p = Phien(ten="Tester", ten_hien_thi=ten.strip())
                self.assertEqual(p.giai_ma(ma), {"ten": ten.strip(), "nhiemVu": nv, "thoiDiem": t // 1000,
                                                 "soQuay": so, "thietBi": THAN_TB})
                self.assertEqual(p.thu_key(ma).so_lan_chay, 1)

    def test_giai_ma_giong_tools_decode_demo(self):
        ngau_nhien = random.Random(42)
        ky_tu = list("abcXYZ019 _-.'\"\\/đĐăâêôơưÁÀẢÃẠ中🎮\t")
        cac_ma = []
        for _ in range(250):
            ten = "".join(ngau_nhien.choice(ky_tu) for _ in range(ngau_nhien.randint(1, 34))).strip() or "x"
            than = THAN_TB if ngau_nhien.random() < 0.8 else than_thiet_bi(str(ngau_nhien.random()))
            ma = tao_ma(ten, ngau_nhien.choice(["nv1", "nv2", "nv3", "nv4"]), ngau_nhien.randint(1, 2 ** 48 - 1),
                        so_quay=ngau_nhien.randint(0, 999), thiet_bi=than, nonce=ngau_nhien.randbytes(12))
            r = ngau_nhien.random()
            if r < 0.15:
                ma = tao_ma_v2(ten)
            elif r < 0.3:  # bản rõ sai định dạng nhưng tag đúng
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
            self.assertEqual(lua, mong_doi, ma)
        self.assertGreater(so_hop_le, 80)

    def test_ma_thiet_bi_giong_node(self):
        goc = ["client:MOCK-CLIENT-0001", "hwid:ABC", "user:1", "client:" + "x" * 100, "client:Tên 🎮"]
        code = ("const t=require(process.argv[1]);const ds=JSON.parse(require('fs').readFileSync(0,'utf8'));"
                "console.log(JSON.stringify(ds.map(g=>[t.maThietBiTuGoc(g),t.chuanHoaMaThietBi(t.maThietBiTuGoc(g))])))")
        kq = json.loads(subprocess.run(["node", "-e", code, str(GOC / "tools" / "decode-demo.cjs")],
                                       input=json.dumps(goc), capture_output=True, text=True, check=True).stdout)
        for g, (ma, than) in zip(goc, kq):
            self.assertEqual(ma, ma_thiet_bi(g))
            self.assertEqual(than, than_thiet_bi(g))
            if g.isascii():
                self.assertEqual(Phien(client_id=g[len("client:"):]).api.MaThietBi if g.startswith("client:") else ma,
                                 ma)


if __name__ == "__main__":
    unittest.main(verbosity=2)
