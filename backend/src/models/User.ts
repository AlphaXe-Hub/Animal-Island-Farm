import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const PlotState = ['locked', 'wasteland', 'tilled', 'growing', 'mature'] as const;

const FarmPlotSchema = new Schema(
  {
    index: { type: Number, required: true },
    state: { type: String, enum: PlotState, required: true },
    cropId: { type: String, default: null },
    plantedAt: { type: Date, default: null },
    matureAt: { type: Date, default: null },
    wateredTimes: { type: Number, default: 0 },
    yieldMul: { type: Number, default: 1 },
    fertilizerUsed: {
      type: String,
      enum: ['none', 'normal', 'advanced'],
      default: 'none',
    },
  },
  { _id: false },
);

const InventoryEntrySchema = new Schema(
  {
    itemId: { type: String, required: true },
    qty: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    username: { type: String, sparse: true, unique: true, trim: true },
    passwordHash: { type: String, default: null },
    isGuest: { type: Boolean, default: false },
    nickname: { type: String, required: true, trim: true },
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    diamonds: { type: Number, default: 0 },
    stamina: { type: Number, default: 30 },
    soundOn: { type: Boolean, default: true },
    farmPlots: { type: [FarmPlotSchema], default: [] },
    inventory: { type: [InventoryEntrySchema], default: [] },
    /** 任务进度 key -> count */
    taskProgress: { type: Schema.Types.Mixed, default: () => ({}) },
    /** 已领取奖励的任务 id */
    claimedTasks: { type: [String], default: [] },
    /** UTC 日期 YYYY-MM-DD，用于每日任务重置 */
    lastTaskResetDate: { type: String, default: '' },
    /** 本周已签到天 1-7 */
    signInClaimedDays: { type: [Number], default: [] },
    /** ISO 周 key，例如 2026-W20 */
    signInWeekKey: { type: String, default: '' },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel = mongoose.model('User', UserSchema);

export function createInitialPlots(): Array<{
  index: number;
  state: (typeof PlotState)[number];
  cropId: null;
  plantedAt: null;
  matureAt: null;
  wateredTimes: number;
  yieldMul: number;
  fertilizerUsed: 'none' | 'normal' | 'advanced';
}> {
  const plots = [];
  for (let i = 0; i < 20; i++) {
    const state = (i < 4 ? 'wasteland' : 'locked') as (typeof PlotState)[number];
    plots.push({
      index: i,
      state,
      cropId: null,
      plantedAt: null,
      matureAt: null,
      wateredTimes: 0,
      yieldMul: 1,
      fertilizerUsed: 'none' as const,
    });
  }
  return plots;
}
