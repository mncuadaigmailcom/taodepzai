# Taodepzai — chỉ giữ 5 tab chính

`script.js` là hub Roblox viết bằng **Luau**, không phải JavaScript.

## Tab còn lại

| Thứ tự | Tab |
|---:|---|
| 1 | 💾 Code Đã Lưu |
| 2 | 💻 Code |
| 3 | 👥 Người Chơi |
| 4 | ⚙️ Thiết Lập |
| 5 | ➕ Tạo Tính Năng |

**Đã xóa Script Hub và Hỗ Trợ**: không có tab có sẵn, URL loader, bridge hay tự tải module cho hai phần này. Các file `script-hub.lua`, `ho-tro.lua` và test riêng của chúng đã được bỏ.

Code Đã Lưu vẫn là tab thường/offline trong main: lưu từ Code, tìm kiếm, mở rộng/xem nguồn, copy, chạy bằng RunCode bình thường, xóa.

Người Chơi giữ các khung định vị, xem người chơi/camera và quản lý kính/bay tới người/kính. Controller mà các chức năng còn lại dùng vẫn ở main; không xóa chúng cùng tab Script Hub. Thông báo của các nút Người Chơi được đưa vào nhãn trạng thái ngay trong tab đó, không phụ thuộc nhãn của tab đã xóa.

Tạo Tính Năng vẫn tạo được tab người dùng. Các tab này xuất hiện từ vị trí **6**, do người dùng chủ động tạo, không phải tab có sẵn mới. GUI của script chạy ở Code vẫn có thể đưa vào menu, nhưng nằm trong **khung GUI của tab Code**, không tự thêm tab thứ sáu.

## Dữ liệu

Giữ `banana_cat_saved.json`, schema version 3:

- Code đã lưu, waypoint cũ, các tab người dùng và settings giữ nguyên.
- Reload không đăng ký lại Script Hub/Hỗ Trợ, chỉ dựng các tab đã được người dùng lưu.
- Waypoint/yêu thích cũ vẫn có trong dữ liệu xuất/nhập; không xóa file lưu khi xóa GUI của hai tab.
- Thiếu API file thật hoặc ghi lỗi: giữ trong RAM, không bảo đảm còn sau rejoin. Thiết Lập vẫn có lưu/nạp/xuất/nhập.
- Clipboard giả lập không bị báo là copy thành công thật.

Chạy lại bản main trong cùng phiên sẽ dọn các cửa sổ/tài nguyên của module cũ đã mở trước đây; không tải chúng lại.

## Link main cập nhật

```text
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/script.js
```

Bản ở nhánh `arena/01a0fd07-taodepzai`, chưa gộp vào `main`.

## Kích thước main

Bản hiện tại: **9.831 dòng · 411.401 byte** (giữ CRLF). Trước khi xóa hai tab: 10.194 dòng · 431.091 byte.

Số dòng tính cả dòng trống và chú thích. Các controller chung và logic GUI/lưu dữ liệu vẫn ở main để các tab còn lại hoạt động.

## Kiểm thử

Cần Node.js và [Luau CLI](https://github.com/luau-lang/luau/releases) (`luau`, `luau-compile`).

```bash
node --test tests/hub.test.cjs
luau-compile --null script.js

# Hoặc chỉ định executable:
LUAU_BIN=/duong/dan/luau \
LUAU_COMPILE_BIN=/duong/dan/luau-compile \
node --test tests/hub.test.cjs
```

**38 test của bản 5 tab**: biên dịch toàn bộ main, đúng 5 tab/order, không còn module/URL/bridge bị xóa, kiểm tra controller/panel còn lại, Code Đã Lưu/Code CRUD/search/copy/run/errors/cancel/repeat, storage/file/RAM/JSON/settings, manual feature create/run/edit/copy/GUI embedding/rerun/late GUI/cancel/reload/order, player feedback/refresh và GUI parking trong Code không tạo rail mới.

Manifest đối chiếu chức năng còn lại ở `tests/fixtures/retained-features.json`. Test chạy source thật với Roblox/executor/JSON/input/GUI adapters giả lập trong `tests/fixtures/hub-runtime.luau`. **Chưa thử trên Roblox/executor thật**, không thay thế kiểm tra physics/rendering thật. Thiếu CLI hiện SKIP, không coi là đã đạt.

Các test của module Script Hub/Hỗ Trợ được bỏ cùng tính năng theo yêu cầu; không dùng số bài cũ để mô tả bản này. Bộ portal/key cũ (`tests/portal.test.cjs`) còn lỗi nền, không thay thế test Luau trên.

## Giới hạn

Chỉ chạy code/link tin tưởng; `loadstring` không phải sandbox. Hủy luồng khởi chạy không đảm bảo dừng mọi child task/listener/side effect của script ngoài. Các API giả lập không thay hoàn toàn API native. Không bảo đảm tránh ban từ Roblox/game.
