import type { FastifyInstance } from 'fastify';
import { TransactionModel } from '../models/Transaction.js';
import { authPreHandler } from '../plugins/auth.js';

export async function registerWalletRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/wallet/transactions', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const q = req.query as { limit?: string };
    const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '50', 10) || 50));
    const list = await TransactionModel.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return {
      items: list.map((t) => ({
        id: t._id.toString(),
        currency: t.currency,
        amount: t.amount,
        reason: t.reason,
        meta: t.meta,
        createdAt: t.createdAt,
      })),
    };
  });
}
