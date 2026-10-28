# Taodepzai · trang phát key `Free_v5_`

Trang HTML tĩnh `index.html` (GitHub Pages: `https://mncuadaigmailcom.github.io/taodepzai/`) tạo **key
`Free_v5_`** sau khi người dùng nhập tên và "hoàn thành" 4 nhiệm vụ. Key này được **`key-system.lua`**
(script nhập key chạy trên executor Roblox) giải mã và xác thực trước khi tải script chính.
**Hệ thống chỉ có một loại key `Free_v5_`** — mọi key bản cũ (`Free_v2_`, `Free_v4_`…) đều bị từ chối.

Chạy tại máy: `python3 -m http.server 8000` rồi mở `http://localhost:8000`.
Chạy kiểm thử: `node --test tests/portal.test.cjs` (17 test) và
`python3 tests/key_system_lua_test.py` (test Luau thật, cần `pip install lupa`).

## Luồng lấy key (thiết kế lại)

1. Trong game chạy lệnh tải `key-system.lua` (mục "Câu lệnh mẫu" trên trang, hoặc
   `loadstring(game:HttpGet("https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/main/key-system.lua"))()`).
2. Nhấn nút **Lấy key** (1 lần): script sao chép **link trực tiếp**
   `https://mncuadaigmailcom.github.io/taodepzai/?mahoa=<tên đã mã hoá>` — **không** qua link rút gọn /
   trang trung gian — và thử tự mở trình duyệt. Không tự mở được thì dán link đã sao chép vào trình duyệt.
3. Trang web tự điền đúng tên Roblox; hoàn thành 4 nhiệm vụ → nhận key `Free_v5_` (hạn 24 giờ).
4. Dán key vào game: `key-system.lua` kiểm tra tag 256 bit, đúng username, cờ "tên từ link Roblox"
   (`YEU_CAU_TEN_TU_ROBLOX = true` — key gõ tay trên web bị từ chối), còn hạn → chạy script chính.

| Tệp | Việc |
|---|---|
| `index.html` | Trang phát key (HTML + CSS + JS nội tuyến, không phụ thuộc thư viện ngoài) |
| `key-system.lua` | **Luau/Lua** — script nhập key cho executor: chỉ nhận `Free_v5_`, nút Lấy key sao chép link trực tiếp |
| `script.js` | Script chính (hub) mà người dùng chạy sau khi qua cổng key (không chứa key system) |
| `PHAN-TICH.md` | Phân tích 2 tệp trên: kiến trúc, lỗi, rủi ro, bằng chứng chạy thật |
| `LUA_HOP_DONG.md` | Hợp đồng kỹ thuật của `script.js`: cờ cấu hình, định dạng key, `KiemTraKey`, checklist đồng bộ |
| `tools/decode-demo.cjs` | Đọc tên / nhiệm vụ / số quay / mã thiết bị / thời điểm trong key `Free_v5_` |
| `tools/kiem-tra-key.cjs` | Mô phỏng `KiemTraKey` của `key-system.lua`: cho biết script có chấp nhận key hay không |
| `tests/portal.test.cjs` | 17 test: luồng nhiệm vụ, phiên 3 phút, `?mahoa=`, round-trip v5, từ chối v4/v2/key sửa, khớp cấu hình với `key-system.lua` |
| `tests/key_system_lua_test.py` | Test Luau thật (lupa): biên dịch `key-system.lua`, key JS tạo → Lua giải đúng, key cũ/sửa bị từ chối |

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
- Hạn **24 giờ** tính từ lúc hoàn thành nhiệm vụ cuối; `key-system.lua` lấy giờ máy chủ Roblox nên chỉnh đồng hồ
  máy không gia hạn được.
- Mở trang bằng nút **Lấy key** trong script (`…/?mahoa=<tên đã mã hoá>`) thì tên tự điền và key được đánh
  dấu "tên lấy từ Roblox". Bản mới đặt `YEU_CAU_TEN_TU_ROBLOX = true` nên **chỉ** loại key này được nhận;
  key tạo bằng tên gõ tay trên web (hoặc link `?ten=` cũ) sẽ bị từ chối trong game.
- Trang tự lấy IP công khai qua 3 nguồn (ipify → icanhazip → ident.me) để trộn mã hoá; **không hiện ở đâu cả**
  và không gửi đi nơi khác.

## Công cụ

```bash
# Đọc thông tin trong key (không cần Roblox)
node tools/decode-demo.cjs 'Free_v5_...'

# Script Roblox có chấp nhận key này không? (đọc cấu hình thẳng từ script.js)
node tools/kiem-tra-key.cjs 'Free_v5_...' "TenTaiKhoan" --ip=203.0.113.7
```

`decode-demo.cjs` chỉ đọc `Free_v5_`; key bản cũ bị báo không hỗ trợ. Mã `Free_` 14 ký tự hash đời đầu **không thể đọc ngược tên**.

## Cấu hình trang

Tìm ở đầu khối `<script>` trong `index.html`:

- `NHIEM_VU`: thay bốn `url` và `ten` bằng liên kết thật.
- `DANG_LA_BAN_MAU = false` sau khi thay liên kết (chỉ đổi nhãn "Liên kết mẫu").
- `SCRIPT_CUA_BAN`: câu lệnh mẫu hiện trong mục "Câu lệnh mẫu tải script (tùy chọn)" — **kiểm tra nguồn
  trước khi chạy**; đây chỉ là ô sao chép, trang không tự chạy gì.
- `BI_MAT` **phải giống `BI_MAT` trong `key-system.lua`** (test số 2 sẽ báo nếu lệch).

## ⚠ Giới hạn bảo mật — đọc trước khi dùng thật

1. **Bí mật nằm trong mã nguồn công khai** (`index.html`, `script.js`, `tools/`). Ai đọc code cũng tự tạo
   được key `Free_v4_`/`Free_v5_` hợp lệ cho bất kỳ tên/ngày giờ/mạng nào — **đã kiểm chứng bằng thực nghiệm**
   (xem `PHAN-TICH.md` §6.4). Key không chứng minh người chơi đã làm nhiệm vụ.
2. ~~`script.js` còn nhận key `Free_v2_` cũ~~ — **đã vá ở bản thiết kế lại**: `key-system.lua` chỉ nhận
   `Free_v5_`, không còn cờ chấp nhận bản cũ.
3. ~~`CHAP_NHAN_TEN_HIEN_THI = true`~~ — **đã vá**: bản mới đặt `false`, chỉ so username Roblox.
4. Thời gian/trạng thái nhiệm vụ nằm trong `localStorage` trình duyệt và **có thể bị sửa**; trang không xác
   minh nội dung của liên kết nhiệm vụ.
5. `key-system.lua` tải script chính từ **repo khác** (`SCRIPT_URL`) rồi `loadstring` chạy thẳng — nên ghim
   commit/tag và kiểm tra nội dung nếu phát hành cho người khác dùng.

Muốn key **dùng được thật, thu hồi được, chỉ chủ trang tra được tên**: cần máy chủ cấp key (key ngẫu nhiên
128+ bit, lưu hash + trạng thái trong DB, API xác minh nhiệm vụ, trang quản trị có xác thực). Không thể đạt
được điều đó bằng mã chạy hoàn toàn trong trình duyệt / trên máy người chơi.

Danh sách lỗi chi tiết và thứ tự khắc phục: `PHAN-TICH.md` §7.
