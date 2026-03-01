import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Collectibles', slug: 'collectibles' },
  { name: 'Home & Garden', slug: 'home-garden' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Toys & Games', slug: 'toys-games' },
  { name: 'Art', slug: 'art' },
  { name: 'Vehicles', slug: 'vehicles' },
  { name: 'Jewelry', slug: 'jewelry' },
  { name: 'Other', slug: 'other' },
];

async function main() {
  console.log('Seeding database...');

  // Create categories
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log(`Created ${categories.length} categories`);

  // Create demo users (for development only)
  const demoUsers = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'seller@demo.com',
      username: 'DemoSeller',
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'buyer@demo.com',
      username: 'DemoBuyer',
    },
  ];

  for (const user of demoUsers) {
    const created = await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user,
    });

    // Create wallet for user
    await prisma.wallet.upsert({
      where: { userId: created.id },
      update: {},
      create: {
        userId: created.id,
        balance: 100.0,
        heldBalance: 0,
      },
    });
  }

  console.log(`Created ${demoUsers.length} demo users with wallets`);

  // Create a demo auction
  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'electronics' },
  });

  const now = new Date();
  const startsAt = new Date(now.getTime() + 5 * 60 * 1000);
  const endsAt = new Date(startsAt.getTime() + 10 * 60 * 1000);

  await prisma.auction.upsert({
    where: { id: '00000000-0000-0000-0000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000010',
      sellerId: '00000000-0000-0000-0000-000000000001',
      categoryId: electronicsCategory?.id,
      title: 'Demo: Vintage Gaming Console',
      description:
        'A classic gaming console in excellent condition. Perfect for collectors and retro gaming enthusiasts.',
      images: ['https://picsum.photos/seed/auction1/800/600'],
      startingBid: 50.0,
      buyNowPrice: 200.0,
      durationMinutes: 10,
      status: 'scheduled',
      startsAt,
      endsAt,
    },
  });

  console.log('Created demo auction');

  console.log('Seeding complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
