# Trang tạo mã demo Free_ cho Taodepzai

Trang HTML tĩnh tại `index.html`. Mở tệp trong trình duyệt hoặc chạy `python3 -m http.server 8000` để xem trên máy. Chạy kiểm thử bằng `node --test tests/portal.test.cjs`.

## Mã Free_v3_ (vòng quay 3 số)

Trong cửa sổ nhận mã có **vòng quay 3 số** (000–999). Mỗi lần bấm **🎰 Quay số mới**, ba ô số quay rồi dừng lần lượt, và trang tạo một key mới cho cùng tên, cùng thời điểm (1000 key khác nhau có thể có). Dòng **“Kết hợp”** bên dưới cho thấy các thành phần được trộn vào key: số quay · ngày/tháng (UTC) · giây · mili-giây · tên người chơi (tên không hiện ra). Trong lúc quay, nút sao chép bị khoá để không chép nhầm key cũ. Đóng cửa sổ giữa chừng thì huỷ lượt quay và giữ số cũ.

Cách tạo mã v3 (`taoMaDemo` trong `index.html`, giống hệt `tools/decode-demo.cjs` và `key-system.lua`):

1. **Đầu mã 5 byte** = số quay + **ngày + tháng** (UTC) + **giây + mili-giây** của lúc hoàn thành nhiệm vụ cuối. Các byte được che bằng dòng mặt nạ và xích với nhau.
2. **Nội dung** = `[tên, nhiệm vụ, thời điểm]` dạng JSON UTF-8, kèm **mã kiểm tra 32 bit** (2 hàm băm độc lập trên chuỗi bí mật + đầu mã + nội dung).
3. **Dòng khoá** sinh từ (chuỗi bí mật, số quay, ngày, tháng, giây, mili-giây) bằng bộ sinh Park–Miller. **Từng byte của tên được trộn tiếp vào dòng khoá**, và mỗi byte mã được **xích với byte trước**. Vì vậy chỉ khác 1 chữ trong tên là phần lớn key khác hẳn, còn sửa một ký tự của key thì phần sau hỏng hết và mã kiểm tra không khớp.
4. Khi giải mã, ngày/tháng/giây/mili-giây ở đầu mã phải khớp đúng thời điểm bên trong; số quay phải trong khoảng 000–999.

Mọi phép tính dùng số nguyên dưới 2^53, nên JS và Lua cho kết quả giống hệt nhau (test đối chiếu tự động).

**Giới hạn:** chuỗi bí mật và thuật toán vẫn nằm công khai trong mã nguồn trang. Cách này chặn được việc sửa hoặc bịa key bằng tay, nhưng người đọc code vẫn có thể tự viết chương trình tạo key. Muốn chặn hẳn cần máy chủ ký key bằng khoá bí mật.

## Cấu hình liên kết

Tìm mảng `NHIEM_VU` ở cuối `index.html`:

- Thay bốn giá trị `url` và tên `ten` bằng các liên kết thật khi đã có.
- Đổi `DANG_LA_BAN_MAU = false` sau khi thay liên kết; **cảnh báo mã demo luôn được giữ**.
- `SCRIPT_CUA_BAN` giữ nguyên nội dung từ trang trước; cần kiểm tra đường dẫn và mã từ xa trước khi sử dụng.

## Cách hoạt động

Bốn nhiệm vụ xếp thành một cột. Người dùng **phải nhập tên** và hoàn thành **đủ cả bốn nhiệm vụ** trong phiên 3 phút, không cần theo thứ tự. Mỗi nhiệm vụ theo dõi riêng 5 giây rời tab; quay lại sớm chỉ báo lỗi nhiệm vụ đó.

Khi một nhiệm vụ hoàn thành, thời điểm hoàn thành được lưu trong trình duyệt. Sau 4/4, trang lấy **thời điểm của nhiệm vụ hoàn thành cuối cùng** và ID nhiệm vụ đó cùng tên người chơi để tạo mã `Free_v3_...`. Tên không hiện bằng chữ trong mã, nhưng **có thể đọc lại khi biết thuật toán**. Mã ổn định sau F5 nếu vẫn cùng tên, phiên và số vòng quay; đổi tên, bấm **🎰 Quay số mới** hoặc tạo phiên mới sẽ tạo mã khác. Tên được lưu trong trình duyệt và giữ lại khi reset phiên, còn trạng thái nhiệm vụ và mốc thời gian được reset sau 3 phút hoặc khi bấm nút làm mới. Bản sao của mã đã gửi đi vẫn có thể đọc được sau khi reset.

Để đọc tên từ **mã demo mới**, tại thư mục repo chạy:

```bash
node tools/decode-demo.cjs 'Free_v3_...'
```

Công cụ in ra tên gốc (cả chữ hoa và dấu tiếng Việt), ID nhiệm vụ cuối, thời điểm hoàn thành dạng UTC và số vòng quay (mã `Free_v2_` cũ vẫn đọc được). Các mã cũ có **14 ký tự sau `Free_`** là hash một chiều, **không thể đọc ngược tên**; hãy dùng bản trang mới để tạo mã `Free_v3_...` (nếu phiên cũ đã hết hạn, cần làm lại bốn nhiệm vụ). Công cụ không xác nhận được mã có thật hoặc người chơi đã làm nhiệm vụ: ai đọc mã nguồn cũng có thể tự tạo mã giả.

Trang vẫn có đếm ngược, reset thủ công/tự động, thông báo, hiệu ứng 3D, sao chép mã demo và sao chép script cũ. Tên trên cửa sổ nhận mã được thu gọn theo mặc định để không lộ ngay khi chia sẻ ảnh; trường tên trong trang chính vẫn hiển thị khi người dùng nhập.

**Lưu ý quan trọng:** Mã `Free_` này **chỉ để minh họa, không kích hoạt script Taodepzai**. Cách che tên trong mã **không phải mã hóa bảo mật**: bất kỳ ai xem mã nguồn công khai cũng có thể đọc lại tên từ mã, nên không nhập tên thật hay thông tin nhạy cảm nếu cần riêng tư. Thời gian/trạng thái trong trình duyệt có thể bị chỉnh sửa và trang không xác minh người dùng đã xem liên kết. Muốn cấp key sử dụng được và chỉ chủ trang tra tên, cần máy chủ lưu key–tên cùng trang quản trị có xác thực; không để bí mật trong mã nguồn trình duyệt.

## Script nhập key cho Roblox (`key-system.lua`)

Script mở bảng nhập key trong game, giải mã key `Free_v3_...` bằng cùng thuật toán với `taoMaDemo` rồi kiểm tra ba điều. Mặc định script nhận **cả key `Free_v2_`** (trang đang chạy trên GitHub Pages trước khi merge bản mới) lẫn `Free_v3_`. Key v2 vẫn phải đúng tên và còn hạn. Khi trang đã lên bản v3, có thể đặt `CHAP_NHAN_KEY_V2 = false` để chỉ nhận v3:

1. **Đúng định dạng:** key giải mã được, mã kiểm tra 32 bit khớp, ngày/tháng khớp thời điểm; không bị sửa hay thiếu ký tự. Dán thừa chữ trước/sau key vẫn nhận.
2. **Đúng người chơi:** tên trong key phải trùng **tên tài khoản Roblox** (`player.Name`) hoặc **tên hiển thị** (`DisplayName`). Không phân biệt hoa/thường, bỏ dấu `@` ở đầu. Key của người khác bị từ chối và bảng không hiện tên chủ key.
3. **Còn hạn:** key dùng được **24 giờ** kể từ lúc hoàn thành nhiệm vụ cuối. Giờ lấy theo máy chủ Roblox (`workspace:GetServerTimeNow()`), nên chỉnh đồng hồ máy không gia hạn được key. Key có thời điểm ở tương lai quá 5 phút cũng bị từ chối.

**Lưu key:** key xác nhận thành công được lưu vào file của executor (`writefile`), mỗi tài khoản một file `taodepzai_key_<UserId>.txt`. Lần sau mở script, key còn hạn được **tự điền vào ô nhập** (vẫn cần bấm Xác nhận). Khi key hết hạn 24 giờ (tính từ lúc hoàn thành nhiệm vụ cuối), key **tự bị xoá** khỏi file: ngay lúc hết hạn nếu game còn mở (xoá cả trong ô nhập nếu bảng đang hiện), hoặc lúc mở lại script. Key sai không ghi đè key đã lưu. Executor không có `writefile` thì script vẫn chạy, chỉ không lưu được.

Khi hợp lệ, bảng báo thời gian còn lại, **xoá giao diện nhập key** rồi tải và chạy `https://mncuadaigmailcom.github.io/aiaiaitao2/script.js`. Nếu tải lỗi hoặc script lỗi cú pháp, bảng vẫn giữ lại để thử lại. Có thể nhấn Enter để xác nhận, và nút “Lấy key” sẽ sao chép link trang tạo mã.

Sau khi GitHub Pages cập nhật, chạy trong executor:

```lua
loadstring(game:HttpGet("https://mncuadaigmailcom.github.io/taodepzai/key-system.lua"))()
```

Muốn đổi hạn key, độ lệch giờ, tắt kiểm tra tên/tên hiển thị, tắt lưu key (`LUU_KEY`) hoặc đổi link, sửa bảng `CAU_HINH` ở đầu file.

Chạy test (giả lập Roblox bằng Lua 5.1; có Node thì đối chiếu thêm với `index.html` và `tools/decode-demo.cjs`): `pip install lupa` rồi `python3 tests/key_system_test.py`.

Test trong **Luau thật** (ngôn ngữ của Roblox), với key sinh từ code trang đang chạy (`origin/main`, v2) và trang mới (v3):

```bash
git clone https://github.com/luau-lang/luau /tmp/luau-src && make -C /tmp/luau-src config=release luau
git fetch origin main
LUAU=/tmp/luau-src/luau python3 tests/luau_test.py
```

**Lưu ý:** cách này chặn được việc dùng lại key của người khác và key đã quá 24 giờ. Tuy nhiên thuật toán nằm công khai trong mã nguồn, nên người biết đọc code vẫn có thể tự tạo key cho tên của chính họ mà không làm nhiệm vụ, hoặc sửa script để bỏ qua kiểm tra. Muốn chặn hẳn cần máy chủ cấp key có chữ ký bí mật.
