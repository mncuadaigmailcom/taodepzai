# Taodepzai

`script.js` là hub Roblox viết bằng **Luau**, không phải JavaScript.

## Các tab hiện tại

| Thứ tự | Tab | Cách chạy |
|---:|---|---|
| 1 | 💾 Code Đã Lưu | **Tab thường trong main**, dùng ngay/offline; Chạy gọi RunCode bình thường |
| 2 | 💻 Code | Tab thường, giữ tính năng gốc |
| 3 | 📚 Script Hub | Tab URL có sẵn, tải `script-hub.lua` khi bấm Chạy Script |
| 4 | 👥 Người Chơi | Tab thường, giữ tính năng gốc |
| 5 | 🛠 Hỗ Trợ | **Tab URL có sẵn**, tải `ho-tro.lua` khi bấm Chạy Script |
| 6 | ⚙️ Thiết Lập | Tab thường, giữ tính năng gốc |
| 7 | ➕ Tạo Tính Năng | Tab thường; tab người dùng bắt đầu từ thứ tự 8 |

Không cần tự dán/tạo tab Script Hub hoặc Hỗ Trợ. Chỉ chọn tab có sẵn và bấm **▶ Chạy Script**. Chỉ mở hub/tab chưa tải module hay chạy các script trong danh sách.

Nút ✕ ở toolbar trả GUI về màn hình và về tab Code; mở lại nhúng GUI hiện có, không tải/chạy lại. Bấm Chạy Script để tải/chạy lại; module dọn GUI cũ và các tài nguyên của nó. Lỗi mạng/cú pháp/mount hiển thị và có thể retry.

### URL gắn trong main

```text
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/script-hub.lua
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/ho-tro.lua
```

Tìm `S.ScriptHubScriptUrl` / `S.SupportScriptUrl` để đổi nguồn. Bản cập nhật ở nhánh `arena/01a0fd07-taodepzai`, chưa gộp vào main.

## Hỗ Trợ: giữ đầy đủ chức năng

Toàn bộ subsystem Hỗ Trợ hiện có được chuyển sang `ho-tro.lua`, không thay bằng một trang rút gọn:

- Ba script nhanh gốc giữ nguồn và `noPark`; không tự chạy lúc mở tab.
- Phân tích vật thể: chuột phải, giữ ngón trên mobile, giữa màn hình, vật gần nhất, quét dự phòng và phân tích xuyên HUD/nước.
- Đủ Name/Class/POS/SIZE/ROT/LOOK/Material/Color/Path, copy vị trí/path, highlight tím và clear/remove highlight.
- Tọa độ nhân vật realtime, trạng thái/HP, copy vị trí dưới chân, điền XYZ và teleport tới tọa độ.
- Đo tốc độ game/current/max, reset đỉnh, biểu đồ và HUD nổi ngoài menu.
- Lưu waypoint, danh sách, tới waypoint, xóa. Dùng **getter danh sách hiện tại** sau reload/import, không giữ array cũ.

Module cần `BananaCatHubAPI.SupportBridge` của main cập nhật. Nó sở hữu input/render listeners, touch listeners tạm, task trễ, highlight và HUD. Destroy/chạy lại dọn đúng tài nguyên, không nhân đôi listeners hoặc xóa code/waypoint/controller game.

Nếu đang chọn vật giữa màn hình mà module bị đóng, trạng thái Enabled của hub được khôi phục. Clipboard không có API thật thì không báo copy thành công giả.

## Script Hub và các tính năng khác

`script-hub.lua` giữ catalog gốc, tìm kiếm/danh mục/ghim, copy/lưu nguồn, server panel và 9 panel Tune/Anti Ban/Fly/Speed/High Jump/Move/Glow/Free Camera/Safe Fly.

Các controller di chuyển/định vị/kính/camera/glow/server vẫn ở main để các tab khác dùng được cả khi chưa tải Script Hub; không tạo thêm một bộ physics/hooks khi tải GUI.

**Code Đã Lưu vẫn là tab thường**, không có module/link/adapter Code Đã Lưu của cách làm sai trước đó.

## Main ngắn hơn

Tính riêng file `script.js` (CRLF):

| Bản | Dòng | Byte |
|---|---:|---:|
| Gốc `8527247` | 12.854 | 559.899 |
| Trước khi tách Hỗ Trợ | 11.494 | 484.277 |
| Sau khi tách Hỗ Trợ | 10.194 | 431.091 |

Main giảm thêm **1.300 dòng / 53.186 byte** ở lần tách Hỗ Trợ này. So với bản gốc giảm **2.660 dòng / 128.808 byte (~23% dung lượng)**.

Cộng tất cả các file module sẽ có thêm wrapper/bridge/cleanup; tổng không nhất thiết nhỏ hơn bản một-file. Mục tiêu là main ít code hơn nhưng không xóa tính năng.

## Dữ liệu/lifecycle

File dữ liệu vẫn là `banana_cat_saved.json`, schema 3: scripts, waypoint, tab người dùng, settings/yêu thích. Không xóa file lưu khi tách tab.

- Script Hub và Hỗ Trợ có sẵn là transient, không lưu trùng vào features/scripts.
- Reload giữ cả hai tab URL, dựng lại tab người dùng và cập nhật danh sách code native/waypoint qua getter.
- Dọn module Hỗ Trợ không dừng hay thay controller của các tính năng khác; speed-meter binding/HUD riêng được dọn khi Destroy module.
- Thiếu API file thật/ghi lỗi: RAM, không bảo đảm còn sau rejoin. Có xuất dữ liệu ở Thiết Lập.

## Kiểm thử

Cần Node.js và [Luau CLI](https://github.com/luau-lang/luau/releases) (`luau`, `luau-compile`).

```bash
node --test tests/hub.test.cjs tests/script-hub.test.cjs tests/support.test.cjs
luau-compile --null script.js
luau-compile --null script-hub.lua
luau-compile --null ho-tro.lua

# Hoặc chỉ định executable:
LUAU_BIN=/duong/dan/luau \
LUAU_COMPILE_BIN=/duong/dan/luau-compile \
node --test tests/hub.test.cjs tests/script-hub.test.cjs tests/support.test.cjs
```

**85 test**: hồi quy native Code Đã Lưu/Code/storage/user features/Script Hub, parity các hàm và catalog/panel gốc, parity Hỗ Trợ, module URL/capture/nhúng/retry/close/reopen/cancel, vị trí tab/serialization/reload, waypoint getter/go/delete, mouse/touch/HUD/water/fallback/nearest/center, realtime coordinates, speed meter/HUD, clipboard, singleton và cleanup khi mount lỗi.

Manifest gốc: `tests/fixtures/script-hub-original.json` và `tests/fixtures/support-original.json`. Test chạy source thật với Roblox/executor/controller/physics/input adapters giả lập. Không truy cập mạng hoặc chạy IY/Dex/SimpleSpy. **Chưa thử trên Roblox/executor thật**, không thay thế kiểm tra physics/rendering thật. Thiếu CLI hiện SKIP, không coi là đã đạt.

## Giới hạn

Chỉ chạy nguồn tin tưởng; URL cần mạng và trả Luau, không phải HTML. `loadstring` không phải sandbox. Hủy không đảm bảo hủy mọi child task/listener/side effect của script ngoài. “Anti Ban” không bảo đảm tránh ban.

Portal/key cũ (`index.html`, key tools, `tests/portal.test.cjs`) chưa tương thích hub hiện tại, còn lỗi nền; không thay thế test Luau trên.
