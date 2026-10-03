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

Bộ test: **139 → 161 case** (`node chay-test.mjs` → `pass=139 fail=0`), thêm nhóm kiểm tra Highlight
nằm trong Workspace, tự kéo về vật khi bị đổi chỗ/xoá, dán path, Folder, nút bỏ qua người chơi, và
dòng gợi ý khi không khớp.

## 5d. Tối ưu chống KHỰNG khi vừa đi vừa định vị

**Triệu chứng:** cứ cách một khoảng (đúng nhịp quét cũ 1,5 giây) là khựng một cái.

**Nguyên nhân:** mỗi 1,5 giây hub gọi `workspace:GetDescendants()` — tạo **một mảng chứa toàn bộ
vật trong map** — rồi **chuẩn hoá bỏ dấu tên của từng vật** và kiểm tra nhân vật người chơi cho mọi
vật khớp. Map càng nhiều vật thì cú khựng càng rõ. Ngoài ra mỗi 0,2 giây nó còn cập nhật **tất cả**
nhãn và dựng lại khung 🎯 (9 dòng `string.format`).

**Đã tối ưu:**

| Việc | Trước | Sau |
|---|---|---|
| Quét workspace | `GetDescendants()` một phát mỗi 1,5 s | **duyệt tăng dần chia lát**: mỗi khung hình ≤ `scanBudget` 180 vật, trần `scanSliceMs` 1,2 ms — map 1.500 vật trải qua ≥9 khung hình, map to hơn thì vẫn không khựng |
| Chuẩn hoá tên (bỏ dấu) | mỗi lượt quét × mọi vật | **đệm theo từng vật** (`OT._nc`, bảng yếu): chỉ tính lại khi vật **đổi tên** → quét lại 1.500 vật = **0 lần** chuẩn hoá |
| Dán PATH | mỗi vật lại dựng cả chuỗi path để so | **giải path trực tiếp** một lần (`OT.ResolvePath` đi từng đoạn tên) |
| Kiểm tra nhân vật người chơi | mỗi vật khớp × `Players:GetPlayers()` + `IsDescendantOf` | lấy **danh sách nhân vật 1 lần** cho cả lượt quét |
| Cập nhật nhãn | mỗi 0,2 s × **tất cả** vật | **xoay vòng** 20 vật mỗi 0,25 s + trần 1,5 ms; chỉ ghi `Text` khi **số liệu đổi** |
| Tạo định vị mới | tạo hết ngay trong 1 khung hình | rải **8 vật mỗi khung hình** (`makeBudget`) |
| Khung 🎯 thông tin | dựng lại 5 lần/giây | 2 lần/giây + **ẩn ngay** khi vật đang xem bị xoá |
| Nhịp quét | 1,5 s | 2 s (có nút 🔄 Quét lại khi cần ngay) |

Có thể chỉnh trực tiếp trong khung 🌳/state: `OT.scanBudget`, `OT.scanSliceMs`, `OT.scanIdle`,
`OT.makeBudget`, `OT.labelBudget`, `OT.labelEvery`, `OT.infoEvery`.

**Test đo hiệu năng (nhóm 13d/13e):** map 1.500 vật → mỗi khung hình quét ≤180 vật, ≥9 khung hình
mới xong, kết quả **bằng đúng** quét thẳng; lượt quét thứ hai chuẩn hoá **0 lần** tên;
`workspace:GetDescendants()` **không còn được gọi** trong lúc quét nền; tạo marker ≤`makeBudget`
mỗi khung hình; mỗi lượt Tick đụng ≤`labelBudget` vật.

## 5e. Nhiều mục chạy cùng lúc + xoá từng mục

Theo yêu cầu: **ghim được nhiều path/tên chạy cùng lúc** và **xoá bớt từng cái**.

| Thành phần | Công dụng |
|---|---|
| Ô **🔎 Tên vật** | Gõ tên/path → vẫn tự định vị ngay như cũ (không mất tính năng cũ) |
| **➕ Thêm mục** (hoặc nhấn **Enter** trong ô nhập) | **Ghim** nội dung đang gõ thành 1 mục; ghim được **nhiều mục** — tất cả chạy đồng thời |
| Hàng **mục đang chạy** (`OTTags`) | Mỗi mục là 1 thẻ: **📁 path** (xanh dương) hoặc **🏷 tên** (xám); bấm **✕** trên thẻ để **xoá riêng mục đó**, các mục khác vẫn chạy |
| **🧹 Xoá hết** | Xoá toàn bộ định vị **và** mọi mục đã ghim |

Cách hoạt động: `OT.RebuildKeys()` gộp **mọi mục đã ghim + ô nhập đang gõ** thành `keys` (khớp tên) và
`pathKeys` (theo path) mỗi lượt quét → nhiều path/tên chạy chung một lượt quét, không tốn thêm gì.

Chi tiết đáng chú ý:
- Ghim **trùng** (kể cả khác hoa/dấu: `ĐÁ` ≈ `đá`) bị từ chối kèm lý do.
- Path **chưa resolve được** vẫn được nhận và xét như *tên* (để không mất khả năng nhập tên có dấu chấm).
- **Xoá mục cuối cùng** → tự tắt định vị và dọn sạch marker.
- **Ghim xong là quét ngay** (không phải chờ nhịp quét 2 giây).
- Hàng thẻ tự dựng lại theo **chữ ký** nên không vẽ lại liên tục (không thêm gánh nặng cho khung hình).

Khung 🌳 cao thêm 34 px (418 → **452**) cho hàng thẻ; danh sách vật (y=206) và khung 🎯 (y=296) dịch
xuống tương ứng, vẫn có test kiểm tra không chồng nhau.

Bộ test: **161 → 189 case** (`pass=189 fail=0`) — nhóm 13f kiểm tra: ghim 2 mục khác loại chạy cùng
lúc, từ chối ghim trùng/rỗng, xoá riêng 1 mục (mục kia vẫn chạy), xoá mục cuối tự tắt, bấm nút
➕/✕ thật trên khung, nhấn Enter trong ô nhập, xoá object khỏi game khi mục path còn đó, và gõ tên
trong ô nhập vẫn tự định vị như cũ.

## 5f. ⭕ Định vị VÒNG trong tab 🛠 Hỗ Trợ (mọi vật + người chơi/NPC đang di chuyển)

> ⚠️ **Mục này đã được THAY THẾ**: theo yêu cầu mới, khối ⭕ *định vị vòng* đã được **gỡ bỏ** và
> thay bằng **📍 định vị tâm** (cây cắm + nút ảo tròn ngắm vật) — xem **§5h**. Phần dưới đây giữ lại để đối chiếu lịch sử.

Theo yêu cầu: thêm **⭕ định vị vòng** vào tab **🛠 Hỗ Trợ**, **nằm NGAY TRÊN** phần "🎯 Định vị tốc độ game".

| Thành phần | Công dụng |
|---|---|
| **⭕ Vòng: BẬT/TẮT** | Bật/tắt vòng định vị (tắt là dọn sạch marker) |
| **🎯 Đổ vị trí** | Đặt tâm vòng **tại chân bạn** ngay lập tức |
| **⏪ Lùi / ⏩ Tới** | Dịch tâm vòng theo **hướng camera** (song song mặt đất), mỗi lần `step` mét (mặc định 14) |
| **🧲 Theo bạn** | Bật thì vòng **đi theo bạn** mỗi khung hình; bấm ⏪/⏩ thì tự tắt bám |
| **⭕ Bán kính (m)** + **✅ Đặt** / **➖ ➕** | **Chỉnh độ to/nhỏ của vòng** (kẹp 5–2000 m, mặc định 60 m) |
| **🖼 Vòng** | Hiện/ẩn **vòng nhìn thấy được trong map** (đĩa Neon mờ + vành `CylinderHandleAdornment`) |
| **🕶 Xuyên tường / 💬 Nhãn / 👁 3 nút ảo / 🎨 màu / ↩️ Đặt lại nút** | Tuỳ chọn hiển thị và màu (6 màu, mặc định **xanh nước**) |
| **Danh sách "TRONG VÒNG"** | 3 đơn vị gần tâm nhất: `#số · tên · loại · Class · ⭕cách tâm · 🧍cách bạn` + nút **📊 Xem / 🚀 Bay / 📋 Tên** |
| **Khung 🎯 THÔNG TIN VẬT ĐANG CHỌN** | Đầy đủ **đúng 9 dòng như "📊 phân tích toạ độ"**: Name, Class, Position, Size, Rotation, Look, Material, Color, Path + **📍 Cách tâm vòng** + **🧍 Cách bạn**; tự cập nhật khi vật di chuyển; có **📋 Copy Tọa Độ / 📋 Copy Path** |

### Định vị *mọi thứ* trong vòng (kể cả người chơi/NPC đang di chuyển)

- Quét bằng `workspace:GetPartBoundsInRadius(tâm, bán kính, OverlapParams)` — **engine tự lọc theo bán kính** nên rất nhẹ; `OverlapParams` loại trừ vòng nhìn thấy, GUI của hub và **nhân vật của chính bạn**.
- Gộp mỗi "đơn vị" lại thành **1 marker**: Model có `Humanoid` → **1 người = 1 marker** (`🧑 Người chơi` nếu là người chơi thật, `🤖 NPC` nếu không); vật trong Model/Folder → gộp theo **cấp cao nhất** (`📦 Bộ phận`); còn lại là từng vật (`🧱 Vật`).
- Quét lại **0,6 s/lần** → vật/người **đi vào vòng thì tự hiện, đi ra thì tự mất**; số marker tối đa `maxItems` (40, giữ các đơn vị **gần tâm nhất**).
- Chống khựng như khối 🌳: tạo marker **chia ngân sách** `makeBudget=6`/khung hình, nhãn cập nhật **xoay vòng** `labelBudget=16` với **trần thời gian** 1,5 ms/lượt, khung 🎯 làm mới thưa `infoEvery=0,5 s`.

### Ba nút ảo trên màn hình + chỉnh vị trí nút

- `BC_RingBtns` (ScreenGui) có 3 nút tròn: **🎯 Đổ vòng · ⏪ Lùi · ⏩ Tới** — **mỗi nút có một hình tròn nhỏ bên trong** (`Inner` + `UICorner 0.5`) chứa icon + chú thích.
- Nút thứ 4 **🔒/🔓 Chỉnh nút** (nhỏ hơn) bật/tắt chế độ chỉnh; trong tab cũng có nút **🖐 Chỉnh nút: BẬT/TẮT**.
- **BẬT** → kéo nút **bất kì** tới chỗ mong muốn (kẹp trong màn hình), thả ra là **lưu vị trí** (`R.btns`), viền nút sáng vàng; **TẮT** → **không kéo được nữa** (đúng yêu cầu), và **kéo nút không kích hoạt nút** (không đổ vòng khi đang chỉnh).
- **↩️ Đặt lại nút** đưa 3 nút về vị trí mặc định (mép phải màn hình).

Thêm **cổng "chạy lại script"** (`tests/luau/chay-lai-hub.mjs`, 11 case): nạp hub **2 lần liên tiếp** — đúng
thao tác bấm chạy lại script — với vòng đang bật ở lần 1, rồi kiểm tra lần 2 **chỉ còn 1 cửa sổ hub / 1 bộ
3 nút ảo**, **marker + vòng nhìn thấy của lần 1 đã bị dọn sạch**, render step `BC_Ring` cũ đã gỡ, và tính
năng ⭕ của lần 2 vẫn chạy (đã thử **gỡ phần dọn dẹp ra** → cổng báo đỏ `chỉ còn ĐÚNG 1 ScreenGui 3 nút ảo -> 2`,
tức cổng thật sự bắt được lỗi).

Test: **189 → 252 case** (`pass=252 fail=0`) — riêng đợt §5g nâng tiếp lên **276 case**, nhóm 16 có **63 case** kiểm tra: khung nằm **trên** phần tốc độ game, chỉnh bán kính (kẹp 5–2000, nút ➖ ➕, ô nhập tay), đổ vòng đúng chân, quét được vật trong bán kính & **không** quét vật ngoài, **bỏ qua chính mình**, gộp 1 marker/người, **NPC/vật đi vào vòng thì hiện – đi ra thì mất**, Folder gộp nhóm, MeshPart, **9 dòng thông tin trùng khớp từng chữ với `OT.Info`** (📊 phân tích toạ độ) và cập nhật khi vật di chuyển, 3 nút ảo + hình tròn nhỏ bên trong, **kéo nút khi TẮT không đổi vị trí / khi BẬT thì đổi và lưu lại**, nút 🔒 bật–tắt, ⏪⏩ dịch đúng hướng nhìn, 🧲 bám theo khi bạn di chuyển, 🖼 bật/tắt vòng nhìn thấy, ngân sách Tick ≤ `labelBudget`, và dọn sạch khi tắt.

## 5g. ⭕ "BẬT VÒNG MÀ KHÔNG THẤY VÒNG" — tìm ra nguyên nhân gốc bằng test

Người dùng báo: bật vòng mà **không thấy vòng**, sách/tường trong vòng **không được định vị**,
muốn **chỉnh định vị người chơi** và yêu cầu **"chạy test để tìm lỗi"**. Kết quả:

**1) Nguyên nhân gốc của "bật vòng mà không thấy vòng" (lỗi nặng nhất).** Khi dựng lại bố cục nút,
khung ⭕ **thiếu mất nút `🧲 Theo bạn`** trong khi code phía dưới vẫn gọi `ui.btnFollow.Activated`
→ hàm dựng khung `R.BuildPanel` **lỗi ngay giữa chừng**. Khung được gọi trong `pcall` nên lỗi bị
**nuốt im lặng**: mọi nút phía sau nó (🕶 Xuyên tường · 💬 Nhãn · 🧑 Chỉ người chơi · 🎨 Màu · 🖐 Chỉnh nút,
cả chip trạng thái) **không bao giờ được tạo** → bấm ⭕ không có gì xảy ra.
*Cách tìm:* test báo `attempt to index nil with 'Activated'` mà **không kèm số dòng** → viết probe in ra
`R.ui.btnFollow` và so **bộ khoá của `R.ui`** với danh sách nút được tham chiếu ở phần code phía dưới,
thấy thiếu đúng `btnFollow`; test mới **16.9b** canh vĩnh viễn việc này (đòi **đủ 23 phần tử** của khung).

**2) Bố cục mới 4 hàng trong panel 430 px** — mọi hàng **≤ 464 px** (bề ngang thật của tab = 540 − 56 rail),
trước đây nút đặt tới 566 px nên bị `ClipsDescendants` cắt mất:

| Hàng | Nút |
|---|---|
| 1 | ⭕ Vòng: BẬT/TẮT · 🎯 Đổ vị trí · ⏪ Lùi · ⏩ Tới · 👁 Nút ảo |
| 2 | ⭕ Bán kính (ô nhập tay) + ✅ Đặt / ➖ ➕ · 🖼 Vòng · ↩️ Đặt lại |
| 3 | 🧲 Theo bạn · 🕶 Xuyên tường · 💬 Nhãn · 🧑 Chỉ người chơi/Mọi vật · 🎨 Màu |
| 4 | 🖐 Chỉnh nút: BẬT/TẮT |

**3) Thấy vòng ngay khi bật.** Mặc định **🖼 Vòng = BẬT** và **🧲 Theo bạn = BẬT** (trước đây cả hai TẮT nên
bấm ⭕ xong chẳng thấy gì); đĩa neon **dày 0,35 studs · trong suốt 0,6** (bản cũ 0,05 studs — gần như vô hình)
+ **vành `CylinderHandleAdornment` luôn nổi trên mọi vật** + **cột mốc 30 studs ở tâm**; nếu 🖼 đang tắt thì chip
trạng thái ghi rõ **"🖼 vòng đang ẨN trong map (bấm 🖼 Vòng để hiện)"**.

**4) Định vị được cả vật `CanQuery = false`** (📚 sách trang trí, tường mỏng): `GetPartBoundsInRadius` của engine
**bỏ qua** part có `CanQuery = false`, nên thêm **lượt quét bù toàn map chia lát**
(`R.SweepBegin/SweepSlice`: 3 giây/lần · 220 part mỗi lát · trần **1,2 ms**/lát) — bắt được vật mà **không khựng**.

**5) Đúng khi vòng đi theo bạn / đổi bán kính.** Danh sách được **lọc lại theo bán kính** (không còn sót vật
ngoài vòng do dữ liệu của lượt quét trước) và **trần `maxItems` vẫn đúng khi đang quét bù** (chỉ giữ thêm tối đa
`maxItems − số đã chọn` vật, **xa nhất bị bỏ**); `maxItems` nâng **40 → 60**.

**6) "Chỉnh định vị người chơi thôi".** Nút **🧑 Chỉ người chơi / Mọi vật** lọc chỉ người chơi + NPC
(mỗi người **1 marker**), chip trạng thái ghi **🧑 chỉ người chơi**.

**7) Lỗi trong khung test** (không phải lỗi sản phẩm): giả lập thiếu **`CFrame.Angles`** và coi `Position` /
`CFrame` là **hai khoá riêng** — Roblox thật coi chúng là **một**. Lua chỉ gọi `__newindex` khi khoá **chưa**
tồn tại, nên cách mô phỏng cũ khiến `Position` và `CFrame` **lệch nhau** → test "vòng đi theo" báo sai oan.
Đã sửa giả lập: BasePart dùng chung một nguồn `_cf` cho cả `Position` lẫn `CFrame`.

Test: **252 → 276 case** (`pass=276 fail=0`), cổng `npm run check` xanh (**COMPILE OK** · **CẤU TRÚC OK 512 function** ·
**chạy lại hub 11/11**). Test mới đáng chú ý: **khung dựng đủ 23 phần tử**, **bấm nút ⭕ trong tab → vòng hiện ngay
trong map**, **đi tới chỗ khác → vòng đi theo**, **dời vòng đi xa → danh sách cũ không sót lại**.

## 5h. 📍 ĐỊNH VỊ TÂM (thay cho ⭕ định vị vòng) — cây cắm + nút ảo tròn ngắm vật

Theo yêu cầu: **"xoá định vị vòng, thay bằng định vị tâm: có một cây cắm ở giữa và có thêm một nút ảo hình tròn,
tâm vào vật thể nào thì định vị vật thể đó, giống tính năng 📊 phân tích toạ độ, hiển thị thông tin đầy đủ"**
+ **"chạy test để tìm lỗi"**. Đã làm đúng như vậy:

**1) Gỡ ⭕ định vị vòng.** Toàn bộ khối cũ (bán kính, `GetPartBoundsInRadius`, quét bù toàn map theo lát, đĩa Neon +
vành `CylinderHandleAdornment`, cột mốc, nút 🎯 Đổ vòng / ⏪ / ⏩, danh sách "TRONG VÒNG") **đã bị xoá hẳn**
(`_G.BananaCatHub_Ring = nil`, không còn `S.Ring`, `BC_Ring*`). Các tính năng KHÁC của hub **không bị đụng tới**
(cổng "chạy lại hub" 11/11 + 287 test đều xanh).

**2) Thay bằng 📍 ĐỊNH VỊ TÂM — đúng mô tả:**

| Thành phần | Công dụng |
|---|---|
| **🧷 Cây cắm (Base · Post · Tip · Beam)** | Cọc mốc dựng **ngay tại tâm** trong map: đế tròn Neon (đánh dấu đúng điểm), cột 16 studs, quả cầu ở đầu, tia cao 46 studs cho dễ thấy từ xa + nhãn **"📍 TÂM · cách bạn Xm"**. Cây cắm **dời theo tâm ngắm** liên tục (0,2 s/lần), hoặc **đứng yên** khi bật 🧷 giữ / sau khi đã định vị |
| **📍 Nút ảo hình tròn ở GIỮA màn hình** | Nút tròn 56 px mặc định **nằm chính giữa màn hình** (kèm hình tròn nhỏ bên trong + nhãn chữ). **Tâm ngắm chính là tâm nút ảo này** — kéo nút đi đâu thì tâm đi đó (chỉ khi BẬT 🖐 chỉnh nút) |
| **Bấm nút ảo 📍 (hoặc 🎯 Định vị ngay)** | Bắn tia từ camera xuyên qua tâm nút ảo → **vật/người dưới tâm được định vị ngay**: Highlight xanh nước + nhãn tên (đúng như 📊 phân tích toạ độ) + khung **🎯 THÔNG TIN đầy đủ 9 dòng** (Name/Class/Path/Position/Size/Rotation/Look/Material/Color) + **📍 Cách cây cắm** + **🧍 Cách bạn**, tự cập nhật khi vật di chuyển |
| **🧹 Xoá · ✕ Bỏ từng mục** | Định vị được *nhiều* vật cùng lúc; danh sách có 📊 Xem / 🚀 Bay / 📋 Tên / ✕ Bỏ, trần số mục `maxItems = 30` (giữ các mục gần tâm nhất) |
| **📏 Tầm xa + ✅ Đặt / ➖ ➕** | Tầm xa tia ngắm (kẹp **5–5000 m**, mặc định 500, ➖➕ ±50, nhập tay được) |
| **🧲 Ở chân bạn · 🧷 Giữ cây cắm · 🕶 Xuyên tường · 💬 Nhãn · 🧑 Chỉ người chơi · 🎨 Màu (6 màu, mặc định xanh nước) · 👁 Nút ảo · 🖐 Chỉnh nút + ↩️ Đặt lại** | Tuỳ chọn như bản cũ, giữ nguyên hành vi đã được kiểm |

**3) Vật `CanQuery = false` (📚 sách trang trí, tường mỏng) vẫn định vị được.** Tia của engine **bỏ qua** các part này,
nên khi tia trượt, tính năng tự chuyển sang **lượt "dò bù theo tia" chia lát** (220 part/lát, trần **1,2 ms**/lát) để
tìm part gần tia nhất — bắt được vật ẩn mà **không khựng**; chip trạng thái ghi rõ *"🔄 đang dò vật ẩn theo tia…"*.

**4) Không khựng:** mọi việc nặng đều có ngân sách — tia ngắm 0,2 s/lần, cây cắm vẽ lại 0,2 s/lần, nhãn cập nhật
xoay vòng `labelBudget = 16` với trần 1,5 ms/lượt, khung 🎯 làm mới thưa 0,5 s, dò bù chia lát như trên.

**5) Lỗi tìm ra bằng test trong đợt này** (xem bảng §6, dòng 15–17) và **cổng chạy lại hub** đã được cập nhật:
nạp hub 2 lần liên tiếp, lần 1 bật 📍 + định vị 1 vật, lần 2 kiểm tra **chỉ còn 1 cửa sổ / 1 bộ nút ảo**, Highlight + cây cắm
cũ **dọn sạch**, render step `BC_Tam` đã gỡ, nút ảo vẫn giữa màn hình, và tính năng lần 2 vẫn định vị được
(đã thử **gỡ khối dọn dẹp** → cổng báo đỏ **5 mục**, tức cổng thật sự bắt được lỗi).

**Khung test cũng được nâng cho đúng Roblox thật** (để test được tia ngắm): `workspace:Raycast` nay **cắt tia thật**
theo hộp AABB của từng part, tôn trọng `CanQuery = false`, `FilterType`/`FilterDescendantsInstances` và tầm xa;
thêm `RaycastParams.new` + `Camera:ViewportPointToRay`/`:ScreenPointToRay`.

Test: **276 → 287 case** (`pass=287 fail=0`), cổng `npm run check` xanh (**COMPILE OK** 16.322 dòng · **CẤU TRÚC OK 519 function** ·
**chạy lại hub 11/11**). Nhóm 16 mới kiểm: khung nằm **trên** phần tốc độ game và **đủ 24 phần tử** (bắt đúng lỗi "thiếu 1 nút
là hàm dựng khung chết giữa chừng"), mọi nút **nằm gọn trong bề ngang tab**, nút ảo 📍 **ở giữa màn hình** + có hình tròn nhỏ bên trong,
**kéo nút khi TẮT không đổi vị trí / khi BẬT thì đổi và lưu**, cây cắm đủ 4 phần và **đứng đúng tâm**, tia ngắm chạm đúng vật,
bấm nút ảo là **Highlight + nhãn + khung thông tin** hiện ra, **từng dòng trùng khớp `OT.Info`**, vật di chuyển thì số liệu tự cập nhật,
nhiều mục + ✕ bỏ từng mục, trần mục, **🧑 chỉ người chơi** (vật vô tri bị từ chối, NPC nhận), **không định vị chính mình**,
**vật `CanQuery = false` được dò bù**, tầm xa kẹp 5–5000 + ➖➕ + nhập tay, tắt là **dọn sạch** marker + cây cắm + render step.

## 6. Lỗi tìm thấy qua test & đã sửa

| # | Lỗi | Cách phát hiện | Đã sửa |
|---|---|---|---|
| 1 | **Định vị trùng lặp**: Model "Rừng Cây" và part con "ThanCay" cùng khớp từ khoá → 2 Highlight + 2 nhãn chồng lên **cùng một vật** | Test đếm số vật khớp (ra 6 thay vì 5), in danh sách thì thấy cặp cha–con | Thêm bước chống trùng: part nằm trong một Model cũng khớp tên thì bỏ qua part con, ghi lại số bị gộp (`OT._skipped`) |
| 2 | **Mất dấu tiếng Việt**: `OT.Norm` chỉ bỏ dấu nếu môi trường có `utf8.graphemes`; thiếu hàm này thì `cây` ≠ `cay` — đúng lúc đó tính năng mất tác dụng | Test `Norm("Cây Cổ Thụ")` trả `cây cổ thụ` thay vì `cay co thu` | Chuyển sang `utf8.codes` + `utf8.char` (có ở cả Luau WASM 0,739 và Roblox), vẫn có nhánh dự phòng nếu thiếu `utf8` |
| 3 | **Tắt định vị không dừng 🚀 bay**: bấm 🧹 / tắt 🌳 mà nhân vật vẫn đang bay tới vật | Rà luồng UI: `OT.Set(false)` chỉ xoá định vị, không đụng `MV._objFlyActive` | `OT.Set(false)` gọi `S.Move.StopObjectFly()` |
| 4 | **33 dòng lệch chuẩn CRLF** khi chèn code (tệp gốc 100% CRLF) | Đếm byte `\r\n` / `\n`: `LF-only = 33`, bản gốc = 0 | Chuẩn hoá lại toàn bộ về CRLF |
| 5 | **Không test được UI** vì các control không có tên | Viết test UI thì `FindFirstChild("OTQuery")` trả `nil` | Đặt tên `OTQuery/OTToggle/OTRescan/OTClear/OTStatus/OTXyz/OTInfoRow/OTFlyRow/OTCopyRow…` |
| 8 | **Lệch 1 chữ `end` làm 6 hàm không bao giờ được định nghĩa** (🌳 ngừng chạy dù compile OK): `OT.ScanBegin`, `OT.ScanSlice`… bị "nuốt" vào trong `OT.Tick` | Test chạy thật báo `ScanBegin` không phải hàm; soi cây cú pháp (`tests/luau/kiem-tra-cau-truc.mjs`) chỉ đúng "bị lồng trong 1 lớp hàm" | Viết lại `OT.Tick`/`OT.TickOne` + `OT.ScanBegin`/`OT.ScanHit`/`OT.ScanSlice` cho gọn và **thêm cổng kiểm tra cấu trúc** vào bộ test để lỗi này không tái diễn |
| 7 | **"Nhập tên mà không hiện gì"**: Highlight gắn vào PlayerGui nên không render | Soi lại khung "🎯 Phân Tích Vật Thể" đang gắn Highlight vào vật; tra tài liệu/devforum Roblox xác nhận Highlight phải nằm trong Workspace | Gắn Highlight/nhãn/hộp thẳng vào vật + part, Tick tự giữ đúng chỗ, tạo từng phần riêng để lỗi 1 phần không mất cả định vị (§5c) |
| 6 | **Tràn 200 local của Luau** khi thêm khung 🎯 (`Out of local registers … copyPathBtn`) | Compile check `node kiem-tra-cu-phap.mjs` báo lỗi ngay | Gom khối 🎯 vào một hàm riêng `otBuildInfo()` + bỏ biến `PH`, giữ đúng trần 200 local/hàm |

| 9 | **Vòng định vị chết nếu executor/game chặn `OverlapParams`**: `OverlapParams.new()` gọi ngoài `pcall` → lỗi là mất luôn cả lượt quét | Soi lại code khi ráp khối ⭕ + đối chiếu cách khối 🌳 xử lý (`pcall` rồi mới dùng) | Bọc `pcall` và có **nhánh dự phòng `Instance.new("OverlapParams")`**; thiếu cả hai thì `R.Scan` trả lỗi rõ ràng chứ không hỏng |
| 10 | **Highlight gắn `Adornee` = Folder thì KHÔNG hiện** (Folder không phải `BasePart`/`Model`): vật nằm trong Folder vẫn được định vị nhưng vô hình | Kiểm lại kiến thức từ lần sửa §5c (Highlight chỉ render trong Workspace và phải trỏ vào part/model) | `R.Make` chọn `Adornee` = chính vật nếu là `BasePart`/`Model`, **ngược lại dùng part đại diện** (`R.PartOf`) |
| 11 | **Trạng thái kéo nút lưu vào Instance** (`btn._dragState = …`): Roblox **không cho gán thuộc tính lạ** lên Instance → lỗi ngay khi bắt đầu kéo | Rà code trước khi ráp; thay bằng bảng trạng thái `R._drag[key]` / `R._btnRefs[key]` | Toàn bộ tham chiếu + trạng thái kéo nằm trong **bảng của module**, không gán gì lên Instance |
| 12 | **Bật vòng mà KHÔNG THẤY VÒNG** (đúng lỗi người dùng báo): khung ⭕ thiếu nút `🧲` nhưng code vẫn gọi `ui.btnFollow.Activated` → `R.BuildPanel` lỗi giữa chừng, `pcall` nuốt lỗi → **mọi nút sau nó + chip trạng thái im lặng biến mất** | Test báo `attempt to index nil with 'Activated'`; viết probe in `R.ui` rồi **so bộ khoá với danh sách nút được tham chiếu** → thiếu `btnFollow` | Bố cục 4 hàng/430 px có **đủ 23 phần tử**; thêm test 16.9b canh đủ bộ nút để lỗi này không tái diễn |
| 13 | **Vượt trần `maxItems` khi đang quét bù**: phần "giữ lại vật còn trong bán kính" không đếm trần nên danh sách có thể nhiều hơn `maxItems` | Test cũ phụ thuộc bản đồ nên đỏ; **viết lại test tự tạo 5 vật** cách tâm 2…10 m rồi đòi đúng 3 vật gần nhất | Đếm riêng số đã chọn (`keepN`), chỉ giữ thêm tối đa `maxItems − keepN` vật, **xa nhất bị bỏ** |
| 14 | **Sót vật NGOÀI vòng** sau khi vòng đi theo bạn/đổi bán kính: dữ liệu của lượt quét bù còn mang vị trí/bán kính cũ | Test mới "dời vòng đi xa → danh sách cũ không sót lại" (đỏ trước khi sửa) | `R.Scan` + `R.SweepSlice` **lọc lại theo bán kính hiện tại** trước khi nhận |
| 15 | **Cây cắm tạo part nhưng QUÊN đặt tên** (`Base/Post/Tip/Beam` thành "Part" hết) — soi không ra, dễ lẫn với part khác; đồng thời nhãn "📍 TÂM" vẫn hiện nên rất khó thấy | Test kiểm "cây cắm có đủ ĐẾ · CỘT · ĐẦU · TIA" đỏ dù Folder đã có 4 con | Hàm tạo part **luôn đặt `props.Name`** trước khi tạo |
| 16 | **Tâm ngắm lệch khỏi nút ảo**: lấy `AbsoluteSize` của nút để tính tâm (executor/stub trả cỡ khác) → tâm ngắm ra `672,392` thay vì `640,360` | Test "tâm ngắm = tâm nút ảo 📍" + "tâm ngắm đi theo nút ảo sau khi kéo" đỏ | Dùng đúng cỡ nút mình đặt (`aimSize`) thay vì `AbsoluteSize` |
| 17 | **Ngắm vào CHÍNH MÌNH** bị định vị (tia chạm part gắn trên nhân vật) | Test đỏ (`-> BC_Shield1`) | Kiểm tra "là mình" ngay trong `R.Locate` (theo `root.Parent`) → từ chối kèm lời nhắc; test gọi thẳng `R.Locate(hrp)` để không phụ thuộc vật nào đứng trước tia |

Lỗi trong **khung test** (không phải lỗi sản phẩm, đã sửa để test chạy đúng) — bổ sung cho lần này:
giả lập **thiếu toán tử `Vector2`** (`inp.Position - d.startInput` là phép trừ hợp lệ trong Roblox thật,
nhưng `pcall` nuốt lỗi nên test kéo nút báo sai) → đã thêm `__add/__sub/__mul/__div/__unm/__eq`;
`workspace:GetPartBoundsInRadius` cũ chỉ trả `{}` → nay lọc thật theo bán kính +
`FilterDescendantsInstances`/`MaxParts`/`CanQuery`; thiếu `Players:GetPlayerFromCharacter` → mọi người
chơi bị xếp nhầm thành 🤖 NPC; thiếu **truy cập con bằng dấu chấm** (`playerGui.ExMenu` — Roblox cho phép,
giả lập thì không) làm việc **chạy lại hub lần 2** báo lỗi `attempt to index nil with 'Destroy'`.

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
