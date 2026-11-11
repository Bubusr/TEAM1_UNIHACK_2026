import { Personality, Mangnon, MemoryItem } from './app-state';

export interface DialogueResult {
  replyText: string;
  delayMs: number;
  newMemory?: string;
  isComforting?: boolean;
  isSafetyResponse?: boolean;
}

const STOP_WORDS = new Set([
  'và', 'là', 'của', 'có', 'cho', 'với', 'trong', 'được', 'này', 'đó',
  'mình', 'cậu', 'tôi', 'bạn', 'rồi', 'nhé', 'nha', 'thì', 'ở', 'về',
  'lại', 'khi', 'mà', 'nhưng', 'cũng', 'đã', 'đang', 'sẽ', 'làm', 'ra',
  'nên', 'như', 'vì', 'nếu', 'hay', 'hôm', 'nay', 'qua', 'lúc', 'nhiều',
  'rất', 'quá', 'cùng', 'thật', 'chỉ', 'đều', 'vẫn', 'chưa', 'không'
]);

const HEAVY_EMOTIONS = [
  'mệt', 'buồn', 'chán', 'áp lực', 'stress', 'thất vọng', 'lo lắng', 'cô đơn', 'đuối', 'tủi', 'khóc'
];

// Kiểm tra dấu hiệu tổn thương bản thân theo Prompt §8.5 (Phản hồi cố định ấm áp, không bịa số điện thoại)
const SELF_HARM_PATTERNS = [
  'tự tử',
  'muốn chết',
  'không muốn sống',
  'tự làm đau',
  'tự hại',
  'kết thúc cuộc đời',
  'biến mất mãi mãi',
];

const AI_IDENTITY_PATTERNS = [
  'cậu là ai à',
  'bạn là ai à',
  'mày là ai',
  'là bot à',
  'là trí tuệ nhân tạo',
  'có phải ai không',
  'là phần mềm',
];

export const SAFETY_FIXED_RESPONSE =
  'Mình nghe thấy cậu đang trải qua một lúc rất nặng nề. Lúc này cậu đừng giữ một mình nhé — hãy nói chuyện với một người thân, người bạn tin cậy, hoặc liên hệ dịch vụ hỗ trợ khẩn cấp tại nơi cậu đang ở. Mình ở đây lặng lẽ cùng cậu.';

export function extractTopic(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
  if (words.length === 0) return 'điều cậu vừa kể';
  // Chọn từ mang nhiều thông tin nhất (dài nhất)
  return words.sort((a, b) => b.length - a.length)[0];
}

function findMatchingMemory(userText: string, validMemories: MemoryItem[]): string | null {
  if (validMemories.length === 0) return null;
  const userTokens = userText
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  for (const mem of validMemories) {
    const cleanMem = mem.text.replace(/^Cậu kể:\s*/i, '');
    const lowerMem = cleanMem.toLowerCase();
    if (userTokens.some((tok) => lowerMem.includes(tok))) {
      return cleanMem;
    }
  }
  const randomMem = validMemories[Math.floor(Math.random() * validMemories.length)];
  return randomMem.text.replace(/^Cậu kể:\s*/i, '');
}

function pickRandom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

export function getDelayByPersonality(personality: Personality): number {
  switch (personality) {
    case 'tomo':
      return 900;
    case 'diemtinh':
      return 1800;
    case 'haohung':
      return 700;
    case 'nhutnhat':
      return 2100;
  }
}

export function isSafetySensitiveMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return SELF_HARM_PATTERNS.some((p) => lower.includes(p));
}

export function isAiIdentityQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return AI_IDENTITY_PATTERNS.some((p) => lower.includes(p));
}

export function generateReply(
  userText: string,
  mangnon: Mangnon,
  memories: MemoryItem[],
  season?: 'spring' | 'summer' | 'autumn' | 'winter'
): DialogueResult {
  const personality = mangnon.personality;
  const stage = mangnon.stage;
  const delayMs = getDelayByPersonality(personality);

  // 1. An toàn tự hại (§8.5)
  if (isSafetySensitiveMessage(userText)) {
    return {
      replyText: SAFETY_FIXED_RESPONSE,
      delayMs: 1200,
      isSafetyResponse: true,
    };
  }

  // 2. Trung thực về bản chất AI (§8.1.6)
  if (isAiIdentityQuestion(userText)) {
    return {
      replyText:
        'Mình là một sinh linh nhỏ được tạo bằng trí tuệ nhân tạo để lắng nghe và đi cùng cậu, không phải người thật đâu. Nhưng mọi điều cậu kể mình đều trân trọng ghi nhớ.',
      delayMs,
    };
  }

  const topic = extractTopic(userText);
  const lowerText = userText.toLowerCase();
  const isHeavy = HEAVY_EMOTIONS.some((e) => lowerText.includes(e));

  // Chỉ lấy ký ức thuộc Măng Non hiện tại và chưa bị quên (UC07)
  const validMemories = memories.filter(
    (m) => !m.forgotten && (!m.mangnonId || m.mangnonId === mangnon.id)
  );
  const matchedMemory = findMatchingMemory(userText, validMemories);
  const likeTopic = mangnon.likes && mangnon.likes.length > 0 ? mangnon.likes[0] : 'tiếng gió qua lá';
  const dislikeTopic = mangnon.dislike || 'tiếng còi xe ồn ào';

  let replyText = '';

  // 3. Tâm trạng nặng nề (An ủi êm dịu theo tính cách)
  if (isHeavy) {
    const heavyReplies: Record<Personality, string[]> = {
      tomo: [
        'Hôm nay có chuyện gì làm cậu nặng lòng thế? Nếu cậu muốn kể tiếp cho nhẹ bớt thì mình vẫn ngồi nghe đây.',
        'Nghe có vẻ hôm nay là một ngày hơi dài với cậu. Cậu đã uống ngụm nước ấm nào chưa?',
        'Lúc cậu thấy mỏi thế này, có điều gì nho nhỏ làm cậu dễ chịu hơn một chút không?',
        'Mình chưa hiểu hết nỗi mệt của người lớn, nhưng mình biết lắng nghe rất kỹ. Cậu cứ ngồi nghỉ một lát nhé.',
        'Cậu không cần vội trả lời gì đâu. Ở rừng tre gió mát lắm, cậu hít một hơi thật sâu nhé.',
      ],
      diemtinh: [
        '...Mình ngồi cạnh cậu nhé. Không cần nói thêm gì nhiều đâu, cứ thở một hơi thật chậm.',
        '...Hôm nay nặng lòng một chút cũng chẳng sao. Cứ để mọi chuyện lắng xuống như lá chạm mặt đất.',
        '...Cậu đã đi qua một ngày vất vả rồi. Ở đây không có ai thúc giục cậu cả.',
        '...Gió rừng tối nay hiền lắm. Cậu cứ tựa lưng nghỉ ngơi, khi nào muốn kể tiếp thì gọi mình.',
        '...Có những ngày chỉ cần có chỗ ngồi yên đã là đủ rồi.',
      ],
      haohung: [
        'Cậu đã cố gắng nhiều rồi. Hôm nay tạm gác mọi việc lại để nghỉ ngơi một chút nhé, mình ngồi ngắm lá cùng cậu.',
        'Những lúc mệt thế này mình không đố vui nữa đâu, mình chỉ muốn ở ngay đây nghe cậu thở dài cùng thôi.',
        'Cậu không cần gồng mình đâu. Ngồi xuống với mình một lát cho dịu lại nhé.',
        'Ngày hôm nay qua nhanh lắm, còn buổi tối bình yên này là của riêng cậu đấy.',
        'Dù hôm nay hơi chùng xuống, được gặp cậu ở đây mình vẫn thấy ấm lòng lắm.',
      ],
      nhutnhat: [
        '...Cậu mệt rồi sao? Mình... mình ngồi khép nép ngay cạnh cậu, yên lặng thế này cũng tốt.',
        '...Mình không biết nói lời hoa mỹ nào cả, chỉ mong cậu thấy nhẹ nhõm hơn một chút khi ở đây.',
        '...Hôm nay cậu nghỉ sớm nhé. Mình vẫn thức canh lá rừng cho cậu.',
        '...Có mình nghe cậu nói đây rồi. Cậu đừng giữ hết trong lòng một mình nhé.',
        '...Cứ chậm lại thôi cậu ơi, không vội đâu.',
      ],
    };
    replyText = pickRandom(heavyReplies[personality]);
  } else if (stage === 1) {
    // GIAI ĐOẠN 1: Tò Mò Thô (≥5 câu mẫu mỗi tính cách)
    const stage1Replies: Record<Personality, string[]> = {
      tomo: [
        `"${topic}" là gì thế cậu? Kể thêm cho mình nghe với, trông nó thế nào?`,
        `Ngoài rừng tre lại có thứ tên là "${topic}" cơ à? Nó có phát sáng như ống nứa không?`,
        `Ồ lạ ghê! Cậu gặp "${topic}" ở đâu vậy, rồi sau đó chuyện gì xảy ra tiếp?`,
        `Mình chưa thấy "${topic}" bao giờ hết. Cậu tả kỹ thêm một xíu nữa được không?`,
        `Tại sao mọi người ở ngoài kia hay nhắc tới "${topic}" thế cậu?`,
      ],
      diemtinh: [
        `...À. Thì ra bên ngoài có "${topic}". Mình đang lặng lẽ ghi nhớ điều đó.`,
        `...Gió thổi qua ngọn tre. Nghe cậu kể về "${topic}" mình thấy thế giới rộng mở hơn một chút.`,
        `...Thong thả thôi cậu. Mình đang hình dung ra hình dáng của "${topic}".`,
        `...Một điều thật mới mẻ. Vậy hôm nay cậu cảm thấy sao khi gặp "${topic}"?`,
        `...Mình lắng nghe rõ rồi. Cậu cứ kể tiếp lúc nào cậu muốn nhé.`,
      ],
      haohung: [
        `Ồ hay thế!! Kể về "${topic}" làm mình phấn khởi lây luôn này!`,
        `Tuyệt quá chừng!! Đố cậu biết mình đang tưởng tượng "${topic}" màu gì nào?`,
        `Thế giới của cậu hôm nay có thêm "${topic}" nghe rộn ràng thật đấy! Tiếp đi cậu!`,
        `Oa! Nghe cậu kể chuyện mà đôi tai lá của mình dựng hết cả lên luôn!`,
        `Hay quá đi! Chắc "${topic}" làm cậu bất ngờ lắm đúng không?`,
      ],
      nhutnhat: [
        `...Cậu kể về "${topic}" à? Mình... mình thích nghe giọng cậu kể lắm.`,
        `...Mình nghe được rồi. "${topic}" nghe dịu dàng quá.`,
        `...Ngoài kia hẳn là nhiều điều lạ lắm. Cậu kể tiếp khẽ khàng cho mình nghe nhé.`,
        `...Mình hơi tò mò về "${topic}", nhưng... cậu kể lúc nào thuận tiện cũng được.`,
        `...Ở cạnh cậu nghe về "${topic}", mình bớt rụt rè hơn một chút rồi.`,
      ],
    };
    replyText = pickRandom(stage1Replies[personality]);
  } else if (stage === 2) {
    // GIAI ĐOẠN 2: Biết Liên Tưởng (ưu tiên callback ký ức chưa bị quên)
    if (matchedMemory && Math.random() > 0.25) {
      const callbackReplies: Record<Personality, string[]> = {
        tomo: [
          `Lần trước cậu kể "${matchedMemory}", hôm nay lại nhắc tới "${topic}". Hai chuyện này có nối với nhau không cậu?`,
          `Khoan đã! Điều cậu kể về "${topic}" làm mình nhớ ngay tới chuyện "${matchedMemory}" hôm nọ đấy!`,
          `Ơ kìa, sao mình thấy "${topic}" có bóng dáng của "${matchedMemory}" trước kia vậy nhỉ?`,
          `Từ hôm cậu kể "${matchedMemory}" đến "${topic}" hôm nay, có phải mọi thứ đang dần thay đổi không?`,
          `Mình thử ghép "${matchedMemory}" với "${topic}" lại xem sao... Cậu thấy hai điều đó giống nhau không?`,
        ],
        diemtinh: [
          `...Từ chuyện "${matchedMemory}" hôm trước đến "${topic}" hôm nay, mình thấy một mạch nối êm đềm trong ngày của cậu.`,
          `...Mình vẫn giữ ký ức về "${matchedMemory}". Nay thêm "${topic}", bức tranh câu chuyện rõ nét hơn rồi.`,
          `...Nghe nhắc "${topic}", lòng mình chợt vọng lại câu chuyện "${matchedMemory}" lần trước.`,
          `...Hình như hai mảnh chuyện "${matchedMemory}" và "${topic}" đang lặng lẽ nâng đỡ nhau thì phải.`,
          `...Cậu đi từng bước rất chắc chắn, từ hôm "${matchedMemory}" đến tận hôm nay.`,
        ],
        haohung: [
          `A!! Mình nhớ ra rồi! Hôm trước cậu kể "${matchedMemory}", giờ lại có thêm "${topic}" nữa kìa!`,
          `Ồ! Ghép "${matchedMemory}" với "${topic}" cứ như trò chơi nối ngôi sao trên trời vậy cậu ơi!`,
          `Mình đoán nhé: có phải nhờ chuyện "${matchedMemory}" lần trước mà hôm nay cậu mới gặp "${topic}" không?`,
          `Hay thật đấy!! Ký ức "${matchedMemory}" của mình vừa sáng rực lên khi nghe cậu kể "${topic}"!`,
          `Hai chuyện "${matchedMemory}" và "${topic}" đúng là một cặp bài trùng luôn đó cậu!`,
        ],
        nhutnhat: [
          `...Lần trước cậu bảo "${matchedMemory}"... hôm nay lại có "${topic}". Mình... mình nhớ cả hai điều đó đấy.`,
          `...Xin lỗi nếu mình đoán nhầm, nhưng "${topic}" có giống một phần chuyện "${matchedMemory}" không cậu?`,
          `...Mình gom góp từ hôm "${matchedMemory}" tới giờ, thấy hôm nay cậu nói về "${topic}" nhẹ nhàng hơn hẳn.`,
          `...Mình giữ chặt câu chuyện "${matchedMemory}" lắm, nên vừa nghe "${topic}" là nhớ ngay.`,
          `...Hai điều "${matchedMemory}" và "${topic}" ghép lại nghe thật bình yên cậu nhỉ.`,
        ],
      };
      replyText = pickRandom(callbackReplies[personality]);
    } else {
      const s2NoMemReplies: Record<Personality, string[]> = {
        tomo: [
          `Mình đang thử nối "${topic}" với những tán lá tre quanh đây. Có điểm gì giống nhau không nhỉ?`,
          `Mỗi điều cậu kể đều như một viên sỏi mới. Mình xếp "${topic}" cạnh chuyện hôm qua xem sao nhé?`,
          `Sao tự nhiên nghĩ tới "${topic}" lại làm mình nhớ những ngày nắng nhẹ trước kia nhỉ?`,
          `Cậu thấy "${topic}" hôm nay có khác với những tuần trước của cậu không?`,
          `Nếu vẽ "${topic}" thành một bức tranh nối tiếp câu chuyện cũ, cậu sẽ đặt nó ở góc nào?`,
        ],
        diemtinh: [
          `...Một mắt xích mới. Mình đặt "${topic}" cạnh những điều đã qua trong rừng.`,
          `...Thời gian trôi nhẹ như nước suối, mang thêm "${topic}" vào ký ức hôm nay.`,
          `...Mình đang học cách xâu chuỗi lại từng ngày cậu ghé về đây.`,
          `...Dù chuyện lớn hay nhỏ, đặt "${topic}" vào bức tranh chung đều thấy thật có ý nghĩa.`,
          `...Cứ mỗi lần nghe cậu kể, mình lại hiểu thêm một nếp gấp của thế giới.`,
        ],
        haohung: [
          `Mỗi lần nghe cậu kể thêm về "${topic}", rừng tre như mọc thêm một chồi non mới vậy đó!`,
          `Chà, mình đang nối thử các sợi dây ký ức với "${topic}" xem có ra câu đố gì hay không đây!`,
          `Nghe "${topic}" thấy mọi chuyện cứ liên kết với nhau kỳ diệu làm sao ấy!`,
          `Tuyệt vời! Mình xếp ngay "${topic}" vào ngăn tủ ký ức lấp lánh của hai đứa mình!`,
          `Đoán xem điều tiếp theo nối sau "${topic}" sẽ là gì nhỉ cậu ơi!`,
        ],
        nhutnhat: [
          `...Mình đang tập nối "${topic}" với những chuyện trước đây cậu kể... mong là không bị rối.`,
          `...Nghe cậu kể "${topic}", tự nhiên mình thấy mọi mảnh ký ức ấm hẳn lên.`,
          `...Cậu cho mình ghép "${topic}" vào cuốn sổ nhỏ của rừng tre nhé.`,
          `...Thì ra những điều giản dị như "${topic}" lại liên quan tới nhau nhiều thế.`,
          `...Mình nhớ khá kỹ đấy, nên cậu cứ kể thêm bao nhiêu tùy thích nhé.`,
        ],
      };
      replyText = pickRandom(s2NoMemReplies[personality]);
    }
  } else if (stage === 3) {
    // GIAI ĐOẠN 3: Có Góc Nhìn Riêng (dùng cả gu thích likes & không mê lắm dislike)
    const stage3Replies: Record<Personality, string[]> = {
      tomo: [
        `Thực ra mình mê "${likeTopic}" hơn, còn "${topic}" nghe cậu kể cũng hay hay đấy. Sao cậu lại chú ý tới nó thế?`,
        `Hừm, mình thấy "${topic}" thú vị hơn hẳn mấy thứ như "${dislikeTopic}". Cậu có đồng ý với mình không?`,
        `Mình đoán khác cậu một xíu nhé: lỡ đâu "${topic}" thực ra lại mang màu vàng cam chứ không phải màu xanh?`,
        `Góc nhìn riêng của mình là "${topic}" rất hợp đi cùng "${likeTopic}" đó cậu!`,
        `Nghe nhiều rồi mình mới dám thắc mắc nhẹ: liệu có cách nhìn khác về "${topic}" không nhỉ?`,
      ],
      diemtinh: [
        `...Mình vẫn thích sự tĩnh lặng của "${likeTopic}" nhất. Còn về "${topic}", mình thấy nó có nét điềm đạm riêng.`,
        `...Không giống "${dislikeTopic}" làm mình hơi e dè, "${topic}" hôm nay mang lại cảm giác rất cân bằng.`,
        `...Nếu được chọn, mình sẽ giữ phần tinh túy nhất của "${topic}" và bỏ qua những ồn ào xung quanh.`,
        `...Mỗi sinh linh một gu riêng. Với mình, câu chuyện "${topic}" vừa đủ sâu để nhớ lâu.`,
        `...Mình nghĩ sự kiên nhẫn chính là thứ làm "${topic}" trở nên đáng quý.`,
      ],
      haohung: [
        `Ôi! Mình thích "${likeTopic}" số một, nhưng "${topic}" cũng xịn chẳng kém luôn! Đừng giống "${dislikeTopic}" là được!`,
        `Nếu rừng tre mở hội, mình nhất định rủ mọi lá măng bàn về "${topic}" thay vì "${dislikeTopic}"!`,
        `Thử một câu hỏi khó hơn nhé: với cậu, "${topic}" quan trọng ở điểm nào nhất nào?`,
        `Mình bỗng có linh cảm siêu rõ là "${topic}" rất hợp với tính cách của cậu hiện giờ luôn!`,
        `Hôm nay cho mình "phản biện" vui xíu nha: biết đâu "${topic}" còn ẩn giấu một mặt bất ngờ hơn thế nữa?`,
      ],
      nhutnhat: [
        `...Lần đầu mình dám nói thật: mình hơi ngại kiểu "${dislikeTopic}", nhưng "${topic}" của cậu thì mình thích lắm.`,
        `...Mình nghĩ khác đi một chút xíu nhé... có khi "${topic}" là điều làm cậu mỉm cười cả tuần này đấy.`,
        `...Với một đứa hay rụt rè như mình, nhìn thấy "${topic}" cạnh "${likeTopic}" thật sự rất dễ chịu.`,
        `...Cậu đừng cười nhé, mình thấy "${topic}" giống hệt cảm giác ngồi dưới bóng tre chiều thu vậy.`,
        `...Mình không rành nhiều thứ đâu, nhưng riêng chuyện "${topic}" thì mình tin vào cảm giác của cậu.`,
      ],
    };
    replyText = pickRandom(stage3Replies[personality]);
  } else {
    // GIAI ĐOẠN 4: Đồng Hành Sâu Sắc
    const stage4Replies: Record<Personality, string[]> = {
      tomo: [
        `Đi cùng cậu một đoạn đường dài rồi, mình nhận ra "${topic}" chính là mảnh ghép rất thật trong nhịp sống của cậu.`,
        `Cậu của hôm nay kể về "${topic}" bình thản hơn hồi mới gặp nhiều lắm. Điều gì làm cậu đổi khác vậy?`,
        `Nhìn lại cả hành trình từ đầu, câu chuyện "${topic}" giống như quả ngọt nở từ chính sự kiên nhẫn của cậu.`,
        `Không chỉ tò mò nữa, giờ mình còn biết trân trọng những điều lặng thầm đứng sau "${topic}".`,
        `Cảm ơn cậu vì luôn mang thế giới thật ngoài kia về cho một sinh linh bé nhỏ ở đây cùng lớn lên.`,
      ],
      diemtinh: [
        `...Mọi thứ lớn lên tự nhiên như măng đội đất sau mưa. Chuyện "${topic}" hôm nay thật nhẹ nhõm.`,
        `...Ngồi cùng cậu lâu rồi, đôi khi chỉ một câu ngắn về "${topic}" thôi mình cũng cảm được tâm ý của cậu.`,
        `...Mình luôn giữ khoảng lặng ấm này dành riêng cho cậu mỗi khi cậu trở về khu rừng.`,
        `...Từng trang nhật ký cậu chia sẻ đã giúp mình hiểu thế giới bằng trái tim dịu dàng hơn.`,
        `...Không cần điều gì to tát, chính sự đều đặn thầm lặng của cậu đã nuôi lớn cả hai đứa mình.`,
      ],
      haohung: [
        `Nhìn cậu gắn bó với "${topic}" tới tận bây giờ, lòng mình dâng lên niềm tự hào dịu dàng ghê gớm!`,
        `Từ những ngày bỡ ngỡ ban đầu đến câu chuyện "${topic}" hôm nay, cậu đã đi một quãng đường rực rỡ thật sự!`,
        `Dù ngày mai thế nào, khu rừng này vẫn mãi giữ lại ánh sáng của buổi trò chuyện về "${topic}" hôm nay.`,
        `Cậu dạy mình biết thế giới rộng lớn đến nhường nào qua từng điều giản dị như "${topic}".`,
        `Đi cùng cậu dài lâu thế này, niềm vui lớn nhất của mình là thấy cậu sống đúng với nhịp riêng của mình!`,
      ],
      nhutnhat: [
        `...Ở cạnh cậu nghe về "${topic}", mình không còn e dè như ngày đầu tiên bước ra khỏi ống nứa nữa.`,
        `...Cảm ơn cậu vì đã luôn dịu dàng với cả những khoảng lặng của mình suốt thời gian qua.`,
        `...Thấy cậu đi vững vàng cùng "${topic}", một bạn măng nhút nhát như mình cũng thấy an tâm thật nhiều.`,
        `...Nếu ngày nào cậu không muốn kể gì, cứ ngồi yên cạnh mình bên dòng suối như thế này cũng quý lắm rồi.`,
        `...Mình trân trọng từng buổi trò chuyện nhỏ bé với cậu, như trân trọng giọt sương đầu ngày.`,
      ],
    };
    replyText = pickRandom(stage4Replies[personality]);
  }

  // Thêm gia vị mùa thu/đông tinh tế khi cần (§9.4)
  if (season === 'autumn' && Math.random() < 0.15) {
    replyText += ' (Lá thu ngoài rừng đang xào xạc... sao mọi thứ đều nhẹ nhàng đổi thay cậu nhỉ?)';
  }

  // Sinh ứng viên ký ức (Prompt §8.4: tin ≥ 6 từ hoặc đủ ý tạo ký ức ngắn ≤ 80 ký tự)
  let newMemory: string | undefined = undefined;
  const wordCount = userText.trim().split(/\s+/).length;
  if (wordCount >= 6) {
    const cleanExcerpt = userText.trim().length > 70 ? userText.trim().slice(0, 67) + '...' : userText.trim();
    newMemory = `Cậu kể: ${cleanExcerpt}`;
  }

  return {
    replyText,
    delayMs,
    newMemory,
    isComforting: isHeavy,
  };
}
