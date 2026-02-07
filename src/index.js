import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', authMiddleware, productRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
