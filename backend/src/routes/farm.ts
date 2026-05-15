import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { UserModel } from '../models/User.js';
import { authPreHandler } from '../plugins/auth.js';
import {
  CROPS,
  TILL_COST_BASE,
  type CropId,
} from '../gameConfig.js';
import { findPlot, getCropGrowMs } from '../services/plotService.js';
import { addInv, getInvQty, removeInv } from '../services/inventoryService.js';
import { logTransaction } from '../services/transactionService.js';
import { grantExp, prepareUserForApi, userToJson } from '../services/userPayload.js';
import { bumpTask } from '../services/taskService.js';

function cropProductId(cropId: string): string {
  return `crop_${cropId}`;
}

export async function registerFarmRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/farm', { preHandler: authPreHandler }, async (req, reply) => {
    if (!req.userId) return reply.code(401).send({ error: '未登录' });
    const user = await UserModel.findById(req.userId);
    if (!user) return reply.code(404).send({ error: '用户不存在' });
    prepareUserForApi(user);
    await user.save();
    const j = userToJson(user);
    return {
      farmPlots: j.farmPlots,
      coins: j.coins,
      diamonds: j.diamonds,
      stamina: j.stamina,
    };
  });

  app.post<{ Params: { index: string } }>(
    '/api/farm/plots/:index/till',
    { preHandler: authPreHandler },
    async (req, reply) => {
      if (!req.userId) return reply.code(401).send({ error: '未登录' });
      const index = Number(req.params.index);
      if (Number.isNaN(index) || index < 0 || index > 19) {
        return reply.code(400).send({ error: '地块索引无效' });
      }
      const user = await UserModel.findById(req.userId);
      if (!user) return reply.code(404).send({ error: '用户不存在' });
      prepareUserForApi(user);
      const plot = findPlot(user, index);
      if (!plot || plot.state !== 'wasteland') {
        return reply.code(400).send({ error: '该地块无法开垦' });
      }
      if (user.coins < TILL_COST_BASE) {
        return reply.code(400).send({ error: '金币不足' });
      }
      user.coins -= TILL_COST_BASE;
      plot.state = 'tilled';
      await logTransaction(user._id as mongoose.Types.ObjectId, 'coins', -TILL_COST_BASE, 'till', {
        plotIndex: index,
      });
      await user.save();
      return userToJson(user);
    },
  );

  app.post<{ Params: { index: string } }>(
    '/api/farm/plots/:index/plant',
    { preHandler: authPreHandler },
    async (req, reply) => {
      if (!req.userId) return reply.code(401).send({ error: '未登录' });
      const index = Number(req.params.index);
      const body = req.body as { cropId?: string };
      const cropId = body.cropId as CropId | undefined;
      if (!cropId || !CROPS[cropId]) {
        return reply.code(400).send({ error: '作物无效' });
      }
      const crop = CROPS[cropId];
      const user = await UserModel.findById(req.userId);
      if (!user) return reply.code(404).send({ error: '用户不存在' });
      prepareUserForApi(user);
      if (user.level < crop.unlockLevel) {
        return reply.code(400).send({ error: '等级不足' });
      }
      const plot = findPlot(user, index);
      if (!plot || plot.state !== 'tilled') {
        return reply.code(400).send({ error: '只能播种在已开垦空地' });
      }
      if (getInvQty(user, crop.seedItemId) < 1) {
        return reply.code(400).send({ error: '种子不足' });
      }
      removeInv(user, crop.seedItemId, 1);
      const now = Date.now();
      const growMs = getCropGrowMs(cropId);
      plot.state = 'growing';
      plot.cropId = cropId;
      plot.plantedAt = new Date(now);
      plot.matureAt = new Date(now + growMs);
      plot.wateredTimes = 0;
      plot.yieldMul = 1;
      plot.fertilizerUsed = 'none';
      await user.save();
      return userToJson(user);
    },
  );

  app.post<{ Params: { index: string } }>(
    '/api/farm/plots/:index/water',
    { preHandler: authPreHandler },
    async (req, reply) => {
      if (!req.userId) return reply.code(401).send({ error: '未登录' });
      const index = Number(req.params.index);
      const user = await UserModel.findById(req.userId);
      if (!user) return reply.code(404).send({ error: '用户不存在' });
      prepareUserForApi(user);
      const plot = findPlot(user, index);
      if (!plot || plot.state !== 'growing' || !plot.matureAt) {
        return reply.code(400).send({ error: '只能给生长中的作物浇水' });
      }
      if (plot.wateredTimes >= 3) {
        return reply.code(400).send({ error: '本季已浇够水' });
      }
      if (user.stamina < 1) {
        return reply.code(400).send({ error: '体力不足' });
      }
      const matureAt = new Date(plot.matureAt).getTime();
      const rem = matureAt - Date.now();
      if (rem <= 0) {
        plot.state = 'mature';
        await user.save();
        return userToJson(user);
      }
      const newRem = Math.max(1000, Math.floor(rem * 0.9));
      plot.matureAt = new Date(Date.now() + newRem);
      plot.wateredTimes += 1;
      user.stamina -= 1;
      bumpTask(user, 'daily_water_3', 1);
      await user.save();
      return userToJson(user);
    },
  );

  app.post<{ Params: { index: string } }>(
    '/api/farm/plots/:index/fertilize',
    { preHandler: authPreHandler },
    async (req, reply) => {
      if (!req.userId) return reply.code(401).send({ error: '未登录' });
      const index = Number(req.params.index);
      const body = req.body as { itemId?: string };
      const itemId = body.itemId;
      if (itemId !== 'fertilizer_normal' && itemId !== 'fertilizer_advanced') {
        return reply.code(400).send({ error: '肥料类型无效' });
      }
      const user = await UserModel.findById(req.userId);
      if (!user) return reply.code(404).send({ error: '用户不存在' });
      prepareUserForApi(user);
      const plot = findPlot(user, index);
      if (!plot || plot.state !== 'growing' || !plot.matureAt) {
        return reply.code(400).send({ error: '只能给生长中的作物施肥' });
      }
      if (plot.fertilizerUsed !== 'none') {
        return reply.code(400).send({ error: '本季已施过肥' });
      }
      if (getInvQty(user, itemId) < 1) {
        return reply.code(400).send({ error: '肥料不足' });
      }
      removeInv(user, itemId, 1);
      const matureAt = new Date(plot.matureAt).getTime();
      const rem = matureAt - Date.now();
      if (rem <= 0) {
        plot.state = 'mature';
        await user.save();
        return userToJson(user);
      }
      const mul = itemId === 'fertilizer_normal' ? 0.7 : 0.5;
      const newRem = Math.max(1000, Math.floor(rem * mul));
      plot.matureAt = new Date(Date.now() + newRem);
      plot.fertilizerUsed = itemId === 'fertilizer_normal' ? 'normal' : 'advanced';
      if (itemId === 'fertilizer_advanced') {
        plot.yieldMul = 1.2;
      }
      await user.save();
      return userToJson(user);
    },
  );

  app.post<{ Params: { index: string } }>(
    '/api/farm/plots/:index/harvest',
    { preHandler: authPreHandler },
    async (req, reply) => {
      if (!req.userId) return reply.code(401).send({ error: '未登录' });
      const index = Number(req.params.index);
      const user = await UserModel.findById(req.userId);
      if (!user) return reply.code(404).send({ error: '用户不存在' });
      prepareUserForApi(user);
      const plot = findPlot(user, index);
      if (!plot || plot.state !== 'mature' || !plot.cropId) {
        return reply.code(400).send({ error: '没有可收获的作物' });
      }
      if (user.stamina < 1) {
        return reply.code(400).send({ error: '体力不足' });
      }
      const crop = CROPS[plot.cropId as CropId];
      if (!crop) {
        return reply.code(400).send({ error: '作物数据异常' });
      }
      const qty = Math.max(1, Math.round(plot.yieldMul));
      addInv(user, cropProductId(plot.cropId), qty);
      grantExp(user, crop.expOnHarvest);
      user.stamina -= 1;
      plot.state = 'tilled';
      plot.cropId = null;
      plot.plantedAt = null;
      plot.matureAt = null;
      plot.wateredTimes = 0;
      plot.yieldMul = 1;
      plot.fertilizerUsed = 'none';
      bumpTask(user, 'daily_harvest_5', 1);
      await user.save();
      return userToJson(user);
    },
  );
}

export { cropProductId };
