import { Personality, Stage, Mangnon, MemoryItem } from './app-state';

interface DialogueResult {
  replyText: string;
  delayMs: number;
  newMemory?: string;
  isComforting?: boolean;
}

// Danh sách từ dừng tiếng Việt đơn giản
const STOP_WORDS = new Set([
  'và', 'là', 'của', 'có', 'cho', 'với', 'trong', 'được', 'này', 'đó',
  'mình', 'cậu', 'tôi', 'bạn', 'rồi', 'nhé', 'nha', 'thì', 'ở', 'về',
  'lại', 'khi', 'mà', 'nhưng', 'cũng', 'đã', 'đang', 'sẽ', 'làm', 'ra'
]);

// Danh sách từ cảm xúc nặng cần an ủi
const HEAVY_EMOTIONS = [
  'mệt', 'buồn', 'chán', 'áp lực', 'stress', 'thất vọng', 'lo', 'cô đơn', 'đuối'
];

export function extractTopic(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return words[0] || 'điều cậu vừa kể';
}

export function generateReply(
  userText: string,
  mangnon: Mangnon,
  memories: MemoryItem[]
): DialogueResult {
  const topic = extractTopic(userText);
  const personality = mangnon.personality;
  const stage = mangnon.stage;

  // 1. Kiểm tra cảm xúc nặng
  const isHeavy = HEAVY_EMOTIONS.some((e) => userText.toLowerCase().includes(e));

  // Độ trễ theo tính cách
  let delayMs = 1000;
  if (personality === 'tomo') delayMs = 900;
  if (personality === 'haohung') delayMs = 700;
  if (personality === 'diemtinh') delayMs = 1800;
  if (personality === 'nhutnhat') delayMs = 2100;

  // Lấy ký ức cũ hợp lệ (chưa bị quên) để callback
  const validMemories = memories.filter((m) => !m.forgotten);
  const prevMemory = validMemories.length > 0
    ? validMemories[Math.floor(Math.random() * validMemories.length)].text.replace(/^Cậu kể:\s*/, '')
    : null;

  let replyText = '';

  // Xử lý an ủi ở giai đoạn 4 hoặc khi phát hiện tâm trạng mệt mỏi
  if (isHeavy) {
    if (personality === 'diemtinh') {
      replyText = '...Mình ngồi cạnh cậu nhé. Không cần nói thêm gì đâu, cứ thở một hơi thật sâu.';
    } else if (personality === 'nhutnhat') {
      replyText = '...Cậu mệt rồi sao? Mình ở đây với cậu, yên bình thế này là tốt rồi.';
    } else if (personality === 'haohung') {
      replyText = 'Cậu đã vất vả nhiều rồi. Hôm nay nghỉ ngơi thôi nhé, mình luôn ở đây ngắm sao cùng cậu.';
    } else {
      replyText = 'Nghe có vẻ hôm nay là một ngày dài. Cậu có muốn uống một ngụm nước ấm không?';
    }
  } else if (stage === 1) {
    // Giai đoạn 1: Tò mò thô
    if (personality === 'tomo') {
      const templates = [
        `"${topic}" là gì thế cậu? Kể tiếp cho mình nghe với, rồi sao nữa?`,
        `Thế giới bên ngoài có nhiều thứ như "${topic}" không cậu? Trông nó thế nào?`,
        `Nghe lạ quá! Cậu thấy "${topic}" lúc nào thế?`,
      ];
      replyText = templates[Math.floor(Math.random() * templates.length)];
    } else if (personality === 'diemtinh') {
      const templates = [
        `...À. Vậy là "${topic}". Mình lắng nghe đây.`,
        `...Gió rừng tre thổi nhẹ qua. Mình ghi nhận điều cậu kể về "${topic}".`,
        `...Thong thả thôi cậu. Mình đang hình dung về "${topic}".`,
      ];
      replyText = templates[Math.floor(Math.random() * templates.length)];
    } else if (personality === 'haohung') {
      const templates = [
        `Ồ hay thế!! Kể về "${topic}" làm mình thấy vui lây luôn này!`,
        `Tuyệt thật đó! Để mình đoán xem, "${topic}" làm cậu bất ngờ đúng không?`,
        `Thích quá chừng! Thế giới của cậu hôm nay có thêm "${topic}" rồi!`,
      ];
      replyText = templates[Math.floor(Math.random() * templates.length)];
    } else {
      // nhutnhat
      const templates = [
        `...Cậu kể về "${topic}" à? Mình... mình thích nghe lắm.`,
        `...Mình lắng nghe được rồi. "${topic}" nghe ấm áp quá.`,
        `...Cậu cứ nói tiếp nhé, mình ở ngay đây thôi.`,
      ];
      replyText = templates[Math.floor(Math.random() * templates.length)];
    }
  } else if (stage === 2) {
    // Giai đoạn 2: Biết liên tưởng (có callback ký ức)
    if (prevMemory && Math.random() > 0.4) {
      if (personality === 'tomo') {
        replyText = `Hôm trước cậu kể "${prevMemory}", hôm nay lại có "${topic}"! Hai điều này có liên quan gì với nhau không cậu?`;
      } else if (personality === 'diemtinh') {
        replyText = `...Từ "${prevMemory}" hôm trước đến "${topic}" hôm nay, mình thấy một dòng chảy êm ả trong lòng cậu.`;
      } else if (personality === 'haohung') {
        replyText = `A!! Mình nhớ hôm nọ cậu kể "${prevMemory}", giờ thêm "${topic}" nữa! Như ghép thêm một mảnh tranh vậy!`;
      } else {
        replyText = `...Lần trước cậu bảo "${prevMemory}"... hôm nay lại là "${topic}". Mình... mình nhớ cả hai điều đó.`;
      }
    } else {
      if (personality === 'tomo') {
        replyText = `Mình đang thử nối "${topic}" với khu rừng này. Có điểm gì giống nhau không nhỉ?`;
      } else if (personality === 'diemtinh') {
        replyText = `...Một điều đáng suy ngẫm. Mình lưu giữ lại nhé.`;
      } else if (personality === 'haohung') {
        replyText = `Mỗi lần nghe cậu nói về "${topic}", mình lại thấy như có thêm ngọn gió mới thổi qua rừng!`;
      } else {
        replyText = `...Mình đang ngẫm nghĩ một chút. "${topic}" làm mình thấy yên lòng.`;
      }
    }
  } else if (stage === 3) {
    // Giai đoạn 3: Có góc nhìn riêng
    const likesStr = mangnon.likes && mangnon.likes.length > 0 ? mangnon.likes[0] : 'tiếng gió reo';
    if (personality === 'tomo') {
      replyText = `Mình thì thích ngắm ${likesStr} hơn, nhưng nghe cậu kể về "${topic}" cũng thấy thú vị ghê! Cậu có thích nó nhiều không?`;
    } else if (personality === 'diemtinh') {
      replyText = `...Mỗi người đều có một nhịp điệu riêng. Với mình, "${topic}" nghe rất đỗi dịu dàng.`;
    } else if (personality === 'haohung') {
      replyText = `Nếu là mình, mình sẽ rủ cả rừng tre cùng chia vui với "${topic}" luôn! Cậu thấy ý này thế nào?`;
    } else {
      replyText = `...Mình nghĩ khác một chút xíu, nhưng điều cậu kể về "${topic}" vẫn làm mình thấy ấm áp lắm.`;
    }
  } else {
    // Giai đoạn 4: Đồng hành sâu sắc
    if (personality === 'tomo') {
      replyText = `Đi cùng cậu một đoạn đường rồi, mình nhận ra "${topic}" chính là một phần rất đẹp trong cuộc sống của cậu.`;
    } else if (personality === 'diemtinh') {
      replyText = `...Mọi thứ cứ tự nhiên như mầm măng mọc trong rừng. Mình luôn ở đây, dõi theo từng bước cậu đi.`;
    } else if (personality === 'haohung') {
      replyText = `Nhìn cậu gắn bó với "${topic}", mình thấy tự hào ghê gớm luôn! Chúng mình cứ thế mà đi cùng nhau nhé!`;
    } else {
      replyText = `...Ở cạnh cậu, nghe cậu kể về "${topic}", mình không còn thấy e dè nữa. Cảm ơn cậu thật nhiều.`;
    }
  }

  // Tạo ứng viên ký ức mới nếu câu của người dùng đủ dài (≥ 4 từ)
  let newMemory: string | undefined = undefined;
  const wordCount = userText.trim().split(/\s+/).length;
  if (wordCount >= 3) {
    const cleanExcerpt = userText.length > 70 ? userText.slice(0, 67) + '...' : userText;
    newMemory = `Cậu kể: ${cleanExcerpt}`;
  }

  return {
    replyText,
    delayMs,
    newMemory,
    isComforting: isHeavy,
  };
}

