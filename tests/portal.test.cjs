process.env.TZ = 'Asia/Ho_Chi_Minh'; // giờ VN (UTC+7): bắt lỗi dùng giờ máy thay vì UTC trong chuỗi trộn
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextEncoder, TextDecoder } = require('node:util');
const { execFileSync } = require('node:child_process');
const { giaiMaDemo, taoMaV5, maThietBiTuGoc, chuanHoaMaThietBi, chuoiTron5, taoMaTen, giaiMaTen } = require('../tools/decode-demo.cjs');

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
    const clipboardDoc = []; // mỗi lần trang đọc bộ nhớ tạm
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
        const goc = tuyChon.goc || 'https://mncuadaigmailcom.github.io/taodepzai/';
        extra.location = { search: tuyChon.search, pathname: new URL(goc).pathname, hash: '', href: goc + tuyChon.search };
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
        document, window, localStorage, Date: ClockDate, TextEncoder, TextDecoder,
        btoa: binary => Buffer.from(binary, 'latin1').toString('base64'),
        atob: b64 => {
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64) || b64.length % 4) throw new Error('InvalidCharacterError');
            return Buffer.from(b64, 'base64').toString('latin1');
        },
        navigator: { permissions: { query: async ({ name }) => {
            if (name !== 'clipboard-read' || !tuyChon.quyenClipboard) throw new TypeError('not supported');
            return { state: tuyChon.quyenClipboard };
        } }, clipboard: {
            writeText: text => { copies.push(text); return Promise.resolve(); },
            readText: () => {
                clipboardDoc.push(tuyChon.docClipboard);
                return tuyChon.docClipboard === undefined ? Promise.reject(new Error('NotAllowedError'))
                    : Promise.resolve(tuyChon.docClipboard);
            },
        } },
        setTimeout: (fn, ms) => schedule(fn, ms),
        clearTimeout: id => timers.delete(id),
        setInterval: (fn, ms) => schedule(fn, ms, true),
        clearInterval: id => timers.delete(id),
        console, Map
    });
    return {
        elements, copies, store: sharedStore, advance, replaced, fetchLog, ipState, clipboardDoc,
        datClipboard: text => { tuyChon.docClipboard = text; },
        chamTrang: () => docEvents.get('click') && docEvents.get('click')({}),
        anTrang: () => { document.visibilityState = 'hidden'; docEvents.get('visibilitychange')(); },
        hienTrang: () => { document.visibilityState = 'visible'; docEvents.get('visibilitychange')(); },
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
    assert.match(code, /^Free_v5_[A-Za-z0-9_-]+$/);
    assert.equal(code.includes('HoiAnPlayer_09'), false);
    assert.deepEqual(giaiMaDemo(code), {
        ten: 'HoiAnPlayer_09', nhiemVu: 'nv4', thoiDiem: Number(site.store.get('completedAtnv4')),
        soQuay: Number(site.store.get('taodepzai_so_quay')), thietBi: THAN_TB, phienBan: 5, tuRoblox: false
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
    assert.match(originalCode, /^Free_v5_[A-Za-z0-9_-]+$/);
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
        soQuay: Number(site.store.get('taodepzai_so_quay')), thietBi: THAN_TB, phienBan: 5, tuRoblox: false
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
            thietBi: THAN_TB, phienBan: 5, tuRoblox: false
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

test('mã v5 bị sửa một ký tự hoặc tự bịa đều bị từ chối', async () => {
    const site = createPortal();
    const code = await openKeyDialog(site);
    const bang = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let biTuChoi = 0;
    for (let vt = 'Free_v5_'.length; vt < code.length; vt++) {
        const moi = code.slice(0, vt) + bang[(bang.indexOf(code[vt]) + 17) % 64] + code.slice(vt + 1);
        try { giaiMaDemo(moi); } catch { biTuChoi++; }
    }
    assert.equal(biTuChoi, code.length - 'Free_v5_'.length);
    for (const fake of ['Free_v5_' + 'A'.repeat(70), 'Free_v5_' + code.slice(8).split('').reverse().join(''), code.slice(0, -2),
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
    assert.ok(code.length >= 8 + 100, 'Key v5 dài hơn (nonce 128 bit + tag 256 bit)');
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
    const p = Buffer.concat([Buffer.from([5, 0, so >> 8, so & 255]), Buffer.from([5, 4, 3, 2, 1, 0].map(k => Math.floor(t / 256 ** k) % 256)),
        Buffer.from([4]), Buffer.from(THAN_TB), Buffer.from('Tester')]);
    const d = new Date(t).toISOString().replace('T', ' ').replace('Z', '');
    assert.equal(chuoiTron5(p).toString(), `tdz5|tron|${THAN_TB}|Tester|${d}|${String(so).padStart(3, '0')}|0`);
    assert.match(d, /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}$/);
    // Cùng mọi thứ nhưng lệch 1 mili giây -> key khác hẳn (không chỉ khác vài ký tự)
    const lech = taoMaV5('Tester', 'nv4', t + 1, so, MA_TB, false, nonce);
    assert.equal(code, taoMaV5('Tester', 'nv4', t, so, MA_TB, false, nonce));
    const giong = [...code].filter((c, i) => c === lech[i]).length;
    assert.ok(giong < 8 + 21 + 12, `lệch 1 ms phải đổi tag + bản mã (giống ${giong} ký tự)`);
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
    assert.equal(nonce.length, 16);
    assert.equal(code, taoMaV5('Tên Có Dấu 🎮', 'nv4', Number(storage.get('completedAtnv4')),
        Number(storage.get('taodepzai_so_quay')), MA_TB, false, nonce));
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

const hienTen = site => {
    assert.notEqual(site.elements.get('name-section').hidden, true, 'Phần nhập tên luôn hiện');
    return site.elements.get('player-name').value;
};

test('link ?mahoa= (và ?tk= cũ): giải mã ra tên, ô nhập tên hiện đúng tên đó, sửa được đến khi xong nhiệm vụ', async () => {
    for (const thamSo of ['mahoa', 'tk']) {
        const storage = new Map();
        const tk = taoMaTen('RobloxUser_77');
        assert.equal(tk.includes('RobloxUser'), false);
        const site = createPortal(storage, 1_000_000, { search: `?${thamSo}=${tk}` });
        assert.equal(site.replaced.length, 1, 'Xoá tham số khỏi thanh địa chỉ');
        assert.equal(hienTen(site), 'RobloxUser_77', 'Ô tên hiện tên giải được');
        assert.equal(site.elements.get('player-name').readOnly, false, 'Chưa xong nhiệm vụ thì sửa được');
        assert.match(site.elements.get('notification-box').textContent, /Đã tự nhập tên người chơi: RobloxUser_77/);
        assert.match(site.elements.get('name-auto').textContent, /tự nhập từ link lấy key của Roblox/);
        // Sửa tên -> không còn là tên từ Roblox
        await enterName(site, 'RobloxUser_78');
        assert.equal(storage.get('taodepzai_player_name'), 'RobloxUser_78');
        assert.equal(site.elements.get('name-auto').hidden, true);
    }
    // Không sửa: xong 4 nhiệm vụ -> khoá tên; key Free_v5_ có tên + cờ tên từ Roblox; hộp thoại hiện tên
    const storage = new Map();
    const site = createPortal(storage, 1_000_000, { search: `?mahoa=${taoMaTen('RobloxUser_77')}` });
    for (const number of [1, 2, 3, 4]) await completeTask(site, number);
    assert.equal(site.elements.get('player-name').readOnly, true, 'Xong nhiệm vụ thì không sửa tên được');
    await enterName(site, 'DoiTen');
    assert.equal(hienTen(site), 'RobloxUser_77');
    await site.click('nut-giai-bai');
    const kq = giaiMaDemo(site.elements.get('key-value').value);
    assert.equal(kq.ten, 'RobloxUser_77');
    assert.equal(kq.tuRoblox, true);
    assert.equal(site.elements.get('player-summary').textContent, 'Người chơi: RobloxUser_77 ✓ (từ Roblox)');
    await site.click('back-btn');
    // F5: vẫn hiện tên
    assert.equal(hienTen(createPortal(storage, 1_020_000)), 'RobloxUser_77');
    // Đã lấy key -> link tên khác bị bỏ qua, báo lỗi
    const khac = createPortal(storage, 1_030_000, { search: `?mahoa=${taoMaTen('NguoiKhac')}` });
    assert.equal(hienTen(khac), 'RobloxUser_77');
    assert.match(khac.elements.get('notification-box').textContent, /tên khác/);
    // Tên gõ tay -> cờ = 0
    const tay = createPortal(new Map(), 1_000_000, { search: '' });
    assert.equal(giaiMaDemo(await openKeyDialog(tay, 'GoTay')).tuRoblox, false);
});

test('link ?mahoa= sai (bị sửa / bịa / tên không hợp lệ) thì không điền tên và báo lỗi', async () => {
    const tk = taoMaTen('RobloxUser_77');
    const sai = [tk.slice(0, 12) + (tk[12] === 'A' ? 'B' : 'A') + tk.slice(13), tk.slice(0, -1), 'abc', tk + 'AAAA',
        '', 'RobloxUser_77', taoMaTen(' coKhoangTrang'), taoMaTen('x'.repeat(33)),
        taoMaTen('KeGiaMao', Buffer.alloc(8, 9), Buffer.alloc(12, 1))]; // mã hoá đúng nhưng tag giả
    for (const x of sai) {
        const storage = new Map([['taodepzai_player_name', 'TenCu']]);
        const site = createPortal(storage, 1_000_000, { search: `?mahoa=${encodeURIComponent(x)}` });
        assert.equal(storage.get('taodepzai_player_name'), 'TenCu', x);
        assert.equal(hienTen(site), 'TenCu', x);
        assert.equal(site.elements.get('name-auto').hidden, true, x);
        assert.match(site.elements.get('notification-box').textContent, /không hợp lệ/, x);
    }
});

test('tự dán link vừa sao chép từ script (chạy ngầm, không có nút) rồi hiện tên trong ô tên', async () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    assert.doesNotMatch(html, /nut-dan-ten|Dán tên mã hoá/, 'Không còn nút dán: tính năng chạy ngầm');
    const tk = taoMaTen('RobloxUser_77');
    const link = `https://mncuadaigmailcom.github.io/taodepzai/?mahoa=${tk}`;
    // 1) Trình duyệt đã cho quyền đọc bộ nhớ tạm -> mở trang là tự điền, không cần chạm
    {
        const storage = new Map();
        const site = createPortal(storage, 1_000_000, { search: '', docClipboard: link, quyenClipboard: 'granted' });
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'RobloxUser_77');
        assert.equal(storage.get('taodepzai_player_name'), 'RobloxUser_77');
        assert.match(site.elements.get('notification-box').textContent, /Đã tự nhập tên người chơi: RobloxUser_77/);
        assert.equal(site.elements.get('name-auto').hidden, false, 'Đánh dấu tên từ Roblox (cờ trong key v5)');
        // Sửa tên rồi quay lại trang: cùng link cũ trong bộ nhớ tạm không được điền đè
        await enterName(site, 'TenDaSua');
        site.anTrang(); site.hienTrang(); site.focus();
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'TenDaSua', 'Mỗi link chỉ tự điền 1 lần');
        // Sang Roblox lấy link mới (tên khác) rồi quay lại trang -> tự điền tên mới
        site.datClipboard(`${link.split('?')[0]}?mahoa=${taoMaTen('AccThu2')}`);
        site.anTrang(); site.hienTrang();
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'AccThu2');
        // F5 với cùng link trong bộ nhớ tạm: không đè
        await enterName(site, 'TenDaSua2');
        const f5 = createPortal(storage, 1_010_000, { search: '', docClipboard: site.clipboardDoc.at(-1), quyenClipboard: 'granted' });
        await f5.flush(); await f5.flush();
        assert.equal(hienTen(f5), 'TenDaSua2');
    }
    // 2) Chưa cho quyền -> không tự đọc khi mở trang; chạm vào trang lần đầu thì thử đọc (trình duyệt hỏi / hiện nút Dán)
    {
        const storage = new Map();
        const site = createPortal(storage, 1_000_000, { search: '', docClipboard: link, quyenClipboard: 'prompt' });
        await site.flush(); await site.flush();
        assert.equal(site.clipboardDoc.length, 0, 'Chưa có quyền thì không đọc khi mở trang');
        site.focus(); site.anTrang(); site.hienTrang();
        await site.flush();
        assert.equal(site.clipboardDoc.length, 0, 'Không có quyền thì không đọc khi quay lại trang');
        site.chamTrang();
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'RobloxUser_77');
        site.chamTrang();
        await site.flush();
        assert.equal(site.clipboardDoc.length, 1, 'Chỉ thử 1 lần khi chạm');
    }
    // 3) Chạm vào ô tên cũng thử đọc (1 lần)
    {
        const site = createPortal(new Map(), 1_000_000, { search: '', docClipboard: link });
        await site.elements.get('player-name').fire('focus');
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'RobloxUser_77');
    }
    // 4) Bị chặn / bộ nhớ tạm là chữ khác / link sai: im lặng, không đổi tên, không báo lỗi
    for (const noiDung of [undefined, 'xin chào', 'Free_v5_' + 'A'.repeat(90), `${link.slice(0, -3)}AAA`]) {
        const storage = new Map([['taodepzai_player_name', 'TenCu']]);
        const site = createPortal(storage, 1_000_000, { search: '', docClipboard: noiDung, quyenClipboard: 'granted' });
        await site.flush(); await site.flush();
        site.chamTrang();
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'TenCu', String(noiDung));
        assert.doesNotMatch(site.elements.get('notification-box').textContent, /không hợp lệ/, String(noiDung));
    }
    // 6) Mở bằng link ?mahoa= (link đó cũng đang trong bộ nhớ tạm), sửa tên -> quay lại trang không bị điền đè
    {
        const storage = new Map();
        const site = createPortal(storage, 1_000_000, { search: `?mahoa=${tk}`, docClipboard: link, quyenClipboard: 'prompt' });
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'RobloxUser_77');
        await enterName(site, 'TenSua');
        site.chamTrang(); // chạm trang -> đọc bộ nhớ tạm (cùng link đã mở) -> không đè tên đã sửa
        await site.flush(); await site.flush();
        assert.equal(site.clipboardDoc.length, 1);
        assert.equal(hienTen(site), 'TenSua');
    }
    // 5) Tên đang khoá (xong 4 nhiệm vụ) -> link tên khác không đổi được, có báo
    {
        const storage = new Map();
        const site = createPortal(storage, 1_000_000, { search: '' });
        await enterName(site, 'ChuKey');
        for (const number of [1, 2, 3, 4]) await completeTask(site, number);
        site.datClipboard(link);
        site.chamTrang();
        await site.flush(); await site.flush();
        assert.equal(hienTen(site), 'ChuKey');
        assert.match(site.elements.get('notification-box').textContent, /khoá/);
    }
});

test('dán link / tên mã hoá vào ô tên bằng tay: hợp lệ thì ô tên hiện tên giải được', async () => {
    const tk = taoMaTen('RobloxUser_77');
    const link = `https://mncuadaigmailcom.github.io/taodepzai/?mahoa=${tk}`;
    for (const dan of [tk, link, `  ${link}  `, link.replace('?mahoa=', '?tk=')]) {
        const storage = new Map([['taodepzai_tk_da_dung', tk]]); // dán tay thì vẫn nhận kể cả link đã dùng
        const site = createPortal(storage, 1_000_000, { search: '' });
        await enterName(site, dan);
        assert.equal(storage.get('taodepzai_player_name'), 'RobloxUser_77', dan);
        assert.equal(hienTen(site), 'RobloxUser_77');
    }
    for (const sai of [tk.slice(0, 12) + (tk[12] === 'A' ? 'B' : 'A') + tk.slice(13), `${link.slice(0, -2)}xx`,
        taoMaTen('KeGiaMao', Buffer.alloc(8, 9), Buffer.alloc(12, 1))]) {
        const storage = new Map([['taodepzai_player_name', 'TenCu']]);
        const site = createPortal(storage, 1_000_000, { search: '' });
        await enterName(site, sai);
        assert.equal(hienTen(site), 'TenCu', sai);
        assert.match(site.elements.get('notification-box').textContent, /không hợp lệ/);
    }
    const thuong = createPortal(new Map(), 1_000_000, { search: '' });
    await enterName(thuong, 'Tao Dep Zai');
    assert.equal(hienTen(thuong), 'Tao Dep Zai');
    await enterName(thuong, 'a b'.repeat(20));
    assert.equal(thuong.elements.get('player-name').value.length, 32);
});

test('trang tự biết link của chính mình: "Link lấy key của bạn" = địa chỉ trang + ?mahoa=<tên mã hoá>', async () => {
    for (const goc of ['https://mncuadaigmailcom.github.io/taodepzai/',
        'https://raw.githack.com/mncuadaigmailcom/taodepzai/arena/01a0e126-taodepzai/index.html']) {
        const storage = new Map();
        const site = createPortal(storage, 1_000_000, { search: '', goc });
        assert.equal(site.elements.get('my-link-box').hidden, true, 'Chưa có tên thì chưa có link');
        await enterName(site, 'Tao Dep 01');
        assert.equal(site.elements.get('my-link-box').hidden, false);
        const link = site.elements.get('my-link').value;
        assert.ok(link.startsWith(`${goc}?mahoa=`), link);
        assert.equal(link.includes('Tao'), false, 'Link không lộ tên');
        assert.equal(giaiMaTen(link.split('?mahoa=')[1]), 'Tao Dep 01');
        await enterName(site, 'Tao Dep 01');
        await completeTask(site, 1);
        site.advance(5000);
        assert.equal(site.elements.get('my-link').value, link, 'Vẽ lại không đổi link');
        await site.click('copy-my-link');
        assert.deepEqual(site.copies, [link]);
        await enterName(site, 'TenKhac');
        const link2 = site.elements.get('my-link').value;
        assert.notEqual(link2, link);
        const moi = createPortal(new Map(), 1_000_000, { search: link2.slice(goc.length), goc });
        assert.equal(hienTen(moi), 'TenKhac');
        assert.equal(moi.elements.get('my-link-box').hidden, false);
    }
});
