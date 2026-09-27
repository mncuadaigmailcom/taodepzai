# Trang tạo mã demo Free_ cho Taodepzai

Trang HTML tĩnh tại `index.html`. Mở tệp trong trình duyệt hoặc chạy `python3 -m http.server 8000` để xem trên máy. Chạy kiểm thử bằng `node --test tests/portal.test.cjs`.

## Cấu hình liên kết

Tìm mảng `NHIEM_VU` ở cuối `index.html`:

- Thay bốn giá trị `url` và tên `ten` bằng các liên kết thật khi đã có.
- Đổi `DANG_LA_BAN_MAU = false` sau khi thay liên kết; **cảnh báo mã demo luôn được giữ**.
- `SCRIPT_CUA_BAN` giữ nguyên nội dung từ trang trước; cần kiểm tra đường dẫn và mã từ xa trước khi sử dụng.

## Cách hoạt động

Bốn nhiệm vụ xếp thành một cột. Người dùng **phải nhập tên** và hoàn thành **đủ cả bốn nhiệm vụ** trong phiên 3 phút, không cần theo thứ tự. Mỗi nhiệm vụ theo dõi riêng 5 giây rời tab; quay lại sớm chỉ báo lỗi nhiệm vụ đó.

Khi một nhiệm vụ hoàn thành, thời điểm hoàn thành được lưu trong trình duyệt. Sau 4/4, trang lấy **thời điểm của nhiệm vụ hoàn thành cuối cùng**, kết hợp với tên người chơi và mã nhiệm vụ rồi trộn thành chuỗi bắt đầu bằng `Free_`. Mã demo ổn định sau F5 nếu vẫn cùng tên và phiên; đổi tên hoặc tạo phiên mới sẽ tạo mã khác. Tên người chơi được lưu trên trình duyệt và giữ lại khi reset phiên, còn trạng thái nhiệm vụ và các mốc thời gian được reset sau 3 phút hoặc khi bấm nút làm mới.

Trang vẫn có đếm ngược, reset thủ công/tự động, thông báo, hiệu ứng 3D, sao chép mã demo và sao chép script cũ.

**Lưu ý quan trọng:** Mã `Free_` này **chỉ để minh họa, không kích hoạt script Taodepzai**. Trộn dữ liệu ở trình duyệt không phải cơ chế bảo mật hay phát hành key. Thời gian/trạng thái trong trình duyệt có thể bị chỉnh sửa và trang không xác minh người dùng đã xem liên kết. Muốn cấp key sử dụng được cần dịch vụ phía máy chủ và cách để script kiểm tra key với dịch vụ đó. Không giới thiệu mã demo là key thật.
