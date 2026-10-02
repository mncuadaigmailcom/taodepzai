-- Code Đã Lưu — script GUI độc lập cho taodepzai.
-- Dán TOÀN BỘ file này vào Tạo Tính Năng rồi bấm Chạy Script.
-- Không tải module của hub, không tự chạy các code trong danh sách.

-- BEGIN SAVED_CODE_FACTORY
local function CreateSavedCode(options)
    options = options or {}
    local HttpService = game:GetService("HttpService")
    local function trim(value)
        return type(value) == "string" and (value:match("^%s*(.-)%s*$") or "") or ""
    end
    local function realApi(name)
        local envs = {}
        if type(getgenv) == "function" then
            local ok, env = pcall(getgenv)
            if ok and type(env) == "table" then envs[#envs + 1] = env end
        end
        if type(getfenv) == "function" then
            local ok, env = pcall(getfenv, 0)
            if ok and type(env) == "table" then envs[#envs + 1] = env end
        end
        envs[#envs + 1] = _G
        local shims = rawget(_G, "BananaCatHub_ExecutorShims")
        for _, env in ipairs(envs) do
            local ok, fn = pcall(function() return env[name] end)
            if ok and type(fn) == "function" and not (type(shims) == "table" and shims[name] == fn) then return fn end
        end
    end
    local function validate(source)
        source = trim(source):gsub("^\239\187\191", "")
        if source == "" then return nil, "Code/link đang trống" end
        local quoted = source:match('^"(https?://.-)"$') or source:match("^'(https?://.-)'$")
        if quoted then source = quoted end
        if source:match("^https?://") then
            local host = source:match("^https?://([^/?#]+)")
            if #source > 4096 or source:find('[%s%c"\\]') or not host or host:find("@", 1, true) then
                return nil, "Link raw không hợp lệ"
            end
        elseif source:match("^[%a][%w+.-]*://") then return nil, "Chỉ hỗ trợ HTTP/HTTPS" end
        return source
    end
    local function copyEntries(entries)
        local out = {}
        for _, entry in ipairs(type(entries) == "table" and entries or {}) do
            if type(entry) == "table" then
                local source = validate(entry.code or entry.url)
                if source then
                    out[#out + 1] = {name = trim(entry.name) ~= "" and trim(entry.name) or ("Script " .. (#out + 1)),
                        code = source, expanded = entry.expanded == true}
                end
            end
            if #out >= 1000 then break end
        end
        return out
    end
    local ownsAdapter = options.adapter == nil
    local adapter = options.adapter
    if ownsAdapter then
        local entries, states, listeners = {}, {}, {}
        local store = {file = "taodepzai_saved_code.json", mode = "memory", error = nil, dirty = false}
        local pendingSave, active, closed = nil, nil, false
        local function notify(entry, message, bad)
            for fn in pairs(listeners) do pcall(fn, entry, message, bad) end
        end
        local function cache()
            pcall(function() _G.TDZSavedCodeData = {version = 1, scripts = copyEntries(entries)} end)
        end
        local function save()
            cache()
            local write, read = realApi("writefile"), realApi("readfile")
            if not write or not read then
                store.mode, store.error = "memory", "Executor không có API lưu file thật"
                return false
            end
            local ok, json = pcall(HttpService.JSONEncode, HttpService, {version = 1, scripts = copyEntries(entries)})
            if ok then ok, json = pcall(write, store.file, json) end
            if not ok then store.mode, store.error = "memory", tostring(json); return false end
            store.mode, store.error, store.dirty = "file", nil, false
            return true
        end
        local function saveSoon()
            store.dirty = true
            cache()
            if pendingSave then return end
            pendingSave = task.delay(0.3, function()
                pendingSave = nil
                if closed then return end
                save()
                notify(nil)
            end)
        end
        local function readData(file)
            local read, exists = realApi("readfile"), realApi("isfile")
            if not read then return nil, "missing" end
            if exists then
                local ok, has = pcall(exists, file)
                if ok and not has then return nil, "missing" end
            end
            local ok, text = pcall(read, file)
            if not ok then return nil, exists and "unreadable" or "missing" end
            local decoded, data = pcall(HttpService.JSONDecode, HttpService, text)
            if not decoded or type(data) ~= "table" or type(data.scripts) ~= "table" then return nil, "corrupt" end
            return data
        end
        local function load()
            local data, why = readData(store.file)
            if data then
                entries, store.mode, store.error = copyEntries(data.scripts), "file", nil
            elseif why == "corrupt" or why == "unreadable" then
                store.mode, store.error = "memory", "File lưu bị hỏng; giữ dữ liệu hiện tại, không ghi đè tự động"
                local memory = rawget(_G, "TDZSavedCodeData")
                if #entries == 0 and type(memory) == "table" then entries = copyEntries(memory.scripts) end
            else
                local memory = rawget(_G, "TDZSavedCodeData")
                local legacy = readData("banana_cat_saved.json")
                entries = copyEntries(type(memory) == "table" and memory.scripts or (legacy and legacy.scripts))
                store.mode, store.error = "memory", nil
                -- Chỉ đọc dữ liệu cũ. Không bao giờ ghi vào file waypoint/settings của hub.
                if legacy and type(memory) ~= "table" then saveSoon() end
            end
            cache()
        end
        local function stop(entry)
            local state = states[entry]
            if not state then return end
            state.token = nil
            local thread = state.thread
            state.thread, state.running, state.hasRun, state.state = nil, false, false, "idle"
            if active == entry then active = nil end
            if type(thread) == "thread" and thread ~= coroutine.running() then pcall(task.cancel, thread) end
            notify(entry)
        end
        adapter = {protocol = 1, mode = "standalone"}
        adapter.list = function() return entries end
        adapter.subscribe = function(fn) listeners[fn] = true; return function() listeners[fn] = nil end end
        adapter.state = function(entry) return states[entry] end
        adapter.validate = validate
        adapter.add = function(name, code)
            local source, err = validate(code)
            if not source then return nil, err end
            if #entries >= 1000 then return nil, "Danh sách đã đạt 1000 script" end
            local base, unique, n = trim(name), nil, 2
            if base == "" then base = "Script" end
            local used = {}
            for _, entry in ipairs(entries) do used[entry.name] = true end
            unique = base
            while used[unique] do unique = base .. " (" .. n .. ")"; n += 1 end
            local entry = {name = unique, code = source, expanded = false}
            entries[#entries + 1] = entry
            saveSoon(); notify(nil)
            return entry
        end
        adapter.update = function(entry, code)
            local source, err = validate(code)
            if not source then return false, err end
            if states[entry] and states[entry].running then return false, "Chờ code chạy xong trước khi sửa" end
            entry.code = source
            states[entry] = nil
            saveSoon(); notify(nil)
            return true
        end
        adapter.remove = function(entry)
            stop(entry)
            for i, item in ipairs(entries) do if item == entry then table.remove(entries, i); break end end
            states[entry] = nil
            saveSoon(); notify(nil)
        end
        adapter.stop = stop
        adapter.run = function(entry)
            if closed then return false, "Cửa sổ đã đóng" end
            if states[entry] and states[entry].running then return true end
            if active then return false, "Một code khác đang chạy; hãy dừng hoặc chờ xong" end
            local source, err = validate(entry.code)
            if not source then return false, err end
            local token, state = {}, {running = true, hasRun = false, state = "running"}
            state.token, states[entry], active = token, state, entry
            notify(entry)
            local spawned, thread = pcall(task.spawn, function()
                local ok, why = pcall(function()
                    local compiler = realApi("loadstring")
                    if not compiler then error("Executor không hỗ trợ loadstring") end
                    local runnable = source
                    if runnable:match("^https?://") then runnable = game:HttpGet(runnable) end
                    if type(runnable) ~= "string" then error("Link không trả về mã Luau") end
                    local fn, compileError = compiler(runnable)
                    if not fn then error(tostring(compileError)) end
                    fn()
                end)
                if state.token ~= token or closed then return end
                state.thread, state.running, state.hasRun = nil, false, ok
                state.state, state.error = ok and "ready" or "error", not ok and tostring(why) or nil
                if active == entry then active = nil end
                notify(entry, ok and ("✅ Đã chạy " .. entry.name) or ("❌ " .. tostring(why)), not ok)
            end)
            if not spawned then
                state.running, state.state, state.error, active = false, "error", tostring(thread), nil
                notify(entry)
                return false, tostring(thread)
            end
            if state.token == token and state.running then state.thread = thread end
            return true
        end
        adapter.save = save
        adapter.saveSoon = saveSoon
        adapter.reload = function()
            for entry in pairs(states) do stop(entry) end
            if pendingSave then pcall(task.cancel, pendingSave); pendingSave = nil end
            store.dirty = false
            states = {}; load(); notify(nil)
        end
        adapter.storage = function() return store end
        adapter.copy = function(text)
            for _, name in ipairs({"setclipboard", "toclipboard", "set_clipboard"}) do
                local fn = realApi(name)
                if fn then local ok, result = pcall(fn, text); if ok and result ~= false then return true end end
            end
            return false
        end
        adapter.destroy = function()
            if closed then return end
            for entry in pairs(states) do stop(entry) end
            if pendingSave then pcall(task.cancel, pendingSave); pendingSave = nil end
            if store.dirty then save() end
            closed = true
            table.clear(listeners)
        end
        load()
    end
    assert(type(adapter) == "table" and adapter.protocol == 1 and type(adapter.list) == "function",
        "Saved Code adapter không tương thích")

    local colors = {bg = Color3.fromRGB(11,12,17), card = Color3.fromRGB(26,29,38), input = Color3.fromRGB(20,22,30),
        text = Color3.fromRGB(233,237,245), muted = Color3.fromRGB(154,162,180), accent = Color3.fromRGB(240,201,122),
        green = Color3.fromRGB(64,180,125), red = Color3.fromRGB(205,70,70), blue = Color3.fromRGB(70,130,210)}
    local view = {Adapter = adapter, Mode = adapter.mode, dead = false}
    local baseConnections, rowConnections, rowViews = {}, {}, {}
    local searchJob, unsubscribe
    local function disconnect(list)
        for _, connection in ipairs(list) do pcall(function() connection:Disconnect() end) end
        table.clear(list)
    end
    local function connect(event, fn, row)
        if not event then return end
        local c = event:Connect(function(...)
            if view.dead then return end
            local ok, err = pcall(fn, ...)
            if not ok then view.Report("❌ " .. tostring(err), true) end
        end)
        local list = row and rowConnections or baseConnections
        list[#list + 1] = c
    end
    local function new(class, props, parent)
        local obj = Instance.new(class)
        if obj:IsA("GuiObject") then obj.BorderSizePixel = 0 end
        for key, value in pairs(props or {}) do obj[key] = value end
        obj.Parent = parent
        return obj
    end
    local function corner(obj, radius) new("UICorner", {CornerRadius = UDim.new(0,radius or 5)}, obj) end
    local function button(parent, name, text, x, y, width, color)
        local b = new("TextButton", {Name=name, Size=UDim2.new(0,width,0,26), Position=x or UDim2.new(0,8,0,y),
            Text=text, BackgroundColor3=color or colors.card, TextColor3=colors.text,
            Font=Enum.Font.GothamBold, TextSize=10, ZIndex=12}, parent)
        corner(b)
        return b
    end
    local parent, ownGui = options.parent, nil
    if not parent then
        local player = game:GetService("Players").LocalPlayer
        assert(player, "Code Đã Lưu phải chạy ở client Roblox")
        parent = player.PlayerGui or player:WaitForChild("PlayerGui")
        local hiddenGui = realApi("gethui")
        if hiddenGui then local ok, target = pcall(hiddenGui); if ok and target then parent = target end end
        ownGui = new("ScreenGui", {Name="TDZSavedCode", ResetOnSpawn=false, IgnoreGuiInset=true,
            ZIndexBehavior=Enum.ZIndexBehavior.Sibling}, parent)
        parent = ownGui
    end
    local root = new("Frame", {Name="SavedCodeRoot", BackgroundColor3=colors.bg, ZIndex=8,
        Size=ownGui and UDim2.new(0.86,0,0.82,0) or UDim2.new(1,0,1,0),
        Position=ownGui and UDim2.new(0.07,0,0.09,0) or UDim2.new()}, parent)
    corner(root, 8)
    view.Gui, view.Root = ownGui, root
    local title = new("TextLabel", {Name="SavedCodeTitle", Size=UDim2.new(1,-40,0,30), Position=UDim2.new(0,8,0,0),
        Text="💾 Code Đã Lưu", BackgroundTransparency=1, TextColor3=colors.accent,
        Font=Enum.Font.GothamBold, TextSize=13, TextXAlignment=Enum.TextXAlignment.Left, ZIndex=10}, root)
    local body = new("ScrollingFrame", {Name="SavedCodeBody", Position=UDim2.new(0,0,0,32), Size=UDim2.new(1,0,1,-32),
        BackgroundTransparency=1, ScrollBarThickness=4, CanvasSize=UDim2.new(),
        ScrollingDirection=Enum.ScrollingDirection.Y, ZIndex=9}, root)
    view.Body = body
    local nameInput = new("TextBox", {Name="SavedLinkName", Size=UDim2.new(1,-116,0,26), Position=UDim2.new(0,8,0,8),
        Text="", PlaceholderText="Tên code (tùy chọn)", ClearTextOnFocus=false,
        BackgroundColor3=colors.card, TextColor3=colors.text, PlaceholderColor3=colors.muted,
        Font=Enum.Font.GothamMedium, TextSize=10, TextXAlignment=Enum.TextXAlignment.Left, ZIndex=12}, body)
    corner(nameInput)
    local add = button(body, "AddSavedLink", "💾 Lưu code", UDim2.new(1,-102,0,8), 8, 94, colors.blue)
    local sourceInput = new("TextBox", {Name="SavedLinkUrl", Size=UDim2.new(1,-16,0,72), Position=UDim2.new(0,8,0,40),
        Text="", PlaceholderText="Dán code Luau hoặc link raw vào đây…", ClearTextOnFocus=false,
        MultiLine=true, TextWrapped=true, BackgroundColor3=colors.input, TextColor3=colors.text,
        PlaceholderColor3=colors.muted, Font=Enum.Font.Code, TextSize=10,
        TextXAlignment=Enum.TextXAlignment.Left, TextYAlignment=Enum.TextYAlignment.Top, ZIndex=12}, body)
    corner(sourceInput)
    view.NameInput, view.SourceInput = nameInput, sourceInput
    local status = new("TextLabel", {Name="SavedLinkStatus", Size=UDim2.new(1,-16,0,30), Position=UDim2.new(0,8,0,116),
        Text="Không tự chạy code. Lưu nguồn rồi bấm Chạy/Kích hoạt.", BackgroundTransparency=1,
        TextColor3=colors.muted, Font=Enum.Font.GothamMedium, TextSize=9, TextWrapped=true,
        TextXAlignment=Enum.TextXAlignment.Left, ZIndex=11}, body)
    view.StatusLabel = status
    function view.Report(text, bad)
        if view.dead then return end
        status.Text, status.TextColor3 = tostring(text), bad and colors.red or colors.muted
    end
    local search = new("TextBox", {Name="SavedCodeSearch", Size=UDim2.new(1,-16,0,26), Position=UDim2.new(0,8,0,150),
        Text="", PlaceholderText="🔍 Tìm code đã lưu…", ClearTextOnFocus=false,
        BackgroundColor3=colors.card, TextColor3=colors.text, Font=Enum.Font.GothamMedium, TextSize=10,
        TextXAlignment=Enum.TextXAlignment.Left, ZIndex=12}, body)
    corner(search)
    local storage = new("TextLabel", {Name="SavedCodeStorage", Size=UDim2.new(1,-16,0,30), Position=UDim2.new(0,8,0,180),
        Text="", BackgroundTransparency=1, TextColor3=colors.muted, Font=Enum.Font.GothamMedium,
        TextSize=9, TextWrapped=true, TextXAlignment=Enum.TextXAlignment.Left, ZIndex=11}, body)
    view.StorageLabel = storage
    local saveNow = button(body, "SavedCodeSave", "💾 Lưu ngay", UDim2.new(0,8,0,214), 214, 82, colors.green)
    local reload = button(body, "SavedCodeReload", "🔄 Nạp lại", UDim2.new(0,96,0,214), 214, 76)
    local export = button(body, "SavedCodeExport", "📤 Xuất", UDim2.new(0,178,0,214), 214, 62)
    local import = button(body, "SavedCodeImport", "📥 Nhập", UDim2.new(0,246,0,214), 214, 62)
    view.ReloadButton = reload
    local list = new("Frame", {Name="SavedLinkList", Position=UDim2.new(0,8,0,246), Size=UDim2.new(1,-16,0,0),
        BackgroundTransparency=1, ZIndex=10}, body)
    new("UIListLayout", {SortOrder=Enum.SortOrder.LayoutOrder, Padding=UDim.new(0,6)}, list)
    function view.RefreshStorage()
        if view.dead then return end
        local info = adapter.storage()
        local message = info.error and ("⚠️ " .. tostring(info.error))
            or (info.mode == "file" and "💾 Đã lưu xuống đĩa" or "⚠️ Chưa lưu xuống đĩa / chỉ giữ trong RAM")
        storage.Text = string.format("%d code · %s · %s", #adapter.list(), tostring(info.file or ""), message)
    end
    local function render(entry)
        local row = rowViews[entry]
        if not row or not row.button.Parent then return end
        local state = adapter.state(entry)
        row.button.Text = state and state.running and "⏳ Chạy…"
            or (state and state.state == "error" and "↻ Thử lại")
            or (state and state.hasRun and (adapter.mode == "hub" and "↗ Mở tab" or "↻ Chạy lại"))
            or (adapter.mode == "hub" and "▶ Kích hoạt" or "▶ Chạy")
        row.button.BackgroundColor3 = state and state.state == "error" and colors.red or colors.green
    end
    function view.Refresh()
        if view.dead then return end
        disconnect(rowConnections)
        rowViews = {}
        for _, child in ipairs(list:GetChildren()) do if not child:IsA("UIListLayout") then child:Destroy() end end
        local term, total, shown = search.Text:lower(), 0, 0
        for _, entry in ipairs(adapter.list()) do
            if term == "" or entry.name:lower():find(term,1,true) or entry.code:lower():find(term,1,true) then
                shown += 1
                local expanded = entry.expanded == true
                local row = new("Frame", {Name="SavedLinkRow", Size=UDim2.new(1,0,0,expanded and 160 or 42),
                    BackgroundColor3=colors.card, LayoutOrder=shown, ClipsDescendants=true, ZIndex=10}, list)
                corner(row)
                local arrow = button(row, "SavedCodeExpand", expanded and "▲" or "▼", UDim2.new(0,5,0,8), 8, 24)
                local name = new("TextButton", {Name="SavedLinkActivateName", Size=UDim2.new(1,-194,0,42),
                    Position=UDim2.new(0,35,0,0), Text="🔗 " .. entry.name, BackgroundTransparency=1,
                    TextColor3=colors.accent, Font=Enum.Font.GothamBold, TextSize=10,
                    TextXAlignment=Enum.TextXAlignment.Left, TextTruncate=Enum.TextTruncate.AtEnd, ZIndex=12}, row)
                local remove = button(row, "SavedCodeDelete", "🗑 Xóa", UDim2.new(1,-146,0,8), 8, 58, colors.red)
                local run = button(row, "SavedLinkActivate", "▶ Chạy", UDim2.new(1,-82,0,8), 8, 76, colors.green)
                rowViews[entry] = {button = run}
                render(entry)
                local function activate()
                    local ok, why = adapter.run(entry)
                    if not ok then view.Report("⚠️ " .. tostring(why), true) end
                    render(entry)
                end
                connect(run.Activated, activate, true); connect(name.Activated, activate, true)
                connect(remove.Activated, function() adapter.remove(entry); view.Refresh() end, true)
                connect(arrow.Activated, function()
                    entry.expanded = not entry.expanded
                    adapter.saveSoon(); view.Refresh()
                end, true)
                if expanded then
                    local source = new("TextBox", {Name="SavedLinkSource", Size=UDim2.new(1,-12,0,82),
                        Position=UDim2.new(0,6,0,42), Text=entry.code, MultiLine=true, TextWrapped=true,
                        ClearTextOnFocus=false, BackgroundColor3=colors.input, TextColor3=colors.text,
                        Font=Enum.Font.Code, TextSize=10, TextXAlignment=Enum.TextXAlignment.Left,
                        TextYAlignment=Enum.TextYAlignment.Top, ZIndex=12}, row)
                    corner(source)
                    local copy = button(row, "SavedCodeCopy", "📋 Copy nguồn", UDim2.new(0,6,0,128), 128, 120, colors.blue)
                    local apply = button(row, "SavedCodeApply", "💾 Lưu sửa", UDim2.new(1,-126,0,128), 128, 120)
                    connect(copy.Activated, function()
                        view.Report(adapter.copy(entry.code) and "✅ Đã copy nguồn" or "⚠️ Không có clipboard thật; copy từ ô nguồn")
                    end, true)
                    connect(apply.Activated, function()
                        local ok, why = adapter.update(entry, source.Text)
                        view.Report(ok and "💾 Đã lưu nguồn mới" or ("⚠️ " .. tostring(why)), not ok)
                        render(entry)
                    end, true)
                end
                total += (expanded and 160 or 42) + 6
            end
        end
        if shown == 0 then
            new("TextLabel", {Size=UDim2.new(1,0,0,40), Text="📭 Chưa có code hoặc không tìm thấy kết quả",
                TextWrapped=true, BackgroundTransparency=1, TextColor3=colors.muted,
                Font=Enum.Font.GothamMedium, TextSize=10, ZIndex=11}, list)
        end
        list.Size = UDim2.new(1,-16,0,math.max(40,total))
        body.CanvasSize = UDim2.new(0,0,0,246 + math.max(40,total) + 12)
        view.RefreshStorage()
    end
    function view.Export()
        return HttpService:JSONEncode({version = 1, scripts = copyEntries(adapter.list())})
    end
    function view.Import(json)
        local ok, data = pcall(HttpService.JSONDecode, HttpService, json)
        if not ok or type(data) ~= "table" or type(data.scripts) ~= "table" then return false, "JSON không có danh sách scripts" end
        local added = 0
        for _, entry in ipairs(copyEntries(data.scripts)) do
            local item = adapter.add(entry.name, entry.code)
            if item then item.expanded = entry.expanded; added += 1 end
        end
        adapter.saveSoon(); view.Refresh()
        return true, added
    end
    function view.Destroy(alreadyDestroying)
        if view.dead then return end
        view.dead = true
        if searchJob then pcall(task.cancel, searchJob); searchJob = nil end
        if unsubscribe then pcall(unsubscribe); unsubscribe = nil end
        disconnect(rowConnections); disconnect(baseConnections)
        if ownsAdapter and type(adapter.destroy) == "function" then adapter.destroy() end
        if not alreadyDestroying then
            if ownGui then pcall(function() ownGui:Destroy() end)
            else pcall(function() root:Destroy() end) end
        elseif ownGui and ownGui.Parent then
            task.defer(function() if ownGui.Parent then ownGui:Destroy() end end)
        end
        if rawget(_G,"TDZSavedCodeStandalone") == view then _G.TDZSavedCodeStandalone = nil end
    end
    connect(add.Activated, function()
        local entry, err = adapter.add(nameInput.Text, sourceInput.Text)
        if not entry then view.Report("⚠️ " .. tostring(err), true); return end
        nameInput.Text, sourceInput.Text = "", ""
        view.Refresh(); view.Report("💾 Đã lưu " .. entry.name .. "; chưa chạy code")
    end)
    connect(saveNow.Activated, function()
        local ok = adapter.save()
        view.RefreshStorage(); view.Report(ok and "✅ Đã lưu xuống đĩa" or "⚠️ Chỉ giữ trong RAM / ghi lỗi", not ok)
    end)
    connect(reload.Activated, function() adapter.reload(); view.Refresh() end)
    connect(export.Activated, function()
        local json = view.Export()
        if adapter.copy(json) then view.Report("✅ Đã copy JSON")
        else sourceInput.Text = json; view.Report("📤 Không có clipboard: JSON được điền vào ô code để bạn copy") end
    end)
    connect(import.Activated, function()
        local ok, result = view.Import(sourceInput.Text)
        if ok then sourceInput.Text = "" end
        view.Report(ok and ("📥 Đã nhập " .. result .. " code") or ("⚠️ " .. tostring(result)), not ok)
    end)
    connect(search:GetPropertyChangedSignal("Text"), function()
        if searchJob then pcall(task.cancel, searchJob) end
        searchJob = task.delay(0.18, function() searchJob = nil; view.Refresh() end)
    end)
    unsubscribe = adapter.subscribe(function(entry, message, bad)
        if view.dead then return end
        if message then view.Report(message, bad) end
        if entry then render(entry) elseif not message then view.Refresh() end
    end)
    connect(root.Destroying, function() view.Destroy(true) end)
    title.Size = UDim2.new(1, ownGui and -116 or -82, 0, 30)
    local stopAll = button(root, "SavedCodeStop", "⏹ Dừng", UDim2.new(1,ownGui and -108 or -76,0,2),2,70,colors.red)
    connect(stopAll.Activated, function()
        for _, entry in ipairs(adapter.list()) do
            local state = adapter.state(entry)
            if state and state.running then adapter.stop(entry) end
        end
        view.Report("⏹ Đã dừng luồng khởi chạy của Code Đã Lưu")
    end)
    if ownGui then
        local close = button(root,"SavedCodeClose","✕",UDim2.new(1,-34,0,2),2,28,colors.red)
        connect(close.Activated, view.Destroy)
        connect(ownGui.Destroying, function() view.Destroy(true) end)
        local ok, input = pcall(game.GetService, game, "UserInputService")
        if ok and input then
            local dragging, start, position
            connect(title.InputBegan, function(i)
                if root.Parent ~= ownGui then return end -- đang nhúng trong hub: không giành thao tác kéo menu
                if i.UserInputType == Enum.UserInputType.MouseButton1 or i.UserInputType == Enum.UserInputType.Touch then
                    dragging, start, position = true, i.Position, root.Position
                end
            end)
            connect(input.InputChanged, function(i)
                if not dragging or root.Parent ~= ownGui then return end
                if i.UserInputType == Enum.UserInputType.MouseMovement or i.UserInputType == Enum.UserInputType.Touch then
                    local d = i.Position - start
                    root.Position = UDim2.new(position.X.Scale,position.X.Offset+d.X,position.Y.Scale,position.Y.Offset+d.Y)
                end
            end)
            connect(input.InputEnded, function() dragging = false end)
        end
    end
    view.Refresh()
    return view
end
-- END SAVED_CODE_FACTORY

-- Standalone bootstrap. Hub tích hợp dùng chính factory ở trên, không tải file này qua mạng.
local old = rawget(_G, "TDZSavedCodeStandalone")
if type(old) == "table" and type(old.Destroy) == "function" then pcall(old.Destroy) end
local api = rawget(_G, "BananaCatHubAPI")
local adapter = type(api) == "table" and api.SavedCodeAdapter or nil
if type(adapter) ~= "table" or adapter.protocol ~= 1
    or (type(adapter.alive) == "function" and not adapter.alive()) then adapter = nil end
local view = CreateSavedCode({adapter = adapter})
pcall(function() _G.TDZSavedCodeStandalone = view end)
return view
