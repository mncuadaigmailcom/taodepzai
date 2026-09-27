#!/usr/bin/env node
// Đọc mã Free_v4_ (và Free_v2_ cũ) của index.html bằng module crypto của Node
// (cài đặt độc lập với bản SHA-256 tự viết trong index.html / key-system.lua để đối chiếu).
// Chỉ dành cho chủ trang: cần BI_MAT_V4. KHÔNG xác minh ai đã làm nhiệm vụ.
const crypto = require('node:crypto');

const PREFIX_V2 = 'Free_v2_';
const PREFIX_V4 = 'Free_v4_';
const INVALID = 'Mã không hợp lệ hoặc không thuộc bản Free_v4_/Free_v2_.';

// Phải khớp BI_MAT_V4 trong index.html và key-system.lua.
const BI_MAT_V4 = 'z!V~~RO3mS2dCMvW-GE@#v2XYYuLsNoQKS5U0pGeAY5EOkd_';
const BANG_THIET_BI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const DAI_CO_DINH = 12 + 16 + 20;

const sha256 = (...phan) => crypto.createHash('sha256').update(Buffer.concat(phan.map(p => Buffer.from(p)))).digest();
const hmacVoiKhoa = (khoa, ...phan) => crypto.createHmac('sha256', khoa).update(Buffer.concat(phan.map(p => Buffer.from(p)))).digest();
const hmac = (...phan) => hmacVoiKhoa(BI_MAT_V4, ...phan);

// Chuỗi trộn = 'tdz4|tron|' + mã mạng + '|' + tên + '|' + 'YYYY-MM-DD HH:MM:SS.mmm' (UTC) + '|' + số quay
function chuoiTron(p) {
    const ms = p.readUIntBE(3, 6);
    const d = new Date(ms), so = (n, dai = 2) => String(n).padStart(dai, '0');
    const ngayGio = `${so(d.getUTCFullYear(), 4)}-${so(d.getUTCMonth() + 1)}-${so(d.getUTCDate())} ` +
        `${so(d.getUTCHours())}:${so(d.getUTCMinutes())}:${so(d.getUTCSeconds())}.${so(d.getUTCMilliseconds(), 3)}`;
    return Buffer.concat([Buffer.from('tdz4|tron|'), p.subarray(10, 20), Buffer.from('|'), p.subarray(20),
        Buffer.from(`|${ngayGio}|${String(p[1] * 256 + p[2]).padStart(3, '0')}`)]);
}
// tag = HMAC(khoá con = HMAC(BI_MAT, chuỗi trộn), 'tdz4|tag|' + nonce + P)
const tagV4 = (nonce, p) => hmacVoiKhoa(hmac(chuoiTron(p)), 'tdz4|tag|', nonce, p).subarray(0, 16);

function layBit(bytes, tu, so) {
    let v = 0;
    for (let i = tu; i < tu + so; i++) v = v * 2 + ((bytes[i >> 3] >> (7 - (i & 7))) & 1);
    return v;
}

function kyTuKiemTra(than) {
    const h = sha256('taodepzai|kiem-tra|' + than);
    return BANG_THIET_BI[layBit(h, 0, 5)] + BANG_THIET_BI[layBit(h, 5, 5)];
}

// Mã gốc ("ip:" + IP mạng) -> mã thiết bị XXXX-XXXX-XXXX như trang web / script Roblox tính
function maThietBiTuGoc(maGoc) {
    const h = sha256('taodepzai|thiet-bi|' + maGoc);
    let than = '';
    for (let i = 0; i < 10; i++) than += BANG_THIET_BI[layBit(h, i * 5, 5)];
    const d = than + kyTuKiemTra(than);
    return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

// Nhận mã người dùng gõ (không phân biệt hoa thường, bỏ dấu -/khoảng trắng, O->0, I/L->1) -> 10 ký tự thân hoặc null
function chuanHoaMaThietBi(ma) {
    const t = String(ma ?? '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    if (!/^[0-9A-HJKMNP-TV-Z]{12}$/.test(t)) return null;
    return kyTuKiemTra(t.slice(0, 10)) === t.slice(10) ? t.slice(0, 10) : null;
}

function dongKhoa(khoa, dai) {
    const phan = [];
    for (let j = 0; j * 32 < dai; j++) phan.push(sha256(khoa, [j]));
    return Buffer.concat(phan);
}

// Bộ tạo key v4 độc lập (dùng cho test đối chiếu với index.html)
function taoMaV4(ten, nhiemVu, thoiDiem, soQuay, maThietBi, nonce = crypto.randomBytes(12)) {
    const than = chuanHoaMaThietBi(maThietBi);
    if (!than) throw new Error('Mã thiết bị không hợp lệ');
    const ms = Buffer.alloc(6);
    ms.writeUIntBE(thoiDiem, 0, 6);
    const p = Buffer.concat([Buffer.from([4, soQuay >> 8, soQuay & 255]), ms,
        Buffer.from([Number(nhiemVu.slice(2))]), Buffer.from(than), Buffer.from(ten.trim(), 'utf8')]);
    const tag = tagV4(nonce, p);
    const dong = dongKhoa(hmac('tdz4|enc|', nonce, tag), p.length);
    const c = p.map((b, i) => b ^ dong[i]);
    return PREFIX_V4 + Buffer.concat([Buffer.from(nonce), tag, c]).toString('base64url');
}

function docBase64Url(noiDung) {
    if (!/^[A-Za-z0-9_-]{8,700}$/.test(noiDung)) throw new Error(INVALID);
    const bytes = Buffer.from(noiDung, 'base64url');
    if (bytes.toString('base64url') !== noiDung) throw new Error(INVALID); // bit thừa phải = 0
    return bytes;
}

function kiemTraTen(bytes) {
    const ten = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
    if (!ten || ten !== ten.replace(/^[ \t\n\v\f\r]+|[ \t\n\v\f\r]+$/g, '') || ten.length > 32) throw new Error(INVALID);
    return ten;
}

function giaiMaV2(noiDung) {
    const bytes = docBase64Url(noiDung).map((byte, viTri) => byte ^ ((viTri * 73 + 0xA5) & 255));
    const [ten, nhiemVu, thoiDiem] = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (typeof ten !== 'string' || !ten || ten !== ten.trim() || ten.length > 32 ||
        !/^nv[1-4]$/.test(nhiemVu) || !Number.isSafeInteger(thoiDiem) || thoiDiem <= 0 ||
        !Number.isFinite(new Date(thoiDiem).getTime())) throw new Error(INVALID);
    return { ten, nhiemVu, thoiDiem };
}

function giaiMaV4(noiDung) {
    const raw = docBase64Url(noiDung);
    if (raw.length < DAI_CO_DINH + 1 || raw.length > DAI_CO_DINH + 128) throw new Error(INVALID);
    const nonce = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const c = raw.subarray(28);
    const dong = dongKhoa(hmac('tdz4|enc|', nonce, tag), c.length);
    const p = c.map((b, i) => b ^ dong[i]);
    if (!crypto.timingSafeEqual(tagV4(nonce, p), tag) || p[0] !== 4) throw new Error(INVALID);
    const soQuay = p[1] * 256 + p[2];
    const thoiDiem = p.readUIntBE(3, 6);
    const nv = p[9];
    const thietBi = p.subarray(10, 20).toString('latin1');
    if (soQuay > 999 || thoiDiem <= 0 || thoiDiem > 8.64e15 || nv < 1 || nv > 4 ||
        !/^[0-9A-HJKMNP-TV-Z]{10}$/.test(thietBi)) throw new Error(INVALID);
    return { ten: kiemTraTen(p.subarray(20)), nhiemVu: `nv${nv}`, thoiDiem, soQuay, thietBi };
}

function giaiMaDemo(ma) {
    if (typeof ma !== 'string') throw new Error(INVALID);
    try {
        if (ma.startsWith(PREFIX_V4)) return giaiMaV4(ma.slice(PREFIX_V4.length));
        if (ma.startsWith(PREFIX_V2)) return giaiMaV2(ma.slice(PREFIX_V2.length));
    } catch {
        throw new Error(INVALID);
    }
    throw new Error(INVALID);
}

if (require.main === module) {
    if (process.argv.length !== 3) {
        console.error('Cách dùng: node tools/decode-demo.cjs "Free_v4_..."');
        process.exitCode = 1;
    } else {
        try {
            const { ten, nhiemVu, thoiDiem, soQuay, thietBi } = giaiMaDemo(process.argv[2]);
            console.log(`Tên người chơi: ${JSON.stringify(ten)}`);
            console.log(`Nhiệm vụ hoàn thành cuối: ${nhiemVu}`);
            console.log(`Thời điểm hoàn thành (UTC): ${new Date(thoiDiem).toISOString()}`);
            if (soQuay !== undefined) console.log(`Số vòng quay: ${String(soQuay).padStart(3, '0')}`);
            if (thietBi !== undefined) {
                const d = thietBi + kyTuKiemTra(thietBi);
                console.log(`Mã thiết bị: ${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`);
            }
        } catch (error) {
            console.error(error.message);
            process.exitCode = 1;
        }
    }
}

module.exports = { chuoiTron, giaiMaDemo, taoMaV4, maThietBiTuGoc, chuanHoaMaThietBi };
