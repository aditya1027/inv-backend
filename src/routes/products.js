import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/db.js';

const router = Router();
const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  unitPrice: z.number().min(0),
  quantityInStock: z.number().int().min(0).default(0),
  category: z.string().optional().nullable(),
});

router.get('/', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/by-barcode/:barcode', async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findFirst({ where: { barcode: barcode || undefined } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(product);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const body = z.object({ quantityInStock: z.number().int().min(0) }).parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { quantityInStock: body.quantityInStock },
    });
    res.json(product);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Product not found' });
    next(err);
  }
});

export default router;
