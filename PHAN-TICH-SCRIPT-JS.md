# Phân tích `script.js`

*Phân tích tĩnh + kiểm chứng bằng trình biên dịch **Luau thật** trên commit `8527247` (nhánh
`arena/01a10157-taodepzai`), ngày 2026-10-03. Mọi số dòng trỏ tới đúng commit này.*

> **Cập nhật sau phân tích:** `script.js` đã được thêm tính năng **🌳 định vị vạn vật theo tên**
> (tab 👥 Người Chơi) — tệp nay **13.859 dòng** (+1.005, không xoá dòng nào). Các số liệu trong
> tài liệu này vẫn đúng cho trạng thái trước khi thêm. Xem `BAO-CAO-DINH-VI-VAT.md` để biết chi
> tiết tính năng, bộ test 93 case và các lỗi đã tìm/sửa.

> **Điểm quan trọng nhất:** `script.js` hiện tại **không phải** key system `Free_v5_` mà `README.md`,
> `LUA_HOP_DONG.md` và `PHAN-TICH.md` mô tả. Đây là **script hub** cho executor Roblox. Ba tài liệu kia đang
> tả một tệp khác (bản key system ~1.131 dòng của nhánh trước) — xem §9.

---

## 1. Kết luận nhanh

| Câu hỏi | Trả lời |
|---|---|
| `script.js` là gì? | **Luau/Lua**, không phải JavaScript. 12.854 dòng / 544.533 byte (CRLF toàn bộ), 449 hàm có tên. Là **GUI hub cho executor Roblox** mang tên “taodepzai v5.0 NOIR”: 7 tab, ~30 mục trong 📚 Script Hub, nhóm 🚀 di chuyển (bay / xuyên tường / tốc độ / nhảy cao), 👥 định vị + xem người chơi, 🎥 khán giả (freecam), ✨ phát sáng, 🔐 anti-ban, lưu script/waypoint/tab tính năng xuống file executor. |
| Có kiểm tra key không? | **Không. 0 lần** xuất hiện `Free_v*`, `KiemTraKey`, `BI_MAT`, `CHAP_NHAN_KEY_V2`, `YEU_CAU_TEN_TU_ROBLOX`, `taodepzai_key_`. Script chạy thẳng, mở GUI ngay khi inject — không hỏi key, không mở link, không lưu key. |
| Cú pháp có hợp lệ? | **Có.** Biên dịch bằng Luau 0.739 chính thức (WASM): **thành công**, bytecode 605.028 byte. Parser độc lập (`luau-parser`) cũng đọc sạch. Không có lỗi cú pháp, không có `return` chết ở cấp cao nhất. |
| Chất lượng code | Khá phòng lỗi: **710 `pcall`**, 26/40 kết nối tín hiệu dài hạn được theo dõi qua `trackConn`, huỷ sạch bản chạy trước (`_G.BananaCatHub_*`), watchdog chỉ chạy khi có tính năng bật. Nhưng: **14 hàm chết**, hàm dài 150–305 dòng, lồng sâu 9 cấp, 4 nhóm hàm UI trùng tên trong các khối `do` khác nhau (không lỗi, nhưng dấu hiệu copy–paste). |
| Rủi ro lớn nhất | ① **Hook toàn cục `Instance.new`** và **`player.Kick`** — ảnh hưởng mọi script cùng executor; ② **API executor giả** (`firetouchinterest`, `getconnections`, `Drawing`, `setclipboard`, `getcustomasset`, `queue_on_teleport`…) **trả “thành công” nhưng không làm gì** → script chạy sai âm thầm; ③ tải & `loadstring` **mã từ repo GitHub bên thứ ba** không ghim phiên bản; ④ dùng executor là vi phạm ToS Roblox → nguy cơ khoá tài khoản. |
| Điểm sáng | **Không telemetry**: chỉ 2 miền mạng được nhắc trong tệp (`raw.githubusercontent.com` cho 3 script có sẵn, `games.roblox.com` để liệt kê server). **Không obfuscate**: 0 blob base64, 0 `string.char`, 0 chuỗi `\ddd` đáng ngờ — mã đọc được, chú thích tiếng Việt dày (1.304 dòng có dấu). |
| Đồng bộ repo | `tests/portal.test.cjs`: **17 test — 1 pass, 16 fail**. `tools/kiem-tra-key.cjs`: **crash** (`Không đọc được KEY_PREFIX trong script.js`). `index.html` còn 2 khối lạ (CSS quảng cáo giả 1.850 B + script chuyển log 653 B) — đúng như báo cáo cũ, chưa được xoá. |

---

## 2. Số liệu tệp

| Chỉ số | Giá trị |
|---|---|
| Số dòng vật lý | 12.855 (`wc -l` = 12.854 vì dòng cuối không có newline) |
| Kích thước | 544.533 byte; **100% dòng dùng CRLF** (khác chuẩn repo) |
| Dòng trống / dòng bắt đầu bằng `--` | 743 / 89 |
| Hàm | **449 hàm có tên**; 328 khai báo `function`, 144 `local function`, 12 gán `= function`; tổng **893 biểu thức hàm** nếu tính cả callback ẩn danh |
| `pcall` / `tostring` | 710 / 307 |
| `:Connect(` / `trackConn(` | 227 / 50 |
| `BindToRenderStep` / `UnbindFromRenderStep` | 14 / 29 |
| `Instance.new` | 37 lần gọi (38 lần nhắc tên) |
| `task.wait` / `task.spawn` / `task.delay` | 23 / 12 / 20 |
| Chuỗi `[[...]]` và chuỗi dài ≥ 40 ký tự | 9 / 271 |
| Hàm dài nhất | `S.FeatureTemplate` — 305 dòng (dòng 3716–4020) |
| Lồng sâu nhất | `MV.Safe.Scan` — 9 cấp (dòng 6701–6822) |
| Hàm chết (không nơi nào gọi) | **14** (§8.4) |

---

## 3. Bản đồ kiến trúc

| Dòng | Khối | Nội dung |
|---|---|---|
| 1–8 | Header | Tự mô tả “v5.0 NOIR — FULL CODE”, lịch sử phiên bản v4.36→v4.66 |
| 9–112 | Khởi động | Lấy service, `gethui()` → `PlayerGui`, **huỷ bản chạy trước** (`_G.BananaCatHub_MV/Free/SpecCam`, ngắt `RenderStep` cũ), định nghĩa `trackConn` (88–100) |
| 113–243 | Hạ tầng UI | Bảng màu `C`, `New`, `Corner`, `Stroke`, `flash`, `Tween` |
| 244–443 | Bộ vẽ `D.*` | `D.Say`, `BestText`, `Edge`, `Grad`, `Paint3`, `TopLight`, `Shade`, `PaintText`, `Tactile`, `HoverText`, `Glow`, `SetBg`, `Breathe` |
| 445–620 | Khung & tương tác | Nhả focus, dọn `ExMenu` cũ, viền cầu vồng, `Hit.inObject`/`Hit.onHub`, `BcFit` |
| 625–810 | Kéo–thả | `SetupResizeHandle`, `CreateHandle` (8 hướng) |
| 811–970 | Hệ tab | `SwitchTab`, `OpenFirstPage`, `MakeTabFrame`, `MakeTabButton`, `AddTab`; tạo tab 💻 Code và 💾 Code Đã Lưu |
| 972–1014 | Tiện ích | `S.SanitizeCode`, `S.Shimmed`, `D.SyncPageChips` |
| 1015–1235 | **`Store`** | Lưu JSON (`banana_cat_saved.json`, version 3) gồm script / waypoint / tab tính năng / cài đặt; chế độ `file` → `memory` → `none` |
| 1236–1530 | **Compat + chạy code** | `S.HasGlobal/SetGlobal`, `S.vfs`, `S.CompatRequest`, `S.CompatDrawing`, `S.EnsureCompat`, `S.NormalizeRunnable`, `ExecOnce` (1440), `Cancel` (1459), `RunCode` (1467) |
| 1533–2026 | Tab 💻/💾 + 🛠 | Ô nhập code, chạy N lần, lưu/xoá/đổi tên script; tab 🛠 `supportTab` (1978) với 3 script nhanh (1985–1989) |
| 2027–2930 | 🔎 Phân tích 2D/3D | `S.DeviceText`, chọn vật bằng ray/chuột, highlight, đọc thuộc tính vật thể, toạ độ |
| 2930–3320 | ⏱ Đo tốc độ | `SV.*` (dò tốc độ mặc định, đo, HUD nổi) |
| 3321–3720 | **Nhúng GUI (1)** | `ScanNewGuis`, `ForceStretchToParent`, bảng đăng ký embed, `MeasureHost`, `SnapSubtree`, `FitEmbedded` (100 dòng), `TabArea`, `FitToTab`, `FeatureTabHost` |
| 3716–4020 | `S.FeatureTemplate` | Sinh **mã mẫu** cho tab tính năng mới (chuỗi `[==[ ... ]==]` 305 dòng), kèm `_G.BananaCatHubAPI` (3679–3711) để script do người dùng dán xin hub nhúng GUI |
| 4022–4242 | Nhúng GUI (2) | `SyncAllEmbeds`, `ClearEmbedsUnder`, `EmbedGui`, niêm tâm `_buildCrosshair`, `IsEmbeddable` |
| 4244–4433 | **Hook GUI** | `S.HookInstanceNew` (hook `Instance.new`), `WatchNewGuis`, `EmbedRecorded` |
| 4435–4736 | Cứu/đỗ GUI | `FindFeatureByHost`, `RescueScan`, `ParkHost` (đưa GUI của script khác vào menu), `ShouldSkipPark`, `BeginRunCapture`/`EndRunCapture` |
| 4738–4899 | `RunFeatureScript` | Chạy script của tab tính năng + logic nhúng/kết thúc capture |
| 4900–5476 | ➕ Tạo Tính Năng | `CreateFeatureTab`, form dán code/link, nút nhúng, “Code Tự Co Giãn”, lưu/khôi phục tab |
| 5477–5650 | Danh sách tính năng | `RebuildFeatureList`, khôi phục tab đã lưu |
| 5651–8450 | 🚀 **Nhóm di chuyển `MV.*`** (137 hàm, ~2.521 dòng) | xuyên tường + đẩy xuyên (5684–5834), nhảy vô hạn (5835), tốc độ (5916), watchdog (5965), bay theo camera (6018), tốc độ theo camera (6331), nhảy cao (6477), thảm kính/đặt kính (7543–8250), HUD nổi, 🛡 Bay An Toàn (`MV.Safe` 6581, `SF` 6620, quét vật thể 6652–6822), bay tới kính/người chơi |
| 8430–8583 | 🌐 Server | `ResetServer`, `HopServer`, `HopLowServer`, `HopEmptyServer` (lọc server qua API Roblox), lấy JobId, vào server theo mã |
| 8584–8756 | 🔐 Anti-ban | Nhận diện thông điệp ban/kick, hook `player.Kick`, hop server |
| 8758–8831 | 📚 Danh mục hub | `S.ScriptHubList` (8758) — **30 mục** (Dex, Infinite Yield, SimpleSpy, các action tiện ích/di chuyển/server) |
| 8832–9112 | `S.RunHubAction` | Bộ điều phối 267 dòng / 216 câu lệnh / 127 `pcall` cho mọi mục trong hub |
| 9113–9437 | 📚 Tab Script Hub | Dựng thẻ, tìm kiếm, yêu thích, `RebuildHubList` |
| 9439–9912 | ⚙ Khung tuỳ chỉnh | Bay / tốc độ camera / nhảy cao / di chuyển / anti-ban / 🚀💨🦘 |
| 9913–10775 | 📍 & 👣 | `S.Loc` (10119) — định vị: Highlight, khoảng cách, bạn bè, “bị hạ gục”, bay tới người; bằng `LOC` (10128) và panel 👥 |
| 10776–11124 | 🎥 Xem người chơi | `S.Spec` — theo camera người khác |
| 11125–11447 | 🎥 Khán giả | `S.Free` — freecam giữ nhân vật |
| 11448–11600 | ✨ Phát sáng | `S.Glow` — Highlight + PointLight quanh nhân vật, xuyên tường |
| 11600–12173 | 🛡 + 👣 + 🎥 | Khung bay an toàn, khung xem người chơi, khung khán giả |
| 12174–12400 | 🧱 Kính | Khung đặt kính & bay tới kính (nhiều tấm cố định) |
| 12401–12854 | ⚙️ Thiết lập + khởi động cuối | Tab Thiết lập, tự dựng lại danh sách, ô tìm kiếm, nút kéo ✕ (RightControl), `print` tổng kết |

---

## 4. Vòng đời khi chạy

1. **Dọn dẹp** (17–110): gọi `StopAll` của bản cũ, gỡ `_G.BananaCatHub_MV/_Free/_SpecCam`, `Disconnect` 300 kết nối cũ, `UnbindFromRenderStep` 10 tên cố định.
2. **Dựng GUI**: chọn `gethui()` → `PlayerGui` → `CoreGui` (18–27), tạo `ScreenGui`, 7 tab tĩnh + nút ✕ kéo được + `RightControl` để ẩn/hiện.
3. **Nạp trạng thái**: `Store.load()` đọc `banana_cat_saved.json` (nếu executor có `writefile`/`readfile`), dựng lại script đã lưu, waypoint, tab tính năng.
4. **Không có bước xác thực nào.** Không hỏi key, không mở trình duyệt, không có màn hình chờ.
5. **Khi người dùng chạy code** (💻, ➕, hoặc mục trong 📚):
   `RunCode` → `Cancel()` → `ReleaseHubFocus()` → `S.BeginRunCapture()` (hook `Instance.new`) → `ExecOnce` (`SanitizeCode` → `NormalizeRunnable` → `EnsureCompat` → `loadstring` → chạy) → `EndRunCapture` (nhúng GUI vừa tạo vào tab, tối đa `PARK_MAX`).
6. **Watchdog** (5997–6017): vòng `task.wait(0.3)` chỉ sống khi có tính năng di chuyển bật; tự huỷ khi tắt hết.
7. **Anti-ban** (nếu bật): hook `player.Kick`, nghe log/GUI error/PlayerRemoving/WalkSpeed → `S.AntiBanHop` → teleport sang server khác (cooldown 10 s).

---

## 5. Tính năng (bản kiểm kê)

**Tab tĩnh (7):** 💾 Code Đã Lưu · 💻 Code · 📚 Script Hub · 👥 Người Chơi · 🛠 Hỗ Trợ · ⚙️ Thiết Lập · ➕ Tạo Tính Năng
(+ tab động 🧩 **GUI Ngoài** khi có GUI bị “đỗ”, + 1 tab cho mỗi tính năng tự tạo).

**📚 Script Hub — 30 mục**, chia nhóm *Admin / Explorer / Spy / Tiện ích / Server / Di chuyển / Định vị*:
Infinite Yield, Dex Explorer, SimpleSpy v3, niêm tâm, trả GUI về màn hình, sửa kẹt chuột, nạp lại hub, dọn host,
Reset/Hop/Hop ít người/Hop siêu vắng, Anti Ban, lấy JobId, bay theo camera, tốc độ theo camera, thảm kính,
đặt kính, quản lý kính, tự đặt kính, xoá kính, bay tới kính, xuyên tường, nhảy vô hạn, nhảy cao, khán giả,
phát sáng, bay an toàn, định vị, xem người chơi.

**Nhóm di chuyển `MV.*`** (137 hàm): noclip + “đẩy xuyên khi bị chặn cứng”, nhảy vô hạn/nhảy cao, walk-speed
và sprint theo camera, bay theo camera, bay + tự né vật chuyển động, 🛡 bay an toàn (`MV.Safe`: quét vật thể
theo bán kính, tính vector đẩy, giữ `PlatformStand`/`AutoRotate=false`, có “khiên”), thảm kính và các tấm kính
cố định, bay tới kính/người chơi, HUD nổi trên màn hình game.

**Khác:** định vị người chơi (Highlight, khoảng cách, dấu bạn bè/đã hạ gục, bay tới), xem qua camera người khác,
freecam, phát sáng nhân vật (Highlight + PointLight), đo tốc độ có HUD, phân tích vật thể bằng ray/chạm,
lưu/khôi phục script–waypoint–tab tính năng.

---

## 6. Cơ chế lõi (chi tiết)

### 6.1 `Store` — lưu trữ (1015–1235)
- File `banana_cat_saved.json`, `SAVE_VERSION = 3` (tên file còn mang thương hiệu cũ “banana_cat”, không phải `taodepzai`).
- Ba chế độ: `file` (executor có `writefile`/`readfile`), `memory` (chỉ giữ trong `_G.BananaCatHub_SavedData`), `none`.
- Ghi qua `HttpService:JSONEncode`, đọc qua `JSONDecode`; `Store.saveSoon` gộp ghi trong 0,3 s (chống spam đĩa). Có **cảnh báo** khi file lưu mang version mới hơn script hiểu (1173–1178) — nhưng vẫn nạp các mục đọc được. **Đây là phần được thiết kế cẩn thận nhất trong tệp.**

### 6.2 Nhúng / “đỗ” GUI của script khác (3321–4736)
- `S.HookInstanceNew` chặn `Instance.new` để ghi lại mọi `ScreenGui` được tạo trong lúc chạy script, rồi
  `S.EmbedGui` **đổi `Parent` của GUI đó** vào tab của hub, ép co giãn bằng `ForceStretchToParent` + `FitEmbedded`.
- Fallback: `WatchNewGuis` theo dõi `DescendantAdded` khi không hook được.
- GUI không nhúng được thì `S.ParkHost` đưa vào tab 🧩 “GUI Ngoài” (vẫn **giữ nguyên instance**, chỉ đổi chỗ).
- Có cơ chế tin cậy 3 mức (`certain` / `manual` / `guess`) và `S.ShouldSkipPark` để tránh “ăn nhầm” GUI của game.

### 6.3 Bù API executor (`S.EnsureCompat`, 1322–1379)
Khi executor thiếu hàm, hub **tự định nghĩa hàm thay thế vào `_G`** (chỉ khi tên đó chưa tồn tại — tốt):
`loadstring` (bọc `load`), `getgenv`/`getrenv` (trả `_G`), `identifyexecutor` (trả “taodepzai v5.0 NOIR-Compat”),
`checkcaller` (trả `false`), `setclipboard`/`toclipboard` (ghi vào biến RAM), `readfile`/`writefile`/`isfile`/`listfiles`
(ổ đĩa ảo trong RAM), `getcustomasset` (trả nguyên đường dẫn), `request`/`http_request` (dựng lại bằng
`HttpService:RequestAsync`/`HttpGet`), `hookfunction` (trả hàm mới mà không hook), `getrawmetatable`,
`getconnections` (trả `{}`), `fireclickdetector`/`firetouchinterest`/`fireproximityprompt` (trả `true` mà không làm gì),
`gethui`, `Drawing`, `setfpscap`, `queue_on_teleport` (lưu vào `S.queued` **rồi không bao giờ chạy**).

### 6.4 🔐 Anti-ban (8584–8756)
- Nhận diện ~18 cụm từ (“you have been banned/kicked”, “anti-cheat”, “exploit detected”…) trong
  `LogService.MessageOut` và `GuiService.ErrorMessageChanged`.
- Hook `player.Kick` bằng `hookfunction`; bị kick → hop server thay vì thoát.
- Cũng hop khi: chính mình biến mất khỏi `Players.PlayerRemoving`, teleport thất bại, hoặc `WalkSpeed`
  bị game reset 3 lần trong 4 giây khi đang bật tính năng di chuyển.
- Cooldown 10 s; trạng thái lưu ở `_G.BananaCatHub_AntiBan`; có hàm gỡ hook khi tắt.

### 6.5 Hợp đồng cho script do người dùng dán
`_G.BananaCatHubAPI` (3679–3711): `Version`, `HubGui`, `Main`, `TabArea`, `OnResize`, `FeatureTabHost`,
`FitToTab`, `EmbedGui`, `MakeTemplate`, `ReleaseFocus`, `ExternalGui`, `Crosshair`. Template `S.FeatureTemplate`
sinh sẵn khung `BC` + `bcOn/bcClose` + đăng ký vào `_G.BC_FEATURES`.

---

## 7. Điểm tốt (đáng giữ)

1. **Huỷ bản chạy trước rất kỹ** (17–110): tránh chồng GUI/hook khi người dùng chạy lại script nhiều lần — lỗi phổ biến của các hub.
2. **`trackConn` + `UnbindFromRenderStep`**: 26/40 tín hiệu dài hạn được quản lý, watchdog tự tắt khi không cần (5997–6017).
3. **`pcall` dày đặc (710)** và **compat chỉ ghi khi hàm chưa tồn tại** (`S.SetGlobal` trả `false` nếu có) → hạn chế đè hàm thật của executor.
4. **Không telemetry, không obfuscate**: không gửi dữ liệu người dùng đi đâu; chỉ `HttpGet` tới GitHub (tải script có sẵn) và API server của Roblox. Toàn bộ mã đọc được, chú thích tiếng Việt rõ ràng.
5. **Lưu trữ có phiên bản + gộp ghi đĩa + fallback RAM** (1015–1235) — thiết kế tốt hơn mức thường thấy ở script cùng loại.
6. **Có bảo vệ “ăn nhầm” khi nhúng GUI**: 3 mức tin cậy, `ShouldSkipPark`, `IsEmbeddable`, giới hạn `PARK_MAX`.

---

## 8. Vấn đề & rủi ro

### 8.1 Mức cao

| # | Dòng | Vấn đề | Hệ quả / hướng xử lý |
|---|---|---|---|
| S1 | 4244–4326, 4654–4668 | **Hook toàn cục `Instance.new`** trong suốt thời gian chạy script (thử gán `Instance.new = ours`, fallback `hookfunction`). | Mọi script khác trong cùng executor, kể cả anti-cheat phía client của game, đều đi qua hàm này; hook lỗi/rò rỉ làm treo tạo instance. Nên **chỉ hook trong thời gian ngắn**, loại trừ theo coroutine, hoặc chuyển sang `WatchNewGuis` mặc định. |
| S2 | 8698–8720 | **Hook `player.Kick`** để hop server khi bị kick. | Chặn/đổi hướng một sự kiện hệ thống; nếu hook không gỡ được khi script bị unload sẽ để lại trạng thái lạ. Về bản chất đây là **né biện pháp xử lý của game** → rủi ro khoá tài khoản cao hơn cả việc dùng executor. |
| S3 | 1322–1379 | **API giả “thành công”**: `firetouchinterest`, `fireproximityprompt`, `fireclickdetector`, `getconnections`, `Drawing`, `setclipboard`, `getcustomasset`, `queue_on_teleport`, `hookfunction` trả kết quả như thật nhưng không làm gì (hoặc ghi vào RAM). | Script chạy trong hub **thất bại âm thầm** — khó gỡ lỗi nhất. Nên: **không bù** các hàm “có tác dụng phụ”, hoặc bù nhưng kèm cờ cảnh báo cho script (`S.compatAdded`) và log rõ. |
| S4 | 1985–1989, 8761–8769, 1440–1458, 4738–4763 | **Tải mã từ repo bên thứ ba rồi `loadstring`**: `raw.githubusercontent.com/infyiff/backup/main/dex.lua`, `EdgeIY/infiniteyield/master/source`, `ex-serum/SimpleSpy/main/SimpleSpy.lua` — **không ghim commit/tag, không kiểm tra hash**. | Repo bị chiếm hoặc nhánh `main` đổi nội dung ⇒ **chạy mã lạ trên máy mọi người dùng**. Nên ghim commit + hash, hoặc gộp bản đã kiểm vào repo. |
| S5 | 1164–1232, 4654–4736 | **Đổi `Parent` GUI của script khác** (nhúng/đỗ vào menu) rồi **ép lại kích thước** (`ForceStretchToParent`, `FitEmbedded`). | GUI của script bên thứ ba có thể vẽ sai, mất sự kiện, hoặc hỏng logic vì bị di chuyển; một số script tự phát hiện và tự tắt. Nên mặc định **không nhúng**, để người dùng tự bật. |

### 8.2 Mức trung bình

| # | Dòng | Vấn đề |
|---|---|---|
| S6 | 8707–8713 | `GuiService.ErrorMessage` **không phải thuộc tính API công khai**; `gs:GetErrorMessage()` cũng không phải API phổ biến ⇒ nhánh anti-ban này gần như **không bao giờ chạy** (chỉ tốn kết nối). |
| S7 | 8688–8726 | Bắt từ khoá “banned/kicked/anti-cheat” trong **mọi** `MessageOut` của game (kể cả thông báo không liên quan tới mình) ⇒ **hop oan**, mất tiến trình chơi. Không có xác nhận của người dùng trước khi teleport. |
| S8 | 8735–8754 | Đếm `WalkSpeed` bị reset 3 lần/4 s để hop: game tăng/giảm tốc hợp lệ (bùa, vùng đất, sự kiện) cũng kích hoạt ⇒ hop oan. |
| S9 | 1355–1356, 1241 | `queue_on_teleport` bù thành hàm **chỉ lưu vào `S.queued` và không bao giờ chạy** — script tưởng đã hẹn được code sau khi teleport. |
| S10 | 1331–1332 | `getgenv()`/`getrenv()` trả `_G` của hub: script tưởng lấy được môi trường executor/game thật. |
| S11 | 1304–1320 | `S.CompatDrawing` tạo bảng giả: `Drawing.new("Circle")`… không vẽ gì, `Remove()` chỉ đổi `Visible`. |
| S12 | 1373, 1447 | `S.EnsureCompat` chạy **mỗi lần chạy code** (idempotent) nhưng các hàm giả **vẫn nằm trong `_G` cho tới hết phiên** — ảnh hưởng mọi script chạy sau đó. |
| S13 | 1057, 1081 | Ghi/đọc file trong thư mục executor (`banana_cat_saved.json`) — cần nói rõ trong tài liệu cho người dùng. |
| S14 | 1330, 8760+ | Thương hiệu còn lẫn: `_G.BananaCatHub_*` (10+ khoá), file `banana_cat_saved.json`, `_G.BC_FEATURES` — nhưng GUI in “taodepzai v5.0 NOIR”. Gây khó hiểu khi gỡ lỗi/xung đột với bản cũ. |

### 8.3 Mức thấp / vệ sinh

| # | Dòng | Vấn đề |
|---|---|---|
| S15 | toàn tệp | **CRLF 100%** trong một tệp `.js` chứa Lua ⇒ diff/git blame khó đọc, công cụ lint hiểu sai ngôn ngữ. Nên đổi tên `hub.lua` (hoặc `.luau`) và chuẩn hoá LF. |
| S16 | 3716–4020 | Hàm 305 dòng chỉ để ghép **chuỗi template**; 8832–9098 hàm điều phối 267 dòng, 216 nhánh `if/elseif` ⇒ nên tách bảng ánh xạ `id → handler`. |
| S17 | 6701–6822 | `MV.Safe.Scan` lồng 9 cấp, 188 câu lệnh trong 122 dòng ⇒ khó bảo trì, dễ lỗi chỉnh sửa. |
| S18 | 9453–9859, 9955–12505 | 7 nhóm hàm cục bộ **trùng tên** (`button` ×4, `box` ×4, `lab` ×6, `act` ×7, `paint` ×5, `applySpeed` ×3, `say` ×2) trong các khối `do…end` khác nhau — không lỗi (khác scope) nhưng là dấu hiệu copy–paste UI. |
| S19 | 1–8 | Header nhắc “parser Luau + static regression” nhưng repo **không có test nào cho Luau** (xem §9). |
| S20 | 12687 | Danh sách kiểm tra API được in ra ở cuối nhưng không ai đọc; nên đưa vào tab 💻 báo cáo chạy. |

### 8.4 Hàm chết (14) — định nghĩa nhưng không nơi nào gọi

| Dòng | Hàm | Ghi chú |
|---|---|---|
| 276–284 | `D.Paint` | Thay bằng `D.Paint3` |
| 398–422 | `D.Glow` | Trùng ý tưởng với `S.Glow` |
| 438–443 | `D.Breathe` | |
| 3096–3098 | `SV.Status` | Panel dùng chuỗi khác |
| 3131 | `SV.Toggle` | |
| 6028–6030 | `MV.SetFlyVirtual` | |
| 6941–6950 | `MV.Safe.Repair` | |
| 7597–7604 | `MV.SetCarpetEdge` | |
| 7605–7608 | `MV.SetCarpetHold` | |
| 7609–7612 | `MV.SetCarpetSlack` | |
| 7850–7856 | `MV.RemoveGlass` | Panel dùng đường khác |
| 11322 | `local glowRound` | 1 dòng, không dùng |
| 11410–11419 | `S.Glow.SetColor` | |
| 12462–12469 | `local rule` | Đường kẻ trong tab Thiết lập, không dùng |

*(Đã kiểm bằng tìm từ nguyên vẹn + quy đổi alias `MV↔S.Move`, `LOC↔S.Loc`, `SV↔S.SpeedMeter`, `FR↔S.Free`, `GL↔S.Glow`
để tránh kết luận sai.)*

---

## 9. Lệch giữa `script.js` và phần còn lại của repo

Đây là phát hiện nghiêm trọng nhất về mặt “sức khoẻ repo”: **bốn tệp đang mô tả bốn phiên bản khác nhau của cùng một dự án.**

| Tệp | Nội dung đang nói | Thực tế tại commit `8527247` |
|---|---|---|
| `README.md` | `script.js` = **key system v5** cho executor, biến `BI_MAT_V4`, hàm `KiemTraKey`, lưu `taodepzai_key_<UserId>.txt` | Không tồn tại bất kỳ thành phần nào ở trên |
| `LUA_HOP_DONG.md` | Hợp đồng kỹ thuật của script **1.131 dòng**, 62 hàm: `CAU_HINH`, `GiaiMaMoi`, `KiemTraKey`, `ChayScriptChinh`… | Tệp thật **12.854 dòng**, 449 hàm, là hub GUI |
| `PHAN-TICH.md` §9 | Nói các việc P0 (xoá khối lạ trong `index.html`, nâng trang lên v5, viết lại test 17/17 pass) **đã xong** | `index.html` **vẫn còn** khối CSS quảng cáo giả + script `postMessage`; test **16/17 fail** |
| `index.html` | Phát key `Free_v5_` (HMAC-SHA256, tag 256 bit, hạn 24 giờ), hướng dẫn người dùng “Lấy key”, nút “Lấy key” trong script | Trang vẫn chạy và vẫn phát key… **nhưng không có script nào kiểm tra key nữa** ⇒ luồng nghiệp vụ chính đã chết ở phía script |
| `tools/kiem-tra-key.cjs` | “Đọc cấu hình trực tiếp từ `script.js`… mô phỏng `KiemTraKey`” | **Crash**: `Error: Không đọc được KEY_PREFIX trong script.js` |
| `tests/portal.test.cjs` | 17 test, trong đó test #2 kiểm “mật khẩu, nhãn miền, cấu trúc v5 phải khớp giữa trang và `script.js`” | **17 test — 1 pass, 16 fail**; test #2 fail vì `script.js` không còn `KEY_PREFIX = "Free_v5_"`, `tdz5\|tron\|`, `BI_MAT` |

**Bằng chứng đã chạy:**

```text
$ node tools/kiem-tra-key.cjs "Free_v5_abc" "Ten"
Error: Không đọc được KEY_PREFIX trong script.js        (thoát với lỗi)

$ node --test tests/portal.test.cjs
# tests 17   # pass 1   # fail 16   # duration_ms 111

$ grep -c "Free_v\|KiemTraKey\|tuRoblox\|CHAP_NHAN" script.js
0

$ node -e "…modern Luau 0.739 compile script.js…"
COMPILE OK, bytecode bytes = 605028
```

Thêm hai khối lạ vẫn còn trong `index.html` (đúng như báo cáo cũ, nên `tests` lấy sai block
`<style>`/`<script>` đầu tiên ⇒ 15 test đầu fail vì lý do kỹ thuật chứ không phải logic trang):

| Dòng trong `index.html` | Khối | Kích thước |
|---|---|---|
| `<style>` dòng 4 (nội dung dòng 5, kết thúc dòng 7) | `.fake-ad*`, `.video-*` (quảng cáo giả, không phần tử nào dùng) | 1.850 B |
| `<script>` dòng 8 | chặn `console.*`, `window.onerror`, `postMessage` ra `window.parent` | 653 B |
| dòng 1478 | `<script></script>` rỗng | 3 B |

Và `index.html` (dòng 684) vẫn hướng dẫn người dùng chạy
`loadstring(game:HttpGet("https://raw.githubusercontent.com/HieudepzaiHub/main/abc"))()` — **repo khác**, không ghim phiên bản.

---

## 10. Cách tái lập kiểm chứng

```bash
# 1) Cú pháp Luau bằng trình biên dịch thật (WASM, npm)
npm i @luau-rs/luau luau-parser
node -e "import('@luau-rs/luau').then(async m=>{const l=await m.Lua.create();
  console.log(l.compile(require('fs').readFileSync('script.js','utf8')).byteLength)})"   # 605028

# 2) Thống kê & AST
node -e "const p=require('luau-parser'),fs=require('fs');
  const ast=p.parse(fs.readFileSync('script.js','utf8'),{locations:true});
  console.log('parse OK:', ast.type)"

# 3) Đếm nhanh
grep -c "pcall" script.js            # 710
grep -c ":Connect(" script.js        # 227
grep -c "trackConn(" script.js       # 50
grep -c "Instance.new" script.js     # 38
grep -c "Free_v\|KiemTraKey" script.js   # 0

# 4) Test & công cụ của repo
node --test tests/portal.test.cjs        # 17 test, 1 pass, 16 fail
node tools/kiem-tra-key.cjs "Free_v5_abc" "Ten"   # crash
node tools/decode-demo.cjs "Free_v5_abc"          # chạy được (chỉ kiểm key, không liên quan script.js)
```

---

## 11. Khuyến nghị theo thứ tự

**P0 — quyết định hướng dự án trước (rẻ, gỡ được cả chuỗi lệch)**
1. **Chọn một sản phẩm**: (a) giữ `script.js` là **hub** ⇒ xoá/viết lại `LUA_HOP_DONG.md`, sửa `README.md`,
   bỏ trang phát key `index.html` (hoặc đổi thành trang giới thiệu hub), xoá `tools/kiem-tra-key.cjs` và 16 test
   key, thay bằng test cho hub; hoặc (b) muốn giữ **key system** ⇒ khôi phục tệp key system từ nhánh trước và
   tách hub ra tệp riêng (`hub.lua`).
2. Nếu giữ hub: **không nhúng/đỗ GUI mặc định**, để người dùng tự bật (`S.embedEnabled=false`, `parkCodeGuis=false`).
3. **Ghim commit + hash** cho 3 script tải từ GitHub, hoặc chép bản đã kiểm vào repo.
4. **Bỏ hook `player.Kick`** và cơ chế hop khi bị kick: giữ lại phần cảnh báo (log/GUI message) nhưng **hỏi người dùng** trước khi teleport.

**P1 — giảm rủi ro & dọn mã**
5. Ngừng bù các API có tác dụng phụ (`firetouchinterest`, `fireclickdetector`, `fireproximityprompt`,
   `getconnections`, `queue_on_teleport`, `setclipboard`, `getcustomasset`); chỉ bù API “đọc” thuần.
6. Ghi log rõ mỗi lần dùng hàm bù (đã có `S.CompatNote`, nhưng nên đưa lên UI thay vì chỉ `print`).
7. Sửa/loại nhánh anti-ban chết (`GuiService.ErrorMessage`) và thêm xác nhận trước khi hop (S6–S8).
8. Xoá 14 hàm chết; tách `S.RunHubAction` thành bảng ánh xạ; tách template 305 dòng ra tệp mẫu riêng.
9. Đổi tên tệp thành `.luau`, chuẩn hoá LF; dọn thương hiệu `BananaCatHub`/`banana_cat_saved.json`.

**P2 — vệ sinh `index.html` & tài liệu**
10. Xoá 3 khối lạ trong `index.html` (đúng như `PHAN-TICH.md` §9 từng nói là đã xong) — việc này tự làm 15 test
    đầu chạy lại được.
11. Viết lại `PHAN-TICH.md`/`README.md` cho khớp thực tế, hoặc ghi rõ “tài liệu này mô tả bản key system cũ”.

---

## 12. Phụ lục

### 12.1 15 hàm dài nhất

| Dòng | Dòng | Câu lệnh | `pcall` | Hàm |
|---|---|---|---|---|
| 3716–4020 | 305 | 14 | 16 | `S.FeatureTemplate` |
| 8832–9098 | 267 | 216 | 127 | `S.RunHubAction` |
| 7261–7522 | 262 | 53 | 16 | `MV.Safe._BuildHud` |
| 4900–5092 | 193 | 49 | 0 | `CreateFeatureTab` |
| 4738–4899 | 162 | 54 | 13 | `RunFeatureScript` |
| 9287–9437 | 151 | 111 | 42 | `S.RebuildHubList` |
| 6701–6822 | 122 | 188 | 0 | `MV.Safe.Scan` (lồng 9 cấp) |
| 6202–6320 | 119 | 45 | 0 | `MV._BuildFlyHud` |
| 6961–7075 | 115 | 111 | 25 | `MV.Safe.Step` |
| 3521–3620 | 100 | 31 | 2 | `S.FitEmbedded` |
| 8669–8754 | 86 | 13 | 10 | `S.AntiBanArm` |
| 4244–4326 | 83 | 17 | 14 | `S.HookInstanceNew` |
| 2631–2711 | 81 | 62 | 6 | `PickObjectAt` |
| 5477–5557 | 81 | 35 | 0 | `RebuildFeatureList` |
| 1164–1232 | 69 | 43 | 0 | `Store.load` |

### 12.2 Toàn bộ URL trong tệp (không có telemetry)

```
2×  https://raw.githubusercontent.com/infyiff/backup/main/dex.lua        (Dex Explorer)
2×  https://raw.githubusercontent.com/EdgeIY/infiniteyield/master/source (Infinite Yield)
2×  https://raw.githubusercontent.com/ex-serum/SimpleSpy/main/SimpleSpy.lua
1×  https://games.roblox.com/v1/games/            (liệt kê server để Hop ít người / siêu vắng)
```

### 12.3 API executor được dùng nhiều

`gethui` (8), `hookfunction` (10), `identifyexecutor` (3), `HttpGet` (15), `writefile` (10), `readfile` (6),
`setclipboard` (4), `queue_on_teleport` (3), `isfile` (3), `firetouchinterest`/`fireclickdetector`/
`fireproximityprompt`/`getconnections`/`getcustomasset`/`setfpscap`/`checkcaller`/`newcclosure`/`Drawing` (mỗi thứ 1–2),
`getgenv`/`getrenv`/`getrawmetatable`/`setreadonly`/`hookmetamethod`/`getnamecallmethod`/`setnamecallmethod` (1 mỗi thứ —
hầu hết chỉ để dò “executor có hàm này không”).

### 12.4 Kết luận một câu

`script.js` là **một hub executor 12.854 dòng viết bằng Luau, cú pháp hợp lệ, chất lượng phòng lỗi khá nhưng
mang 4 rủi ro thật (hook toàn cục, API giả, mã bên thứ ba, hành vi né ban)**, và **toàn bộ hệ sinh thái key
`Free_v5_` mà tài liệu + trang + công cụ của repo đang quảng cáo đã không còn tồn tại trong tệp này** — cần
chọn hướng (giữ hub hay giữ key system) trước khi sửa bất cứ thứ gì khác.
