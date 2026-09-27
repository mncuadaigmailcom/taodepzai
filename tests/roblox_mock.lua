-- Môi trường Roblox/executor giả lập tối thiểu để test key-system.lua bằng Lua 5.1.
-- Trả về hàm tao_moi_truong(tuy_chon) -> (env, log)

local function Signal()
    local s = { _ham = {} }
    function s:Connect(f)
        table.insert(self._ham, f)
        local conn = { Connected = true }
        function conn.Disconnect() conn.Connected = false end
        return conn
    end
    function s:Fire(...)
        for _, f in ipairs(self._ham) do f(...) end
    end
    return s
end

local function Mau(r, g, b) return { R = r, G = g, B = b, _kieu = "Color3" } end

local UDim2Meta = {}
UDim2Meta.__add = function(a, b)
    return setmetatable({ XS = a.XS + b.XS, XO = a.XO + b.XO, YS = a.YS + b.YS, YO = a.YO + b.YO }, UDim2Meta)
end
UDim2Meta.__eq = function(a, b)
    return a.XS == b.XS and a.XO == b.XO and a.YS == b.YS and a.YO == b.YO
end

local function EnumGia(ten)
    return setmetatable({}, {
        __index = function(t, k)
            local v = EnumGia(ten .. "." .. k)
            rawset(t, k, v)
            return v
        end,
        __tostring = function() return ten end,
    })
end

local SU_KIEN = {
    TextButton = { "MouseButton1Click" },
    TextBox = { "FocusLost", "Focused" },
}

return function(tuy_chon)
    tuy_chon = tuy_chon or {}
    local log = { httpget = {}, warn = {}, thong_bao = {}, clipboard = {}, spawn = 0, tao = {}, hang_doi = {} }
    function log.chay_hang_doi()
        while #log.hang_doi > 0 do table.remove(log.hang_doi, 1)() end
    end

    local Instance = {}
    local function TaoInstance(cls)
        local obj = {
            ClassName = cls, Name = cls, _con = {}, _destroyed = false,
            Parent = nil,
        }
        for _, ten in ipairs(SU_KIEN[cls] or {}) do obj[ten] = Signal() end
        function obj:FindFirstChild(ten)
            for _, c in ipairs(self._con) do
                if c.Name == ten and not c._destroyed and c.Parent == self then return c end
            end
            return nil
        end
        function obj:WaitForChild(ten)
            local c = self:FindFirstChild(ten)
            assert(c, "WaitForChild vô hạn: " .. ten)
            return c
        end
        function obj:GetChildren()
            local out = {}
            for _, c in ipairs(self._con) do
                if not c._destroyed and c.Parent == self then table.insert(out, c) end
            end
            return out
        end
        function obj:FindFirstChildDeep(ten)
            for _, c in ipairs(self:GetChildren()) do
                if c.Name == ten then return c end
                local sau = c:FindFirstChildDeep(ten)
                if sau then return sau end
            end
        end
        function obj:Destroy()
            self._destroyed = true
            self.Parent = nil
            for _, c in ipairs(self._con) do c:Destroy() end
        end
        -- Gán Parent -> tự thêm vào danh sách con
        local that = obj
        local proxy = setmetatable({}, {
            __index = that,
            __newindex = function(_, k, v)
                if k == "Parent" then
                    if that._destroyed and v ~= nil then error("Không thể đặt Parent cho đối tượng đã Destroy") end
                    rawset(that, "Parent", v)
                    if v then table.insert(v._raw._con, that._proxy) end
                    return
                end
                rawset(that, k, v)
            end,
        })
        obj._proxy = proxy
        obj._raw = obj
        return proxy
    end
    Instance.new = function(cls)
        local o = TaoInstance(cls)
        table.insert(log.tao, o)
        return o
    end

    local playerGui = TaoInstance("PlayerGui"); playerGui.Name = "PlayerGui"
    local localPlayer = TaoInstance("Player")
    localPlayer.Name = tuy_chon.ten or "Tester"
    localPlayer.DisplayName = tuy_chon.ten_hien_thi or localPlayer.Name
    playerGui.Parent = localPlayer
    local coreGui = TaoInstance("CoreGui"); coreGui.Name = "CoreGui"
    local hui = TaoInstance("Folder"); hui.Name = "HiddenUI"

    local dich_vu = {
        Players = { LocalPlayer = localPlayer },
        TweenService = {
            Create = function(_, obj, info, props)
                local tw = { Completed = Signal() }
                function tw:Play()
                    for k, v in pairs(props) do obj[k] = v end
                    self.Completed:Fire()
                end
                return tw
            end,
        },
        CoreGui = coreGui,
        StarterGui = {
            SetCore = function(_, ten, bang) table.insert(log.thong_bao, { ten, bang }) end,
        },
    }

    local game = {}
    function game:GetService(ten)
        local s = dich_vu[ten]
        if not s then error("Dịch vụ chưa mock: " .. ten) end
        return s
    end
    function game:HttpGet(url)
        table.insert(log.httpget, url)
        if tuy_chon.http_loi then error(tuy_chon.http_loi) end
        if tuy_chon.nguon ~= nil then return tuy_chon.nguon end
        return "_G.DA_CHAY_SCRIPT_CHINH = (_G.DA_CHAY_SCRIPT_CHINH or 0) + 1"
    end

    local task = {
        spawn = function(f, ...)
            log.spawn = log.spawn + 1
            if tuy_chon.spawn_tre then
                local args = { ... }
                table.insert(log.hang_doi, function() f(unpack(args)) end)
            else
                f(...)
            end
        end,
        wait = function() return 0 end,
        delay = function(_, f, ...) f(...) end,
    }

    local env = {
        game = game, workspace = {}, Instance = Instance, task = task,
        math = math, tonumber = tonumber,
        os = {
            time = function() return tuy_chon.gio_may or os.time() end,
            date = os.date,
        },
        Color3 = { fromRGB = Mau, new = Mau },
        UDim = { new = function(s, o) return { S = s, O = o } end },
        UDim2 = { new = function(xs, xo, ys, yo)
            return setmetatable({ XS = xs, XO = xo, YS = ys, YO = yo }, UDim2Meta)
        end },
        Vector2 = { new = function(x, y) return { X = x, Y = y } end },
        TweenInfo = { new = function(...) return { ... } end },
        Enum = EnumGia("Enum"),
        warn = function(...) table.insert(log.warn, table.concat({ ... }, " ")) end,
        print = function() end,
        loadstring = loadstring,
        pcall = pcall, type = type, tostring = tostring, pairs = pairs, ipairs = ipairs,
        string = string, table = table, error = error, select = select, setmetatable = setmetatable,
        _G = {},
    }
    if not tuy_chon.khong_gethui then env.gethui = function() return hui end end
    if not tuy_chon.khong_clipboard then
        env.setclipboard = function(s) table.insert(log.clipboard, s) end
    end
    if tuy_chon.khong_loadstring then env.loadstring = nil end
    if tuy_chon.bit32 then env.bit32 = tuy_chon.bit32 end
    if tuy_chon.gio_may_chu then
        env.workspace.GetServerTimeNow = function() return tuy_chon.gio_may_chu end
    end
    -- loadstring của script chính chạy trong cùng env (như executor)
    if env.loadstring then
        env.loadstring = function(src)
            local f, loi = loadstring(src)
            if f then setfenv(f, env) end
            return f, loi
        end
    end

    log.hui, log.coreGui, log.playerGui = hui, coreGui, playerGui
    return env, log
end
