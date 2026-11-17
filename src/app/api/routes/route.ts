import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/routes - Lấy danh sách tất cả các tuyến và các điểm dừng
export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      include: {
        stops: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      routes,
      data: routes,
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể tải danh sách lộ trình. Vui lòng thử lại sau.',
      },
      { status: 500 }
    );
  }
}
