#!/usr/bin/env node
// Mô phỏng ĐÚNG hàm KiemTraKey trong key-system.lua (CHỈ nhận Free_v5_).
// Cấu hình đọc trực tiếp từ key-system.lua (CAU_HINH) nên không lệch khi đổi cờ.
//   node tools/kiem-tra-key.cjs "Free_v5_..." "TenTaiKhoan" [--ip=1.2.3.4] [--bay-gio=<giây>]
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { giaiMaKey } = require('./decode-demo.cjs');
const BANG_THIET_BI = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function docCauHinh(duongDan = path.join(__dirname, '..', 'key-system.lua')) {
    const src = fs.readFileSync(duongDan, 'utf8');
    const batDau = src.indexOf('local CAU_HINH');
    const khoi = batDau >= 0 ? src.slice(batDau) : src;
    const lay = ten => {
        const m = khoi.match(new RegExp('\\b' + ten + '\\s*=\\s*([^\\r\\n]*)'));
        if (!m) throw new Error(`Không đọc được ${ten} trong key-system.lua`);
        const gia = m[1].split('--')[0].trim().replace(/,\s*$/, '');
        const chuoi = gia.match(/^"(.*)"$/);
        if (chuoi) return chuoi[1];
        if (gia === 'true' || gia === 'false') return gia === 'true';
        if (!/^[0-9\s()+*/. -]+$/.test(gia)) throw new Error(`Giá trị lạ cho ${ten}: ${gia}`);
        return Function(`"use strict"; return (${gia});`)();
    };
    return { KEY_PREFIX: lay('KEY_PREFIX'), YEU_CAU_TEN_TU_ROBLOX: lay('YEU_CAU_TEN_TU_ROBLOX'),
        KIEM_TRA_THIET_BI: lay('KIEM_TRA_THIET_BI'), HAN_KEY_GIAY: lay('HAN_KEY_GIAY'),
        LECH_GIO_CHO_PHEP: lay('LECH_GIO_CHO_PHEP'), KIEM_TRA_TEN: lay('KIEM_TRA_TEN'),
        CHAP_NHAN_TEN_HIEN_THI: lay('CHAP_NHAN_TEN_HIEN_THI') };
}

function chuanHoaTen(s) { return String(s ?? '').trim().replace(/^@/, '').toLowerCase(); }

function thanMaThietBi(ip) {
    const bam = crypto.createHash('sha256').update(Buffer.from('taodepzai|thiet-bi|ip:' + ip, 'utf8')).digest();
    const layBit = (tu, so) => { let v = 0; for (let i = tu; i < tu + so; i++) v = v * 2 + ((bam[i >> 3] >> (7 - (i & 7))) & 1); return v; };
    return [...Array(10)].map((_, i) => BANG_THIET_BI[layBit(i * 5, 5)]).join('');
}

function dinhDangGio(giay) {
    const d = new Date(giay * 1000); const so = n => String(n).padStart(2, '0');
    return `${so(d.getHours())}:${so(d.getMinutes())} ngày ${so(d.getDate())}/${so(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function kiemTraKey(nhap, { cauHinh = docCauHinh(), tenRoblox = '', tenHienThi = '', maThietBiHienTai = null, bayGio = Math.floor(Date.now() / 1000) } = {}) {
    const c = cauHinh;
    if (String(nhap ?? '').trim() === '') return { ok: false, loi: 'Bạn chưa nhập key!' };
    const ma = String(nhap).trim().match(/Free_v\d_[A-Za-z0-9_-]+/)?.[0];
    if (!ma) return { ok: false, loi: `Key sai! Key phải bắt đầu bằng "${c.KEY_PREFIX}"` };
    if (!ma.startsWith(c.KEY_PREFIX)) return { ok: false, loi: `Chỉ nhận key Free_v5_. Key ${ma.slice(0, 8)} không còn dùng được, hãy lấy key Free_v5_ mới trên trang web.` };
    let thongTin;
    try { thongTin = giaiMaKey(ma); } catch { return { ok: false, loi: 'Key không hợp lệ (bị sửa hoặc thiếu ký tự). Hãy sao chép lại key.' }; }
    if (c.KIEM_TRA_TEN && tenRoblox) {
        const khop = chuanHoaTen(thongTin.ten) === chuanHoaTen(tenRoblox) ||
            (c.CHAP_NHAN_TEN_HIEN_THI && tenHienThi && chuanHoaTen(thongTin.ten) === chuanHoaTen(tenHienThi));
        if (!khop) return { ok: false, loi: `Key này không phải của tài khoản ${tenRoblox}. Trên web hãy nhập đúng tên "${tenRoblox}" rồi lấy key mới.` };
    }
    if (c.YEU_CAU_TEN_TU_ROBLOX && !thongTin.tuRoblox) return { ok: false, loi: 'Key này tạo bằng tên gõ tay. Hãy nhấn "Lấy key", mở link (tên mã hoá) rồi lấy Free_v5_ mới.' };
    if (thongTin.thoiDiem - bayGio > c.LECH_GIO_CHO_PHEP) return { ok: false, loi: 'Thời gian trong key ở tương lai. Kiểm tra lại giờ máy rồi lấy key mới.' };
    const hetHan = thongTin.thoiDiem + c.HAN_KEY_GIAY;
    if (bayGio >= hetHan) return { ok: false, loi: `Key đã hết hạn lúc ${dinhDangGio(hetHan)}. Hãy lấy key mới.` };
    if (c.KIEM_TRA_THIET_BI) {
        if (!maThietBiHienTai) return { ok: false, loi: 'Không lấy được IP mạng để kiểm tra key. Kiểm tra kết nối rồi bấm Xác nhận lại.', thongTin: { loi: 'mang' } };
        if (thongTin.thietBi !== maThietBiHienTai) return { ok: false, loi: 'Key này được tạo trên thiết bị / mạng khác (IP không khớp). Hãy mở trang lấy key bằng điện thoại này, cùng wifi hoặc 4G đang chơi, rồi lấy key mới.', thongTin: { loi: 'thiet_bi' } };
    }
    return { ok: true, conLai: hetHan - bayGio, hetHan, thongTin };
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const ma = args.find(a => !a.startsWith('--'));
    const ten = args.filter(a => !a.startsWith('--'))[1] || '';
    const co = tenCo => args.find(a => a.startsWith(`--${tenCo}=`))?.split('=').slice(1).join('=');
    if (!ma) { console.error('Cách dùng: node tools/kiem-tra-key.cjs "Free_v5_..." "TenTaiKhoan" [--ip=1.2.3.4] [--bay-gio=<giây>]'); process.exitCode = 1; }
    else {
        const cauHinh = docCauHinh(); const ip = co('ip');
        const ketQua = kiemTraKey(ma, { cauHinh, tenRoblox: ten, maThietBiHienTai: ip ? thanMaThietBi(ip) : null, bayGio: co('bay-gio') ? Number(co('bay-gio')) : Math.floor(Date.now() / 1000) });
        console.log(`Cấu hình key-system.lua: KEY_PREFIX=${cauHinh.KEY_PREFIX} · chỉ Free_v5_ · kiểm tra mạng=${cauHinh.KIEM_TRA_THIET_BI} · bắt tên từ Roblox=${cauHinh.YEU_CAU_TEN_TU_ROBLOX} · hạn=${cauHinh.HAN_KEY_GIAY / 3600} giờ`);
        if (ketQua.ok) { console.log(`✔ HỢP LỆ — còn ${Math.round(ketQua.conLai / 60)} phút (hết hạn ${dinhDangGio(ketQua.hetHan)}).`); if (!cauHinh.KIEM_TRA_THIET_BI) console.log('ℹ KIEM_TRA_THIET_BI=false nên key không bị ràng buộc theo mạng.'); }
        else { console.log(`✖ TỪ CHỐI — ${ketQua.loi}`); process.exitCode = 1; }
    }
}
module.exports = { docCauHinh, kiemTraKey, chuanHoaTen, thanMaThietBi, dinhDangGio };
