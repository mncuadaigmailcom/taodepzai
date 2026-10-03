# Taodepzai

`script.js` là hub Roblox viết bằng **Luau**, không phải JavaScript.

## Đúng cách tích hợp hiện tại

- **💾 Code Đã Lưu là tab thường trong main**, theo giao diện/bố cục bản gốc: tìm kiếm, mở rộng/xem code, copy, chạy và xóa.
- Nút Chạy của Code Đã Lưu gọi **RunCode bình thường**, không tạo tab tính năng mới, không tải module quản lý code.
- **Chỉ 📚 Script Hub được tách thành `script-hub.lua`** và gắn link trong main. Mở tab Script Hub rồi bấm **▶ Chạy Script** để tải/nhúng GUI bằng pipeline Tạo Tính Năng.
- Không còn `code-da-luu.lua`, adapter/module Code Đã Lưu, preset/listeners hay tab tính năng Code Đã Lưu của cách làm trước.

### Số dòng/dung lượng MAIN

So sánh riêng file `script.js`, giữ CRLF như bản gốc:

| Bản | Dòng | Byte |
|---|---:|---:|
| Gốc `8527247` | 12.854 | 559.899 |
| Bản trước làm sai phần Code Đã Lưu | 11.562 | 493.810 |
| Bản sửa hiện tại | 11.494 | 484.277 |

Main giảm **1.360 dòng, 75.622 byte (~13,5% dung lượng)** so với bản gốc, và nhỏ hơn cả bản cập nhật trước.

Nếu cộng **main + file module riêng**, tổng không nhất thiết nhỏ hơn bản một-file vì có thêm lớp loader/bridge và cleanup. Mục tiêu ở đây là **main ít code hơn**, còn logic GUI Script Hub nằm trong file riêng; không xóa tính năng để giảm dòng.

### Chạy hub

Dùng URL của `script.js` trên nhánh cập nhật:

```text
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/script.js
```

- Code Đã Lưu dùng được ngay khi mở hub, không cần mạng/module.
- Script Hub có sẵn tại thứ tự 3. Bấm **▶ Chạy Script** để tải URL cấu hình ở `S.ScriptHubScriptUrl`.
- Nút ✕ ở toolbar Script Hub trả GUI về màn hình và về Code; mở lại nhúng GUI cũ, không tải lại.
- Lỗi HTTP/cú pháp/GUI hiện rõ, có thể chạy lại. Chạy lại module dọn cửa sổ cũ.

Bản trên nhánh `arena/01a0fd07-taodepzai`, chưa gộp vào main.

## Giữ các chức năng gốc

`script-hub.lua` giữ catalog, tìm kiếm, danh mục, ghim, copy/lưu nguồn, server panel và đủ **9 panel gốc**: Tune, Anti Ban, Fly, Speed, High Jump, Move, Glow, Free Camera, Safe Fly.

Catalog và helper dựng thẻ cũng chuyển sang module để main nhỏ hơn. **Các game controllers và action dispatch vẫn ở main** để các trang/tính năng khác hoạt động cả khi chưa tải Script Hub; không tạo thêm một bộ physics/hooks khi tải GUI.

Giữ tab Code, Người Chơi, Hỗ Trợ, Thiết Lập, Tạo Tính Năng và tab người dùng. Code Đã Lưu/Code/Script Hub giữ thứ tự gốc 1/2/3; tab người dùng từ 8.

Test đối chiếu 309 hàm có tên của bản gốc, catalog và tên các panel trong `tests/fixtures/script-hub-original.json`. Việc đối chiếu source không thay thế kiểm tra physics/rendering thật.

Module Script Hub cần `BananaCatHubAPI.ScriptHubBridge` của main cập nhật; chạy khi chưa có main sẽ báo lỗi rõ, không tạo GUI dở dang.

## Dữ liệu

Dữ liệu hub vẫn dùng **`banana_cat_saved.json`, schema 3**: scripts, waypoint, tab người dùng, settings/yêu thích. Không xóa file lưu khi thay cách hiển thị Code Đã Lưu.

- Lưu từ Code, Script Hub, tạo mẫu vẫn cập nhật cùng danh sách native.
- Chỉ tab Script Hub có sẵn là transient; không lưu trùng vào `features` hoặc chép vào danh sách code.
- Reload giữ một tab Script Hub, khôi phục tab người dùng và nạp code cũ vào tab thường.
- Thiếu API file thật/ghi lỗi: giữ trong RAM, không đảm bảo còn sau rejoin. Trạng thái không báo RAM là đã ghi file.
- Thiếu clipboard thật: nút copy trong tab thường bôi đen code để copy thủ công, không báo thành công giả.

## Kiểm thử

Cần Node.js và [Luau CLI](https://github.com/luau-lang/luau/releases) (`luau`, `luau-compile`).

```bash
node --test tests/hub.test.cjs tests/script-hub.test.cjs
luau-compile --null script.js
luau-compile --null script-hub.lua

# Hoặc chỉ định executable:
LUAU_BIN=/duong/dan/luau \
LUAU_COMPILE_BIN=/duong/dan/luau-compile \
node --test tests/hub.test.cjs tests/script-hub.test.cjs
```

**57 test của cách tích hợp hiện tại**: Code Đã Lưu native/offline, lưu/tên trùng/search/expand/copy/run/delete, lỗi và retry, hủy job/monitor dòng đã xóa, repeat controls, API/storage thật/RAM, main nhỏ hơn, không còn module Code Đã Lưu, Script Hub gốc/panel/catalog/controller parity, URL/capture/nhúng/close/reopen/lifecycle, serialization/reload/order và user features.

Các test riêng cho cách làm sai trước đó (Code Đã Lưu dạng module/link tính năng) được bỏ cùng module; không dùng số test cũ để mô tả bản này.

Hành vi chạy source thật bằng Roblox/executor/controller adapters giả lập, không gọi mạng hoặc thực thi IY/Dex/SimpleSpy. JSON, hình học, rendering và physics không phải game thật. **Chưa thử trên Roblox/executor thật.** Thiếu Luau CLI hiện SKIP, không tính là đã đạt.

## Giới hạn

Chỉ chạy nguồn tin tưởng; URL phải trả Luau, không phải HTML, và cần mạng. `loadstring` không phải sandbox. Hủy chỉ dừng luồng khởi chạy do hub quản lý, không đảm bảo hủy child task/listener/side effect của script ngoài. “Anti Ban” không bảo đảm tránh ban.

Portal/key cũ (`index.html`, key tools và `tests/portal.test.cjs`) chưa tương thích hub hiện tại, còn lỗi nền; không thay thế các test Luau trên.
