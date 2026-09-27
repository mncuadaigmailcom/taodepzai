#!/usr/bin/env python3
"""Test key-system.lua trong môi trường Roblox giả lập (Lua 5.1 qua lupa).

Cài: pip install lupa   (cần thêm Node.js để đối chiếu với index.html)
Chạy: python3 tests/key_system_test.py
"""
import base64
import datetime
import json
import pathlib
import random
import shutil
import subprocess
import time
import unittest

from lupa import lua51

GOC = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = (GOC / "key-system.lua").read_text(encoding="utf-8")
MOCK = (GOC / "tests" / "roblox_mock.lua").read_text(encoding="utf-8")
SCRIPT_V2 = SCRIPT.replace("CHAP_NHAN_KEY_V2   = false", "CHAP_NHAN_KEY_V2   = true")
assert SCRIPT_V2 != SCRIPT
URL = "https://mncuadaigmailcom.github.io/aiaiaitao2/script.js"
NGAY = 24 * 60 * 60
BAY_GIO = 1790000000  # giây, UTC (giờ "hiện tại" giả lập)
CO_NODE = shutil.which("node") is not None


BI_MAT_V3 = b"taodepzai|v3|HoiAn"
P31 = 2147483647


def _bam(ds, h, co_so, mod):
    for b in ds:
        h = (h * co_so + b + 1) % mod
    return h


def _b64(ds):
    return base64.urlsafe_b64encode(bytes(ds)).decode().rstrip("=")


def ngay_thang_utc(ms):
    try:
        d = datetime.datetime(1970, 1, 1) + datetime.timedelta(milliseconds=ms)
        return d.day, d.month
    except OverflowError:  # quá năm 9999: dùng chu kỳ 400 năm (146097 ngày) của lịch Gregory
        so_ngay = ms // 86400000
        chu_ky = (so_ngay - 2932896) // 146097 + 1  # 2932896 = số ngày 1970-01-01 -> 9999-12-31
        d = datetime.date(1970, 1, 1) + datetime.timedelta(days=so_ngay - chu_ky * 146097)
        return d.day, d.month


def _json(ten, nhiem_vu, thoi_diem_ms):
    return json.dumps([ten.strip(), nhiem_vu, thoi_diem_ms], ensure_ascii=False,
                      separators=(",", ":")).encode("utf-8")


def thanh_phan_thoi_gian(ms):
    """(ngày, tháng UTC, giây, mili-giây) của thời điểm ms."""
    ngay, thang = ngay_thang_utc(ms)
    return ngay, thang, ms // 1000 % 60, ms % 1000


def ma_v3_tu_byte(noi_dung, so_quay, ngay, thang, giay, mili):
    """Bản Python của taoMaDemo (v3) trong index.html, nhận thẳng byte nội dung."""
    v = (((so_quay * 32 + ngay) * 16 + thang) * 64 + giay) * 1024 + mili
    dau = [v >> (8 * k) & 255 for k in (4, 3, 2, 1, 0)]
    bi = list(BI_MAT_V3)
    h1 = _bam(bi + dau + list(noi_dung), 5, 131, P31)
    h2 = _bam(bi + dau + list(noi_dung), 3, 257, 2147483629)
    than = list(noi_dung) + [h1 >> 8 & 255, h1 & 255, h2 >> 8 & 255, h2 & 255]
    ra = []
    y = _bam(bi, 7, 131, P31) or 1
    truoc = 0
    for b in dau:
        y = y * 48271 % P31
        truoc = (b + y // 8388608 + truoc) % 256
        ra.append(truoc)
    x = _bam(f"taodepzai|v3|HoiAn|{so_quay}|{ngay}|{thang}|{giay}|{mili}".encode(), 11, 257, P31) or 1
    truoc, byte_truoc = so_quay % 256, 0
    for b in than:
        x = (x * 48271 + byte_truoc) % P31 or 1
        truoc = (b + x // 8388608 + truoc) % 256
        ra.append(truoc)
        byte_truoc = b
    return "Free_v3_" + _b64(ra)


def tao_ma(ten, nhiem_vu="nv4", thoi_diem_ms=None, so_quay=472):
    if thoi_diem_ms is None:
        thoi_diem_ms = (BAY_GIO - 60) * 1000
    return ma_v3_tu_byte(_json(ten, nhiem_vu, thoi_diem_ms), so_quay, *thanh_phan_thoi_gian(thoi_diem_ms))


def tao_ma_v2(ten, nhiem_vu="nv4", thoi_diem_ms=None):
    """Mã v2 cũ (XOR theo vị trí)."""
    if thoi_diem_ms is None:
        thoi_diem_ms = (BAY_GIO - 60) * 1000
    du_lieu = _json(ten, nhiem_vu, thoi_diem_ms)
    return "Free_v2_" + _b64(b ^ ((i * 73 + 0xA5) & 255) for i, b in enumerate(du_lieu))


NODE_TAO_MA = r"""
const fs = require('fs');
const html = fs.readFileSync(process.argv[1], 'utf8');
const hang = ten => html.match(new RegExp(`const ${ten} = ([^;]+);`))[0];
const ham = html.slice(html.indexOf('function bamV3('), html.indexOf('function soNgauNhien3('));
const taoMaDemo = new Function(hang('MA_DEMO_PREFIX') + hang('BI_MAT_V3') + hang('P31') + ham + 'return taoMaDemo;')();
const cases = JSON.parse(fs.readFileSync(0, 'utf8'));
console.log(JSON.stringify(cases.map(([ten, id, time, so]) => taoMaDemo(ten, { id, time }, so))));
"""


def tao_ma_bang_index_html(cac_truong_hop):
    """Chạy đúng hàm taoMaDemo lấy từ index.html bằng Node."""
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
        self.assertEqual(list(p.log.clipboard.values()), ["https://mncuadaigmailcom.github.io/taodepzai/"])
        p2 = Phien(khong_clipboard=True)
        p2.bam("NutLayKey")
        self.assertIn("taodepzai/", p2.trang_thai)

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
        self.assertNotIn("NguoiKhac", p.trang_thai, "Không để lộ tên chủ key")

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
        for vt in range(len("Free_v3_"), len(ma)):
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
        che = lambda raw: ma_v3_tu_byte(raw, 5, *thanh_phan_thoi_gian(ms))  # noqa: E731 (mã kiểm tra hợp lệ)
        t = str(ms).encode()
        hop_le = che(b'["Tester","nv1",' + t + b']')
        self.assertEqual(Phien().thu_key(hop_le).so_lan_chay, 1)
        for ten_sai in (b"Tes\xc1\xb4er", b"Test\xed\xa0\x80er", b"Tester\xff", b"Tester\xe1\x80", b"\xf5\x80\x80\x80",
                        b"Tes\xe0\x80\xafter", b"Tes\xf0\x80\x80\xafter", b"\xf4\x90\x80\x80"):
            with self.subTest(ten=ten_sai):
                self.assertIsNone(Phien().giai_ma(che(b'["' + ten_sai + b'","nv1",' + t + b']')))

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
                                 {"ten": ten, "nhiemVu": "nv2", "thoiDiem": 1790000000, "soQuay": 7})

    def test_xor_bang_bit32_giong_ban_tu_viet(self):
        p1 = Phien(script=SCRIPT_V2)
        p2 = Phien(script=SCRIPT_V2, bit32={"bxor": lambda a, b: int(a) ^ int(b)})
        ma = tao_ma_v2("Tester Nguyễn 🎮")
        self.assertIsNotNone(p1.giai_ma(ma))
        self.assertEqual(p1.giai_ma(ma), p2.giai_ma(ma))
        self.assertEqual(p2.thu_key(tao_ma_v2("Tester")).so_lan_chay, 1)

    def test_so_quay_va_ngay_thang(self):
        p = Phien()
        ms = (BAY_GIO - 60) * 1000
        for so in (0, 1, 99, 500, 998, 999):
            with self.subTest(so=so):
                self.assertEqual(p.giai_ma(tao_ma("Tester", thoi_diem_ms=ms, so_quay=so))["soQuay"], so)
        # Cùng tên + thời điểm nhưng số quay khác -> key khác hẳn, đều dùng được
        cac_ma = {tao_ma("Tester", so_quay=so) for so in range(1000)}
        self.assertEqual(len(cac_ma), 1000)
        self.assertEqual(Phien().thu_key(tao_ma("Tester", so_quay=0)).so_lan_chay, 1)
        self.assertEqual(Phien().thu_key(tao_ma("Tester", so_quay=999)).so_lan_chay, 1)
        # Ngày/tháng/giây/mili-giây trong đầu mã không khớp thời điểm (dù mã kiểm tra đúng) -> từ chối
        ms = 1790000012345
        ngay, thang, giay, mili = thanh_phan_thoi_gian(ms)
        noi_dung = _json("Tester", "nv1", ms)
        self.assertIsNotNone(p.giai_ma(ma_v3_tu_byte(noi_dung, 5, ngay, thang, giay, mili)))
        for sai in ((ngay % 28 + 1, thang, giay, mili), (ngay, thang % 12 + 1, giay, mili), (0, thang, giay, mili),
                    (ngay, 13, giay, mili), (ngay, thang, (giay + 1) % 60, mili), (ngay, thang, giay, (mili + 1) % 1000),
                    (ngay, thang, 60, mili), (ngay, thang, giay, 1000), (ngay, thang, giay, 1023)):
            with self.subTest(sai=sai):
                self.assertIsNone(p.giai_ma(ma_v3_tu_byte(noi_dung, 5, *sai)))
        # Số quay > 999 -> từ chối
        self.assertIsNone(p.giai_ma(ma_v3_tu_byte(noi_dung, 1000, ngay, thang, giay, mili)))

    def test_moi_mili_giay_cho_key_khac(self):
        p = Phien()
        goc = (BAY_GIO - 60) * 1000
        cac_ma = set()
        for lech in range(0, 2000, 7):  # các mili-giây / giây khác nhau, cùng tên, cùng số quay
            ma = tao_ma("Tester", thoi_diem_ms=goc + lech, so_quay=123)
            self.assertEqual(p.giai_ma(ma)["thoiDiem"], (goc + lech) // 1000)
            cac_ma.add(ma[8:16])  # khác nhau ngay từ đầu mã, không chỉ ở phần cuối
        self.assertEqual(len(cac_ma), len(range(0, 2000, 7)))

    def test_ten_tron_vao_dong_khoa(self):
        # Hai tên chỉ khác 1 ký tự đầu -> phần mã phía sau cũng khác (không chỉ khác 1 byte)
        a = tao_ma("Aester", so_quay=1)
        b = tao_ma("Bester", so_quay=1)
        khac = sum(1 for x, y in zip(a, b) if x != y)
        self.assertGreater(khac, len(a) // 2)

    def test_ngay_thang_utc_moi_thoi_diem(self):
        p = Phien()
        ngau_nhien = random.Random(3)
        moc = [0, 1, 86399999, 86400000, 951782400000, 951868800000, 4107542399999, 4107542400000,
               1709164800000, 1709251199999]  # có 29/2 năm nhuận và 1/3/2100 (không nhuận)
        moc += [ngau_nhien.randint(1, 7_258_118_400_000) for _ in range(300)]
        for ms in moc:
            ms = max(ms, 1)
            self.assertEqual(p.giai_ma(tao_ma("x", "nv1", ms, so_quay=ms % 1000))["thoiDiem"], ms // 1000, ms)

    def test_key_v2_cu_mac_dinh_bi_tu_choi(self):
        p = Phien().thu_key(tao_ma_v2("Tester"))
        self.assertEqual(p.so_lan_chay, 0)
        self.assertIn("cũ không còn dùng được", p.trang_thai)
        self.assertIn("Free_v3_", p.trang_thai)
        self.assertEqual(Phien(script=SCRIPT_V2).thu_key(tao_ma_v2("Tester")).so_lan_chay, 1)
        self.assertEqual(Phien(script=SCRIPT_V2).thu_key(tao_ma("Tester")).so_lan_chay, 1)


@unittest.skipUnless(CO_NODE, "Cần Node.js để đối chiếu với index.html")
class DoiChieuIndexHtmlTest(unittest.TestCase):
    def test_ma_tu_index_html_duoc_chap_nhan(self):
        ten_thu = ["Tester", "tester", "Người chơi 123 🎮", 'Tên "đặc biệt" \\ /', "a"]
        cases = [[ten, nv, (BAY_GIO - 120) * 1000 + 7, so] for ten in ten_thu for nv, so in (("nv1", 0), ("nv4", 999), ("nv2", 314))]
        cac_ma = tao_ma_bang_index_html(cases)
        for (ten, nv, t, so), ma in zip(cases, cac_ma):
            with self.subTest(ten=ten, nv=nv):
                self.assertEqual(ma, tao_ma(ten, nv, t, so), "Bản Python phải giống index.html")
                self.assertTrue(ma.startswith("Free_v3_"))
                p = Phien(ten="Tester", ten_hien_thi=ten)
                self.assertEqual(p.giai_ma(ma), {"ten": ten, "nhiemVu": nv, "thoiDiem": t // 1000, "soQuay": so})
                self.assertEqual(p.thu_key(ma).so_lan_chay, 1)

    def test_giai_ma_giong_tools_decode_demo(self):
        ngau_nhien = random.Random(42)
        ky_tu = list("abcXYZ019 _-.'\"\\/đĐăâêôơưÁÀẢÃẠ中🎮\t")
        cac_ma = []
        for _ in range(500):
            ten = "".join(ngau_nhien.choice(ky_tu) for _ in range(ngau_nhien.randint(1, 30))).strip() or "x"
            ma = tao_ma(ten, ngau_nhien.choice(["nv1", "nv2", "nv3", "nv4", "nv5"]),
                        ngau_nhien.choice([ngau_nhien.randint(1, 2_000_000_000_000), 8_640_000_000_000_000,
                                           8_640_000_000_000_001, 0]), so_quay=ngau_nhien.randint(0, 999))
            if ngau_nhien.random() < 0.15:
                ma = tao_ma_v2(ten)
            elif ngau_nhien.random() < 0.15:  # ngày/tháng trong đầu mã lệch với thời điểm (mã kiểm tra vẫn đúng)
                ms = ngau_nhien.randint(1, 2_000_000_000_000)
                ngay, thang, giay, mili = thanh_phan_thoi_gian(ms)
                ma = ma_v3_tu_byte(_json(ten, "nv1", ms), 9, *ngau_nhien.choice([
                    (ngay % 28 + 1, thang, giay, mili), (ngay, thang, (giay + 1) % 60, mili),
                    (ngay, thang, giay, (mili + 1) % 1000)]))
            if ngau_nhien.random() < 0.2:  # chèn byte UTF-8 sai vào tên
                ten = ten + ngau_nhien.choice(["\udcff", "\ud800"])
                raw = json.dumps([ten, "nv1", 123], ensure_ascii=False, separators=(",", ":")).encode(
                    "utf-8", "surrogateescape" if "\udcff" in ten else "surrogatepass")
                cac_ma.append(ma_v3_tu_byte(raw, 42, 1, 1, 0, 123))
                continue
            if ngau_nhien.random() < 0.4:  # sửa ngẫu nhiên một ký tự
                vt = ngau_nhien.randrange(9, len(ma))
                ma = ma[:vt] + ngau_nhien.choice("AbZ9-_") + ma[vt + 1:]
            cac_ma.append(ma)
        ket_qua_js = giai_ma_bang_tool_js(cac_ma)
        p = Phien(script=SCRIPT_V2)  # bật cả v2 để so sánh hai phiên bản
        so_hop_le = 0
        for ma, js in zip(cac_ma, ket_qua_js):
            lua = p.giai_ma(ma)
            if js is None:
                # JS từ chối -> Lua cũng phải từ chối
                self.assertIsNone(lua, ma)
                continue
            so_hop_le += 1
            mong_doi = {"ten": js["ten"], "nhiemVu": js["nhiemVu"], "thoiDiem": js["thoiDiem"] // 1000}
            if "soQuay" in js:
                mong_doi["soQuay"] = js["soQuay"]
            self.assertEqual(lua, mong_doi, ma)
        self.assertGreater(so_hop_le, 80)


if __name__ == "__main__":
    unittest.main(verbosity=2)
