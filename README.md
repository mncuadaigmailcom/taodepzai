# Trang lấy key Script Taodepzai

Trang HTML tĩnh tại `index.html`. Mở tệp trong trình duyệt hoặc chạy `python3 -m http.server 8000` để xem trên máy. Chạy kiểm thử bằng `node --test tests/portal.test.cjs`.

## Cấu hình khi có thông tin thật

Tìm khối `// CHỈNH CẤU HÌNH TẠI ĐÂY` ở cuối `index.html`:

- Thay `KEY_TAODEPZAI = 'TAODEPZAI-KEY-MAU'` bằng key cần hiển thị.
- Thay bốn giá trị `url` và tên `ten` trong mảng `NHIEM_VU` bằng bốn liên kết thật.
- Khi thay xong, đổi `DANG_LA_BAN_MAU = false` để ẩn các thông báo và nhãn **bản mẫu**.
- `SCRIPT_CUA_BAN` giữ nguyên nội dung script từ trang trước; cần kiểm tra đường dẫn/mã từ xa trước khi sử dụng, hoặc thay bằng script chính xác.

## Cách hoạt động

Bấm bất kỳ một trong bốn cổng, ở tab liên kết ít nhất 5 giây rồi quay lại để lấy **cùng một key**. Mỗi cổng có trạng thái, lượt chờ và lỗi thử lại riêng; hoàn thành một cổng không yêu cầu làm ba cổng còn lại. Phiên chung kéo dài 3 phút từ lần bấm cổng đầu tiên, sau đó tự reset cả bốn cổng. Có nút reset thủ công, lưu trạng thái sau F5, đếm ngược, thông báo, hiệu ứng 3D, sao chép key và sao chép script cũ.

**Lưu ý:** Đây chỉ là kiểm tra thời gian chuyển tab ở trình duyệt, không xác thực trang đích đã tải hay người dùng thực sự xem nội dung. Key lưu trong HTML/JavaScript có thể bị xem trước khi mở khóa; nếu key phải giữ bí mật hoặc việc hoàn thành nhiệm vụ phải được xác minh, cần một dịch vụ phía máy chủ và cơ chế xác thực do các trang đích hỗ trợ. Không đưa key bí mật thật vào kho mã công khai.
