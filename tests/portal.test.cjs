const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { TextEncoder } = require('node:util');
const { execFileSync } = require('node:child_process');
const { giaiMaDemo } = require('../tools/decode-demo.cjs');

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

function createPortal(sharedStore = new Map(), now = 1_000_000) {
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
    vm.runInNewContext(script, {
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
        elements, copies, store: sharedStore, advance,
        click: id => elements.get(id).fire('click'),
        blur: () => windowEvents.get('blur')(),
        focus: () => windowEvents.get('focus')(),
        status: i => sharedStore.get(`statusnv${i}`) || 'idle',
        modalOpen: () => elements.get('white-screen').classList.contains('show')
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
    assert.match(button.children.get('span').textContent, /Nhập tên người chơi/);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), false);

    await enterName(site);
    assert.equal(button.disabled, false);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    const code = site.elements.get('key-value').value;
    assert.match(code, /^Free_v3_[A-Za-z0-9_-]+$/);
    assert.equal(code.includes('HoiAnPlayer_09'), false);
    assert.deepEqual(giaiMaDemo(code), {
        ten: 'HoiAnPlayer_09', nhiemVu: 'nv4', thoiDiem: Number(site.store.get('completedAtnv4')),
        soQuay: Number(site.store.get('taodepzai_so_quay'))
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
    assert.equal(summary.textContent, 'Người chơi: HoiAnPlayer_09');
    assert.equal(summary.hidden, false);
    assert.equal(afterReload.elements.get('player-details').open, false);
    const originalCode = afterReload.elements.get('key-value').value;
    afterReload.elements.get('player-details').open = true;
    await afterReload.click('back-btn');
    assert.equal(afterReload.elements.get('player-details').open, false);
    afterReload.elements.get('player-name').value = '   ';
    await afterReload.elements.get('player-name').fire('input');
    assert.equal(storage.has('taodepzai_player_name'), false);
    assert.equal(afterReload.elements.get('nut-giai-bai').disabled, true);
    await afterReload.click('nut-giai-bai');
    assert.equal(afterReload.modalOpen(), false);
    await enterName(afterReload, 'AnotherPlayer');
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
    assert.match(originalCode, /^Free_v3_[A-Za-z0-9_-]+$/);
    assert.equal(giaiMaDemo(originalCode).nhiemVu, 'nv2');
    assert.equal(giaiMaDemo(originalCode).thoiDiem, lastTime);

    const afterReload = createPortal(storage, 1_020_000);
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
        soQuay: Number(site.store.get('taodepzai_so_quay'))
    });
    const output = execFileSync(process.execPath, ['tools/decode-demo.cjs', code], {
        cwd: path.join(__dirname, '..'), encoding: 'utf8'
    });
    assert.match(output, /Nguyễn Thị Ánh 🍃 \| Δ/);
    assert.match(output, /nv1/);
    assert.match(output, /Số vòng quay: \d{3}/);
    assert.match(output, /có thể bị giả mạo/);
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
            ten: 'HoiAnPlayer_09', nhiemVu: 'nv4', thoiDiem: Number(site.store.get('completedAtnv4')), soQuay: soMoi
        });
        codes.add(code);
    }
    assert.ok(codes.size >= 5, 'Quay nhiều lần phải ra nhiều key khác nhau');
});

test('số quay giữ sau F5, đổi khi làm mới phiên; đóng hộp thoại giữa chừng hủy lượt quay', async () => {
    const storage = new Map();
    const site = createPortal(storage);
    const code = await openKeyDialog(site);
    const so = storage.get('taodepzai_so_quay');

    const reload = createPortal(storage, 1_030_000);
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
});

test('mã v3 bị sửa một ký tự hoặc tự bịa đều bị từ chối', async () => {
    const site = createPortal();
    const code = await openKeyDialog(site);
    const bang = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let biTuChoi = 0;
    for (let vt = 'Free_v3_'.length; vt < code.length; vt++) {
        const moi = code.slice(0, vt) + bang[(bang.indexOf(code[vt]) + 17) % 64] + code.slice(vt + 1);
        try { giaiMaDemo(moi); } catch { biTuChoi++; }
    }
    assert.equal(biTuChoi, code.length - 'Free_v3_'.length);
    for (const fake of ['Free_v3_AAAAAAAAAAAAAAAAAAAA', 'Free_v3_' + code.slice(8).split('').reverse().join('')]) {
        assert.throws(() => giaiMaDemo(fake), /không hợp lệ/);
    }
});
