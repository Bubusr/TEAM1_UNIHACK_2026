/**
 * MĂNG NON — AI Auto-Rigging & 2D Paper Puppet Animation Engine (Meta Demo Lab & Teri Gumball)
 * - Khung xương chuẩn Meta Animated Drawings (sketch.metademolab.com):
 *   + Hỗ trợ 3 Loại Khung Xương (Skeleton Types):
 *     1. Người 2 tay 2 chân (Meta Humanoid 16 khớp chuẩn + khuôn mặt)
 *     2. Không tay / Bé Măng Chibi (Armless Rig)
 *     3. Linh thú 4 chân Đông Hồ (Quadruped Rig)
 *   + Hình nhân mẫu đối chiếu (Humanoid Reference Mannequin Guide)
 *   + Tự động quét pixel nét vẽ trên Canvas để căn chỉnh khớp (CV Auto-Rigging)
 * - Cơ chế RỐI GIẤY 2D NGUYÊN KHỐI (Continuous Paper Cutout Deformation - Phong cách Gumball Teri):
 *   Không cắt rời hình làm đứt nét; toàn bộ bức vẽ được uốn cong, co giãn (squash & stretch),
 *   nghiêng lướt (skew) và viền trắng die-cut sticker như một con rối giấy thực thụ.
 * - Hỗ trợ Xoay 2.5D Turntable và Di chuyển phối cảnh 3 chiều (X, Y, Z depth).
 */

export interface JointNode {
  id: string;
  name: string;
  relX: number; // Tọa độ tương đối 0..1
  relY: number;
  type:
    | 'head'
    | 'eye_l'
    | 'eye_r'
    | 'nose'
    | 'mouth'
    | 'neck'
    | 'shoulder_l'
    | 'shoulder_r'
    | 'elbow_l'
    | 'elbow_r'
    | 'hand_l'
    | 'hand_r'
    | 'spine'
    | 'hip'
    | 'hip_l'
    | 'hip_r'
    | 'knee_l'
    | 'knee_r'
    | 'foot_l'
    | 'foot_r';
}

export interface SkeletonRig {
  joints: JointNode[];
  bones: [string, string][];
}

export interface RigPose {
  hopY: number;
  squashX: number;
  stretchY: number;
  skewX: number;
  bodyBend: number;      // Độ cong uốn lượn của tờ giấy
  headTilt: number;
  armAngleL: number;
  armAngleR: number;
  legOffsetL: number;
  legOffsetR: number;
  eyeBlink: number;      // 0: mở, 1: chớp
  mouthOpen: number;     // 0..1
  breathY: number;
}

export type CreatureAction =
  | 'idle'          // Đứng thở êm dịu
  // Meta Walking
  | 'walk'          // Đi bộ sải bước nhịp nhàng
  | 'run'           // Chạy bộ rướn người nhanh
  | 'sneak'         // Đi rón rén nhẹ nhàng
  // Meta Jumping
  | 'happy_jump'    // Nhảy cẫng lên vui sướng
  | 'paper_flutter' // Nhảy lơ lửng chao đảo giấy Teri
  | 'hop'           // Nhảy lò cò
  // Meta Dancing
  | 'dance'         // Múa lượn uốn cong tờ giấy
  | 'wave'          // Vẫy tay chào người chơi
  | 'spin'          // Xoay tròn duyên dáng
  // Meta Funny
  | 'teri_panic'    // Hoảng sợ rung rinh kiểu gấu giấy Teri Gumball
  | 'sad'           // Buồn bã, ủ rũ
  | 'sleep';        // Gấp giấy lại nghỉ ngơi

export type SkeletonType = 'meta_humanoid' | 'armless_chibi' | 'quadruped';

export interface SkeletonTypeOption {
  id: SkeletonType;
  name: string;
  badge: string;
  desc: string;
}

export const SKELETON_TYPE_OPTIONS: SkeletonTypeOption[] = [
  {
    id: 'meta_humanoid',
    name: 'Người 2 tay 2 chân',
    badge: 'Chuẩn Meta 16 khớp',
    desc: 'Đầy đủ khớp vai, khuỷu, cổ tay, hông, gối, mắt, miệng',
  },
  {
    id: 'armless_chibi',
    name: 'Không tay / Bé Măng Chibi',
    badge: 'Armless Rig',
    desc: 'Thân tròn, đầu măng, không cánh tay (hoặc tay giấu sau áo)',
  },
  {
    id: 'quadruped',
    name: 'Linh thú 4 chân',
    badge: 'Quadruped Rig',
    desc: 'Cáo, trâu nước, thú 4 chân có 2 chân trước & 2 chân sau',
  },
];

/**
 * 1. Khung xương sinh vật hình người chuẩn Meta Demo Lab (16 khớp + khuôn mặt)
 */
export function generateDefaultHumanoidRig(): SkeletonRig {
  const joints: JointNode[] = [
    // Vùng đầu & mặt
    { id: 'head', name: 'Đỉnh đầu', relX: 0.5, relY: 0.12, type: 'head' },
    { id: 'eye_l', name: 'Mắt trái', relX: 0.42, relY: 0.22, type: 'eye_l' },
    { id: 'eye_r', name: 'Mắt phải', relX: 0.58, relY: 0.22, type: 'eye_r' },
    { id: 'nose', name: 'Mũi', relX: 0.5, relY: 0.26, type: 'nose' },
    { id: 'mouth', name: 'Miệng', relX: 0.5, relY: 0.3, type: 'mouth' },
    { id: 'neck', name: 'Khớp cổ', relX: 0.5, relY: 0.36, type: 'neck' },

    // Tay trái
    { id: 'shoulder_l', name: 'Vai trái', relX: 0.32, relY: 0.4, type: 'shoulder_l' },
    { id: 'elbow_l', name: 'Khuỷu tay trái', relX: 0.22, relY: 0.5, type: 'elbow_l' },
    { id: 'hand_l', name: 'Bàn tay trái', relX: 0.14, relY: 0.62, type: 'hand_l' },

    // Tay phải
    { id: 'shoulder_r', name: 'Vai phải', relX: 0.68, relY: 0.4, type: 'shoulder_r' },
    { id: 'elbow_r', name: 'Khuỷu tay phải', relX: 0.78, relY: 0.5, type: 'elbow_r' },
    { id: 'hand_r', name: 'Bàn tay phải', relX: 0.86, relY: 0.62, type: 'hand_r' },

    // Trục thân & áo & 2 bên hông (Khung chậu chuẩn Meta Demo Lab)
    { id: 'spine', name: 'Thân & Áo', relX: 0.5, relY: 0.54, type: 'spine' },
    { id: 'hip_l', name: 'Hông trái', relX: 0.42, relY: 0.7, type: 'hip_l' },
    { id: 'hip_r', name: 'Hông phải', relX: 0.58, relY: 0.7, type: 'hip_r' },

    // Chân trái
    { id: 'knee_l', name: 'Đầu gối trái', relX: 0.38, relY: 0.82, type: 'knee_l' },
    { id: 'foot_l', name: 'Bàn chân trái', relX: 0.35, relY: 0.95, type: 'foot_l' },

    // Chân phải
    { id: 'knee_r', name: 'Đầu gối phải', relX: 0.62, relY: 0.82, type: 'knee_r' },
    { id: 'foot_r', name: 'Bàn chân phải', relX: 0.65, relY: 0.95, type: 'foot_r' },
  ];

  const bones: [string, string][] = [
    // Trục chính & Khung xương chậu
    ['head', 'neck'],
    ['neck', 'spine'],
    ['spine', 'hip_l'],
    ['spine', 'hip_r'],
    ['hip_l', 'hip_r'],
    // Khớp khuôn mặt
    ['head', 'eye_l'],
    ['head', 'eye_r'],
    ['eye_l', 'nose'],
    ['eye_r', 'nose'],
    ['nose', 'mouth'],
    ['mouth', 'neck'],
    // Cánh tay trái
    ['neck', 'shoulder_l'],
    ['shoulder_l', 'elbow_l'],
    ['elbow_l', 'hand_l'],
    // Cánh tay phải
    ['neck', 'shoulder_r'],
    ['shoulder_r', 'elbow_r'],
    ['elbow_r', 'hand_r'],
    // Chân trái (Nối từ Hông trái)
    ['hip_l', 'knee_l'],
    ['knee_l', 'foot_l'],
    // Chân phải (Nối từ Hông phải)
    ['hip_r', 'knee_r'],
    ['knee_r', 'foot_r'],
  ];

  return { joints, bones };
}

/**
 * 2. Khung xương không tay (Armless / Bé Măng tròn)
 * Dành cho nhân vật búp măng, giọt nước hoặc nhân vật hoạt hình không có tay
 */
export function generateArmlessChibiRig(): SkeletonRig {
  const joints: JointNode[] = [
    { id: 'head', name: 'Đỉnh đầu', relX: 0.5, relY: 0.14, type: 'head' },
    { id: 'eye_l', name: 'Mắt trái', relX: 0.42, relY: 0.28, type: 'eye_l' },
    { id: 'eye_r', name: 'Mắt phải', relX: 0.58, relY: 0.28, type: 'eye_r' },
    { id: 'nose', name: 'Mũi', relX: 0.5, relY: 0.33, type: 'nose' },
    { id: 'mouth', name: 'Miệng', relX: 0.5, relY: 0.38, type: 'mouth' },
    { id: 'neck', name: 'Khớp cổ', relX: 0.5, relY: 0.44, type: 'neck' },
    { id: 'spine', name: 'Thân măng', relX: 0.5, relY: 0.6, type: 'spine' },
    { id: 'hip_l', name: 'Hông trái', relX: 0.44, relY: 0.74, type: 'hip_l' },
    { id: 'hip_r', name: 'Hông phải', relX: 0.56, relY: 0.74, type: 'hip_r' },
    { id: 'knee_l', name: 'Đầu gối trái', relX: 0.4, relY: 0.86, type: 'knee_l' },
    { id: 'foot_l', name: 'Bàn chân trái', relX: 0.37, relY: 0.96, type: 'foot_l' },
    { id: 'knee_r', name: 'Đầu gối phải', relX: 0.6, relY: 0.86, type: 'knee_r' },
    { id: 'foot_r', name: 'Bàn chân phải', relX: 0.63, relY: 0.96, type: 'foot_r' },
  ];

  const bones: [string, string][] = [
    ['head', 'neck'],
    ['neck', 'spine'],
    ['spine', 'hip_l'],
    ['spine', 'hip_r'],
    ['hip_l', 'hip_r'],
    ['head', 'eye_l'],
    ['head', 'eye_r'],
    ['eye_l', 'nose'],
    ['eye_r', 'nose'],
    ['nose', 'mouth'],
    ['mouth', 'neck'],
    ['hip_l', 'knee_l'],
    ['knee_l', 'foot_l'],
    ['hip_r', 'knee_r'],
    ['knee_r', 'foot_r'],
  ];

  return { joints, bones };
}

/**
 * 3. Khung xương linh thú 4 chân Đông Hồ (Cáo, Trâu nước, Chó vàng)
 */
export function generateQuadrupedRig(): SkeletonRig {
  const joints: JointNode[] = [
    { id: 'head', name: 'Đầu thú', relX: 0.26, relY: 0.2, type: 'head' },
    { id: 'eye_l', name: 'Mắt trước', relX: 0.2, relY: 0.22, type: 'eye_l' },
    { id: 'eye_r', name: 'Mắt sau', relX: 0.3, relY: 0.22, type: 'eye_r' },
    { id: 'nose', name: 'Mõm thú', relX: 0.14, relY: 0.28, type: 'nose' },
    { id: 'mouth', name: 'Miệng thú', relX: 0.16, relY: 0.34, type: 'mouth' },
    { id: 'neck', name: 'Cổ thú', relX: 0.35, relY: 0.36, type: 'neck' },
    { id: 'spine', name: 'Sống lưng', relX: 0.54, relY: 0.42, type: 'spine' },
    { id: 'hip_l', name: 'Hông sau trái', relX: 0.70, relY: 0.45, type: 'hip_l' },
    { id: 'hip_r', name: 'Hông sau phải', relX: 0.78, relY: 0.45, type: 'hip_r' },
    // 2 chân trước
    { id: 'shoulder_l', name: 'Vai trước trái', relX: 0.38, relY: 0.52, type: 'shoulder_l' },
    { id: 'elbow_l', name: 'Gối trước trái', relX: 0.36, relY: 0.72, type: 'elbow_l' },
    { id: 'hand_l', name: 'Bàn chân trước trái', relX: 0.34, relY: 0.95, type: 'hand_l' },
    { id: 'shoulder_r', name: 'Vai trước phải', relX: 0.46, relY: 0.52, type: 'shoulder_r' },
    { id: 'elbow_r', name: 'Gối trước phải', relX: 0.48, relY: 0.72, type: 'elbow_r' },
    { id: 'hand_r', name: 'Bàn chân trước phải', relX: 0.5, relY: 0.95, type: 'hand_r' },
    // 2 chân sau
    { id: 'knee_l', name: 'Gối sau trái', relX: 0.68, relY: 0.72, type: 'knee_l' },
    { id: 'foot_l', name: 'Bàn chân sau trái', relX: 0.66, relY: 0.95, type: 'foot_l' },
    { id: 'knee_r', name: 'Gối sau phải', relX: 0.8, relY: 0.72, type: 'knee_r' },
    { id: 'foot_r', name: 'Bàn chân sau phải', relX: 0.82, relY: 0.95, type: 'foot_r' },
  ];

  const bones: [string, string][] = [
    ['head', 'neck'],
    ['neck', 'spine'],
    ['spine', 'hip_l'],
    ['spine', 'hip_r'],
    ['hip_l', 'hip_r'],
    ['head', 'eye_l'],
    ['head', 'eye_r'],
    ['eye_l', 'nose'],
    ['eye_r', 'nose'],
    ['nose', 'mouth'],
    ['mouth', 'neck'],
    ['neck', 'shoulder_l'],
    ['shoulder_l', 'elbow_l'],
    ['elbow_l', 'hand_l'],
    ['neck', 'shoulder_r'],
    ['shoulder_r', 'elbow_r'],
    ['elbow_r', 'hand_r'],
    ['hip_l', 'knee_l'],
    ['knee_l', 'foot_l'],
    ['hip_r', 'knee_r'],
    ['knee_r', 'foot_r'],
  ];

  return { joints, bones };
}

export function generateRigByType(type: SkeletonType): SkeletonRig {
  if (type === 'armless_chibi') return generateArmlessChibiRig();
  if (type === 'quadruped') return generateQuadrupedRig();
  return generateDefaultHumanoidRig();
}

export const generateDefaultRig = generateDefaultHumanoidRig;

/**
 * THUẬT TOÁN THỊ GIÁC MÁY TÍNH AI (Computer Vision Auto-Rigging):
 * Quét trực tiếp ma trận điểm ảnh (pixels) của nét vẽ người chơi trên Canvas:
 * 1. Định vị Bounding Box & Trọng tâm toàn thân.
 * 2. Phân tầng theo tỷ lệ sinh học hình người / loài thú: Đầu, Ngũ quan (Mắt, Mũi, Miệng), Cổ, Vai, Khuỷu, Tay, Thân, Hông, Gối, Bàn chân.
 * 3. Tự động gắn khớp xương chính xác khớp với từng nét vẽ thực tế của người chơi.
 */
export function detectHumanoidRigFromCanvas(
  canvas: HTMLCanvasElement,
  skeletonType: SkeletonType = 'meta_humanoid'
): SkeletonRig {
  const ctx = canvas.getContext('2d');
  if (!ctx) return generateRigByType(skeletonType);

  const width = canvas.width;
  const height = canvas.height;
  let imgData: ImageData;
  try {
    imgData = ctx.getImageData(0, 0, width, height);
  } catch {
    return generateRigByType(skeletonType);
  }

  const data = imgData.data;

  // 1. Quét tìm tất cả các pixel có nét vẽ (không phải nền trắng thuần hay trong suốt)
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  let totalDrawn = 0;
  const drawn = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Pixel được tính là nét vẽ khi có độ mờ > 35 và không phải là màu trắng nền
      const isStroke = a > 35 && (r < 235 || g < 235 || b < 235);
      if (isStroke) {
        drawn[rowOffset + x] = 1;
        totalDrawn++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Nếu người chơi chưa vẽ hoặc vẽ quá ít (dưới 35 pixel), trả về rig mặc định
  if (totalDrawn < 35 || maxX <= minX + 8 || maxY <= minY + 12) {
    return generateRigByType(skeletonType);
  }

  const boxW = maxX - minX;
  const boxH = maxY - minY;
  const centerX = (minX + maxX) / 2;

  // 2. Phân vùng dọc theo giải phẫu sinh vật:
  const headEndY = minY + boxH * 0.32;
  const torsoEndY = minY + boxH * 0.65;

  // --- Tính trọng tâm đầu & tìm vị trí 2 mắt ---
  let headSumX = 0;
  let headSumY = 0;
  let headCount = 0;

  let minLumL = 255;
  let eyeLX = centerX - boxW * 0.14;
  let eyeLY = minY + boxH * 0.18;

  let minLumR = 255;
  let eyeRX = centerX + boxW * 0.14;
  let eyeRY = minY + boxH * 0.18;

  for (let y = Math.floor(minY); y < headEndY; y++) {
    const rowOffset = y * width;
    for (let x = Math.floor(minX); x <= maxX; x++) {
      if (drawn[rowOffset + x]) {
        headSumX += x;
        headSumY += y;
        headCount++;

        const idx = (rowOffset + x) * 4;
        const lum = (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;

        // Dò vết chấm tối màu đại diện cho mắt trái / phải
        if (y > minY + boxH * 0.08 && y < minY + boxH * 0.28) {
          if (x < centerX && lum < minLumL) {
            minLumL = lum;
            eyeLX = x;
            eyeLY = y;
          } else if (x > centerX && lum < minLumR) {
            minLumR = lum;
            eyeRX = x;
            eyeRY = y;
          }
        }
      }
    }
  }

  const headCentroidX = headCount > 0 ? headSumX / headCount : centerX;
  const headTopY = minY + boxH * 0.05;

  const noseX = (eyeLX + eyeRX) / 2;
  const noseY = Math.min(headEndY - boxH * 0.05, (eyeLY + eyeRY) / 2 + boxH * 0.045);
  const mouthX = noseX;
  const mouthY = Math.min(headEndY - boxH * 0.02, noseY + boxH * 0.045);
  const neckX = headCentroidX;
  const neckY = headEndY;

  // --- Tính trọng tâm thân, vai & sải tay ---
  let torsoSumX = 0;
  let torsoSumY = 0;
  let torsoCount = 0;
  let armLeftX = centerX;
  let armLeftY = neckY + boxH * 0.15;
  let armRightX = centerX;
  let armRightY = neckY + boxH * 0.15;

  for (let y = Math.floor(neckY); y < torsoEndY; y++) {
    const rowOffset = y * width;
    for (let x = Math.floor(minX); x <= maxX; x++) {
      if (drawn[rowOffset + x]) {
        torsoSumX += x;
        torsoSumY += y;
        torsoCount++;

        if (x < armLeftX) {
          armLeftX = x;
          armLeftY = y;
        }
        if (x > armRightX) {
          armRightX = x;
          armRightY = y;
        }
      }
    }
  }

  const spineX = torsoCount > 0 ? torsoSumX / torsoCount : centerX;
  const spineY = (neckY + torsoEndY) / 2;
  const hipLX = Math.max(minX, spineX - boxW * 0.14);
  const hipRX = Math.min(maxX, spineX + boxW * 0.14);
  const hipY = torsoEndY;

  // Căn chỉnh 2 vai theo chiều ngang thân
  const shoulderLX = Math.max(minX, spineX - boxW * 0.25);
  const shoulderLY = neckY + boxH * 0.04;
  const shoulderRX = Math.min(maxX, spineX + boxW * 0.25);
  const shoulderRY = neckY + boxH * 0.04;

  const handLX = Math.min(shoulderLX - 4, armLeftX);
  const handLY = Math.max(shoulderLY, armLeftY);
  const elbowLX = (shoulderLX + handLX) / 2;
  const elbowLY = (shoulderLY + handLY) / 2;

  const handRX = Math.max(shoulderRX + 4, armRightX);
  const handRY = Math.max(shoulderRY, armRightY);
  const elbowRX = (shoulderRX + handRX) / 2;
  const elbowRY = (shoulderRY + handRY) / 2;

  // --- Tính trọng tâm 2 chân & bàn chân chạm đất ---
  let footLeftX = centerX - boxW * 0.18;
  let footLeftY = maxY;
  let footRightX = centerX + boxW * 0.18;
  let footRightY = maxY;
  let leftFootFound = false;
  let rightFootFound = false;

  for (let y = Math.floor(maxY); y >= torsoEndY; y--) {
    const rowOffset = y * width;
    for (let x = Math.floor(minX); x <= maxX; x++) {
      if (drawn[rowOffset + x]) {
        if (!leftFootFound && x < centerX) {
          footLeftX = x;
          footLeftY = y;
          leftFootFound = true;
        }
        if (!rightFootFound && x >= centerX) {
          footRightX = x;
          footRightY = y;
          rightFootFound = true;
        }
      }
    }
    if (leftFootFound && rightFootFound) break;
  }

  const kneeLX = (hipLX + footLeftX) / 2;
  const kneeLY = (hipY + footLeftY) / 2;
  const kneeRX = (hipRX + footRightX) / 2;
  const kneeRY = (hipY + footRightY) / 2;

  // Chuyển đổi toàn bộ tọa độ sang tỷ lệ tương đối chuẩn hóa (0.04..0.96)
  const toRel = (x: number, y: number) => ({
    relX: Math.max(0.04, Math.min(0.96, Number((x / width).toFixed(3)))),
    relY: Math.max(0.04, Math.min(0.96, Number((y / height).toFixed(3)))),
  });

  if (skeletonType === 'armless_chibi') {
    const armlessJoints: JointNode[] = [
      { id: 'head', name: 'Đỉnh đầu', ...toRel(headCentroidX, headTopY), type: 'head' },
      { id: 'eye_l', name: 'Mắt trái', ...toRel(eyeLX, eyeLY), type: 'eye_l' },
      { id: 'eye_r', name: 'Mắt phải', ...toRel(eyeRX, eyeRY), type: 'eye_r' },
      { id: 'nose', name: 'Mũi', ...toRel(noseX, noseY), type: 'nose' },
      { id: 'mouth', name: 'Miệng', ...toRel(mouthX, mouthY), type: 'mouth' },
      { id: 'neck', name: 'Khớp cổ', ...toRel(neckX, neckY), type: 'neck' },
      { id: 'spine', name: 'Thân măng', ...toRel(spineX, spineY), type: 'spine' },
      { id: 'hip_l', name: 'Hông trái', ...toRel(hipLX, hipY), type: 'hip_l' },
      { id: 'hip_r', name: 'Hông phải', ...toRel(hipRX, hipY), type: 'hip_r' },
      { id: 'knee_l', name: 'Đầu gối trái', ...toRel(kneeLX, kneeLY), type: 'knee_l' },
      { id: 'foot_l', name: 'Bàn chân trái', ...toRel(footLeftX, footLeftY), type: 'foot_l' },
      { id: 'knee_r', name: 'Đầu gối phải', ...toRel(kneeRX, kneeRY), type: 'knee_r' },
      { id: 'foot_r', name: 'Bàn chân phải', ...toRel(footRightX, footRightY), type: 'foot_r' },
    ];
    return {
      joints: armlessJoints,
      bones: [
        ['head', 'neck'],
        ['neck', 'spine'],
        ['spine', 'hip_l'],
        ['spine', 'hip_r'],
        ['hip_l', 'hip_r'],
        ['head', 'eye_l'],
        ['head', 'eye_r'],
        ['eye_l', 'nose'],
        ['eye_r', 'nose'],
        ['nose', 'mouth'],
        ['mouth', 'neck'],
        ['hip_l', 'knee_l'],
        ['knee_l', 'foot_l'],
        ['hip_r', 'knee_r'],
        ['knee_r', 'foot_r'],
      ],
    };
  }

  const joints: JointNode[] = [
    { id: 'head', name: 'Đỉnh đầu', ...toRel(headCentroidX, headTopY), type: 'head' },
    { id: 'eye_l', name: 'Mắt trái', ...toRel(eyeLX, eyeLY), type: 'eye_l' },
    { id: 'eye_r', name: 'Mắt phải', ...toRel(eyeRX, eyeRY), type: 'eye_r' },
    { id: 'nose', name: 'Mũi', ...toRel(noseX, noseY), type: 'nose' },
    { id: 'mouth', name: 'Miệng', ...toRel(mouthX, mouthY), type: 'mouth' },
    { id: 'neck', name: 'Khớp cổ', ...toRel(neckX, neckY), type: 'neck' },

    { id: 'shoulder_l', name: 'Vai trái', ...toRel(shoulderLX, shoulderLY), type: 'shoulder_l' },
    { id: 'elbow_l', name: 'Khuỷu tay trái', ...toRel(elbowLX, elbowLY), type: 'elbow_l' },
    { id: 'hand_l', name: 'Bàn tay trái', ...toRel(handLX, handLY), type: 'hand_l' },

    { id: 'shoulder_r', name: 'Vai phải', ...toRel(shoulderRX, shoulderRY), type: 'shoulder_r' },
    { id: 'elbow_r', name: 'Khuỷu tay phải', ...toRel(elbowRX, elbowRY), type: 'elbow_r' },
    { id: 'hand_r', name: 'Bàn tay phải', ...toRel(handRX, handRY), type: 'hand_r' },

    { id: 'spine', name: 'Thân & Áo', ...toRel(spineX, spineY), type: 'spine' },
    { id: 'hip_l', name: 'Hông trái', ...toRel(hipLX, hipY), type: 'hip_l' },
    { id: 'hip_r', name: 'Hông phải', ...toRel(hipRX, hipY), type: 'hip_r' },

    { id: 'knee_l', name: 'Đầu gối trái', ...toRel(kneeLX, kneeLY), type: 'knee_l' },
    { id: 'foot_l', name: 'Bàn chân trái', ...toRel(footLeftX, footLeftY), type: 'foot_l' },

    { id: 'knee_r', name: 'Đầu gối phải', ...toRel(kneeRX, kneeRY), type: 'knee_r' },
    { id: 'foot_r', name: 'Bàn chân phải', ...toRel(footRightX, footRightY), type: 'foot_r' },
  ];

  const bones: [string, string][] = [
    ['head', 'neck'],
    ['neck', 'spine'],
    ['spine', 'hip_l'],
    ['spine', 'hip_r'],
    ['hip_l', 'hip_r'],
    ['head', 'eye_l'],
    ['head', 'eye_r'],
    ['eye_l', 'nose'],
    ['eye_r', 'nose'],
    ['nose', 'mouth'],
    ['mouth', 'neck'],
    ['neck', 'shoulder_l'],
    ['shoulder_l', 'elbow_l'],
    ['elbow_l', 'hand_l'],
    ['neck', 'shoulder_r'],
    ['shoulder_r', 'elbow_r'],
    ['elbow_r', 'hand_r'],
    ['hip_l', 'knee_l'],
    ['knee_l', 'foot_l'],
    ['hip_r', 'knee_r'],
    ['knee_r', 'foot_r'],
  ];

  return { joints, bones };
}

/**
 * TẠO NHÂN VẬT RỐI GIẤY PHONG CÁCH GUMBALL (TERI THE PAPER BEAR):
 * Tách nền giấy trắng và tạo viền sticker giấy thủ công (White Die-Cut Paper Margin)
 * kèm bóng đổ nổi 3D, biến nét vẽ thành một miếng giấy 2D thực thụ sống động!
 */
export function extractPaperCutoutWithStickerBorder(
  sourceCanvas: HTMLCanvasElement,
  borderWidth = 6,
  shadowBlur = 4
): HTMLCanvasElement {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return sourceCanvas;

  const srcCtx = sourceCanvas.getContext('2d');
  if (!srcCtx) return sourceCanvas;

  const srcData = srcCtx.getImageData(0, 0, w, h);
  const data = srcData.data;

  // 1. Tạo mặt nạ nhị phân tách nền giấy trắng
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Không phải nền trắng thuần và có độ mờ
    if (a > 30 && (r < 240 || g < 240 || b < 240)) {
      mask[i / 4] = 1;
    }
  }

  // 2. Tạo viền trắng thủ công bằng thuật toán Dilate (nở biên)
  const borderCanvas = document.createElement('canvas');
  borderCanvas.width = w;
  borderCanvas.height = h;
  const bCtx = borderCanvas.getContext('2d');
  if (bCtx) {
    const bImgData = bCtx.createImageData(w, h);
    const bData = bImgData.data;

    const rDist = Math.max(2, Math.floor(borderWidth));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (mask[idx]) {
          for (let dy = -rDist; dy <= rDist; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) continue;
            for (let dx = -rDist; dx <= rDist; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= w) continue;
              if (dx * dx + dy * dy <= rDist * rDist) {
                const nIdx = (ny * w + nx) * 4;
                bData[nIdx] = 255;
                bData[nIdx + 1] = 255;
                bData[nIdx + 2] = 255;
                bData[nIdx + 3] = 255;
              }
            }
          }
        }
      }
    }
    bCtx.putImageData(bImgData, 0, 0);

    // 3. Vẽ bóng đổ nhẹ phía dưới mép giấy cắt
    outCtx.save();
    outCtx.shadowColor = 'rgba(10, 20, 24, 0.45)';
    outCtx.shadowBlur = shadowBlur;
    outCtx.shadowOffsetX = 1.5;
    outCtx.shadowOffsetY = 2.5;
    outCtx.drawImage(borderCanvas, 0, 0);
    outCtx.restore();

    // 4. Vẽ lại viền trắng sắc nét lên trên
    outCtx.drawImage(borderCanvas, 0, 0);
  }

  // 5. Vẽ đè nét vẽ gốc nguyên bản lên trên lớp giấy trắng
  outCtx.drawImage(sourceCanvas, 0, 0);

  return outCanvas;
}

/**
 * ĐỘNG HỌC UỐN LƯỢN RỐI GIẤY (Paper Puppet Kinematics):
 * Tính toán độ cong, nhún nhảy (squash & stretch), nghiêng người (skew) và cử động
 * theo đúng 4 danh mục chuyển động chuẩn của Meta Demo Lab (Walking, Jumping, Dancing, Funny)
 */
export function calculateRigPose(
  tick: number,
  action: CreatureAction,
  speedMultiplier = 1
): RigPose {
  const t = tick * 0.08 * speedMultiplier;

  // Tư thế cơ bản
  let hopY = 0;
  let squashX = 1;
  let stretchY = 1;
  let skewX = 0;
  let bodyBend = 0;
  let headTilt = 0;
  let armAngleL = 0;
  let armAngleR = 0;
  let legOffsetL = 0;
  let legOffsetR = 0;
  let mouthOpen = 0;

  // Hiệu ứng thở êm dịu (Breathing)
  const breathY = Math.sin(t * 0.5) * 1.5;

  // Hiệu ứng chớp mắt tự nhiên ngẫu nhiên
  const blinkCycle = tick % 140;
  const eyeBlink = blinkCycle >= 134 && blinkCycle <= 138 ? 1 : 0;

  switch (action) {
    case 'idle':
      hopY = breathY;
      bodyBend = Math.sin(t * 0.4) * 0.02;
      squashX = 1 + Math.sin(t * 0.5) * 0.02;
      stretchY = 1 - Math.sin(t * 0.5) * 0.02;
      break;

    // === META WALKING CATEGORY ===
    case 'walk':
      hopY = -Math.abs(Math.sin(t * 1.2)) * 6.5;
      bodyBend = Math.sin(t * 1.2) * 0.08;
      skewX = Math.sin(t * 1.2) * 0.06;
      headTilt = -Math.sin(t * 1.2) * 0.05;
      armAngleL = Math.sin(t * 1.2) * 0.35;
      armAngleR = -Math.sin(t * 1.2) * 0.35;
      legOffsetL = Math.sin(t * 1.2) * 10;
      legOffsetR = -Math.sin(t * 1.2) * 10;
      squashX = 1 - Math.sin(t * 2.4) * 0.04;
      stretchY = 1 + Math.sin(t * 2.4) * 0.04;
      break;

    case 'run':
      hopY = -Math.abs(Math.sin(t * 2.0)) * 12;
      bodyBend = 0.14 + Math.sin(t * 2.0) * 0.08;
      skewX = 0.12 + Math.sin(t * 2.0) * 0.08;
      headTilt = 0.08;
      armAngleL = Math.sin(t * 2.0) * 0.6;
      armAngleR = -Math.sin(t * 2.0) * 0.6;
      legOffsetL = Math.sin(t * 2.0) * 18;
      legOffsetR = -Math.sin(t * 2.0) * 18;
      squashX = 1 - Math.sin(t * 4.0) * 0.08;
      stretchY = 1 + Math.sin(t * 4.0) * 0.08;
      break;

    case 'sneak':
      hopY = -Math.abs(Math.sin(t * 0.6)) * 3;
      bodyBend = 0.08 + Math.sin(t * 0.6) * 0.04;
      skewX = 0.05;
      headTilt = -0.04;
      armAngleL = Math.sin(t * 0.6) * 0.15;
      armAngleR = -Math.sin(t * 0.6) * 0.15;
      legOffsetL = Math.sin(t * 0.6) * 6;
      legOffsetR = -Math.sin(t * 0.6) * 6;
      break;

    // === META JUMPING CATEGORY ===
    case 'happy_jump': {
      const jumpCycle = Math.sin(t * 1.8);
      if (jumpCycle > 0) {
        hopY = -jumpCycle * 26; // Bật nhảy vọt lên cao
        stretchY = 1.22;
        squashX = 0.82;
        armAngleL = -0.85; // Giơ 2 tay lên cao reo vui
        armAngleR = 0.85;
        legOffsetL = 8;
        legOffsetR = -8;
        mouthOpen = 0.9;
      } else {
        hopY = 0;
        stretchY = 0.82; // Chạm đất nhún người lấy đà
        squashX = 1.2;
        armAngleL = 0.25;
        armAngleR = -0.25;
        mouthOpen = 0.3;
      }
      bodyBend = Math.sin(t * 1.8) * 0.08;
      break;
    }

    case 'paper_flutter': {
      // Nhảy chao liệng lá tre / tờ giấy rơi lơ lửng bồng bềnh
      hopY = -14 + Math.sin(t * 1.1) * 10;
      bodyBend = Math.sin(t * 1.8) * 0.24;
      skewX = Math.cos(t * 1.8) * 0.2;
      headTilt = Math.sin(t * 1.2) * 0.16;
      armAngleL = Math.sin(t * 1.8) * 0.5;
      armAngleR = -Math.sin(t * 1.8) * 0.5;
      legOffsetL = Math.sin(t * 1.8) * 6;
      legOffsetR = -Math.sin(t * 1.8) * 6;
      break;
    }

    case 'hop':
      hopY = -Math.abs(Math.sin(t * 1.8)) * 16;
      bodyBend = Math.sin(t * 1.8) * 0.08;
      armAngleL = Math.sin(t * 1.8) * 0.35;
      armAngleR = Math.sin(t * 1.8) * 0.35;
      legOffsetL = -6;
      legOffsetR = 8;
      break;

    // === META DANCING CATEGORY ===
    case 'dance':
      // Vũ điệu uốn lượn tờ giấy theo nhịp
      hopY = -Math.abs(Math.sin(t * 1.8)) * 8;
      bodyBend = Math.sin(t * 1.8) * 0.28;
      skewX = Math.cos(t * 1.8) * 0.22;
      headTilt = -Math.sin(t * 1.8) * 0.2;
      armAngleL = Math.sin(t * 1.8) * 0.85;
      armAngleR = -Math.sin(t * 1.8) * 0.85;
      legOffsetL = Math.sin(t * 1.8) * 14;
      legOffsetR = -Math.sin(t * 1.8) * 14;
      mouthOpen = 0.7;
      break;

    case 'wave':
      bodyBend = Math.sin(t * 0.8) * 0.06;
      armAngleL = -0.85 + Math.sin(t * 3.8) * 0.45;
      armAngleR = 0.15;
      mouthOpen = 0.6;
      headTilt = 0.1;
      break;

    case 'spin':
      hopY = -Math.abs(Math.sin(t * 2.0)) * 6;
      bodyBend = Math.sin(t * 2.2) * 0.15;
      skewX = Math.sin(t * 2.2) * 0.24;
      armAngleL = -0.55;
      armAngleR = 0.55;
      break;

    // === META FUNNY CATEGORY ===
    case 'teri_panic':
      // Rung bần bật sợ hãi kiểu Gấu giấy Teri trong Thế Giới Kẹo Bông Gumball
      hopY = Math.sin(t * 10.0) * 4;
      bodyBend = Math.sin(t * 11.0) * 0.18;
      skewX = Math.cos(t * 10.5) * 0.2;
      squashX = 1 + Math.sin(t * 12.0) * 0.14;
      stretchY = 1 - Math.sin(t * 12.0) * 0.14;
      armAngleL = -0.85 + Math.sin(t * 12.0) * 0.5;
      armAngleR = 0.85 - Math.sin(t * 12.0) * 0.5;
      mouthOpen = 1;
      break;

    case 'sad':
      // Ủ rũ: cúi gục đầu, vai thõng, lê bước chậm chạp
      hopY = 5 + Math.sin(t * 0.4) * 2;
      stretchY = 0.88;
      squashX = 1.08;
      bodyBend = 0.22; // Thân gập về trước
      headTilt = 0.32; // Đầu cúi gằm xuống
      armAngleL = 0.25; // Hai tay buông thõng
      armAngleR = -0.25;
      legOffsetL = Math.sin(t * 0.5) * 3;
      legOffsetR = -Math.sin(t * 0.5) * 3;
      mouthOpen = 0;
      break;

    case 'sleep':
      // Ngủ / Gấp giấy: ép phẳng nằm sát đất, nhắm mắt, thở êm
      hopY = 16 + Math.sin(t * 0.3) * 1.5;
      stretchY = 0.64; // Thân phẳng bẹp nằm sát đất
      squashX = 1.32; // Bè ngang thư thái
      bodyBend = 0.36;
      headTilt = 0.4;
      armAngleL = 0.55;
      armAngleR = -0.55;
      mouthOpen = 0.05;
      break;
  }

  return {
    hopY,
    squashX,
    stretchY,
    skewX,
    bodyBend,
    headTilt,
    armAngleL,
    armAngleR,
    legOffsetL,
    legOffsetR,
    eyeBlink,
    mouthOpen,
    breathY,
  };
}

export interface PaperTouchSpring {
  pressure: number;   // 0..1 độ nén xúc giác khi người chơi ấn/đẩy tờ giấy
  deflectX: number;   // Độ uốn cong dạt ngang
  deflectY: number;   // Độ uốn cong dạt dọc
  springTick: number; // Chu kỳ nhún đàn hồi lò xo giấy
  x?: number;         // Toạ độ điểm chạm (tương đối, 0 = tâm nhân vật)
  y?: number;         // Toạ độ điểm chạm (tương đối, 0 = tâm nhân vật)
}

/**
 * Vẽ đường cấn gấp nếp Origami (Embossed Paper Crease Line)
 * Tạo cảm giác nếp gấp giấy thủ công thật với 1 bên sáng và 1 bên bóng đổ
 */
export function drawOrigamiCreaseLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  foldIntensity = 1,
  creaseStyle: 'fold' | 'perforated' | 'crease' = 'crease'
) {
  if (foldIntensity <= 0.02) return;
  ctx.save();

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1.5) {
    ctx.restore();
    return;
  }

  // Vector pháp tuyến vuông góc với đường gấp
  const nx = -dy / len;
  const ny = dx / len;
  const alpha = Math.min(0.65, Math.abs(foldIntensity) * 0.55);

  // 1. Vệt sáng phản quang trên sống nếp gấp (Highlight ridge)
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
  ctx.lineWidth = 1.0;
  if (creaseStyle === 'perforated') {
    ctx.setLineDash([3, 2.5]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.beginPath();
  ctx.moveTo(x1 + nx * 0.8, y1 + ny * 0.8);
  ctx.lineTo(x2 + nx * 0.8, y2 + ny * 0.8);
  ctx.stroke();

  // 2. Vệt bóng đổ lõm của rãnh nếp gấp (Shadow groove)
  ctx.strokeStyle = `rgba(10, 18, 20, ${alpha * 0.8})`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x1 - nx * 0.8, y1 - ny * 0.8);
  ctx.lineTo(x2 - nx * 0.8, y2 - ny * 0.8);
  ctx.stroke();

  ctx.restore();
}

/**
 * Vẽ lò xo giấy xếp nếp (Accordion Fold / Paper Spring)
 * Xuất hiện ở các khớp uốn cong (khuỷu tay, đầu gối, eo) khi chuyển động hoặc bị ấn/uốn cong
 */
export function drawAccordionPaperSpring(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  foldWidth = 12,
  pleatCount = 3,
  foldPhase = 0
) {
  ctx.save();
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy);
  if (len < 3) {
    ctx.restore();
    return;
  }

  const nx = -dy / len;
  const ny = dx / len;
  ctx.lineWidth = 1.0;
  const step = len / pleatCount;

  for (let i = 0; i < pleatCount; i++) {
    const p1x = startX + (dx / len) * (i * step);
    const p1y = startY + (dy / len) * (i * step);
    const midX = startX + (dx / len) * ((i + 0.5) * step);
    const midY = startY + (dy / len) * ((i + 0.5) * step);
    const p2x = startX + (dx / len) * ((i + 1) * step);
    const p2y = startY + (dy / len) * ((i + 1) * step);

    const sign = i % 2 === 0 ? 1 : -1;
    const dynamicW = foldWidth * (0.8 + Math.sin(foldPhase) * 0.2);
    const peakX = midX + nx * dynamicW * sign;
    const peakY = midY + ny * dynamicW * sign;

    // Mặt đón sáng của nếp gấp ziczac
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.45)' : 'rgba(20, 30, 25, 0.2)';
    ctx.strokeStyle = 'rgba(25, 35, 30, 0.4)';
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(p2x, p2y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sống gập nếp phản quang
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(p1x, p1y);
    ctx.lineTo(peakX, peakY);
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Thanh trượt biểu cảm cơ học bằng giấy (Paper Expression Slider / Pull-Tab) tại Mắt
 * Thay đổi nét mặt linh hoạt bằng cơ cấu giấy trượt qua rãnh khoét (slot)
 */
export function drawPaperEyeSlider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius = 5.5,
  emotion: CreatureAction = 'idle',
  isBlink = false,
  isLeft = true,
  tick = 0
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Rãnh trượt giấy khoét thủ công (Paper slider slot cutout)
  const slotW = radius * 2.5;
  const slotH = radius * 2.0;
  ctx.fillStyle = 'rgba(15, 25, 28, 0.16)';
  ctx.strokeStyle = 'rgba(10, 20, 22, 0.4)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.roundRect(-slotW / 2, -slotH / 2, slotW, slotH, 3);
  ctx.fill();
  ctx.stroke();

  // 2. Thẻ trượt bên trong (Sliding Paper Tab)
  let slideX = 0;
  let slideY = 0;
  if (emotion === 'walk' || emotion === 'run') {
    slideX = Math.sin(tick * 0.2) * 1.4;
  } else if (emotion === 'sad') {
    slideY = 2.0; // Thẻ trượt hạ thấp buồn rầu
  } else if (emotion === 'happy_jump' || emotion === 'dance') {
    slideY = -1.2; // Thẻ trượt nâng cao tươi vui
  } else if (emotion === 'teri_panic') {
    slideX = Math.sin(tick * 1.5) * 1.8;
    slideY = Math.cos(tick * 1.5) * 1.2;
  }

  // Nền thẻ giấy trượt (Paper Card)
  ctx.fillStyle = '#FAF7F0';
  ctx.strokeStyle = 'rgba(20, 30, 32, 0.28)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(-slotW / 2 + 1 + slideX, -slotH / 2 + 1 + slideY, slotW - 2, slotH - 2, 2.5);
  ctx.fill();
  ctx.stroke();

  // 3. Nét vẽ biểu cảm mực in Đông Hồ trên thẻ trượt
  ctx.strokeStyle = '#1B2A2F';
  ctx.fillStyle = '#1B2A2F';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  const eyeCX = slideX;
  const eyeCY = slideY;

  if (isBlink || emotion === 'sleep') {
    // Nhắm mắt dạng đường cong êm dịu (Sleeping / Blinking Arc)
    ctx.beginPath();
    ctx.arc(eyeCX, eyeCY + (emotion === 'sleep' ? 0.5 : 1), radius * 0.7, 0.1 * Math.PI, 0.9 * Math.PI, false);
    ctx.stroke();
  } else if (emotion === 'happy_jump' || emotion === 'dance') {
    // Mắt cười híp hình cung vui sướng (^ ^)
    ctx.beginPath();
    ctx.arc(eyeCX, eyeCY + 1.5, radius * 0.75, 1.1 * Math.PI, 1.9 * Math.PI, false);
    ctx.stroke();
  } else if (emotion === 'sad') {
    // Mắt cụp buồn (︵ ︵)
    ctx.beginPath();
    ctx.arc(eyeCX, eyeCY + 2.5, radius * 0.75, 1.15 * Math.PI, 1.85 * Math.PI, false);
    ctx.stroke();
  } else if (emotion === 'teri_panic') {
    // Mắt hoảng hốt mở to rung bần bật
    ctx.beginPath();
    ctx.arc(eyeCX, eyeCY, radius * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeCX - 1, eyeCY - 1, 1, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Trạng thái bình thường: Con ngươi mực tròn vẽ tay
    ctx.beginPath();
    ctx.arc(eyeCX + (isLeft ? 0.3 : -0.3), eyeCY, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(eyeCX + (isLeft ? -0.5 : -1.1), eyeCY - 0.8, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Lẫy giấy kéo thanh trượt mini (Paper pull-tab handle)
  ctx.fillStyle = '#E3D7BF';
  ctx.strokeStyle = 'rgba(25, 35, 30, 0.35)';
  ctx.lineWidth = 0.6;
  const tabDir = isLeft ? -1 : 1;
  ctx.beginPath();
  ctx.rect((slotW / 2) * tabDir - (isLeft ? 3.5 : 0), -1.8, 3.5, 3.6);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

/**
 * Bánh xe xoay cảm xúc bằng giấy (Rotating Paper Emotion Wheel / Volvelle) tại Miệng
 * Cơ cấu bánh xe giấy xoay quanh đinh tán kim loại mini để đổi khuôn miệng
 */
export function drawPaperEmotionWheel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius = 9,
  emotion: CreatureAction = 'idle',
  mouthOpen = 0.3,
  tick = 0
) {
  ctx.save();
  ctx.translate(x, y);

  // 1. Góc xoay của bánh xe giấy theo cảm xúc (Volvelle Rotation Angle)
  let targetAngle = 0;
  switch (emotion) {
    case 'happy_jump':
    case 'dance':
      targetAngle = Math.PI * 0.5; // Xoay tới miệng cười há to reo vui
      break;
    case 'wave':
    case 'walk':
    case 'run':
      targetAngle = Math.PI * 0.25; // Xoay tới miệng mỉm cười nói chuyện
      break;
    case 'sad':
      targetAngle = Math.PI * 1.0; // Xoay tới miệng mếu máo cụp xuống
      break;
    case 'sleep':
      targetAngle = Math.PI * 1.5; // Xoay tới miệng ngáy tròn nhỏ
      break;
    case 'teri_panic':
      targetAngle = Math.PI * 0.75 + Math.sin(tick * 2.0) * 0.2; // Rung lắc miệng la hét
      break;
    default:
      targetAngle = 0; // Mỉm cười dịu dàng
      break;
  }

  // 2. Viền rãnh khoét tròn trên tờ giấy (Circular paper cut window)
  ctx.fillStyle = 'rgba(10, 20, 22, 0.14)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 30, 32, 0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 3. Đĩa giấy xoay (Paper Disc)
  ctx.save();
  ctx.rotate(targetAngle);

  ctx.fillStyle = '#FDFBF7';
  ctx.beginPath();
  ctx.arc(0, 0, radius - 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Vân thớ giấy tròn nhẹ
  ctx.strokeStyle = 'rgba(200, 185, 160, 0.3)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(0, 0, radius - 3.2, 0, Math.PI * 2);
  ctx.stroke();

  // Tai kéo xoay bằng giấy chìa ra ngoài mép đĩa (Dial Finger Tab)
  ctx.fillStyle = '#FFD166';
  ctx.strokeStyle = 'rgba(40, 30, 20, 0.5)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.rect(radius - 2.5, -2, 5, 4);
  ctx.fill();
  ctx.stroke();

  // Lỗ bấm trên tai kéo
  ctx.fillStyle = '#1B2A2F';
  ctx.beginPath();
  ctx.arc(radius + 1, 0, 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // Kết thúc xoay đĩa

  // 4. Biểu cảm miệng hiển thị qua cửa sổ giấy
  ctx.save();
  ctx.strokeStyle = '#C8412F'; // Màu son đỏ thủ công truyền thống
  ctx.fillStyle = '#C8412F';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';

  if (emotion === 'happy_jump' || emotion === 'dance') {
    ctx.beginPath();
    ctx.ellipse(0, 1, 4, 3 + mouthOpen * 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF8FA3';
    ctx.beginPath();
    ctx.ellipse(0, 2.2, 2.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (emotion === 'sad') {
    ctx.beginPath();
    ctx.arc(0, 3, 3.5, 1.15 * Math.PI, 1.85 * Math.PI, false);
    ctx.stroke();
  } else if (emotion === 'sleep') {
    ctx.beginPath();
    ctx.arc(0, 1, 1.8, 0, Math.PI * 2);
    ctx.stroke();
  } else if (emotion === 'teri_panic') {
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-2, 3);
    ctx.lineTo(0, 0);
    ctx.lineTo(2, 3);
    ctx.lineTo(4, 0);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, -0.5, 3.8, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Đinh tán xoay kim loại mini ở tâm bánh xe (Split-Pin Rivet Core)
  ctx.fillStyle = '#FFE18A';
  ctx.beginPath();
  ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1B2A2F';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  ctx.fillStyle = '#1B2A2F';
  ctx.beginPath();
  ctx.arc(0, 0, 0.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * VẼ CON RỐI GIẤY ORIGAMI CƠ HỌC LIỀN MẠCH (Continuous Origami Paper Puppet Renderer)
 * Kết hợp độ cong mềm mại, biến dạng tờ giấy, và lật 3D quanh trục Y (Turntable)
 */
export function drawPaperPuppet(
  ctx: CanvasRenderingContext2D,
  img: HTMLCanvasElement | HTMLImageElement,
  pose: RigPose,
  rig: SkeletonRig,
  centerX: number,
  centerY: number,
  targetWidth = 120,
  targetHeight = 120,
  direction: 1 | -1 = 1,
  rotationY = 0, // Góc lật 3D quanh trục Y (-180°..+180°)
  motion: CreatureAction = 'walk',
  tick = 0,
  touchSpring?: PaperTouchSpring,
  showCreasePattern = true
) {
  // =========================================================================
  // MESH DEFORMATION RENDERER — "Thước Dẻo Cao Su" Paper Puppet
  // Toàn bộ tờ giấy được biến dạng như một thước dẻo — KHÔNG cắt rời bộ phận.
  // Thuật toán: lưới (COLS+1)×(ROWS+1) vertex, mỗi vertex bị dịch chuyển theo
  // zone khung xương (head, arm_l, arm_r, leg_l, leg_r, body).
  // Mỗi ô lưới được vẽ bằng 2 tam giác affine (ctx.transform trick).
  // =========================================================================

  // --- Thông số lưới ---
  const COLS = 10; // số cột
  const ROWS = 14; // số hàng (nhiều hơn theo chiều dọc)

  const w = targetWidth;
  const h = targetHeight;

  // --- Lấy khớp từ rig ---
  const getJoint = (type: string) => (rig && rig.joints ? rig.joints.find((j) => j.type === type) : undefined);
  const neckJ   = getJoint('neck');
  const headJ   = getJoint('head');
  const shLJ    = getJoint('shoulder_l');
  const elLJ    = getJoint('elbow_l');
  const handLJ  = getJoint('hand_l');
  const shRJ    = getJoint('shoulder_r');
  const elRJ    = getJoint('elbow_r');
  const handRJ  = getJoint('hand_r');
  const hpLJ    = getJoint('hip_l');
  const knLJ    = getJoint('knee_l');
  const ftLJ    = getJoint('foot_l');
  const hpRJ    = getJoint('hip_r');
  const knRJ    = getJoint('knee_r');
  const ftRJ    = getJoint('foot_r');
  const eyeL    = getJoint('eye_l');
  const eyeR    = getJoint('eye_r');
  const mouth   = getJoint('mouth');

  // Vị trí tương đối (0–1) của các pivot chính
  const neckRelY  = neckJ  ? neckJ.relY  : 0.28;
  const shLRelX   = shLJ   ? shLJ.relX   : 0.32;
  const shLRelY   = shLJ   ? shLJ.relY   : 0.36;
  const shRRelX   = shRJ   ? shRJ.relX   : 0.68;
  const shRRelY   = shRJ   ? shRJ.relY   : 0.36;
  const hpLRelX   = hpLJ   ? hpLJ.relX   : 0.42;
  const hpLRelY   = hpLJ   ? hpLJ.relY   : 0.68;
  const hpRRelX   = hpRJ   ? hpRJ.relX   : 0.58;
  const hpRRelY   = hpRJ   ? hpRJ.relY   : 0.68;

  // Pivot pixels (local, trung tâm = 0,0 nằm ở centerX,centerY)
  const neckPX   = (neckJ  ? neckJ.relX  : 0.5)  * w - w / 2;
  const neckPY   = neckRelY * h - h / 2;
  const shLPX    = shLRelX   * w - w / 2;
  const shLPY    = shLRelY   * h - h / 2;
  const shRPX    = shRRelX   * w - w / 2;
  const shRPY    = shRRelY   * h - h / 2;
  const hpLPX    = hpLRelX   * w - w / 2;
  const hpLPY    = hpLRelY   * h - h / 2;
  const hpRPX    = hpRRelX   * w - w / 2;
  const hpRPY    = hpRRelY   * h - h / 2;

  // Góc uốn từ pose (radian)
  const bendHead = pose.headTilt * direction;
  const bendArmL = pose.armAngleL * direction * 0.85;
  const bendArmR = pose.armAngleR * direction * 0.85;
  const bendLegL = (pose.legOffsetL / 36) * 0.65 * direction;
  const bendLegR = (pose.legOffsetR / 36) * 0.65 * direction;
  const bendBody = pose.bodyBend * 0.4 + pose.skewX * 0.3;

  // Touch spring
  let springSquashX = 1, springStretchY = 1, springHopY = 0;
  let springDX = 0, springDY = 0, springDecay = 1;
  if (touchSpring && touchSpring.pressure > 0.01) {
    springDecay = Math.exp(-touchSpring.springTick * 0.08);
    const bounce = Math.sin(touchSpring.springTick * 0.45) * springDecay * touchSpring.pressure;
    springSquashX = 1 + bounce * 0.35;
    springStretchY = 1 - bounce * 0.25;
    springHopY = touchSpring.deflectY * 0.6 * springDecay;
    springDX = touchSpring.deflectX * springDecay;
    springDY = touchSpring.deflectY * springDecay;
  }

  // -------------------------------------------------------------------------
  // Hàm nội tại: tính displacement của 1 vertex (relX, relY) theo zone
  // Trả về { dx, dy } tính bằng pixel
  // -------------------------------------------------------------------------
  function computeVertexDisplacement(relX: number, relY: number): { dx: number; dy: number } {
    let dx = 0;
    let dy = 0;

    // ---- Head zone: trên neckRelY ----
    if (relY < neckRelY + 0.04) {
      // Falloff: vertex càng xa neck (lên phía đầu) thì uốn nhiều hơn
      const t = Math.max(0, (neckRelY - relY) / (neckRelY + 0.02));
      // Xoay quanh neck pivot
      const lx = relX * w - w / 2 - neckPX;
      const ly = relY * h - h / 2 - neckPY;
      const c = Math.cos(bendHead), s = Math.sin(bendHead);
      dx += (lx * c - ly * s - lx) * t;
      dy += (lx * s + ly * c - ly) * t;
    }

    // ---- Arm-L zone: relX < 0.45 & shoulder height → hand ----
    if (relX < 0.45 && relY >= shLRelY - 0.08 && relY <= (handLJ ? handLJ.relY + 0.05 : 0.70)) {
      // t = 0 tại vai → 1 tại tay (thước dẻo: đầu ngón tay uốn nhiều nhất)
      const rangeY = Math.max(0.01, (handLJ ? handLJ.relY : 0.65) - shLRelY);
      const t = Math.min(1, Math.max(0, (relY - shLRelY) / rangeY));
      const lx = relX * w - w / 2 - shLPX;
      const ly = relY * h - h / 2 - shLPY;
      const c = Math.cos(bendArmL), s = Math.sin(bendArmL);
      dx += (lx * c - ly * s - lx) * t;
      dy += (lx * s + ly * c - ly) * t;
    }

    // ---- Arm-R zone: relX > 0.55 & shoulder height → hand ----
    if (relX > 0.55 && relY >= shRRelY - 0.08 && relY <= (handRJ ? handRJ.relY + 0.05 : 0.70)) {
      const rangeY = Math.max(0.01, (handRJ ? handRJ.relY : 0.65) - shRRelY);
      const t = Math.min(1, Math.max(0, (relY - shRRelY) / rangeY));
      const lx = relX * w - w / 2 - shRPX;
      const ly = relY * h - h / 2 - shRPY;
      const c = Math.cos(bendArmR), s = Math.sin(bendArmR);
      dx += (lx * c - ly * s - lx) * t;
      dy += (lx * s + ly * c - ly) * t;
    }

    // ---- Leg-L zone: relX < 0.5 & dưới hip ----
    if (relX < 0.5 && relY > hpLRelY - 0.04) {
      const rangeY = Math.max(0.01, (ftLJ ? ftLJ.relY : 1.0) - hpLRelY);
      const t = Math.min(1, Math.max(0, (relY - hpLRelY) / rangeY));
      const lx = relX * w - w / 2 - hpLPX;
      const ly = relY * h - h / 2 - hpLPY;
      const c = Math.cos(bendLegL), s = Math.sin(bendLegL);
      dx += (lx * c - ly * s - lx) * t;
      dy += (lx * s + ly * c - ly) * t;
    }

    // ---- Leg-R zone: relX >= 0.5 & dưới hip ----
    if (relX >= 0.5 && relY > hpRRelY - 0.04) {
      const rangeY = Math.max(0.01, (ftRJ ? ftRJ.relY : 1.0) - hpRRelY);
      const t = Math.min(1, Math.max(0, (relY - hpRRelY) / rangeY));
      const lx = relX * w - w / 2 - hpRPX;
      const ly = relY * h - h / 2 - hpRPY;
      const c = Math.cos(bendLegR), s = Math.sin(bendLegR);
      dx += (lx * c - ly * s - lx) * t;
      dy += (lx * s + ly * c - ly) * t;
    }

    // ---- Body zone: global skew/sway cho phần thân ----
    const bodyT = Math.max(0, Math.min(1, (relY - neckRelY) / Math.max(0.01, hpLRelY - neckRelY)));
    dx += bendBody * (relY - neckRelY) * h * 0.4 * bodyT;

    // ---- Touch spring displacement (ảnh hưởng toàn tờ giấy, giảm dần từ điểm chạm) ----
    if (touchSpring && touchSpring.pressure > 0.01) {
      // Điểm chạm tương đối (mặc định tâm nếu không có x,y)
      const touchRelX = touchSpring.x != null ? (touchSpring.x / w) + 0.5 : 0.5;
      const touchRelY = touchSpring.y != null ? (touchSpring.y / h) + 0.5 : 0.5;
      const dist = Math.hypot(relX - touchRelX, relY - touchRelY);
      const springWeight = Math.max(0, 1 - dist * 2.5) * springDecay;
      dx += springDX * 0.08 * springWeight;
      dy += springDY * 0.08 * springWeight;
    }

    return { dx, dy };
  }

  // -------------------------------------------------------------------------
  // Xây dựng lưới vertex đã biến dạng
  // -------------------------------------------------------------------------
  // Grid vertex: (COLS+1) × (ROWS+1) điểm
  // Mỗi điểm: { srcX, srcY } trong hình gốc (0..w, 0..h)
  //           { dstX, dstY } trong canvas local (trung tâm = 0,0)
  const grid: Array<Array<{ srcX: number; srcY: number; dstX: number; dstY: number }>> = [];

  for (let row = 0; row <= ROWS; row++) {
    const rowArr: Array<{ srcX: number; srcY: number; dstX: number; dstY: number }> = [];
    for (let col = 0; col <= COLS; col++) {
      const relX = col / COLS;
      const relY = row / ROWS;
      const srcX = relX * w; // trong ảnh gốc (0..w)
      const srcY = relY * h;
      const baseDstX = relX * w - w / 2; // local canvas, trước biến dạng
      const baseDstY = relY * h - h / 2;
      const { dx, dy } = computeVertexDisplacement(relX, relY);
      rowArr.push({ srcX, srcY, dstX: baseDstX + dx, dstY: baseDstY + dy });
    }
    grid.push(rowArr);
  }

  // -------------------------------------------------------------------------
  // Hàm vẽ 1 tam giác có texture (affine warp)
  // p0,p1,p2: { srcX,srcY } (nguồn trong img), { dstX,dstY } (đích canvas)
  // -------------------------------------------------------------------------
  function drawTexturedTriangle(
    p0: { srcX: number; srcY: number; dstX: number; dstY: number },
    p1: { srcX: number; srcY: number; dstX: number; dstY: number },
    p2: { srcX: number; srcY: number; dstX: number; dstY: number }
  ) {
    // Tính ma trận affine mapping (srcX,srcY) → (dstX,dstY)
    // [dstX]   [a c e] [srcX]
    // [dstY] = [b d f] [srcY]
    // [1   ]   [0 0 1] [1   ]
    // Giải: có 3 điểm → 6 phương trình → {a,b,c,d,e,f}
    const x0s = p0.srcX, y0s = p0.srcY;
    const x1s = p1.srcX, y1s = p1.srcY;
    const x2s = p2.srcX, y2s = p2.srcY;
    const x0d = p0.dstX, y0d = p0.dstY;
    const x1d = p1.dstX, y1d = p1.dstY;
    const x2d = p2.dstX, y2d = p2.dstY;

    const detS = (x0s * (y1s - y2s) + x1s * (y2s - y0s) + x2s * (y0s - y1s));
    if (Math.abs(detS) < 1e-6) return; // tam giác suy biến

    const a = ((x0d * (y1s - y2s) + x1d * (y2s - y0s) + x2d * (y0s - y1s)) / detS);
    const b = ((y0d * (y1s - y2s) + y1d * (y2s - y0s) + y2d * (y0s - y1s)) / detS);
    const c = ((x0s * (x2s * y1d - x1s * y2d) + x1s * (-x2s * y0d + x0s * y2d) + x2s * (x1s * y0d - x0s * y1d))
               / (detS * (x0s * (x2s - x1s) + x1s * (x0s - x2s) + x2s * (x1s - x0s)) || 1));
    // Phương trình affine 2D: dstX = a*srcX + c*srcY + e, dstY = b*srcX + d*srcY + f
    // Dùng công thức chuẩn Cramer
    const denom = (x1s - x0s) * (y2s - y0s) - (x2s - x0s) * (y1s - y0s);
    if (Math.abs(denom) < 1e-6) return;
    const aa = ((x1d - x0d) * (y2s - y0s) - (x2d - x0d) * (y1s - y0s)) / denom;
    const bb = ((x2d - x0d) * (x1s - x0s) - (x1d - x0d) * (x2s - x0s)) / denom;
    const cc = ((y1d - y0d) * (y2s - y0s) - (y2d - y0d) * (y1s - y0s)) / denom;
    const dd = ((y2d - y0d) * (x1s - x0s) - (y1d - y0d) * (x2s - x0s)) / denom;
    const ee = x0d - aa * x0s - bb * y0s;
    const ff = y0d - cc * x0s - dd * y0s;

    ctx.save();
    // Clip đúng hình tam giác đích
    ctx.beginPath();
    ctx.moveTo(x0d, y0d);
    ctx.lineTo(x1d, y1d);
    ctx.lineTo(x2d, y2d);
    ctx.closePath();
    ctx.clip();
    // Áp ma trận biến dạng & vẽ toàn bộ ảnh (canvas sẽ chỉ hiện phần trong clip)
    ctx.transform(aa, cc, bb, dd, ee, ff);
    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Transform cấp cao: perspective turntable 2.5D & squash-stretch
  // -------------------------------------------------------------------------
  ctx.save();
  const radY = (rotationY * Math.PI) / 180;
  const perspScaleX = Math.cos(radY);

  ctx.translate(centerX, centerY + pose.hopY + springHopY);
  ctx.scale(direction * pose.squashX * springSquashX * perspScaleX, pose.stretchY * springStretchY);

  // --- Bóng đổ dưới chân ---
  ctx.save();
  ctx.fillStyle = 'rgba(10, 17, 19, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, h * 0.46, w * 0.42 * Math.abs(perspScaleX), 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // -------------------------------------------------------------------------
  // Render từng ô lưới bằng 2 tam giác (Mesh Warp)
  // -------------------------------------------------------------------------
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tl = grid[row][col];       // top-left
      const tr = grid[row][col + 1];   // top-right
      const bl = grid[row + 1][col];   // bottom-left
      const br = grid[row + 1][col + 1]; // bottom-right

      // Tam giác 1: tl → tr → bl
      drawTexturedTriangle(tl, tr, bl);
      // Tam giác 2: tr → br → bl
      drawTexturedTriangle(tr, br, bl);
    }
  }

  // -------------------------------------------------------------------------
  // Overlay: đường cấn origami & hiệu ứng cảm xúc (vẽ ĐÈ LÊN lưới đã warp)
  // -------------------------------------------------------------------------
  if (rig && rig.joints) {
    const toLocalX = (relX: number) => -w / 2 + relX * w;
    const toLocalY = (relY: number) => -h / 2 + relY * h;

    // --- Đường cấn gấp nếp ---
    if (showCreasePattern) {
      const neckX = toLocalX(neckJ ? neckJ.relX : 0.5);
      const neckY = toLocalY(neckRelY);
      const shLX  = toLocalX(shLRelX); const shLY = toLocalY(shLRelY);
      const shRX  = toLocalX(shRRelX); const shRY = toLocalY(shRRelY);
      const elLX  = toLocalX(elLJ  ? elLJ.relX  : 0.22); const elLY = toLocalY(elLJ  ? elLJ.relY  : 0.52);
      const elRX  = toLocalX(elRJ  ? elRJ.relX  : 0.78); const elRY = toLocalY(elRJ  ? elRJ.relY  : 0.52);
      const hpLX  = toLocalX(hpLRelX); const hpLY = toLocalY(hpLRelY);
      const hpRX  = toLocalX(hpRRelX); const hpRY = toLocalY(hpRRelY);
      const knLX  = toLocalX(knLJ  ? knLJ.relX  : 0.40); const knLY = toLocalY(knLJ  ? knLJ.relY  : 0.82);
      const knRX  = toLocalX(knRJ  ? knRJ.relX  : 0.60); const knRY = toLocalY(knRJ  ? knRJ.relY  : 0.82);

      drawOrigamiCreaseLine(ctx, neckX - 20, neckY, neckX + 20, neckY, 0.7);
      drawOrigamiCreaseLine(ctx, neckX - 5,  neckY, shLX, shLY + 8, 0.65);
      drawOrigamiCreaseLine(ctx, neckX + 5,  neckY, shRX, shRY + 8, 0.65);
      drawOrigamiCreaseLine(ctx, elLX - 7,   elLY,  elLX + 7, elLY, 0.55);
      drawOrigamiCreaseLine(ctx, elRX - 7,   elRY,  elRX + 7, elRY, 0.55);
      drawOrigamiCreaseLine(ctx, hpLX - 10,  hpLY,  hpRX + 10, hpRY, 0.75);
      drawOrigamiCreaseLine(ctx, knLX - 7,   knLY,  knLX + 7, knLY, 0.55);
      drawOrigamiCreaseLine(ctx, knRX - 7,   knRY,  knRX + 7, knRY, 0.55);

      // Accordion spring tại khuỷu khi tay uốn nhiều
      if (elLJ && Math.abs(pose.armAngleL) > 0.3) {
        drawAccordionPaperSpring(ctx, elLX - 5, elLY, elLX + 5, elLY, 9, 3, tick * 0.2);
      }
      if (elRJ && Math.abs(pose.armAngleR) > 0.3) {
        drawAccordionPaperSpring(ctx, elRX - 5, elRY, elRX + 5, elRY, 9, 3, tick * 0.2);
      }
      if (knLJ && Math.abs(pose.legOffsetL) > 10) {
        drawAccordionPaperSpring(ctx, knLX - 5, knLY, knLX + 5, knLY, 7, 3, tick * 0.15);
      }
      if (knRJ && Math.abs(pose.legOffsetR) > 10) {
        drawAccordionPaperSpring(ctx, knRX - 5, knRY, knRX + 5, knRY, 7, 3, tick * 0.15);
      }
    }

    // --- Biểu cảm mặt: Pull-Tab Mechanism (trượt mesh zone mặt) ---
    // Vẽ nét mặt thủ công ngay trên vùng mesh (không dùng widget ngoài)
    if (eyeL && eyeR) {
      const isBlinking = pose.eyeBlink > 0.5;
      const ex1 = toLocalX(eyeL.relX);
      const ey1 = toLocalY(eyeL.relY);
      const ex2 = toLocalX(eyeR.relX);
      const ey2 = toLocalY(eyeR.relY);
      const er  = w * 0.045; // bán kính mắt tương đối với kích thước nhân vật

      ctx.save();
      ctx.strokeStyle = '#1B2A2F';
      ctx.fillStyle   = '#1B2A2F';
      ctx.lineWidth   = Math.max(1, er * 0.4);
      ctx.lineCap     = 'round';

      const drawEye = (ex: number, ey: number, isLeft: boolean) => {
        if (isBlinking || motion === 'sleep') {
          // Nhắm mắt — cung đơn giản
          ctx.beginPath();
          ctx.arc(ex, ey + er * 0.15, er * 0.65, 0.05 * Math.PI, 0.95 * Math.PI, false);
          ctx.stroke();
        } else if (motion === 'happy_jump' || motion === 'dance') {
          // Mắt cười ^ ^
          ctx.beginPath();
          ctx.arc(ex, ey + er * 0.5, er * 0.7, 1.1 * Math.PI, 1.9 * Math.PI, false);
          ctx.stroke();
        } else if (motion === 'sad') {
          // Mắt buồn ︵
          ctx.beginPath();
          ctx.arc(ex, ey + er * 0.7, er * 0.65, 1.15 * Math.PI, 1.85 * Math.PI, false);
          ctx.stroke();
        } else if (motion === 'teri_panic') {
          // Mắt tròn hoảng hốt
          ctx.beginPath();
          ctx.arc(ex, ey, er * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(ex - er * 0.2, ey - er * 0.2, er * 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1B2A2F';
        } else {
          // Mắt bình thường: con ngươi mực
          ctx.beginPath();
          ctx.arc(ex + (isLeft ? er * 0.15 : -er * 0.15), ey, er * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFF';
          ctx.beginPath();
          ctx.arc(ex + (isLeft ? -er * 0.1 : -er * 0.3), ey - er * 0.2, er * 0.18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1B2A2F';
        }
      };

      drawEye(ex1, ey1, true);
      drawEye(ex2, ey2, false);
      ctx.restore();
    }

    if (mouth) {
      const mx  = toLocalX(mouth.relX);
      const my  = toLocalY(mouth.relY);
      const mr  = w * 0.055;

      ctx.save();
      ctx.strokeStyle = '#C8412F';
      ctx.fillStyle   = '#C8412F';
      ctx.lineWidth   = Math.max(1, mr * 0.35);
      ctx.lineCap     = 'round';

      if (motion === 'happy_jump' || motion === 'dance') {
        ctx.beginPath();
        ctx.ellipse(mx, my + mr * 0.2, mr * 0.75, mr * 0.6 + pose.mouthOpen * mr, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (motion === 'sad') {
        ctx.beginPath();
        ctx.arc(mx, my + mr * 0.6, mr * 0.65, 1.1 * Math.PI, 1.9 * Math.PI, false);
        ctx.stroke();
      } else if (motion === 'sleep') {
        ctx.beginPath();
        ctx.arc(mx, my, mr * 0.35, 0, Math.PI * 2);
        ctx.stroke();
      } else if (motion === 'teri_panic') {
        ctx.beginPath();
        const pts = [-mr * 0.8, 0, -mr * 0.4, mr * 0.5, 0, 0, mr * 0.4, mr * 0.5, mr * 0.8, 0];
        ctx.moveTo(mx + pts[0], my + pts[1]);
        for (let i = 2; i < pts.length; i += 2) ctx.lineTo(mx + pts[i], my + pts[i + 1]);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(mx, my - mr * 0.1, mr * 0.65, 0.12 * Math.PI, 0.88 * Math.PI, false);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- Hiệu ứng cảm xúc nổi phía trên tờ giấy ---
    // 1. Giọt nước mắt (sad)
    if (motion === 'sad' && eyeL && eyeR) {
      ctx.save();
      ctx.fillStyle = '#4CC9F0';
      const tearY1 = toLocalY(eyeL.relY) + 8 + ((tick * 1.2) % 20);
      const tearY2 = toLocalY(eyeR.relY) + 8 + (((tick * 1.2) + 10) % 20);
      ctx.beginPath();
      ctx.arc(toLocalX(eyeL.relX), tearY1, 2.5, 0, Math.PI * 2);
      ctx.arc(toLocalX(eyeR.relX), tearY2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 2. zZz ngủ
    if (motion === 'sleep') {
      ctx.save();
      const hX = toLocalX(headJ ? headJ.relX : 0.5);
      const hY = toLocalY(headJ ? headJ.relY : 0.18);
      const flt = (tick * 0.65) % 36;
      ctx.fillStyle = '#FFE18A';
      ctx.strokeStyle = '#8A6F20';
      ctx.lineWidth = 0.5;
      (['z', 'Z', 'Z'] as string[]).forEach((ch, i) => {
        const size = 9 + i * 3;
        ctx.font = `bold ${size}px system-ui`;
        ctx.fillText(ch, hX + 7 + i * 7, hY - 4 - flt * (0.35 + i * 0.25));
      });
      ctx.restore();
    }

    // 3. ✨ / 🎵 khi dance / happy_jump
    if (motion === 'dance' || motion === 'happy_jump') {
      ctx.save();
      ctx.font = '12px system-ui';
      const shLX = toLocalX(shLRelX) - 8;
      const shLY = toLocalY(shLRelY) - 10 + Math.sin(tick * 0.2) * 4;
      const shRX = toLocalX(shRRelX) + 6;
      const shRY = toLocalY(shRRelY) - 12 + Math.cos(tick * 0.2) * 4;
      ctx.fillText(motion === 'dance' ? '🎵' : '✨', shLX, shLY);
      ctx.fillText(motion === 'dance' ? '🎶' : '🌟', shRX, shRY);
      ctx.restore();
    }

    // 4. 💧 Mồ hôi (teri_panic)
    if (motion === 'teri_panic') {
      ctx.save();
      ctx.font = '12px system-ui';
      const px = toLocalX(headJ ? headJ.relX : 0.5);
      const py = toLocalY(headJ ? headJ.relY : 0.18);
      ctx.fillText('💧', px - 18, py - 4);
      ctx.fillText('💧', px + 12, py - 6);
      ctx.restore();
    }
  }

  ctx.restore();
}

export const drawAnimatedFigure = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  pose: RigPose,
  centerX: number,
  centerY: number,
  targetWidth = 100,
  targetHeight = 100,
  direction: 1 | -1 = 1,
  motion: CreatureAction = 'walk',
  tick = 0
) => {
  const dummyRig = generateDefaultHumanoidRig();
  drawPaperPuppet(
    ctx,
    img,
    pose,
    dummyRig,
    centerX,
    centerY,
    targetWidth,
    targetHeight,
    direction,
    0,
    motion,
    tick
  );
};

/**
 * Vẽ khung xương tương tác có ĐẦY ĐỦ KHỚP MẶT (Mắt, Mũi, Miệng) cho phép người chơi kéo thả
 */
export function drawInteractiveSkeleton(
  ctx: CanvasRenderingContext2D,
  rig: SkeletonRig,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  activeJointId: string | null = null,
  hoverJointId: string | null = null
) {
  ctx.save();

  // 1. Vẽ các đường xương kết nối (Bones)
  ctx.strokeStyle = '#F4A259';
  ctx.lineWidth = 2.2;
  ctx.setLineDash([4, 3]);

  const jointMap = new Map<string, { x: number; y: number }>();
  rig.joints.forEach((j) => {
    jointMap.set(j.id, {
      x: boxX + j.relX * boxW,
      y: boxY + j.relY * boxH,
    });
  });

  rig.bones.forEach(([idA, idB]) => {
    const posA = jointMap.get(idA);
    const posB = jointMap.get(idB);
    if (posA && posB) {
      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.stroke();
    }
  });

  // 2. Vẽ từng nốt chốt ghim (Joint Pins chuẩn Meta Demo Lab)
  ctx.setLineDash([]);
  rig.joints.forEach((j) => {
    const pos = jointMap.get(j.id);
    if (!pos) return;

    const isActive = activeJointId === j.id;
    const isHover = hoverJointId === j.id;

    // Màu sắc phân loại chuẩn Meta Demo Lab
    const isLeft = j.type.endsWith('_l');
    const isRight = j.type.endsWith('_r');
    const isFace = ['eye_l', 'eye_r', 'nose', 'mouth'].includes(j.type);

    let pinColor = '#FFD166'; // Trục giữa (Vàng ấm)
    if (isFace) pinColor = '#EF476F';       // Ngũ quan (Hồng san hô)
    else if (isLeft) pinColor = '#06D6A0';  // Chi trái (Xanh ngọc)
    else if (isRight) pinColor = '#118AB2'; // Chi phải (Xanh lam)

    // Hào quang vòng ngoài
    ctx.fillStyle = isActive
      ? 'rgba(255, 209, 102, 0.8)'
      : isHover
      ? 'rgba(244, 162, 89, 0.65)'
      : `${pinColor}44`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isActive ? 13 : isHover ? 11 : isFace ? 6.5 : 8, 0, Math.PI * 2);
    ctx.fill();

    // Lõi chốt ghim (Pin Core)
    ctx.fillStyle = isActive ? '#FFFFFF' : pinColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isActive ? 6.5 : isFace ? 3.5 : 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1B2A2F';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nhãn tên khớp hiển thị dạng pill badge nổi bật (Chuẩn Meta Demo Lab)
    if (isHover || isActive) {
      ctx.save();
      ctx.font = 'bold 10px system-ui';
      const textWidth = ctx.measureText(j.name).width;
      const badgeW = textWidth + 12;
      const badgeH = 18;
      const badgeX = pos.x - badgeW / 2;
      const badgeY = pos.y - 24;

      ctx.fillStyle = 'rgba(15, 25, 28, 0.9)';
      ctx.strokeStyle = '#FFD166';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFE18A';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(j.name, pos.x, badgeY + badgeH / 2);
      ctx.restore();
    }
  });

  ctx.restore();
}

/**
 * Vẽ Hình Nhân Mẫu Đối Chiếu (Humanoid Reference Mannequin Guide) chuẩn Meta Demo Lab
 * Hiển thị bên cạnh để người chơi dễ dàng đối chiếu vị trí chuẩn của từng khớp xương.
 * Khi người chơi di chuột hoặc kéo chốt khớp trên bản vẽ, khớp tương ứng trên hình nhân sẽ bừng sáng!
 */
export function drawReferenceMannequin(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  activeJointId: string | null = null,
  hoverJointId: string | null = null,
  skeletonType: SkeletonType = 'meta_humanoid'
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);

  // Nền thẻ hình nhân mẫu
  ctx.fillStyle = '#0F1A1E';
  ctx.fillRect(0, 0, w, h);

  // Khung viền mờ
  ctx.strokeStyle = 'rgba(107, 143, 113, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  const padX = 14;
  const padY = 16;
  const boxW = w - padX * 2;
  const boxH = h - padY * 2;

  const rig = generateRigByType(skeletonType);
  const targetId = activeJointId || hoverJointId;

  // 1. Vẽ các đường xương nối trên hình nhân
  ctx.strokeStyle = '#4A6953';
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 2]);

  rig.bones.forEach(([idA, idB]) => {
    const jA = rig.joints.find((j) => j.id === idA);
    const jB = rig.joints.find((j) => j.id === idB);
    if (jA && jB) {
      const isBoneActive = targetId === idA || targetId === idB;
      if (isBoneActive) {
        ctx.save();
        ctx.strokeStyle = '#FFD166';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(padX + jA.relX * boxW, padY + jA.relY * boxH);
        ctx.lineTo(padX + jB.relX * boxW, padY + jB.relY * boxH);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.moveTo(padX + jA.relX * boxW, padY + jA.relY * boxH);
        ctx.lineTo(padX + jB.relX * boxW, padY + jB.relY * boxH);
        ctx.stroke();
      }
    }
  });

  // 2. Vẽ các điểm khớp trên hình nhân
  ctx.setLineDash([]);
  rig.joints.forEach((j) => {
    const jx = padX + j.relX * boxW;
    const jy = padY + j.relY * boxH;
    const isTarget = targetId === j.id;

    const isLeft = j.type.endsWith('_l');
    const isRight = j.type.endsWith('_r');
    const isFace = ['eye_l', 'eye_r', 'nose', 'mouth'].includes(j.type);

    let color = '#FFD166';
    if (isFace) color = '#EF476F';
    else if (isLeft) color = '#06D6A0';
    else if (isRight) color = '#118AB2';

    if (isTarget) {
      // Hào quang rực rỡ khi được chọn
      ctx.fillStyle = 'rgba(255, 209, 102, 0.7)';
      ctx.beginPath();
      ctx.arc(jx, jy, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(jx, jy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(jx, jy, isFace ? 2.5 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#1B2A2F';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Nhãn hướng dẫn góc
  ctx.fillStyle = 'rgba(246, 235, 212, 0.6)';
  ctx.font = '8px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('HÌNH NHÂN ĐỐI CHIẾU', w / 2, h - 6);

  ctx.restore();
}

/**
 * TÍNH TOÁN VỊ TRÍ ĐỘNG CỦA TỪNG KHỚP XƯƠNG THEO ĐỘNG HỌC THUẬN (Forward Kinematics - FK)
 * Tuân theo tỷ lệ nhân vật tùy chỉnh của người dùng:
 * - Hông trái / Hông phải (Pelvis & Hips) chuyển động theo nhịp bước và độ nhún
 * - Xương sống (Spine) uốn cong theo dáng người
 * - Cổ & Đầu (Neck & Head) gật gù, nghiêng theo cảm xúc
 * - Ngũ quan (Mắt, Miệng, Mũi) gắn chặt và xoay chuyển đồng bộ theo đầu
 * - Tay trái / Tay phải (Shoulders -> Elbows -> Hands) vung vẩy, gập khớp, múa lượn
 * - Chân trái / Chân phải (Hips -> Knees -> Feet) sải bước, gập gối, tiếp đất
 */
export function computeAnimatedSkeletonJoints(
  rig: SkeletonRig,
  pose: RigPose,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  direction: 1 | -1 = 1,
  rotationY = 0
): Map<string, { x: number; y: number }> {
  const result = new Map<string, { x: number; y: number }>();
  const centerX = boxX + boxW * 0.5;

  const radY = (rotationY * Math.PI) / 180;
  const pScaleX = Math.cos(radY) * direction;

  // 1. Tọa độ nghỉ ban đầu (Rest coordinates)
  const restPos = new Map<string, { x: number; y: number }>();
  rig.joints.forEach((j) => {
    restPos.set(j.id, {
      x: boxX + j.relX * boxW,
      y: boxY + j.relY * boxH,
    });
  });

  const getRest = (type: string) => {
    const j = rig.joints.find((node) => node.type === type);
    return j ? restPos.get(j.id) : null;
  };

  // Mặc định ban đầu nếu có khớp phụ không nằm trong chuỗi FK chính
  rig.joints.forEach((j) => {
    const r = restPos.get(j.id)!;
    const transformedX = centerX + (r.x - centerX) * pScaleX + Math.sin(pose.bodyBend) * 4 * direction;
    const transformedY = r.y + pose.hopY + pose.breathY;
    result.set(j.id, { x: transformedX, y: transformedY });
  });

  // =========================================================================
  // 1. GỐC HÔNG VÀ KHUNG CHẬU (Pelvis & Hips FK)
  // =========================================================================
  const hipLRest = getRest('hip_l');
  const hipRRest = getRest('hip_r');
  const hipSingleRest = getRest('hip') || getRest('root');

  let pelvisRestX = centerX;
  let pelvisRestY = boxY + boxH * 0.68;
  if (hipLRest && hipRRest) {
    pelvisRestX = (hipLRest.x + hipRRest.x) / 2;
    pelvisRestY = (hipLRest.y + hipRRest.y) / 2;
  } else if (hipSingleRest) {
    pelvisRestX = hipSingleRest.x;
    pelvisRestY = hipSingleRest.y;
  }

  // Khung chậu di chuyển theo độ nảy (hop), nhịp thở (breath), và lắc hông khi bước đi
  const animPelvisX = pelvisRestX + Math.sin(pose.bodyBend) * 6 * direction;
  const animPelvisY = pelvisRestY + pose.hopY + pose.breathY;

  // Độ nghiêng khung chậu (Pelvis tilt) khi chuyển trọng tâm chân
  const pelvisTilt = ((pose.legOffsetL - pose.legOffsetR) / 50) * 0.09 * direction;

  let animHipLX = animPelvisX - 10 * direction;
  let animHipLY = animPelvisY;
  let animHipRX = animPelvisX + 10 * direction;
  let animHipRY = animPelvisY;

  if (hipLRest) {
    const dx = hipLRest.x - pelvisRestX;
    const dy = hipLRest.y - pelvisRestY;
    animHipLX = animPelvisX + (dx * Math.cos(pelvisTilt) - dy * Math.sin(pelvisTilt));
    animHipLY = animPelvisY + (dx * Math.sin(pelvisTilt) + dy * Math.cos(pelvisTilt));
    const j = rig.joints.find((n) => n.type === 'hip_l');
    if (j) result.set(j.id, { x: centerX + (animHipLX - centerX) * pScaleX, y: animHipLY });
  }

  if (hipRRest) {
    const dx = hipRRest.x - pelvisRestX;
    const dy = hipRRest.y - pelvisRestY;
    animHipRX = animPelvisX + (dx * Math.cos(pelvisTilt) - dy * Math.sin(pelvisTilt));
    animHipRY = animPelvisY + (dx * Math.sin(pelvisTilt) + dy * Math.cos(pelvisTilt));
    const j = rig.joints.find((n) => n.type === 'hip_r');
    if (j) result.set(j.id, { x: centerX + (animHipRX - centerX) * pScaleX, y: animHipRY });
  }

  // =========================================================================
  // 2. CHÂN TRÁI & CHÂN PHẢI (Legs & Feet FK)
  // =========================================================================
  // Chân trái
  const kneeLRest = getRest('knee_l');
  const footLRest = getRest('foot_l');
  if (kneeLRest) {
    const thighRefX = hipLRest ? hipLRest.x : animPelvisX - 10;
    const thighRefY = hipLRest ? hipLRest.y : animPelvisY;
    const thighDx = kneeLRest.x - thighRefX;
    const thighDy = kneeLRest.y - thighRefY;
    const thighLen = Math.hypot(thighDx, thighDy) || boxH * 0.16;
    const thighRestAngle = Math.atan2(thighDy, thighDx);

    const thighSwing = (pose.legOffsetL / 36) * 0.7 * direction;
    const thighAngle = thighRestAngle + thighSwing;
    const animKneeLX = animHipLX + Math.cos(thighAngle) * thighLen;
    const animKneeLY = animHipLY + Math.sin(thighAngle) * thighLen;

    const jKnee = rig.joints.find((n) => n.type === 'knee_l');
    if (jKnee) result.set(jKnee.id, { x: centerX + (animKneeLX - centerX) * pScaleX, y: animKneeLY });

    if (footLRest) {
      const calfDx = footLRest.x - kneeLRest.x;
      const calfDy = footLRest.y - kneeLRest.y;
      const calfLen = Math.hypot(calfDx, calfDy) || boxH * 0.16;
      const calfRestAngle = Math.atan2(calfDy, calfDx);

      let kneeFlex = Math.max(0, -pose.legOffsetL * 0.025) * direction;
      if (pose.hopY < -8) kneeFlex += 0.25; // Gập nhẹ đầu gối khi bật nhảy
      const calfAngle = calfRestAngle + thighSwing + kneeFlex;
      const animFootLX = animKneeLX + Math.cos(calfAngle) * calfLen;
      const animFootLY = animKneeLY + Math.sin(calfAngle) * calfLen;

      const jFoot = rig.joints.find((n) => n.type === 'foot_l');
      if (jFoot) result.set(jFoot.id, { x: centerX + (animFootLX - centerX) * pScaleX, y: animFootLY });
    }
  }

  // Chân phải
  const kneeRRest = getRest('knee_r');
  const footRRest = getRest('foot_r');
  if (kneeRRest) {
    const thighRefX = hipRRest ? hipRRest.x : animPelvisX + 10;
    const thighRefY = hipRRest ? hipRRest.y : animPelvisY;
    const thighDx = kneeRRest.x - thighRefX;
    const thighDy = kneeRRest.y - thighRefY;
    const thighLen = Math.hypot(thighDx, thighDy) || boxH * 0.16;
    const thighRestAngle = Math.atan2(thighDy, thighDx);

    const thighSwing = (pose.legOffsetR / 36) * 0.7 * direction;
    const thighAngle = thighRestAngle + thighSwing;
    const animKneeRX = animHipRX + Math.cos(thighAngle) * thighLen;
    const animKneeRY = animHipRY + Math.sin(thighAngle) * thighLen;

    const jKnee = rig.joints.find((n) => n.type === 'knee_r');
    if (jKnee) result.set(jKnee.id, { x: centerX + (animKneeRX - centerX) * pScaleX, y: animKneeRY });

    if (footRRest) {
      const calfDx = footRRest.x - kneeRRest.x;
      const calfDy = footRRest.y - kneeRRest.y;
      const calfLen = Math.hypot(calfDx, calfDy) || boxH * 0.16;
      const calfRestAngle = Math.atan2(calfDy, calfDx);

      let kneeFlex = Math.max(0, -pose.legOffsetR * 0.025) * direction;
      if (pose.hopY < -8) kneeFlex += 0.25;
      const calfAngle = calfRestAngle + thighSwing + kneeFlex;
      const animFootRX = animKneeRX + Math.cos(calfAngle) * calfLen;
      const animFootRY = animKneeRY + Math.sin(calfAngle) * calfLen;

      const jFoot = rig.joints.find((n) => n.type === 'foot_r');
      if (jFoot) result.set(jFoot.id, { x: centerX + (animFootRX - centerX) * pScaleX, y: animFootRY });
    }
  }

  // =========================================================================
  // 3. XƯƠNG SỐNG & LỒNG NGỰC / CỔ (Spine & Neck FK)
  // =========================================================================
  const spineRest = getRest('spine');
  const neckRest = getRest('neck');

  let animSpineX = animPelvisX;
  let animSpineY = animPelvisY - boxH * 0.18;
  const spineBend = pose.bodyBend * 0.85 * direction;

  if (spineRest) {
    const sDx = spineRest.x - pelvisRestX;
    const sDy = spineRest.y - pelvisRestY;
    const sLen = Math.hypot(sDx, sDy) || boxH * 0.18;
    const sRestAngle = Math.atan2(sDy, sDx);
    animSpineX = animPelvisX + Math.cos(sRestAngle + spineBend) * sLen * pose.stretchY;
    animSpineY = animPelvisY + Math.sin(sRestAngle + spineBend) * sLen * pose.stretchY;

    const jSpine = rig.joints.find((n) => n.type === 'spine');
    if (jSpine) result.set(jSpine.id, { x: centerX + (animSpineX - centerX) * pScaleX, y: animSpineY });
  }

  let animNeckX = animSpineX;
  let animNeckY = animSpineY - boxH * 0.14;
  const neckBend = pose.bodyBend * 1.15 * direction;

  if (neckRest) {
    const baseRefX = spineRest ? spineRest.x : pelvisRestX;
    const baseRefY = spineRest ? spineRest.y : pelvisRestY;
    const nDx = neckRest.x - baseRefX;
    const nDy = neckRest.y - baseRefY;
    const nLen = Math.hypot(nDx, nDy) || boxH * 0.14;
    const nRestAngle = Math.atan2(nDy, nDx);
    animNeckX = animSpineX + Math.cos(nRestAngle + neckBend) * nLen * pose.stretchY;
    animNeckY = animSpineY + Math.sin(nRestAngle + neckBend) * nLen * pose.stretchY;

    const jNeck = rig.joints.find((n) => n.type === 'neck');
    if (jNeck) result.set(jNeck.id, { x: centerX + (animNeckX - centerX) * pScaleX, y: animNeckY });
  }

  // =========================================================================
  // 4. ĐẦU VÀ NGŨ QUAN (Head, Eyes, Nose, Mouth FK)
  // =========================================================================
  const headRest = getRest('head');
  let animHeadX = animNeckX;
  let animHeadY = animNeckY - boxH * 0.16;
  const headAngleOffset = (pose.headTilt + pose.bodyBend * 0.5) * direction;

  if (headRest) {
    const baseRefX = neckRest ? neckRest.x : animSpineX;
    const baseRefY = neckRest ? neckRest.y : animSpineY;
    const hDx = headRest.x - baseRefX;
    const hDy = headRest.y - baseRefY;
    const hLen = Math.hypot(hDx, hDy) || boxH * 0.16;
    const hRestAngle = Math.atan2(hDy, hDx);
    animHeadX = animNeckX + Math.cos(hRestAngle + headAngleOffset) * hLen;
    animHeadY = animNeckY + Math.sin(hRestAngle + headAngleOffset) * hLen;

    const jHead = rig.joints.find((n) => n.type === 'head');
    if (jHead) result.set(jHead.id, { x: centerX + (animHeadX - centerX) * pScaleX, y: animHeadY });
  }

  // Ngũ quan xoay chuyển đồng bộ theo đầu (Mắt, Mũi, Miệng)
  ['eye_l', 'eye_r', 'nose', 'mouth'].forEach((faceType) => {
    const fRest = getRest(faceType);
    if (fRest && headRest) {
      const relDx = fRest.x - headRest.x;
      const relDy = fRest.y - headRest.y;
      const rotRelX = relDx * Math.cos(headAngleOffset) - relDy * Math.sin(headAngleOffset);
      const rotRelY = relDx * Math.sin(headAngleOffset) + relDy * Math.cos(headAngleOffset);
      const fX = animHeadX + rotRelX;
      const fY = animHeadY + rotRelY;

      const jFace = rig.joints.find((n) => n.type === faceType);
      if (jFace) result.set(jFace.id, { x: centerX + (fX - centerX) * pScaleX, y: fY });
    }
  });

  // =========================================================================
  // 5. TAY TRÁI & TAY PHẢI (Arms & Hands FK)
  // =========================================================================
  // Tay trái
  const shoulderLRest = getRest('shoulder_l');
  const elbowLRest = getRest('elbow_l');
  const handLRest = getRest('hand_l');
  if (shoulderLRest) {
    const nRefX = neckRest ? neckRest.x : centerX;
    const nRefY = neckRest ? neckRest.y : boxY + boxH * 0.4;
    const shDx = shoulderLRest.x - nRefX;
    const shDy = shoulderLRest.y - nRefY;
    const animShoulderLX = animNeckX + shDx + Math.sin(pose.bodyBend) * 3 * direction;
    const animShoulderLY = animNeckY + shDy;

    const jSh = rig.joints.find((n) => n.type === 'shoulder_l');
    if (jSh) result.set(jSh.id, { x: centerX + (animShoulderLX - centerX) * pScaleX, y: animShoulderLY });

    if (elbowLRest) {
      const armDx = elbowLRest.x - shoulderLRest.x;
      const armDy = elbowLRest.y - shoulderLRest.y;
      const armLen = Math.hypot(armDx, armDy) || boxH * 0.13;
      const armRestAngle = Math.atan2(armDy, armDx);
      const armAngleL = armRestAngle + pose.armAngleL * direction;
      const animElbowLX = animShoulderLX + Math.cos(armAngleL) * armLen;
      const animElbowLY = animShoulderLY + Math.sin(armAngleL) * armLen;

      const jElbow = rig.joints.find((n) => n.type === 'elbow_l');
      if (jElbow) result.set(jElbow.id, { x: centerX + (animElbowLX - centerX) * pScaleX, y: animElbowLY });

      if (handLRest) {
        const foreDx = handLRest.x - elbowLRest.x;
        const foreDy = handLRest.y - elbowLRest.y;
        const foreLen = Math.hypot(foreDx, foreDy) || boxH * 0.12;
        const foreRestAngle = Math.atan2(foreDy, foreDx);
        const elbowFlex = pose.armAngleL * 0.45 * direction;
        const forearmAngle = foreRestAngle + pose.armAngleL * direction + elbowFlex;
        const animHandLX = animElbowLX + Math.cos(forearmAngle) * foreLen;
        const animHandLY = animElbowLY + Math.sin(forearmAngle) * foreLen;

        const jHand = rig.joints.find((n) => n.type === 'hand_l');
        if (jHand) result.set(jHand.id, { x: centerX + (animHandLX - centerX) * pScaleX, y: animHandLY });
      }
    }
  }

  // Tay phải
  const shoulderRRest = getRest('shoulder_r');
  const elbowRRest = getRest('elbow_r');
  const handRRest = getRest('hand_r');
  if (shoulderRRest) {
    const nRefX = neckRest ? neckRest.x : centerX;
    const nRefY = neckRest ? neckRest.y : boxY + boxH * 0.4;
    const shDx = shoulderRRest.x - nRefX;
    const shDy = shoulderRRest.y - nRefY;
    const animShoulderRX = animNeckX + shDx + Math.sin(pose.bodyBend) * 3 * direction;
    const animShoulderRY = animNeckY + shDy;

    const jSh = rig.joints.find((n) => n.type === 'shoulder_r');
    if (jSh) result.set(jSh.id, { x: centerX + (animShoulderRX - centerX) * pScaleX, y: animShoulderRY });

    if (elbowRRest) {
      const armDx = elbowRRest.x - shoulderRRest.x;
      const armDy = elbowRRest.y - shoulderRRest.y;
      const armLen = Math.hypot(armDx, armDy) || boxH * 0.13;
      const armRestAngle = Math.atan2(armDy, armDx);
      const armAngleR = armRestAngle + pose.armAngleR * direction;
      const animElbowRX = animShoulderRX + Math.cos(armAngleR) * armLen;
      const animElbowRY = animShoulderRY + Math.sin(armAngleR) * armLen;

      const jElbow = rig.joints.find((n) => n.type === 'elbow_r');
      if (jElbow) result.set(jElbow.id, { x: centerX + (animElbowRX - centerX) * pScaleX, y: animElbowRY });

      if (handRRest) {
        const foreDx = handRRest.x - elbowRRest.x;
        const foreDy = handRRest.y - elbowRRest.y;
        const foreLen = Math.hypot(foreDx, foreDy) || boxH * 0.12;
        const foreRestAngle = Math.atan2(foreDy, foreDx);
        const elbowFlex = pose.armAngleR * 0.45 * direction;
        const forearmAngle = foreRestAngle + pose.armAngleR * direction + elbowFlex;
        const animHandRX = animElbowRX + Math.cos(forearmAngle) * foreLen;
        const animHandRY = animElbowRY + Math.sin(forearmAngle) * foreLen;

        const jHand = rig.joints.find((n) => n.type === 'hand_r');
        if (jHand) result.set(jHand.id, { x: centerX + (animHandRX - centerX) * pScaleX, y: animHandRY });
      }
    }
  }

  return result;
}

/**
 * Vẽ khung xương động phát sáng (Playback Wireframe) với ĐỘNG HỌC THUẬN (FK) CHUẨN META DEMO LAB
 * Khớp xương gập khúc, sải bước, vung tay và nghiêng đầu mượt mà chân thực!
 */
export function drawSkeletonWireframe(
  ctx: CanvasRenderingContext2D,
  rig: SkeletonRig,
  pose: RigPose,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  rotationY = 0,
  direction: 1 | -1 = 1
) {
  ctx.save();

  // 1. Tính toán vị trí động học thuận (Forward Kinematics) của toàn bộ các khớp
  const jointPos = computeAnimatedSkeletonJoints(
    rig,
    pose,
    boxX,
    boxY,
    boxW,
    boxH,
    direction,
    rotationY
  );

  // 2. Vẽ các khúc xương nối giữa các khớp (Bones với hiệu ứng nét đứt vàng ánh kim)
  ctx.strokeStyle = '#F4A259';
  ctx.lineWidth = 2.4;
  ctx.setLineDash([4, 3]);

  rig.bones.forEach(([idA, idB]) => {
    const posA = jointPos.get(idA);
    const posB = jointPos.get(idB);
    if (posA && posB) {
      ctx.beginPath();
      ctx.moveTo(posA.x, posA.y);
      ctx.lineTo(posB.x, posB.y);
      ctx.stroke();
    }
  });

  // 3. Vẽ từng nốt chốt khớp phát sáng (Joint Pins với màu sắc phân loại Meta Demo Lab)
  ctx.setLineDash([]);
  rig.joints.forEach((j) => {
    const pos = jointPos.get(j.id);
    if (!pos) return;

    const isLeft = j.type.endsWith('_l');
    const isRight = j.type.endsWith('_r');
    const isFace = ['eye_l', 'eye_r', 'nose', 'mouth'].includes(j.type);

    let pinColor = '#FFD166'; // Trục giữa (Vàng ấm)
    if (isFace) pinColor = '#EF476F';       // Ngũ quan (Hồng san hô)
    else if (isLeft) pinColor = '#06D6A0';  // Chi trái (Xanh ngọc)
    else if (isRight) pinColor = '#118AB2'; // Chi phải (Xanh lam)

    // Hào quang tỏa sáng của chốt ghim
    ctx.fillStyle = `${pinColor}55`;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isFace ? 5 : 7, 0, Math.PI * 2);
    ctx.fill();

    // Lõi chốt ghim
    ctx.fillStyle = pinColor;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isFace ? 2.5 : 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#1B2A2F';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  ctx.restore();
}
