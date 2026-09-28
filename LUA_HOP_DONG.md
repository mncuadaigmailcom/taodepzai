# Hợp đồng kỹ thuật `script.js` (key system Free_v5_)

Tài liệu này mô tả **chính xác** `script.js` đang làm gì, để mọi thay đổi ở `index.html` (trang phát key)
hoặc ở công cụ trong `tools/` không làm lệch hai bên. Số dòng tính theo commit hiện tại của nhánh
`arena/01a0e898-taodepzai`.

> `script.js` **không phải JavaScript** — đây là **Luau/Lua** cho executor Roblox. Tên tệp giữ nguyên
> để không phá URL phát hành, nhưng nên đổi thành `key-system.lua` khi rảnh.

---

## 1. Kiến trúc tệp (62 hàm, 1.131 dòng)

| Dòng | Khối | Việc |
|---|---|---|
| 1–24 | Header | Tự mô tả v5 + cảnh báo bí mật nằm công khai |
| 26–44 | `CAU_HINH` | Toàn bộ cờ cấu hình (xem §2) |
| 55–207 | Tiện ích | `Trim`, `Xor8`, base64url, `Utf8HopLe`, `DoDaiJs` (đếm kiểu JS/UTF-16), `Utf8Char`, và **bộ đọc JSON tự viết** `DocMangJson` chỉ để giải mã v2 |
| 211–236 | `KiemTraNoiDung`, `GiaiMaV2` | Đường lui cho key v2 (XOR theo vị trí, **không có mã kiểm tra**) |
| 238–374 | Toán bit + SHA-256/HMAC | Bản Lua thuần, có fallback khi thiếu `bit32` (`BXor`/`BAnd`… bằng bảng tra) |
| 377–435 | Mã thiết bị | `ThanMaThietBi("ip:"..ip)`, `KiemTraThietBi`, `ChuanHoaIp`, `LayIp` (3 nguồn IP), `CapNhatThietBi` |
| 446–538 | Giải key v4/v5 | `BI_MAT_V4`, `CAU_TRUC_KEY`, `NgayGioUtc`, `ChuoiTron`, `GiaiMaMoi` |
| 540–597 | Tên qua link | `MaHoaBase64Url`, `NonceNgauNhien`, `MaHoaTen`, `GiaiMaKey` (phân loại tiền tố) |
| 600–637 | Giờ & tên | `BayGio` (ưu tiên `workspace:GetServerTimeNow()`), `DinhDangGio`, `ChuanHoaTen`, `TenKhop` |
| 641–697 | `KiemTraKey` | Trái tim của key system (xem §4) |
| 699–723 | Lưu key | `FILE_KEY = taodepzai_key_<UserId>.txt`, `DocKeyDaLuu`, `XoaKeyDaLuu` |
| 725–932 | Giao diện | Chọn `gethui()` → `CoreGui` → `PlayerGui`; huỷ GUI cũ khi chạy lại; dựng bảng key |
| 934–1040 | Logic | `BaoTrangThai`, `RungKhung`, `DatNut`, `ChayScriptChinh`, `HenGioXoaKey`, `XacNhan` |
| 1044–1086 | Tiện ích GUI | `SaoChep`, `LinkLayKey` (`?mahoa=`), `DongHoNhan`, `MoTrinhDuyet`, nhấn "Lấy key" 2 lần / 3 giây |
| 1088–1131 | Kết thúc | Đóng bảng, **tự điền key đã lưu** khi mở lại (hết hạn thì xoá), `return { GiaiMaKey, KiemTraKey, MaThietBi }` để test |

---

## 2. Cờ cấu hình (dòng 26–44)

| Cờ | Giá trị hiện tại | Ý nghĩa & hệ quả |
|---|---|---|
| `KEY_PREFIX` | `"Free_v5_"` | Tiền tố bản mới; trang phải phát đúng tiền tố này |
| `CHAP_NHAN_KEY_V4` | `true` | Còn nhận key `Free_v4_` (trang bản trước). **Tắt** sau khi mọi người đã đổi sang v5 |
| `YEU_CAU_TEN_TU_ROBLOX` | `false` | `true` = chỉ nhận key có cờ **tên lấy từ link mã hoá** (tức phải bấm "Lấy key" 2 lần, mở link `?mahoa=`) |
| `CHAP_NHAN_KEY_V2` | `true` | Còn nhận `Free_v2_` — **không có mã kiểm tra, ai cũng bịa được** (xem §6). Nên đặt `false` |
| `KIEM_TRA_THIET_BI` | `false` | `false` = đổi mạng sau khi lấy key vẫn dùng được; `true` = bắt buộc cùng IP |
| `HAN_KEY_GIAY` | `24 * 60 * 60` | Hạn 24 giờ tính từ `thời điểm hoàn thành nhiệm vụ cuối` |
| `LECH_GIO_CHO_PHEP` | `5 * 60` | Chặn key "ở tương lai" quá 5 phút (chống chỉnh đồng hồ) |
| `KIEM_TRA_TEN` | `true` | Bắt buộc tên trong key khớp tài khoản |
| `CHAP_NHAN_TEN_HIEN_THI` | `true` | Chấp nhận cả `DisplayName` — ⚠ `DisplayName` không duy nhất nên có thể bị mạo danh |
| `LUU_KEY` | `true` | Lưu key vào file của executor, tự điền lại lần sau, hết hạn tự xoá |
| `TEN_FILE_KEY` | `"taodepzai_key_"` | + `UserId` + `.txt` |
| `SCRIPT_URL` | `…/aiaiaitao2/script.js` | ⚠ Repo khác, không ghim phiên bản; nội dung tải về được `loadstring` chạy thẳng |
| `LINK_LAY_KEY` | `…/taodepzai/` | Nút "Lấy key" mở trang này |
| `THOI_GIAN_NHAN_DUP` | `3` | Nhấn "Lấy key" 2 lần trong 3 giây mới sinh link |
| `TU_MO_TRINH_DUYET` | `true` | Thử tự mở trình duyệt (đa số executor chặn — khi đó chỉ sao chép link) |
| `TIEU_DE`, `TEN_GUI` | … | Nhãn cửa sổ và tên ScreenGui (dùng để huỷ GUI cũ) |

---

## 3. Định dạng key

| Bản | Cấu trúc | Mã kiểm tra | Trường bản rõ |
|---|---|---|---|
| **v5** (hiện hành) | `Free_v5_` + base64url(`nonce` 16 B │ `tag` 32 B │ bản mã) | HMAC 256 bit | `[5, cờTuRoblox(0/1), sốQuay(2B), thờiĐiểmMs(6B), nv(1..4), mãThiếtBị(10), tên UTF-8]` |
| v4 (bản trước) | `Free_v4_` + base64url(nonce 12 B │ tag 16 B │ bản mã) | HMAC 128 bit | `[4, sốQuay(2B), thờiĐiểmMs(6B), nv, mãThiếtBị(10), tên]` |
| v2 (rất cũ) | `Free_v2_` + base64url(XOR `[tên, nv, thờiĐiểmMs]`) | **không có** | — |

Nhãn miền dùng chung mật khẩu `BI_MAT_V4` (dòng 446 — trang gọi là `BI_MAT`):

```
khoá con = HMAC-SHA256(BI_MAT, "tdz5|tron|" + mãThiếtBị + "|" + tên + "|" + "YYYY-MM-DD HH:MM:SS.mmm"(UTC) + "|" + "%03d"sốQuay + "|" + cờ)
tag      = HMAC-SHA256(khoá con, "tdz5|tag|" + nonce + bản rõ)          -- v5 giữ đủ 32 byte
khoá     = HMAC-SHA256(BI_MAT, "tdz5|enc|" + nonce + tag)
bản mã   = bản rõ XOR ( SHA256(khoá+0) │ SHA256(khoá+1) │ … )
```

Tên trong link "Lấy key" (`MaHoaTen`, dòng 572) dùng nhãn riêng, **giống nhau ở mọi phiên bản**:

```
khoá  = HMAC-SHA256(BI_MAT, "tdz4|ten|enc|" + nonce(8B) + tag(12B))
tag   = HMAC-SHA256(BI_MAT, "tdz4|ten|tag|" + nonce + tên)[0..12]
link  = LINK_LAY_KEY + "?mahoa=" + base64url(nonce │ tag │ (tên XOR dòng khoá))
```

---

## 4. `KiemTraKey` — thứ tự kiểm tra (dòng 641)

| # | Bước | Thông báo khi hỏng |
|---|---|---|
| 0 | Rỗng? | `Bạn chưa nhập key!` |
| 1 | Tách key bằng `match("Free_v%d_[%w_%-]+")` (dán thừa chữ vẫn nhận) | `Key sai! Key phải bắt đầu bằng "Free_v5_"` |
| 2 | Tiền tố phải thuộc `KEY_PREFIX` (hoặc v4/v2 nếu bật cờ) | `Key Free_vX_ cũ không còn dùng được…` |
| 3 | `GiaiMaKey`: phân loại tiền tố → `GiaiMaMoi(thân, 5/4)` hoặc `GiaiMaV2`; kiểm tra độ dài, base64url chuẩn tắc, **tag**, `p[1] == phiên bản`, số quay ≤ 999, thời điểm hợp lệ, charset mã thiết bị, tên UTF-8 hợp lệ ≤ 32 đơn vị UTF-16 | `Key không hợp lệ (bị sửa hoặc thiếu ký tự). Hãy sao chép lại key.` |
| 4 | `TenKhop`: so tên trong key với `player.Name` (và `DisplayName` nếu bật) sau `ChuanHoaTen` (bỏ `@`, hạ chữ ASCII) | `Key này không phải của tài khoản <Name>…` |
| 5 | `YEU_CAU_TEN_TU_ROBLOX` → bắt buộc `thongTin.tuRoblox` | `Key này tạo bằng tên gõ tay…` |
| 6 | `thoiDiem - BayGio() > LECH_GIO_CHO_PHEP` | `Thời gian trong key ở tương lai…` |
| 7 | `BayGio() >= thoiDiem + HAN_KEY_GIAY` | `Key đã hết hạn lúc <giờ>…` |
| 8 | `KIEM_TRA_THIET_BI` và bản ≥ v4: so `thietBi` với IP hiện tại (lấy lại IP 1 lần trước khi kết luận) | `Key này được tạo trên thiết bị / mạng khác…` |
| 9 | Hợp lệ | lưu file, hẹn xoá khi hết hạn, `task.spawn(ChayScriptChinh)` |

`ChayScriptChinh` (974): tải `SCRIPT_URL` → rỗng/lỗi thì giữ bảng để thử lại → `loadstring` → **huỷ GUI** rồi `pcall(ham)`.
`BayGio()` (600) ưu tiên giờ máy chủ Roblox nên **chỉnh đồng hồ máy không gia hạn được key**.

---

## 5. Kiểm thử không cần Roblox

Ba tầng, chạy được ở mọi máy có Node:

```bash
node --test tests/portal.test.cjs          # 17 test: trang web + khớp thuật toán + mô phỏng KiemTraKey
node tools/decode-demo.cjs 'Free_v5_...'   # đọc tên / nhiệm vụ / số quay / mã thiết bị / thời điểm
node tools/kiem-tra-key.cjs 'Free_v5_...' "TenTaiKhoan" --ip=1.2.3.4
```

`tools/kiem-tra-key.cjs` **đọc cấu hình trực tiếp từ `script.js`** (nên đổi cờ là công cụ tự theo) rồi
mô phỏng đúng `KiemTraKey`. Ví dụ thật:

```text
$ node tools/kiem-tra-key.cjs 'Free_v5_AAcOFRwjKjE4…' "Nguyễn Văn Ánh 🍃" --ip=203.0.113.7
Cấu hình script.js: KEY_PREFIX=Free_v5_ · v4=true · v2=true · kiểm tra mạng=false · bắt tên từ Roblox=false · hạn=24 giờ
✔ HỢP LỆ — còn 707 phút (hết hạn 03:15 ngày 29/09/2026).
ℹ KIEM_TRA_THIET_BI=false nên key không bị ràng buộc theo mạng.
```

Hai bên đã được đối chiếu bằng **round-trip thật**: key sinh từ `taoMaDemo` của `index.html` được giải
bằng bộ mô phỏng viết theo đúng `GiaiMaMoi` của Luau → hợp lệ, đúng tên có dấu + emoji, đúng số quay và
mã thiết bị; **sửa 1 ký tự là bị tag bắt**. Kiểm tra chéo thêm: `NgayGioUtc` bên Lua khớp `Date#toISOString`
ở 5 mốc thời gian, và `ThanMaThietBi` bên Lua trùng công thức Crockford base32 của trang.

---

## 6. Những gì key system này **không** chặn được

| Đường tấn công | Điều kiện | Cách bịt |
|---|---|---|
| **Key v2 bịa offline** | `CHAP_NHAN_KEY_V2 = true` | Đặt `false` và xoá `GiaiMaV2`/`DocMangJson`/`KiemTraNoiDung` |
| **Bí mật công khai ⇒ tự tạo key v4/v5** | Ai đọc mã nguồn (cả 3 nơi đều có `BI_MAT`) → ký được key hợp lệ cho bất kỳ tên/IP/thời điểm | Không thể vá bằng mã hoá phía máy khách: cần **máy chủ** cấp key (key ngẫu nhiên 128+ bit, lưu hash + trạng thái, API xác minh nhiệm vụ, trang quản trị) |
| **Mạo danh bằng DisplayName** | `CHAP_NHAN_TEN_HIEN_THI = true` + kẻ khác biết key của bạn | Đặt `false` (Roblox không bảo đảm `DisplayName` duy nhất) |
| **Chạy lại / chia sẻ key trong 24 giờ** | Trong hạn, key dùng được trên máy khác nếu không bật kiểm tra mạng | `KIEM_TRA_THIET_BI = true` (đánh đổi: đổi wifi ↔ 4G là hỏng key) |
| **Tải script từ nguồn ngoài** | `SCRIPT_URL` trỏ repo khác, chạy bằng `loadstring` | Ghim commit/tag + kiểm tra hash, hoặc để script trong cùng repo |
| **Sửa trạng thái nhiệm vụ trên web** | Trạng thái nằm trong `localStorage` trình duyệt | Máy chủ phát key sau khi xác minh (captcha/OAuth/ads) |

---

## 7. Checklist khi sửa — phải đồng bộ 3 nơi

| Việc | `index.html` | `script.js` | `tools/` + `tests/` |
|---|---|---|---|
| Đổi mật khẩu `BI_MAT` | `const BI_MAT` | `local BI_MAT_V4` (dòng 446) | `BI_MAT` trong `decode-demo.cjs` |
| Đổi phiên bản key | `MA_DEMO_PREFIX`, `taoMaDemo`, `chuoiTron`, `layNonce` | `CAU_TRUC_KEY`, `KEY_PREFIX`, `GiaiMaMoi`, `GiaiMaKey` | `CAU_TRUC` trong `decode-demo.cjs` |
| Đổi nhãn miền (`tdz5\|…`) | `chuoiTron`, `taoMaDemo` | `ChuoiTron`, `GiaiMaMoi` | `chuoiTron` trong `decode-demo.cjs` |
| Đổi cấu trúc bản rõ | `taoMaDemo` | `ChuoiTron`, `GiaiMaMoi` (đọc `p[…]`), `CAU_TRUC_KEY.lech` | `giaiMaMoi` trong `decode-demo.cjs` |
| Đổi cờ `tuRoblox` | `tenTuLink()` + tham số `taoMaDemo` | `p[1]`, `thongTin.tuRoblox` | `tt.tuRoblox` |
| Đổi độ dài tên/nonce/tag | `maxlength="32"`, `taoNonce(so = 16)`, tag 32 B | `DoDaiJs`, `CAU_TRUC_KEY` | `MAX_TEN_UTF16`, `CAU_TRUC` |

Sau mỗi lần sửa: `node --test tests/portal.test.cjs` (test số 2 và số 16 sẽ báo ngay nếu hai bên lệch nhau).

---

## 8. Ghi chú vận hành

- **Đường lui đang mở:** trang đã phát `Free_v5_` (24/09/2026) nhưng `script.js` vẫn nhận `Free_v4_` và
  `Free_v2_`. Muốn khoá chặt: `CHAP_NHAN_KEY_V4 = false`, `CHAP_NHAN_KEY_V2 = false` sau khi đã thông báo
  cho người dùng lấy key mới.
- **Bật `YEU_CAU_TEN_TU_ROBLOX = true`** chỉ khi hướng dẫn được người dùng bấm "Lấy key" **2 lần** (lần 2
  sinh link `?mahoa=`). Khi đó key gõ tay sẽ bị từ chối — trang đã sẵn sàng cho việc này (đặt cờ `tuRoblox`).
- **`KIEM_TRA_THIET_BI`**: mã mạng do trang lấy từ IP công khai của điện thoại; khi lấy key trên máy tính
  rồi chơi trên điện thoại khác mạng thì sẽ trượt — chỉ bật nếu hướng dẫn rõ.
- **File key** nằm trong thư mục executor (`taodepzai_key_<UserId>.txt`) và bị xoá khi hết 24 giờ.
- Bảng key cũ được huỷ trước khi dựng bảng mới (dòng 736–743) nên chạy lại script không bị chồng GUI.
