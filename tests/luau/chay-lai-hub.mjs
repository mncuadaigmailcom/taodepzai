// ============================================================================
// Nạp hub HAI LẦN liên tiếp để bắt lỗi "chạy lại script bị chồng chéo":
// cửa sổ hub / GUI / render step của lần trước phải được dọn hoặc tái dùng,
// không được nhân đôi, và hub của lần 2 phải sống bình thường.
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
// đo trạng thái sau lần 1 (đúng cách người dùng đang dùng hub rồi bấm chạy lại script)
lua.execute(`
local pg = game:GetService("Players").LocalPlayer.PlayerGui
local function dem(root, name)
    local n = 0
    for _, d in ipairs(root:GetDescendants()) do if d.Name == name then n = n + 1 end end
    return n
end
local function demTab()
    local n = 0
    for _, d in ipairs(pg:GetDescendants()) do
        if d:IsA("TextButton") and d.Size and d.Size.X.Scale == 1 and d.Size.X.Offset == -8 and d.Size.Y.Offset == 38 then
            n = n + 1
        end
    end
    return n
end
PG_TRUOC  = #pg:GetChildren()
EX_TRUOC  = dem(pg, "ExMenu")
TAB_TRUOC = demTab()
STEP_TRUOC = 0
if _G.__renderSteps then for _ in pairs(_G.__renderSteps) do STEP_TRUOC = STEP_TRUOC + 1 end end
MV1 = _G.BananaCatHub_MV
OK1 = (EX_TRUOC == 1 and TAB_TRUOC == 7)
`);
lua.execute(hub);      // lần 2 (đúng tình huống bấm chạy lại script)

const check = `
local pass, fail, msgs = 0, 0, {}
local function t(name, cond, extra)
    if cond then pass = pass + 1
    else fail = fail + 1; msgs[#msgs + 1] = "FAIL: " .. name .. (extra and (" -> " .. tostring(extra)) or "") end
end

local pg = game:GetService("Players").LocalPlayer.PlayerGui
local function dem(root, name)
    local n = 0
    for _, d in ipairs(root:GetDescendants()) do if d.Name == name then n = n + 1 end end
    return n
end
local function demTab()
    local n = 0
    for _, d in ipairs(pg:GetDescendants()) do
        if d:IsA("TextButton") and d.Size and d.Size.X.Scale == 1 and d.Size.X.Offset == -8 and d.Size.Y.Offset == 38 then
            n = n + 1
        end
    end
    return n
end

t("lần 1: hub dựng xong (1 cửa sổ + 7 tab)", OK1 == true,
    tostring(EX_TRUOC) .. " cửa sổ / " .. tostring(TAB_TRUOC) .. " tab")
t("chạy lại hub: chỉ còn ĐÚNG 1 cửa sổ hub (ExMenu)", dem(pg, "ExMenu") == 1, dem(pg, "ExMenu"))
t("chạy lại hub: GUI của hub KHÔNG bị nhân đôi", #pg:GetChildren() == PG_TRUOC,
    #pg:GetChildren() .. " vs " .. tostring(PG_TRUOC))
t("chạy lại hub: vẫn đủ 7 tab (không nhân đôi tab)", demTab() == 7, demTab())
t("chạy lại hub: render step không bị rò (số step không tăng)", (function()
    local n = 0
    if _G.__renderSteps then for _ in pairs(_G.__renderSteps) do n = n + 1 end end
    return n == STEP_TRUOC, n .. " vs " .. tostring(STEP_TRUOC)
end)())
t("chạy lại hub: bảng MV của lần 1 KHÔNG còn là bảng đang dùng", MV1 ~= nil and MV1 ~= _G.BananaCatHub_MV)
t("chạy lại hub: hub của lần 2 sống bình thường (có API + MV)", type(_G.BananaCatHubAPI) == "table" and type(_G.BananaCatHub_MV) == "table")
t("chạy lại hub: KHÔNG còn dấu vết ⭕ định vị vòng", dem(pg, "BC_RingBtns") == 0 and dem(workspace, "BC_RingVis") == 0
    and (_G.__renderSteps == nil or _G.__renderSteps["BC_Ring"] == nil))
t("chạy lại hub: KHÔNG còn dấu vết 📍 định vị tâm", dem(pg, "BC_TamBtns") == 0 and dem(workspace, "BC_TamPin") == 0
    and (_G.__renderSteps == nil or _G.__renderSteps["BC_Tam"] == nil))
t("chạy lại hub: tab 🛠 Hỗ Trợ vẫn còn phần Đo tốc độ game", (function()
    for _, d in ipairs(pg:GetDescendants()) do
        if d:IsA("TextLabel") and tostring(d.Text):find("Định vị tốc độ game", 1, true) ~= nil then return true end
    end
    return false
end)())
print(string.format("TESTS: pass=%d fail=%d", pass, fail))
for _, m in ipairs(msgs) do print(m) end
`;

try {
  lua.execute(check);
} catch (e) {
  console.log('LỖI khi kiểm tra chạy lại:', String(e).slice(0, 1200));
  process.exitCode = 1;
}
const prints = lua.execute("return table.concat(__prints, '\\n')");
const text = Array.isArray(prints) ? String(prints[0] ?? '') : String(prints ?? '');
for (const line of text.split('\n')) if (/TESTS:|^FAIL:/.test(line)) console.log(line);
const m = text.match(/TESTS: pass=(\d+) fail=(\d+)/);
if (!m || Number(m[2]) > 0) process.exitCode = 1;
