# Trang tạo mã demo Free_ cho Taodepzai

Trang HTML tĩnh tại `index.html`. Mở tệp trong trình duyệt hoặc chạy `python3 -m http.server 8000` để xem trên máy. Chạy kiểm thử bằng `node --test tests/portal.test.cjs`.

## Mã Free_v5_ (mã hoá HMAC-SHA256 + mã thiết bị + tên mã hoá từ Roblox)

Để tạo key, người dùng chỉ cần nhập **tên người chơi** và hoàn thành 4 nhiệm vụ. **Mã mạng được lấy ngầm theo IP của điện thoại** (4G, 5G hoặc wifi), không cần nhập và không hiện ở đâu:

- **Trang web:** khi mở trang (và khi quay lại trang), trang gọi lần lượt `https://api.ipify.org`, `https://ipv4.icanhazip.com`, `https://v4.ident.me` (chỉ IPv4) để lấy IP công khai.
  - IP được chuẩn hoá rồi băm SHA-256 (`"taodepzai|thiet-bi|ip:" + ip`) thành mã mạng 10 ký tự.
  - Không lấy được IP thì giữ mã đã có; nếu chưa có thì dùng mã dự phòng `ip:0.0.0.0`, nên vẫn tạo được key.
- **Chuỗi trộn:** mã mạng + tên + ngày tháng năm giờ phút giây mili giây (UTC) + số quay ghép thành một chuỗi riêng, rồi băm thành **khoá con** để mã hoá key (xem bên dưới).
- **Đổi mạng vẫn dùng được:** mặc định script Roblox **không** bắt cùng mạng (`KIEM_TRA_THIET_BI = false`) và không gọi dịch vụ IP nào. Lấy key xong chuyển từ wifi sang 4G/5G (hoặc ngược lại) vẫn xác nhận được, key đã lưu vẫn tự điền.
  - Muốn bắt buộc cùng mạng thì đặt `KIEM_TRA_THIET_BI = true`: script sẽ tự lấy IP và từ chối key tạo ở mạng khác.
- Nhấn nút **Lấy key** trong game **2 lần (trong 3 giây)** để sao chép link trang có đuôi `?mahoa=...`: phần sau `mahoa=` là **tên người chơi đã mã hoá** (nonce ngẫu nhiên 8 byte + tag HMAC-SHA256 12 byte + tên XOR dòng khoá SHA-256), nên link không lộ tên và mỗi lần nhấn cho một link khác. Nhấn 1 lần chỉ nhắc nhấn thêm lần nữa. Script **thử tự mở trang** (`GuiService`/`BrowserService:OpenBrowserWindow`, tắt bằng `TU_MO_TRINH_DUYET = false`), nhưng Roblox chỉ cho script lõi dùng các hàm này và đa số executor chặn chúng, nên thường không tự mở được: khi đó link đã được sao chép, dán vào trình duyệt.
- Trang giải mã `?mahoa=` (link cũ `?tk=` vẫn nhận): nếu **hợp lệ** (tag khớp, UTF-8 đúng, 1–32 ký tự) thì **ô nhập tên hiện luôn tên người chơi đó** (kèm dòng "✓ Tên được tự nhập từ link lấy key của Roblox"). Bạn **vẫn sửa được tên đến khi xong 4 nhiệm vụ**; xong nhiệm vụ / lấy key rồi thì tên bị khoá như cũ. Sửa tên thì key không còn cờ "tên từ Roblox". Link bị sửa / bịa thì không điền tên và báo lỗi. Tên đang khoá thì link tên khác bị bỏ qua (có báo). Link cũ `?ten=...` (tên thường) vẫn tự điền. Trang đọc xong thì xoá tham số khỏi thanh địa chỉ.
- **Tự dán link vừa sao chép (chạy ngầm, không có nút):** trang tự đọc bộ nhớ tạm, thấy link `?mahoa=` hợp lệ là điền tên. Trình duyệt chỉ cho đọc bộ nhớ tạm khi được phép: nếu đã cho quyền thì đọc ngay khi mở trang và mỗi lần quay lại trang; nếu chưa thì trang thử khi bạn **chạm vào trang lần đầu** hoặc **chạm vào ô tên** (trình duyệt có thể hỏi quyền, Safari hiện nút "Dán"). Bị chặn thì bỏ qua im lặng; vẫn có thể dán link vào ô tên bằng tay. Mỗi link chỉ tự điền 1 lần, nên sửa tên rồi quay lại trang không bị điền đè. Sau khi tạo link, bảng script ẩn tên người chơi (hiện "🔒 đã mã hoá").
- **Link lấy key của bạn:** trang tự biết địa chỉ của chính nó (github.io, githack...) và hiện ô **🔗 Link lấy key của bạn** = địa chỉ trang + `?mahoa=<tên đã mã hoá>`, có nút Sao chép. Lưu link này: lần sau mở là tên tự điền vào ô tên. Link chỉ tạo lại khi đổi tên.
- **Không hiện ngày giờ ở đâu cả.** Dòng dưới vòng quay chỉ còn chữ mô tả cố định. Thời điểm, tên và mã thiết bị chỉ nằm trong key ở dạng đã mã hoá.
- **Vòng quay 3 số:** mỗi lần quay sẽ đổi số và đổi **nonce ngẫu nhiên 128 bit** (`crypto.getRandomValues`), nên key luôn khác, kể cả khi trùng số. Key vẫn giữ nguyên sau F5; làm mới phiên thì đổi nonce.

Cấu trúc key (`taoMaDemo`, nằm giữa hai dòng `// === MÃ HOÁ V4 ... ===` trong `index.html`). Phần này giống hệt `key-system.lua`, `tools/decode-demo.cjs` (dùng `node:crypto`) và bản Python trong test:

```
Free_v5_ + base64url( nonce 16 byte | tag 32 byte | bản mã )
bản rõ = [5, cờ tên từ link mã hoá Roblox (0/1), số quay (2 byte), thời điểm ms (6 byte), nhiệm vụ 1–4,
          mã thiết bị (10 ký tự), tên UTF-8]
chuỗi trộn = "tdz5|tron|" + mã mạng + "|" + tên + "|" + "YYYY-MM-DD HH:MM:SS.mmm" (UTC) + "|" + số quay (3 chữ số) + "|" + cờ
khoá con   = HMAC-SHA256(BI_MAT_V4, chuỗi trộn)
tag    = HMAC-SHA256(khoá con, "tdz5|tag|" + nonce + bản rõ)          (đủ 32 byte = 256 bit)
khoá   = HMAC-SHA256(BI_MAT_V4, "tdz5|enc|" + nonce + tag)
bản mã = bản rõ XOR SHA256(khoá + 0) SHA256(khoá + 1) ...
```

Bản `Free_v4_` cũ (trang main đang chạy): nonce 12 byte, tag 16 byte, nhãn `tdz4`, không có cờ. Script vẫn nhận (`CHAP_NHAN_KEY_V4 = true`; đặt `false` khi trang đã lên v5). Đặt `YEU_CAU_TEN_TU_ROBLOX = true` nếu chỉ muốn nhận key v5 tạo bằng tên lấy từ link `?mahoa=` (không nhận tên gõ tay).

- **Không đọc được bằng mắt:** nhìn key không biết tên, ngày giờ hay mã thiết bị.
- **Thay đổi nhỏ làm key khác hẳn:** chỉ khác 1 mili-giây hay 1 chữ trong tên thì gần như toàn bộ key đổi.
- **Không sửa hay bịa được bằng tay:** tag có 256 bit, nên sửa 1 ký tự hoặc tự bịa key đều bị phát hiện.
- **Độ dài:** key dài khoảng 105–270 ký tự, tuỳ độ dài tên.

**Giới hạn:** `BI_MAT_V4` vẫn nằm trong mã nguồn trang (trang tĩnh không giấu được bí mật). Người đọc code vẫn có thể tự viết chương trình tạo key. Muốn chặn hẳn cần máy chủ cấp key giữ bí mật riêng.

## Cấu hình liên kết

Tìm mảng `NHIEM_VU` ở cuối `index.html`:

- Thay bốn giá trị `url` và tên `ten` bằng các liên kết thật khi đã có.
- Đổi `DANG_LA_BAN_MAU = false` sau khi thay liên kết; **cảnh báo mã demo luôn được giữ**.
- `SCRIPT_CUA_BAN` giữ nguyên nội dung từ trang trước; cần kiểm tra đường dẫn và mã từ xa trước khi sử dụng.

## Cách hoạt động

Bốn nhiệm vụ xếp thành một cột. Người dùng **phải nhập tên** (mã mạng tự lấy ngầm) và hoàn thành **đủ cả bốn nhiệm vụ** trong phiên 3 phút, không cần theo thứ tự. Mỗi nhiệm vụ theo dõi riêng 5 giây rời tab; quay lại sớm chỉ báo lỗi nhiệm vụ đó.

**Khoá tên:** xong đủ 4 nhiệm vụ là ô tên bị khoá (chỉ đọc) cho đến khi hết thời gian phiên hoặc bấm “Làm mới phiên”.
- Đã nhập tên trước đó: mở khoá được key; không xoá / đổi tên được nữa (kể cả F5, dán, hay mở link `?ten=` khác).
- **Đã lấy key** (mở hộp thoại key): tên khoá luôn **đến khi key đó hết hạn (24 giờ** kể từ lúc xong nhiệm vụ cuối). Hết phiên, làm mới phiên hay F5 đều không mở khoá; làm lại nhiệm vụ trong 24 giờ thì key mới vẫn mang tên cũ. Trang không hiện giờ hết hạn.
- Giới hạn: khoá lưu trong trình duyệt (localStorage). Xoá dữ liệu trang, dùng tab ẩn danh hoặc trình duyệt khác thì không còn khoá.
- Chưa nhập tên: không mở khoá được key; phải chờ hết phiên (hoặc làm mới phiên) rồi nhập tên và làm lại nhiệm vụ.

Khi một nhiệm vụ hoàn thành, thời điểm hoàn thành được lưu trong trình duyệt. Sau 4/4, trang lấy **thời điểm của nhiệm vụ hoàn thành cuối cùng** và ID nhiệm vụ đó cùng tên người chơi để tạo mã `Free_v5_...` (đã mã hoá, xem trên). Mã ổn định sau F5 nếu vẫn cùng tên, phiên và số vòng quay; đổi tên, bấm **🎰 Quay số mới** hoặc tạo phiên mới sẽ tạo mã khác. Tên được lưu trong trình duyệt và giữ lại khi reset phiên, còn trạng thái nhiệm vụ và mốc thời gian được reset sau 3 phút hoặc khi bấm nút làm mới. Bản sao của mã đã gửi đi vẫn có thể đọc được sau khi reset.

Để đọc tên từ **mã demo mới**, tại thư mục repo chạy:

```bash
node tools/decode-demo.cjs 'Free_v5_...'
```

Công cụ này chỉ dành cho chủ trang (cần `BI_MAT_V4`). Nó in ra tên gốc, ID nhiệm vụ cuối, thời điểm hoàn thành dạng UTC, số vòng quay và mã thiết bị. Mã `Free_v4_` / `Free_v2_` cũ vẫn đọc được; với v5 còn in có phải tên lấy từ link mã hoá không. Các mã cũ có **14 ký tự sau `Free_`** là hash một chiều, **không thể đọc ngược tên**; hãy dùng bản trang mới để tạo mã `Free_v5_...` (nếu phiên cũ đã hết hạn, cần làm lại bốn nhiệm vụ). Công cụ không xác nhận được mã có thật hoặc người chơi đã làm nhiệm vụ: ai đọc mã nguồn cũng có thể tự tạo mã giả.

Trang vẫn có đếm ngược, reset thủ công/tự động, thông báo, hiệu ứng 3D, sao chép mã demo và sao chép script cũ. Tên trên cửa sổ nhận mã được thu gọn theo mặc định để không lộ ngay khi chia sẻ ảnh; trường tên trong trang chính vẫn hiển thị khi người dùng nhập.

**Lưu ý quan trọng:** Mã `Free_` này **chỉ để minh họa, không kích hoạt script Taodepzai**. Key được mã hoá HMAC-SHA256, nhưng bí mật nằm trong mã nguồn công khai. Vì vậy người đọc code vẫn giải hoặc tạo được key; không nhập thông tin nhạy cảm. Thời gian/trạng thái trong trình duyệt có thể bị chỉnh sửa và trang không xác minh người dùng đã xem liên kết. Muốn cấp key sử dụng được và chỉ chủ trang tra tên, cần máy chủ lưu key–tên cùng trang quản trị có xác thực; không để bí mật trong mã nguồn trình duyệt.

## Script nhập key cho Roblox (`key-system.lua`)

Script mở bảng nhập key trong game. Nó giải mã key `Free_v5_...` (và `Free_v4_` cũ) bằng cùng thuật toán (SHA-256 dùng `bit32` của Roblox; không có `bit32` thì tự tính) rồi kiểm tra các điều dưới đây.

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

Khi hợp lệ, bảng báo thời gian còn lại, **xoá giao diện nhập key** rồi tải và chạy `https://mncuadaigmailcom.github.io/aiaiaitao2/script.js`. Nếu tải lỗi hoặc script lỗi cú pháp, bảng vẫn giữ lại để thử lại. Có thể nhấn Enter để xác nhận. Nhấn nút “Lấy key” 2 lần để sao chép link trang tạo mã có đuôi `?mahoa=<tên người chơi đã mã hoá>`; trang tự đọc link đó và điền tên vào ô tên người chơi.

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
