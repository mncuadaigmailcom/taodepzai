# Phân tích `index.html` (bản hiện tại — key `Free_v5_`)

*Phân tích tĩnh + chạy kiểm chứng trên commit `e96e04f` (nhánh `arena/01a0f2aa-taodepzai`), ngày 2026-09-30.*
*Tài liệu này chỉ tập trung vào `index.html` ở trạng thái hiện tại; bản phân tích cũ (commit `dee4b29`, thời kỳ v4) nằm trong `PHAN-TICH.md`.*

---

## 1. Tóm tắt nhanh

| | Kết luận |
|---|---|
| **Bản chất** | Trang web tĩnh 1 tệp (HTML + CSS + JS nội tuyến, ~75 KB / 1.424 dòng), tự viết toàn bộ — kể cả SHA-256/HMAC — **không phụ thuộc thư viện JS ngoài** nào. |
| **Chức năng** | "Nhà máy phát key": người dùng nhập tên + hoàn thành 4 nhiệm vụ trong phiên 3 phút → nhận key `Free_v5_` (HMAC-SHA256, tag 256 bit, hạn 24 giờ). Key này được `script.js` (Luau chạy trên executor Roblox) xác thực. |
| **Trạng thái** | ✅ Chạy được; **test 17/17 pass**; cấu hình mã hoá **khớp `script.js`** (bí mật giống `BI_MAT_V4`, test đối chiếu tự động). |
| **Chất lượng** | Mã sạch, chú thích tiếng Việt dày, đặt tên kiểu Việt hoá nhất quán, xử lý lỗi/lỗi mạng tốt, accessibility (a11y) tốt. |
| **Giới hạn cốt lõi** | Bí mật HMAC nằm ngay trong mã nguồn công khai → **ai đọc code cũng tự tạo key hợp lệ**; trạng thái nhiệm vụ nằm trong `localStorage` nên sửa được. Đây là giới hạn của mọi phương án chạy hoàn toàn phía trình duyệt (đã ghi rõ trong README). |

---

## 2. Cấu trúc vật lý

| Dòng | Khối | Nội dung |
|---|---|---|
| 1–8 | `<head>` mở đầu | `<!DOCTYPE>`, `lang="vi"`, `<meta charset>` ở **dòng 5** (trong 1 KB đầu — đúng khuyến nghị spec), description, viewport `viewport-fit=cover`, theme-color. |
| 10–525 | `<style>` duy nhất | ~23 KB CSS: theme tối "cyber" (glassmorphism, lưới nền, nebula blur), task card, modal, toast, vòng quay số, responsive 650/420/380 px + `prefers-reduced-motion`. |
| 527–669 | Markup | `main#giao-dien-chinh` (đồng hồ phiên, hero, ô tên, 4 task card, nút mở khoá, nút reset) + modal `#white-screen` (key, vòng quay, ô câu lệnh mẫu). |
| 671–1422 | `<script>` duy nhất | Toàn bộ logic: cấu hình → `localStorage` an toàn → **mã hoá v5 (705–889)** → lấy IP/mã thiết bị → phiên & nhiệm vụ → modal/quay số/sao chép → tilt 3D. |

Chỉ **1 khối `<style>` + 1 khối `<script>`** — các khối rác của bản cũ (CSS quảng cáo giả, script gửi log ra `window.parent`, `<script>` rỗng) đã bị dọn sạch. 39 `id`, **không trùng id nào**.

Điểm khác biệt còn lại so với "trang tĩnh thuần": `@import` font **Plus Jakarta Sans** từ Google Fonts (dòng 11) — phụ thuộc ngoài duy nhất về tài nguyên, có `display=swap` nên không nghẽn render.

---

## 3. Luồng nghiệp vụ

```
Nhập tên (≤ 32 ký tự) ─┐
                        ├─ đủ cả ─▶ nút "XEM KEY FREE_V5_" ─▶ modal hiện key
4/4 nhiệm vụ ───────────┤
Phiên 3 phút còn hạn ───┘
```

1. **Tên**: lưu `localStorage` khoá `taodepzai_player_name`, giữ lại khi reset phiên; nhập tay thì cờ "tên từ Roblox" bị hạ về 0. **Khoá tên** (`tenDaKhoa`/`capNhatKhoaTen`): từ khi đủ tên + 4/4 nhiệm vụ (phiên còn hạn), ô tên bị `disabled` và chú thích chuyển sang thông báo khoá; chỉ mở lại khi hết phiên 3 phút hoặc bấm "Làm mới phiên". Nếu làm xong nhiệm vụ rồi mới nhập tên thì chỉ khoá sau khi rời ô nhập / bấm Enter (tránh khoá nhầm tên gõ dở), và link `?mahoa=`/`?ten=` lúc này cũng không đổi được tên.
2. **Phiên**: cú bấm nhiệm vụ đầu tiên tạo `session_expire = now + 3 phút`; hết hạn → `resetPhien('expired')` xoá trạng thái 4 cổng + số quay + nonce.
3. **Nhiệm vụ**: bấm cổng → `batDauNhiemVu()` (1178) đặt `status=checking`; rời tab (`blur`/`visibilitychange`) chỉ ghi `leftAt` cho **cổng vừa bấm** (`ghiNhanRoiTrang`, 1194); quay lại → `kiemTraTienTrinhNhiemVu()` (1206): rời ≥ 5 s ⇒ `success` + `completedAt`, sớm hơn ⇒ `error` tự xoá sau 2,5 s. Bốn cổng theo dõi độc lập, không cần thứ tự.
4. **Phát key**: key lấy **thời điểm của nhiệm vụ hoàn thành cuối cùng** (`lanHoanThanhCuoi`, 915) + số quay 3 chữ số + nonce 16 byte.
5. **Ổn định qua F5**: nonce + số quay lưu `localStorage` (khoá `taodepzai_nonce`, `taodepzai_so_quay`); "Quay số mới" hoặc reset phiên mới đổi key. Khối khôi phục cuối file (1390) dọn trạng thái `checking`/`error` dở dang không hợp lệ sau F5 thay vì tính nhầm.

### Link vào từ script Roblox (`?mahoa=` / `?ten=`)

- `?mahoa=<bản mã>` → `giaiMaTen()` (855) giải bằng HMAC với nhãn `tdz4|ten|…` (khớp `NHAN_TEN_TAG/NHAN_TEN_KHOA` trong `script.js`), kiểm tag 12 byte, bắt buộc UTF-8 hợp lệ, ≤ 32 ký tự, không có khoảng trắng đầu/cuối; thành công thì tự điền tên + đặt cờ `taodepzai_ten_tu_link='1'` → key mang bit cờ "tên lấy từ Roblox" (để script bật `YEU_CAU_TEN_TU_ROBLOX` chỉ nhận loại này).
- Link hỏng/sai tag → toast lỗi, không điền bừa. Sau khi xử lý, `history.replaceState` **xoá tham số khỏi thanh địa chỉ** để tên không lộ khi chia sẻ ảnh/link (dòng 936).

### Mã thiết bị từ IP

Trang tự lấy IP công khai qua 3 nguồn dự phòng có timeout 7 s (`ipify → icanhazip → ident.me`, chỉ IPv4, dòng 875/996), băm `SHA256('taodepzai|thiet-bi|ip:'+ip)` lấy 10 ký tự Crockford-base32 làm "mã thiết bị". Không lấy được thì dùng mã dự phòng từ `0.0.0.0` để không kẹt nút, IP thật thay sau (1014). IP **không hiện ở đâu** và request không kèm tham số cá nhân nào. Mã thiết bị hiển thị dạng `XXXX-XXXX-XXXX` với 2 ký tự kiểm tra (2 ký tự cuối = băm của 10 ký tự đầu) — `chuanHoaMaThietBi()` (788) còn chống gõ nhầm `O→0`, `I/L→1`.

---

## 4. Mã hoá key `Free_v5_` (dòng 705–889)

```
Free_v5_ + base64url( nonce 16 byte | tag 32 byte | bản mã )
bản rõ   = [ 5 | cờ tên-từ-Roblox | số quay (2B) | thời điểm hoàn thành ms (6B)
             | id nhiệm vụ cuối (1B) | mã thiết bị (10B) | tên UTF-8 ]
chuỗi trộn = 'tdz5|tron|' + mã thiết bị + '|' + tên + '|' + 'YYYY-MM-DD HH:MM:SS.mmm' (UTC)
             + '|' + số quay + '|' + cờ
khoá con = HMAC-SHA256(BI_MAT, chuỗi trộn)
tag      = HMAC-SHA256(khoá con, 'tdz5|tag|' + nonce + bản rõ)        ← 256 bit
khoá     = HMAC-SHA256(BI_MAT, 'tdz5|enc|' + nonce + tag)
bản mã   = bản rõ XOR dòng khoá SHA256(khoá ‖ j), j = 0, 1, …
```

Nhận xét kỹ thuật:

- **SHA-256/HMAC tự viết** (723–773) thay vì `crypto.subtle` — vì `crypto.subtle` chỉ hoạt động trên HTTPS/`localhost`, còn trang phải chạy cả khi mở file cục bộ; đánh đổi bằng ~60 dòng mã mật mã tự implement. Đã đối chiếu kết quả với test round-trip của repo (test 15–16 pass).
- **Hai tầng khoá** (khoá con theo chuỗi trộn, rồi khoá mã hoá theo nonce+tag): đổi 1 ký tự tên/thời điểm/mạng là tag hỏng; sửa bản mã thì giải ra rác và tag không khớp. Cấu trúc Encrypt-then-MAC đúng chuẩn.
- **Nonce 16 byte** từ `crypto.getRandomValues` (fallback `Math.random` nếu API bị chặn) — mỗi lần quay cho key khác hẳn dù cùng dữ liệu.
- **Thiết kế khớp `script.js` có kiểm chứng**: `BI_MAT` (dòng 717) giống hệt `BI_MAT_V4` (script.js:446); bộ test `tests/portal.test.cjs` có test đối chiếu cấu hình 2 tệp và round-trip v5 — **đang pass**.
- `chuoiTron()` (820) tái tạo chuỗi trộn từ chính bản rõ — đồng bộ với `ChuoiTron` phía Lua.
- Thời điểm 6 byte đủ đến năm ~10889; số quay 2 byte (0–999 được kiểm tra ở `laySoQuay`, 1063).

---

## 5. Chất lượng UI / mã nguồn — những điểm làm tốt

1. **Không XSS**: mọi dữ liệu người dùng (tên, trạng thái, toast) chỉ đi qua `textContent` / `.value` / `setAttribute('aria-label', …)` — không có `innerHTML` với dữ liệu động.
2. **`localStorage` bọc `try/catch` + `Map` dự phòng** (685): trang vẫn chạy khi storage bị chặn (private mode nghiêm ngặt, iframe).
3. **A11y tốt hiếm thấy ở dạng trang này**: `role="status" aria-live` cho toast/đồng hồ/vòng quay, `aria-modal` + focus trap + `Escape` đóng modal + trả focus về phần tử trước khi mở, `:focus-visible`, `aria-hidden` cho lớp trang trí, `prefers-reduced-motion` tắt animation lẫn hiệu ứng tilt.
4. **Responsive thật**: 3 breakpoint + safe-area-inset + `touch-action: pan-y` và logic tilt chạm né vùng cuộn danh sách nhiệm vụ (1402–1418) — chi tiết cho thấy đã test trên di động.
5. **Chống chép nhầm key cũ khi đang quay**: nút copy bị disable giữa animation quay (1262).
6. **Đồng bộ đa tab** qua `storage` event (1372): đổi tên/quay số ở tab khác cập nhật modal đang mở.
7. **Sao chép có fallback** `document.execCommand('copy')` khi Clipboard API bị chặn (1333).
8. Chú thích mã dày, giải thích *tại sao* (ví dụ vì sao cần mã dự phòng IP, vì sao giữ nonce qua F5) — dễ bảo trì.

---

## 6. Vấn đề, rủi ro và khuyến nghị

### 6.1 Bảo mật — giới hạn nền tảng (đã biết, không sửa được ở kiến trúc này)

| # | Vấn đề | Bằng chứng trong file | Khuyến nghị |
|---|---|---|---|
| 1 | **`BI_MAT` công khai** ngay trong trang (dòng 717). Ai đọc mã nguồn tự tạo key `Free_v5_` hợp lệ cho mọi tên/thời điểm/mã thiết bị — key không chứng minh người chơi đã làm nhiệm vụ. | `const BI_MAT = 'z!V~~RO3mS2dCMvW-…'` | Muốn key thật: máy chủ cấp key ngẫu nhiên 128+ bit + DB + API xác minh. Trang này chỉ nên dùng nội bộ/demo. |
| 2 | Trạng thái nhiệm vụ + mốc thời gian trong `localStorage` — **sửa được bằng DevTools**; hoàn thành "5 giây ở tab khác" chỉ đo bằng `blur/focus` của trình duyệt, không xác minh nội dung liên kết. | `luu.set('status…','success')` (1219) | Chấp nhận nếu là demo; ghi rõ cho người dùng (đã có footnote dòng 668). |
| 3 | `SCRIPT_CUA_BAN` (dòng 675) là `loadstring(game:HttpGet("https://raw.githubusercontent.com/HieudepzaiHub/main/abc"))()` — ô sao chép cho người dùng chạy thẳng mã từ repo khác, không ghim commit/tag. | dòng 675, textarea `#noi-dung-page2` | Ghim commit/tag cụ thể và cảnh báo kiểm tra nguồn (trang đã có dòng cảnh báo "kiểm tra nguồn trước khi chạy" — tốt, nên giữ). |
| 4 | `script.js` mặc định vẫn nhận `Free_v2_` (`CHAP_NHAN_KEY_V2 = true`, bản không có tag) và `DisplayName` (`CHAP_NHAN_TEN_HIEN_THI = true`, mạo danh được). Đây là cấu hình phía script nhưng ảnh hưởng trực tiếp giá trị của key trang này phát hành. | script.js:31, 38 | Đặt cả hai về `false` khi phát hành thật. |

### 6.2 Lỗi nhỏ / rác kỹ thuật

| # | Vấn đề | Vị trí | Ghi chú |
|---|---|---|---|
| 1 | ~~CSS chết: `.player-help.ok` và `.player-help.loi`~~ — **đã hết chết**: tính năng khoá tên dùng `.ok` cho thông báo "tên đã khoá" và `.loi` cho cảnh báo "nhập đúng tên trước khi bị khoá". | dòng ~242 | Không cần xoá nữa. |
| 2 | Selector `.copy-key-btn` trong nhóm reset font/cursor (~dòng 334) không khớp phần tử nào — nút đó dùng `id="copy-key-btn"` (đã có rule `#copy-key-btn` riêng). | `<style>` | Vô hại nhưng gây hiểu nhầm; đổi thành `#copy-key-btn`. |
| 3 | `setInterval` 500 ms chạy vĩnh viễn (đồng hồ + nhãn "checking") — tốn rất nhỏ nhưng không bao giờ dừng kể cả khi modal đóng và phiên chưa bắt đầu. | dòng ~1385 | Có thể gác bằng điều kiện hoặc tăng chu kỳ khi idle. |
| 4 | Font Google là phụ thuộc ngoài duy nhất; offline hoàn toàn thì rơi về `system-ui` (đã khai báo fallback) — chấp nhận được, nhưng nếu muốn "0 phụ thuộc" thì bỏ `@import`. | dòng 11 | Tuỳ mục tiêu. |
| 5 | `soNgauNhien3()` dùng `% 1000` trên `Uint32` — lệch phân phối ~0,00002%, không đáng kể với mục đích thẩm mỹ. | dòng 985 | Không cần sửa. |
| 6 | Khi người dùng bấm cổng 1 rồi bấm tiếp cổng 2 khi chưa quay lại, `congVuaMo` bị ghi đè — cổng 1 dừng ở `checking` không có `leftAt` và chỉ được dọn khi F5/reset. Luồng thực tế khó xảy ra (link mở tab mới, blur đến trước click kế tiếp) nhưng là góc cạnh nên biết. | `batDauNhiemVu` (1178) | Có thể tự đánh dấu `error` cho cổng bị bỏ rơi. |

### 6.3 Riêng tư

- IP công khai được gửi (bản chất của việc hỏi IP) tới 3 dịch vụ `ipify / icanhazip / ident.me`; request **không kèm tên, nhiệm vụ hay tham số nào khác** — đã kiểm tra mã `fetch(url, { cache: 'no-store' })` (dòng 999). Trang không gửi dữ liệu đi đâu khác.
- Tên không xuất hiện trên URL sau khi xử lý link `?mahoa=`/`?ten=` (đã `replaceState`).
- Nếu muốn tuyệt đối riêng tư: bỏ khối lấy IP, dùng hằng mã thiết bị cố định — script mặc định không bắt trùng mạng.

---

## 7. Kiểm chứng đã thực hiện (2026-09-30, commit `e96e04f`)

| Kiểm tra | Kết quả |
|---|---|
| `node --test tests/portal.test.cjs` | ✅ **17/17 pass** (luồng nhiệm vụ, phiên 3 phút, `?mahoa=`, round-trip v5, **khớp cấu hình với `script.js`**) |
| So `BI_MAT` (index.html:717) với `BI_MAT_V4` (script.js:446) | ✅ giống hệt |
| Quét trùng `id` | ✅ 39 id, 0 trùng |
| Quét CSS chết (script tự viết) | Chỉ còn selector `.copy-key-btn` (mục 6.2); `.player-help.ok`/`.loi` đã được tính năng khoá tên sử dụng |
| Quét `innerHTML`/XSS với dữ liệu người dùng | ✅ không có |
| `index.html` so với `PHAN-TICH.md` cũ | Các lỗi bản cũ (khối rác, meta charset trễ, test gãy) **đã được sửa hết** ở bản này |

## 8. Kết luận

`index.html` hiện tại là một trang phát key **hoàn chỉnh, tự chứa, chất lượng mã cao**: kiến trúc 1 tệp gọn, mã hoá v5 chuẩn Encrypt-then-MAC đồng bộ và được kiểm chứng tự động với `script.js`, UI/a11y/responsive chăm chút, xử lý lỗi mạng/lưu trữ/đa tab đầy đủ. Hai việc đáng làm nếu dùng thật: (1) xoá 3 mẩu CSS chết ở mục 6.2; (2) hiểu rõ và chấp nhận giới hạn "bí mật trong mã nguồn công khai" — hoặc chuyển sang máy chủ cấp key. Với mục đích demo/học thuật như chú thích tự khai trong mã, tệp này đạt yêu cầu.
