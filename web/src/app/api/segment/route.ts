import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      image_base64,
      model = 'auto',
      remove_bg_api_key,
      clipdrop_api_key,
      replicate_api_token,
    } = body;

    if (!image_base64) {
      return NextResponse.json({ error: 'Missing image_base64' }, { status: 400 });
    }

    // 1. Gọi Python FastAPI Microservice (chạy ở localhost:8000)
    try {
      const pyRes = await fetch('http://127.0.0.1:8000/api/segment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64,
          model,
          remove_bg_api_key: remove_bg_api_key || process.env.REMOVE_BG_API_KEY,
          clipdrop_api_key: clipdrop_api_key || process.env.CLIPDROP_API_KEY,
          replicate_api_token: replicate_api_token || process.env.REPLICATE_API_TOKEN,
        }),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (pyRes.ok) {
        const data = await pyRes.json();
        return NextResponse.json(data);
      }
    } catch (pyErr) {
      console.warn('Python server /api/segment not responding or timed out:', pyErr);
    }

    // 2. Fallback nếu Python server chưa bật
    return NextResponse.json({
      status: 'fallback',
      engine: 'Next.js Client-Side Stroke Fallback',
      message: 'Python FastAPI server chưa phản hồi. Hệ thống sử dụng thuật toán quét nét đồ họa tích hợp.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
