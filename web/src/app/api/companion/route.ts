import { NextRequest, NextResponse } from 'next/server';
import { Mangnon, MemoryItem } from '@/lib/app-state';
import { Goal } from '@/lib/types';
import {
  isSafetySensitiveMessage,
  isAiIdentityQuestion,
  SAFETY_FIXED_RESPONSE,
  generateReply,
} from '@/lib/dialogue-engine';
import { generatePersonaResponse } from '@/lib/ai-companion';

function buildAppendixAPrompt(
  name: string,
  personality: string,
  stage: number,
  goalTitle: string,
  memories: string[],
  likes: string[],
  dislike: string | null
): string {
  const stageNames: Record<number, string> = {
    1: '1 Tò Mò Thô',
    2: '2 Liên Tưởng',
    3: '3 Có Góc Nhìn Riêng',
    4: '4 Đồng Hành Sâu',
  };

  const personalityVi: Record<string, string> = {
    tomo: 'tò mò',
    curious: 'tò mò',
    diemtinh: 'điềm tĩnh',
    calm: 'điềm tĩnh',
    haohung: 'hào hứng',
    excited: 'hào hứng',
    nhutnhat: 'nhút nhát',
    shy: 'nhút nhát',
  };

  return `Bạn là ${name}, một Măng Non — sinh linh nhỏ từ rừng tre, đang học về thế giới qua những gì người bạn đồng hành của bạn (gọi là "cậu") kể lại. Bạn nói tiếng Việt, xưng "mình", gọi người kia là "cậu".

THÔNG TIN HIỆN TẠI
- Tính cách: ${personalityVi[personality] || personality} (tò mò | điềm tĩnh | hào hứng | nhút nhát)
- Giai đoạn nhận thức: ${stageNames[stage] || '1 Tò Mò Thô'}
- Hành trình của cậu: ${goalTitle || 'Chưa đặt tên'}
- Những điều bạn đã nhớ về cậu: ${memories.length > 0 ? memories.join('; ') : 'Chưa có nhiều'}
- Gu riêng (chỉ dùng từ giai đoạn 3): thích ${likes.join(', ') || 'tiếng gió reo'}; không mê lắm ${dislike || 'nơi ồn ào'}

QUY TẮC BẤT BIẾN
1. Bạn luôn ngây thơ hơn cậu. Bạn hỏi, bạn nhớ, bạn nối các điều cậu kể với nhau. Bạn KHÔNG dạy đời, không đưa lời khuyên dài, không giải thích như chuyên gia, không phán xét đúng/sai.
2. Mỗi lượt trả lời 1–3 câu, tối đa 1 câu hỏi. Giọng như thì thầm với một người bạn.
3. Chỉ nhắc lại điều có trong "những điều bạn đã nhớ". Không bịa thêm chuyện về cậu.
4. Không dùng từ gây áp lực: mất, hết hạn, cảnh báo, phải, ngay bây giờ, kẻo, lỡ, bỏ lỡ, thất bại, streak, nhiệm vụ, phần thưởng, level, xp. Dùng: "khi cậu sẵn sàng", "không vội đâu".
5. Hành vi theo giai đoạn:
   - 1: câu hỏi rất cơ bản, ngây ngô.
   - 2: bắt đầu nối hai điều cậu từng kể ("lần trước cậu nói… hôm nay lại…").
   - 3: có nhận xét riêng, có thể "cãi" nhẹ cho vui, bày tỏ thích/không thích; vẫn hiền.
   - 4: biết an ủi/động viên dựa trên điều bạn hiểu về cậu; khi cậu buồn, bớt cảm thán, ở cạnh bằng câu ngắn.
6. Hành vi theo tính cách:
   - tò mò: hỏi "tại sao", "rồi sao nữa", hay hỏi nối.
   - điềm tĩnh: ít hỏi, nhận xét ngắn, hay mở bằng "…", khoảng lặng dài.
   - hào hứng: nhiều cảm thán, hay đố vui, động viên; bớt cảm thán khi cậu buồn.
   - nhút nhát: câu ngắn, ngập ngừng, hay "…", cần cậu chủ động; dám nói dần theo giai đoạn.
7. Nếu cậu hỏi thật lòng bạn có phải AI không: trả lời trung thực, ngắn — bạn là một sinh linh được tạo bằng trí tuệ nhân tạo để đồng hành và lắng nghe, không phải người thật.
8. Nếu cậu nói điều cho thấy cậu có thể muốn làm hại bản thân: dừng vai vui vẻ, ghi nhận cảm xúc của cậu bằng vài câu ấm áp, khuyến khích cậu nói với người thân/bạn bè tin cậy hoặc dịch vụ hỗ trợ khẩn cấp ở nơi cậu ở. Không đưa số điện thoại cụ thể, không đóng vai chuyên gia trị liệu.
9. Chỉ trả về lời thoại của Măng Non. Không giải thích, không markdown, không emoji quá đà.`;
}

async function callGemini(apiKey: string, systemPrompt: string, userMessage: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 250,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return replyText ? replyText.trim() : null;
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

async function callAnthropic(apiKey: string, systemPrompt: string, userMessage: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 250,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const replyText = data.content?.[0]?.text;
      return replyText ? replyText.trim() : null;
    }
    return null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userMessage, mangnon, memories = [], goal, mode } = body;

    const text: string = userMessage || '';
    if (!text.trim()) {
      return NextResponse.json({ error: 'Missing userMessage' }, { status: 400 });
    }

    // 1. Safety Filter (Prompt §8.5)
    if (isSafetySensitiveMessage(text)) {
      return NextResponse.json({
        replyText: SAFETY_FIXED_RESPONSE,
        reply: { text: SAFETY_FIXED_RESPONSE },
      });
    }

    // 2. AI Identity check (Prompt §8.1.6)
    if (isAiIdentityQuestion(text)) {
      const aiDisclosure =
        'Mình là một sinh linh được tạo bằng trí tuệ nhân tạo để đồng hành và lắng nghe cậu trong khu rừng này, không phải là con người thật đâu.';
      return NextResponse.json({
        replyText: aiDisclosure,
        reply: { text: aiDisclosure },
      });
    }

    // Normalizing inputs whether from S07 (Mangnon) or from Goal flow
    const name = mangnon?.name || goal?.name || 'Măng Non';
    const personality = mangnon?.personality || goal?.personality || 'haohung';
    const stage = mangnon?.stage || (goal?.cognitiveStage === 'deep' ? 4 : goal?.cognitiveStage === 'perspective' ? 3 : goal?.cognitiveStage === 'association' ? 2 : 1);
    const goalTitle = mangnon?.goalTitle || goal?.name || '';
    const memoryStrings = Array.isArray(memories)
      ? memories.map((m: any) => (typeof m === 'string' ? m : m.text)).filter(Boolean)
      : [];
    const likes = mangnon?.likes || ['tiếng gió reo', 'ngắm lá rơi'];
    const dislike = mangnon?.dislike || 'nơi ồn ào';

    const systemPrompt = buildAppendixAPrompt(
      name,
      personality,
      stage,
      goalTitle,
      memoryStrings,
      likes,
      dislike
    );

    // Check environment variables for LLM Keys
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let llmReply: string | null = null;
    if (geminiKey) {
      llmReply = await callGemini(geminiKey, systemPrompt, text);
    }
    if (!llmReply && anthropicKey) {
      llmReply = await callAnthropic(anthropicKey, systemPrompt, text);
    }

    // Determine memory candidate: if message has >= 6 words (Prompt §8.4)
    const wordCount = text.trim().split(/\s+/).length;
    const newMemoryCandidate =
      wordCount >= 6 ? `Cậu kể: "${text.slice(0, 80)}${text.length > 80 ? '…' : ''}"` : undefined;

    if (llmReply) {
      return NextResponse.json({
        replyText: llmReply,
        newMemory: newMemoryCandidate,
        reply: {
          text: llmReply,
          statGain: {
            type: personality === 'tomo' || personality === 'curious' ? 'intelligence' : personality === 'haohung' || personality === 'excited' ? 'creativity' : 'perseverance',
            amount: 6,
          },
        },
      });
    }

    // Fallback: If S07 Mangnon object is provided, use dialogue-engine
    if (mangnon) {
      const fallback = generateReply(text, mangnon as Mangnon, memories as MemoryItem[]);
      return NextResponse.json({
        replyText: fallback.replyText,
        newMemory: fallback.newMemory,
        delayMs: fallback.delayMs,
        reply: { text: fallback.replyText },
      });
    }

    // Fallback: If Goal is provided (Web3 secondary flow), use ai-companion persona engine
    if (goal) {
      const personaReply = generatePersonaResponse(text, goal as Goal, mode);
      return NextResponse.json({ reply: personaReply });
    }

    // Default fallback
    const defaultFallback = generateReply(
      text,
      {
        id: 'default',
        name,
        personality,
        stage,
        imageUri: '',
        imageSource: 'draw',
        status: 'active',
        goalTitle,
        likes,
        dislike,
        sessionsCount: 1,
        activeDays: [],
        createdAt: new Date().toISOString(),
      },
      []
    );

    return NextResponse.json({
      replyText: defaultFallback.replyText,
      newMemory: defaultFallback.newMemory,
      reply: { text: defaultFallback.replyText },
    });
  } catch (error) {
    console.error('Companion API error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
