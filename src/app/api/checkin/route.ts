import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { config } from '@/lib/config';
import { isWithinRange } from '@/lib/geo';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const authUser = await authenticateRequest(authHeader);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Yêu cầu đăng nhập để thực hiện check-in.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { routeId = '1', qrCode, latitude, longitude } = body;

    if (!qrCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu mã QR check-in.',
        },
        { status: 400 }
      );
    }

    // Lấy hoặc tạo User dựa trên Privy ID
    const shortId = authUser.privyId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    const user = await prisma.user.upsert({
      where: { privyId: authUser.privyId },
      update: {},
      create: {
        privyId: authUser.privyId,
        visibleName: `Nhà thám hiểm #${shortId}`,
      },
    });

    // Tìm điểm dừng theo mã QR
    const stop = await prisma.stop.findUnique({
      where: { qrCode: qrCode.trim() },
      include: { route: true },
    });

    if (!stop || stop.routeId !== routeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mã QR không hợp lệ hoặc không thuộc lộ trình này.',
        },
        { status: 404 }
      );
    }

    // Kiểm tra vị trí địa lý GPS (trừ khi bật chế độ DEMO)
    if (!config.IS_DEMO_MODE) {
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return NextResponse.json(
          {
            success: false,
            error: 'Cần cung cấp toạ độ GPS chính xác để check-in.',
          },
          { status: 400 }
        );
      }

      const withinRange = isWithinRange(
        latitude,
        longitude,
        stop.lat,
        stop.lng,
        config.MAX_CHECKIN_DISTANCE_METERS
      );

      if (!withinRange) {
        return NextResponse.json(
          {
            success: false,
            error: `Bạn đang ở quá xa điểm dừng (yêu cầu trong phạm vi ${config.MAX_CHECKIN_DISTANCE_METERS}m).`,
          },
          { status: 400 }
        );
      }
    }

    // Kiểm tra giới hạn chống gian lận
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Kiểm tra đã check-in điểm này trong ngày chưa
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: {
        userId: user.id,
        stopId: stop.id,
        date: todayStr,
      },
    });

    if (existingCheckIn && !config.IS_DEMO_MODE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn đã check-in tại điểm dừng này trong ngày hôm nay rồi.',
        },
        { status: 400 }
      );
    }

    // 2. Lưu check-in (LƯU Ý: KHÔNG LƯU TOẠ ĐỘ GPS VÀO DB ĐỂ BẢO VỆ RIÊNG TƯ)
    if (!existingCheckIn) {
      await prisma.checkIn.create({
        data: {
          userId: user.id,
          stopId: stop.id,
          routeId: routeId,
          date: todayStr,
        },
      });
    }

    // Lấy tiến độ hiện tại
    const [checkedStopsCount, totalStopsCount] = await Promise.all([
      prisma.checkIn.count({
        where: {
          userId: user.id,
          routeId,
          date: todayStr,
        },
      }),
      prisma.stop.count({
        where: { routeId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Check-in thành công tại ${stop.name}!`,
      stopName: stop.name,
      data: {
        checkedStopsCount,
        totalStopsCount,
        isCompleted: checkedStopsCount >= totalStopsCount,
      },
    });
  } catch (error) {
    console.error('Error during check-in:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Có lỗi xảy ra trong quá trình check-in. Vui lòng thử lại.',
      },
      { status: 500 }
    );
  }
}
