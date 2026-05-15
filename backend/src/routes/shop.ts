import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import { authPreHandler } from '../plugins/auth.js';
import { SHOP_ITEMS, MAX_STAMINA } from '../gameConfig.js';
import { addInv } from '../services/inventoryService.js';
import { logTransaction } from '../services/transactionService.js';
import { userToJson, prepareUserForApi } from '../services/userPayload.js';

export async function registerShopRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/shop/catalog', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    return {
      items: SHOP_ITEMS.map((it) => ({
        ...it,
        unlocked: user.level >= it.unlockLevel,
      })),
    };
  });

  app.post('/api/shop/purchase', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const body = req.body as { itemId?: string; quantity?: number };
    const itemId = body.itemId;
    const quantity = Math.min(99, Math.max(1, Math.floor(body.quantity ?? 1)));
    const def = SHOP_ITEMS.find((x) => x.id === itemId);
    if (!def) {
      return reply.code(400).send({ error: '商品不存在' });
    }
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    if (user.level < def.unlockLevel) {
      return reply.code(400).send({ error: '等级不足' });
    }
    const coinCost = (def.priceCoins ?? 0) * quantity;
    const diaCost = (def.priceDiamonds ?? 0) * quantity;
    if (coinCost > 0 && user.coins < coinCost) {
      return reply.code(400).send({ error: '金币不足' });
    }
    if (diaCost > 0 && user.diamonds < diaCost) {
      return reply.code(400).send({ error: '钻石不足' });
    }
    if (coinCost > 0) {
      user.coins -= coinCost;
      await logTransaction(user._id as mongoose.Types.ObjectId, 'coins', -coinCost, 'shop_buy', {
        itemId,
        quantity,
      });
    }
    if (diaCost > 0) {
      user.diamonds -= diaCost;
      await logTransaction(
        user._id as mongoose.Types.ObjectId,
        'diamonds',
        -diaCost,
        'shop_buy',
        { itemId, quantity },
      );
    }

    if (def.category === 'prop' && def.id === 'prop_stamina_potion') {
      user.stamina = Math.min(MAX_STAMINA, user.stamina + 20 * quantity);
    } else if (def.category === 'seed' || def.category === 'fertilizer' || def.category === 'decoration') {
      addInv(user, def.id, quantity);
    }
    await user.save();
    return userToJson(user);
  });
}
