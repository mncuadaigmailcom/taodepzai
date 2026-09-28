#!/usr/bin/env node
// Đọc thông tin trong key Free_v5_ (và bản cũ Free_v4_ / Free_v2_) do index.html tạo ra.
// Áp dụng ĐÚNG thuật toán của GiaiMaMoi/GiaiMaV2 trong script.js, NHƯNG KHÔNG chứng minh
// người chơi đã làm nhiệm vụ: ai đọc mã nguồn cũng tự tạo được key. (Mã cũ Free_ dạng hash một
// chiều thì không đọc ngược được tên.)
'use strict';
const crypto = require('node:crypto');

const BI_MAT = Buffer.from('z!V~~RO3mS2dCMvW-GE@#v2XYYuLsNoQKS5U0pGeAY5EOkd_', 'utf8');
const BANG_THIET_BI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32, khớp script.js
const CAU_TRUC = {
    5: { nonce: 16, tag: 32, lech: 1, nhan: 'tdz5' },
    4: { nonce: 12, tag: 16, lech: 0, nhan: 'tdz4' }
};
const MAX_TEN_UTF16 = 32;

const INVALID = 'Key không hợp lệ (bị sửa, thiếu ký tự hoặc không thuộc bản này).';

function hmac(khoa, thongDiep) {
    return crypto.createHmac('sha256', khoa).update(thongDiep).digest();
}

function giaiBase64Url(chuoi) {
    if (!/^[A-Za-z0-9_-]*$/.test(chuoi) || chuoi.length % 4 === 1) return null;
    const ds = Buffer.from(chuoi, 'base64url');
    return ds.toString('base64url') === chuoi ? ds : null; // từ chối base64 không chuẩn tắc
}

// ms -> 'YYYY-MM-DD HH:MM:SS.mmm' UTC, giống NgayGioUtc trong script.js
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

// Giống KiemTraThietBi trong script.js: 2 ký tự kiểm tra của thân mã thiết bị
function kyTuKiemTraThietBi(than) {
    const h = crypto.createHash('sha256').update(Buffer.from('taodepzai|kiem-tra|' + than, 'utf8')).digest();
    return BANG_THIET_BI[layBit(h, 0, 5)] + BANG_THIET_BI[layBit(h, 5, 5)];
}

function chuoiTron(p, pb) {
    const d = pb.lech;
    const soQuay = p[1 + d] * 256 + p[2 + d];
    let ms = 0;
    for (let i = 3 + d; i <= 8 + d; i++) ms = ms * 256 + p[i];
    const phan = [
        Buffer.from(pb.nhan + '|tron|', 'utf8'),
        p.subarray(10 + d, 20 + d),
        Buffer.from('|', 'latin1'),
        p.subarray(20 + d),
        Buffer.from(`|${ngayGioUtc(ms)}|${String(soQuay).padStart(3, '0')}` +
            (d === 1 ? `|${p[1]}` : ''), 'utf8')
    ];
    return Buffer.concat(phan);
}

function giaiMaMoi(noiDung, so) {
    const pb = CAU_TRUC[so];
    const coDinh = pb.nonce + pb.tag + 20 + pb.lech;
    const raw = giaiBase64Url(noiDung);
    if (!raw || raw.length < coDinh + 1 || raw.length > coDinh + 128) throw new Error(INVALID);
    const nonce = raw.subarray(0, pb.nonce);
    const tag = raw.subarray(pb.nonce, pb.nonce + pb.tag);
    const banMa = raw.subarray(pb.nonce + pb.tag);

    const khoa = hmac(BI_MAT, Buffer.concat([Buffer.from(pb.nhan + '|enc|', 'utf8'), nonce, tag]));
    const p = Buffer.alloc(banMa.length);
    let dong = null;
    for (let i = 0; i < banMa.length; i++) {
        const viTri = i % 32;
        if (viTri === 0) dong = crypto.createHash('sha256').update(Buffer.concat([khoa, Buffer.from([i / 32])])).digest();
        p[i] = banMa[i] ^ dong[viTri];
    }

    const khoaCon = hmac(BI_MAT, chuoiTron(p, pb));
    const tagThat = hmac(khoaCon, Buffer.concat([Buffer.from(pb.nhan + '|tag|', 'utf8'), nonce, p]));
    if (tagThat.subarray(0, pb.tag).compare(tag) !== 0) throw new Error(INVALID);
    if (p[0] !== so) throw new Error(INVALID);

    const d = pb.lech;
    if (d === 1 && p[1] > 1) throw new Error(INVALID);
    const soQuay = p[1 + d] * 256 + p[2 + d];
    let thoiDiemMs = 0;
    for (let i = 3 + d; i <= 8 + d; i++) thoiDiemMs = thoiDiemMs * 256 + p[i];
    const nv = p[9 + d];
    const thietBi = p.subarray(10 + d, 20 + d).toString('latin1');
    const ten = p.subarray(20 + d).toString('utf8');
    if (soQuay > 999 || thoiDiemMs <= 0 || thoiDiemMs > 8.64e15 || nv < 1 || nv > 4) throw new Error(INVALID);
    if (!/^[0-9A-HJKMNP-TV-Z]{10}$/.test(thietBi)) throw new Error(INVALID);
    if (!ten || ten !== ten.trim() || ten.length > MAX_TEN_UTF16) throw new Error(INVALID);
    if (Buffer.from(ten, 'utf8').compare(p.subarray(20 + d)) !== 0) throw new Error(INVALID); // UTF-8 phải chuẩn tắc

    return {
        phienBan: `Free_v${so}_`,
        ten, nhiemVu: `nv${nv}`, thoiDiemMs,
        thoiDiem: Math.floor(thoiDiemMs / 1000),
        soQuay, thietBi,
        tuRoblox: d === 1 && p[1] === 1,
        ngayGioUtc: ngayGioUtc(thoiDiemMs)
    };
}

// Bản v2 cũ: XOR theo vị trí, KHÔNG có mã kiểm tra -> có thể bị giả mạo hoàn toàn.
function giaiMaV2(noiDung) {
    const raw = giaiBase64Url(noiDung);
    if (!raw) throw new Error(INVALID);
    const ro = Buffer.from(raw.map((b, i) => b ^ ((i * 73 + 0xA5) & 255)));
    let noiDungJson;
    try { noiDungJson = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(ro)); }
    catch { throw new Error(INVALID); }
    const [ten, nhiemVu, thoiDiemMs] = Array.isArray(noiDungJson) ? noiDungJson : [];
    if (typeof ten !== 'string' || !ten || ten !== ten.trim() || ten.length > MAX_TEN_UTF16 ||
        !/^nv[1-4]$/.test(nhiemVu) || !Number.isSafeInteger(thoiDiemMs) || thoiDiemMs <= 0 ||
        thoiDiemMs > 8.64e15) throw new Error(INVALID);
    return {
        phienBan: 'Free_v2_', ten, nhiemVu, thoiDiemMs, thoiDiem: Math.floor(thoiDiemMs / 1000),
        soQuay: null, thietBi: null, tuRoblox: false, ngayGioUtc: ngayGioUtc(thoiDiemMs),
        canhBao: 'Bản v2 không có mã kiểm tra: key có thể bị bịa ra mà không cần làm nhiệm vụ.'
    };
}

// ma: 'Free_v5_…' (bản mới) hoặc 'Free_v4_' / 'Free_v2_' (bản cũ, vẫn đọc để đối chiếu)
function giaiMaKey(ma) {
    if (typeof ma !== 'string') throw new Error(INVALID);
    const khop = ma.trim().match(/^Free_v(\d+)_([A-Za-z0-9_-]+)$/);
    if (!khop) {
        throw new Error('Mã không hợp lệ hoặc không thuộc bản Free_v5_ / Free_v4_ / Free_v2_. ' +
            'Mã Free_ cũ dạng hash không thể đọc ngược tên.');
    }
    const [, phienBan, noiDung] = khop;
    if (phienBan === '5') return giaiMaMoi(noiDung, 5);
    if (phienBan === '4') return giaiMaMoi(noiDung, 4);
    if (phienBan === '2') return giaiMaV2(noiDung);
    throw new Error(`Không hỗ trợ key Free_v${phienBan}_ (chỉ có v5, v4, v2).`);
}

const giaiMaDemo = giaiMaKey; // tên cũ, giữ để tương thích

if (require.main === module) {
    if (process.argv.length !== 3) {
        console.error('Cách dùng: node tools/decode-demo.cjs "Free_v5_..."');
        process.exitCode = 1;
    } else {
        try {
            const tt = giaiMaKey(process.argv[2]);
            console.log(`Phiên bản       : ${tt.phienBan}${tt.tuRoblox ? ' (tên lấy từ link Roblox)' : ''}`);
            console.log(`Tên người chơi  : ${JSON.stringify(tt.ten)}`);
            console.log(`Nhiệm vụ cuối   : ${tt.nhiemVu}`);
            if (tt.soQuay !== null) console.log(`Số quay         : ${String(tt.soQuay).padStart(3, '0')}`);
            if (tt.thietBi) console.log(`Mã thiết bị     : ${tt.thietBi}`);
            console.log(`Thời điểm (UTC) : ${tt.ngayGioUtc} (${new Date(tt.thoiDiemMs).toISOString()})`);
            if (tt.canhBao) console.log(`Cảnh báo        : ${tt.canhBao}`);
            console.log('Lưu ý: key có thể bị giả mạo (bí mật nằm trong mã nguồn công khai); công cụ này ' +
                'không chứng minh người chơi đã làm nhiệm vụ.');
        } catch (error) {
            console.error(error.message);
            process.exitCode = 1;
        }
    }
}

module.exports = { giaiMaKey, giaiMaDemo, giaiMaMoi, giaiMaV2, kyTuKiemTraThietBi, BI_MAT, CAU_TRUC };
