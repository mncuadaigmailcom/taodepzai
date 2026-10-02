# Taodepzai

Repo gồm hub Roblox `script.js`, script quản lý **Code Đã Lưu** độc lập `code-da-luu.lua`, và trang phát key cũ `index.html`.

**`script.js` là Luau, không phải JavaScript.**

## Code Đã Lưu đã được tách thành script riêng

File **`code-da-luu.lua`** chứa toàn bộ GUI và logic của phần Code Đã Lưu: thêm code/link raw, danh sách, tìm kiếm, sửa, copy, chạy/dừng, xóa, lưu/nạp và xuất/nhập JSON. File này không cần các biến `S`, `Store`, `scripts` của hub để chạy độc lập.

### Dán vào Tạo Tính Năng của taodepzai

1. Mở `code-da-luu.lua` và **copy toàn bộ nội dung**.
2. Trong hub, mở **Tạo Tính Năng**.
3. Nhập tên, ví dụ **Code Đã Lưu**, rồi dán nội dung vào ô code.
4. Tạo tab, mở tab và bấm **Chạy Script**.

Script tạo `ScreenGui` tên `TDZSavedCode`; pipeline Tạo Tính Năng bắt và nhúng cả giao diện quản lý vào tab. Không gắn cờ overlay ngoài màn hình.

- Khi chạy trong bản hub đã cập nhật, script dùng `BananaCatHubAPI.SavedCodeAdapter` để chia sẻ **đúng danh sách code** với tab chính, không sao chép dữ liệu sang một danh sách khác.
- Chạy độc lập hoặc trên hub cũ không có adapter: vẫn có cửa sổ riêng và backend riêng.
- Chạy lại script quản lý sẽ dọn cửa sổ cũ, không chồng nhiều cửa sổ.
- Đóng/nhúng/trả GUI ra màn hình không làm mất dữ liệu đã lưu.
- Code trong danh sách **không tự chạy** khi mở script quản lý hoặc nạp file.

### Hub dùng chính script đã tách

`script.js` không còn tự xây dựng một bản GUI Code Đã Lưu thứ hai. Nó nhúng cùng factory từ `code-da-luu.lua` và mount vào tab chính.

Không cần HTTP hay `loadstring` để dựng tab chính lúc mở hub. Bản độc lập vẫn có thể được copy/dán như một script bình thường.

Sau khi sửa `code-da-luu.lua`, đồng bộ bản nhúng bằng:

```bash
node tools/sync-saved-code.cjs
node tools/sync-saved-code.cjs --check
```

`code-da-luu.lua` là nguồn gốc của factory. Test sẽ báo lỗi nếu bản trong hub bị lệch.

## Chạy code và lưu dữ liệu

### Trong hub

- Tab chính được đặt lại tên **💾 Code Đã Lưu**.
- Thêm trực tiếp code Luau hoặc link raw trong phần quản lý, hoặc lưu từ tab Code.
- Kích hoạt một mục mở tab tính năng của mục đó và chạy/nhúng GUI bằng pipeline hiện có.
- Bấm lại mục đã chạy thành công chỉ mở tab; bấm **Chạy Script** trong toolbar để thực thi lại.
- Tab mở từ mục đã lưu là view tạm, không được lưu thêm thành một `features` trùng lặp.
- Dữ liệu vẫn là `banana_cat_saved.json`, schema version 3. Waypoint, features và settings không bị script quản lý độc lập ghi đè.

### Khi không có adapter của hub

- File riêng: **`taodepzai_saved_code.json`**, schema version 1.
- Nếu chưa có file riêng, đọc danh sách `scripts` từ `banana_cat_saved.json` để chuyển dữ liệu cũ. **Chỉ đọc file cũ**, không ghi vào nó.
- Code được chạy trực tiếp; GUI do code đó tạo nằm ngoài cửa sổ quản lý.
- Nút **Dừng** hủy luồng khởi chạy đang được quản lý; không bảo đảm hủy các luồng/sự kiện riêng mà code bên ngoài đã tự tạo.
- Thiếu API lưu file thật hoặc ghi lỗi: giữ dữ liệu trong RAM, không bảo đảm còn sau rejoin. Dùng Xuất JSON để sao lưu.
- Không báo copy thành công khi chỉ có clipboard giả lập. Nếu không có clipboard thật, JSON được điền vào ô code để copy thủ công.

Bảng `S.BuiltinSavedScripts` trong hub vẫn hỗ trợ khai báo code/link có sẵn trong file chính. Mặc định trống, không thêm script mẫu. Các mục khai báo ở đó được đưa vào danh sách lúc nạp, nhưng không tự chạy.

## Kiểm thử

Cần Node.js và [Luau CLI](https://github.com/luau-lang/luau/releases) (`luau`, `luau-compile`).

```bash
node tools/sync-saved-code.cjs --check
node --test tests/hub.test.cjs tests/saved-code.test.cjs
luau-compile --null script.js
luau-compile --null code-da-luu.lua

# Nếu executable chưa có trong PATH:
LUAU_BIN=/duong/dan/luau \
LUAU_COMPILE_BIN=/duong/dan/luau-compile \
node --test tests/hub.test.cjs tests/saved-code.test.cjs
```

**67 test** gồm hồi quy hub, chạy script độc lập, dán toàn bộ script vào Tạo Tính Năng, nhúng/trả GUI, chia sẻ danh sách qua adapter, đồng bộ factory, CRUD, tìm kiếm, chạy/dừng, lỗi cú pháp/HTTP, hủy job, singleton, lưu/nạp, file hỏng, migration, JSON và nhận diện API thật/giả lập.

Test hành vi dùng mã thật từ hai script với adapters Roblox/executor giả lập trong `tests/fixtures/hub-runtime.luau`. Không gọi mạng hay chạy script bên thứ ba. JSON I/O, hình học và rendering được giả lập. **Chưa thay thế kiểm tra trên Roblox/executor thật.**

Nếu thiếu Luau CLI, các bài cần executable hiện SKIP; không coi là đã kiểm thử thành công.

## Lưu ý

Chỉ chạy code/link bạn tin tưởng; `loadstring` không phải môi trường cách ly. Link raw phải trả về mã Luau, không phải HTML. Một số API tương thích của hub vẫn chỉ được giả lập một phần. “Anti Ban” không bảo đảm tránh ban từ server hoặc Roblox.

`index.html`, `PHAN-TICH.md`, `LUA_HOP_DONG.md`, `tools/decode-demo.cjs`, `tools/kiem-tra-key.cjs` và `tests/portal.test.cjs` thuộc portal/key system cũ. Hub hiện tại không xác minh key của trang. Bộ portal cũ còn lỗi nền, không thay thế các test Luau phía trên.
