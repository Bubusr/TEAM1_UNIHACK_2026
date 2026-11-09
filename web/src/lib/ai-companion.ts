import { Personality, Goal } from './types';

export interface CompanionReply {
  text: string;
  statGain: {
    type: 'intelligence' | 'perseverance' | 'fitness' | 'creativity';
    amount: number;
  };
  quizQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export function generatePersonaGreeting(personality: Personality, goalName: string): string {
  switch (personality) {
    case 'curious':
      return `Xin chào bạn! Mình là Măng Non tò mò đây. Hôm nay trên hành trình '${goalName}', bạn vừa phát hiện ra điều gì kỳ diệu ngoài thế giới thế? Kể cho mình nghe với!`;
    case 'calm':
      return `Chào bạn. Rừng tre hôm nay yên bình quá. Bạn đã dành thời gian cho '${goalName}' thế nào rồi? Cứ chậm rãi kể cho mình nhé.`;
    case 'excited':
      return `Ôi bạn ơi bạn ơi! Vừa thấy bạn ghé Rừng Tre là mình mừng rơn! Hôm nay '${goalName}' của chúng mình đã tiến bộ tới đâu rồi nè?`;
    case 'shy':
      return `...Chào bạn. Mình... mình vẫn ở đây đợi bạn kể về '${goalName}'. Hôm nay bạn có mệt không?`;
  }
}

export function generatePersonaResponse(
  userText: string,
  goal: Goal,
  mode: 'chat' | 'quiz' = 'chat'
): CompanionReply {
  const p = goal.personality;
  const input = userText.toLowerCase();

  if (mode === 'quiz') {
    return {
      text: `Măng Non đã chuẩn bị một câu hỏi nhỏ để cùng bạn ôn lại nè!`,
      statGain: { type: 'intelligence', amount: 8 },
      quizQuestion: {
        question: `Để củng cố mục tiêu "${goal.name}", yếu tố nào giúp Măng Non tích lũy năng lượng bền vững nhất?`,
        options: [
          'Học dồn ép 10 tiếng trước hạn chót',
          'Chia sẻ điều vừa học một cách tự nhiên và duy trì nhịp độ thoải mái',
          'Chỉ đăng ảnh lên mạng xã hội để lấy tương tác',
          'Bỏ đói Măng Non nếu ngày hôm đó không làm xong',
        ],
        correctIndex: 1,
        explanation: 'Chính xác! Học tập bền vững như rễ tre đâm sâu vào lòng đất — không áp lực trừng phạt, cùng đồng hành và sẻ chia kiến thức.',
      },
    };
  }

  // Phản hồi hội thoại theo tính cách
  if (p === 'curious') {
    return {
      text: `Thú vị thật đấy! Bạn vừa nhắc đến việc này, thế bạn thấy nó kết nối thế nào với cách thế giới vận hành? Mình cảm thấy đầu óc mình vừa sáng thêm một chút nhờ điều bạn vừa chia sẻ!`,
      statGain: { type: 'intelligence', amount: 6 },
    };
  } else if (p === 'calm') {
    return {
      text: `Mình lắng nghe và ghi nhớ từng lời bạn chia sẻ. Một bước tiến dù nhỏ trong hôm nay cũng quý giá như rễ tre đâm sâu thêm một tấc đất. Bạn đã làm rất tốt.`,
      statGain: { type: 'perseverance', amount: 6 },
    };
  } else if (p === 'excited') {
    return {
      text: `Tuyệt đỉnh luôn bạn ơi!! Bạn vừa nạp thêm một lượng mầm lực siêu to khổng lồ cho mình rồi đấy! Cứ đà này thì chẳng mấy chốc chúng mình đạt mốc tiếp theo cho mà xem!`,
      statGain: { type: 'creativity', amount: 7 },
    };
  } else {
    // shy
    return {
      text: `Cảm ơn bạn nhiều lắm vì đã dành thời gian kiên nhẫn kể cho mình nghe... Nghe bạn nói mình thấy thế giới ngoài kia rộng lớn và đẹp đẽ thật. Mình sẽ cố gắng học hỏi cùng bạn nhé.`,
      statGain: { type: 'perseverance', amount: 6 },
    };
  }
}
