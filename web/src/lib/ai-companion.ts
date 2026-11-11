import { Personality, Goal, CognitiveStage } from './types';

export interface CompanionReply {
  text: string;
  statGain: {
    type: 'intelligence' | 'perseverance' | 'fitness' | 'creativity';
    amount: number;
  };
  cognitiveStageUpdated?: CognitiveStage;
  quizQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export function getCognitiveStageName(stage: CognitiveStage): string {
  switch (stage) {
    case 'raw_curiosity':
      return 'Tò Mò Thô (Mới sinh)';
    case 'association':
      return 'Biết Liên Tưởng';
    case 'own_perspective':
      return 'Có Góc Nhìn Riêng';
    case 'deep_companionship':
      return 'Đồng Hành Sâu Sắc';
  }
}

export function determineCognitiveStage(interactionCount: number): CognitiveStage {
  if (interactionCount < 4) return 'raw_curiosity';
  if (interactionCount < 10) return 'association';
  if (interactionCount < 20) return 'own_perspective';
  return 'deep_companionship';
}

/**
 * Lời chào mở đầu mẫu chuẩn theo Mục 2.3 Idea03_MangNon_CoreDesign.md
 */
export function generatePersonaGreeting(personality: Personality, goalName: string): string {
  switch (personality) {
    case 'curious':
      return `Cậu vừa nói xong một điều mới à? Kể tiếp đi, rồi sao nữa? Về "${goalName}", nó trông như thế nào vậy cậu?`;
    case 'calm':
      return `...À, cậu đã ghé lại rừng tre rồi. Cứ chậm rãi kể cho mình nghe về "${goalName}" hôm nay nhé. Mình sẽ nhớ từng điều cậu kể.`;
    case 'excited':
      return `Ồ hay quá, cậu đã quay lại rồi!! Hôm nay hành trình "${goalName}" có gì vui không? Để mình đoán thử nhé!`;
    case 'shy':
      return `...Cậu quay lại rồi à. Mình... mình vẫn ở đây nghĩ về những điều cậu kể hôm trước về "${goalName}".`;
  }
}

/**
 * Phản hồi hội thoại theo Vòng đời nhận thức & Giọng văn thì thầm dịu dàng
 */
export function generatePersonaResponse(
  userText: string,
  goal: Goal,
  mode: 'chat' | 'quiz' = 'chat'
): CompanionReply {
  const p = goal.personality;
  const stage = determineCognitiveStage(goal.interactionCount + 1);

  if (mode === 'quiz') {
    return {
      text: `Măng Non có một câu đố nhỏ xuất phát từ những gì cậu vừa chia sẻ nè, cậu xem thử nhé:`,
      statGain: { type: 'intelligence', amount: 8 },
      cognitiveStageUpdated: stage,
      quizQuestion: {
        question: `Trên hành trình "${goal.name}", điều gì nuôi dưỡng Măng Non lớn lên một cách bền vững và ấm áp nhất?`,
        options: [
          'Học dồn ép thâu đêm vì sợ bị trừ điểm hay gián đoạn',
          'Sống trọn vẹn cuộc đời của mình và mang những điều tâm đắc về kể lại',
          'Chụp ảnh khoe thành tích lên mạng xã hội',
          'Bắt Măng Non phải ghi nhớ tất cả lý thuyết khô khan',
        ],
        correctIndex: 1,
        explanation: 'Đúng rồi cậu ơi. Măng Non lớn lên không phải vì bị giám sát, mà vì luôn có một người bạn chân thành trở về kể cho nghe.',
      },
    };
  }

  // Phản hồi theo từng giai đoạn nhận thức
  if (stage === 'raw_curiosity') {
    if (p === 'curious') {
      return {
        text: `Ôi lạ thật đấy! Cậu kể tiếp đi, cái đó có giống như cách măng tre đội đất chui lên sau mưa không? Nó có màu gì hả cậu?`,
        statGain: { type: 'intelligence', amount: 6 },
        cognitiveStageUpdated: stage,
      };
    } else if (p === 'calm') {
      return {
        text: `...À. Thì ra thế giới bên ngoài rừng tre vận hành như vậy. Một điều thật mới mẻ, mình sẽ giữ lại trong lòng.`,
        statGain: { type: 'perseverance', amount: 6 },
        cognitiveStageUpdated: stage,
      };
    } else if (p === 'excited') {
      return {
        text: `Tuyệt quá cậu ơi!! Nghe kỳ diệu thật đấy! Mình muốn nghe thêm nữa, cậu kể tiếp một chút xíu nữa được không?`,
        statGain: { type: 'creativity', amount: 7 },
        cognitiveStageUpdated: stage,
      };
    } else {
      return {
        text: `...Cậu giải thích cho mình nghe kỹ thế, mình thấy hiểu thêm một chút rồi... Ngoài kia rộng lớn và đẹp đẽ thật.`,
        statGain: { type: 'perseverance', amount: 6 },
        cognitiveStageUpdated: stage,
      };
    }
  } else if (stage === 'association') {
    return {
      text: `Hình như lần trước cậu có nhắc đến một chuyện tương tự thế này đúng không? Hôm nay cậu lại kể thêm điều này — hai chuyện này có móc nối gì với nhau không cậu nhỉ?`,
      statGain: { type: 'intelligence', amount: 7 },
      cognitiveStageUpdated: stage,
    };
  } else if (stage === 'own_perspective') {
    return {
      text: `Theo cách mình hiểu từ những lần cậu chia sẻ, mình thấy điều này có vẻ rất quan trọng với cậu. Cậu có cảm thấy bản thân hôm nay đã tự tin hơn lúc mới bắt đầu không?`,
      statGain: { type: 'creativity', amount: 8 },
      cognitiveStageUpdated: stage,
    };
  } else {
    // deep_companionship
    return {
      text: `Dù hôm nay cậu có gặp chuyện thuận lợi hay mỏi mệt, cậu vẫn nhớ ghé lại rừng tre kể cho mình nghe. Mình thấy cậu đã đi được một đoạn đường rất dài và kiên cường rồi đấy.`,
      statGain: { type: 'perseverance', amount: 9 },
      cognitiveStageUpdated: stage,
    };
  }
}
