import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { config } from './config.js';

import authRoutes from './routes/auth.js';
import materialsRoutes from './routes/materials.js';
import hardwareRoutes from './routes/hardware.js';
import printersRoutes from './routes/printers.js';
import laborRoutes from './routes/labor.js';
import productsRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import dashboardRoutes from './routes/dashboard.js';
import syncRoutes from './routes/sync.js';
import { requireAuth } from './middleware/requireAuth.js';

const app = express();

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 30 * 24 * 60 * 60 * 1000 },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/materials', requireAuth, materialsRoutes);
app.use('/api/hardware', requireAuth, hardwareRoutes);
app.use('/api/printers', requireAuth, printersRoutes);
app.use('/api/labor', requireAuth, laborRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/sales', requireAuth, salesRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/sync', requireAuth, syncRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve built client in production
if (process.env.NODE_ENV === 'production') {
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(config.port, () => {
  console.log(`PrintProfit server running on port ${config.port}`);
});
