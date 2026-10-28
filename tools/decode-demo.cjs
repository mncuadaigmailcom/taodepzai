#!/usr/bin/env node
// Đọc thông tin trong key Free_v5_ (LOẠI KEY DUY NHẤT) do index.html tạo ra.
// Áp dụng ĐÚNG thuật toán của GiaiMaMoi trong key-system.lua, NHƯNG KHÔNG chứng minh
// người chơi đã làm nhiệm vụ: ai đọc mã nguồn cũng tự tạo được key.
'use strict';
const crypto = require('node:crypto');

const BI_MAT = Buffer.from('z!V~~RO3mS2dCMvW-GE@#v2XYYuLsNoQKS5U0pGeAY5EOkd_', 'utf8');
const BANG_THIET_BI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32, khớp key-system.lua
const CAU_TRUC = { 5: { nonce: 16, tag: 32, lech: 1, nhan: 'tdz5' } };
const MAX_TEN_UTF16 = 32;
const INVALID = 'Key không hợp lệ (bị sửa, thiếu ký tự hoặc không thuộc bản này).';

function hmac(khoa, thongDiep) { return crypto.createHmac('sha256', khoa).update(thongDiep).digest(); }

function giaiBase64Url(chuoi) {
    if (!/^[A-Za-z0-9_-]*$/.test(chuoi) || chuoi.length % 4 === 1) return null;
    const ds = Buffer.from(chuoi, 'base64url');
    return ds.toString('base64url') === chuoi ? ds : null;
}

function ngayGioUtc(ms) {
    const d = new Date(ms);
    const so = (n, dai = 2) => String(n).padStart(dai, '0');
    return `${so(d.getUTCFullYear(), 4)}-${so(d.getUTCMonth() + 1)}-${so(d.getUTCDate())} ` +
        `${so(d.getUTCHours())}:${so(d.getUTCMinutes())}:${so(d.getUTCSeconds())}.${so(d.getUTCMilliseconds(), 3)}`;
}

function layBit(dsByte, tu, so) {
    let v = 0;
    for (let i = tu; i < tu + so; i++) v = v * 2 + ((dsByte[i >> 3] >> (7 - (i & 7))) & 1);
    return v;
}

function kyTuKiemTraThietBi(than) {
    const h = crypto.createHash('sha256').update(Buffer.from('taodepzai|kiem-tra|' + than, 'utf8')).digest();
    return BANG_THIET_BI[layBit(h, 0, 5)] + BANG_THIET_BI[layBit(h, 5, 5)];
}

function chuoiTron(p) {
    const soQuay = p[2] * 256 + p[3];
    let ms = 0;
    for (let i = 4; i <= 9; i++) ms = ms * 256 + p[i];
    return Buffer.concat([
        Buffer.from('tdz5|tron|', 'utf8'), p.subarray(11, 21), Buffer.from('|', 'latin1'),
        p.subarray(21), Buffer.from(`|${ngayGioUtc(ms)}|${String(soQuay).padStart(3, '0')}|${p[1]}`, 'utf8')
    ]);
}

// Chỉ giải Free_v5_: nonce 16B | tag 32B | bản mã; P=[5,cờ,số quay(2B),ms(6B),nv,thiết bị(10),tên]
function giaiMaMoi(noiDung) {
    const coDinh = 16 + 32 + 21;
    const raw = giaiBase64Url(noiDung);
    if (!raw || raw.length < coDinh + 1 || raw.length > coDinh + 128) throw new Error(INVALID);
    const nonce = raw.subarray(0, 16), tag = raw.subarray(16, 48), banMa = raw.subarray(48);
    const khoa = hmac(BI_MAT, Buffer.concat([Buffer.from('tdz5|enc|', 'utf8'), nonce, tag]));
    const p = Buffer.alloc(banMa.length);
    let dong = null;
    for (let i = 0; i < banMa.length; i++) {
        const viTri = i % 32;
        if (viTri === 0) dong = crypto.createHash('sha256').update(Buffer.concat([khoa, Buffer.from([i / 32])])).digest();
        p[i] = banMa[i] ^ dong[viTri];
    }
    const khoaCon = hmac(BI_MAT, chuoiTron(p));
    const tagThat = hmac(khoaCon, Buffer.concat([Buffer.from('tdz5|tag|', 'utf8'), nonce, p]));
    if (!crypto.timingSafeEqual(tagThat, tag)) throw new Error(INVALID);
    if (p[0] !== 5 || p[1] > 1) throw new Error(INVALID);
    const soQuay = p[2] * 256 + p[3];
    let thoiDiemMs = 0;
    for (let i = 4; i <= 9; i++) thoiDiemMs = thoiDiemMs * 256 + p[i];
    const nv = p[10];
    const thietBi = p.subarray(11, 21).toString('latin1');
    const ten = p.subarray(21).toString('utf8');
    if (soQuay > 999 || thoiDiemMs <= 0 || thoiDiemMs > 8.64e15 || nv < 1 || nv > 4) throw new Error(INVALID);
    if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(thietBi)) throw new Error(INVALID);
    if (!ten || ten !== ten.trim() || ten.length > MAX_TEN_UTF16) throw new Error(INVALID);
    if (Buffer.from(ten, 'utf8').compare(p.subarray(21)) !== 0) throw new Error(INVALID);
    return { phienBan: 'Free_v5_', ten, nhiemVu: `nv${nv}`, thoiDiemMs, thoiDiem: Math.floor(thoiDiemMs / 1000),
        soQuay, thietBi, tuRoblox: p[1] === 1, ngayGioUtc: ngayGioUtc(thoiDiemMs) };
}

function giaiMaKey(ma) {
    if (typeof ma !== 'string') throw new Error(INVALID);
    const khop = ma.trim().match(/^Free_v(\d+)_([A-Za-z0-9_-]+)$/);
    if (!khop) throw new Error('Mã không hợp lệ hoặc không thuộc bản Free_v5_.');
    if (khop[1] !== '5') throw new Error(`Không hỗ trợ key Free_v${khop[1]}_ (hệ thống chỉ nhận Free_v5_).`);
    return giaiMaMoi(khop[2]);
}

const giaiMaDemo = giaiMaKey;

if (require.main === module) {
    if (process.argv.length !== 3) { console.error('Cách dùng: node tools/decode-demo.cjs "Free_v5_..."'); process.exitCode = 1; }
    else {
        try {
            const tt = giaiMaKey(process.argv[2]);
            console.log(`Phiên bản       : ${tt.phienBan}${tt.tuRoblox ? ' (tên lấy từ link Roblox)' : ''}`);
            console.log(`Tên người chơi  : ${JSON.stringify(tt.ten)}`);
            console.log(`Nhiệm vụ cuối   : ${tt.nhiemVu}`);
            console.log(`Số quay         : ${String(tt.soQuay).padStart(3, '0')}`);
            console.log(`Mã thiết bị     : ${tt.thietBi}`);
            console.log(`Thời điểm (UTC) : ${tt.ngayGioUtc} (${new Date(tt.thoiDiemMs).toISOString()})`);
            console.log('Lưu ý: key có thể bị giả mạo (bí mật nằm trong mã nguồn công khai); công cụ này không chứng minh người chơi đã làm nhiệm vụ.');
        } catch (e) { console.error(e.message); process.exitCode = 1; }
    }
}
module.exports = { giaiMaKey, giaiMaDemo, giaiMaMoi, kyTuKiemTraThietBi, BI_MAT, CAU_TRUC };
