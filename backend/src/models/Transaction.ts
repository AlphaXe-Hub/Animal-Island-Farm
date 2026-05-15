import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const TransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    currency: { type: String, enum: ['coins', 'diamonds'], required: true },
    /** 正为收入，负为支出 */
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type TransactionDoc = InferSchemaType<typeof TransactionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TransactionModel = mongoose.model('Transaction', TransactionSchema);
