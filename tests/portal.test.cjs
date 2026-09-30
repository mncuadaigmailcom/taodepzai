const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextEncoder, TextDecoder } = require('node:util');
const { execFileSync } = require('node:child_process');
const { giaiMaDemo, giaiMaKey } = require('../tools/decode-demo.cjs');

const REPO = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(REPO, 'index.html'), 'utf8');
const kuLua = fs.readFileSync(path.join(REPO, 'script.js'), 'utf8');
const script = html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script, 'Trang phải có JavaScript');
const css = html.split('<style>')[1].split('</style>')[0];

const BI_MAT = 'z!V~~RO3mS2dCMvW-GE@#v2XYYuLsNoQKS5U0pGeAY5EOkd_';

class Element {
    constructor(id = '') {
        this.id = id;
        this.className = '';
        this.textContent = '';
        this.value = '';
        this.disabled = false;
        this.open = false;
        this.style = {};
        this.attributes = {};
        this.children = new Map();
        this.events = new Map();
        this.classList = {
            contains: name => this.className.split(/\s+/).includes(name),
            add: name => this.classList.toggle(name, true),
            remove: name => this.classList.toggle(name, false),
            toggle: (name, force) => {
                const names = new Set(this.className.split(/\s+/).filter(Boolean));
                const add = force === undefined ? !names.has(name) : force;
                if (add) names.add(name);
                else names.delete(name);
                this.className = [...names].join(' ');
                return add;
            }
        };
    }
    addEventListener(type, handler) {
        if (!this.events.has(type)) this.events.set(type, []);
        this.events.get(type).push(handler);
    }
    fire(type, props = {}) {
        const event = { target: this, preventDefault() {}, ...props };
        return Promise.all((this.events.get(type) || []).map(handler => handler(event)));
    }
    querySelector(selector) { return this.children.get(selector) || null; }
    querySelectorAll() { return []; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    removeAttribute(name) { delete this.attributes[name]; }
    focus() { this.document.activeElement = this; }
    blur() {
        if (this.document && this.document.activeElement === this) {
            this.document.activeElement = null;
            this.fire('blur'); // Giống trình duyệt: blur() phát sự kiện blur.
        }
    }
    select() { this.selected = true; }
    getClientRects() { return [{}]; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 200 }; }
}

// DOM giả đủ để chạy script của trang trong vm; nhận `search` để thử link ?mahoa= / ?ten=
function createPortal(sharedStore = new Map(), now = 1_000_000, search = '') {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    const elements = new Map(ids.map(id => [id, new Element(id)]));
    const docEvents = new Map();
    const windowEvents = new Map();
    const document = {
        activeElement: null,
        visibilityState: 'visible',
        body: { style: {} },
        getElementById: id => elements.get(id) || null,
        querySelectorAll: () => [elements.get('giao-dien-chinh'), ...[1, 2, 3, 4].map(i => elements.get(`khung-nv${i}`))],
        addEventListener(type, fn) { docEvents.set(type, fn); },
        execCommand: () => true
    };
    for (const element of elements.values()) element.document = document;
    const dialog = new Element('dialog');
    dialog.document = document;
    elements.get('white-screen').children.set('.editor-wrapper', dialog);
    elements.get('nut-giai-bai').children.set('span', new Element('button-label'));
    for (let i = 1; i <= 4; i++) {
        const link = elements.get(`link-nv${i}`);
        link.children.set('.task-title', new Element(`title-${i}`));
        link.children.set('.task-desc', new Element(`desc-${i}`));
    }
    const clock = { now };
    let nextTimerId = 0;
    const timers = new Map();
    function schedule(fn, delay, interval = false) {
        const id = ++nextTimerId;
        timers.set(id, { fn, at: clock.now + delay, interval: interval ? delay : 0 });
        return id;
    }
    function advance(ms) {
        const target = clock.now + ms;
        while (true) {
            const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
            if (!next || next[1].at > target) break;
            const [id, timer] = next;
            clock.now = timer.at;
            if (timer.interval) timer.at += timer.interval;
            else timers.delete(id);
            timer.fn();
        }
        clock.now = target;
    }
    const copies = [];
    const window = {
        addEventListener(type, fn) { windowEvents.set(type, fn); },
        matchMedia: () => ({ matches: false })
    };
    const location = { search, pathname: '/taodepzai/', hash: '' };
    const history = { last: null, replaceState(_state, _title, url) { this.last = url; } };
    const localStorage = {
        getItem: key => sharedStore.get(key) ?? null,
        setItem: (key, value) => sharedStore.set(key, String(value)),
        removeItem: key => sharedStore.delete(key)
    };
    class ClockDate extends Date { static now() { return clock.now; } }
    vm.runInNewContext(script, {
        document, window, localStorage, location, history, Date: ClockDate, TextEncoder, TextDecoder,
        URLSearchParams,
        btoa: binary => Buffer.from(binary, 'latin1').toString('base64'),
        atob: base64 => Buffer.from(base64, 'base64').toString('latin1'),
        navigator: { clipboard: { writeText: text => { copies.push(text); return Promise.resolve(); } } },
        crypto: { getRandomValues: arr => { for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256); return arr; } },
        fetch: () => Promise.reject(new Error('không có mạng trong test')),
        setTimeout: (fn, ms) => schedule(fn, ms),
        clearTimeout: id => timers.delete(id),
        setInterval: (fn, ms) => schedule(fn, ms, true),
        clearInterval: id => timers.delete(id),
        console, Map, Uint8Array, Uint32Array, TextDecoder
    });
    return {
        elements, copies, store: sharedStore, advance, history,
        click: id => elements.get(id).fire('click'),
        blur: () => windowEvents.get('blur')(),
        focus: () => windowEvents.get('focus')(),
        status: i => sharedStore.get(`statusnv${i}`) || 'idle',
        modalOpen: () => elements.get('white-screen').classList.contains('show'),
        ten: () => elements.get('player-name').value,
        nhanKey: () => elements.get('key-value').value
    };
}

async function completeTask(site, number) {
    await site.click(`link-nv${number}`);
    site.blur();
    site.advance(5000);
    site.focus();
}

async function enterName(site, name = 'HoiAnPlayer_09') {
    site.elements.get('player-name').value = name;
    await site.elements.get('player-name').fire('input');
}

async function duBonNhiemVu(site) {
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
}

// Mã hoá tên y hệt MaHoaTen trong script.js (nhãn 'tdz4|ten|…'), để thử link "Lấy key"
function maHoaTen(ten, nonce = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8])) {
    const hmac = (khoa, thongDiep) => require('node:crypto').createHmac('sha256', khoa).update(thongDiep).digest();
    const ban = Buffer.from(ten, 'utf8');
    const biMat = Buffer.from(BI_MAT, 'utf8');
    const tag = hmac(biMat, Buffer.concat([Buffer.from('tdz4|ten|tag|'), nonce, ban])).subarray(0, 12);
    const khoa = hmac(biMat, Buffer.concat([Buffer.from('tdz4|ten|enc|'), nonce, tag]));
    const dong = Buffer.concat([0, 1].map(j => require('node:crypto').createHash('sha256')
        .update(Buffer.concat([khoa, Buffer.from([j])])).digest()));
    const ma = Buffer.from(ban.map((b, i) => b ^ dong[i]));
    return Buffer.concat([nonce, tag, ma]).toString('base64url');
}

test('trang chỉ có một khối script/style, không còn khối chèn lạ hay mã quảng cáo giả', () => {
    assert.equal((html.match(/<script>/g) || []).length, 1, 'index.html chỉ được có 1 khối <script>');
    assert.equal((html.match(/<style>/g) || []).length, 1, 'index.html chỉ được có 1 khối <style>');
    assert.doesNotMatch(html, /window\.parent\.postMessage|fake-ad|video-ad-overlay/);
    assert.match(html, /<meta charset="UTF-8">\n {4}<meta name="description"/);
    assert.doesNotMatch(html, /tdz4\|tron\||Free_v4_'|MA_DEMO_PREFIX = 'Free_v4_'/);
});

test('mật khẩu, nhãn miền và cấu trúc v5 phải khớp giữa trang và script.js', () => {
    assert.equal(script.includes(`const BI_MAT = '${BI_MAT}'`), true, 'index.html phải dùng đúng BI_MAT');
    assert.equal(kuLua.includes(`"${BI_MAT}"`), true, 'script.js phải dùng đúng BI_MAT');
    assert.equal(script.includes("const MA_DEMO_PREFIX = 'Free_v5_'"), true);
    assert.equal(kuLua.includes('KEY_PREFIX         = "Free_v5_"'), true);
    assert.equal(script.includes("[...utf8('tdz5|tron|')"), true);
    assert.equal(kuLua.includes('"tdz5|tron|"'), true);
    // Cấu trúc v5 trong script.js: nonce 16, tag 32, lệch 1 byte (cờ tên-từ-Roblox)
    assert.match(kuLua, /\[5\] = \{ nonce = 16, tag = 32, lech = 1, nhan = "tdz5" \}/);
    // Trang phải dùng nonce 16 byte và tag đủ 32 byte
    assert.match(script, /function taoNonce\(so = 16\)/);
    assert.match(script, /const tag = hmacSha256\(khoaCon, \[\.\.\.utf8\('tdz5\|tag\|'\), \.\.\.nonce, \.\.\.banRo\]\)/);
    assert.match(script, /luu\.set\(NONCE_KEY, sangHex\(moi\)\)/);
    assert.equal(script.includes('/^[0-9a-f]{32}$/'), true, 'nonce lưu trong phiên phải là 32 ký tự hex (16 byte)');
    assert.equal(/Lấy key" trong script Roblox: \?mahoa=/.test(script) || script.includes("thamSo.get('mahoa')"), true);
    assert.equal(kuLua.includes('"mahoa=" .. MaHoaTen'), true, 'script.js phải phát link ?mahoa=');
});

test('chỉ tạo key v5 khi đã nhập tên và hoàn thành đủ bốn nhiệm vụ', async () => {
    const site = createPortal();
    const button = site.elements.get('nut-giai-bai');
    assert.equal(button.disabled, true);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), false);

    await site.click('link-nv1');
    site.blur();
    site.advance(2000);
    site.focus();
    assert.equal(site.status(1), 'error');
    assert.equal(site.status(2), 'idle');
    site.advance(2500);
    assert.equal(site.status(1), 'idle');

    for (const [number, completed] of [[2, 1], [1, 2], [3, 3]]) {
        await completeTask(site, number);
        assert.equal(site.status(number), 'success');
        assert.equal(site.elements.get('unlocked-count').textContent, `${completed} / 4 hoàn thành`);
        assert.equal(button.disabled, true);
        assert.match(button.children.get('span').textContent, new RegExp(`Còn ${4 - completed} nhiệm vụ`));
        await site.click('nut-giai-bai');
        assert.equal(site.modalOpen(), false);
        assert.equal(site.nhanKey(), '');
    }

    await completeTask(site, 4);
    assert.equal(site.elements.get('unlocked-count').textContent, '4 / 4 hoàn thành');
    assert.equal(site.store.has('completedAtnv4'), true);
    assert.equal(button.disabled, true);
    assert.match(button.children.get('span').textContent, /Nhập tên người chơi/);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), false);

    await enterName(site);
    assert.equal(button.disabled, false);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    const code = site.nhanKey();
    assert.match(code, /^Free_v5_[A-Za-z0-9_-]+$/);
    assert.equal(code.includes('HoiAnPlayer_09'), false);
    const tt = giaiMaKey(code);
    assert.equal(tt.phienBan, 'Free_v5_');
    assert.equal(tt.tuRoblox, false);
    assert.equal(tt.ten, 'HoiAnPlayer_09');
    assert.equal(tt.nhiemVu, 'nv4');
    assert.equal(tt.thoiDiemMs, Number(site.store.get('completedAtnv4')));
    assert.equal(site.elements.get('player-details').open, false);
    await site.click('copy-key-btn');
    assert.deepEqual(site.copies, [code]);
    await site.click('back-btn');
    assert.equal(site.modalOpen(), false);
});

test('không tự hoàn thành nếu chưa rời trang, bốn cổng dùng trạng thái riêng', async () => {
    const site = createPortal();
    await site.click('link-nv3');
    site.advance(6000);
    assert.equal(site.status(3), 'checking');
    assert.equal(site.elements.get('nut-giai-bai').disabled, true);
    site.blur();
    site.advance(5000);
    site.focus();
    assert.equal(site.status(3), 'success');
    await site.click('link-nv4');
    site.blur();
    site.advance(1000);
    site.focus();
    assert.equal(site.status(4), 'error');
    assert.equal(site.status(3), 'success');
    assert.equal(site.store.has('completedAtnv3'), true);
    assert.equal(site.store.has('completedAtnv4'), false);
    assert.equal(site.elements.get('nut-giai-bai').disabled, true);
    assert.equal(site.elements.get('unlocked-count').textContent, '1 / 4 hoàn thành');
});

test('hết phiên 3 phút xóa key và mốc hoàn thành; reset thủ công giữ tên', async () => {
    const site = createPortal();
    await enterName(site);
    await duBonNhiemVu(site);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    site.advance(160000); // 20 giây làm nhiệm vụ + 160 giây còn lại của phiên.
    for (const number of [1, 2, 3, 4]) {
        assert.equal(site.status(number), 'idle');
        assert.equal(site.store.has(`completedAtnv${number}`), false);
    }
    assert.equal(site.modalOpen(), false);
    assert.equal(site.nhanKey(), '');
    assert.equal(site.elements.get('nut-giai-bai').disabled, true);
    assert.equal(site.elements.get('countdown-text').textContent, 'Phiên chưa bắt đầu');
    await site.click('link-nv1');
    await site.click('nut-reset-thu-cong');
    assert.equal(site.status(1), 'idle');
    assert.equal(site.store.has('session_expire'), false);
    assert.equal(site.store.get('taodepzai_player_name'), 'HoiAnPlayer_09');
});

test('F5 giữ tên/mốc nhiệm vụ, vẫn cần đủ bốn và giữ chức năng copy script', async () => {
    const storage = new Map();
    const first = createPortal(storage);
    await enterName(first);
    await completeTask(first, 1);
    assert.equal(first.status(1), 'success');
    const firstTime = storage.get('completedAtnv1');
    const second = createPortal(storage, 1_005_000);
    assert.equal(second.status(1), 'success');
    assert.equal(second.ten(), 'HoiAnPlayer_09');
    assert.equal(storage.get('completedAtnv1'), firstTime);
    assert.equal(second.status(2), 'idle');
    assert.equal(second.elements.get('nut-giai-bai').disabled, true);
    for (const number of [2, 3, 4]) await completeTask(second, number);
    assert.equal(second.elements.get('nut-giai-bai').disabled, false);
    await second.click('nut-giai-bai');
    await second.click('copy-btn');
    assert.match(second.copies[0], /loadstring\(game:HttpGet/);
});

test('tên người chơi nằm trên nhiệm vụ, lưu sau F5 và hiển thị kèm nguồn tên', async () => {
    assert.ok(html.indexOf('id="player-name"') < html.indexOf('id="task-heading"'));
    const storage = new Map();
    const first = createPortal(storage);
    const name = first.elements.get('player-name');
    name.value = '  HoiAnPlayer_09  ';
    await name.fire('input');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');
    assert.equal(storage.get('taodepzai_ten_tu_link'), '0', 'gõ tay phải tắt cờ tên-từ-Roblox');
    await first.click('nut-reset-thu-cong');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');

    const afterReload = createPortal(storage);
    assert.equal(afterReload.ten(), 'HoiAnPlayer_09');
    await duBonNhiemVu(afterReload);
    await afterReload.click('nut-giai-bai');
    const summary = afterReload.elements.get('player-summary');
    assert.equal(summary.textContent, 'Người chơi: HoiAnPlayer_09 · ✍️ tên gõ tay trên web');
    assert.equal(summary.hidden, false);
    assert.equal(afterReload.elements.get('player-details').open, false);
    assert.equal(giaiMaKey(afterReload.nhanKey()).tuRoblox, false);
    const originalCode = afterReload.nhanKey();
    afterReload.elements.get('player-details').open = true;
    await afterReload.click('back-btn');
    assert.equal(afterReload.elements.get('player-details').open, false);
    // Sau khi đủ tên + 4 nhiệm vụ: ô tên bị khoá, không xoá/đổi được cho đến khi làm mới phiên.
    assert.equal(afterReload.elements.get('player-name').disabled, true, 'đủ tên + 4/4 thì ô tên phải khoá');
    afterReload.elements.get('player-name').value = '   ';
    await afterReload.elements.get('player-name').fire('input');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09', 'tên đã khoá thì không xoá được');
    assert.equal(afterReload.elements.get('player-name').value, 'HoiAnPlayer_09');
    assert.equal(afterReload.elements.get('nut-giai-bai').disabled, false);
    await afterReload.click('nut-reset-thu-cong');
    assert.equal(afterReload.elements.get('player-name').disabled, false, 'làm mới phiên phải mở khoá tên');
    await enterName(afterReload, 'AnotherPlayer');
    await duBonNhiemVu(afterReload);
    await afterReload.click('nut-giai-bai');
    assert.equal(summary.textContent, 'Người chơi: AnotherPlayer · ✍️ tên gõ tay trên web');
    assert.notEqual(afterReload.nhanKey(), originalCode);
    assert.equal(giaiMaKey(originalCode).ten, 'HoiAnPlayer_09');
    assert.equal(giaiMaKey(afterReload.nhanKey()).ten, 'AnotherPlayer');
    await afterReload.click('back-btn');
});

test('key v5 dùng thời điểm nhiệm vụ hoàn thành cuối, ổn định sau F5 và đổi khi tạo phiên mới', async () => {
    const storage = new Map();
    const first = createPortal(storage);
    await enterName(first, 'Player_01');
    for (const number of [4, 1, 3, 2]) await completeTask(first, number);
    const lastTime = Number(storage.get('completedAtnv2'));
    for (const number of [4, 1, 3]) {
        assert.ok(lastTime > Number(storage.get(`completedAtnv${number}`)));
    }
    await first.click('nut-giai-bai');
    const originalCode = first.nhanKey();
    assert.match(originalCode, /^Free_v5_[A-Za-z0-9_-]+$/);
    assert.equal(giaiMaKey(originalCode).nhiemVu, 'nv2');
    assert.equal(giaiMaKey(originalCode).thoiDiemMs, lastTime);

    const afterReload = createPortal(storage, 1_020_000);
    await afterReload.click('nut-giai-bai');
    assert.equal(afterReload.nhanKey(), originalCode, 'cùng phiên + cùng tên thì key phải ổn định sau F5');
    await afterReload.click('back-btn');
    await afterReload.click('nut-reset-thu-cong');
    assert.equal(storage.has('completedAtnv2'), false);
    for (const number of [4, 1, 3, 2]) await completeTask(afterReload, number);
    await afterReload.click('nut-giai-bai');
    assert.notEqual(afterReload.nhanKey(), originalCode);
    assert.equal(giaiMaKey(originalCode).thoiDiemMs, lastTime); // Reset không thu hồi key đã sao chép.
});

test('mã hoá đúng tên có dấu, chữ hoa và ký tự đặc biệt mà không lộ tên khi nhìn key', async () => {
    const site = createPortal();
    const name = 'Nguyễn Thị Ánh 🍃 | Δ';
    await enterName(site, name);
    await duBonNhiemVu(site);
    await site.click('nut-giai-bai');
    const code = site.nhanKey();
    assert.equal(code.includes('Nguyễn'), false);
    const tt = giaiMaKey(code);
    assert.equal(tt.ten, name);
    assert.equal(tt.nhiemVu, 'nv4');
    assert.equal(tt.thoiDiemMs, Number(site.store.get('completedAtnv4')));
    const output = execFileSync(process.execPath, ['tools/decode-demo.cjs', code], {
        cwd: REPO, encoding: 'utf8'
    });
    assert.match(output, /Nguyễn Thị Ánh 🍃 \| Δ/);
    assert.match(output, /nv4/);
    assert.match(output, /Free_v5_/);
    assert.match(output, /có thể bị giả mạo|không chứng minh/);
});

test('link ?mahoa= của script Roblox tự điền tên và bật cờ tên-từ-Roblox', async () => {
    const site = createPortal(new Map(), 1_000_000, `?mahoa=${maHoaTen('Nguyễn Văn Ánh')}`);
    assert.equal(site.ten(), 'Nguyễn Văn Ánh');
    assert.equal(site.store.get('taodepzai_ten_tu_link'), '1');
    assert.equal(site.history.last, '/taodepzai/', 'phải xoá tham số khỏi thanh địa chỉ sau khi đọc');
    await duBonNhiemVu(site);
    await site.click('nut-giai-bai');
    const tt = giaiMaKey(site.nhanKey());
    assert.equal(tt.ten, 'Nguyễn Văn Ánh');
    assert.equal(tt.tuRoblox, true, 'key phải mang cờ tên lấy từ link Roblox');
    assert.equal(site.elements.get('player-summary').textContent,
        'Người chơi: Nguyễn Văn Ánh · ✅ tên lấy từ link Roblox');
});

test('link ?mahoa= hỏng thì báo lỗi, không điền tên; ?ten= cũ vẫn dùng được nhưng không bật cờ', async () => {
    const hong = createPortal(new Map(), 1_000_000, '?mahoa=@@khong-phai-base64@@');
    assert.equal(hong.ten(), '');
    assert.match(hong.elements.get('notification-box').textContent, /không hợp lệ|đã hỏng/);

    const thieuByte = createPortal(new Map(), 1_000_000, `?mahoa=${Buffer.alloc(12).toString('base64url')}`);
    assert.equal(thieuByte.ten(), '');

    const doiTag = Buffer.from(maHoaTen('KeGian'), 'base64url');
    doiTag[10] ^= 0xff;
    const gia = createPortal(new Map(), 1_000_000, `?mahoa=${doiTag.toString('base64url')}`);
    assert.equal(gia.ten(), '', 'tag sai thì không được điền tên');

    const cu = createPortal(new Map(), 1_000_000, '?ten=Player_09');
    assert.equal(cu.ten(), 'Player_09');
    assert.equal(cu.store.get('taodepzai_ten_tu_link'), '0');
    cu.elements.get('player-name').value = 'Player_09';
    await cu.elements.get('player-name').fire('input');
    await duBonNhiemVu(cu);
    await cu.click('nut-giai-bai');
    assert.equal(giaiMaKey(cu.nhanKey()).tuRoblox, false);
});

test('không giả vờ giải được mã hash cũ hoặc key hỏng', () => {
    for (const code of ['Free_ABCDEFGH123456', 'Free_v5_ab c', 'Free_v5_abcd', 'Free_v5_##########', 'Free_v9_abcdabcd']) {
        assert.throws(() => giaiMaKey(code), /không hợp lệ|không thuộc bản|hỗ trợ/i);
    }
    // Key v5 bị sửa 1 ký tự phải bị bắt nhờ tag 256 bit
    const that = require('node:crypto');
    const keyBytes = Buffer.concat([Buffer.alloc(16, 7), Buffer.alloc(32, 9), Buffer.alloc(40, 3)]);
    const ma = `Free_v5_${keyBytes.toString('base64url')}`;
    assert.throws(() => giaiMaKey(ma), /không hợp lệ/);
    assert.equal(that.timingSafeEqual(Buffer.from('a'), Buffer.from('a')), true); // chỗ dựa cho việc so tag
});

test('phiên cũ không có mốc hoàn thành phải làm mới thay vì tạo key sai', async () => {
    const storage = new Map([
        ['session_expire', '1180000'],
        ['taodepzai_player_name', 'Player_01'],
        ...[1, 2, 3, 4].map(number => [`statusnv${number}`, 'success'])
    ]);
    const site = createPortal(storage);
    assert.equal(site.elements.get('unlocked-count').textContent, '4 / 4 hoàn thành');
    assert.equal(site.elements.get('nut-giai-bai').disabled, true);
    assert.match(site.elements.get('nut-giai-bai').children.get('span').textContent, /Làm mới phiên/);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), false);
    await site.click('nut-reset-thu-cong');
    await duBonNhiemVu(site);
    assert.equal(site.elements.get('nut-giai-bai').disabled, false);
});

test('khoá tên sau khi hoàn thành đủ nhiệm vụ; mở lại khi làm mới hoặc hết phiên', async () => {
    const site = createPortal();
    const nameEl = site.elements.get('player-name');
    await enterName(site, 'Player_Mot');
    assert.equal(nameEl.disabled, false, 'chưa đủ nhiệm vụ thì vẫn sửa được tên');
    await duBonNhiemVu(site);
    assert.equal(nameEl.disabled, true, 'đủ tên + 4/4 nhiệm vụ thì ô tên phải khoá');
    nameEl.value = 'Player_Hai';
    await nameEl.fire('input');
    assert.equal(nameEl.value, 'Player_Mot', 'ô đã khoá phải đẩy giá trị về tên đã lưu');
    assert.equal(site.store.get('taodepzai_player_name'), 'Player_Mot');
    await site.click('nut-giai-bai');
    const maMot = site.nhanKey();
    assert.equal(giaiMaKey(maMot).ten, 'Player_Mot');
    await site.click('back-btn');

    // Làm mới phiên: mở khoá tên, giữ tên cũ cho người dùng sửa lại.
    await site.click('nut-reset-thu-cong');
    assert.equal(nameEl.disabled, false, 'làm mới phiên phải mở khoá tên');
    await enterName(site, 'Player_Hai');
    assert.equal(nameEl.disabled, false, 'chưa làm lại nhiệm vụ thì chưa khoá');
    await duBonNhiemVu(site);
    assert.equal(nameEl.disabled, true);
    await site.click('nut-giai-bai');
    const maHai = site.nhanKey();
    assert.notEqual(maMot, maHai);
    assert.equal(giaiMaKey(maMot).ten, 'Player_Mot', 'key cũ vẫn đọc được tên cũ');
    assert.equal(giaiMaKey(maHai).ten, 'Player_Hai');
    await site.click('back-btn');

    // Hết phiên 3 phút: tự mở khoá, tên vẫn giữ.
    site.advance(160000 + 25000);
    assert.equal(nameEl.disabled, false, 'hết phiên phải mở khoá tên');
    assert.equal(site.store.get('taodepzai_player_name'), 'Player_Hai');

    // Trường hợp làm xong nhiệm vụ rồi mới nhập tên: chỉ khoá sau khi rời ô nhập (hoặc Enter).
    const site2 = createPortal();
    const name2 = site2.elements.get('player-name');
    await duBonNhiemVu(site2);
    assert.equal(name2.disabled, false, 'chưa có tên thì chưa khoá');
    assert.match(site2.elements.get('player-help').innerHTML, /khoá/, 'phải cảnh báo tên sẽ bị khoá');
    name2.focus();
    name2.value = 'NguoiMoi';
    await name2.fire('input');
    assert.equal(name2.disabled, false, 'đang gõ trong ô thì chưa khoá');
    await name2.fire('keydown', { key: 'Enter' });
    assert.equal(name2.disabled, true, 'bấm Enter (rời ô nhập) thì khoá tên');
    assert.equal(site2.store.get('taodepzai_player_name'), 'NguoiMoi');
});

test('bốn cặp key liên tiếp đều hợp lệ với bộ giải mã dùng chung thuật toán Luau', async () => {
    const crypto = require('node:crypto');
    const site = createPortal();
    await enterName(site, 'Test_Vong_Lap');
    await duBonNhiemVu(site);
    await site.click('nut-giai-bai');
    const maLanDau = site.nhanKey();
    for (const soQuay of [7, 128, 999, 0]) {
        site.store.set('taodepzai_so_quay', String(soQuay));
        site.store.set('taodepzai_nonce', crypto.randomBytes(16).toString('hex'));
        await site.click('back-btn');
        await site.click('nut-giai-bai');
        const tt = giaiMaKey(site.nhanKey());
        assert.equal(tt.soQuay, soQuay, `số quay ${soQuay} phải đọc lại đúng`);
        assert.equal(tt.ten, 'Test_Vong_Lap');
        assert.equal(tt.thietBi.length, 10);
        assert.equal(giaiMaDemo(site.nhanKey()).phienBan, 'Free_v5_');
    }
    // Key đầu tiên vẫn hợp lệ sau khi đổi nonce (tag phải đúng)
    assert.equal(giaiMaKey(maLanDau).ten, 'Test_Vong_Lap');
});

test('công cụ kiểm tra key mô phỏng đúng KiemTraKey của script.js', async () => {
    const { kiemTraKey, docCauHinh, thanMaThietBi } = require('../tools/kiem-tra-key.cjs');
    const cauHinh = docCauHinh();
    assert.equal(cauHinh.KEY_PREFIX, 'Free_v5_');
    assert.equal(cauHinh.HAN_KEY_GIAY, 24 * 60 * 60);

    const site = createPortal();
    await enterName(site, 'Player_01');
    await duBonNhiemVu(site);
    await site.click('nut-giai-bai');
    const ma = site.nhanKey();
    const bayGio = Math.floor(Number(site.store.get('completedAtnv4')) / 1000);

    const ok = kiemTraKey(ma, { cauHinh, tenRoblox: 'Player_01', bayGio });
    assert.equal(ok.ok, true);
    assert.equal(ok.conLai, cauHinh.HAN_KEY_GIAY);
    assert.equal(ok.thongTin.tuRoblox, false);

    const saiTen = kiemTraKey(ma, { cauHinh, tenRoblox: 'Nguoi_Khac', bayGio });
    assert.equal(saiTen.ok, false);
    assert.match(saiTen.loi, /không phải của tài khoản Nguoi_Khac/);
    assert.equal(kiemTraKey(ma, { cauHinh, tenRoblox: '  player_01  ', bayGio }).ok, true, 'tên so không phân biệt hoa thường');

    const hetHan = kiemTraKey(ma, { cauHinh, tenRoblox: 'Player_01', bayGio: bayGio + cauHinh.HAN_KEY_GIAY + 1 });
    assert.match(hetHan.loi, /hết hạn/);
    const tuongLai = kiemTraKey(ma, { cauHinh, tenRoblox: 'Player_01', bayGio: bayGio - 3600 });
    assert.match(tuongLai.loi, /tương lai/);

    // KIEM_TRA_THIET_BI: trong test trang không lấy được IP nên mã mạng là 0.0.0.0
    const cauHinhMang = { ...cauHinh, KIEM_TRA_THIET_BI: true };
    assert.equal(kiemTraKey(ma, {
        cauHinh: cauHinhMang, tenRoblox: 'Player_01', bayGio, maThietBiHienTai: thanMaThietBi('0.0.0.0')
    }).ok, true);
    assert.match(kiemTraKey(ma, {
        cauHinh: cauHinhMang, tenRoblox: 'Player_01', bayGio, maThietBiHienTai: thanMaThietBi('198.51.100.9')
    }).loi, /mạng khác/);

    // YEU_CAU_TEN_TU_ROBLOX: key gõ tay bị từ chối khi script bật cờ này
    assert.match(kiemTraKey(ma, {
        cauHinh: { ...cauHinh, YEU_CAU_TEN_TU_ROBLOX: true }, tenRoblox: 'Player_01', bayGio
    }).loi, /tên gõ tay/);

    // Key v2 cũ: chỉ được nhận khi còn bật CHAP_NHAN_KEY_V2 (và không có mã kiểm tra)
    const banRo = JSON.stringify(['Player_01', 'nv4', Number(site.store.get('completedAtnv4'))]);
    const maV2 = 'Free_v2_' + Buffer.from([...Buffer.from(banRo, 'utf8')]
        .map((b, i) => b ^ ((i * 73 + 0xA5) & 255))).toString('base64url');
    const cauHinhV2 = { ...cauHinh, CHAP_NHAN_KEY_V2: true, KIEM_TRA_THIET_BI: false };
    assert.equal(kiemTraKey(maV2, { cauHinh: cauHinhV2, tenRoblox: 'Player_01', bayGio }).ok, true);
    assert.match(kiemTraKey(maV2, { cauHinh: { ...cauHinhV2, CHAP_NHAN_KEY_V2: false }, tenRoblox: 'Player_01', bayGio }).loi,
        /cũ không còn dùng được/);
});

test('bốn nhiệm vụ xếp thành một cột từ trên xuống dưới ở mọi màn hình', () => {
    assert.equal((html.match(/<article class="task-placeholder"/g) || []).length, 4);
    assert.match(css, /\.main-container\s*\{[^}]*max-width:\s*460px;/);
    assert.match(css, /\.task-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    assert.doesNotMatch(css, /grid-template-columns:\s*repeat\(4|scroll-snap-type:|overflow-x:\s*auto/);
    assert.doesNotMatch(html, /scroll-hint/);
    assert.match(html, /class="logo-wrapper"/);
});
