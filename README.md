# Trang tạo mã demo Free_ cho Taodepzai

Trang HTML tĩnh tại `index.html`. Mở tệp trong trình duyệt hoặc chạy `python3 -m http.server 8000` để xem trên máy. Chạy kiểm thử bằng `node --test tests/portal.test.cjs`.

## Mã Free_v4_ (mã hoá HMAC-SHA256 + mã thiết bị)

Để tạo key, người dùng chỉ cần nhập **tên người chơi** và hoàn thành 4 nhiệm vụ. **Mã mạng được lấy ngầm theo IP của điện thoại** (4G, 5G hoặc wifi), không cần nhập và không hiện ở đâu:

- **Trang web:** khi mở trang (và khi quay lại trang), trang gọi lần lượt `https://api.ipify.org`, `https://ipv4.icanhazip.com`, `https://v4.ident.me` (chỉ IPv4) để lấy IP công khai.
  - IP được chuẩn hoá rồi băm SHA-256 (`"taodepzai|thiet-bi|ip:" + ip`) thành mã mạng 10 ký tự.
  - Không lấy được IP thì giữ mã đã có; nếu chưa có thì dùng mã dự phòng `ip:0.0.0.0`, nên vẫn tạo được key.
- **Chuỗi trộn:** mã mạng + tên + ngày tháng năm giờ phút giây mili giây (UTC) + số quay ghép thành một chuỗi riêng, rồi băm thành **khoá con** để mã hoá key (xem bên dưới).
- **Đổi mạng vẫn dùng được:** mặc định script Roblox **không** bắt cùng mạng (`KIEM_TRA_THIET_BI = false`) và không gọi dịch vụ IP nào. Lấy key xong chuyển từ wifi sang 4G/5G (hoặc ngược lại) vẫn xác nhận được, key đã lưu vẫn tự điền.
  - Muốn bắt buộc cùng mạng thì đặt `KIEM_TRA_THIET_BI = true`: script sẽ tự lấy IP và từ chối key tạo ở mạng khác.
- Nút **Lấy key** trong game sao chép link trang kèm `?ten=...` để trang tự điền tên. Trang đọc xong thì xoá tham số khỏi thanh địa chỉ.
- **Không hiện ngày giờ ở đâu cả.** Dòng dưới vòng quay chỉ còn chữ mô tả cố định. Thời điểm, tên và mã thiết bị chỉ nằm trong key ở dạng đã mã hoá.
- **Vòng quay 3 số:** mỗi lần quay sẽ đổi số và đổi **nonce ngẫu nhiên 96 bit** (`crypto.getRandomValues`), nên key luôn khác, kể cả khi trùng số. Key vẫn giữ nguyên sau F5; làm mới phiên thì đổi nonce.

Cấu trúc key (`taoMaDemo`, nằm giữa hai dòng `// === MÃ HOÁ V4 ... ===` trong `index.html`). Phần này giống hệt `key-system.lua`, `tools/decode-demo.cjs` (dùng `node:crypto`) và bản Python trong test:

```
Free_v4_ + base64url( nonce 12 byte | tag 16 byte | bản mã )
bản rõ = [4, số quay (2 byte), thời điểm ms (6 byte), nhiệm vụ 1–4, mã thiết bị (10 ký tự), tên UTF-8]
chuỗi trộn = "tdz4|tron|" + mã mạng + "|" + tên + "|" + "YYYY-MM-DD HH:MM:SS.mmm" (UTC) + "|" + số quay (3 chữ số)
khoá con   = HMAC-SHA256(BI_MAT_V4, chuỗi trộn)
tag    = HMAC-SHA256(khoá con, "tdz4|tag|" + nonce + bản rõ)[0..16]
khoá   = HMAC-SHA256(BI_MAT_V4, "tdz4|enc|" + nonce + tag)
bản mã = bản rõ XOR SHA256(khoá + 0) SHA256(khoá + 1) ...
```

- **Không đọc được bằng mắt:** nhìn key không biết tên, ngày giờ hay mã thiết bị.
- **Thay đổi nhỏ làm key khác hẳn:** chỉ khác 1 mili-giây hay 1 chữ trong tên thì gần như toàn bộ key đổi.
- **Không sửa hay bịa được bằng tay:** tag có 128 bit, nên sửa 1 ký tự hoặc tự bịa key đều bị phát hiện.
- **Độ dài:** key dài khoảng 75–240 ký tự, tuỳ độ dài tên.

**Giới hạn:** `BI_MAT_V4` vẫn nằm trong mã nguồn trang (trang tĩnh không giấu được bí mật). Người đọc code vẫn có thể tự viết chương trình tạo key. Muốn chặn hẳn cần máy chủ cấp key giữ bí mật riêng.

## Cấu hình liên kết

Tìm mảng `NHIEM_VU` ở cuối `index.html`:

- Thay bốn giá trị `url` và tên `ten` bằng các liên kết thật khi đã có.
- Đổi `DANG_LA_BAN_MAU = false` sau khi thay liên kết; **cảnh báo mã demo luôn được giữ**.
- `SCRIPT_CUA_BAN` giữ nguyên nội dung từ trang trước; cần kiểm tra đường dẫn và mã từ xa trước khi sử dụng.

## Cách hoạt động

Bốn nhiệm vụ xếp thành một cột. Người dùng **phải nhập tên** (mã mạng tự lấy ngầm) và hoàn thành **đủ cả bốn nhiệm vụ** trong phiên 3 phút, không cần theo thứ tự. Mỗi nhiệm vụ theo dõi riêng 5 giây rời tab; quay lại sớm chỉ báo lỗi nhiệm vụ đó.

Khi một nhiệm vụ hoàn thành, thời điểm hoàn thành được lưu trong trình duyệt. Sau 4/4, trang lấy **thời điểm của nhiệm vụ hoàn thành cuối cùng** và ID nhiệm vụ đó cùng tên người chơi để tạo mã `Free_v4_...` (đã mã hoá, xem trên). Mã ổn định sau F5 nếu vẫn cùng tên, phiên và số vòng quay; đổi tên, bấm **🎰 Quay số mới** hoặc tạo phiên mới sẽ tạo mã khác. Tên được lưu trong trình duyệt và giữ lại khi reset phiên, còn trạng thái nhiệm vụ và mốc thời gian được reset sau 3 phút hoặc khi bấm nút làm mới. Bản sao của mã đã gửi đi vẫn có thể đọc được sau khi reset.

Để đọc tên từ **mã demo mới**, tại thư mục repo chạy:

```bash
node tools/decode-demo.cjs 'Free_v4_...'
```

Công cụ này chỉ dành cho chủ trang (cần `BI_MAT_V4`). Nó in ra tên gốc, ID nhiệm vụ cuối, thời điểm hoàn thành dạng UTC, số vòng quay và mã thiết bị. Mã `Free_v2_` cũ vẫn đọc được. Các mã cũ có **14 ký tự sau `Free_`** là hash một chiều, **không thể đọc ngược tên**; hãy dùng bản trang mới để tạo mã `Free_v4_...` (nếu phiên cũ đã hết hạn, cần làm lại bốn nhiệm vụ). Công cụ không xác nhận được mã có thật hoặc người chơi đã làm nhiệm vụ: ai đọc mã nguồn cũng có thể tự tạo mã giả.

Trang vẫn có đếm ngược, reset thủ công/tự động, thông báo, hiệu ứng 3D, sao chép mã demo và sao chép script cũ. Tên trên cửa sổ nhận mã được thu gọn theo mặc định để không lộ ngay khi chia sẻ ảnh; trường tên trong trang chính vẫn hiển thị khi người dùng nhập.

**Lưu ý quan trọng:** Mã `Free_` này **chỉ để minh họa, không kích hoạt script Taodepzai**. Key được mã hoá HMAC-SHA256, nhưng bí mật nằm trong mã nguồn công khai. Vì vậy người đọc code vẫn giải hoặc tạo được key; không nhập thông tin nhạy cảm. Thời gian/trạng thái trong trình duyệt có thể bị chỉnh sửa và trang không xác minh người dùng đã xem liên kết. Muốn cấp key sử dụng được và chỉ chủ trang tra tên, cần máy chủ lưu key–tên cùng trang quản trị có xác thực; không để bí mật trong mã nguồn trình duyệt.

## Script nhập key cho Roblox (`key-system.lua`)

Script mở bảng nhập key trong game. Nó giải mã key `Free_v4_...` bằng cùng thuật toán (SHA-256 dùng `bit32` của Roblox; không có `bit32` thì tự tính) rồi kiểm tra các điều dưới đây.

Mặc định script nhận **cả key `Free_v2_`** của trang đang chạy trên GitHub Pages trước khi merge bản mới. Key v2 **không có mã thiết bị**, nhưng vẫn phải đúng tên và còn hạn. Khi trang đã lên bản v4, hãy đặt `CHAP_NHAN_KEY_V2 = false` để bắt buộc mã thiết bị. Key `Free_v3_` cũ không còn được nhận.

1. **Đúng định dạng:** key giải mã được và tag 128 bit khớp, tức là không bị sửa hay thiếu ký tự. Dán thừa chữ trước/sau key vẫn nhận.
2. **Đúng người chơi:** tên trong key phải trùng **tên tài khoản Roblox** (`player.Name`) hoặc **tên hiển thị** (`DisplayName`).
   - Không phân biệt hoa/thường, bỏ dấu `@` ở đầu.
   - Key của người khác bị từ chối, và bảng không hiện tên chủ key.
3. **Mạng:** mặc định không kiểm tra, đổi mạng vẫn dùng được key (mã mạng chỉ dùng để trộn mã hoá).
   - Bật `KIEM_TRA_THIET_BI = true` nếu muốn key chỉ dùng được trên đúng IP mạng lúc lấy key.
4. **Còn hạn:** key dùng được **24 giờ** kể từ lúc hoàn thành nhiệm vụ cuối.
   - Giờ lấy theo máy chủ Roblox (`workspace:GetServerTimeNow()`), nên chỉnh đồng hồ máy không gia hạn được key.
   - Key có thời điểm ở tương lai quá 5 phút cũng bị từ chối.

**Lưu key:** key xác nhận thành công được lưu vào file của executor (`writefile`), mỗi tài khoản một file `taodepzai_key_<UserId>.txt`. Lần sau mở script, key còn hạn được **tự điền vào ô nhập** (vẫn cần bấm Xác nhận). Khi key hết hạn 24 giờ (tính từ lúc hoàn thành nhiệm vụ cuối), key **tự bị xoá** khỏi file: ngay lúc hết hạn nếu game còn mở (xoá cả trong ô nhập nếu bảng đang hiện), hoặc lúc mở lại script. Key sai không ghi đè key đã lưu. Executor không có `writefile` thì script vẫn chạy, chỉ không lưu được.

Khi hợp lệ, bảng báo thời gian còn lại, **xoá giao diện nhập key** rồi tải và chạy `https://mncuadaigmailcom.github.io/aiaiaitao2/script.js`. Nếu tải lỗi hoặc script lỗi cú pháp, bảng vẫn giữ lại để thử lại. Có thể nhấn Enter để xác nhận. Nút “Lấy key” sao chép link trang tạo mã kèm sẵn tên.

Sau khi GitHub Pages cập nhật, chạy trong executor:

```lua
loadstring(game:HttpGet("https://mncuadaigmailcom.github.io/taodepzai/key-system.lua"))()
```

Muốn đổi hạn key, độ lệch giờ, tắt kiểm tra tên/tên hiển thị, tắt lưu key (`LUU_KEY`) hoặc đổi link, sửa bảng `CAU_HINH` ở đầu file.

Chạy test (giả lập Roblox bằng Lua 5.1; có Node thì đối chiếu thêm với `index.html` và `tools/decode-demo.cjs`): `pip install lupa` rồi `python3 tests/key_system_test.py`.

Test trong **Luau thật** (ngôn ngữ của Roblox), với key sinh từ code trang đang chạy (`origin/main`, v2) và trang mới (v4, dùng `bit32` thật):

```bash
git clone https://github.com/luau-lang/luau /tmp/luau-src && make -C /tmp/luau-src config=release luau
git fetch origin main
LUAU=/tmp/luau-src/luau python3 tests/luau_test.py
```

**Lưu ý:** cách này chặn được việc xem hạn key, dùng lại key của người khác và key đã quá 24 giờ. Tuy nhiên bí mật mã hoá nằm công khai trong mã nguồn, nên người biết đọc code vẫn có thể tự tạo key cho tên của chính họ mà không làm nhiệm vụ, hoặc sửa script để bỏ qua kiểm tra. Muốn chặn hẳn cần máy chủ cấp key có chữ ký bí mật.
