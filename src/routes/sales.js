import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.js';

const router = Router();
const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().min(0),
});
const createSaleSchema = z.object({
  notes: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1),
});

router.get('/', async (req, res, next) => {
  try {
    const sales = await prisma.sale.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
    res.json(sales);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } } },
    });
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { notes, items } = createSaleSchema.parse(req.body);
    const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const sale = await prisma.$transaction(async (tx) => {
      const saleRecord = await tx.sale.create({
        data: { totalAmount, notes },
      });
      for (const it of items) {
        await tx.saleItem.create({
          data: {
            saleId: saleRecord.id,
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            subtotal: it.quantity * it.unitPrice,
          },
        });
        await tx.product.update({
          where: { id: it.productId },
          data: { quantityInStock: { decrement: it.quantity } },
        });
      }
      return tx.sale.findUnique({
        where: { id: saleRecord.id },
        include: { items: { include: { product: true } } },
      });
    });
    res.status(201).json(sale);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

export default router;
