# Taodepzai · trang phát key `Free_v5_`

Trang HTML tĩnh `index.html` (GitHub Pages: `https://mncuadaigmailcom.github.io/taodepzai/`) tạo **key
`Free_v5_`** sau khi người dùng nhập tên và "hoàn thành" 4 nhiệm vụ. Key này được `script.js` (key system
chạy trên executor Roblox) giải mã và xác thực trước khi tải script chính.

Chạy tại máy: `python3 -m http.server 8000` rồi mở `http://localhost:8000`.
Chạy kiểm thử: `node --test tests/portal.test.cjs` (17 test).

| Tệp | Việc |
|---|---|
| `index.html` | Trang phát key (HTML + CSS + JS nội tuyến, không phụ thuộc thư viện ngoài) |
| `script.js` | **Luau/Lua** — key system cho executor (tên tệp giữ nguyên để không phá URL phát hành) |
| `PHAN-TICH.md` | Phân tích 2 tệp trên: kiến trúc, lỗi, rủi ro, bằng chứng chạy thật |
| `LUA_HOP_DONG.md` | Hợp đồng kỹ thuật của `script.js`: cờ cấu hình, định dạng key, `KiemTraKey`, checklist đồng bộ |
| `tools/decode-demo.cjs` | Đọc tên / nhiệm vụ / số quay / mã thiết bị / thời điểm trong key (v5, v4, v2) |
| `tools/kiem-tra-key.cjs` | Mô phỏng `KiemTraKey` của `script.js`: cho biết script có chấp nhận key hay không |
| `tests/portal.test.cjs` | 17 test: luồng nhiệm vụ, phiên 3 phút, `?mahoa=`, round-trip v5, khớp cấu hình với `script.js` |

## Cách hoạt động

Bốn nhiệm vụ xếp một cột. Người dùng **phải nhập tên** (≤ 32 ký tự) và hoàn thành **đủ 4 nhiệm vụ** trong
phiên 3 phút (không cần theo thứ tự); mỗi nhiệm vụ theo dõi riêng 5 giây rời tab, quay lại sớm chỉ báo lỗi
nhiệm vụ đó. Sau 4/4, trang lấy **thời điểm của nhiệm vụ hoàn thành cuối cùng** + số quay 3 số (đổi bằng nút
"Quay số mới") + mã mạng + tên để tạo key.

Key **ổn định sau F5** nếu vẫn cùng tên và cùng phiên; đổi tên / quay số mới / làm mới phiên sẽ tạo key khác.
Tên được lưu trong trình duyệt và **giữ lại khi làm mới phiên**; trạng thái nhiệm vụ và mốc thời gian thì bị
xoá sau 3 phút hoặc khi bấm nút làm mới. Key đã sao chép đi vẫn đọc lại được sau khi làm mới.

### Key `Free_v5_` là gì

```
Free_v5_ + base64url( nonce 16 byte | tag 32 byte | bản mã )
bản rõ = [5, cờ tên-từ-Roblox, số quay (2B), thời điểm hoàn thành ms (6B), nhiệm vụ, mã thiết bị (10), tên UTF-8]
tag    = HMAC-SHA256(khoá con, 'tdz5|tag|' + nonce + bản rõ)          -- 256 bit, sửa 1 ký tự là hỏng
khoá   = HMAC-SHA256(BI_MAT, 'tdz5|enc|' + nonce + tag)
```

- Nhìn key **không đọc được** tên, ngày giờ hay mã thiết bị; mỗi lần quay (nonce mới) cho key khác hẳn.
- Hạn **24 giờ** tính từ lúc hoàn thành nhiệm vụ cuối; `script.js` lấy giờ máy chủ Roblox nên chỉnh đồng hồ
  máy không gia hạn được.
- Mở trang bằng nút **Lấy key** trong script (`…/?mahoa=<tên đã mã hoá>`) thì tên tự điền và key được đánh
  dấu "tên lấy từ Roblox" (script có thể bật `YEU_CAU_TEN_TU_ROBLOX` để chỉ nhận loại này). Link `?ten=` cũ
  vẫn dùng được nhưng không có cờ đó.
- Trang tự lấy IP công khai qua 3 nguồn (ipify → icanhazip → ident.me) để trộn mã hoá; **không hiện ở đâu cả**
  và không gửi đi nơi khác.

## Công cụ

```bash
# Đọc thông tin trong key (không cần Roblox)
node tools/decode-demo.cjs 'Free_v5_...'

# Script Roblox có chấp nhận key này không? (đọc cấu hình thẳng từ script.js)
node tools/kiem-tra-key.cjs 'Free_v5_...' "TenTaiKhoan" --ip=203.0.113.7
```

`decode-demo.cjs` đọc được cả bản cũ `Free_v4_` (vẫn được `script.js` chấp nhận) và `Free_v2_` (bản XOR cũ,
**không có mã kiểm tra** — công cụ sẽ cảnh báo). Mã `Free_` 14 ký tự hash đời đầu **không thể đọc ngược tên**.

## Cấu hình trang

Tìm ở đầu khối `<script>` trong `index.html`:

- `NHIEM_VU`: thay bốn `url` và `ten` bằng liên kết thật.
- `DANG_LA_BAN_MAU = false` sau khi thay liên kết (chỉ đổi nhãn "Liên kết mẫu").
- `SCRIPT_CUA_BAN`: câu lệnh mẫu hiện trong mục "Câu lệnh mẫu tải script (tùy chọn)" — **kiểm tra nguồn
  trước khi chạy**; đây chỉ là ô sao chép, trang không tự chạy gì.
- `BI_MAT` **phải giống `BI_MAT_V4` trong `script.js`** (test số 2 sẽ báo nếu lệch).

## ⚠ Giới hạn bảo mật — đọc trước khi dùng thật

1. **Bí mật nằm trong mã nguồn công khai** (`index.html`, `script.js`, `tools/`). Ai đọc code cũng tự tạo
   được key `Free_v4_`/`Free_v5_` hợp lệ cho bất kỳ tên/ngày giờ/mạng nào — **đã kiểm chứng bằng thực nghiệm**
   (xem `PHAN-TICH.md` §6.4). Key không chứng minh người chơi đã làm nhiệm vụ.
2. **`script.js` còn nhận key `Free_v2_` cũ** (`CHAP_NHAN_KEY_V2 = true`): bản này **không có mã kiểm tra**,
   chỉ cần 5 dòng Python là bịa được key 24 giờ mà không mở trang. Nên đặt `false`.
3. **`CHAP_NHAN_TEN_HIEN_THI = true`** cho phép dùng key qua `DisplayName` — mà `DisplayName` không duy
   nhất, nên có thể bị mạo danh: đặt `false` nếu cần chặt.
4. Thời gian/trạng thái nhiệm vụ nằm trong `localStorage` trình duyệt và **có thể bị sửa**; trang không xác
   minh nội dung của liên kết nhiệm vụ.
5. `script.js` tải script chính từ **repo khác** (`SCRIPT_URL`) rồi `loadstring` chạy thẳng — nên ghim
   commit/tag và kiểm tra nội dung nếu phát hành cho người khác dùng.

Muốn key **dùng được thật, thu hồi được, chỉ chủ trang tra được tên**: cần máy chủ cấp key (key ngẫu nhiên
128+ bit, lưu hash + trạng thái trong DB, API xác minh nhiệm vụ, trang quản trị có xác thực). Không thể đạt
được điều đó bằng mã chạy hoàn toàn trong trình duyệt / trên máy người chơi.

Danh sách lỗi chi tiết và thứ tự khắc phục: `PHAN-TICH.md` §7.
