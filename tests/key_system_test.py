#!/usr/bin/env python3
"""Test key-system.lua trong môi trường Roblox giả lập (Lua 5.1 qua lupa).

Cài: pip install lupa
Chạy: python3 tests/key_system_test.py
"""
import base64
import json
import pathlib
import unittest

from lupa import lua51

GOC = pathlib.Path(__file__).resolve().parent.parent
SCRIPT = (GOC / "key-system.lua").read_text(encoding="utf-8")
MOCK = (GOC / "tests" / "roblox_mock.lua").read_text(encoding="utf-8")
URL = "https://mncuadaigmailcom.github.io/aiaiaitao2/script.js"


def tao_ma_nhu_trang_web(ten, nhiem_vu, thoi_diem):
    """Sao chép thuật toán taoMaDemo trong index.html."""
    du_lieu = json.dumps([ten.strip(), nhiem_vu, thoi_diem], ensure_ascii=False,
                         separators=(",", ":")).encode("utf-8")
    da_che = bytes(b ^ ((i * 73 + 0xA5) & 255) for i, b in enumerate(du_lieu))
    return "Free_v2_" + base64.urlsafe_b64encode(da_che).decode().rstrip("=")


class Phien:
    """Một lần chạy key-system.lua trong executor giả."""

    def __init__(self, **tuy_chon):
        self.lua = lua51.LuaRuntime(unpack_returned_tuples=True)
        tao = self.lua.execute(MOCK)
        bang = self.lua.table_from(tuy_chon)
        self.env, self.log = tao(bang)
        ham = self.lua.eval("function(src, env) local f, e = loadstring(src, '=key-system.lua') "
                            "if not f then error(e) end setfenv(f, env) return f end")
        ham(SCRIPT, self.env)()
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

    def enter(self, nhan_enter=True):
        o = self.phan_tu("OKey")
        o.FocusLost.Fire(o.FocusLost, nhan_enter)

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


class KeySystemTest(unittest.TestCase):
    def test_hien_gui_va_chua_chay_script(self):
        p = Phien()
        self.assertIsNotNone(p.gui, "Phải tạo ScreenGui nhập key")
        self.assertTrue(p.cung(p.gui.Parent, p.log.hui), "Ưu tiên đặt GUI vào gethui()")
        self.assertFalse(p.da_an_gui)
        self.assertEqual(p.httpget(), [], "Chưa nhập key thì không được tải script")
        self.assertEqual(p.so_lan_chay, 0)

    def test_key_dung_an_gui_va_chay_script(self):
        p = Phien()
        p.nhap("Free_v2__abc123")
        p.bam()
        self.assertTrue(p.da_an_gui, "Key đúng thì phải ẩn giao diện key")
        self.assertEqual(p.httpget(), [URL])
        self.assertEqual(p.so_lan_chay, 1)

    def test_key_chi_can_chua_chuoi(self):
        for key in ("Free_v2__", "abcFree_v2__xyz", "  Free_v2__ma  \n", "\tXXFree_v2__%[.*"):
            with self.subTest(key=key):
                p = Phien()
                p.nhap(key)
                p.bam()
                self.assertEqual(p.so_lan_chay, 1)
                self.assertTrue(p.da_an_gui)

    def test_key_sai_bi_tu_choi(self):
        for key in ("", "   ", "abc", "Free_v2_abc", "free_v2__abc", "FREE_V2__abc",
                    "Free_v2 _abc", "Free-v2__abc", "Free_v1__abc", "Free__v2abc"):
            with self.subTest(key=key):
                p = Phien()
                p.nhap(key)
                p.bam()
                self.assertFalse(p.da_an_gui, "Key sai thì giao diện phải giữ nguyên")
                self.assertEqual(p.httpget(), [])
                self.assertEqual(p.so_lan_chay, 0)
                self.assertIn("✖", p.trang_thai)

    def test_nhap_sai_roi_nhap_dung(self):
        p = Phien()
        p.nhap("sai")
        p.bam()
        self.assertIn("Key sai", p.trang_thai)
        p.nhap("")
        p.bam()
        self.assertIn("chưa nhập", p.trang_thai)
        p.nhap("Free_v2__ok")
        p.bam()
        self.assertEqual(p.so_lan_chay, 1)
        self.assertTrue(p.da_an_gui)

    def test_ma_that_tu_trang_web_duoc_chap_nhan(self):
        for ten in ("Tao", "Nguyễn Văn A", "x", "Người chơi 123 🎮"):
            for nv in ("nv1", "nv2", "nv3", "nv4"):
                ma = tao_ma_nhu_trang_web(ten, nv, 1790000000000)
                self.assertTrue(ma.startswith("Free_v2__"), ma)
                p = Phien()
                p.nhap(ma)
                p.bam()
                self.assertEqual(p.so_lan_chay, 1, ma)

    def test_nhan_enter_de_xac_nhan(self):
        p = Phien()
        p.nhap("Free_v2__enter")
        p.enter(False)  # chỉ bấm ra ngoài ô -> không xác nhận
        self.assertEqual(p.so_lan_chay, 0)
        p.enter(True)
        self.assertEqual(p.so_lan_chay, 1)
        self.assertTrue(p.da_an_gui)

    def test_bam_nhieu_lan_chi_chay_mot_lan(self):
        # Như Roblox thật: task.spawn chạy sau, người dùng bấm tiếp trong lúc "Đang tải..."
        p = Phien(spawn_tre=True)
        p.nhap("Free_v2__x")
        p.bam(); p.bam(); p.enter(True); p.bam("NutDong")
        self.assertEqual(p.phan_tu("NutXacNhan").Text, "Đang tải...")
        self.assertFalse(p.da_an_gui, "Đang tải thì nút X không được đóng bảng")
        p.log.chay_hang_doi()
        self.assertEqual(p.so_lan_chay, 1)
        self.assertEqual(len(p.httpget()), 1)
        self.assertTrue(p.da_an_gui)

    def test_loi_mang_giu_gui_de_thu_lai(self):
        p = Phien(http_loi="HTTP 404")
        p.nhap("Free_v2__x")
        p.bam()
        self.assertFalse(p.da_an_gui)
        self.assertIn("Không tải được script", p.trang_thai)
        self.assertEqual(p.phan_tu("NutXacNhan").Text, "Xác nhận key")
        p.bam()  # bấm lại được sau khi lỗi
        self.assertEqual(len(p.httpget()), 2)

    def test_script_rong_hoac_loi_cu_phap(self):
        for nguon, thong_bao in (("", "rỗng"), ("  \n ", "rỗng"), ("local = = 1", "lỗi cú pháp")):
            with self.subTest(nguon=nguon):
                p = Phien(nguon=nguon)
                p.nhap("Free_v2__x")
                p.bam()
                self.assertFalse(p.da_an_gui)
                self.assertIn(thong_bao, p.trang_thai)

    def test_khong_co_loadstring(self):
        p = Phien(khong_loadstring=True)
        p.nhap("Free_v2__x")
        p.bam()
        self.assertFalse(p.da_an_gui)
        self.assertIn("loadstring", p.trang_thai)

    def test_script_chinh_loi_khi_chay_khong_lam_crash(self):
        p = Phien(nguon="error('boom')")
        p.nhap("Free_v2__x")
        p.bam()
        self.assertTrue(p.da_an_gui)
        self.assertTrue(any("boom" in w for w in p.log.warn.values()))
        self.assertEqual(len(p.log.thong_bao), 1)

    def test_gui_bi_xoa_truoc_khi_script_chinh_chay(self):
        # Script chính kiểm tra xem bảng key còn không lúc nó bắt đầu chạy
        nguon = ("local g = gethui():FindFirstChild('Taodepzai_KeySystem') "
                 "_G.CON_GUI_KHI_CHAY = (g ~= nil)")
        p = Phien(nguon=nguon)
        p.nhap("Free_v2__x")
        p.bam()
        self.assertFalse(p.env._G.CON_GUI_KHI_CHAY)

    def test_nut_lay_key_sao_chep_link(self):
        p = Phien()
        p.bam("NutLayKey")
        self.assertEqual(list(p.log.clipboard.values()), ["https://mncuadaigmailcom.github.io/taodepzai/"])
        self.assertIn("Đã sao chép", p.trang_thai)
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
        self.assertTrue(p.cung(p.gui.Parent, p.log.coreGui), "Không có gethui thì dùng CoreGui")

    def test_chay_lai_khong_bi_chong_hai_bang(self):
        p = Phien()
        cu = p.gui
        f = p.lua.eval("function(src, env) local f = loadstring(src) setfenv(f, env) return f end")
        f(SCRIPT, p.env)()
        self.assertTrue(cu._destroyed)
        self.assertEqual(len(list(p.log.hui.GetChildren(p.log.hui).values())), 1)


if __name__ == "__main__":
    unittest.main(verbosity=2)
