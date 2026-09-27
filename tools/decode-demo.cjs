#!/usr/bin/env node
// Đọc mã Free_v3_ (và Free_v2_ cũ) của index.html; KHÔNG xác minh danh tính hay key thật.
// Thuật toán công khai: ai có mã nguồn đều có thể đọc tên hoặc tự tạo mã mới.
const PREFIX_V2 = 'Free_v2_';
const PREFIX_V3 = 'Free_v3_';
const INVALID = 'Mã không hợp lệ hoặc không thuộc bản Free_v3_/Free_v2_. Mã Free_ cũ dạng hash không thể đọc ngược tên.';

// Phải khớp BI_MAT_V3 / bamV3 / taoMaDemo trong index.html và key-system.lua.
const BI_MAT_V3 = 'taodepzai|v3|HoiAn';
const P31 = 2147483647;

function bamV3(dsByte, h, coSo, mod) {
    for (const b of dsByte) h = (h * coSo + b + 1) % mod;
    return h;
}
const byteAscii = chuoi => Array.from(chuoi, kyTu => kyTu.charCodeAt(0));

function docBase64Url(noiDung) {
    if (!/^[A-Za-z0-9_-]{8,700}$/.test(noiDung)) throw new Error(INVALID);
    const bytes = Buffer.from(noiDung, 'base64url');
    if (bytes.toString('base64url') !== noiDung) throw new Error(INVALID); // bit thừa phải = 0
    return bytes;
}

function kiemTraNoiDung(bytes) {
    const [ten, nhiemVu, thoiDiem] = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (typeof ten !== 'string' || !ten || ten !== ten.trim() || ten.length > 32 ||
        !/^nv[1-4]$/.test(nhiemVu) || !Number.isSafeInteger(thoiDiem) || thoiDiem <= 0 ||
        !Number.isFinite(new Date(thoiDiem).getTime())) throw new Error(INVALID);
    return { ten, nhiemVu, thoiDiem };
}

function giaiMaV2(noiDung) {
    const daChe = docBase64Url(noiDung);
    const bytes = daChe.map((byte, viTri) => byte ^ ((viTri * 73 + 0xA5) & 255));
    return kiemTraNoiDung(bytes);
}

function giaiMaV3(noiDung) {
    const raw = docBase64Url(noiDung);
    if (raw.length < 3 + 4 + 8) throw new Error(INVALID);
    const biMat = byteAscii(BI_MAT_V3);
    const matNa = bamV3(biMat, 7, 131, P31);
    const dau = [0, 1, 2].map(i => (raw[i] - Math.floor(matNa / 256 ** i) % 256 + 256) % 256);
    const giaTriDau = dau[0] * 65536 + dau[1] * 256 + dau[2];
    const thang = giaTriDau % 16;
    const ngay = Math.floor(giaTriDau / 16) % 32;
    const soQuay = Math.floor(giaTriDau / 512);
    if (soQuay > 999 || ngay < 1 || ngay > 31 || thang < 1 || thang > 12) throw new Error(INVALID);

    let x = bamV3(byteAscii(`${BI_MAT_V3}|${soQuay}|${ngay}|${thang}`), 11, 257, P31) || 1;
    let truoc = soQuay % 256;
    const than = [];
    for (let i = 3; i < raw.length; i++) {
        x = (x * 48271) % P31;
        than.push(((raw[i] - Math.floor(x / 8388608) - truoc) % 256 + 512) % 256);
        truoc = raw[i];
    }
    const noiDungByte = than.slice(0, -4);
    const tatCa = [...biMat, ...dau, ...noiDungByte];
    const h1 = bamV3(tatCa, 5, 131, P31);
    const h2 = bamV3(tatCa, 3, 257, 2147483629);
    const tag = [Math.floor(h1 / 256) % 256, h1 % 256, Math.floor(h2 / 256) % 256, h2 % 256];
    if (tag.some((b, i) => b !== than[than.length - 4 + i])) throw new Error(INVALID);

    const ketQua = kiemTraNoiDung(Uint8Array.from(noiDungByte));
    const d = new Date(ketQua.thoiDiem);
    if (d.getUTCDate() !== ngay || d.getUTCMonth() + 1 !== thang) throw new Error(INVALID);
    return { ...ketQua, soQuay };
}

function giaiMaDemo(ma) {
    if (typeof ma !== 'string') throw new Error(INVALID);
    try {
        if (ma.startsWith(PREFIX_V3)) return giaiMaV3(ma.slice(PREFIX_V3.length));
        if (ma.startsWith(PREFIX_V2)) return giaiMaV2(ma.slice(PREFIX_V2.length));
    } catch {
        throw new Error(INVALID);
    }
    throw new Error(INVALID);
}

if (require.main === module) {
    if (process.argv.length !== 3) {
        console.error('Cách dùng: node tools/decode-demo.cjs "Free_v3_..."');
        process.exitCode = 1;
    } else {
        try {
            const { ten, nhiemVu, thoiDiem, soQuay } = giaiMaDemo(process.argv[2]);
            console.log(`Tên người chơi: ${JSON.stringify(ten)}`);
            console.log(`Nhiệm vụ hoàn thành cuối: ${nhiemVu}`);
            console.log(`Thời điểm hoàn thành (UTC): ${new Date(thoiDiem).toISOString()}`);
            if (soQuay !== undefined) console.log(`Số vòng quay: ${String(soQuay).padStart(3, '0')}`);
            console.log('Lưu ý: Mã demo có thể bị giả mạo, không chứng minh ai đã làm nhiệm vụ.');
        } catch (error) {
            console.error(error.message);
            process.exitCode = 1;
        }
    }
}

module.exports = { giaiMaDemo };
