# Taodepzai

Repo gồm hub Roblox trong `script.js` và một trang HTML phát key trong `index.html`.
**`script.js` là Luau, không phải JavaScript.** Bản hiện tại là hub v5.0 NOIR; nó không còn là key system mà các tài liệu cũ mô tả.

## Hub Roblox — Link Script tích hợp

Phần **Code Đã Lưu** đã đổi thành **🔗 Link Script**, dùng chung cơ chế chạy/nhúng GUI với **Tạo Tính Năng**. Toàn bộ logic nằm trong `script.js`, không cần tải thêm một module của hub.

- Dán tên và **link raw HTTP/HTTPS** rồi bấm **Thêm link**. Chỉ lưu nguồn, chưa tải hoặc chạy.
- Code đã lưu từ bản cũ được giữ nguyên. Vẫn có thể nhập code ở tab **Code** rồi bấm **Lưu Vào Link Script**.
- Bấm **tên script** hoặc **Kích hoạt**: hub mở một tab riêng, thực thi nguồn và nhúng GUI tương thích vào tab.
- Bấm lại một mục đã chạy thành công chỉ **mở lại tab**, không thực thi lần nữa. Muốn chạy lại, bấm **Chạy Script** trong toolbar của tab đó.
- Mở rộng một mục bằng **▼** để xem/copy nguồn hoặc sửa rồi bấm **Lưu sửa**. Sửa trong toolbar của tab cũng cập nhật cùng mục đã lưu.
- Một mục chỉ có một tab đang mở. Không cho khởi chạy hai nguồn cùng lúc để tránh tranh hook bắt GUI.
- Xóa mục sẽ hủy luồng khởi chạy của hub, gỡ tab và trả GUI nhúng về vị trí cũ. Không bảo đảm dừng được các luồng/sự kiện riêng mà script bên ngoài đã tự tạo.
- Danh sách ban đầu không thêm script mẫu, và không tự thực thi khi mở hub hay nạp dữ liệu.

### Script có sẵn ngay trong file chính

Tìm bảng **`S.BuiltinSavedScripts`** ở đầu phần trạng thái của `script.js`.

Mỗi mục gồm **`name` + `code`** nếu muốn nhúng mã Luau trực tiếp vào file chính, hoặc **`name` + `url`** nếu nguồn là link raw. Bảng mặc định trống. Hub đưa các mục này vào Link Script khi nạp dữ liệu, nhưng chỉ chạy khi người dùng kích hoạt.

Các mục trùng tên với dữ liệu người dùng không bị ghi đè. Mục được khai báo trong file chính sẽ xuất hiện lại khi nạp dữ liệu nếu đã bị xóa khỏi danh sách; muốn bỏ hẳn một mục gắn sẵn, xóa khai báo khỏi bảng này.

**“Link Script” là liên kết/nút kích hoạt trong hub.** Hub không tự đăng code lên mạng hoặc biến code nội tuyến thành một URL công khai để chia sẻ.

### Lưu dữ liệu

Dữ liệu vẫn dùng `banana_cat_saved.json`, schema version 3, tương thích danh sách code cũ.

- Nguồn script chỉ được lưu một lần trong `scripts`.
- Tab mở từ Link Script là view tạm, không bị lưu thêm thành một mục `features` trùng lặp.
- Executor có `readfile`/`writefile` thật: lưu xuống đĩa.
- Thiếu API thật hoặc ghi lỗi: giữ trong RAM của phiên chơi, không bảo đảm còn sau rejoin.
- Xuất clipboard chỉ báo thành công nếu API clipboard thật thực hiện được; fallback trong RAM không bị báo nhầm là đã copy.

### Kiểm thử hub

Cần **Node.js** và **Luau CLI** (`luau`, `luau-compile`, từ [luau-lang/luau](https://github.com/luau-lang/luau/releases)).

```bash
# Nếu các executable đã có trong PATH:
node --test tests/hub.test.cjs

# Hoặc chỉ định đường dẫn:
LUAU_BIN=/duong/dan/luau \
LUAU_COMPILE_BIN=/duong/dan/luau-compile \
node --test tests/hub.test.cjs

# Chỉ biên dịch toàn bộ hub, không thực thi:
luau-compile --null script.js
```

Bộ kiểm thử gồm **41 bài**: biên dịch file đầy đủ, xác thực link, code cũ, preset nội tuyến, UI thêm/kích hoạt/sửa/xóa, chống chạy lặp, lỗi cú pháp/HTTP, GUI sinh trễ, mở lại GUI, hủy luồng, lưu/nạp, thứ tự tab và nhận diện API executor.

Các bài hành vi chạy **mã thật được trích từ `script.js`**, với adapters Roblox/executor giả lập trong `tests/fixtures/hub-runtime.luau`. Không truy cập mạng hay chạy script bên thứ ba. JSON I/O và phép nhúng/hình học GUI được giả lập; đây không phải kiểm thử trong Roblox thật, không xác nhận physics, rendering hoặc mọi executor.

Nếu thiếu Luau CLI, các bài cần executable sẽ hiện **SKIP**. Không coi chúng là đã kiểm thử thành công.

### Lưu ý khi chạy script

Link phải trả về mã Luau, không phải trang HTML. Chỉ chạy nguồn bạn tin tưởng; `loadstring` không phải môi trường cách ly. Một số API tương thích còn là giả lập một phần, không thay thế đầy đủ khả năng của executor. “Anti Ban” không bảo đảm tránh ban từ server hoặc Roblox.

## Trang phát key và tài liệu cũ

`index.html` là trang tĩnh phát key `Free_v5_`. Có thể mở bằng:

```bash
python3 -m http.server 8000
```

**Hub hiện tại không xác minh key do trang này phát.** Các tài liệu/công cụ sau thuộc key system trước đây và chưa được chuyển sang hợp đồng của hub:

| Tệp | Nội dung |
|---|---|
| `PHAN-TICH.md` | Phân tích trang phát key và key system cũ |
| `LUA_HOP_DONG.md` | Hợp đồng key system cũ, không phải API của hub hiện tại |
| `tools/decode-demo.cjs` | Giải mã thông tin của key đời cũ |
| `tools/kiem-tra-key.cjs` | Mô phỏng key system, cần các hằng cấu hình không còn trong hub |
| `tests/portal.test.cjs` | Test portal/key cũ; hiện có lỗi nền và không thay thế test Luau của hub |

Không sử dụng số bài đạt/trượt của bộ portal cũ để kết luận hub Roblox có chạy được hay không.
