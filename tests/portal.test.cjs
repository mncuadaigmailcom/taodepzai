process.env.TZ = 'Asia/Ho_Chi_Minh'; // giờ VN (UTC+7): bắt lỗi dùng giờ máy thay vì UTC trong chuỗi trộn
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextEncoder } = require('node:util');
const { execFileSync } = require('node:child_process');
const { giaiMaDemo, taoMaV4, maThietBiTuGoc, chuanHoaMaThietBi, chuoiTron } = require('../tools/decode-demo.cjs');

// IP mạng giả lập của điện thoại -> mã thiết bị (script Roblox tính ra cùng mã khi cùng IP)
const IP = '113.161.10.20';
const MA_TB = maThietBiTuGoc('ip:' + IP);
const THAN_TB = chuanHoaMaThietBi(MA_TB);

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.split('<script>')[1]?.split('</script>')[0];
assert.ok(script, 'Trang phải có JavaScript');

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
    select() { this.selected = true; }
    getClientRects() { return [{}]; }
    getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 200 }; }
}

function createPortal(sharedStore = new Map(), now = 1_000_000, tuyChon = {}) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    const elements = new Map(ids.map(id => [id, new Element(id)]));
    const docEvents = new Map();
    const windowEvents = new Map();
    const document = {
        activeElement: null,
        visibilityState: 'visible',
        body: { style: {} },
        getElementById: id => elements.get(id) || null,
        querySelectorAll: () => [elements.get('giao-dien-chinh'), ...[1,2,3,4].map(i => elements.get(`khung-nv${i}`))],
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
    const localStorage = {
        getItem: key => sharedStore.get(key) ?? null,
        setItem: (key, value) => sharedStore.set(key, String(value)),
        removeItem: key => sharedStore.delete(key)
    };
    class ClockDate extends Date { static now() { return clock.now; } }
    const replaced = [];
    const extra = {};
    if (tuyChon.search !== undefined) {
        extra.location = { search: tuyChon.search, pathname: '/taodepzai/', hash: '' };
        extra.history = { replaceState: (...args) => replaced.push(args) };
        extra.URLSearchParams = URLSearchParams;
    }
    if (tuyChon.crypto) extra.crypto = tuyChon.crypto;
    // fetch giả cho các nguồn lấy IP: ipState.ip = IP trả về (null = mất mạng), ipState.theoUrl = trả theo từng URL
    const fetchLog = [];
    const ipState = { ip: tuyChon.ip === undefined ? IP : tuyChon.ip, theoUrl: tuyChon.ipTheoUrl || null };
    extra.fetch = async url => {
        fetchLog.push(url);
        const kq = ipState.theoUrl ? ipState.theoUrl[url] : ipState.ip;
        if (kq === null || kq === undefined) throw new TypeError('Failed to fetch');
        return { ok: true, text: async () => kq + '\n' };
    };
    vm.runInNewContext(script, {
        ...extra,
        document, window, localStorage, Date: ClockDate, TextEncoder,
        btoa: binary => Buffer.from(binary, 'latin1').toString('base64'),
        navigator: { clipboard: { writeText: text => { copies.push(text); return Promise.resolve(); } } },
        setTimeout: (fn, ms) => schedule(fn, ms),
        clearTimeout: id => timers.delete(id),
        setInterval: (fn, ms) => schedule(fn, ms, true),
        clearInterval: id => timers.delete(id),
        console, Map
    });
    return {
        elements, copies, store: sharedStore, advance, replaced, fetchLog, ipState,
        flush: () => new Promise(resolve => setImmediate(resolve)),
        click: id => elements.get(id).fire('click'),
        blur: () => windowEvents.get('blur')(),
        focus: () => windowEvents.get('focus')(),
        status: i => sharedStore.get(`statusnv${i}`) || 'idle',
        modalOpen: () => elements.get('white-screen').classList.contains('show')
    };
}

async function completeTask(site, number) {
    await site.flush();
    await site.click(`link-nv${number}`);
    site.blur();
    site.advance(5000);
    site.focus();
    await site.flush();
}

async function enterName(site, name = 'HoiAnPlayer_09') {
    await site.flush(); // chờ trang tự lấy IP xong
    site.elements.get('player-name').value = name;
    await site.elements.get('player-name').fire('input');
}

test('chỉ tạo mã demo khi đã nhập tên và hoàn thành đủ bốn nhiệm vụ', async () => {
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
        assert.equal(site.elements.get('key-value').value, '');
    }

    await completeTask(site, 4);
    assert.equal(site.elements.get('unlocked-count').textContent, '4 / 4 hoàn thành');
    assert.equal(site.store.has('completedAtnv4'), true);
    assert.equal(button.disabled, true);
    assert.match(button.children.get('span').textContent, /Chưa nhập tên: chờ hết phiên/);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), false);

    // Xong 4 nhiệm vụ mà chưa nhập tên -> ô tên bị khoá, không mở được key
    const oTen = site.elements.get('player-name');
    const thongBaoKhoa = site.elements.get('name-lock');
    assert.equal(oTen.readOnly, true);
    assert.equal(thongBaoKhoa.hidden, false);
    assert.match(thongBaoKhoa.textContent, /chưa nhập tên/);
    await enterName(site);
    assert.equal(oTen.value, '', 'Không nhập được tên sau khi xong 4 nhiệm vụ');
    assert.equal(site.store.has('taodepzai_player_name'), false);
    assert.equal(button.disabled, true);

    // Hết thời gian phiên -> mở khoá ô tên, nhiệm vụ làm lại
    site.advance(3 * 60 * 1000);
    assert.equal(site.status(1), 'idle');
    assert.equal(oTen.readOnly, false);
    assert.equal(thongBaoKhoa.hidden, true);
    await enterName(site);
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    assert.equal(oTen.readOnly, true, 'Nhập tên rồi xong 4 nhiệm vụ -> tên bị khoá');
    assert.match(thongBaoKhoa.textContent, /Tên đã khoá/);
    assert.equal(button.disabled, false);
    assert.equal(site.elements.get('device-box'), undefined, 'Không còn khung / ô mã thiết bị');
    for (const [id, el] of site.elements) {
        assert.equal(String(el.textContent).includes(MA_TB), false, `#${id} không hiện mã thiết bị`);
        assert.equal(String(el.textContent).includes(IP), false, `#${id} không hiện IP`);
    }
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    const code = site.elements.get('key-value').value;
    assert.match(code, /^Free_v4_[A-Za-z0-9_-]+$/);
    assert.equal(code.includes('HoiAnPlayer_09'), false);
    assert.deepEqual(giaiMaDemo(code), {
        ten: 'HoiAnPlayer_09', nhiemVu: 'nv4', thoiDiem: Number(site.store.get('completedAtnv4')),
        soQuay: Number(site.store.get('taodepzai_so_quay')), thietBi: THAN_TB
    });
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

test('hết phiên 3 phút xóa mã demo và mốc hoàn thành; reset thủ công giữ tên', async () => {
    const site = createPortal();
    await enterName(site);
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    site.advance(160000); // 20 giây làm nhiệm vụ + 160 giây còn lại của phiên.
    for (const number of [1, 2, 3, 4]) {
        assert.equal(site.status(number), 'idle');
        assert.equal(site.store.has(`completedAtnv${number}`), false);
    }
    assert.equal(site.modalOpen(), false);
    assert.equal(site.elements.get('key-value').value, '');
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
    assert.equal(second.elements.get('player-name').value, 'HoiAnPlayer_09');
    await second.flush();
    assert.deepEqual(second.fetchLog, ['https://api.ipify.org']);
    assert.equal(storage.get('completedAtnv1'), firstTime);
    assert.equal(second.status(2), 'idle');
    assert.equal(second.elements.get('nut-giai-bai').disabled, true);
    for (const number of [2, 3, 4]) await completeTask(second, number);
    assert.equal(second.elements.get('nut-giai-bai').disabled, false);
    await second.click('nut-giai-bai');
    await second.click('copy-btn');
    assert.match(second.copies[0], /loadstring\(game:HttpGet/);
});

test('tên người chơi nằm trên nhiệm vụ, lưu sau F5 và hiển thị khi nhận mã demo', async () => {
    assert.ok(html.indexOf('id="player-name"') < html.indexOf('id="task-heading"'));
    const storage = new Map();
    const first = createPortal(storage);
    const name = first.elements.get('player-name');
    name.value = '  HoiAnPlayer_09  ';
    await name.fire('input');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');
    await first.click('nut-reset-thu-cong');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');

    const afterReload = createPortal(storage);
    assert.equal(afterReload.elements.get('player-name').value, 'HoiAnPlayer_09');
    for (const number of [1, 2, 3, 4]) await completeTask(afterReload, number);
    await afterReload.click('nut-giai-bai');
    const summary = afterReload.elements.get('player-summary');
    assert.equal(summary.textContent, 'Người chơi: HoiAnPlayer_09', 'Không hiện mã thiết bị');
    assert.equal(summary.hidden, false);
    assert.equal(afterReload.elements.get('player-details').open, false);
    const originalCode = afterReload.elements.get('key-value').value;
    afterReload.elements.get('player-details').open = true;
    await afterReload.click('back-btn');
    assert.equal(afterReload.elements.get('player-details').open, false);
    // Tên đã khoá: xoá hay đổi tên đều không được, key giữ nguyên
    afterReload.elements.get('player-name').value = '   ';
    await afterReload.elements.get('player-name').fire('input');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');
    assert.equal(afterReload.elements.get('player-name').value, 'HoiAnPlayer_09');
    await enterName(afterReload, 'AnotherPlayer');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');
    await afterReload.click('nut-giai-bai');
    assert.equal(summary.textContent, 'Người chơi: HoiAnPlayer_09');
    assert.equal(giaiMaDemo(afterReload.elements.get('key-value').value).ten, 'HoiAnPlayer_09');
    await afterReload.click('back-btn');
    // F5 vẫn khoá
    const f5 = createPortal(storage);
    assert.equal(f5.elements.get('player-name').readOnly, true);
    await enterName(f5, 'AnotherPlayer');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');
    // Đã lấy key: hết phiên / làm mới phiên vẫn KHÔNG đổi được tên
    afterReload.advance(3 * 60 * 1000);
    assert.equal(afterReload.status(1), 'idle', 'Phiên đã hết, nhiệm vụ làm lại');
    assert.equal(afterReload.elements.get('player-name').readOnly, true);
    assert.match(afterReload.elements.get('name-lock').textContent, /đã lấy key.*key hết hạn \(24 giờ\)/);
    await afterReload.click('nut-reset-thu-cong');
    await enterName(afterReload, 'AnotherPlayer');
    assert.equal(storage.get('taodepzai_player_name'), 'HoiAnPlayer_09');
    // Làm lại nhiệm vụ trong 24 giờ -> key mới vẫn đúng tên cũ
    for (const number of [1, 2, 3, 4]) await completeTask(afterReload, number);
    await afterReload.click('nut-giai-bai');
    assert.equal(giaiMaDemo(afterReload.elements.get('key-value').value).ten, 'HoiAnPlayer_09');
    await afterReload.click('back-btn');
    // Key hết hạn (24 giờ kể từ lúc xong nhiệm vụ của key đầu) -> đổi được tên
    const f5b = createPortal(storage, 1_000_000 + 23 * 60 * 60 * 1000);
    assert.equal(f5b.elements.get('player-name').readOnly, true, 'Trước 24 giờ vẫn khoá (kể cả F5)');
    afterReload.advance(24 * 60 * 60 * 1000);
    assert.equal(afterReload.elements.get('player-name').readOnly, false);
    assert.equal(storage.has('taodepzai_khoa_ten'), false);
    assert.equal(afterReload.elements.get('nut-giai-bai').disabled, true);
    await enterName(afterReload, 'AnotherPlayer');
    for (const number of [1, 2, 3, 4]) await completeTask(afterReload, number);
    await afterReload.click('nut-giai-bai');
    assert.equal(summary.textContent, 'Người chơi: AnotherPlayer');
    assert.notEqual(afterReload.elements.get('key-value').value, originalCode);
    assert.equal(giaiMaDemo(originalCode).ten, 'HoiAnPlayer_09');
    assert.equal(giaiMaDemo(afterReload.elements.get('key-value').value).ten, 'AnotherPlayer');
    await afterReload.click('back-btn');
});

test('mã Free_ dùng thời điểm nhiệm vụ hoàn thành cuối, ổn định sau F5 và đổi khi tạo phiên mới', async () => {
    const storage = new Map();
    const first = createPortal(storage);
    await enterName(first, 'Player_01');
    for (const number of [4, 1, 3, 2]) await completeTask(first, number);
    const lastTime = Number(storage.get('completedAtnv2'));
    for (const number of [4, 1, 3]) {
        assert.ok(lastTime > Number(storage.get(`completedAtnv${number}`)));
    }
    await first.click('nut-giai-bai');
    const originalCode = first.elements.get('key-value').value;
    assert.match(originalCode, /^Free_v4_[A-Za-z0-9_-]+$/);
    assert.equal(giaiMaDemo(originalCode).nhiemVu, 'nv2');
    assert.equal(giaiMaDemo(originalCode).thoiDiem, lastTime);

    const afterReload = createPortal(storage, 1_020_000);
    await afterReload.flush();
    await afterReload.click('nut-giai-bai');
    assert.equal(afterReload.elements.get('key-value').value, originalCode);
    await afterReload.click('back-btn');
    await afterReload.click('nut-reset-thu-cong');
    assert.equal(storage.has('completedAtnv2'), false);
    for (const number of [4, 1, 3, 2]) await completeTask(afterReload, number);
    await afterReload.click('nut-giai-bai');
    assert.notEqual(afterReload.elements.get('key-value').value, originalCode);
    assert.equal(giaiMaDemo(originalCode).thoiDiem, lastTime); // Reset không thu hồi mã đã sao chép.
});

test('giải lại đúng tên có dấu, chữ hoa và ký tự đặc biệt từ mã mà không lộ tên khi nhìn mã', async () => {
    const site = createPortal();
    const name = 'Nguyễn Thị Ánh 🍃 | Δ';
    await enterName(site, name);
    for (const number of [3, 2, 4, 1]) await completeTask(site, number);
    await site.click('nut-giai-bai');
    const code = site.elements.get('key-value').value;
    assert.equal(code.includes('Nguyễn'), false);
    assert.deepEqual(giaiMaDemo(code), {
        ten: name, nhiemVu: 'nv1', thoiDiem: Number(site.store.get('completedAtnv1')),
        soQuay: Number(site.store.get('taodepzai_so_quay')), thietBi: THAN_TB
    });
    const output = execFileSync(process.execPath, ['tools/decode-demo.cjs', code], {
        cwd: path.join(__dirname, '..'), encoding: 'utf8'
    });
    assert.match(output, /Nguyễn Thị Ánh 🍃 \| Δ/);
    assert.match(output, /nv1/);
    assert.match(output, /Số vòng quay: \d{3}/);
    assert.match(output, new RegExp(`Mã thiết bị: ${MA_TB}`));
});

test('không giả vờ giải được mã hash cũ hoặc mã v2 hỏng', () => {
    for (const code of ['Free_ABCDEFGH123456', 'Free_v2_ab c', 'Free_v2_abcd', 'Free_v2_##########']) {
        assert.throws(() => giaiMaDemo(code), /không hợp lệ|không thuộc bản/);
    }
});

test('phiên cũ không có mốc hoàn thành phải làm mới thay vì tạo mã sai', async () => {
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
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    assert.equal(site.elements.get('nut-giai-bai').disabled, false);
});

test('bốn nhiệm vụ xếp thành một cột từ trên xuống dưới ở mọi màn hình', () => {
    const css = html.split('<style>')[1].split('</style>')[0];
    assert.equal((html.match(/<article class="task-placeholder"/g) || []).length, 4);
    assert.match(css, /\.main-container\s*\{[^}]*max-width:\s*460px;/);
    assert.match(css, /\.task-grid\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    assert.doesNotMatch(css, /grid-template-columns:\s*repeat\(4|scroll-snap-type:|overflow-x:\s*auto/);
    assert.doesNotMatch(html, /scroll-hint/);
    assert.match(html, /class="logo-wrapper"/);
});

function reelDigits(site) {
    return [0, 1, 2].map(i => site.elements.get(`reel-${i}`).textContent).join('');
}

async function openKeyDialog(site, name = 'HoiAnPlayer_09') {
    await enterName(site, name);
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    return site.elements.get('key-value').value;
}

test('vòng quay 3 số: hiện đúng số trong mã, mỗi lần quay tạo key mới giải được', async () => {
    const site = createPortal();
    const first = await openKeyDialog(site);
    const so = site.store.get('taodepzai_so_quay');
    assert.match(so, /^\d{1,3}$/);
    assert.equal(reelDigits(site), so.padStart(3, '0'));
    assert.equal(giaiMaDemo(first).soQuay, Number(so));

    const codes = new Set([first]);
    for (let i = 0; i < 6; i++) {
        await site.click('spin-btn');
        assert.equal(site.elements.get('spin-btn').disabled, true, 'Đang quay thì khóa nút quay');
        assert.equal(site.elements.get('copy-key-btn').disabled, true, 'Đang quay thì không cho sao chép');
        site.advance(70 * 18);
        assert.equal(site.elements.get('spin-btn').disabled, false);
        assert.equal(site.elements.get('copy-key-btn').disabled, false);
        const code = site.elements.get('key-value').value;
        const soMoi = Number(site.store.get('taodepzai_so_quay'));
        assert.equal(reelDigits(site), String(soMoi).padStart(3, '0'));
        assert.deepEqual(giaiMaDemo(code), {
            ten: 'HoiAnPlayer_09', nhiemVu: 'nv4', thoiDiem: Number(site.store.get('completedAtnv4')), soQuay: soMoi,
            thietBi: THAN_TB
        });
        codes.add(code);
    }
    assert.equal(codes.size, 7, 'Mỗi lần quay (nonce mới) phải ra key khác, kể cả khi trùng số');
});

test('trùng số quay vẫn ra key mới vì mỗi lần quay đổi nonce', async () => {
    let dem = 0;
    const cryptoGia = {
        getRandomValues: a => {
            if (a.BYTES_PER_ELEMENT === 4) a[0] = 5; // số quay luôn là 005
            else for (let i = 0; i < a.length; i++) a[i] = (dem + i) & 255;
            dem++;
            return a;
        }
    };
    const site = createPortal(new Map(), 1_000_000, { crypto: cryptoGia });
    const codes = new Set([await openKeyDialog(site)]);
    for (let i = 0; i < 4; i++) {
        await site.click('spin-btn');
        site.advance(70 * 18);
        assert.equal(reelDigits(site), '005');
        codes.add(site.elements.get('key-value').value);
    }
    assert.equal(codes.size, 5);
});

test('số quay giữ sau F5, đổi khi làm mới phiên; đóng hộp thoại giữa chừng hủy lượt quay', async () => {
    const storage = new Map();
    const site = createPortal(storage);
    const code = await openKeyDialog(site);
    const so = storage.get('taodepzai_so_quay');

    const reload = createPortal(storage, 1_030_000);
    await reload.flush();
    await reload.click('nut-giai-bai');
    assert.equal(reload.elements.get('key-value').value, code);
    assert.equal(reelDigits(reload), so.padStart(3, '0'));

    await reload.click('spin-btn');
    reload.advance(140);
    await reload.click('back-btn');
    reload.advance(2000);
    assert.equal(storage.get('taodepzai_so_quay'), so, 'Hủy giữa chừng thì giữ số cũ');
    assert.equal(reload.elements.get('spin-btn').disabled, false);
    assert.equal(reload.elements.get('key-value').value, '');

    await reload.click('nut-reset-thu-cong');
    assert.equal(storage.has('taodepzai_so_quay'), false);
    assert.equal(storage.has('taodepzai_nonce'), false, 'Làm mới phiên thì đổi nonce');
});

test('mã v4 bị sửa một ký tự hoặc tự bịa đều bị từ chối', async () => {
    const site = createPortal();
    const code = await openKeyDialog(site);
    const bang = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let biTuChoi = 0;
    for (let vt = 'Free_v4_'.length; vt < code.length; vt++) {
        const moi = code.slice(0, vt) + bang[(bang.indexOf(code[vt]) + 17) % 64] + code.slice(vt + 1);
        try { giaiMaDemo(moi); } catch { biTuChoi++; }
    }
    assert.equal(biTuChoi, code.length - 'Free_v4_'.length);
    for (const fake of ['Free_v4_' + 'A'.repeat(70), 'Free_v4_' + code.slice(8).split('').reverse().join(''), code.slice(0, -2),
        'Free_v3_' + code.slice(8)]) {
        assert.throws(() => giaiMaDemo(fake), /không hợp lệ/);
    }
});

test('không hiện ngày giờ / hạn key ở bất kỳ đâu trên trang, key không chứa thông tin đọc được', async () => {
    const site = createPortal(new Map(), 1_790_000_012_345);
    const code = await openKeyDialog(site, 'TenBiMat_01');
    const t = Number(site.store.get('completedAtnv4'));
    const d = new Date(t);
    const hai = n => String(n).padStart(2, '0');
    const dauVet = [`${hai(d.getUTCDate())}/${hai(d.getUTCMonth() + 1)}`, `${d.getUTCFullYear()}`,
        `${hai(d.getUTCHours())}:${hai(d.getUTCMinutes())}`, 'hết hạn lúc', 'mili-giây'];
    for (const [id, el] of site.elements) {
        if (id === 'key-value') continue;
        for (const noiDung of [el.textContent, el.innerHTML ?? '', el.value]) {
            for (const x of dauVet) assert.equal(String(noiDung).includes(x), false, `#${id} lộ "${x}"`);
        }
    }
    // Mã nguồn trang không còn hàm nào định dạng ngày giờ để hiển thị
    // (ngày giờ ms chỉ được định dạng bên trong khối mã hoá để trộn vào chuỗi trộn, không hiển thị)
    const ngoaiKhoiMaHoa = script.slice(0, script.indexOf('// === MÃ HOÁ V4 BẮT ĐẦU')) +
        script.slice(script.indexOf('// === MÃ HOÁ V4 KẾT THÚC'));
    assert.doesNotMatch(ngoaiKhoiMaHoa, /getUTC|getDate\(|toLocale|toISOString|thanhPhanThoiGian|ngayGioUtc|chuoiTron/);
    const mix = html.match(/<p class="spin-mix" id="spin-mix">([\s\S]*?)<\/p>/)[1];
    assert.doesNotMatch(mix, /\d{1,2}\/\d{1,2}|\d{1,2}:\d{2}|\b(19|20)\d\d\b|<b>\d/);
    assert.match(mix, /HMAC-SHA256/);
    // Key: không chứa tên, mã thiết bị hay số thời điểm ở dạng đọc được
    for (const x of ['TenBiMat', THAN_TB, MA_TB, String(t), String(Math.floor(t / 1000))]) {
        assert.equal(code.includes(x), false, x);
    }
    assert.ok(code.length >= 8 + 66, 'Key v4 dài hơn (nonce 96 bit + tag 128 bit)');
    assert.equal(giaiMaDemo(code).thoiDiem, t);
});

test('mã mạng lấy ngầm theo IP; không lấy được IP vẫn tạo được key (mã mạng dự phòng), không hiện gì', async () => {
    const DU_PHONG = chuanHoaMaThietBi(maThietBiTuGoc('ip:0.0.0.0'));
    const site = createPortal(new Map(), 1_000_000, { ip: null });
    await enterName(site, 'Player_01');
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    const button = site.elements.get('nut-giai-bai');
    assert.deepEqual(site.fetchLog.slice(0, 3), ['https://api.ipify.org', 'https://ipv4.icanhazip.com', 'https://v4.ident.me'],
        'Thử lần lượt cả 3 nguồn IPv4');
    assert.equal(button.disabled, false, 'Mất mạng IP vẫn tạo được key');
    await site.click('nut-giai-bai');
    const code0 = site.elements.get('key-value').value;
    assert.equal(giaiMaDemo(code0).thietBi, DU_PHONG);
    await site.click('back-btn');

    // Có IP lại -> quay lại trang (sau 30 giây) -> key theo IP thật
    site.ipState.ip = IP;
    site.advance(31_000);
    site.focus();
    await site.flush();
    await site.click('nut-giai-bai');
    const code1 = site.elements.get('key-value').value;
    assert.equal(giaiMaDemo(code1).thietBi, THAN_TB);
    assert.equal(code1.includes(IP), false);
    for (const [id, el] of site.elements) {
        if (id === 'key-value') continue;
        assert.equal(String(el.textContent).includes(IP), false, `#${id} không hiện IP thật`);
        assert.equal(String(el.textContent).includes(MA_TB), false, `#${id} không hiện mã thiết bị`);
    }

    // Mất IP lần nữa -> giữ mã mạng đã có (không quay về dự phòng)
    site.ipState.ip = null;
    site.advance(31_000);
    site.focus();
    await site.flush();
    assert.equal(giaiMaDemo(site.elements.get('key-value').value).thietBi, THAN_TB);
});

test('nguồn IP đầu trả sai (IPv6 / rác) thì dùng nguồn sau; IP được chuẩn hoá giống script Roblox', async () => {
    const khoaCua = async ipTheoUrl => {
        const site = createPortal(new Map(), 1_000_000, { ipTheoUrl });
        await enterName(site);
        for (const number of [1, 2, 3, 4]) await completeTask(site, number);
        await site.click('nut-giai-bai');
        return giaiMaDemo(site.elements.get('key-value').value).thietBi;
    };
    assert.equal(await khoaCua({ 'https://api.ipify.org': '2402:800:6310::1', 'https://ipv4.icanhazip.com': ' 113.161.010.020 ' }),
        THAN_TB);
    const DU_PHONG = chuanHoaMaThietBi(maThietBiTuGoc('ip:0.0.0.0'));
    for (const sai of ['256.1.1.1', '1.2.3', '1.2.3.4.5', 'abc', '']) {
        assert.equal(await khoaCua({ 'https://api.ipify.org': sai, 'https://ipv4.icanhazip.com': sai, 'https://v4.ident.me': sai }),
            DU_PHONG, sai);
    }
});

test('chuỗi trộn: mã mạng + tên + ngày tháng năm giờ phút giây mili giây làm khoá con mã hoá key', async () => {
    const storage = new Map();
    const site = createPortal(storage, 1_790_000_012_345);
    const code = await openKeyDialog(site, 'Tester');
    const t = Number(storage.get('completedAtnv4'));
    const so = Number(storage.get('taodepzai_so_quay'));
    const nonce = Buffer.from(storage.get('taodepzai_nonce'), 'hex');
    const p = Buffer.concat([Buffer.from([4, so >> 8, so & 255]), Buffer.from([5, 4, 3, 2, 1, 0].map(k => Math.floor(t / 256 ** k) % 256)),
        Buffer.from([4]), Buffer.from(THAN_TB), Buffer.from('Tester')]);
    const d = new Date(t).toISOString().replace('T', ' ').replace('Z', '');
    assert.equal(chuoiTron(p).toString(), `tdz4|tron|${THAN_TB}|Tester|${d}|${String(so).padStart(3, '0')}`);
    assert.match(d, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}$/);
    // Cùng mọi thứ nhưng lệch 1 mili giây -> key khác hẳn (không chỉ khác vài ký tự)
    const lech = taoMaV4('Tester', 'nv4', t + 1, so, MA_TB, nonce);
    assert.equal(code, taoMaV4('Tester', 'nv4', t, so, MA_TB, nonce));
    const giong = [...code].filter((c, i) => c === lech[i]).length;
    assert.ok(giong < 8 + 16 + 12, `lệch 1 ms phải đổi tag + bản mã (giống ${giong} ký tự)`);
});

test('link "Lấy key" từ Roblox (?ten=...) tự điền tên rồi xoá khỏi thanh địa chỉ', async () => {
    const storage = new Map();
    const site = createPortal(storage, 1_000_000, { search: `?ten=${encodeURIComponent('Người chơi 01')}` });
    assert.equal(site.elements.get('player-name').value, 'Người chơi 01');
    assert.equal(site.replaced.length, 1);
    assert.equal(site.replaced[0][2], '/taodepzai/');
    const khong = createPortal(new Map(), 1_000_000, { search: '' });
    assert.equal(khong.replaced.length, 0);
});

test('key của trang giống hệt bộ tạo độc lập (node:crypto) khi cùng nonce; có crypto.getRandomValues thì dùng', async () => {
    let goi = 0;
    const webcrypto = { getRandomValues: a => { goi++; return require('node:crypto').webcrypto.getRandomValues(a); } };
    const storage = new Map();
    const site = createPortal(storage, 1_000_000, { crypto: webcrypto });
    const code = await openKeyDialog(site, '  Tên Có Dấu 🎮 ');
    assert.ok(goi >= 1, 'Nonce lấy từ crypto.getRandomValues');
    const nonce = Buffer.from(storage.get('taodepzai_nonce'), 'hex');
    assert.equal(nonce.length, 12);
    assert.equal(code, taoMaV4('Tên Có Dấu 🎮', 'nv4', Number(storage.get('completedAtnv4')),
        Number(storage.get('taodepzai_so_quay')), MA_TB, nonce));
});

test('HTML: không có khung / ô ID thiết bị, trang không nhắc IP hay mã mạng', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.doesNotMatch(html, /id="device-|placeholder="[^"]*thiết bị/i, 'Không có ô / khung ID');
    const body = html.slice(html.indexOf('<body'), html.indexOf('<script'));
    const chu = body.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(chu, /\bIP\b|mã mạng|mã thiết bị|mạng bạn đang dùng/i, 'Không nhắc tới IP / mã mạng');
});

test('khoá tên: link ?ten= từ Roblox không đổi được tên đã khoá; làm mới phiên thì mở khoá', async () => {
    const storage = new Map();
    const site = createPortal(storage, 1_000_000);
    await enterName(site, 'ChuKey');
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    assert.equal(site.elements.get('player-name').readOnly, true);
    const quaLink = createPortal(storage, 1_010_000, { search: '?ten=KeKhac' });
    assert.equal(quaLink.elements.get('player-name').value, 'ChuKey');
    assert.equal(storage.get('taodepzai_player_name'), 'ChuKey');
    await quaLink.click('nut-reset-thu-cong');
    assert.equal(quaLink.elements.get('player-name').readOnly, false);
    await enterName(quaLink, 'TenMoi');
    assert.equal(storage.get('taodepzai_player_name'), 'TenMoi');
    // Chưa xong đủ 4 nhiệm vụ thì vẫn sửa tên thoải mái
    for (const number of [1, 2, 3]) await completeTask(quaLink, number);
    assert.equal(quaLink.elements.get('player-name').readOnly, false);
    await enterName(quaLink, 'TenCuoi');
    await completeTask(quaLink, 4);
    assert.equal(quaLink.elements.get('player-name').readOnly, true);
    await quaLink.click('nut-giai-bai');
    assert.equal(giaiMaDemo(quaLink.elements.get('key-value').value).ten, 'TenCuoi');
});

test('khoá tên: mở lại trang khi phiên đã hết giờ (qua link ?ten=) thì tên không còn khoá', async () => {
    const storage = new Map();
    const site = createPortal(storage, 1_000_000);
    await enterName(site, 'ChuKey');
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    assert.equal(site.elements.get('player-name').readOnly, true);
    // Đóng trang, 5 phút sau mở lại bằng link "Lấy key" trong Roblox với tên khác
    const sau = createPortal(storage, 1_000_000 + 5 * 60 * 1000, { search: '?ten=TenMoi' });
    assert.equal(sau.elements.get('player-name').value, 'TenMoi');
    assert.equal(sau.elements.get('player-name').readOnly, false);
    assert.equal(storage.get('taodepzai_player_name'), 'TenMoi');
});

test('khoá tên sau khi lấy key: ?ten= khác, dữ liệu khoá hỏng / quá hạn, không lộ giờ hết hạn', async () => {
    const storage = new Map();
    const site = createPortal(storage, 1_790_000_000_000);
    await enterName(site, 'ChuKey');
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    site.advance(40_000); // mở key sau khi xong nhiệm vụ 40 giây
    await site.click('nut-giai-bai');
    const code = site.elements.get('key-value').value;
    const khoa = JSON.parse(storage.get('taodepzai_khoa_ten'));
    assert.equal(khoa.ten, 'ChuKey');
    assert.equal(khoa.den, giaiMaDemo(code).thoiDiem + 24 * 60 * 60 * 1000, 'Khoá đúng bằng hạn key');
    const text = site.elements.get('name-lock').textContent;
    assert.doesNotMatch(text, /\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}|giờ \d|\d+ phút/, 'Không lộ giờ hết hạn');
    // Không lúc nào ghi tên khác vào bộ nhớ (kể cả thoáng qua) khi tên đang khoá
    const daGhi = [];
    const setGoc = storage.set.bind(storage);
    storage.set = (k, v) => { if (k === 'taodepzai_player_name') daGhi.push(v); return setGoc(k, v); };
    await enterName(site, 'KeKhacGo');
    // Mở lại bằng link Roblox tên khác, sau khi phiên đã hết -> vẫn tên cũ
    const quaLink = createPortal(storage, 1_790_000_000_000 + 10 * 60 * 1000, { search: '?ten=KeKhac' });
    assert.equal(quaLink.elements.get('player-name').value, 'ChuKey');
    assert.equal(quaLink.elements.get('player-name').readOnly, true);
    assert.deepEqual(daGhi.filter(v => v !== 'ChuKey'), [], 'Không ghi tên khác vào bộ nhớ');
    storage.set = setGoc;
    // Xoá tên trong bộ nhớ (không xoá khoá) -> trang tự điền lại tên đã khoá
    storage.delete('taodepzai_player_name');
    const f5 = createPortal(storage, 1_790_000_000_000 + 20 * 60 * 1000);
    await f5.flush();
    assert.equal(f5.elements.get('player-name').value, 'ChuKey');
    // Dữ liệu khoá hỏng hoặc hạn quá xa (bị sửa tay) -> bỏ qua
    for (const hong of ['{', '{"ten":"","den":9e15}', JSON.stringify({ ten: 'X', den: 1_790_000_000_000 + 9 * 86400000 })]) {
        const m = new Map([['taodepzai_khoa_ten', hong]]);
        const s2 = createPortal(m, 1_790_000_000_000);
        assert.equal(s2.elements.get('player-name').readOnly, false, hong);
        assert.equal(m.has('taodepzai_khoa_ten'), false, hong);
    }
});
