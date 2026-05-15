import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import { authPreHandler } from '../plugins/auth.js';
import { CROPS, type CropId } from '../gameConfig.js';
import { removeInv } from '../services/inventoryService.js';
import { logTransaction } from '../services/transactionService.js';
import { userToJson, prepareUserForApi } from '../services/userPayload.js';
import { bumpTask } from '../services/taskService.js';

function sellPriceForItem(itemId: string): number | null {
  if (itemId.startsWith('crop_')) {
    const id = itemId.slice(5) as CropId;
    const c = CROPS[id];
    return c ? c.sellPrice : null;
  }
  return null;
}

export async function registerInventoryRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/inventory', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    return { items: user.inventory.map((i) => ({ itemId: i.itemId, qty: i.qty })) };
  });

  app.post('/api/inventory/sell', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const body = req.body as { itemId?: string; quantity?: number };
    const itemId = body.itemId;
    const quantity = Math.min(999, Math.max(1, Math.floor(body.quantity ?? 1)));
    if (!itemId) {
      return reply.code(400).send({ error: '物品无效' });
    }
    const unit = sellPriceForItem(itemId);
    if (unit == null) {
      return reply.code(400).send({ error: '该物品不可出售' });
    }
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    if (!removeInv(user, itemId, quantity)) {
      return reply.code(400).send({ error: '数量不足' });
    }
    const gain = unit * quantity;
    user.coins += gain;
    await logTransaction(user._id as mongoose.Types.ObjectId, 'coins', gain, 'sell_crop', {
      itemId,
      quantity,
    });
    bumpTask(user, 'daily_sell_10', quantity);
    await user.save();
    return userToJson(user);
  });
}
