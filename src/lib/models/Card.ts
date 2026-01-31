import mongoose from 'mongoose';

const CardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountId: { // <--- NEW FIELD: Links card to a specific bank account
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
  },
  type: {
    type: String,
    enum: ['virtual', 'physical'],
    default: 'virtual',
  },
  brand: {
    type: String, // VISA, MASTERCARD
    required: true,
  },
  cardNumber: {
    type: String,
    required: true,
  },
  expiry: {
    type: String,
    required: true,
  },
  monthlyLimit: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Frozen'], // <--- Used for the Lock logic
    default: 'Active',
  },
  color: {
    type: String,
    default: 'blue', // blue or orange
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Card || mongoose.model('Card', CardSchema);