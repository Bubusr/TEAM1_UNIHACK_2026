const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Bắt đầu khởi tạo dữ liệu mẫu (seed database)...');

  const routesFilePath = path.join(process.cwd(), 'data', 'routes.json');
  if (!fs.existsSync(routesFilePath)) {
    throw new Error(`Không tìm thấy file dữ liệu: ${routesFilePath}`);
  }

  const routesData = JSON.parse(fs.readFileSync(routesFilePath, 'utf-8'));

  for (const r of routesData) {
    const route = await prisma.route.upsert({
      where: { id: r.id },
      update: {
        name: r.name,
        description: r.description,
        estimatedTime: r.estimatedTime,
        badgeImageUrl: r.badgeImageUrl,
      },
      create: {
        id: r.id,
        name: r.name,
        description: r.description,
        estimatedTime: r.estimatedTime,
        badgeImageUrl: r.badgeImageUrl,
      },
    });

    console.log(`Đã lưu tuyến: ${route.name} (${route.id})`);

    for (const s of r.stops) {
      await prisma.stop.upsert({
        where: {
          qrCode: s.qrCode,
        },
        update: {
          routeId: route.id,
          orderIndex: s.orderIndex,
          name: s.name,
          description: s.description,
          lat: s.lat,
          lng: s.lng,
        },
        create: {
          routeId: route.id,
          orderIndex: s.orderIndex,
          name: s.name,
          description: s.description,
          lat: s.lat,
          lng: s.lng,
          qrCode: s.qrCode,
        },
      });
      console.log(`  - Điểm dừng ${s.orderIndex + 1}: ${s.name} (${s.qrCode})`);
    }
  }

  console.log('Khởi tạo dữ liệu mẫu hoàn tất thành công!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed dữ liệu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

