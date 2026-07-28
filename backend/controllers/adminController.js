const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTelemetry = async (req, res) => {
    try {
        const revenueResult = await prisma.order.aggregate({
            _sum: { totalAmount: true },
            where: { status: 'SUCCESS' }
        });
        const premiumUsersCount = await prisma.user.count({ where: { isPremium: true } });
        const totalUsersCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
        const pendingOrdersCount = await prisma.order.count({ where: { status: 'PENDING' } });

        res.status(200).json({
            revenue: revenueResult._sum.totalAmount || 0,
            premiumUsers: premiumUsersCount,
            totalUsers: totalUsersCount,
            pendingOrders: pendingOrdersCount
        });
    } catch (error) {
        console.error("Telemetry Error:", error);
        res.status(500).json({ error: "Failed to retrieve telemetry." });
    }
};

const getOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true, firstName: true, lastName: true } },
                product: { select: { title: true } }
            }
        });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve order ledger." });
    }
};

const getCustomers = async (req, res) => {
    try {
        const customers = await prisma.user.findMany({
            where: { role: 'CUSTOMER' },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, email: true, firstName: true, lastName: true,
                isPremium: true, createdAt: true,
                _count: { select: { orders: { where: { status: 'SUCCESS' } } } }
            }
        });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve customer directory." });
    }
};

module.exports = { getTelemetry, getOrders, getCustomers };