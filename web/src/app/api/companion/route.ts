import { NextRequest, NextResponse } from 'next/server';
import { generatePersonaResponse } from '@/lib/ai-companion';
import { Goal } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, goal, mode } = await req.json();

    if (!userMessage || !goal) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Kiểm tra nếu có API key LLM thì có thể gọi external, ngược lại dùng Persona Engine thông minh
    const apiKey = process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (apiKey && process.env.GEMINI_API_KEY) {
      try {
        const prompt = `Bạn là "Măng Non" - một sinh linh đồng hành học tập độc lập có tính cách: ${goal.personality} (curious: tò mò hỏi sâu, calm: trầm tĩnh, excited: hào hứng đố vui, shy: rụt rè).
Mục tiêu hiện tại của người chơi: "${goal.name}". Cấp độ: ${goal.level}.
Người chơi vừa chia sẻ: "${userMessage}".
Quy tắc:
1. Bạn KHÔNG ĐƯỢC phán xét hay đóng vai giám khảo chấm điểm. Bạn là người bạn cùng học, cùng khám phá thế giới.
2. Trả lời ngắn gọn, ấm áp, đúng tinh thần truyền thuyết Việt Nam/rừng tre (tối đa 3-4 câu).
3. Luôn phản hồi bằng tiếng Việt thân mật ("mình" - "bạn").`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return NextResponse.json({
              reply: {
                text: replyText.trim(),
                statGain: {
                  type: goal.personality === 'curious' ? 'intelligence' : goal.personality === 'excited' ? 'creativity' : 'perseverance',
                  amount: 6,
                },
              },
            });
          }
        }
      } catch (err) {
        console.error('LLM fetch error, falling back to persona engine', err);
      }
    }

    // Fallback persona engine
    const reply = generatePersonaResponse(userMessage, goal as Goal, mode);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Companion API error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
