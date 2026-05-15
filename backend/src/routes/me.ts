import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import { authPreHandler } from '../plugins/auth.js';
import { userToJson } from '../services/userPayload.js';

export async function registerMeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/me', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    return userToJson(user);
  });

  app.patch('/api/me/settings', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const body = req.body as { soundOn?: boolean };
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    if (typeof body.soundOn === 'boolean') {
      user.soundOn = body.soundOn;
    }
    await user.save();
    return userToJson(user);
  });

  app.post('/api/wallet/mock-recharge', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const body = req.body as { tierId?: string };
    const tier = body.tierId ?? 't60';
    const map: Record<string, number> = { t60: 60, t300: 300, t980: 980 };
    const diamonds = map[tier] ?? 60;
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    user.diamonds += diamonds;
    await user.save();
    const { logTransaction } = await import('../services/transactionService.js');
    await logTransaction(
      user._id as mongoose.Types.ObjectId,
      'diamonds',
      diamonds,
      'mock_recharge',
      { tierId: tier },
    );
    return userToJson(user);
  });
}
