# 🌳 Báo cáo: tính năng "Định vị vạn vật theo tên" trong tab 👥 Người Chơi

*Thực hiện trên `script.js` (hub **taodepzai v5.0 NOIR**), nhánh `arena/01a10157-taodepzai`,
ngày 2026-10-03. Số liệu: `script.js` **12.854 → 13.859 dòng** (+1.005 dòng, **0 dòng bị xoá**).*

---

## 1. Yêu cầu → kết quả

| Yêu cầu | Kết quả |
|---|---|
| Thêm vào **tab 👥 Người Chơi** | ✅ Khung **🌳 ĐỊNH VỊ VẬT THEO TÊN** là khung thứ 4 của tab (📍 → 👣 → 🧱 → 🌳), vị trí y=1066, LayoutOrder 4, tự canh lại `CanvasSize` của tab |
| Nhập tên vật → định vị **tất cả** vật đó | ✅ Gõ `cây` là quét cả workspace, bỏ dấu + không phân biệt hoa thường, khớp **mọi** BasePart/Model có tên chứa từ khoá; hỗ trợ nhiều từ khoá (`cây, đá; rương`) |
| Vật **di chuyển tới đâu thì định vị theo đó** | ✅ Highlight + nhãn gắn **trực tiếp vào part của vật** (không vẽ theo toạ độ), cập nhật khoảng cách mỗi 0,2 s; quét lại workspace mỗi 1,5 s nên vật mới xuất hiện / bị xoá cũng tự bám |
| **Không làm mất tính năng** | ✅ 0 dòng bị xoá; 93 test Luau + đối chiếu tự động đều xanh (xem §4) |
| **Chạy test để tìm lỗi** | ✅ Dựng bộ test Luau thật (93 case) trong `tests/luau/`; tìm & sửa **5 lỗi** (xem §6) |

## 2. Cách dùng

1. Mở hub → tab **👥 Người Chơi** → kéo xuống khung **🌳 ĐỊNH VỊ VẬT THEO TÊN**.
2. Gõ tên vật vào ô **🔎 Tên vật** (VD: `cây`, `đá`, `rương`). Hết gõ 0,35 s là tự bật định vị.
3. Tuỳ chọn: **🌳 Định vị** (bật/tắt) · **🔄 Quét lại** · **🔲 Hộp** (hộp bao quanh vật) ·
   **🕶 Xuyên tường** · **💬 Nhãn** (tên + khoảng cách) · **🎨 màu** · **📏 Xa nhất** (giới hạn
   khoảng cách, 0 = không giới hạn) · **🚀 Bay tới gần nhất** / **⏹ Dừng bay** + tốc độ.
4. Bảng kết quả bên dưới liệt kê 8 vật gần nhất — mỗi dòng có **🚀 Bay** (bay xuyên vật cản tới
   vật đó, vật đi đâu bay theo đó, vật biến mất thì tự dừng) và **📋 Tên** (copy tên vật).
5. Ngoài ra có 3 thẻ nhanh trong **📚 Script Hub**: 🌳 *Định Vị Vật Theo Tên*, 🚀 *Bay Tới Vật
   Đang Định Vị*, 🧹 *Tắt Định Vị Vật*.

## 3. Đã thêm gì vào `script.js`

| Khối | Dòng | Việc |
|---|---:|---|
| Dọn GUI lần chạy trước | 87 | Xoá `BC_ObjTrackESP` còn sót trong PlayerGui/CoreGui |
| Gỡ render step | 116 | Gỡ `BC_ObjTrack`, `BC_ObjFly` trước khi gắn lại |
| **🌳 module `S.ObjTrack`** | 12.656–13.119 | Quét workspace, bỏ dấu tiếng Việt, tạo Highlight + nhãn + hộp, chống trùng, giới hạn khoảng cách/số lượng, `Set/Toggle/SetQuery/Nearest/Status/RefreshList`, xuất `_G.BananaCatHub_ObjTrack` |
| **Khung 🌳 trong tab 👥** | 13.142–13.940 | Toàn bộ UI + nút + bảng kết quả (dùng đúng bộ `New/Corner/Stroke/D.Shade/D.Tactile/D.BestText` của hub) |
| **🚀 `MV.FlyToObject`** | 8.382–8.543 | Bay xuyên vật cản tới vật: hướng +3,2 stud trên part, tự giảm tốc khi gần, bám vận tốc vật khi sát, tự dừng khi vật biến mất, `MV.StopObjectFly`, render step `BC_ObjFly` |
| 3 thẻ 📚 Script Hub | 8.995–9.000 | `objfind` / `objfly` / `objclear`, nhóm "Định vị" |
| 3 nhánh `S.RunHubAction` | 9.273–9.290 | Nút 🌳 mở khung + focus ô nhập; 🚀 bay tới vật gần nhất; 🧹 xoá hết |
| Trạng thái + làm mới | 8.535, 12.133 | `S.MoveActionState.objtrack`; `BC_HubList` (vòng 2 s) gọi `S.ObjTrack.RefreshList`; `MV.StopAll` dừng luôn bay-tới-vật |
| Ghi chú tab 👥 | 10.597 | Thêm dòng giải thích "🌳 = định vị MỌI vật theo tên…" |

## 4. Bằng chứng "không làm mất tính năng"

- `git diff --numstat script.js` → **1005 thêm / 0 xoá**. Không có dòng nào của bản cũ bị sửa.
- Đối chiếu tự động bản gốc ↔ bản mới (12 mẫu cấu trúc): `AddTab(` 9→9 · `while true do` 6→6 ·
  `trackConn(` 50→50 · `Instance.new` 24→24 · `loadstring` 18→18 · `S.Loc` 96→96 · `S.Spec` 101→101 ·
  `S.Glow` 59→59 · `S.Free` 54→54 — **không mẫu nào giảm**; các mẫu tăng là do code mới
  (`BindToRenderStep` 14→16, `:Connect(` 227→244, `function` 487→525).
- `node --test tests/portal.test.cjs`: **1 pass / 16 fail — y hệt trước khi sửa** (16 lỗi này có sẵn
  từ trước, do các block lạ được nhúng vào đầu `<head>` của `index.html`, không liên quan `script.js`).
- `tools/kiem-tra-key.cjs` và `tools/decode-demo.cjs` giữ nguyên hành vi cũ (đều báo lỗi như trước).
- Hub nạp và chạy trọn vẹn trong Luau thật: 7 tab, tab 👥 đủ 4 khung không chồng nhau,
  **cả 34 thẻ 📚 Script Hub đều chạy không lỗi** (test riêng).
- Compile bằng Luau 0.739: **OK, 653.145 byte bytecode**.

## 5. Bộ test mới (trong repo)

```
tests/luau/
├── gia-lap-roblox.lua     # giả lập API Roblox (Instance/Signal/GUI/task/RunService/Players…)
├── test-tinh-nang.lua     # 93 test
├── chay-test.mjs          # nạp giả lập + hub + test vào Luau WASM
├── kiem-tra-cu-phap.mjs   # compile script.js
└── README.md
```

Chạy:

```bash
cd tests/luau && npm install
node kiem-tra-cu-phap.mjs     # ✅ COMPILE OK — script.js
node chay-test.mjs            # TESTS: pass=93 fail=0
```

93 test trải 15 nhóm: hub sống sót & API công khai · 28 hàm/tính năng cũ còn nguyên · chuẩn hoá
tên và bỏ dấu tiếng Việt · quét & tạo định vị · **bám theo vật khi vật di chuyển** · giới hạn
khoảng cách · vật bị xoá thì tự bỏ định vị · nhiều từ khoá + giới hạn số lượng · bảng kết quả ·
đổi kiểu hiển thị · **🚀 bay tới vật, bám vật đang di chuyển, tự dừng khi vật biến mất** ·
3 thẻ Script Hub · **luồng UI thật (gõ tên vào ô 🔎, bấm nút trên khung)** · mọi thẻ hub cũ ·
đủ 7 tab & 4 khung không chồng nhau.

> Bí quyết: hub + test nằm chung một chunk Luau (test thấy được `S`, `D`, `MV`… là biến local),
> nhưng thân test bọc trong một hàm riêng để không vượt giới hạn **200 local/hàm** của Luau.

## 5b. Cập nhật theo góp ý: màu xanh nước + giống hệt khung "phân tích toạ độ"

Sau khi dùng thử, yêu cầu bổ sung: **định vị cây phải giống kiểu "phân tích toạ độ"** và dùng
**màu xanh nước**. Đã sửa:

| Việc | Trước | Sau |
|---|---|---|
| Màu mặc định | Xanh ngọc `RGB(0,255,170)` | **Xanh nước `RGB(0,170,255)`** (vẫn còn 6 màu khác để bấm 🎨 đổi) |
| Kiểu Highlight | trong mờ 0,55 | **giống hệt Highlight của 🎯 Phân Tích Vật Thể**: FillTransparency **0,7** + `AlwaysOnTop` |
| Nhãn trên vật | chỉ `Tên  📏 30m` | thêm dòng **`🧭 X 30.0 · Y 5.0 · Z 0.0`** (bật/tắt bằng nút 🧭 Nhãn toạ độ) |
| Thông tin vật | không có | **khung 🎯 VẬT THỂ ĐƯỢC CHỌN** ngay trong khung 🌳: Name · Class · **Position** · Size · Rotation · Look · Material · Color · **Path** — y hệt khung phân tích toạ độ, **cập nhật liên tục theo vật đang chuyển động** |
| Nút copy | không có | **📋 Copy Tọa Độ** + **📋 Copy Path** (dùng đúng `S.CopyToClipboard` của hub) |
| Mỗi dòng danh sách | 🚀 Bay · 📋 Tên | thêm **📊 Xem** → chọn vật để mở khung 🎯 |

Bố cục khung 🌳 giờ cao 418 px: hàng nút · 🧭 · danh sách 8 dòng · khung 🎯 148 px (không chồng nhau,
có test kiểm tra bố cục). Bộ test tăng **93 → 118 case**, chạy `node chay-test.mjs` → `pass=118 fail=0`.

## 5c. Sửa lỗi "nhập tên mà KHÔNG HIỆN GÌ"

**Nguyên nhân chính (lỗi thật của bản trước):** Highlight được gắn vào **ScreenGui trong PlayerGui**.
Theo tài liệu Roblox và báo lỗi engine, Highlight chỉ render khi **nằm trong Workspace** — gắn vào
PlayerGui thì có cái hiện, có cái không, phần lớn là **không thấy gì**. Khung "🎯 Phân Tích Vật Thể"
vẫn hiện vì nó gắn thẳng Highlight vào vật (`hl.Parent = target`).

**Đã sửa:**

| Việc | Trước | Sau |
|---|---|---|
| Highlight | gắn vào ScreenGui (PlayerGui) | **gắn thẳng vào VẬT** (`BC_OT_HL`) — đúng như khung phân tích; Tick tự kéo về vật nếu bị đổi chỗ, tự tạo lại nếu bị xoá |
| Nhãn BillboardGui | trong PlayerGui | **gắn vào part** (trong Workspace) — chắc chắn hiện và bám theo vật |
| Hộp bao quanh | trong PlayerGui | **gắn vào part** (`BC_OT_BOX`) — adornment trong GUI cũng không hiện |
| Dọn rác lần chạy trước | chỉ quét PlayerGui | **quét cả Workspace** tìm `BC_OT_HL/BC_OT_BB/BC_OT_BOX` |
| Tạo từng phần | 1 `pcall` chung: Highlight lỗi là mất luôn cả nhãn | tạo **riêng từng phần**, phần nào lỗi chỉ thiếu phần đó; báo lỗi ra `Status` |

**Nhập PATH cũng tìm được (theo yêu cầu):** dán `Workspace.Rừng Cây.ThanCay`, `game.Workspace.Cây`
hay chỉ `cây` đều chạy — từ khoá có dấu `.` `/` `\` sẽ được hiểu là path (bỏ tiền tố `game.`, khớp
cả path đầy đủ **lẫn** tên đoạn cuối).

**Không còn im lặng khi không khớp:**
- Cuối ô 🔎 hiện dòng gợi ý: *"⚠️ Không có vật nào khớp "xyz" · Đã quét N vật trong Workspace · Thử tên ngắn hơn (VD: cây) hoặc dán đúng Path"*.
- Hiện toast 🔔 `⚠️ không thấy vật nào khớp "xyz" — thử tên ngắn hơn`.
- Thanh trạng thái ghi rõ từ khoá + số vật đã quét.

**Thêm cho đúng "vạn vật":** Model lồng nhau + **Folder** (VD folder "Khu Cây" chứa nhiều cây) đều
định vị được — Folder thì Highlight trỏ vào part bên trong; part con không bị định vị trùng.
Thêm nút **🚫 Bỏ qua người chơi: BẬT/TẮT** để tìm cả vật nằm trong nhân vật người chơi.

Bộ test: **118 → 139 case** (`node chay-test.mjs` → `pass=139 fail=0`), thêm nhóm kiểm tra Highlight
nằm trong Workspace, tự kéo về vật khi bị đổi chỗ/xoá, dán path, Folder, nút bỏ qua người chơi, và
dòng gợi ý khi không khớp.

## 6. Lỗi tìm thấy qua test & đã sửa

| # | Lỗi | Cách phát hiện | Đã sửa |
|---|---|---|---|
| 1 | **Định vị trùng lặp**: Model "Rừng Cây" và part con "ThanCay" cùng khớp từ khoá → 2 Highlight + 2 nhãn chồng lên **cùng một vật** | Test đếm số vật khớp (ra 6 thay vì 5), in danh sách thì thấy cặp cha–con | Thêm bước chống trùng: part nằm trong một Model cũng khớp tên thì bỏ qua part con, ghi lại số bị gộp (`OT._skipped`) |
| 2 | **Mất dấu tiếng Việt**: `OT.Norm` chỉ bỏ dấu nếu môi trường có `utf8.graphemes`; thiếu hàm này thì `cây` ≠ `cay` — đúng lúc đó tính năng mất tác dụng | Test `Norm("Cây Cổ Thụ")` trả `cây cổ thụ` thay vì `cay co thu` | Chuyển sang `utf8.codes` + `utf8.char` (có ở cả Luau WASM 0,739 và Roblox), vẫn có nhánh dự phòng nếu thiếu `utf8` |
| 3 | **Tắt định vị không dừng 🚀 bay**: bấm 🧹 / tắt 🌳 mà nhân vật vẫn đang bay tới vật | Rà luồng UI: `OT.Set(false)` chỉ xoá định vị, không đụng `MV._objFlyActive` | `OT.Set(false)` gọi `S.Move.StopObjectFly()` |
| 4 | **33 dòng lệch chuẩn CRLF** khi chèn code (tệp gốc 100% CRLF) | Đếm byte `\r\n` / `\n`: `LF-only = 33`, bản gốc = 0 | Chuẩn hoá lại toàn bộ về CRLF |
| 5 | **Không test được UI** vì các control không có tên | Viết test UI thì `FindFirstChild("OTQuery")` trả `nil` | Đặt tên `OTQuery/OTToggle/OTRescan/OTClear/OTStatus/OTXyz/OTInfoRow/OTFlyRow/OTCopyRow…` |
| 7 | **"Nhập tên mà không hiện gì"**: Highlight gắn vào PlayerGui nên không render | Soi lại khung "🎯 Phân Tích Vật Thể" đang gắn Highlight vào vật; tra tài liệu/devforum Roblox xác nhận Highlight phải nằm trong Workspace | Gắn Highlight/nhãn/hộp thẳng vào vật + part, Tick tự giữ đúng chỗ, tạo từng phần riêng để lỗi 1 phần không mất cả định vị (§5c) |
| 6 | **Tràn 200 local của Luau** khi thêm khung 🎯 (`Out of local registers … copyPathBtn`) | Compile check `node kiem-tra-cu-phap.mjs` báo lỗi ngay | Gom khối 🎯 vào một hàm riêng `otBuildInfo()` + bỏ biến `PH`, giữ đúng trần 200 local/hàm |

Lỗi trong **khung test** (không phải lỗi sản phẩm, đã sửa để test chạy đúng): giả lập bỏ qua tham
số `parent` khi tạo Instance; nhân vật người chơi khác thiếu `Humanoid`/`HumanoidRootPart` nên
không test được 📍; bảng 🌳 cố tình không dựng khi tab 👥 đang ẩn (nay test bật tab trước).

## 7. Lỗi có sẵn, **chưa** sửa (ngoài phạm vi yêu cầu)

- Khung 🌳 chỉ chạy khi đã mở tab 👥 và bấm (giống các tính năng khác của hub) — không có gì tự bật khi mới vào game.
- `tests/portal.test.cjs`: 16/17 test fail **từ trước** — do `index.html` bị nhúng block lạ ở đầu
  `<head>` (dòng 4–8) và thẻ `<script></script>` rỗng ở dòng 1478.
- `tools/kiem-tra-key.cjs`: `Error: Không đọc được KEY_PREFIX trong script.js` — tool này còn viết
  cho bản key system `Free_v5_` cũ, không khớp hub hiện tại.
- `README.md`, `LUA_HOP_DONG.md`, `PHAN-TICH.md` vẫn mô tả bản key system cũ (xem §9 của
  `PHAN-TICH-SCRIPT-JS.md`).
- 14 hàm chết trong `script.js` (liệt kê ở §8 của `PHAN-TICH-SCRIPT-JS.md`) vẫn còn nguyên —
  không xoá vì yêu cầu là "không làm mất tính năng".
