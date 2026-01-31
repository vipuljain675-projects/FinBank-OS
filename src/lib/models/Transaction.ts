import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  cardId: {  // <--- NEW FIELD
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card',
    required: false, // Optional, because some transfers are direct bank-to-bank
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['completed', 'pending'],
    default: 'completed',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);