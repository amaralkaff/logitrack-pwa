import mongoose, { Schema, model, models } from 'mongoose';

const ItemSchema = new Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    ean: { type: String },
    loc: { type: String, required: true },
    zone: { type: String },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reorderAt: { type: Number, default: 0 },
    unit: { type: String, default: 'EA' },
    updatedAt: { type: Number, default: () => Date.now() },
  },
  { versionKey: false },
);

ItemSchema.pre('save', function (next) { this.updatedAt = Date.now(); next(); });
ItemSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

export type ItemDoc = mongoose.InferSchemaType<typeof ItemSchema> & { _id: mongoose.Types.ObjectId };
export const Item = models.Item || model('Item', ItemSchema);

const TxSchema = new Schema(
  {
    localId: { type: String, required: true, unique: true, index: true },
    txId: { type: String, index: true },
    sku: { type: String, required: true, index: true },
    qty: { type: Number, required: true },
    dir: { type: String, enum: ['in', 'out'], required: true },
    source: { type: String, enum: ['ocr', 'manual'], required: true },
    operatorId: { type: String, required: true, index: true },
    location: String,
    condition: { type: String, enum: ['good', 'damaged', 'missing'], default: 'good' },
    batch: String,
    createdAt: { type: Number, required: true },
    syncedAt: { type: Number },
  },
  { versionKey: false },
);

export const Tx = models.Tx || model('Tx', TxSchema);
