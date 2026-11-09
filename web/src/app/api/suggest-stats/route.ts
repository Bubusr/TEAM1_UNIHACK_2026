import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { goalName, description } = await req.json();

    const lower = `${goalName} ${description || ''}`.toLowerCase();

    let intelligence = 40;
    let perseverance = 40;
    let fitness = 20;
    let creativity = 30;
    let suggestedPersonality: 'curious' | 'calm' | 'excited' | 'shy' = 'curious';

    if (lower.includes('ielts') || lower.includes('anh') || lower.includes('code') || lower.includes('lập trình') || lower.includes('học')) {
      intelligence = 65;
      perseverance = 55;
      creativity = 40;
      fitness = 15;
      suggestedPersonality = 'curious';
    } else if (lower.includes('chạy') || lower.includes('gym') || lower.includes('thể thao') || lower.includes('bơi')) {
      fitness = 75;
      perseverance = 60;
      intelligence = 20;
      creativity = 25;
      suggestedPersonality = 'excited';
    } else if (lower.includes('thiền') || lower.includes('sách') || lower.includes('tâm trí') || lower.includes('nghỉ')) {
      perseverance = 60;
      creativity = 50;
      intelligence = 45;
      fitness = 25;
      suggestedPersonality = 'calm';
    } else if (lower.includes('vẽ') || lower.includes('nhạc') || lower.includes('viết') || lower.includes('sáng tạo')) {
      creativity = 75;
      intelligence = 45;
      perseverance = 45;
      fitness = 15;
      suggestedPersonality = 'excited';
    }

    return NextResponse.json({
      stats: {
        intelligence,
        perseverance,
        fitness,
        creativity,
      },
      suggestedPersonality,
      explanation: `Dựa trên mục tiêu "${goalName}", AI đề xuất bộ chỉ số nhấn mạnh vào các phẩm chất then chốt để Măng Non cùng bạn nuôi dưỡng.`,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to suggest stats' }, { status: 500 });
  }
}

