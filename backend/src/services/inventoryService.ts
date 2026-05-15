import type { HydratedDocument } from 'mongoose';
import type { UserDoc } from '../models/User.js';

export function getInvQty(user: HydratedDocument<UserDoc>, itemId: string): number {
  const e = user.inventory.find((x) => x.itemId === itemId);
  return e?.qty ?? 0;
}

export function addInv(user: HydratedDocument<UserDoc>, itemId: string, qty: number): void {
  if (qty <= 0) return;
  const e = user.inventory.find((x) => x.itemId === itemId);
  if (e) e.qty += qty;
  else user.inventory.push({ itemId, qty });
}

export function removeInv(user: HydratedDocument<UserDoc>, itemId: string, qty: number): boolean {
  const e = user.inventory.find((x) => x.itemId === itemId);
  if (!e || e.qty < qty) return false;
  e.qty -= qty;
  if (e.qty === 0) {
    const next = user.inventory.filter((x) => x.itemId !== itemId);
    user.set('inventory', next);
  }
  return true;
}
