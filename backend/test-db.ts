import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Đang kết nối database...');

  const newUser = await prisma.user.create({
    data: {
      email: 'test.v6@example.com',
      name: 'User V6',
      role: 'OWNER',
    },
  });

  console.log(' Đã tạo User thành công trên mây!');
  console.log(newUser);
}

main()
  .catch((e) => {
    console.error('Có lỗi xảy ra:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
