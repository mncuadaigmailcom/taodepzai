#!/usr/bin/env node
// Mô phỏng ĐÚNG hàm KiemTraKey trong script.js: cho biết script Roblox có chấp nhận một key hay không.
// Cấu hình được đọc trực tiếp từ script.js (CAU_HINH) nên công cụ không bị lệch khi bạn đổi cờ.
//
//   node tools/kiem-tra-key.cjs "Free_v5_..." "TenTaiKhoan" [--hien-thi="Tên hiển thị"] [--ip=1.2.3.4] [--bay-gio=<giây>]
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { giaiMaKey } = require('./decode-demo.cjs');

const BANG_THIET_BI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function docCauHinh(duongDan = path.join(__dirname, '..', 'script.js')) {
    const src = fs.readFileSync(duongDan, 'utf8');
    // chỉ đọc trong bảng CAU_HINH để không dính các câu nhắc trong phần chú thích đầu tệp
    const batDau = src.indexOf('local CAU_HINH');
    const khoi = batDau >= 0 ? src.slice(batDau) : src;
    const lay = ten => {
        const m = khoi.match(new RegExp('\\b' + ten + '\\s*=\\s*([^\\r\\n]*)'));
        if (!m) throw new Error(`Không đọc được ${ten} trong script.js`);
        const gia = m[1].split('--')[0].trim().replace(/,\s*$/, ''); // bỏ chú thích Luau và dấu phẩy cuối
        const chuoi = gia.match(/^"(.*)"$/);
        if (chuoi) return chuoi[1];
        if (gia === 'true' || gia === 'false') return gia === 'true';
        if (!/^[0-9\s()+*/. -]+$/.test(gia)) throw new Error(`Giá trị lạ cho ${ten}: ${gia}`);
        return Function(`"use strict"; return (${gia});`)(); // chỉ số và phép tính cơ bản
    };
    return {
        KEY_PREFIX: lay('KEY_PREFIX'),
        CHAP_NHAN_KEY_V4: lay('CHAP_NHAN_KEY_V4'),
        CHAP_NHAN_KEY_V2: lay('CHAP_NHAN_KEY_V2'),
        YEU_CAU_TEN_TU_ROBLOX: lay('YEU_CAU_TEN_TU_ROBLOX'),
        KIEM_TRA_THIET_BI: lay('KIEM_TRA_THIET_BI'),
        HAN_KEY_GIAY: lay('HAN_KEY_GIAY'),
        LECH_GIO_CHO_PHEP: lay('LECH_GIO_CHO_PHEP'),
        KIEM_TRA_TEN: lay('KIEM_TRA_TEN'),
        CHAP_NHAN_TEN_HIEN_THI: lay('CHAP_NHAN_TEN_HIEN_THI')
    };
}

// Giống ChuanHoaTen trong script.js: cắt khoảng trắng, bỏ '@' đầu, hạ chữ ASCII
function chuanHoaTen(s) {
    return String(s ?? '').trim().replace(/^@/, '').toLowerCase();
}

// Giống ThanMaThietBi("ip:" .. ip) trong script.js (10 ký tự Crockford base32 của SHA-256)
function thanMaThietBi(ip) {
    const bam = crypto.createHash('sha256').update(Buffer.from('taodepzai|thiet-bi|ip:' + ip, 'utf8')).digest();
    const layBit = (tu, so) => {
        let v = 0;
        for (let i = tu; i < tu + so; i++) v = v * 2 + ((bam[i >> 3] >> (7 - (i & 7))) & 1);
        return v;
    };
    return [...Array(10)].map((_, i) => BANG_THIET_BI[layBit(i * 5, 5)]).join('');
}

function dinhDangGio(giay) {
    const d = new Date(giay * 1000);
    const so = n => String(n).padStart(2, '0');
    return `${so(d.getHours())}:${so(d.getMinutes())} ngày ${so(d.getDate())}/${so(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Trả về { ok, loi?, thongTin?, conLai?, hetHan? } — câu chữ lỗi giống script.js
function kiemTraKey(nhap, {
    cauHinh = docCauHinh(), tenRoblox = '', tenHienThi = '', maThietBiHienTai = null,
    bayGio = Math.floor(Date.now() / 1000)
} = {}) {
    const c = cauHinh;
    if (String(nhap ?? '').trim() === '') return { ok: false, loi: 'Bạn chưa nhập key!' };
    const ma = String(nhap).trim().match(/Free_v\d_[A-Za-z0-9_-]+/)?.[0]; // dán thừa chữ vẫn nhận
    if (!ma) return { ok: false, loi: `Key sai! Key phải bắt đầu bằng "${c.KEY_PREFIX}"` };
    const dungTienTo = ma.startsWith(c.KEY_PREFIX) ||
        (c.CHAP_NHAN_KEY_V4 && ma.startsWith('Free_v4_')) || (c.CHAP_NHAN_KEY_V2 && ma.startsWith('Free_v2_'));
    if (!dungTienTo) {
        return {
            ok: false, loi: `Key ${ma.slice(0, 8)} cũ không còn dùng được. Hãy lấy key ` +
                `${c.KEY_PREFIX} mới trên trang web.`
        };
    }

    let thongTin;
    try { thongTin = giaiMaKey(ma); }
    catch { return { ok: false, loi: 'Key không hợp lệ (bị sửa hoặc thiếu ký tự). Hãy sao chép lại key.' }; }

    if (c.KIEM_TRA_TEN && tenRoblox) {
        const khop = chuanHoaTen(thongTin.ten) === chuanHoaTen(tenRoblox) ||
            (c.CHAP_NHAN_TEN_HIEN_THI && tenHienThi && chuanHoaTen(thongTin.ten) === chuanHoaTen(tenHienThi));
        if (!khop) {
            const them = c.CHAP_NHAN_TEN_HIEN_THI && tenHienThi && tenHienThi !== tenRoblox
                ? ` hoặc "${tenHienThi}"` : '';
            return {
                ok: false, loi: `Key này không phải của tài khoản ${tenRoblox}. Trên web hãy nhập đúng tên ` +
                    `"${tenRoblox}"${them} rồi lấy key mới.`
            };
        }
    }
    if (c.YEU_CAU_TEN_TU_ROBLOX && !thongTin.tuRoblox) {
        return {
            ok: false, loi: `Key này tạo bằng tên gõ tay. Hãy nhấn "Lấy key" 2 lần, mở link (tên mã hoá) rồi ` +
                `lấy ${c.KEY_PREFIX} mới.`
        };
    }
    if (thongTin.thoiDiem - bayGio > c.LECH_GIO_CHO_PHEP) {
        return { ok: false, loi: 'Thời gian trong key ở tương lai. Kiểm tra lại giờ máy rồi lấy key mới.' };
    }
    const hetHan = thongTin.thoiDiem + c.HAN_KEY_GIAY;
    if (bayGio >= hetHan) return { ok: false, loi: `Key đã hết hạn lúc ${dinhDangGio(hetHan)}. Hãy lấy key mới.` };

    if (c.KIEM_TRA_THIET_BI && thongTin.phienBan !== 'Free_v2_') {
        if (!maThietBiHienTai) {
            return {
                ok: false, loi: 'Không lấy được IP mạng để kiểm tra key. Kiểm tra kết nối rồi bấm Xác nhận lại.',
                thongTin: { loi: 'mang' }
            };
        }
        if (thongTin.thietBi !== maThietBiHienTai) {
            return {
                ok: false, loi: 'Key này được tạo trên thiết bị / mạng khác (IP không khớp). Hãy mở trang lấy key ' +
                    'bằng điện thoại này, cùng wifi hoặc 4G đang chơi, rồi lấy key mới.',
                thongTin: { loi: 'thiet_bi' }
            };
        }
    }
    return { ok: true, conLai: hetHan - bayGio, hetHan, thongTin };
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const ma = args.find(a => !a.startsWith('--'));
    const ten = args.filter(a => !a.startsWith('--'))[1] || '';
    const co = ten => args.find(a => a.startsWith(`--${ten}=`))?.split('=').slice(1).join('=');
    if (!ma) {
        console.error('Cách dùng: node tools/kiem-tra-key.cjs "Free_v5_..." "TenTaiKhoan" ' +
            '[--hien-thi="Tên hiển thị"] [--ip=1.2.3.4] [--bay-gio=<giây>]');
        process.exitCode = 1;
    } else {
        const cauHinh = docCauHinh();
        const ip = co('ip');
        const ketQua = kiemTraKey(ma, {
            cauHinh, tenRoblox: ten, tenHienThi: co('hien-thi') || '',
            maThietBiHienTai: ip ? thanMaThietBi(ip) : null,
            bayGio: co('bay-gio') ? Number(co('bay-gio')) : Math.floor(Date.now() / 1000)
        });
        console.log(`Cấu hình script.js: KEY_PREFIX=${cauHinh.KEY_PREFIX} · v4=${cauHinh.CHAP_NHAN_KEY_V4} · ` +
            `v2=${cauHinh.CHAP_NHAN_KEY_V2} · kiểm tra mạng=${cauHinh.KIEM_TRA_THIET_BI} · ` +
            `bắt tên từ Roblox=${cauHinh.YEU_CAU_TEN_TU_ROBLOX} · hạn=${cauHinh.HAN_KEY_GIAY / 3600} giờ`);
        if (ketQua.ok) {
            console.log(`✔ HỢP LỆ — còn ${Math.round(ketQua.conLai / 60)} phút (hết hạn ${dinhDangGio(ketQua.hetHan)}).`);
            if (ketQua.thongTin.phienBan === 'Free_v2_') {
                console.log('⚠ Đây là key v2 cũ: không có mã kiểm tra, ai cũng có thể bịa ra được.');
            }
            if (!cauHinh.KIEM_TRA_THIET_BI) console.log('ℹ KIEM_TRA_THIET_BI=false nên key không bị ràng buộc theo mạng.');
        } else {
            console.log(`✖ TỪ CHỐI — ${ketQua.loi}`);
            process.exitCode = 1;
        }
    }
}

module.exports = { docCauHinh, kiemTraKey, chuanHoaTen, thanMaThietBi, dinhDangGio };
