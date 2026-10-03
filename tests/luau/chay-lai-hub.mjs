// ============================================================================
// Nạp hub HAI LẦN liên tiếp để bắt lỗi "chạy lại script bị chồng chéo":
// ScreenGui/part/Highlight của lần trước phải được dọn sạch, render step cũ phải
// được gỡ, và tính năng ⭕ định vị vòng của lần mới phải sống bình thường.
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
// bật vòng + quét để chắc chắn lần chạy lại phải dọn cả marker đang hiện
lua.execute(`
R1 = _G.BananaCatHub_Ring
local ok = pcall(function()
    R1.SetRadius(200); R1.Place(); R1.Scan(); R1.DrainPending(1e9); R1.RefreshVis()
end)
HL_TRUOC = 0
for _, d in ipairs(workspace:GetDescendants()) do if d.Name == "BC_OT_RINGHL" then HL_TRUOC = HL_TRUOC + 1 end end
VIS_TRUOC = 0
for _, d in ipairs(workspace:GetDescendants()) do if d.Name == "BC_RingVis" then VIS_TRUOC = VIS_TRUOC + 1 end end
OK1 = ok and HL_TRUOC > 0 and VIS_TRUOC > 0
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

t("lần 1: vòng đang bật, có marker + vòng nhìn thấy để dọn", OK1 == true, tostring(HL_TRUOC) .. " highlight / " .. tostring(VIS_TRUOC) .. " vòng")
t("chạy lại hub: chỉ còn ĐÚNG 1 ScreenGui 3 nút ảo", countIn(pg, "BC_RingBtns") == 1, countIn(pg, "BC_RingBtns"))
t("chạy lại hub: chỉ còn ĐÚNG 1 cửa sổ hub (ExMenu)", countIn(pg, "ExMenu") == 1, countIn(pg, "ExMenu"))
t("chạy lại hub: marker Highlight của vòng lần 1 đã bị dọn hết", countIn(workspace, "BC_OT_RINGHL") == 0, countIn(workspace, "BC_OT_RINGHL"))
t("chạy lại hub: không còn vòng nhìn thấy cũ trong map", countIn(workspace, "BC_RingVis") == 0, countIn(workspace, "BC_RingVis"))
t("chạy lại hub: không còn Highlight của vòng cũ", countIn(workspace, "BC_OT_RINGHL") == 0, countIn(workspace, "BC_OT_RINGHL"))
t("chạy lại hub: không còn nhãn BillboardGui của vòng cũ", countIn(workspace, "BC_OT_RINGBB") == 0, countIn(workspace, "BC_OT_RINGBB"))
t("chạy lại hub: render step 'BC_Ring' của lần trước đã được gỡ",
    (_G.__renderSteps == nil) or (_G.__renderSteps["BC_Ring"] == nil))
t("chạy lại hub: bảng vòng của lần 1 KHÔNG còn là bảng đang dùng", R1 ~= nil and R1 ~= _G.BananaCatHub_Ring)
local R = _G.BananaCatHub_Ring
t("chạy lại hub: tính năng ⭕ của lần 2 sống bình thường", type(R) == "table" and R.on == false and R.ui ~= nil and R.ui.panel ~= nil)
t("chạy lại hub: bấm 🎯 đổ vòng lần 2 vẫn chạy", (function()
    local ok = R.Place()
    local alive = ok and R.on == true and R.center ~= nil
    R.Set(false)
    return alive
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
