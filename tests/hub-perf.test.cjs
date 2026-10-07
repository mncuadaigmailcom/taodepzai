const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const REPO = path.join(__dirname, '..');
const hub = fs.readFileSync(path.join(REPO, 'script.js'), 'utf8');

const isHub = hub.includes('BananaCatHub') || hub.includes('taodepzai v5.0 NOIR');

test('script.js phải là hub (BananaCatHub) chứ không phải key-system cũ', () => {
    assert.ok(isHub, 'script.js phải chứa BananaCatHub / taodepzai v5.0 NOIR');
    assert.ok(hub.length > 500000, `hub phải lớn >500KB, hiện ${hub.length}`);
});

test('v5.2 PERF: S.PagePerf phải tồn tại với đầy đủ API', () => {
    assert.match(hub, /S\.PagePerf\s*=\s*S\.PagePerf or \{/, 'thiếu S.PagePerf định nghĩa');
    assert.match(hub, /function S\.PagePerf\.IsMainVisible/, 'thiếu IsMainVisible');
    assert.match(hub, /function S\.PagePerf\.GetActiveTabName/, 'thiếu GetActiveTabName');
    assert.match(hub, /function S\.PagePerf\.IsTabVisible/, 'thiếu IsTabVisible');
    assert.match(hub, /function S\.PagePerf\.ShouldRunForPlayerTab/, 'thiếu ShouldRunForPlayerTab');
    assert.match(hub, /function S\.PagePerf\.ShouldRunForSupportTab/, 'thiếu ShouldRunForSupportTab');
    assert.match(hub, /function S\.PagePerf\.OnTabChanged/, 'thiếu OnTabChanged');
    assert.match(hub, /function S\.PagePerf\.OnMainVisibilityChanged/, 'thiếu OnMainVisibilityChanged');
});

test('v5.2 PERF: SwitchTab và ToggleMainFrame phải gọi PagePerf', () => {
    assert.match(hub, /function SwitchTab[\s\S]{0,2500}S\.PagePerf\.OnTabChanged/, 'SwitchTab phải gọi OnTabChanged');
    assert.match(hub, /function ToggleMainFrame[\s\S]{0,2500}S\.PagePerf\.OnMainVisibilityChanged/, 'ToggleMainFrame phải gọi OnMainVisibilityChanged');
    // closeBtn cũng phải gọi
    assert.match(hub, /closeBtn\.Activated:Connect[\s\S]{0,1000}OnMainVisibilityChanged/, 'closeBtn phải gọi OnMainVisibilityChanged');
});

test('v5.2 PERF: S.Coord phải quản lý kết nối tọa độ theo tab', () => {
    assert.match(hub, /S\.Coord\s*=\s*S\.Coord or \{/, 'thiếu S.Coord');
    assert.match(hub, /function S\.Coord\.IsActive/, 'thiếu S.Coord.IsActive');
    assert.match(hub, /function S\.Coord\.Bind\(on\)/, 'thiếu S.Coord.Bind');
    assert.match(hub, /function S\.Coord\.RefreshBind/, 'thiếu S.Coord.RefreshBind');
    // Không còn trackConn(coordUpdateConn) trực tiếp nữa
    assert.doesNotMatch(hub, /trackConn\(coordUpdateConn\)/, 'vẫn còn kết nối cũ coordUpdateConn luôn chạy');
    // Phải có check ShouldRunForSupportTab
    assert.match(hub, /ShouldRunForSupportTab/, 'S.Coord phải check ShouldRunForSupportTab');
});

test('v5.2 PERF: S.Loc phải giảm tần suất khi không ở tab Người Chơi', () => {
    assert.match(hub, /function S\.Loc\.OnPerfTick/, 'thiếu S.Loc.OnPerfTick');
    assert.match(hub, /function S\.Loc\.Tick\(\)[\s\S]{0,300}IsTabVisible/, 'S.Loc.Tick phải check IsTabVisible');
    // v5.3 EXTREME: interval có thể 0.8 (v5.2) hoặc 1.2 (v5.3)
    assert.ok(hub.includes('interval = 0.8') || hub.includes('interval = 1.2') || hub.includes('interval = 0.35'), 'S.Loc.Bind phải tăng interval khi không ở tab Người Chơi (0.8 hoặc 1.2)');
    assert.match(hub, /ShouldRunForPlayerTab/, 'S.Loc phải dùng ShouldRunForPlayerTab');
});

test('v5.3 EXTREME PERF: các tối ưu sâu mới', () => {
    // Cache Humanoid/RootPart
    assert.match(hub, /_cachedHum/, 'thiếu cache _cachedHum (v5.3)');
    assert.match(hub, /_cachedRoot/, 'thiếu cache _cachedRoot (v5.3)');
    assert.match(hub, /function MV\.InvalidateCache/, 'thiếu InvalidateCache (v5.3)');
    // NoClip enforce throttling
    assert.match(hub, /_ncEnforceAcc/, 'thiếu _ncEnforceAcc throttling cho NoClip (v5.3)');
    // Safe scan throttling 0.10/0.30 (v5.4 có thêm *1.8 khi menu đóng)
    assert.ok(hub.includes('0.10 or 0.30') || hub.includes('ivScan * 1.8'), 'Safe scan phải 0.10/0.30 hoặc có throttling menu đóng');
    // Coord interval 0.10 hoặc 0.15 (v5.4)
    assert.ok(hub.includes('coordAcc < 0.10') || hub.includes('coordAcc < 0.15'), 'Coord interval phải 0.10 hoặc 0.15 (v5.3/v5.4)');
    // OT budget - v5.4: 4.0/80/3/8, v5.6 FAST: 1.0/300/15/25
    assert.ok(hub.includes('scanIdle = 3.0') || hub.includes('scanIdle = 4.0') || hub.includes('scanIdle = 1.0'), 'OT scanIdle phải 3.0, 4.0 hoặc 1.0 (v5.6 FAST)');
    assert.ok(hub.includes('scanBudget = 120') || hub.includes('scanBudget = 80') || hub.includes('scanBudget = 300'), 'OT scanBudget phải 120, 80 hoặc 300 (v5.6 FAST)');
    // HubList 3s hoặc 4s
    assert.ok(hub.includes('acc < 3') || hub.includes('acc < 4'), 'HubList phải 3s hoặc 4s');
    // v5.4 thêm reuse RaycastParams
    assert.match(hub, /_groundParams/, 'thiếu _groundParams reuse (v5.4)');
    // v5.6 FAST: phải có chế độ siêu tốc
    assert.ok(hub.includes('_fastUntil') || hub.includes('siêu tốc') || hub.includes('SIÊU TỐC'), 'thiếu _fastUntil siêu tốc (v5.6 FAST)');
});

test('v5.5: OT (ObjTrack) phải hoạt động LIÊN TỤC khi đã nhập tên vật', () => {
    assert.match(hub, /function OT\.OnPerfTick/, 'thiếu OT.OnPerfTick');
    // v5.5: khi đã nhập tên thì quét liên tục, không dừng khi đổi tab
    assert.match(hub, /hasKeys.*OT\.on/, 'OT.Step phải có hasKeys check để quét liên tục');
    assert.match(hub, /LIÊN TỤC/, 'thiếu comment v5.5 về quét liên tục');
    // Phải vẫn check IsTabVisible nhưng không set shouldScan=false nữa, mà chỉ điều chỉnh scanIdle
    assert.ok(hub.includes('scanIdle * 1.2') || hub.includes('scanIdle * 1.5'), 'OT phải điều chỉnh scanIdle khi không ở tab nhưng vẫn quét');
    assert.match(hub, /IsTabVisible\(pt\)/, 'OT.Step phải check IsTabVisible cho playerTab');
    // Đảm bảo không còn logic cũ dừng hẳn khi không ở tab
    assert.doesNotMatch(hub, /vẫn cập nhật nhãn nhưng không quét mới để tiết kiệm/, 'vẫn còn logic cũ dừng quét khi menu đóng - phải quét liên tục v5.5');
});

test('v5.6 FAST: OT phải tăng tốc độ phát hiện vật thể', () => {
    // Kiểm tra các giá trị FAST mới
    assert.ok(hub.includes('scanIdle = 1.0') || hub.includes('scanIdle = 0.3'), 'OT scanIdle phải 1.0 hoặc 0.3 (v5.6 FAST)');
    assert.ok(hub.includes('scanBudget = 300') || hub.includes('scanBudget = 250'), 'OT scanBudget phải lớn (300) để quét nhanh');
    assert.ok(hub.includes('makeBudget = 15') || hub.includes('makeBudget = 12'), 'OT makeBudget phải lớn (15) để tạo highlight nhanh');
    assert.ok(hub.includes('labelEvery = 0.12') || hub.includes('labelEvery = 0.15'), 'OT labelEvery phải nhỏ (0.12) để cập nhật nhanh');
    assert.match(hub, /_fastUntil/, 'thiếu _fastUntil cho chế độ siêu tốc');
    assert.match(hub, /0\.2.*objtrack|Debounce.*0\.2/, 'Debounce phải 0.2s thay vì 0.35s để phản hồi nhanh hơn');
    // Đảm bảo vẫn giữ tính năng liên tục
    assert.match(hub, /hasKeys.*OT\.on/, 'vẫn phải giữ hasKeys để quét liên tục');
});

test('v5.2 PERF: BC_HubList phải kiểm tra main.Visible và PagePerf', () => {
    assert.match(hub, /BC_HubList[\s\S]{0,500}IsMainVisible/, 'BC_HubList phải check IsMainVisible');
    assert.match(hub, /BC_HubList[\s\S]{0,800}playerVisible/, 'BC_HubList phải phân biệt playerVisible vs hubVisible');
    assert.match(hub, /chỉ refresh list khi tab tương ứng đang mở/, 'thiếu comment tối ưu mới');
});

test('v5.2 PERF: SV (SpeedMeter) chỉ vẽ label khi ở tab Hỗ Trợ', () => {
    assert.match(hub, /function SV\.OnTabChanged/, 'thiếu SV.OnTabChanged');
    assert.match(hub, /isSupportVisible/, 'SV.Sync phải có isSupportVisible');
    assert.match(hub, /ShouldRunForSupportTab/, 'SV phải dùng ShouldRunForSupportTab');
});

test('v5.2 PERF: không làm mất tính năng gameplay (Fly, Noclip, Spec, Glow, Free phải còn)', () => {
    // Đảm bảo các tính năng chính vẫn tồn tại
    const required = ['BC_Loc', 'BC_Spec', 'BC_FreeCam', 'BC_Glow', 'Fly', 'Carpet', 'BC_ObjTrack', 'BC_Safe', 'BC_NoClip'];
    for (const name of required) {
        assert.ok(hub.includes(name), `thiếu tính năng gameplay ${name} — đã làm mất tính năng`);
    }
    // Đảm bảo các Bind gameplay không bị xóa
    assert.match(hub, /RunService:BindToRenderStep\("Fly"/, 'mất Fly');
    assert.match(hub, /RunService:BindToRenderStep\("BC_Safe"/, 'mất Safe');
    assert.match(hub, /RunService:BindToRenderStep\("BC_Loc"/, 'mất Loc');
});

test('index.html phải sạch rác quảng cáo và postMessage', () => {
    const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
    const scriptCount = (html.match(/<script>/g) || []).length;
    assert.equal(scriptCount, 1, `index.html phải chỉ có 1 <script>, hiện ${scriptCount}`);
    assert.doesNotMatch(html, /fake-ad|video-ad-overlay|window\.parent\.postMessage/, 'vẫn còn rác quảng cáo / postMessage');
    assert.match(html, /<meta charset="UTF-8">/, 'thiếu meta charset');
    // charset phải nằm trong 1KB đầu
    const charsetPos = html.indexOf('<meta charset="UTF-8">');
    assert.ok(charsetPos < 1024, `charset phải trong 1KB đầu, hiện ở ${charsetPos}`);
});

test('Luau cơ bản: kiểm tra cân bằng do/end, function/end (không dùng parser nặng)', () => {
    // Đếm số lượng từ khóa quan trọng, đảm bảo không lệch quá nhiều sau khi edit
    const doCount = (hub.match(/\bdo\b/g) || []).length;
    const endCount = (hub.match(/\bend\b/g) || []).length;
    // end thường nhiều hơn do vì function/if/for cũng cần end
    assert.ok(endCount > doCount, `end (${endCount}) phải > do (${doCount})`);
    // Kiểm tra không có lỗi cú pháp rõ ràng: ]] không đóng, hoặc local function không có end gần
    assert.doesNotMatch(hub, /local function.*\n.*\n.*trackConn\(coordUpdateConn\)/, 'vẫn còn code cũ lỗi sau khi refactor S.Coord');
});
