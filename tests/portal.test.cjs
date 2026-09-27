const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

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
        document, window, localStorage, Date: ClockDate,
        navigator: { clipboard: { writeText: text => { copies.push(text); return Promise.resolve(); } } },
        setTimeout: (fn, ms) => schedule(fn, ms),
        clearTimeout: id => timers.delete(id),
        setInterval: (fn, ms) => schedule(fn, ms, true),
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

test('một cổng đủ lấy key; quay lại sớm chỉ báo lỗi cổng đó', async () => {
    const site = createPortal();
    const button = site.elements.get('nut-giai-bai');
    assert.equal(button.disabled, true);
    await site.click('link-nv1');
    site.blur();
    site.advance(2000);
    site.focus();
    assert.equal(site.status(1), 'error');
    assert.equal(site.status(2), 'idle');
    site.advance(2500);
    assert.equal(site.status(1), 'idle');

    await site.click('link-nv2');
    site.blur();
    site.advance(5000);
    site.focus();
    assert.equal(site.status(1), 'idle');
    assert.equal(site.status(2), 'success');
    assert.equal(site.status(3), 'idle');
    assert.equal(button.disabled, false);
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    assert.equal(site.elements.get('key-value').value, 'TAODEPZAI-KEY-MAU');
    await site.click('copy-key-btn');
    assert.deepEqual(site.copies, ['TAODEPZAI-KEY-MAU']);
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
    assert.equal(site.elements.get('nut-giai-bai').disabled, false);
});

test('đồng hồ 3 phút tự reset và nút reset thủ công vẫn hoạt động', async () => {
    const site = createPortal();
    await site.click('link-nv4');
    site.blur();
    site.advance(5000);
    site.focus();
    await site.click('nut-giai-bai');
    assert.equal(site.modalOpen(), true);
    site.advance(175000);
    assert.equal(site.status(4), 'idle');
    assert.equal(site.modalOpen(), false);
    assert.equal(site.elements.get('nut-giai-bai').disabled, true);
    assert.equal(site.elements.get('countdown-text').textContent, 'Phiên chưa bắt đầu');
    await site.click('link-nv1');
    await site.click('nut-reset-thu-cong');
    assert.equal(site.status(1), 'idle');
    assert.equal(site.store.has('session_expire'), false);
});

test('F5 khôi phục thành công từng cổng trong phiên và giữ chức năng copy script', async () => {
    const storage = new Map();
    const first = createPortal(storage);
    await first.click('link-nv1');
    first.blur();
    first.advance(5000);
    first.focus();
    assert.equal(first.status(1), 'success');
    const second = createPortal(storage, 1_005_000);
    assert.equal(second.status(1), 'success');
    assert.equal(second.status(2), 'idle');
    assert.equal(second.elements.get('nut-giai-bai').disabled, false);
    await second.click('nut-giai-bai');
    await second.click('copy-btn');
    assert.match(second.copies[0], /loadstring\(game:HttpGet/);
});

test('bốn cổng nằm cùng một hàng và có thể vuốt ngang trên màn hình nhỏ', () => {
    assert.equal((html.match(/<article class="task-placeholder"/g) || []).length, 4);
    assert.match(html, /\.task-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(html, /@media \(max-width: 1000px\)\s*\{\s*\.task-grid\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*nowrap;[^}]*overflow-x:\s*auto;/);
    assert.match(html, /class="logo-wrapper"/);
});
