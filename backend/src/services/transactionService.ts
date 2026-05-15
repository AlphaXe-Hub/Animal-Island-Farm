import { TransactionModel } from '../models/Transaction.js';
import type { Types } from 'mongoose';

export async function logTransaction(
  userId: Types.ObjectId,
  currency: 'coins' | 'diamonds',
  amount: number,
  reason: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  await TransactionModel.create({
    userId,
    currency,
    amount,
    reason,
    meta: meta ?? {},
  });
}
