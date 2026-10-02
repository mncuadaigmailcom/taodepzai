# Taodepzai

Hub Roblox nằm trong `script.js` (**Luau, không phải JavaScript**). Phần quản lý Code Đã Lưu nằm hoàn toàn trong script riêng `code-da-luu.lua`.

## Code Đã Lưu là tính năng có sẵn từ link

**Đã bỏ tab/giao diện Code Đã Lưu được viết trực tiếp trong main.** `script.js` không chứa factory, các textbox, danh sách hoặc bản sao GUI của module nữa.

Thay vào đó, hub tự đăng ký một tab tính năng **💾 Code Đã Lưu** từ link:

```text
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/code-da-luu.lua
```

### Cách dùng

1. Chạy bản `script.js` cập nhật.
2. Tab **💾 Code Đã Lưu** đã có sẵn ở đầu thanh tab. **Không cần tự tạo tính năng hoặc dán code.**
3. Bấm **▶ Chạy Script** ở toolbar của tab.
4. Hub tải script riêng và nhúng GUI vào tab bằng đúng pipeline `CreateFeatureTab` / `RunFeatureScript` của **Tạo Tính Năng**.

- Chỉ mở hub/mở tab chưa tải hoặc chạy module. Không tự chạy code trong danh sách.
- Module có đủ thêm code/link raw, tìm kiếm, sửa, copy, chạy/dừng, xóa, lưu/nạp và xuất/nhập JSON.
- Bấm ✕ ở toolbar trả GUI về màn hình và về tab Code. Mở lại tab sẽ nhúng GUI hiện có, không tải/chạy module lần nữa.
- Bấm **Chạy Script** để chủ động tải/chạy lại. Module dọn cửa sổ cũ, không chồng nhiều cửa sổ.
- Lỗi HTTP hoặc cú pháp hiện trong toolbar; có thể bấm chạy lại.
- Tab có sẵn không được lưu thêm vào `features` hay sao chép vào danh sách `scripts`. Nạp dữ liệu không nhân đôi tab.
- Các tính năng do người dùng tự tạo vẫn chạy/lưu như trước.

### Link được gắn ở đâu trong main?

Tìm **`S.SavedCodeScriptUrl`** để đổi URL module. `S.EnsureSavedCodeFeature()` đăng ký tab từ URL đó, với `builtinId = "saved-code"` và thứ tự đầu thanh tab.

GUI chỉ nằm trong `code-da-luu.lua`. **Không có bản copy nhúng, không cần công cụ sync factory.** Module có thể được cập nhật riêng; nội dung URL phải là mã Luau từ nguồn đáng tin cậy.

Các link trên thuộc nhánh cập nhật `arena/01a0fd07-taodepzai`, chưa gộp vào `main`.

## Giữ dữ liệu code cũ

Main giữ adapter dữ liệu `BananaCatHubAPI.SavedCodeAdapter`, không phải GUI quản lý. Script riêng dùng adapter để đọc/sửa cùng danh sách code đã lưu.

- Dữ liệu hub vẫn là `banana_cat_saved.json`, schema version 3.
- Danh sách code cũ, waypoint, các tab người dùng và settings được giữ nguyên. Việc bỏ GUI trong main không xóa file lưu.
- Lưu từ tab Code hoặc các nút tạo mẫu vẫn cập nhật danh sách; module riêng đọc được các mục đó.
- Kích hoạt một code đã lưu mở tab của code đó qua pipeline tính năng. Tab từ mục đã lưu là view tạm, không lưu thành một `features` trùng lặp.
- Nạp dữ liệu giữ tab module có sẵn, đồng thời dựng lại các tab người dùng.

Bảng `S.BuiltinSavedScripts` vẫn hỗ trợ khai báo code/link có sẵn cho danh sách, mặc định trống, không thêm script mẫu.

## Script riêng chạy độc lập

Có thể chạy trực tiếp `code-da-luu.lua`, hoặc dán toàn bộ file vào Tạo Tính Năng nếu muốn tạo thêm một view thủ công.

Nếu không có adapter của hub:

- Có cửa sổ quản lý độc lập, lưu trong `taodepzai_saved_code.json`, schema version 1.
- Nếu chưa có file riêng, chỉ đọc `scripts` từ `banana_cat_saved.json` để chuyển dữ liệu cũ. Không ghi vào file hub.
- Code được chạy trực tiếp; GUI của code đó nằm ngoài cửa sổ quản lý.
- Thiếu API lưu thật/ghi lỗi: giữ trong RAM; không bảo đảm còn sau rejoin. Có xuất/nhập JSON để sao lưu.
- Clipboard giả lập không bị báo thành công; JSON có thể được điền vào ô nguồn để copy thủ công.

Nút Dừng/hủy tab chỉ hủy luồng khởi chạy do hub/module quản lý; không bảo đảm hủy các luồng/sự kiện riêng hay side effect mà code bên ngoài đã tạo.

## Kiểm thử

Cần Node.js và [Luau CLI](https://github.com/luau-lang/luau/releases) (`luau`, `luau-compile`).

```bash
node --test tests/hub.test.cjs tests/saved-code.test.cjs
luau-compile --null script.js
luau-compile --null code-da-luu.lua

# Nếu executable chưa có trong PATH:
LUAU_BIN=/duong/dan/luau \
LUAU_COMPILE_BIN=/duong/dan/luau-compile \
node --test tests/hub.test.cjs tests/saved-code.test.cjs
```

**79 test** bao gồm hồi quy hub/script riêng, không còn GUI copy trong main, đăng ký sẵn tab URL khi offline, tải module thật qua HTTP giả lập, bắt/nhúng/trả GUI, retry lỗi mạng/cú pháp, không tạo tab trùng, không lưu/chép module trùng, giữ dữ liệu cũ, nạp lại dữ liệu, thứ tự tab, hủy tải đang yield, CRUD, clipboard, JSON, migration và nhận diện API thật/giả lập.

Test hành vi chạy mã thật từ hai script bằng adapters Roblox/executor giả lập trong `tests/fixtures/hub-runtime.luau`. Không truy cập mạng hoặc chạy payload bên thứ ba. JSON I/O, hình học và rendering được giả lập. **Chưa thay thế kiểm tra trên Roblox/executor thật.** Thiếu CLI thì hiện SKIP, không coi là đã đạt.

## Lưu ý

Chỉ chạy code/link bạn tin tưởng; `loadstring` không phải môi trường cách ly. URL module cần kết nối mạng và phải trả về mã Luau, không phải HTML. “Anti Ban” không bảo đảm tránh ban.

`index.html`, các tài liệu/key tools cũ và `tests/portal.test.cjs` thuộc portal/key system trước đây. Hub hiện tại không xác minh key của trang. Bộ portal cũ còn lỗi nền, không thay thế test Luau ở trên.
