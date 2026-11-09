const fs = require('fs');
const path = require('path');

const BLACKLIST = [
  'mất',
  'hết hạn',
  'cảnh báo',
  'phải',
  'ngay bây giờ',
  'kẻo',
  'lỡ',
  'bỏ lỡ',
  'thất bại',
  'streak',
  'chuỗi ngày',
  'điểm danh',
  'nhiệm vụ',
  'phần thưởng',
  'nhận thưởng',
  'nhận quà',
  'level',
  'xp',
  'lên cấp',
  'goal',
];

const targetFiles = [
  path.join(__dirname, '..', 'web', 'src', 'content', 'vi.ts'),
];

console.log('=== COPY-LINT: KIỂM TRA TỪ NGỮ GÂY ÁP LỰC ===');
let hasError = false;

targetFiles.forEach((file) => {
  if (!fs.existsSync(file)) {
    console.warn(`File không tồn tại: ${file}`);
    return;
  }

  let text = fs.readFileSync(file, 'utf-8');
  // Loại bỏ comments trước khi kiểm tra chuỗi UI
  text = text.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '');
  const lower = text.toLowerCase();

  // Cho phép ngoại lệ hợp lệ: "không phải", "bên phải"
  const sanitized = lower.replace(/không phải/g, '').replace(/bên phải/g, '');

  BLACKLIST.forEach((word) => {
    // Regex tìm từ nguyên vẹn tiếng Việt
    const regex = new RegExp(`(?<=^|[\\s,.!?";:()\\[\\]])${word}(?=$|[\\s,.!?";:()\\[\\]])`, 'i');
    if (regex.test(sanitized)) {
      console.error(`❌ PHÁT HIỆN TỪ CẤM: "${word}" trong ${path.basename(file)}`);
      hasError = true;
    }
  });
});

if (hasError) {
  console.error('\n❌ Copy-lint thất bại! Hãy sửa các từ gây áp lực trên.');
  process.exit(1);
} else {
  console.log('\n✅ 100% COPY-LINT PASS! Không có từ gây áp lực nào.');
  process.exit(0);
}
