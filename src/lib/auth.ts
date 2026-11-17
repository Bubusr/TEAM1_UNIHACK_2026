/**
 * Server-side authentication helper cho BusQuest.
 * Hỗ trợ xác thực người dùng và fallback tài khoản ẩn danh cho bản demo testnet.
 */

export interface AuthUser {
  privyId: string;
  walletAddress?: string;
}

/**
 * Xác thực request và trả về thông tin người dùng.
 */
export async function authenticateRequest(
  authHeader: string | null
): Promise<AuthUser | null> {
  // 1. Nếu có header Bearer
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      return {
        privyId: `player_${token.slice(0, 10)}`,
        walletAddress: '0x1111111111111111111111111111111111111111',
      };
    }
  }

  // 2. Fallback tài khoản demo testnet mặc định
  return {
    privyId: 'fuji_explorer_player_001',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };
}
