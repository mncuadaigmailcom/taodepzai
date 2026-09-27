# Trang tạo mã demo Free_ cho Taodepzai

Trang HTML tĩnh tại `index.html`. Mở tệp trong trình duyệt hoặc chạy `python3 -m http.server 8000` để xem trên máy. Chạy kiểm thử bằng `node --test tests/portal.test.cjs`.

## Cấu hình liên kết

Tìm mảng `NHIEM_VU` ở cuối `index.html`:

- Thay bốn giá trị `url` và tên `ten` bằng các liên kết thật khi đã có.
- Đổi `DANG_LA_BAN_MAU = false` sau khi thay liên kết; **cảnh báo mã demo luôn được giữ**.
- `SCRIPT_CUA_BAN` giữ nguyên nội dung từ trang trước; cần kiểm tra đường dẫn và mã từ xa trước khi sử dụng.

## Cách hoạt động

Bốn nhiệm vụ xếp thành một cột. Người dùng **phải nhập tên** và hoàn thành **đủ cả bốn nhiệm vụ** trong phiên 3 phút, không cần theo thứ tự. Mỗi nhiệm vụ theo dõi riêng 5 giây rời tab; quay lại sớm chỉ báo lỗi nhiệm vụ đó.

Khi một nhiệm vụ hoàn thành, thời điểm hoàn thành được lưu trong trình duyệt. Sau 4/4, trang lấy **thời điểm của nhiệm vụ hoàn thành cuối cùng** và ID nhiệm vụ đó cùng tên người chơi để tạo mã `Free_v2_...`. Tên không hiện bằng chữ trong mã, nhưng **có thể đọc lại khi biết thuật toán**. Mã ổn định sau F5 nếu vẫn cùng tên và phiên; đổi tên hoặc tạo phiên mới sẽ tạo mã khác. Tên được lưu trong trình duyệt và giữ lại khi reset phiên, còn trạng thái nhiệm vụ và mốc thời gian được reset sau 3 phút hoặc khi bấm nút làm mới. Bản sao của mã đã gửi đi vẫn có thể đọc được sau khi reset.

Để đọc tên từ **mã demo mới**, tại thư mục repo chạy:

```bash
node tools/decode-demo.cjs 'Free_v2_...'
```

Công cụ in ra tên gốc (cả chữ hoa và dấu tiếng Việt), ID nhiệm vụ cuối và thời điểm hoàn thành dạng UTC. Các mã cũ có **14 ký tự sau `Free_`** là hash một chiều, **không thể đọc ngược tên**; hãy dùng bản trang mới để tạo mã `Free_v2_...` (nếu phiên cũ đã hết hạn, cần làm lại bốn nhiệm vụ). Công cụ không xác nhận được mã có thật hoặc người chơi đã làm nhiệm vụ: ai đọc mã nguồn cũng có thể tự tạo mã giả.

Trang vẫn có đếm ngược, reset thủ công/tự động, thông báo, hiệu ứng 3D, sao chép mã demo và sao chép script cũ. Tên trên cửa sổ nhận mã được thu gọn theo mặc định để không lộ ngay khi chia sẻ ảnh; trường tên trong trang chính vẫn hiển thị khi người dùng nhập.

**Lưu ý quan trọng:** Mã `Free_` này **chỉ để minh họa, không kích hoạt script Taodepzai**. Cách che tên trong mã **không phải mã hóa bảo mật**: bất kỳ ai xem mã nguồn công khai cũng có thể đọc lại tên từ mã, nên không nhập tên thật hay thông tin nhạy cảm nếu cần riêng tư. Thời gian/trạng thái trong trình duyệt có thể bị chỉnh sửa và trang không xác minh người dùng đã xem liên kết. Muốn cấp key sử dụng được và chỉ chủ trang tra tên, cần máy chủ lưu key–tên cùng trang quản trị có xác thực; không để bí mật trong mã nguồn trình duyệt.
