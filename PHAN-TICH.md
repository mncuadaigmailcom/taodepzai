# Phân tích `index.html` và `script.js`

*Phân tích tĩnh + kiểm chứng thực nghiệm trên commit `dee4b29` (nhánh `arena/01a0e898-taodepzai`), ngày 2026-09-28.*

---

## 1. Tóm tắt nhanh

| | Kết luận |
|---|---|
| **Bản chất 2 file** | `index.html` = trang web tĩnh (HTML + CSS + JS nội tuyến) phát "mã demo" `Free_v4_...` sau khi người dùng nhập tên và "làm" 4 nhiệm vụ. `script.js` **không phải JavaScript** mà là **Luau/Lua** cho executor Roblox — một *key system v5* tự xác thực key ngay trên máy người chơi. |
| **Quan hệ** | Trang là "nhà máy phát key", script là "cửa kiểm soát". Hai thuật toán **khớp nhau thật** ở phiên bản v4 (đã kiểm chứng ở §5). |
| **Vấn đề lớn nhất** | Repo đang **trộn 3 thế hệ định dạng key** (trang phát `v4`, script ưu tiên `v5` nhưng vẫn nhận `v2`, tài liệu/test/bộ giải mã nói `v2`) → test gãy 9/10, công cụ giải mã vô dụng với mã mới, README sai. |
| **Rủi ro bảo mật** | Key `Free_v2_` **giả được trong 5 dòng Python** (không có mã kiểm tra) và script vẫn nhận mặc định. Với `v4/v5`, bí mật HMAC nằm công khai trong cả 3 file → bất kỳ ai đọc mã nguồn cũng tạo được key hợp lệ mà **không cần mở trang**. Ngoài ra `CHAP_NHAN_TEN_HIEN_THI = true` cho phép mạo danh để dùng key người khác. |
| **Rác cần xoá** | 3 khối chèn lạ trong `index.html`: CSS quảng cáo giả (dòng 4–7), script "gửi log ra `window.parent`" (dòng 8), `<script></script>` rỗng (dòng 1363–1366). Hai khối đầu còn **phá chính bộ test** của repo. |

---

## 2. Bản đồ repo

| File | Kích thước | Vai trò | Tình trạng |
|---|---|---|---|
| `index.html` | 1.367 dòng / 74 KB | Trang phát mã demo, chạy trên GitHub Pages `mncuadaigmailcom.github.io/taodepzai/` | Chạy được; có code rác + 1 tính năng chết |
| `script.js` | 1.131 dòng / 47 KB (CRLF) | **Luau/Lua** key system v5 cho executor | Logic tự nhất quán; cấu hình mặc định có lỗ |
| `README.md` | 29 dòng | Tài liệu | **Sai**: mô tả định dạng `Free_v2_`, lệnh test không còn đúng |
| `tests/portal.test.cjs` | 376 dòng / 10 test | Test trang web bằng DOM giả | **1/10 pass** |
| `tools/decode-demo.cjs` | 45 dòng | Đọc ngược tên từ mã | **Chỉ đọc được `Free_v2_`** → không dùng được với mã trang đang phát |

Lịch sử git chỉ có **1 commit** (`dee4b29`, "🤖 Boss Bot sửa và cập nhật lại file script: script.js") chứa cả 5 file → không truy được vì sao trang bị nâng lên v4 mà test/tài liệu còn ở v2.

---

## 3. `index.html` — trang phát mã demo

### 3.1 Cấu trúc vật lý

| Dòng | Khối | Ghi chú |
|---|---|---|
| 4–7 | `<style>` #1: `.fake-ad`, `.video-ad-overlay`, `.video-box`, `.video-progress`, `.video-btn`… | **Không có phần tử nào dùng** các class này (đã kiểm tra tự động: 13 class chết) |
| 8 | `<script>` #1: chặn `console.log/error/warn` + `window.onerror`, `postMessage` ra `window.parent` | Rác từ môi trường xem trước dạng iframe |
| 10 | `<meta charset="UTF-8">` | Nằm **sau ~2,6 KB** nội dung (spec khuyến nghị trong 1 KB đầu) |
| 14–529 | `<style>` #2: theme tối, cyber-grid, task card, modal, toast, spin, responsive | ~23 KB CSS thật |
| 531–672 | Markup: hero, ô tên, 4 task card, nút mở khoá, modal `#white-screen`, khối "script cũ" | 40 `id`, **không trùng id** |
| 674–1361 | `<script>` #2: toàn bộ logic trang (~35,5 KB) | Chia 2 phần: mã hoá v4 (707–854) + điều khiển UI/phiên (855–1361) |
| 1363–1366 | `<script></script>` rỗng | Rác |

### 3.2 Luồng nghiệp vụ

1. Người dùng nhập tên (≤ 32 ký tự, lưu vào `localStorage` khoá `taodepzai_player_name`, **giữ lại khi reset**).
2. Bấm 1 trong 4 liên kết → `batDauNhiemVu()` (dòng 1112) tạo phiên 3 phút nếu chưa có (`session_expire`), đặt `status<nv> = checking`, ghi `startTime`.
3. Rời tab (`window blur` hoặc `visibilitychange=hidden` → `ghiNhanRoiTrang`, dòng 1126) ghi `leftAt` **chỉ cho cổng vừa bấm**.
4. Quay lại tab: `kiemTraTienTrinhNhiemVu()` (dòng 1146) — rời ≥ 5 s ⇒ `success` + `completedAt`; rời < 5 s ⇒ `error` (tự xoá sau 2,5 s nhờ `henXoaLoi`).
5. Đủ 4/4 **và** có tên **và** đã lấy được "mã mạng" **và** còn phiên ⇒ nút mở khoá → modal sinh mã từ thời điểm `completedAt` **lớn nhất** (nhiệm vụ xong cuối), số quay 3 số, nonce 12 byte.
6. Mã ổn định qua F5 (nonce + số quay lưu trong `localStorage`); "Quay số mới" hoặc reset phiên thì sinh mã khác.

Khoá lưu trữ: `session_expire`, `status<nv>`, `startTime<nv>`, `leftAt<nv>`, `completedAt<nv>`, `taodepzai_player_name`, `taodepzai_so_quay`, `taodepzai_nonce`. Truy cập `localStorage` được bọc `try/catch` + `Map` dự phòng (dòng 691–706) — điểm tốt.

### 3.3 Định dạng mã trang đang phát (v4)

```
Free_v4_ + base64url( nonce 12 byte | tag 16 byte | bản mã )
bản rõ P = [ 4, sốQuay(2B), thờiĐiểmMs(6B), sốNhiệmVụ(1B), mãThiếtBị(10 ký tự ASCII), tên(UTF-8) ]
chuỗi trộn = "tdz4|tron|" + mãThiếtBị + "|" + tên + "|" + "YYYY-MM-DD HH:MM:SS.mmm"(UTC) + "|" + "%03d" sốQuay
khoá con   = HMAC-SHA256(BI_MAT_V4, chuỗi trộn)
tag        = HMAC-SHA256(khoá con, "tdz4|tag|" + nonce + P)[0..16]
khoá       = HMAC-SHA256(BI_MAT_V4, "tdz4|enc|" + nonce + tag)
bản mã     = P XOR ( SHA256(khoá+0) || SHA256(khoá+1) || … )
```

SHA-256 và HMAC được **tự viết lại bằng JavaScript thuần** (dòng 718–773) — không phụ thuộc `crypto.subtle`, chạy được cả trên `file://`. Điểm đáng chú ý: bộ này đã được kiểm chứng khớp với bản Luau trong `script.js` (§5).

### 3.4 "Mã thiết bị" theo IP

- `NGUON_IP` = ipify → icanhazip → ident.me (dòng 840): trang **gọi 3 dịch vụ bên thứ ba** khi mở trang và mỗi lần quay lại tab (giãn cách 30 s, dòng 961), timeout 7 s mỗi nguồn.
- `thanTuIp(ip)` = 10 ký tự Crockford base32 từ `SHA256("taodepzai|thiet-bi|ip:" + ip)` + 2 ký tự kiểm tra (10 bit).
- Không lấy được IP ⇒ dùng `0.0.0.0` (dòng 841) ⇒ **mọi người mất mạng có cùng "mã thiết bị"**.
- Không có thông báo/đồng ý nào cho người dùng về việc gọi 3 dịch vụ ngoài.
- Mã thiết bị chỉ **trộn vào khoá mã hoá**; script chỉ *so sánh* khi bật `KIEM_TRA_THIET_BI` (mặc định **tắt**).

### 3.5 Vấn đề của `index.html`

| # | Mức | Vị trí | Mô tả | Hướng sửa |
|---|---|---|---|---|
| H1 | Cao | 4–7 | Khối CSS "quảng cáo giả / video overlay": 11 class (`.fake-ad*`, `.video-*`) không được dùng ở đâu; **đồng thời** làm test #10 đọc nhầm khối style (`html.split('<style>')[1]`) | Xoá khối |
| H2 | Cao | 8 | Script chèn chặn `console.*` và `postMessage('*')` ra `window.parent`; **đồng thời** làm test #1–#9 nạp sai script (`html.split('<script>')[1]`) | Xoá khối |
| H3 | Thấp | 1363–1366 | `<script></script>` rỗng | Xoá |
| H4 | Cao | 885–889 | Đọc `?ten=<tên>` như **văn bản thường**, trong khi `script.js` (dòng 1053) phát link `?mahoa=<base64url>` và **không có hàm `giaiMaTen`** trong trang → tính năng "tự điền tên từ link" **chết hoàn toàn**: tên mã hoá bị lưu nguyên chuỗi (nếu ≤ 32 ký tự) hoặc bị bỏ qua | Đổi sang `?mahoa=` + viết bộ giải mã HMAC tương ứng (`tdz4|ten|tag|` / `tdz4|ten|enc|`), hoặc bỏ tính năng |
| H5 | Trung bình | 946–976, 1042–1062 | Nút bị khoá khi `thanThietBi == null`; mạng bị chặn 3 nguồn IP ⇒ treo "Đang kiểm tra mạng…" tới ~21 s | Dùng ngay fallback rồi nâng cấp khi có IP |
| H6 | Trung bình | 1112–1132, 1146 | Cổng chỉ tiến triển nếu có `leftAt` (được ghi khi `blur`/`hidden`). Nếu sự kiện đó không bắn (một số trình duyệt mobile, tab nền) mà người dùng bấm cổng khác, `congVuaMo` bị ghi đè ⇒ cổng cũ **kẹt vĩnh viễn ở "⏳ Quay lại tab"** (`kiemTraTienTrinhNhiemVu` bỏ qua vì `daRoiTrang` chưa bao giờ đúng) | Theo dõi được nhiều cổng đang chờ, tự kết thúc cổng cũ, hoặc thêm nút "bỏ qua/hủy cổng đang chờ" |
| H7 | Trung bình | 1283–1289 | "Rời trang" suy ra từ `blur` — cũng bắn khi mở DevTools, đổi cửa sổ, mất focus vì lý do khác (dương tính giả), và trên một số trình duyệt mobile thì không bắn khi chuyển app | Cân nhắc chỉ dùng `visibilitychange` |
| H8 | Thấp | 949 | `Promise.race` với timeout không `clearTimeout` → timer rò 7 s | Xoá timer trong `finally` |
| H9 | Thấp | 10 | `<meta charset>` sau 2,6 KB | Dời lên đầu `<head>` |
| H10 | Thấp | 15 | `@import` Google Fonts chặn render + gọi mạng ngoài | `<link rel="preconnect">` hoặc tự host font |
| H11 | Thông tin | 651, 557 | Nhãn "MÃ DEMO (KHÔNG PHẢI KEY KÍCH HOẠT)" và README nói mã không kích hoạt script, nhưng `script.js` **dùng chính key này để mở script** | Sửa lại thông điệp cho khớp thực tế |
| H12 | Rủi ro chuỗi cung ứng | 678 | `SCRIPT_CUA_BAN` = `loadstring(game:HttpGet("https://raw.githubusercontent.com/HieudepzaiHub/main/abc"))()` — nguồn thứ ba, không ghim phiên bản, không kiểm tra toàn vẹn | Ghim commit/tag + hash, hoặc bỏ ô "script cũ" |
| H13 | Bản chất | 1146–1172 | "Hoàn thành nhiệm vụ" chỉ là *ở tab khác ≥ 5 s* — không xác minh nội dung liên kết (trang tự thừa nhận ở dòng 670). Ai biết devtools cũng tạo được mọi trạng thái | Chấp nhận (là demo) hoặc chuyển sang xác minh phía máy chủ |

**Điểm tốt đáng giữ:** focus-trap + `Esc` cho modal, `aria-live` cho toast, `prefers-reduced-motion` cho hiệu ứng nghiêng và quay số, `localStorage` dự phòng, đồng bộ nhiều tab qua sự kiện `storage`, không đưa ngày/giờ ra UI.

---

## 4. `script.js` — key system (Luau)

### 4.1 Kiến trúc

| Dòng | Phần | Nội dung |
|---|---|---|
| 1–24 | Header | Tự mô tả v5, cảnh báo "bí mật nằm công khai"; nhắc `tests/key_system_test.py`, `tests/luau_test.py` — **hai file này không tồn tại trong repo** |
| 26–44 | `CAU_HINH` | Cấu hình |
| 54–207 | Tiện ích | `Trim`, `Xor8`, base64url, kiểm tra UTF-8, đếm độ dài kiểu JS, **tự viết bộ đọc JSON** (`DocMangJson`, dòng 147) để giải mã v2 |
| 209–236 | Giải mã v2 | XOR theo vị trí, **không có mã kiểm tra** |
| 238–372 | Toán bit + **SHA-256/HMAC-SHA256** bằng Lua thuần (có fallback khi thiếu `bit32`) |
| 374–435 | Mã thiết bị từ IP (`ThanMaThietBi`, 381; `CapNhatThietBi`, 427) |
| 437–538 | Giải mã v4/v5 (`CAU_TRUC_KEY` 452, `NgayGioUtc` 462, `ChuoiTron` 482, `GiaiMaMoi` 497) |
| 540–597 | Mã hoá tên cho link "Lấy key" (`MaHoaTen` 572, `GiaiMaKey` 589) |
| 599–637 | Giờ (ưu tiên `workspace:GetServerTimeNow()`, 600) + so khớp tên (`TenKhop` 630) |
| 639–697 | `KiemTraKey` — xác thực đầy đủ |
| 699–723 | Đọc/ghi/xoá file key trong executor (`taodepzai_key_<UserId>.txt`) |
| 725–932 | Giao diện Roblox (`Instance.new`, `gethui`/CoreGui/PlayerGui, huỷ bảng cũ khi chạy lại) |
| 934–1040 | Logic: `ChayScriptChinh` 974 (tải `SCRIPT_URL` → `loadstring` → chạy), `HenGioXoaKey` 1005 (hẹn xoá khi hết hạn), `XacNhan` 1022 |
| 1042–1087 | `SaoChep`, `LinkLayKey` 1053 (`?mahoa=`), nhấn "Lấy key" 2 lần trong 3 s |
| 1088–1131 | Đóng bảng, tự điền key đã lưu khi mở lại, `return {…}` để test |

### 4.2 Trình tự xác thực (`KiemTraKey`, dòng 641)

1. Trích key bằng `match("Free_v%d_[%w_%-]+")` (chấp nhận dán thừa chữ) → kiểm tra tiền tố theo `KEY_PREFIX` + cờ chấp nhận v4/v2.
2. Giải mã theo phiên bản; sai tag / sai cấu trúc ⇒ từ chối.
3. Tên trong key phải khớp `player.Name` (hoặc `DisplayName` nếu `CHAP_NHAN_TEN_HIEN_THI`).
4. Nếu `YEU_CAU_TEN_TU_ROBLOX` ⇒ bắt buộc cờ `tuRoblox` (chỉ tồn tại ở v5).
5. Chặn key "ở tương lai" quá 5 phút; hạn = `thoiDiem + 24 h`; hết hạn ⇒ từ chối.
6. Nếu `KIEM_TRA_THIET_BI` ⇒ so `thietBi` trong key với IP hiện tại (có lấy lại IP 1 lần trước khi kết luận).
7. Hợp lệ ⇒ lưu file, hẹn xoá khi hết hạn, `task.spawn(ChayScriptChinh)`.

### 4.3 Cờ cấu hình & hệ quả

| Dòng | Cờ | Mặc định | Nhận xét |
|---|---|---|---|
| 27–28 | `KEY_PREFIX="Free_v5_"`, `CHAP_NHAN_KEY_V4=true` | | Trang trong repo **chỉ phát v4** ⇒ toàn bộ nhánh v5 (nonce 128 bit, tag 256 bit, cờ `tuRoblox`) là code chết phía phát hành |
| 29 | `YEU_CAU_TEN_TU_ROBLOX=false` | | Nếu bật ⇒ **không ai qua được** với trang hiện tại (trang không phát v5) |
| 31 | `CHAP_NHAN_KEY_V2=true` | ⚠ | v2 **không có tag** ⇒ giả được (xem §6.3) |
| 33 | `KIEM_TRA_THIET_BI=false` | | Toàn bộ máy móc IP/mã thiết bị gần như vô dụng; và kể cả bật thì người dùng biết IP của mình nên vẫn tự tạo được key khớp |
| 38 | `CHAP_NHAN_TEN_HIEN_THI=true` | ⚠ | `DisplayName` **không duy nhất**: kẻ khác đặt DisplayName trùng tên trong key bị lộ của bạn là dùng được key đó (mạo danh) |
| 41 | `SCRIPT_URL` → `…/aiaiaitao2/script.js` | ⚠ | **Repo khác** với trang (`taodepzai`); nội dung tải về được `loadstring` chạy thẳng, không kiểm tra toàn vẹn |
| 42 | `LINK_LAY_KEY` → `…/taodepzai/` | | Khớp trang |

### 4.4 Vấn đề của `script.js`

| # | Mức | Vị trí | Mô tả |
|---|---|---|---|
| S1 | Cao | 31, 227 | `CHAP_NHAN_KEY_V2=true` mở đường giả mạo rẻ nhất (đã chứng minh, §6.3). Nên đặt `false` nếu không còn bản trang v2 nào đang chạy |
| S2 | Cao | 446 | `BI_MAT_V4` công khai trong `index.html`, `script.js`, `tools/decode-demo.cjs` ⇒ ai đọc mã cũng tạo được key v4/v5 cho **bất kỳ tên/IP/thời điểm nào** (đã chứng minh, §6.4). Đây là hệ quả tất yếu của thiết kế không có máy chủ — header của file cũng đã tự cảnh báo |
| S3 | Cao | 1053 vs `index.html:885` | Sai tên tham số (`?mahoa=` vs `?ten=`) và thiếu hàm giải mã trong trang ⇒ tính năng chết (§3.5/H4) |
| S4 | Trung bình | 974–1004 | Tải mã từ mạng rồi `loadstring` — RCE theo thiết kế; nguồn (`SCRIPT_URL`) nằm ở repo khác, không ghim phiên bản; đổi URL/hacked repo ⇒ chạy mã lạ trên máy mọi người dùng |
| S5 | Trung bình | 630–637 | `CHAP_NHAN_TEN_HIEN_THI` cho phép mạo danh qua `DisplayName` (không unique) |
| S6 | Trung bình | 702–723 | Ghi/xoá file trong thư mục executor; quyền riêng tư ở mức thấp nhưng nên ghi rõ trong tài liệu |
| S7 | Thấp | tên file | Đây là **Lua** nhưng đặt tên `.js`; header lại nhắc `key-system.lua`. Gây nhầm lẫn công cụ (lint, syntax-highlight, CI) |
| S8 | Thấp | 1005–1020 | Hẹn xoá key bằng `task.delay` 24 h — không sống sót khi executor đóng; dù vậy `KiemTraKey` vẫn từ chối key hết hạn nên không phải lỗ |
| S9 | Thấp | 600–606 | `BayGio()` ưu tiên giờ máy chủ Roblox (tốt), chỉ rơi về `os.time()` khi thiếu ⇒ có thể chỉnh đồng hồ máy để "gia hạn" một chút trong trường hợp xấu nhất |
| S10 | Thông tin | 1–24 | Tài liệu tham chiếu 2 file test không tồn tại ⇒ không có kiểm thử nào cho phần Luau trong repo |

---

## 5. Đối chiếu hai file & kiểm chứng "khớp thuật toán"

| Hạng mục | `index.html` | `script.js` | Khớp? |
|---|---|---|---|
| Tiền tố phát / nhận | `Free_v4_` (716) | `Free_v5_` ưu tiên, nhận v4 (27–28) | ✅ chạy được, ⚠ lệch "đời" |
| Bí mật HMAC | `BI_MAT_V4` (717) | `BI_MAT_V4` (446) | ✅ giống hệt |
| Nhãn miền | `tdz4\|tron\|`, `tdz4\|tag\|`, `tdz4\|enc\|` | như trên (482–520) | ✅ |
| Bố cục bản rõ P | `[4, quay(2B), ms(6B), nv, thiết bị(10), tên]` (825–837) | đọc đúng thứ tự đó (497–538) | ✅ |
| Chuỗi trộn | `chuoiTron()` (818) | `ChuoiTron()` (482), kể cả định dạng `%03d` | ✅ |
| Ngày giờ UTC | `Date` + `getUTC*` (810) | tự tính lịch Howard-Hinnant (462) | ✅ **đã kiểm 5 mốc, khớp UTC** |
| Mã thiết bị | `thanTuIp` + 2 ký tự kiểm tra (848, 785) | `ThanMaThietBi`/`KiemTraThietBi` (381, 388) | ✅ |
| Giới hạn tên 32 | `maxlength=32` + `DoDaiJs` UTF-16 | `DoDaiJs` (dòng 123) | ✅ |
| Tên tham số link | `?ten=` (885) | `?mahoa=` (1053) | ❌ **lệch** |
| Cờ `tuRoblox` | không bao giờ phát | có nhánh kiểm tra (669) | ❌ không thể dùng |
| Tài liệu/test/bộ giải mã | — | — | ❌ vẫn ở `Free_v2_` |

**Kiểm chứng round-trip (đã chạy):** sinh mã từ chính `taoMaDemo` trong `index.html` với tên `"Nguyễn Văn A 🍃"`, số quay 42, nhiệm vụ `nv3`, mã thiết bị của IP `203.0.113.7`; rồi giải mã bằng một **bộ mô phỏng Python viết lại theo đúng code Luau** (`GiaiMaMoi`, `ChuoiTron`, `NgayGioUtc`, `ThanMaThietBi`):

```
Key         : Free_v4_AQIDBAUGBwgJCgsMnK2Ht5iE2xW-NTv4_V5TrrUFsgCo1XjyTBET13bn74GkMdBpjIIqSE5e1NSdESPbk4dvMHSkzuY
Kết quả     : HỢP LỆ — tên 'Nguyễn Văn A 🍃', nv3, số quay 42, thiết bị VWE0F311MH, thời điểm 2025-09-27T22:32:25.678Z
Sửa 1 ký tự: "tag không khớp" → bị từ chối ✅
```

⇒ **Trang và script tương thích thật ở v4.** Lưu ý trung thực: sandbox không có Lua/Luau nên phần "Luau" là *mô phỏng theo đúng mã nguồn đã đọc*, không phải chạy Luau thật.

---

## 6. Kiểm thử & bằng chứng

### 6.1 Hiện trạng

```
$ node --test tests/portal.test.cjs
# tests 10  # pass 1  # fail 9
```

### 6.2 Nguyên nhân gãy (theo thứ tự)

1. **H1 + H2**: harness lấy `html.split('<script>')[1]` và `html.split('<style>')[1]` → nạp **khối script gửi log** thay vì script của trang, và đọc **khối CSS quảng cáo giả** thay vì CSS thật. Test #10 gãy vì so `.main-container{max-width:460px}` với CSS quảng cáo.
2. **Harness thiếu `clearInterval`**: sau khi sửa cách lấy block, script thật chết ngay ở `dungQuay()` (`ReferenceError: clearInterval is not defined`).
3. **Lệch phiên bản**: sau khi sửa 2 điểm trên (bản sao ở `/tmp`, **không sửa repo**), kết quả là **6/10 pass**; 4 test còn lại gãy đúng vì lý do phiên bản — ví dụ:

```
not ok 1 — The input did not match /^Free_v2_[A-Za-z0-9_-]+$/
        actual: 'Free_v4_XSqB5xopicQkXDOQ4ImrA_ERyJ2VDgG_DmbbjUtwW0AjSNIrKargwDUr9SR2I1WxaCPZMwdG1up0GbDD9Xc'
```

⇒ **Logic trang không hỏng**; test, bộ giải mã và README mới là phần lạc hậu. Nhưng như vậy repo hiện **không có lưới an toàn** nào đang chạy đúng.

### 6.3 Chứng minh key v2 giả được (không cần làm nhiệm vụ)

```python
ban_ro = json.dumps(["TenCuaToi", "nv4", int(time.time()*1000)]).encode()
che    = [xor8(b, (i*73 + 0xA5) % 256) for i, b in enumerate(ban_ro)]
key    = "Free_v2_" + base64url(che)          # Free_v2__sxj5adRLsW5WRbqPXqBgkNK5Tx5k9wNTfA_YJnfAU_0PAo
```

`script.js` (`GiaiMaV2`) đọc lại đúng `('TenCuaToi','nv4', now)`; `CHAP_NHAN_KEY_V2=true` + `KIEM_TRA_TEN=true` (kẻ giả dùng tên chính mình) + hạn 24 h tính từ `thoiDiem` ⇒ **key hợp lệ 24 giờ mà không hề mở trang**.

### 6.4 Chứng minh key v4 giả được (chỉ cần đọc mã nguồn)

Dùng đúng `BI_MAT_V4` công khai và các nhãn `tdz4|…`, sinh key cho tên `TenCuaToi`, `nv4`, thời điểm *hiện tại*, số quay 137, "mã thiết bị" của IP tuỳ chọn:

```
Free_v4_AAECAwQFBgcICQoLr9-P7jfLByIec2cDX3YW4EEq7BlrrS8RfV-IkiXcCbbS5-mLMt7xXOoFZHlo
→ bộ xác thực: HỢP LỆ {ten: 'TenCuaToi', nhiem_vu: 'nv4', soQuay: 137, ...}
```

⇒ Với mô hình "bí mật nằm trong mã nguồn công khai", **không có cách nào** phân biệt key thật với key tự chế. Đây không phải "lỗi nhỏ cần vá" mà là **giới hạn của thiết kế** — muốn cấp key dùng được, thu hồi được, chỉ chủ trang tra được tên thì phải có **máy chủ**: key ngẫu nhiên 128+ bit, lưu hash trong DB, có trạng thái (đã dùng/chưa/thu hồi), API phát key sau khi xác minh nhiệm vụ (captcha/OAuth/ads), trang quản trị có xác thực.

---

## 7. Khuyến nghị theo thứ tự ưu tiên

**P0 — nên sửa ngay (rẻ, rủi ro cao)**
1. Xoá 3 khối rác trong `index.html`: dòng 4–7, dòng 8, dòng 1363–1366 (khôi phục luôn bộ test).
2. `script.js`: `CHAP_NHAN_KEY_V2 = false` (và xoá `GiaiMaV2`/`DocMangJson`/`KiemTraNoiDung` khi không còn dùng) — bịt đường giả mạo v2.
3. Thống nhất **một** định dạng: hoặc cho trang phát `Free_v5_` (kèm cờ `tuRoblox` khi tên đến từ link mã hoá) rồi bỏ v4/v2; hoặc bỏ hẳn nhánh v5 + `YEU_CAU_TEN_TU_ROBLOX`. Đừng để 3 định dạng cùng tồn tại.
4. Sửa tham số tên: dùng `?mahoa=` ở cả hai phía **và** viết `giaiMaTen` trong `index.html`; hoặc bỏ tính năng để khỏi hứa suông.
5. Ghim `SCRIPT_URL` (cùng repo, kèm commit/tag + kiểm tra hash) hoặc bỏ `loadstring` từ nguồn ngoài.

**P1 — nên sửa sớm**
6. Cập nhật `tests/portal.test.cjs`: lấy đúng block (regex/thứ tự), cấp `clearInterval` trong sandbox, đổi kỳ vọng sang phiên bản thật; thêm test round-trip `taoMaDemo → trình xác thực`.
7. Thay `tools/decode-demo.cjs` bằng công cụ đọc được **v4/v5** (đúng thuật toán trong trang), giữ phần kiểm tra tính hợp lệ; cập nhật README (bỏ `Free_v2_`, bỏ `tests/key_system_test.py`, `tests/luau_test.py` không tồn tại).
8. Đổi tên `script.js` → `key-system.lua` (cập nhật URL phát hành nếu có người đang dùng).
9. Sửa lỗi kẹt `checking` khi mở nhiệm vụ khác (H6); dùng fallback IP ngay thay vì chặn nút (H5).
10. Cân nhắc `CHAP_NHAN_TEN_HIEN_THI = false` (S5).

**P2 — vệ sinh & minh bạch**
11. Dời `<meta charset>` lên đầu; bỏ `@import` Google Fonts (tự host hoặc `preconnect`); gom CSS/JS ra file riêng nếu muốn dễ bảo trì.
12. Sửa thông điệp UI/README cho khớp sự thật (mã này **có** dùng để mở script, và **không** bảo vệ được gì trước người đọc mã nguồn).
13. Ghi rõ rủi ro pháp lý/đạo đức: trang đang phát tán key cho script tải từ GitHub rồi `loadstring` (RCE trên máy người dùng) — nên có cảnh báo rõ hoặc dừng phát hành.

---

## 8. Phụ lục — tái lập kiểm chứng

```bash
# 1) Hiện trạng test (1/10 pass)
node --test tests/portal.test.cjs

# 2) Đếm block trong index.html
node -e "const h=require('fs').readFileSync('index.html','utf8');
console.log([...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1].length));
console.log([...h.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1].length));"

# 3) Kiểm tra round-trip v4: sinh mã bằng crypto trong index.html rồi giải bằng bộ mô phỏng Luau
#    (xem mô tả §5; các script dùng một lần nằm ở /tmp/exp, không nằm trong repo)

# 4) Kiểm tra tự động khác đã dùng
python3 - <<'EOF'
import re, collections
src = open('index.html', encoding='utf-8').read()
ids = re.findall(r'\bid="([^"]+)"', src)
print('id trùng:', [k for k,v in collections.Counter(ids).items() if v>1])   # []
css = '\n'.join(re.findall(r'<style>([\s\S]*?)</style>', src))
html_classes = {c for m in re.findall(r'class="([^"]+)"', src) for c in m.split()}
print('class CSS chết:', sorted({c for c in re.findall(r'\.([A-Za-z][\w-]*)', css)} - html_classes))
EOF
```

*Mọi số dòng trong tài liệu này trỏ tới commit `dee4b29`.*
---

## 9. Cập nhật: các việc P0 đã được thực hiện (nhánh `arena/01a0e898-taodepzai`)

Sau báo cáo này, nhóm ưu tiên P0 đã được sửa **trực tiếp trong repo** — các mục dưới đây trong tài liệu
được coi là "đã xử lý", phần còn lại vẫn đúng:

| Mục | Trạng thái | Việc đã làm |
|---|---|---|
| H1, H2, H3 | ✅ | Xoá khối CSS quảng cáo giả, script gửi log ra `window.parent` và khối `<script>` rỗng; dời `<meta charset>` lên đầu `<head>` |
| H4, S3 | ✅ | Trang đọc đúng `?mahoa=` (giải mã HMAC, có `giaiMaTen`), vẫn nhận `?ten=` cũ; key được đánh dấu **tên lấy từ Roblox** |
| Lệch phiên bản | ✅ | `index.html` nâng lên **`Free_v5_`**: nonce 16 byte, tag 256 bit, cờ `tuRoblox`, chuỗi trộn `tdz5\|tron\|`, hạn 24 giờ |
| Test 1/10 | ✅ | Viết lại `tests/portal.test.cjs`: **17 test pass**, có round-trip v5, test khớp cấu hình với `script.js` và test phát hiện khối chèn lạ |
| decode-demo v2 | ✅ | `tools/decode-demo.cjs` đọc được v5/v4/v2 |
| Tài liệu sai | ✅ | Viết lại `README.md`, thêm `LUA_HOP_DONG.md` (hợp đồng kỹ thuật `script.js`), thêm `tools/kiem-tra-key.cjs` mô phỏng `KiemTraKey` |
| Chữ "mã demo không kích hoạt script" | ✅ | Sửa lại thông điệp cho khớp sự thật (nút "Lấy key", nhãn key, hạn 24 giờ) |

**Vẫn còn (P1/P2):** `CHAP_NHAN_KEY_V2 = false`, `CHAP_NHAN_TEN_HIEN_THI = false`, ghim `SCRIPT_URL`, đổi tên
`script.js` → `key-system.lua`, xử lý cổng bị kẹt `checking` (H6) và vấn đề IP dự phòng (H5), tách CSS/JS ra
tệp riêng, và quan trọng nhất: **mọi giới hạn bảo mật ở §6 vẫn nguyên** — bí mật `BI_MAT` công khai nên key
vẫn tự tạo được, muốn chặn thật phải có máy chủ cấp key.
