import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image_base64, motion = 'walk', use_replicate = false } = body;

    if (!image_base64) {
      return NextResponse.json({ error: 'Missing image_base64' }, { status: 400 });
    }

    // 1. Thử gọi Python FastAPI Microservice (chạy ở localhost:8000)
    try {
      const formData = new FormData();
      formData.append('image_base64', image_base64);
      formData.append('motion', motion);
      formData.append('use_replicate', String(use_replicate));

      const pyRes = await fetch('http://127.0.0.1:8000/api/animate-drawing', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(12000), // 12s timeout
      });

      if (pyRes.ok) {
        const data = await pyRes.json();
        return NextResponse.json(data);
      }
    } catch (pyErr) {
      console.warn('Python server not responding, falling back to Next.js handler:', pyErr);
    }

    // 2. Fallback nếu Python server chưa bật
    return NextResponse.json({
      status: 'fallback',
      engine: 'Next.js Client-Side Meta Rig Fallback',
      motion,
      message: 'Python server đang khởi động. Vui lòng thử lại sau vài giây hoặc kiểm tra server port 8000.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

