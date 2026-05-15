import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PORT } from './config.js';
import { connectDb } from './db.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerMeRoutes } from './routes/me.js';
import { registerFarmRoutes } from './routes/farm.js';
import { registerShopRoutes } from './routes/shop.js';
import { registerInventoryRoutes } from './routes/inventory.js';
import { registerWalletRoutes } from './routes/wallet.js';
import { registerTasksRoutes } from './routes/tasks.js';

async function main(): Promise<void> {
  await connectDb();
  const app = Fastify({ logger: true });
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  app.get('/health', async () => ({ ok: true }));

  await registerAuthRoutes(app);
  await registerMeRoutes(app);
  await registerFarmRoutes(app);
  await registerShopRoutes(app);
  await registerInventoryRoutes(app);
  await registerWalletRoutes(app);
  await registerTasksRoutes(app);

  await app.listen({ port: PORT, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
