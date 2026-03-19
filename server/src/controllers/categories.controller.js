import prisma from '../lib/prisma.js';

export const getCategories = async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { auctions: true },
        },
      },
    });

    return res.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('getCategories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

