#!/usr/bin/env node
// Chỉ để đọc mã demo Free_v2_ của index.html; KHÔNG xác minh danh tính hay key thật.
// Ai có mã nguồn đều có thể đọc tên hoặc tự tạo mã mới.
const PREFIX = 'Free_v2_';
const INVALID = 'Mã không hợp lệ hoặc không thuộc bản Free_v2_. Mã Free_ cũ dạng hash không thể đọc ngược tên.';

function giaiMaDemo(ma) {
    if (typeof ma !== 'string' || !ma.startsWith(PREFIX)) throw new Error(INVALID);
    const noiDung = ma.slice(PREFIX.length);
    if (!/^[A-Za-z0-9_-]{8,512}$/.test(noiDung)) throw new Error(INVALID);

    const daChe = Buffer.from(noiDung, 'base64url');
    if (daChe.toString('base64url') !== noiDung) throw new Error(INVALID);
    try {
        // Phải khớp phép che byte ở taoMaDemo trong index.html; đây không phải khóa bí mật.
        const bytes = daChe.map((byte, viTri) => byte ^ ((viTri * 73 + 0xA5) & 255));
        const [ten, nhiemVu, thoiDiem] = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
        if (typeof ten !== 'string' || !ten || ten !== ten.trim() || ten.length > 32 ||
            !/^nv[1-4]$/.test(nhiemVu) || !Number.isSafeInteger(thoiDiem) || thoiDiem <= 0 ||
            !Number.isFinite(new Date(thoiDiem).getTime())) throw new Error(INVALID);
        return { ten, nhiemVu, thoiDiem };
    } catch {
        throw new Error(INVALID);
    }
}

if (require.main === module) {
    if (process.argv.length !== 3) {
        console.error('Cách dùng: node tools/decode-demo.cjs "Free_v2_..."');
        process.exitCode = 1;
    } else {
        try {
            const { ten, nhiemVu, thoiDiem } = giaiMaDemo(process.argv[2]);
            console.log(`Tên người chơi: ${JSON.stringify(ten)}`);
            console.log(`Nhiệm vụ hoàn thành cuối: ${nhiemVu}`);
            console.log(`Thời điểm hoàn thành (UTC): ${new Date(thoiDiem).toISOString()}`);
            console.log('Lưu ý: Mã demo có thể bị giả mạo, không chứng minh ai đã làm nhiệm vụ.');
        } catch (error) {
            console.error(error.message);
            process.exitCode = 1;
        }
    }
}

module.exports = { giaiMaDemo };
