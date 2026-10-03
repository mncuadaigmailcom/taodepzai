# Bộ test Luau cho `script.js`

Chạy **chính `script.js`** (hub taodepzai v5.0 NOIR) bằng Luau thật biên dịch sang WASM,
trên một **giả lập API Roblox** (`gia-lap-roblox.lua`): Instance/Signal/Vector3/CFrame/Enum,
`task.*`, `RunService:BindToRenderStep`, `workspace`, `Players`, `Highlight`, GUI…

Nhờ vậy test kiểm tra được **hành vi thật** của hub (không chỉ cú pháp): tính năng cũ còn
nguyên không, khung/tab có dựng đủ không, và tính năng mới 🌳 định vị vật theo tên có chạy
đúng không (quét, bám theo vật di chuyển, chống trùng, luồng UI gõ tên → hiện định vị).

## Cách chạy

```bash
cd tests/luau
npm install                                # cài @luau-rs/luau (Luau 0.739 → WASM)
node chay-test.mjs                         # chạy test-tinh-nang.lua trên ../../script.js
node kiem-tra-cu-phap.mjs                  # chỉ kiểm tra compile
```

Tuỳ chọn:

```bash
HUB=../../script.js node chay-test.mjs                 # đổi file hub
HUB=/tmp/script.js.orig node chay-test.mjs             # chạy trên bản CŨ để đối chiếu
node chay-test.mjs duong-dan/khac.lua                  # chạy file test khác
```

Kết quả in ra dạng `TESTS: pass=.. fail=..` kèm danh sách `FAIL: …`. Nếu hub lỗi runtime,
script in ra dòng lỗi và vị trí (trong `script.js` hay trong file test).

## Thành phần

| File | Vai trò |
|---|---|
| `gia-lap-roblox.lua` | Giả lập API Roblox đủ để load + chạy hub: Instance, Signal, GUI, `task.*`, `RunService`, `Players`, `workspace`, `TweenService`… |
| `test-tinh-nang.lua` | 139 test: API sống sót, tính năng cũ còn nguyên, 🌳 định vị vật theo tên, màu xanh nước + khung 🎯 thông tin/toạ độ giống "phân tích toạ độ", Highlight nằm trong Workspace (nếu gắn vào PlayerGui là KHÔNG hiện), dán path, Folder, 🚀 bay tới vật, luồng UI thật trong tab 👥, bố cục khung, và mọi thẻ 📚 Script Hub vẫn chạy không lỗi |
| `chay-test.mjs` | Nạp giả lập + hub + test trong cùng một chunk Luau rồi in kết quả |
| `kiem-tra-cu-phap.mjs` | Compile `script.js` bằng Luau thật (cổng chặn cú pháp) |

## Lưu ý kỹ thuật

- `script.js` là **Luau** (dù tên `.js`) — đừng chạy bằng `node`.
- Hub + test phải nằm **cùng một chunk** thì test mới thấy được các biến local cấp cao nhất
  (`S`, `D`, `MV`, `tabContent`…), nhưng thân test được bọc trong một hàm riêng để không
  vượt giới hạn **200 local / hàm** của Luau.
- `@luau-rs/luau` là bản Luau 0.739 build WASM: có `utf8.codes`, **không** có `utf8.graphemes`,
  không có `load()`, `os.clock` là thời gian CPU. Giả lập chạy `task.delay`/render step bằng
  `__pump()` trong `gia-lap-roblox.lua`.
- **Mỗi hàm Luau chỉ được 200 local.** Hub chỉ compile được vì các khối lớn đều bọc trong
  `do…end` / hàm riêng — thêm control mới cho một khung là rất dễ vượt trần. Khi thấy lỗi
  `Out of local registers`, hãy gom nhóm control vào một hàm `local function …(...) … end` rồi
  gọi ngay, thay vì khai báo thêm `local` ở cấp khối.
- Test bám theo **giá trị thật** của vật (toạ độ/kích thước/màu) nên khi sửa hub phải cập nhật
  kỳ vọng cho khớp, đừng nới lỏng test.
- Test không cần mạng và không chạm vào Roblox thật.
