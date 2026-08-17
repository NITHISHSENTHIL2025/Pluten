const prisma = require('../lib/prisma');

const parsePagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  return { page, limit, skip: (page - 1) * limit };
};

const getTelemetry = async (req, res) => {
  try {
    const [revenueResult, premiumUsersCount, totalUsersCount, pendingOrdersCount] = await Promise.all([
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: 'SUCCESS' } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
    ]);

    res.status(200).json({
      revenue: revenueResult._sum.totalAmount || 0,
      premiumUsers: premiumUsersCount,
      totalUsers: totalUsersCount,
      pendingOrders: pendingOrdersCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ADMIN] Telemetry error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to retrieve telemetry.' });
  }
};

const getOrders = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = String(req.query.search || '').trim();
    const where = search
      ? {
          OR: [
            { transactionId: { contains: search, mode: 'insensitive' } },
            { id: { contains: search, mode: 'insensitive' } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { product: { title: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : undefined;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
          product: { select: { title: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.status(200).json({ data: orders, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error('[ADMIN] Orders error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to retrieve order ledger.' });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = String(req.query.search || '').trim();
    const where = {
      role: 'CUSTOMER',
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          isPremium: true, createdAt: true,
          _count: { select: { orders: { where: { status: 'SUCCESS' } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({ data: customers, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    console.error('[ADMIN] Customers error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to retrieve customer directory.' });
  }
};

module.exports = { getTelemetry, getOrders, getCustomers };
