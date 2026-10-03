# Taodepzai

`script.js` là hub Roblox viết bằng **Luau**, không phải JavaScript. Bản gốc đối chiếu: commit `852724782b7259c81b733261563e1585d0434f4e`.

## Script Hub được làm giống Code Đã Lưu

Hub có sẵn hai tab từ link, cùng pipeline **Tạo Tính Năng**:

| Tab | Script GUI riêng | Thứ tự gốc |
|---|---|---|
| 💾 Code Đã Lưu | `code-da-luu.lua` | 1 |
| 📚 Script Hub | `script-hub.lua` | 3 |

Tab Code vẫn ở thứ tự 2; Người Chơi/Hỗ Trợ/Thiết Lập/Tạo Tính Năng giữ vị trí và tính năng. Tab người dùng bắt đầu từ thứ tự 8.

### Cách dùng

1. Chạy bản `script.js` cập nhật.
2. Chọn **Code Đã Lưu** hoặc **Script Hub** đã có sẵn.
3. Bấm **▶ Chạy Script** ở toolbar: hub tải URL module và nhúng GUI vào tab.

Không cần tự tạo tab hay dán module. Chỉ mở hub/tab chưa tải hoặc chạy script trong catalog. Bấm ✕ ở toolbar trả GUI về màn hình và về tab Code. Mở lại sẽ nhúng GUI hiện có, không tải/chạy lại. Bấm Chạy Script để chủ động tải lại; cửa sổ cũ được dọn.

Các URL gắn trong main:

```text
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/code-da-luu.lua
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/arena/01a0fd07-taodepzai/script-hub.lua
```

Tìm `S.SavedCodeScriptUrl` hoặc `S.ScriptHubScriptUrl` để đổi link. Các bản cập nhật thuộc nhánh `arena/01a0fd07-taodepzai`, chưa gộp vào main.

## Giữ chức năng Script Hub gốc

GUI trong `script-hub.lua` lấy từ các khối Script Hub của bản gốc, không thay bằng một danh sách rút gọn:

- Giữ nguyên catalog: các script ngoài và các tiện ích/server/di chuyển/định vị.
- Giữ tìm kiếm, danh mục, ghim yêu thích, copy và lưu nguồn.
- Giữ khung server: JobId, copy, vào server, hop/ít người/siêu vắng.
- Giữ đủ **9 panel**: Tune, Anti Ban, Fly, Speed, High Jump, Move, Glow, Free Camera và Safe Fly.
- Các nút gọi chính controller gốc trong main. Script ngoài giữ `noPark` để GUI ở ngoài màn hình.
- Controller di chuyển, kính, locator, spectator, free camera, glow, server, cùng trang Người Chơi vẫn ở main. Không tải lại controller/hook physics khi mở GUI module.
- Dữ liệu/yêu thích được giữ. Nút lưu đọc danh sách hiện tại ngay cả sau reload/import, không giữ một array cũ.

`script-hub.lua` cần `BananaCatHubAPI.ScriptHubBridge` của bản main cập nhật; chạy khi chưa có hub sẽ báo lỗi rõ, không tạo GUI dở dang. Nó không phải một bản hub độc lập thứ hai.

Bản gốc không chỉnh sửa vẫn có thể xem tại:

```text
https://raw.githubusercontent.com/mncuadaigmailcom/taodepzai/852724782b7259c81b733261563e1585d0434f4e/script.js
```

Bản cập nhật dựa trên chức năng/GUI gốc, đồng thời giữ các sửa lỗi storage, nhận diện API, hủy job và lifecycle đã được kiểm thử. Không khẳng định là hoàn nguyên mọi sửa lỗi về commit cũ.

## Giữ dữ liệu Code Đã Lưu

Main chỉ giữ adapter dữ liệu `BananaCatHubAPI.SavedCodeAdapter`; GUI quản lý nằm trong `code-da-luu.lua`.

- Dữ liệu hub vẫn là `banana_cat_saved.json`, schema version 3: scripts, waypoint, feature người dùng, settings/yêu thích.
- Bỏ GUI trong main không xóa file hay code cũ. Các nút Lưu của Code/Script Hub/tạo mẫu vẫn cập nhật cùng danh sách.
- Cả hai tab module có sẵn là transient, không được lưu trùng vào `features` hoặc `scripts`.
- Nạp dữ liệu giữ cả hai tab module, dựng lại các tab do người dùng tạo.
- `S.BuiltinSavedScripts` mặc định trống, không thêm ví dụ mới.

`code-da-luu.lua` chạy độc lập được: khi thiếu adapter main, dùng `taodepzai_saved_code.json`, schema 1, chỉ đọc `scripts` từ file hub để chuyển dữ liệu cũ. Không ghi đè file waypoint/settings. Thiếu API file thật/ghi lỗi thì giữ RAM và hỗ trợ sao lưu JSON; không đảm bảo còn sau rejoin.

## Kiểm thử

Cần Node.js và [Luau CLI](https://github.com/luau-lang/luau/releases) (`luau`, `luau-compile`).

```bash
node --test tests/hub.test.cjs tests/saved-code.test.cjs tests/script-hub.test.cjs
luau-compile --null script.js
luau-compile --null code-da-luu.lua
luau-compile --null script-hub.lua

# Hoặc chỉ định executable:
LUAU_BIN=/duong/dan/luau \
LUAU_COMPILE_BIN=/duong/dan/luau-compile \
node --test tests/hub.test.cjs tests/saved-code.test.cjs tests/script-hub.test.cjs
```

**103 bài** gồm các hồi quy trước, kiểm tra không mất hàm/catalog/panel từ bản gốc, GUI Script Hub gốc, dispatch/copy/save/favorites/search/category/server/panel inputs, tải module qua pipeline thật, lỗi HTTP/mount và retry, singleton/dọn UI hooks, close/reopen, hủy tải, giữ cả hai tab module/thứ tự, serialization và storage.

Manifest bản gốc trong `tests/fixtures/script-hub-original.json` ghi catalog, tên panel và các hàm có tên để đối chiếu khi chỉnh tiếp.

Hành vi chạy source thật với Roblox/executor/controllers giả lập. Không gọi mạng hoặc thực thi các payload IY/Dex/SimpleSpy. JSON I/O, hình học, physics và rendering được giả lập. **Chưa thay thế kiểm tra trong Roblox/executor thật**, không khẳng định mọi game/executor đều tương thích. Thiếu CLI hiện SKIP, không coi là đã đạt.

## Giới hạn

- Chỉ chạy nguồn đáng tin cậy; URL cần mạng và phải trả mã Luau, không phải HTML. `loadstring` không phải sandbox.
- Hủy chỉ dừng luồng khởi chạy do hub/module quản lý, không bảo đảm dừng mọi child task/listener/side effect của script ngoài.
- Các API giả lập không thay thế API native hoàn toàn. “Anti Ban” không bảo đảm tránh ban.
- Portal/key system cũ (`index.html`, key tools và `tests/portal.test.cjs`) chưa tương thích hub hiện tại, còn lỗi nền; không thay thế các test Luau trên.
