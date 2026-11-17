import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const authUser = await authenticateRequest(authHeader);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Yêu cầu đăng nhập để xem tiến độ.',
        },
        { status: 401 }
      );
    }

    const { routeId } = await params;
    if (!routeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu routeId.',
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { privyId: authUser.privyId },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          checkedStopsCount: 0,
          totalStopsCount: 0,
          checkedStopIds: [],
          isCompleted: false,
          routeCompleted: false,
        },
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const [todayCheckIns, totalStops, routeCompletion] = await Promise.all([
      prisma.checkIn.findMany({
        where: {
          userId: user.id,
          routeId,
          date: todayStr,
        },
        select: { stopId: true },
      }),
      prisma.stop.count({
        where: { routeId },
      }),
      prisma.routeCompletion.findUnique({
        where: {
          userId_routeId: {
            userId: user.id,
            routeId,
          },
        },
      }),
    ]);

    const checkedStopIds = todayCheckIns.map((c) => c.stopId);
    const checkedStopsCount = checkedStopIds.length;
    const isCompleted = totalStops > 0 && checkedStopsCount >= totalStops;

    return NextResponse.json({
      success: true,
      data: {
        checkedStopsCount,
        totalStopsCount: totalStops,
        checkedStopIds,
        isCompleted,
        routeCompleted: !!routeCompletion,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Không thể lấy thông tin tiến độ.',
      },
      { status: 500 }
    );
  }
}
