import prisma from '../lib/prisma.js';

export const getAllAuctions = async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: true,
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = auctions.map(a => ({
      ...a,
      startingBid: parseFloat(a.startingBid),
      buyNowPrice: a.buyNowPrice ? parseFloat(a.buyNowPrice) : null,
      currentBid: a.currentBid ? parseFloat(a.currentBid) : null,
    }));

    res.json({ success: true, auctions: formatted });
  } catch (error) {
    console.error('getAllAuctions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch auctions' });
  }
};

export const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: true,
        bids: {
          orderBy: { placedAt: 'desc' },
          take: 20,
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { bids: true } },
      },
    });

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    const formatted = {
      ...auction,
      startingBid: parseFloat(auction.startingBid),
      buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
      currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
      bids: auction.bids.map(b => ({
        ...b,
        amount: parseFloat(b.amount),
      })),
    };

    res.json({ success: true, auction: formatted });
  } catch (error) {
    console.error('getAuctionById error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch auction' });
  }
};

export const createAuction = async (req, res) => {
  try {
    const {
      sellerId,
      title,
      description,
      images,
      categoryId,
      startingBid,
      buyNowPrice,
      durationMinutes,
      startsAt,
    } = req.body;

    // Basic validation for now (you can replace this with Zod)
    if (!sellerId || !title || !description || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sellerId, title, description, and at least one image are required',
      });
    }

    if (!startingBid || Number(startingBid) <= 0) {
      return res
        .status(400)
        .json({ success: false, message: 'startingBid must be a positive number' });
    }

    if (!durationMinutes || durationMinutes < 5 || durationMinutes > 30) {
      return res.status(400).json({
        success: false,
        message: 'durationMinutes must be between 5 and 15',
      });
    }

    const startsAtDate = startsAt ? new Date(startsAt) : new Date();
    if (Number.isNaN(startsAtDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'startsAt must be a valid date',
      });
    }

    const endsAt = new Date(startsAtDate.getTime() + durationMinutes * 60 * 1000);

    const auction = await prisma.auction.create({
      data: {
        sellerId,
        categoryId: categoryId || null,
        title,
        description,
        images,
        startingBid,
        buyNowPrice: buyNowPrice || null,
        durationMinutes,
        status: 'scheduled',
        startsAt: startsAtDate,
        endsAt,
      },
      include: {
        seller: {
          select: { id: true, username: true, avatarUrl: true },
        },
        category: true,
      },
    });

    const formatted = {
      ...auction,
      startingBid: parseFloat(auction.startingBid),
      buyNowPrice: auction.buyNowPrice ? parseFloat(auction.buyNowPrice) : null,
      currentBid: auction.currentBid ? parseFloat(auction.currentBid) : null,
    };

    res.status(201).json({ success: true, auction: formatted });
  } catch (error) {
    console.error('createAuction error:', error);
    res.status(500).json({ success: false, message: 'Failed to create auction' });
  }
};

export const updateAuction = async (req, res) => {
  return res
    .status(501)
    .json({ success: false, message: 'updateAuction not implemented yet' });
};

export const deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;

    const requesterId = req.user?.id || req.body?.sellerId;
    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized (missing user). Provide auth or sellerId temporarily.',
      });
    }

    const auction = await prisma.auction.findUnique({
      where: { id },
      select: { id: true, sellerId: true, status: true },
    });

    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction not found' });
    }

    if (auction.sellerId !== requesterId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const bidCount = await prisma.bid.count({ where: { auctionId: id } });
    if (bidCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'Auction has bids and cannot be cancelled',
      });
    }

    if (auction.status === 'cancelled') {
      return res.status(200).json({ success: true, message: 'Auction already cancelled' });
    }

    if (auction.status === 'completed') {
      return res.status(409).json({
        success: false,
        message: 'Completed auctions cannot be cancelled',
      });
    }

    await prisma.auction.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return res.status(200).json({ success: true, message: 'Auction cancelled' });
  } catch (error) {
    console.error('deleteAuction error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel auction' });
  }
};