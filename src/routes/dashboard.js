import { Router } from 'express';
import { prisma } from '../services/db.js';

const router = Router();

router.get('/summary', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalProducts, lowStockCount, salesToday, salesWeek, salesMonth, revenueToday, revenueWeek, revenueMonth] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { quantityInStock: { lt: 5 } } }),
      prisma.sale.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.sale.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.sale.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfToday } }, _sum: { totalAmount: true } }),
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfWeek } }, _sum: { totalAmount: true } }),
      prisma.sale.aggregate({ where: { createdAt: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
    ]);

    res.json({
      totalProducts,
      lowStockCount,
      salesToday,
      salesWeek,
      salesMonth,
      revenueToday: revenueToday._sum.totalAmount ?? 0,
      revenueWeek: revenueWeek._sum.totalAmount ?? 0,
      revenueMonth: revenueMonth._sum.totalAmount ?? 0,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/sales-over-time', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();
    const sales = await prisma.sale.findMany({
      where: { createdAt: { gte: fromDate, lte: toDate } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, createdAt: true, totalAmount: true },
    });
    res.json(sales);
  } catch (err) {
    next(err);
  }
});

router.get('/reports/sales', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(0);
    const toDate = to ? new Date(to) : new Date();
    const [sales, agg] = await Promise.all([
      prisma.sale.findMany({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: fromDate, lte: toDate } },
        _sum: { totalAmount: true },
        _count: true,
      }),
    ]);
    res.json({
      totalRevenue: agg._sum.totalAmount ?? 0,
      totalTransactions: agg._count,
      sales,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
