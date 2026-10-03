// ============================================================================
// Nạp hub HAI LẦN liên tiếp để bắt lỗi "chạy lại script bị chồng chéo":
// ScreenGui/part/Highlight của lần trước phải được dọn sạch, render step cũ phải
// được gỡ, và tính năng 📍 định vị tâm của lần mới phải sống bình thường.
//     cd tests/luau && node chay-lai-hub.mjs
// ============================================================================
import { Lua } from '@luau-rs/luau';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const HUB_PATH = process.env.HUB ? path.resolve(process.env.HUB) : path.join(dir, '..', '..', 'script.js');
const stub = fs.readFileSync(path.join(dir, 'gia-lap-roblox.lua'), 'utf8');
const hub = fs.readFileSync(HUB_PATH, 'utf8').replace(/\r\n/g, '\n');

const lua = await Lua.create();
lua.execute(stub);
lua.execute(hub);      // lần 1
// bật 📍 + định vị 1 vật để chắc chắn lần chạy lại phải dọn cả marker + cây cắm
lua.execute(`
R1 = _G.BananaCatHub_Tam
local ok = pcall(function()
    local target = Instance.new("Part", workspace)
    target.Name = "Vật Chạy Lại"
    target.Size = Vector3.new(2, 2, 2)
    target.Anchored = true
    target.Position = Vector3.new(120, 5, 0)
    VatChayLai = target
    workspace.CurrentCamera._aimTarget = target.Position
    R1.SetRange(500)
    R1.Set(true)
    R1.hold = false
    R1.LocateAim()
end)
HL_TRUOC = 0
for _, d in ipairs(workspace:GetDescendants()) do if d.Name == "BC_TamHL" then HL_TRUOC = HL_TRUOC + 1 end end
PIN_TRUOC = 0
for _, d in ipairs(workspace:GetDescendants()) do if d.Name == "BC_TamPin" then PIN_TRUOC = PIN_TRUOC + 1 end end
OK1 = ok and HL_TRUOC > 0 and PIN_TRUOC > 0
`);
lua.execute(hub);      // lần 2 (đúng tình huống bấm chạy lại script)

const check = `
local pass, fail, msgs = 0, 0, {}
local function t(name, cond, extra)
    if cond then pass = pass + 1
    else fail = fail + 1; msgs[#msgs + 1] = "FAIL: " .. name .. (extra and (" -> " .. tostring(extra)) or "") end
end

local pg = game:GetService("Players").LocalPlayer.PlayerGui
local function countIn(root, name)
    local n = 0
    for _, d in ipairs(root:GetDescendants()) do if d.Name == name then n = n + 1 end end
    return n
end

t("lần 1: 📍 đang bật, có marker + cây cắm để dọn", OK1 == true,
    tostring(HL_TRUOC) .. " highlight / " .. tostring(PIN_TRUOC) .. " cây cắm")
t("chạy lại hub: chỉ còn ĐÚNG 1 ScreenGui nút ảo", countIn(pg, "BC_TamBtns") == 1, countIn(pg, "BC_TamBtns"))
t("chạy lại hub: chỉ còn ĐÚNG 1 cửa sổ hub (ExMenu)", countIn(pg, "ExMenu") == 1, countIn(pg, "ExMenu"))
t("chạy lại hub: marker Highlight của lần 1 đã bị dọn hết", countIn(workspace, "BC_TamHL") == 0, countIn(workspace, "BC_TamHL"))
t("chạy lại hub: không còn cây cắm cũ trong map", countIn(workspace, "BC_TamPin") == 0, countIn(workspace, "BC_TamPin"))
t("chạy lại hub: không còn nhãn BillboardGui của lần cũ",
    countIn(workspace, "BC_TamBB") == 0 and countIn(workspace, "BC_TamESP") == 0)
t("chạy lại hub: render step 'BC_Tam' của lần trước đã được gỡ",
    (_G.__renderSteps == nil) or (_G.__renderSteps["BC_Tam"] == nil))
t("chạy lại hub: bảng 📍 của lần 1 KHÔNG còn là bảng đang dùng", R1 ~= nil and R1 ~= _G.BananaCatHub_Tam)
t("chạy lại hub: nút ảo 📍 vẫn nằm GIỮA màn hình (không lệch sau khi nạp lại)", (function()
    local gui = pg:FindFirstChild("BC_TamBtns")
    local btn = gui and gui:FindFirstChild("BC_TamBtn_aim")
    if btn == nil then return false end
    local vp = workspace.CurrentCamera.ViewportSize
    local cx = btn.Position.X.Offset + btn.Size.X.Offset * 0.5
    local cy = btn.Position.Y.Offset + btn.Size.Y.Offset * 0.5
    return math.abs(cx - vp.X * 0.5) <= 2 and math.abs(cy - vp.Y * 0.5) <= 2
end)())
local R = _G.BananaCatHub_Tam
t("chạy lại hub: tính năng 📍 của lần 2 sống bình thường",
    type(R) == "table" and R.on == false and R.ui ~= nil and R.ui.panel ~= nil and R.buildError == nil)
t("chạy lại hub: bấm 📍 định vị lần 2 vẫn chạy được", (function()
    local okSet = R.Set(true)
    local target = workspace:FindFirstChild("Vật Chạy Lại")
    if target == nil then return false end
    workspace.CurrentCamera._aimTarget = target.Position
    R.hold = false
    local ok = R.LocateAim()
    local alive = ok and R.items[target] ~= nil
    R.Set(false)
    return alive == true
end)())
print(string.format("TESTS: pass=%d fail=%d", pass, fail))
for _, m in ipairs(msgs) do print(m) end
`;

let out = '';
try {
  out = lua.execute(check);
} catch (e) {
  console.log('LỖI khi kiểm tra chạy lại:', String(e).slice(0, 1200));
  process.exitCode = 1;
}
const prints = lua.execute("return table.concat(__prints, '\\n')");
const text = Array.isArray(prints) ? String(prints[0] ?? '') : String(prints ?? '');
for (const line of text.split('\n')) if (/TESTS:|^FAIL:/.test(line)) console.log(line);
const m = text.match(/TESTS: pass=(\d+) fail=(\d+)/);
if (!m || Number(m[2]) > 0) process.exitCode = 1;
