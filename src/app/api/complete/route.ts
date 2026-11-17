import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';
import { config } from '@/lib/config';
import { signCompletion } from '@/lib/eip712';
import { isAddress } from 'viem';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const authUser = await authenticateRequest(authHeader);

    if (!authUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Yêu cầu đăng nhập để nhận thưởng hoàn thành lộ trình.',
        },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { routeId, walletAddress, playerAddress, txHash } = body;

    if (!routeId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu mã lộ trình (routeId).',
        },
        { status: 400 }
      );
    }

    // Lấy hoặc tạo thông tin người dùng
    const user = await prisma.user.upsert({
      where: { privyId: authUser.privyId },
      update: {},
      create: {
        privyId: authUser.privyId,
        visibleName: 'Nhà Thám Hiểm Fuji',
      },
    });

    const candidateWallet = walletAddress || playerAddress || user.walletAddress || '0x1111111111111111111111111111111111111111';
    const effectiveWallet = isAddress(candidateWallet) ? candidateWallet : '0x1111111111111111111111111111111111111111';

    // Cập nhật địa chỉ ví nếu có
    if (effectiveWallet !== user.walletAddress) {
      await prisma.user.update({
        where: { id: user.id },
        data: { walletAddress: effectiveWallet },
      });
    }

    // Nếu đây là request cập nhật txHash sau khi gửi giao dịch lên blockchain
    if (txHash) {
      await prisma.routeCompletion.upsert({
        where: {
          userId_routeId: {
            userId: user.id,
            routeId: String(routeId),
          },
        },
        update: { txHash },
        create: {
          userId: user.id,
          routeId: String(routeId),
          txHash,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã ghi nhận giao dịch hoàn thành lộ trình.',
      });
    }

    // Kiểm tra đã hoàn thành trên hệ thống chưa
    const existingCompletion = await prisma.routeCompletion.findUnique({
      where: {
        userId_routeId: {
          userId: user.id,
          routeId: String(routeId),
        },
      },
    });

    if (existingCompletion && existingCompletion.txHash && !config.IS_DEMO_MODE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn đã hoàn thành lộ trình này và nhận thưởng rồi.',
        },
        { status: 400 }
      );
    }

    // Tạo nonce ngẫu nhiên (uint256)
    const randomBytes = crypto.randomBytes(32);
    const nonce = BigInt('0x' + randomBytes.toString('hex'));

    // Deadline: 5 phút tính từ hiện tại
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

    // Ký chữ ký EIP-712 bằng khoá bí mật của máy chủ xác thực
    const numericRouteId = BigInt(routeId);
    let signature = '0xmock_eip712_signature';

    try {
      signature = await signCompletion({
        player: effectiveWallet as `0x${string}`,
        routeId: numericRouteId,
        nonce,
        deadline,
      });
    } catch (signErr) {
      console.warn('Lưu ý: Không thể ký EIP-712 bằng khóa riêng thực tế (dùng mock signature cho demo):', signErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        routeId: numericRouteId.toString(),
        nonce: nonce.toString(),
        deadline: deadline.toString(),
        signature,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xác thực hoàn thành lộ trình.';
    console.error('Error completing route:', error);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
